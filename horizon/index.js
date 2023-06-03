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
let currentRoom = '';
let allroomsList = [];
let truncatedroomname
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js'
import { getAuth, createUserWithEmailAndPassword, setPersistence, signInWithEmailAndPassword, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js'
// grab the room name and username from the URL
const urlParams = new URLSearchParams(window.location.search);
const urlroom = urlParams.get('room');
let joined = false;
let messagesloaded = false;
const showexperimentspopup = urlParams.get('experimentsenabled');
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
        console.log(`Matched highlight: ${username}`);
        return `<span class="${highlightClass}">@${username}</span>`;
    });
    const finalMessage = highlightedAndHighlightedMessage.replace(linkRegex, (match, url) => {
        console.log(`Matched link: ${url}`);
        return `<a class="userlink" href="${url}" target="_blank">${url}</a>`;
    });
    return finalMessage;
}

socket.on('user data', (userdata) => {
    if (urlroom) {
        currentRoom = urlroom;
    } else {
        currentRoom = "Main";
    }
    username = userdata.username;
    $('#username-popup').hide();
    $('#circle-selector').show();
    $('#chat-window').show();
    if (joined === false) {
        socket.emit('join room', currentRoom, username);
        joined = true;
    }
    $('#current-room').text(currentRoom);
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
},{once: true});

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
        if (message.startsWith('@Earthy ')) {
            const earthyRegex = `@(Earthy)\\b`;
            const earthyClass = "earthymention";
            let li;
            message.replace(earthyRegex, (match, mention) => {
                li = $('<li>').attr('id', `msg-ai-${message}`).html(prepareMessage(`<b id="usernametext">${username}</b><b>:</b> <span class="${earthyClass}">${mention}</span>`));
            });
            $('#messages').append(li);
            const date = new Date();
            socket.emit('message to ai', message, username, currentRoom, date);
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
    allroomsList = roomslist;
    const grid = document.querySelector('.circle-grid');
    grid.innerHTML = '';
    const tippyInstances = [];
    allroomsList.forEach(roomname => {
        const li = document.createElement('li');
        const div = document.createElement('div');
        const img = document.createElement('img');
        truncatedroomname = truncateText(roomname, 40);
        if (roomname === "Main") {
            img.src = `https://i.postimg.cc/4nkSssfh/Neeter-Logo-2305.png`;
        } else {
            img.src = `https://api.dicebear.com/6.x/initials/svg?seed=${truncatedroomname}&scale=80&backgroundType=gradientLinear&backgroundColor=808080&fontWeight=400`;
        }
        img.alt = roomname;
        img.id = roomname;
        div.classList.add('circle');
        div.appendChild(img);
        li.appendChild(div);
        grid.appendChild(li);
        img.addEventListener('click', (event) => {
            event.preventDefault();
            $('#messages').empty();
            currentRoom = roomname;
            $('#current-room').text(currentRoom);
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('room', currentRoom);
            urlParams.set('username', username);
            const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
            window.history.pushState({}, '', newUrl);
            socket.emit('join room', currentRoom, username);
            document.title = `Neeter - ${currentRoom}`;
            // select the image and deselect all other image in the grid
            const selected = document.querySelector('.selected');
            if (selected) {
                selected.classList.remove('selected');
            }
            img.classList.add('selected');
        });
        const instance = tippy(div, {
            content: truncateText(roomname, 40),
            theme: 'light',
            placement: 'bottom',
            arrow: false,
        });
        tippyInstances.push(instance);
    });
    tippy.createSingleton(tippyInstances, {
        placement: 'bottom',
        theme: 'light',
        moveTransition: 'transform 0.2s ease-out',
        arrow: false,
        appendTo: () => document.body,
    });
    if (currentRoom) {
        const selectedCircle = document.getElementById(currentRoom);
        selectedCircle.classList.add('selected');
    }
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
            $('#current-room').text(currentRoom);
        }
    } else {
        if (newroomsettings.emoji) {
            $('#current-room-description').hide();
            $('#current-room').text(newroomsettings.emoji + currentRoom);
        } else {
            $('#current-room-description').hide();
            $('#current-room').text(currentRoom);
        }
    }
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('room', currentRoom);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({}, '', newUrl);
    document.title = `Neeter - ${currentRoom}`
    socket.emit('change room name from socket', currentRoom);
});

