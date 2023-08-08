$('#ratelimitalert').hide();
$('#room-settings').hide();
$('#create-room-name').hide();
$('#replyingtotext').hide();
$('#editingmsgtext').hide();
$('#cancelreplyoredit').hide();
$('#circle-selector').hide();
const socket = io();
const notificationSound = document.getElementById('notification');
let username = '';
let translatemessages = false;
let currentRoom = '';
let truncatedroomname
let earthymsgtimeout;
let earthyenabled = false;
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js'
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js'
const urlParams = new URLSearchParams(window.location.search);
const urlroom = urlParams.get('room');
let joined = false;
const showexperimentspopup = urlParams.get('experimentsenabled');
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
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

function messagesTooltip(element, allowreply, allowedit, allowdelete) {
    const tooltipelement = document.createElement('div');
    tooltipelement.classList.add('messageoptions');
    if (allowreply === true) {
        const replyButton = $('<button>').attr('id', `replybtn-${element.id}`).html(`<svg xmlns="http://www.w3.org/2000/svg" id="replybtn-${element.id}" viewBox="0 0 512 512" width="18" height="13"><path id="replybtn-${element.id}" d="M205 34.8c11.5 5.1 19 16.6 19 29.2v64H336c97.2 0 176 78.8 176 176c0 113.3-81.5 163.9-100.2 174.1c-2.5 1.4-5.3 1.9-8.1 1.9c-10.9 0-19.7-8.9-19.7-19.7c0-7.5 4.3-14.4 9.8-19.5c9.4-8.8 22.2-26.4 22.2-56.7c0-53-43-96-96-96H224v64c0 12.6-7.4 24.1-19 29.2s-25 3-34.4-5.4l-160-144C3.9 225.7 0 217.1 0 208s3.9-17.7 10.6-23.8l160-144c9.4-8.5 22.9-10.6 34.4-5.4z" /></svg>`)
        $(tooltipelement).append(replyButton);
    }
    if (allowedit === true) {
        const editButton = $('<button>').attr('id', `editbtn-${element.id}`).html(`<svg fill="#000000" version="1.1" id="editbtn-${element.id}" xmlns="http://www.w3.org/2000/svg" width="18" height="13" xmlns:xlink="http://www.w3.org/1999/xlink" width="800px" height="800px" viewBox="0 0 528.899 528.899" xml:space="preserve"><g><path id="editbtn-${element.id}" d="M328.883,89.125l107.59,107.589l-272.34,272.34L56.604,361.465L328.883,89.125z M518.113,63.177l-47.981-47.981 c-18.543-18.543-48.653-18.543-67.259,0l-45.961,45.961l107.59,107.59l53.611-53.611 C532.495,100.753,532.495,77.559,518.113,63.177z M0.3,512.69c-1.958,8.812,5.998,16.708,14.811,14.565l119.891-29.069 L27.473,390.597L0.3,512.69z" /></g></svg>`)
        $(tooltipelement).append(editButton);
    }
    if (allowdelete === true) {
        const delButton = $('<button>').attr('id', `delbtn-${element.id}`).html(`<svg width="18" height="13" id="delbtn-${element.id}" viewBox="0 0 16 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path id="delbtn-${element.id}" d="M11.681 2.41458C11.7194 2.55015 11.874 2.66 12.0286 2.66H15.0175C15.5603 2.66 16 3.05682 16 3.54666C16 3.95141 15.6996 4.29181 15.2906 4.39869L14.7774 17.1327C14.7358 18.1687 13.7807 19 12.6294 19H3.37062C2.22147 19 1.26424 18.1678 1.22258 17.1327L0.709425 4.39869C0.300438 4.29181 0 3.95141 0 3.54666C0 3.05682 0.439696 2.66 0.982467 2.66H3.97141C4.12602 2.66 4.28173 2.54817 4.31901 2.41458L4.52844 1.65557C4.78831 0.717461 5.80587 0 6.87606 0H9.12388C10.1952 0 11.2116 0.717436 11.4715 1.65557L11.681 2.41458ZM7.29835 6.71337V15.3267C7.29835 15.676 7.61305 15.96 8.00011 15.96C8.38718 15.96 8.70187 15.676 8.70187 15.3267V6.71337C8.70187 6.36405 8.38718 6.08004 8.00011 6.08004C7.61305 6.08004 7.29835 6.36405 7.29835 6.71337ZM4.07025 6.73217L4.35095 15.3455C4.36301 15.6948 4.68648 15.9699 5.07354 15.96C5.46061 15.9491 5.76542 15.6572 5.75448 15.3079L5.47377 6.69458C5.46171 6.34526 5.13824 6.07016 4.75118 6.08004C4.36412 6.09093 4.0593 6.38285 4.07025 6.73217ZM10.5265 6.69457L10.2458 15.3078C10.2348 15.6572 10.5396 15.9491 10.9267 15.96C11.3137 15.9699 11.6372 15.6948 11.6493 15.3454L11.93 6.73216C11.9409 6.38284 11.6361 6.09093 11.249 6.08003C10.862 6.07014 10.5385 6.34525 10.5265 6.69457ZM6.41553 2.66H9.58441C9.66117 2.66 9.70941 2.60558 9.69077 2.53829L9.56467 2.08505C9.5241 1.93661 9.29274 1.77332 9.12388 1.77332H6.87606C6.7072 1.77332 6.47583 1.93661 6.43527 2.08505L6.30917 2.53829C6.29053 2.60657 6.33877 2.66 6.41553 2.66H6.41553Z" fill="#000000" /></svg>`)
        $(tooltipelement).append(delButton);
    }
    const instance = tippy(element, {
        content: tooltipelement.innerHTML,
        theme: 'light',
        placement: 'top',
        arrow: false,
        interactive: true,
        allowHTML: true,
    });
}
function prepareMessage(message, username) {
    const mentionRegex = `@(${username})\\b`;
    const earthyRegex = `@(Earthy)\\b`;
    const linkRegex = /(https?:\/\/\S+)/g;
    const highlightClass = "highlight";
    const earthyClass = "earthymention";
    const mentionClass = "mention";
    const mentionhighlightedMessage = message.replace(mentionRegex, (match, mention) => {
        return `<span class="${mentionClass}">${mention}</span>`;
    });
    const highlightedMessage = mentionhighlightedMessage.replace(earthyRegex, (match, mention) => {
        return `<span class="${earthyClass}">${mention}</span>`;
    });

    const highlightRegex = new RegExp(`@(${username})\\b`, "gi");
    const highlightedAndHighlightedMessage = highlightedMessage.replace(highlightRegex, (match, username) => {
        return `<span class="${highlightClass}">@${username}</span>`;
    });
    const finalMessage = highlightedAndHighlightedMessage.replace(linkRegex, (match, url) => {
        return `<a class="userlink" href="${url}" target="_blank">${url}</a>`;
    });
    return finalMessage;
}

