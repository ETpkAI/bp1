const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');

const router = express.Router();

// 获取健康记录列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'timestamp', sortOrder = 'desc' } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    // 获取总记录数
    const countResult = await db.query(
      'SELECT COUNT(*) FROM health_records WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取记录列表
    // 安全白名单排序字段
    const sortableColumns = new Set(['timestamp', 'created_at', 'updated_at', 'systolic', 'diastolic', 'heart_rate']);
    const orderByColumn = sortableColumns.has(String(sortBy)) ? String(sortBy) : 'timestamp';
    const orderDirection = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const result = await db.query(
      `SELECT id, user_id, systolic, diastolic, heart_rate, notes, timestamp, created_at, updated_at 
       FROM health_records 
       WHERE user_id = $1 
       ORDER BY ${orderByColumn} ${orderDirection} 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const records = result.rows.map(record => ({
      id: record.id,
      userId: record.user_id,
      systolic: record.systolic,
      diastolic: record.diastolic,
      heartRate: record.heart_rate,
      notes: record.notes,
      timestamp: record.timestamp,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));

    res.json({
      success: true,
      data: {
        data: records,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取记录列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 创建健康记录
router.post('/', [
  body('systolic').isInt({ min: 70, max: 300 }),
  body('diastolic').isInt({ min: 40, max: 200 }),
  body('heartRate').isInt({ min: 30, max: 250 }),
  body('notes').optional().isLength({ max: 500 }),
  body('timestamp').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { systolic, diastolic, heartRate, notes, timestamp } = req.body;
    const userId = req.user.id;
    const recordId = uuidv4();
    const recordTimestamp = timestamp || new Date().toISOString();

    const result = await db.query(
      `INSERT INTO health_records (id, user_id, systolic, diastolic, heart_rate, notes, timestamp, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
       RETURNING id, user_id, systolic, diastolic, heart_rate, notes, timestamp, created_at, updated_at`,
      [recordId, userId, systolic, diastolic, heartRate, notes, recordTimestamp]
    );

    const record = result.rows[0];

    res.status(201).json({
      success: true,
      message: '记录创建成功',
      data: {
        id: record.id,
        userId: record.user_id,
        systolic: record.systolic,
        diastolic: record.diastolic,
        heartRate: record.heart_rate,
        notes: record.notes,
        timestamp: record.timestamp,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }
    });
  } catch (error) {
    console.error('创建记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 删除健康记录
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      'DELETE FROM health_records WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      });
    }

    res.json({
      success: true,
      message: '记录删除成功'
    });
  } catch (error) {
    console.error('删除记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 导出健康记录
router.get('/export', async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const userId = req.user.id;

    const result = await db.query(
      `SELECT systolic, diastolic, heart_rate, notes, timestamp 
       FROM health_records 
       WHERE user_id = $1 
       ORDER BY timestamp DESC`,
      [userId]
    );

    const records = result.rows;

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="vitallog-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(records);
    } else {
      // CSV 格式
      const csvHeader = 'systolic,diastolic,heart_rate,notes,timestamp\n';
      const csvContent = records.map(record => 
        `${record.systolic},${record.diastolic},${record.heart_rate},"${(record.notes || '').replace(/"/g, '""')}",${record.timestamp}`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="vitallog-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvHeader + csvContent);
    }
  } catch (error) {
    console.error('导出记录错误:', error);
    res.status(500).json({
      success: false,
      message: '导出失败'
    });
  }
});

module.exports = router; 