const Sippet = require("../../models/sippetModel")
const User = require("../../models/userModel")

const searchByText = async (req, res) => {
    const { offset } = req.query || 0
    const { text } = req.query
    try {
        const results = await Sippet.find({
            blocks: {
              $elemMatch: {
                value: { $regex: text, $options: 'i' }
              }
            }
          })
          .populate('author', 'username image.secure_url')
          .select('blocks likesCount author createdAt language toastsCount commentsCount')
          .skip(offset * 20)
          .limit(20)
          res.json(results)
    } catch (error) {
        console.log(error.message);
    }
}

const searchByUser = async (req, res) => {
    const { offset } = req.query || 0
    const { text } = req.query
    try {
        const results = await User.find({ username: { $regex: text, $options: 'i' } })
          .select('username image.secure_url sippetsCount followersCount followingCount createdAt bio')
          .skip(offset * 20)
          .limit(20)
          res.json(results)
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    searchByText,
    searchByUser,
}