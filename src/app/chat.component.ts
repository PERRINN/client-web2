import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { userInterfaceService } from './userInterface.service';
import { AngularFireStorage } from '@angular/fire/storage';
import * as firebase from 'firebase/app';

@Component({
  selector: 'chat',
  template: `

  <div *ngIf="UI.showChatDetails" id='main_container'>
  <div class="sheet" style="background:#eee">
    <div (click)="refreshMessages();UI.showChatDetails=false" style="font-size:12px;text-align:center;line-height:20px;padding:2px;margin:10px;color:#4287f5;cursor:pointer">messages</div>
    <div *ngIf="!editing" style="font-size:18px;line-height:30px;margin:10px;font-family:sans-serif;">{{UI.chatSubject?UI.chatSubject:'no subject'}}</div>
    <input *ngIf="editing" [(ngModel)]="UI.chatSubject">
    <div *ngIf="!editing" (click)="editing=!editing" style="font-size:12px;text-align:center;line-height:20px;width:80px;padding:2px;margin:10px;color:white;background-color:#4287f5;border-radius:3px;cursor:pointer">Edit subject</div>
    <div *ngIf="editing" (click)="draftMessage='I have changed the subject of this chat';addMessage();editing=!editing;refreshMessages();UI.showChatDetails=false" style="font-size:12px;text-align:center;line-height:20px;width:80px;padding:2px;margin:10px;color:#4287f5;border-style:solid;border-width:1px;border-radius:3px;cursor:pointer">Apply</div>
    <ul style="color:#333;border-style:solid;border-width:1px;background-color:white;margin:10px;border-radius:10px">
      <li *ngFor="let recipient of objectToArray(UI.recipients)" (click)="router.navigate(['user',recipient[0]])" style="cursor:pointer;float:left">
        <img [src]="recipient[1]?.imageUrlThumb" style="float:left;object-fit:cover;height:25px;width:25px;border-radius:3px;margin:3px 3px 3px 10px">
        <div style="float:left;margin:10px 15px 3px 3px;font-size:12px;line-height:10px;font-family:sans-serif">{{recipient[1]?.name}} {{recipient[1]?.familyName}}</div>
      </li>
      <input id="searchInput" style="border:none" maxlength="500" (keyup)="refreshSearchLists()" [(ngModel)]="searchFilter" placeholder="add people">
    </ul>
    <ul class="listLight">
      <li *ngFor="let team of teams | async" >
        <div *ngIf="!UI.recipients[team.key]" style="padding:5px">
          <div style="float:left;width:175px">
            <img [src]="team?.values.imageUrlThumb" style="display: inline; float:left; margin: 0 5px 0 10px; opacity: 1; object-fit: cover; height:25px; width:25px">
            <span>{{team.values?.name}}</span>
            <span style="font-size:10px"> {{team.values?.familyName}}</span>
          </div>
          <div class="buttonDiv" style="float:left;width:50px;font-size:11px;background-color:#267cb5;color:white;border-style:none" (click)="UI.addRecipient(team.key)">Add</div>
        </div>
      </li>
    </ul>
  </div>
  </div>


  <div *ngIf="!UI.showChatDetails" id='main_container' scrollable (scrollPosition)="scrollHandler($event)">
  <div class="sheet" style="background-color:#eaeaea">
  <div class="sheet" style="position:fixed;background:#fcfcfc;width:100%;color:#444;font-size:12px;padding:5px 10px 5px 10px;cursor:pointer" (click)="UI.showChatDetails=true">
    <div style="font-weight:bold">{{UI.chatSubject}}</div>
    <span *ngFor="let recipient of objectToArray(UI.recipients);let last=last">{{recipient[0]==UI.currentUser?'You':recipient[1].name}}{{recipient[0]==UI.currentUser?'':recipient[1].familyName!=undefinied?' '+recipient[1].familyName:''}}{{last?"":", "}}</span>
  </div>
  <div class="spinner" *ngIf="UI.loading">
    <div class="bounce1"></div>
    <div class="bounce2"></div>
    <div class="bounce3"></div>
  </div>
  <div>
  <ul style="list-style:none;">
    <li *ngFor="let message of messages|async;let first=first;let last=last;let i=index">
      <div *ngIf="i<messageNumberDisplay" [style.background-color]="lastChatVisitTimestamp<message.payload?.timestamp?'#ffefd1':''">
      <div *ngIf="isMessageNewTimeGroup(message.payload?.timestamp)||first" style="padding:70px 15px 15px 15px">
        <div style="border-color:#bbb;border-width:1px;border-style:solid;color:#404040;background-color:#e9e8f9;width:200px;padding:5px;margin:0 auto;text-align:center;border-radius:7px">{{message.payload?.timestamp|date:'fullDate'}}</div>
      </div>
      <div *ngIf="isMessageNewUserGroup(message.payload?.user,message.payload?.timestamp)||first" style="clear:both;width:100%;height:15px"></div>
      <div *ngIf="isMessageNewUserGroup(message.payload?.user,message.payload?.timestamp)||first" style="float:left;width:60px;min-height:10px">
        <img [src]="message.payload?.imageUrlThumbUser" style="cursor:pointer;display:inline;float:left;margin:10px;border-radius:3px; object-fit:cover; height:35px; width:35px" (click)="router.navigate(['user',message.payload?.user])">
      </div>
      <div style="cursor:text;border-radius:7px;background-color:white;margin:2px 10px 5px 60px">
        <div>
          <div *ngIf="isMessageNewUserGroup(message.payload?.user,message.payload?.timestamp)||first" style="font-size:12px;font-weight:bold;display:inline;float:left;margin:0px 10px 0px 5px">{{message.payload?.name}}{{message.payload?.firstName}}</div>
          <div *ngIf="isMessageNewUserGroup(message.payload?.user,message.payload?.timestamp)||first" style="color:#AAA;font-size:11px">{{message.payload?.timestamp | date:'HH:mm'}}</div>
          <img *ngIf="message.payload?.action=='transaction'" src="./../assets/App icons/icon_share_03.svg" style="display:inline;float:left;margin:0 5px 0 5px;height:20px;">
          <img *ngIf="message.payload?.action=='confirmation'" src="./../assets/App icons/tick.png" style="display:inline;float:left;margin:0 5px 0 5px;height:20px;">
          <img *ngIf="message.payload?.action=='warning'" src="./../assets/App icons/warning.png" style="display:inline;float:left;margin:0 5px 0 5px;height:20px;">
          <img *ngIf="message.payload?.action=='process'" src="./../assets/App icons/repeat.png" style="display:inline;float:left;margin:0 5px 0 5px;height:20px;">
          <img *ngIf="message.payload?.action=='add'" src="./../assets/App icons/add.png" style="display:inline;float:left;margin:0 5px 0 5px;height:20px;">
          <img *ngIf="message.payload?.action=='remove'" src="./../assets/App icons/remove.png" style="display:inline;float:left;margin:0 5px 0 5px;height:20px;">
          <div style="float:left;color:#404040;margin:5px 5px 0 5px" [innerHTML]="message.payload?.text | linky"></div>
          <div *ngIf="message.payload?.linkTeam" style="float:left;cursor:pointer;margin:5px" (click)="router.navigate(['user',message.payload?.linkTeam])">
            <img [src]="message.payload?.linkTeamImageUrlThumb" style="float:left;object-fit:cover;height:25px;width:40px;border-radius:3px">
            <div style="font-size:11px;padding:5px;">{{message.payload?.linkTeamName}}</div>
          </div>
          <div *ngIf="message.payload?.linkUser" style="float:left;cursor:pointer;margin:5px" (click)="router.navigate(['user',message.payload?.linkUser])">
            <img [src]="message.payload?.linkUserImageUrlThumb" style="float:left;object-fit:cover;height:25px;width:25px">
            <div style="font-size:11px;padding:5px;">{{message.payload?.linkUserName}} {{message.payload?.linkuserFamilyName}}</div>
          </div>
          <div *ngIf="message.payload?.PERRINN?.process?.inputsComplete" style="clear:both;margin:5px">
            <div style="float:left;background-color:#c7edcd;padding:0 5px 0 5px">
              <span style="font-size:11px">{{message.payload?.PERRINN?.process?.result}}</span>
            </div>
          </div>
          <div *ngIf="message.payload?.PERRINN?.transactionOut?.processed" style="clear:both;margin:5px">
            <div style="float:left;background-color:#c7edcd;padding:0 5px 0 5px">
              <span style="font-size:11px">C{{message.payload?.PERRINN?.transactionOut?.amount|number:'1.2-20'}}</span>
              <span style="font-size:11px"> have been sent to </span>
              <span style="font-size:11px">{{message.payload?.PERRINN?.transactionOut?.receiverName}}</span>
              <span style="font-size:11px"> {{message.payload?.PERRINN?.transactionOut?.receiverFamilyName}}</span>
              <span style="font-size:11px"> reference: {{message.payload?.PERRINN?.transactionOut?.reference}}</span>
            </div>
          </div>
          <div *ngIf="message.payload?.PERRINN?.transactionIn?.processed" style="clear:both;margin:5px">
            <div style="float:left;background-color:#c7edcd;padding:0 5px 0 5px">
              <span style="font-size:11px">C{{message.payload?.PERRINN?.transactionIn?.amount|number:'1.2-20'}}</span>
              <span style="font-size:11px"> have been received from </span>
              <span style="font-size:11px">{{message.payload?.PERRINN?.transactionIn?.donorName}}</span>
              <span style="font-size:11px"> {{message.payload?.PERRINN?.transactionIn?.donorFamilyName}}</span>
              <span style="font-size:11px"> reference: {{message.payload?.PERRINN?.transactionIn?.reference}}</span>
            </div>
          </div>
          <div style="clear:both;text-align:center">
            <img class="imageWithZoom" *ngIf="message.payload?.image" [src]="message.payload?.imageDownloadURL" style="clear:both;width:70%;max-height:320px;object-fit:contain;margin:5px 10px 5px 5px;border-radius:3px" (click)="showFullScreenImage(message.payload?.imageDownloadURL)">
          </div>
          <div *ngIf="showDetails[message.key]">
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:225px">
              <img src="./../assets/App icons/messaging.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">MEMBERSHIP COST</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Count: {{message.payload?.PERRINN?.membershipCost?.counter}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount: C{{message.payload?.PERRINN?.membershipCost?.amount|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp: {{message.payload?.PERRINN?.membershipCost?.timestamp}}</div>
            </div>
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:225px">
              <img src="./../assets/App icons/messaging.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">MESSAGE COST</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount: C{{message.payload?.PERRINN?.messagingCost?.amount|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount Read: C{{message.payload?.PERRINN?.messagingCost?.amountRead|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount Write: C{{message.payload?.PERRINN?.messagingCost?.amountWrite|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Receiver: {{message.payload?.PERRINN?.messagingCost?.receiver}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040" [style.background-color]="message.payload?.PERRINN?.messagingCost?.status=='rejected balance low'?'#fcebb8':''">Status: {{message.payload?.PERRINN?.messagingCost?.status}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040" [style.background-color]="message.payload?.PERRINN?.messagingCost?.processed?'#c7edcd':''">Processed: {{message.payload?.PERRINN?.messagingCost?.processed}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp: {{message.payload?.PERRINN?.messagingCost?.timestamp}}</div>
            </div>
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:225px">
              <img src="./../assets/App icons/repeat.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">PROCESS</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Function: {{message.payload?.PERRINN?.process?.function|json}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Inputs complete: {{message.payload?.PERRINN?.process?.inputsComplete}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Inputs: {{message.payload?.PERRINN?.process?.inputs|json}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040" [style.background-color]="(message.payload?.PERRINN?.process?.result!='none')?'#c7edcd':''">Result: {{message.payload?.PERRINN?.process?.result}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp: {{message.payload?.PERRINN?.process?.timestamp}}</div>
            </div>
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:225px">
              <img src="./../assets/App icons/out.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">TRANSACTION OUT</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount: C{{message.payload?.PERRINN?.transactionOut?.amount|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Receiver: {{message.payload?.PERRINN?.transactionOut?.receiver}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Message: {{message.payload?.PERRINN?.transactionOut?.receiverMessage}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Reference: {{message.payload?.PERRINN?.transactionOut?.reference}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040" [style.background-color]="message.payload?.PERRINN?.transactionOut?.status=='rejected balance low'?'#fcebb8':''">Status: {{message.payload?.PERRINN?.transactionOut?.status}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040" [style.background-color]="message.payload?.PERRINN?.transactionOut?.processed?'#c7edcd':''">Processed: {{message.payload?.PERRINN?.transactionOut?.processed}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp: {{message.payload?.PERRINN?.transactionOut?.timestamp}}</div>
            </div>
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:225px">
              <img src="./../assets/App icons/in.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">TRANSACTION IN</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount: C{{message.payload?.PERRINN?.transactionIn?.amount|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Donor: {{message.payload?.PERRINN?.transactionIn?.donor}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Reference: {{message.payload?.PERRINN?.transactionIn?.reference}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040" [style.background-color]="message.payload?.PERRINN?.transactionIn?.processed?'#c7edcd':''">Processed: {{message.payload?.PERRINN?.transactionIn?.processed}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp: {{message.payload?.PERRINN?.transactionIn?.timestamp}}</div>
            </div>
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:225px">
              <img src="./../assets/App icons/chain.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">MESSAGE CHAIN</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Index:#{{message.payload?.PERRINN?.chain?.index}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040" [style.background-color]="message.payload?.PERRINN?.chain?.previousMessage!=undefined?'#c7edcd':''">Previous: {{message.payload?.PERRINN?.chain?.previousMessage}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Current: {{message.payload?.PERRINN?.chain?.currentMessage}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Next: {{message.payload?.PERRINN?.chain?.nextMessage}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp: {{message.payload?.PERRINN?.chain?.timestamp}}</div>
            </div>
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:225px">
              <img src="./../assets/App icons/wallet.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">WALLET</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Previous balance: C{{message.payload?.PERRINN?.wallet?.previousBalance|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount: C{{message.payload?.PERRINN?.wallet?.amount|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040" [style.background-color]="message.payload?.PERRINN?.wallet?.balance!=undefined?'#c7edcd':''">Balance: C{{message.payload?.PERRINN?.wallet?.balance|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp: {{message.payload?.PERRINN?.wallet?.timestamp}}</div>
            </div>
          </div>
        </div>
        <div class='messageFooter' style="cursor:pointer;clear:both;height:15px" (click)="switchShowDetails(message.key)">
          <div style="float:left;width:100px;text-align:right;line-height:10px">...</div>
          <img *ngIf="message.payload?.PERRINN?.dataWrite=='complete'" src="./../assets/App icons/tick.png" style="float:right;height:15px;margin:0 2px 2px 0">
          <div style="float:right;font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">{{message.payload?.PERRINN?.dataWrite!='complete'?message.payload?.PERRINN?.dataWrite:''}}</div>
          <div *ngIf="message.payload?.PERRINN?.chain?.nextMessage=='none'&&message.payload?.PERRINN?.wallet?.balance!=undefined" style="float:right;font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">C{{message.payload?.PERRINN?.wallet?.balance|number:'1.2-20'}}</div>
        </div>
      </div>
      </div>
      {{storeMessageValues(message.payload?.user,message.payload?.timestamp)}}
      {{(last||i==(messageNumberDisplay-1))?scrollToBottom(message.payload?.timestamp):''}}
    </li>
  </ul>
  <div style="height:125px;width:100%"></div>
  </div>

  <div class="sheet" style="position:fixed;bottom:0;width:100%;background-color:#f2f2f2">
    <div>
      <ul style="list-style:none;float:left;">
        <li *ngFor="let user of draftMessageUsers | async">
        <div [hidden]="!user.values.draftMessage||user.key==UI.currentUser" *ngIf="isDraftMessageRecent(user.values.draftMessageTimestamp)" style="padding:5px 0 5px 15px;float:left;font-weight:bold">{{user.values.name}}...</div>
        </li>
      </ul>
      <div style="clear:both;float:left;width:90%">
        <textarea id="inputMessage" autocapitalize="none" style="float:left;width:95%;border-style:none;padding:9px;margin:10px;border-radius:3px;resize:none;overflow-y:scroll" maxlength="500" (keyup.enter)="addMessage()" [(ngModel)]="draftMessage" placeholder="Reply all"></textarea>
      </div>
      <div *ngIf="draftMessage" style="float:right;width:10%">
        <img src="./../assets/App icons/send.png" style="width:25px;margin:20px 5px 5px 5px" (click)="addMessage()">
      </div>
      <div *ngIf="!draftMessage" style="float:right;width:10%">
        <input type="file" name="chatImage" id="chatImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
        <label class="buttonUploadImage" for="chatImage" id="buttonFile">
        <img src="./../assets/App icons/camera.png" style="width:25px;margin:20px 5px 5px 5px">
        </label>
      </div>
    </div>
  </div>
  </div>
  </div>
    `
})
export class ChatComponent {
  draftMessage: string;
  draftImage: string;
  draftImageDownloadURL: string;
  draftMessageDB: boolean;
  draftMessageUsers: Observable<any[]>;
  messageNumberDisplay: number;
  lastChatVisitTimestamp: number;
  scrollMessageTimestamp: number;
  previousMessageTimestamp: number;
  previousMessageUser: string;
  isCurrentUserLeader: boolean;
  isCurrentUserMember: boolean;
  showDetails: {};
  messages: Observable<any[]>;
  editing: boolean;
  teams: Observable<any[]>;
  searchFilter: string;
  reads: any[];