socket.on('user data', (userdata) => {
    translatemessages = userdata.translatemessages;
    if (urlroom) {
        currentRoom = urlroom;
    } else {
        currentRoom = "Main";
    }
    earthyenabled = userdata.earthyenabled;
    if (earthyenabled === true) {
        $('#roomname-Earthy').show();
    }
    username = userdata.username;
    $('#username-popup').hide();
    $('#circle-selector').show();
    $('#chat-window').show();
    if (joined === false) {
        socket.emit('join room', currentRoom, username);
        joined = true;
    }
    if (currentRoom === "Earthy") {
        $('#current-room').text("Ask Earthy (Private Chat)");
    } else {
        $('#current-room').text(currentRoom);
    }
    document.title = `Neeter - ${currentRoom}`
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('room', currentRoom);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({}, '', newUrl);
    const selectedCircle = document.getElementById(currentRoom);
    selectedCircle.classList.add('selected');
});

const backbutton = document.getElementById('back-button');
backbutton.addEventListener('click', () => {
    const auth = getAuth();
    auth.signOut().then(() => {
        location.href = '/login';
    });
}, { once: true });

const circlesettingsbutton = document.getElementById('room-settings');
circlesettingsbutton.addEventListener('click', function (event) {
    event.preventDefault();
    socket.emit('get room settings', currentRoom);
});

getAuth().onAuthStateChanged((user) => {
    if (user) {
        socket.emit('user data', user.uid);
    } else {
        window.location.href = '/login';
    }
}, { once: true });

socket.on('room settings', (roomsettingsdata, roomsettingsname) => {
    $('#chat-window').hide();
    $('#circlesettings-window').show();
    $('#circle-name').val(roomsettingsname);
    $('#circle-emoji').val(roomsettingsdata.emoji);
    $('#circle-description').val(roomsettingsdata.description);
});

const circlesettingsbackbutton = document.getElementById('circlesettings-back-button');
circlesettingsbackbutton.addEventListener('click', function (event) {
    event.preventDefault();
    $('#circlesettings-window').hide();
    $('#chat-window').show();
});

const circleSettingsSaveButton = document.getElementById('circlesettings-save-button');
circleSettingsSaveButton.addEventListener('click', function (event) {
    event.preventDefault();
    oldroomname = currentRoom;
    socket.emit('update room settings', currentRoom, $('#circle-description').val(), $('#circle-emoji').val(), $('#circle-name').val());
    currentRoom = $('#circle-name').val();
    if ($('#circle-description').val() !== '') {
        $('#current-room-description').show();
        $('#current-room').text($('#circle-emoji').val() + currentRoom);
        $('#current-room-description').text($('#circle-description').val());
    } else {
        $('#current-room').text($('#circle-emoji').val() + currentRoom);
        $('#current-room-description').hide();
    }
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('room', currentRoom);
    history.pushState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
    document.title = `Neeter - ${currentRoom}`
    if ($('#circle-name').val() !== '') {
        socket.emit('room renamed', $('#circle-name').val(), oldroomname);
    }
});

let responsetomsg = '';
let isaresponse = false;
let msgresponsetousername = '';
let editingmsg = false;
let editingmessageid = '';
let editedtext = '';

