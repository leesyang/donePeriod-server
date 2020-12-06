const temp_data = {
    ticketId: '1241121',
    meta: {
        isLoaded: true,
        isEditing: false,
        isModified: false,
        modifiedFields: [],
    },
    description: {
        text: 'this is the description'
    },
    ticketInfo: {
        type: 'incident',
        priority: 'urgent',
        status: 'complete',
        resolution: 'unresolved',
    },
    dueDate: Date.now(),
    assignee: 'john',
    reporter: 'emma',
    team: [
        { userId: '1234-team', username: 'userid_temp'},
        { userId: '1234-team', username: 'userid_temp'},
        { userId: '1234-team', username: 'userid_temp'},
        { userId: '1234-team', username: 'userid_temp'},
    ],
    votes: [
        { userId: '1234-votes', username: 'userid_temp'},
        { userId: '1234-votes', username: 'userid_temp'},
        { userId: '1234-votes', username: 'userid_temp'},
        { userId: '1234-votes', username: 'userid_temp'},
    ],
    watchers: [
        { userId: '1234-watchers', username: 'userid_temp'},
        { userId: '1234-watchers', username: 'userid_temp'},
        { userId: '1234-watchers', username: 'userid_temp'},
    ],
    created: Date.now(),
    updated: Date.now(),
    attachments: [
        { name: 'file1.jpeg', location: 'http://google.com/', type: 'image'}
    ], 
    activity: {
        comments: [
            { userId: '12345', comment: 'this is a comment'},
            { userId: '12345', comment: 'this is a comment'}
        ],
        worklog: [
            { userId: '12345', comment: 'this is a worklog', files: [
                { name: 'file1.jpeg', location: 'http://google.com/', type: 'image'}
            ]},
            { userId: '12345', comment: 'this is a worklog', files: [
                { name: 'file1.jpeg', location: 'http://google.com/', type: 'image'}
            ]}
        ]
    }
}

module.exports = temp_data;