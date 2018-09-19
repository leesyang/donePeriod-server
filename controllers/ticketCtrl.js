const shortid = require('shortid');

// ----- imports -----
const { Ticket } = require('../models');
const temp_data = require('./tempData');
const { TicketConstants } = require('../models/ticket');

// ----- exports -----
const ticketCtrl = {};

// ----- utility functions -----
const filterUserInfo = '-password -username -email -__v';
const ticketUtil = {};

ticketUtil.getTicketsPromise = () => {
    return Ticket.find({})
    .populate('reporter', filterUserInfo)
    .populate('assignee', filterUserInfo )
};

ticketUtil.getTicketPromise = ticketId => {
    return Ticket.findById({ _id: ticketId })
    .populate('reporter', filterUserInfo )
    .populate('assignee', filterUserInfo )
}

// ----- controller functions -----
ticketCtrl.getAll = (req, res) => {
    ticketUtil.getTicketsPromise()
    .then(tickets => { res.status(200).json(tickets)})
}

ticketCtrl.postNewTicket = (req, res) => {
    const user = req.user;
    const { type, priority, dueDate, description, assignee } = req.body;

    let ticketId = shortid.generate();

    const { WORK_IN_PROGRESS, UNRESOLVED } = TicketConstants;

    let newTicket = new Ticket({
        ticketInfo: { 
            type,
            priority,
            status: WORK_IN_PROGRESS,
            resolution: UNRESOLVED
        },
        assignee,
        dueDate,
        description: { text: description },
        ticketId,
        reporter: user.id
    })

    newTicket.save()
    .then(ticket => {
        ticketUtil.getTicketPromise(ticket._id)
        .then(ticket => res.status(201).json(ticket))
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({ message: 'Internal Server Error' }) 
    })
}

ticketCtrl.updateInfo = (req, res) => {
    res.status(204).json({
        message: 'udpated info'
    })
}

ticketCtrl.updateAttachments = (req, res) => {
    res.status(204).json({
        message: 'udpated attachments'
    })
}

ticketCtrl.updateDescription = (req, res) => {
    res.status(204).json({
        message: 'udpated description'
    })
}

ticketCtrl.updateComments = (req, res) => {
    res.status(204).json({
        message: 'udpated comments'
    })
}

ticketCtrl.updateWorkLog = (req, res) => {
    res.status(204).json({
        message: 'udpated worklog'
    })
}

module.exports = ticketCtrl;