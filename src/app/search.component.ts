import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UserInterfaceService } from './userInterface.service';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

@Component({
  selector: 'search',
  template: `
  <div id='main_container'>
  <div class="sheet">
  <input id="searchInput" maxlength="500" (keyup)="refreshSearchLists()" [(ngModel)]="searchFilter" placeholder="Search">
  <div class="buttonDiv" *ngIf="searchFilter==''" style="margin:10px;width:150px;font-size:11px;color:#267cb5" (click)="refreshSearchByCOINLists()">COIN holders' list</div>
  <div class="buttonDiv" *ngIf="searchFilter==''" style="margin:10px;width:150px;font-size:11px;color:#267cb5" (click)="refreshSearchDomainsList()">Domains list</div>
  </div>
  <div class='sheet' style="margin-top:10px">
  <ul class="listLight">
    <li *ngFor="let team of teams | async" style="padding:5px">
      <div style="float:left;width:250px" (click)="router.navigate(['team',team.key])">
        <img [src]="team?.values.imageUrlThumb" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:40px; width:40px">
        <span>{{team.values?.name}}</span>
        <span style="font-size:10px"> {{team.values?.familyName}}</span>
        <div style="font-size:12px;color:#999">C{{(team.values?.lastMessageBalance?team.values?.lastMessageBalance:0)|number:'1.2-2'}}</div>
      </div>
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
  </div>
  </div>
  `,
})

export class SearchComponent  {

  teams: Observable<any[]>;
  searchFilter: string;

  constructor(
    public afs: AngularFirestore,
    public router: Router,
    public UI: UserInterfaceService
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

  refreshSearchByCOINLists() {
    this.teams = this.afs.collection('PERRINNTeams', ref => ref
    .where('isUser','==',true)
    .orderBy('lastMessageBalance',"desc")
    .limit(20))
    .snapshotChanges().pipe(map(changes => {
      return changes.map(c => ({
        key: c.payload.doc.id,
        values: c.payload.doc.data(),
      }));
    }));
  }

  refreshSearchDomainsList() {
    this.teams = this.afs.collection('PERRINNTeams', ref => ref
    .where('isDomain','==',true)
    .limit(20))
    .snapshotChanges().pipe(map(changes => {
      return changes.map(c => ({
        key: c.payload.doc.id,
        values: c.payload.doc.data(),
      }));
    }));
  }

}
