const mongoose = require('mongoose')

const Schema = mongoose.Schema

const likeSchema = new Schema({
    user_id: {
        ref: 'User',
        type: mongoose.Types.ObjectId,
        required: true
    },
    sippet_id: {
        ref: 'Sippet',
        type: mongoose.Types.ObjectId,
        required: true
    }
}, {timestamps: true})

likeSchema.index({ user_id: 1, sippet_id: 1 }, { unique: true })

module.exports = mongoose.model('Like', likeSchema)