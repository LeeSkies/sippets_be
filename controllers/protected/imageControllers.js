const cloudinary = require('cloudinary').v2

const config = cloudinary.config({
    cloud_name: process.env.CLD_CLOUD,
    api_key: process.env.CLD_KEY,
    api_secret: process.env.CLD_SECRET,
    secure: true
  });

const signUpload = async (req, res) => {    
    const { user } = req
    const timestamp = Math.round((new Date).getTime()/1000);
  
    const signature = cloudinary.utils.api_sign_request({
      timestamp,
    }, config.api_secret);
  
    res.json({ signature, timestamp, cloud_name: config.cloud_name, api_key: config.api_key })
  }

const deleteImage = (str) => {
    cloudinary.uploader.destroy(str)
}
  
  module.exports = {
    config,
    signUpload,
    deleteImage,
  }