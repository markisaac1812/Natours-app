/* eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

export const signup = async (name, email, password, passwordConfirm) => {
  console.log('Signup function called with:', { name, email, password, passwordConfirm });
  try {
    console.log('Making API call to /api/v1/users/signup');
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        confirmPassword: passwordConfirm
      },
      withCredentials: true
    });
    console.log('API response:', res.data);
    if (res.data.status === 'Success') {
      showAlert('Success', 'signed up successful');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    console.error('Signup error:', err);
    console.error('Error response:', err.response);
    if (err.response && err.response.data) {
      showAlert('error', err.response.data.message || 'An error occurred during signup');
    } else {
      showAlert('error', 'Network error or server is not responding');
    }
  }
};
