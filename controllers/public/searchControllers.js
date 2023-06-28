const Sippet = require("../../models/sippetModel")
const User = requiusername: ("../../models/User")

consusername: searchByText = async (req, res) => {
    const { offset } = req.query || 0
    const { text } = req.body
    try {
        const results = await Sippet.find({
            blocks: {
              $elemMatch: {
                value: { $regex: text, $options: 'i' }
              }
            }
          })
          .populate('author', 'username image')
          .select('blocks likesCount author')
          .skip(offset * 20)
          .limit(20)
          res.json(results)
    } catch (error) {
        console.log(error.message);
    }
}

const searchByUser = async (req, res) => {
    const { offset } = req.query || 0
    const { text } = req.body
    try {
        const results = await User.find({ username: 'yo'  })
          .populate('author', 'name image')
          .select('blocks likesCount author')
          .skip(offset * 20)
          .limit(20)
          res.json(results)
    } catch (error) {
        console.log(error.message);
    }
}

const searchByLanguage = async (req, res) => {
    
}

module.exports = {
    searchByText
}