const replyeditcancelbtn = document.getElementById('cancelreplyoredit');
const sendoreditbutton = document.getElementById('sendbtn');
const messageinput = document.getElementById('message');
replyeditcancelbtn.addEventListener('click', function (event) {
    event.preventDefault();
    if (editingmsg === true) {
        editingmsg = false;
        editingmessageid = '';
        editedtext = '';
        $('#editingmsgtext').hide();
        $('#message').val('');
    }
    if (isaresponse === true) {
        responsetomsg = '';
        msgresponsetousername = '';
        isaresponse = false
        $('#replyingtotext').hide();
        $('#message').val('');
    }
    $('#cancelreplyoredit').hide();
    $('#sendbtn').html("<svg id=\"Group_10235\" data-name=\"Group 10235\" xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"13\" viewBox=\"0 0 173.64 149.826\"><path id=\"Path_8370\" data-name=\"Path 8370\" d=\"M163.3,94.537,23.2,36.4A16.767,16.767,0,0,0,.529,56.035L13,104.936H74.053a5.087,5.087,0,0,1,0,10.175H13l-12.47,48.9A16.768,16.768,0,0,0,23.2,183.643l140.1-58.132a16.767,16.767,0,0,0,0-30.974Z\" transform=\"translate(-0.001 -35.111)\"/></svg>");
});

messageinput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendoreditbutton.click();
    }
});

$('#message-form').submit(() => {
    const message = $('#message').val();
    if (editingmsg === true) {
        socket.emit('edit message', editingmessageid, message);
    } else {
        if (currentRoom === "Earthy") {
            $('#messages').empty();
            const aimessageid = getRandomInt(99999);
            let li = $('<li>').attr('id', `msg-ai-${aimessageid}`).attr('class', 'msgelement').html(prepareMessage(`<div class="usernametextplacement"><b class="usernametext">${username}</b></div><span class="messagecontent">${message}</span> (Message only visible to you)`));
            $('#messages').append(li);
            const date = new Date();
            const airesponseid = getRandomInt(9999);
            socket.emit('message to ai', message, username, currentRoom, date, airesponseid);
            const aili = $('<li>').attr('id', `msg-ai-${airesponseid}`).attr('class', 'msgelement').html(prepareMessage(`Earthy is writing... (Message only visible to you)`));
            $('#messages').append(aili);
            earthymsgtimeout = setTimeout(() => {
                $(`#msg-ai-${airesponseid}`).html(prepareMessage(`<b>Error on Earthy message</b> - Do you have Earthy access? (Message only visible to you)`));
            }, 10000);
        } else {
            socket.emit('chat message', message, username, currentRoom, isaresponse, responsetomsg, msgresponsetousername);
        }
    }
    $('#message').val('');
    $('#char-count').text(``);
    isaresponse = false;
    responsetomsg = '';
    msgresponsetousername = '';
    editingmsg = false;
    editingmessageid = '';
    editedtext = '';
    $('#replyingtotext').hide();
    $('#cancelreplyoredit').hide();
    window.scrollTo({
        top: document.body.scrollHeight,
        left: 0,
        behavior: 'smooth'
    });
    $('#sendbtn').html("<svg id=\"Group_10235\" data-name=\"Group 10235\" xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"13\" viewBox=\"0 0 173.64 149.826\"><path id=\"Path_8370\" data-name=\"Path 8370\" d=\"M163.3,94.537,23.2,36.4A16.767,16.767,0,0,0,.529,56.035L13,104.936H74.053a5.087,5.087,0,0,1,0,10.175H13l-12.47,48.9A16.768,16.768,0,0,0,23.2,183.643l140.1-58.132a16.767,16.767,0,0,0,0-30.974Z\" transform=\"translate(-0.001 -35.111)\"/></svg>");
    $('#editingmsgtext').hide();
    return false;
});

$('#message').on('input', () => {
    const message = $('#message').val();
    const charCount = message.length;
    if (charCount >= 1500) {
        $('#char-count').text(`${charCount}/2000`);
        $('#char-count').addClass('warning');
    } else {
        $('#char-count').text(``);
        $('#char-count').removeClass('warning');
    }
});

socket.on('msgratelimit', (msg, senderusername, room) => {
    if (room === currentRoom) {
        if (senderusername === username) {
            $('#message').val(msg);
            const message = $('#message').val();
            const charCount = message.length;
            if (charCount >= 1500) {
                $('#char-count').text(`${charCount}/2000`);
                $('#char-count').addClass('warning');
            } else {
                $('#char-count').text(``);
                $('#char-count').removeClass('warning');
            };
            $('#ratelimitalert').show();
            setTimeout(() => {
                $('#ratelimitalert').hide();
            }, 3000);
        }
    }
});

