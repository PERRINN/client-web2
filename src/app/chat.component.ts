import { Component } from '@angular/core'
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Router, ActivatedRoute } from '@angular/router'
import { UserInterfaceService } from './userInterface.service'
import { AngularFireStorage } from '@angular/fire/storage'
import * as firebase from 'firebase/app'

@Component({
  selector: 'chat',
  template: `

  <div class="sheet" *ngIf="showChatDetails">
    <div style="background:#f2f2f2">
      <div (click)="showChatDetails=false" style="float:left;font-size:12px;line-height:20px;margin:10px;color:#4287f5;cursor:pointer">< messages</div>
    </div>
    <div class="seperator" style="width:100%;margin:0px"></div>
    <input [(ngModel)]="chatSubject" style="width:60%;margin:10px;border:0;background:none;box-shadow:none;border-radius:0px" placeholder="Edit subject">
    <div *ngIf="chatLastMessageObj?.chatSubject!=chatSubject" style="float:right;width:75px;height:20px;text-align:center;line-height:18px;font-size:10px;margin:10px;color:white;background-color:#267cb5;border-radius:3px;cursor:pointer" (click)="saveNewSubject()">Save</div>
    <div class="seperator" style="width:100%;margin:0px"></div>
    <ul style="color:#333;margin:10px">
      <li *ngFor="let recipient of chatLastMessageObj?.recipientList" (click)="router.navigate(['profile',recipient])" style="cursor:pointer;float:left"
      [ngClass]="UI.isContentAccessible(recipient)?'clear':'encrypted'">
        <img [src]="chatLastMessageObj?.recipients[recipient]?.imageUrlThumb" style="float:left;object-fit:cover;height:25px;width:25px;border-radius:50%;margin:3px 3px 3px 10px">
        <div style="float:left;margin:10px 15px 3px 3px;font-size:12px;line-height:10px;font-family:sans-serif">{{chatLastMessageObj?.recipients[recipient]?.name}}</div>
      </li>
    </ul>
    <input style="width:60%;margin:10px;border:0;background:none;box-shadow:none;border-radius:0px" maxlength="500" (keyup)="refreshSearchLists()" [(ngModel)]="searchFilter" placeholder="Add people">
    <ul class="listLight">
      <li *ngFor="let team of teams | async"
      [ngClass]="UI.isContentAccessible(team.key)?'clear':'encrypted'">
        <div *ngIf="!(chatLastMessageObj?.recipients||{})[team.key]" style="padding:5px">
          <div style="float:left;width:175px">
            <img [src]="team?.values?.imageUrlThumbUser" style="display:inline;float:left;margin: 0 5px 0 10px;opacity: 1;object-fit:cover;height:25px;width:25px;border-radius:50%">
            <span>{{team.values?.name}}</span>
            <span style="font-size:10px"> {{team.values?.familyName}}</span>
          </div>
          <div class="buttonDiv" style="float:left;width:50px;font-size:11px;background-color:#267cb5;color:white;border-style:none" (click)="addRecipient(team.values.user,team.values.name,team.values.familyName)">Add</div>
        </div>
      </li>
    </ul>
    <div class="seperator" style="width:100%;margin:0px"></div>
    <div *ngIf="chatLastMessageObj?.recipientList&&chatLastMessageObj?.recipientList.length!=2" style="font-size:10px;margin:10px;color:#777">To send COINS, chat must be between you and 1 other user only.</div>
    <div *ngIf="chatLastMessageObj?.recipientList&&chatLastMessageObj?.recipientList.length==2&&chatLastMessageObj?.recipientList.includes(UI.currentUser)">
      <div style="font-size:12px;margin:10px;color:#777">Send COINS to {{(chatLastMessageObj?.recipientList[0]==UI.currentUser)?(chatLastMessageObj?.recipients[chatLastMessageObj?.recipientList[1]].name):(chatLastMessageObj?.recipients[chatLastMessageObj?.recipientList[0]].name)}}</div>
      <input style="width:100px;margin:10px;border:0;background:none;box-shadow:none;border-radius:0px" maxlength="500" (keyup)="inputsValid=checkInputs()" [(ngModel)]="amount" placeholder="Amount">
      <input style="width:150px;margin:10px;border:0;background:none;box-shadow:none;border-radius:0px" maxlength="500" [(ngModel)]="code" placeholder="Code (optional)">
      <div *ngIf="amount>0&&amount<=UI.currentUserLastMessageObj?.PERRINN?.wallet?.balance" style="clear:both;width:200px;height:20px;text-align:center;line-height:18px;font-size:10px;margin:10px;color:#267cb5;border-style:solid;border-width:1px;border-radius:3px;cursor:pointer" (click)="sendCoins(amount,code)">
        Send {{amount}} Coins to {{(chatLastMessageObj?.recipientList[0]==UI.currentUser)?(chatLastMessageObj?.recipients[chatLastMessageObj?.recipientList[1]].name):(chatLastMessageObj?.recipients[chatLastMessageObj?.recipientList[0]].name)}}
      </div>
    </div>
    <div class="seperator" style="width:100%;margin:0px"></div>
    <div>
      <input style="width:60%;margin:10px;border:0;background:none;box-shadow:none;border-radius:0px" maxlength="200" [(ngModel)]="eventDescription" placeholder="Event description">
      <div style="font-size:12px;margin:10px;color:blue">{{eventDate==0?'':eventDate|date:'EEEE d MMM HH:mm'}}</div>
      <div *ngIf="eventDate!=chatLastMessageObj?.eventDate||eventDescription!=chatLastMessageObj?.eventDescription" style="clear:both;width:100px;height:20px;text-align:center;line-height:18px;font-size:10px;margin:10px;color:#267cb5;border-style:solid;border-width:1px;border-radius:3px;cursor:pointer" (click)="saveEvent()">Save event</div>
      <ul class="listLight" style="float:left;width:200px;margin:10px 10px 150px 10px">
        <li *ngFor="let date of eventDates;let first=first" (click)="first?eventDate=date:eventDate=(date+(eventDate/3600000/24-math.floor(eventDate/3600000/24))*3600000*24)" [class.selected]="math.floor(date/3600000/24)==math.floor(eventDate/3600000/24)">
          <div *ngIf="math.round(date/3600000/24)==(date/3600000/24)||first" style="float:left;width:100px;min-height:10px">{{date|date:'EEEE'}}</div>
          <div *ngIf="math.round(date/3600000/24)==(date/3600000/24)||first" style="float:left;min-height:10px">{{date|date:'d MMM'}}</div>
        </li>
      </ul>
      <ul class="listLight" style="clear:none;float:left;width:100px;text-align:center;margin:10px 10px 150px 10px">
        <li *ngFor="let date of eventDates;let first=first" (click)="eventDate=date" [class.selected]="eventDate==date">
          <div *ngIf="math.floor(date/3600000/24)==math.floor(eventDate/3600000/24)">{{date|date:'HH:mm'}}</div>
        </li>
      </ul>
      <div class="seperator" style="width:100%;margin:0px"></div>
    </div>
  </div>

  <div class="sheet" id="chat_window" style="overflow-y:auto;height:100%" *ngIf="!showChatDetails" scrollable>
    <div class="fixed" style="background:#f2f2f2;color:#444;font-size:12px;cursor:pointer" (click)="showChatDetails=true">
      <div style="float:left;margin:0 5px 0 10px;min-height:40px">
        <div style="font-weight:bold">{{chatLastMessageObj?.chatSubject}}</div>
        <span *ngFor="let recipient of chatLastMessageObj?.recipientList;let last=last"
        [ngClass]="UI.isContentAccessible(recipient)?'clear':'encrypted'">{{recipient==UI.currentUser?'You':chatLastMessageObj?.recipients[recipient]?.name}}{{last?"":", "}}</span>
        <div *ngIf="math.floor(eventDate/60000-UI.nowSeconds/60)>-60" style="clear:both">
          <img style="float:left;width:17px;opacity:.6;;margin:0 5px 0 0" src="./../assets/App icons/event-24px.svg">
          <div style="float:left;margin:0 5px 0 0">{{eventDescription}} /</div>
          <div style="float:left;margin:0 10px 0 0">{{eventDate|date:'EEEE d MMM HH:mm'}}</div>
          <div *ngIf="math.floor(eventDate/60000-UI.nowSeconds/60)>=(60*24)" style="float:left;background-color:#2a5aa8;color:white;padding:0 5px 0 5px">in {{math.floor(eventDate/60000/60/24-UI.nowSeconds/60/60/24)}}d</div>
          <div *ngIf="math.floor(eventDate/60000-UI.nowSeconds/60)<(60*24)&&math.floor(eventDate/60000-UI.nowSeconds/60)>=60" style="float:left;background-color:#2a5aa8;color:white;padding:0 5px 0 5px">in {{math.floor(eventDate/60000/60-UI.nowSeconds/60/60)}}h</div>
          <div *ngIf="math.floor(eventDate/60000-UI.nowSeconds/60)<60&&math.floor(eventDate/60000-UI.nowSeconds/60)>0" style="float:left;background-color:#2a5aa8;color:white;padding:0 5px 0 5px">in {{math.floor(eventDate/60000-UI.nowSeconds/60)}}m</div>
          <div *ngIf="math.floor(eventDate/60000-UI.nowSeconds/60)<=0&&math.floor(eventDate/60000-UI.nowSeconds/60)>-60" style="float:left;background-color:#2a5aa8;color:white;padding:0 5px 0 5px">Now</div>
        </div>
      </div>
      <div class="seperator" style="width:100%;margin:0px"></div>
    </div>
    <div class="spinner" *ngIf="UI.loading">
      <div class="bounce1"></div>
      <div class="bounce2"></div>
      <div class="bounce3"></div>
    </div>
    <div>
      <ul style="list-style:none;">
        <li *ngFor="let message of messages|async;let first=first;let last=last;let i=index"
        [ngClass]="UI.isContentAccessible(message.payload.user)?'clear':'encrypted'">
          <div *ngIf="isMessageNewTimeGroup(message.payload?.serverTimestamp)||first" style="padding:50px 15px 15px 15px">
            <div *ngIf="first" style="color:blue;width:200px;padding:15px;margin:0 auto;text-align:center;cursor:pointer" (click)="loadMore()">Load more</div>
            <div style="border-color:#bbb;border-width:1px;border-style:solid;color:#404040;background-color:#e9e8f9;width:200px;padding:5px;margin:0 auto;text-align:center;border-radius:3px">{{(message.payload?.serverTimestamp?.seconds*1000)|date:'fullDate'}}</div>
          </div>
          <div *ngIf="isMessageNewUserGroup(message.payload?.user,message.payload?.serverTimestamp)||first" style="clear:both;width:100%;height:15px"></div>
          <div *ngIf="message.payload?.imageUrlThumbUser&&(isMessageNewUserGroup(message.payload?.user,message.payload?.serverTimestamp)||first)" style="float:left;width:60px;min-height:10px">
            <img [src]="message.payload?.imageUrlThumbUser" style="cursor:pointer;display:inline;float:left;margin:10px;border-radius:50%; object-fit:cover; height:35px; width:35px" (click)="router.navigate(['profile',message.payload?.user])">
          </div>
          <div [style.background-color]="(message.payload?.PERRINN?.wallet?.balance>message.payload?.PERRINN?.wallet?.previousBalance)?'#f2f5d0':(message.payload?.user==UI.currentUser)?'#daebda':'white'" style="cursor:text;border-style:solid;border-width:1px;color:#ccc;margin:2px 10px 5px 60px">
            <div>
              <div *ngIf="isMessageNewUserGroup(message.payload?.user,message.payload?.serverTimestamp)||first">
                <div style="color:#777;font-size:12px;font-weight:bold;display:inline;float:left;margin:0px 10px 0px 5px">{{message.payload?.name}}</div>
                <div *ngIf="(UI.nowSeconds-message.payload?.serverTimestamp?.seconds)>43200" style="color:#777;font-size:11px;margin:0px 10px 0px 10px">{{(message.payload?.serverTimestamp?.seconds*1000)|date:'HH:mm'}}</div>
                <div *ngIf="(UI.nowSeconds-message.payload?.serverTimestamp?.seconds)<=43200&&(UI.nowSeconds-message.payload?.serverTimestamp?.seconds)>3600" style="color:#777;font-size:11px;margin:0px 10px 0px 10px">{{(UI.nowSeconds-message.payload?.serverTimestamp?.seconds)*1000|date:'h'}}h</div>
                <div *ngIf="(UI.nowSeconds-message.payload?.serverTimestamp?.seconds)<=3600" style="color:#777;font-size:11px;margin:0px 10px 0px 10px">{{math.max(0,(UI.nowSeconds-message.payload?.serverTimestamp?.seconds))*1000|date:'m'}}m</div>
              </div>
              <div style="float:left;color:#404040;margin:5px 5px 0 5px" [innerHTML]="message.payload?.text | linky"></div>
              <div style="clear:both;text-align:center">
                <img class="imageWithZoom" *ngIf="message.payload?.chatImageTimestamp" [src]="message.payload?.chatImageUrlMedium" style="clear:both;width:70%;max-height:320px;object-fit:contain;margin:5px 10px 5px 5px;border-radius:3px" (click)="showFullScreenImage(message.payload?.chatImageUrlOriginal)">
              </div>
              <div *ngIf="messageShowDetails.includes(message.key)" style="margin:5px">
                <div class="seperator" style="width:100%"></div>
                <div style="color:#666;font-size:10px">userChain: {{message.payload?.userChain|json}}</div>
                <div class="seperator" style="width:100%"></div>
                <div style="color:#666;font-size:10px">transactionOut: {{message.payload?.transactionOut|json}}</div>
                <div class="seperator" style="width:100%"></div>
                <div style="color:#666;font-size:10px">transactionIn: {{message.payload?.transactionIn|json}}</div>
                <div class="seperator" style="width:100%"></div>
                <div style="color:#666;font-size:10px">messagingCost: {{message.payload?.messagingCost|json}}</div>
                <div class="seperator" style="width:100%"></div>
                <div style="color:#666;font-size:10px">COIN purchase: {{message.payload?.purchaseCOIN|json}}</div>
                <div class="seperator" style="width:100%"></div>
                <div style="color:#666;font-size:10px">interest: {{message.payload?.interest|json}}</div>
                <div class="seperator" style="width:100%"></div>
                <div style="color:#666;font-size:10px">membership: {{message.payload?.membership|json}}</div>
                <div class="seperator" style="width:100%"></div>
                <div style="color:#666;font-size:10px">contract: {{message.payload?.contract|json}}</div>
                <div class="seperator" style="width:100%"></div>
                <div style="color:#666;font-size:10px">wallet: {{message.payload?.PERRINN?.wallet|json}}</div>
                <div class="seperator" style="width:100%"></div>
                <div style="color:#666;font-size:10px">{{message.payload|json}}</div>
              </div>
            </div>
            <div class='messageFooter' style="cursor:pointer;clear:both;height:15px" (click)="messageShowActions.includes(message.key)?messageShowActions.splice(messageShowActions.indexOf(message.key),1):messageShowActions.push(message.key)">
              <div style="float:left;width:100px;text-align:right;line-height:10px">...</div>
              <img *ngIf="message.payload?.verified" src="./../assets/App icons/tick.png" style="float:right;height:15px;margin:0 2px 2px 0">
              <div *ngIf="message.payload?.userChain?.nextMessage=='none'&&message.payload?.PERRINN?.wallet?.balance!=undefined" style="float:right;font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">{{message.payload?.PERRINN?.wallet?.balance|number:'1.2-2'}}</div>
            </div>
            <div *ngIf="messageShowActions.includes(message.key)">
              <div style="float:left;padding:5px;color:#777;cursor:pointer;border-color:#ddd;border-style:solid;border-width:1px 1px 0 0" (click)="messageShowDetails.includes(message.key)?messageShowDetails.splice(messageShowDetails.indexOf(message.key),1):messageShowDetails.push(message.key)">Details</div>
            </div>
          </div>
          <div *ngIf="leftHere==message.key" style="margin:0 auto;text-align:center;color:#404040;font-size:12px;margin:35px 0 35px 0;background-color:#f4f7fc;border-style:solid;border-color:#bbb;border-width:1px 0 1px 0">Left here</div>
          {{storeMessageValues(message.payload)}}
          {{(last||i==(messageNumberDisplay-1))?scrollToBottom(message.payload?.serverTimestamp?.seconds):''}}
        </li>
      </ul>
      <div style="height:100px;width:100%"></div>
    </div>
  </div>

  <div class="sheet">
    <div class="fixed" style="bottom:0">
      <div class="seperator" style="width:100%"></div>
      <div style="clear:both;float:left;width:90%">
        <textarea id="inputMessage" autocapitalize="none" style="float:left;width:95%;border-style:solid;border-width:0 1px 0 0;border-color:#ddd;padding:9px;resize:none;overflow-y:scroll" maxlength="500" (keyup.enter)="addMessage()" [(ngModel)]="draftMessage" placeholder="Reply all"></textarea>
      </div>
      <div *ngIf="draftMessage" style="float:right;width:10%;cursor:pointer">
        <img src="./../assets/App icons/send.png" style="width:25px;margin:20px 5px 5px 5px" (click)="addMessage()">
      </div>
      <div *ngIf="!draftMessage" style="float:right;width:10%;cursor:pointer">
        <input type="file" name="chatImage" id="chatImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
        <label class="buttonUploadImage" for="chatImage" id="buttonFile">
        <img src="./../assets/App icons/camera.png" style="width:25px;margin:20px 5px 5px 5px">
        </label>
      </div>
    </div>
  </div>
    `
})
export class ChatComponent {
  draftMessage:string
  imageTimestamp:string
  imageDownloadUrl:string
  messageNumberDisplay:number
  lastChatVisitTimestamp:number
  scrollMessageTimestamp:number
  previousMessageServerTimestamp:any
  previousMessageUser:string
  messageShowDetails:[]
  messages:Observable<any[]>
  teams:Observable<any[]>
  searchFilter:string
  reads:any[]
  chatSubject:string
  chatLastMessageObj:any
  chatChain:string
  showChatDetails:boolean
  math:any
  eventDates:any
  eventDate:any
  eventDescription:string
  messageShowActions:[]
  leftHere:string

