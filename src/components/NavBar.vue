    <script setup>
    import { ref, inject } from 'vue';

    import MenuBar from 'primevue/menubar';
    import Button from 'primevue/button';
    import TieredMenu from 'primevue/tieredmenu';

    import {logout} from "../api/rest_client";
    import { useUserStore } from '../stores/userStore';
    import { useAppStore } from '../stores/appStore';
    import { useToast } from 'primevue/usetoast';

    const toast = useToast();
    const userStore = useUserStore();
    const appStore = useAppStore();

    const loginFlag = inject("loginFlag");
    const registerFlag = inject("registerFlag");
    const menu_ref = ref(null);

    const toggle = (event) => {
        menu_ref.value.toggle(event);
    };


    const items = [
        {label:"Home", url:"/", command:()=>{appStore.currentMain=0}}, //using appStore.currentMain because github pages only allows single page
        {label:"About Me", url:"/", command:()=>{appStore.currentMain=1} },
    ];

    const user_items = [
        {label:"Check in Github", icon:"pi pi-github", url:"https://github.com/WeirdOzGames/LedgerBee", target:"_blank"},
        {label:"Settings", icon:"pi pi-cog", url:"/"},
        {separator:true},
        {label:"Logout", icon:"pi pi-sign-out", command:()=> issue_logout()}
    ];

    async function issue_logout(){
        const res = await logout();
        if(res.type==="logoutSucc"){
            toast.add({
                detail:"You've logged out successfully.",
                summary:"Success",
                severity:"success",
                life:2000,
                closable:false
            });
            userStore.logout();
        }
        else if(res.type === "logoutFail"){
            toast.add({
                detail:"You're already logged out.",
                summary:"Error",
                severity:"error",
                life:2000,
                closable:false
            });
            userStore.logout();
        }
    }

    </script>


    <template>
        <MenuBar :model="items" class="h-[50px] w-full" >
            <template #start class="h-full">
                <router-link to="/">
                    <img src="../assets/LedgerBee.png" class="h-[40px] w-auto transition-transform duration-300 hover:scale-110">
                </router-link>
            </template>

            <template #end>
                <div v-if="userStore.isLoggedIn" class="flex mr-4 ">
                    <Button  type="button" icon="pi pi-user" :label="userStore.username" class="p-button-text !text-zinc-600" @click="menu_ref.toggle($event)" aria-haspopup="true" aria-controls="tmenu_id">
                        <template #default>
                            {{ userStore.username }}
                            <span class="pi pi-chevron-down ml-2"></span>
                        </template>
                    </Button>
                    <TieredMenu ref="menu_ref" id="tmenu_id" :model="user_items" popup/>
                </div>
                <div v-else class="flex items-center gap-2">
                    <Button label="login" icon="pi pi-user" class="!text-black p-button-text" @click="loginFlag=true"></Button>
                    <Button label="sign up" icon="pi pi-user-plus" class="!text-black p-button-text" @click="registerFlag=true"></Button>
                    
                </div>
            </template>

        </MenuBar>

    </template>

    <style scoped>

    </style>