const express = require('express');

const router = express.Router();

// POST /api/v1/ai/analyze
router.post('/analyze', async (req, res) => {
  try {
    const { records } = req.body || {};

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'records 参数无效' });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'AI 服务未配置' });
    }

    const genai = await import('@google/genai');
    const { GoogleGenAI, Type } = genai;

    const ai = new GoogleGenAI({ apiKey });

    const schema = {
      type: Type.OBJECT,
      properties: {
        trendAnalysis: { type: Type.STRING },
        categoryDistribution: { type: Type.STRING },
        lifestyleSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['trendAnalysis', 'categoryDistribution', 'lifestyleSuggestions']
    };

    const recent = records.slice(0, 30);

    const prompt = `你是一名健康数据分析助手。请用简体中文分析以下用户的血压与心率数据（JSON，最新在前）。请勿提供医疗建议，仅给出一般性的健康建议。你的整个回复必须是严格的 JSON，符合给定的 schema。
\n数据：\n${JSON.stringify(recent, null, 2)}\n`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const text = response.text;
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return res.status(502).json({ success: false, message: 'AI 响应解析失败' });
    }

    return res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('AI 分析错误:', error);
    return res.status(500).json({ success: false, message: 'AI 分析失败' });
  }
});

module.exports = router;


