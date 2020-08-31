import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserInterfaceService } from './userInterface.service';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  template: `
    <img class="fullScreenImage" id="fullScreenImage" (click)="hideFullScreenImage()">
    <progress value='0' max='100' id='uploader'>0%</progress>
    <div class='menu'>
      <div style="width:320px;display:block;margin: 0 auto">
        <img src="./../assets/App icons/Perrinn_02.png" style="cursor:pointer;float:left;width:30px;margin:5px 45px 5px 5px;border-radius:3px;" (click)="router.navigate(['profile','all'])">
        <img src="./../assets/App icons/search.png" style="cursor:pointer;float:left;width:30px;margin:5px 45px 5px 45px;border-radius:3px;-webkit-filter:brightness(100);filter:brightness(100);" (click)="router.navigate(['search'])">
        <img src="./../assets/App icons/website.png" style="padding:2px;cursor:pointer;float:left;width:30px;margin:5px 5px 5px 45px;border-radius:3px;filter: brightness(0) invert(1)" onclick="window.open('https://sites.google.com/view/perrinn/home','_blank')">
      </div>
    </div>
    <div style='padding-top:40px'>
      <div *ngIf="UI.currentUser" style="max-width:800px;margin:0 auto">
        <div style="float:left;width:150px;height:33px;cursor:pointer;border-style:solid;border-width:0 1px 0 0;border-color:#ddd" (click)="router.navigate(['profile',UI.currentUser])">
          <img *ngIf="UI.currentUserLastMessageObj?.imageUrlThumbUser" [src]="UI.currentUserLastMessageObj.imageUrlThumbUser" style="display:inline;float:left;margin:4px;border-radius:50%;object-fit:cover;width:25px;height:25px">
          <div *ngIf="UI.currentUserLastMessageObj?.PERRINN?.wallet?.balance" style="float:left;margin:5px;font-size:10px">C{{UI.currentUserLastMessageObj.PERRINN.wallet.balance|number:'1.2-2'}}</div>
        </div>
        <div style="float:left;width:150px;text-align:center;height:33px;cursor:pointer;line-height:31px;font-size:12px;color:#267cb5;border-style:solid;border-width:0 1px 0 0;border-color:#ddd" (click)="newMessage()">New message</div>
        <img class='editButton' style="float:right;width:20px" (click)="router.navigate(['settings'])" src="./../assets/App icons/settings.png">
      </div>
      <div class="seperator" style="width:100%;margin:0px"></div>
    </div>
    <div id='main_container'>
      <chatModal *ngIf="UI.currentUser"></chatModal>
      <router-outlet></router-outlet>
    </div>
  `,
})
export class AppComponent {

  constructor(
    public router:Router,
    public afs:AngularFirestore,
    public UI:UserInterfaceService
  ) {
    localStorage.clear();
  }

  ngOnInit() {
    document.getElementById('uploader').style.visibility = 'hidden';
    document.getElementById('fullScreenImage').style.visibility = 'hidden';
  }

  hideFullScreenImage() {
    const fullScreenImage = document.getElementById('fullScreenImage') as HTMLImageElement;
    fullScreenImage.style.visibility = 'hidden';
    fullScreenImage.src = '';
  }

  newMessage() {
    return this.afs.collection('IDs').add({
      user:this.UI.currentUser
    }).then(ref=>{
      this.router.navigate(['chat',ref.id])
    });
  }

}
