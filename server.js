const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const DOMPurify = require('isomorphic-dompurify');
require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");
const emojiRegex = require('emoji-regex');
const emjregex = emojiRegex();

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Database connection error:'));

const messageCount = {};
let isowner = false;
let roomsList = [];
let roomSettings;
const hubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    members: {
        type: Array,
        required: false
    },
    settings: {
        type: Object,
        required: false
    },
    circles: {
        type: Array,
        required: false
    }
}, { timestamps: false });
const userSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        maxlength: 32
    },
    circles: {
        type: Array,
        required: false
    },
    hubs: {
        type: Array,
        required: false
    },
    earthyenabled: {
        type: Boolean,
        required: false
    },
    popupsdismissed: {
        type: Array,
        required: false
    },
    translatemessages: {
        type: Boolean,
        required: false
    },
    status: {
        type: String,
        required: false
    },
}, { timestamps: false });
const messageSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
        maxlength: 2000
    },
    username: {
        type: String,
        required: true
    },
    room: {
        type: String,
        required: true
    },
    roomowner: {
        type: String,
        required: true
    },
    isresponse: {
        type: Boolean,
        required: true
    },
    responsetomessage: {
        type: String,
        required: false
    },
    responsetousername: {
        type: String,
        required: false
    },
    edited: {
        type: Boolean,
        required: true
    }
}, { timestamps: true });
const roomSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true,
        unique: true
    },
    owner: {
        type: String,
        required: true
    },
    settings: {
        type: Object,
        required: false
    },
    members: {
        type: Array,
        required: false
    },
    hub: {
        type: String,
        required: false,
    },
    latestmessagetruncated: {
        type: String,
        required: false
    }
}, { timestamps: false });
const inviteSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    circle: {
        type: String,
        required: true
    },
    expires: {
        type: Date,
        required: true
    }
}, { timestamps: false });

const Hub = mongoose.model('Hub', hubSchema);
const Message = mongoose.model('Message', messageSchema);
const RoomData = mongoose.model('Room', roomSchema);
const UserData = mongoose.model('User', userSchema);
const Invite = mongoose.model('Invite', inviteSchema);

app.use(express.static('horizon'));

