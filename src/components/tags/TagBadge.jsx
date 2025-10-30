import { X } from 'lucide-react';

/**
 * 标签徽章组件
 * @param {Object} props
 * @param {string} props.tag - 标签名称
 * @param {string} props.color - 标签颜色 (hex)
 * @param {boolean} props.removable - 是否可删除
 * @param {Function} props.onRemove - 删除回调
 * @param {string} props.size - 尺寸 (sm | md | lg)
 */
export default function TagBadge({ 
  tag, 
  color = '#3B82F6', 
  removable = false, 
  onRemove,
  size = 'md',
  className = ''
}) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium transition-all ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderColor: `${color}40`,
        borderWidth: '1px',
      }}
    >
      <span>{tag}</span>
      {removable && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove?.(tag);
          }}
          className="ml-1 -mr-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
          aria-label={`Remove ${tag}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
