<script setup>
import { ref } from 'vue';
import { DatePicker, Button, DataTable, Column, Dialog } from 'primevue';
import Chart from 'primevue/chart';
import {get_stats} from "../../api/rest_client.js"

const dates = ref([new Date(), new Date()]); // Ensure it has a default value

const awaitingResponse = ref(false);

const pie_background_color = ref([
    "#F5E873", "#F5C76E", "#727FF5", "#8084A0", 
    "#A09D80", "#A36C6A", "#32344B", "#4B4832"
]);

const pie_hover_background_color = ref([
    "#FFFF8C", "#FFE088", "#8C98FF", "#9A9EBA",
    "#BAB69A", "#BC8684", "#4C4E65", "#65624C"
]);

const stores_sorted_list = ref([]);
const items_sorted_list = ref([]);
const income_sources_sorted_list = ref([]);

const stores_sorted_short_list = ref([]);
const items_sorted_short_list = ref([]);
const income_sources_sorted_short_list = ref([]);

const item_detailed_list = ref([]);

const stores_dialog_visibility_flag = ref(false);
const items_dialog_visibility_flag = ref(false);
const incomes_dialog_visibility_flag = ref(false);
const item_history_dialog_visibility_flag = ref(false);

const current_item_name = ref("");
const current_store_name = ref("");

const stores_sorted_pie_data = ref({
labels: ['Default', "Default"],
datasets: [
    {
    data: [1,1],
    backgroundColor: pie_background_color.value,
    hoverBackgroundColor: pie_hover_background_color.value
    }]

});
const items_sorted_pie_data = ref({
labels: ['Default', "Default"],
datasets: [
    {
    data: [1,1],
    backgroundColor: pie_background_color.value,
    hoverBackgroundColor: pie_hover_background_color.value
    }]

});
const income_sources_sorted_pie_data = ref({
labels: ['Default', "Default"],
datasets: [
    {
    data: [1,1],
    backgroundColor: pie_background_color.value,
    hoverBackgroundColor: pie_hover_background_color.value
    }]

});

  const receipts = ref([]);
  const stores = ref([]);
  const items = ref([]);
  const incomes = ref([]);
  const income_sources = ref([]);

  const total_expense = ref(0);
  const total_income = ref(0);
  const total_tax = ref(0);

const todayClicked = () => {
    dates.value = [new Date(),new Date()];
    fetchData();
}
const yesterdayClicked = () => {
    let d = new Date();
    d.setDate(d.getDate()-1);
    dates.value = [d,d];
    fetchData();
}
const thisMonthClicked = () => {
    let d = new Date();
    d.setDate(1);
    dates.value = [d,new Date()];
    fetchData();
}
const lastMonthClicked = () => {
    let d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth()-1);

    let d2 = new Date();
    d2.setDate(0);
    dates.value = [d,d2];
    fetchData();
}
const thisYearClicked = () => {
    let d = new Date();
    d.setDate(1);
    d.setMonth(0);
    dates.value = [d,new Date()];
    fetchData();
}
const lastYearClicked = () => {
    let d = new Date();
    d.setDate(1);
    d.setMonth(0);
    d.setFullYear(d.getFullYear()-1);

    let d2 = new Date();
    d2.setMonth(0);
    d2.setDate(0);
    dates.value = [d,d2];

    fetchData();
}
const thisWeekClicked = () => {
    let d = new Date();
    let day_of_week = (d.getDay()+6)%7;// 0 = sunday, 6=saturday. this line converts it into 0 = monday, 6 = saturday

    d.setDate(d.getDate()-(day_of_week));

    dates.value=[d,new Date()];

    fetchData();
}
const allTimesClicked = () => {
    dates.value=[new Date(1900,0,1),new Date()];
    fetchData();
}

