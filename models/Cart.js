const mongoose = require('mongoose');
const Product = require('./Product')

const cartSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    items: [{
        product: {type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true},
        quantity: {type: Number, required: true}
    }],
    updatedAt: {type: Date, default: Date.now}
})

module.exports = mongoose.model('Cart', cartSchema)