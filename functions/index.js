const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const stripe = require('stripe')(functions.config().stripe.token);

function updateKeyValue (user,team,ref,key,value) {
  return admin.database().ref('PERRINNTeams/'+team).once('value').then((PERRINNTeam)=>{
    if (ref=="PERRINNUsers/"){
      ref=ref+user;
    }
    if (ref=="PERRINNTeams/"){
      if (PERRINNTeam.val().leadersCount>0&&!PERRINNTeam.child('leaders').child(user).val()) {
        createMessage (team,"PERRINN","You need to be team leader to do that.","","warning","","");
        return;
      }
      ref=ref+team;
    }
    return admin.database().ref(ref).child(key).once('value').then((currentValue)=>{
      if (!ref||!key||!value) {
        createMessage (team,"PERRINN",key+" update didn't work because an input was missing.","","warning","","");
        return;
      }
      if (currentValue.val()==value) {
        createMessage (team,"PERRINN",key+" unchanged: "+value,"","confirmation","","");
        return;
      } else {
        return admin.database().ref(ref).update({
          [key]:value,
        }).then(()=>{
          return value;
        });
      }
    });
  }).catch(error=>{
    console.log("error updateKeyValue:"+error);
  });
}

function addListKeyValue (user,team,ref,list,key,value,maxCount) {
  return admin.database().ref('PERRINNTeams/'+team).once('value').then((PERRINNTeam)=>{
    if (ref=="PERRINNUsers/"){
      ref=ref+user;
    }
    if (ref=="PERRINNTeams/"){
      if (PERRINNTeam.val().leadersCount>0&&!PERRINNTeam.child('leaders').child(user).val()) {
        createMessage (team,"PERRINN","You need to be team leader to do that.","","warning","","");
        return;
      }
      ref=ref+team;
    }
    const counter=list+"Count";
    return admin.database().ref(ref).child(list).once('value').then((currentList)=>{
      if (!ref||!list||!key||!maxCount) {
        createMessage (team,"PERRINN",list+" addition didn't work because an input was missing.","","warning","","");
        return;
      }
      if (currentList.child(key).val()) {
        createMessage (team,"PERRINN","Already in "+list,"","warning","","");
        return;
      }
      if (currentList.numChildren()>=maxCount) {
        createMessage (team,"PERRINN","Maximum number reached for "+list+" ("+maxCount+")","","warning","","");
        return;
      }
      return admin.database().ref(ref).child(list).update({
        [key]:value,
      }).then(()=>{
        return admin.database().ref(ref).update({
          [counter]:currentList.numChildren()+1,
        }).then(()=>{
          return key;
        });
      });
    });
  });
}

function removeListKey (ref,list,key) {
  const counter=list+"Count";
  return admin.database().ref(ref).child(list).once('value').then((currentList)=>{
    if (!ref||!list||!key) {
      return;
    }
    if (!currentList.child(key).val()) {
      return;
    }
    return admin.database().ref(ref).child(list).child(key).remove().then(()=>{
      return admin.database().ref(ref).update({
        [counter]:currentList.numChildren()-1,
      }).then(()=>{
        return key;
      });
    });
  });
}

function createMessage (team, user, text, image, action, linkTeam, linkUser) {
  const now = Date.now();
  return admin.database().ref('teamMessages/'+team).push({
    timestamp:now,
    text:text,
    user:user,
    image:image,
    action:action,
    linkTeam:linkTeam,
    linkUser:linkUser,
  }).then(()=>{
    return admin.database().ref('teamActivities/'+team).update({
      lastMessageTimestamp:now,
      lastMessageText:text,
      lastMessageUser:user,
    });
  });
}

