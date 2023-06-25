const mongoose = require('mongoose')
const Buzz = require('../../models/buzzModel')

const getUnreadBuzzs = async (req, res) => {
    const { user } = req
    try {
        const buzzs = await Buzz.find({ _id: { $in: user.buzzs }, read: false })
        res.json(buzzs)
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Failed to fetch notifications' })
    }
}

const getAllBuzzs = async (req, res) => {
    const { user } = req
    const { offset } = req.params || 0

    try {
        const buzzs = await Buzz.find({ _id: { $in: user.buzzs } })
        .skip(offset * 20)
        .limit(20)
        res.json(buzzs)
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Failed to fetch notifications' })
    }
}

const updateBuzzs = async (req, res) => {
    const expiryDate = new Date().setMonth(new Date().getDate() - 10);
    try {
        await Buzz.deleteMany({ read: true }, { $lt: { createdAt: expiryDate } })
        await Buzz.updateMany({ read: false }, { read: true })
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Failed to update notifications' })
    }
}

module.exports = {
    getUnreadBuzzs,
    getAllBuzzs,
    updateBuzzs,
}