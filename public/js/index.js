import '@babel/polyfill';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

if (loginForm) {
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // ✅ Get values INSIDE the event listener (when user submits)
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

// if (userDataForm) {
//   userDataForm.addEventListener('submit', (e) => {
//     e.preventDefault();
//     const name = document.getElementById('name').value;
//     const email = userDataForm.querySelector('#email').value;

//     // Check if email is valid
//     if (!email || email.trim() === '') {
//       alert('Please enter a valid email address');
//       return;
//     }

//     updateSettings({ name, email }, 'data');
//   });
// }

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name',document.getElementById('name').value)
    form.append('email',userDataForm.querySelector('#email').value);
    form.append('photo',document.getElementById('photo').files[0]);
    console.log(form);
    updateSettings(form, 'data');
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'updating...';

    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('password-confirm').value;
    await updateSettings({ currentPassword, password, confirmPassword }, 'password');

    document.querySelector('.btn--save-password').textContent = 'SAVE PASSSWORD';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if(bookBtn){
  bookBtn.addEventListener('click',e=>{
    e.target.textContent = 'Processing';
    const {tourId} = e.target.dataset;
    bookTour(tourId);
  });
}
