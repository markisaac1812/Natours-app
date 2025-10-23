import axios from "axios"
import { showAlert } from "./alerts";

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password
      },
      withCredentials: true // Allow cookies to be sent/received
    });
    // console.log('Response:', res);
    // console.log('Response headers:', res.headers);
    // console.log('Cookies after login:', document.cookie); // Check if cookie is set
    if(res.data.status === 'Success'){
      showAlert("Success",'Login successful');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert("error",err.response.data.message);
  }
};

export const logout = async()=>{
  try{
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if((res.data.status === "success")) location.reload(true);
  }catch(err){
    showAlert("error", "Error logging out! Try again")
  }
}
