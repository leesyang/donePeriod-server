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
router.get('/', jwtAuth, usersCtrl.getListOfUsers )

// -- create new user --
router.post('/', newUserInputCheck, usersCtrl.addNewUser );

// -- watch a ticket --
router.post('/:userId/watches', jwtAuth, usersCtrl.watchTicket );

// -- add note ---
router.post('/:userId/notes', jwtAuth, usersCtrl.addNote );

// -- remove a note --
router.delete('/:userId/notes', jwtAuth, usersCtrl.removeNote);

module.exports = { router };