
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User model to potentially attach user to request

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in .env file');
    process.exit(1);
}

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Token format is "Bearer TOKEN_STRING"
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.warn('[Auth Middleware] Access denied: No token provided.');
        // 401 Unauthorized - No token provided
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach the decoded payload (which should contain user ID) to the request object
        // Find the user to ensure they still exist
        const user = await User.findById(decoded.userId).select('_id email'); // Select only necessary fields
        if (!user) {
            console.warn(`[Auth Middleware] Access denied: User not found for token ID ${decoded.userId}`);
            return res.status(401).json({ message: 'Access denied. User not found.' });
        }

        req.user = user; // Attach the user object (with _id and email) to the request
        console.log(`[Auth Middleware] Token verified for user: ${user.email} (ID: ${user._id})`);
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('[Auth Middleware] Token verification failed:', error.message);
         if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Access token expired. Please log in again.' });
         }
         if (error.name === 'JsonWebTokenError') {
             return res.status(403).json({ message: 'Invalid token. Access forbidden.' }); // 403 Forbidden - Invalid token
         }
         // Handle other potential errors during verification
        return res.status(403).json({ message: 'Token verification failed. Access forbidden.' });
    }
};

module.exports = authenticateToken;