function goToMsg(msgID) {
    const msg = document.getElementById(`msg-${msgID}`);
    msg.scrollIntoView({ behavior: 'smooth' });
    msg.classList.add('highlight');
    setTimeout(() => {
        msg.classList.add('remove');
        setTimeout(() => {
            msg.classList.remove('highlight', 'remove');
        }, 250);
    }, 1000);
    return;
}

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
        const htmlmdmsg = convertMarkdownToHTML(msg.message);
        editedtext = '';
        if (msg.edited === true) {
            editedtext = '(edited) ';
        }
        if (msg.username !== username) {
            if (msgisresponse === true) {

                const li = $('<li>').attr('id', `msg-${msg._id}`).html(prepareMessage(`<b id="usernametext">${msg.username}</b><b> (in response to <a onclick="goToMsg('${msg.responsetomessage}')">${msg.responsetousername}</a>):</b> ${htmlmdmsg} ${editedtext}`, username));
                const originalButton = document.getElementById('replybtnoriginal');
                const replyButton = originalButton.cloneNode(true);
                replyButton.setAttribute('id', 'replybtn');
                replyButton.addEventListener('click', () => {
                    isaresponse = true;
                    responsetomsg = `${msg._id}`;
                    msgresponsetousername = msg.username;

                    $('#replyingtotext').show();
                    $('#replyingtotext').text(`Replying to ${msg.username}`);
                    $('#cancelreplyoredit').show();
                });
                li.append(replyButton);

                if (msg.roomowner === username) {
                    const originalButton = document.getElementById('deletebtnoriginal');
                    const delButton = originalButton.cloneNode(true);
                    delButton.setAttribute('id', 'deletebtn');
                    delButton.addEventListener('click', () => {
                        socket.emit('delete message', msg, username);
                        li.remove();
                    });
                    li.append(delButton);
                }
                li.innerHTML = prepareMessage(htmlmdmsg, username);
                $('#messages').append(li);
                notificationSound.play();
                $(`#msg-${msg._id} #replybtn`).addClass('notshowing');
                $(`#msg-${msg._id} #deletebtn`).addClass('notshowing');
                $(`#msg-${msg._id}`).hover(function () {
                    $(`#msg-${msg._id} #replybtn`).removeClass('notshowing');
                    $(`#msg-${msg._id} #replybtn`).addClass('showing');
                    $(`#msg-${msg._id} #deletebtn`).removeClass('notshowing');
                    $(`#msg-${msg._id} #deletebtn`).addClass('showing');
                }, function () {
                    $(`#msg-${msg._id} #replybtn`).removeClass('showing');
                    $(`#msg-${msg._id} #replybtn`).addClass('notshowing');
                    $(`#msg-${msg._id} #deletebtn`).removeClass('showing');
                    $(`#msg-${msg._id} #deletebtn`).addClass('notshowing');
                });
            } else if (msgisresponse === false) {
                const li = $('<li>').attr('id', `msg-${msg._id}`).html(prepareMessage(`<b id="usernametext">${msg.username}</b><b>:</b> ${htmlmdmsg} ${editedtext}`, username));
                const originalButton = document.getElementById('replybtnoriginal');
                const replyButton = originalButton.cloneNode(true);
                replyButton.setAttribute('id', 'replybtn');
                replyButton.addEventListener('click', () => {
                    isaresponse = true;
                    responsetomsg = `${msg._id}`;
                    msgresponsetousername = msg.username;

                    $('#replyingtotext').show();
                    $('#replyingtotext').text(`Replying to ${msg.username}`);
                    $('#cancelreplyoredit').show();
                });
                li.append(replyButton);

                if (msg.roomowner === username) {
                    const originalButton = document.getElementById('deletebtnoriginal');
                    const delButton = originalButton.cloneNode(true);
                    delButton.setAttribute('id', 'deletebtn');
                    delButton.addEventListener('click', () => {
                        socket.emit('delete message', msg, username);
                        li.remove();
                    });
                    li.append(delButton);
                }
                li.innerHTML = prepareMessage(htmlmdmsg, username);
                $('#messages').append(li);
                notificationSound.play();
                $(`#msg-${msg._id} #replybtn`).addClass('notshowing');
                $(`#msg-${msg._id} #deletebtn`).addClass('notshowing');
                $(`#msg-${msg._id}`).hover(function () {
                    $(`#msg-${msg._id} #replybtn`).removeClass('notshowing');
                    $(`#msg-${msg._id} #replybtn`).addClass('showing');
                    $(`#msg-${msg._id} #deletebtn`).removeClass('notshowing');
                    $(`#msg-${msg._id} #deletebtn`).addClass('showing');
                }
                    , function () {
                        $(`#msg-${msg._id} #replybtn`).removeClass('showing');
                        $(`#msg-${msg._id} #replybtn`).addClass('notshowing');
                        $(`#msg-${msg._id} #deletebtn`).removeClass('showing');
                        $(`#msg-${msg._id} #deletebtn`).addClass('notshowing');
                    }
                );
            }
        } else if (msg.username === username || roominfo === username) {
            if (msgisresponse === true) {
                const li = $('<li>').attr('id', `msg-${msg._id}`).html(prepareMessage(`<b id="usernametext">${msg.username}</b><b> (in response to <a onclick="goToMsg('${msg.responsetomessage}')">${msg.responsetousername}</a>):</b> ${htmlmdmsg} ${editedtext}`, username));
                const originalDelButton = document.getElementById('deletebtnoriginal');
                const delButton = originalDelButton.cloneNode(true);
                delButton.setAttribute('id', 'deletebtn');
                delButton.addEventListener('click', () => {
                    socket.emit('delete message', msg, username);
                    li.remove();
                });
                const originalButton = document.getElementById('replybtnoriginal');
                const replyButton = originalButton.cloneNode(true);
                replyButton.setAttribute('id', 'replybtn');
                replyButton.addEventListener('click', () => {
                    isaresponse = true;
                    responsetomsg = `${msg._id}`;
                    msgresponsetousername = msg.username;
                    $('#replyingtotext').show();
                    $('#replyingtotext').text(`Replying to ${msg.username}`);
                    $('#cancelreplyoredit').show();
                });
                li.append(replyButton);

                if (msg.username === username) {
                    const originalEditButton = document.getElementById('editbtnoriginal');
                    const editButton = originalEditButton.cloneNode(true);
                    editButton.setAttribute('id', 'editbtn');
                    editButton.addEventListener('click', () => {
                        editingmsg = true;
                        editingmessageid = msg._id;
                        $('#messageinput').val(msg.message);
                        $('#sendbtn').text('Save');
                        $('#editingmsgtext').show();
                        $('#cancelreplyoredit').show();
                        $('#message').val(msg.message);
                    });
                    li.append(editButton);
                }
                li.append(delButton);
                li.innerHTML = prepareMessage(htmlmdmsg, username);
                $('#messages').append(li);
                $('#ratelimitalert').hide();
                $(`#msg-${msg._id} #replybtn`).addClass('notshowing');
                $(`#msg-${msg._id} #deletebtn`).addClass('notshowing');
                $(`#msg-${msg._id} #editbtn`).addClass('notshowing');
                $(`#msg-${msg._id}`).hover(function () {
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
                );
            } else if (msgisresponse === false) {
                const li = $('<li>').attr('id', `msg-${msg._id}`).html(prepareMessage(`<b id="usernametext">${msg.username}</b><b>:</b> ${htmlmdmsg} ${editedtext}`));
                const originalDelButton = document.getElementById('deletebtnoriginal');
                const delButton = originalDelButton.cloneNode(true);
                delButton.setAttribute('id', 'deletebtn');
                delButton.addEventListener('click', () => {
                    socket.emit('delete message', msg, username);
                    li.remove();
                });
                const originalButton = document.getElementById('replybtnoriginal');
                const replyButton = originalButton.cloneNode(true);
                replyButton.setAttribute('id', 'replybtn');
                replyButton.addEventListener('click', () => {
                    isaresponse = true;
                    responsetomsg = `${msg._id}`;
                    msgresponsetousername = msg.username;

                    $('#replyingtotext').show();
                    $('#replyingtotext').text(`Replying to ${msg.username}`);
                    $('#cancelreplyoredit').show();
                });
                li.append(replyButton);

                if (msg.username === username) {
                    const originalEditButton = document.getElementById('editbtnoriginal');
                    const editButton = originalEditButton.cloneNode(true);
                    editButton.setAttribute('id', 'editbtn');
                    editButton.addEventListener('click', () => {
                        editingmsg = true;
                        editingmessageid = msg._id;
                        $('#messageinput').val(msg.message);
                        $('#sendbtn').text('Save');
                        $('#editingmsgtext').show();
                        $('#cancelreplyoredit').show();
                        $('#message').val(msg.message);
                    });
                    li.append(editButton);
                }
                li.append(delButton);
                li.innerHTML = prepareMessage(htmlmdmsg, username);
                $('#messages').append(li);
                $('#ratelimitalert').hide();
                $(`#msg-${msg._id} #replybtn`).addClass('notshowing');
                $(`#msg-${msg._id} #deletebtn`).addClass('notshowing');
                $(`#msg-${msg._id} #editbtn`).addClass('notshowing');
                $(`#msg-${msg._id}`).hover(function () {
                    $(`#msg-${msg._id} #replybtn`).removeClass('notshowing');
                    $(`#msg-${msg._id} #replybtn`).addClass('showing');
                    $(`#msg-${msg._id} #deletebtn`).removeClass('notshowing');
                    $(`#msg-${msg._id} #deletebtn`).addClass('showing');
                    $(`#msg-${msg._id} #editbtn`).removeClass('notshowing');
                    $(`#msg-${msg._id} #editbtn`).addClass('showing');
                }, function () {
                    $(`#msg-${msg._id} #replybtn`).removeClass('showing');
                    $(`#msg-${msg._id} #replybtn`).addClass('notshowing');
                    $(`#msg-${msg._id} #deletebtn`).removeClass('showing');
                    $(`#msg-${msg._id} #deletebtn`).addClass('notshowing');
                    $(`#msg-${msg._id} #editbtn`).removeClass('showing');
                    $(`#msg-${msg._id} #editbtn`).addClass('notshowing');
                });
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
                    const li = $('<li>').attr('id', `msg-${msg._id}`).html(prepareMessage(`<b id="usernametext">${msg.username}</b><b> (in response to <a onclick="goToMsg('${msg.responsetomessage}')">${msg.responsetousername}</a>):</b> ${htmlmdmsg} ${editedtext}`, username));
                    li.innerHTML = prepareMessage(htmlmdmsg, username);
                    $('#messages').append(li);
                    let delButton = null;
                    if (msg.roomowner === username) {
                        const originalDelButton = document.getElementById('deletebtnoriginal');
                        delButton = originalDelButton.cloneNode(true);
                        delButton.setAttribute('id', 'deletebtn');
                        delButton.addEventListener('click', () => {
                            socket.emit('delete message', msg, username);
                            li.remove();
                        });
                    }
                    const originalButton = document.getElementById('replybtnoriginal');
                    const replyButton = originalButton.cloneNode(true);
                    replyButton.setAttribute('id', 'replybtn');
                    replyButton.addEventListener('click', () => {
                        isaresponse = true;
                        responsetomsg = `${msg._id}`;
                        msgresponsetousername = msg.username;
                        $('#replyingtotext').show();
                        $('#replyingtotext').text(`Replying to ${msg.username}`);
                        $('#cancelreplyoredit').show();
                    });
                    li.append(replyButton);

                    if (delButton !== null) {
                        li.append(delButton);
                    }
                    $(`#msg-${msg._id} #replybtn`).addClass('notshowing');
                    $(`#msg-${msg._id} #deletebtn`).addClass('notshowing');
                    $(`#msg-${msg._id}`).hover(function () {
                        $(`#msg-${msg._id} #replybtn`).removeClass('notshowing');
                        $(`#msg-${msg._id} #replybtn`).addClass('showing');
                        $(`#msg-${msg._id} #deletebtn`).removeClass('notshowing');
                        $(`#msg-${msg._id} #deletebtn`).addClass('showing');
                    }, function () {
                        $(`#msg-${msg._id} #replybtn`).removeClass('showing');
                        $(`#msg-${msg._id} #replybtn`).addClass('notshowing');
                        $(`#msg-${msg._id} #deletebtn`).removeClass('showing');
                        $(`#msg-${msg._id} #deletebtn`).addClass('notshowing');
                    });
                } else if (msg.isresponse === false) {
                    const li = $('<li>').attr('id', `msg-${msg._id}`).html(prepareMessage(`<b id="usernametext">${msg.username}</b><b>:</b> ${htmlmdmsg} ${editedtext}`, username));
                    let delButton = null;
                    li.innerHTML = prepareMessage(htmlmdmsg, username);
                    $('#messages').append(li);
                    if (msg.roomowner === username) {
                        const originalDelButton = document.getElementById('deletebtnoriginal');
                        delButton = originalDelButton.cloneNode(true);
                        delButton.setAttribute('id', 'deletebtn');
                        delButton.addEventListener('click', () => {
                            socket.emit('delete message', msg, username);
                            li.remove();
                        });
                    }
                    const originalButton = document.getElementById('replybtnoriginal');
                    const replyButton = originalButton.cloneNode(true);
                    replyButton.setAttribute('id', 'replybtn');
                    replyButton.addEventListener('click', () => {
                        isaresponse = true;
                        responsetomsg = `${msg._id}`;
                        msgresponsetousername = msg.username;

                        $('#replyingtotext').show();
                        $('#replyingtotext').text(`Replying to ${msg.username}`);
                        $('#cancelreplyoredit').show();
                    });
                    li.append(replyButton);

                    if (delButton !== null) {
                        li.append(delButton);
                    }
                    $(`#msg-${msg._id} #replybtn`).addClass('notshowing');
                    $(`#msg-${msg._id} #deletebtn`).addClass('notshowing');
                    $(`#msg-${msg._id}`).hover(function () {
                        $(`#msg-${msg._id} #replybtn`).removeClass('notshowing');
                        $(`#msg-${msg._id} #replybtn`).addClass('showing');
                        $(`#msg-${msg._id} #deletebtn`).removeClass('notshowing');
                        $(`#msg-${msg._id} #deletebtn`).addClass('showing');
                    }, function () {
                        $(`#msg-${msg._id} #replybtn`).removeClass('showing');
                        $(`#msg-${msg._id} #replybtn`).addClass('notshowing');
                        $(`#msg-${msg._id} #deletebtn`).removeClass('showing');
                        $(`#msg-${msg._id} #deletebtn`).addClass('notshowing');
                    });
                }
            } else if (msg.username === username) {
                if (msg.isresponse === true) {
                    const li = $('<li>').attr('id', `msg-${msg._id}`).html(prepareMessage(`<b id="usernametext">${msg.username}</b><b> (in response to <a onclick="goToMsg('${msg.responsetomessage}')">${msg.responsetousername}</a>):</b> ${htmlmdmsg} ${editedtext}`, username));
                    const originalDelButton = document.getElementById('deletebtnoriginal');
                    const delButton = originalDelButton.cloneNode(true);
                    delButton.setAttribute('id', 'deletebtn');
                    delButton.addEventListener('click', () => {
                        socket.emit('delete message', msg, username);
                        li.remove();
                    });
                    const originalButton = document.getElementById('replybtnoriginal');
                    const replyButton = originalButton.cloneNode(true);
                    replyButton.setAttribute('id', 'replybtn');
                    replyButton.addEventListener('click', () => {
                        isaresponse = true;
                        responsetomsg = `${msg._id}`;
                        msgresponsetousername = msg.username;

                        $('#replyingtotext').show();
                        $('#replyingtotext').text(`Replying to ${msg.username}`);
                        $('#cancelreplyoredit').show();
                    });
                    li.append(replyButton);

                    const originalEditButton = document.getElementById('editbtnoriginal');
                    const editButton = originalEditButton.cloneNode(true);
                    editButton.setAttribute('id', 'editbtn');
                    editButton.addEventListener('click', () => {
                        editingmsg = true;
                        editingmessageid = msg._id;
                        $('#messageinput').val(msg.message);
                        $('#sendbtn').text('Save');
                        $('#editingmsgtext').show();
                        $('#cancelreplyoredit').show();
                        $('#message').val(msg.message);
                    });
                    li.append(editButton);
                    li.append(delButton);
                    li.innerHTML = prepareMessage(htmlmdmsg, username);
                    $('#messages').append(li);
                    $(`#msg-${msg._id} #replybtn`).addClass('notshowing');
                    $(`#msg-${msg._id} #deletebtn`).addClass('notshowing');
                    $(`#msg-${msg._id} #editbtn`).addClass('notshowing');
                    $(`#msg-${msg._id}`).hover(function () {
                        $(`#msg-${msg._id} #replybtn`).removeClass('notshowing');
                        $(`#msg-${msg._id} #replybtn`).addClass('showing');
                        $(`#msg-${msg._id} #deletebtn`).removeClass('notshowing');
                        $(`#msg-${msg._id} #deletebtn`).addClass('showing');
                        $(`#msg-${msg._id} #editbtn`).removeClass('notshowing');
                        $(`#msg-${msg._id} #editbtn`).addClass('showing');
                    }, function () {
                        $(`#msg-${msg._id} #replybtn`).removeClass('showing');
                        $(`#msg-${msg._id} #replybtn`).addClass('notshowing');
                        $(`#msg-${msg._id} #deletebtn`).removeClass('showing');
                        $(`#msg-${msg._id} #deletebtn`).addClass('notshowing');
                        $(`#msg-${msg._id} #editbtn`).removeClass('showing');
                        $(`#msg-${msg._id} #editbtn`).addClass('notshowing');
                    });
                } else if (msg.isresponse === false) {
                    const li = $('<li>').attr('id', `msg-${msg._id}`).html(prepareMessage(`<b id="usernametext">${msg.username}</b><b>:</b> ${htmlmdmsg} ${editedtext}`, username));
                    const originalDelButton = document.getElementById('deletebtnoriginal');
                    const delButton = originalDelButton.cloneNode(true);
                    delButton.setAttribute('id', 'deletebtn');
                    delButton.addEventListener('click', () => {
                        socket.emit('delete message', msg, username);
                        li.remove();
                    });
                    const originalButton = document.getElementById('replybtnoriginal');
                    const replyButton = originalButton.cloneNode(true);
                    replyButton.setAttribute('id', 'replybtn');
                    replyButton.addEventListener('click', () => {
                        isaresponse = true;
                        responsetomsg = `${msg._id}`;
                        msgresponsetousername = msg.username;

                        $('#replyingtotext').show();
                        $('#replyingtotext').text(`Replying to ${msg.username}`);
                        $('#cancelreplyoredit').show();
                    });
                    li.append(replyButton);

                    const originalEditButton = document.getElementById('editbtnoriginal');
                    const editButton = originalEditButton.cloneNode(true);
                    editButton.setAttribute('id', 'editbtn');
                    editButton.addEventListener('click', () => {
                        editingmsg = true;
                        editingmessageid = msg._id;
                        $('#messageinput').val(msg.message);
                        $('#sendbtn').text('Save');
                        $('#editingmsgtext').show();
                        $('#cancelreplyoredit').show();
                        $('#message').val(msg.message);
                    });
                    li.append(editButton);
                    li.append(delButton);
                    li.innerHTML = prepareMessage(htmlmdmsg, username);
                    $('#messages').append(li);
                    $(`#msg-${msg._id} #replybtn`).addClass('notshowing');
                    $(`#msg-${msg._id} #deletebtn`).addClass('notshowing');
                    $(`#msg-${msg._id} #editbtn`).addClass('notshowing');
                    $(`#msg-${msg._id}`).hover(function () {
                        $(`#msg-${msg._id} #replybtn`).removeClass('notshowing');
                        $(`#msg-${msg._id} #replybtn`).addClass('showing');
                        $(`#msg-${msg._id} #deletebtn`).removeClass('notshowing');
                        $(`#msg-${msg._id} #deletebtn`).addClass('showing');
                        $(`#msg-${msg._id} #editbtn`).removeClass('notshowing');
                        $(`#msg-${msg._id} #editbtn`).addClass('showing');
                    }, function () {
                        $(`#msg-${msg._id} #replybtn`).removeClass('showing');
                        $(`#msg-${msg._id} #replybtn`).addClass('notshowing');
                        $(`#msg-${msg._id} #deletebtn`).removeClass('showing');
                        $(`#msg-${msg._id} #deletebtn`).addClass('notshowing');
                        $(`#msg-${msg._id} #editbtn`).removeClass('showing');
                        $(`#msg-${msg._id} #editbtn`).addClass('notshowing');
                    });
                }
            }

        }
    });
    window.scrollTo({
        top: document.body.scrollHeight,
        left: 0,
        behavior: 'smooth'
    });
});

