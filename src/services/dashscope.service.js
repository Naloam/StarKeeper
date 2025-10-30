import axios from 'axios';
import { DASHSCOPE_CONFIG } from '../config';

/**
 * DashScope API 服务封装
 * 阿里云通义千问 API 调用
 */

/**
 * 为 GitHub 项目的 README 生成 AI 摘要
 * @param {string} readmeContent - README 内容
 * @param {string} repoName - 仓库名称
 * @param {string} repoDescription - 仓库描述
 * @returns {Promise<Object>} 包含摘要、功能点、适用场景等
 */
export async function generateSummary(readmeContent, repoName, repoDescription) {
  try {
    // 截取 README 内容（避免超过 token 限制）
    const truncatedContent = readmeContent.slice(0, 3000);
    
    const prompt = `你是一个 GitHub 项目分析专家。请为以下项目生成简洁的摘要。

项目名称：${repoName}
项目描述：${repoDescription || '无'}
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

    const response = await axios.post(
      `${DASHSCOPE_CONFIG.baseUrl}${DASHSCOPE_CONFIG.endpoints.textGeneration}`,
      {
        model: DASHSCOPE_CONFIG.models.turbo,
        input: {
          messages: [
            {
              role: 'system',
              content: '你是一个专业的技术文档分析助手，擅长提取和总结 GitHub 项目的核心信息。'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        parameters: {
          result_format: 'message',
          max_tokens: 800,
          temperature: 0.7,
          top_p: 0.8,
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'disable',
        }
      }
    );

    // 解析响应
    const text = response.data.output.choices[0].message.content;
    
    // 尝试提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        summary: result.summary || '项目摘要生成失败',
        features: result.features || [],
        useCase: result.useCase || '暂无',
        techStack: result.techStack || [],
        raw: text,
        model: DASHSCOPE_CONFIG.models.turbo,
        timestamp: Date.now(),
      };
    }
    
    // 如果无法解析为 JSON，返回原始文本
    return {
      summary: text.slice(0, 100),
      features: [],
      useCase: '请查看原始内容',
      techStack: [],
      raw: text,
      model: DASHSCOPE_CONFIG.models.turbo,
      timestamp: Date.now(),
    };
    
  } catch (error) {
    console.error('DashScope API 调用失败:', error);
    
    // 返回错误信息
    return {
      summary: '摘要生成失败',
      features: [],
      useCase: '服务暂时不可用',
      techStack: [],
      error: error.message,
      timestamp: Date.now(),
    };
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
    
    const response = await axios.post(
      `${DASHSCOPE_CONFIG.baseUrl}/text-embedding/text-embedding`,
      {
        model: DASHSCOPE_CONFIG.embedding.model,
        input: {
          texts: [truncatedText]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const embedding = response.data.output.embeddings[0].embedding;
    return embedding;
    
  } catch (error) {
    console.error('Embedding 生成失败:', error);
    throw error;
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
    
    // 分批处理，每次最多 25 个（API 限制）
    const batchSize = 25;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize).map(t => t.slice(0, 2000));
      
      const response = await axios.post(
        `${DASHSCOPE_CONFIG.baseUrl}/text-embedding/text-embedding`,
        {
          model: DASHSCOPE_CONFIG.embedding.model,
          input: {
            texts: batch
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${DASHSCOPE_CONFIG.apiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      const batchEmbeddings = response.data.output.embeddings.map(e => e.embedding);
      embeddings.push(...batchEmbeddings);
      
      // 避免速率限制
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return embeddings;
    
  } catch (error) {
    console.error('批量生成 embeddings 失败:', error);
    throw error;
  }
}

/**
 * 测试 DashScope API 连接
 * @returns {Promise<boolean>} 是否连接成功
 */
export async function testConnection() {
  try {
    const response = await axios.post(
      `${DASHSCOPE_CONFIG.baseUrl}${DASHSCOPE_CONFIG.endpoints.textGeneration}`,
      {
        model: DASHSCOPE_CONFIG.models.turbo,
        input: {
          messages: [
            { role: 'user', content: 'Hi' }
          ]
        },
        parameters: {
          result_format: 'message',
          max_tokens: 10,
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    return response.status === 200;
  } catch (error) {
    console.error('DashScope 连接测试失败:', error);
    return false;
  }
}

export default {
  generateSummary,
  generateEmbedding,
  batchGenerateEmbeddings,
  testConnection,
};
