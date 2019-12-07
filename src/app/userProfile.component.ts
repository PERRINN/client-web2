import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { userInterfaceService } from './userInterface.service';
import * as firebase from 'firebase/app';

@Component({
  selector: 'user',
  template: `
  <div id='main_container'>
  <div class='sheet'>
  <img class='editButton' *ngIf='(UI.currentUser==UI.focusUser)' style="float:right;width:25px;margin:10px" (click)="router.navigate(['userSettings',UI.focusUser])" src="./../assets/App icons/settings.png">
  <div *ngIf='(UI.currentUser==UI.focusUser)' style="float:right;width:100px;height:24px;text-align:center;line-height:24px;font-size:12px;margin:10px;color:white;background-color:#267cb5;border-radius:5px;cursor:pointer" (click)="newMessage()">New message</div>
  <div style="clear:both;background-color:#f4f7fc">
    <div style="float:left">
      <img [src]="UI.focusUserObj?.imageUrlThumb" style="display:inline;float:left;margin: 7px 10px 7px 10px;object-fit:cover;height:75px;width:75px;border-radius:50px">
    </div>
    <div style="padding:10px">
      <div style="clear:both;float:left;color:#222;white-space:nowrap;width:75%;text-overflow:ellipsis">
        <span >{{UI.focusUserObj?.name}}</span>
        <span style="font-size:10px"> {{UI.focusUserObj?.familyName}}</span>
      </div>
      <div style="clear:both;float:left;font-size:10px;color:#999">Joined {{UI.focusUserObj?.createdTimestamp|date:'MMMM yyyy'}}, {{UI.focusUserObj?.messageCount?UI.focusUserObj?.messageCount:0}} Messages</div>
      <div style="clear:both;float:left;font-size:15px;color:#999">C{{UI.focusUserObj?.lastMessageBalance?UI.focusUserObj?.lastMessageBalance:0|number:'1.2-2'}}</div>
    </div>
    <img src="./../assets/App icons/driveLogo.png" style="float:left;width:25px;margin:10px;cursor:pointer">
    <img src="./../assets/App icons/onshapeLogo.png" style="float:left;width:25px;margin:10px;cursor:pointer">
    <div style="clear:both">
      <div [style.color]="view=='inbox'?'white':'#267cb5'" [style.background-color]="view=='inbox'?'#267cb5':'white'" style="float:left;width:100px;height:24px;text-align:center;line-height:24px;font-size:12px;margin:10px;border-style:solid;border-width:1px;border-radius:5px;cursor:pointer" (click)="clickInbox()">Inbox</div>
      <div [style.color]="view=='global'?'white':'#267cb5'" [style.background-color]="view=='global'?'#267cb5':'white'" style="float:left;width:100px;height:24px;text-align:center;line-height:24px;font-size:12px;margin:10px;border-style:solid;border-width:1px;border-radius:5px;cursor:pointer" (click)="clickGlobal()">Global</div>
    </div>
    <div class="seperator" style="width:100%;margin:0px"></div>
  </div>
  <div class="spinner" *ngIf="UI.loading">
    <div class="bounce1"></div>
    <div class="bounce2"></div>
    <div class="bounce3"></div>
  </div>
  <ul class="listLight">
    <li *ngFor="let message of lastMessages|async;let last=last"
      (click)="UI.chain=message.payload.doc.data()?.chain;UI.showChatDetails=false;router.navigate(['chat',message.payload.doc.data()?.chain])">
      <div style="float:left">
        <img [src]="message.payload.doc.data()?.imageUrlThumbUser" style="display:inline;float:left;margin: 7px 10px 7px 10px;object-fit:cover;height:40px;width:40px;border-radius:20px">
      </div>
      <div>
        <div style="float:left;margin-top:5px;color:#111;font-size:14px">{{message.payload.doc.data()?.name}}</div>
        <div *ngIf="(now-message.payload.doc.data()?.timestamp)>43200000" style="float:right;margin-top:5px;color:#999;font-size:11px;margin-right:10px;width:75px">{{message.payload.doc.data()?.timestamp|date:'d MMM yyyy'}}</div>
        <div *ngIf="(now-message.payload.doc.data()?.timestamp)<=43200000" style="float:right;margin-top:5px;color:#999;font-size:11px;margin-right:10px;width:75px">{{message.payload.doc.data()?.timestamp|date:'HH:mm'}}</div>
        <div style="float:right;margin:5px;margin:9px 15px 0 0;background-color:red;width:12px;height:12px;border-radius:6px" *ngIf="message.payload.doc.data()?.reads==undefinied?true:!message.payload.doc.data()?.reads[UI.focusUser]"></div>
        <div style="clear:right;margin-top:5px;font-size:14px;font-weight:bold;white-space:nowrap;width:60%;text-overflow:ellipsis">{{message.payload.doc.data()?.chatSubject}} </div>
        <div style="clear:both;white-space:nowrap;width:80%;text-overflow:ellipsis;color:#888">{{message.payload.doc.data()?.text}}</div>
        <img src="./../assets/App icons/people.jpg" style="display:inline;margin-top:2px;float:left;object-fit:cover;height:15px;width:15px;-webkit-filter:brightness(30);filter:brightness(30)">
        <div style="float:left;color:#777;font-size:10px">{{message.payload.doc.data()?.recipientList.length}}</div>
      </div>
      <div class="seperator" style="margin-left:60px"></div>
      {{last?scrollToTop(message.key):''}}
    </li>
  </ul>
  </div>
  </div>

  `,
})
export class UserProfileComponent {
  lastMessages: Observable<any[]>;
  now: number;
  scrollTeam: string;
  view: string;