socket.on('rooms list', (roomslist) => {
    const grid = document.querySelector('.circle-grid');
    grid.innerHTML = '';
    const tippyInstances = [];
    roomslist.forEach(roomname => {
        let li = document.createElement('li');
        const div = document.createElement('div');
        const img = document.createElement('img');
        truncatedroomname = truncateText(roomname, 40);
        if (roomname === "Main") {
            img.src = `https://i.postimg.cc/LXf1X1G8/A6-D8-FA76-5-BB0-4302-82-FC-90070062-C9-DA.png`;
        } else if (roomname === "Earthy") {
            img.src = `https://i.postimg.cc/prRpL1Ds/earthy-icon.png`
        } else {
            img.src = `https://api.dicebear.com/6.x/initials/svg?seed=${truncatedroomname}&scale=80&backgroundType=gradientLinear&backgroundColor=808080&fontWeight=400`;
        }
        img.alt = roomname;
        img.id = roomname;
        div.classList.add('circle');
        div.id = `roomname-${roomname}`;
        div.appendChild(img);
        li.appendChild(div);
        grid.appendChild(li);
        img.addEventListener('click', (event) => {
            event.preventDefault();
            $('#messages').empty();
            currentRoom = roomname;
            if (currentRoom === "Earthy") {
                $('#current-room').text("Ask Earthy (Private Chat)");
            } else {
                $('#current-room').text(currentRoom);
            }
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('room', currentRoom);
            const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
            window.history.pushState({}, '', newUrl);
            socket.emit('join room', currentRoom, username);
            document.title = `Neeter - ${currentRoom}`;
            const selected = document.querySelector('.selected');
            if (selected) {
                selected.classList.remove('selected');
            }
            img.classList.add('selected');
        });
        const instance = tippy(div, {
            content: truncateText(roomname, 40),
            theme: 'light',
            placement: 'top',
            arrow: false,
        });
        tippyInstances.push(instance);
    });
    tippy.createSingleton(tippyInstances, {
        placement: 'top',
        theme: 'light',
        moveTransition: 'transform 0.2s ease-out',
        arrow: false,
        appendTo: () => document.body,
    });
    if (currentRoom) {
        const selectedCircle = document.getElementById(currentRoom);
        selectedCircle.classList.add('selected');
    }
    $('#roomname-Earthy').hide();
});

function convertMarkdownToHTML(markdown) {
    const converter = new showdown.Converter({ breaks: true, simpleLineBreaks: true });
    const html = converter.makeHtml(markdown);
    const parser = new DOMParser();
    const parsedHtml = parser.parseFromString(html, 'text/html');
    const innerHtml = parsedHtml.body.firstChild.innerHTML;
    return innerHtml;
}

function truncateText(text, maxLength) {
    if (text.length > maxLength) {
        return text.slice(0, maxLength) + '...';
    } else {
        return text;
    }
}

socket.on('room name changed', (newchangedroomname, newroomsettings) => {
    currentRoom = newchangedroomname;
    if (newroomsettings.description) {
        if (newroomsettings.emoji) {
            $('#current-room-description').show();
            $('#current-room-description').text(newroomsettings.description);
            $('#current-room').text(newroomsettings.emoji + currentRoom);
        } else {
            $('#current-room-description').show();
            $('#current-room-description').text(newroomsettings.description);
            if (currentRoom === 'Earthy') {
                $('#current-room').text("Ask Earthy (Private Chat)");
            } else {
                $('#current-room').text(currentRoom);
            }
        }
    } else {
        if (newroomsettings.emoji) {
            $('#current-room-description').hide();
            $('#current-room').text(newroomsettings.emoji + currentRoom);
        } else {
            $('#current-room-description').hide();
            if (currentRoom === 'Earthy') {
                $('#current-room').text("Ask Earthy (Private Chat)");
            } else {
                $('#current-room').text(currentRoom);
            }
        }
    }
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('room', currentRoom);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({}, '', newUrl);
    document.title = `Neeter - ${currentRoom}`
    socket.emit('change room name from socket', currentRoom);
});

const messagesParentElement = document.getElementById("messages");
messagesParentElement.addEventListener("click", (event) => {
    if (event.target && event.target.id === "usernametext") {
        const popup = document.createElement("div");
        popup.classList.add("userpopup");

        const h1 = document.createElement("h1");
        h1.textContent = event.target.textContent;

        popup.appendChild(h1);
        document.body.appendChild(popup);
    }
});

window.addEventListener('click', ({ target }) => {
    const popups = document.querySelectorAll('.userpopup');
    const popup = target.closest('.userpopup');
    const clickedOnClosedPopup = popup && popup.classList.contains('closed');
    if (clickedOnClosedPopup) return;
    popups.forEach(p => $('.userpopup').hide());
    if (popup) popup.classList.add('show');
});