  constructor(
    public afs: AngularFirestore,
    public router: Router,
    public UI: UserInterfaceService,
    private route: ActivatedRoute,
    private storage: AngularFireStorage,
  ) {
    this.math=Math
    this.UI.loading=true
    this.reads=[]
    this.route.params.subscribe(params=>{
      this.leftHere=null
      this.chatChain=params.id
      this.messageShowActions=[]
      this.messageShowDetails=[]
      this.chatLastMessageObj={}
      this.previousMessageServerTimestamp={}
      this.previousMessageUser=''
      this.messageNumberDisplay=15
      this.chatSubject=''
      this.eventDescription=''
      this.refreshMessages(params.id)
      this.refreshEventDates()
      this.resetChat()
    })
  }

  ngOnInit() {
    this.refreshSearchLists()
  }

  loadMore() {
    this.UI.loading=true
    this.messageNumberDisplay+=15
    this.refreshMessages(this.chatLastMessageObj.chain||this.chatChain)
  }

  refreshEventDates(){
    var i
    this.eventDates=[]
    for(i=0;i<500;i++){
      this.eventDates[i]=(Math.ceil(this.UI.nowSeconds/3600)+i)*3600000
    }
  }

  refreshMessages(chain) {
    this.messages=this.afs.collection('PERRINNMessages',ref=>ref
      .where('chain','==',chain)
      .orderBy('serverTimestamp','desc')
      .limit(this.messageNumberDisplay)
    ).snapshotChanges().pipe(map(changes=>{
      this.UI.loading=false
      var batch=this.afs.firestore.batch()
      var nextMessageRead=true
      changes.forEach(c=>{
        if(!this.leftHere&&!nextMessageRead&&(c.payload.doc.data()['reads']||[])[this.UI.currentUser])this.leftHere=c.payload.doc.id
        nextMessageRead=(c.payload.doc.data()['reads']||[])[this.UI.currentUser]
        if(c.payload.doc.data()['lastMessage']){
          if(!this.reads.includes(c.payload.doc.id))batch.set(this.afs.firestore.collection('PERRINNTeams').doc(this.UI.currentUser).collection('reads').doc(c.payload.doc.id),{serverTimestamp:firebase.firestore.FieldValue.serverTimestamp()},{merge:true})
          this.reads.push(c.payload.doc.id)
          this.chatLastMessageObj=c.payload.doc.data()
          this.chatSubject=c.payload.doc.data()['chatSubject']
          this.eventDescription=c.payload.doc.data()['eventDescription']
          this.eventDate=c.payload.doc.data()['eventDate']
        }
      })
      batch.commit()
      return changes.reverse().map(c=>({
        key:c.payload.doc.id,
        payload:c.payload.doc.data()
      }))
    }))
  }

