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

  constructor(
    private afAuth: AngularFireAuth,
    public afs: AngularFirestore
  ) {
    this.afAuth.user.subscribe((auth) => {
      if (auth != null) {
        this.currentUser=auth.uid
        afs.collection<any>('PERRINNMessages',ref=>ref.where('user','==',this.currentUser).where('verified','==',true).orderBy('serverTimestamp','desc').limit(1)).valueChanges().subscribe(snapshot=>{
          this.currentUserLastMessageObj=snapshot[0]
          this.currentUserIsMember=(((snapshot[0].PERRINN||{}).wallet||{}).balance<50)||false
        })
      } else {
        this.currentUser=null
        this.currentUserIsMember=false
      }
    })
  }

  createMessage(messageObj){
    messageObj.text=messageObj.text.replace(/(\r\n|\n|\r)/gm, '')
    if (!messageObj.text&&!messageObj.chatImageTimestamp) return null
    messageObj.serverTimestamp=firebase.firestore.FieldValue.serverTimestamp()
    messageObj.user=this.currentUser
    messageObj.name=messageObj.name||this.currentUserLastMessageObj.name||''
    messageObj.imageUrlThumbUser=messageObj.imageUrlThumbUser||this.currentUserLastMessageObj.imageUrlThumbUser||''
    messageObj.PERRINN={}
    messageObj.PERRINN.emailNotifications=[]
    return this.afs.collection('PERRINNMessages').add(messageObj)
  }

  isContentAccessible(user){
    if(this.currentUserIsMember) return true
    if(user==this.currentUser)return true
    if(user=='QYm5NATKa6MGD87UpNZCTl6IolX2')return true
    if(user=='-L7jqFf8OuGlZrfEK6dT')return true
    return false
  }

  objectToArray(obj) {
    if (obj == null) { return [] }
    return Object.keys(obj).map(function(key) {
      return [key, obj[key]]
    })
  }

}
