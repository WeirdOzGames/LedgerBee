<script setup>
import { defineModel, watch, ref } from "vue";
import {getStores, addStore} from "../../api/rest_client";
import AppReceiptEditor from "./AppReceiptEditor.vue";

import Dialog from 'primevue/dialog';
import Button from 'primevue/button'
import InputText from 'primevue/inputtext';
import { IftaLabel } from "primevue";

const isVisible = defineModel('isVisible');
const emit = defineEmits(['receipt-saved']);

const list = ref([]);

const awaitingResponse = ref(false);

const addStoreIsVisible = ref(false);
const newStoreName = ref("");
const storeNameLength = ref(64);

const pickedStoreName = ref("");
const pickedStoreId = ref(0);
const editReceiptIsVisible = ref(false);





watch(isVisible, async (newVal)=> {
    if(newVal){
        list.value = [];
        const res = await getStores();
        if(res.type==="success"){
            list.value = res.stores.filter(s=>s.is_visible);
        }
    }
});

const createNewStoreName = async () => {
    if(!newStoreName.value)return;
    
    if(newStoreName.value.length>storeNameLength.value)return;

    awaitingResponse.value=true;
    const res = await addStore(newStoreName.value);
    awaitingResponse.value=false;

    if(res.type==="error"){

    }
    else if(res.type==="success"){
        list.value.push(res.store);
        addStoreIsVisible.value = false;
    }
};
const receiptSaved = (receipt) => {
    editReceiptIsVisible.value=false;
    emit("receipt-saved",receipt);
}

</script>

<template>
    <Dialog v-model:visible="isVisible" :draggable="false" modal class="flex flex-col min-w-[75vh] max-w-[100vh] min-h-[50vh]" header="Select a store" :close-on-escape="!addStoreIsVisible && !editReceiptIsVisible">
        <template #header>
            <div class="flex flex-row items-center gap-4">
                <h1 class="text-xl font-bold">Select a store</h1>
                <Button variant="text" label="+Add Store" size="small"  :disabled="awaitingResponse" @click="newStoreName=''; addStoreIsVisible=true"/>
            </div>
        </template>
        <div class="flex flex-col gap-2">
            <div class="flex flex-wrap gap-2 p-4 !bg-amber-100 rounded-md mt-2" >
                <p v-if="list.length===0">There are no stores. Please add a store using the 'Add Store' button above.</p>
                <Button v-for="i in list" :key="i.store_id" :label="i.name" class="min-w-16" :disabled="awaitingResponse" @click='pickedStoreName=i.name; pickedStoreId=i.store_id; editReceiptIsVisible=true'/>
            </div>

        </div>
    </Dialog>
    <Dialog v-model:visible="addStoreIsVisible" :draggable="false" class="min-w-[70vh]" modal header="Add New Store">
        <div>
            <IftaLabel>
                <InputText id="storeName" type="text"  :maxlength="storeNameLength" v-model="newStoreName" class="w-full" :disabled="awaitingResponse" />
                <label for="storeName">Store name</label>
            </IftaLabel>
            <Button class="w-full mt-4" label="Create" :disabled="!newStoreName || awaitingResponse" @click="createNewStoreName"/>
        </div>
    </Dialog>
    <AppReceiptEditor v-model:isVisible="editReceiptIsVisible" :receipt-id="-1" :storeName="pickedStoreName" :storeId="pickedStoreId" @receipt-saved="receiptSaved"/>
</template> 

<script scoped>
    
</script>