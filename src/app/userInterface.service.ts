import { Injectable }    from '@angular/core'
import { AngularFireAuth } from '@angular/fire/auth'
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore'
import { map } from 'rxjs/operators'
import * as firebase from 'firebase/app'
import { formatNumber } from '@angular/common'

@Injectable()
export class UserInterfaceService {
  loading:boolean
  currentUser:string
  currentUserLastMessageObj:any
  nowSeconds:number
  searchNameIndex:any
  userObjectIndex:any

  constructor(
    private afAuth: AngularFireAuth,
    public afs: AngularFirestore
  ) {
    this.searchNameIndex=[]
    this.userObjectIndex=[]
    this.nowSeconds=Math.floor(Date.now()/1000)
    setInterval(()=>{this.nowSeconds=Math.floor(Date.now()/1000)},60000)
    this.afAuth.user.subscribe((auth) => {
      if (auth != null) {
        this.currentUser=auth.uid
        afs.collection<any>('PERRINNMessages',ref=>ref.where('user','==',this.currentUser).where('verified','==',true).orderBy('serverTimestamp','desc').limit(1)).valueChanges().subscribe(snapshot=>{
          this.currentUserLastMessageObj=snapshot[0]
        })
      } else {
        this.currentUser=null
      }
    })
  }


  userObjectIndexPopulate(message){
    if(!this.searchNameIndex.includes(message.searchName)){
      this.searchNameIndex.push(message.searchName)
      this.userObjectIndexPopulateObject(this.searchNameIndex.indexOf(message.searchName),message.user,message.name,message.familyName)
    }
    message.recipientList.forEach(recipient=>{
      if((message.recipients[recipient]||{}).searchName&&!this.searchNameIndex.includes((message.recipients[recipient]||{}).searchName)){
        this.searchNameIndex.push(message.recipients[recipient].searchName)
        this.userObjectIndexPopulateObject(this.searchNameIndex.indexOf(message.recipients[recipient].searchName),recipient,message.recipients[recipient].name,message.recipients[recipient].familyName)
      }
    })
  }

  userObjectIndexPopulateObject(index,user,name,familyName){
    this.userObjectIndex[index]={
      user:user,
      name:name,
      familyName:familyName
    }
  }

  createMessage(messageObj){
    if (!messageObj.text&&!messageObj.chatImageTimestamp) return null
    messageObj.serverTimestamp=firebase.firestore.FieldValue.serverTimestamp()
    messageObj.user=this.currentUser
    messageObj.name=messageObj.name||this.currentUserLastMessageObj.name||''
    messageObj.imageUrlThumbUser=messageObj.imageUrlThumbUser||this.currentUserLastMessageObj.imageUrlThumbUser||''
    messageObj.PERRINN={}
    messageObj.reads={[this.currentUser]:true}
    return this.afs.collection('PERRINNMessages').add(messageObj)
  }

  formatCOINS(amount){
    if(amount<1000)return formatNumber(amount,"en-US","1.2-2")
    else return formatNumber(amount,"en-US","1.0-0")
  }

  formatSecondsToDhm2(seconds){
    seconds= Number(seconds)
    var d=Math.floor(seconds/(3600*24))
    var h=Math.floor(seconds%(3600*24)/3600)
    var m=Math.floor(seconds%3600/60)
    var dDisplay=d>0?d+'d ':''
    var hDisplay=h>0?h+'h ':''
    var mDisplay=(m>=0&&d==0)?m+'m ':''
    return dDisplay+hDisplay+mDisplay
  }

  formatSecondsToDhm1(seconds){
    seconds= Number(seconds)
    var d=Math.floor(seconds/(3600*24))
    var h=Math.floor(seconds%(3600*24)/3600)
    var m=Math.floor(seconds%3600/60)
    var dDisplay=d>0?d+'d ':''
    var hDisplay=(h>0&&d==0)?h+'h ':''
    var mDisplay=(m>=0&&d==0&&h==0)?m+'m ':''
    return dDisplay+hDisplay+mDisplay
  }

}
