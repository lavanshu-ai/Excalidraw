import { URLSearchParams } from "url"
import WebSocket,{WebSocketServer} from "ws"
import jwt, { JwtPayload } from "jsonwebtoken"
import {JWT_SECRET} from "@repo/backend-common"
import { RoomManager } from "./store";

export const connectionMap=new Map<string,WebSocket>();
const wss=new WebSocketServer({port:8080});

function CheckUser(token:string):string | null{
 
  const decoded=jwt.verify(token,JWT_SECRET)
    if(typeof decoded=="string"){
      return null;
    }
    if(!decoded || !decoded.userId){
      return null;
    }
 return decoded.userId;
}
wss.on('connection',function connection(ws,request){
  ws.on('error',console.error);
   const url=request.url;
  if(!url) return false;

  const queryParams=new URLSearchParams(url.split("?")[1])
  const token=queryParams.get('token') || "";
  const userId=CheckUser(token);
  if(!userId){
    ws.close();
    return null;
  }
  connectionMap.set(userId,ws);
  ws.on('message', function message(data,){
    const parsedData=JSON.parse(data.toString());
    switch(parsedData.type){
      case "CREATE_ROOM":{
        RoomManager.getInstance().CreateRoom(userId,parsedData.roomId);
      break;
      }
       case "JOIN_ROOM":{
        RoomManager.getInstance().JoinRoom(userId,parsedData.roomId);
      break;
      }
       case "LEAVE_ROOM":{
        RoomManager.getInstance().LeaveRoom(userId,parsedData.roomId);
      break;
      }
       case "REMOVE_ROOM":{
        RoomManager.getInstance().adminRemoveRoom(userId,parsedData.roomId);
      break;
      }
       case "CHAT":{
        RoomManager.getInstance().Chat(parsedData.roomId,parsedData.payload);
      break;
      }
    }
    
    wss.clients.forEach(function each(client){
      if(client.readyState===WebSocket.OPEN){
        client.send(data)
      }
    })
  })
  ws.send('ping')
})
