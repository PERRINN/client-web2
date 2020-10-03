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
  selector: 'settings',
  template: `
  <div class="sheet" style="background-color:#f5f5f5">
  <img class="imageWithZoom" [src]="UI.currentUserLastMessageObj?.imageUrlMedium||UI.currentUserLastMessageObj?.imageUrlThumbUser" style="object-fit:cover;margin:10px;border-radius:5px;max-height:150px;width:50%" (click)="showFullScreenImage(UI.currentUserLastMessageObj?.imageUrlOriginal)"
  onerror="this.onerror=null;this.src='https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2F1585144867972Screen%20Shot%202018-03-16%20at%2015.05.10_180x180.png?GoogleAccessId=firebase-adminsdk-rh8x2%40perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=I3Kem9n6zYjSNijnKOx%2FAOUAg65GN3xf8OD1qD4uo%2BayOFblFIgfn81uPWRTzhGg14lJdyhz3Yx%2BiCXuYCIdYnduqMZcIjtHE6WR%2BPo74ckemuxIKx3N24tlBJ6DgkfgqwmIkw%2F%2FKotm8Cz%2Fq%2FbIZm%2FvAOi2dpBHqrHiIFXYb8AVYnhP1osUhVvyzapgYJEBZJcHur7v6uqrSKwQ4DfeHHinbJpvkX3wjM6Nxabi3kVABdGcGqMoAPGCTZJMzNj8xddAXuECbptQprd9LlnQOuL4tuDfLMAOUXTHmJVhJEBrquxQi8iPRjnLOvnqF8s2We0SOxprqEuwbZyxSgH05Q%3D%3D'">
  <br/>
  <span style="font-size:18px;line-height:30px;margin:15px;font-family:sans-serif;">{{UI.currentUserLastMessageObj?.name}} {{UI.currentUserLastMessageObj?.familyName}}</span>
  <span *ngIf='UI.currentUserIsMember' style="color:white;background-color:green;padding:2px 4px 2px 4px;border-radius:3px;font-size:10px;margin:10px">Member</span>
  <br/>
  <span style="font-size:16px;line-height:30px;margin:15px;font-family:sans-serif">Balance: C{{(UI.currentUserLastMessageObj?.PERRINN?.wallet?.balance||0)|number:'1.2-2'}}</span>
  <span style="font-size:10px;color:green;padding:2px;text-align:center;border-radius:3px;border-style:solid;border-width:1px;cursor:pointer" (click)="router.navigate(['buyCoins'])">Buy new COINS</span>
  <br/>
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
    <input *ngIf="editName" [(ngModel)]="currentFamilyName" placeholder="Family name">
    <div *ngIf="editName" (click)="updateName()" style="font-size:12px;text-align:center;line-height:20px;width:150px;padding:2px;margin:10px;color:#4287f5;border-style:solid;border-width:1px;border-radius:3px;cursor:pointer">Update name</div>
    <div class="seperator" style="width:100%;margin:0px"></div>
    <div style="font-size:14px;margin:20px;color:#444">Your PERRINN email</div>
    <div style="font-size:10px;margin:20px;color:#777">Use this email to receive notifications, connect to other PERRINN apps like Onshape, Google Drive and Google Meet (calendar events and meetings). This email can be the one you use to log into PERRINN.com or any other email. This email is visible by other PERRINN members.</div>
    <input [(ngModel)]="currentEmail" placeholder="Enter your PERRINN email">
    <div (click)="updateEmail()" style="font-size:12px;text-align:center;line-height:20px;width:150px;padding:2px;margin:10px;color:#4287f5;border-style:solid;border-width:1px;border-radius:3px;cursor:pointer">Update email</div>
    <div class="seperator" style="width:100%;margin:0px"></div>
  <div class="buttonDiv" style="color:red;margin-top:10px;margin-bottom:10px" (click)="this.logout();router.navigate(['login']);">logout</div>
  <div class="seperator" style="width:100%;margin-bottom:250px"></div>
  `,
})
export class SettingsComponent {
  editName:boolean;
  editMembers:boolean;
  currentName:string;
  currentFamilyName:string;
  currentEmail:string;
  searchFilter:string;
  teams:Observable<any[]>;

  constructor(
    public afAuth: AngularFireAuth,
    public afs: AngularFirestore,
    public router: Router,
    private storage: AngularFireStorage,
    public UI: UserInterfaceService
  ) {
    this.editName=false;
    this.editMembers=false;
    this.currentName=this.UI.currentUserLastMessageObj.name;
    this.currentFamilyName=this.UI.currentUserLastMessageObj.familyName;
    this.currentEmail=this.UI.currentUserLastMessageObj.userEmail||null;
  }

  logout() {
    this.afAuth.auth.signOut();
    this.UI.currentUser = null;
  }

  updateName(){
    if(this.currentName==this.UI.currentUserLastMessageObj.name&&this.currentFamilyName==this.UI.currentUserLastMessageObj.familyName||this.currentName==''){
      this.editName=false;
      return;
    }
    this.UI.createMessage({
      chain:this.UI.currentUser,
      text:'Updating my name to: '+this.currentName+' '+this.currentFamilyName,
      name:this.currentName,
      familyName:this.currentFamilyName
    })
    this.router.navigate(['chat',this.UI.currentUser])
  }

  updateEmail(){
    if(this.currentEmail=='')return
    this.UI.createMessage({
      chain:this.UI.currentUser,
      text:'Updating my email to: '+this.currentEmail,
      userEmail:this.currentEmail
    })
    this.router.navigate(['chat',this.UI.currentUser])
  }

  addChild(team){
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
      let imageTimestamp = task.task.snapshot.ref.name.substring(0, 13);
      storageRef.getDownloadURL().subscribe(url => {
        this.UI.createMessage({
          chain:this.UI.currentUser,
          text:'updating my profile picture',
          userImageTimestamp:imageTimestamp,
          chatImageTimestamp:imageTimestamp,
          chatImageUrlThumb:url,
          chatImageUrlMedium:url,
          chatImageUrlOriginal:url,
          imageUrlOriginal:url
        })
        this.router.navigate(['chat',this.UI.currentUser])
      });
    });
  }

  refreshSearchLists() {
    if (this.searchFilter) {
      if (this.searchFilter.length > 1) {
        this.teams = this.afs.collection('PERRINNMessages', ref => ref
        .where('userChain.nextMessage','==','none')
        .where('verified','==',true)
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
