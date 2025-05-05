
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer TOKEN"

    if (token == null) {
        console.warn('[Auth Middleware] No token provided.');
        // 401 Unauthorized - Client should provide credentials
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    if (!JWT_SECRET) {
        console.error('[Auth Middleware] JWT_SECRET is not configured on the server.');
        // 500 Internal Server Error - Server configuration issue
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    jwt.verify(token, JWT_SECRET, (err, userPayload) => {
        if (err) {
            console.error("[Auth Middleware] JWT Verification Error:", err.message);
            // 403 Forbidden - Token is invalid or expired
            if (err.name === 'TokenExpiredError') {
                 return res.status(403).json({ message: 'Token expired. Please log in again.' });
            }
            return res.status(403).json({ message: 'Invalid token. Access denied.' });
        }

        // Add user payload (containing id and email) to the request object
        // Ensure the payload structure matches what you sign in the controller
        if (!userPayload || typeof userPayload !== 'object' || !userPayload.id) {
             console.error('[Auth Middleware] Invalid JWT payload structure:', userPayload);
             return res.status(403).json({ message: 'Invalid token payload.' });
        }

        req.user = {
            id: userPayload.id,
            email: userPayload.email // Include email if it's in the payload
        }; // Attach user info to the request

        console.log("[Auth Middleware] Token verified for user ID:", req.user.id);
        next(); // Proceed to the next middleware or route handler
    });
};

module.exports = authenticateToken;
