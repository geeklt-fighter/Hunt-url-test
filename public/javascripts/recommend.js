import axios from 'axios'
import { showAlert } from "./alert";

const loader = document.querySelector('.loader')
const main = document.querySelector('.main')

export const recommend = async (user, url, title, descr, postId) => {
    try {
        const res = await axios({
            method: 'POST',
            url: 'https://recommend-service.azurewebsites.net/recommend',
            data: {
                user,
                url,
                title,
                descr 
            }
        })

        var bodyFormData = new FormData()
        bodyFormData.set('result', res.data.answer)
        
        const res2 = await axios({
            method: 'PATCH',
            url: `/api/v1/posts/${postId}`,
            // headers: {
            //     'Authorization': `Hello ${document.cookie.split('=')[1]}`
            // },
            data: bodyFormData
        })

        if (res2) {
            showAlert('success', 'Recommend url')
            loader.style.opacity = 0;
            loader.style.display = 'none'
            window.setTimeout(() => {
                location.reload()
            }, 1000)
        }

    } catch (err) {
        showAlert('error', err)
    }
}