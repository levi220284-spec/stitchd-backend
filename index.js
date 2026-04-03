const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
// cors = allows your frontend to talk to your backend from a different address
dotenv.config();

const connectDB = require('./config/db');
const app = express();
connectDB();

app.use(cors());
// this one line allows any frontend to call your API
// like opening the door to everyone

app.use(express.json());

const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to STITCHD API' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});