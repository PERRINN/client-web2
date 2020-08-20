import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { UserInterfaceService } from './userInterface.service';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'profile',
  template: `
  <div class='sheet'>
    <div *ngIf="!UI.currentUserClaims?.member" style="background-color:#f2f5d0;padding:5px">
      <div style="color:#777;font-size:10px;float:left">You have limited access to the team. To become a member and gain full access, you need to top up your COINS.</div>
      <div style="color:#777;font-size:10px;float:left;line-height:16px;margin:0 10px 0 10px;width:75px;text-align:center;border-radius:3px;border-style:solid;border-width:1px;cursor:pointer" onclick="window.open('https://sites.google.com/view/perrinn/perrinn-com/coin-credit','_blank')">More info</div>
    </div>
    <div *ngIf="UI.currentUserClaims?.member!=(UI.currentUserLastMessageObj?.PERRINN?.wallet?.balance>0)" style="background-color:#edd79f;padding:5px">
      <div style="color:#777;font-size:10px;float:left">Please log out and back in to activate your settings.</div>
      <div style="color:#777;font-size:10px;float:left;line-height:16px;margin:0 10px 0 10px;width:75px;text-align:center;border-radius:3px;border-style:solid;border-width:1px;cursor:pointer" (click)="this.logout();router.navigate(['login']);">Logout</div>
    </div>
    <div style="clear:both">
      <div (click)="router.navigate(['profile','domain','all'])" [style.color]="UI.currentDomain=='all'?'#267cb5':'#777'" [style.background]="UI.currentDomain=='all'?'#f4f7fc':'none'" style="float:left;padding:7px;min-width:50px;text-align:center;font-size:12px;cursor:pointer;border-color:#ddd;border-style:solid;border-width:0 1px 0 0">All</div>
      <ul style="float:left">
        <li *ngFor="let domain of domains|async"
          (click)="router.navigate(['profile','domain',domain.payload.doc.id])"
          [style.background]="UI.currentDomain==domain.payload.doc.id?'#f4f7fc':'none'"
          style="position:relative;float:left;padding:7px;min-width:50px;text-align:center;font-size:12px;cursor:pointer;border-color:#ddd;border-style:solid;border-width:0 1px 0 0">
          <div [style.color]="UI.currentDomain==domain.payload.doc.id?'#267cb5':'#777'">{{domain.payload.doc.data()?.name}}</div>
        </li>
      </ul>
      <div class="seperator" style="width:100%;margin:0px"></div>
    </div>
    <div *ngIf="UI.currentDomain=='all'&&mode=='domain'" style="clear:both;background:#f2f2f2;font-size:16px;padding:5px 15px 5px 15px">Team wide messages</div>
    <div *ngIf="(mode=='user')||!(UI.currentDomain=='all')">
      <div style="clear:both;background-color:#f4f7fc">
        <div style="float:left">
          <img [style.border-radius]="mode=='user'?'50%':'3%'" [src]="(mode=='user')?focusUserLastMessageObj?.imageUrlMedium:UI.currentDomainLastMessageObj?.domainImageUrlMedium" [style.border-radius]="(mode=='user')?'50%':'0'" style="display:inline;float:left;margin:7px;object-fit:cover;width:75px;height:75px">
        </div>
        <div style="padding:10px">
          <div style="clear:both;float:left;color:#222;white-space:nowrap;width:75%;text-overflow:ellipsis">
            <div style="float:left">
              <span >{{mode=='user'?focusUserLastMessageObj?.name:UI.currentDomainLastMessageObj.domain}}</span>
              <span style="font-size:10px"> {{mode=='user'?focusUserLastMessageObj?.familyName:''}}</span>
              <span *ngIf="mode=='user'&&focusUserLastMessageObj?.PERRINN?.wallet?.balance>0" style="color:white;background-color:green;padding:2px 4px 2px 4px;border-radius:3px;font-size:10px;margin:5px">Member</span>
              <span *ngIf="mode=='domain'" style="color:white;background-color:#b38300;padding:2px 4px 2px 4px;border-radius:3px;font-size:10px;margin:5px">Domain</span>
            </div>
            <img *ngIf="mode=='user'&&focusUserLastMessageObj?.apps?.Google?.enabled" src="./../assets/App icons/driveLogo.png" style="float:left;width:15px;margin:5px;cursor:pointer" onclick="window.open('https://drive.google.com/drive/u/1/folders/1qvipN1gs1QS4sCh1tY8rSSFXV5S0-uR3','_blank')">
            <img *ngIf="mode=='user'&&focusUserLastMessageObj?.apps?.Onshape?.enabled" src="./../assets/App icons/onshapeLogo.png" style="float:left;width:15px;margin:5px;cursor:pointer" onclick="window.open('https://cad.onshape.com/documents?nodeId=31475a51a48fbcc9cfc7e244&resourceType=folder','_blank')">
          </div>
          <div *ngIf="mode=='user'" style="clear:both">
            <div style="clear:both;float:left;font-size:17px;color:green;margin-right:5px">{{(focusUserLastMessageObj?.PERRINN?.wallet?.balance||0)|number:'1.2-2'}}</div>
            <div style="float:left;font-size:10px;color:green;line-height:25px">COINS</div>
            <div style="clear:both;float:left;font-size:10px;color:#999">Created {{focusUserLastMessageObj?.createdTimestamp|date:'MMMM yyyy'}}, {{focusUserLastMessageObj?.userChain?.index}} Messages, {{focusUserLastMessageObj?.membership?.daysTotal|number:'1.1-1'}} Membership days, Verified {{((nowSeconds-focusUserLastMessageObj?.verifiedTimestamp?.seconds)/3600/24)|number:'1.2-2'}} days ago</div>
          </div>
        </div>
        <div class="seperator" style="width:100%;margin:0px"></div>
      </div>
    </div>
    <div class="spinner" *ngIf="UI.loading">
      <div class="bounce1"></div>
      <div class="bounce2"></div>
      <div class="bounce3"></div>
    </div>
    <ul class="listLight" *ngIf="UI.currentDomain!='all'">
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
          <div style="float:left;font-size:10px;font-family:sans-serif;color:#777">{{message.payload.doc.data()?.domain}}</div>
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
          <div style="float:left;font-size:10px;font-family:sans-serif;color:#777">{{message.payload.doc.data()?.domain}}</div>
        </div>
        <div class="seperator"></div>
        {{last?scrollToTop(message.key):''}}
      </li>
    </ul>
  </div>
  `,
})
export class ProfileComponent {
  lastMessages:Observable<any[]>;
  pinnedMessages:Observable<any[]>;
  nowSeconds:number;
  scrollTeam:string;
  domains:Observable<any[]>;
  focusUserLastMessageObj:any;
  mode:string;
  id:string;

