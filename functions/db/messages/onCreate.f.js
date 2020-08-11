const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const createMessageUtils = require('../../utils/createMessage')
const emailUtils = require('../../utils/email')
const googleUtils = require('../../utils/google')
const onshapeUtils = require('../../utils/onshape')

exports=module.exports=functions.firestore.document('PERRINNMessages/{message}').onCreate(async(data,context)=>{
  const messageData=data.data();
  const user=messageData.user;
  const messageId=context.params.message;
  const now=Date.now();
  let amountMessaging=0;
  let amountRead=0;
  let amountWrite=0;
  let donor='none';
  let donorName='';
  let donorFamilyName='';
  let donorImageUrlThumb='';
  let reference='none';
  let receiverName='';
  let receiverFamilyName='';
  let receiverImageUrlThumb='';
  let receiverMessage='none';
  let functionObj={none:'none'};
  let inputs={none:'none'};
  let inputsComplete=false;
  let previousThreadMessageData={};
  var batch = admin.firestore().batch();

  try{

    //last user message
    let previousMessageId='none';
    let previousMessageData={};
    const lastUserMessages=await admin.firestore().collection('PERRINNMessages').where('user','==',user).where('verified','==',true).orderBy('serverTimestamp','desc').limit(2).get()
    lastUserMessages.forEach(message=>{
      if(message.id!=messageId&&previousMessageId=='none'){
        previousMessageId=message.id;
        previousMessageData=message.data();
      }
    });

    //last message flag
    const previousThreadMessages=await admin.firestore().collection('PERRINNMessages').where('chain','==',messageData.chain).where('lastMessage','==',true).get()
    let lastThreadMessage=true;
    previousThreadMessages.forEach(message=>{
      if(message.data().serverTimestamp<messageData.serverTimestamp&&messageId!=message.id){
        batch.update(admin.firestore().doc('PERRINNMessages/'+message.id),{lastMessage:false});
        previousThreadMessageData=message.data();
      } else if (message.data().serverTimestamp>messageData.serverTimestamp&&messageId!=message.id) {
        lastThreadMessage=false;
      }
    });
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{lastMessage:lastThreadMessage});

    //message user chain data
    let userChain={}
    userChain.currentMessage=messageId
    userChain.previousMessage=previousMessageId||null
    userChain.nextMessage='none'
    userChain.index=((previousMessageData.userChain||{}).index+1)||(((previousMessageData.PERRINN||{}).chain||{}).index+1)||1
    if(previousMessageId!='none')batch.update(admin.firestore().doc('PERRINNMessages/'+previousMessageId),{"PERRINN.chain.nextMessage":messageId||null},{create:true});
    if(previousMessageId!='none')batch.update(admin.firestore().doc('PERRINNMessages/'+previousMessageId),{"userChain.nextMessage":messageId||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.chain.currentMessage":userChain.currentMessage},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.chain.previousMessage":userChain.previousMessage},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.chain.nextMessage":userChain.nextMessage},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.chain.index":userChain.index},{create:true});

    //message recipientList (merge with user, trasnactionOut receiver, previous thread list and remove duplicates and remove undefined)
    messageData.recipientList=[user].concat([(messageData.transactionOut||{}).receiver]||[]).concat(messageData.recipientList||[]).concat(previousThreadMessageData.recipientList||[])
    messageData.recipientList=messageData.recipientList.filter((item,pos)=>messageData.recipientList.indexOf(item)===pos)
    //messageData.recipientList.splice(messageData.recipientList.indexOf('undefined'),1)
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{recipientList:messageData.recipientList||[]},{create:true});

    //message recipients data
    var reads=[];
    messageData.recipientList.forEach(recipient=>{
      reads.push(admin.firestore().doc('PERRINNTeams/'+recipient).get());
    });
    const recipientsObj=await Promise.all(reads)
    messageData.recipientList.forEach((recipient,index)=>{
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{[`recipients.${recipient}.name`]:(recipientsObj[index].data()||{}).name||null},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{[`recipients.${recipient}.familyName`]:(recipientsObj[index].data()||{}).familyName||null},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{[`recipients.${recipient}.imageUrlThumb`]:(recipientsObj[index].data()||{}).imageUrlThumb||null},{create:true});
    });

    //messaging cost
    const costs=await admin.firestore().doc('appSettings/costs').get()
    amountWrite=costs.data().messageWrite;
    amountMessaging=Math.round(Number(amountWrite)*100000)/100000;
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.messagingCost.amount":amountMessaging||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.messagingCost.amountWrite":amountWrite||null},{create:true});

    //message transaction out receiver
    let transactionOutReceiverLastMessageId='none';
    let transactionOutReceiverLastMessageData={};
    const transactionOutReceiverLastMessages=await admin.firestore().collection('PERRINNMessages').where('user','==',(messageData.transactionOut||{}).receiver||null).where('verified','==',true).orderBy('serverTimestamp','desc').limit(1).get()
    transactionOutReceiverLastMessages.forEach(message=>{
      transactionOutReceiverLastMessageId=message.id;
      transactionOutReceiverLastMessageData=message.data();
    });
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionOut.receiverName":transactionOutReceiverLastMessageData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionOut.receiverFamilyName":transactionOutReceiverLastMessageData.familyName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionOut.receiverImageUrlThumb":transactionOutReceiverLastMessageData.imageUrlThumbUser||null},{create:true});

    //message transaction in donor
    let transactionInDonorLastMessageId='none';
    let transactionInDonorLastMessageData={};
    const transactionInDonorLastMessages=await admin.firestore().collection('PERRINNMessages').where('user','==',(messageData.transactionIn||{}).donor||null).where('verified','==',true).orderBy('serverTimestamp','desc').limit(1).get()
    transactionInDonorLastMessages.forEach(message=>{
      transactionInDonorLastMessageId=message.id;
      transactionInDonorLastMessageData=message.data();
    });
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionIn.donorName":transactionInDonorLastMessageData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionIn.donorFamilyName":transactionInDonorLastMessageData.familyName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionIn.donorImageUrlThumb":transactionInDonorLastMessageData.imageUrlThumbUser||null},{create:true});

    //message wallet
    let wallet={}
    wallet.previousBalance=((previousMessageData.PERRINN||{}).wallet||{}).balance||0;
    wallet.balance=wallet.previousBalance;
    wallet.balance=Math.round((Number(wallet.balance)-Number(amountMessaging))*100000)/100000;
    wallet.balance=Math.round((Number(wallet.balance)-Number((messageData.transactionOut||{}).amount||0))*100000)/100000;
    wallet.balance=Math.round((Number(wallet.balance)+Number((messageData.transactionIn||{}).amount||0))*100000)/100000;

    //email notifications
    if((messageData.PERRINN||{}).emailNotifications)batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.emailNotifications":messageData.recipientList},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{enableEmailNotifications:true||null},{create:true});

    //user data
    messageData.searchName=(messageData.name||previousMessageData.name||'').toLowerCase()+' '+(messageData.familyName||previousMessageData.familyName||'').toLowerCase();
    messageData.createdTimestamp=messageData.createdTimestamp||previousMessageData.createdTimestamp||now
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{name:messageData.name||previousMessageData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{familyName:messageData.familyName||previousMessageData.familyName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{userImageTimestamp:messageData.userImageTimestamp||previousMessageData.userImageTimestamp||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{imageUrlThumbUser:messageData.imageUrlThumbUser||previousMessageData.imageUrlThumbUser||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{imageUrlMedium:messageData.imageUrlMedium||previousMessageData.imageUrlMedium||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{imageUrlOriginal:messageData.imageUrlOriginal||previousMessageData.imageUrlOriginal||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{createdTimestamp:messageData.createdTimestamp},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{searchName:messageData.searchName},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"apps.Google.enabled":((messageData.apps||{}).Google||{}).enabled||((previousMessageData.apps||{}).Google||{}).enabled||false},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"apps.Onshape.enabled":((messageData.apps||{}).Onshape||{}).enabled||((previousMessageData.apps||{}).Onshape||{}).enabled||false},{create:true});
    if (((messageData.apps||{}).Google||{}).enabled&&!((previousMessageData.apps||{}).Google||{}).enabled&&userChain.index>1)googleUtils.joinPERRINNGoogleGroup(user)
    if (((messageData.apps||{}).Onshape||{}).enabled&&!((previousMessageData.apps||{}).Onshape||{}).enabled&&userChain.index>1)onshapeUtils.joinPERRINNOnshapeTeam(user)
    if(messageData.createdTimestamp==now){
      let sender='-L7jqFf8OuGlZrfEK6dT';
      let messageObj={
        user:sender,
        text:"Welcome to PERRINN, we are happy to have you here with us! If you have any question please ask here. We will be happy to help.",
        chatSubject:'Welcome to PERRINN',
        recipientList:[sender,'QYm5NATKa6MGD87UpNZCTl6IolX2',user]
      };
      await createMessageUtils.createMessageAFS(messageObj);
    }

    //message domain data
    const domainObj=await admin.firestore().doc('PERRINNTeams/'+messageData.domain).get()
    let domainData=domainObj.data()||{}
    var nameLowerCase=(messageData.domainName||previousMessageData.domainName||domainData.name||'').toLowerCase();
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{domainName:messageData.domainName||previousMessageData.domainName||domainData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{domainImageTimestamp:messageData.domainImageTimestamp||previousMessageData.domainImageTimestamp||domainData.imageTimestamp||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{domainImageUrlThumb:messageData.domainImageUrlThumb||previousMessageData.domainImageUrlThumb||domainData.imageUrlThumb||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{domainImageUrlMedium:messageData.domainImageUrlMedium||previousMessageData.domainImageUrlMedium||domainData.imageUrlMedium||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{domainImageUrlOriginal:messageData.domainImageUrlOriginal||previousMessageData.domainImageUrlOriginal||domainData.imageUrlOriginal||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{domainMembershipCost:messageData.domainMembershipCost||previousMessageData.domainMembershipCost||domainData.membershipCost||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{domainSearchName:nameLowerCase},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{[`members.${messageData.user}.name`]:messageData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{[`members.${messageData.user}.familyName`]:messageData.familyName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{[`members.${messageData.user}.imageUrlThumb`]:messageData.imageUrlThumbUser||null},{create:true});

    //message transaction out receiver
    if((messageData.transactionOut||{}).receiver){
      createMessageUtils.createMessageAFS({
        domain:messageData.domain,
        user:messageData.transactionOut.receiver,
        text:((messageData.transactionOut||{}).amount||0)+" COINS received, reference: "+messageData.transactionOut.reference,
        chain:messageData.chain,
        transactionIn:{
          donor:user,
          amount:(messageData.transactionOut||{}).amount||0,
          reference:messageData.transactionOut.reference
        }
      })
    }

    //PERRINN membership
    let membership={}
    membership.dailyCost=costs.data().membershipDay
    membership.days=(now/1000/3600/24-((previousMessageData.membership||{}).serverTimestamp||{}).seconds/3600/24)||0
    membership.daysTotal=((previousMessageData.membership||{}).daysTotal||0)+membership.days
    membership.amount=membership.days*membership.dailyCost
    wallet.balance=Math.round((Number(wallet.balance)-Number(membership.amount))*100000)/100000;
    membership.previousState=((messageData.PERRINN||{}).wallet||{}).balance>0||((previousMessageData.PERRINN||{}).wallet||{}).balance>0||false
    membership.changeState=(wallet.balance>0)!=membership.previousState
    membership.serverTimestamp=admin.firestore.FieldValue.serverTimestamp()
    if (membership.changeState){
      if(user!='-L7jqFf8OuGlZrfEK6dT'){
        await admin.auth().setCustomUserClaims(user,{member:wallet.balance>0||false})
        await admin.auth().revokeRefreshTokens(user)
        createMessageUtils.createMessageAFS({
          user:'-L7jqFf8OuGlZrfEK6dT',
          text:wallet.balance>0?"Membership activated. You are now a Member of the PERRINN Team!":"Membership de-activated. You are no longer a Member of the PERRINN Team.",
          recipientList:['QYm5NATKa6MGD87UpNZCTl6IolX2',user]
        })
      }
    }

    //message chat Subject
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{chatSubject:messageData.chatSubject||previousThreadMessageData.chatSubject||null},{create:true})

    //child topup
//    if(userObj.data().lastMessageBalance<1&&(userObj.data().parents!={})){
//      let parents=toolsUtils.objectToArray(userObj.data().parents);
//      let sender=parents[0][0];
//      let amount=5-userObj.data().lastMessageBalance;
//      let messageObj={
//        user:sender,
//        text:"Automatic top up: "+amount+" COINS.",
//        recipientList:[sender,user],
//        process:{
//          inputs:{
//            amount:amount,
//            receiver:user,
//            receiverName:userObj.data().name,
//            receiverFamilyName:userObj.data().familyName,
//            reference:'automatic top up'
//          },
//          function:{
//            name:'transactionOut'
//          },
//          inputsComplete:true
//        }
//      };
//      createMessageUtils.createMessageAFS(messageObj);


    //message objects
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{userChain:userChain},{create:true})
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{membership:membership},{create:true})
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.wallet":wallet},{create:true})

    //message verified
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{verified:true},{create:true})

    await batch.commit()
  }
  catch(error){
    console.log(error);
    emailUtils.sendErrorEmail(error);
    return admin.firestore().doc('PERRINNMessages/'+messageId).update({verified:false})
  }
});
