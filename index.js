require('dotenv').config();
const express = require('express');
const db = require('./config/mongoose');
const User = require('./models/userModel');
const Chat = require('./models/chatModel');

const app = express();
const port = 4000;
const userRoute = require('./routes/userRoutes.js');
app.use('/',userRoute);

const http = require('http').Server(app);

const io = require('socket.io')(http);
const usp = io.of('user-namespace');

usp.on('connection',async function(socket){
    const userId = socket.handshake.auth.token;
    console.log(userId);
    await User.findByIdAndUpdate({_id: userId},{$set:{is_online : '1'}});

    // broadcase the user online
    socket.broadcast.emit('getOnlineUser',{user_id : userId});

    socket.on('disconnect',async function(){
        const userId = socket.handshake.auth.token;
        await User.findByIdAndUpdate({_id: userId},{$set:{is_online : '0'}});
        // broadcase the user offline
        socket.broadcast.emit('getOfflineUser',{user_id : userId});
    });

    // chatting implementation
    socket.on('newChat',function(data){
        socket.broadcast.emit('loadNewChat',data);
    });

    // load old chats
    socket.on('existsChat',async function(data){
        var chats = await Chat.find({$or:[
            {sender_id: data.sender_id,receiver_id: data.receiver_id},
            {sender_id: data.receiver_id, receiver_id: data.sender_id}
        ]});

        socket.emit('loadChats',{chats : chats})
    });

    // delete chats
    socket.on('chatDeleted',function(id){
        socket.broadcast.emit('chatMessageDeleted',id);
    });

    // new group chat added
    socket.on('newGroupChat',function(data){
        socket.broadcast.emit('loadNewGroupChat',data)
    });

    socket.on('groupChatDeleted',function(id){
        socket.broadcast.emit('groupChatMessageDeleted',id)
    })
})


http.listen(port,function(err){
    if(err){
        console.log("error in server : ",err);

    }else{
        console.log(`Server is running on port : ${port}`);
    }
})