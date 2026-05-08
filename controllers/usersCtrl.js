'use strict';
const aws = require('aws-sdk');

// ----- imports -----
const { User } = require('../models');
const { capitalizeFirst } = require('../common/util');

// ----- exports -----
const usersCtrl = {};

// ---- user utility functions -----
const getUsersPromise = async () => {
  const users = await User.find()
    .populate('watching', '_id ticketId dueDate')
    .populate('assigned', 'ticketId id dueDate description votes');
  return users.map(user => user.serialize());
};

const getUserPromise = (userId) => {
  return User.findOne({ _id: userId })
    .populate('watching', '_id ticketId dueDate')
    .populate('notes')
    .populate('assigned', 'ticketId id dueDate description votes');
};

// ----- controller functions -----
usersCtrl.getListOfUsers = async function (req, res) {
  try {
    const users = await getUsersPromise();
    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

usersCtrl.getUser = async function (req, res) {
  try {
    const { userId } = req.params;
    const user = await getUserPromise(userId);
    res.status(200).json(user.serialize());
  } catch (err) {
    res.status(500).json(err);
  }
};

usersCtrl.addNewUser = async function (req, res) {
  try {
    let { username, password, firstName, lastName, email, profilePicture } = req.body;
    firstName = capitalizeFirst(firstName.trim());
    lastName = capitalizeFirst(lastName.trim());

    const usernameCount = await User.countDocuments({ username });
    if (usernameCount > 0) {
      return res.status(422).json({
        code: 422,
        reason: 'ValidationError',
        message: 'Username already taken',
        location: 'username'
      });
    }

    const emailCount = await User.countDocuments({ email });
    if (emailCount > 0) {
      return res.status(422).json({
        code: 422,
        reason: 'ValidationError',
        message: 'Email already taken',
        location: 'email'
      });
    }

    const hash = await User.hashPassword(password);
    const user = await User.create({ username, password: hash, firstName, lastName, email, profilePicture });
    res.status(201).json(user.serialize());
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

usersCtrl.updateUserPhoto = async function (req, res) {
  try {
    const { id: userId } = req.user;
    const { key } = req.file;

    const user = await User.findByIdAndUpdate(userId, { $set: { profilePicture: key } }, { new: false });
    const { profilePicture } = user.serialize();

    if (profilePicture === 'default-profile-img.svg') {
      return res.status(201).json({ profilePicture: key });
    }

    aws.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    const s3 = new aws.S3();
    await s3.deleteObject({ Bucket: process.env.S3_BUCKET_NAME, Key: profilePicture }).promise();
    res.status(201).json({ profilePicture: key });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

usersCtrl.watchTicket = async function (req, res) {
  try {
    const { userId } = req.params;
    const ticket_Id = req.body.data;
    const updated = await User.findByIdAndUpdate(userId, { $push: { watching: ticket_Id } }, { new: true });
    const user = await getUserPromise(updated.id);
    res.status(201).json(user.watching);
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

usersCtrl.unwatchTicket = async function (req, res) {
  try {
    const { userId } = req.params;
    const ticket_Id = req.body.data;
    const updated = await User.findByIdAndUpdate(userId, { $pull: { watching: ticket_Id } }, { new: true });
    const user = await getUserPromise(updated.id);
    res.status(201).json(user.watching);
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

usersCtrl.addNote = async function (req, res) {
  try {
    const { userId } = req.params;
    const { comment } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { notes: { created: Date.now(), comment } } },
      { new: true }
    );
    res.status(201).json(user.filterNotes());
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

usersCtrl.removeNote = async function (req, res) {
  try {
    const { userId } = req.params;
    const { noteId } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { notes: { _id: noteId } } },
      { new: true }
    );
    res.status(204).json(user.filterNotes());
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

module.exports = usersCtrl;