app.get('/invite/:code', (req, res) => {
    const sanitizedcode = DOMPurify.sanitize(req.params.code);
    Invite.findOne({ code: sanitizedcode })
        .then((invite) => {
            if (invite) {
                res.redirect(`/join?code=${invite.code}`);
            } else {
                res.redirect('/invite-404');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Internal server error');
        });
});

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
async function moderatemsg(textToModerate) {
    try {
        const response = await openai.createModeration({
            input: textToModerate,
        });
        const moderationresults = response.data.results;
        const flaggedmessage = moderationresults[0].flagged;
        console.log(textToModerate);
        console.log(flaggedmessage);
        return flaggedmessage;
    } catch (error) {
        console.error(error);
        return false;
    }
}

function setUserStatus(username, status) {
    UserData.findOne({ username: username })
        .then((user) => {
            if (user) {
                user.status = status;
                user.save();
            }
        })
        .catch((err) => {
            console.error(err);
        });
}

io.on('connection', (socket) => {
    roomsList = [];
    let enhancedRoomsList = [];
    RoomData.find({})
        .then((rooms) => {
            rooms.forEach((room) => {
                roomsList.push(room.room);
                enhancedRoomsList.push(room);
            });
            socket.emit('rooms list', roomsList, enhancedRoomsList);
        })
        .catch((err) => {
            console.log(err);
        });
    socket.on('create invite', (circle, expires) => {
        const sanitizedcircle = DOMPurify.sanitize(circle);
        const sanitizedexpires = DOMPurify.sanitize(expires);
        const inviteCode = randomstring.generate(10);
        const newInvite = new Invite({
            code: inviteCode,
            circle: sanitizedcircle,
            expires: sanitizedexpires
        });
        newInvite.save().then((savedInvite) => {
            console.log(`Invite created: ${savedInvite}`);
            socket.emit('invite created', savedInvite);
        }).catch((err) => {
            console.error(err);
        });
    });
    socket.on('disconnect', () => {
        if (socket.username) {
            setUserStatus(socket.username, 'offline');
            socket.username = null;
        }
    });
    socket.on('register user', (userid, username) => {
        const sanitizeduserid = DOMPurify.sanitize(userid);
        const sanitizedusername = DOMPurify.sanitize(username);
        console.log(`Registering user ${sanitizedusername} with id ${sanitizeduserid}`);
        const newUser = new UserData({
            userid: sanitizeduserid,
            username: sanitizedusername,
            rooms: [],
            hubs: [],
            translatemessages: false,
        });
        newUser.save().then((savedUserData) => {
            console.log(`User ${sanitizedusername} registered.`);
            socket.emit('user data', savedUserData);
        }).catch((err) => {
            console.error(err);
        });
    });
    socket.on('user data', (usrid) => {
        const sanitizedusrid = DOMPurify.sanitize(usrid);
        console.log(`User id: ${sanitizedusrid}`);
        console.log('getting data...');
        UserData.findOne({ userid: sanitizedusrid }).then((existingUser) => {
            if (existingUser) {
                console.log('User found.');
                console.log(existingUser);
                socket.emit('user data', existingUser);
            } else {
                console.log('User not found.');
            }
        }).catch((err) => {
            console.error(err);
        });

    });
    socket.on('room renamed', (newroom, oldroom) => {
        const sanitizednewroom = DOMPurify.sanitize(newroom);
        const sanitizedoldroom = DOMPurify.sanitize(oldroom);
        socket.leave(sanitizedoldroom);
        socket.join(sanitizednewroom);
        RoomData.findOne({ room: sanitizednewroom }).then((existingRoom) => {
            if (existingRoom) {
                newroomsettings = existingRoom.settings;
                io.in(sanitizedoldroom).emit('room name changed', sanitizednewroom, newroomsettings);
            }
        }).catch((err) => {
            console.error(err);
        });
    });
    socket.on('change room name from socket', (newroomname) => {
        socket.leave(socket.room);
        socket.join(newroomname);
    });
    socket.on('get room members', (room) => {
        const sanitizedroom = DOMPurify.sanitize(room);
        RoomData.findOne({ room: sanitizedroom }).then((existingRoom) => {
            if (existingRoom) {
                socket.emit('room members', existingRoom.members);
            }
        }).catch((err) => {
            console.error(err);
        });
    });
    socket.on('join room', (room, usrname) => {
        socket.username = usrname;
        setUserStatus(usrname, 'online');
        const sanitizedroom = DOMPurify.sanitize(room);
        console.log(`${usrname} joined room ${sanitizedroom}`);
        socket.join(sanitizedroom);
        io.in(sanitizedroom).emit('joined');
        RoomData.findOne({ room: sanitizedroom }).then((existingRoom) => {
            if (!existingRoom) {
                const newRoom = new RoomData({
                    room: sanitizedroom,
                    owner: usrname,
                    settings: { "wow": "easter egg!" },
                    members: [usrname],
                    hub: "Hangout",
                    latestmessagetruncated: "No messages yet."
                });
                newRoom.save().then(() => {
                    console.log(`Created room ${sanitizedroom} with owner ${usrname}`);
                    isowner = true;
                    socket.emit('user connected', usrname, isowner, newRoom.settings);
                }).catch((err) => {
                    console.error(err);
                });
            } else if (existingRoom) {
                if (existingRoom.owner === usrname) {
                    console.log(`${usrname} is the owner of room ${sanitizedroom}`);
                    isowner = true;
                    socket.emit('user connected', usrname, isowner, existingRoom.settings);
                } else {
                    console.log(`${usrname} is not the owner of room ${sanitizedroom}`);
                    isowner = false;
                    socket.emit('user connected', usrname, isowner, existingRoom.settings);
                }
            }
        }).catch((err) => {
            console.error(err)
        });
        RoomData.updateOne(
            { room: sanitizedroom, members: { $ne: usrname } },
            { $addToSet: { members: usrname } }
        )
            .then(result => {
                console.log(result);
            })
            .catch(error => {
                console.error(error);
            });
        Message.find({ room: sanitizedroom }).then((messages) => {
            socket.emit('load messages', messages);
        }).catch((err) => {
            console.error(err);
        });
    });
    socket.on('get room settings', (room) => {
        const sanitizedroom = DOMPurify.sanitize(room);
        RoomData.findOne({ room: sanitizedroom }).then((existingRoom) => {
            if (existingRoom) {
                roomSettings = existingRoom.settings;
                roomname = existingRoom.room;
                socket.emit('room settings', roomSettings, roomname);
                console.log('Room settings sent.');
                console.log(roomSettings);
            } else {
                console.log('Room not found.');
            }
        }).catch((err) => {
            console.error(err);
        });
    });
    socket.on('update room settings', (room, newRoomDescription, newRoomEmoji, newRoomName) => {
        const sanitizednewdescription = DOMPurify.sanitize(newRoomDescription);
        const sanitizednewemoji = DOMPurify.sanitize(newRoomEmoji);
        const sanitizednewname = DOMPurify.sanitize(newRoomName);
        const sanitizedroom = DOMPurify.sanitize(room);
        const newroomsettings = {
            description: sanitizednewdescription,
            emoji: sanitizednewemoji
        };
        if (!sanitizednewname) {
            sanitizednewname = sanitizedroom;
        } else {
            //replace all messages from the old room name to the new room name
            Message.updateMany({ room: sanitizedroom }, { room: sanitizednewname }).then((messages) => {
                console.log('Messages updated.');
            }).catch((err) => {
                console.error(err);
            });
        }
        RoomData.findOneAndUpdate({ room: sanitizedroom }, { room: sanitizednewname, settings: newroomsettings }, { new: true }).then((existingRoom) => {
            if (existingRoom) {
                console.log('Room settings updated.');
                console.log(existingRoom.settings);
            }
        }).catch((err) => {
            console.error(err);
        });
    });
    socket.on('chat message', (msg, username, room, isaresponse, msgresponseto, msgresponsetousername) => {
        const msgtimestamp = new Date().getTime();
        if (room === "Earthy") {
            return;
        }
        const sanitizedmsg = DOMPurify.sanitize(msg);
        const sanitizedusername = DOMPurify.sanitize(username);
        const sanitizedroom = DOMPurify.sanitize(room);
        const sanitizedresponseto = DOMPurify.sanitize(msgresponseto);
        const sanitizedresponsetousername = DOMPurify.sanitize(msgresponsetousername);
        const currentTime = new Date().getTime();
        if (messageCount[sanitizedusername] && (currentTime - messageCount[sanitizedusername].timestamp) < 1000 && messageCount[sanitizedusername].count >= 10) {
            socket.emit('msgratelimit', sanitizedmsg, sanitizedusername, sanitizedroom);
        } else {
            if (!messageCount[sanitizedusername]) {
                setTimeout(() => {
                    messageCount[sanitizedusername] = { count: 1, timestamp: currentTime };
                }, 3000);
            } else {
                if (messageCount[sanitizedusername].count === 10) {
                    setTimeout(() => {
                        messageCount[sanitizedusername] = { count: 1, timestamp: currentTime };
                    }, 3000);
                } else {
                    messageCount[sanitizedusername].count++;
                    messageCount[sanitizedusername].timestamp = currentTime;
                }
            }
            console.log(`message: ${sanitizedmsg}, username: ${sanitizedusername}, room: ${sanitizedroom}, isresponse: ${isaresponse}, responsetomessage: ${sanitizedresponseto}, responsetousername: ${sanitizedresponsetousername}`);
            RoomData.findOne({ room: sanitizedroom }).then((existingRoom) => {
                const message = new Message({ message: sanitizedmsg, username: sanitizedusername, room: sanitizedroom, roomowner: existingRoom.owner, isresponse: isaresponse, responsetomessage: sanitizedresponseto, responsetousername: sanitizedresponsetousername, edited: false });
                message.save().then(() => {
                    io.in(sanitizedroom).emit('chat message', message, sanitizedroom, existingRoom.owner, isaresponse, sanitizedresponseto, sanitizedresponsetousername, msgtimestamp);
                    moderatemsg(message.message).then((flaggedmessage) => {
                        console.log("Message flagging test completed. The flagged status is: " + flaggedmessage)
                        if (flaggedmessage === true) {
                            console.log(`deleting message ${message._id}`);
                            Message.findByIdAndDelete(message._id).then(() => {
                                socket.emit('message deleted', message._id);
                            }).catch((err) => {
                                console.error(err);
                            });
                        }
                    });
                    function truncateLastMessage(text, maxLength) {
                        if (text.length > maxLength) {
                            return text.slice(0, maxLength) + '...';
                        } else {
                            return text;
                        }
                    }
                    const lastmessage = '<b>' + sanitizedusername + '</b>: ' + truncateLastMessage(message.message, 35);
                    existingRoom.latestmessagetruncated = lastmessage;
                    existingRoom.save().then(() => {
                        console.log(`Saved room ${sanitizedroom} with latest message ${existingRoom.latestmessagetruncated}`);
                    });
                }).catch((err) => {
                    console.error(err);
                });
            });
        }
    });
    socket.on('edit message', (editingmessageid, editingmsg, sanitizedroom) => {
        const sanitizededitingmsg = DOMPurify.sanitize(editingmsg);
        console.log(`editing message ${editingmessageid} to ${sanitizededitingmsg}`);
        Message.findByIdAndUpdate(editingmessageid, { message: sanitizededitingmsg, edited: true }).then(() => {
            console.log("message edited");
            Message.findById(editingmessageid).then((message) => {
                io.to(message.room).emit('message edited', editingmessageid, message);
            });
        });
    });
    socket.on('delete message', (msg, deleterusername) => {
        const sanitizeddeleterusername = DOMPurify.sanitize(deleterusername);
        if (sanitizeddeleterusername == msg.username) {
            console.log(`deleting message ${msg._id}`);
            Message.findByIdAndDelete(msg._id).then(() => {
                console.log("message deleted");
                io.to(msg.room).emit('message deleted', msg._id);
            }).catch((err) => {
                console.error(err);
            });
        } else if (sanitizeddeleterusername == msg.roomowner) {
            console.log(`deleting message ${msg._id}`);
            Message.findByIdAndDelete(msg._id).then(() => {
                console.log("message deleted");
                io.to(msg.room).emit('message deleted', msg._id);
            }).catch((err) => {
                console.error(err);
            });
        } else {
            console.log("you cant delete that message");
        }
    });
});

http.listen(2345, () => {
    console.log('listening on *:2345');
});