  constructor(
    public afAuth: AngularFireAuth,
    public afs: AngularFirestore,
    public router: Router,
    public UI: UserInterfaceService,
    private route: ActivatedRoute
  ) {
    this.mode=''
    this.id=''
    this.UI.loading=false
    this.nowSeconds=Date.now()/1000
    this.scrollTeam=''
    this.route.params.subscribe(params => {
      this.mode=params.mode
      this.id=params.id
      if(this.mode=='domain')this.UI.switchDomain(this.id);
      if(this.mode=='user'){
        afs.collection<any>('PERRINNMessages',ref=>ref.where('user','==',this.id).where('verified','==',true).orderBy('serverTimestamp','desc').limit(1)).valueChanges().subscribe(snapshot=>{
          this.focusUserLastMessageObj=snapshot[0];
        });
      };
      this.refreshMessages();
    });
    this.domains=this.afs.collection<any>('PERRINNTeams',ref=>ref.where('isDomain','==',true)).snapshotChanges();
  }

  refreshMessages(){
    if(this.mode=='user'){
      this.afAuth.user.subscribe((auth) => {
        this.lastMessages=this.afs.collection<any>('PERRINNMessages',ref=>ref
          .where('recipientList','array-contains',this.id)
          .where('lastMessage','==',true)
          .orderBy('serverTimestamp','desc')
          .limit(30)
        ).snapshotChanges();
      });
    }
    else if(this.id=='all'){
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

  unpinMessage(message){
    event.stopPropagation();
  }

  logout() {
    this.afAuth.auth.signOut();
    this.UI.currentUser = null;
  }

}
