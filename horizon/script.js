const toggleButton = document.querySelector('.dark-light');
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
let messagesTimestamps = [];
let currentCircle = '';
const urlParams = new URLSearchParams(window.location.search);
const urlcircle = urlParams.get('circle');
let joined = false;
let circleemojiset = false;
let circleemoji = '';
let messageslist = [];
let theme;

getAuth().onAuthStateChanged((user) => {
  if (user) {
    socket.emit('user data', user.uid);
  } else {
    window.location.href = '/login/';
  }
}, { once: true });

function prepareMessage(message) {
  const regex = /:[a-zA-Z0-9_-]+:/g;
  const matches = message.match(regex);
  if (matches) {
    matches.forEach(match => {
      let emoji = match.replace(/:/g, '');
      emoji = emoji.replace(/_/g, '-emunderscore-');
      const emojiHtml = `<em-emoji id="${emoji}" size="15.5px"></em-emoji>`;
      message = message.replace(match, emojiHtml);
    });
    if (message.match(/<em-emoji/g).length === matches.length) {
      message = message.replace(/size="15.5px"/g, 'size="25px"');
    }
  }
  const converter = new showdown.Converter({ breaks: true, simpleLineBreaks: true });
  const html = converter.makeHtml(message);
  const parser = new DOMParser();
  const parsedHtml = parser.parseFromString(html, 'text/html');
  let innerHtml = parsedHtml.body.firstChild.innerHTML;
  innerHtml = innerHtml.replace(/-emunderscore-/g, '_');
  return innerHtml;
}

toggleButton.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  if (document.body.classList.contains('dark-mode')) {
    localStorage.setItem('theme', 'dark');
    theme = 'dark';
  } else {
    localStorage.setItem('theme', 'light');
    theme = 'light';
  }
  if (circleemojiset === true) {
    let backgroundcolor = "FFFFFF";
    const circlePic = document.querySelector('.circle-image');
    if (document.body.classList.contains('dark-mode')) {
      backgroundcolor = "27292d";
    } else {
      backgroundcolor = "FFFFFF";
    }
    circlePic.src = `https://api.dicebear.com/6.x/initials/svg?seed=${circleemoji}&scale=80&backgroundType=gradientLinear&backgroundColor=${backgroundcolor}&fontWeight=400&radius=50`;
  }
});

socket.on('user data', (userdata) => {
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
      conversationArea.scrollTop = circle.offsetTop;
    }
  });
  const chatAreaTitle = document.querySelector('.chat-area-title');
  chatAreaTitle.innerText = currentCircle;
  const chatAreaSecondTitle = document.querySelector('.detail-title');
  chatAreaSecondTitle.innerText = currentCircle;
  socket.emit('get room settings', currentCircle);
});

socket.on('room settings', (settings) => {
  const circledescription = document.querySelector('.detail-subtitle');
  if (settings.description) {
    circledescription.innerText = settings.description;
  } else {
    circledescription.innerText = currentCircle + " Circle.";
  }
  if (settings.emoji) {
    const circlePic = document.querySelector('.circle-image');
    let backgroundcolor = "FFFFFF";
    if (document.body.classList.contains('dark-mode')) {
      backgroundcolor = "27292d";
    } else {
      backgroundcolor = "FFFFFF";
    }
    circleemojiset = true;
    circleemoji = settings.emoji;
    circlePic.src = `https://api.dicebear.com/6.x/initials/svg?seed=${settings.emoji}&scale=80&backgroundType=gradientLinear&backgroundColor=${backgroundcolor}&fontWeight=400&radius=50`;
  } else {
    const circlePic = document.querySelector('.circle-image');
    circlePic.src = `https://api.dicebear.com/6.x/initials/svg?seed=${currentCircle}&scale=80&backgroundType=gradientLinear&backgroundColor=808080&fontWeight=400&radius=50`;
  }
});

