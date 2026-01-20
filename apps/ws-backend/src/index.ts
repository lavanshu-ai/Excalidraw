import http, { IncomingMessage, ServerResponse } from "http"
import { URLSearchParams } from "url"
import WebSocket,{WebSocketServer} from "ws"
import jwt from "jsonwebtoken"
import {JWT_SECRET} from "./config"
const server=http.createServer((req:IncomingMessage,res:ServerResponse)=>{
  console.log("request recieved"+req.url)
})
const wss=new WebSocketServer({server})
wss.on('connection',function connection(socket,request){
  socket.on('error',console.error);
  const url=request.url;
  if(!url) return;
  const queryParams=new URLSearchParams(url.split("?")[1])
  const token=queryParams.get('token') || "";
  const decoded=jwt.verify(token,JWT_SECRET)

  socket.on('message', function message(data,isBinary){
    wss.clients.forEach(function each(client){
      if(client.readyState===WebSocket.OPEN){
        client.send(data,{binary:isBinary})
      }
    })
  })
  socket.send('ping')
})
server.listen(8080)