socket.on('chat message', (msg, room, roominfo, msgisresponse, msgresponseto) => {
    if (msg.room === currentRoom) {
        if (translatemessages === true) {
            var userLang = navigator.language || navigator.userLanguage;
            const toLang = userLang;
            const translateurl = `https://api.neeter.co/api/gtranslate`;
            fetch(translateurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: msg.message,
                    language: toLang
                })
            }).then(response => response.json()).then(data => {
                if (data.translatedMessage) {
                    const msgElement = document.getElementById(`msg-${msg._id}`);
                    const messageContent = msgElement.querySelector('.messagecontent');
                    messageContent.textContent = data.translatedMessage;
                }
            }).catch((error) => {
                console.error('Error:', error);
            });
        }
        if (document.getElementById('nomsgs')) {
            document.getElementById('nomsgs').remove();
        }
        const htmlmdmsg = convertMarkdownToHTML(msg.message);
        editedtext = '';
        if (msg.edited === true) {
            editedtext = '(edited) ';
        }
        if (msg.username !== username) {
            if (msgisresponse === true) {
                const messagereplyingto = $(`#msg-${msgresponseto} .messagecontent`).text();
                let finalmessagereplyingto = messagereplyingto.substring(0, 60);
                if (messagereplyingto.length > 60) {
                    finalmessagereplyingto = finalmessagereplyingto + '...';
                }
                let li = $('<li>').attr('id', `msg-${msg._id}`).attr('class', 'msgelement').html(prepareMessage(`<span class="replyingtocontent">${finalmessagereplyingto}</span><div class="usernametextplacement"><b class="usernametext">${msg.username}</b></div> <span class="messagecontent">${htmlmdmsg} ${editedtext}</span>`, username));
                let allowreply = false;
                let allowedit = false;
                let allowdelete = false;
                allowreply = true;
                if (msg.roomowner === username) {
                    allowdelete = true;
                }
                li.innerHTML = prepareMessage(htmlmdmsg, username);
                $('#messages').append(li);
                li = document.getElementById(`msg-${msg._id}`);
                messagesTooltip(li, allowreply, allowedit, allowdelete);
                notificationSound.play();
            } else if (msgisresponse === false) {
                let li = $('<li>').attr('id', `msg-${msg._id}`).attr('class', 'msgelement').html(prepareMessage(`<div class="usernametextplacement"><b class="usernametext">${msg.username}</b></div><span class="messagecontent">${htmlmdmsg} ${editedtext}</span>`, username));
                let allowreply = false;
                let allowedit = false;
                let allowdelete = false;
                allowreply = true;

                if (msg.roomowner === username) {
                    allowdelete = true;
                }
                li.innerHTML = prepareMessage(htmlmdmsg, username);
                $('#messages').append(li);
                li = document.getElementById(`msg-${msg._id}`);
                messagesTooltip(li, allowreply, allowedit, allowdelete);
                notificationSound.play();
            }
        } else if (msg.username === username || roominfo === username) {
            if (msgisresponse === true) {
                const messagereplyingto = $(`#msg-${msgresponseto} .messagecontent`).text();
                let finalmessagereplyingto = messagereplyingto.substring(0, 60);
                if (messagereplyingto.length > 60) {
                    finalmessagereplyingto = finalmessagereplyingto + '...';
                }
                let li = $('<li>').attr('id', `msg-${msg._id}`).attr('class', 'msgelement').html(prepareMessage(`<span class="replyingtocontent">${finalmessagereplyingto}</span><div class="usernametextplacement"><b class="usernametext">${msg.username}</b></div> <span class="messagecontent">${htmlmdmsg} ${editedtext}</span>`, username));
                let allowreply = false;
                let allowedit = false;
                let allowdelete = false;
                allowreply = true;
                if (msg.username === username) {
                    allowedit = true;
                    allowdelete = true;
                }
                li.innerHTML = prepareMessage(htmlmdmsg, username);
                $('#messages').append(li);
                li = document.getElementById(`msg-${msg._id}`);
                messagesTooltip(li, allowreply, allowedit, allowdelete);

                $('#ratelimitalert').hide();
                /* $(`#msg-${msg._id}`).hover(function () {
                    $(`#msg-${msg._id} #replybtn`).removeClass('notshowing');
                    $(`#msg-${msg._id} #replybtn`).addClass('showing');
                    $(`#msg-${msg._id} #deletebtn`).removeClass('notshowing');
                    $(`#msg-${msg._id} #deletebtn`).addClass('showing');
                    $(`#msg-${msg._id} #editbtn`).removeClass('notshowing');
                    $(`#msg-${msg._id} #editbtn`).addClass('showing');
                }
                    , function () {
                        $(`#msg-${msg._id} #replybtn`).removeClass('showing');
                        $(`#msg-${msg._id} #replybtn`).addClass('notshowing');
                        $(`#msg-${msg._id} #deletebtn`).removeClass('showing');
                        $(`#msg-${msg._id} #deletebtn`).addClass('notshowing');
                        $(`#msg-${msg._id} #editbtn`).removeClass('showing');
                        $(`#msg-${msg._id} #editbtn`).addClass('notshowing');
                    }
                ); */
            } else if (msgisresponse === false) {
                let li = $('<li>').attr('id', `msg-${msg._id}`).attr('class', 'msgelement').html(prepareMessage(`<div class="usernametextplacement"><b class="usernametext">${msg.username}</b></div><span class="messagecontent">${htmlmdmsg} ${editedtext}</span>`, username));
                let allowreply = false;
                let allowedit = false;
                let allowdelete = false;
                allowreply = true;
                if (msg.username === username) {
                    allowedit = true;
                    allowdelete = true;
                }
                li.innerHTML = prepareMessage(htmlmdmsg, username);
                $('#messages').append(li);
                li = document.getElementById(`msg-${msg._id}`);
                messagesTooltip(li, allowreply, allowedit, allowdelete);
                $('#ratelimitalert').hide();
            }
        }
        const isScrolledToBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight;
        if (isScrolledToBottom === true) {
            window.scrollTo({
                top: document.body.scrollHeight,
                left: 0,
                behavior: 'smooth'
            });
        }
    }
});

