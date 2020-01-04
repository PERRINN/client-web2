const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const gcs = require('@google-cloud/storage')({
  keyFilename:'perrinn-d5fc1-firebase-adminsdk-rh8x2-b26a8ffeef.json',
});

exports=module.exports=functions.storage.object().onFinalize((data,context)=>{
  const object=data;
  const filePath=object.name;
  const fileName=filePath.split('/').pop();
  const imageID=fileName.substring(0,13);
  const fileBucket=object.bucket;
  const bucket=gcs.bucket(fileBucket);
  const file=bucket.file(filePath);
  const config={
    action:'read',
    expires:'01-01-2501'
  };
  return file.getSignedUrl(config).then(url=>{
    return new Promise((resolve, reject)=>{
      setTimeout(function(){
        return admin.firestore().collection('PERRINNTeams').where('imageTimestamp','==',imageID).get().then(teams=>{
          var batch = admin.firestore().batch();
          teams.forEach(team=>{
            if(fileName.substring(0,fileName.lastIndexOf('.')).endsWith('_180x180'))batch.update(admin.firestore().collection('PERRINNTeams').doc(team.id),{imageUrlThumb:url[0]});
            if(fileName.substring(0,fileName.lastIndexOf('.')).endsWith('_540x540'))batch.update(admin.firestore().collection('PERRINNTeams').doc(team.id),{imageUrlMedium:url[0]});
          });
          return batch.commit();
        });
      },5000);
    });
  }).catch(error=>{
    console.log(error);
  });
});
