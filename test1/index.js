const express= require("express")
const app= express()
const http = require("http")
const {Server}= require("socket.io")
const http_server= http.createServer(app)
const io= new Server(http_server)

io.on("connection",(socket)=>{
    console.log("client connected");
})


app.get("/",(req,res)=>{
    res.send("home page h bhaiya")
})



http_server.listen(9090,()=>{
    console.log("server is running on 9090");
})