function createTransaction (amount, sender, receiver, user, reference) {
  return admin.database().ref('PERRINNTeams/'+sender+'/leaders/'+user).once('value').then((leader)=>{
    return admin.database().ref('PERRINNTeams/'+receiver).child('name').once('value').then((receiverName)=>{
      if (receiverName.val()==null) {
        createMessage (sender,"PERRINN","Transaction cancelled: Receiver team doesn't exist","","warning","","");
        return;
      }
      if (!leader.val()&&user!="PERRINN") {
        createMessage (sender,"PERRINN","Transaction cancelled: You need to be leader to send COINS","","warning","","");
        return;
      }
      if (amount<=0||amount>10) {
        createMessage (sender,"PERRINN","Transaction cancelled: Amount has to be between 0 and 10","","warning","","");
        return;
      }
      if (sender==receiver) {
        createMessage (sender,"Transaction cancelled: You cannot send COINS to this team","","warning","","");
        return;
      }
      const now = Date.now();
      return createTransactionHalf (-amount,sender,receiver,user,reference,now).then((result)=>{
        if (result.committed&&result.snapshot.val()>=0){
          createTransactionHalf (amount,receiver,sender,user,reference,now);
          if (user!="PERRINN") {
            createMessage (sender,"PERRINN","You have sent "+amount+" COINS to:","","confirmation",receiver,"");
            createMessage (receiver,"PERRINN","You have received "+amount+" COINS from:","","confirmation",sender,"");
            admin.database().ref('PERRINNUsers/'+user).child('transactionCount').transaction((transactionCount)=>{
              if (transactionCount==null) {
                return 1;
              } else {
                return transactionCount+1;
              }
            });
          }
          return 1;
        } else {
          if (result.committed&&result.snapshot.val()<0){
            createTransactionHalf (amount,sender,receiver,user,reference+" (rejected)",now).then(()=>{
              return;
            });
            createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","COIN balance low.","","warning",sender,"");
          } else {
            return;
          }
        }
      });
    }).catch(()=>{
      createMessage (sender,"PERRINN","Transaction cancelled: Receiver team doesn't exist","","warning","","");
      return;
    });
  }).catch(()=>{
    createMessage (sender,"PERRINN","Transaction cancelled: One of these details was not valid: amount, receiver or reference","","warning","","");
    return;
  });
}

function createTransactionHalf (amount, team, otherTeam, user, reference, timestamp) {
  return admin.database().ref('PERRINNTeamBalance/'+team).child('balance').once('value').then((balanceNullCheck)=> {
    if (balanceNullCheck.val()===null) {
      admin.database().ref('PERRINNTeamBalance/'+team).update({
        balance:0,
      });
    }
    return admin.database().ref('PERRINNTeamBalance/'+team).child('balance').transaction(function(balance) {
      return Number(balance)+Number(amount);
    }, function(error, committed, balance) {
      if (error) {
        createMessage (team,"PERRINN","Transaction error, we will be in touch shortly","","warning","","");
        createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","Transaction error reference:","","warning",team,user);
      } else if (!committed) {
      } else {
        admin.database().ref('PERRINNTeamBalance/'+team).update({balanceNegative:-balance.val()});
        admin.database().ref('PERRINNTeamTransactions/'+team).push({
          amount: amount,
          balance: balance.val(),
          otherTeam: otherTeam,
          reference: reference,
          requestTimestamp: timestamp,
          timestamp:admin.database.ServerValue.TIMESTAMP,
          timestampNegative:-timestamp,
          user: user,
        });
      }
    });
  });
}

function createTeam(user,team,name,photoURL) {
  const now = Date.now();
  admin.database().ref('PERRINNTeams/'+team).update({
    createdTimestamp:now,
  });
  updateKeyValue (user,team,'PERRINNTeams/',"name",name);
  updateKeyValue (user,team,'PERRINNTeams/',"photoURL",photoURL);
  addListKeyValue(user,team,'PERRINNTeams/'+team,"leaders",user,true,2);
  admin.database().ref('userTeams/'+user+'/'+team).update({
    following:true,
    lastChatVisitTimestamp:now,
    lastChatVisitTimestampNegative:-1*now,
  });
  return team;
}

