import axios from 'axios'
import { showAlert } from './alert'



export const contribute = async() =>{

    try {
        const res = axios({
            method:'GET',
            url:'http://localhost:3001/api/v1/histories/'
        })

        console.log(res)
    } catch (err) {
        showAlert('error', err)
    }
}