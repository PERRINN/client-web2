import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Router } from '@angular/router';
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'app-root',
  template: `
    <img class="fullScreenImage" id="fullScreenImage" (click)="hideFullScreenImage()">
    <progress value='0' max='100' id='uploader'>0%</progress>
    <div class='menu'>
    <div style="width:320px;display:block;margin: 0 auto">
      <img src="./../assets/App icons/Perrinn_02.png" style="cursor:pointer;float:left;width:30px;margin:5px 45px 5px 5px;border-radius:3px;" (click)="clickUserIcon()">
      <img src="./../assets/App icons/search.png" style="cursor:pointer;float:left;width:30px;margin:5px 45px 5px 45px;border-radius:3px;-webkit-filter:brightness(100);filter:brightness(100);" (click)="router.navigate(['search'])">
      <img src="./../assets/App icons/website.png" style="padding:2px;cursor:pointer;float:left;width:30px;margin:5px 5px 5px 45px;border-radius:3px;filter: brightness(0) invert(1)" onclick="window.open('https://sites.google.com/view/perrinn/home','_blank')">
    </div>
    </div>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {

  constructor(public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService) {
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

  clickUserIcon() {
    if (this.UI.currentUser) {
      this.router.navigate(['user', this.UI.currentUser]);
    } else {
      this.router.navigate(['login']);
    }
  }

}
