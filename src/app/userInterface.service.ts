import { Injectable }    from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import * as firebase from 'firebase/app';

@Injectable()
export class userInterfaceService {
  globalChatActivity: boolean;
  loading: boolean;
  focusUser: string;
  focusUserObj: any;
  currentTeam: string;
  currentTeamObj: any;
  currentTeamObjKey: string;
  currentUser: string;
  currentUserObj: any;
  currentUserTeamsObj: any;
  process: any;
  recipients: any;
  recipientList: any;
  chain: string;
  chatSubject: string;
  showChatDetails: boolean;

  constructor(
    private afAuth: AngularFireAuth,
    public db: AngularFireDatabase,
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
          this.currentUserObj = snapshot;
        });
        this.addRecipient(this.currentUser);
        if (this.focusUser == null) { this.focusUser = auth.uid; }
      } else {
        this.currentUser=null;
        this.focusUser=null;
        this.currentTeam=null;
      }
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

  createMessageAFS(user, text, image, imageDownloadURL){
    text = text.replace(/(\r\n|\n|\r)/gm, '');
    if (text==''&&image=='') return null;
    const now = Date.now();
    this.recipients[this.currentUser]={
      name:this.currentUserObj.name,
      familyName:this.currentUserObj.familyName,
      imageUrlThumb:this.currentUserObj.imageUrlThumb
    };
    this.refreshRecipientList();
    this.afs.collection('PERRINNMessages').add({
      timestamp: now,
      serverTimestamp:firebase.firestore.FieldValue.serverTimestamp(),
      chatSubject:this.chatSubject,
      chain:this.chain,
      recipients: this.recipients,
      recipientList: this.recipientList,
      emailNotifications: this.recipientList,
      lastMessage: true,
      user: this.currentUser,
      name: this.currentUserObj.name,
      imageUrlThumbUser: this.currentUserObj.imageUrlThumb,
      text:text,
      image:image,
      imageDownloadURL:imageDownloadURL,
      process:this.process
    }).then(()=>{
      this.process={};
      return null;
    });
  }

  objectToArray(obj) {
    if (obj == null) { return null; }
    return Object.keys(obj).map(function(key) {
      return [key, obj[key]];
    });
  }

}
