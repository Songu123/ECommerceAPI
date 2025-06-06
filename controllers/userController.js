const asyncHandler = require('express-async-handler')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const registerUser = asyncHandler(async (req, res) => {
    const {name, email, password, role} = req.body

    const userExists = await User.findOne({email})
    if(userExists) {
        res.status(400)
        throw new Error('Email đã tồn tại')
    }

    const user = await User.create({name, email, password, role})

    res.status(201).json({_id: user._id, name, email, role: user.role})
})

const loginUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body

    const user = await User.findOne({email})

    if(user && (await user.matchPassword(password))) {
        const token = jwt.sign(
            {id: user._id, role: user.role},
            process.env.JWT_SECRET, {
                expiresIn: '1d'
            }
        )

        res.json({
            token,
            user: {_id: user._id, name: user.name, email,role: user.role}
        });

    }else {
        res.status(401)
        throw new Error('Thông tin đăng nhập không hợp lệ')
    }
})

const getProfile = asyncHandler(async (req, res) => {
    res.json({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
    })
})

module.exports = {registerUser, loginUser, getProfile}