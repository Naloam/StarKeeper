import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * 离线状态指示器组件
 * 显示网络连接状态和同步待处理操作
 */
export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // 更新在线状态
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('网络已连接');
      // 自动触发同步
      syncPendingOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('网络已断开，将在离线模式下工作');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 检查待同步操作
    checkPendingSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 检查待同步的操作数量
  const checkPendingSync = () => {
    try {
      const syncQueue = JSON.parse(localStorage.getItem('offline-sync-queue') || '[]');
      setPendingSync(syncQueue.length);
    } catch (error) {
      console.error('检查同步队列失败:', error);
    }
  };

  // 同步待处理操作
  const syncPendingOperations = async () => {
    if (!isOnline || isSyncing) return;

    try {
      setIsSyncing(true);
      const syncQueue = JSON.parse(localStorage.getItem('offline-sync-queue') || '[]');
      
      if (syncQueue.length === 0) {
        setPendingSync(0);
        return;
      }

      toast.loading(`正在同步 ${syncQueue.length} 个待处理操作...`);

      // 处理队列中的每个操作
      const failedOperations = [];
      
      for (const operation of syncQueue) {
        try {
          await executeOperation(operation);
        } catch (error) {
          console.error('同步操作失败:', operation, error);
          failedOperations.push(operation);
        }
      }

      // 更新队列（只保留失败的操作）
      localStorage.setItem('offline-sync-queue', JSON.stringify(failedOperations));
      setPendingSync(failedOperations.length);

      if (failedOperations.length === 0) {
        toast.success('所有操作已成功同步');
      } else {
        toast.error(`${failedOperations.length} 个操作同步失败，稍后重试`);
      }
    } catch (error) {
      console.error('同步失败:', error);
      toast.error('同步失败，请稍后重试');
    } finally {
      setIsSyncing(false);
    }
  };

  // 执行单个操作
  const executeOperation = async (operation) => {
    const { type, data, timestamp } = operation;

    switch (type) {
      case 'save-metadata':
        // 保存元数据到 Gist
        const githubService = await import('../../services/github.service');
        await githubService.updateMetadataGist(
          localStorage.getItem('github_token'),
          data.gistId,
          data.metadata
        );
        break;

      case 'update-metadata':
        // 更新单个仓库元数据
        const metadataService = await import('../../services/metadata.service');
        await metadataService.updateRepoMetadata(
          localStorage.getItem('github_token'),
          data.gistId,
          data.repoId,
          data.metadata
        );
        break;

      case 'star-repo':
        // star 仓库
        const githubService2 = await import('../../services/github.service');
        await githubService2.starRepo(data.owner, data.repo);
        break;

      case 'unstar-repo':
        // 取消 star
        const githubService3 = await import('../../services/github.service');
        await githubService3.unstarRepo(data.owner, data.repo);
        break;

      default:
        console.warn('未知的操作类型:', type);
    }
  };

  // 如果在线且没有待同步操作，不显示指示器
  if (isOnline && pendingSync === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium
          transition-all duration-300
          ${isOnline 
            ? 'bg-green-500 text-white' 
            : 'bg-yellow-500 text-gray-900'
          }
        `}
      >
        {/* 在线/离线图标 */}
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4 animate-pulse" />
        )}

        {/* 状态文本 */}
        <span>
          {isOnline ? '在线' : '离线模式'}
        </span>

        {/* 待同步操作 */}
        {pendingSync > 0 && (
          <>
            <span className="mx-1">•</span>
            <span>{pendingSync} 个待同步</span>
            
            {/* 同步按钮 */}
            {isOnline && (
              <button
                onClick={syncPendingOperations}
                disabled={isSyncing}
                className="ml-2 p-1 hover:bg-white/20 rounded transition-colors disabled:opacity-50"
                aria-label="立即同步"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 添加操作到同步队列
 * @param {string} type - 操作类型
 * @param {object} data - 操作数据
 */
export function addToSyncQueue(type, data) {
  try {
    const syncQueue = JSON.parse(localStorage.getItem('offline-sync-queue') || '[]');
    
    syncQueue.push({
      type,
      data,
      timestamp: Date.now(),
      id: `${type}-${Date.now()}-${Math.random()}`
    });

    localStorage.setItem('offline-sync-queue', JSON.stringify(syncQueue));
    
    console.log('✅ 操作已加入同步队列:', type, data);
  } catch (error) {
    console.error('添加到同步队列失败:', error);
  }
}
