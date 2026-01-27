export class RoomManager{

  private static instance:RoomManager;
  private Rooms :Map<string,string[]>;

  private constructor(){
    
    this.Rooms=new Map();
  }
 private async init (){
    console.log("connected to redis client")
 }
  static getInstance(){
    if(!RoomManager.instance){
      RoomManager.instance=new RoomManager();
    }
    return RoomManager.instance
  }

  CreateRoom(userId:string,roomName:string){
    if(!roomName) return;
    if(this.Rooms.get(roomName)){
      console.log('room already exist')
      return; 
    }
    this.Rooms.set(roomName,[userId])
  }
  JoinRoom(userId:string,roomName:string){
    const room=this.Rooms.get(roomName);
    if(!room){ 
      console.log("no room with name "+ roomName)
      return;
    }
    room.push(userId);
  }
  LeaveRoom(userId:string,roomName:string){
     const room=this.Rooms.get(roomName);
    if(!room){ 
      console.log("no room with name "+ roomName)
      return;
    }
    this.Rooms.set(roomName,this.Rooms.get(roomName)?.filter((id)=>id!==userId)||[])
    if(this.Rooms.get(roomName)?.length==0){
      this.RemoveRoom(roomName)
    }    
  }
  private RemoveRoom(roomName:string){
    this.Rooms.delete(roomName);
  }
}