socket.on('message deleted', (msgId) => {
    $(`#msg-${msgId}`).remove();
});

socket.on('user connected', (usrname, isowner, roomsettingsdata) => {
    if (isowner) {
        $('#room-settings').show();
    }
    if (roomsettingsdata.description) {
        if (roomsettingsdata.emoji) {
            $('#current-room-description').show();
            $('#current-room-description').text(roomsettingsdata.description);
            $('#current-room').text(roomsettingsdata.emoji + currentRoom);
        } else {
            $('#current-room-description').show();
            $('#current-room-description').text(roomsettingsdata.description);
            $('#current-room').text(currentRoom);
        }
    } else {
        if (roomsettingsdata.emoji) {
            $('#current-room-description').hide()
            $('#current-room').text(roomsettingsdata.emoji + currentRoom);
        } else {
            $('#current-room-description').hide()
            $('#current-room').text(currentRoom);
        }
    }
});

socket.on('message edited', (messageEditingID, newMessage) => {
    if (newMessage.isresponse === true) {
        const li = $('<li>').attr('id', `msg-${newMessage._id}`).html(prepareMessage(`<b id="usernametext">${newMessage.username}</b><b> (in response to <a onclick="goToMsg('${newMessage.responsetomessage}')">${newMessage.responsetousername}</a>):</b> ${newMessage.message} (edited) `, username));
        const originalDelButton = document.getElementById('deletebtnoriginal');
        const delButton = originalDelButton.cloneNode(true);
        delButton.setAttribute('id', 'deletebtn');
        delButton.addEventListener('click', () => {
            socket.emit('delete message', newMessage, newMessage.username);
            li.remove();
        });
        const originalButton = document.getElementById('replybtnoriginal');
        const replyButton = originalButton.cloneNode(true);
        replyButton.setAttribute('id', 'replybtn');
        replyButton.addEventListener('click', () => {
            isaresponse = true;
            responsetomsg = `${newMessage._id}`;
            msgresponsetousername = newMessage.username;
            $('#replyingtotext').show();
            $('#replyingtotext').text(`Replying to ${newMessage.username}`);
            $('#cancelreplyoredit').show();
        });
        li.append(replyButton);

        if (newMessage.username === username) {
            const originalEditButton = document.getElementById('editbtnoriginal');
            const editButton = originalEditButton.cloneNode(true);
            editButton.setAttribute('id', 'editbtn');
            editButton.addEventListener('click', () => {
                editingmsg = true;
                editingmessageid = newMessage._id;
                $('#messageinput').val(newMessage.message);
                $('#sendbtn').text('Save');
                $('#editingmsgtext').show();
                $('#cancelreplyoredit').show();
                $('#message').val(msg.message);
            });
            li.append(editButton);
        }
        $(`#msg-${messageEditingID}`).replaceWith(li);
        $('#ratelimitalert').hide();
        li.append(delButton);
        li.innerHTML = prepareMessage(newMessage.message, username);
        $('#messages').append(li);
        $(`#msg-${newMessage._id} #replybtn`).addClass('notshowing');
        $(`#msg-${newMessage._id} #deletebtn`).addClass('notshowing');
        $(`#msg-${newMessage._id} #editbtn`).addClass('notshowing');
        $(`#msg-${newMessage._id}`).hover(function () {
            $(`#msg-${newMessage._id} #replybtn`).removeClass('notshowing');
            $(`#msg-${newMessage._id} #replybtn`).addClass('showing');
            $(`#msg-${newMessage._id} #deletebtn`).removeClass('notshowing');
            $(`#msg-${newMessage._id} #deletebtn`).addClass('showing');
            $(`#msg-${newMessage._id} #editbtn`).removeClass('notshowing');
            $(`#msg-${newMessage._id} #editbtn`).addClass('showing');
        }, function () {
            $(`#msg-${newMessage._id} #replybtn`).removeClass('showing');
            $(`#msg-${newMessage._id} #replybtn`).addClass('notshowing');
            $(`#msg-${newMessage._id} #deletebtn`).removeClass('showing');
            $(`#msg-${newMessage._id} #deletebtn`).addClass('notshowing');
            $(`#msg-${newMessage._id} #editbtn`).removeClass('showing');
            $(`#msg-${newMessage._id} #editbtn`).addClass('notshowing');
        });
    } else if (newMessage.isresponse === false) {
        const li = $('<li>').attr('id', `msg-${newMessage._id}`).html(prepareMessage(`<b id="usernametext">${newMessage.username}</b><b>:</b> ${newMessage.message} (edited) `));
        const originalDelButton = document.getElementById('deletebtnoriginal');
        const delButton = originalDelButton.cloneNode(true);
        delButton.setAttribute('id', 'deletebtn');
        delButton.addEventListener('click', () => {
            socket.emit('delete message', newMessage, newMessage.username);
            li.remove();
        });
        const originalButton = document.getElementById('replybtnoriginal');
        const replyButton = originalButton.cloneNode(true);
        replyButton.setAttribute('id', 'replybtn');
        replyButton.addEventListener('click', () => {
            isaresponse = true;
            responsetomsg = `${newMessage._id}`;
            msgresponsetousername = newMessage.username;

            $('#replyingtotext').show();
            $('#replyingtotext').text(`Replying to ${newMessage.username}`);
            $('#cancelreplyoredit').show();
        });
        li.append(replyButton);
        if (newMessage.username === username) {
            const originalEditButton = document.getElementById('editbtnoriginal');
            const editButton = originalEditButton.cloneNode(true);
            editButton.setAttribute('id', 'editbtn');
            editButton.addEventListener('click', () => {
                editingmsg = true;
                editingmessageid = newMessage._id;
                $('#messageinput').val(newMessage.message);
                $('#sendbtn').text('Save');
                $('#editingmsgtext').show();
                $('#cancelreplyoredit').show();
                $('#message').val(msg.message);
            });
            li.append(editButton);
        }
        li.append(delButton);
        $(`#msg-${messageEditingID}`).replaceWith(li);
        $('#ratelimitalert').hide();
        $(`#msg-${newMessage._id} #replybtn`).addClass('notshowing');
        $(`#msg-${newMessage._id} #deletebtn`).addClass('notshowing');
        $(`#msg-${newMessage._id} #editbtn`).addClass('notshowing');
        $(`#msg-${newMessage._id}`).hover(function () {
            $(`#msg-${newMessage._id} #replybtn`).removeClass('notshowing');
            $(`#msg-${newMessage._id} #replybtn`).addClass('showing');
            $(`#msg-${newMessage._id} #deletebtn`).removeClass('notshowing');
            $(`#msg-${newMessage._id} #deletebtn`).addClass('showing');
            $(`#msg-${newMessage._id} #editbtn`).removeClass('notshowing');
            $(`#msg-${newMessage._id} #editbtn`).addClass('showing');
        }, function () {
            $(`#msg-${newMessage._id} #replybtn`).removeClass('showing');
            $(`#msg-${newMessage._id} #replybtn`).addClass('notshowing');
            $(`#msg-${newMessage._id} #deletebtn`).removeClass('showing');
            $(`#msg-${newMessage._id} #deletebtn`).addClass('notshowing');
            $(`#msg-${newMessage._id} #editbtn`).removeClass('showing');
            $(`#msg-${newMessage._id} #editbtn`).addClass('notshowing');
        });
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
    /*var localize = function (string, fallback) {
        var localized = string.toLocaleString();
        if (localized !== string) {
            return localized;
        } else {
            return fallback;
        }
    };
    const titledoc = document.getElementById("title");
    console.log(localize("%title", $("title").text()))
    $("title").innerHtml(localize("%title", $("title").text()));
    document.title = titledoc.nodeValue = localize("%title", titledoc.nodeValue);
    document.documentElement.lang = String.locale || document.documentElement.lang;*/
}, {once: true});

socket.on('ai response', (response) => {
    const li = $('<li>').attr('id', `msg-${response._id}`).html(prepareMessage(`<b id="usernametext" class="earthymention">Earthy</b><b>:</b> ${response} (AI - Message only visible to you) `));
    $('#messages').append(li);
});
document.addEventListener("click", function (event) {
    if (event.target.tagName.toLowerCase() === "a" && event.target.classList.contains("userlink")) {
        event.preventDefault();
        const clickedUrl = new URL(event.target.href);
        const isInternal = clickedUrl.hostname.includes("neeter.co");

        if (!isInternal) {
            const confirmDialog = document.getElementById("confirmDialog");
            confirmDialog.style.display = "block";
            document.getElementById("confirmButton").addEventListener("click", function () {
                window.open(event.target.href, "_blank");
                confirmDialog.style.display = "none";
            });
            document.querySelector(".closemodal").addEventListener("click", function () {
                confirmDialog.style.display = "none";
            });
        } else {
            window.location.href = event.target.href;
        }
    }
});