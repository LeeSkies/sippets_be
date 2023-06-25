const mongoose = require('mongoose')

const Schema = mongoose.Schema

const followSchema = new Schema({
    follower: {
        ref: 'User',
        type: mongoose.Types.ObjectId,
        required: true
    },
    following: {
        ref: 'User',
        type: mongoose.Types.ObjectId,
        required: true
    }
}, {timestamps: true})

followSchema.index({ follower: 1, following: 1 }, { unique: true })

module.exports = mongoose.model('Follow', followSchema)