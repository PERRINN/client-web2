const admin = require('firebase-admin')
const emailUtils = require('./email')
const createMessageUtils = require('./createMessage')
const googleUtils = require('./google')
const onshapeUtils = require('./onshape')

module.exports = {

  verifyMessage:async(messageId,messageData)=>{

    const user=messageData.user
    const now=Date.now()
    var batch = admin.firestore().batch()

    try{

      //user chain
      let userChain={}
      let userPreviousMessageData={}
      userChain.currentMessage=messageId
      userChain.nextMessage='none'
      userChain.previousMessage='none'
      userChain.index=1
      const lastUserMessages=await admin.firestore().collection('PERRINNMessages').where('user','==',user).where('verified','==',true).orderBy('serverTimestamp','desc').limit(2).get()
      lastUserMessages.forEach(message=>{
        if(message.id!=messageId&&userChain.previousMessage=='none'){
          userChain.previousMessage=message.id
          userPreviousMessageData=message.data()
          userChain.index=((userPreviousMessageData.userChain||{}).index+1)||1
          batch.update(admin.firestore().doc('PERRINNMessages/'+userChain.previousMessage),{"userChain.nextMessage":messageId||null},{create:true})
        }
      })

      //chat chain
      let chatPreviousMessageData={}
      const chatPreviousMessages=await admin.firestore().collection('PERRINNMessages').where('chain','==',messageData.chain).where('lastMessage','==',true).get()
      let chatLastMessage=true
      chatPreviousMessages.forEach(message=>{
        if(message.data().serverTimestamp<messageData.serverTimestamp&&messageId!=message.id){
          batch.update(admin.firestore().doc('PERRINNMessages/'+message.id),{lastMessage:false})
          chatPreviousMessageData=message.data()
        } else if (message.data().serverTimestamp>messageData.serverTimestamp&&messageId!=message.id) {
          chatLastMessage=false
        }
      })
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{lastMessage:chatLastMessage})

      //message recipientList (merge with user, trasnactionOut receiver, previous chat list and remove duplicates and remove undefined)
      messageData.recipientList=[user].concat([(messageData.transactionOut||{}).receiver]||[]).concat(messageData.recipientList||[]).concat(chatPreviousMessageData.recipientList||[])
      messageData.recipientList=messageData.recipientList.filter((item,pos)=>messageData.recipientList.indexOf(item)===pos)
      messageData.recipientList.indexOf('undefined')!=-1&&messageData.recipientList.splice(messageData.recipientList.indexOf('undefined'),1)
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{recipientList:messageData.recipientList||[]},{create:true})

      //message recipients data
      var reads=[]
      messageData.recipientList.forEach(recipient=>{
        if(recipient!=user)reads.push(admin.firestore().collection('PERRINNMessages').where('user','==',recipient||null).where('verified','==',true).orderBy('serverTimestamp','desc').limit(1).get())
      })
      const recipientsObj=await Promise.all(reads)
      recipientsObj.forEach((recipient)=>{
        if(recipient.docs[0]!=undefined)batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{[`recipients.${recipient.docs[0].data().user}.name`]:(recipient.docs[0].data()||{}).name||null},{create:true})
        if(recipient.docs[0]!=undefined)batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{[`recipients.${recipient.docs[0].data().user}.familyName`]:(recipient.docs[0].data()||{}).familyName||null},{create:true})
        if(recipient.docs[0]!=undefined)batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{[`recipients.${recipient.docs[0].data().user}.imageUrlThumb`]:(recipient.docs[0].data()||{}).imageUrlThumbUser||null},{create:true})
      })

      //messaging cost
      const costs=await admin.firestore().doc('appSettings/costs').get()
      let amountWrite=costs.data().messageWrite
      let amountMessaging=Math.round(Number(amountWrite)*100000)/100000
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"messagingCost.amount":amountMessaging||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"messagingCost.amountWrite":amountWrite||null},{create:true})

      //message transaction out receiver
      const transactionOutReceiverLastMessages=await admin.firestore().collection('PERRINNMessages').where('user','==',(messageData.transactionOut||{}).receiver||null).where('verified','==',true).orderBy('serverTimestamp','desc').limit(1).get()
      let transactionOutReceiverLastMessageData=(transactionOutReceiverLastMessages.docs[0]!=undefined)?(transactionOutReceiverLastMessages.docs[0]||{}).data():{}
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionOut.receiverName":transactionOutReceiverLastMessageData.name||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionOut.receiverFamilyName":transactionOutReceiverLastMessageData.familyName||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionOut.receiverImageUrlThumb":transactionOutReceiverLastMessageData.imageUrlThumbUser||null},{create:true})

      //message transaction in donor
      const transactionInDonorLastMessages=await admin.firestore().collection('PERRINNMessages').where('user','==',(messageData.transactionIn||{}).donor||null).where('verified','==',true).orderBy('serverTimestamp','desc').limit(1).get()
      let transactionInDonorLastMessageData=(transactionInDonorLastMessages.docs[0]!=undefined)?(transactionInDonorLastMessages.docs[0]||{}).data():{}
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionIn.donorName":transactionInDonorLastMessageData.name||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionIn.donorFamilyName":transactionInDonorLastMessageData.familyName||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionIn.donorImageUrlThumb":transactionInDonorLastMessageData.imageUrlThumbUser||null},{create:true})

      //message wallet
      let wallet={}
      wallet.previousBalance=((userPreviousMessageData.PERRINN||{}).wallet||{}).balance||0
      wallet.balance=wallet.previousBalance
      wallet.balance=Math.round((Number(wallet.balance)-Number(amountMessaging))*100000)/100000
      wallet.balance=Math.round((Number(wallet.balance)-Number((messageData.transactionOut||{}).amount||0))*100000)/100000
      wallet.balance=Math.round((Number(wallet.balance)+Number((messageData.transactionIn||{}).amount||0))*100000)/100000

      //email notifications
      if((messageData.PERRINN||{}).emailNotifications)batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.emailNotifications":messageData.recipientList},{create:true})

      //user data
      messageData.searchName=(messageData.name||userPreviousMessageData.name||'').toLowerCase()+' '+(messageData.familyName||userPreviousMessageData.familyName||'').toLowerCase()
      messageData.createdTimestamp=messageData.createdTimestamp||userPreviousMessageData.createdTimestamp||now
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{userEmail:messageData.userEmail||userPreviousMessageData.userEmail||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{name:messageData.name||userPreviousMessageData.name||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{familyName:messageData.familyName||userPreviousMessageData.familyName||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{userImageTimestamp:messageData.userImageTimestamp||userPreviousMessageData.userImageTimestamp||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{imageUrlThumbUser:messageData.imageUrlThumbUserLong||messageData.imageUrlThumbUser||userPreviousMessageData.imageUrlThumbUser||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{imageUrlMedium:messageData.imageUrlMediumLong||messageData.imageUrlMedium||userPreviousMessageData.imageUrlMedium||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{imageUrlOriginal:messageData.imageUrlOriginalLong||messageData.imageUrlOriginal||userPreviousMessageData.imageUrlOriginal||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{createdTimestamp:messageData.createdTimestamp},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{searchName:messageData.searchName},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{[`recipients.${user}.name`]:messageData.name||userPreviousMessageData.name||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{[`recipients.${user}.familyName`]:messageData.familyName||userPreviousMessageData.familyName||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{[`recipients.${user}.imageUrlThumb`]:messageData.imageUrlThumbUser||userPreviousMessageData.imageUrlThumbUser||null},{create:true})
      if (messageData.userEmail)admin.auth().updateUser(user,{email:messageData.userEmail})
      if (messageData.userEmail)googleUtils.joinPERRINNGoogleGroup(messageData.userEmail)
      if (messageData.userEmail)onshapeUtils.joinPERRINNOnshapeTeam(messageData.userEmail)
      if(messageData.createdTimestamp==now){
        let sender='-L7jqFf8OuGlZrfEK6dT'
        let messageObj={
          user:sender,
          text:"Welcome to PERRINN, we are happy to have you here with us! If you have any question please ask here. We will be happy to help.",
          chatSubject:'Welcome to PERRINN',
          recipientList:[sender,'QYm5NATKa6MGD87UpNZCTl6IolX2',user]
        }
        await createMessageUtils.createMessageAFS(messageObj)
      }

      //message transaction out receiver
      if((messageData.transactionOut||{}).receiver){
        createMessageUtils.createMessageAFS({
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
      membership.days=(now/1000/3600/24-(userPreviousMessageData.verifiedTimestamp||{}).seconds/3600/24)||0
      membership.daysTotal=((userPreviousMessageData.membership||{}).daysTotal||0)+membership.days
      membership.amount=membership.days*membership.dailyCost
      wallet.balance=Math.round((Number(wallet.balance)-Number(membership.amount))*100000)/100000

      //message chat Subject
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{chatSubject:messageData.chatSubject||chatPreviousMessageData.chatSubject||null},{create:true})

      //child topup
  //    if(userObj.data().lastMessageBalance<1&&(userObj.data().parents!={})){
  //      let parents=toolsUtils.objectToArray(userObj.data().parents)
  //      let sender=parents[0][0]
  //      let amount=5-userObj.data().lastMessageBalance
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
  //      }
  //      createMessageUtils.createMessageAFS(messageObj)


      //message objects
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{userChain:userChain},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{membership:membership},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.wallet":wallet},{create:true})

      //message verified
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{verified:true},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{verifiedTimestamp:admin.firestore.FieldValue.serverTimestamp()},{create:true})

      await batch.commit()

      return {
        user:user,
        userEmail:messageData.userEmail||userPreviousMessageData.userEmail||null,
        wallet:wallet
      }

    }
    catch(error){
      console.log('user '+user+' error '+error)
      emailUtils.sendErrorEmail(error)
      return admin.firestore().doc('PERRINNMessages/'+messageId).update({verified:false})
    }

  },

}
