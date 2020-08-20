import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserInterfaceService } from './userInterface.service';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';

@Component({
  selector: 'chatModal',
  template: `

  <div class="sheet">
    <div class="fixed" id="overlay" style="z-index:99;background-color:#aaa;opacity:0.5;width:100%;height:100vh;cursor:pointer" (click)="readAll()"></div>
  </div>
  <div class="sheet">
    <div class="fixed" style="z-index:999999;top:100px">
      <ul style="list-style:none">
        <li *ngFor="let message of messages|async;let first=first;let last=last;let i=index" style="cursor:pointer" (click)="readMessage(message.key)">
          <div *ngIf="(reads[message.key]==undefined)&&(message.payload?.reads==undefinied?true:!message.payload?.reads[UI.currentUser])">
            <div style="float:left;width:100px;padding:5px">
              <span style="color:#777;font-size:12px;font-weight:bold;display:inline;float:left">{{message.payload?.name}}</span>
            </div>
            <div style="padding:3px">
              <span style="color:#777;font-size:12px">{{message.payload?.chatSubject}} </span>
              <span style="color:#404040;font-size:12px" [innerHTML]="message.payload?.text | linky"></span>
            </div>
            <div class="seperator" style="width:100%;margin:0px"></div>
            {{showOverlay()}}
          </div>
        </li>
      </ul>
    </div>
  </div>
    `
})
export class ChatModalComponent {
  messages:Observable<any[]>;
  messageList:any;
  reads:any;

  constructor(
    public afAuth: AngularFireAuth,
    public afs: AngularFirestore,
    public UI: UserInterfaceService,
  ) {
    this.reads={};
    this.messageList={};
    this.refreshMessages();
  }

  ngOnInit() {
    this.hideOverlay();
  }

  refreshMessages() {
    this.afAuth.user.subscribe((auth) => {
      if (auth != null) {
        this.messages=this.afs.collection<any>('PERRINNMessages',ref=>ref
          .where('recipientList','array-contains',auth.uid)
          .where('auto','==',true)
          .orderBy('serverTimestamp','desc')
          .limit(5)
        ).snapshotChanges().pipe(map(changes => {
          changes.forEach(c=>{
            if(c.payload.doc.data().reads==undefined)this.messageList[c.payload.doc.id]=true;
            else if(c.payload.doc.data().reads[this.UI.currentUser]==undefined)this.messageList[c.payload.doc.id]=true;
          });
          return changes.reverse().map(c => ({key:c.payload.doc.id,payload:c.payload.doc.data()}));
        }));
      }
    });
  }

  readMessage(message){
    this.hideOverlay();
    var batch = this.afs.firestore.batch();
    if(this.reads[message]==undefined)batch.set(this.afs.firestore.collection('PERRINNTeams').doc(this.UI.currentUser).collection('reads').doc(message),{timestamp:firebase.firestore.FieldValue.arrayUnion(Date.now())},{merge:true});
    this.reads[message]=true;
    return batch.commit();
  }

  readAll(){
    Object.keys(this.messageList).forEach(key=>{
      this.readMessage(key);
    });
  }

  hideOverlay() {
    const overlay = document.getElementById('overlay') as HTMLDivElement;
    overlay.style.visibility = 'hidden';
  }

  showOverlay() {
    const overlay = document.getElementById('overlay') as HTMLDivElement;
    overlay.style.visibility = 'visible';
  }

  objectToArray(obj) {
    if (obj == null) { return []; }
    return Object.keys(obj).map(function(key) {
      return [key, obj[key]];
    });
  }

}
