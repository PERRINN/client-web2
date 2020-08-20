import { Injectable }    from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import * as firebase from 'firebase/app';

@Injectable()
export class UserInterfaceService {
  globalChatActivity:boolean;
  loading:boolean;
  currentDomain:string;
  currentDomainLastMessageObj:any;
  currentUser:string;
  currentUserClaims:any;
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
        firebase.auth().currentUser.getIdTokenResult().then(result=>{
          this.currentUserClaims=result.claims;
        });
      } else {
        this.currentUser=null;
        this.currentDomain=null;
      }
    });
  }

  switchDomain(domain){
    if(domain==this.currentDomain)return
    this.currentDomain=domain
    this.afs.collection<any>('PERRINNMessages',ref=>ref.where('domain','==',this.currentDomain).where('verified','==',true).orderBy('serverTimestamp','desc').limit(1)).valueChanges().subscribe(snapshot=>{
      this.currentDomainLastMessageObj=snapshot[0];
    })
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
