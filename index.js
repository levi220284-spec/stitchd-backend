const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const app = express();
connectDB();

app.use(express.json());

// Routes
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
// all auth routes live at /api/auth/...
// so register = /api/auth/register
// login = /api/auth/login

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to STITCHD API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});