const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const protect = require('../middleware/protect');

// helper function to generate token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // hash password manually here
        // instead of relying on the pre save hook
        const salt = await bcrypt.genSalt(10);
        // genSalt(10) = generate random scrambling data, 10 = complexity level
        const hashedPassword = await bcrypt.hash(password, salt);
        // hash = scramble the password using the salt so it's unreadable

        // save user with already hashed password
        const user = await User.create({
            name,
            email,
            password: hashedPassword
            // we save the scrambled version, never the original
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // get user including password field
        const user = await User.findOne({ email }).select('+password');
        // select('+password') = password is hidden by default in schema
        // this forces it to be included so we can compare

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // compare entered password with stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        // bcrypt.compare() = scrambles the entered password the same way
        // then checks if it matches the stored scrambled version
        // returns true or false

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// ─────────────────────────────────────────
// GET ME (protected)
// ─────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user
    });
});

module.exports = router;