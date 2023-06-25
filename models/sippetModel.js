const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const sippetSchema = new Schema({
    is: {
        type: String,
        enum: ['original', 'toast', 'comment'],
        index: true
    },
    author: {
        type: mongoose.mongo.ObjectId,
        ref: 'User',
        required: true,
    },
    blocks: [
        {type: Schema.Types.Mixed}
    ],
    file: {
        type: Object,
        default: null,
    },
    language: {
        type: String,
    },
    ref_sippet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sippet',
        default: null,
    },
    likesCount: {
        type: Number,
        default: 0,
    },
    commentsCount: {
        type: Number,
        default: 0,
    },
    toastsCount: {
        type: Number,
        default: 0,
    },
    hashtags: [
        {type: mongoose.Schema.Types.ObjectId, ref: 'Hashtag', index: true}
    ]
}, {timestamps: true})


module.exports = mongoose.model('Sippet', sippetSchema);