const admin = require('firebase-admin')
const processUtils = require('./process')
const teamUtils = require('./team')
const createMessageUtils = require('./createMessage')

module.exports = {

  updateLastMessageFlag:(chain,excludeMessage)=>{
    return admin.firestore().collection('PERRINNMessages').where('chain','==',chain).where('lastMessage','==',true).get().then(messages=>{
      var batch = admin.firestore().batch();
      messages.forEach(message=>{
        if(message.id!=excludeMessage)batch.update(admin.firestore().collection('PERRINNMessages').doc(message.id),{lastMessage:false});
      });
      return batch.commit();
    }).catch(error=>{
      console.log(error);
    });
  },

  writeMessageChainData:(user,message)=>{
    return admin.firestore().runTransaction(function(transaction) {
      return transaction.get(admin.firestore().doc('PERRINNChain/'+user)).then(function(chain) {
        if (chain.exists) {
          if(chain.data().lock)return Promise.reject();
        }
        transaction.update(admin.firestore().doc('PERRINNChain/'+user),{lock:true},{create:true});
      });
    }).then(()=>{
      return admin.firestore().doc('PERRINNChain/'+user).get().then(chainObj=>{
        var batch = admin.firestore().batch();
        let previousMessage='none';
        let index=1;
        if (chainObj.data()!=undefined&&chainObj.data()!=null){
          previousMessage=chainObj.data().previousMessage?chainObj.data().previousMessage:'none';
          index=chainObj.data().previousIndex?Number(chainObj.data().previousIndex)+1:1;
        }
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.currentMessage":message},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.previousMessage":previousMessage},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.nextMessage":'none'},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.index":index},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.chain.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});
        return batch.commit().then(()=>{
          return 'done';
        });
      });
    }).catch(error=>{
      console.log(error);
    });
  },

  writeMessagingCostData:(user,message)=>{
    var batch = admin.firestore().batch();
    let amount=0;
    let amountRead=0;
    let amountWrite=0;
    let receiver='none';
    let reference='none';
    return admin.firestore().doc('appSettings/costs').get().then(costs=>{
      amountWrite=costs.data().messageWrite;
      amount=Math.round(Number(amountWrite)*100000)/100000;
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.amount":amount},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.amountWrite":amountWrite},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.receiver":receiver},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.reference":reference},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});
      return batch.commit().then(()=>{
        return 'done';
      }).catch(error=>{
        console.log(error);
      });
    });
  },

  writeMessageProcessData:(user,message,process)=>{
    var batch = admin.firestore().batch();
    let functionObj={none:'none'};
    let inputs={none:'none'};
    let inputsComplete=false;
    if(process!=undefined&&process!=null){
      if(process.inputsComplete){
        functionObj=process.function;
        if(process.inputs!=undefined) inputs=process.inputs;
        inputsComplete=process.inputsComplete;
      }
    }
    return processUtils.executeProcess(user,functionObj,inputs).then(result=>{
      if (result==undefined) result='undefined';
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.function":functionObj},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.inputs":inputs},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.inputsComplete":inputsComplete},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.result":result},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});
      return batch.commit().then(()=>{
        return 'done';
      });
    }).catch(error=>{
      console.log('writeMessageProcessData: '+error);
    });
  },

  writeMessageTransactionOutData:(user,message,process)=>{
    var batch = admin.firestore().batch();
    let amount=0;
    let receiver='none';
    let receiverName='';
    let receiverFamilyName='';
    let receiverImageUrlThumb='';
    let receiverMessage='none';
    let reference='none';
    let inputCheck=false;
    if(process!=undefined&&process!=null){
      if(process.function!=undefined&&process.function!=null){
        if(process.function.name=='transactionOut'){
          if(checkTransactionInputs(user,process.inputs)) {
            amount=process.inputs.amount;
            receiver=process.inputs.receiver;
            receiverName=process.inputs.receiverName;
            receiverFamilyName=process.inputs.receiverFamilyName;
            reference=process.inputs.reference;
            inputCheck=true;
          }
        }
      }
    }
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.amount":amount},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiver":receiver},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiverName":receiverName},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiverFamilyName":receiverFamilyName},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiverImageUrlThumb":receiverImageUrlThumb},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.receiverMessage":receiverMessage},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.reference":reference},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.inputCheck":inputCheck},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.process.result":'done'},{create:true});
    return batch.commit().then(()=>{
      return 'done';
    }).catch(error=>{
      console.log(error);
    });
  },

  writeMessageTransactionInData:(user,message,messageData)=>{
    var batch = admin.firestore().batch();
    let amount=0;
    let reference='none';
    let donorCheck=false;
    let donor='none';
    let donorName='';
    let donorFamilyName='';
    let donorImageUrlThumb='';
    if(messageData.PERRINN!=undefined){
      let transactionInObj=messageData.PERRINN.transactionIn;
      if(transactionInObj!=undefined&&transactionInObj!=null){
        if(transactionInObj.donor!=undefined&&transactionInObj.donor!=null){
          donor=transactionInObj.donor;
          donorName=transactionInObj.donorName;
          donorFamilyName=transactionInObj.donorFamilyName;
          donorImageUrlThumb=transactionInObj.donorImageUrlThumb;
          amount=transactionInObj.amount;
          reference=transactionInObj.reference;
          donorCheck=true;
        }
      }
    }
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.amount":amount},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.donor":donor},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.donorName":donorName},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.donorFamilyName":donorFamilyName},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.donorImageUrlThumb":donorImageUrlThumb},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.reference":reference},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});
    batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.donorCheck":donorCheck},{create:true});
    return batch.commit().then(()=>{
      return 'done';
    }).catch(error=>{
      console.log(error);
    });
  },

  writeMessageWalletData:(user,message)=>{
    return admin.firestore().doc('PERRINNMessages/'+message).get().then(messageObj=>{
      return admin.firestore().doc('PERRINNMessages/'+messageObj.data().PERRINN.chain.previousMessage).get().then(previousMessageObj=>{
        var batch=admin.firestore().batch();
        var previousBalance=0;
        if(previousMessageObj.data()!=undefined&&previousMessageObj.data()!=null){
          if(previousMessageObj.data().PERRINN!=undefined&&previousMessageObj.data().PERRINN!=null){
            if(previousMessageObj.data().PERRINN.wallet!=undefined&&previousMessageObj.data().PERRINN.wallet!=null){
              previousBalance=previousMessageObj.data().PERRINN.wallet.balance;
            }
          }
        }
        var balance=previousBalance;
        if(messageObj.data().PERRINN.messagingCost.amount>0){
          balance=Math.round((Number(balance)-Number(messageObj.data().PERRINN.messagingCost.amount))*100000)/100000;
          batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.status":'complete'},{create:true});
        } else {
          batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.status":'none'},{create:true});
        }
        if(messageObj.data().PERRINN.transactionOut.inputCheck){
          balance=Math.round((Number(balance)-Number(messageObj.data().PERRINN.transactionOut.amount))*100000)/100000;
          batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.status":'complete'},{create:true});
        } else {
          batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.status":'none'},{create:true});
        }
        if(messageObj.data().PERRINN.transactionIn.donorCheck){
          balance=Math.round((Number(balance)+Number(messageObj.data().PERRINN.transactionIn.amount))*100000)/100000;
        }
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.wallet.previousBalance":previousBalance},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.wallet.amount":Math.round((balance-previousBalance)*100000)/100000},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.wallet.balance":balance},{create:true});
        batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.wallet.timestamp":admin.firestore.FieldValue.serverTimestamp()},{create:true});
        return batch.commit().then(()=>{
          return 'done';
        });
      });
    }).catch(error=>{
      console.log(error);
    });
  },

  writeMessageAtomicData:(user,message)=>{
    return admin.firestore().doc('PERRINNMessages/'+message).get().then(messageObj=>{
      var batch=admin.firestore().batch();
      let previousMessage=messageObj.data().PERRINN.chain.previousMessage;
      let index=messageObj.data().PERRINN.chain.index;
      let balance=messageObj.data().PERRINN.wallet.balance;
      let messagingCostProcessed=messageObj.data().PERRINN.messagingCost.status=='complete'?true:false;
      let transactionOutProcessed=messageObj.data().PERRINN.transactionOut.status=='complete'?true:false;
      let transactionInProcessed=messageObj.data().PERRINN.transactionIn.donorCheck?true:false;
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.dataWrite":'complete'},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.timestampEnd":admin.firestore.FieldValue.serverTimestamp()},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.messagingCost.processed":messagingCostProcessed},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionOut.processed":transactionOutProcessed},{create:true});
      batch.update(admin.firestore().doc('PERRINNMessages/'+message),{"PERRINN.transactionIn.processed":transactionInProcessed},{create:true});
      if(previousMessage!='none')batch.update(admin.firestore().doc('PERRINNMessages/'+previousMessage),{"PERRINN.chain.nextMessage":message},{create:true});
      batch.update(admin.firestore().doc('PERRINNChain/'+user),{previousMessage:message},{create:true});
      batch.update(admin.firestore().doc('PERRINNChain/'+user),{previousIndex:index},{create:true});
      batch.update(admin.firestore().doc('PERRINNTeams/'+user),{previousMessage:message},{create:true});
      batch.update(admin.firestore().doc('PERRINNTeams/'+user),{lastMessageBalance:balance},{create:true});
      batch.update(admin.firestore().doc('PERRINNTeams/'+user),{previousIndex:index},{create:true});
      return batch.commit().then(()=>{
        return 'done';
      });
    }).catch(error=>{
      console.log(error);
    });
  },

  writeMessageTransactionReceiverData:(user,message)=>{
    return admin.firestore().doc('PERRINNMessages/'+message).get().then(messageObj=>{
      if(messageObj.data().PERRINN.transactionOut.processed){
        let sender='-L7jqFf8OuGlZrfEK6dT';
        let receiverMessageObj={
          user:messageObj.data().PERRINN.transactionOut.receiver,
          text:messageObj.data().PERRINN.transactionOut.amount+" COINS received, reference: "+messageObj.data().PERRINN.transactionOut.reference,
          chain:messageObj.data().chain,
          chatSubject:messageObj.data().chatSubject,
          recipientList:messageObj.data().recipientList,
          PERRINN:{
            transactionIn:{
              donor:user,
              donorName:messageObj.data().name,
              donorFamilyName:messageObj.data().familyName,
              donorImageUrlThumb:messageObj.data().imageUrlThumbUser,
              amount:messageObj.data().PERRINN.transactionOut.amount,
              reference:messageObj.data().PERRINN.transactionOut.reference
            }
          }
        };
        return createMessageUtils.createMessageAFS(receiverMessageObj).then(()=>{
          return 'done';
        });
      }
    }).catch(error=>{
      console.log(error);
    });
  }

}

function checkTransactionInputs (user,inputs) {
  if(inputs.amount>0&&inputs.amount<=100000){
    if(inputs.reference!=''){
      return true;
    }
  }
  return false;
}
