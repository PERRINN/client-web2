const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const messageUtils = require('../../utils/message')
const createMessageUtils = require('../../utils/createMessage')
const customClaimsUtils = require('../../utils/customClaims')
const childTopUpUtils = require('../../utils/childTopUp')
const emailUtils = require('../../utils/email')
const processUtils = require('../../utils/process')

exports=module.exports=functions.firestore.document('PERRINNMessages/{message}').onCreate((data,context)=>{
  const messageData=data.data();
  const process=messageData.process;
  const user=messageData.user;
  const message=context.params.message;
  let writeError=null;
  let lockedUserChain=false;
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
  let receiver='none';
  let reference='none';
  let receiverName='';
  let receiverFamilyName='';
  let receiverImageUrlThumb='';
  let receiverMessage='none';
  let inputCheckTransactionOut=false;
  let functionObj={none:'none'};
  let inputs={none:'none'};
  let inputsComplete=false;
  var batch = admin.firestore().batch();

  return admin.firestore().collection('PERRINNMessages').where('chain','==',messageData.chain).where('lastMessage','==',true).get().then(chainLastMessages=>{
    return admin.firestore().doc('appSettings/costs').get().then(costs=>{

      //last message flag
      chainLastMessages.forEach(message=>{
        batch.update(admin.firestore().doc('PERRINNMessages/'+message.id),{lastMessage:false});
      });
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{lastMessage:true});

      //messaging cost
      amountWrite=costs.data().messageWrite;
      amountMessaging=Math.round(Number(amountWrite)*100000)/100000;
      receiver='none';
      reference='none';
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.amount":amountMessaging},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.amountWrite":amountWrite},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.receiver":receiver},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.reference":reference},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});

      //message process
      if(process!=undefined&&process!=null){
        if(process.inputsComplete){
          functionObj=process.function;
          if(process.inputs!=undefined) inputs=process.inputs;
          inputsComplete=process.inputsComplete;
        }
      }
      return processUtils.executeProcess(user,functionObj,inputs,message).then(result=>{
        if (result==undefined) result='undefined';
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.function":functionObj},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.inputs":inputs},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.inputsComplete":inputsComplete},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.result":result},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});

        //message transaction out
        if(process!=undefined&&process!=null){
          if(process.function!=undefined&&process.function!=null){
            if(process.function.name=='transactionOut'){
              if(checkTransactionInputs(user,process.inputs)) {
                amountTransactionOut=process.inputs.amount;
                receiver=process.inputs.receiver;
                receiverName=process.inputs.receiverName;
                receiverFamilyName=process.inputs.receiverFamilyName;
                reference=process.inputs.reference;
                inputCheckTransactionOut=true;
              }
            }
          }
        }
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.amount":amountTransactionOut},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiver":receiver},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiverName":receiverName},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiverFamilyName":receiverFamilyName},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiverImageUrlThumb":receiverImageUrlThumb},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiverMessage":receiverMessage},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.reference":reference},{create:true});
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

        //message chain data
        return admin.firestore().runTransaction(function(transaction) {
          return transaction.get(admin.firestore().doc('PERRINNChain/'+user)).then(function(chain) {
            if (chain.exists) {
              if(chain.data().lock)return Promise.reject();
            }
            transaction.update(admin.firestore().doc('PERRINNChain/'+user),{lock:true},{create:true});
          });
        }).then(()=>{
          lockedUserChain=true;
          return admin.firestore().doc('PERRINNChain/'+user).get().then(chainObj=>{
            let previousMessage='none';
            let index=1;
            if (chainObj.data()!=undefined&&chainObj.data()!=null){
              previousMessage=chainObj.data().previousMessage?chainObj.data().previousMessage:'none';
              index=chainObj.data().previousIndex?Number(chainObj.data().previousIndex)+1:1;
            }
            if(previousMessage!='none')batch.update(admin.firestore().doc('PERRINNMessages/'+previousMessage),{"PERRINN.chain.nextMessage":message},{create:true});
            batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.currentMessage":message},{create:true});
            batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.previousMessage":previousMessage},{create:true});
            batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.nextMessage":'none'},{create:true});
            batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.index":index},{create:true});
            batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});
            batch.update(admin.firestore().doc('PERRINNChain/'+user),{previousMessage:message},{create:true});
            batch.update(admin.firestore().doc('PERRINNChain/'+user),{previousIndex:index},{create:true});
            batch.update(admin.firestore().doc('PERRINNTeams/'+user),{previousMessage:message},{create:true});

            //message wallet
            return admin.firestore().doc('PERRINNMessages/'+previousMessage).get().then(previousMessageObj=>{
              var previousBalance=0;
              if(previousMessageObj.data()!=undefined&&previousMessageObj.data()!=null){
                if(previousMessageObj.data().PERRINN!=undefined&&previousMessageObj.data().PERRINN!=null){
                  if(previousMessageObj.data().PERRINN.wallet!=undefined&&previousMessageObj.data().PERRINN.wallet!=null){
                    previousBalance=previousMessageObj.data().PERRINN.wallet.balance;
                  }
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
              batch.update(admin.firestore().doc('PERRINNTeams/'+user),{enableEmailNotifications:true},{create:true});

              //message domain data
              batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{[`members.${messageData.user}.name`]:messageData.name},{create:true});
              batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{[`members.${messageData.user}.familyName`]:messageData.familyName},{create:true});
              batch.update(admin.firestore().doc('PERRINNTeams/'+messageData.domain),{[`members.${messageData.user}.imageUrlThumb`]:messageData.imageUrlThumbUser},{create:true});

              //message write complete
              batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.dataWrite":'complete'},{create:true});

              return batch.commit();
            }).catch(error=>{
              console.log(error);
              emailUtils.sendErrorEmail(error);
            }).then(result=>{
              return messageUtils.writeMessageTransactionReceiverData(user,context.params.message);
            }).then(()=>{
              return childTopUpUtils.performChildTopUp(user);
            }).then(()=>{
              return customClaimsUtils.setCustomClaims(user);
            }).then(()=>{
              if(lockedUserChain)return admin.firestore().doc('PERRINNChain/'+user).update({lock:admin.firestore.FieldValue.delete()});
              return null;
            }).then(()=>{
              if(writeError) return data.ref.update({
                "PERRINN.dataWrite":writeError
              });
            });
          });
        });
      });
    });
  });
});


function checkTransactionInputs (user,inputs) {
  if(inputs.amount>0&&inputs.amount<=100000){
    if(inputs.reference!=''){
      return true;
    }
  }
  return false;
}
