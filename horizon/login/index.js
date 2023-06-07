const socket = io();
let username = '';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js'
import { getAuth, createUserWithEmailAndPassword, setPersistence, signInWithEmailAndPassword, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js'
const firebaseConfig = {
    apiKey: "AIzaSyCVqlFta6rULlWiiYu1yDDs9zsLH1fGddU",
    authDomain: "i3e-5d95a.firebaseapp.com",
    databaseURL: "https://i3e-5d95a.firebaseio.com",
    projectId: "i3e-5d95a",
    storageBucket: "i3e-5d95a.appspot.com",
    messagingSenderId: "229507724277",
    appId: "1:229507724277:web:deb1eea04d486f18f0e6bc"
  };
  const app = initializeApp(firebaseConfig);

document.getElementById('sign-up-instead').addEventListener('click', function() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'flex';
});

document.getElementById('sign-in-instead').addEventListener('click', function() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'flex';
});

socket.on('user data', () => {
    window.location.href = '/';
});

const registerFormSubmit = document.getElementById('register-button');
const loginFormSubmit = document.getElementById('login-button');

registerFormSubmit.addEventListener('click', () => {
    const email = document.getElementById('reg-email-input').value;
    const password = document.getElementById('reg-password-input').value;
    const username = document.getElementById('reg-username-input').value;
    const auth = getAuth();
    setPersistence(auth, browserSessionPersistence)
    .then(() => {
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            socket.emit('register user', user.uid, username);
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode);
            console.log(errorMessage);
        });
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
    });
}, {once: true});
loginFormSubmit.addEventListener('click', () => {
    const email = document.getElementById('login-email-input').value;
    const password = document.getElementById('login-password-input').value;
    const auth = getAuth();
    setPersistence(auth, browserSessionPersistence)
    .then(() => {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            socket.emit('user data', user.uid);
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode);
            console.log(errorMessage);
        });
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
    });
}, {once: true});

getAuth().onAuthStateChanged((user) => {
    if (user) {
      socket.emit('user data', user.uid);
    } else {
    }
  }, { once: true });