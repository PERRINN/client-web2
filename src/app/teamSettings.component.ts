import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { UserInterfaceService } from './userInterface.service';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

@Component({
  selector: 'teamSettings',
  template: `
  <div class="sheet" style="background-color:#f5f5f5">
  <div style="float:left;padding:10px;cursor:pointer;border-color:#ddd;border-style:solid;border-width:0 1px 0 0;font-size:14px;font-family:sans-serif;background:#f4f7fc" (click)="router.navigate(['team',UI.currentDomain])">
    <div style="font-size:14px;font-family:sans-serif">{{UI.currentDomainObj?.name}}</div>
  </div>
  <div class="seperator" style="width:100%;margin:0px"></div>
  <img class="imageWithZoom" [src]="UI.currentDomainObj?.imageUrlMedium?UI.currentDomainObj?.imageUrlMedium:UI.currentDomainObj?.imageUrlThumb" style="object-fit:cover;margin:10px;border-radius:5px;max-height:150px;width:50%" (click)="showFullScreenImage(UI.currentDomainObj?.imageUrlOriginal)"
  onerror="this.onerror=null;this.src='https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2F1585144867972Screen%20Shot%202018-03-16%20at%2015.05.10_180x180.png?GoogleAccessId=firebase-adminsdk-rh8x2%40perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=I3Kem9n6zYjSNijnKOx%2FAOUAg65GN3xf8OD1qD4uo%2BayOFblFIgfn81uPWRTzhGg14lJdyhz3Yx%2BiCXuYCIdYnduqMZcIjtHE6WR%2BPo74ckemuxIKx3N24tlBJ6DgkfgqwmIkw%2F%2FKotm8Cz%2Fq%2FbIZm%2FvAOi2dpBHqrHiIFXYb8AVYnhP1osUhVvyzapgYJEBZJcHur7v6uqrSKwQ4DfeHHinbJpvkX3wjM6Nxabi3kVABdGcGqMoAPGCTZJMzNj8xddAXuECbptQprd9LlnQOuL4tuDfLMAOUXTHmJVhJEBrquxQi8iPRjnLOvnqF8s2We0SOxprqEuwbZyxSgH05Q%3D%3D'">
  <br/>
  <span style="font-size:18px;line-height:30px;margin:15px;font-family:sans-serif;">{{UI.currentDomainObj?.name}} {{UI.currentDomainObj?.familyName}}</span>
  <span *ngIf='UI.currentDomainObj?.member' style="color:white;background-color:green;padding:2px 4px 2px 4px;border-radius:3px;font-size:10px;margin:10px">Member</span>
  <span *ngIf='UI.currentDomainObj?.isDomain' style="color:white;background-color:#e6b927;padding:2px 4px 2px 4px;border-radius:3px;font-size:10px;margin:5px">Domain</span>
  <br/>
  <span style="font-size:16px;line-height:30px;margin:15px;font-family:sans-serif;">Balance: C{{(UI.currentDomainObj?.lastMessageBalance?UI.currentDomainObj?.lastMessageBalance:0)|number:'1.2-2'}}</span>
  <span *ngIf="UI.currentDomain==UI.currentUser" style="margin:15px;font-size:10px;color:green;padding:5px;width:100px;text-align:center;border-radius:3px;border-style:solid;border-width:1px;cursor:pointer" (click)="router.navigate(['buyCoins'])">Top Up</span>
  <br/>
  <span style="font-size:12px;line-height:30px;margin:15px;font-family:sans-serif;">Membership cost: C{{(UI.currentDomainObj?.membershipCost?UI.currentDomainObj?.membershipCost:0)|number:'1.2-2'}}</span>
  <div class="seperator" style="width:100%;margin:0px"></div>
  </div>
  <div class='sheet'>
    <div style="color:blue;;cursor:pointer;margin:20px">
      <input type="file" name="chatImage" id="chatImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
      <label class="buttonUploadImage" for="chatImage" id="buttonFile">
      <div>Upload new profile picture</div>
      </label>
    </div>
    <div *ngIf="!editName" style="color:blue;cursor:pointer;margin:20px" (click)="editName=!editName">Edit name</div>
    <input *ngIf="editName" [(ngModel)]="currentName" placeholder="First name">
    <input *ngIf="editName&&UI.currentDomainObj?.isUser" [(ngModel)]="currentFamilyName" placeholder="Family name">
    <div *ngIf="editName" (click)="applyNewName()" style="font-size:12px;text-align:center;line-height:20px;width:150px;padding:2px;margin:10px;color:#4287f5;border-style:solid;border-width:1px;border-radius:3px;cursor:pointer">Apply update</div>
    <div *ngIf="!editMembershipCost" style="color:blue;cursor:pointer;margin:20px" (click)="editMembershipCost=!editMembershipCost">Edit membership cost</div>
    <input *ngIf="editMembershipCost" [(ngModel)]="membershipCost" placeholder="Membership cost">
    <div *ngIf="editMembershipCost" (click)="applyNewMembershipCost()" style="font-size:12px;text-align:center;line-height:20px;width:150px;padding:2px;margin:10px;color:#4287f5;border-style:solid;border-width:1px;border-radius:3px;cursor:pointer">Apply update</div>
  <div class="seperator" style="width:100%;margin:0px"></div>
    <div style="font-size:14px;margin:20px;color:#444">Members</div>
    <div style="font-size:10px;margin:20px;color:#777">Members can communicate, write messages here. Leaders can modify the team.</div>
    <ul style="color:#333;margin:20px">
      <li *ngFor="let child of objectToArray(UI.currentDomainObj?.members)" (click)="router.navigate(['team',child[0]])" style="cursor:pointer">
        <img [src]="child[1]?.imageUrlThumb" style="float:left;object-fit:cover;height:25px;width:25px;border-radius:3px;margin:3px 3px 3px 10px"
        onerror="this.onerror=null;this.src='https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2F1585144867972Screen%20Shot%202018-03-16%20at%2015.05.10_180x180.png?GoogleAccessId=firebase-adminsdk-rh8x2%40perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=I3Kem9n6zYjSNijnKOx%2FAOUAg65GN3xf8OD1qD4uo%2BayOFblFIgfn81uPWRTzhGg14lJdyhz3Yx%2BiCXuYCIdYnduqMZcIjtHE6WR%2BPo74ckemuxIKx3N24tlBJ6DgkfgqwmIkw%2F%2FKotm8Cz%2Fq%2FbIZm%2FvAOi2dpBHqrHiIFXYb8AVYnhP1osUhVvyzapgYJEBZJcHur7v6uqrSKwQ4DfeHHinbJpvkX3wjM6Nxabi3kVABdGcGqMoAPGCTZJMzNj8xddAXuECbptQprd9LlnQOuL4tuDfLMAOUXTHmJVhJEBrquxQi8iPRjnLOvnqF8s2We0SOxprqEuwbZyxSgH05Q%3D%3D'">
        <div style="float:left;margin:10px 15px 3px 3px;font-size:12px;line-height:10px;font-family:sans-serif">{{child[1]?.name}} {{child[1]?.familyName}} {{child[1]?.leader?'(Leader)':''}}</div>
      </li>
    </ul>
    <div *ngIf="!editMembers" style="color:blue;cursor:pointer;margin:20px" (click)="editMembers=!editMembers">Edit members</div>
  <div class="seperator" style="width:100%;margin:0px"></div>
    <div style="font-size:14px;margin:20px;color:#444">Children</div>
    <div style="font-size:10px;margin:20px;color:#777">COINS from your wallet will automatically be used to keep your children's COIN balance positive.</div>
    <ul style="color:#333;margin:20px">
      <li *ngFor="let child of objectToArray(UI.currentDomainObj?.children)" (click)="router.navigate(['team',child[0]])" style="cursor:pointer">
        <img [src]="child[1]?.imageUrlThumb" style="float:left;object-fit:cover;height:25px;width:25px;border-radius:3px;margin:3px 3px 3px 10px"
        onerror="this.onerror=null;this.src='https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2F1585144867972Screen%20Shot%202018-03-16%20at%2015.05.10_180x180.png?GoogleAccessId=firebase-adminsdk-rh8x2%40perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=I3Kem9n6zYjSNijnKOx%2FAOUAg65GN3xf8OD1qD4uo%2BayOFblFIgfn81uPWRTzhGg14lJdyhz3Yx%2BiCXuYCIdYnduqMZcIjtHE6WR%2BPo74ckemuxIKx3N24tlBJ6DgkfgqwmIkw%2F%2FKotm8Cz%2Fq%2FbIZm%2FvAOi2dpBHqrHiIFXYb8AVYnhP1osUhVvyzapgYJEBZJcHur7v6uqrSKwQ4DfeHHinbJpvkX3wjM6Nxabi3kVABdGcGqMoAPGCTZJMzNj8xddAXuECbptQprd9LlnQOuL4tuDfLMAOUXTHmJVhJEBrquxQi8iPRjnLOvnqF8s2We0SOxprqEuwbZyxSgH05Q%3D%3D'">
        <div style="float:left;margin:10px 15px 3px 3px;font-size:12px;line-height:10px;font-family:sans-serif">{{child[1]?.name}} {{child[1]?.familyName}}</div>
      </li>
    </ul>
    <div *ngIf="!editChildren" style="color:blue;cursor:pointer;margin:20px" (click)="editChildren=!editChildren">Edit children</div>
    <div *ngIf="editChildren">
      <input id="searchInput" style="border:none" maxlength="500" (keyup)="refreshSearchLists()" [(ngModel)]="searchFilter" placeholder="add a child">
      <ul class="listLight">
        <li *ngFor="let team of teams | async" >
          <div style="float:left;width:175px;padding:5px">
            <img [src]="team?.values?.imageUrlThumb" style="display: inline; float:left; margin: 0 5px 0 10px; opacity: 1; object-fit: cover; height:25px; width:25px"
            onerror="this.onerror=null;this.src='https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2F1585144867972Screen%20Shot%202018-03-16%20at%2015.05.10_180x180.png?GoogleAccessId=firebase-adminsdk-rh8x2%40perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=I3Kem9n6zYjSNijnKOx%2FAOUAg65GN3xf8OD1qD4uo%2BayOFblFIgfn81uPWRTzhGg14lJdyhz3Yx%2BiCXuYCIdYnduqMZcIjtHE6WR%2BPo74ckemuxIKx3N24tlBJ6DgkfgqwmIkw%2F%2FKotm8Cz%2Fq%2FbIZm%2FvAOi2dpBHqrHiIFXYb8AVYnhP1osUhVvyzapgYJEBZJcHur7v6uqrSKwQ4DfeHHinbJpvkX3wjM6Nxabi3kVABdGcGqMoAPGCTZJMzNj8xddAXuECbptQprd9LlnQOuL4tuDfLMAOUXTHmJVhJEBrquxQi8iPRjnLOvnqF8s2We0SOxprqEuwbZyxSgH05Q%3D%3D'">
            <span>{{team.values?.name}}</span>
            <span style="font-size:10px"> {{team.values?.familyName}}</span>
          </div>
          <div class="buttonDiv" style="float:left;width:50px;font-size:11px;background-color:#267cb5;color:white;border-style:none" (click)="addChild(team)">Add</div>
        </li>
      </ul>
    </div>
  <div class="seperator" style="width:100%;margin:0px"></div>
    <div *ngIf="UI.currentDomainObj?.isUser" style="color:blue;cursor:pointer;margin:20px" (click)="joinPERRINNGoogleGroup()">
      <span>Join PERRINN Google group</span>
      <span style="font-size:10px;margin-left:5px">(your PERRINN email must match your Google email)</span>
    </div>
    <div *ngIf="UI.currentDomainObj?.isUser" style="color:blue;cursor:pointer;margin:20px" (click)="joinPERRINNOnshapeTeam()">
      <span>Join PERRINN Onshape team</span>
      <span style="font-size:10px;margin-left:5px">(your PERRINN email must match your Onshape email)</span>
    </div>
  <div class="seperator" style="width:100%;margin:0px"></div>
  <div *ngIf="UI.currentDomainObj?.isUser" style="color:#555;margin:20px">Email notifications: {{(UI.currentDomainObj?.enableEmailNotifications)?'ON':'OFF'}}</div>
  <div *ngIf="UI.currentDomain==UI.currentUser" class="buttonDiv" style="color:red;margin-top:10px;margin-bottom:10px" (click)="this.logout();router.navigate(['login']);">logout</div>
  <div class="seperator" style="width:100%;margin-bottom:250px"></div>
  `,
})
export class TeamSettingsComponent {
  editName:boolean;
  editMembershipCost:boolean;
  editMembers:boolean;
  editChildren:boolean;
  currentName:string;
  currentFamilyName:string;
  membershipCost:string;
  searchFilter:string;
  teams:Observable<any[]>;

