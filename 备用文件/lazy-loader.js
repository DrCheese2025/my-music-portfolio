// 可以创建一个独立的 lazy-loader.js 文件

/**
 * 增强版懒加载器
 */
class EnhancedLazyLoader {
    constructor() {
        this.observer = null;
        this.placeholder = '../artwork/cover/V001-cover.webp';
        this.init();
    }

    init() {
        // 检查浏览器支持
        if (!('IntersectionObserver' in window)) {
            this.fallbackLoad(); // 降级方案
            return;
        }

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadElement(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '100px 0px', // 提前100px加载
            threshold: 0.01
        });
    }

    /**
     * 加载元素
     */
    loadElement(element) {
        if (element.tagName === 'IMG') {
            this.loadImage(element);
        } else if (element.tagName === 'VIDEO') {
            this.loadVideo(element);
        }
    }

    /**
     * 加载图片
     */
    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
        };
        tempImg.onerror = () => {
            console.warn('图片加载失败:', src);
        };
        tempImg.src = src;
    }

    /**
     * 加载视频
     */
    loadVideo(video) {
        const source = video.querySelector('source[data-src]');
        if (source) {
            source.src = source.dataset.src;
            source.removeAttribute('data-src');
            video.load(); // 重新加载视频
        }
    }

    /**
     * 降级方案：直接加载所有资源
     */
    fallbackLoad() {
        console.log('浏览器不支持 IntersectionObserver，使用降级方案');
        const lazyElements = document.querySelectorAll('[data-src]');
        lazyElements.forEach(el => {
            if (el.tagName === 'IMG') {
                el.src = el.dataset.src;
            }
            el.removeAttribute('data-src');
        });
    }

    /**
     * 观察元素
     */
    observe(element) {
        if (this.observer && element) {
            this.observer.observe(element);
        }
    }

    /**
     * 销毁观察器
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// 导出单例
const enhancedLazyLoader = new EnhancedLazyLoader();