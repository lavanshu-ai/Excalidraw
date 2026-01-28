import { connectionMap } from ".";
import  {RedisClientType,createClient} from "redis";
export class RoomManager{

  private static instance:RoomManager;
  private Rooms :Map<string,{adminId:string,users:Set<string>}>;
  private SubClient:RedisClientType;
  private PubClient:RedisClientType;
  private constructor(){
    this.SubClient= createClient();
    this.PubClient= createClient();
    this.Rooms=new Map();
    this.init();
  }
  private async init(){
    await this.PubClient.connect();
    await this.SubClient.connect();
  }
  static getInstance(){
    if(!RoomManager.instance){
      RoomManager.instance=new RoomManager();
    }
    return RoomManager.instance
  }

  CreateRoom(userId:string,roomId:string){
    if(!roomId) return;
    if(this.Rooms.has(roomId)){
      console.log('room already exist')
      return; 
    }
    const u:Set<string>= new Set();
    u.add(userId)
    this.Rooms.set(roomId,{adminId:userId,users:u});
    this.SubClient.subscribe(roomId,(m)=>{
      this.Chat(roomId,m)
    })
  }
  JoinRoom(userId:string,roomId:string){
    const room=this.Rooms.get(roomId);
    if(!room){ 
      console.log("no room with name "+ roomId)
      return;
    }
    room.users.add(userId);
     this.SubClient.subscribe(roomId,(m)=>{
      this.Chat(roomId,m)
    })
  }
  Publish(userId:string,roomId:string,message:string){
    const room = this.Rooms.get(roomId);
    if(!room) return;
    if(!room.users.has(userId)){
      console.log('You are not part of this room')
      return;
    }
    return this.PubClient.publish(roomId,JSON.stringify({
      from:userId
    }))
  }
  LeaveRoom(userId:string,roomId:string){
     const room=this.Rooms.get(roomId);
    if(!room){ 
      console.log("no room with name "+ roomId)
      return;
    }
    room.users.delete(userId);
     if (room.adminId === userId) {
    room.adminId = room.users.values().next().value ?? ""; //Set.values() returns an iterator.Gets the first element directly, without creating an array.
  }

    if(room.users.size==0){
      this.RemoveRoom(roomId,userId)
    }    
  }
  RemoveRoom(roomId:string,userId:string){
    const room=this.Rooms.get(roomId);
    if(!room){
      console.log("no room with name "+ roomId)
      return
    }
    if(userId===room.adminId||room.users.size===0){
    this.Rooms.delete(roomId);
    this.SubClient.unsubscribe(roomId)
    }
  }
  Chat(roomId:string,payload:string){
    const room=this.Rooms.get(roomId)
    if(!room){
      console.log("no room exist")
      return
    }
    room.users.forEach((id)=>{
      const ws=connectionMap.get(id);
      if(ws && ws?.readyState===WebSocket.OPEN){
        ws?.send(JSON.stringify({
        type:"Chat",
        message:payload,
        roomId
      }))
      }      
    }) 
  }
   public async disconnect() {
        await this.SubClient.quit();
        await this.PubClient.quit();
    }
}