import { Component, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { userInterfaceService } from './userInterface.service';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

@Component({
  selector: 'buyCoins',
  template: `
  <div id='main_container'>
  <div style="width:300px;color:white;background-color:green;border-radius:5px;margin:10px auto;padding:10px;text-align:center">
    <span style="font-size:12px">Buy</span>
    <br/>
    <span style="font-size:18px">{{amountCOINSPurchased}}</span>
    <span style="font-size:14px"> COINS</span>
  </div>
  <div style="margin:10px auto;font-size:10px;color:#999;line-height:14px;width:50px;text-align:center;border-radius:3px;border-style:solid;border-width:1px;cursor:pointer" onclick="window.open('https://sites.google.com/view/perrinn/perrinn-com/coin-credit','_blank')">Info</div>
  <div [hidden]='!selectingCurrency'>
    <div class="sheet">
      <div class="title">Select your currency</div>
      <ul class="listLight">
        <li *ngFor="let currency of objectToArray(currencyList)"
          [class.selected]="currency[0] === currentCurrencyID"
          (click)="currentCurrencyID = currency[0];refreshAmountCharge()"
          style="padding:15px">
          <div style="width:250px;height:20px;float:left;font-size:15px">{{currency[1].designation}}</div>
          <div style="height:20px;float:left">1 COIN costs {{1/currency[1].toCOIN|number:'1.2-2'}} {{currency[1].code}}</div>
        </li>
      </ul>
      <div class="content" style="text-align:center; padding-top:20px">{{amountCharge/100 | number:'1.2-2'}} {{currentCurrencyID | uppercase}} to be paid.</div>
      <div style="text-align:center">
        <button type="button" (click)="selectingCurrency=false;enteringCardDetails=true">Proceed to payment</button>
      </div>
    </div>
  </div>
  <div [hidden]='!enteringCardDetails'>
  <div class="module form-module">
  <div class="top">
    <div style="text-align:left; font-size:10px; cursor:pointer; color:blue; padding:10px;" (click)="selectingCurrency=true;enteringCardDetails=false">back</div>
  </div>
  <div class="form">
  <form>
  <div style="margin:10px">
    <img src="./../assets/App icons/Payment Method Icons/Light Color/22.png" style="width:40px">
    <img src="./../assets/App icons/Payment Method Icons/Light Color/2.png" style="width:40px">
    <img src="./../assets/App icons/Payment Method Icons/Light Color/1.png" style="width:40px">
  </div>
  <input [(ngModel)]="cardNumber" name="card-number" type="text" placeholder="Card number *" (keyup)='messagePayment=""'>
  <div>
  <input [(ngModel)]="expiryMonth" style="width:30%;float:left" name="expiry-month" type="text" placeholder="MM *" (keyup)='messagePayment=""'>
  <div style="font-size:30px;float:left">/</div>
  <input [(ngModel)]="expiryYear" style="width:30%;float:left" name="expiry-year" type="text" placeholder="YY *" (keyup)='messagePayment=""'>
  </div>
  <input [(ngModel)]="cvc" name="cvc" type="text"  placeholder="CVC *" (keyup)='messagePayment=""'>
  <button type="button" (click)="processPayment()">Pay {{amountCharge/100 | number:'1.2-2'}} {{currentCurrencyID | uppercase}}</button>
  <div>{{messagePayment}}</div>
  </form>
  </div>
  </div>
  </div>
  <div [hidden]='!processingPayment'>
    <div class='sheet'>
      <div class='content' style="text-align:center">{{messagePayment}}</div>
      <div class='content' style="padding-top:30px; text-align:center">{{messagePERRINNTransaction}}</div>
    </div>
  </div>
  </div>
  `,
})
export class BuyCoinsComponent {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  amountCOINSPurchased: number;
  amountCharge: number;
  currentCurrencyID: string;
  messagePayment: string;
  messagePERRINNTransaction: string;
  currencyList: any;
  selectingCurrency: boolean;
  enteringCardDetails: boolean;
  processingPayment: boolean;

  constructor(
    public afs: AngularFirestore,
    public router: Router,
    private _zone: NgZone,
    public UI: userInterfaceService
  ) {
    this.selectingCurrency = true;
    this.enteringCardDetails = false;
    this.processingPayment = false;
    this.messagePayment = '';
    this.messagePERRINNTransaction = '';
    this.amountCOINSPurchased = 50;
    this.currentCurrencyID = 'gbp';
    afs.doc<any>('appSettings/payment').valueChanges().subscribe(snapshot=>{
      this.currencyList=snapshot.currencyList;
      this.refreshAmountCharge();
    });
  }

  processPayment() {
    (window as any).Stripe.card.createToken({
      number: this.cardNumber,
      exp_month: this.expiryMonth,
      exp_year: this.expiryYear,
      cvc: this.cvc
    }, (status: number, response: any) => {
      this._zone.run(() => {
        if (response.error) {
          this.messagePayment = response.error.message;
        } else {
          this.enteringCardDetails = false;
          this.processingPayment = true;
          this.messagePayment = `Processing card...`;
          this.afs.collection('PERRINNTeams/'+this.UI.currentUser+'/payments').add({
            source:response.id,
            amountCOINSPurchased:this.amountCOINSPurchased,
            amountCharge:this.amountCharge,
            currency:this.currentCurrencyID,
            user:this.UI.currentUser,
            serverTimestamp:firebase.firestore.FieldValue.serverTimestamp()
          }).then(paymentID=>{
            this.afs.doc<any>('PERRINNTeams/'+this.UI.currentUser+'/payments/'+paymentID.id).valueChanges().subscribe(payment=>{
              if(payment.reponse!=undefined)this.messagePayment=payment.reponse.outcome.seller_message;
              if(this.messagePayment=='Payment complete.')this.messagePERRINNTransaction='We are now sending COINS to you...';
              if(payment.error!=undefined)this.messagePayment=payment.error.message;
              if(payment.PERRINNTransaction!=undefined)this.messagePERRINNTransaction=payment.PERRINNTransaction.message;
            });
          });
        }
      });
    });
  }

  refreshAmountCharge() {
    this.amountCharge = Number((this.amountCOINSPurchased/this.currencyList[this.currentCurrencyID].toCOIN*100).toFixed(0));
  }

  objectToArray(obj) {
    if (obj == null) { return null; }
    return Object.keys(obj).map(function(key) {
      return [key, obj[key]];
    });
  }

}
