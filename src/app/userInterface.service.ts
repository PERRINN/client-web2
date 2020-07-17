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
  currentTeam:string;
  currentTeamObj:any;
  currentTeamObjKey:string;
  currentUser:string;
  currentUserClaims:any;
  currentUserObj:any;
  currentUserTeamsObj:any;
  process:any;
  recipients:any;
  recipientList:any;
  chain:string;
  chatSubject:string;
  showChatDetails:boolean;

  constructor(
    private afAuth: AngularFireAuth,
    public afs: AngularFirestore
  ) {
    this.showChatDetails=false;
    this.chatSubject='';
    this.process={};
    this.recipients={};
    this.recipientList=[];
    this.chain='';
    this.afAuth.user.subscribe((auth) => {
      if (auth != null) {
        this.currentUser=auth.uid;
        afs.doc<any>('PERRINNTeams/'+this.currentUser).valueChanges().subscribe(snapshot=>{
          this.currentUserObj=snapshot;
        });
        firebase.auth().currentUser.getIdTokenResult().then(result=>{
          this.currentUserClaims=result.claims;
        });
        if(this.currentDomain==null)this.switchDomain(auth.uid)
      } else {
        this.currentUser=null;
        this.currentDomain=null;
        this.currentTeam=null;
      }
    });
  }

  switchDomain(domain){
    if(domain==this.currentDomain)return;
    this.currentDomain=domain;
    return this.afs.doc<any>('PERRINNTeams/'+this.currentDomain).valueChanges().subscribe(snapshot=>{
      this.currentDomainObj=snapshot;
    });
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
      chatSubject:this.chatSubject,
      chain:this.chain,
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

  objectToArray(obj) {
    if (obj == null) { return []; }
    return Object.keys(obj).map(function(key) {
      return [key, obj[key]];
    });
  }

}