  constructor(
    public afs: AngularFirestore,
    public router: Router,
    public UI: userInterfaceService,
    private route: ActivatedRoute
  ) {
    this.view='';
    this.UI.loading = false;
    this.UI.currentTeam = '';
    this.now = Date.now();
    this.scrollTeam = '';
    this.route.params.subscribe(params => {
      this.UI.focusUser = params.id;
      afs.doc<any>('PERRINNTeams/'+this.UI.focusUser).valueChanges().subscribe(snapshot=>{
        this.UI.focusUserObj=snapshot;
      });
    });
    this.clickInbox();
  }

  clickInbox(){
    if (this.view=='inbox')return;
    this.view='inbox';
    this.lastMessages=this.afs.collection<any>('PERRINNMessages',ref=>ref
      .where('recipientList','array-contains',this.UI.focusUser)
      .where('lastMessage','==',true)
      .orderBy('timestamp','desc')
      .limit(20)
    ).snapshotChanges();
  }

  clickGlobal(){
    if (this.view=='global')return;
    this.view='global';
    this.lastMessages=this.afs.collection<any>('PERRINNMessages',ref=>ref
      .where('lastMessage','==',true)
      .orderBy('timestamp','desc')
      .limit(20)
    ).snapshotChanges();
  }

  scrollToTop(team: string) {
    if (team != this.scrollTeam) {
      const element = document.getElementById('main_container');
      element.scrollTop = 0;
      this.scrollTeam = team;
    }
  }

  showFullScreenImage(src) {
    const fullScreenImage = document.getElementById('fullScreenImage') as HTMLImageElement;
    fullScreenImage.src = src;
    fullScreenImage.style.visibility = 'visible';
  }

  objectToArray(obj) {
    if (obj == null) { return null; }
    return Object.keys(obj).map(function(key) {
      return [key, obj[key]];
    });
  }

  newMessage(){
    return this.afs.collection('IDs').add({
      user:this.UI.currentUser,
      serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(ref=>{
      this.UI.clearRecipient();
      this.UI.chatSubject='';
      this.UI.chain=ref.id;
      this.UI.addRecipient(this.UI.currentUser);
      this.UI.showChatDetails=true;
      this.router.navigate(['chat','']);
    });
  }

}
