import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET || 'supersecret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user; // { id, username, role, institution_id }
    next();
  });
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role permissions' });
    }
    next();
  };
};

// Middleware to ensure hospitals/labs/pharmacies only access their own data
export const checkOwnership = (req, res, next) => {
  // We assume req.body.institution_id or req.params.institution_id is provided
  // or we just inject it from req.user
  if (['hospital', 'laboratory', 'pharmacy'].includes(req.user.role)) {
      // For POST/PUT requests, force the institution_id to match the user's institution
      req.body.institution_id = req.user.institution_id;
  }
  next();
};