socket.on('rooms list', (deprecatedcirclelist, circlelist) => {
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
    let truncatedcirclename = truncateText(circle.room, 40);
    let circlelastmessage = circle.latestmessagetruncated;
    if (circlelastmessage === undefined) {
      circlelastmessage = "No messages yet.";
    }
    const newCircle = document.createElement('div');
    if (circle === currentCircle) {
      newCircle.classList.add('msg', 'active');
    } else {
      newCircle.classList.add('msg');
    }
    newCircle.innerHTML = `
        <img class="msg-profile" src="https://api.dicebear.com/6.x/initials/svg?seed=%23&scale=130&backgroundType=gradientLinear&backgroundColor=transparent&fontWeight=600&textColor=4a4a4a" alt="" />
        <div class="msg-detail">
         <div class="msg-username">${truncatedcirclename}</div>
         <div class="msg-content">
          <span class="msg-message">${circlelastmessage}</span>
         </div>
        </div>
        `;
    newCircle.addEventListener('click', () => {
      currentCircle = circle.room;
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
      circlePic.src = `https://api.dicebear.com/6.x/initials/svg?seed=...&scale=80&backgroundType=gradientLinear&backgroundColor=808080&fontWeight=400&radius=50`;
      socket.emit('get room settings', currentCircle);
      const circledescription = document.querySelector('.detail-subtitle');
      if (circle.settings.description) {
        circledescription.innerText = circle.settings.description;
      } else {
        circledescription.innerText = circle.room + " Circle.";
      }
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

const custom = [
  {
    id: 'neeter',
    name: 'Neeter',
    emojis: [
      {
        id: 'lizzy',
        name: 'Lizzy',
        keywords: ['neeter', 'cat', 'lizzy'],
        skins: [{ src: 'https://i.ibb.co/ZSRPn8F/lizzy.png' }],
      }
    ],
  },
  {
    id: 'koru',
    name: 'Koru emojis',
    emojis: [
      {
        id: 'rick',
        name: 'Never Gonna Give You Up',
        keywords: ['rick', 'roll', 'rickroll'],
        skins: [{ src: 'https://media.tenor.com/x8v1oNUOmg4AAAAS/rickroll-roll.gif' }],
      },
    ],
  },
]

document.addEventListener('DOMContentLoaded', () => {
  theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  const messageInputZone = document.querySelector('#chat-area-footer');
  const messageInput = document.querySelector('#message-input');
  messageInputZone.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    if (message === '') {
      return;
    }
    messageInput.value = '';
    socket.emit('chat message', message, username, currentCircle, false);
  });
  const sendButton = document.querySelector('#sendbtn');
  sendButton.addEventListener('click', () => {
    messageInputZone.dispatchEvent(new Event('submit'));
  });
  emojiSelector.innerHTML = '';
  emojiSelector.style.display = 'none';
  const pickerOptions = {
    custom: custom
  };
  const picker = new EmojiMart.Picker(pickerOptions)
  emojiSelector.appendChild(picker)
  emojiSelector.innerHTML = '';
  emojiSelector.removeAttribute('style');
});

socket.on('chat message', (msg, circle, circleowner, isaresponse, responseto, responsetousername, timestamp) => {
  messageslist.push(msg);
  const convertedtimestamp = new Date(timestamp);
  messagesTimestamps.push(msg._id + "-time-" + convertedtimestamp.getTime());
  const currenttime = new Date();
  const timeago = currenttime - convertedtimestamp;
  let timeagotext = '';
  if (timeago < 60000) {
    timeagotext = 'just now';
  } else if (timeago < 3600000) {
    timeagotext = `${Math.floor(timeago / 60000)} minutes ago`;
  } else if (timeago < 86400000) {
    timeagotext = `${Math.floor(timeago / 3600000)} hours ago`;
  } else {
    timeagotext = `${convertedtimestamp.toLocaleDateString()} ${convertedtimestamp.toLocaleTimeString()}`;
  }
  const chatAreaMain = document.querySelector('.chat-area-main');
  if (chatAreaMain.lastElementChild) {
    if (msg.username === username) {
      if (chatAreaMain.lastElementChild.classList.contains('chat-msg') && chatAreaMain.lastElementChild.classList.contains('owner')) {
        const lastmessage = chatAreaMain.lastElementChild.querySelector('.chat-msg-content');
        const lastmessagetimestamp = chatAreaMain.lastElementChild.querySelector('.chat-msg-date');
        const newMessage = document.createElement('div');
        newMessage.classList.add('chat-msg-text');
        newMessage.innerHTML = prepareMessage(msg.message);
        newMessage.id = msg._id;
        lastmessage.appendChild(newMessage);
        chatAreaMain.lastElementChild.id = msg._id;
        lastmessagetimestamp.innerHTML = "<b>@" + msg.username + "</b>" + ", " + timeagotext;
      } else {
        const newMessage = document.createElement('div');
        newMessage.id = msg._id;
        newMessage.classList.add('chat-msg', 'owner');
        newMessage.innerHTML = `
        <div class="chat-msg-profile">
        <img class="chat-msg-img" src="https://api.dicebear.com/6.x/initials/svg?seed=${msg.username}&scale=80&backgroundType=gradientLinear&backgroundColor=808080&fontWeight=400" alt="" />
        <div class="chat-msg-date"><b>@${msg.username}</b>, ${timeagotext}</div>
        </div>
        <div class="chat-msg-content">
        <div class="chat-msg-text" id="${msg._id}">${prepareMessage(msg.message)}</div>
        </div>`;
        chatAreaMain.appendChild(newMessage);
      }
    } else {
      const notificationSound = new Audio('/notification.mp3');
      notificationSound.play();
      const previousmessage = chatAreaMain.lastElementChild.querySelector('.chat-msg-img').src;
      const previousmessageusername = previousmessage.split('seed=')[1].split('&')[0];
      if (chatAreaMain.lastElementChild.classList.contains('chat-msg') && !chatAreaMain.lastElementChild.classList.contains('owner') && previousmessageusername === msg.username) {
        const lastmessage = chatAreaMain.lastElementChild.querySelector('.chat-msg-content');
        const lastmessagetimestamp = chatAreaMain.lastElementChild.querySelector('.chat-msg-date');
        const newMessage = document.createElement('div');
        newMessage.classList.add('chat-msg-text');
        newMessage.id = msg._id;
        newMessage.innerHTML = prepareMessage(msg.message);
        lastmessage.appendChild(newMessage);
        chatAreaMain.lastElementChild.id = msg._id;
        lastmessagetimestamp.innerHTML = "<b>@" + msg.username + "</b>" + ", " + timeagotext;
      } else {
        const newMessage = document.createElement('div');
        newMessage.id = msg._id;
        newMessage.classList.add('chat-msg');
        newMessage.innerHTML = `
        <div class="chat-msg-profile">
        <img class="chat-msg-img" src="https://api.dicebear.com/6.x/initials/svg?seed=${msg.username}&scale=80&backgroundType=gradientLinear&backgroundColor=808080&fontWeight=400" alt="" />
        <div class="chat-msg-date"><b>@${msg.username}</b>, ${timeagotext}</div>
        </div>
        <div class="chat-msg-content">
        <div class="chat-msg-text" id="${msg._id}">${prepareMessage(msg.message)}</div>
        </div>`;
        chatAreaMain.appendChild(newMessage);
      }
    }
  } else {
    if (msg.username === username) {
      const newMessage = document.createElement('div');
      newMessage.id = msg._id;
      newMessage.classList.add('chat-msg', 'owner');
      newMessage.innerHTML = `
        <div class="chat-msg-profile">
        <img class="chat-msg-img" src="https://api.dicebear.com/6.x/initials/svg?seed=${msg.username}&scale=80&backgroundType=gradientLinear&backgroundColor=808080&fontWeight=400" alt="" />
        <div class="chat-msg-date"><b>@${msg.username}</b>, ${timeagotext}</div>
        </div>
        <div class="chat-msg-content">
        <div class="chat-msg-text" id="${msg._id}">${prepareMessage(msg.message)}</div>
        </div>`;
      chatAreaMain.appendChild(newMessage);
    } else {
      const notificationSound = new Audio('/notification.mp3');
      notificationSound.play();
      const newMessage = document.createElement('div');
      newMessage.id = msg._id;
      newMessage.classList.add('chat-msg');
      newMessage.innerHTML = `
        <div class="chat-msg-profile">
        <img class="chat-msg-img" src="https://api.dicebear.com/6.x/initials/svg?seed=${msg.username}&scale=80&backgroundType=gradientLinear&backgroundColor=808080&fontWeight=400" alt="" />
        <div class="chat-msg-date"><b>@${msg.username}</b>, ${timeagotext}</div>
        </div>
        <div class="chat-msg-content">
        <div class="chat-msg-text" id="${msg._id}">${prepareMessage(msg.message)}</div>
        </div>`;
      chatAreaMain.appendChild(newMessage);
    }
  }
  const chatMsgText = document.querySelectorAll('.chat-msg-text');
  chatMsgText[chatMsgText.length - 1].scrollIntoView({
    behavior: 'smooth'
  });
});

socket.on('load messages', (messages) => {
  const chatAreaMain = document.querySelector('.chat-area-main');
  chatAreaMain.innerHTML = '';
  messages.forEach((msg) => {
    messageslist.push(msg);
    const convertedtimestamp = new Date(msg.createdAt);
    messagesTimestamps.push(msg._id + "-time-" + convertedtimestamp.getTime());
    const currenttime = new Date();
    const timeago = currenttime - convertedtimestamp;
    let timeagotext = '';
    if (timeago < 60000) {
      timeagotext = 'just now';
    } else if (timeago < 3600000) {
      timeagotext = `${Math.floor(timeago / 60000)} minutes ago`;
    } else if (timeago < 86400000) {
      timeagotext = `${Math.floor(timeago / 3600000)} hours ago`;
    } else {
      timeagotext = `${convertedtimestamp.toLocaleDateString()} ${convertedtimestamp.toLocaleTimeString()}`;
    }
    if (chatAreaMain.lastElementChild) {
      if (msg.username === username) {
        if (chatAreaMain.lastElementChild.classList.contains('chat-msg') && chatAreaMain.lastElementChild.classList.contains('owner')) {
          const lastmessage = chatAreaMain.lastElementChild.querySelector('.chat-msg-content');
          const lastmessagetimestamp = chatAreaMain.lastElementChild.querySelector('.chat-msg-date');
          const newMessage = document.createElement('div');
          newMessage.id = msg._id;
          newMessage.classList.add('chat-msg-text');
          newMessage.innerHTML = prepareMessage(msg.message);
          lastmessage.appendChild(newMessage);
          chatAreaMain.lastElementChild.id = msg._id;
          lastmessagetimestamp.innerHTML = "<b>@" + msg.username + "</b>" + ", " + timeagotext;
        } else {

          const newMessage = document.createElement('div');
          newMessage.id = msg._id;
          newMessage.classList.add('chat-msg', 'owner');
          newMessage.innerHTML = `
        <div class="chat-msg-profile">
        <img class="chat-msg-img" src="https://api.dicebear.com/6.x/initials/svg?seed=${msg.username}&scale=80&backgroundType=gradientLinear&backgroundColor=808080&fontWeight=400" alt="" />
        <div class="chat-msg-date"><b>@${msg.username}</b>, ${timeagotext}</div>
        </div>
        <div class="chat-msg-content">
        <div class="chat-msg-text" id="${msg._id}">${prepareMessage(msg.message)}</div>
        </div>`;
          chatAreaMain.appendChild(newMessage);
        }
      } else {
        const previousmessage = chatAreaMain.lastElementChild.querySelector('.chat-msg-img').src;
        const previousmessageusername = previousmessage.split('seed=')[1].split('&')[0];
        if (chatAreaMain.lastElementChild.classList.contains('chat-msg') && !chatAreaMain.lastElementChild.classList.contains('owner') && previousmessageusername === msg.username) {
          const lastmessage = chatAreaMain.lastElementChild.querySelector('.chat-msg-content');
          const lastmessagetimestamp = chatAreaMain.lastElementChild.querySelector('.chat-msg-date');
          const newMessage = document.createElement('div');
          newMessage.id = msg._id;
          newMessage.classList.add('chat-msg-text');
          newMessage.innerHTML = prepareMessage(msg.message);
          lastmessage.appendChild(newMessage);
          chatAreaMain.lastElementChild.id = msg._id;
          lastmessagetimestamp.innerHTML = "<b>@" + msg.username + "</b>" + ", " + timeagotext;
        } else {

          const newMessage = document.createElement('div');
          newMessage.id = msg._id;
          newMessage.classList.add('chat-msg');
          newMessage.innerHTML = `
          <div class="chat-msg-profile">
          <img class="chat-msg-img" src="https://api.dicebear.com/6.x/initials/svg?seed=${msg.username}&scale=80&backgroundType=gradientLinear&backgroundColor=808080&fontWeight=400" alt="" />
          <div class="chat-msg-date"><b>@${msg.username}</b>, ${timeagotext}</div>
          </div>
          <div class="chat-msg-content">
          <div class="chat-msg-text" id="${msg._id}">${prepareMessage(msg.message)}</div>
          </div>`;
          chatAreaMain.appendChild(newMessage);
        }
      }
    } else {

      if (msg.username === username) {
        const newMessage = document.createElement('div');
        newMessage.id = msg._id;
        newMessage.classList.add('chat-msg', 'owner');
        newMessage.innerHTML = `
          <div class="chat-msg-profile">
          <img class="chat-msg-img" src="https://api.dicebear.com/6.x/initials/svg?seed=${msg.username}&scale=80&backgroundType=gradientLinear&backgroundColor=808080&fontWeight=400" alt="" />
          <div class="chat-msg-date"><b>@${msg.username}</b>, ${timeagotext}</div>
          </div>
          <div class="chat-msg-content">
          <div class="chat-msg-text" id="${msg._id}">${prepareMessage(msg.message)}</div>
          </div>`;
        chatAreaMain.appendChild(newMessage);
      } else {
        const newMessage = document.createElement('div');
        newMessage.id = msg._id;
        newMessage.classList.add('chat-msg');
        newMessage.innerHTML = `
          <div class="chat-msg-profile">
          <img class="chat-msg-img" src="https://api.dicebear.com/6.x/initials/svg?seed=${msg.username}&scale=80&backgroundType=gradientLinear&backgroundColor=808080&fontWeight=400" alt="" />
          <div class="chat-msg-date"><b>@${msg.username}</b>, ${timeagotext}</div>
          </div>
          <div class="chat-msg-content">
          <div class="chat-msg-text" id="${msg._id}">${prepareMessage(msg.message)}</div>
          </div>`;
        chatAreaMain.appendChild(newMessage);
      }
    }
  });
  const chatMsgText = document.querySelectorAll('.chat-msg-text');
  chatMsgText[chatMsgText.length - 1].scrollIntoView({
    behavior: 'smooth'
  });
});

setInterval(() => {
  messagesTimestamps.forEach((timestamp) => {
    let message = document.getElementById(timestamp.split('-time-')[0]);
    if (message.classList.contains('chat-msg-text')) {
      message = message.parentElement.parentElement;
    }
    if (!message) {
      return;
    }
    const msgusername = message.querySelector('.chat-msg-date').innerHTML.split(',')[0];
    const timestampdata = timestamp.split('-time-')[1];
    const currenttime = new Date();
    const timeago = currenttime - timestampdata;
    let timeagotext = '';
    if (timeago < 60000) {
      timeagotext = 'just now';
    }
    else if (timeago < 3600000) {
      if (Math.floor(timeago / 60000) === 1) {
        timeagotext = `${Math.floor(timeago / 60000)} minute ago`;
      } else {
        timeagotext = `${Math.floor(timeago / 60000)} minutes ago`;
      }
    } else if (timeago < 86400000) {
      timeagotext = `${Math.floor(timeago / 3600000)} hours ago`;
    } else {
      timeagotext = `${new Date(timestampdata).toLocaleDateString()} ${new Date(timestampdata).toLocaleTimeString()}`;
    }
    const messagetimestamp = message.querySelector('.chat-msg-date');
    if (!messagetimestamp) {
      return;
    }
    messagetimestamp.innerHTML = "";
    messagetimestamp.innerHTML = "<b>" + msgusername + "</b>" + ", " + timeagotext;
  });
}
  , 60000);

const searchbar = document.getElementById('searchbar');
const searchresultscontainer = document.getElementById('searchresults');

searchbar.addEventListener('keydown', (e) => {
  if (e.key === 'Backspace' && searchbar.value.length <= 1) {
    if (searchbar.classList.contains('search-withresults')) {
      searchbar.classList.remove('search-withresults');
      searchbar.classList.add('search-noresults');
      searchresultscontainer.innerHTML = '';
      $('#searchresults').hide();
    }
  } else if (e.key !== 'Backspace') {
    if (searchbar.classList.contains('search-noresults')) {
      $('#searchresults').show();
      searchbar.classList.remove('search-noresults');
      searchbar.classList.add('search-withresults');
    }
  }
  $('#searchresults').show();
  if (searchbar.value.length < 2) {
    $('#searchresults').hide();
    return;
  }
  const searchresults = [];
  messageslist.forEach((msg) => {
    if (searchresults.length > 10) {
      return;
    }
    if (msg.message.toLowerCase().includes(searchbar.value.toLowerCase())) {
      searchresults.push(msg);
    }
  });
  searchresultscontainer.innerHTML = '';
  searchresults.forEach((msg) => {
    const searchresult = document.createElement('div');
    searchresult.classList.add('searchresult');
    searchresult.innerHTML = `
    <div class="searchresult-username"><b>${msg.username}</b></div>
    <div class="searchresult-message">${prepareMessage(msg.message)}</div>
    <div class="searchresult-separator"></div>
    `;
    searchresultscontainer.appendChild(searchresult);
  });
  if (searchresults.length === 0) {
    $('#searchresults').hide();
  }
});

const searchbgblur = document.getElementsByClassName('search-popup');
const emojiSelector = document.getElementById('emoji-selector');
const showemojiselector = document.getElementById('show-emoji-selector');

window.onclick = function (event) {
  if (event.target === searchbgblur[0]) {
    searchbgblur[0].style.display = 'none';
  }
  if (event.target !== emojiSelector && !emojiSelector.contains(event.target) && event.target !== showemojiselector) {
    emojiSelector.style.display = 'none';
    emojiSelector.innerHTML = '';
  }
}

const opensearchbutton = document.getElementById('circle-search');
opensearchbutton.addEventListener('click', () => {
  searchbar.value = '';
  $('#searchresults').hide();
  if (searchbar.classList.contains('search-withresults')) {
    searchbar.classList.remove('search-withresults');
    searchbar.classList.add('search-noresults');
    searchresultscontainer.innerHTML = '';
  }
  searchbgblur[0].style.display = 'flex';
  searchbar.focus();
});

showemojiselector.addEventListener('click', () => {
  emojiSelector.innerHTML = '';
  emojiSelector.removeAttribute('style');
  const messageinputbar = document.getElementById('message-input');
  const pickerOptions = {
    onEmojiSelect:
      (emoji) => {
        messageinputbar.value += ":" + emoji.id + ":";
      },
    theme: theme,
    custom: custom
  }
  const picker = new EmojiMart.Picker(pickerOptions)
  emojiSelector.appendChild(picker)
});