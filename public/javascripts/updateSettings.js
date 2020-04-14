import axios from "axios";
import { showAlert } from "./alert";



export const updateSettings = async (data, type) => {
    console.log(name, email)

    const url = type === 'password'?
        '/api/v1/users/updatePassword':
        '/api/v1/users/updateMe' 
    try {
        const res = await axios({
            method: 'PATCH',
            url,
            data
        })

        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} updates successfully`)
            location.assign('/me')
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}