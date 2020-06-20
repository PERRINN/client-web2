import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserInterfaceService } from './userInterface.service';

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
    <div style='padding-top:40px'>
      <div style="float:right;cursor:pointer" (click)="router.navigate(['team',UI.currentUser])">
      <div style="float:right;margin:5px;font-size:10px">C{{(UI.currentUserObj?.lastMessageBalance?UI.currentUserObj?.lastMessageBalance:0)|number:'1.2-2'}}</div>
        <img [src]="UI.currentUserObj?.imageUrlThumb" style="display:inline;float:right;margin:4px;border-radius:50%;object-fit:cover;width:25px;height:25px">
      </div>
      <div class="seperator" style="width:100%;margin:0px"></div>
    </div>
    <div id='main_container'>
      <chatModal></chatModal>
      <router-outlet></router-outlet>
    </div>
  `,
})
export class AppComponent {

  constructor(
    public router:Router,
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

  clickUserIcon() {
    if (this.UI.currentUser) {
      this.router.navigate(['team','inbox']);
    } else {
      this.router.navigate(['login']);
    }
  }

}
