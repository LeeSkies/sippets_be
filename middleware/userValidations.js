const joi = require('joi')

const signupSchema = joi.object({
    username: joi.string().min(3).max(30).required(),
    email: joi.string().email().required(),
    password: joi.string().min(8).max(30).required()
})

const loginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(8).max(30).required()
})

const signupValidation = (req, res, next) => {
    const { error } = signupSchema.validate(req.body)
    if (error) {
        return res.status(400).json({ message: error.details[0].message })
    }
    next()
}

const loginValidation = (req, res, next) => {
    
    const { error } = loginSchema.validate(req.body)
    if (error) {
        return res.status(400).json({ message: error.details[0].message })
    }
    next()
}

module.exports = {
    signupValidation,
    loginValidation
}