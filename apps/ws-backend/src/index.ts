import http, { IncomingMessage, ServerResponse } from "http"
import WebSocket,{WebSocketServer} from "ws"

const server=http.createServer((req:IncomingMessage,res:ServerResponse)=>{
  console.log("request recieved"+req.url)
})
const wss=new WebSocketServer({server})
wss.on('connection',function connection(socket){
  socket.on('error',console.error);
  socket.on('message', function message(data,isBinary){
    wss.clients.forEach(function each(client){
      if(client.readyState===WebSocket.OPEN){
        client.send(data,{binary:isBinary})
      }
    })
  })
})
server.listen(8080)