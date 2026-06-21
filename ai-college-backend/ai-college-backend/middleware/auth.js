const jwt = require('jsonwebtoken');

// Verifies the "Authorization: Bearer <token>" header and attaches
// the decoded payload ({ id, role, username, name }) to req.user.
function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

// Restricts a route to one or more roles, e.g. authorize('admin')
// or authorize('faculty', 'admin'). Must run after verifyToken.
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = { verifyToken, authorize };
