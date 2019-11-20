import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { userInterfaceService } from './userInterface.service';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';

@Component({
  selector: 'search',
  template: `
  <div id='main_container'>
  <div class="sheet">
  <input id="searchInput" maxlength="500" (keyup)="refreshSearchLists()" [(ngModel)]="searchFilter" placeholder="Search">
  </div>
  <div class='sheet' style="margin-top:10px">
  <ul class="listLight">
    <li *ngFor="let team of teams | async" style="padding:5px">
      <div style="float:left;width:175px" (click)="router.navigate(['user',team.key])">
      <img [src]="team?.values.imageUrlThumb" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      <span>{{team.values?.name}}</span>
      <span style="font-size:10px"> {{team.values?.familyName}}</span>
      </div>
      <div class="buttonDiv" style="float:left;font-size:11px;color:#267cb5" (click)="newChatWithUser(team.key)">New chat</div>
      <div class="buttonDiv" style="float:left;font-size:11px;background-color:#267cb5;color:white" (click)="addUserToChat(team.key)">Add to chat</div>
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
    public UI: userInterfaceService
  ) {
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

  newChatWithUser(user){
    this.UI.clearRecipient();
    this.UI.chatSubject='';
    return this.UI.addRecipient(this.UI.currentUser).then(()=>{
      return this.UI.addRecipient(user).then(()=>{
        this.router.navigate(['chat',this.UI.currentUser]);
      });
    });
  }

  addUserToChat(user){
      return this.UI.addRecipient(user).then(()=>{
        this.router.navigate(['chat',this.UI.currentUser]);
      });
  }

}
