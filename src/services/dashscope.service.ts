import axios from "axios";
import { DASHSCOPE_CONFIG } from "../config";

/**
 * DashScope API 服务封装
 * 支持阿里云通义千问 / DeepSeek (OpenAI 兼容) API 调用
 */

// 检测是否使用 DeepSeek API（key 以 sk- 开头且非 DashScope 格式）
const isDeepSeek =
  DASHSCOPE_CONFIG.apiKey?.startsWith("sk-") && !DASHSCOPE_CONFIG.apiKey?.startsWith("sk-aaa");

const DEEPSEEK_BASE_URL = "/api/deepseek/v1";

/**
 * 通用聊天请求 — 兼容 DashScope 和 DeepSeek
 */
async function chatRequest(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 800,
): Promise<string> {
  if (isDeepSeek) {
    const response = await axios.post(
      `${DEEPSEEK_BASE_URL}/chat/completions`,
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${DASHSCOPE_CONFIG.apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );
    return response.data.choices[0].message.content;
  }

  // DashScope (阿里云通义千问)
  const response = await axios.post(
    `${DASHSCOPE_CONFIG.baseUrl}${DASHSCOPE_CONFIG.endpoints.textGeneration}`,
    {
      model: DASHSCOPE_CONFIG.models.turbo,
      input: {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      },
      parameters: {
        result_format: "message",
        max_tokens: maxTokens,
        temperature: 0.7,
        top_p: 0.8,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${DASHSCOPE_CONFIG.apiKey}`,
        "Content-Type": "application/json",
        "X-DashScope-SSE": "disable",
      },
    },
  );
  return response.data.output.choices[0].message.content;
}

/**
 * 为 GitHub 项目的 README 生成 AI 摘要
 */
export async function generateSummary(
  readmeContent: string,
  repoName: string,
  repoDescription: string,
) {
  try {
    const truncatedContent = readmeContent.slice(0, 3000);

    const prompt = `你是一个 GitHub 项目分析专家。请为以下项目生成简洁的摘要。

项目名称：${repoName}
项目描述：${repoDescription || "无"}
README 内容：
${truncatedContent}

请按以下格式返回 JSON：
{
  "summary": "一句话概括项目核心功能（50字以内）",
  "features": ["功能点1", "功能点2", "功能点3"],
  "useCase": "适用场景描述（30字以内）",
  "techStack": ["技术1", "技术2", "技术3"]
}

要求：
1. summary 必须简洁有力，突出项目价值
2. features 最多5条，每条20字以内
3. useCase 说明什么人在什么情况下使用
4. techStack 列出主要技术栈（语言、框架等）
5. 只返回 JSON，不要其他说明文字`;

    console.log("📤 发送 AI API 请求...");

    const text = await chatRequest(
      "你是一个专业的技术文档分析助手，擅长提取和总结 GitHub 项目的核心信息。",
      prompt,
      800,
    );

    console.log("✅ API 响应成功");
    console.log("🤖 AI 返回内容:", text);

    // 尝试提取 JSON - 从第一个 { 到最后一个 } 匹配
    let jsonStr = null;
    let braceCount = 0;
    let startIdx = -1;
    for (let idx = 0; idx < text.length; idx++) {
      if (text[idx] === "{") {
        if (startIdx === -1) startIdx = idx;
        braceCount++;
      } else if (text[idx] === "}") {
        braceCount--;
        if (braceCount === 0 && startIdx !== -1) {
          jsonStr = text.slice(startIdx, idx + 1);
          break;
        }
      }
    }

    if (jsonStr) {
      const result = JSON.parse(jsonStr);
      console.log("✅ JSON 解析成功:", result);
      return {
        summary: result.summary || "项目摘要生成失败",
        features: result.features || [],
        useCase: result.useCase || "暂无",
        techStack: result.techStack || [],
        raw: text,
        model: DASHSCOPE_CONFIG.models.turbo,
        timestamp: Date.now(),
      };
    }

    // 如果无法解析为 JSON，返回原始文本
    console.warn("⚠️  无法解析 JSON，返回原始文本");
    return {
      summary: text.slice(0, 100),
      features: [],
      useCase: "请查看原始内容",
      techStack: [],
      raw: text,
      model: DASHSCOPE_CONFIG.models.turbo,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("❌ DashScope API 调用失败:", error);
    console.error("错误详情:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // 抛出错误让调用方处理
    throw new Error(`AI 摘要生成失败: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * 为文本生成 embedding 向量
 * @param {string} text - 需要生成向量的文本
 * @returns {Promise<Array<number>>} 1536 维向量数组
 */
export async function generateEmbedding(text) {
  try {
    // 截取文本（避免超过限制）
    const truncatedText = text.slice(0, 2000);

    // 使用配置中的 Embedding API 路径
    const embeddingUrl = import.meta.env.DEV
      ? `/api/dashscope/api/v1/services/aigc${DASHSCOPE_CONFIG.embedding.endpoint}`
      : `https://dashscope.aliyuncs.com/api/v1/services/aigc${DASHSCOPE_CONFIG.embedding.endpoint}`;

    console.log("📤 Embedding API 请求:", {
      url: embeddingUrl,
      model: DASHSCOPE_CONFIG.embedding.model,
      textLength: truncatedText.length,
    });

    const response = await axios.post(
      embeddingUrl,
      {
        model: DASHSCOPE_CONFIG.embedding.model,
        input: {
          texts: [truncatedText],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${DASHSCOPE_CONFIG.apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✅ Embedding API 响应:", response.status);

    if (!response.data || !response.data.output || !response.data.output.embeddings) {
      console.error("❌ API 响应格式错误:", response.data);
      throw new Error("API 响应格式不正确");
    }

    const embedding = response.data.output.embeddings[0].embedding;
    console.log("✅ Embedding 生成成功，维度:", embedding.length);
    return embedding;
  } catch (error) {
    console.error("❌ Embedding 生成失败:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    });

    // 提供更有用的错误信息
    if (error.response?.status === 400) {
      throw new Error(`API 请求错误 (400): ${error.response?.data?.message || "请求参数不正确"}`);
    } else if (error.response?.status === 401) {
      throw new Error("API Key 无效或已过期");
    } else if (error.response?.status === 429) {
      throw new Error("API 调用频率过高，请稍后再试");
    } else {
      throw new Error(`Embedding 生成失败: ${error.message}`);
    }
  }
}

/**
 * 批量生成 embeddings（用于初始化或批量处理）
 * @param {Array<string>} texts - 文本数组
 * @returns {Promise<Array<Array<number>>>} 向量数组
 */
export async function batchGenerateEmbeddings(texts) {
  try {
    const embeddings = [];

    // 使用配置中的 Embedding API 路径
    const embeddingUrl = import.meta.env.DEV
      ? `/api/dashscope/api/v1/services/aigc${DASHSCOPE_CONFIG.embedding.endpoint}`
      : `https://dashscope.aliyuncs.com/api/v1/services/aigc${DASHSCOPE_CONFIG.embedding.endpoint}`;

    // 分批处理，每次最多 25 个（API 限制）
    const batchSize = 25;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize).map((t) => t.slice(0, 2000));

      console.log(
        `📤 批量 Embedding 请求 (${i + 1}-${Math.min(i + batchSize, texts.length)}/${texts.length})`,
      );

      const response = await axios.post(
        embeddingUrl,
        {
          model: DASHSCOPE_CONFIG.embedding.model,
          input: {
            texts: batch,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${DASHSCOPE_CONFIG.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      const batchEmbeddings = response.data.output.embeddings.map((e) => e.embedding);
      embeddings.push(...batchEmbeddings);

      // 避免速率限制
      if (i + batchSize < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return embeddings;
  } catch (error) {
    console.error("批量生成 embeddings 失败:", error);
    throw error;
  }
}

/**
 * 测试 DashScope API 连接
 * @returns {Promise<boolean>} 是否连接成功
 */
export async function testConnection(): Promise<boolean> {
  try {
    const text = await chatRequest("You are a helpful assistant.", "Hi", 10);
    return text.length > 0;
  } catch (error) {
    console.error("AI 连接测试失败:", error);
    return false;
  }
}

/**
 * AI 自动标签推荐 — 基于仓库描述、语言和已有标签推荐合适的标签
 * @param {string} repoName - 仓库名称
 * @param {string} repoDescription - 仓库描述
 * @param {string} language - 主要编程语言
 * @param {string[]} existingTags - 已有标签
 * @param {string[]} allTags - 所有可用标签（用于复用）
 * @returns {Promise<string[]>} 推荐的标签列表
 */
export async function suggestTags(
  repoName: string,
  repoDescription: string | null,
  language: string | null,
  existingTags: string[] = [],
  allTags: string[] = [],
): Promise<string[]> {
  try {
    const prompt = `你是一个 GitHub 项目分类专家。请为以下项目推荐 3-8 个合适的标签。

项目名称：${repoName}
项目描述：${repoDescription || "无"}
主要语言：${language || "未知"}
已有标签：${existingTags.length > 0 ? existingTags.join("、") : "无"}
可选标签池（优先从中选择）：${allTags.length > 0 ? allTags.slice(0, 30).join("、") : "无"}

请返回一个 JSON 数组，只包含标签字符串，例如：
["标签1", "标签2", "标签3"]

要求：
1. 标签要简洁（1-3个词）
2. 可以从标签池中选择，也可以创建新标签
3. 不要重复已有标签
4. 只返回 JSON 数组，不要其他文字`;

    const content = await chatRequest("你是标签推荐专家，只返回JSON数组。", prompt, 200);

    if (!content) return [];

    // 提取 JSON 数组
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const tags = JSON.parse(jsonMatch[0]);
      return tags.filter((t) => !existingTags.includes(t));
    }
    return [];
  } catch (error) {
    console.error("AI 标签推荐失败:", error);
    return [];
  }
}

export default {
  generateSummary,
  generateEmbedding,
  batchGenerateEmbeddings,
  suggestTags,
  testConnection,
};
