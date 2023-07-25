const mongoose = require('mongoose');

const groupChatSchema = new mongoose.Schema({
    sender_id : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User'
    },
    group_id: {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Group'
    },
    message : {
        type: String,
        required: true
    }
},{
    timestamps: true
});

const groupChatModel = mongoose.model("GroupChat",groupChatSchema);

module.exports = groupChatModel;