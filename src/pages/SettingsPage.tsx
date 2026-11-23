import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Key,
  Sparkles,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import MainLayout from "../components/layout/MainLayout";
import { useSettingsStore } from "../store/settings";
import { useAuthStore } from "../store";
import { loadMetadataFromGist } from "../services/metadata.service";

type TestStatus = "idle" | "testing" | "success" | "error";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { accessToken, gistId, user } = useAuthStore();
  const [exporting, setExporting] = useState(false);
  const { deepseekApiKey, siliconflowApiKey, setDeepseekApiKey, setSiliconflowApiKey } =
    useSettingsStore();

  const [localDeepseek, setLocalDeepseek] = useState(deepseekApiKey);
  const [localSiliconflow, setLocalSiliconflow] = useState(siliconflowApiKey);
  const [deepseekTest, setDeepseekTest] = useState<TestStatus>("idle");
  const [siliconflowTest, setSiliconflowTest] = useState<TestStatus>("idle");

  const handleSave = () => {
    setDeepseekApiKey(localDeepseek.trim());
    setSiliconflowApiKey(localSiliconflow.trim());
    toast.success("设置已保存");
  };

  const downloadMetadata = async () => {
    if (!accessToken || !gistId || !user) return;
    setExporting(true);
    try {
      const data = await loadMetadataFromGist(accessToken, gistId, user.id);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "starkeeper-metadata-backup.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error("无法导出当前元数据");
    } finally {
      setExporting(false);
    }
  };

  const handleTestDeepseek = async () => {
    if (!localDeepseek.trim()) {
      toast.error("请先输入 DeepSeek API Key");
      return;
    }
    setDeepseekTest("testing");
    try {
      const axios = (await import("axios")).default;
      const url = import.meta.env.DEV
        ? "/api/deepseek/v1/chat/completions"
        : "https://api.deepseek.com/v1/chat/completions";
      await axios.post(
        url,
        {
          model: "deepseek-chat",
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 5,
        },
        { headers: { Authorization: `Bearer ${localDeepseek.trim()}` } },
      );
      setDeepseekTest("success");
      toast.success("DeepSeek 连接成功");
    } catch {
      setDeepseekTest("error");
      toast.error("连接失败，请检查 Key 是否正确");
    }
  };

  const handleTestSiliconflow = async () => {
    if (!localSiliconflow.trim()) {
      toast.error("请先输入 SiliconFlow API Key");
      return;
    }
    setSiliconflowTest("testing");
    try {
      const axios = (await import("axios")).default;
      const url = import.meta.env.DEV
        ? "/api/siliconflow/v1/embeddings"
        : "https://api.siliconflow.cn/v1/embeddings";
      await axios.post(
        url,
        { model: "BAAI/bge-large-zh-v1.5", input: "test" },
        { headers: { Authorization: `Bearer ${localSiliconflow.trim()}` } },
      );
      setSiliconflowTest("success");
      toast.success("SiliconFlow 连接成功");
    } catch {
      setSiliconflowTest("error");
      toast.error("连接失败，请检查 Key 是否正确");
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </button>

        <h1 className="text-2xl font-bold text-text-primary mb-2">设置</h1>
        <p className="text-text-secondary mb-8">
          配置 AI 服务的 API Key。应用在当前标签页会话中保存凭据，请求时会把对应的 Key
          发送给该服务。
        </p>

        <section className="mb-6 space-y-2 rounded-lg border border-border bg-surface-card p-4">
          <h2 className="font-semibold text-text-primary">数据恢复</h2>
          <p className="text-sm text-text-secondary">
            下载合并后的 Gist 元数据和本机待同步编辑。备份可能含有私人笔记，请妥善保存。
          </p>
          <button
            className="btn-secondary"
            type="button"
            disabled={!gistId || exporting}
            onClick={() => void downloadMetadata()}
          >
            {exporting ? "正在导出…" : "下载元数据备份"}
          </button>
        </section>

        {/* DeepSeek */}
        <div className="bg-surface-card rounded-lg border border-border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">DeepSeek API</h2>
              <p className="text-sm text-text-secondary">AI 摘要生成、标签推荐</p>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="password"
              value={localDeepseek}
              onChange={(e) => {
                setLocalDeepseek(e.target.value);
                setDeepseekTest("idle");
              }}
              placeholder="sk-..."
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {deepseekTest === "success" && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" /> 连接成功
                  </span>
                )}
                {deepseekTest === "error" && (
                  <span className="flex items-center gap-1 text-sm text-red-600">
                    <XCircle className="w-4 h-4" /> 连接失败
                  </span>
                )}
              </div>
              <button
                onClick={handleTestDeepseek}
                disabled={deepseekTest === "testing" || !localDeepseek.trim()}
                className="text-sm text-primary hover:text-primary/80 disabled:opacity-50"
              >
                {deepseekTest === "testing" ? (
                  <Loader2 className="w-4 h-4 animate-spin inline" />
                ) : (
                  "测试连接"
                )}
              </button>
            </div>
            <p className="text-xs text-text-secondary">
              前往{" "}
              <a
                href="https://platform.deepseek.com/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                platform.deepseek.com
                <ExternalLink className="w-3 h-3 inline ml-0.5" />
              </a>{" "}
              获取 API Key
            </p>
          </div>
        </div>

        {/* SiliconFlow */}
        <div className="bg-surface-card rounded-lg border border-border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">SiliconFlow API</h2>
              <p className="text-sm text-text-secondary">语义搜索向量索引</p>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="password"
              value={localSiliconflow}
              onChange={(e) => {
                setLocalSiliconflow(e.target.value);
                setSiliconflowTest("idle");
              }}
              placeholder="sk-..."
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {siliconflowTest === "success" && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" /> 连接成功
                  </span>
                )}
                {siliconflowTest === "error" && (
                  <span className="flex items-center gap-1 text-sm text-red-600">
                    <XCircle className="w-4 h-4" /> 连接失败
                  </span>
                )}
              </div>
              <button
                onClick={handleTestSiliconflow}
                disabled={siliconflowTest === "testing" || !localSiliconflow.trim()}
                className="text-sm text-primary hover:text-primary/80 disabled:opacity-50"
              >
                {siliconflowTest === "testing" ? (
                  <Loader2 className="w-4 h-4 animate-spin inline" />
                ) : (
                  "测试连接"
                )}
              </button>
            </div>
            <p className="text-xs text-text-secondary">
              前往{" "}
              <a
                href="https://cloud.siliconflow.cn/account/ak"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                cloud.siliconflow.cn
                <ExternalLink className="w-3 h-3 inline ml-0.5" />
              </a>{" "}
              获取 API Key（注册免费额度）
            </p>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Key className="w-4 h-4 inline mr-2" />
          保存设置
        </button>

        {/* Privacy note */}
        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-text-secondary">
            <strong>隐私说明：</strong>你的 API Key 仅存储在当前标签页的会话存储中，仅在发起 API
            请求时使用。不会发送到任何第三方服务器，也不会在页面源码中暴露。
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
