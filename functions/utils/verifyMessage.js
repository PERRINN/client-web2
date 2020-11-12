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
      userChain.newDay=true
      userChain.newMonth=true
      const lastUserMessages=await admin.firestore().collection('PERRINNMessages').where('user','==',user).where('verified','==',true).orderBy('serverTimestamp','desc').limit(2).get()
      lastUserMessages.forEach(message=>{
        if(message.id!=messageId&&userChain.previousMessage=='none'){
          userChain.previousMessage=message.id
          userPreviousMessageData=message.data()
          userChain.index=((userPreviousMessageData.userChain||{}).index+1)||1
          userChain.newDay=Math.floor(now/86400000)!=Math.floor(((userPreviousMessageData.verifiedTimestamp||{}).seconds/3600/24)||0)
          userChain.newMonth=Math.floor(now/86400000/30)!=Math.floor(((userPreviousMessageData.verifiedTimestamp||{}).seconds/3600/24/30)||0)
          batch.update(admin.firestore().doc('PERRINNMessages/'+userChain.previousMessage),{"userChain.nextMessage":admin.firestore.FieldValue.arrayUnion(messageId)},{create:true})
        }
      })

      //user data
      let authEmail=''
      if(!(messageData.userEmail||userPreviousMessageData.userEmail||(user=='-L7jqFf8OuGlZrfEK6dT'))){
        const userRecord=await admin.auth().getUser(user)
        if(userRecord)authEmail=userRecord.toJSON().email
      }
      let userEmail=messageData.userEmail||userPreviousMessageData.userEmail||authEmail
      messageData.searchName=(messageData.name||userPreviousMessageData.name||'').toLowerCase()+' '+(messageData.familyName||userPreviousMessageData.familyName||'').toLowerCase()
      messageData.createdTimestamp=messageData.createdTimestamp||userPreviousMessageData.createdTimestamp||now
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{userEmail:userEmail||null},{create:true})
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
      if(messageData.chain==user)messageData.recipientList=[user]
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
        if(recipient.docs[0]!=undefined)batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{[`recipients.${recipient.docs[0].data().user}.unreadMessages`]:((chatPreviousMessageData.reads||{})[recipient.docs[0].data().user]||null)?1:(((((chatPreviousMessageData.recipients||{})[recipient.docs[0].data().user]||{}).unreadMessages||1)+1)||null)},{create:true})
      })

      //email notifications
      if((messageData.PERRINN||{}).emailNotifications)batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.emailNotifications":messageData.recipientList},{create:true})
      if((messageData.PERRINN||{}).emailNotifications)batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{emailNotifications:messageData.recipientList},{create:true})

      //messaging cost
      let messagingCost={}
      const costs=await admin.firestore().doc('appSettings/costs').get()
      messagingCost.amountWrite=costs.data().messageWrite||0
      messagingCost.amount=Math.round(Number(messagingCost.amountWrite)*100000)/100000
      messagingCost.amountWriteCummulate=((userPreviousMessageData.messagingCost||{}).amountWriteCummulate||0)+(messagingCost.amountWrite||0)

      //message transaction out receiver
      const transactionOutReceiverLastMessages=await admin.firestore().collection('PERRINNMessages').where('user','==',(messageData.transactionOut||{}).receiver||null).where('verified','==',true).orderBy('serverTimestamp','desc').limit(1).get()
      let transactionOutReceiverLastMessageData=(transactionOutReceiverLastMessages.docs[0]!=undefined)?(transactionOutReceiverLastMessages.docs[0]||{}).data():{}
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionOut.receiverName":transactionOutReceiverLastMessageData.name||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionOut.receiverFamilyName":transactionOutReceiverLastMessageData.familyName||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionOut.receiverImageUrlThumb":transactionOutReceiverLastMessageData.imageUrlThumbUser||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionOut.amountCummulate":Number((userPreviousMessageData.transactionOut||{}).amountCummulate||0)+Number((messageData.transactionOut||{}).amount||0)},{create:true})

      //message transaction in donor
      const transactionInDonorLastMessages=await admin.firestore().collection('PERRINNMessages').where('user','==',(messageData.transactionIn||{}).donor||null).where('verified','==',true).orderBy('serverTimestamp','desc').limit(1).get()
      let transactionInDonorLastMessageData=(transactionInDonorLastMessages.docs[0]!=undefined)?(transactionInDonorLastMessages.docs[0]||{}).data():{}
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionIn.donorName":transactionInDonorLastMessageData.name||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionIn.donorFamilyName":transactionInDonorLastMessageData.familyName||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionIn.donorImageUrlThumb":transactionInDonorLastMessageData.imageUrlThumbUser||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"transactionIn.amountCummulate":Number((userPreviousMessageData.transactionIn||{}).amountCummulate||0)+Number((messageData.transactionIn||{}).amount||0)},{create:true})

      //message wallet
      let wallet={}
      wallet.previousBalance=((userPreviousMessageData.PERRINN||{}).wallet||{}).balance||0
      wallet.balance=wallet.previousBalance
      wallet.balance=Math.round((Number(wallet.balance)-Number(messagingCost.amount))*100000)/100000
      wallet.balance=Math.round((Number(wallet.balance)-Number((messageData.transactionOut||{}).amount||0))*100000)/100000
      wallet.balance=Math.round((Number(wallet.balance)+Number((messageData.transactionIn||{}).amount||0))*100000)/100000
      wallet.balance=Math.max(0,wallet.balance)

      //interest
      let interest={}
      interest.rateYear=costs.data().interestRateYear
      interest.days=(now/1000/3600/24-(userPreviousMessageData.verifiedTimestamp||{}).seconds/3600/24)||0
      interest.amountBase=wallet.balance-(interest.days*costs.data().membershipDay/2)
      interest.amount=Math.max(0,interest.amountBase*(Math.exp(interest.rateYear/365*interest.days)-1))
      interest.amountCummulate=((userPreviousMessageData.interest||{}).amountCummulate||0)+interest.amount
      wallet.balance=Math.round((Number(wallet.balance)+Number(interest.amount||0))*100000)/100000

      //PERRINN membership
      let membership={}
      membership.dailyCost=costs.data().membershipDay
      if(wallet.balance>0){
        googleUtils.googleGroupMemberInsert(userEmail)
        onshapeUtils.onshapeTeamMemberPost(userEmail)
        membership.days=(now/1000/3600/24-(userPreviousMessageData.verifiedTimestamp||{}).seconds/3600/24)||0
        if((membership.days*membership.dailyCost)>wallet.balance)membership.days=wallet.balance/membership.dailyCost
      } else membership.days=0
      membership.daysTotal=((userPreviousMessageData.membership||{}).daysTotal||0)+membership.days
      membership.amount=membership.days*membership.dailyCost
      membership.amountCummulate=((userPreviousMessageData.membership||{}).amountCummulate||0)+membership.amount
      wallet.balance=Math.round((Number(wallet.balance)-Number(membership.amount||0))*100000)/100000

      //message transaction out receiver
      if((messageData.transactionOut||{}).receiver&&!(messageData.transactionOut||{}).receiverName){
        createMessageUtils.createMessageAFS({
          user:messageData.transactionOut.receiver,
          text:((messageData.transactionOut||{}).amount||0)+" COINS received",
          chain:messageData.chain,
          transactionIn:{
            donor:user,
            amount:(messageData.transactionOut||{}).amount||0
          }
        })
      }

      //message chat Subject
      if(messageData.chain==user)messageData.chatSubject='User records'
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{chatSubject:messageData.chatSubject||chatPreviousMessageData.chatSubject||null},{create:true})

      //message event
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{eventDate:messageData.eventDate||chatPreviousMessageData.eventDate||null},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{eventDescription:messageData.eventDescription||chatPreviousMessageData.eventDescription||null},{create:true})

      //message objects
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{userChain:userChain},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{messagingCost:messagingCost},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{membership:membership},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{interest:interest},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{wallet:wallet},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{"PERRINN.wallet":wallet},{create:true})

      //message verified
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{verified:true},{create:true})
      batch.update(admin.firestore().doc('PERRINNMessages/'+messageId),{verifiedTimestamp:admin.firestore.FieldValue.serverTimestamp()},{create:true})

      await batch.commit()

      return {
        user:user,
        userEmail:userEmail||null,
        wallet:wallet,
        membership:membership,
        messagingCost:messagingCost,
        interest:interest
      }

    }
    catch(error){
      console.log('user '+user+' error '+error)
      emailUtils.sendErrorEmail(error)
      return admin.firestore().doc('PERRINNMessages/'+messageId).update({verified:false})
    }

  },

}