socket.on('load messages', (messages) => {
    const msgselement = document.getElementById("messages");
    while (msgselement.firstChild) {
        msgselement.removeChild(msgselement.firstChild);
    }
    messages.forEach((msg) => {
        if (msg.room === currentRoom) {
            const htmlmdmsg = convertMarkdownToHTML(msg.message);
            if (msg.edited === true) {
                editedtext = '(edited) ';
            } else {
                editedtext = '';
            };
            if (msg.username !== username) {
                if (msg.isresponse === true) {
                    const messagereplyingto = $(`#msg-${msg.responsetomessage} .messagecontent`).text();
                    let finalmessagereplyingto = messagereplyingto.substring(0, 60);
                    if (messagereplyingto.length > 60) {
                        finalmessagereplyingto = finalmessagereplyingto + '...';
                    }
                    let li = $('<li>').attr('id', `msg-${msg._id}`).attr('class', 'msgelement').html(prepareMessage(`<span class="replyingtocontent">${finalmessagereplyingto}</span><b class="usernametext">${msg.username}</b> <span class="messagecontent">${htmlmdmsg} ${editedtext}</span>`, username));
                    li.innerHTML = prepareMessage(htmlmdmsg, username);
                    $('#messages').append(li);
                    li = document.getElementById(`msg-${msg._id}`);
                    let allowreply = false;
                    let allowedit = false;
                    let allowdelete = false;
                    allowreply = true;
                    if (msg.roomowner === username) {
                        allowdelete = true;
                        allowedit = true;
                    }
                    messagesTooltip(li, allowreply, allowedit, allowdelete);
                } else if (msg.isresponse === false) {
                    let li = $('<li>').attr('id', `msg-${msg._id}`).attr('class', 'msgelement').html(prepareMessage(`<div class="usernametextplacement"><b class="usernametext">${msg.username}</b></div><span class="messagecontent">${htmlmdmsg} ${editedtext}</span>`, username));
                    let delButton = null;
                    li.innerHTML = prepareMessage(htmlmdmsg, username);
                    $('#messages').append(li);
                    li = document.getElementById(`msg-${msg._id}`);
                    let allowdelete = false;
                    let allowedit = false;
                    let allowreply = false;
                    allowreply = true;
                    if (msg.roomowner === username) {
                        allowdelete = true;
                    }
                    messagesTooltip(li, allowreply, allowedit, allowdelete);
                }
            } else if (msg.username === username) {
                if (msg.isresponse === true) {
                    const messagereplyingto = $(`#msg-${msg.responsetomessage} .messagecontent`).text();
                    let finalmessagereplyingto = messagereplyingto.substring(0, 60);
                    if (messagereplyingto.length > 60) {
                        finalmessagereplyingto = finalmessagereplyingto + '...';
                    }
                    let li = $('<li>').attr('id', `msg-${msg._id}`).attr('class', 'msgelement').html(prepareMessage(`<span class="replyingtocontent">${finalmessagereplyingto}</span><b class="usernametext">${msg.username}</b> <span class="messagecontent">${htmlmdmsg} ${editedtext}</span>`, username));
                    let allowreply = false;
                    let allowedit = false;
                    let allowdelete = false;
                    allowreply = true;
                    allowedit = true;
                    allowdelete = true;
                    li.innerHTML = prepareMessage(htmlmdmsg, username);
                    $('#messages').append(li);
                    li = document.getElementById(`msg-${msg._id}`);
                    messagesTooltip(li, allowreply, allowedit, allowdelete);
                } else if (msg.isresponse === false) {
                    let li = $('<li>').attr('id', `msg-${msg._id}`).attr('class', 'msgelement').html(prepareMessage(`<div class="usernametextplacement"><b class="usernametext">${msg.username}</b></div><span class="messagecontent">${htmlmdmsg} ${editedtext}</span>`, username));
                    let allowreply = false;
                    let allowedit = false;
                    let allowdelete = false;
                    allowreply = true;
                    allowedit = true;
                    allowdelete = true;
                    li.innerHTML = prepareMessage(htmlmdmsg, username);
                    $('#messages').append(li);
                    li = document.getElementById(`msg-${msg._id}`);
                    messagesTooltip(li, allowreply, allowedit, allowdelete);

                }
            }

        }
    });
    if (messages.length === 0) {
        if (currentRoom === 'Earthy') {
            let li = $('<li>').attr('id', 'nomsgs').html("<b>Looks like you have no messages with Earthy yet... Why not send one and see what he answers?</b> Also remember that Earthy doesn't has a chat history yet.");
            $('#messages').append(li);
        } else {
            let li = $('<li>').attr('id', 'nomsgs').html('<b>This circle looks empty... Why not send a message to spice things up?</b>');
            $('#messages').append(li);
        }
    }
    if (translatemessages === true) {
        const last15messages = messages.slice(Math.max(messages.length - 15, 0));
        last15messages.forEach((msg) => {
            var userLang = navigator.language || navigator.userLanguage;
            const toLang = userLang;
            const translateurl = `https://api.neeter.co/api/gtranslate`;
            fetch(translateurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: msg.message,
                    language: toLang
                })
            }).then(response => response.json()).then(data => {
                if (data.translatedMessage) {
                    setTimeout(() => {
                    }, 1000);
                    const msgElement = document.getElementById(`msg-${msg._id}`);
                    const messageContent = msgElement.querySelector('.messagecontent');
                    messageContent.innerHTML = prepareMessage(data.translatedMessage, username);
                }
            }).catch((error) => {
                console.error('Error:', error);
            });
            setTimeout(() => {
            }, 1000);
        });
    }
    window.scrollTo({
        top: document.body.scrollHeight,
        left: 0,
        behavior: 'smooth'
    });
});

