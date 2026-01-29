import { connectionMap } from ".";
import  {RedisClientType,createClient} from "redis";
import { WebSocket } from "ws";

export class RoomManager{

  private static instance:RoomManager;
  private subscriptions:Set<string>;
  private RoomSockets:Map<string,Set<WebSocket>>;
  private SubClient:RedisClientType;
  private PubClient:RedisClientType;
  private dbClient:RedisClientType;
  private ready:Promise<void>;
  private constructor(){
    this.SubClient= createClient();
    this.PubClient= createClient();
    this.dbClient=createClient();
    this.subscriptions=new Set();
    this.RoomSockets=new Map();
    this.ready=this.init();
  }
  private async init(){
    try{
      await this.PubClient.connect();
      await this.SubClient.connect();
      await this.dbClient.connect();
    }
    catch(e){
      console.error("redis connection failed ", e)
    }
    
  }
  static getInstance(){
    if(!RoomManager.instance){
      RoomManager.instance=new RoomManager();
    }
    return RoomManager.instance
  }
  public async waitReady(){
    await this.ready;         //we get ready when init(promise) is completed
  }

  async CreateRoom(userId:string,roomId:string){
    if(!roomId) return;
    const exists=await this.dbClient.exists(`room:${roomId}:admin`)
    if(exists){
      console.log('room already exist')
      return; 
    }
    const u:Set<string>= new Set();
    u.add(userId)
    try {
    await this.dbClient.multi()
    .set(`room:${roomId}:admin`,userId)
    .sAdd(`room:${roomId}:users`,userId)
    .exec();
    }catch(e){
      console.error("failed to create room",e)
    }
    this.RoomSockets.set(roomId,new Set())
     const userSocket=connectionMap.get(userId)
    if(!userSocket) return;
    this.RoomSockets.get(roomId)?.add(userSocket)
   
  }
  async JoinRoom(userId:string,roomId:string,ws:WebSocket){
    const exists=await this.dbClient.exists(`room:${roomId}:admin`)
    if(!exists){ 
      console.log("no room with name "+ roomId)
      return;
    }
    
    this.RoomSockets.get(roomId)?.add(ws)
    try {
      await this.dbClient.sAdd(`room:${roomId}:users`,userId)
    }
    catch(e){
      console.error('failed to join',e)
    }
   
    if(!this.subscriptions.has(roomId)){
      this.subscriptions.add(roomId);
      this.SubClient.subscribe(roomId,(m)=>{
      this.Chat(roomId,m) 
    })
    }
  }
  async Publish(userId:string,roomId:string,message:string){
    const exists=await this.dbClient.exists(`room:${roomId}:admin`)
    if(!exists){ 
      console.log("no room with name "+ roomId)
      return;
    }
    const isMember=await this.dbClient.sIsMember(`room:${roomId}:users`,userId)
    if(!isMember){
      console.log('You are not part of this room')
      return;
    }
    return this.PubClient.publish(roomId,JSON.stringify({
      from:userId,
      message,
      time:Date.now()
    }))
  }
  async LeaveRoom(userId:string,roomId:string,ws:WebSocket){
   const exists=await this.dbClient.exists(`room:${roomId}:admin`)
    if(!exists){ 
      console.log("no room with name "+ roomId)
      return;
    }
    await this.dbClient.sRem(`room:${roomId}:users`,userId) 
    //room.adminId = room.users.values().next().value ?? ""; //next().value returns an iterator.Gets the first element directly, without creating an array.
    const admin=await this.dbClient.get(`room:${roomId}:admin`)
   
    this.RoomSockets.get(roomId)?.delete(ws);
    
    if(admin===userId){
      const newAdmin=await this.dbClient.sRandMember(`room:${roomId}:users`);
      if(newAdmin){
        await this.dbClient.set(`room:${roomId}:admin`,newAdmin)
      }
      else{
        this.RemoveRoom(roomId)
      }
    }
  }
  private async RemoveRoom(roomId:string){
    await this.dbClient.multi()
    .del(`room:${roomId}:admin`)
    .del(`room:${roomId}:users`)
    .exec();
  }
  async adminRemoveRoom(roomId:string,userId:string){
   const exists=await this.dbClient.exists(`room:${roomId}:admin`)
    if(!exists){ 
      console.log("no room with name "+ roomId)
      return;
    }
    const admin=await this.dbClient.get(`room:${roomId}:admin`)
    if(userId===admin){
      try{
     await this.dbClient.multi()
    .del(`room:${roomId}:admin`)
    .del(`room:${roomId}:users`)
    .exec();
      }catch(e){

      }
   
    this.SubClient.unsubscribe(roomId)
    }
  }
  private async Chat(roomId:string,payload:string){
    const sockets=this.RoomSockets.get(roomId)
    if(!sockets){
      console.log('message failed')
      return;
    }
    sockets.forEach((ws)=>{
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
        await this.dbClient.quit();

    }
}