  showFullScreenImage(src) {
    const fullScreenImage=document.getElementById('fullScreenImage') as HTMLImageElement
    fullScreenImage.src=src
    fullScreenImage.style.visibility='visible'
  }

  isMessageNewTimeGroup(messageServerTimestamp:any) {
    let isMessageNewTimeGroup:boolean
    isMessageNewTimeGroup=Math.abs(messageServerTimestamp.seconds - this.previousMessageServerTimestamp.seconds) > 60 * 60 * 4
    return isMessageNewTimeGroup
  }

  isMessageNewUserGroup(user: any, messageServerTimestamp: any) {
    let isMessageNewUserGroup:boolean
    isMessageNewUserGroup=Math.abs(messageServerTimestamp.seconds - this.previousMessageServerTimestamp.seconds) > 60 * 5 || (user != this.previousMessageUser)
    return isMessageNewUserGroup
  }

  storeMessageValues(message) {
    this.previousMessageUser=message.user
    this.previousMessageServerTimestamp=message.serverTimestamp
  }

  scrollToBottom(scrollMessageTimestamp: number) {
    if (scrollMessageTimestamp != this.scrollMessageTimestamp) {
      const element=document.getElementById('chat_window')
      element.scrollTop=element.scrollHeight
      this.scrollMessageTimestamp=scrollMessageTimestamp
    }
  }

