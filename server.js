const aws = require('aws-sdk')
const express = require('express')
const multer = require('multer')
const multerS3 = require('multer-s3')
const Slack = require('slack-node');
const bodyParser = require('body-parser');

const app = express()
app.use(bodyParser.raw({ type: 'text/plain' }));

const s3 = new aws.S3({
  accessKeyId: '',
  secretAccessKey: '',
  region: 'eu-central-1',
});
const slackApiToken = '';

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'sounder-assets/sounds',
    acl: 'public-read',
    contentType: (req, file, cb) => {
      cb(null, req.body.fileType);
    },
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
})

app.post('/upload', upload.single('file'), function(req, res, next) {
  console.log(req.body);
  res.send('Successfully uploaded file!')
  slack.api('chat.postMessage', {
    text:'Uploaded file.',
    channel:'#sounder'
  }, function(err, response){
    console.log(response);
  });
})

app.listen(4000)

slack = new Slack(slackApiToken);
