$('#ratelimitalert').hide();
$('#room-settings').hide();
$('#create-room-name').hide();
$('#replyingtotext').hide();
const socket = io();
const notificationSound = document.getElementById('notification');
let username = '';
let currentRoom = '';
let allroomsList = [];

const urlParams = new URLSearchParams(window.location.search);
const urlroom = urlParams.get('room');
const urlusername = urlParams.get('username');

if (urlroom && urlusername) {
    username = urlusername;
    currentRoom = urlroom;
    $('#username-popup').hide();
    $('#chat-window').show();
    socket.emit('join room', urlroom, urlusername);
    $('#current-room').text(urlroom);
}

const backbutton = document.getElementById('back-button');
backbutton.addEventListener('click', () => {
    window.location.href = '/';
});

let responsetomsg = '';
let isaresponse = false;
let msgresponsetousername = '';

$('#username-form').submit(() => {
    username = $('#username-input').val();
    currentRoom = $('#room-select').val();
    $('#username-popup').hide();
    $('#chat-window').show();
    const dropdown = document.getElementById('room-select');
    if (dropdown.value === "Create Circle") {
        currentRoom = $('#create-room-name').val();
    }
    $('#current-room').text(currentRoom);
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('room', currentRoom);
    urlParams.set('username', username);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({}, '', newUrl);
    socket.emit('join room', currentRoom, username);
    return false;
});
$('#message-form').submit(() => {
    const message = $('#message').val();
    socket.emit('chat message', message, username, currentRoom, isaresponse, responsetomsg, msgresponsetousername);
    $('#message').val('');
    $('#char-count').text(``);
    isaresponse = false;
    responsetomsg = '';
    msgresponsetousername = '';
    $('#replyingtotext').hide();
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
            }, 1000);
        }
    }
});

socket.on('rooms list', (roomslist) => {
    allroomsList = roomslist;
    const dropdown = document.getElementById('room-select');
    allroomsList.forEach(roomname => {
        const option = document.createElement('option');
        option.value = roomname;
        option.text = roomname;
        dropdown.add(option);
    });
    const option = document.createElement('option');
    option.value = "Create Circle";
    option.text = "Create Circle";
    dropdown.add(option);
    dropdown.addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        if (selectedValue === "Create Circle") {
            $('#create-room-name').show();
        } else {
            $('#create-room-name').hide();
        }
    });
});

socket.on('chat message', (msg, room, roominfo, msgisresponse, msgresponseto) => {
    if (msg.room === currentRoom) {
        if (msg.username !== username) {
            if (msgisresponse === true) {
                const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username} (in response to <a onclick="goToMsg('${msg.responsetomessage}')">${msg.responsetousername}</a>):</b> ${msg.message}`);
                const replyButton = $('<button>').attr('id', `replybtn`).text('Reply');
                replyButton.click(() => {
                    isaresponse = true;
                    responsetomsg = `${msg._id}`;
                    msgresponsetousername = msg.username;
                    console.log(isaresponse, responsetomsg, msgresponsetousername);
                    $('#replyingtotext').show();
                    $('#replyingtotext').text(`Replying to ${msg.username}`);
                });
                li.append(replyButton);
                $('#messages').append(li);
                notificationSound.play();
            } else if (msgisresponse === false) {
                const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username}:</b> ${msg.message}`);
                const replyButton = $('<button>').attr('id', `replybtn`).text('Reply');
                replyButton.click(() => {
                    isaresponse = true;
                    responsetomsg = `${msg._id}`;
                    msgresponsetousername = msg.username;
                    console.log(isaresponse, responsetomsg, msgresponsetousername);
                    $('#replyingtotext').show();
                    $('#replyingtotext').text(`Replying to ${msg.username}`);
                });
                li.append(replyButton);
                $('#messages').append(li);
                notificationSound.play();
            }
        } else if (msg.username === username || roominfo === username) {
            if (msgisresponse === true) {
                const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username} (in response to <a onclick="goToMsg('${msg.responsetomessage}')">${msg.responsetousername}</a>):</b> ${msg.message}`);
                const delButton = $('<button>').attr('id', `deletebtn`).text('Delete');
                delButton.click(() => {
                    socket.emit('delete message', msg, msg.username);
                    li.remove();
                });
                li.append(delButton);
                const replyButton = $('<button>').attr('id', `replybtn`).text('Reply');
                replyButton.click(() => {
                    isaresponse = true;
                    responsetomsg = `${msg._id}`;
                    msgresponsetousername = msg.username;
                    console.log(isaresponse, responsetomsg, msgresponsetousername);
                    $('#replyingtotext').show();
                    $('#replyingtotext').text(`Replying to ${msg.username}`);
                });
                li.append(replyButton);
                $('#messages').append(li);
                $('#ratelimitalert').hide();
            } else if (msgisresponse === false) {
                const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username}:</b> ${msg.message}`);
                const delButton = $('<button>').attr('id', `deletebtn`).text('Delete');
                delButton.click(() => {
                    socket.emit('delete message', msg, msg.username);
                    li.remove();
                });
                li.append(delButton);
                const replyButton = $('<button>').attr('id', `replybtn`).text('Reply');
                replyButton.click(() => {
                    isaresponse = true;
                    responsetomsg = `${msg._id}`;
                    msgresponsetousername = msg.username;
                    console.log(isaresponse, responsetomsg, msgresponsetousername);
                    $('#replyingtotext').show();
                    $('#replyingtotext').text(`Replying to ${msg.username}`);
                });
                li.append(replyButton);
                $('#messages').append(li);
                $('#ratelimitalert').hide();
            }
        }
    }
});

