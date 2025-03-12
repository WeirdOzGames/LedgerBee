<script setup>
import { useTemplateRef, defineModel, watch, ref, computed } from "vue";
import Dialog from 'primevue/dialog';
import { Button, IftaLabel, InputText, InputNumber } from "primevue";
import Fieldset from 'primevue/fieldset';
import { addItem, getStoreData, saveReceipt } from "@/api/rest_client";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useAppStore } from '../../stores/appStore';
const appStore = useAppStore();


const props = defineProps(['storeName', "storeId", "receiptId", "items"]);

const isVisible = defineModel('isVisible');
const emit = defineEmits(["receipt-saved"]);

const taxRef = useTemplateRef('taxref')

const list = ref([]);
const receiptItems = ref([]);


const tax_edit_current_row = ref(-1);

watch(isVisible, async (newVal)=> {

    if(newVal){
        list.value = [];
        
        if(props.items)receiptItems.value = JSON.parse(props.items);
        else receiptItems.value = [];

        const res = await getStoreData(props.storeId);
        if(res.type==="success"){
            console.log("res:"+JSON.stringify(res));
            list.value = res.items.filter(i=>i.is_visible);

            receiptItems.value.forEach(r => {
                console.log("r:"+JSON.stringify(r));
                const item = list.value.find((l)=> l.item_id === r.item_id);
                console.log("item:"+JSON.stringify(item));

                if(item)r.name = item.name;
            });
        }

    }
});

const addItemIsVisible = ref(false);
const awaitingResponse = ref(false);
const newItemName = ref("");
const itemNameLength = ref(64);
const newItemTax = ref(0);

const calculatedTotal = computed(()=>receiptItems.value.reduce((sum,item)=>sum+(item.price*item.quantity),0.0));

const calculatedTax = computed(()=>receiptItems.value.reduce((sum,item)=>{
    if(item.total==0)return 0;
    const p_total = item.price*item.quantity;
    const tax_rate = item.default_tax/100;
    const p_base = p_total/(1+tax_rate);
    const tax = p_total - p_base;
    return tax + sum;
},0.0));

//This had to be done using setTimeout and ref because the way PrimeVue updates the inner value through v-model doesn't work properly.
//To be more precise, it works only once. If you type 123, it sets the value to 100. But if you keep typing, for example 4,
//the value is set to 1004 instead of reseting it to 100. Even tho newItemTax's value is set properly, the value shown to the user doesn't get updated.
const handleInput= () => {
    if(newItemTax.value>100){newItemTax.value=100;
}
    else if(newItemTax.value<0) newItemTax.value=0;
    
    setTimeout(() => {
        taxRef.value.$el.value=newItemTax.value;
    }, 1);
    taxRef.value.$el.value=newItemTax.value;
}




const createNewItem = async () => {
    awaitingResponse.value=true;

    const res = await addItem(props.storeId, newItemName.value,newItemTax.value);
    awaitingResponse.value=false;
    addItemIsVisible.value=false;

    console.log(JSON.stringify(res));
    newItemName.value="";
    newItemTax.value=0;
    if(res.type === "success"){
        let item = {item_id:res.item_id, name:res.name, default_tax:res.tax, last_price:0}
        list.value.push(item);

    }

    
}


const itemClicked = (item_id) => {
    const item = list.value.find(i => i.item_id == item_id);
    if(!item)return;
    const r_item = {item_id:item.item_id, name: item.name, default_tax:item.default_tax, price: item.last_price, quantity:1};
    if(r_item.price==0)r_item.price=null;
    receiptItems.value.push(r_item);
    
}

const deleteItem = (index) => {
    receiptItems.value.splice(index,1)
}


const saveClicked = async () =>{

    const items_str = JSON.stringify(receiptItems.value, (key, value) => {
        if (key === 'name') {
            return undefined;
        }
        return value;
    });    
    console.log("items_str = "+items_str);
    const res = await saveReceipt(props.receiptId, props.storeId, items_str, appStore.currentDate);

    if(res.type==="addSuccess" || res.type === "updateSuccess"){
        emit('receipt-saved',{store_id:res.store_id, receipt_id:res.receipt_id, items:res.items});
    }
}

</script>

