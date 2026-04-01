const jwt = require('jsonwebtoken');
// jsonwebtoken = the tool that creates and verifies tokens
// token = a temporary ID card proving who you are

const User = require('../models/User');

const protect = async (req, res, next) => {
// protect = this is a middleware function (middleware = a checkpoint that runs 
// BEFORE your route function, like a security guard at the door)
// next = "if everything checks out, let the request through"

    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        // authorization header = where the token is sent with every request
        // it looks like: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        // 'Bearer' is just a standard prefix word before the actual token
        
        token = req.headers.authorization.split(' ')[1];
        // split(' ') = split the string by space into an array
        // "Bearer mytoken123" becomes ["Bearer", "mytoken123"]
        // [1] = grab the second item, which is the actual token
    }

    if (!token) {
        return res.status(401).json({
        // 401 = unauthorized (you need to log in first)
            success: false,
            message: 'Not authorized, no token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // jwt.verify() = check if the token is valid and not expired
        // process.env.JWT_SECRET = the secret key used to verify the token
        // decoded = the data we originally put inside the token (user id)

        req.user = await User.findById(decoded.id);
        // attach the full user object to req so route functions can use it
        // now any protected route can access req.user to know who is making the request

        next();
        // token is valid, let the request through to the actual route

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, invalid token'
        });
    }
};

module.exports = protect;