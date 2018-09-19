'use strict';
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const shortid = require('shortid');

// ----- exports -----
const uploader = {};

// ----- configuring amazon web services ------
var s3 = new aws.S3({ /* ... */ })
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const myBucket = process.env.S3_BUCKET_NAME;

// ---- utility function -----
let uniqueId = shortid.generate();

// ----- amazon storage settings -----
const attachmentStorageAws = multerS3({
  s3: s3,
  bucket: myBucket,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE, 
  key: function (req, file, cb) {
    let ext = file.originalname.slice(-4);
    cb(null, 'ticket-attachments/' + file.fieldname + '-' + Date.now() + ext);
  }
});

const uploadPicAws = multer({ storage: attachmentStorageAws });

uploader.ProfilePic = uploadPicAws.single('userImg');

module.exports = { uploader };