  constructor(
    public db: AngularFireDatabase,
    public afs: AngularFirestore,
    public router: Router,
    public UI: userInterfaceService,
    private route: ActivatedRoute,
    private storage: AngularFireStorage,
  ) {
    this.UI.loading = true;
    this.reads=[];
    this.editing=false;
    this.route.params.subscribe(params => {
      this.isCurrentUserLeader = false;
      this.isCurrentUserMember = false;
      this.showDetails = {};
      this.previousMessageTimestamp = 0;
      this.previousMessageUser = '';
      this.draftMessageDB = false;
      this.draftImage = '';
      this.draftImageDownloadURL = '';
      this.draftMessage = '';
      this.messageNumberDisplay = 15;

      this.refreshMessages();

    });
  }

  ngOnInit() {
    this.refreshSearchLists();
  }

  scrollHandler(e: string) {
    if (e === 'top') {
      this.UI.loading = true;
      this.messageNumberDisplay += 15;
      this.refreshMessages();
    }
  }

  refreshMessages() {
    this.messages=this.afs.collection('PERRINNMessages',ref=>ref
      .where('chain','==',this.UI.chain)
      .orderBy('serverTimestamp','desc')
      .limit(this.messageNumberDisplay)
    ).snapshotChanges().pipe(map(changes => {
      this.UI.loading = false;
      var batch = this.afs.firestore.batch();
      changes.forEach(c => {
        if(!this.reads.includes(c.payload.doc.id))batch.set(this.afs.firestore.collection('PERRINNTeams').doc(this.UI.currentUser).collection('reads').doc(c.payload.doc.id),{timestamp:firebase.firestore.FieldValue.arrayUnion(Date.now())},{merge:true});
        this.reads.push(c.payload.doc.id);
        if(c.payload.doc.data()['lastMessage']){
          this.UI.chatSubject=c.payload.doc.data()['chatSubject'];
          this.UI.recipients=c.payload.doc.data()['recipients'];
        }
      });
      batch.commit();
      return changes.reverse().map(c => ({payload: c.payload.doc.data()}));
    }));
  }

