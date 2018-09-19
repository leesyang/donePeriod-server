'use strict';
const router = require('express').Router();
const { Ticket } = require('../models');

// ----- authentication -----
const { jwtAuth } = require('../middlewares/auth');

// ----- controllers -----
const ticketCtrl = require('../controllers/ticketCtrl');

// ----- routes -----
router.get('/', jwtAuth, ticketCtrl.getAll);

router.get('/asdf', (req, res) => {
    return Ticket.remove({}).then(asdf => res.status(200).send('done'));
})

router.post('/', jwtAuth, ticketCtrl.postNewTicket);

router.put('/:ticketId/description', jwtAuth, ticketCtrl.updateDescription)

router.put('/:ticketId/info', jwtAuth, ticketCtrl.updateInfo)

router.put('/:ticketId/attachments', jwtAuth, ticketCtrl.updateAttachments)

router.put('/:ticketId/comments', jwtAuth, ticketCtrl.updateComments)

router.put('/:ticketId/worklog', jwtAuth, ticketCtrl.updateWorkLog)

module.exports = { router };