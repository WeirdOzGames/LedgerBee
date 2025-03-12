<script setup>
import {computed, ref, reactive, watch, onMounted} from 'vue';
import { useAppStore } from '../../stores/appStore';
import { IftaLabel, Dialog, Card, Button, DatePicker,InputText, InputNumber } from 'primevue';
import AppStorePicker from './AppStorePicker.vue';
import { getReceipts, addIncomeSource, setIncomeSourceVisibility, update_income } from '@/api/rest_client';
//table related
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import AppReceiptEditor from './AppReceiptEditor.vue';

const awaitingResponse = ref(false);

const addIncomeSourceVisible = ref(false);

const appStore = useAppStore();

const showStoreSelect = ref(false);
const showIncomeSettings = ref(false);


const receipts = ref([]);

const income_sources = ref([]);

const incomes = ref([]);

const stores = ref([]);

const newSourceName = ref("");

const visible_income_sources = ref([]);

const currentReceipt = ref({receipt_id:-1, items:"", store_id:-1, store_name:""});//used as props for receipt editor
const showFlagReceiptEditor = ref(false);

watch([income_sources, incomes], () => {
  visible_income_sources.value = income_sources.value
    .map(i_s => {
      const i = incomes.value.find(income => income.income_source_id === i_s.income_source_id);
      return {
        income_source_id: i_s.income_source_id,
        income_source_name: i_s.income_source_name,
        total: i ? i.total : 0,
        income_id: i ? i.income_id : -1,
        is_visible: i_s.is_visible
      };
    })
    .filter(i => i.is_visible || i.total > 0);
}, { deep: true, immediate: true });

const displayed_receipts = ref([]);



const calculatedTax = computed(()=>displayed_receipts.value.reduce((sum,item)=>{ if(item.tax) return sum+Number(item.tax); else return sum;},0));

const calculatedTotalExpense = computed(()=>displayed_receipts.value.reduce((sum,item)=>{if(item.total) return sum+Number(item.total); else return sum;},0));

const calculatedTotalIncome = computed(()=>  visible_income_sources.value.reduce((sum, item) => sum + Number(item.total || 0), 0));



const isToday = computed(() => {
  const nowString = getDateString(new Date());
  const storedString = getDateString(new Date(appStore.currentDate));
  return storedString >= nowString;
});

const currentDateProxy = computed({
  get: () =>{
    const date = new Date(appStore.currentDate);
    if(isNaN(date.getTime())){return new Date();}
    else return date;
  }, // Use the store getter
  set: (value) => appStore.currentDate = getDateString(value), // Use the store action
});


const newSourceSubmitClicked = async () => {
  
  awaitingResponse.value=true;
  let res = await addIncomeSource(newSourceName.value);
  awaitingResponse.value=false;
  newSourceName.value="";
  if(res.type==="success"){
    const income_source_name = res.income_source_name;
    const income_source_id = res.income_source_id;
    income_sources.value.push({income_source_name, income_source_id, val:0});
    addIncomeSourceVisible.value=false;
  }
};

async function changeDay(val) {
  currentDateProxy.value = new Date(
    currentDateProxy.value.setDate(currentDateProxy.value.getDate() + val)
  );
  
  await refreshReceipts();
}

onMounted(() => {
  if(Number(appStore.currentPage)===0)refreshReceipts();
});

const incomeSourceVisibilityClicked = async(income_source_id, is_visible) => {
  awaitingResponse.value=true;
  const res = await setIncomeSourceVisibility(income_source_id, is_visible);
  awaitingResponse.value=false;

  if(res.type==="success"){
    const match = income_sources.value.find(i => i.income_source_id == income_source_id);
    if(match)match.is_visible = is_visible;
  }
}
const receiptSaved = (receipt) => {

  showStoreSelect.value=false;
  showFlagReceiptEditor.value=false;
  const existing_receipt = receipts.value.find((r)=>Number(r.receipt_id) === receipt.receipt_id)
  if(existing_receipt)existing_receipt.items = receipt.items;
  else receipts.value.push(receipt);
}

