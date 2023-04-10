const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://justkoru:pYTRO1xWGWO14CLE@cluster0.4bgopsl.mongodb.net/chat?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const messageCount = {};
let isowner = false;
let roomsList = [];

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

// Define message model
const Message = mongoose.model('Message', messageSchema);
const RoomData = mongoose.model('Room', roomSchema);

app.use(express.static('public'));

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
        console.log(`${usrname} joined room ${room}`);
        socket.join(room);
        RoomData.findOne({ room: room }).then((existingRoom) => {
            if (!existingRoom) {
                // If room doesn't exist, create it and make the user the owner
                const newRoom = new RoomData({
                    room: room,
                    owner: usrname,
                    settings: { "test": "test" }
                });
                newRoom.save().then(() => {
                    console.log(`Created room ${room} with owner ${usrname}`);
                    isowner = true;
                    socket.emit('user connected', usrname, isowner);
                }).catch((err) => {
                    console.error(err);
                });
            } else if (existingRoom) {
                // If room exists, check if the user is the owner
                if (existingRoom.owner === usrname) {
                    console.log(`${usrname} is the owner of room ${room}`);
                    isowner = true;
                    socket.emit('user connected', usrname, isowner);
                } else {
                    console.log(`${usrname} is not the owner of room ${room}`);
                    isowner = false;
                    socket.emit('user connected', usrname, isowner);
                }
            }
        }).catch((err) => {
            console.error(err);
        });

        // Load messages for the room
        Message.find({ room: room }).sort({ createdAt: 1 }).then((messages) => {
            socket.emit('load messages', messages);
        }).catch((err) => {
            console.error(err);
        });
    });

    // Handle chat message
    socket.on('chat message', (msg, username, room, isaresponse, msgresponseto, msgresponsetousername) => {
        const currentTime = new Date().getTime();
        if (messageCount[username] && (currentTime - messageCount[username].timestamp) < 1000 && messageCount[username].count >= 10) {
            socket.emit('msgratelimit', msg, username, room);
        } else {
            if (!messageCount[username]) {
                messageCount[username] = { count: 1, timestamp: currentTime };
            } else {
                if (messageCount[username].count === 10) {
                    messageCount[username] = { count: 1, timestamp: currentTime };
                } else {
                    messageCount[username].count++;
                    messageCount[username].timestamp = currentTime;
                }
            }
            console.log(`message: ${msg}, username: ${username}, room: ${room}, isresponse: ${isaresponse}, responsetomessage: ${msgresponseto}, responsetousername: ${msgresponsetousername}`);
            RoomData.findOne({ room: room }).then((existingRoom) => {
                const message = new Message({ message: msg, username: username, room: room, roomowner: existingRoom.owner, isresponse: isaresponse, responsetomessage: msgresponseto, responsetousername: msgresponsetousername });
                message.save().then(() => {
                    RoomData.findOne({ room: room }).then((existingRoom) => {
                        io.to(room).emit('chat message', message, room, existingRoom.owner, isaresponse, msgresponseto, msgresponsetousername);
                    });
                }).catch((err) => {
                    console.error(err);
                });
            });
        }
    });
    // Handle delete message
    socket.on('delete message', (msg, deleterusername) => {
        if (deleterusername == msg.username) {
            console.log(`deleting message ${msg._id}`);
            Message.findByIdAndDelete(msg._id).then(() => {
                console.log("message deleted");
                io.emit('message deleted', msg._id);
            }).catch((err) => {
                console.error(err);
            });
        } else if (deleterusername == msg.roomowner) {
            console.log(`deleting message ${msg._id}`);
            Message.findByIdAndDelete(msg._id).then(() => {
                console.log("message deleted");
                io.emit('message deleted', msg._id);
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