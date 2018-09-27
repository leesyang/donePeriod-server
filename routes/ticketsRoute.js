'use strict';
const router = require('express').Router();
const { Ticket } = require('../models');

// ----- authentication -----
const { jwtAuth } = require('../middlewares/auth');

// ----- controllers -----
const ticketCtrl = require('../controllers/ticketCtrl');

// ----- routes -----
router.get('/', jwtAuth, ticketCtrl.getAll);

// -- post --
router.post('/', jwtAuth, ticketCtrl.postNewTicket);

router.post('/:ticketId/vote', jwtAuth, ticketCtrl.voteTicket)

// -- put --
router.put('/:ticketId/description', jwtAuth, ticketCtrl.updateDescription)

router.put('/:ticketId/info', jwtAuth, ticketCtrl.updateInfo)

router.put('/:ticketId/attachments', jwtAuth, ticketCtrl.updateAttachments)

router.put('/:ticketId/comments', jwtAuth, ticketCtrl.updateComments)

router.put('/:ticketId/worklog', jwtAuth, ticketCtrl.updateWorkLog)

// -- delete --
router.delete('/:ticketId/vote', jwtAuth, ticketCtrl.removeVote)

module.exports = { router };