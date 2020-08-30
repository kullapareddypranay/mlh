const express=require('express')
require('./database/mongoose')
const userrouter=require('./routers/user')
const users=[]
const app=express()
const socketio=require('socket.io')
const http=require('http')
const Msg = require('./models/msg')
const {addUser,removeUser,getUser,getUserRoom}=require('./utils/user')

//create http server using express app
const server=http.createServer(app)
//connect socket.io to http server,ca
const io=socketio(server)



const port=process.env.PORT || 3000 
app.use(express.json())
app.use(userrouter)



io.on('connection',(socket)=>{
    var room
    var _id
    console.log('startedconnection')


    socket.emit('message',generateMessage('welcome'))


    //userid is sent from client side  as msg in the following connection on users
    socket.on('users',(msg)=>{
        _id=msg.username
       room=msg.room
    //    console.log(room)
    //    console.log(_id)
    })

    socket.on('sendmessage',(msg,callback)=>{
        const message=new Msg({owner:_id,msg,roomid:room})
        message.save()
        io.to(room).emit('message',generateMessage(msg))
        callback()
    })

      //room creation
        // socket.on('join',({username,room},callback)=>{
        //     const {error,user}=addUser({id:socket.id,username,room})
        //     if(error){
        //         return callback(error)
        //     }
        //     socket.join(user.room)
        //     socket.emit('message',generateMessage('welcome'))
        //     socket.broadcast.to(room).emit('message',generateMessage(`${user.username} has joined `))

        //     callback()
        // })

    socket.on('join',({username,room},callback)=>{
        const user=User.findById(username)
        const socketid=socket.id
        user.sockets=user.sockets.concat({socketid})
        user.save()
        socket.join(room)
        socket.emit('message',generateMessage('welcome'))
        socket.broadcast.to(room).emit('message',generateMessage(`${username} has joined`))
    })

     // socket.on('disconnect',()=>{
        //     const user=removeUser(socket.id)
        //     if(user){
        //         io.to(user.room).emit('message',generateMessage(`${user.username} has left`))
        //     }
          
        // })

    socket.on('disconnect',()=>{
        const socketid=socket.id
        const user=User.findById(_id)
        user.sockets=user.sockets.filter((socket)=>{
            return socket.socketid!==socketid
        })
    })
})


app.get('/previousmessages/:id',async(req,res)=>{
    const roomid=req.params.id
    try{
        const msgs=await Msg.find({roomid:roomid})
        res.send(msgs)
    }catch(e){
        res.send(e)
    }
})




server.listen(port,()=>{
    console.log('server is up on port '+port)
})