// middleware/auth.js

const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header - support both formats
  const authHeader = req.header('Authorization');
  const xAuthToken = req.header('x-auth-token');
  
  let token;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (xAuthToken) {
    token = xAuthToken;
  }
  
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user payload to req
    req.user = { userId: decoded.userId };
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
