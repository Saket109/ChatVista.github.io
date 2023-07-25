const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    creator_id : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User'
    },
    name : {
        type: String,
        required: true
    }
},{
    timestamps: true
});

const groupModel = mongoose.model("Group",groupSchema);

module.exports = groupModel;