import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { UserInterfaceService } from './userInterface.service';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'team',
  template: `
  <div class='sheet'>
  <div *ngIf="!UI.currentUserClaims?.member" style="background-color:#f2f5d0;padding:5px">
    <div style="color:#777;font-size:10px;float:left">You have limited access to the team. To become a member and gain full access, you need to top up your COINS.</div>
    <div style="color:#777;font-size:10px;float:left;line-height:16px;margin:0 10px 0 10px;width:75px;text-align:center;border-radius:3px;border-style:solid;border-width:1px;cursor:pointer" onclick="window.open('https://sites.google.com/view/perrinn/perrinn-com/coin-credit','_blank')">More info</div>
  </div>
  <div *ngIf="UI.currentUserClaims?.member!=UI.currentUserObj?.member" style="background-color:#edd79f;padding:5px">
    <div style="color:#777;font-size:10px;float:left">Please log out and back in to activate your settings.</div>
    <div style="color:#777;font-size:10px;float:left;line-height:16px;margin:0 10px 0 10px;width:75px;text-align:center;border-radius:3px;border-style:solid;border-width:1px;cursor:pointer" (click)="this.logout();router.navigate(['login']);">Logout</div>
  </div>
  <div style="clear:both">
    <div (click)="router.navigate(['team','inbox'])" [style.color]="UI.currentDomain=='inbox'?'#267cb5':'#777'" [style.background]="UI.currentDomain=='inbox'?'#f4f7fc':'none'" style="float:left;padding:7px;min-width:50px;text-align:center;font-size:12px;cursor:pointer;border-color:#ddd;border-style:solid;border-width:0 1px 0 0">Inbox</div>
    <div (click)="router.navigate(['team','all'])" [style.color]="UI.currentDomain=='all'?'#267cb5':'#777'" [style.background]="UI.currentDomain=='all'?'#f4f7fc':'none'" style="float:left;padding:7px;min-width:50px;text-align:center;font-size:12px;cursor:pointer;border-color:#ddd;border-style:solid;border-width:0 1px 0 0">All</div>
    <ul style="float:left">
      <li *ngFor="let domain of domains|async"
        (click)="router.navigate(['team',domain.payload.doc.id])"
        [style.background]="UI.currentDomain==domain.payload.doc.id?'#f4f7fc':'none'"
        style="position:relative;float:left;padding:7px;min-width:50px;text-align:center;font-size:12px;cursor:pointer;border-color:#ddd;border-style:solid;border-width:0 1px 0 0">
        <div [style.color]="UI.currentDomain==domain.payload.doc.id?'#267cb5':'#777'">{{domain.payload.doc.data()?.name}}</div>
      </li>
    </ul>
    <div class="seperator" style="width:100%;margin:0px"></div>
  </div>
  <div *ngIf="UI.currentDomain=='inbox'" style="clear:both;background:#f2f2f2;font-size:16px;padding:5px 15px 5px 15px">My inbox</div>
  <div *ngIf="UI.currentDomain=='all'" style="clear:both;background:#f2f2f2;font-size:16px;padding:5px 15px 5px 15px">Team wide messages</div>
  <div *ngIf="UI.currentDomain=='inbox'||UI.currentDomain=='all'" class="seperator" style="width:100%;margin:0px"></div>
  <div *ngIf="!(UI.currentDomain=='inbox'||UI.currentDomain=='all')">
    <div style="clear:both;background-color:#f4f7fc">
      <div style="float:left">
        <img [style.border-radius]="UI.currentDomainObj?.isUser?'50%':'3%'" [src]="UI.currentDomainObj?.imageUrlMedium" style="display:inline;float:left;margin:7px;object-fit:cover;width:75px;height:75px">
      </div>
      <div style="padding:10px">
        <div style="clear:both;float:left;color:#222;white-space:nowrap;width:75%;text-overflow:ellipsis">
          <div style="float:left">
            <span >{{UI.currentDomainObj?.name}}</span>
            <span style="font-size:10px"> {{UI.currentDomainObj?.familyName}}</span>
            <span *ngIf='UI.currentDomainObj?.member' style="color:white;background-color:green;padding:2px 4px 2px 4px;border-radius:3px;font-size:10px;margin:5px">Member</span>
            <span *ngIf='UI.currentDomainObj?.isDomain' style="color:white;background-color:#b38300;padding:2px 4px 2px 4px;border-radius:3px;font-size:10px;margin:5px">Domain</span>
          </div>
          <img *ngIf="UI.currentDomainObj?.apps?.Google?.enabled" [style.cursor]="UI.currentDomainObj?.apps?.Google?.enabled?'pointer':'default'" [style.pointer-events]="UI.currentDomainObj?.apps?.Google?.enabled?'auto':'none'" src="./../assets/App icons/driveLogo.png" style="float:left;width:15px;margin:5px" onclick="window.open('https://drive.google.com/drive/u/1/folders/1qvipN1gs1QS4sCh1tY8rSSFXV5S0-uR3','_blank')">
          <img *ngIf="UI.currentDomainObj?.apps?.Onshape?.enabled" [style.cursor]="UI.currentDomainObj?.apps?.Onshape?.enabled?'pointer':'default'" [style.pointer-events]="UI.currentDomainObj?.apps?.Onshape?.enabled?'auto':'none'" src="./../assets/App icons/onshapeLogo.png" style="float:left;width:15px;margin:5px" onclick="window.open('https://cad.onshape.com/documents?nodeId=31475a51a48fbcc9cfc7e244&resourceType=folder','_blank')">
        </div>
        <img class='editButton' *ngIf='UI.currentDomainObj?.members[UI.currentUser]?.leader' style="float:right;width:20px" (click)="router.navigate(['teamSettings',UI.currentDomain])" src="./../assets/App icons/settings.png">
        <div style="clear:both;float:left;font-size:17px;color:green;margin-right:5px">{{(UI.currentDomainObj?.lastMessageBalance?UI.currentDomainObj?.lastMessageBalance:0)|number:'1.2-2'}}</div>
        <div style="float:left;font-size:10px;color:green;line-height:25px">COINS</div>
        <div style="clear:both;float:left;font-size:10px;color:#999">Created {{UI.currentDomainObj?.createdTimestamp|date:'MMMM yyyy'}}, {{UI.currentDomainObj?.previousIndex?UI.currentDomainObj?.previousIndex:0}} Messages, {{UI.currentDomainObj?.membershipCounter?UI.currentDomainObj?.membershipCounter:0}} Membership days</div>
      </div>
      <div class="seperator" style="width:100%;margin:0px"></div>
        <span style="margin:10px;font-size:10px;color:#999">{{objectToArray(UI.currentDomainObj?.members).length}} {{objectToArray(UI.currentDomainObj?.members).length>1?'members':'member'}}</span>
        <span (click)="router.navigate(['team',member[0]])" style="font-size:10px;cursor:pointer" *ngFor="let member of objectToArray(UI.currentDomainObj?.members);let last=last">{{member[0]==UI.currentUser?'You':member[1]?.name}}{{member[0]==UI.currentUser?'':member[1]?.familyName!=undefinied?' '+member[1]?.familyName:''}}{{member[1]?.leader?' (Leader)':''}}{{last?"":", "}}</span>
      <div *ngIf="objectToArray(UI.currentDomainObj?.children).length>0">
        <span style="margin:10px;font-size:10px;color:#999">{{objectToArray(UI.currentDomainObj?.children).length}} {{objectToArray(UI.currentDomainObj?.children).length>1?'children':'child'}}</span>
        <span (click)="router.navigate(['team',member[0]])" style="font-size:10px;cursor:pointer" *ngFor="let member of objectToArray(UI.currentDomainObj?.children);let last=last">{{member[0]==UI.currentUser?'You':member[1]?.name}}{{member[0]==UI.currentUser?'':member[1]?.familyName!=undefinied?' '+member[1]?.familyName:''}}{{member[1]?.leader?' (Leader)':''}}{{last?"":", "}}</span>
      </div>
      <div *ngIf="objectToArray(UI.currentDomainObj?.parents).length>0">
        <span style="margin:10px;font-size:10px;color:#999">{{objectToArray(UI.currentDomainObj?.parents).length}} {{objectToArray(UI.currentDomainObj?.parents).length>1?'parents':'parent'}}</span>
        <span (click)="router.navigate(['team',member[0]])" style="font-size:10px;cursor:pointer" *ngFor="let member of objectToArray(UI.currentDomainObj?.parents);let last=last">{{member[0]==UI.currentUser?'You':member[1]?.name}}{{member[0]==UI.currentUser?'':member[1]?.familyName!=undefinied?' '+member[1]?.familyName:''}}{{member[1]?.leader?' (Leader)':''}}{{last?"":", "}}</span>
      </div>
      <div class="seperator" style="width:100%;margin:0px"></div>
    </div>
      <div style="float:left;width:100px;height:25px;text-align:center;line-height:23px;font-size:12px;margin:10px;color:white;background-color:#267cb5;border-radius:4px;cursor:pointer" (click)="newMessage()">New message</div>
    <div class="seperator" style="width:100%;margin:0px"></div>
  </div>
  <div class="spinner" *ngIf="UI.loading">
    <div class="bounce1"></div>
    <div class="bounce2"></div>
    <div class="bounce3"></div>
  </div>
  <ul class="listLight" *ngIf="UI.currentDomain!='inbox'&&UI.currentDomain!='all'">
    <li *ngFor="let message of pinnedMessages|async;let last=last"
      (click)="UI.chain=message.payload.doc.data()?.chain;UI.showChatDetails=false;router.navigate(['chat',message.payload.doc.data()?.chain])">
      <div style="float:left">
        <img [src]="message.payload.doc.data()?.imageUrlThumbUser" style="display:inline;float:left;margin: 7px 10px 7px 10px;object-fit:cover;height:40px;width:40px;border-radius:20px">
      </div>
      <div>
        <div style="float:left;color:green;font-size:10px">Pinned Message</div>
        <div *ngIf="message.payload.doc.data()?.user==UI.currentUser" style="float:left;width:80px;text-align:center;font-size:10px;color:green;cursor:pointer;text-decoration:underline" (click)="unpinMessage(message.payload.doc.data())">unpin</div>
        <div style="clear:both;float:left;margin-top:5px;color:#111;font-size:14px">{{message.payload.doc.data()?.name}}</div>
        <div *ngIf="(nowSeconds-message.payload.doc.data()?.serverTimestamp?.seconds)>43200" style="float:right;margin-top:5px;color:#999;font-size:11px;margin-right:10px;width:75px">{{(message.payload.doc.data()?.serverTimestamp?.seconds*1000)|date:'d MMM yyyy'}}</div>
        <div *ngIf="(nowSeconds-message.payload.doc.data()?.serverTimestamp?.seconds)<=43200" style="float:right;margin-top:5px;color:#999;font-size:11px;margin-right:10px;width:75px">{{(message.payload.doc.data()?.serverTimestamp?.seconds*1000)|date:'HH:mm'}}</div>
        <div style="float:right;margin:9px 15px 0 0;width:12px;height:12px;border-radius:6px" *ngIf="message.payload.doc.data()?.reads==undefinied?true:!message.payload.doc.data()?.reads[UI.currentUser]" [style.background-color]="message.payload.doc.data()?.recipients[UI.currentUser]==undefined?'lightblue':'red'"></div>
        <div style="clear:right;margin-top:5px;font-size:14px;font-weight:bold;white-space:nowrap;width:60%;text-overflow:ellipsis">{{message.payload.doc.data()?.chatSubject}} </div>
        <div style="clear:both;white-space:nowrap;width:80%;text-overflow:ellipsis;color:#888">{{message.payload.doc.data()?.text}}{{(message.payload.doc.data()?.image!=''&&message.payload.doc.data()?.image!=undefined)?' (image)':''}}</div>
        <img src="./../assets/App icons/people.jpg" style="display:inline;margin-top:2px;float:left;object-fit:cover;height:15px;width:15px;-webkit-filter:brightness(30);filter:brightness(30)">
        <div style="float:left;color:#777;font-size:10px;width:40px">{{message.payload.doc.data()?.recipientList.length}}</div>
        <img src="./../assets/App icons/eye.png" style="display:inline;margin-top:2px;margin-right:3px;float:left;object-fit:cover;height:15px;width:15px;-webkit-filter:brightness(80);filter:brightness(80)">
        <div style="float:left;color:#777;font-size:10px;width:40px">{{objectToArray(message.payload.doc.data()?.reads)?.length}}</div>
        <div style="float:left;font-size:10px;font-family:sans-serif;color:#777">{{message.payload.doc.data()?.domainName}}</div>
      </div>
      <div class="seperator"></div>
    </li>
  </ul>
  <ul class="listLight">
    <li *ngFor="let message of lastMessages|async;let last=last"
      (click)="UI.chain=message.payload.doc.data()?.chain;UI.showChatDetails=false;router.navigate(['chat',message.payload.doc.data()?.chain])">
      <div style="float:left">
        <img [src]="message.payload.doc.data()?.imageUrlThumbUser" style="display:inline;float:left;margin: 7px 10px 7px 10px;object-fit:cover;height:40px;width:40px;border-radius:20px">
      </div>
      <div>
        <div style="float:left;margin-top:5px;color:#111;font-size:14px">{{message.payload.doc.data()?.name}}</div>
        <div *ngIf="(nowSeconds-message.payload.doc.data()?.serverTimestamp?.seconds)>43200" style="float:right;margin-top:5px;color:#999;font-size:11px;margin-right:10px;width:75px">{{(message.payload.doc.data()?.serverTimestamp?.seconds*1000)|date:'d MMM yyyy'}}</div>
        <div *ngIf="(nowSeconds-message.payload.doc.data()?.serverTimestamp?.seconds)<=43200" style="float:right;margin-top:5px;color:#999;font-size:11px;margin-right:10px;width:75px">{{(message.payload.doc.data()?.serverTimestamp?.seconds*1000)|date:'HH:mm'}}</div>
        <div style="float:right;margin:9px 15px 0 0;width:12px;height:12px;border-radius:6px" *ngIf="message.payload.doc.data()?.reads==undefinied?true:!message.payload.doc.data()?.reads[UI.currentUser]" [style.background-color]="message.payload.doc.data()?.recipients?(message.payload.doc.data()?.recipients[UI.currentUser]==undefined?'lightblue':'red'):'lightblue'"></div>
        <div style="clear:right;margin-top:5px;font-size:14px;font-weight:bold;white-space:nowrap;width:60%;text-overflow:ellipsis">{{message.payload.doc.data()?.chatSubject}} </div>
        <div style="clear:both;white-space:nowrap;width:80%;text-overflow:ellipsis;color:#888">{{message.payload.doc.data()?.text}}{{(message.payload.doc.data()?.image!=''&&message.payload.doc.data()?.image!=undefined)?' (image)':''}}</div>
        <img src="./../assets/App icons/people.jpg" style="display:inline;margin-top:2px;float:left;object-fit:cover;height:15px;width:15px;-webkit-filter:brightness(30);filter:brightness(30)">
        <div style="float:left;color:#777;font-size:10px;width:40px">{{message.payload.doc.data()?.recipientList.length}}</div>
        <img src="./../assets/App icons/eye.png" style="display:inline;margin-top:2px;margin-right:3px;float:left;object-fit:cover;height:15px;width:15px;-webkit-filter:brightness(80);filter:brightness(80)">
        <div style="float:left;color:#777;font-size:10px;width:40px">{{objectToArray(message.payload.doc.data()?.reads)?.length}}</div>
        <div style="float:left;font-size:10px;font-family:sans-serif;color:#777">{{message.payload.doc.data()?.domainName}}</div>
      </div>
      <div class="seperator"></div>
      {{last?scrollToTop(message.key):''}}
    </li>
  </ul>
  </div>
  `,
})
export class TeamProfileComponent {
  lastMessages:Observable<any[]>;
  pinnedMessages:Observable<any[]>;
  nowSeconds:number;
  scrollTeam:string;
  domains:Observable<any[]>;

