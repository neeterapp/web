$('#ratelimitalert').hide();
$('#room-settings').hide();
$('#create-room-name').hide();
$('#replyingtotext').hide();
$('#editingmsgtext').hide();
$('#cancelreplyoredit').hide();
$('#username-popup').show();
const socket = io();
const notificationSound = document.getElementById('notification');
let username = '';
let currentRoom = '';
let allroomsList = [];

// grab the room name and username from the URL
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
    document.title = `Neeter - ${currentRoom}`
}

const backbutton = document.getElementById('back-button');
backbutton.addEventListener('click', () => {
    window.location.href = '/';
});

const circlesettingsbutton = document.getElementById('room-settings');
circlesettingsbutton.addEventListener('click', function(event) {
    event.preventDefault();
    $('#chat-window').hide();
    $('#circlesettings-window').show();
});

const circlesettingsbackbutton = document.getElementById('circlesettings-back-button');
circlesettingsbackbutton.addEventListener('click', function(event) {
    event.preventDefault();
    $('#circlesettings-window').hide();
    $('#chat-window').show();
});

const circleSettingsSaveButton = document.getElementById('circlesettings-save-button');
circleSettingsSaveButton.addEventListener('click', function(event) {
    event.preventDefault();
    socket.emit('update room settings', currentRoom, $('#circle-description').val(), $('#circle-emoji').val(), $('#circle-name').val());
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
replyeditcancelbtn.addEventListener('click', function(event) {
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
    $('#sendbtn').text('Send');
});

messageinput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendoreditbutton.click();
    }
  });

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
    document.title = `Neeter - ${currentRoom}`
    return false;
});

$('#message-form').submit(() => {
    const message = $('#message').val();
    if (editingmsg === true) {
        socket.emit('edit message', editingmessageid, message);
    } else {
        socket.emit('chat message', message, username, currentRoom, isaresponse, responsetomsg, msgresponsetousername);
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
    $('#sendbtn').text('Send');
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

socket.on('joined', () => {
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
        editedtext = '';
        if (msg.edited === true) {
            editedtext = '(edited)';
        }
        if (msg.username !== username) {
            if (msgisresponse === true) {
                const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username} (in response to <a onclick="goToMsg('${msg.responsetomessage}')">${msg.responsetousername}</a>):</b> ${msg.message} ${editedtext}`);
                const replyButton = $('<button>').attr('id', `replybtn`).text('Reply');
                replyButton.click(() => {
                    isaresponse = true;
                    responsetomsg = `${msg._id}`;
                    msgresponsetousername = msg.username;
                    
                    $('#replyingtotext').show();
                    $('#replyingtotext').text(`Replying to ${msg.username}`);
                    $('#cancelreplyoredit').show();
                });
                li.append(replyButton);
                if (msg.roomowner === username) {
                    const delButton = $('<button>').attr('id', `deletebtn`).text('Delete');
                    delButton.click(() => {
                        socket.emit('delete message', msg, username);
                        li.remove();
                    });
                    li.append(delButton);
                }
                $('#messages').append(li);
                notificationSound.play();
            } else if (msgisresponse === false) {
                const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username}:</b> ${msg.message} ${editedtext}`);
                const replyButton = $('<button>').attr('id', `replybtn`).text('Reply');
                replyButton.click(() => {
                    isaresponse = true;
                    responsetomsg = `${msg._id}`;
                    msgresponsetousername = msg.username;
                    
                    $('#replyingtotext').show();
                    $('#replyingtotext').text(`Replying to ${msg.username}`);
                    $('#cancelreplyoredit').show();
                });
                li.append(replyButton);
                if (msg.roomowner === username) {
                    const delButton = $('<button>').attr('id', `deletebtn`).text('Delete');
                    delButton.click(() => {
                        socket.emit('delete message', msg, username);
                        li.remove();
                    });
                    li.append(delButton);
                }
                $('#messages').append(li);
                notificationSound.play();
            }
        } else if (msg.username === username || roominfo === username) {
            if (msgisresponse === true) {
                const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username} (in response to <a onclick="goToMsg('${msg.responsetomessage}')">${msg.responsetousername}</a>):</b> ${msg.message} ${editedtext}`);
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
                    
                    $('#replyingtotext').show();
                    $('#replyingtotext').text(`Replying to ${msg.username}`);
                    $('#cancelreplyoredit').show();
                });
                li.append(replyButton);
                if (msg.username === username) {
                    const editButton = $('<button>').attr('id', `editbtn`).text('Edit');
                        editButton.click(() => {
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
                $('#messages').append(li);
                $('#ratelimitalert').hide();
            } else if (msgisresponse === false) {
                const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username}:</b> ${msg.message} ${editedtext}`);
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
                    
                    $('#replyingtotext').show();
                    $('#replyingtotext').text(`Replying to ${msg.username}`);
                    $('#cancelreplyoredit').show();
                });
                li.append(replyButton);
                if (msg.username === username) {
                    const editButton = $('<button>').attr('id', `editbtn`).text('Edit');
                        editButton.click(() => {
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
            if (msg.edited === true) {
                editedtext = '(edited)';
            } else {
                editedtext = '';
            };
            if (msg.username !== username) {
                if (msg.isresponse === true) {
                    const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username} (in response to <a onclick="goToMsg('${msg.responsetomessage}')">${msg.responsetousername}</a>):</b> ${msg.message} ${editedtext}`);
                    $('#messages').append(li);
                    if (msg.roomowner === username) {
                        const delButton = $('<button>').attr('id', `deletebtn`).text('Delete');
                        delButton.click(() => {
                            socket.emit('delete message', msg, username);
                            li.remove();
                        });
                        li.append(delButton);
                    }
                    const replyButton = $('<button>').attr('id', `replybtn`).text('Reply');
                        replyButton.click(() => {
                            isaresponse = true;
                            responsetomsg = `${msg._id}`;
                            msgresponsetousername = msg.username;
                            
                            $('#replyingtotext').show();
                            $('#replyingtotext').text(`Replying to ${msg.username}`);
                            $('#cancelreplyoredit').show();
                        });
                        li.append(replyButton);
                } else if (msg.isresponse === false) {
                    const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username}:</b> ${msg.message} ${editedtext}`);
                    $('#messages').append(li);
                    if (msg.roomowner === username) {
                        const delButton = $('<button>').attr('id', `deletebtn`).text('Delete');
                        delButton.click(() => {
                            socket.emit('delete message', msg, username);
                            li.remove();
                        });
                        li.append(delButton);
                    }
                    const replyButton = $('<button>').attr('id', `replybtn`).text('Reply');
                        replyButton.click(() => {
                            isaresponse = true;
                            responsetomsg = `${msg._id}`;
                            msgresponsetousername = msg.username;
                            
                            $('#replyingtotext').show();
                            $('#replyingtotext').text(`Replying to ${msg.username}`);
                            $('#cancelreplyoredit').show();
                        });
                        li.append(replyButton);
                }
            } else if (msg.username === username) {
                if (msg.isresponse === true) {
                    const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username} (in response to <a onclick="goToMsg('${msg.responsetomessage}')">${msg.responsetousername}</a>):</b> ${msg.message} ${editedtext}`);
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
                        
                        $('#replyingtotext').show();
                        $('#replyingtotext').text(`Replying to ${msg.username}`);
                        $('#cancelreplyoredit').show();
                    });
                    li.append(replyButton);
                    const editButton = $('<button>').attr('id', `editbtn`).text('Edit');
                    editButton.click(() => {
                        editingmsg = true;
                        editingmessageid = msg._id;
                        $('#messageinput').val(msg.message);
                        $('#sendbtn').text('Save');
                        $('#editingmsgtext').show();
                        $('#cancelreplyoredit').show();
                        $('#message').val(msg.message);
                    });
                    li.append(editButton);
                    $('#messages').append(li);
                } else if (msg.isresponse === false) {
                    const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username}:</b> ${msg.message} ${editedtext}`);
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
                        
                        $('#replyingtotext').show();
                        $('#replyingtotext').text(`Replying to ${msg.username}`);
                        $('#cancelreplyoredit').show();
                    });
                    li.append(replyButton);
                    const editButton = $('<button>').attr('id', `editbtn`).text('Edit');
                    editButton.click(() => {
                        editingmsg = true;
                        editingmessageid = msg._id;
                        $('#messageinput').val(msg.message);
                        $('#sendbtn').text('Save');
                        $('#editingmsgtext').show();
                        $('#cancelreplyoredit').show();
                        $('#message').val(msg.message);
                    });
                    li.append(editButton);
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