  switchShowDetails(message) {
    if (this.showDetails[message] == undefined) {
      this.showDetails[message] = true;
    } else {
      this.showDetails[message] = !this.showDetails[message];
    }
  }

  showFullScreenImage(src) {
    const fullScreenImage = document.getElementById('fullScreenImage') as HTMLImageElement;
    fullScreenImage.src = src;
    fullScreenImage.style.visibility = 'visible';
  }

  isMessageNewTimeGroup(messageTimestamp:any) {
    let isMessageNewTimeGroup: boolean;
    isMessageNewTimeGroup = Math.abs(messageTimestamp - this.previousMessageTimestamp) > 1000 * 60 * 60 * 4;
    return isMessageNewTimeGroup;
  }

  isMessageNewUserGroup(user: any, messageTimestamp: any) {
    let isMessageNewUserGroup: boolean;
    isMessageNewUserGroup = Math.abs(messageTimestamp - this.previousMessageTimestamp) > 1000 * 60 * 5 || (user != this.previousMessageUser);
    return isMessageNewUserGroup;
  }

  storeMessageValues(user: any, timestamp: any) {
    this.previousMessageUser = user;
    this.previousMessageTimestamp = timestamp;
  }

  isDraftMessageRecent(draftMessageTimestamp: any) {
    return (Date.now() - draftMessageTimestamp) < 1000 * 60;
  }

