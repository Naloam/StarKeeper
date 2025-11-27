import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Loader2, AlertCircle, X, TrendingUp } from 'lucide-react';
import { 
  semanticSearch, 
  loadEmbeddingsFromMetadata,
  batchGenerateRepoEmbeddings,
  saveEmbeddingsToMetadata,
  getReposNeedingEmbedding
} from '../../services/semantic-search.service';
import { saveMetadataToGist } from '../../services/metadata.service';
import toast from 'react-hot-toast';

/**
 * 语义搜索组件
 * 提供基于 AI 的自然语言搜索功能
 */
export default function SemanticSearch({ 
  stars, 
  metadata, 
  gistId, 
  accessToken,
  onResults 
}) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState({ current: 0, total: 0 });
  const [embeddings, setEmbeddings] = useState({});
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  // 加载或生成 embeddings
  useEffect(() => {
    initializeEmbeddings();
  }, [stars, metadata]);

  const initializeEmbeddings = async () => {
    try {
      setError(null);
      
      // 从 metadata 加载现有 embeddings
      const existingEmbeddings = loadEmbeddingsFromMetadata(metadata);
      setEmbeddings(existingEmbeddings);

      // 检查是否有项目需要生成 embedding
      const needUpdate = getReposNeedingEmbedding(stars, metadata);
      
      if (needUpdate.length > 0) {
        console.log(`需要为 ${needUpdate.length} 个项目生成 embedding`);
        setIsInitializing(true);
        setInitProgress({ current: 0, total: needUpdate.length });

        // 批量生成 embeddings
        const newEmbeddings = await batchGenerateRepoEmbeddings(
          needUpdate,
          metadata,
          (current, total) => {
            setInitProgress({ current, total });
          }
        );

        // 合并 embeddings
        const allEmbeddings = { ...existingEmbeddings, ...newEmbeddings };
        setEmbeddings(allEmbeddings);

        // 保存到 Gist
        const updatedMetadata = saveEmbeddingsToMetadata(metadata, newEmbeddings);
        await saveMetadataToGist(accessToken, gistId, updatedMetadata);

        toast.success(`已为 ${needUpdate.length} 个项目生成向量索引`);
      }

      setIsReady(true);
      setIsInitializing(false);
    } catch (err) {
      console.error('初始化 embeddings 失败:', err);
      setError(err.message);
      setIsInitializing(false);
      toast.error('向量索引初始化失败');
    }
  };

  // 执行语义搜索
  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      onResults?.(null);
      return;
    }

    if (!isReady) {
      toast.error('向量索引尚未准备好，请稍候');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const searchResults = await semanticSearch(
        query,
        stars,
        embeddings,
        {
          topK: 12,
          threshold: 0.4
        }
      );

      setResults(searchResults);
      onResults?.(searchResults);

      if (searchResults.length === 0) {
        toast('未找到相关项目，请尝试其他关键词', { icon: '🔍' });
      } else {
        const highCount = searchResults.filter(r => r.relevance === 'high').length;
        const mediumCount = searchResults.filter(r => r.relevance === 'medium').length;
        
        let message = `找到 ${searchResults.length} 个相关项目`;
        if (highCount > 0) {
          message += `（${highCount} 个高度相关`;
          if (mediumCount > 0) message += `，${mediumCount} 个中度相关`;
          message += '）';
        }
        
        toast.success(message);
      }
    } catch (err) {
      console.error('搜索失败:', err);
      setError(err.message);
      toast.error('搜索失败，请重试');
    } finally {
      setIsSearching(false);
    }
  };

  // 清除搜索
  const handleClear = () => {
    setQuery('');
    setResults([]);
    onResults?.(null);
  };

  // 回车搜索
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  // 示例查询
  const exampleQueries = [
    'React 组件库',
    '数据可视化工具',
    'Node.js 后端框架',
    'Python 机器学习',
    '前端工程化工具',
  ];

  const handleExampleClick = (example) => {
    setQuery(example);
  };

  return (
    <div className="card mb-6">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h3 text-text-primary flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" strokeWidth={1.5} />
          AI 语义搜索
        </h3>
        
        {isReady && (
          <span className="text-caption text-success bg-success/10 px-2 py-1 rounded">
            已就绪
          </span>
        )}
      </div>

      {/* 初始化进度 */}
      {isInitializing && (
        <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-body-sm text-text-primary">
              正在生成向量索引... {initProgress.current}/{initProgress.total}
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ 
                width: `${initProgress.total > 0 ? (initProgress.current / initProgress.total) * 100 : 0}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
          <span className="text-body-sm text-error">{error}</span>
        </div>
      )}

      {/* 搜索框 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="用自然语言描述你想找的项目，例如：React 可视化组件库..."
          disabled={!isReady || isInitializing}
          className="input pl-10 pr-24"
        />
        
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-16 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-fast"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handleSearch}
          disabled={!query.trim() || !isReady || isSearching || isInitializing}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary px-3 py-1.5 text-body-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
              搜索中
            </>
          ) : (
            '搜索'
          )}
        </button>
      </div>

      {/* 示例查询 */}
      {!query && results.length === 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-caption text-text-secondary">试试这些：</span>
          {exampleQueries.map((example, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleClick(example)}
              disabled={!isReady}
              className="text-caption text-primary hover:text-primary-dark bg-primary/5 hover:bg-primary/10 px-2 py-1 rounded transition-fast disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      {/* 搜索结果展示 */}
      {results.length > 0 && (
        <div className="mt-4">
          {/* 结果摘要 */}
          <div className="mb-4 p-3 bg-surface border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-text-primary">
                找到 <strong>{results.length}</strong> 个相关项目
              </span>
              <button
                onClick={handleClear}
                className="text-body-sm text-text-secondary hover:text-text-primary transition-fast"
              >
                清除
              </button>
            </div>
          </div>

          {/* 结果列表 */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {results.map(({ repo, score, relevance }) => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-surface-card border border-border rounded-lg hover:shadow-card-hover hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* 项目名称 */}
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-body font-semibold text-text-primary group-hover:text-primary transition-fast truncate cursor-pointer underline-offset-2 group-hover:underline">
                        {repo.full_name || repo.name}
                      </h4>
                      {/* 相关度标识 */}
                      {relevance === 'high' && (
                        <span className="px-2 py-0.5 bg-success/20 text-success text-xs font-medium rounded flex-shrink-0">
                          高度相关
                        </span>
                      )}
                      {relevance === 'medium' && (
                        <span className="px-2 py-0.5 bg-warning/20 text-warning text-xs font-medium rounded flex-shrink-0">
                          中度相关
                        </span>
                      )}
                    </div>
                    
                    {/* 描述 */}
                    {repo.description && (
                      <p className="text-body-sm text-text-secondary line-clamp-2 mb-2">
                        {repo.description}
                      </p>
                    )}
                    
                    {/* 元信息 */}
                    <div className="flex flex-wrap items-center gap-3 text-caption text-text-secondary">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          {repo.language}
                        </span>
                      )}
                      {repo.stargazers_count !== undefined && (
                        <span className="flex items-center gap-1">
                          ⭐ {repo.stargazers_count.toLocaleString()}
                        </span>
                      )}
                      {repo.topics && repo.topics.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {repo.topics.slice(0, 3).map((topic, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-accent/10 text-accent rounded text-xs">
                              {topic}
                            </span>
                          ))}
                          {repo.topics.length > 3 && (
                            <span className="px-2 py-0.5 bg-surface text-text-secondary rounded text-xs">
                              +{repo.topics.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 相似度分数 */}
                  <div className="flex-shrink-0">
                    <div className={`px-3 py-1 rounded-full text-caption font-medium ${
                      relevance === 'high' 
                        ? 'bg-success/10 text-success' 
                        : relevance === 'medium'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {(score * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 提示信息 */}
      <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg">
        <div className="flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
          <div className="text-caption text-text-secondary">
            <p className="font-medium text-text-primary mb-1">使用技巧：</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>用自然语言描述需求，如"前端状态管理库"</li>
              <li>可以搜索技术栈、功能特性、使用场景等</li>
              <li>系统会优先返回高度相关的项目（70%+ 相似度）</li>
              <li>相似度阈值为 40%，确保结果精确且相关</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