function createUser(user,team,firstName,lastName,photoURL) {
  const now = Date.now();
  admin.database().ref('PERRINNUsers/'+user).update({
    createdTimestamp:now,
  });
  updateKeyValue (user,team,'PERRINNUsers/',"firstName",firstName);
  updateKeyValue (user,team,'PERRINNUsers/',"lastName",lastName);
  updateKeyValue (user,team,'PERRINNUsers/',"photoURL",photoURL);
  return user;
}

function scanService (service,message,team) {
  if(service.child('exemptions').child(message.user).val()==null) {
    var serviceRegex = new RegExp(service.val().regex,"i");
    if (message.text.match(serviceRegex)) {
      if (service.val().message) {
        createMessage(
          team,
          service.child('message').val().user?service.child('message').val().user:"PERRINN",
          service.child('message').val().text,
          service.child('message').val().image?service.child('message').val().image:"",
          service.child('message').val().action?service.child('message').val().action:"process",
          service.child('message').val().linkTeam?service.child('message').val().linkTeam:"",
          service.child('message').val().linkUser?service.child('message').val().linkUser:""
        );
      }
      if (service.val().process) {
        admin.database().ref('PERRINNTeamServices/'+team+'/currentProcess').update({
          service:service.key,
          step:1,
        }).then(()=>{
          performProcessStep(message.user,team);
        });
      }
      if (service.val().serviceCost) {
        createTransaction (
          service.child('serviceCost').val().amount,
          team,
          service.child('serviceCost').val().receiver,
          "PERRINN",
          service.child('serviceCost').val().reference
        );
      }
    } else {
      admin.database().ref('/PERRINNTeamServices/'+team+'/currentProcess').once('value').then(currentProcess => {
        if (service.key==currentProcess.val().service) {
          if (service.child('process').child(currentProcess.val().step).val().input) {
            var inputRegex = new RegExp(service.child('process').child(currentProcess.val().step).child('input').val().regex,"i");
            var value=message.text.match(inputRegex);
            if (value) {
              admin.database().ref('PERRINNTeamServices/'+team+'/currentProcess').child('step').transaction((step)=>{
                return step+1;
              }).then(()=>{
                performProcessStep(message.user,team);
              });
              var variable=service.child('process').child(currentProcess.val().step).child('input').val().variable;
              if (variable) {
                var valueString=value[0];
                if (service.child('process').child(currentProcess.val().step).child('input').val().toLowerCase) {
                  valueString=valueString.toLowerCase();
                }
                if (service.child('process').child(currentProcess.val().step).child('input').val().toUpperCase) {
                  valueString=valueString.toUpperCase();
                }
                admin.database().ref('PERRINNTeamServices/'+team+'/inputs').update({
                  [variable]:valueString,
                }).then(()=>{
                  return;
                });
              }
            } else {
              clearCurrentProcess(team);
              createMessage (team,"PERRINN","Bye.","","process","","");
            }
          }
        }
      }).catch(error=>{
        console.log("error 123:"+error)
      });
    }
  }
}