  constructor(
    public afAuth: AngularFireAuth,
    public afs: AngularFirestore,
    public router: Router,
    private storage: AngularFireStorage,
    public UI: UserInterfaceService,
    private route: ActivatedRoute
  ) {
    this.route.params.subscribe(params => {
      this.UI.switchDomain(params.id);
      this.editName=false;
      this.editMembershipCost=false;
      this.editMembers=false;
      this.editChildren=false;
      this.currentName=this.UI.currentDomainObj.name;
      this.membershipCost=this.UI.currentDomainObj.membershipCost||'';
      this.currentFamilyName=this.UI.currentUserObj.familyName;
    });
  }

  logout() {
    this.afAuth.auth.signOut();
    this.UI.currentUser = null;
  }

  applyNewName(){
    if(this.currentName==this.UI.currentDomainObj.name&&this.currentFamilyName==this.UI.currentUserObj.familyName||this.currentName==''){
      this.editName=false;
      return;
    }
    return this.afs.collection('IDs').add({
      user:this.UI.currentUser,
      serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(ref=>{
      this.UI.clearRecipient();
      this.UI.addRecipient(this.UI.currentUser).then(()=>{
        this.UI.addRecipient(this.UI.currentDomain).then(()=>{
          this.UI.createMessage({
            chain:ref.id,
            text:'Updating name to: '+this.currentName+' '+this.currentFamilyName,
            domain:this.UI.currentDomain,
            name:(this.UI.currentUser==this.UI.currentDomain)?this.currentName:null,
            familyName:(this.UI.currentUser==this.UI.currentDomain)?this.currentFamilyName:null,
            domainName:this.currentName,
            auto:true
          })
        });
      });
    });
  }

  addChild(team){
    return this.afs.collection('IDs').add({
      user:this.UI.currentUser,
      serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(ref=>{
      this.UI.clearRecipient();
      this.UI.addRecipient(this.UI.currentUser).then(()=>{
        this.UI.addRecipient(this.UI.currentDomain).then(()=>{
          this.UI.addRecipient(team.key).then(()=>{
            this.UI.chatSubject='New child';
            this.UI.chain=ref.id;
            this.UI.showChatDetails=false;
            this.UI.process={
              inputs:{
                target:this.UI.currentDomain,
                child:team.key,
                childObj:{
                  name:team.values.name,
                  familyName:team.values.familyName,
                  imageUrlThumb:team.values.imageUrlThumb,
                  timestamp:firebase.firestore.FieldValue.serverTimestamp()
                },
                parentObj:{
                  name:this.UI.currentDomainObj.name,
                  familyName:this.UI.currentDomainObj.familyName,
                  imageUrlThumb:this.UI.currentDomainObj.imageUrlThumb,
                  timestamp:firebase.firestore.FieldValue.serverTimestamp()
                }
              },
              function:{
                name:'addChild'
              },
              inputsComplete:true
            };
            this.UI.createMessageAFS('Adding child: '+team.values.name+' '+team.values.familyName,'','',true,false);
          });
        });
      });
    });
  }

  applyNewMembershipCost(){
    if(this.membershipCost==this.UI.currentDomainObj.membershipCost||this.membershipCost==''){
      this.editMembershipCost=false;
      return;
    }
    return this.afs.collection('IDs').add({
      user:this.UI.currentUser,
      serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(ref=>{
      this.UI.clearRecipient();
      this.UI.addRecipient(this.UI.currentUser).then(()=>{
        this.UI.addRecipient(this.UI.currentDomain).then(()=>{
          this.UI.createMessage({
            chain:ref.id,
            text:'Updating membership cost to: '+this.membershipCost,
            domainMembershipCost:this.membershipCost,
            auto:true
          })
        });
      });
    });
  }

  joinPERRINNOnshapeTeam() {
    return this.afs.collection('IDs').add({
      user:this.UI.currentUser,
      serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(ref=>{
      this.UI.clearRecipient();
      this.UI.addRecipient(this.UI.currentUser).then(()=>{
        this.UI.createMessage({
          chain:ref.id,
          text:'joining PERRINN Onshape team',
          "apps.Onshape.enabled":true,
          auto:true
        })
      });
    });
  }

  joinPERRINNGoogleGroup() {
    return this.afs.collection('IDs').add({
      user:this.UI.currentUser,
      serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(ref=>{
      this.UI.clearRecipient();
      this.UI.addRecipient(this.UI.currentUser).then(()=>{
        this.UI.createMessage({
          chain:ref.id,
          text:'joining PERRINN Google group',
          "apps.Google.enabled":true,
          auto:true
        })
      });
    });
  }

  showFullScreenImage(src) {
    const fullScreenImage = document.getElementById('fullScreenImage') as HTMLImageElement;
    fullScreenImage.src = src;
    fullScreenImage.style.visibility = 'visible';
  }

  onImageChange(event:any) {
    const image = event.target.files[0];
    const uploader = document.getElementById('uploader') as HTMLInputElement;
    const storageRef = this.storage.ref('images/'+Date.now()+image.name);
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
      let draftMessage = task.task.snapshot.ref.name.substring(0, 13);
      let draftImage = task.task.snapshot.ref.name.substring(0, 13);
      storageRef.getDownloadURL().subscribe(url => {
        return this.afs.collection('IDs').add({
          user:this.UI.currentUser,
          serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(ref=>{
          this.UI.clearRecipient();
          this.UI.addRecipient(this.UI.currentUser).then(()=>{
            this.UI.addRecipient(this.UI.currentDomain).then(()=>{
              this.UI.createMessage({
                chain:ref.id,
                text:'updating profile picture',
                image:draftImage,
                imageDownloadURL:url,
                domain:this.UI.currentDomain,
                userImageTimestamp:(this.UI.currentUser==this.UI.currentDomain)?draftImage:null,
                imageUrlOriginal:(this.UI.currentUser==this.UI.currentDomain)?url:null,
                domainImageTimestamp:draftImage,
                domainImageUrlOriginal:url,
                auto:true
              })
            });
          });
        });
      });
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

  objectToArray(obj) {
    if (obj == null) { return []; }
    return Object.keys(obj).map(function(key) {
      return [key, obj[key]];
    });
  }

}
