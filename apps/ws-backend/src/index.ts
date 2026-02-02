import { URLSearchParams } from "url"
import {WebSocketServer} from "ws"
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
  return (decoded.userId).toString();
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
  if (!token) {
  ws.close(1008, "No token");
  return;
}

const userId = CheckUser(token);

if (!userId) {
  ws.close(1008, "Invalid token");
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
    parsedData.roomId=parsedData.roomId.toString();
    switch(parsedData.type){
      case "CREATE_ROOM":{
        if (!parsedData.roomId) return;
        await RoomManager.getInstance().CreateRoom(userId,parsedData.roomId,ws);
        console.log("room created",parsedData.roomId)
      break;
      }
       case "JOIN_ROOM":{
        if (!parsedData.roomId) return;
        await RoomManager.getInstance().JoinRoom(userId,parsedData.roomId,ws);
        console.log("room joined")

      break;
      }
       case "PUBLISH":{
        if (!parsedData.roomId || !parsedData.message) return;
       await RoomManager.getInstance().Publish(userId,parsedData.roomId,parsedData.message);
        console.log("message published ")

      break;
      }   
       case "LEAVE_ROOM":{
        if (!parsedData.roomId) return;
       await RoomManager.getInstance().LeaveRoom(userId,parsedData.roomId,ws);
        console.log("left room ",parsedData.roomId)

      break;
      }
       case "REMOVE_ROOM":{
        if (!parsedData.roomId) return;
       await RoomManager.getInstance().adminRemoveRoom(parsedData.roomId,userId);
        console.log("room deleted")
      break;
      }   
      default:
     console.log("unknown type", parsedData.type);
    }
  })
  ws.send('ping')
})
