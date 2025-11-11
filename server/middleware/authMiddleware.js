const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * JWT 인증을 수행하는 재사용 가능한 미들웨어
 * @param {Object} options
 * @param {boolean} [options.required=true] 토큰이 필수인지 여부
 * @param {string[]} [options.roles] 허용되는 사용자 유형 배열 (예: ['admin'])
 * @returns Express middleware
 */
function authenticate(options = {}) {
  const {
    required = true,
    roles
  } = options;

  return async function authMiddleware(req, res, next) {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!token) {
        if (!required) {
          req.user = null;
          req.tokenPayload = null;
          return next();
        }
        return res.status(401).json({
          success: false,
          message: '인증 토큰이 필요합니다.'
        });
      }

      const jwtSecret = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';

      let payload;
      try {
        payload = jwt.verify(token, jwtSecret);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: '유효하지 않거나 만료된 토큰입니다.'
        });
      }

      const user = await User.findById(payload.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '사용자 정보를 찾을 수 없습니다.'
        });
      }

      if (roles && roles.length && !roles.includes(user.user_type)) {
        return res.status(403).json({
          success: false,
          message: '접근 권한이 없습니다.'
        });
      }

      req.user = user;
      req.tokenPayload = payload;
      req.token = token;

      return next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: '인증 처리 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  };
}

module.exports = {
  authenticate
};

