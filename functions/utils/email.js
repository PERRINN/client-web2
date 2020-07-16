const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const functions = require('firebase-functions');

const sgMail = require('@sendgrid/mail');
const API_KEY=functions.config().sendgrid.key;
sgMail.setApiKey(API_KEY);

let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: 'nicolas@perrinn.com',
        pass: functions.config().email2.password
    }
});

module.exports = {

  sendNewMessageEmail:(dest)=>{
    return admin.auth().getUser(dest).then(function(userRecord) {
      var email=userRecord.toJSON().email;
      const mailOptions = {
        from: 'PERRINN <hello@perrinn.com>',
        to: email,
        subject: 'You have a new message',
        html: `
          <a  class=”link” href="https://www.perrinn.com" target="_blank" style="padding:20px;text-decoration:none;text-align:center;font-size:14px;margin:50px;color:white;background-color:#267cb5;cursor:pointer">Go to PERRINN.com</a>
        `
      };
      return transporter.sendMail(mailOptions)
      .then(result=>{
        return 'done';
      });
    }).catch(error=>{
      console.log(error);
    });
  },

  sendErrorEmail:(err)=>{
    var email='perrinnlimited@gmail.com';
    const mailOptions = {
      from: 'PERRINN <hello@perrinn.com>',
      to: email,
      subject: 'Backend error',
      html: `
        <a  class=”link” href="https://console.firebase.google.com/u/0/project/perrinn-d5fc1/functions/logs?severity=DEBUG" target="_blank" style="padding:20px;text-decoration:none;text-align:center;font-size:14px;margin:50px;color:white;background-color:#267cb5;cursor:pointer">Go to backend</a>
      `
    };
    return transporter.sendMail(mailOptions)
    .then(result=>{
      return 'done';
    }).catch(error=>{
      console.log(error);
    });
  },

  sendNewMessageEmailSendGrid:async(dest)=>{
    try{
      const userRecord=await admin.auth().getUser(dest)
      var email=userRecord.toJSON().email;
      const msg = {
        to:email,
        from:'PERRINN <hello@perrinn.com>',
        templateId:'d-deaed3c71d374faa8b3746cfb74c5097',
        dynamic_template_data:{
          messageCount:5,
        }
      }
      return sgMail.send(msg)
    }
    catch(error){
      console.log(error);
      return error
    }
  },

}
