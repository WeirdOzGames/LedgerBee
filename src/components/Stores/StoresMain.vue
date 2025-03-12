<script setup>
import { ref, watch, nextTick, onMounted} from 'vue';
import { useAppStore } from '../../stores/appStore';

import { refresh_stores, set_store_visibility, set_item_visibility, update_store, update_item } from '@/api/rest_client';

import Listbox from 'primevue/listbox';
import {Button, Dialog, InputText,IftaLabel} from 'primevue';

const store_edit_dialog_visible = ref(false);
const item_edit_dialog_visible = ref(false);

const store_editor_id = ref(0);
const store_editor_name = ref("");
const item_editor_id = ref(0);
const item_editor_name = ref("");
const item_editor_tax = ref(0);

const appStore = useAppStore();

const awaitingResponse = ref(false);

const current_store = ref(null);
const current_item = ref(null);

const items = ref([]);

const stores = ref([]);

watch(()=>appStore.currentPage, async (newVal, oldVal) => {
  if(oldVal!=newVal && newVal==1){//1 is the tab index of this component.
    await refreshStores();
  }

});

onMounted(async ()=>{
    if(Number(appStore.currentPage)===1)await refreshStores();
});

const refreshStores = async () => {
    awaitingResponse.value = true;
    const res = await refresh_stores();
    awaitingResponse.value = false;

    if(res.type === "success"){
        stores.value = res.stores;
        stores.value.forEach(store=>{
            store.items = res.items.filter(item=>item.store_id===store.store_id);
        });

        if(current_store.value==null && stores.value.length>0)current_store.value = stores.value[0].store_id;
        if(current_store.value!=null){
            const store = stores.value.find(s=>s.store_id === current_store.value);
            if(store!=null){
                items.value = [...store.items];
            }
        }
        else{
            items.value=[];
        }
    }
    else{
        stores.value=[];
        items.value=[];
    }

    if(stores.value.length>0)current_store.value=stores.value[0].store_id;

}


const store_picked = () => {
    if(current_store.value==null)return;
    const store = stores.value.find(s=>s.store_id === current_store.value);
    if(store!=null){
        items.value = [...store.items];
    }
}

const handle_store_visibility = async (store)=>{
    awaitingResponse.value = true;
    const res = await set_store_visibility(!store.is_visible, store.store_id);
    awaitingResponse.value = false;
    if(res.type==="success") store.is_visible=!store.is_visible;

    
}

const handle_item_visibility = async (item)=>{
    awaitingResponse.value = true;
    const res = await set_item_visibility(!item.is_visible, item.item_id);
    awaitingResponse.value = false;
    if(res.type==="success") item.is_visible=!item.is_visible;

    
}

const show_store_editor = (store) =>{
    store_edit_dialog_visible.value=true;
    store_editor_name.value = store.name;
    store_editor_id.value = store.store_id;
}
const show_item_editor = (item) =>{

    item_edit_dialog_visible.value=true;
    item_editor_name.value = item.name;
    item_editor_tax.value = item.default_tax;
    item_editor_id.value = item.item_id;

}

const update_store_clicked = async () =>{
    awaitingResponse.value = true;
    const res = await update_store(store_editor_id.value, store_editor_name.value);
    awaitingResponse.value = false;

    if(res.type === "success"){
        const store = stores.value.find(s=>s.store_id === store_editor_id.value);
        if(store!=null){
            store.name = store_editor_name.value;
        }
    }

    store_edit_dialog_visible.value=false;

}
const update_item_clicked = async () =>{
    awaitingResponse.value = true;
    const res = await update_item(item_editor_id.value, item_editor_name.value, item_editor_tax.value);
    awaitingResponse.value = false;

    if(res.type === "success"){
        const item = items.value.find(s=>s.item_id === item_editor_id.value);
        if(item!=null){
            item.name = item_editor_name.value;
            item.default_tax = item_editor_tax.value;
        }
    }

    item_edit_dialog_visible.value=false;
}

watch(current_store, (newValue, oldValue) => {//a workaround to deactivate the unselect functionality of ListBox until an official functionality
    if (!newValue) {
        nextTick(() => {
            current_store.value = oldValue;
        });
    }
});

</script>

<template>
    <div class="flex flex-row justify-around">
        <div class="flex flex-col w-full md:w-[46%] h-[70vh] items-center">
            <div class="flex w-[60%] h-[2.5rem] bg-zinc-700 justify-center items-center rounded-t-lg">
                <span class="font-bold text-xl text-zinc-100">Stores</span>
            </div>
            <Listbox v-model="current_store" :options="stores" optionLabel="name" optionValue="store_id" scrollHeight="60vh" class="w-full flex-grow p-0"  @change="store_picked">
                <template #option="slotProps">
                    <div class="flex flex-row w-full items-center">
                        <div>{{ slotProps.option.name }}</div>
                        <Button variant="text" icon="pi pi-file-edit" class="ml-auto" @click.stop="show_store_editor(slotProps.option)"/>
                        <Button v-if="slotProps.option.is_visible" variant="text" icon="pi pi-eye" @click.stop="handle_store_visibility(slotProps.option)"/>
                        <Button v-if="!slotProps.option.is_visible" variant="text" icon="pi pi-eye-slash" @click.stop="handle_store_visibility(slotProps.option)"/>
                    </div>
                </template>
            </Listbox>
        </div>

        <div class="flex flex-col w-full md:w-[46%] h-[70vh] items-center">
            <div class="flex w-[60%] h-[2.5rem] bg-zinc-700 justify-center items-center rounded-t-lg">
                <span class="font-bold text-xl text-zinc-100">items</span>
            </div>
            <Listbox v-model="current_item" :options="items" optionLabel="name" optionValue="item_id" scrollHeight="60vh" class="w-full flex-grow p-0"  @change="store_picked">
                <template #option="slotProps">
                    <div class="flex flex-row w-full items-center">
                        <div>{{ slotProps.option.name }}</div>
                        <Button variant="text" icon="pi pi-file-edit" class="ml-auto" @click.stop="show_item_editor(slotProps.option)"/>
                        <Button v-if="slotProps.option.is_visible" variant="text" icon="pi pi-eye" @click.stop="handle_item_visibility(slotProps.option)"/>
                        <Button v-if="!slotProps.option.is_visible" variant="text" icon="pi pi-eye-slash" @click.stop="handle_item_visibility(slotProps.option)"/>
                    </div>
                </template>
            </Listbox>
        </div>
    </div>
    <Dialog v-model:visible="store_edit_dialog_visible" header="Edit Store" modal :draggable="false" class="w-[80%] md:w-[40%]">
        <div class="flex flex-col gap-4">
            <IftaLabel>
                <InputText id="name" v-model="store_editor_name" maxlength="64" fluid/>
                <label for="name">Store Name</label>
            </IftaLabel>
            <Button label="Save" fluid @click="update_store_clicked"></Button> 
        </div>
    </Dialog>

    <Dialog v-model:visible="item_edit_dialog_visible" header="Edit Item" modal :draggable="false" class="w-[80%] md:w-[40%]">
        <div class="flex flex-col gap-4">
            <IftaLabel>
                <InputText id="name" v-model="item_editor_name" maxlength="64" fluid/>
                <label for="name">Item Name</label>
            </IftaLabel>
            <IftaLabel>
                <InputText id="tax" v-model="item_editor_tax" maxlength="64" fluid/>
                <label for="tax">Default Tax</label>
            </IftaLabel>
            <Button label="Save" fluid @click="update_item_clicked"></Button> 
        </div>
    </Dialog>
</template>

<style scoped>

</style>