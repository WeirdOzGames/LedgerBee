<script setup>
import { ref, defineModel, watch } from 'vue';
import Dialog from 'primevue/dialog';
import { FloatLabel } from 'primevue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import GoogleButton from './GoogleButton.vue';
import Message from 'primevue/message';
import { login, google_login }from "../api/rest_client"
import { useToast } from 'primevue/usetoast';
import { useUserStore } from '../stores/userStore';
const userStore = useUserStore();

const toast = useToast();

const isVisible = defineModel("isVisible");

const email_regex = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
const password_regex = /^[^\s]{8,64}$/;



const email = ref("");
const pass = ref("");

const emailError = ref("");
const passError = ref("");

const awaitingResponse = ref(false);
const emit = defineEmits(['showRegister',"hideLogin"]);

watch(isVisible, (newVal)=>{
    resetValues();
});


async function submit_clicked(){
    if(!email.value){emailError.value="Email cannot be empty."; return;}
    if(!pass.value){passError.value="Password cannot be empty."; return;}

    if(!email_regex.test(email.value)){emailError.value = "Please enter a valid email address."; return;}
    if(!password_regex.test(pass.value)){passError.value="Password must be 8-64 characters long and cannot contain whitespaces."; return;}

    awaitingResponse.value=true;
    let res = await login(email.value, pass.value);
    awaitingResponse.value=false;

    if(res.type==="error"){
        toast.add({
            detail:res.data,
            summary:"Error",
            severity:"error",
            life:3000,
            closable:false
        });
    }
    else if(res.type==="WrongCred"){
        toast.add({
            detail:"Wrong email or password.",
            summary:"Authentication Error",
            severity:"error",
            life:3000,
            closable:false
        });
    }
    else if(res.type==="loginSucc"){
        toast.add({
            detail:"Login Successful.",
            summary:"Success",
            severity:"success",
            life:3000,
            closable:false
        });      
        userStore.setUser(res.username);
        emit("hideLogin");

        resetValues();
        
    }
    else{
        alert("Unexpected response type: " + res.type);
    }

    

}

function resetValues(){
    email.value="";
    pass.value="";

    emailError.value="";
    passError.value="";
}

const google_clicked = async (token_id) => {
    
    awaitingResponse.value=true;
    let res = await google_login(token_id);
    awaitingResponse.value=false;
    if(res.type=="success"){
        toast.add({
            detail:"Login Successful.",
            summary:"Success",
            severity:"success",
            life:3000,
            closable:false
        });      
        userStore.setUser(res.username);
        emit("hideLogin");

        resetValues();
    }

}

</script>



<template>
    <Dialog v-model:visible="isVisible" header="Login" modal :draggable="false" :style="{ width: '25rem'}">
        <div class="flex flex-col justify-center gap-2 m-2">
            <FloatLabel variant="on" >
                <InputText id="login_mail" :disabled="awaitingResponse" v-model="email" :style="{width: '22rem'}" @focus="emailError='' " autocomplete="off"/>
                <label for="login_mail">E-mail</label>
            </FloatLabel>
            <Message v-show="emailError" severity="error">{{emailError}}</Message>

        </div>
        
        <div class="flex flex-col justify-center gap-2 m-2">
            <FloatLabel variant="on" >
                <InputText id="login_pass" :disabled="awaitingResponse" type="password" v-model="pass" :style="{width: '22rem'}" @focus="passError=''"/>
                <label for="login_pass">Password</label>
            </FloatLabel>
            <Message v-show="passError" severity="error">{{passError}}</Message>

        </div>
        <div class="flex justify-center items-center gap-2">
            <p class="flex justify-center">You don't have an account?</p>
            <span><Button label="Sign up" class="!text-[#444] p-button-text underline" @click="$emit('showRegister')"/></span>
        </div>
        
        <Button label="Login" class="w-full mt-4" :disabled="awaitingResponse" @click="submit_clicked" />
        <GoogleButton :disabled="awaitingResponse" class="flex items-center gap-2 !w-full mt-4" @googleclick="google_clicked"></GoogleButton>
        
    </Dialog>

</template>


<style scoped>


</style>