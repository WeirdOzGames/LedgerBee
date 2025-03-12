<script setup>
import { ref, defineModel, watch } from 'vue';
import Dialog from 'primevue/dialog';
import { FloatLabel } from 'primevue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import GoogleButton from './GoogleButton.vue';
import Message from 'primevue/message';
import { register, guest_register, google_login }from "../api/rest_client"
import { useToast } from 'primevue/usetoast';
import { useUserStore } from '../stores/userStore';


const userStore = useUserStore();

const toast = useToast();

const isVisible = defineModel("isVisible");

const email_regex = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
const password_regex = /^[^\s]{8,64}$/;


const email = ref("");
const pass = ref("");
const pass2 = ref("");

const emailError = ref("");
const passError = ref("");
const pass2Error = ref("");

const awaitingResponse = ref(false);

const emit = defineEmits(['showLogin',"hideRegister"]);

watch(isVisible, (newVal)=>{
    resetValues();
});

async function submit_clicked(){
    if(!email.value){emailError.value="Email cannot be empty."; return;}
    if(!pass.value){passError.value="Password cannot be empty."; return;}
    if(!pass2.value){pass2Error.value="Password cannot be empty."; return;}

    if(!email_regex.test(email.value)){emailError.value = "Please enter a valid email address."; return;}
    if(!password_regex.test(pass.value)){passError.value="Password must be 8-64 characters long and cannot contain whitespaces."; return;}
    if(pass.value!==pass2.value){pass2Error.value="Passwords do not match."; return;}

    awaitingResponse.value=true;
    let res = await register(email.value, pass.value);
    awaitingResponse.value=false;
    resetValues();

    if(res.type==="error"){
        toast.add({
            detail:res.data,
            summary:"Error",
            severity:"error",
            life:3000,
            closable:false
        });
    }
    else if(res.type ==="UserExists"){
        emailError.value="Email is already in use.";
    }
    else if(res.type === "RegisterSucc"){
        toast.add({
            detail:"You've successfully registered.",
            summary:"Success",
            severity:"success",
            life:3000,
            closable:false
        });
        emit("showLogin");
    }
}
async function guest_clicked(){

    let res = await guest_register();

    if(res.type==="guestRegisterSucc"){
        userStore.setUser("Guest");
        emit("hideRegister");

    }

}
function resetValues(){
    email.value="";
    pass.value="";
    pass2.value="";

    emailError.value="";
    passError.value="";
    pass2Error.value="";
}

const google_clicked = async (token_id) => {
    
    awaitingResponse.value=true;
    let res = await google_login(token_id);
    awaitingResponse.value=false;
    if(res.type=="success"){
        toast.add({
            detail:"Register Successful.",
            summary:"Success",
            severity:"success",
            life:3000,
            closable:false
        });      
        userStore.setUser(res.username);
        emit("hideRegister");

        resetValues();
    }

}
</script>



<template>
    <Dialog v-model:visible="isVisible" header="Register" modal :draggable="false" :style="{ width: '25rem'}">
        <div class="flex flex-col justify-center gap-2 m-2">
            <FloatLabel variant="on" >
                <InputText id="register_mail" :disabled="awaitingResponse" v-model="email" :style="{width: '22rem'}" @focus="emailError='' " autocomplete="off"/>
                <label for="register_mail">E-mail</label>
            </FloatLabel>
            <Message v-show="emailError" severity="error">{{emailError}}</Message>

        </div>
        
        <div class="flex flex-col justify-center gap-2 m-2">
            <FloatLabel variant="on" >
                <InputText id="registe_pass" :disabled="awaitingResponse" type="password" v-model="pass" :style="{width: '22rem'}" @focus="passError=''"/>
                <label for="registe_pass">Password</label>
            </FloatLabel>
            <Message v-show="passError" severity="error">{{passError}}</Message>

        </div>
        
        <div class="flex flex-col justify-center gap-2 m-2">
            <FloatLabel variant="on" >
                <InputText id="registe_pass2" :disabled="awaitingResponse" type="password" v-model="pass2" :style="{width: '22rem'}" @focus="pass2Error=''"/>
                <label for="registe_pass2">Repeat Password</label>
            </FloatLabel>
            <Message v-show="pass2Error" severity="error">{{pass2Error}}</Message>

        </div>
        <div class="flex justify-center items-center gap-2">
            <p class="flex justify-center">You already have an account?</p>
            <span><Button label="Login" class="!text-[#444] p-button-text underline" @click="$emit('showLogin')"/></span>
        </div>
        <Button label="Register" :disabled="awaitingResponse" class="w-full mt-4" @click="submit_clicked" />
        
        <GoogleButton :disabled="awaitingResponse" class="flex items-center gap-2 !w-full mt-4" @googleclick="google_clicked"></GoogleButton>
        
        <Button label="Register as a Guest" :disabled="awaitingResponse" severity="secondary" class="w-full mt-4" @click="guest_clicked" />

    </Dialog>

</template>


<style scoped>


</style>