socket.on('message edited', (messageEditingID, newMessage) => {
    if (newMessage.isresponse === true) {
        const li = $('<li>').attr('id', `msg-${newMessage._id}`).html(`<b>${newMessage.username} (in response to <a onclick="goToMsg('${newMessage.responsetomessage}')">${newMessage.responsetousername}</a>):</b> ${newMessage.message} (edited)`);
        const delButton = $('<button>').attr('id', `deletebtn`).text('Delete');
        delButton.click(() => {
            socket.emit('delete message', newMessage, newMessage.username);
            li.remove();
        });
        li.append(delButton);
        const replyButton = $('<button>').attr('id', `replybtn`).text('Reply');
        replyButton.click(() => {
            isaresponse = true;
            responsetomsg = `${newMessage._id}`;
            msgresponsetousername = newMessage.username;
            
            $('#replyingtotext').show();
            $('#replyingtotext').text(`Replying to ${newMessage.username}`);
            $('#cancelreplyoredit').show();
        });
        li.append(replyButton);
        if (newMessage.username === username) {
            const editButton = $('<button>').attr('id', `editbtn`).text('Edit');
                editButton.click(() => {
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
    } else if (newMessage.isresponse === false) {
        const li = $('<li>').attr('id', `msg-${newMessage._id}`).html(`<b>${newMessage.username}:</b> ${newMessage.message} (edited)`);
        const delButton = $('<button>').attr('id', `deletebtn`).text('Delete');
        delButton.click(() => {
            socket.emit('delete message', newMessage, newMessage.username);
            li.remove();
        });
        li.append(delButton);
        const replyButton = $('<button>').attr('id', `replybtn`).text('Reply');
        replyButton.click(() => {
            isaresponse = true;
            responsetomsg = `${newMessage._id}`;
            msgresponsetousername = newMessage.username;
            
            $('#replyingtotext').show();
            $('#replyingtotext').text(`Replying to ${newMessage.username}`);
            $('#cancelreplyoredit').show();
        });
        li.append(replyButton);
        if (newMessage.username === username) {
            const editButton = $('<button>').attr('id', `editbtn`).text('Edit');
                editButton.click(() => {
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
    }

});