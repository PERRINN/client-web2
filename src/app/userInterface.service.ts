import { Injectable }    from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import * as firebase from 'firebase/app';

@Injectable()
export class UserInterfaceService {
  globalChatActivity:boolean;
  loading:boolean;
  currentUser:string;
  currentUserLastMessageObj:any;
  showChatDetails:boolean;

  constructor(
    private afAuth: AngularFireAuth,
    public afs: AngularFirestore
  ) {
    this.showChatDetails=false;
    this.afAuth.user.subscribe((auth) => {
      if (auth != null) {
        this.currentUser=auth.uid;
        afs.collection<any>('PERRINNMessages',ref=>ref.where('user','==',this.currentUser).where('verified','==',true).orderBy('serverTimestamp','desc').limit(1)).valueChanges().subscribe(snapshot=>{
          this.currentUserLastMessageObj=snapshot[0];
        });
      } else {
        this.currentUser=null;
      }
    });
  }

  createMessage(messageObj){
    messageObj.text=messageObj.text.replace(/(\r\n|\n|\r)/gm, '');
    if (!messageObj.text&&!messageObj.image) return null;
    messageObj.serverTimestamp=firebase.firestore.FieldValue.serverTimestamp();
    messageObj.user=this.currentUser;
    messageObj.PERRINN={};
    messageObj.PERRINN.emailNotifications=[];
    return this.afs.collection('PERRINNMessages').add(messageObj)
  }

  objectToArray(obj) {
    if (obj == null) { return []; }
    return Object.keys(obj).map(function(key) {
      return [key, obj[key]];
    });
  }

}
