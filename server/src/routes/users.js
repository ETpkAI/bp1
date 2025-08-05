const express = require('express');
const { db } = require('../config/database');

const router = express.Router();

// 获取用户资料
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      'SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('获取用户资料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 更新用户资料
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    const result = await db.query(
      'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, created_at, updated_at',
      [email, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      message: '用户资料更新成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('更新用户资料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router; 