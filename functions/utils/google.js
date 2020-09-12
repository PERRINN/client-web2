const admin = require('firebase-admin')
const createMessageUtils = require('./createMessage')
const {google} = require('googleapis')
const emailUtils = require('../utils/email')

module.exports = {

  joinPERRINNGoogleGroup:(email)=>{
    var SERVICE_ACCOUNT_EMAIL = 'perrinn-service-account@perrinn.iam.gserviceaccount.com'
    var SERVICE_ACCOUNT_KEY_FILE = './perrinn-73e7f16c6042.json'
    const jwt = new google.auth.JWT(
        SERVICE_ACCOUNT_EMAIL,
        SERVICE_ACCOUNT_KEY_FILE,
        null,
        ['https://www.googleapis.com/auth/admin.directory.group'],
        'nicolas@perrinn.com'
    )
    const googleAdmin = google.admin({
      version: 'directory_v1',
      jwt,
    })
    return jwt.authorize().then(() => {
      return googleAdmin.members.insert({
        auth: jwt,
        groupKey: "perrinn-google-group@perrinn.com",
        requestBody:{
          email:email,
          role:'MEMBER'
        }
      })
    }).catch(error=>{
      console.log('email '+email+' error '+error)
      return
    })
  },

  getPERRINNGoogleGroup:()=>{
    var SERVICE_ACCOUNT_EMAIL = 'perrinn-service-account@perrinn.iam.gserviceaccount.com'
    var SERVICE_ACCOUNT_KEY_FILE = './perrinn-73e7f16c6042.json'
    const jwt = new google.auth.JWT(
        SERVICE_ACCOUNT_EMAIL,
        SERVICE_ACCOUNT_KEY_FILE,
        null,
        ['https://www.googleapis.com/auth/admin.directory.group'],
        'nicolas@perrinn.com'
    )
    const googleAdmin = google.admin({
      version: 'directory_v1',
      jwt,
    })
    return jwt.authorize().then(() => {
      return googleAdmin.members.list({
        auth: jwt,
        groupKey: "perrinn-google-group@perrinn.com"
      })
    }).catch(error=>{
      console.log('get Google error '+error)
      return
    })
  }

}