  constructor(
    public afAuth: AngularFireAuth,
    public afs: AngularFirestore,
    public router: Router,
    public UI: UserInterfaceService,
    private route: ActivatedRoute
  ) {
    this.UI.loading = false;
    this.UI.currentTeam = '';
    this.nowSeconds = Date.now()/1000;
    this.scrollTeam = '';
    this.route.params.subscribe(params => {
      this.UI.switchDomain(params.id);
      this.refreshMessages();
    });
    this.domains=this.afs.collection<any>('PERRINNTeams',ref=>ref.where('isDomain','==',true)).snapshotChanges();
  }

  refreshMessages(){
    if(this.UI.currentDomain=='inbox'){
      this.afAuth.user.subscribe((auth) => {
        this.lastMessages=this.afs.collection<any>('PERRINNMessages',ref=>ref
          .where('recipientList','array-contains',auth.uid)
          .where('lastMessage','==',true)
          .orderBy('serverTimestamp','desc')
          .limit(30)
        ).snapshotChanges();
      });
    }
    else if(this.UI.currentDomain=='all'){
      this.afAuth.user.subscribe((auth) => {
        this.lastMessages=this.afs.collection<any>('PERRINNMessages',ref=>ref
          .where('lastMessage','==',true)
          .orderBy('serverTimestamp','desc')
          .limit(30)
        ).snapshotChanges();
      });
    }
    else {
      this.lastMessages=this.afs.collection<any>('PERRINNMessages',ref=>ref
        .where('domain','==',this.UI.currentDomain)
        .where('lastMessage','==',true)
        .orderBy('serverTimestamp','desc')
        .limit(30)
      ).snapshotChanges();
      this.pinnedMessages=this.afs.collection<any>('PERRINNMessages',ref=>ref
        .where('domain','==',this.UI.currentDomain)
        .where('pin','==',true)
        .orderBy('serverTimestamp','desc')
        .limit(10)
      ).snapshotChanges();
    }
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
    if (obj == null) { return []; }
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
      this.router.navigate(['chat',ref.id]);
    });
  }

  unpinMessage(message){
    event.stopPropagation();
    this.UI.chatSubject=message.chatSubject;
    this.UI.chain=message.chain;
    this.UI.showChatDetails=false;
    this.UI.recipients=message.recipients;
    this.UI.process={
      inputs:{
        target:message.PERRINN.chain.currentMessage
      },
      function:{
        name:'unpinMessage'
      },
      inputsComplete:true
    };
    this.UI.createMessageAFS('Unpinning message: '+message.text,'','',true,false);
  }

  logout() {
    this.afAuth.auth.signOut();
    this.UI.currentUser = null;
  }

}
