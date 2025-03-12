import { createRouter, createWebHistory } from 'vue-router';
import MainPage from "./components/MainPage.vue"
import AboutMe from './components/AboutMe.vue';
const routes = [
    {
        path: '/',
        name: 'Home',
        component: MainPage
    },
    {
        path: '/about_me',
        name: 'AboutMe',
        component: AboutMe
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;