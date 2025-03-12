import './assets/main.css'
import './assets/tailwind.css';
import 'primeicons/primeicons.css';

import { createApp } from 'vue'
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import ConfirmationService from 'primevue/confirmationservice';

import App from './App.vue'
import router from "./router"
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';
import ToastService from 'primevue/toastservice';

import NavBar from './components/NavBar.vue';

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{amber.50}',
            100: '{amber.100}',
            200: '{amber.200}',
            300: '{amber.300}',
            400: '{amber.400}',
            500: '{amber.500}',
            600: '{amber.600}',
            700: '{amber.700}',
            800: '{amber.800}',
            900: '{amber.900}',
            950: '{amber.950}'
        }
    }
});


const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(PrimeVue, {
        theme: {
            preset: MyPreset
        },
        locale: {
            firstDayOfWeek:1
        }
    }
);
app.use(router);
app.use(PrimeVue);
app.use(ToastService);
app.use(pinia);
app.use(ConfirmationService);

app.component("NavBar", NavBar);

app.mount('#app')
