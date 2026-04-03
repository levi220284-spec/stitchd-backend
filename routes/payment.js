const express = require('express');
const router = express.Router();
const SSLCommerzPayment = require('sslcommerz-lts');
const Order = require('../models/Order');
const protect = require('../middleware/protect');

const storeId = process.env.SSL_STORE_ID;
const storePassword = process.env.SSL_STORE_PASSWORD;
const isLive = false;
// isLive = false means sandbox/test mode
// when you get real business credentials, change this to true

// ─────────────────────────────────────────
// POST - initiate payment for an order
// ─────────────────────────────────────────
router.post('/init/:orderId', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('user', 'name email');
        // fetch the order with user details

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // make sure this order belongs to the logged in user
        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const transactionId = 'STITCHD_' + order._id + '_' + Date.now();
        // unique transaction ID for this payment attempt
        // like a receipt number

        const data = {
            total_amount: order.totalPrice,
            // how much to charge

            currency: 'BDT',
            // BDT = Bangladesh Taka

            tran_id: transactionId,
            // unique transaction ID

            success_url: `${process.env.BACKEND_URL}/api/payment/success/${order._id}`,
            // SSLCommerz redirects here after successful payment

            fail_url: `${process.env.BACKEND_URL}/api/payment/fail/${order._id}`,
            // SSLCommerz redirects here after failed payment

            cancel_url: `${process.env.BACKEND_URL}/api/payment/cancel/${order._id}`,
            // SSLCommerz redirects here if user cancels

            ipn_url: `${process.env.BACKEND_URL}/api/payment/ipn`,
            // IPN = Instant Payment Notification
            // SSLCommerz also sends a background notification here
            // as a backup in case redirect fails

            product_name: 'STITCHD Order',
            product_category: 'Clothing',
            product_profile: 'general',

            cus_name: order.user.name,
            cus_email: order.user.email,
            cus_add1: order.shippingAddress.address,
            cus_city: order.shippingAddress.city,
            cus_country: 'Bangladesh',
            cus_phone: order.shippingAddress.phone,

            ship_name: order.user.name,
            ship_add1: order.shippingAddress.address,
            ship_city: order.shippingAddress.city,
            ship_country: 'Bangladesh',
            shipping_method: 'Courier',
        };

        const sslcz = new SSLCommerzPayment(storeId, storePassword, isLive);
        const apiResponse = await sslcz.init(data);
        // send all the data to SSLCommerz
        // they respond with a payment URL

        if (apiResponse?.GatewayPageURL) {
            res.status(200).json({
                success: true,
                paymentUrl: apiResponse.GatewayPageURL
                // this is the URL we send the user to
                // it's the SSLCommerz payment page
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Could not initiate payment'
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ─────────────────────────────────────────
// POST - payment success callback
// SSLCommerz hits this URL after successful payment
// ─────────────────────────────────────────
router.post('/success/:orderId', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.redirect(`${process.env.FRONTEND_URL}?payment=failed`);
        }

        // update order to paid and processing
        order.paymentStatus = 'paid';
        order.status = 'processing';
        await order.save();

        // redirect user back to your frontend
        res.redirect(`${process.env.FRONTEND_URL}?payment=success&order=${order._id}`);

    } catch (error) {
        res.redirect(`${process.env.FRONTEND_URL}?payment=failed`);
    }
});

// ─────────────────────────────────────────
// POST - payment fail callback
// ─────────────────────────────────────────
router.post('/fail/:orderId', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (order) {
            order.status = 'cancelled';
            await order.save();
        }
        res.redirect(`${process.env.FRONTEND_URL}?payment=failed`);
    } catch (error) {
        res.redirect(`${process.env.FRONTEND_URL}?payment=failed`);
    }
});

// ─────────────────────────────────────────
// POST - payment cancel callback
// ─────────────────────────────────────────
router.post('/cancel/:orderId', async (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}?payment=cancelled`);
});

// ─────────────────────────────────────────
// POST - IPN (background notification)
// ─────────────────────────────────────────
router.post('/ipn', async (req, res) => {
    res.status(200).json({ received: true });
});

module.exports = router;