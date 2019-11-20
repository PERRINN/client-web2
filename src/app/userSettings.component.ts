import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { userInterfaceService } from './userInterface.service';
import { AngularFireStorage } from '@angular/fire/storage';

@Component({
  selector: 'userSettings',
  template: `
  <div id='main_container'>
  <div class="sheet" style="background-color:#f5f5f5">
  <img class="imageWithZoom" [src]="UI.currentUserObj?.imageUrlMedium?UI.currentUserObj?.imageUrlMedium:UI.currentUserObj?.imageUrlThumb" style="object-fit:cover;margin:10px;border-radius:5px;max-height:150px;width:50%" (click)="showFullScreenImage(UI.currentUserObj?.imageUrlOriginal)">
  <div style="font-size:18px;line-height:30px;margin:10px;font-family:sans-serif;">{{UI.currentUserObj?.name}} {{UI.currentUserObj?.familyName}}</div>
  <div class='sheet' style="margin-top:5px">
  <div style="color:blue;;cursor:pointer;margin:20px">
    <input type="file" name="chatImage" id="chatImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
    <label class="buttonUploadImage" for="chatImage" id="buttonFile">
    <div>Upload new profile image</div>
    </label>
  </div>
  <div style="color:blue;cursor:pointer;margin:20px">Edit name</div>
  <div style="color:blue;cursor:pointer;margin:20px" (click)="joinPERRINNOnshapeTeam();router.navigate(['chat',this.UI.currentTeam])">Join PERRINN Onshape team</div>
  <div style="color:blue;cursor:pointer;margin:20px" (click)="joinPERRINNGoogleGroup();router.navigate(['chat',this.UI.currentTeam])">Join PERRINN Google group</div>
  </div>
  <div class="buttonDiv" style="color:red;margin-top:10px;margin-bottom:10px" (click)="this.logout();router.navigate(['login']);">logout</div>
  </div>
  `,
})
export class UserSettingsComponent {

  constructor(public afAuth: AngularFireAuth,
    public router: Router,
    private storage: AngularFireStorage,
    public UI: userInterfaceService
  ) {
  }

  logout() {
    this.afAuth.auth.signOut();
    this.UI.currentUser = null;
  }

  joinPERRINNOnshapeTeam() {
    this.UI.process[this.UI.currentTeam]={
      user:this.UI.currentUser,
      function:{
        name:'joinPERRINNOnshapeTeam'
      },
      inputsComplete:true
    };
    this.UI.createMessage('joining PERRINN Onshape team','','',{},{});
  }

  joinPERRINNGoogleGroup() {
    this.UI.process[this.UI.currentTeam]={
      user:this.UI.currentUser,
      function:{
        name:'joinPERRINNGoogleGroup'
      },
      inputsComplete:true
    };
    this.UI.createMessage('joining PERRINN Google group','','',{},{});
  }

  showFullScreenImage(src) {
    const fullScreenImage = document.getElementById('fullScreenImage') as HTMLImageElement;
    fullScreenImage.src = src;
    fullScreenImage.style.visibility = 'visible';
  }


    onImageChange(event:any) {
      const image = event.target.files[0];
      const uploader = document.getElementById('uploader') as HTMLInputElement;
      const storageRef = this.storage.ref('images/' + Date.now() + image.name);
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
          this.UI.createMessage(draftMessage,draftImage,url,'','');
          event.target.value = '';
          this.router.navigate(['chat',this.UI.currentTeam]);
        });
      });
    }


}
