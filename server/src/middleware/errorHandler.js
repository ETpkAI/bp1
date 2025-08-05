// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('错误详情:', err);

  // 数据库错误
  if (err.code === '23505') { // 唯一约束违反
    return res.status(409).json({
      success: false,
      message: '数据已存在'
    });
  }

  if (err.code === '23503') { // 外键约束违反
    return res.status(400).json({
      success: false,
      message: '关联数据不存在'
    });
  }

  if (err.code === '23514') { // 检查约束违反
    return res.status(422).json({
      success: false,
      message: '数据验证失败'
    });
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的令牌'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '令牌已过期'
    });
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      message: '数据验证失败',
      errors: err.errors
    });
  }

  // 默认错误
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message
  });
};

module.exports = {
  errorHandler
}; 