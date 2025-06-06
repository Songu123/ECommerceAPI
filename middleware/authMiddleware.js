const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')
const User = require('../models/User')

const protect = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization

    if(authHeader && authHeader.startsWith('Bearer')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded =  jwt.verify(token, process.env.JWT_SECRET)

            req.user = await User.findById(decoded.id).select('-password')
            if(!req.user) {
                res.status(401)
                throw new Error('Không tìm thấy người dùng')
            }

            next()
        } catch (error) {
            res.status(401)
            throw new Error('Token không hợp lệ hoặc đã hết hạn')
        }
    }else {
        res.status(401)
        throw new Error('Không có token, truy cập bị từ chối')
    }
})

const isAdmin = (req, res, next) => {
    if(req.user && req.user.role === 'admin'){
        next()
    } else {
        res.status(403)
        throw new Error('Chỉ admin mới được thực hiện hành động này')
    }
}

module.exports = {protect, isAdmin}