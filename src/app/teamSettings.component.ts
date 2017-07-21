import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import { Router } from '@angular/router';


@Component({
  selector: 'teamSettings',
  template: `
  <ul class="listDark">
    <div class="title">MY TEAMS</div>
    <li *ngFor="let team of userTeams | async"
      [class.selected]="team.$key === currentTeamID"
      (click)="db.object('userInterface/'+currentUserID).update({currentTeam: team.$key})">
      <div style="display: inline; float: left; margin: 0 10px 0 10px; height:25px; width:25px">
      <div class="activity" [hidden]="getChatActivity(team.$key)"></div>
      </div>
      <img [src]="getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:25px; width:25px">
      {{getTeamName(team.$key)}}{{ (getUserLeader(team.$key)? " *" : "")}}
    </li>
  </ul>
  <div class="teamProfile">
  <div style="width: 250px;">
  <button (click)="this.router.navigate(['teamProfile'])" >Edit team profile</button>
  <button (click)="this.router.navigate(['addMember'])">Add a member to this team</button>
  </div>
  <div class="titleSeperator">ORGANISATION</div>
  <div style="padding:10px;">{{ (currentTeam | async)?.organisation }}</div>
  <div class="titleSeperator">PROJECTS</div>
  <div style="padding:10px;">Coming soon</div>
  <hr>
  <div style="width: 250px;">
  <button (click)="this.router.navigate(['followTeam'])">Follow a team</button>
  <button (click)="this.router.navigate(['createTeam'])">Create a new team</button>
  <button (click)="leaveTeam(currentTeamID)" style="background:#e04e4e">Stop following this team {{message1}}</button>
  </div>
  </div>
  `,
})

export class TeamSettingsComponent  {

  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  currentTeam: FirebaseObjectObservable<any>;
  currentTeamID: string;
  userTeams: FirebaseListObservable<any>;
  newMemberID: string;
  followTeamID: string;
  newTeam: string;
  message1: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){
        this.userTeams=null;
      }
      else {
        this.currentUserID = auth.uid;
        this.currentUser = db.object('users/' + (auth ? auth.uid : "logedout"));
        db.object('userInterface/'+auth.uid).subscribe(userInterface => {
          this.currentTeamID = userInterface.currentTeam;
          this.currentTeam = db.object('teams/' + this.currentTeamID);
        });
        this.userTeams = db.list('userTeams/' + (auth ? auth.uid : "logedout"), {
          query:{
            orderByChild:'following',
            equalTo: true,
          }
        });
      }
    });
  }

  followTeam() {
    this.userTeams.update(this.followTeamID, {status: "confirmed"});
    this.currentUser.update({currentTeam: this.followTeamID});
  }

  getTeamName (ID: string) :string {
    var output;
    this.db.object('teams/' + ID).subscribe(snapshot => {
      output = snapshot.name;
    });
    return output;
  }

  getTeamPhotoURL (ID: string) :string {
    var output;
    this.db.object('teams/' + ID).subscribe(snapshot => {
      output = snapshot.photoURL;
    });
    return output;
  }

  getUserLeader (ID: string) :string {
    var output;
    this.db.object('teamUsers/' + ID + '/' + this.currentUserID).subscribe(snapshot => {
      output = snapshot.leader;
    });
    return output;
  }

  getChatActivity (ID: string) :boolean {
    var output;
    this.db.object('userTeams/' + this.currentUserID + '/' + ID).subscribe(userTeam => {
      this.db.object('teamActivities/' + ID).subscribe(teamActivities => {
        output = !(teamActivities.lastMessageTimestamp > userTeam.lastChatVisitTimestamp);
      });
    });
    return output;
  }

  leaveTeam(teamID: string) {
    this.db.object('userTeams/' + this.currentUserID + '/' + teamID).update({following:false})
    .then(_ => this.message1="You have left that team")
    .catch(err => this.message1="Error: Team leaders cannot leave their teams");
  }

}
