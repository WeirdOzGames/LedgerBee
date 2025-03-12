<script setup>
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import { useAppStore } from '../../stores/appStore';
import AppIncomeExpense from './AppIncomeExpense.vue';
import StatisticsMain from '../Statistics/StatisticsMain.vue';
import StoresMain from '../Stores/StoresMain.vue';

const appStore = useAppStore();


</script>

<template>
<Tabs v-model:value="appStore.currentPage">
    <TabList>
        <Tab value="0">Income & Expenses</Tab>
        <Tab value="1">Stores</Tab>
        <Tab value="2">Statistics</Tab>
    </TabList>
    <TabPanels>
        <TabPanel value="0">
            <AppIncomeExpense/>
        </TabPanel>
        <TabPanel value="1">
            <StoresMain/>
        </TabPanel>
        <TabPanel value="2">
            <StatisticsMain/>
        </TabPanel>
    </TabPanels>
</Tabs>
</template>


<style scoped>


</style>
