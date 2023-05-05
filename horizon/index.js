$('#ratelimitalert').hide();
$('#room-settings').hide();
$('#create-room-name').hide();
$('#replyingtotext').hide();
$('#editingmsgtext').hide();
$('#cancelreplyoredit').hide();
$('#circle-selector').hide();
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
    $('#circle-selector').show();
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
circlesettingsbutton.addEventListener('click', function (event) {
    event.preventDefault();
    socket.emit('get room settings', currentRoom);
});

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
    urlParams.set('username', username);
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

$('#username-form').submit(() => {
    if ($('#username-input').val() === '') {
    } else {
        username = $('#username-input').val();
        $('#username-popup').hide();
        currentRoom = "Main";
        $('#circle-selector').show();
        $('#chat-window').show();
        socket.emit('join room', currentRoom, username);
        $('#current-room').text(currentRoom);
        document.title = `Neeter - ${currentRoom}`
        const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('room', currentRoom);
            urlParams.set('username', username);
            const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
            window.history.pushState({}, '', newUrl);
    }
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
    const grid = document.querySelector('.circle-grid');
    grid.innerHTML = '';
    const tippyInstances = [];
    allroomsList.forEach(roomname => {
        const li = document.createElement('li');
        const div = document.createElement('div');
        const img = document.createElement('img');
        img.src = "https://i.ibb.co/vvC7qqP/Circle.png";
        img.alt = roomname;
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
});

function convertMarkdownToHTML(markdown) {
    const converter = new showdown.Converter({breaks: true, simpleLineBreaks: true});
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
    console.log('Name changed to ' + newchangedroomname);
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
    urlParams.set('username', username);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({}, '', newUrl);
    document.title = `Neeter - ${currentRoom}`
    socket.emit('change room name from socket', currentRoom);
});

socket.on('room members', (roommembers) => {
    console.log(roommembers);
});
socket.on('chat message', (msg, room, roominfo, msgisresponse, msgresponseto) => {
    if (msg.room === currentRoom) {
        const htmlmdmsg = convertMarkdownToHTML(msg.message);
        editedtext = '';
        if (msg.edited === true) {
            editedtext = '(edited) ';
        }
        if (msg.message.includes('@') && msg.message.indexOf('@') < msg.message.length - 2) {
            console.log("Message contains @");
            socket.emit('get room members', currentRoom);
        }
        if (msg.username !== username) {
            if (msgisresponse === true) {
                const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username} (in response to <a onclick="goToMsg('${msg.responsetomessage}')">${msg.responsetousername}</a>):</b> ${htmlmdmsg} ${editedtext}`);
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
                const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username}:</b> ${htmlmdmsg} ${editedtext}`);
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
                const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username} (in response to <a onclick="goToMsg('${msg.responsetomessage}')">${msg.responsetousername}</a>):</b> ${htmlmdmsg} ${editedtext}`);
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
                const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username}:</b> ${htmlmdmsg} ${editedtext}`);
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
            const htmlmdmsg = convertMarkdownToHTML(msg.message);
            if (msg.message.includes('@') && msg.message.indexOf('@') < msg.message.length - 2) {
                console.log("Message contains @");
                socket.emit('get room members', currentRoom);
            }
            if (msg.edited === true) {
                editedtext = '(edited) ';
            } else {
                editedtext = '';
            };
            if (msg.username !== username) {
                if (msg.isresponse === true) {
                    const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username} (in response to <a onclick="goToMsg('${msg.responsetomessage}')">${msg.responsetousername}</a>):</b> ${htmlmdmsg} ${editedtext}`);
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
                    const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username}:</b> ${htmlmdmsg} ${editedtext}`);
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
                    const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username} (in response to <a onclick="goToMsg('${msg.responsetomessage}')">${msg.responsetousername}</a>):</b> ${htmlmdmsg} ${editedtext}`);
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
                    const li = $('<li>').attr('id', `msg-${msg._id}`).html(`<b>${msg.username}:</b> ${htmlmdmsg} ${editedtext}`);
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
        const li = $('<li>').attr('id', `msg-${newMessage._id}`).html(`<b>${newMessage.username} (in response to <a onclick="goToMsg('${newMessage.responsetomessage}')">${newMessage.responsetousername}</a>):</b> ${newMessage.message} (edited) `);
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
        const li = $('<li>').attr('id', `msg-${newMessage._id}`).html(`<b>${newMessage.username}:</b> ${newMessage.message} (edited) `);
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