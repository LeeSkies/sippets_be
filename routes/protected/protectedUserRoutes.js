const express = require('express');
const {
    getUser,
    deleteUser,
    updateUser,
    followUser,
    refresh,
    whoToFollow,
    logout
} = require('../../controllers/protected/protectedUserControllers');

const path = require('path');

const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads')
    },
    filename: (req, file, cb) => {
        const { _id } = req
        // const i = file.mimetype.
        const ext = path.extname(file.originalname)
        cb(null, _id + ext)
    }
})

const upload = multer({ storage });

const router = express.Router()

router.post('/refresh', refresh)

router.get('/single/:id', getUser)

router.get('/discover', whoToFollow)

router.put('/self', updateUser)

router.delete('/self', deleteUser)

router.put('/self/profile', upload.single('image'), (req, res) => console.log(req.file))

router.put('/follow/:id', followUser)

module.exports = router