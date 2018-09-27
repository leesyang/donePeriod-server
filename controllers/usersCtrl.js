'use strict';
const aws = require('aws-sdk');

// ----- imports -----
const { User, Ticket } = require('../models');

// ----- exports -----
const usersCtrl = {};

// ---- user utility functions -----
const getUsersPromise = () => {
  return User.find()
  .populate('watching', '_id ticketId dueDate')
  .then(users => users.map(user => user.serialize()))
}

const getUserPromise = (userId) => {
  return User.findOne({ _id: userId })
  .populate('watching', '_id ticketId dueDate')
  .populate('notes')
}

// ----- controller functions -----
usersCtrl.getListOfUsers = function (req, res) {
  getUsersPromise()
  .then(users => { console.log(users); res.status(200).json(users)})
  .catch(console.log);
};

usersCtrl.getUser = function(req, res) {
  const { userId } = req.params;

  getUserPromise(userId)
  .then(user => res.status(200).json(user.serialize()))
  .catch(err => res.status(500).json(err))
}

usersCtrl.addNewUser = function (req, res) {
  let { username, password, firstName, lastName, email, profilePicture } = req.body;
  firstName = firstName.trim();
  lastName = lastName.trim();

  return User.find({ username }).count()
  .then(count => {
    if (count > 0) {
      return Promise.reject({
        code: 422,
        reason: 'ValidationError',
        message: 'Username already taken',
        location: 'username'
      });
    }
    return User.find({ email }).count()
  })
  .then(count => {
    if (count > 0) {
      return Promise.reject({
        code: 422,
        reason: 'ValidationError',
        message: 'Email already taken',
        location: 'email'
      })
    }
    return User.hashPassword(password);
  })
  .then(hash => {
    return User.create({
      username,
      password: hash,
      firstName,
      lastName,
      email,
      profilePicture
    });
  })
  .then(user => {
    return res.status(201).json(user.serialize());
  })
  .catch(err => {
    if (err.reason === 'ValidationError') {
      return res.status(err.code).json(err);
    }
    console.log(err);
    res.status(500).json({code: 500, message: 'Internal server error'});
  });
};

usersCtrl.updateUser = function (req, res) {
  let updateInfo = { 
    experience: {}
  };

  Object.keys(req.body).forEach(function(key, index) {
    if (key in req.user && req.body[key] != req.user[key]) {
      updateInfo[key] = req.body[key];
    }
    if (!( key in req.user)) {
      updateInfo.experience[key] = req.body[key];
    }
  });

  if (req.file) {
    updateInfo.profilePicture = req.file.key.substring(20);
  }

  if (updateInfo.email) {
    return User.find({ email: updateInfo.email })
    .count()
    .then(count => {
      if (count > 0 ) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Email already taken',
          location: 'email'
        })
      }
    })
    .catch(err => {
      if (err) {
        res.status(422).json(err);
      }
    })
  }

  return User.findById(req.user.id)
  .then(user => {
    let profilePictureLink = user.profilePicture;
    
    if (updateInfo.profilePicture) {
      // ----- Amazon S3 -----
      aws.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      });
  
      const s3 = new aws.S3()
      const myBucket = process.env.S3_BUCKET_NAME;
  
      let params = {
        Bucket: myBucket, 
        Key: 'user-profile-images/'+profilePictureLink
      };
  
      return s3.deleteObject(params).promise()
      .then(function(data) {
        if (data) {
          return User.findByIdAndUpdate(req.user.id, updateInfo, { new: true })
          .then(user => {
            res.status(201).json(user.serialize());
          })
          .catch(err => {
            res.status(500).json({
              code: 500,
              message: 'Database Error'
            })
          })
        }
      })
    }

    return User.findByIdAndUpdate(req.user.id, updateInfo, { new: true })
    .then(user => {
      res.status(201).json(user.serialize());
    })
    .catch(err => {
      res.status(500).json({
        code: 500,
        message: 'Database Error'
      })
    })
    
  })
}

usersCtrl.watchTicket = function(req, res) {
  const { userId } = req.params;
  const ticket_Id = req.body.data;

  return User.findByIdAndUpdate(userId, { $push: { watching: ticket_Id }}, { new: true })
  .then(user => getUserPromise(user.id))
  .then(user => res.status(201).json(user.watching))
  .catch(console.log)
}

usersCtrl.unwatchTicket = function(req, res) {
  const { userId } = req.params;
  const ticket_Id = req.body.data;

  return User.findByIdAndUpdate(userId, { $pull: { 'watching': ticket_Id }}, { 'new': true })
  .then(user => getUserPromise(user.id))
  .then(user => {res.status(201).json(user.watching)})
  .catch(err => console.log(err))
}

usersCtrl.addNote = function(req, res) {

  const { userId } = req.params;
  const { comment } = req.body;
  let current = Date.now();

  return User.findOneAndUpdate(userId, { $push: { notes: { created: current, comment }}}, { new: true })
    .then(user => res.status(201).json(user.notes))
}

usersCtrl.removeNote = function (req, res) {
  const { userId } = req.params;
  const noteId = req.body.data;
  return User.findById(userId)
  .then(user => {

    let subDoc = user.notes.id(noteId);

    subDoc.remove();

    return user.save() 
  })
  .then(user => {
    res.status(204).end();
  })
}

module.exports = usersCtrl;