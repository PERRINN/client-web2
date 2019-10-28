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
  selector: 'team',
  template: `
  <div id='main_container'>
  <div style="max-width:800px;margin:0 auto">
  <div style="font-size:18px;line-height:30px;margin:10px;font-family:sans-serif;">{{UI.chatSubject?UI.chatSubject:'no subject'}}</div>
  <div class='sheet' style="margin-top:5px">
    <ul class='listLight'>
      <li *ngFor="let recipient of objectToArray(UI.recipients)" (click)="router.navigate(['user',recipient[0]])">
        <img [src]="recipient[1]?.imageUrlThumb" style="float:left;object-fit:cover;height:50px;width:50px;border-radius:3px;margin:5px 5px 5px 10px">
        <div style="width:100px;float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{recipient[1]?.name}} {{recipient[1]?.familyName}}</div>
      </li>
    </ul>
  </div>
  </div>
  </div>
`,
})
export class ChatProfileComponent  {

  constructor(
    public db: AngularFireDatabase,
    public router: Router,
    public UI: userInterfaceService,
    private route: ActivatedRoute,
    private storage: AngularFireStorage,
    public afs: AngularFirestore
  ) {
    this.route.params.subscribe(params => {
      this.UI.currentTeam = params.id;
    });
  }
  objectToArray(obj) {
    if (obj == null) { return null; }
    return Object.keys(obj).map(function(key) {
      return [key, obj[key]];
    });
  }

}
