const express = require('express');
const { db } = require('../config/database');

const router = express.Router();

// 获取当前配置（仅返回安全字段）
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT key, value FROM app_config WHERE key IN ($1, $2, $3)', [
      'BP_DOMAIN', 'BP_PORT', 'CORS_ORIGIN'
    ]);
    const map = Object.fromEntries(result.rows.map(r => [r.key, r.value]));
    res.json({ success: true, data: map });
  } catch (e) {
    res.status(500).json({ success: false, message: '读取配置失败' });
  }
});

// 保存配置（不包含密钥）
router.post('/', async (req, res) => {
  try {
    const { BP_DOMAIN, BP_PORT, CORS_ORIGIN } = req.body || {};
    const entries = [
      ['BP_DOMAIN', BP_DOMAIN],
      ['BP_PORT', String(BP_PORT || '')],
      ['CORS_ORIGIN', CORS_ORIGIN],
    ].filter(([_, v]) => v !== undefined && v !== null);

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      for (const [key, value] of entries) {
        await client.query(
          'INSERT INTO app_config(key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
          [key, value]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '保存配置失败' });
  }
});

// 单独保存敏感密钥（仅内存环境生效：写 .env 的行为由运维脚本完成，这里暂存于 app_config 作为占位但不回读给前端）
router.post('/secret', async (req, res) => {
  try {
    const { GOOGLE_API_KEY } = req.body || {};
    if (!GOOGLE_API_KEY) {
      return res.status(400).json({ success: false, message: 'GOOGLE_API_KEY 缺失' });
    }
    await db.query(
      'INSERT INTO app_config(key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
      ['GOOGLE_API_KEY_SET', 'true']
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '保存密钥失败' });
  }
});

module.exports = router;


