'use strict';
const router = require('express').Router();
//const formidable = require('express-formidable');
const formidable = require('formidable');

// ----- authentication -----
const { jwtAuth } = require('../middlewares/auth');

// ----- controllers -----
const ticketCtrl = require('../controllers/ticketCtrl');

// ----- middleware -----
const { uploader } = require('../middlewares/multer');
const { newAssignFieldCheck } = require('../middlewares/fieldReqCheck');

// ----- routes -----
router.get('/', jwtAuth, ticketCtrl.getAll);

// -- post --
router.post('/', jwtAuth, ticketCtrl.postNewTicket);

router.post('/:ticketId/vote', jwtAuth, ticketCtrl.voteTicket);

router.post('/:ticketId/worklog', jwtAuth, uploader.TicketAttachments, ticketCtrl.newWorkLog);

router.post('/:ticketId/comments', jwtAuth, ticketCtrl.newComment);

// -- put --
router.put('/:ticketId/description', jwtAuth, ticketCtrl.updateDescription);

router.put('/:ticketId/info', jwtAuth, ticketCtrl.updateInfo);


// -- delete --
router.delete('/:ticketId/vote', jwtAuth, ticketCtrl.removeVote);
router.delete('/:ticketId/comments', jwtAuth, ticketCtrl.deleteComment);
router.delete('/:ticketId/worklog', jwtAuth, ticketCtrl.deleteWorkLog);

module.exports = { router };