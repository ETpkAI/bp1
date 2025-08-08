import React, { useEffect, useState } from 'react';
import { useToast } from '../components/ToastManager.tsx';

const SetupPage: React.FC = () => {
  const { showToast } = useToast();
  const [bpDomain, setBpDomain] = useState('');
  const [bpPort, setBpPort] = useState('18080');
  const [corsOrigin, setCorsOrigin] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 读取已有配置（非敏感）
    fetch('/api/v1/config', { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          if (json.data.BP_DOMAIN) setBpDomain(json.data.BP_DOMAIN);
          if (json.data.BP_PORT) setBpPort(json.data.BP_PORT);
          if (json.data.CORS_ORIGIN) setCorsOrigin(json.data.CORS_ORIGIN);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ BP_DOMAIN: bpDomain, BP_PORT: bpPort, CORS_ORIGIN: corsOrigin })
      });
      if (!res.ok) throw new Error('保存失败');

      if (googleApiKey.trim()) {
        const res2 = await fetch('/api/v1/config/secret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ GOOGLE_API_KEY: googleApiKey.trim() })
        });
        if (!res2.ok) throw new Error('密钥保存失败');
      }

      showToast('已保存配置。请在服务器更新 .env 并重启容器生效。', 'success');
    } catch (e) {
      showToast('保存失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white shadow rounded p-6 space-y-4">
      <h2 className="text-lg font-semibold">首次运行配置</h2>
      <label className="block">
        <span className="text-sm text-gray-600">站点域名（例：bp.llmkc.com）</span>
        <input className="mt-1 w-full border rounded px-3 py-2" value={bpDomain} onChange={e=>setBpDomain(e.target.value)} placeholder="bp.llmkc.com" />
      </label>
      <label className="block">
        <span className="text-sm text-gray-600">容器对外端口（默认 18080）</span>
        <input className="mt-1 w-full border rounded px-3 py-2" value={bpPort} onChange={e=>setBpPort(e.target.value)} placeholder="18080" />
      </label>
      <label className="block">
        <span className="text-sm text-gray-600">CORS_ORIGIN（逗号分隔）</span>
        <input className="mt-1 w-full border rounded px-3 py-2" value={corsOrigin} onChange={e=>setCorsOrigin(e.target.value)} placeholder="https://bp.llmkc.com,http://bp.llmkc.com" />
      </label>
      <label className="block">
        <span className="text-sm text-gray-600">GOOGLE_API_KEY（仅保存在服务器 .env，前端不回显）</span>
        <input className="mt-1 w-full border rounded px-3 py-2" value={googleApiKey} onChange={e=>setGoogleApiKey(e.target.value)} placeholder="AIza..." />
      </label>
      <button onClick={handleSave} disabled={loading} className="w-full py-2 rounded bg-brand-primary text-white">
        {loading ? '保存中...' : '保存配置'}
      </button>
      <p className="text-sm text-gray-500">提示：保存后请在 VPS 上更新 .env 并执行 docker compose up -d --build 生效。</p>
    </div>
  );
};

export default SetupPage;


