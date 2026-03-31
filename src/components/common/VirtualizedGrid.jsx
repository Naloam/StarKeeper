import { useRef, useEffect, useState } from "react";
import { FixedSizeGrid as Grid } from "react-window";

/**
 * 虚拟化网格组件 - 优化大量数据渲染性能
 * @param {Array} items - 要渲染的数据数组
 * @param {Function} renderItem - 渲染单个项的函数
 * @param {Number} itemWidth - 每个项的宽度
 * @param {Number} itemHeight - 每个项的高度
 * @param {Number} columnCount - 列数
 * @param {Number} gap - 项之间的间距
 */
export default function VirtualizedGrid({
  items,
  renderItem,
  itemWidth = 384,
  itemHeight = 400,
  columnCount = 3,
  gap = 24,
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // 监听容器大小变化
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 根据容器宽度自动计算列数
  const calculateColumnCount = () => {
    if (!dimensions.width) return columnCount;
    const availableWidth = dimensions.width;
    const cols = Math.floor((availableWidth + gap) / (itemWidth + gap));
    return Math.max(1, cols);
  };

  const actualColumnCount = calculateColumnCount();
  const rowCount = Math.ceil(items.length / actualColumnCount);

  // 渲染单元格
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * actualColumnCount + columnIndex;

    if (index >= items.length) {
      return null;
    }

    const item = items[index];

    return (
      <div
        style={{
          ...style,
          left: style.left + gap / 2,
          top: style.top + gap / 2,
          width: style.width - gap,
          height: style.height - gap,
        }}
      >
        {renderItem(item, index)}
      </div>
    );
  };

  // 如果数据少于一屏，使用普通渲染
  if (items.length <= actualColumnCount * 2) {
    return (
      <div
        ref={containerRef}
        className="grid gap-4 sm:gap-6"
        style={{
          gridTemplateColumns: `repeat(${actualColumnCount}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item, index) => (
          <div key={item.id || index}>{renderItem(item, index)}</div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full" style={{ height: "calc(100vh - 16rem)" }}>
      {dimensions.width > 0 && (
        <Grid
          columnCount={actualColumnCount}
          columnWidth={itemWidth + gap}
          height={dimensions.height || 600}
          rowCount={rowCount}
          rowHeight={itemHeight + gap}
          width={dimensions.width}
          className="custom-scrollbar"
          overscanRowCount={1}
        >
          {Cell}
        </Grid>
      )}
    </div>
  );
}
