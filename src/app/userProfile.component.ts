import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { userInterfaceService } from './userInterface.service';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'user',
  template: `
  <div id='main_container'>
  <div class='sheet'>
  <div *ngIf="!UI.currentUserClaims?.member" style="background-color:#f2f5d0;padding:5px">
    <div style="color:#777;font-size:10px;float:left">You have limited access to the team. To become a member and gain full access, you need to top up your COINS.</div>
    <div style="color:#777;font-size:10px;float:left;line-height:16px;margin:0 10px 0 10px;width:75px;text-align:center;border-radius:3px;border-style:solid;border-width:1px;cursor:pointer" onclick="window.open('https://sites.google.com/view/perrinn/perrinn-com/coin-credit','_blank')">More info</div>
  </div>
  <div *ngIf="UI.currentUserClaims?.member!=UI.currentUserObj?.member" style="background-color:#edd79f;padding:5px">
    <div style="color:#777;font-size:10px;float:left">Please log out and back in to activate your settings.</div>
    <div style="color:#777;font-size:10px;float:left;line-height:16px;margin:0 10px 0 10px;width:75px;text-align:center;border-radius:3px;border-style:solid;border-width:1px;cursor:pointer" (click)="this.logout();router.navigate(['login']);">Logout</div>
  </div>
  <img class='editButton' *ngIf='(UI.focusUserObj?.leaders[UI.currentUser]!=undefined)' style="float:right;width:25px;margin:10px" (click)="router.navigate(['userSettings',UI.focusUser])" src="./../assets/App icons/settings.png">
  <div *ngIf='(UI.currentUser==UI.focusUser)' style="float:right;width:100px;height:24px;text-align:center;line-height:24px;font-size:12px;margin:10px;color:#267cb5;border-style:solid;border-width:1px;border-radius:5px;cursor:pointer" (click)="router.navigate(['sendCoins'])">Send Coins</div>
  <div *ngIf='(UI.currentUser==UI.focusUser)' style="float:right;width:100px;height:24px;text-align:center;line-height:24px;font-size:12px;margin:10px;color:white;background-color:#267cb5;border-radius:5px;cursor:pointer" (click)="newMessage()">New message</div>
  <div style="clear:both;background-color:#f4f7fc">
    <div style="float:left">
      <img [src]="UI.focusUserObj?.imageUrlThumb" style="display:inline;float:left;margin: 7px 10px 7px 10px;object-fit:cover;height:75px;width:75px;border-radius:50px">
    </div>
    <div style="padding:10px">
      <div style="clear:both;float:left;color:#222;white-space:nowrap;width:75%;text-overflow:ellipsis">
        <span >{{UI.focusUserObj?.name}}</span>
        <span style="font-size:10px"> {{UI.focusUserObj?.familyName}}</span>
        <span *ngIf='UI.focusUserObj?.member' style="color:white;background-color:green;padding:2px 4px 2px 4px;border-radius:3px;font-size:10px;margin:5px">Member</span>
        <span *ngIf='UI.focusUserObj?.isDomain' style="color:white;background-color:#e6b927;padding:2px 4px 2px 4px;border-radius:3px;font-size:10px;margin:5px">Domain</span>
      </div>
      <div style="clear:both;float:left;font-size:10px;color:#999">Joined {{UI.focusUserObj?.createdTimestamp|date:'MMMM yyyy'}}, {{UI.focusUserObj?.previousIndex?UI.focusUserObj?.previousIndex:0}} Messages, {{UI.focusUserObj?.membershipCounter?UI.focusUserObj?.membershipCounter:0}} Membership days</div>
      <div style="clear:both;float:left;font-size:17px;color:green;margin-right:5px">{{(UI.focusUserObj?.lastMessageBalance?UI.focusUserObj?.lastMessageBalance:0)|number:'1.2-2'}}</div>
      <div style="float:left;font-size:10px;color:green;line-height:25px">COINS</div>
      <div *ngIf='(UI.currentUser==UI.focusUser)' style="float:left;margin-left:10px;margin-top:3px;font-size:10px;color:green;line-height:14px;width:50px;text-align:center;border-radius:3px;border-style:solid;border-width:1px;cursor:pointer" (click)="router.navigate(['buyCoins'])">Top Up</div>
      <img [style.opacity]="UI.focusUserObj?.apps?.Google?.enabled?1:0.25" [style.cursor]="UI.focusUserObj?.apps?.Google?.enabled?'pointer':'default'" [style.pointer-events]="UI.focusUserObj?.apps?.Google?.enabled?'auto':'none'" src="./../assets/App icons/driveLogo.png" style="clear:both;float:left;width:25px;margin:10px" onclick="window.open('https://drive.google.com/drive/u/1/folders/1qvipN1gs1QS4sCh1tY8rSSFXV5S0-uR3','_blank')">
      <img [style.opacity]="UI.focusUserObj?.apps?.Onshape?.enabled?1:0.25" [style.cursor]="UI.focusUserObj?.apps?.Onshape?.enabled?'pointer':'default'" [style.pointer-events]="UI.focusUserObj?.apps?.Onshape?.enabled?'auto':'none'" src="./../assets/App icons/onshapeLogo.png" style="float:left;width:25px;margin:10px" onclick="window.open('https://cad.onshape.com/documents?nodeId=31475a51a48fbcc9cfc7e244&resourceType=folder','_blank')">
    </div>
    <div style="clear:both">
      <div [style.color]="view=='inbox'?'#267cb5':'#777'" [style.border-style]="view=='inbox'?'solid':'none'" style="float:left;margin: 5px 5px 0 5px;width:75px;height:24px;text-align:center;line-height:24px;font-size:12px;border-width:0 0 3px 0;cursor:pointer" (click)="clickInbox()">Inbox</div>
      <div [style.color]="view=='team'?'#267cb5':'#777'" [style.border-style]="view=='team'?'solid':'none'" style="float:left;margin: 5px 5px 0 5px;width:75px;height:24px;text-align:center;line-height:24px;font-size:12px;border-width:0 0 3px 0;cursor:pointer" (click)="clickTeam()">Team</div>
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
        <div style="float:left;color:#777;font-size:10px;width:40px;">{{message.payload.doc.data()?.recipientList.length}}</div>
        <img src="./../assets/App icons/eye.png" style="display:inline;margin-top:2px;margin-right:3px;float:left;object-fit:cover;height:15px;width:15px;-webkit-filter:brightness(80);filter:brightness(80)">
        <div style="float:left;color:#777;font-size:10px">{{objectToArray(message.payload.doc.data()?.reads)?.length}}</div>
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
    public afAuth: AngularFireAuth,
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
      .limit(30)
    ).snapshotChanges();
  }

  clickTeam(){
    if (this.view=='team')return;
    this.view='team';
    this.lastMessages=this.afs.collection<any>('PERRINNMessages',ref=>ref
      .where('lastMessage','==',true)
      .orderBy('timestamp','desc')
      .limit(30)
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

  logout() {
    this.afAuth.auth.signOut();
    this.UI.currentUser = null;
  }

}