const refreshReceipts = async () => {
  awaitingResponse.value=true;
  const res = await getReceipts(appStore.currentDate);
  awaitingResponse.value=false;

  if(res.type==="success"){
  receipts.value = res.receipts;
  console.log("receipts: "+JSON.stringify(receipts.value));
  income_sources.value = res.income_sources;
  incomes.value = res.incomes;
  stores.value = res.stores;
  }
  else{
    receipts.value = [];
    income_sources.value = [];
    incomes.value = [];
    stores.value = [];
  }

}
watch(receipts, () => {
  const emptyRowsNeeded = Math.max(0, 7 - receipts.value.length);

  displayed_receipts.value = receipts.value.map((r)=>{

    const dr = {};//displayed receipt
    const store = stores.value.find(s => s.store_id == r.store_id);

    if(store){dr.store_name = store.name;} 
    else dr.store_name="";
    if(r.items){
      const items = JSON.parse(r.items);
      const temp = items.reduce((sum,item)=> {
        const p_total = item.price*item.quantity;
        const p_base = p_total / (1+(item.default_tax/100));
        const tax = p_total-p_base;
        return {tax:sum.tax + tax, total:sum.total+p_total};
      },{total:0, tax:0});

      dr.total=temp.total;
      dr.tax = temp.tax;
    }
    dr.tax = parseFloat(dr.tax);
    dr.total = parseFloat(dr.total);
    dr.tax_text = dr.tax.toFixed(2)+" TRY";
    dr.total_text = dr.total.toFixed(2)+" TRY";

    dr.store_id = r.store_id;
    dr.items = r.items;
    dr.receipt_id = r.receipt_id;
    return dr;
  });
  
  for(let i = 0; i < emptyRowsNeeded; i++){
    displayed_receipts.value.push({});
  }
}, { deep: true, immediate: true });


const incomeChanged = async (event, income) => {
  let newVal = 0;
  if(event.value != null)newVal = event.value;

  if(newVal == income.total)return;
  
  awaitingResponse.value=true;
  const res = await update_income(income.income_id, income.income_source_id, appStore.currentDate, newVal);
  awaitingResponse.value=false;
  if(res.type==="success"){
    if(res.income_id!=null)income.income_id = res.income_id;
    income.total = parseFloat((newVal || "0").replace(/[^0-9.-]/g, ""));
  }
  else income.total = income.total;//to refresh the value shown in the InputNumber
};

watch(()=>appStore.currentPage, async (newVal, oldVal) => {
  if(oldVal!=newVal && newVal==0){//0 is the tab index of this component.
    await refreshReceipts();
  }

});


function getDateString(date){//receives Date object
  return date.toLocaleString("en-CA").split(',')[0];
}

const receiptClicked = (event) => {
  if(!event.data.receipt_id || event.data.receipt_id < 0)return;
  currentReceipt.value = {...event.data}
  console.log(event.data.items);
  showFlagReceiptEditor.value=true;
};

</script>

