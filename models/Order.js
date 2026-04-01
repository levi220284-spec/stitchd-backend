const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        // ObjectId = a special type that stores a reference to another document
        // like storing a foreign key, it points to a user in the users collection
        ref: 'User',
        // ref = which model this ID belongs to
        // this lets mongoose fetch the full user details when needed
        required: true
    },

    items: [
        // items = an array of products the user ordered
        // each item in the array is an object with these fields:
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                // points to a product in the products collection
                required: true
            },
            name: {
                type: String,
                required: true
                // we store the name at time of order
                // so if product name changes later, order history stays accurate
            },
            price: {
                type: Number,
                required: true
                // same reason, store price at time of order
                // price might change later but order should show what they paid
            },
            quantity: {
                type: Number,
                required: true,
                min: [1, 'Quantity must be at least 1']
            }
        }
    ],

    totalPrice: {
        type: Number,
        required: true
        // total = sum of (price x quantity) for all items
        // calculated by backend, not trusted from frontend
        // frontend could send wrong total, we calculate ourselves
    },

    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        // the journey of an order from placed to delivered
        default: 'pending'
        // every new order starts as pending
    },

    paymentMethod: {
        type: String,
        enum: ['bkash', 'nagad', 'rocket', 'cod', 'card'],
        // cod = cash on delivery
        required: true
    },

    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid'],
        default: 'unpaid'
        // starts unpaid, becomes paid after payment confirmation
    },

    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        phone: { type: String, required: true }
    }

}, {
    timestamps: true
    // createdAt = when order was placed
    // updatedAt = when status last changed
});

module.exports = mongoose.model('Order', orderSchema);