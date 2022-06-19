const express=require("express");
const socketio=require("socket.io");
const path=require("path");
const http=require("http");
const app=express();
const server=http.createServer(app);
const io=socketio(server);
const formatMessage=require("./utils/messages");
const botName="Chat Bot";
const {userJoin,getCurrentUser,userLeave,getRoomUsers,}=require("./utils/users");
const { isTypedArray } = require("util/types");
//Set static folder
app.use(express.static(path.join(__dirname,"public")));

//Run when Client connects

io.on("connection",socket=>{
    socket.on("joinRoom",({username,room})=>{
        const user=userJoin(socket.id,username,room)
        socket.join(user.room);
        //welcome current user
        socket.emit("message",formatMessage(botName,"Welcome Home"))

        //Broadcast when a user connects

        socket.broadcast.to(user.room).emit("message",formatMessage(botName,`${user.username} has joined the chat`));
        //Send users Room info
        io.to(user.room).emit("roomUsers",{
            room:user.room,
            users:getRoomUsers(user.room),
        })
    })
    //Listen for chatMessage
    socket.on("chatMessage",(msg)=>{
        const user=getCurrentUser(socket.id);
        io.to(user.room).emit("message",formatMessage(user.username,msg));
    })
    //Runs when clients disconnects
    socket.on("disconnect",()=>{
        const user=userLeave(socket.id);
        if(user){
            io.to(user.room).emit("message",formatMessage(botName,`${user.username} has left the chat`));
            io.to(user.room).emit("roomUsers",{
                room:user.room,
                users:getRoomUsers(user.room),
            })
        }
    })
})



server.listen(8000,()=>{
    console.log("Server running");
})