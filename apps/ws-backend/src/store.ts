import  {RedisClientType,createClient} from "redis";
import { WebSocket } from "ws";

export class RoomManager{

  private static instance:RoomManager;
  private RoomSockets:Map<string,Set<WebSocket>>;
  private SubClient:RedisClientType;
  private PubClient:RedisClientType;
  private dbClient:RedisClientType;
  private ready:Promise<void>;
  private constructor(){
    this.SubClient= createClient();
    this.PubClient= createClient();
    this.dbClient=createClient();
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

  async CreateRoom(userId:string,roomId:string,ws:WebSocket){
    const exists=await this.dbClient.exists(`room:${roomId}:admin`)
    if(exists){
      console.log('room already exist')
      return; 
    }
    try {
    await this.dbClient.multi()
    .set(`room:${roomId}:admin`,userId)
    .sAdd(`room:${roomId}:users`,userId)
    .exec();
    }catch(e){
      console.error("failed to create room",e)
    }
    try{
    await this.JoinRoom(userId,roomId,ws);
    }
    catch(e){
      await this.RemoveRoom(roomId)
      console.error("failed to create room",e)
    }
  }
  async JoinRoom(userId:string,roomId:string,ws:WebSocket){
    const exists=await this.dbClient.exists(`room:${roomId}:admin`)
    if(!exists){ 
      console.log("no room with name "+ roomId)
      return;
    } 
    const set = this.RoomSockets.get(roomId);

      if (set?.has(ws)) {
        console.log("already in room")      
          return;
        }

    try {
      await this.dbClient.sAdd(`room:${roomId}:users`,userId)
    }
    catch(e){
      console.error('failed to join',e);
      return;
    }
    if(!this.RoomSockets.has(roomId)){
      const set = new Set<WebSocket>();
      //this act as a lock if parallel join req come doble subscribe can be avoided as condition become true.
      this.RoomSockets.set(roomId,set)
      await this.SubClient.subscribe(roomId,(m)=>{
      this.Chat(roomId,m) 
    })
    }
    this.RoomSockets.get(roomId)?.add(ws);
    ws.on('close',async ()=>{
      await this.LeaveRoom(userId,roomId,ws)
    })   
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
    try {
    await this.dbClient.sRem(`room:${roomId}:users`,userId) 
    }catch(e){
      console.log('failed to leave room try again',e)
    }
    const set=this.RoomSockets.get(roomId);
    if(!set) return;
    set.delete(ws);
    if(set.size===0){
      this.RoomSockets.delete(roomId);
     await  this.SubClient.unsubscribe(roomId);
    }
    try{
      const admin=await this.dbClient.get(`room:${roomId}:admin`)    
    
    if(admin===userId){
      const newAdmin=await this.dbClient.sRandMember(`room:${roomId}:users`);
      if(newAdmin){
        await this.dbClient.set(`room:${roomId}:admin`,newAdmin)
      }
      else{
       await this.RemoveRoom(roomId);
      }
    }
    }catch(e){
      console.log('failed update admin',e)
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
    if(this.RoomSockets.has(roomId)){
      this.RoomSockets.delete(roomId)
    }
    await this.SubClient.unsubscribe(roomId)
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