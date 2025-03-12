import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
    state: () => ({
      currentMain: 0,
      currentPage: 0,
      currentDate: new Date().toLocaleDateString("en-CA"),
      popups:[],
    }),
    actions: {
      changePage(number) {
        currentPage=number;
      }
    },
    persist:{storage: sessionStorage},
  });