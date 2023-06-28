const Sippet = require("../../models/sippetModel")

const searchByText = async (req, res) => {
    const { text } = req.body
    try {
        const results = await Sippet.find({
            blocks: {
              $elemMatch: {
                value: { $regex: 'searchString', $options: 'i' }
              }
            }
          })
          res.json(results)
    } catch (error) {
        console.log(error.message);
    }
}

const searchByUser = async (req, res) => {

}

const searchByLanguage = async (req, res) => {
    
}

module.exports = {
    searchByText
}