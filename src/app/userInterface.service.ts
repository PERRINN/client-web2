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
  recipientIndex: string;
  chatSubject: string;
  lastVisitsArray: any[];
  showChatDetails: boolean;

  constructor(
    private afAuth: AngularFireAuth,
    public db: AngularFireDatabase,
    public afs: AngularFirestore
  ) {
    this.showChatDetails=false;
    this.chatSubject='';
    this.lastVisitsArray=[];
    this.process = {};
    this.recipients={};
    this.recipientList=[];
    this.recipientIndex='';
    this.afAuth.user.subscribe((auth) => {
      if (auth != null) {
        this.currentUser=auth.uid;
        afs.doc<any>('PERRINNTeams/'+this.currentUser).valueChanges().subscribe(snapshot=>{
          this.currentUserObj = snapshot;
        });
        afs.collection<any>('PERRINNTeams/'+this.currentUser+'/lastVisits/',ref=>ref.limit(200)).valueChanges({idField:'id'}).subscribe(snapshot=>{
          snapshot.forEach(visit=>{
            this.lastVisitsArray[visit.id]=visit;
          });
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
      this.refreshRecipientIndex();
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

  refreshRecipientIndex(){
    let index='';
    let chatSubject='';
    if(this.chatSubject!=undefined)chatSubject=this.chatSubject.replace(/\s+/g,'');
    let recipientArray=[];
    Object.keys(this.recipients).forEach(key=>{
      recipientArray.push(key);
    });
    recipientArray.sort();
    recipientArray.forEach(recipient=>{
      index=index+recipient;
    });
    this.recipientIndex=chatSubject+index;
  }

  createMessage(text, image, imageDownloadURL, linkTeamObj, linkUserObj) {
    text = text.replace(/(\r\n|\n|\r)/gm, '');
    if (text == '' && image == '' && !this.IsProcessInputsComplete()) return null;
    const now = Date.now();
    const messageID = this.db.list('ids/').push(true).key;
    const updateObj = {};
    updateObj['teamMessages/' + this.currentTeam + '/' + messageID + '/payload'] = {
      timestamp: now,
      text,
      user: this.currentUser,
      name: this.currentUserObj.name,
      imageUrlThumbUser: this.currentUserObj.imageUrlThumb,
      image,
      imageDownloadURL,
      linkTeam: linkTeamObj.key ? linkTeamObj.key : null,
      linkTeamName: linkTeamObj.name ? linkTeamObj.name : null,
      linkTeamImageUrlThumb: linkTeamObj.imageUrlThumb ? linkTeamObj.imageUrlThumb : null,
      linkUser: linkUserObj.key ? linkUserObj.key : null,
      linkUserName: linkUserObj.name ? linkUserObj.name : null,
      linkuserFamilyName: linkUserObj.familyName ? linkUserObj.familyName : null,
      linkUserImageUrlThumb: linkUserObj.imageUrlThumb ? linkUserObj.imageUrlThumb : null,
    };
    if (this.IsProcessInputsComplete()) {
      updateObj['teamMessages/' + this.currentTeam + '/' + messageID + '/process'] = this.process[this.currentTeam];
    }
    this.db.database.ref().update(updateObj);
    this.timestampChatVisit();
    this.clearProcessData();
  }

  createMessageAFS(user, text, image, imageDownloadURL){
    text = text.replace(/(\r\n|\n|\r)/gm, '');
    const now = Date.now();
    this.refreshRecipientIndex();
    this.refreshRecipientList();
    this.recipients[this.currentUser]={
      name:this.currentUserObj.name,
      familyName:this.currentUserObj.familyName,
      imageUrlThumb:this.currentUserObj.imageUrlThumb
    };
    this.afs.collection('PERRINNTeams').doc(user).collection('messages').add({
      timestamp: now,
      serverTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
      chatSubject:this.chatSubject,
      recipientIndex:this.recipientIndex,
      recipients: this.recipients,
      recipientList: this.recipientList,
      user: this.currentUser,
      name: this.currentUserObj.name,
      imageUrlThumbUser: this.currentUserObj.imageUrlThumb,
      text:text,
      image:image,
      imageDownloadURL:imageDownloadURL
    }).then(()=>{
      this.timestampChatVisit();
      this.clearProcessData();
      return null;
    });
  }

  IsProcessInputsComplete() {
    if (this.process[this.currentTeam] == undefined) {return false; }
    if (this.process[this.currentTeam] == null) {return false; }
    if (this.process[this.currentTeam].inputsComplete == undefined) {return false; }
    if (this.process[this.currentTeam].inputsComplete == null) {return false; }
    if (this.process[this.currentTeam].inputsComplete) {return true; }
    return false;
  }

  clearProcessData() {
    this.process[this.currentTeam] = {};
  }

  timestampChatVisit() {
    const now = Date.now();
    this.afs.doc<any>('PERRINNTeams/'+this.currentUser+/lastVisits/+this.recipientIndex).set({
      serverTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
      timestamp:now
    });
  }

  objectToArray(obj) {
    if (obj == null) { return null; }
    return Object.keys(obj).map(function(key) {
      return [key, obj[key]];
    });
  }

}
