const functions = require('firebase-functions');
const admin = require('firebase-admin');
try { admin.initializeApp() } catch (e) {};

const sgMail = require('@sendgrid/mail');
const API_KEY=functions.config().sendgrid.key;
sgMail.setApiKey(API_KEY);

exports=module.exports=functions.database.ref('/toto').onCreate((data,context)=>{
  const msg = {
    to: 'perrinnlimited@gmail.com',
    from: 'PERRINN <hello@perrinn.com>',
    templateId:'d-deaed3c71d374faa8b3746cfb74c5097',
    dynamic_template_data:{
      messageCount:5,
    },
  };
  return sgMail.send(msg).then(result=>{
    return 'done';
  }).catch(error=>{
    console.log(error);
  });
});
