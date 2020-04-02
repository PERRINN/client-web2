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
  <div style="clear:both">
    <div (click)="router.navigate(['team','inbox'])" [style.color]="UI.currentDomain=='inbox'?'#267cb5':'#777'" style="float:left;margin: 5px 5px 0 5px;width:75px;height:24px;text-align:center;line-height:24px;font-size:12px;cursor:pointer">Inbox</div>
    <div (click)="router.navigate(['team','all'])" [style.color]="UI.currentDomain=='all'?'#267cb5':'#777'" style="float:left;margin: 5px 5px 0 5px;width:75px;height:24px;text-align:center;line-height:24px;font-size:12px;cursor:pointer">All</div>
    <ul style="float:left">
      <li *ngFor="let domain of domains|async"
        (click)="router.navigate(['team',domain.payload.doc.id])"
        style="position:relative;float:left;margin: 5px 5px 0 5px;width:75px;height:24px;text-align:center;line-height:24px;font-size:12px;cursor:pointer">
        <div [style.color]="UI.currentDomain==domain.payload.doc.id?'#267cb5':'#777'">{{domain.payload.doc.data()?.name}}</div>
        <div *ngIf="domain.payload.doc.data().isDomainFree" [style.color]="UI.currentDomain==domain.payload.doc.id?'green':'#777'" style="font-size:7px;position:absolute;top:0;right:0"> free</div>
      </li>
    </ul>
    <div style="float:right;cursor:pointer" (click)="router.navigate(['team',UI.currentUser])">
    <div style="float:right;margin:5px;font-size:10px">C{{(UI.currentUserObj?.lastMessageBalance?UI.currentUserObj?.lastMessageBalance:0)|number:'1.2-2'}}</div>
      <img [src]="UI.currentUserObj?.imageUrlThumb" style="display:inline;float:right;margin: 5px;border-radius:50%;object-fit:cover;width:25px;height:25px">
    </div>
    <div class="seperator" style="width:100%;margin:0px"></div>
  </div>
  <div *ngIf="UI.currentDomain=='inbox'" style="clear:both;font-size:16px;margin:15px">My inbox</div>
  <div *ngIf="UI.currentDomain=='all'" style="clear:both;font-size:16px;margin:15px">Team wide messages</div>
  <div *ngIf="!(UI.currentDomain=='inbox'||UI.currentDomain=='all')" style="clear:both;background-color:#f4f7fc">
    <div style="float:left">
      <img [style.border-radius]="UI.currentDomainObj?.isUser?'50%':'3%'" [src]="UI.currentDomainObj?.imageUrlMedium" style="display:inline;float:left;margin: 7px 10px 7px 10px;object-fit:cover;width:75px;height:75px">
    </div>
    <div style="padding:10px">
      <div style="clear:both;float:left;color:#222;white-space:nowrap;width:75%;text-overflow:ellipsis">
        <span >{{UI.currentDomainObj?.name}}</span>
        <span style="font-size:10px"> {{UI.currentDomainObj?.familyName}}</span>
        <span *ngIf='UI.currentDomainObj?.member' style="color:white;background-color:green;padding:2px 4px 2px 4px;border-radius:3px;font-size:10px;margin:5px">PERRINN member</span>
        <span *ngIf='UI.currentDomainObj?.isDomain' style="color:white;background-color:#b38300;padding:2px 4px 2px 4px;border-radius:3px;font-size:10px;margin:5px">Domain</span>
      </div>
      <img class='editButton' *ngIf='(UI.currentDomainObj?.leaders[UI.currentUser]!=undefined)' style="float:right;width:20px" (click)="router.navigate(['teamSettings',UI.currentDomain])" src="./../assets/App icons/settings.png">
      <div style="clear:both;float:left;font-size:10px;color:#999">Created {{UI.currentDomainObj?.createdTimestamp|date:'MMMM yyyy'}}, {{UI.currentDomainObj?.previousIndex?UI.currentDomainObj?.previousIndex:0}} Messages, {{UI.currentDomainObj?.membershipCounter?UI.currentDomainObj?.membershipCounter:0}} Membership days</div>
      <div style="clear:both;float:left;font-size:10px;color:#999">{{objectToArray(UI.currentDomainObj?.leaders).length}} leaders, {{UI.currentDomainObj?.members?objectToArray(UI.currentDomainObj?.members).length:0}} members</div>
      <div style="clear:both;float:left;font-size:17px;color:green;margin-right:5px">{{(UI.currentDomainObj?.lastMessageBalance?UI.currentDomainObj?.lastMessageBalance:0)|number:'1.2-2'}}</div>
      <div style="float:left;font-size:10px;color:green;line-height:25px">COINS</div>
      <div *ngIf="UI.currentDomain==UI.currentUser" style="float:left;margin-left:10px;margin-top:3px;font-size:10px;color:green;line-height:14px;width:50px;text-align:center;border-radius:3px;border-style:solid;border-width:1px;cursor:pointer" (click)="router.navigate(['buyCoins'])">Top Up</div>
      <div class="seperator" style="width:100%;margin:0px"></div>
      <div [style.color]="((UI.currentDomainObj?.members!=undefined)?(UI.currentDomainObj?.members[UI.currentUser]):false)?'#999':'#267cb5'" [style.cursor]="((UI.currentDomainObj?.members!=undefined)?(UI.currentDomainObj?.members[UI.currentUser]):false)?'default':'pointer'" style="clear:both;float:left;width:100px;text-align:center;line-height:14px;font-size:10px;margin:5px;border-style:solid;border-width:1px;border-radius:3px" (click)="joinTeam()">Join (C{{(UI.currentDomainObj?.membershipCost?UI.currentDomainObj?.membershipCost:0)|number:'1.2-2'}})</div>
      <div *ngIf='((UI.currentDomainObj?.members!=undefined)?(UI.currentDomainObj?.members[UI.currentUser]):false)' style="float:left;line-height:14px;font-size:10px;margin:5px;color:#777">You are a member of this team</div>
      <div class="seperator" style="width:100%;margin:0px"></div>
      <img [style.opacity]="UI.currentDomainObj?.apps?.Google?.enabled?1:0.25" [style.cursor]="UI.currentDomainObj?.apps?.Google?.enabled?'pointer':'default'" [style.pointer-events]="UI.currentDomainObj?.apps?.Google?.enabled?'auto':'none'" src="./../assets/App icons/driveLogo.png" style="clear:both;float:left;width:25px;margin:10px" onclick="window.open('https://drive.google.com/drive/u/1/folders/1qvipN1gs1QS4sCh1tY8rSSFXV5S0-uR3','_blank')">
      <img [style.opacity]="UI.currentDomainObj?.apps?.Onshape?.enabled?1:0.25" [style.cursor]="UI.currentDomainObj?.apps?.Onshape?.enabled?'pointer':'default'" [style.pointer-events]="UI.currentDomainObj?.apps?.Onshape?.enabled?'auto':'none'" src="./../assets/App icons/onshapeLogo.png" style="float:left;width:25px;margin:10px" onclick="window.open('https://cad.onshape.com/documents?nodeId=31475a51a48fbcc9cfc7e244&resourceType=folder','_blank')">
      <div *ngIf="UI.currentDomain==UI.currentUser" style="float:right;width:80px;height:20px;text-align:center;line-height:18px;font-size:10px;margin:10px;color:white;background-color:#267cb5;border-radius:3px;cursor:pointer" (click)="newTeam()">New team</div>
      <div *ngIf="UI.currentDomain==UI.currentUser" style="float:right;width:80px;height:20px;text-align:center;line-height:18px;font-size:10px;margin:10px;color:#267cb5;border-style:solid;border-width:1px;border-radius:3px;cursor:pointer" (click)="router.navigate(['sendCoins'])">Send Coins</div>
      <div style="float:right;width:80px;height:20px;text-align:center;line-height:18px;font-size:10px;margin:10px;color:white;background-color:#267cb5;border-radius:3px;cursor:pointer" (click)="newMessage()">New message</div>
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
        <div style="float:right;margin:5px;margin:9px 15px 0 0;background-color:red;width:12px;height:12px;border-radius:6px" *ngIf="message.payload.doc.data()?.reads==undefinied?true:!message.payload.doc.data()?.reads[UI.currentUser]"></div>
        <div style="clear:right;margin-top:5px;font-size:14px;font-weight:bold;white-space:nowrap;width:60%;text-overflow:ellipsis">{{message.payload.doc.data()?.chatSubject}} </div>
        <div style="clear:both;white-space:nowrap;width:80%;text-overflow:ellipsis;color:#888">{{message.payload.doc.data()?.text}}</div>
        <img src="./../assets/App icons/people.jpg" style="display:inline;margin-top:2px;float:left;object-fit:cover;height:15px;width:15px;-webkit-filter:brightness(30);filter:brightness(30)">
        <div style="float:left;color:#777;font-size:10px;width:40px">{{message.payload.doc.data()?.recipientList.length}}</div>
        <img src="./../assets/App icons/eye.png" style="display:inline;margin-top:2px;margin-right:3px;float:left;object-fit:cover;height:15px;width:15px;-webkit-filter:brightness(80);filter:brightness(80)">
        <div style="float:left;color:#777;font-size:10px;width:40px">{{objectToArray(message.payload.doc.data()?.reads)?.length}}</div>
        <div style="float:left;background-color:#777;height:5px;width:5px;margin:2px"></div>
        <div style="float:left;font-size:10px;font-family:sans-serif;color:#777">{{message.payload.doc.data()?.domainName}}</div>
      </div>
      <div class="seperator" style="margin-left:60px"></div>
      {{last?scrollToTop(message.key):''}}
    </li>
  </ul>
  </div>
  </div>

  `,
})
export class TeamProfileComponent {
  lastMessages:Observable<any[]>;
  now:number;
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
    this.now = Date.now();
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
          .orderBy('timestamp','desc')
          .limit(30)
        ).snapshotChanges();
      });
    }
    else if(this.UI.currentDomain=='all'){
      this.afAuth.user.subscribe((auth) => {
        this.lastMessages=this.afs.collection<any>('PERRINNMessages',ref=>ref
          .where('lastMessage','==',true)
          .orderBy('timestamp','desc')
          .limit(30)
        ).snapshotChanges();
      });
    }
    else {
      this.lastMessages=this.afs.collection<any>('PERRINNMessages',ref=>ref
        .where('domain','==',this.UI.currentDomain)
        .where('lastMessage','==',true)
        .orderBy('timestamp','desc')
        .limit(30)
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
      this.UI.addRecipient(this.UI.currentDomain);
      this.UI.showChatDetails=true;
      this.router.navigate(['chat','']);
    });
  }

  joinTeam(){
    if(this.UI.currentDomainObj.members!=undefined)
      if(this.UI.currentDomainObj.members[this.UI.currentUser]!=undefined)
        return;
    return this.afs.collection('IDs').add({
      user:this.UI.currentUser,
      serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(ref=>{
      this.UI.clearRecipient();
      this.UI.addRecipient(this.UI.currentUser).then(()=>{
        this.UI.addRecipient(this.UI.currentDomain).then(()=>{
          this.UI.chatSubject='Joining this team.';
          this.UI.chain=ref.id;
          this.UI.showChatDetails=false;
          this.UI.process={
            inputs:{
              target:this.UI.currentDomain,
              member:this.UI.currentUser,
              memberObj:{
                name:this.UI.currentUserObj.name,
                familyName:this.UI.currentUserObj.familyName,
                imageUrlThumb:this.UI.currentUserObj.imageUrlThumb,
                timestamp:firebase.firestore.FieldValue.serverTimestamp()
              }
            },
            function:{
              name:'joinTeam'
            },
            inputsComplete:true
          };
          this.UI.createMessageAFS('Joining '+this.UI.currentDomainObj.name,'','',true);
          this.router.navigate(['chat','']);
        });
      });
    });
  }

  newTeam(){
    return this.afs.collection('IDs').add({
      user:this.UI.currentUser,
      serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(ref=>{
      const imageUrlThumb="https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2Fthumb_1523055261437Screen%20Shot%202018-04-06%20at%2022.36.21.png?GoogleAccessId=firebase-adminsdk-rh8x2@perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=SGP4NyP%2F6GgfWJNbhdi4wfFgHG3F0ZdkD371QQaDohxo3HNKvvIasuVe3N1y77%2FzMM2lVcmTnzOD7dghStRSOolCTzJ%2BXOF7HRXunOJbQyjNDbZh2c8j6Ng0CDQweO8TAKfxeSpAfxDe96zYt4lLAlXwCoGZzFP%2FhdglsjflD8i%2FIsium%2Big45lFs5hCsLlEL9WCPNPMGgFFwIxWJnpGQ7OfzoOKrVeyKT7mtn1UsQ2nf1LmnlEYIfs4CzI3%2FFBm9NvvSxlfykKichh9FxG8NaMHcuRd4XvZlh0g4sZdAmwkoHDBTFPhc%2Br3vMgSb1XO%2FFOZAjaRY8v4rUaXiJEbCQ%3D%3D";
      const imageUrlMedium="https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2Fmedium_1523055261437Screen%20Shot%202018-04-06%20at%2022.36.21.png?GoogleAccessId=firebase-adminsdk-rh8x2@perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=WBDL52YygQ1yrfHTmygdhqldkZnJYJ6DiyAVV8up%2BKEeYJgRMVfPKtQNvtXurJt5uE0CTIRzGgbKBFW%2FaPjYx10JmIYLEM5NHRaZjI9czIXSnlzKzM4aJfXljHfwgMuk3c1St%2BmGnQMeAwyD9dZpqsppTHDYUEuYyw%2BbcaWG7fpRzSleXde1QZ8N1%2Bqa0DjuemU81bTJoG5vOAXa8qHuigTaOJlHP%2Fw9WN3pxiA6Q5tea9kfBEXwOJ2Pm5wL6hAoexAwATDMsQI2T2LEbLizJY2e8VoKTqK3u3TdAnoD38CQUrCDI61w3vTlW%2BxKeFB3huZjtH3V7MPJ%2FTgpOknE3g%3D%3D";
      const imageUrlOriginal="https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2Foriginal_1523055261437Screen%20Shot%202018-04-06%20at%2022.36.21.png?GoogleAccessId=firebase-adminsdk-rh8x2@perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=c8sqTFAMkJMDEr0CZdFAMD0I9gsBWMqqy21O2wmkAKRt3H%2B9Z2DZNnZgzdFPPOgYTSojdOyuhzy8X%2FyET97nUi3fnwQfy1eQrCu%2F5iI4GbCEaZqsosbMz5MiLOsVoLGOlLpjFekVOQTIuniZfTRuPfEL6zNzyyyQasAHfZOqz76E1FkQBg3sYWiabS4sfcirSP%2BhIQT4k6Px02B%2BARos4%2F%2FnivTla9KX8OPYH7tmUj%2Fsc%2F1sPiQaqIrWXpC5HX4TLZ9w%2Bdl83HSCSBYmkwUAOtrtJ1uncwwhia4pzmniLvfXj1%2BikJA6HXcon44Ymv8jDpHh4AqbBVqAXTWyIzKzaQ%3D%3D";
      this.UI.clearRecipient();
      this.UI.addRecipient(this.UI.currentUser).then(()=>{
        this.UI.addRecipient(this.UI.currentDomain).then(()=>{
          this.UI.chatSubject='New team';
          this.UI.chain=ref.id;
          this.UI.showChatDetails=false;
          this.UI.process={
            inputs:{
              target:ref.id,
              name:'New',
              familyName:'',
              imageUrlThumb:imageUrlThumb,
              imageUrlMedium:imageUrlMedium,
              imageUrlOriginal:imageUrlOriginal,
              leaderName:this.UI.currentDomainObj.name,
              leaderFamilyName:this.UI.currentDomainObj.familyName,
              leaderImageUrlThumb:this.UI.currentDomainObj.imageUrlThumb
            },
            function:{
              name:'createTeam'
            },
            inputsComplete:true
          };
          this.UI.createMessageAFS('Creating a new team id: '+ref.id,'','',true);
          this.router.navigate(['team',ref.id]);
        });
      });
    });
  }

  logout() {
    this.afAuth.auth.signOut();
    this.UI.currentUser = null;
  }

}