function performProcessStep(user,team) {
  return admin.database().ref('/PERRINNTeamServices/'+team+'/currentProcess').once('value').then(currentProcess => {
    admin.database().ref('appSettings/PERRINNServices/'+currentProcess.val().service+'/process/'+currentProcess.val().step).once('value').then(processStep => {
      if (processStep.val().message) {
        admin.database().ref('PERRINNTeamServices/'+team+'/inputs').once('value').then(inputs => {
          var text='';
          if (processStep.child('message').child('listInputs').val()) {
            inputs.forEach((input)=>{
              text=text+input.key+':'+input.val()+', ';
            });
          }
          text=text+processStep.child('message').val().text;
          createMessage(
            team,
            processStep.child('message').val().user?processStep.child('message').val().user:"PERRINN",
            text,
            processStep.child('message').val().image?processStep.child('message').val().image:"",
            processStep.child('message').val().action?processStep.child('message').val().action:"process",
            processStep.child('message').val().linkTeam?processStep.child('message').val().linkTeam:"",
            processStep.child('message').val().linkUser?processStep.child('message').val().linkUser:""
          );
        });
      }
      if (processStep.val().transaction) {
        admin.database().ref('PERRINNTeamServices/'+team+'/inputs').once('value').then(inputs => {
          createTransaction (
            inputs.val().amount,
            team,
            inputs.val().receiver,
            user,
            inputs.val().reference
          );
          clearCurrentProcess(team);
        });
      }
      if (processStep.val().updateKeyValue) {
        admin.database().ref('PERRINNTeamServices/'+team+'/inputs').once('value').then(inputs => {
          updateKeyValue (
            user,
            team,
            processStep.child('updateKeyValue').val().ref,
            processStep.child('updateKeyValue').val().key,
            inputs.child(processStep.child('updateKeyValue').val().value).val()
          );
          clearCurrentProcess(team);
        });
      }
      if (processStep.val().addListKeyValue) {
        admin.database().ref('PERRINNTeamServices/'+team+'/inputs').once('value').then(inputs => {
          addListKeyValue (
            user,
            team,
            processStep.child('addListKeyValue').val().ref,
            processStep.child('addListKeyValue').val().list,
            inputs.child(processStep.child('addListKeyValue').val().key).val(),
            true,
            processStep.child('addListKeyValue').val().maxCount
          );
          clearCurrentProcess(team);
        });
      }
      if (processStep.val().createTeam) {
        var newTeam = admin.database().ref('ids/').push(true).key;
        admin.database().ref('PERRINNTeamServices/'+team+'/inputs').once('value').then(inputs => {
          createTeam (
            user,
            newTeam,
            inputs.child('name').val(),
            inputs.child('photoURL').val()
          );
          clearCurrentProcess(team);
        });
      }
    }).catch(error=>{
      console.log("error 456:"+error);
    });
  });
}

function clearCurrentProcess(team){
  return admin.database().ref('PERRINNTeamServices/'+team+'/inputs').remove().then(()=>{
    return admin.database().ref('PERRINNTeamServices/'+team+'/currentProcess').update({
      service:"",
      step:0,
      user:"",
    }).then(()=>{
      return;
    });
  });
}

exports.createPERRINNTransactionOnPaymentComplete = functions.database.ref('/teamPayments/{user}/{chargeID}/response/outcome').onCreate(event => {
  const val = event.data.val();
  if (val.seller_message=="Payment complete.") {
    return admin.database().ref('teamPayments/'+event.params.user+'/'+event.params.chargeID).once('value').then(payment=>{
      return createTransaction (payment.val().amountCOINSPurchased, "-KptHjRmuHZGsubRJTWJ", payment.val().team, "PERRINN", "Payment reference: "+event.params.chargeID).then((result)=>{
        if (result) {
          return admin.database().ref('teamPayments/'+event.params.user+'/'+event.params.chargeID+'/PERRINNTransaction').update({
            message: "COINS have been transfered to your team wallet."
          });
        }
      });
    });
  }
});

exports.updateProjectLeader = functions.database.ref('/projectTeams').onWrite(event => {
  return admin.database().ref('projectTeams/').once('value').then(projects=>{
    projects.forEach(function(project){
      admin.database().ref('projectTeams/'+project.key).once('value').then(projectTeams=>{
        projectTeams.forEach(function(projectTeam){
          if (projectTeam.val().leader) {
            admin.database().ref('projects/'+project.key).update({leader:projectTeam.key});
          }
        });
      });
    });
  });
});

exports.newStripeCharge = functions.database.ref('/teamPayments/{user}/{chargeID}').onCreate(event => {
  const val = event.data.val();
  if (val === null || val.id || val.error) return null;
  const amount = val.amountCharge;
  const currency = val.currency;
  const source = val.source;
  const idempotency_key = event.params.id;
  let charge = {amount, currency, source};
  return stripe.charges.create(charge, {idempotency_key})
  .then(response => {
    return event.data.adminRef.child('response').set(response);
  }, error => {
    event.data.adminRef.child('error').update({type: error.type});
    return event.data.adminRef.child('error').update({message: error.message});
  });
});

