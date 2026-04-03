const express = require('express');
const router = express.Router();
const SSLCommerzPayment = require('sslcommerz-lts');
const Order = require('../models/Order');
const protect = require('../middleware/protect');

const storeId = process.env.SSL_STORE_ID;
const storePassword = process.env.SSL_STORE_PASSWORD;
const isLive = false;
const BACKEND = 'https://stitchd-backend-production.up.railway.app';
const FRONTEND = 'http://127.0.0.1:8080/stitchd.html';
// hardcoded URLs so Railway doesn't complain about missing secrets

router.post('/init/:orderId', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('user', 'name email');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const transactionId = 'STITCHD_' + order._id + '_' + Date.now();

        const data = {
            total_amount: order.totalPrice,
            currency: 'BDT',
            tran_id: transactionId,
            success_url: `${BACKEND}/api/payment/success/${order._id}`,
            fail_url: `${BACKEND}/api/payment/fail/${order._id}`,
            cancel_url: `${BACKEND}/api/payment/cancel/${order._id}`,
            ipn_url: `${BACKEND}/api/payment/ipn`,
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

        if (apiResponse?.GatewayPageURL) {
            res.status(200).json({
                success: true,
                paymentUrl: apiResponse.GatewayPageURL
            });
        } else {
            res.status(400).json({ success: false, message: 'Could not initiate payment' });
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/success/:orderId', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.redirect(`${FRONTEND}?payment=failed`);
        }
        order.paymentStatus = 'paid';
        order.status = 'processing';
        await order.save();
        res.redirect(`${FRONTEND}?payment=success&order=${order._id}`);
    } catch (error) {
        res.redirect(`${FRONTEND}?payment=failed`);
    }
});

router.post('/fail/:orderId', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (order) {
            order.status = 'cancelled';
            await order.save();
        }
        res.redirect(`${FRONTEND}?payment=failed`);
    } catch (error) {
        res.redirect(`${FRONTEND}?payment=failed`);
    }
});

router.post('/cancel/:orderId', async (req, res) => {
    res.redirect(`${FRONTEND}?payment=cancelled`);
});

router.post('/ipn', async (req, res) => {
    res.status(200).json({ received: true });
});

module.exports = router;