import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { UserInterfaceService } from './userInterface.service';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';

@Component({
  selector: 'login',
  template: `
  <div id="login">
    <div class="module form-module">
      <div class="form">
        <form>
          <img src="./../assets/App icons/teamExperience.jpg" style="width:95%;margin:10px 0 10px 0">
          <img src="./../assets/App icons/PERRINN logo.png" style="width:95%;margin:10px 0 10px 0">
          <div [hidden]="UI.currentUser!=null">
          <div style="text-align:right; font-size:10px; cursor:pointer; color:blue; padding:10px;" (click)="newUser=!newUser;messageUser=''">{{newUser?"Already have an account?":"Need a new account?"}}</div>
          <input maxlength="500" [(ngModel)]="email" name="email" type="text" placeholder="Email *" (keyup)="messageUser=''" required/>
          <input maxlength="500" [(ngModel)]="password" name="password" type="password" placeholder="Password *" (keyup)="messageUser=''" required/>
          <button *ngIf="!newUser" type="button" (click)="login(email,password)">Login</button>
          <div *ngIf="!newUser" style="text-align:center; font-size:10px; cursor:pointer; color:blue; padding:10px;" (click)="resetPassword(email)">Forgot password?</div>
          <div *ngIf="newUser">
          <input maxlength="500" [(ngModel)]="passwordConfirm" name="passwordConfirm" type="password" placeholder="Confirm password *" (keyup)="messageUser=''"/>
          <input maxlength="500" [(ngModel)]="name" name="name" type="text" placeholder="First name *" (keyup)="messageUser=''"/>
          <input maxlength="500" [(ngModel)]="familyName" name="familyName" type="text" placeholder="Last name *" (keyup)="messageUser=''"/>
          <button type="button" (click)="register(email,password,passwordConfirm,name,familyName)">Register</button>
          </div>
          </div>
          <div [hidden]="UI.currentUser==null">
          <button type="button" (click)="logout()">Logout</button>
          </div>
          <div *ngIf="messageUser" style="text-align:center;padding:10px;color:red">{{messageUser}}</div>
        </form>
      </div>
      <div class="cta"><a href='mailto:perrinnlimited@gmail.com'>Contact PERRINN</a></div>
    </div>
  </div>
  `,
})

export class LoginComponent  {

  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  familyName: string;
  message: string;
  messageUser: string;
  newUser: boolean;

  constructor(
    public afAuth:AngularFireAuth,
    public afs:AngularFirestore,
    public router:Router,
    public UI:UserInterfaceService
  ) {
    this.newUser = false;
    this.UI.currentTeam = '';
    this.afAuth.user.subscribe((auth) => {
      if (auth != null) {
        this.router.navigate(['team','inbox']);
      }
    });
  }

