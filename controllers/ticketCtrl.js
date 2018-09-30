const shortid = require('shortid');

// ----- imports -----
const { Ticket } = require('../models');
const temp_data = require('./tempData');
const { TicketConstants } = require('../models/ticket');

// ----- exports -----
const ticketCtrl = {};

// ----- utility functions -----
const filterUserInfo = '-password -username -email -__v';

 const getTicketsPromise = () => {
    return Ticket.find({})
    .populate('reporter', filterUserInfo)
    .populate('assignee', filterUserInfo )
};

const getTicketPromise = ticketId => {
    return Ticket.findById({ _id: ticketId })
    .populate('reporter', filterUserInfo )
    .populate('assignee', filterUserInfo )
}

const returnDescription = (object) => {
    return {
        description: object.description
    }
}

const returnTicketInfo = (object) => {
    return {
        ticketInfo: object.ticketInfo
    }
}

// ----- controller functions -----
ticketCtrl.getAll = (req, res) => {
    getTicketsPromise()
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
        getTicketPromise(ticket._id)
        .then(ticket => res.status(201).json(ticket))
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({ message: 'Internal Server Error' }) 
    })
}

ticketCtrl.updateInfo = (req, res) => {
    const { type, status, priority, resolution } = req.body;
    const { ticketId } = req.params;
    Ticket.findByIdAndUpdate(ticketId,
        { $set: 
            { 'ticketInfo.type': type,
            'ticketInfo.status': status, 
            'ticketInfo.priority': priority, 
            'ticketInfo.resolution': resolution 
            }},
        { new: true })
    .then(ticket => {console.log(ticket); res.status(200).json(returnTicketInfo(ticket))})
}

ticketCtrl.updateAttachments = (req, res) => {
    res.status(204).json({
        message: 'udpated attachments'
    })
}

ticketCtrl.updateDescription = (req, res) => {
    const { description } = req.body;
    const { ticketId } = req.params;
    Ticket.findByIdAndUpdate(ticketId, { $set: { "description.text": description }}, { new: true })
    .then(ticket => res.status(200).json(returnDescription(ticket)))
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

ticketCtrl.voteTicket = (req, res) => {
    const { ticketId } = req.params;
    const { id: userId }  = req.user;
    Ticket.findByIdAndUpdate(ticketId, { $push: { votes: userId }}, { new: true })
    .then(ticket => res.status(200).json(ticket.filterVotes()))
}

ticketCtrl.removeVote = (req, res) => {

}

module.exports = ticketCtrl;