<template>
    
    <Dialog v-model:visible="isVisible" :draggable="false" :closeOnEscape="false" modal class="flex flex-col w-[75vw] h-[95vh]" :header="storeName" >
        <template #header>
            <div class="flex flex-row items-center">
                <h1 class="text-xl font-bold">Receipt({{ storeName }})</h1>
                <Button variant="text" label="+Add Item" size="small"  :disabled="awaitingResponse" @click="addItemIsVisible=true"/>
            </div>
        </template>
        
            <div class="flex flex-col !bg-amber-200 p-4 h-full shadow-lg">
                <Fieldset legend="Items">
                    <div class="flex flex-wrap gap-2 p-4 !bg-stone-100 rounded-md" >
                        <p v-if="list.length===0">There are no items. Please add an item using the 'Add Item' button above.</p>
                        <Button v-for="i in list" :key="i.item_id" :label="i.name" class="min-w-16 !p-0.5" :disabled="awaitingResponse" @click="itemClicked(i.item_id)" />
                    </div>
                </Fieldset>
                <DataTable class="flex-1 overflow-y-auto " :value="receiptItems" tableStyle="min-width: 5rem " :removableSort="true" scrollable scroll-height="100%">
                    <Column field="name" header="Item Name" sortable style="width: 25%; min-width:10rem">
                        <template #body="slotProps">
                            <div class="flex flex-row items-center gap-2">
                                <Button icon="pi pi-trash" variant="text" class="p-button-danger mr-2" label="" @click="deleteItem(slotProps.index)"/> 
                                {{ slotProps.data.name }}
                            </div>
                        </template>
                    </Column>
                    <Column field="tax" header="Tax" sortable style="min-width: 8rem">
                        <template #body="slotProps">
                            <div v-if="tax_edit_current_row===slotProps.index" class="flex flex-row"><InputNumber fluid  v-model="slotProps.data.default_tax"  suffix="%" inputId="minmaxfraction" :minFractionDigits="0" :maxFractionDigits="2"/><Button variant="text" icon="pi pi-check" @click="tax_edit_current_row=-1" /></div>
                            <div v-else class="flex flex-row items-center">{{ slotProps.data.default_tax }}%<Button icon="pi pi-pen-to-square" variant="text" @click="tax_edit_current_row=slotProps.index" /> </div>
                        </template>
                    </Column>
                    <Column field="price" header="Price" sortable style="width: 25%">
                        <template #body="slotProps">
                            <InputNumber mode="currency" currency="TRY" v-model="slotProps.data.price" />
                        </template>
                    </Column>
                    <Column field="quantity" header="Quantity" sortable style="min-width: 8rem">
                        <template #body="slotProps">
                            <InputNumber  fluid v-model="slotProps.data.quantity" inputId="minmaxfraction" :minFractionDigits="0" :maxFractionDigits="8"></InputNumber>
                        </template></Column>
                    <Column field="total" header="Total" sortable style="width: 15%">
                        <template #body="slotProps">
                            <InputNumber :model-value="slotProps.data.price*slotProps.data.quantity || 0" mode="currency" currency="TRY" :disabled="true" />
                        </template>
                    </Column>
                </DataTable>
            </div>
            <template #footer>
                <div class="flex items-center gap-8">
                    <p class="text-xl font-bold"> Tax: {{ calculatedTax.toFixed(2) }} TRY</p>
                    <p class="text-xl font-bold">Total: {{ calculatedTotal.toFixed(2) }} TRY </p>
                    <Button label="Save" @click="saveClicked"></Button> 
                </div>
                
            </template>
                
    </Dialog>



    <Dialog v-model:visible="addItemIsVisible" :draggable="false" class="min-w-[70vh]" modal header="Add New Item">
        <div class="flex flex-col gap-2">
            <IftaLabel>
                <InputText id="itemName" type="text" :maxlength="itemNameLength" v-model="newItemName" class="w-full" :disabled="awaitingResponse" />
                <label for="itemName">Item name</label>
            </IftaLabel>
            <IftaLabel>
                <InputText ref="taxref" id="itemTax"  v-model="newItemTax" type="number" :min="0" :max="100" @input="handleInput" class="w-full" :disabled="awaitingResponse" />
                <label for="itemTax">Tax</label>
            </IftaLabel>
            <Button class="w-full mt-4" label="Create" :disabled="!newItemName || awaitingResponse" @click="createNewItem"/>
        </div>
    </Dialog>

</template>

<style scoped>

</style>