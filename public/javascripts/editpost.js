import axios from 'axios'
import { showAlert } from "./alert";



export const createPost = async (data) => {
    try {
        console.log(data)
        const res = await axios({
            method:'POST',
            url: `/api/v1/posts/`, 
            data 
        })
       
        if (res.data.status === 'success') {
            showAlert('success', 'Created successfully')
            window.setTimeout(() => {
                location.assign('/')
            }, 500)
        }
    } catch (err) {
        showAlert('error',err)
    }
}


export const deletePost = async (id) => {

    try {
        const res = await axios({
            method: 'DELETE',
            url: `/api/v1/posts/${id}`
        })
        console.log(res)
    } catch (err) {
        console.log(err)
        showAlert('error', err)
    }
}


// headers:{
//     'Authorization': `Hello ${document.cookie.split('=')[1]}`
// },