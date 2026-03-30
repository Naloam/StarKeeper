import { useState, useEffect, useRef } from "react";

/**
 * 懒加载图片组件 - 优化图片加载性能
 * @param {String} src - 图片源地址
 * @param {String} alt - 图片描述
 * @param {String} className - 样式类名
 * @param {String} placeholder - 占位图片
 */
export default function LazyImage({
  src,
  alt = "",
  className = "",
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3C/svg%3E',
}) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  // 使用 Intersection Observer 检测图片是否进入视口
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // 提前 50px 开始加载
      },
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // 当图片进入视口时加载真实图片
  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };

    img.onerror = () => {
      // 加载失败时使用默认头像
      setImageSrc("https://github.com/identicons/default.png");
      setIsLoaded(true);
    };
  }, [isInView, src]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? "opacity-100" : "opacity-50"} transition-opacity duration-300`}
      loading="lazy"
    />
  );
}
