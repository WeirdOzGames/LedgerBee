<script setup>
import {ref, onMounted, provide, watch} from 'vue'
import Toast from 'primevue/toast';
import { autoLogin } from './api/rest_client';
import LoginDialog from './components/LoginDialog.vue';
import RegisterDialog from './components/RegisterDialog.vue';
import { useAppStore } from '@/stores/appStore';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const appStore = useAppStore();

const loginFlag = ref(false);
const registerFlag = ref(false);
provide("loginFlag",loginFlag);
provide("registerFlag",registerFlag);
onMounted(()=> autoLogin());

appStore.popups = [];

watch(()=>appStore.popups, (popups) => {
  if(popups.length>0){
    for(let index in popups){
      toast.add(popups[index]);
    }
    appStore.popups = [];
  }
}, { deep: true });

</script>




<template>
  <Toast position="top-center"/>
  <LoginDialog v-model:is-visible="loginFlag" @showRegister="loginFlag=false; registerFlag=true;" @hideLogin="loginFlag=false "/>
  <RegisterDialog v-model:is-visible="registerFlag" @showLogin=" registerFlag=false; loginFlag=true;" @hideRegister="registerFlag=false"/>
     
  <NavBar></NavBar>
  <div id="content">
      <router-view></router-view>
  </div>
  
</template>





<style scoped>


</style>
