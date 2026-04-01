const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
// Schema = a blueprint that defines exactly what a product looks like
// like designing a form before printing it
// every product saved to MongoDB must follow these rules

    name: {
        type: String,
        // type: String = this field must be text
        required: [true, 'Product name is required']
        // required = cannot be empty. if empty, show this error message
    },
    price: {
        type: Number,
        // type: Number = must be a number, not text
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
        // min = minimum allowed value
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['shirts', 'pants', 'tshirts', 'jackets', 'shoes', 'accessories']
        // enum = only these exact values allowed, like a dropdown with fixed options
        // if someone sends "trousers" instead of "pants", MongoDB rejects it
    },
    stock: {
        type: Number,
        default: 0
        // default = if not provided, automatically use this value
    },
    description: {
        type: String,
        default: ''
    }

}, {
    timestamps: true
    // automatically adds two fields to every product:
    // createdAt = when it was first saved
    // updatedAt = when it was last changed
    // you don't have to add these manually, MongoDB handles it
});

module.exports = mongoose.model('Product', productSchema);