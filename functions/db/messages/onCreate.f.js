const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const createMessageUtils = require('../../utils/createMessage')
const customClaimsUtils = require('../../utils/customClaims')
const childTopUpUtils = require('../../utils/childTopUp')
const emailUtils = require('../../utils/email')
const googleUtils = require('../../utils/google')
const onshapeUtils = require('../../utils/onshape')

exports=module.exports=functions.firestore.document('PERRINNMessages/{message}').onCreate(async(data,context)=>{
  const messageData=data.data();
  const user=messageData.user;
  const messageId=context.params.message;
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

    //message chain data
    const userObj=await admin.firestore().doc('PERRINNTeams/'+user).get()
    let userData=userObj.data()||{}
    let index=((previousMessageData.PERRINN||{}).chain||{}).index+1||userData.previousIndex+1||1;
    if(previousMessageId!='none')batch.update(admin.firestore().doc('PERRINNMessages/'+previousMessageId),{"PERRINN.chain.nextMessage":messageId||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.chain.currentMessage":messageId||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.chain.previousMessage":previousMessageId||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.chain.nextMessage":'none'},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.chain.index":index||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{previousMessage:messageId||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{previousIndex:index||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{lock:admin.firestore.FieldValue.delete()||null},{create:true});

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
    var previousBalance=((previousMessageData.PERRINN||{}).wallet||{}).balance||0;
    var newBalance=previousBalance;
    newBalance=Math.round((Number(newBalance)-Number(amountMessaging))*100000)/100000;
    newBalance=Math.round((Number(newBalance)-Number((messageData.transactionOut||{}).amount||0))*100000)/100000;
    newBalance=Math.round((Number(newBalance)+Number((messageData.transactionIn||{}).amount||0))*100000)/100000;
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.wallet.previousBalance":previousBalance||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.wallet.balance":newBalance||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{lastMessageBalance:newBalance||null},{create:true});

    //email notifications
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.emailNotifications":messageData.recipientList||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{enableEmailNotifications:true||null},{create:true});

    //user data
    const now=Date.now();
    var nameLowerCase=(messageData.name||previousMessageData.name||userData.name||'').toLowerCase()+' '+(messageData.familyName||previousMessageData.familyName||userData.familyName||'').toLowerCase();
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{name:messageData.name||previousMessageData.name||userData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{familyName:messageData.familyName||previousMessageData.familyName||userData.familyName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{userImageTimestamp:messageData.userImageTimestamp||previousMessageData.userImageTimestamp||userData.imageTimestamp||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{imageUrlThumbUser:messageData.imageUrlThumbUser||previousMessageData.imageUrlThumbUser||userData.imageUrlThumb||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{imageUrlMedium:messageData.imageUrlMedium||previousMessageData.imageUrlMedium||userData.imageUrlMedium||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{imageUrlOriginal:messageData.imageUrlOriginal||previousMessageData.imageUrlOriginal||userData.imageUrlOriginal||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{createdTimestamp:previousMessageData.createdTimestamp||userData.createdTimestamp||now},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{searchName:nameLowerCase},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"apps.Google.enabled":((messageData.apps||{}).Google||{}).enabled||((userData.apps||{}).Google||{}).enabled||false},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"apps.Onshape.enabled":((messageData.apps||{}).Onshape||{}).enabled||((userData.apps||{}).Onshape||{}).enabled||false},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{name:messageData.name||userData.name||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{familyName:messageData.familyName||userData.familyName||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{imageTimestamp:messageData.userImageTimestamp||previousMessageData.userImageTimestamp||userData.imageTimestamp||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{imageUrlThumb:messageData.imageUrlThumbUser||userData.imageUrlThumb||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{imageUrlMedium:messageData.imageUrlMedium||userData.imageUrlMedium||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{imageUrlOriginal:messageData.imageUrlOriginal||userData.imageUrlOriginal||null},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{createdTimestamp:userData.createdTimestamp||now},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{searchName:nameLowerCase},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{members:{[user]:{name:messageData.name||userData.name||null,familyName:messageData.familyName||userData.familyName||null,leader:true}}},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{isUser:true},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{"apps.Google.enabled":((messageData.apps||{}).Google||{}).enabled||((userData.apps||{}).Google||{}).enabled||false},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{"apps.Onshape.enabled":((messageData.apps||{}).Onshape||{}).enabled||((userData.apps||{}).Onshape||{}).enabled||false},{create:true});
    if (((messageData.apps||{}).Google||{}).enabled)googleUtils.joinPERRINNGoogleGroup(user)
    if (((messageData.apps||{}).Onshape||{}).enabled)onshapeUtils.joinPERRINNOnshapeTeam(user)
    if(userData.createdTimestamp==undefined){
      let sender='-L7jqFf8OuGlZrfEK6dT';
      let messageObj={
        user:sender,
        domain:user,
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

    //message chat Subject
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{chatSubject:messageData.chatSubject||previousThreadMessageData.chatSubject||null},{create:true})

    //message verified
    batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{verified:true},{create:true})

    await batch.commit()
    await childTopUpUtils.performChildTopUp(user)
    await customClaimsUtils.setCustomClaims(user)
  }
  catch(error){
    console.log(error);
    emailUtils.sendErrorEmail(error);
    return admin.firestore().doc('PERRINNMessages/'+messageId).update({verified:false})
  }
});