exports.newUserProfile = functions.database.ref('/users/{user}/{editID}').onCreate(event => {
  const profile = event.data.val();
  return admin.database().ref('PERRINNUsers/'+event.params.user).once('value').then((currentProfile)=>{
    if (currentProfile.val()==null) {
      admin.database().ref('PERRINNUsers/'+event.params.user).update({
        createdTimestamp:admin.database.ServerValue.TIMESTAMP,
      });
    }
    if (profile.firstName) updateKeyValue(event.params.user,'-L7jqFf8OuGlZrfEK6dT','PERRINNUsers/'+event.params.user,"firstName",profile.firstName);
    if (profile.lastName) updateKeyValue(event.params.user,'-L7jqFf8OuGlZrfEK6dT','PERRINNUsers/'+event.params.user,"lastName",profile.lastName);
    if (profile.photoURL) updateKeyValue(event.params.user,'-L7jqFf8OuGlZrfEK6dT','PERRINNUsers/'+event.params.user,"photoURL",profile.photoURL);
    if (profile.personalTeam) updateKeyValue(event.params.user,'-L7jqFf8OuGlZrfEK6dT','PERRINNUsers/'+event.params.user,"personalTeam",profile.personalTeam);
  });
});

exports.newTeamProfile = functions.database.ref('/teams/{team}/{editID}').onCreate(event => {
  const profile = event.data.val();
  return admin.database().ref('PERRINNTeams/'+event.params.team).once('value').then((currentProfile)=>{
    if (currentProfile.val()==null) {
      admin.database().ref('PERRINNTeams/'+event.params.team).update({
        createdTimestamp:admin.database.ServerValue.TIMESTAMP,
      });
    }
    if(profile.name) updateKeyValue("",event.params.team,'PERRINNTeams/'+event.params.team,"name",profile.name);
    if(profile.photoURL) updateKeyValue("",event.params.team,'PERRINNTeams/'+event.params.team,"photoURL",profile.photoURL);
    if(profile.addLeader) addListKeyValue("",event.params.team,'PERRINNTeams/'+event.params.team,"leaders",profile.addLeader,true,2);
    if(profile.addMember) addListKeyValue("",event.params.team,'PERRINNTeams/'+event.params.team,"members",profile.addMember,true,6);
    if(profile.removeMember) removeListKey('PERRINNTeams/'+event.params.team,"members",profile.removeMember);
  });
});

exports.newMessage = functions.database.ref('/teamMessages/{team}/{message}').onCreate(event => {
  const message = event.data.val();
  admin.database().ref('appSettings/PERRINNServices/').once('value').then(services => {
    services.forEach((service)=>{
      scanService(service,message,event.params.team);
    })
  });
  admin.database().ref('PERRINNUsers/'+message.user).child('messageCount').transaction((messageCount)=>{
    if (messageCount==null) {
      return 1;
    } else {
      return messageCount+1;
    }
  });
});

exports.userCreation = functions.database.ref('/PERRINNUsers/{user}/createdTimestamp').onCreate(event => {
  createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","New user:","","","",event.params.user);
});

exports.userFirstNameUpdate = functions.database.ref('/PERRINNUsers/{user}/firstName').onUpdate(event => {
  admin.database().ref('PERRINNUsers/'+event.params.user).child('personalTeam').once('value').then((personalTeam)=>{
    createMessage (personalTeam.val(),"PERRINN","Your first name is: "+event.data.val(),"","confirmation","","");
  });
});

exports.userLastNameUpdate = functions.database.ref('/PERRINNUsers/{user}/lastName').onUpdate(event => {
  admin.database().ref('PERRINNUsers/'+event.params.user).child('personalTeam').once('value').then((personalTeam)=>{
    createMessage (personalTeam.val(),"PERRINN","Your last name is: "+event.data.val(),"","confirmation","","");
  });
});