const fetchData = async () => {
    if(dates.value.length!==2 || dates.value[0]== null || dates.value[1] == null)return;

    total_expense.value = 0;
    total_income.value = 0;
    total_tax.value=0;
    
    const min_date = dates.value[0].toLocaleString("en-CA").split(',')[0];
    const max_date = dates.value[1].toLocaleString("en-CA").split(',')[0];

    awaitingResponse.value=true;
    const res = await get_stats(min_date,max_date);
    awaitingResponse.value=false;
    if(res.type === "success"){
        receipts.value = res.receipts;
        stores.value = res.stores;
        items.value = res.items;
        incomes.value = res.incomes;
        income_sources.value = res.income_sources;
        
        const items_map = new Map();
        items.value.forEach(item => { items_map.set(item.item_id, { ...item, total: 0, quantity:0 }); });

        receipts.value.forEach(receipt => {
            const items = JSON.parse(receipt.items);

            if(items!=null){
                receipt.total = items.reduce((total,item)=>{
                    const subtotal = item.price*item.quantity;
                    const p_base = subtotal / (1+(item.default_tax/100));
                    const tax = subtotal-p_base;
                    total_tax.value+=tax;
                    const found_item = items_map.get(item.id);
                    if(found_item!=null){
                        found_item.quantity+=item.quantity;
                        found_item.total+=subtotal;
                    }
                    return total+subtotal;
                },0);
            }
            else receipt.total = 0;
            
        });
        stores.value.forEach(store => {
            store.total = receipts.value.reduce((total, receipt)=>{
                if(receipt.store_id===store.store_id) return total+receipt.total; 
                return total;
            },0);
            total_expense.value+=store.total;
        });

        items_sorted_list.value = [...items_map].sort((a,b)=>b[1].total - a[1].total).map(item=>item[1]);
        items_sorted_short_list.value = items_sorted_list.value.map(item=>({...item}));

        if(items_sorted_short_list.value.length>8){
            for(let i = 8; i < items_sorted_short_list.value.length; i++ ){
                items_sorted_short_list.value[7].total+=items_sorted_short_list.value[i].total;
            }
            items_sorted_short_list.value[7].name="Others";
            items_sorted_short_list.value[7].quantity = 0;
            items_sorted_short_list.value[7].item_id = -1;
            items_sorted_short_list.value = items_sorted_short_list.value.slice(0,8);
        }
        items_sorted_pie_data.value.labels = items_sorted_short_list.value.map((s)=>s.name);
        items_sorted_pie_data.value.datasets[0].data = items_sorted_short_list.value.map((s)=>s.total);

        items_sorted_short_list.value.forEach(item=>{item.quantity=item.quantity.toFixed(2); item.total = item.total.toFixed(2)+" TL ("+((item.total/total_expense.value)*100).toFixed(2)+"%)";})
        
        stores_sorted_list.value = stores.value.filter((s) => s.total>0).toSorted((a,b)=>b.total-a.total);
        stores_sorted_short_list.value = [...stores_sorted_list.value];
       
        if(stores_sorted_short_list.value.length>8){
            for(let i = 8; i < stores_sorted_short_list.value.length; i++ ){
                stores_sorted_short_list.value[7].total+=stores_sorted_short_list.value[i].total;
            }
            stores_sorted_short_list.value[7].name="Other";

            stores_sorted_short_list.value = stores_sorted_short_list.value.slice(0,8);
        }
        
        stores_sorted_pie_data.value.labels = stores_sorted_short_list.value.map((s)=>s.name);
        stores_sorted_pie_data.value.datasets[0].data = stores_sorted_short_list.value.map((s)=>s.total);

        stores_sorted_short_list.value = stores_sorted_short_list.value.map((s)=>{
            return {name:s.name, store_id:s.store_id, total:s.total.toFixed(2)+" TL ("+((s.total/total_expense.value)*100).toFixed(2)+"%)"};
        });

        income_sources.value.forEach(i_s => {
            i_s.total = incomes.value.reduce((total,income)=>{
                if(income.income_source_id===i_s.income_source_id)return Number(income.total)+total;
                return total;
            },0);
            total_income.value+=i_s.total;
        });
        income_sources_sorted_list.value = income_sources.value.filter((i) => i.total>0).toSorted((a,b)=>b.total-a.total);
        
       

        income_sources_sorted_short_list.value = [...income_sources_sorted_list.value];

        income_sources_sorted_pie_data.value.labels = income_sources_sorted_short_list.value.map((s)=>s.income_source_name);
        income_sources_sorted_pie_data.value.datasets[0].data = income_sources_sorted_short_list.value.map((s)=>s.total);

        income_sources_sorted_list.value.forEach(i_s=>{
            const percentage = (i_s.total/total_income.value)*100;
            i_s.total = i_s.total.toFixed(2)+" TL ("+percentage.toFixed(2)+"%)";
        });

    }
   
}
const onStoreRowClick = (event) => {
    if(event.data.store_id==null)return;


};

