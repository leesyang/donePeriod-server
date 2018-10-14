const shortid = require('shortid');
const { s3, myBucket} = require('../middlewares/multer')

// ----- imports -----
const { Ticket, User } = require('../models');
const temp_data = require('./tempData');
const { TicketConstants } = require('../models/ticket');

// ----- exports -----
const ticketCtrl = {};

// ----- utility functions -----
const filterUserInfo = '-password -username -email -__v';
const filterUserInfoComments = '-password -username -email -__v -notes -watching';

// ----- generic error messages -----


 const getTicketsPromise = () => {
    return Ticket.find({})
    .populate('reporter', filterUserInfo)
    .populate('assignee', filterUserInfo )
    .populate('comments.addedBy', filterUserInfoComments)
    .populate('worklog.addedBy', filterUserInfoComments)
};

const getTicketPromise = ticketId => {
    return Ticket.findById({ _id: ticketId })
    .populate('reporter', filterUserInfo )
    .populate('assignee', filterUserInfo )
    .populate('comments.addedBy', filterUserInfoComments)
    .populate('worklog.addedBy', filterUserInfoComments)
}

// ----- controller functions -----
ticketCtrl.getAll = (req, res) => {
    getTicketsPromise()
    .then(tickets => { res.status(200).json(tickets)})
}

ticketCtrl.uploadAttachments = (req, res) => {
    const { ticketId } = req.params;
    let attachments = req.files? req.files.map(file => file.key) : [];

    Ticket.findByIdAndUpdate(ticketId, { $set: { attachments }}, { new: true })
    .then(ticket => {
        getTicketPromise(ticket.id)
        .then(ticket => res.status(201).json(ticket))
    })
}

ticketCtrl.postNewTicket = (req, res) => {
    const user = req.user;
    const { type, priority, dueDate, description, assignee, title } = req.body;

    const ticketId = shortid.generate();

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
        title,
        description: { text: description },
        ticketId,
        reporter: user.id,
    })

    return newTicket.save()
    .then(ticket => {
        User.findByIdAndUpdate(assignee, { $push: { assigned: ticket._id }}, { new: true })
        .then(user => res.status(201).json({ _id: ticket._id, ticketId: ticket.ticketId }))
    })
    .catch(err => {console.log(err); res.status(500).json({ message: 'Internal Server Error' })})
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
    .then(ticket => res.status(200).json(ticket.filterTicketInfo()))
    .catch(err => { console.log(err); res.status(500).json()})
}

ticketCtrl.updateDescription = (req, res) => {
    const { description } = req.body;
    const { ticketId } = req.params;
    Ticket.findByIdAndUpdate(ticketId, { $set: { "description.text": description }}, { new: true })
    .populate('comments.addedBy', filterUserInfo)
    .then(ticket => res.status(200).json(ticket.filterDescription()))
}

ticketCtrl.newComment = (req, res) => {
    const { comment } = req.body;
    const { ticketId } = req.params;
    const newComment = {
        addedBy: req.user.id,
        dateAdded: Date.now(),
        comment: comment
    };

    Ticket.findByIdAndUpdate(ticketId, { $push: { comments: newComment }}, { new: true })
    .populate('comments.addedBy', filterUserInfoComments)
    .then(ticket => res.status(201).json(ticket.filterComments()))
}

ticketCtrl.deleteComment = (req, res) => {
    const { commentId } = req.body;
    const { ticketId } = req.params;

    Ticket.findByIdAndUpdate(ticketId, { $pull: { comments: { _id: commentId } }}, {new: true })
    .populate('comments.addedBy', filterUserInfoComments)
    .then(ticket => {res.status(200).json(ticket.filterComments())} )
}

ticketCtrl.newWorkLog = (req, res) => {
    const { comment } = req.body;
    const { ticketId } = req.params;
    const newFiles = req.files.map(file => file.key);

    const newWorklog = {
        addedBy: req.user.id,
        dateAdded: Date.now(),
        comment: comment,
        files: newFiles
    }

    Ticket.findByIdAndUpdate(ticketId, { $push: { worklog: newWorklog }}, { new: true })
    .populate('worklog.addedBy', filterUserInfoComments)
    .then(ticket => { console.log(ticket.filterWorklog()); res.status(200).json(ticket.filterWorklog())})
    .catch(error => {console.log(error); res.status(500).json({ code: 500, message: 'Database Error'})})
};

const getTicketKeys = (ticket, worklogId) => {
    const files = ticket.toObject().worklog.filter(log => `${log._id}` === worklogId)[0].files;
    const keys = files.map(file => ({ Key: file }));
    return keys
}

ticketCtrl.deleteWorkLog = (req, res) => {
    const { worklogId } = req.body;
    const { ticketId } = req.params;

    Ticket.findByIdAndUpdate(ticketId, { $pull: { worklog: { _id: worklogId } }},{ new: false })
    .then(ticket => {
        let keys = getTicketKeys(ticket, worklogId);

        if(keys.length > 0) {
            const params = {
                Bucket: myBucket, 
                Delete: {
                    Objects: keys, 
                    Quiet: false
                }
            };

            return s3.deleteObjects(params, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else {
                    return getTicketPromise(ticketId)
                    .then(ticket => res.status(202).json(ticket.filterWorklog()))
                }     // successful response
            });
        }
        else {
            return getTicketPromise(ticketId)
            .then(ticket => res.status(202).json(ticket.filterWorklog()))
        }

    })
    .catch(error => {console.log(error); res.status(500).json({ code: 500, message: 'Database Error'})})
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