const toggleButton = document.querySelector('.dark-light');
const colors = document.querySelectorAll('.color');
const socket = io();
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js'
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js'
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
let username = '';
let currentCircle = '';
const urlParams = new URLSearchParams(window.location.search);
const urlcircle = urlParams.get('circle');
let joined = false;

getAuth().onAuthStateChanged((user) => {
  if (user) {
    socket.emit('user data', user.uid);
  } else {
    window.location.href = '/horizon-beta/login/';
  }
}, { once: true });

colors.forEach(color => {
  color.addEventListener('click', e => {
    colors.forEach(c => c.classList.remove('selected'));
    const theme = color.getAttribute('data-color');
    document.body.setAttribute('data-theme', theme);
    color.classList.add('selected');
  });
});

toggleButton.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

socket.on('user data', (userdata) => {
  console.log("user data")
  if (urlcircle) {
    currentCircle = urlcircle;
  } else {
    currentCircle = "Main";
  }
  username = userdata.username;
  $('#username-popup').hide();
  $('#circle-selector').show();
  $('#chat-window').show();
  if (joined === false) {
    socket.emit('join room', currentCircle, username);
    joined = true;
  }
  document.title = `Neeter - ${currentCircle}`
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set('circle', currentCircle);
  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
  window.history.pushState({}, '', newUrl);
  const conversationArea = document.querySelector('.conversation-area');
  const circles = conversationArea.querySelectorAll('.msg');
  circles.forEach(circle => {
    if (circle.querySelector('.msg-username').innerText === currentCircle) {
      circle.classList.add('active');
    }
  });
  const chatAreaTitle = document.querySelector('.chat-area-title');
  chatAreaTitle.innerText = currentCircle;
  const chatAreaSecondTitle = document.querySelector('.detail-title');
  chatAreaSecondTitle.innerText = currentCircle;
  const circlePic = document.querySelector('.circle-image');
  circlePic.src = `https://api.dicebear.com/6.x/initials/svg?seed=${currentCircle}&scale=80&backgroundType=gradientLinear&backgroundColor=808080&fontWeight=400&radius=50`;

});

socket.on('rooms list', (circlelist) => {
  const conversationArea = document.querySelector('.conversation-area');
  conversationArea.innerHTML = '';
  function truncateText(text, maxLength) {
    if (text.length > maxLength) {
      return text.slice(0, maxLength) + '...';
    } else {
      return text;
    }
  }
  circlelist.forEach(circle => {
    let truncatedcirclename = truncateText(circle, 40);
    const newCircle = document.createElement('div');
    if (circle === currentCircle) {
      newCircle.classList.add('msg', 'active');
    } else {
      newCircle.classList.add('msg');
    }
    newCircle.innerHTML = `
        <img class="msg-profile" src="https://api.dicebear.com/6.x/initials/svg?seed=${truncatedcirclename}&scale=80&backgroundType=gradientLinear&backgroundColor=808080&fontWeight=400" alt="" />
        <div class="msg-detail">
         <div class="msg-username">${truncatedcirclename}</div>
         <div class="msg-content">
          <span class="msg-message">Not yet implemented...</span>
         </div>
        </div>
        `;
    newCircle.addEventListener('click', () => {
      currentCircle = circle;
      socket.emit('join room', currentCircle, username);
      document.title = `Neeter - ${currentCircle}`
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('circle', currentCircle);
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.pushState({}, '', newUrl);
      const circleobjlist = conversationArea.querySelectorAll('.msg');
      circleobjlist.forEach(circleobj => {
        if (circleobj.classList.contains('active')) {
          circleobj.classList.remove('active');
        }
      });
      newCircle.classList.add('active');
      const chatAreaTitle = document.querySelector('.chat-area-title');
      chatAreaTitle.innerText = currentCircle;
      const chatAreaSecondTitle = document.querySelector('.detail-title');
      chatAreaSecondTitle.innerText = currentCircle;
      const circlePic = document.querySelector('.circle-image');
      circlePic.src = `https://api.dicebear.com/6.x/initials/svg?seed=${currentCircle}&scale=80&backgroundType=gradientLinear&backgroundColor=808080&fontWeight=400&radius=50`;
    });
    conversationArea.appendChild(newCircle);
  }
  );
  const addCircle = document.createElement('button');
  addCircle.classList.add('add');
  const addCircleOverlay = document.createElement('div');
  addCircleOverlay.classList.add('overlay');
  conversationArea.appendChild(addCircle);
  conversationArea.appendChild(addCircleOverlay);
});