<template>
    <div class="flex justify-center items-center gap-2 mt-4">
        <Button label="Previous Day" @click="changeDay(-1)" :disabled="awaitingResponse"/><DatePicker v-model="currentDateProxy" :maxDate="new Date()" dateFormat="dd/mm/yy" showIcon fluid iconDisplay="input"/><Button label="Next Day" :disabled="isToday || awaitingResponse" @click="changeDay(1)" />
    </div>

    <div class="flex gap-8 mt-8">
        <div class="w-8/12">
            <Button label="Add a Receipt" @click="showStoreSelect=true" :disabled="awaitingResponse" />
            <DataTable class="mt-4 bg-amber-200" :value="displayed_receipts" tableStyle="min-width: 20rem " :removableSort="true" scrollable scrollHeight="25rem" @row-click="receiptClicked">
                <Column  field="store_name" header="Store Name" sortable style="width: 25%"></Column>
                <Column field="tax_text" header="Tax" sortable style="width: 15%;" bodyStyle="text-align: right;" headerClass="justify-items-end"></Column>
                <Column field="total_text" header="Total" sortable style="width: 25%;" bodyStyle="text-align: right;" headerClass="justify-items-end"></Column>
            </DataTable>
            <div class="flex items-center justify-end mt-2 gap-8">
                    <p class="text-xl font-bold"> Tax: {{ calculatedTax.toFixed(2) }} TRY</p>
                    <p class="text-xl font-bold">Total: {{ calculatedTotalExpense.toFixed(2) }} TRY </p>
                    
            </div>
        </div>
        <Card class="w-3/12 border-2 border-[#dfb256]">
          <template #title>
          <div class="flex items-center relative">
            <p>Income:</p>
            <Button variant="text" label="+Add Income Source" size="small"  :disabled="awaitingResponse" @click="addIncomeSourceVisible=true; newSourceName='';"/>            
            <Button variant="text" class="!ml-auto" icon="pi pi-eye" size="large" severity="secondary" @click="showIncomeSettings=true"/>
          </div>
          <div class="flex flex-col gap-2 mt-4">
            <div v-for="i in visible_income_sources" :key="i.income_source_id">
              <IftaLabel>
                <InputNumber id="name" :modelValue="i.total" mode="currency" currency="TRY" fluid @blur="incomeChanged($event, i)"/>
                <label for="name">{{i.income_source_name}} </label>
              </IftaLabel>    
            </div>
            
            <div class="flex flex-row w-full text-red-500">
              <p class="text-xl font-bold">Tax:</p><p class="ml-auto text-xl font-bold">{{ calculatedTax.toFixed(2) }} TRY</p>            
            </div>
            <div class="flex flex-row w-full text-red-500">
              <p class="text-xl font-bold">Total Expense:</p><p class="ml-auto text-xl font-bold"> -{{ calculatedTotalExpense.toFixed(2) }} TRY </p>            
            </div>
            <div class="flex flex-row w-full text-green-500">
              <p class="text-xl font-bold">Total Income:</p><p class="ml-auto text-xl font-bold"> +{{ calculatedTotalIncome.toFixed(2) }} TRY </p>            
            </div>
            <div class="flex flex-row w-full">
              <p class="text-xl font-bold">Profit:</p><p class="ml-auto text-xl font-bold"> {{ (calculatedTotalIncome-calculatedTotalExpense).toFixed(2) }} TRY </p>            
            </div>
          </div>
        </template> 

        </Card>
        <AppStorePicker v-model:is-visible = "showStoreSelect" @receipt-saved="receiptSaved"/>
        <Dialog header="Add an income source" v-model:visible="addIncomeSourceVisible" class="flex flex-col w-[30vw]" modal :draggable="false">
          <div class="flex flex-col gap-4">
            <IftaLabel>
              <InputText id="name" v-model="newSourceName" maxlength="64" fluid/>
              <label for="name">Income source name</label>
            </IftaLabel>   
            <Button label="Submit" @click="newSourceSubmitClicked" :disabled="awaitingResponse || !newSourceName" fluid/>
          </div>
        </Dialog>
    </div>
    <Dialog v-model:visible="showIncomeSettings" header="Income Sources" modal :draggable="false">
      <div class="flex flex-col gap-4 ">
        <div v-for="i_s in income_sources" class="flex flex-row w-full items-center">
          <p>{{ i_s.income_source_name }}</p>
          <Button v-if="i_s.is_visible" variant="text" icon="pi pi-eye" class="ml-auto" @click="incomeSourceVisibilityClicked(i_s.income_source_id,false)"/>
          <Button v-if="!i_s.is_visible" variant="text" icon="pi pi-eye-slash" class="ml-auto" @click="incomeSourceVisibilityClicked(i_s.income_source_id,true)"/>
        </div>
      </div>
    </Dialog>
    <AppReceiptEditor v-model:isVisible="showFlagReceiptEditor" :items="currentReceipt.items" :receipt-id="currentReceipt.receipt_id" :storeName="currentReceipt.store_name" :storeId="currentReceipt.store_id" @receipt-saved="receiptSaved"/>
</template>


<style scoped>
::v-deep(.p-datatable-thead th) {

  background-color: #E8AA2C;
  color:white;
}
::v-deep(.p-datatable-tbody tr:nth-child(even)){
  color:white !important;
  background-color: #dfb256 !important;
  height: 3rem; /* Adjust as needed */
}
::v-deep(.p-datatable-tbody tr:nth-child(odd)){
  color:white !important;
  background-color: #ad8c4b !important;
  height: 3rem; /* Adjust as needed */

}

::v-deep(.p-datatable-tbody tr:hover){
  color:white !important;
  background-color: #444 !important;  
}
::v-deep(.p-datatable-tbody tr:active){
  color:white !important;
  background-color: #333 !important;
}
</style>