const onItemRowClick = (event) => {
    if(event.data.item_id==null ||event.data.item_id<0)return;
    if(event.data.store_id==null)return;
    
    let item = items.value.find(i=>i.item_id === event.data.item_id);
    if(item==null)return;

    current_item_name.value = item.name;
    const store = stores.value.find(s=>s.store_id === item.store_id);
    console.log(JSON.stringify(store));
    if(store!=null)current_store_name.value = store.name;
    else current_store_name.value="";
    item_detailed_list.value = [];
    
    receipts.value.forEach(r => {
        if(r.store_id!==event.data.store_id)return;
        const items = JSON.parse(r.items);

        items.forEach(i=>{
            let item = {
                date:r.date,
                price: i.price,
                quantity: i.quantity,
                total: i.price*i.quantity,
            };
            item_detailed_list.value.push(item);
        });
    });

    item_history_dialog_visibility_flag.value=true;

};
</script>

<template>
    <div class="flex flex-row gap-2 items-top justify-center"> 
        <Button label="Last Year" severity="secondary" class="self-start w-[8rem]" @click="lastYearClicked" :disabled="awaitingResponse"/>
        <Button label="This Year" severity="secondary" class="self-start w-[8rem]" @click="thisYearClicked" :disabled="awaitingResponse"/>
        <Button label="Last Month" severity="secondary" class="self-start w-[8rem]" @click="lastMonthClicked" :disabled="awaitingResponse"/>
        <Button label="This Month" severity="secondary" class="self-start w-[8rem]" @click="thisMonthClicked" :disabled="awaitingResponse"/>
        <div class="flex flex-col w-[16rem] gap-2">
            <DatePicker v-model="dates" showIcon iconDisplay="input" selectionMode="range" :manualInput="false" dateFormat="dd/mm/yy" :minDate="new Date(1900,0,1)" :maxDate="new Date()" :disabled="awaitingResponse"/>
            <Button label="List" @click="fetchData" :disabled="awaitingResponse"/>
        </div>
        <Button label="Today" severity="secondary" class="self-start w-[8rem]" @click="todayClicked" :disabled="awaitingResponse"/>
        <Button label="Yesterday" severity="secondary" class="self-start w-[8rem]" @click="yesterdayClicked" :disabled="awaitingResponse"/>
        <Button label="This Week" severity="secondary" class="self-start w-[8rem]" @click="thisWeekClicked" :disabled="awaitingResponse"/>
        <Button label="All Times" severity="secondary" class="self-start w-[8rem]" @click="allTimesClicked" :disabled="awaitingResponse"/>
    </div>
    <div class="flex flex-col mt-16">
        <div class ="flex flex-row">
            <div class="flex flex-row w-[50vw] justify-between">
                <div class="flex flex-col ml-8">
                    <p class="text-xl font-bold">Expense Distribution by Store</p>
                    <DataTable :value="stores_sorted_short_list" @row-click="onStoreRowClick">
                        <Column field="name" header="Store Name"/>
                        <Column field="total" header="Total Expense"/>
                    </DataTable>
                    <div class="flex flex-row justify-between mt-4"><span class="font-bold text-xl">Total:</span><span class="font-bold text-xl">{{ total_expense.toFixed(2) }} TL</span></div>
                    <p class="mt-4 mb-4  underline text-amber-500 hover:text-amber-600 active:text-amber-700 cursor-pointer select-none" @click="stores_dialog_visibility_flag=true">See all </p>
                </div>
                <Chart type="pie" :data="stores_sorted_pie_data" class="border-r-2 border-b-2 p-4"/>
            </div>
            <div class="flex flex-row w-[50vw]">
                <div class="border-l-2 border-b-2 p-4">

                    <p class="text-xl font-bold mb-4">Total Tax: {{ total_tax.toFixed(2) }}TL </p>
                    <p class="text-xl font-bold mb-4">Total Expense: {{ total_expense.toFixed(2) }}TL</p>
                    <p class="text-xl font-bold mb-4">Total Income: {{ total_income.toFixed(2) }}TL</p>

                    <p class="text-xl font-bold mb-4">Total Profit: {{ (total_income-total_expense).toFixed(2) }}TL</p>
                </div>
                
            </div>
        </div>
        <div class ="flex flex-row">
            <div class="flex flex-row w-[50vw] justify-between">
                <div class="flex flex-col ml-8">
                    <p class="text-xl font-bold">Income Distribution</p>
                    <DataTable :value="income_sources_sorted_short_list">
                        <Column field="income_source_name" header="Income Source"/>
                        <Column field="total" header="Total Income"/>
                    </DataTable>
                    <div class="flex flex-row justify-between mt-4"><span class="font-bold text-xl">Total:</span><span class="font-bold text-xl">{{ total_income.toFixed(2) }} TL</span></div>
                    <p class="mt-4 mb-4  underline text-amber-500 hover:text-amber-600 active:text-amber-700 cursor-pointer select-none" @click="incomes_dialog_visibility_flag=true">See all </p>
                </div>
                <Chart type="pie" :data="income_sources_sorted_pie_data" class="border-r-2 border-b-2 p-4"/>
            </div>
            <div class="flex flex-row w-[50vw]">
                <Chart type="pie" :data="items_sorted_pie_data" class="border-l-2 border-b-2 p-4"/>
                <div class="flex flex-col">
                    <p class="text-xl font-bold">Expense Distribution by Item</p>
                    <DataTable :value="items_sorted_short_list" @row-click="onItemRowClick">
                        <Column field="name" header="Item Name"/>
                        <Column field="quantity" header="Quantity"/>
                        <Column field="total" header="Total Expense"/>
                    </DataTable>
                    <div class="flex flex-row justify-between mt-4"><span class="font-bold text-xl">Total:</span><span class="font-bold text-xl">{{ total_expense.toFixed(2) }} TL</span></div>
                    <p class="mt-4 mb-4 underline text-amber-500 hover:text-amber-600 active:text-amber-700 cursor-pointer select-none" @click="items_dialog_visibility_flag=true">See all </p>

                </div>
            </div>
        </div>
    </div>

    <Dialog v-model:visible="stores_dialog_visibility_flag" modal dismissableMask header="Expense Distribution by Store" class="w-[60vw] h-[90vh]" :draggable="false">
        <DataTable :value="stores_sorted_list" @row-click="onStoreRowClick">
            <Column field="name" header="Store Name"/>
            <Column field="total" header="Total Expense"/>
        </DataTable>
    </Dialog>

    <Dialog v-model:visible="items_dialog_visibility_flag" modal dismissableMask  header="Expense Distribution by Item" class="w-[60vw] h-[90vh]" :draggable="false">
        <p class="font-bold">{{ dates[0].toLocaleDateString("en-GB")}} - {{ dates[1].toLocaleDateString("en-GB")}}</p>
        <DataTable :value="items_sorted_list" @row-click="onItemRowClick">
            <Column field="name" header="Item Name"/>
            <Column field="quantity" header="Quantity"/>
            <Column field="total" header="Total Expense"/>
        </DataTable>
    </Dialog>

    <Dialog v-model:visible="item_history_dialog_visibility_flag" modal dismissableMask  header="Item History" class="w-[60vw] h-[90vh]" :draggable="false">
        <p class="font-bold text-lg mb-4">Item Name: {{ current_item_name }}({{ current_store_name }})</p>
        <p class="font-bold mb-4    ">{{ dates[0].toLocaleDateString("en-GB")}} - {{ dates[1].toLocaleDateString("en-GB")}}</p>
        <DataTable :value="item_detailed_list" :sortField="'date'" :sortOrder="-1">
            <Column field="date" header="Date" sortable/>
            <Column field="quantity" header="Quantity" sortable/>
            <Column field="price" header="Price" sortable/>
            <Column field="total" header="Total Expense" sortable/>
        </DataTable>
    </Dialog>

    <Dialog v-model:visible="incomes_dialog_visibility_flag" modal dismissableMask  header="Income Distribution" class="w-[60vw] h-[90vh]" :draggable="false">
        <p class="font-bold">{{ dates[0].toLocaleDateString("en-GB")}} - {{ dates[1].toLocaleDateString("en-GB")}}</p>
        <DataTable :value="income_sources_sorted_list">
            <Column field="income_source_name" header="Income Source"/>
            <Column field="total" header="Total Income"/>
        </DataTable>
    </Dialog>
</template>

<style scoped>


::v-deep(.p-datatable-tbody tr:hover){
color:white !important;
background-color: #444 !important;
cursor:pointer;
}
::v-deep(.p-datatable-tbody tr:active){
color:white !important;
background-color: #333 !important;
}
</style>