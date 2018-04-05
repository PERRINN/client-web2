import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'userSettings',
  template: `
  <div class="sheet" style="background-color:#f5f5f5">
  <div class="buttonDiv" style="color:red" (click)="this.logout();router.navigate(['login']);">logout</div>
  <div class="title">Teams</div>
  <ul class="listLight">
    <li style="cursor:default" *ngFor="let team of viewUserTeams | async"
      [class.selected]="team.$key === UI.currentTeam">
      <div style="width:200px;float:left">
      <img [src]="team.imageUrlThumb" style="display: inline; float: left; margin: 7px 10px 7px 10px;object-fit:cover;height:20px;width:30px;border-radius:3px">
      <div style="width:150px;float:left;margin-top:10px;color:#222;font-size:11px">{{team.name}}{{(DB.getTeamLeader(team.$key,UI.focusUser)?" *":"")}}</div>
      </div>
      <div style="width:100px;height:30px;float:left">
      <div *ngIf="!DB.getTeamLeader(team.$key,UI.focusUser)" class="buttonDiv" style="font-size:11px;color:red" (click)="stopFollowing(team.$key)">Stop following</div>
      </div>
      <div class="seperator"></div>
    </li>
  </ul>
  </div>
  `,
})
export class UserSettingsComponent {
  viewUserTeams: FirebaseListObservable<any>;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.focusUser = params['id'];
      this.UI.currentTeam="";
      this.viewUserTeams=db.list('viewUserTeams/'+this.UI.focusUser, {
        query:{
          orderByChild:'lastChatVisitTimestampNegative',
        }
      });
    });
  }

  stopFollowing(team){
    this.db.object('viewUserTeams/'+this.UI.currentUser+'/'+team).remove();
    this.db.object('subscribeTeamUsers/'+team+'/'+this.UI.currentUser).remove();
  }

  logout() {
    this.afAuth.auth.signOut()
  }

}
