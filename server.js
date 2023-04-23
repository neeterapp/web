const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const DOMPurify = require('isomorphic-dompurify');
require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");
const emojiRegex = require('emoji-regex');
const emjregex = emojiRegex();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const messageCount = {};
let isowner = false;
let roomsList = [];
let roomSettings;

// Define message schema
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
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    settings: {
        type: Object,
        required: false
    }
}, { timestamps: false });

const Message = mongoose.model('Message', messageSchema);
const RoomData = mongoose.model('Room', roomSchema);

app.use(express.static('public'));

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
async function moderate(textToModerate) {
    const response = await openai.createModeration({
        input: textToModerate,
    });
    const moderationresults = response.data.results;
    const flaggedmessage = moderationresults[0].flagged;
    return flaggedmessage;
}

// Handle socket connection
io.on('connection', (socket) => {
    roomsList = [];
    console.log('a user connected');
    RoomData.find({})
        .then((rooms) => {
            rooms.forEach((room) => {
                roomsList.push(room.room);
            });
            socket.emit('rooms list', roomsList)
            console.log('Rooms list:', roomsList);
        })
        .catch((err) => {
            console.log(err);
        });
    // Join room and load messages
    socket.on('join room', (room, usrname) => {
        const sanitizedroom = DOMPurify.sanitize(room);
        console.log(`${usrname} joined room ${sanitizedroom}`);
        socket.join(sanitizedroom);
        io.in(sanitizedroom).emit('joined');
        RoomData.findOne({ room: sanitizedroom }).then((existingRoom) => {
            if (!existingRoom) {
                // If room doesn't exist, create it and make the user the owner
                const newRoom = new RoomData({
                    room: sanitizedroom,
                    owner: usrname,
                    settings: { "test": "test" }
                });
                newRoom.save().then(() => {
                    console.log(`Created room ${sanitizedroom} with owner ${usrname}`);
                    isowner = true;
                    socket.emit('user connected', usrname, isowner);
                }).catch((err) => {
                    console.error(err);
                });
            } else if (existingRoom) {
                // If room exists, check if the user is the owner
                if (existingRoom.owner === usrname) {
                    console.log(`${usrname} is the owner of room ${sanitizedroom}`);
                    isowner = true;
                    socket.emit('user connected', usrname, isowner);
                } else {
                    console.log(`${usrname} is not the owner of room ${sanitizedroom}`);
                    isowner = false;
                    socket.emit('user connected', usrname, isowner);
                }
            }
        }).catch((err) => {
            console.error(err);
        });

        // Load messages for the room
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
                socket.emit('room settings', roomSettings);
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
        RoomData.findOneAndUpdate({ room: sanitizedroom }, { room: sanitizednewname, settings: newroomsettings }, { new: true }).then((existingRoom) => {
            if (existingRoom) {
                console.log('Room settings updated.');
                console.log(existingRoom.settings);
            }
        }).catch((err) => {
            console.error(err);
        });
    });

    // Handle chat message
    socket.on('chat message', (msg, username, room, isaresponse, msgresponseto, msgresponsetousername) => {
        moderate(msg).then(messageisflagged => {
            console.log(messageisflagged)
            if (messageisflagged === false) {
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
                        messageCount[sanitizedusername] = { count: 1, timestamp: currentTime };
                    } else {
                        if (messageCount[sanitizedusername].count === 10) {
                            messageCount[sanitizedusername] = { count: 1, timestamp: currentTime };
                        } else {
                            messageCount[sanitizedusername].count++;
                            messageCount[sanitizedusername].timestamp = currentTime;
                        }
                    }
                    console.log(`message: ${sanitizedmsg}, username: ${sanitizedusername}, room: ${sanitizedroom}, isresponse: ${isaresponse}, responsetomessage: ${sanitizedresponseto}, responsetousername: ${sanitizedresponsetousername}`);
                    RoomData.findOne({ room: sanitizedroom }).then((existingRoom) => {
                        const message = new Message({ message: sanitizedmsg, username: sanitizedusername, room: sanitizedroom, roomowner: existingRoom.owner, isresponse: isaresponse, responsetomessage: sanitizedresponseto, responsetousername: sanitizedresponsetousername, edited: false });
                        message.save().then(() => {
                            RoomData.findOne({ room: sanitizedroom }).then((existingRoom) => {
                                io.in(sanitizedroom).emit('chat message', message, sanitizedroom, existingRoom.owner, isaresponse, sanitizedresponseto, sanitizedresponsetousername);
                            });
                        }).catch((err) => {
                            console.error(err);
                        });
                    });
                }
            }
        }).catch(error => {
            console.error(error);
        });
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

    // Handle delete message
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

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});



// Start server
http.listen(2345, () => {
    console.log('listening on *:2345');
});