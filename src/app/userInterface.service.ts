import { Injectable }    from '@angular/core'
import { AngularFireAuth } from '@angular/fire/auth'
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore'
import { map } from 'rxjs/operators'
import * as firebase from 'firebase/app'

@Injectable()
export class UserInterfaceService {
  globalChatActivity:boolean
  loading:boolean
  currentUser:string
  currentUserIsMember:boolean
  currentUserLastMessageObj:any
  nowSeconds:number
  searchNameIndex:any
  userObjectIndex:any

  constructor(
    private afAuth: AngularFireAuth,
    public afs: AngularFirestore
  ) {
    this.searchNameIndex=[]
    this.userObjectIndex=[]
    this.nowSeconds=Math.floor(Date.now()/1000)
    setInterval(()=>{this.nowSeconds=Math.floor(Date.now()/1000)},60000)
    this.afAuth.user.subscribe((auth) => {
      if (auth != null) {
        this.currentUser=auth.uid
        afs.collection<any>('PERRINNMessages',ref=>ref.where('user','==',this.currentUser).where('verified','==',true).orderBy('serverTimestamp','desc').limit(1)).valueChanges().subscribe(snapshot=>{
          this.currentUserLastMessageObj=snapshot[0]
          this.currentUserIsMember=(((snapshot[0].PERRINN||{}).wallet||{}).balance>0)||false
        })
      } else {
        this.currentUser=null
        this.currentUserIsMember=false
      }
    })
  }


  userObjectIndexPopulate(message){
    if(!this.searchNameIndex.includes(message.searchName)){
      this.searchNameIndex.push(message.searchName)
      this.userObjectIndexPopulateObject(this.searchNameIndex.indexOf(message.searchName),message.user,message.name,message.familyName)
    }
    message.recipientList.forEach(recipient=>{
      if(message.recipients[recipient].searchName&&!this.searchNameIndex.includes(message.recipients[recipient].searchName)){
        this.searchNameIndex.push(message.recipients[recipient].searchName)
        this.userObjectIndexPopulateObject(this.searchNameIndex.indexOf(message.recipients[recipient].searchName),recipient,message.recipients[recipient].name,message.recipients[recipient].familyName)
      }
    })
  }

  userObjectIndexPopulateObject(index,user,name,familyName){
    this.userObjectIndex[index]={
      user:user,
      name:name,
      familyName:familyName
    }
  }

  createMessage(messageObj){
    if (!messageObj.text&&!messageObj.chatImageTimestamp) return null
    messageObj.serverTimestamp=firebase.firestore.FieldValue.serverTimestamp()
    messageObj.user=this.currentUser
    messageObj.name=messageObj.name||this.currentUserLastMessageObj.name||''
    messageObj.imageUrlThumbUser=messageObj.imageUrlThumbUser||this.currentUserLastMessageObj.imageUrlThumbUser||''
    messageObj.PERRINN={}
    messageObj.reads={[this.currentUser]:true}
    return this.afs.collection('PERRINNMessages').add(messageObj)
  }

  isContentAccessible(user){
    if(this.currentUserIsMember) return true
    if(user==this.currentUser)return true
    if(user=='QYm5NATKa6MGD87UpNZCTl6IolX2')return true
    if(user=='-L7jqFf8OuGlZrfEK6dT')return true
    return false
  }

}
