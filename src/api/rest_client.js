import axios from 'axios';
import { useUserStore } from '@/stores/userStore';
import { useAppStore } from '@/stores/appStore';



async function sendMessage(endpoint, method = "GET", body = null){

    

    const base_url = import.meta.env.VITE_API_URL;
    
    const headers = {"Content-Type": "application/json"};
    
    const options = {
        url: `${base_url}/${endpoint}`,
        method,
        headers,
        withCredentials:true,
    };

    if(body) options.data = body;
    

    try{
        
        const response = await axios(options);
        
        //alert(JSON.stringify(response));

        if(response.data.type === "tokenExpired"){

            let token_res = await sendMessage("token", "POST");

            if(token_res.type === "refreshAccessSucc"){ 
                return await sendMessage(endpoint, method, body);
             }
             else{
                const userStore = useUserStore();
                userStore.logout();
             }
             
        }
        else if(response.data.type==="noToken"){
            const userStore = useUserStore();
            userStore.logout();
        }
        else if(response.data.type === "popup_error"){
            const appStore = useAppStore();
            appStore.popups.push({
                detail:response.data.info,
                summary:"Error",
                severity:"error",
                life:3000,
                closable:false
            })
        }

        return response.data;

    }
    catch(error){
        return {type:"error", data:error.message};
    }   
}

export async function login(email, pass){

    return await sendMessage("login", "POST", {username:email, password:pass});

}

export async function register(email, pass){
    return await sendMessage("register", "POST", {username:email, password:pass});
}

export async function guest_register(){
    return await sendMessage("guestregister", "POST");
}

export async function logout(){
    return await sendMessage("logout", "POST");
}

export async function autoLogin(){

    return await sendMessage("token", "POST");
}

export async function getStores(){

    return await sendMessage("get_stores", "POST");
}

export async function addStore(store_name){

    return await sendMessage("add_store", "POST", {name:store_name});
}

export async function getStoreData(store_id){
    store_id = Number(store_id);

    return await sendMessage("get_store_data", "POST", {store_id});
}

export async function addItem(store_id, item_name, tax){
    store_id = Number(store_id);
    tax = Number(tax);

    return await sendMessage("add_item", "POST", {store_id, item_name, tax});
}

export async function saveReceipt(receipt_id, store_id, items, date){
    receipt_id = Number(receipt_id);
    store_id = Number(store_id);
    
    return await sendMessage("save_receipt", "POST", {receipt_id, store_id, items, date});
}

export async function getReceiptData(receipt_id){
    receipt_id = Number(receipt_id);

    return await sendMessage("get_receipt_data", "POST", {receipt_id});
}

export async function getReceipts(date){
    return await sendMessage("get_receipts", "POST", {date});
}

export async function addIncomeSource(sourceName){
    return await sendMessage("add_income_source", "POST", {sourceName});
}

export async function setIncomeSourceVisibility(income_source_id, is_visible){
    is_visible = Boolean(is_visible);
    income_source_id = Number(income_source_id);

    return await sendMessage("set_income_source_visibility", "POST", {income_source_id, is_visible});
}

export async function update_income(income_id, income_source_id, date, total){

    income_id = Number(income_id);
    income_source_id = Number(income_source_id);
    total = parseFloat((total || "0").replace(/[^0-9.-]/g, ""));

    return await sendMessage("update_income", "POST", {income_id, income_source_id, date, total});
}


export async function get_stats(min_date, max_date){

    return await sendMessage("get_stats", "POST", {min_date, max_date});
}

export async function refresh_stores(){
    
    return await sendMessage("refresh_stores", "POST");
}

export async function set_store_visibility(is_visible, store_id){
    store_id = Number(store_id);
    return await sendMessage("set_store_visibility", "POST", {is_visible, store_id:Number(store_id)});
}

export async function set_item_visibility(is_visible, item_id){
    item_id = Number(item_id);
    return await sendMessage("set_item_visibility", "POST", {is_visible, item_id});
}

export async function update_store(store_id, name){
    store_id = Number(store_id);
    return await sendMessage("update_store", "POST", {store_id, name});
}

export async function update_item(item_id, name, tax){
    item_id = Number(item_id);
    tax = Number(tax);
    return await sendMessage("update_item", "POST", {item_id, name, tax});
}

export async function google_login(token_id){
    return await sendMessage("google_login", "POST", {token_id});
}