exports.userPhotoURLUpdate = functions.database.ref('/PERRINNUsers/{user}/photoURL').onUpdate(event => {
  admin.database().ref('PERRINNUsers/'+event.params.user).child('personalTeam').once('value').then((personalTeam)=>{
    createMessage (personalTeam.val(),"PERRINN","Your photo is updated."+event.data.val(),"","confirmation","","");
  });
});

exports.userPersonalTeamUpdate = functions.database.ref('/PERRINNUsers/{user}/personalTeam').onUpdate(event => {
  createMessage (event.data.val(),"PERRINN","This is your personal team.","","confirmation","","");
});

exports.teamCreation = functions.database.ref('/PERRINNteams/{team}/createdTimestamp').onCreate(event => {
  createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","New team:","","",event.params.team,"");
});

exports.teamNameUpdate = functions.database.ref('/PERRINNTeams/{team}/name').onUpdate(event => {
  createMessage (event.params.team,"PERRINN","Team name: "+event.data.val(),"","confirmation","","");
});

exports.teamPhotoURLUpdate = functions.database.ref('/PERRINNTeams/{team}/photoURL').onUpdate(event => {
  createMessage (event.params.team,"PERRINN","Team photo updated.","","confirmation","","");
});

exports.teamMemberWrite = functions.database.ref('/PERRINNTeams/{team}/members/{member}').onWrite(event => {
  if (event.data.exists()) {
    createMessage (event.params.team,"PERRINN","New team member:","","add","",event.params.member);
    admin.database().ref('PERRINNUsers/'+event.params.member).child('personalTeam').once('value').then((personalTeam)=>{
      createMessage (personalTeam.val(),"PERRINN","You are a member of:","","add",event.params.team,"");
    });
  }
  if (!event.data.exists()) {
    createMessage (event.params.team,"PERRINN","Team member removed:","","remove","",event.params.member);
    admin.database().ref('PERRINNUsers/'+event.params.member).child('personalTeam').once('value').then((personalTeam)=>{
      createMessage (personalTeam.val(),"PERRINN","You are not anymore a member of:","","remove",event.params.team,"");
    });
  }
});

exports.teamLeaderWrite = functions.database.ref('/PERRINNTeams/{team}/leaders/{leader}').onWrite(event => {
  if (event.data.exists()) {
    createMessage (event.params.team,"PERRINN","New team leader:","","add","",event.params.leader);
    admin.database().ref('PERRINNUsers/'+event.params.leader).child('personalTeam').once('value').then((personalTeam)=>{
      createMessage (personalTeam.val(),"PERRINN","You are leader of:","","confirmation",event.params.team,"");
    });
  }
  if (!event.data.exists()) {
    createMessage (event.params.team,"PERRINN","Team leader removed:","","remove","",event.params.leader);
    admin.database().ref('PERRINNUsers/'+event.params.leader).child('personalTeam').once('value').then((personalTeam)=>{
      createMessage (personalTeam.val(),"PERRINN","You are not anymore leader of:","","remove",event.params.team,"");
    });
  }
});

exports.returnCOINS = functions.database.ref('tot').onCreate(event => {
  return admin.database().ref('PERRINNTeamBalance/').once('value').then(teams=>{
    var totalAmount = teams.child('-L6XIigvAphrJr5w2jbf').val().balance;
    teams.forEach(function(team){
      var amount = totalAmount/1000000*team.val().balance;
      if (team.key!="-KptHjRmuHZGsubRJTWJ") {
        createTransaction (amount,"-L6XIigvAphrJr5w2jbf",team.key,"PERRINN","return");
      }
    });
  });
});

exports.checkUsersWithNoPersonalTeam = functions.database.ref('tot').onCreate(event => {
  return admin.database().ref('PERRINNUsers/').once('value').then(users=>{
    users.forEach(function(user){
      if (user.val().personalTeam==null) {
        console.log(user.key);
      }
    });
  });
});
