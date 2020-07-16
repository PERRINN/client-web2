const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const createMessageUtils = require('../../utils/createMessage')
const customClaimsUtils = require('../../utils/customClaims')
const childTopUpUtils = require('../../utils/childTopUp')
const emailUtils = require('../../utils/email')
const processUtils = require('../../utils/process')

exports=module.exports=functions.firestore.document('PERRINNMessages/{message}').onCreate(async (data,context)=>{
  const messageData=data.data();
  const process=messageData.process;
  const user=messageData.user;
  const message=context.params.message;
  let amountTransactionOut=0;
  let amountTransactionIn=0;
  let amountMessaging=0;
  let amountRead=0;
  let amountWrite=0;
  let donorCheckTransactionIn=false;
  let donor='none';
  let donorName='';
  let donorFamilyName='';
  let donorImageUrlThumb='';
  let receiverTransactionOut='none';
  let reference='none';
  let referenceTransactionOut='none';
  let receiverName='';
  let receiverFamilyName='';
  let receiverImageUrlThumb='';
  let receiverMessage='none';
  let inputCheckTransactionOut=false;
  let functionObj={none:'none'};
  let inputs={none:'none'};
  let inputsComplete=false;
  let receiverMessageObj={};
  var batch = admin.firestore().batch();

  try {
    await admin.firestore().runTransaction(async transaction => {
      const chain=await transaction.get(admin.firestore().doc('PERRINNTeams/'+user))
      if (chain.exists) {
        if(chain.data().lock)return Promise.reject();
      }
      transaction.update(admin.firestore().doc('PERRINNTeams/'+user),{lock:true},{create:true});
    })

    //message chain data
    const userObj=await admin.firestore().doc('PERRINNTeams/'+user).get()
    const domainObj=await admin.firestore().doc('PERRINNTeams/'+messageData.domain).get()
    const chainLastMessages=await admin.firestore().collection('PERRINNMessages').where('chain','==',messageData.chain).where('lastMessage','==',true).get()
    const costs=await admin.firestore().doc('appSettings/costs').get()
    let previousMessage='none';
    let index=1;
    if (userObj.data()!=undefined&&userObj.data()!=null){
      previousMessage=userObj.data().previousMessage?userObj.data().previousMessage:'none';
      index=userObj.data().previousIndex?Number(userObj.data().previousIndex)+1:1;
    }
    if(previousMessage!='none')batch.update(admin.firestore().doc('PERRINNMessages/'+previousMessage),{"PERRINN.chain.nextMessage":message},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.currentMessage":message},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.previousMessage":previousMessage},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.nextMessage":'none'},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.index":index},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{previousMessage:message},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{previousIndex:index},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{lock:admin.firestore.FieldValue.delete()},{create:true});

    //last message flag
    chainLastMessages.forEach(message=>{
      batch.update(admin.firestore().doc('PERRINNMessages/'+message.id),{lastMessage:false});
    });
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{lastMessage:true});

    //messaging cost
    amountWrite=costs.data().messageWrite;
    amountMessaging=Math.round(Number(amountWrite)*100000)/100000;
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.amount":amountMessaging},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.amountWrite":amountWrite},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});

    //message process
    if(process!=undefined&&process!=null){
      if(process.inputsComplete){
        functionObj=process.function;
        if(process.inputs!=undefined) inputs=process.inputs;
        inputsComplete=process.inputsComplete;
      }
    }
    const result=await processUtils.executeProcess(user,functionObj,inputs,message)
    if (result==undefined) result='undefined';
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.function":functionObj},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.inputs":inputs},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.inputsComplete":inputsComplete},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.result":result},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});
    if(functionObj.name=='createUser'){
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

    //message transaction out
    if(process!=undefined&&process!=null){
      if(process.function!=undefined&&process.function!=null){
        if(process.function.name=='transactionOut'){
          if(checkTransactionInputs(process.inputs)) {
            amountTransactionOut=process.inputs.amount;
            receiverTransactionOut=process.inputs.receiver;
            receiverName=process.inputs.receiverName;
            receiverFamilyName=process.inputs.receiverFamilyName;
            referenceTransactionOut=process.inputs.reference;
            inputCheckTransactionOut=true;
          }
        }
      }
    }
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.amount":amountTransactionOut},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiver":receiverTransactionOut},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiverName":receiverName},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiverFamilyName":receiverFamilyName},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiverImageUrlThumb":receiverImageUrlThumb},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiverMessage":receiverMessage},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.reference":referenceTransactionOut},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.inputCheck":inputCheckTransactionOut},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.result":'done'},{create:true});

    //message transaction in
    if(messageData.PERRINN!=undefined){
      let transactionInObj=messageData.PERRINN.transactionIn;
      if(transactionInObj!=undefined&&transactionInObj!=null){
        if(transactionInObj.donor!=undefined&&transactionInObj.donor!=null){
          donor=transactionInObj.donor;
          donorName=transactionInObj.donorName;
          donorFamilyName=transactionInObj.donorFamilyName;
          donorImageUrlThumb=transactionInObj.donorImageUrlThumb;
          amountTransactionIn=transactionInObj.amount;
          reference=transactionInObj.reference;
          donorCheckTransactionIn=true;
        }
      }
    }
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.amount":amountTransactionIn},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.donor":donor},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.donorName":donorName},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.donorFamilyName":donorFamilyName},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.donorImageUrlThumb":donorImageUrlThumb},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.reference":reference},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.donorCheck":donorCheckTransactionIn},{create:true});

    //message wallet
    var previousBalance=0;
    if(userObj.data()!=undefined&&userObj.data()!=null){
      if(userObj.data().lastMessageBalance!=undefined&&userObj.data().lastMessageBalance!=null){
        previousBalance=userObj.data().lastMessageBalance;
      }
    }
    var balance=previousBalance;
    if(amountMessaging>0){
      balance=Math.round((Number(balance)-Number(amountMessaging))*100000)/100000;
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.status":'complete'},{create:true});
    } else {
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.status":'none'},{create:true});
    }
    if(inputCheckTransactionOut){
      balance=Math.round((Number(balance)-Number(amountTransactionOut))*100000)/100000;
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.status":'complete'},{create:true});
    } else {
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.status":'none'},{create:true});
    }
    if(donorCheckTransactionIn){
      balance=Math.round((Number(balance)+Number(amountTransactionIn))*100000)/100000;
    }
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.wallet.previousBalance":previousBalance},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.wallet.amount":Math.round((balance-previousBalance)*100000)/100000},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.wallet.balance":balance},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.wallet.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{lastMessageBalance:balance},{create:true});

    //email notifications
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.emailNotifications":messageData.recipientList},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user),{enableEmailNotifications:true},{create:true});

    //message domain data
    if(domainObj.data()!=undefined)if(domainObj.data().name!=undefined)batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.domain.name":domainObj.data().name},{create:true});
    if(domainObj.data()!=undefined)if(domainObj.data().imageUrlThumb!=undefined)batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.domain.imageUrlThumb":domainObj.data().imageUrlThumb},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{[`members.${messageData.user}.name`]:messageData.name},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{[`members.${messageData.user}.familyName`]:messageData.familyName},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{[`members.${messageData.user}.imageUrlThumb`]:messageData.imageUrlThumbUser},{create:true});

    //message transaction receiver
    if(amountTransactionOut>0){
      receiverMessageObj={
        domain:messageData.domain,
        user:receiverTransactionOut,
        text:amountTransactionOut+" COINS received, reference: "+referenceTransactionOut,
        chain:messageData.chain,
        chatSubject:messageData.chatSubject,
        recipientList:messageData.recipientList,
        PERRINN:{
          transactionIn:{
            donor:user,
            donorName:messageData.name,
            donorFamilyName:messageData.familyName,
            donorImageUrlThumb:messageData.imageUrlThumbUser,
            amount:amountTransactionOut,
            reference:referenceTransactionOut
          }
        }
      };
    }

    //message recipients data
    var reads=[];
    messageData.recipientList.forEach(recipient=>{
      reads.push(admin.firestore().doc('PERRINNTeams/'+recipient).get());
    });
    const recipientsObj=await Promise.all(reads)
    messageData.recipientList.forEach((recipient,index)=>{
      var name='';
      var familyName='';
      var imageUrlThumb='';
      if(recipientsObj[index].data().name!=undefined)name=recipientsObj[index].data().name;
      if(recipientsObj[index].data().familyName!=undefined)familyName=recipientsObj[index].data().familyName;
      if(recipientsObj[index].data().imageUrlThumb!=undefined)imageUrlThumb=recipientsObj[index].data().imageUrlThumb;
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{[`recipients.${recipient}.name`]:name},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{[`recipients.${recipient}.familyName`]:familyName},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{[`recipients.${recipient}.imageUrlThumb`]:imageUrlThumb},{create:true});
    });

    await batch.commit()
    if(receiverMessageObj.PERRINN!=undefined)await createMessageUtils.createMessageAFS(receiverMessageObj)
    await childTopUpUtils.performChildTopUp(user)
    await customClaimsUtils.setCustomClaims(user)
  }
  catch (error) {
    console.log(error);
    emailUtils.sendErrorEmail(error);
  }
});


function checkTransactionInputs(inputs) {
  if(inputs.amount>0&&inputs.amount<=100000){
    if(inputs.reference!=''){
      return true;
    }
  }
  return false;
}
