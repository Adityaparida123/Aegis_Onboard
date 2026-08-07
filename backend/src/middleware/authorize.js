const { ForbiddenError } = require('../utils/errors');

function authorize(allowedRoles = []) {
  return (req, _res, next) => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return next(new ForbiddenError('Insufficient role privileges'));
    }
    next();
  };
}

module.exports = authorize;
