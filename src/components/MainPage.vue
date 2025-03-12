<script setup>
    import { inject } from 'vue';
    import { useUserStore } from '../stores/userStore';
    import { useAppStore } from '../stores/appStore';
    import AppMain from './IncomeExpense/AppMain.vue';
    import AboutMe from './AboutMe.vue';
    const userStore = useUserStore();
    const appStore = useAppStore();
    import Button from 'primevue/button';

    const registerFlag = inject("registerFlag");


</script>


<template>

    <AboutMe v-if="appStore.currentMain===1" />
    <AppMain v-else-if="appStore.currentMain===0 && userStore.isLoggedIn"/>
    <div v-else class="flex flex-col justify-center items-center">
        <h1 class="text-4xl font-bold text-yellow-400 mt-16">Welcome to Ledger Bee!</h1>
       <p class="mt-8 text-lg text-gray-700 text-left max-w-3xl">
            Ledger Bee is your all-in-one solution for tracking income and expenses.
            Manage your finances effortlessly, gain insights into your spending habits, and stay in control of your budget. 
            Start now and take the first step toward smarter money management!
        </p>
        <Button class="mt-8 w-64" severity="success" @click="registerFlag=true">Start now for free!</Button>
    </div>


</template>




<style scoped>


</style>