  saveNewSubject() {
    this.UI.createMessage({
      text:'Changing chat subject to: '+this.chatSubject+" (was: "+this.chatLastMessageObj.chatSubject+")",
      chain:this.chatLastMessageObj.chain||this.chatChain,
      chatSubject:this.chatSubject,
    })
    this.resetChat()
  }

  sendCoins(amount,code){
    let user=''
    if (this.chatLastMessageObj.recipientList[0]==this.UI.currentUser)user=this.chatLastMessageObj.recipientList[1]
    else user=this.chatLastMessageObj.recipientList[0]
    this.UI.createMessage({
      text:'sending '+amount+' COINS'+((code||null)?' using code ':'')+((code||null)?code:''),
      chain:this.chatLastMessageObj.chain||this.chatChain,
      transactionOut:{
        user:user,
        amount:amount,
        code:code||null
      }
    })
    this.resetChat()
  }

  saveEvent() {
    this.UI.createMessage({
      text:'new event',
      chain:this.chatLastMessageObj.chain||this.chatChain,
      eventDate:this.eventDate,
      eventDescription:this.eventDescription
    })
    this.resetChat()
  }

  addMessage() {
    this.UI.createMessage({
      text:this.draftMessage,
      chain:this.chatLastMessageObj.chain||this.chatChain,
      chatImageTimestamp:this.imageTimestamp,
      chatImageUrlThumb:this.imageDownloadUrl,
      chatImageUrlMedium:this.imageDownloadUrl,
      chatImageUrlOriginal:this.imageDownloadUrl
    })
    this.resetChat()
  }

