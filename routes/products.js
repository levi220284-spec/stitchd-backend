const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const protect = require('../middleware/protect');
// protect = the security guard middleware we built
// any route that has protect as second argument requires a valid token

// ─────────────────────────────────────────
// GET all products - PUBLIC
// anyone can see products, no login needed
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ─────────────────────────────────────────
// GET single product - PUBLIC
// ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ─────────────────────────────────────────
// POST create product - PROTECTED
// only logged in users can add products
// protect runs first, checks token, then allows access
// ─────────────────────────────────────────
router.post('/', protect, async (req, res) => {
//                ↑
//          protect sits here as second argument
//          before the actual route function
//          like a bouncer at the door
    try {
        const product = await Product.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Product created',
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// ─────────────────────────────────────────
// PUT update product - PROTECTED
// ─────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Product updated',
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// ─────────────────────────────────────────
// DELETE product - PROTECTED
// ─────────────────────────────────────────
// ─────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Product deleted',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;