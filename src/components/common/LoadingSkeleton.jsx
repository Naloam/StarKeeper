import React from 'react';

/**
 * 骨架屏基础组件
 * 用于显示加载状态，提供更好的用户体验
 */

// 基础骨架屏元素
export const SkeletonBox = ({ className = '', width, height, rounded = 'rounded' }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] ${rounded} ${className}`}
    style={{ width, height }}
  />
);

// 文本骨架屏
export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonBox
        key={index}
        height="16px"
        width={index === lines - 1 ? '80%' : '100%'}
        rounded="rounded"
      />
    ))}
  </div>
);

// 圆形骨架屏（用于头像）
export const SkeletonCircle = ({ size = '40px', className = '' }) => (
  <SkeletonBox width={size} height={size} rounded="rounded-full" className={className} />
);

// 仓库卡片骨架屏
export const RepoCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
    {/* 标题区域 */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <SkeletonBox height="24px" width="70%" className="mb-2" />
        <SkeletonBox height="16px" width="50%" />
      </div>
      <SkeletonCircle size="32px" />
    </div>

    {/* 描述 */}
    <SkeletonText lines={2} className="mb-4" />

    {/* 标签 */}
    <div className="flex gap-2 mb-4">
      <SkeletonBox height="24px" width="60px" rounded="rounded-full" />
      <SkeletonBox height="24px" width="80px" rounded="rounded-full" />
      <SkeletonBox height="24px" width="70px" rounded="rounded-full" />
    </div>

    {/* 底部统计 */}
    <div className="flex items-center gap-4">
      <SkeletonBox height="20px" width="60px" />
      <SkeletonBox height="20px" width="60px" />
      <SkeletonBox height="20px" width="80px" />
    </div>
  </div>
);

// 仓库列表骨架屏
export const RepoListSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <RepoCardSkeleton key={index} />
    ))}
  </div>
);

// 侧边栏骨架屏
export const SidebarSkeleton = () => (
  <div className="space-y-6 p-6">
    {/* 搜索框 */}
    <SkeletonBox height="40px" width="100%" rounded="rounded-lg" />

    {/* 过滤器标题 */}
    <div>
      <SkeletonBox height="20px" width="80px" className="mb-3" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <SkeletonBox height="16px" width="16px" rounded="rounded" />
            <SkeletonBox height="16px" width="100%" />
          </div>
        ))}
      </div>
    </div>

    {/* 标签列表 */}
    <div>
      <SkeletonBox height="20px" width="60px" className="mb-3" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonBox
            key={index}
            height="28px"
            width={`${60 + Math.random() * 40}px`}
            rounded="rounded-full"
          />
        ))}
      </div>
    </div>
  </div>
);

// 统计卡片骨架屏
export const StatsCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <SkeletonBox height="20px" width="100px" />
      <SkeletonCircle size="40px" />
    </div>
    <SkeletonBox height="32px" width="80px" className="mb-2" />
    <SkeletonBox height="16px" width="120px" />
  </div>
);

// 用户信息骨架屏
export const UserInfoSkeleton = () => (
  <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
    <SkeletonCircle size="48px" />
    <div className="flex-1">
      <SkeletonBox height="20px" width="150px" className="mb-2" />
      <SkeletonBox height="16px" width="100px" />
    </div>
  </div>
);

// 表格骨架屏
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    {/* 表头 */}
    <div className="bg-gray-50 border-b border-gray-200 p-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonBox key={index} height="20px" />
        ))}
      </div>
    </div>
    {/* 表格行 */}
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <SkeletonBox key={colIndex} height="16px" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 页面加载骨架屏（完整页面）
export const PageSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    {/* 头部 */}
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <SkeletonBox height="32px" width="150px" />
          <div className="flex items-center gap-4">
            <SkeletonBox height="36px" width="100px" rounded="rounded-lg" />
            <SkeletonCircle size="36px" />
          </div>
        </div>
      </div>
    </div>

    {/* 主体内容 */}
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* 侧边栏 */}
        <div className="col-span-3">
          <SidebarSkeleton />
        </div>

        {/* 主要内容 */}
        <div className="col-span-9">
          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>

          {/* 仓库列表 */}
          <RepoListSkeleton count={6} />
        </div>
      </div>
    </div>
  </div>
);

// 加载遮罩层
export const LoadingOverlay = ({ message = '加载中...' }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8 shadow-2xl max-w-sm w-full mx-4">
      <div className="flex flex-col items-center">
        {/* 加载动画 */}
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        
        {/* 加载文本 */}
        <p className="text-lg font-medium text-gray-800">{message}</p>
        <p className="text-sm text-gray-500 mt-2">请稍候...</p>
      </div>
    </div>
  </div>
);

// 空状态骨架屏
export const EmptySkeleton = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    {icon && <div className="w-24 h-24 mb-6 text-gray-300">{icon}</div>}
    {title && <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>}
    {description && <p className="text-gray-600 mb-6 max-w-md">{description}</p>}
    {action && action}
  </div>
);

export default {
  Box: SkeletonBox,
  Text: SkeletonText,
  Circle: SkeletonCircle,
  RepoCard: RepoCardSkeleton,
  RepoList: RepoListSkeleton,
  Sidebar: SidebarSkeleton,
  StatsCard: StatsCardSkeleton,
  UserInfo: UserInfoSkeleton,
  Table: TableSkeleton,
  Page: PageSkeleton,
  LoadingOverlay,
  Empty: EmptySkeleton,
};