  scrollToBottom(scrollMessageTimestamp: number) {
    if (scrollMessageTimestamp != this.scrollMessageTimestamp) {
      const element = document.getElementById('main_container');
      element.scrollTop = element.scrollHeight;
      this.scrollMessageTimestamp = scrollMessageTimestamp;
    }
  }

  addMessage() {
    this.UI.createMessageAFS(this.UI.currentUser, this.draftMessage, this.draftImage, this.draftImageDownloadURL);
    this.draftMessage = '';
    this.draftImage = '';
    this.UI.showChatDetails=false;
  }

  updateDraftMessageDB() {
    if ((this.draftMessage != '') != this.draftMessageDB) {
      this.db.object('teamActivities/' + this.UI.currentTeam + '/draftMessages/' + this.UI.currentUser).update({
        name: this.UI.currentUserObj.name,
        draftMessage: this.draftMessage != '',
        draftMessageTimestamp: firebase.database.ServerValue.TIMESTAMP,
      });
    }
    this.draftMessageDB = (this.draftMessage != '');
  }

  onImageChange(event:any) {
    const image = event.target.files[0];
    const uploader = document.getElementById('uploader') as HTMLInputElement;
    const storageRef = this.storage.ref('images/' + Date.now() + image.name);
    const task = storageRef.put(image);

    task.snapshotChanges().subscribe((snapshot) => {
      document.getElementById('buttonFile').style.visibility = 'hidden';
      document.getElementById('uploader').style.visibility = 'visible';

      const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      uploader.value = percentage.toString();
    },
    (err:any) => {
      document.getElementById('buttonFile').style.visibility = 'visible';
      document.getElementById('uploader').style.visibility = 'hidden';
      uploader.value = '0';
    },
    () => {
      uploader.value = '0';
      document.getElementById('buttonFile').style.visibility = 'visible';
      document.getElementById('uploader').style.visibility = 'hidden';
      this.draftMessage = task.task.snapshot.ref.name.substring(0, 13);
      this.draftImage = task.task.snapshot.ref.name.substring(0, 13);
      storageRef.getDownloadURL().subscribe(url => {
        this.draftImageDownloadURL = url;
        this.addMessage();
        event.target.value = '';
      });
    });
  }

  objectToArray(obj) {
    if (obj == null) { return null; }
    return Object.keys(obj).map(function(key) {
      return [key, obj[key]];
    });
  }

  refreshSearchLists() {
    if (this.searchFilter) {
      if (this.searchFilter.length > 1) {
        this.teams = this.afs.collection('PERRINNTeams', ref => ref
        .where('isUser','==',true)
        .where('searchName','>=',this.searchFilter.toLowerCase())
        .where('searchName','<=',this.searchFilter.toLowerCase()+'\uf8ff')
        .orderBy('searchName')
        .limit(10))
        .snapshotChanges().pipe(map(changes => {
          return changes.map(c => ({
            key: c.payload.doc.id,
            values: c.payload.doc.data(),
          }));
        }));
      }
    } else {
      this.teams = null;
    }
  }


}