  addRecipient(user,name,familyName) {
    this.UI.createMessage({
      text:'adding '+name+' '+(familyName||'')+' to this chat.',
      chain:this.chatLastMessageObj.chain||this.chatChain,
      recipientList:[user]
    })
    this.resetChat()
  }

  onImageChange(event:any) {
    const image=event.target.files[0]
    const uploader=document.getElementById('uploader') as HTMLInputElement
    const storageRef=this.storage.ref('images/' + Date.now() + image.name)
    const task=storageRef.put(image)

    task.snapshotChanges().subscribe((snapshot)=>{
      document.getElementById('buttonFile').style.visibility='hidden'
      document.getElementById('uploader').style.visibility='visible'

      const percentage=(snapshot.bytesTransferred / snapshot.totalBytes) * 100
      uploader.value=percentage.toString()
    },
    (err:any)=>{
      document.getElementById('buttonFile').style.visibility='visible'
      document.getElementById('uploader').style.visibility='hidden'
      uploader.value='0'
    },
    ()=>{
      uploader.value='0'
      document.getElementById('buttonFile').style.visibility='visible'
      document.getElementById('uploader').style.visibility='hidden'
      this.imageTimestamp=task.task.snapshot.ref.name.substring(0, 13)
      storageRef.getDownloadURL().subscribe(url=>{
        this.imageDownloadUrl=url
        this.addMessage()
        event.target.value=''
      })
    })
  }

  refreshSearchLists() {
    if (this.searchFilter) {
      if (this.searchFilter.length > 1) {
        this.teams=this.afs.collection('PERRINNMessages', ref=>ref
        .where('userChain.nextMessage','==','none')
        .where('verified','==',true)
        .where('searchName','>=',this.searchFilter.toLowerCase())
        .where('searchName','<=',this.searchFilter.toLowerCase()+'\uf8ff')
        .orderBy('searchName')
        .limit(10))
        .snapshotChanges().pipe(map(changes=>{
          return changes.map(c=>({
            key:c.payload.doc.id,
            values:c.payload.doc.data()
          }))
        }))
      }
    } else {
      this.teams=null
    }
  }

  resetChat(){
    this.searchFilter=''
    this.teams=null
    this.draftMessage=''
    this.imageTimestamp=''
    this.imageDownloadUrl=''
    this.showChatDetails=false
    this.messageShowDetails=[]
    this.messageShowActions=[]
  }

}
