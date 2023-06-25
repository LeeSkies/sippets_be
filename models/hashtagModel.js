const mongoose = require('mongoose')

const Schema = mongoose.Schema

const hashtagSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }
})

module.exports = mongoose.model('Hashtag', hashtagSchema)