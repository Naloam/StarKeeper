import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * 防抖 Hook - 延迟执行函数，直到停止调用一段时间后才执行
 * @param {Function} callback - 要防抖的函数
 * @param {Number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function useDebounce(callback, delay = 300) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // 保持 callback 引用最新
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

/**
 * 节流 Hook - 限制函数在一段时间内只能执行一次
 * @param {Function} callback - 要节流的函数
 * @param {Number} delay - 节流时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function useThrottle(callback, delay = 300) {
  const lastRunRef = useRef(Date.now());
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // 保持 callback 引用最新
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        // 立即执行
        callbackRef.current(...args);
        lastRunRef.current = now;
      } else {
        // 延迟执行
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callbackRef.current(...args);
          lastRunRef.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [delay]
  );
}

/**
 * 防抖值 Hook - 返回防抖后的值
 * @param {*} value - 要防抖的值
 * @param {Number} delay - 延迟时间（毫秒）
 * @returns {*} 防抖后的值
 */
export function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