socket.on('message deleted', (msgId) => {
    $(`#msg-${msgId}`).remove();
    if ($('#messages').children().length === 0) {
        if (currentRoom === 'Earthy') {
            let li = $('<li>').attr('id', 'nomsgs').html("<b>Looks like you have no messages with Earthy yet... Why not send one and see what he answers?</b> Also remember that Earthy doesn't has a chat history yet.");
            $('#messages').append(li);
        } else {
            let li = $('<li>').attr('id', 'nomsgs').html('<b>This circle looks empty... Why not send a message to spice things up?</b>');
            $('#messages').append(li);
        }
    }
});

socket.on('user connected', (usrname, isowner, roomsettingsdata) => {
    if (isowner) {
        if (currentRoom === 'Earthy') {
            $('#room-settings').hide();
        } else {
            $('#room-settings').show();
        }
    }
    if (roomsettingsdata.description) {
        if (roomsettingsdata.emoji) {
            $('#current-room-description').show();
            $('#current-room-description').text(roomsettingsdata.description);
            $('#current-room').text(roomsettingsdata.emoji + currentRoom);
        } else {
            $('#current-room-description').show();
            $('#current-room-description').text(roomsettingsdata.description);
            if (currentRoom === 'Earthy') {
                $('#current-room').text("Ask Earthy (Private Chat)");
            } else {
                $('#current-room').text(currentRoom);
            }
        }
    } else {
        if (roomsettingsdata.emoji) {
            $('#current-room-description').hide()
            $('#current-room').text(roomsettingsdata.emoji + currentRoom);
        } else {
            $('#current-room-description').hide()
            if (currentRoom === 'Earthy') {
                $('#current-room').text("Ask Earthy (Private Chat)");
            } else {
                $('#current-room').text(currentRoom);
            }
        }
    }
});

socket.on('message edited', (messageEditingID, newMessage) => {
    if (newMessage.isresponse === true) {
        const messagereplyingto = $(`#msg-${newMessage.responsetomessage} .messagecontent`).text();
        let finalmessagereplyingto = messagereplyingto.substring(0, 60);
        if (messagereplyingto.length > 60) {
            finalmessagereplyingto = finalmessagereplyingto + '...';
        }
        let li = $('<li>').attr('id', `msg-${newMessage._id}`).attr('class', 'msgelement').html(prepareMessage(`<span class="replyingtocontent">${finalmessagereplyingto}</span><div class="usernametextplacement"><b class="usernametext">${newMessage.username}</b></div> <span class="messagecontent>${newMessage.message} (edited) </span>`, username));
        let repliesenabled = false;
        let editsenabled = false;
        let deletesenabled = false;
        repliesenabled = true;

        if (newMessage.username === username) {
            editsenabled = true;
            deletesenabled = true;
        }
        $(`#msg-${messageEditingID}`).replaceWith(li);
        $('#ratelimitalert').hide();
        messageoptions.append(delButton);
        li.innerHTML = prepareMessage(newMessage.message, username);
        $('#messages').append(li);
        li = document.getElementById(`msg-${newMessage._id}`);
        messagesTooltip(li, repliesenabled, editsenabled, deletesenabled);

    } else if (newMessage.isresponse === false) {
        let li = $('<li>').attr('id', `msg-${newMessage._id}`).attr('class', 'msgelement').html(prepareMessage(`<div class="usernametextplacement"><b class="usernametext">${newMessage.username}</b></div><span class="messagecontent"><span class="messagecontent">${newMessage.message} (edited) </span>`, username));
        let repliesenabled = false;
        let editsenabled = false;
        let deletesenabled = false;
        repliesenabled = true;
        if (newMessage.username === username) {
            editsenabled = true;
            deletesenabled = true;
        }
        $(`#msg-${messageEditingID}`).replaceWith(li);
        messagesTooltip(li, repliesenabled, editsenabled, deletesenabled);
        $('#ratelimitalert').hide();
    }

});

