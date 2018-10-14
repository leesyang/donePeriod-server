'use strict';
const router = require('express').Router();

// ----- auth -----
const { jwtAuth } = require('../middlewares/auth');

// ----- controllers -----
const { usersCtrl } = require('../controllers');

// ----- middleware -----
const { newUserInputCheck } = require('../middlewares/fieldReqCheck');
const { uploader } = require('../middlewares/multer');

// ----- routes -----
// -- get all users --
router.get('/', jwtAuth, usersCtrl.getListOfUsers )

// -- get user --
router.get('/:userId', jwtAuth, usersCtrl.getUser)

// -- update user photo --
router.put('/:userId', jwtAuth, uploader.ProfilePic, usersCtrl.updateUserPhoto)

// -- create new user --
router.post('/', newUserInputCheck, usersCtrl.addNewUser );

// -- watch a ticket --
router.post('/:userId/watches', jwtAuth, usersCtrl.watchTicket );

// -- un-watch a ticket --
router.delete('/:userId/watches', jwtAuth, usersCtrl.unwatchTicket);

// -- add note ---
router.post('/:userId/notes', jwtAuth, usersCtrl.addNote );

// -- remove a note --
router.delete('/:userId/notes', jwtAuth, usersCtrl.removeNote);

module.exports = { router };