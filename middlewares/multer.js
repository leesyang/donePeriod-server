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

// ----- amazon storage settings -----
const userProfileStorage = multerS3({
  s3: s3,
  bucket: myBucket,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE, 
  key: function (req, file, cb) {
    const ext = file.originalname.match(/\.\w*/g)[0];
    const uniqueId = shortid.generate();
    cb(null, 'user-images/' + file.fieldname + '-' + uniqueId + ext);
  }
});

const ticketAttachmentsStorage = multerS3({
  s3: s3,
  bucket: myBucket,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE, 
  key: function (req, file, cb) {
    const { ticketId } = req.body;
    const ext = file.originalname.match(/\.\w*/g)[0];
    const uniqueId = shortid.generate();
    cb(null, `user-images/ticket-attachments/${ticketId}/` + file.originalname + '-' + uniqueId + ext);
  }
});


const uploadPicAws = multer({ storage: userProfileStorage });
const uploadTicketAttachment = multer({ storage: ticketAttachmentsStorage })

uploader.ProfilePic = uploadPicAws.single('profilePicture');
uploader.TicketAttachments = uploadTicketAttachment.single('attachment');

module.exports = { uploader };