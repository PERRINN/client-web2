const admin = require('firebase-admin')
const processUtils = require('./process')
const createMessageUtils = require('./createMessage')
const emailUtils = require('../utils/email')

module.exports = {

  writeMessageTransactionReceiverData:(user,message)=>{
    return admin.firestore().doc('PERRINNMessages/'+message).get().then(messageObj=>{
      if(messageObj.data().PERRINN.transactionOut.amount>0){
        let sender='-L7jqFf8OuGlZrfEK6dT';
        let receiverMessageObj={
          domain:messageObj.data().domain,
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
      emailUtils.sendErrorEmail(error);
    });
  }
}
