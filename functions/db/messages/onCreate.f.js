const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const messageUtils = require('../../utils/message')
const createMessageUtils = require('../../utils/createMessage')
const customClaimsUtils = require('../../utils/customClaims')
const childTopUpUtils = require('../../utils/childTopUp')
const emailUtils = require('../../utils/email')

exports=module.exports=functions.firestore.document('PERRINNMessages/{message}').onCreate((data,context)=>{
  const messageData=data.data();
  let writeError=null;
  let lockedUserChain=false;
  return messageUtils.updateLastMessageFlag(messageData.chain,context.params.message)
  .then(()=>{
    return messageUtils.writeMessagingCostData(messageData.user,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write message cost';
      return null;
    }
    return messageUtils.writeMessageProcessData(messageData.user,context.params.message,messageData.process);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write process';
      return null;
    }
    return messageUtils.writeMessageTransactionOutData(messageData.user,context.params.message,messageData.process);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write transaction out';
      return null;
    }
    return messageUtils.writeMessageTransactionInData(messageData.user,context.params.message,messageData);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write transaction in';
      return null;
    }
    return messageUtils.writeMessageChainData(messageData.user,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write chain';
      return null;
    }
    lockedUserChain=true;
    return messageUtils.writeMessageWalletData(messageData.user,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write wallet';
      return null;
    }
    return messageUtils.writeMessageAtomicData(messageData.user,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write atomic data';
      return null;
    }
    return messageUtils.writeMessageTransactionReceiverData(messageData.user,context.params.message);
  }).then(()=>{
    return childTopUpUtils.performChildTopUp(messageData.user);
  }).then(()=>{
    return customClaimsUtils.setCustomClaims(messageData.user);
  }).then(()=>{
    if(lockedUserChain)return admin.firestore().doc('PERRINNChain/'+messageData.user).update({lock:admin.firestore.FieldValue.delete()});
    return null;
  }).then(()=>{
    if(writeError) return data.ref.update({
      "PERRINN.dataWrite":writeError
    });
  });
});