  login(email: string, password: string) {
    this.afAuth.auth.signInWithEmailAndPassword(email, password).catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      if (errorCode === 'auth/wrong-password') {
        this.messageUser = 'Wrong password.';
      } else {
        this.messageUser = errorMessage;
      }
    });
  }

  resetPassword(email: string) {
    this.afAuth.auth.sendPasswordResetEmail(email)
    .then(_ => this.messageUser = 'An email has been sent to you')
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      this.messageUser = errorMessage;
    });
  }

  logout() {
    this.afAuth.auth.signOut()
    .then(_ => this.messageUser = 'Successfully logged out')
    .catch(err => this.messageUser = 'You were not logged in');
  }

  register(email:string,password: string,passwordConfirm:string,name:string,familyName:string) {
    if (email==null||password==null||passwordConfirm==null||name==null||familyName==null){
        this.messageUser = 'You need to fill all the fields';
    } else {
      if (password != passwordConfirm) {
        this.messageUser = 'Verification password doesn\'t match';
      } else {
        this.afAuth.auth.createUserWithEmailAndPassword(email, password).catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          if (errorCode == 'auth/weak-password') {
            this.messageUser = 'The password is too weak.';
          } else {
            this.messageUser = errorMessage;
          }
        }).then(_ => {
          this.afAuth.user.subscribe((auth) => {
            return this.afs.collection('IDs').add({
              user:this.UI.currentUser,
              serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(ref=>{
              const imageUrlThumb="https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2Fthumb_1523055261437Screen%20Shot%202018-04-06%20at%2022.36.21.png?GoogleAccessId=firebase-adminsdk-rh8x2@perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=SGP4NyP%2F6GgfWJNbhdi4wfFgHG3F0ZdkD371QQaDohxo3HNKvvIasuVe3N1y77%2FzMM2lVcmTnzOD7dghStRSOolCTzJ%2BXOF7HRXunOJbQyjNDbZh2c8j6Ng0CDQweO8TAKfxeSpAfxDe96zYt4lLAlXwCoGZzFP%2FhdglsjflD8i%2FIsium%2Big45lFs5hCsLlEL9WCPNPMGgFFwIxWJnpGQ7OfzoOKrVeyKT7mtn1UsQ2nf1LmnlEYIfs4CzI3%2FFBm9NvvSxlfykKichh9FxG8NaMHcuRd4XvZlh0g4sZdAmwkoHDBTFPhc%2Br3vMgSb1XO%2FFOZAjaRY8v4rUaXiJEbCQ%3D%3D";
              const imageUrlMedium="https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2Fmedium_1523055261437Screen%20Shot%202018-04-06%20at%2022.36.21.png?GoogleAccessId=firebase-adminsdk-rh8x2@perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=WBDL52YygQ1yrfHTmygdhqldkZnJYJ6DiyAVV8up%2BKEeYJgRMVfPKtQNvtXurJt5uE0CTIRzGgbKBFW%2FaPjYx10JmIYLEM5NHRaZjI9czIXSnlzKzM4aJfXljHfwgMuk3c1St%2BmGnQMeAwyD9dZpqsppTHDYUEuYyw%2BbcaWG7fpRzSleXde1QZ8N1%2Bqa0DjuemU81bTJoG5vOAXa8qHuigTaOJlHP%2Fw9WN3pxiA6Q5tea9kfBEXwOJ2Pm5wL6hAoexAwATDMsQI2T2LEbLizJY2e8VoKTqK3u3TdAnoD38CQUrCDI61w3vTlW%2BxKeFB3huZjtH3V7MPJ%2FTgpOknE3g%3D%3D";
              const imageUrlOriginal="https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2Foriginal_1523055261437Screen%20Shot%202018-04-06%20at%2022.36.21.png?GoogleAccessId=firebase-adminsdk-rh8x2@perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=c8sqTFAMkJMDEr0CZdFAMD0I9gsBWMqqy21O2wmkAKRt3H%2B9Z2DZNnZgzdFPPOgYTSojdOyuhzy8X%2FyET97nUi3fnwQfy1eQrCu%2F5iI4GbCEaZqsosbMz5MiLOsVoLGOlLpjFekVOQTIuniZfTRuPfEL6zNzyyyQasAHfZOqz76E1FkQBg3sYWiabS4sfcirSP%2BhIQT4k6Px02B%2BARos4%2F%2FnivTla9KX8OPYH7tmUj%2Fsc%2F1sPiQaqIrWXpC5HX4TLZ9w%2Bdl83HSCSBYmkwUAOtrtJ1uncwwhia4pzmniLvfXj1%2BikJA6HXcon44Ymv8jDpHh4AqbBVqAXTWyIzKzaQ%3D%3D";
              this.UI.clearRecipient();
              this.UI.recipientList=[auth.uid];
              this.UI.process={
                inputs:{
                  target:auth.uid,
                  name:name,
                  familyName:familyName,
                  imageUrlThumb:imageUrlThumb,
                  imageUrlMedium:imageUrlMedium,
                  imageUrlOriginal:imageUrlOriginal
                },
                function:{
                  name:'createUser'
                },
                inputsComplete:true
              };
              const now = Date.now();
              this.afs.collection('PERRINNMessages').add({
                timestamp: now,
                serverTimestamp:firebase.firestore.FieldValue.serverTimestamp(),
                chain:ref.id,
                recipientList:this.UI.recipientList,
                domain:auth.uid,
                user:auth.uid,
                text:'Creating user: '+name+' '+familyName,
                process:this.UI.process,
                auto:true
              }).then(()=>{
                this.UI.process={};
                return null;
              });
            });
          });
        });
      }
    }
  }

}
