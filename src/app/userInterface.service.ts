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
  currentDomainObj:any;
  currentDomainLastMessageObj:any;
  currentUser:string;
  currentUserClaims:any;
  currentUserObj:any;
  currentUserLastMessageObj:any;
  process:any;
  recipients:any;
  recipientList:any;
  showChatDetails:boolean;

  constructor(
    private afAuth: AngularFireAuth,
    public afs: AngularFirestore
  ) {
    this.showChatDetails=false;
    this.process={};
    this.recipients={};
    this.recipientList=[];
    this.afAuth.user.subscribe((auth) => {
      if (auth != null) {
        this.currentUser=auth.uid;
        afs.collection<any>('PERRINNMessages',ref=>ref.where('user','==',this.currentUser).where('verified','==',true).orderBy('serverTimestamp','desc').limit(1)).valueChanges().subscribe(snapshot=>{
          this.currentUserLastMessageObj=snapshot[0];
        });
        afs.doc<any>('PERRINNTeams/'+this.currentUser).valueChanges().subscribe(snapshot=>{
          this.currentUserObj=snapshot;
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
    if(domain==this.currentDomain)return;
    this.currentDomain=domain;
    this.afs.doc<any>('PERRINNTeams/'+this.currentDomain).valueChanges().subscribe(snapshot=>{
      this.currentDomainObj=snapshot;
    })
    this.afs.collection<any>('PERRINNMessages',ref=>ref.where('domain','==',this.currentDomain).where('verified','==',true).orderBy('serverTimestamp','desc').limit(1)).valueChanges().subscribe(snapshot=>{
      this.currentDomainLastMessageObj=snapshot[0];
    })
  }

  addRecipient(user){
    return this.afs.doc('PERRINNTeams/'+user).ref.get().then(snapshot=>{
      this.recipients[user]=
      {
        name:snapshot.data().name,
        familyName:snapshot.data().familyName,
        imageUrlThumb:snapshot.data().imageUrlThumb
      }
      this.refreshRecipientList();
    });
  }

  clearRecipient(){
    this.recipients={};
  }

  refreshRecipientList(){
    let recipientArray=[];
    Object.keys(this.recipients).forEach(key=>{
      recipientArray.push(key);
    });
    this.recipientList=recipientArray;
  }

  createMessageAFS(text,image,imageDownloadURL,auto,pin){
    text = text.replace(/(\r\n|\n|\r)/gm, '');
    if (text==''&&image=='') return null;
    const now = Date.now();
    this.refreshRecipientList();
    this.afs.collection('PERRINNMessages').add({
      timestamp: now,
      serverTimestamp:firebase.firestore.FieldValue.serverTimestamp(),
      recipientList:this.recipientList,
      domain:this.currentDomain,
      user:this.currentUser,
      text:text,
      image:image,
      imageDownloadURL:imageDownloadURL,
      process:this.process,
      auto:auto,
      pin:pin
    }).then(()=>{
      this.process={};
      return null;
    });
  }

  createMessage(messageObj){
    messageObj.text=messageObj.text.replace(/(\r\n|\n|\r)/gm, '');
    if (!messageObj.text&&!messageObj.image) return null;
    this.refreshRecipientList();
    messageObj.serverTimestamp=firebase.firestore.FieldValue.serverTimestamp();
    messageObj.user=this.currentUser;
    messageObj.recipientList=this.recipientList;
    messageObj.domain=messageObj.domain||this.currentDomain||this.currentUser;
    messageObj.process=this.process;
    messageObj.PERRINN={};
    messageObj.PERRINN.emailNotifications=[];
    this.afs.collection('PERRINNMessages').add(messageObj).then(()=>{
      this.process={};
      return null;
    });
  }

  objectToArray(obj) {
    if (obj == null) { return []; }
    return Object.keys(obj).map(function(key) {
      return [key, obj[key]];
    });
  }

}
