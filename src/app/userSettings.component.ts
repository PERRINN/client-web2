import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { userInterfaceService } from './userInterface.service';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

@Component({
  selector: 'userSettings',
  template: `
  <div id='main_container'>
  <div class="sheet" style="background-color:#f5f5f5">
  <img class="imageWithZoom" [src]="UI.focusUserObj?.imageUrlMedium?UI.focusUserObj?.imageUrlMedium:UI.focusUserObj?.imageUrlThumb" style="object-fit:cover;margin:10px;border-radius:5px;max-height:150px;width:50%" (click)="showFullScreenImage(UI.focusUserObj?.imageUrlOriginal)">
  <br/>
  <span style="font-size:18px;line-height:30px;margin:15px;font-family:sans-serif;">{{UI.focusUserObj?.name}} {{UI.focusUserObj?.familyName}}</span>
  <span *ngIf='UI.focusUserObj?.member' style="color:white;background-color:green;padding:2px 4px 2px 4px;border-radius:3px;font-size:10px;margin:10px">Member</span>
  <span *ngIf='UI.focusUserObj?.isDomain' style="color:white;background-color:#e6b927;padding:2px 4px 2px 4px;border-radius:3px;font-size:10px;margin:5px">Domain</span>
  <div class='sheet' style="margin-top:5px">
  <div style="color:blue;;cursor:pointer;margin:20px">
    <input type="file" name="chatImage" id="chatImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
    <label class="buttonUploadImage" for="chatImage" id="buttonFile">
    <div>Upload new profile picture</div>
    </label>
  </div>
  <div *ngIf="!editName" style="color:blue;cursor:pointer;margin:20px" (click)="editName=!editName">Edit name</div>
  <input *ngIf="editName" [(ngModel)]="name" placeholder="First name">
  <input *ngIf="editName&&UI.focusUserObj?.isUser" [(ngModel)]="familyName" placeholder="Family name">
  <div *ngIf="editName" (click)="applyNewName()" style="font-size:12px;text-align:center;line-height:20px;width:150px;padding:2px;margin:10px;color:#4287f5;border-style:solid;border-width:1px;border-radius:3px;cursor:pointer">Apply update</div>
  <div *ngIf="UI.focusUserObj?.isUser" style="color:blue;cursor:pointer;margin:20px" (click)="joinPERRINNGoogleGroup()">
    <span>Join PERRINN Google group</span>
    <span style="font-size:10px;margin-left:5px">(your PERRINN email must match your Google email)</span>
  </div>
  <div *ngIf="UI.focusUserObj?.isUser" style="color:blue;cursor:pointer;margin:20px" (click)="joinPERRINNOnshapeTeam()">
    <span>Join PERRINN Onshape team</span>
    <span style="font-size:10px;margin-left:5px">(your PERRINN email must match your Onshape email)</span>
  </div>
  </div>
  <div *ngIf="UI.focusUser==UI.currentUser" class="buttonDiv" style="color:red;margin-top:10px;margin-bottom:10px" (click)="this.logout();router.navigate(['login']);">logout</div>
  <div style="font-size:8px;margin:5px">version 0.0.11</div>
  </div>
  `,
})
export class UserSettingsComponent {
  editName: boolean;
  name:string;
  familyName:string;

  constructor(
    public afAuth: AngularFireAuth,
    public afs: AngularFirestore,
    public router: Router,
    private storage: AngularFireStorage,
    public UI: userInterfaceService
  ) {
    this.editName=false;
    this.name=this.UI.focusUserObj.name;
    if(this.UI.focusUserObj.familyName==undefined) this.familyName='';
    else this.familyName=this.UI.focusUserObj.familyName;
  }

  logout() {
    this.afAuth.auth.signOut();
    this.UI.currentUser = null;
  }

  applyNewName(){
    if(this.name==this.UI.focusUserObj.name&&this.familyName==this.UI.focusUserObj.familyName||this.name==''){
      this.editName=false;
      return;
    }
    return this.afs.collection('IDs').add({
      user:this.UI.currentUser,
      serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(ref=>{
      this.UI.clearRecipient();
      this.UI.addRecipient(this.UI.currentUser).then(()=>{
        this.UI.addRecipient(this.UI.focusUser).then(()=>{
          this.UI.chatSubject='';
          this.UI.chain=ref.id;
          this.UI.showChatDetails=false;
          this.UI.process={
            inputs:{
              target:this.UI.focusUser,
              name:this.name,
              familyName:this.familyName
            },
            function:{
              name:'updateTeamName'
            },
            inputsComplete:true
          };
          this.UI.createMessageAFS('Updating name to: '+this.name+' '+this.familyName,'','',true);
          this.router.navigate(['chat','']);
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
        this.UI.chatSubject='';
        this.UI.chain=ref.id;
        this.UI.showChatDetails=false;
        this.UI.process={
          function:{
            name:'joinPERRINNOnshapeTeam'
          },
          inputsComplete:true
        };
        this.UI.createMessageAFS('joining PERRINN Onshape team','','',true);
        this.router.navigate(['chat','']);
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
        this.UI.chatSubject='';
        this.UI.chain=ref.id;
        this.UI.showChatDetails=false;
        this.UI.process={
          function:{
            name:'joinPERRINNGoogleGroup'
          },
          inputsComplete:true
        };
        this.UI.createMessageAFS('joining PERRINN Google group','','',true);
        this.router.navigate(['chat','']);
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
            this.UI.addRecipient(this.UI.focusUser).then(()=>{
              this.UI.chatSubject='';
              this.UI.chain=ref.id;
              this.UI.showChatDetails=false;
              this.UI.process={
                inputs:{
                  target:this.UI.focusUser,
                  imageTimestamp:draftImage,
                  imageUrlOriginal:url
                },
                function:{
                  name:'updateTeamImage'
                },
                inputsComplete:true
              };
              this.UI.createMessageAFS('updating profile picture',draftImage,url,true);
              this.router.navigate(['chat','']);
            });
          });
        });
      });
    });
  }

}
