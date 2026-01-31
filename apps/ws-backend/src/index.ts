import { URLSearchParams } from "url"
import WebSocket,{WebSocketServer} from "ws"
import jwt, { JwtPayload } from "jsonwebtoken"
import {JWT_SECRET} from "@repo/backend-common"
import { RoomManager } from "./store";

const wss=new WebSocketServer({port:8080});

function CheckUser(token:string):string | null{
 try {
  const decoded=jwt.verify(token,JWT_SECRET) as JwtPayload;
    if(typeof decoded=="string"){
      return null;
    }
    if(!decoded || !decoded.userId){
      return null;
    }
  return decoded.userId;
 }
  catch(e){
    console.log('invalid token',e)
    return null
  }
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
  ws.on('message',async  function message(data,){
    await RoomManager.getInstance().waitReady();
    let parsedData;
    try{
     parsedData=JSON.parse(data.toString());
    }catch(e){
      console.log("invalid message",e)
      return;
    }
    switch(parsedData.type){
      case "CREATE_ROOM":{
        if (!parsedData.roomId) return;
        await RoomManager.getInstance().CreateRoom(userId,parsedData.roomId,ws);
      break;
      }
       case "JOIN_ROOM":{
        if (!parsedData.roomId) return;
        await RoomManager.getInstance().JoinRoom(userId,parsedData.roomId,ws);
      break;
      }
       case "LEAVE_ROOM":{
        if (!parsedData.roomId) return;
       await RoomManager.getInstance().LeaveRoom(userId,parsedData.roomId,ws);
      break;
      }
       case "REMOVE_ROOM":{
        if (!parsedData.roomId) return;
       await RoomManager.getInstance().adminRemoveRoom(parsedData.roomId,userId);
      break;
      }   
      default:
     console.log("unknown type", parsedData.type);
    }
  })
  ws.send('ping')
})
