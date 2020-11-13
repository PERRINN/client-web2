import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UserInterfaceService } from './userInterface.service';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

@Component({
  selector:'search',
  template:`
  <div class="sheet">
  <input id="searchInput" maxlength="500" (keyup)="refreshSearchLists()" [(ngModel)]="searchFilter" placeholder="Search">
  <div class="buttonDiv" *ngIf="searchFilter==''" style="margin:10px;width:150px;font-size:11px;color:#267cb5" (click)="refreshMembersList()">Members' list</div>
  <div class="seperator" style="width:100%;margin:0px"></div>
  </div>
  <div class='sheet'>
  <ul class="listLight">
    <li *ngFor="let message of messages | async" style="padding:5px"
    [ngClass]="UI.isContentAccessible(message.values.user)?'clear':'encrypted'">
      <div style="float:left;width:250px" (click)="router.navigate(['profile',message.values.user])">
        <img [src]="message?.values.imageUrlThumbUser" style="display:inline;float:left;margin:0 10px 0 10px;opacity:1;object-fit:cover;height:40px;width:40px;border-radius:50%">
        <span>{{message.values?.name}}</span>
        <span style="font-size:10px"> {{message.values?.familyName}}</span>
        <div style="font-size:12px;color:#999">C{{(message.values?.PERRINN?.wallet?.balance?message.values?.PERRINN?.wallet?.balance:0)|number:'1.2-2'}}</div>
      </div>
    </li>
  </ul>
  <div class="seperator" style="width:100%;margin:0px"></div>
  </div>
  `,
})

export class SearchComponent  {

  messages:Observable<any[]>;
  searchFilter:string;

  constructor(
    public afs:AngularFirestore,
    public router:Router,
    public UI:UserInterfaceService
  ) {
    this.searchFilter='';
  }

  ngOnInit() {
    document.getElementById('searchInput').focus();
    this.refreshSearchLists();
  }

  refreshSearchLists() {
    if (this.searchFilter) {
      if (this.searchFilter.length > 1) {
        this.messages = this.afs.collection('PERRINNMessages', ref => ref
        .where('userChain.nextMessage','==','none')
        .where('verified','==',true)
        .where('searchName','>=',this.searchFilter.toLowerCase())
        .where('searchName','<=',this.searchFilter.toLowerCase()+'\uf8ff')
        .orderBy('searchName')
        .limit(10))
        .snapshotChanges().pipe(map(changes => {
          return changes.map(c => ({
            key:c.payload.doc.id,
            values:c.payload.doc.data(),
          }));
        }));
      }
    } else {
      this.messages = null;
    }
  }

  refreshMembersList() {
    this.messages = this.afs.collection('PERRINNMessages', ref => ref
    .where('userChain.nextMessage','==','none')
    .where('verified','==',true)
    .where('PERRINN.wallet.balance','>',0)
    .orderBy('PERRINN.wallet.balance',"desc")
    .limit(20))
    .snapshotChanges().pipe(map(changes => {
      return changes.map(c => ({
        key:c.payload.doc.id,
        values:c.payload.doc.data(),
      }));
    }));
  }

}
