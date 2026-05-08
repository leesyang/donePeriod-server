'use strict';
const shortid = require('shortid');
const { s3, myBucket } = require('../middlewares/multer');

// ----- imports -----
const { Ticket, User } = require('../models');
const { TicketConstants } = require('../models/ticket');

// ----- exports -----
const ticketCtrl = {};

// ----- utility functions -----
const filterUserInfo = '-password -username -email -__v';
const filterUserInfoComments = '-password -username -email -__v -notes -watching';

const getTicketsPromise = () => {
  return Ticket.find({})
    .populate('reporter', filterUserInfo)
    .populate('assignee', filterUserInfo)
    .populate('comments.addedBy', filterUserInfoComments)
    .populate('worklog.addedBy', filterUserInfoComments);
};

const getTicketPromise = (ticketId) => {
  return Ticket.findById({ _id: ticketId })
    .populate('reporter', filterUserInfo)
    .populate('assignee', filterUserInfo)
    .populate('comments.addedBy', filterUserInfoComments)
    .populate('worklog.addedBy', filterUserInfoComments);
};

// ----- controller functions -----
ticketCtrl.getAll = async (req, res) => {
  try {
    const tickets = await getTicketsPromise();
    res.status(200).json(tickets);
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

ticketCtrl.uploadAttachments = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const attachments = req.files ? req.files.map(file => file.key) : [];
    await Ticket.findByIdAndUpdate(ticketId, { $set: { attachments } }, { new: true });
    const ticket = await getTicketPromise(ticketId);
    res.status(201).json(ticket);
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

ticketCtrl.postNewTicket = async (req, res) => {
  try {
    const user = req.user;
    const { type, priority, dueDate, description, assignee, title } = req.body;
    const { WORK_IN_PROGRESS, UNRESOLVED } = TicketConstants;

    const newTicket = new Ticket({
      ticketInfo: { type, priority, status: WORK_IN_PROGRESS, resolution: UNRESOLVED },
      assignee,
      dueDate,
      title,
      description: { text: description },
      ticketId: shortid.generate(),
      reporter: user.id,
    });

    const ticket = await newTicket.save();
    await User.findByIdAndUpdate(assignee, { $push: { assigned: ticket._id } }, { new: true });
    res.status(201).json({ _id: ticket._id, ticketId: ticket.ticketId });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

ticketCtrl.updateInfo = async (req, res) => {
  try {
    const { type, status, priority, resolution } = req.body;
    const { ticketId } = req.params;
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { $set: {
        'ticketInfo.type': type,
        'ticketInfo.status': status,
        'ticketInfo.priority': priority,
        'ticketInfo.resolution': resolution
      }},
      { new: true }
    );
    res.status(200).json(ticket.filterTicketInfo());
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

ticketCtrl.updateDescription = async (req, res) => {
  try {
    const { description } = req.body;
    const { ticketId } = req.params;
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { $set: { 'description.text': description } },
      { new: true }
    ).populate('comments.addedBy', filterUserInfo);
    res.status(200).json(ticket.filterDescription());
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

ticketCtrl.newComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const { ticketId } = req.params;
    const newComment = { addedBy: req.user.id, dateAdded: Date.now(), comment };
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { $push: { comments: newComment } },
      { new: true }
    ).populate('comments.addedBy', filterUserInfoComments);
    res.status(201).json(ticket.filterComments());
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

ticketCtrl.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.body;
    const { ticketId } = req.params;
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { $pull: { comments: { _id: commentId } } },
      { new: true }
    ).populate('comments.addedBy', filterUserInfoComments);
    res.status(200).json(ticket.filterComments());
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

ticketCtrl.newWorkLog = async (req, res) => {
  try {
    const { comment } = req.body;
    const { ticketId } = req.params;
    const newWorklog = {
      addedBy: req.user.id,
      dateAdded: Date.now(),
      comment,
      files: req.files.map(file => file.key)
    };
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { $push: { worklog: newWorklog } },
      { new: true }
    ).populate('worklog.addedBy', filterUserInfoComments);
    res.status(200).json(ticket.filterWorklog());
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Database Error' });
  }
};

const getTicketKeys = (ticket, worklogId) => {
  const files = ticket.toObject().worklog.filter(log => `${log._id}` === worklogId)[0].files;
  return files.map(file => ({ Key: file }));
};

ticketCtrl.deleteWorkLog = async (req, res) => {
  try {
    const { worklogId } = req.body;
    const { ticketId } = req.params;

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { $pull: { worklog: { _id: worklogId } } },
      { new: false }
    );
    const keys = getTicketKeys(ticket, worklogId);

    if (keys.length > 0) {
      await s3.deleteObjects({
        Bucket: myBucket,
        Delete: { Objects: keys, Quiet: false }
      }).promise();
    }

    const updatedTicket = await getTicketPromise(ticketId);
    res.status(202).json(updatedTicket.filterWorklog());
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Database Error' });
  }
};

ticketCtrl.voteTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { id: userId } = req.user;
    const ticket = await Ticket.findByIdAndUpdate(ticketId, { $push: { votes: userId } }, { new: true });
    res.status(200).json(ticket.filterVotes());
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

ticketCtrl.removeVote = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { id: userId } = req.user;
    const ticket = await Ticket.findByIdAndUpdate(ticketId, { $pull: { votes: userId } }, { new: true });
    res.status(200).json(ticket.filterVotes());
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

module.exports = ticketCtrl;