document.addEventListener("DOMContentLoaded", function () {
    const experimentsPopup = document.getElementById("secret-experiments-popup");
    const experimentsPopupCloseBtn = document.getElementById("secret-experiments-close-button");
    experimentsPopupCloseBtn.addEventListener("click", function () {
        experimentsPopup.style.display = "none";
    })
    if (showexperimentspopup) {
        experimentsPopup.style.display = "block";
    }
    var localize = function (string, fallback) {
        var localized = string.toLocaleString();
        if (localized !== string) {
            return localized;
        } else {
            return fallback;
        }
    };
    $("#leavingmodal").html(`<p>${localize("%leavingmodal", $("leavingmodal").text())}</p>`);
    const confirmLeaveNeeterButton = document.getElementById("confirmLeaveNeeterButton");
    confirmLeaveNeeterButton.innerHTML = localize("%confirmLeaveNeeterButton", confirmLeaveNeeterButton.innerHTML);
    const closeLeaveNeeterModal = document.getElementById("closeLeaveNeeterModal");
    closeLeaveNeeterModal.innerHTML = localize("%closeLeaveNeeterModal", closeLeaveNeeterModal.innerHTML);
    const logoutAccountButtonTransl = document.getElementById("back-button");
    logoutAccountButtonTransl.innerHTML = localize("%logoutbutton", logoutAccountButtonTransl.innerHTML);
    const circleSettingsButtonTransl = document.getElementById("room-settings");
    circleSettingsButtonTransl.innerHTML = localize("%circlesettings", circleSettingsButtonTransl.innerHTML);
    const replyingToTextTransl = document.getElementById("replyingtotext");
    replyingToTextTransl.innerHTML = localize("%replyingtext", replyingToTextTransl.innerHTML);
    const editingMsgTextTransl = document.getElementById("editingmsgtext");
    editingMsgTextTransl.innerHTML = localize("%editingmsgtext", editingMsgTextTransl.innerHTML);
    const cancelReplyOrEditButtonTransl = document.getElementById("cancelreplyoredit");
    cancelReplyOrEditButtonTransl.innerHTML = localize("%cancelreplyoredit", cancelReplyOrEditButtonTransl.innerHTML);
    const closeCircleSettingsButtonTransl = document.getElementById("circlesettings-back-button");
    closeCircleSettingsButtonTransl.innerHTML = localize("%closecirclesettings", closeCircleSettingsButtonTransl.innerHTML);
    const circleSettingsTitleTransl = document.getElementById("circlesettings-title");
    circleSettingsTitleTransl.innerHTML = localize("%circlesettingstitle", circleSettingsTitleTransl.innerHTML);
    const saveCircleSettingsButtonTransl = document.getElementById("circlesettings-save-button");
    saveCircleSettingsButtonTransl.innerHTML = localize("%savecirclesettings", saveCircleSettingsButtonTransl.innerHTML);
    document.getElementsByName('messageinput')[0].placeholder = `${localize("%typeamessage", document.getElementsByName('messageinput')[0].placeholder)}`;
    document.getElementsByName('circlename')[0].placeholder = `${localize("%circlename", document.getElementsByName('circlename')[0].placeholder)}`;
    document.getElementsByName('circledescription')[0].placeholder = `${localize("%circledescription", document.getElementsByName('circledescription')[0].placeholder)}`;
    document.getElementsByName('circleemoji')[0].placeholder = `${localize("%circleicon", document.getElementsByName('circleemoji')[0].placeholder)}`;
}, { once: true });

socket.on('ai response', (response, airesponseid) => {
    $(`#msg-ai-${airesponseid}`).remove();
    let li = $('<li>').attr('id', `msg-${response._id}`).attr('class', 'msgelement').html(prepareMessage(`<div id="usernametextplacement"><b class="usernametext" class="earthymention">Earthy</b></div><span class="messagecontent">${response}</span> (AI - Message only visible to you) `));
    $('#messages').append(li);
    if (earthymsgtimeout !== null) {
        clearTimeout(earthymsgtimeout);
    }
});
document.addEventListener("click", function (event) {
    if (event.target.tagName.toLowerCase() === "a" && event.target.classList.contains("userlink")) {
        event.preventDefault();
        const clickedUrl = new URL(event.target.href);
        const isInternal = clickedUrl.hostname.includes("neeter.co");

        if (!isInternal) {
            const confirmDialog = document.getElementById("confirmDialog");
            confirmDialog.style.display = "block";
            document.getElementById("confirmLeaveNeeterButton").addEventListener("click", function () {
                window.open(event.target.href, "_blank");
                confirmDialog.style.display = "none";
            });
            document.querySelector(".closeLeaveNeeterModal").addEventListener("click", function () {
                confirmDialog.style.display = "none";
            });
        } else {
            window.location.href = event.target.href;
        }
    }
    if (event.target.classList.contains('usernametext')) {
        const element = document.createElement('div');
        element.style.display = 'none';
        element.innerHTML = `<div class="userprofilepopup"><div class="userprofilepopupinfo"><img src="https://api.dicebear.com/6.x/initials/svg?seed=${event.target.textContent}&scale=80&backgroundType=gradientLinear&backgroundColor=49d3a9&fontWeight=400&textColor=2e2e2e" class="userprofilepicture"><h1 class="userprofilepopupusername">${event.target.textContent}</h1></div><div class="popupbioinfotext"><b>USER BIO</b></div><div class="popupbio"><p class="userprofilepopupbio">Sample user profile bio. This feature is not implemented yet.</p></div></div>`;
        const tooltip = tippy(event.target, {
            content: element.innerHTML,
            trigger: 'click',
            arrow: false,
            allowHTML: true,
            placement: 'right-start',
            hideOnClick: true,
            interactive: true,
            maxWidth: 1000,
        });
        tooltip.show();
    }
    if (event.target.id.startsWith('replybtn-')) {
        console.log('replybtn clicked');
    } else if (event.target.id.startsWith('editbtn-')) {
        console.log('editbtn clicked');
    } else if (event.target.id.startsWith('deletebtn-')) {
        console.log('deletebtn clicked');
    }
    console.log(event.target)
    console.log(event.target.id)
});