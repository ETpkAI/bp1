const express = require('express');

const router = express.Router();

// POST /api/v1/ai/analyze
router.post('/analyze', async (req, res) => {
  try {
    const { records } = req.body || {};

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'records 参数无效' });
    }

    // 在部署环境中通过环境变量 GOOGLE_API_KEY 注入，不在仓库中保存明文密钥
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'AI 服务未配置' });
    }

    // 动态导入官方 SDK（ESM）
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    // 使用 JSON Schema 约束返回结构
    const schema = {
      type: 'object',
      properties: {
        trendAnalysis: { type: 'string' },
        categoryDistribution: { type: 'string' },
        lifestyleSuggestions: { type: 'array', items: { type: 'string' } },
      },
      required: ['trendAnalysis', 'categoryDistribution', 'lifestyleSuggestions']
    };

    const recent = records.slice(0, 30);

    const prompt = `你是一名健康数据分析助手。请用简体中文分析以下用户的血压与心率数据（JSON，最新在前）。请勿提供医疗建议，仅给出一般性的健康建议。你的整个回复必须是严格的 JSON，符合给定的 schema。
\n数据：\n${JSON.stringify(recent, null, 2)}\n`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    // 调用与健壮性：先尝试一次，如果不是 JSON，再尝试一次纠偏
    const callOnce = async (p) => {
      const r = await model.generateContent(p);
      return r.response.text();
    };
    let text = await callOnce(prompt);
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const fixPrompt = `${text}\n\n上述不是严格 JSON。请仅输出符合以下 JSON Schema 的 JSON：${JSON.stringify(schema)}`;
      text = await callOnce(fixPrompt);
      try {
        parsed = JSON.parse(text);
      } catch (e2) {
        return res.status(502).json({ success: false, message: 'AI 响应解析失败' });
      }
    }

    return res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('AI 分析错误:', error);
    return res.status(500).json({ success: false, message: 'AI 分析失败' });
  }
});

module.exports = router;


