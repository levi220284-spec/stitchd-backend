const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const protect = require('../middleware/protect');
// all order routes are protected
// you must be logged in to place or view orders

// ─────────────────────────────────────────
// POST - place a new order
// ─────────────────────────────────────────
router.post('/', protect, async (req, res) => {
    try {
        const { items, paymentMethod, shippingAddress } = req.body;
        // items = array of { productId, quantity } sent from frontend
        // paymentMethod = bkash, nagad, cod etc
        // shippingAddress = where to deliver

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items in order'
            });
        }

        // build order items and calculate total
        // we fetch each product from database to get real price
        // never trust the price sent from frontend
        let totalPrice = 0;
        const orderItems = [];

        for (const item of items) {
        // loop through each item the user wants to order

            const product = await Product.findById(item.productId);
            // fetch the real product from database

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.productId}`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough stock for ${product.name}`
                });
            }
            // check if we have enough stock before accepting order

            orderItems.push({
                product: product._id,
                name: product.name,
                // snapshot the name at time of order
                price: product.price,
                // snapshot the price at time of order
                quantity: item.quantity
            });

            totalPrice += product.price * item.quantity;
            // add this item's total to running total
            // e.g. shirt costs 850, quantity 2 = 1700 added to total

            // reduce stock
            product.stock -= item.quantity;
            // subtract ordered quantity from available stock
            await product.save();
            // save updated stock back to database
        }

        // create the order
        const order = await Order.create({
            user: req.user._id,
            // req.user comes from protect middleware
            // it's the logged in user's info
            items: orderItems,
            totalPrice,
            paymentMethod,
            shippingAddress
        });

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: order
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// ─────────────────────────────────────────
// GET - get logged in user's orders
// ─────────────────────────────────────────
router.get('/myorders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
        // find all orders where user field matches logged in user
        // each user only sees their own orders
            .populate('items.product', 'name price')
            // populate = replace the product ID with actual product data
            // like joining tables in SQL
            // 'name price' = only fetch these fields from the product
            .sort({ createdAt: -1 });
            // sort by newest first
            // -1 = descending order (newest to oldest)

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ─────────────────────────────────────────
// GET - get single order by id
// ─────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product', 'name price')
            .populate('user', 'name email');
            // also fetch user's name and email with the order

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // make sure user can only see their own order
        if (order.user._id.toString() !== req.user._id.toString()) {
            // toString() = convert MongoDB ObjectId to string for comparison
            // ObjectIds can't be compared directly with ===
            return res.status(401).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ─────────────────────────────────────────
// PUT - cancel an order
// ─────────────────────────────────────────
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // only owner can cancel
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // can only cancel pending orders
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel order that is already ${order.status}`
            });
        }

        order.status = 'cancelled';
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order cancelled',
            data: order
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;