goToMsg = (msgID) => {
    const msg = document.getElementById(`msg-${msgID}`);
    msg.scrollIntoView({ behavior: 'smooth' });
    msg.classList.add('highlight');
    setTimeout(() => {
        msg.classList.add('remove');
        setTimeout(() => {
            msg.classList.remove('highlight', 'remove');
        }, 250);
    }, 1000);
}

socket.on('load messages', (messages) => {
    messages.forEach((msg) => {
        if (msg.room === currentRoom) {
            if (msg.username !== username) {
                if (msg.isresponse === true) {
                    const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username} (in response to <a onclick="goToMsg('${msg.responsetomessage}')">${msg.responsetousername}</a>):</b> ${msg.message}`);
                    $('#messages').append(li);
                    if (msg.roomowner === username) {
                        const delButton = $('<button>').attr('id', `deletebtn`).text('Delete');
                        delButton.click(() => {
                            socket.emit('delete message', msg, username);
                            li.remove();
                        });
                        li.append(delButton);
                        const replyButton = $('<button>').attr('id', `replybtn`).text('Reply');
                        replyButton.click(() => {
                            isaresponse = true;
                            responsetomsg = `${msg._id}`;
                            msgresponsetousername = msg.username;
                            console.log(isaresponse, responsetomsg, msgresponsetousername);
                            $('#replyingtotext').show();
                            $('#replyingtotext').text(`Replying to ${msg.username}`);
                        });
                        li.append(replyButton);
                    }
                } else if (msg.isresponse === false) {
                    const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username}:</b> ${msg.message}`);
                    $('#messages').append(li);
                    if (msg.roomowner === username) {
                        const delButton = $('<button>').attr('id', `deletebtn`).text('Delete');
                        delButton.click(() => {
                            socket.emit('delete message', msg, username);
                            li.remove();
                        });
                        li.append(delButton);
                        const replyButton = $('<button>').attr('id', `replybtn`).text('Reply');
                        replyButton.click(() => {
                            isaresponse = true;
                            responsetomsg = `${msg._id}`;
                            msgresponsetousername = msg.username;
                            console.log(isaresponse, responsetomsg, msgresponsetousername);
                            $('#replyingtotext').show();
                            $('#replyingtotext').text(`Replying to ${msg.username}`);
                        });
                        li.append(replyButton);
                    }
                }
            } else if (msg.username === username) {
                if (msg.isresponse === true) {
                    const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username} (in response to <a onclick="goToMsg('${msg.responsetomessage}')">${msg.responsetousername}</a>):</b> ${msg.message}`);
                    const delButton = $('<button>').attr('id', `deletebtn`).text('Delete');
                    delButton.click(() => {
                        socket.emit('delete message', msg, username);
                        li.remove();
                    });
                    li.append(delButton);
                    const replyButton = $('<button>').attr('id', `replybtn`).text('Reply');
                    replyButton.click(() => {
                        isaresponse = true;
                        responsetomsg = `${msg._id}`;
                        msgresponsetousername = msg.username;
                        console.log(isaresponse, responsetomsg, msgresponsetousername);
                        $('#replyingtotext').show();
                        $('#replyingtotext').text(`Replying to ${msg.username}`);
                    });
                    li.append(replyButton);
                    $('#messages').append(li);
                } else if (msg.isresponse === false) {
                    const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username}:</b> ${msg.message}`);
                    const delButton = $('<button>').attr('id', `deletebtn`).text('Delete');
                    delButton.click(() => {
                        socket.emit('delete message', msg, username);
                        li.remove();
                    });
                    li.append(delButton);
                    const replyButton = $('<button>').attr('id', `replybtn`).text('Reply');
                    replyButton.click(() => {
                        isaresponse = true;
                        responsetomsg = `${msg._id}`;
                        msgresponsetousername = msg.username;
                        console.log(isaresponse, responsetomsg, msgresponsetousername);
                        $('#replyingtotext').show();
                        $('#replyingtotext').text(`Replying to ${msg.username}`);
                    });
                    li.append(replyButton);
                    $('#messages').append(li);
                }
            }

        }
    });
});

socket.on('message deleted', (msgId) => {
    $(`#msg-${msgId}`).remove();
});

socket.on('user connected', (usrname, isowner) => {
    if (isowner) {
        $('#room-settings').show();
    }
});