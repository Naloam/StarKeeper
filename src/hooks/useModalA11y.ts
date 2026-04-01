import { useEffect, useRef, useCallback } from "react";

/**
 * useModalA11y — 为模态框提供无障碍支持
 * - 打开时聚焦到第一个可交互元素
 * - 焦点陷阱：Tab/Shift+Tab 在模态框内循环
 * - Escape 键关闭
 * - 关闭时恢复焦点到触发元素
 *
 * @param {boolean} isOpen - 模态框是否打开
 * @param {Function} onClose - 关闭回调
 * @returns {React.RefObject} 绑定到模态框容器的 ref
 */
export default function useModalA11y(isOpen, onClose) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // 记录打开前的焦点元素
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
    }
  }, [isOpen]);

  // 打开时聚焦到模态框，关闭时恢复焦点
  useEffect(() => {
    if (!isOpen) return;

    // 延迟聚焦，等 DOM 渲染完
    const timer = setTimeout(() => {
      if (!modalRef.current) return;

      // 找到第一个可交互元素
      const focusable = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        modalRef.current.focus();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // 关闭时恢复焦点
  useEffect(() => {
    if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Escape 键和焦点陷阱
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // 阻止背景滚动
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  return modalRef;
}
