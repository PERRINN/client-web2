import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { userInterfaceService } from './userInterface.service';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

@Component({
  selector: 'sendCoins',
  template: `
  <div id='main_container'>
  <div class="sheet">
  <div style="float:left;margin:15px;font-size:18px">Send COINS</div>
  <div *ngIf="receiver" style="margin:15px;float:left;width:200px">
    <span style="float:left;font-size:12px">to:</span>
    <img [src]="receiverImageUrlThumb" style="display: inline; float:left; margin: 0 5px 0 10px; opacity: 1; object-fit: cover; height:25px; width:25px">
    <span>{{receiverName}}</span>
    <span style="font-size:10px"> {{receiverFamilyName}}</span>
  </div>
  <div style="float:right;margin:15px;font-size:12px">Balance available: C{{(UI.focusUserObj?.lastMessageBalance?UI.focusUserObj?.lastMessageBalance:0)|number:'1.2-2'}}</div>
  <div class="buttonDiv" [style.color]="inputsValid?'#267cb5':'#bbb'" style="clear:both;margin:15px;width:150px;font-size:11px" (click)="sendCoins()">Send COINS</div>
  <input maxlength="500" (keyup)="inputsValid=checkInputs()" [(ngModel)]="amount" placeholder="Amount">
  <input maxlength="500" (keyup)="inputsValid=checkInputs()" [(ngModel)]="reference" placeholder="Reference">
  <input maxlength="500" (keyup)="refreshSearchLists();inputsValid=checkInputs()" [(ngModel)]="searchFilter" placeholder="Search user">
  <ul class="listLight">
    <li *ngFor="let team of teams | async" >
      <div style="padding:5px">
        <div style="float:left;width:175px">
          <img [src]="team?.values.imageUrlThumb" style="display: inline; float:left; margin: 0 5px 0 10px; opacity: 1; object-fit: cover; height:25px; width:25px">
          <span>{{team.values?.name}}</span>
          <span style="font-size:10px"> {{team.values?.familyName}}</span>
        </div>
        <div class="buttonDiv" style="float:left;width:50px;font-size:11px;background-color:#267cb5;color:white;border-style:none" (click)="receiver=team.key;receiverName=team.values.name;receiverFamilyName=team.values.familyName;receiverImageUrlThumb=team.values.imageUrlThumb;inputsValid=checkInputs()">Select</div>
      </div>
    </li>
  </ul>
  </div>
  </div>
  `,
})

export class SendCoinsComponent  {

  teams:Observable<any[]>;
  searchFilter:string;
  receiver:String;
  receiverName:String;
  receiverFamilyName:String;
  receiverImageUrlThumb:String;
  amount:number;
  reference:string;
  inputsValid:boolean;

  constructor(
    public afs: AngularFirestore,
    public router: Router,
    public UI: userInterfaceService
  ) {
    this.receiver='';
    this.reference='';
    this.inputsValid=this.checkInputs();
  }

  ngOnInit() {
    this.refreshSearchLists();
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

  checkInputs(){
    if(this.receiver=='')return false;
    if(this.reference=='')return false;
    if(isNaN(this.amount))return false;
    if(Number(this.amount)<=0)return false;
    if(Number(this.amount)>Number(this.UI.focusUserObj.lastMessageBalance))return false;
    return true;
  }

  sendCoins(){
    if (!this.checkInputs())return null;
    return this.afs.collection('IDs').add({
      user:this.UI.currentUser,
      serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(ref=>{
      this.UI.clearRecipient();
      this.UI.addRecipient(this.UI.currentUser).then(()=>{
        this.UI.addRecipient(this.receiver).then(()=>{
          this.UI.chatSubject=this.reference;
          this.UI.chain=ref.id;
          this.UI.showChatDetails=false;
          this.UI.process={
            inputs:{
              amount:this.amount,
              receiver:this.receiver,
              receiverName:this.receiverName,
              receiverFamilyName:this.receiverFamilyName,
              reference:this.reference
            },
            function:{
              name:'transactionOut'
            },
            inputsComplete:true
          };
          this.UI.createMessageAFS(this.UI.currentUser,'sending '+this.amount+' COINS','','',true);
          this.router.navigate(['chat','']);
        });
      });
    });
  }

}
