/**
 * ============================================================================
 * 鸥波艺境 - 工具函数库 (utils.js)
 * ============================================================================
 *
 * 本文件提供全站通用的工具函数，包括：
 *   1. DOM 操作工具
 *   2. 数据加载工具
 *   3. 日期格式化工具
 *   4. URL 参数解析工具
 *   5. 防抖与节流工具
 *   6. 懒加载工具
 *
 * 【使用方式】
 *   本文件需要在 config.js 之后引入。
 *   所有函数挂载在全局 Utils 对象上，避免命名空间污染。
 *
 * @version 1.0.0
 * ============================================================================
 */

const Utils = {


    /* ========================================================================
     * 一、DOM 操作工具
     * ========================================================================
     * 封装常用的 DOM 查询和操作方法，简化代码并统一错误处理。
     * ====================================================================== */

    /**
     * 根据 ID 获取 DOM 元素
     *
     * @param {string} id - 元素的 ID 属性值
     * @returns {HTMLElement|null} 找到的元素，未找到返回 null
     *
     * @example
     * const container = Utils.getById('works-container');
     */
    getById(id) {
        return document.getElementById(id);
    },

    /**
     * 根据选择器获取第一个匹配的元素
     *
     * @param {string} selector - CSS 选择器
     * @param {HTMLElement} [parent=document] - 查找的父容器
     * @returns {HTMLElement|null}
     */
    query(selector, parent = document) {
        return parent.querySelector(selector);
    },

    /**
     * 根据选择器获取所有匹配的元素（返回数组，非 NodeList）
     *
     * @param {string} selector - CSS 选择器
     * @param {HTMLElement} [parent=document] - 查找的父容器
     * @returns {HTMLElement[]}
     */
    queryAll(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    },

    /**
     * 创建 DOM 元素并设置属性和内容
     *
     * @param {string} tag - HTML 标签名
     * @param {Object} [options={}] - 配置项
     * @param {string} [options.className] - CSS 类名
     * @param {string} [options.id] - 元素 ID
     * @param {string} [options.innerHTML] - 内部 HTML
     * @param {string} [options.textContent] - 文本内容
     * @param {Object} [options.attributes] - 其他属性键值对
     * @returns {HTMLElement} 创建的元素
     *
     * @example
     * const div = Utils.createElement('div', {
     *     className: 'card',
     *     textContent: 'Hello'
     * });
     */
    createElement(tag, options = {}) {
        const el = document.createElement(tag);

        /* 设置 CSS 类名 */
        if (options.className) {
            el.className = options.className;
        }

        /* 设置 ID */
        if (options.id) {
            el.id = options.id;
        }

        /* 设置内部 HTML */
        if (options.innerHTML) {
            el.innerHTML = options.innerHTML;
        }

        /* 设置纯文本内容 */
        if (options.textContent) {
            el.textContent = options.textContent;
        }

        /* 设置其他自定义属性 */
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                el.setAttribute(key, value);
            });
        }

        return el;
    },


    /* ========================================================================
     * 二、数据加载工具
     * ========================================================================
     * 封装 fetch 请求，统一处理超时、重试、错误和数据格式校验。
     * ====================================================================== */

    /**
     * 网络请求默认配置
     * timeout  - 请求超时时间（毫秒），超时后自动终止请求
     * retries  - 失败后自动重试次数（仅在可重试的错误上触发）
     * retryDelay - 重试之间的等待时间（毫秒），采用递增策略
     */
    _fetchConfig: {
        timeout: 10000,       /* 10秒超时 */
        retries: 2,           /* 最多重试2次（共3次尝试） */
        retryDelay: 1000,     /* 首次重试等待1秒，后续递增 */
    },

    /**
     * 带超时的 fetch 请求
     * 使用 AbortController 在超时后自动终止请求，避免无限等待。
     *
     * @param {string} url - 请求地址
     * @param {RequestInit} [options] - fetch 选项
     * @param {number} [timeout] - 超时时间（毫秒），默认使用 _fetchConfig.timeout
     * @returns {Promise<Response>} fetch Response 对象
     * @throws {Error} 超时或网络错误时抛出异常
     *
     * @example
     * const response = await Utils.fetchWithTimeout('/data/artwork.json', {}, 8000);
     */
    async fetchWithTimeout(url, options = {}, timeout) {
        /* 使用传入的超时值或默认值 */
        const requestTimeout = timeout || this._fetchConfig.timeout;

        /* 创建 AbortController 用于超时终止 */
        const controller = new AbortController();
        const signal = controller.signal;

        /* 设置超时定时器，超时后调用 abort() 终止请求 */
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, requestTimeout);

        try {
            /* 将 signal 合并到 fetch 选项中 */
            const response = await fetch(url, { ...options, signal });
            return response;
        } catch (error) {
            /* 区分超时错误和其他网络错误，给出不同的提示信息 */
            if (error.name === 'AbortError') {
                throw new Error(`请求超时（${requestTimeout / 1000}秒未响应），请检查网络连接后重试`);
            }
            /* 其他网络错误（如断网、DNS解析失败等） */
            throw new Error(`网络连接失败，请检查网络后重试`);
        } finally {
            /* 无论成功失败，清除超时定时器 */
            clearTimeout(timeoutId);
        }
    },

    /**
     * 判断错误是否可重试
     * 仅对网络抖动、超时、服务器临时错误（5xx）进行重试，
     * 对于 4xx 客户端错误（如404）不重试，因为重试也不会成功。
     *
     * @param {Error} error - 捕获到的错误对象
     * @returns {boolean} 是否应该重试
     */
    _isRetryableError(error) {
        const message = error.message || '';

        /* 超时错误 → 可重试（可能是网络临时抖动） */
        if (message.includes('请求超时')) return true;

        /* 网络连接失败 → 可重试（可能是短暂断网） */
        if (message.includes('网络连接失败')) return true;

        /* 服务器错误（5xx）→ 可重试（服务器可能临时故障） */
        if (message.includes('服务器错误')) return true;

        /* 其他错误（如404、数据格式错误等）→ 不可重试 */
        return false;
    },

    /**
     * 加载 JSON 数据文件（带超时与自动重试）
     *
     * 请求流程：
     *   1. 发起带超时的 fetch 请求
     *   2. 检查 HTTP 状态码（区分 4xx 和 5xx 错误）
     *   3. 检查 Content-Type 是否为 JSON
     *   4. 解析 JSON 数据
     *   5. 若失败且错误可重试，等待递增延时后重试
     *
     * @param {string} url - JSON 文件的 URL
     * @param {Object} [options] - 可选配置
     * @param {number} [options.retries] - 覆盖默认重试次数
     * @param {number} [options.timeout] - 覆盖默认超时时间
     * @returns {Promise<any>} 解析后的 JSON 数据
     * @throws {Error} 当所有重试都失败，或遇到不可重试的错误时抛出异常
     *
     * @example
     * const works = await Utils.loadJSON('/data/artwork.json');
     * // 自定义重试次数
     * const works = await Utils.loadJSON('/data/artwork.json', { retries: 3 });
     */
    async loadJSON(url, options = {}) {
        /* 解析 basePath ，拼接为正确的URL */
        url = PathUtils.resolve(url);
        
        /* 获取重试配置，允许调用方覆盖默认值 */
        const maxRetries = options.retries ?? this._fetchConfig.retries;
        const requestTimeout = options.timeout ?? this._fetchConfig.timeout;
        const baseDelay = this._fetchConfig.retryDelay;

        /* 记录最近一次错误，用于最终抛出 */
        let lastError = null;

        /* 尝试请求，最多 maxRetries + 1 次（1次初始 + maxRetries次重试） */
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                /* 非首次尝试时，等待递增延时后重试 */
                if (attempt > 0) {
                    /* 递增延时策略：第1次重试等1秒，第2次等2秒，以此类推 */
                    const delay = baseDelay * attempt;
                    console.warn(`[Utils] 第 ${attempt} 次重试加载 (${url})，等待 ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                /* 发起带超时的请求 */
                const response = await this.fetchWithTimeout(url, {}, requestTimeout);

                /* ---- 检查 HTTP 状态码 ---- */
                if (!response.ok) {
                    /*
                     * 区分客户端错误（4xx）和服务器错误（5xx）：
                     * - 4xx：请求本身有问题，重试无意义
                     * - 5xx：服务器临时故障，可重试
                     */
                    if (response.status >= 400 && response.status < 500) {
                        /* 客户端错误，不重试 */
                        const clientErrorMessages = {
                            404: '请求的资源不存在',
                            403: '没有访问权限',
                            401: '需要登录验证',
                        };
                        const friendlyMessage = clientErrorMessages[response.status]
                            || `请求失败（错误码 ${response.status}）`;
                        throw new Error(friendlyMessage);
                    }

                    if (response.status >= 500) {
                        /* 服务器错误，可重试 */
                        throw new Error(`服务器错误（${response.status}），请稍后重试`);
                    }

                    /* 其他非成功状态码 */
                    throw new Error(`请求失败（状态码 ${response.status}）`);
                }

                /* ---- 检查 Content-Type ---- */
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    /*
                     * 返回的不是 JSON 格式，这通常是服务端配置问题，
                     * 不属于可重试的临时故障，直接抛出。
                     */
                    throw new Error('返回数据格式不正确，请联系管理员');
                }

                /* ---- 解析 JSON 数据 ---- */
                const data = await response.json();
                return data;

            } catch (error) {
                lastError = error;
                console.error(`[Utils] 加载 JSON 失败 (${url})，第 ${attempt + 1} 次尝试:`, error.message);

                /*
                 * 判断是否应该重试：
                 * - 如果还有剩余重试次数，且错误类型可重试，则继续循环
                 * - 否则跳出循环，准备抛出最终错误
                 */
                if (attempt < maxRetries && this._isRetryableError(error)) {
                    continue;  /* 继续下一次尝试 */
                }

                /* 不可重试的错误，或已用完所有重试次数，跳出循环 */
                break;
            }
        }

        /* 所有尝试均失败，抛出最后一次的错误 */
        console.error(`[Utils] 加载 JSON 最终失败 (${url}):`, lastError);
        throw lastError;
    },

    /**
     * 并行加载多个 JSON 数据源（带超时与重试）
     * 每个数据源独立重试，互不影响。
     *
     * @param {Object<string, string>} sources - 键值对：{ 名称: URL }
     * @param {Object} [options] - 传递给 loadJSON 的配置项（如 retries、timeout）
     * @returns {Promise<Object>} 键值对：{ 名称: 数据 }
     *
     * @example
     * const data = await Utils.loadMultiple({
     *     artworks: '/data/artwork.json',
     *     dynamics: '/data/dynamic.json'
     * });
     * // data.artworks, data.dynamics
     */
    async loadMultiple(sources, options = {}) {
        const entries = Object.entries(sources);
        const promises = entries.map(([, url]) => Utils.loadJSON(url, options));
        const results = await Promise.all(promises);

        /* 将结果重新组装为键值对 */
        return entries.reduce((acc, [key], index) => {
            acc[key] = results[index];
            return acc;
        }, {});
    },


    /* ========================================================================
     * 三、日期格式化工具
     * ========================================================================
     * 提供统一的日期格式化方法，确保全站日期显示一致。
     * ====================================================================== */

    /**
     * 格式化日期为中文友好格式（年月日 + 时间）
     *
     * @param {string} dateStr - 日期字符串（格式 YYYY-MM-DD）
     * @param {string} [timeStr] - 时间字符串（格式 HH:MM），可选
     * @returns {string} 格式化后的日期字符串
     *
     * @example
     * Utils.formatDate('2025-11-14')           // → '2025年11月14日'
     * Utils.formatDate('2025-11-14', '9:48')   // → '2025年11月14日 09:48'
     * Utils.formatDate('2025-11-14', '14:5')   // → '2025年11月14日 14:05'
     */
    formatDate(dateStr, timeStr) {
        if (!dateStr) return '';

        const [year, month, day] = dateStr.split('-');
        let result = `${year}年${parseInt(month)}月${parseInt(day)}日`;

        /* 如果提供了时间，追加到日期后面 */
        if (timeStr) {
            /* 规范化时间：确保小时和分钟都显示为两位数 */
            const parts = timeStr.split(':');
            if (parts.length >= 2) {
                const hours = parts[0].padStart(2, '0');
                const minutes = parts[1].padStart(2, '0');
                result += ` ${hours}:${minutes}`;
            } else {
                result += ` ${timeStr}`;
            }
        }

        return result;
    },

    /**
     * 格式化日期为年月格式（只显示年月，不显示日）
     * 用于作品发布日期等只需精确到月的场景
     *
     * @param {string} dateStr - 日期字符串（格式 YYYY-MM-DD 或 YYYY-MM）
     * @returns {string} 格式化后的日期字符串
     *
     * @example
     * Utils.formatDateYearMonth('2025-11-14')  // → '2025年11月'
     * Utils.formatDateYearMonth('2025-3')      // → '2025年3月'
     */
    formatDateYearMonth(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        return `${parts[0]}年${parseInt(parts[1])}月`;
    },

    /**
     * 格式化日期为短格式（月/日）
     *
     * @param {string} dateStr - 日期字符串
     * @returns {string}
     *
     * @example
     * Utils.formatDateShort('2025-11-14')  // → '11月14日'
     */
    formatDateShort(dateStr) {
        if (!dateStr) return '';
        const [, month, day] = dateStr.split('-');
        return `${parseInt(month)}月${parseInt(day)}日`;
    },


    /* ========================================================================
     * 四、URL 参数工具
     * ========================================================================
     * 解析 URL 查询参数，用于页面间传值。
     * ====================================================================== */

    /**
     * 获取当前页面 URL 中的查询参数
     *
     * @param {string} name - 参数名
     * @returns {string|null} 参数值，不存在则返回 null
     *
     * @example
     * // URL: /page/work-detail.html?id=S001
     * Utils.getParam('id')  // → 'S001'
     */
    getParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    },

    /**
     * 获取所有查询参数
     *
     * @returns {Object} 参数键值对
     */
    getAllParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        params.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    },


    /* ========================================================================
     * 五、防抖与节流工具
     * ========================================================================
     * 用于优化高频事件（如输入搜索、滚动加载等）。
     * ====================================================================== */

    /**
     * 防抖函数
     * 在连续触发事件后，只执行最后一次。
     *
     * @param {Function} fn - 需要防抖的函数
     * @param {number} [delay=300] - 延迟时间（毫秒）
     * @returns {Function} 防抖后的函数
     *
     * @example
     * const debouncedSearch = Utils.debounce(searchFn, 300);
     * input.addEventListener('input', debouncedSearch);
     */
    debounce(fn, delay = 300) {
        let timer = null;
        return function (...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        };
    },

    /**
     * 节流函数
     * 在指定时间间隔内，最多执行一次。
     *
     * @param {Function} fn - 需要节流的函数
     * @param {number} [interval=300] - 时间间隔（毫秒）
     * @returns {Function} 节流后的函数
     *
     * @example
     * const throttledScroll = Utils.throttle(handleScroll, 200);
     * window.addEventListener('scroll', throttledScroll);
     */
    throttle(fn, interval = 300) {
        let lastTime = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastTime >= interval) {
                lastTime = now;
                fn.apply(this, args);
            }
        };
    },


    /* ========================================================================
     * 六、懒加载工具
     * ========================================================================
     * 基于 Intersection Observer 的懒加载实现。
     * 统一使用 data-src + JS Observer 方案，不使用原生 loading="lazy"，
     * 原因：
     *   1. 兼容性更佳（老旧浏览器不支持原生 lazy）
     *   2. 控制粒度更细（可配置提前加载距离、回调等）
     *   3. 扩展性更强（可添加加载动画、骨架屏等）
     *
     * 使用方式：
     *   HTML 中: <img data-src="实际图片URL" alt="...">
     *   JS 中:   Utils.observeLazyImages(container);
     * ====================================================================== */

    /**
     * 创建懒加载观察器
     * 当元素进入视口时，执行回调函数。
     *
     * @param {Function} callback - 元素进入视口时的回调
     * @param {Object} [options={}] - IntersectionObserver 配置项
     * @param {number} [options.rootMargin='200px'] - 提前加载的距离
     * @param {number} [options.threshold=0] - 触发阈值
     * @returns {IntersectionObserver} 观察器实例
     *
     * @example
     * const observer = Utils.createLazyLoader((entry) => {
     *     const img = entry.target;
     *     img.src = img.dataset.src;
     * });
     * document.querySelectorAll('img[data-src]').forEach(img => {
     *     observer.observe(img);
     * });
     */
    createLazyLoader(callback, options = {}) {
        const defaultOptions = {
            rootMargin: '200px',  /* 提前 200px 开始加载 */
            threshold: 0,
        };

        const mergedOptions = { ...defaultOptions, ...options };

        /* 先声明 observer 变量，再赋值，使回调内部能正确引用 */
        let observer = null;

        observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    try {
                        callback(entry);
                    } catch (err) {
                        console.error('[Utils] 懒加载回调执行失败:', err);
                    }
                    /* 无论回调是否成功，都停止观察该元素，避免重复触发 */
                    observer.unobserve(entry.target);
                }
            });
        }, mergedOptions);

        return observer;
    },


    /**
     * 观察指定容器内的所有懒加载图片
     * 自动将 data-src 转换为 src，实现图片按需加载。
     * 这是本项目推荐的懒加载使用方式，替代原生 loading="lazy"。
     *
     * @param {HTMLElement} [container=document] - 容器元素，默认为整个文档
     * @param {IntersectionObserver} [observer] - 可复用的观察器实例，不传则创建新的
     *
     * @example
     * // 渲染卡片后，观察容器内的懒加载图片
     * container.appendChild(fragment);
     * Utils.observeLazyImages(container);
     */
    observeLazyImages(container = document, observer = null) {
        /* 如果未传入观察器，创建一个默认的图片懒加载观察器 */
        const lazyObserver = observer || this.createLazyLoader((entry) => {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
        });

        /* 查找容器内所有带 data-src 的图片并开始观察 */
        const lazyImages = container.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => lazyObserver.observe(img));

        return lazyObserver;
    },


    /* ========================================================================
     * 七、分页计算工具
     * ========================================================================
     * 处理分页逻辑的计算函数。
     * ====================================================================== */

    /**
     * 计算分页信息
     *
     * @param {number} totalItems - 总条目数
     * @param {number} itemsPerPage - 每页条目数
     * @param {number} [currentPage=1] - 当前页码（从1开始）
     * @returns {Object} 分页信息对象
     * @returns {number} totalPages - 总页数
     * @returns {number} startIndex - 当前页起始索引
     * @returns {number} endIndex - 当前页结束索引
     * @returns {boolean} hasPrev - 是否有上一页
     * @returns {boolean} hasNext - 是否有下一页
     *
     * @example
     * const page = Utils.paginate(25, 10, 2);
     * // { totalPages: 3, startIndex: 10, endIndex: 19, hasPrev: true, hasNext: true }
     */
    paginate(totalItems, itemsPerPage, currentPage = 1) {
        const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
        const safePage = Math.min(Math.max(1, currentPage), totalPages);

        return {
            currentPage: safePage,
            totalPages,
            startIndex: (safePage - 1) * itemsPerPage,
            endIndex: Math.min(safePage * itemsPerPage - 1, totalItems - 1),
            hasPrev: safePage > 1,
            hasNext: safePage < totalPages,
        };
    },

    /**
     * 生成分页页码数组
     * 包含省略号的智能页码列表
     *
     * @param {number} totalPages - 总页数
     * @param {number} currentPage - 当前页码
     * @param {number} [maxVisible=5] - 最多显示的页码数
     * @returns {Array<number|string>} 页码数组，省略号用 '...' 表示
     *
     * @example
     * Utils.getPageNumbers(10, 5)  // → [1, '...', 4, 5, 6, '...', 10]
     */
    getPageNumbers(totalPages, currentPage, maxVisible = 5) {
        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages = [];
        const half = Math.floor(maxVisible / 2);

        /* 始终显示第一页 */
        pages.push(1);

        let start = Math.max(2, currentPage - half);
        let end = Math.min(totalPages - 1, currentPage + half);

        /* 调整范围确保显示足够的页码 */
        if (start > 2) pages.push('...');
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        if (end < totalPages - 1) pages.push('...');

        /* 始终显示最后一页 */
        pages.push(totalPages);

        return pages;
    },


    /* ========================================================================
     * 七-B、URL 参数工具
     * ========================================================================
     * 用于分页状态的 URL 参数保持，支持浏览器前进/后退。
     * ====================================================================== */

    /**
     * 从当前页面 URL 中读取指定查询参数
     *
     * @param {string} name - 参数名
     * @param {string} [defaultValue=''] - 参数不存在时的默认值
     * @returns {string} 参数值
     *
     * @example
     * // URL: /page/works.html?page=3
     * Utils.getUrlParam('page')  // → '3'
     * Utils.getUrlParam('search', '')  // → ''
     */
    getUrlParam(name, defaultValue = '') {
        const params = new URLSearchParams(window.location.search);
        return params.get(name) || defaultValue;
    },

    /**
     * 更新当前页面 URL 中的查询参数（不刷新页面）
     * 使用 history.replaceState 避免产生过多历史记录
     *
     * @param {Object} params - 要更新的参数键值对
     *
     * @example
     * Utils.updateUrlParams({ page: 3, search: '春天' })
     * // URL 变为 /page/works.html?page=3&search=春天
     */
    updateUrlParams(params) {
        const url = new URL(window.location.href);
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, String(value));
            }
        });
        /* 使用 replaceState 而非 pushState，避免每次翻页产生一条历史记录 */
        window.history.replaceState({}, '', url.toString());
    },


    /* ========================================================================
     * 八、文本处理工具
     * ====================================================================== */

    /**
     * 将文本中的换行符转换为 HTML <br> 标签
     * 用于将 JSON 中存储的多行文本渲染到页面上
     *
     * @param {string} text - 原始文本
     * @returns {string} 转换后的 HTML
     *
     * @example
     * Utils.nl2br('第一行\n第二行')  // → '第一行<br>第二行'
     */
    nl2br(text) {
        if (!text) return '';
        return text.replace(/\n/g, '<br>');
    },

    /**
     * 高亮搜索关键词
     * 在文本中匹配关键词并用 <mark> 标签包裹
     *
     * @param {string} text - 原始文本
     * @param {string} keyword - 搜索关键词
     * @returns {string} 包含高亮标记的 HTML
     */
    highlightKeyword(text, keyword) {
        if (!text || !keyword) return text;
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    },

    /**
     * 截断文本，超出部分显示省略号
     *
     * @param {string} text - 原始文本
     * @param {number} [maxLength=100] - 最大长度
     * @returns {string}
     */
    truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },


    /* ========================================================================
     * 九、错误分类与友好提示工具
     * ========================================================================
     * 将技术性错误信息转换为用户可理解的友好提示，
     * 同时在控制台保留详细的技术信息供开发者调试。
     * ====================================================================== */

    /**
     * 错误类型枚举
     * 用于分类不同来源的错误，方便针对性地处理和展示。
     */
    ErrorType: {
        NETWORK: 'network',           /* 网络连接失败（断网、DNS解析失败等） */
        TIMEOUT: 'timeout',           /* 请求超时 */
        SERVER: 'server',             /* 服务器错误（5xx） */
        CLIENT: 'client',             /* 客户端请求错误（4xx） */
        DATA_FORMAT: 'data_format',   /* 数据格式不正确 */
        MEDIA_LOAD: 'media_load',     /* 音频/视频加载失败 */
        FEATURE_DISABLED: 'feature',  /* 功能未启用 */
        VALIDATION: 'validation',     /* 表单验证错误 */
        UNKNOWN: 'unknown',           /* 未知错误 */
    },

    /**
     * 将错误对象分类并生成用户友好的提示信息
     *
     * 根据错误消息中的关键词自动判断错误类型，
     * 并返回面向用户的友好提示文字。
     *
     * @param {Error|string} error - 错误对象或错误消息
     * @returns {{ type: string, message: string, detail: string }}
     *   - type: 错误分类（对应 ErrorType 枚举）
     *   - message: 面向用户的友好提示（可直接展示）
     *   - detail: 技术细节（用于控制台日志或开发者调试）
     *
     * @example
     * const info = Utils.classifyError(new Error('请求超时'));
     * // info.type === 'timeout'
     * // info.message === '请求超时，请检查网络连接后重试'
     * // info.detail === '请求超时'
     */
    classifyError(error) {
        /* 统一提取错误消息文本 */
        const errorMsg = (error instanceof Error) ? error.message : String(error || '未知错误');

        /* ---- 按关键词匹配错误类型 ---- */

        /* 网络连接失败（非超时类） */
        if (errorMsg.includes('网络连接失败') || errorMsg.includes('Failed to fetch')
            || errorMsg.includes('NetworkError') || errorMsg.includes('Net::ERR_')) {
            return {
                type: this.ErrorType.NETWORK,
                message: '网络连接失败，请检查网络后重试',
                detail: errorMsg,
            };
        }

        /* 请求超时 */
        if (errorMsg.includes('请求超时') || errorMsg.includes('AbortError')) {
            return {
                type: this.ErrorType.TIMEOUT,
                message: '请求超时，请检查网络连接后重试',
                detail: errorMsg,
            };
        }

        /* 服务器错误（5xx） */
        if (errorMsg.includes('服务器错误') || errorMsg.includes('500')
            || errorMsg.includes('502') || errorMsg.includes('503')) {
            return {
                type: this.ErrorType.SERVER,
                message: '服务器暂时无法响应，请稍后重试',
                detail: errorMsg,
            };
        }

        /* 客户端请求错误（4xx） */
        if (errorMsg.includes('不存在') || errorMsg.includes('404')) {
            return {
                type: this.ErrorType.CLIENT,
                message: '请求的内容不存在',
                detail: errorMsg,
            };
        }
        if (errorMsg.includes('没有访问权限') || errorMsg.includes('403')) {
            return {
                type: this.ErrorType.CLIENT,
                message: '没有访问权限',
                detail: errorMsg,
            };
        }

        /* 数据格式错误 */
        if (errorMsg.includes('格式') || errorMsg.includes('JSON')
            || errorMsg.includes('解析')) {
            return {
                type: this.ErrorType.DATA_FORMAT,
                message: '数据格式异常，请刷新页面重试',
                detail: errorMsg,
            };
        }

        /* 媒体加载失败 */
        if (errorMsg.includes('音频') || errorMsg.includes('视频')
            || errorMsg.includes('媒体') || errorMsg.includes('MEDIA_')) {
            return {
                type: this.ErrorType.MEDIA_LOAD,
                message: '媒体资源加载失败，请刷新重试',
                detail: errorMsg,
            };
        }

        /* 功能未启用 */
        if (errorMsg.includes('未启用') || errorMsg.includes('未开放')) {
            return {
                type: this.ErrorType.FEATURE_DISABLED,
                message: '该功能暂未开放',
                detail: errorMsg,
            };
        }

        /* 表单验证错误 */
        if (errorMsg.includes('验证') || errorMsg.includes('不能为空')
            || errorMsg.includes('格式不正确')) {
            return {
                type: this.ErrorType.VALIDATION,
                message: errorMsg,  /* 验证错误直接展示具体原因 */
                detail: errorMsg,
            };
        }

        /* 未匹配到已知类型，归为未知错误 */
        return {
            type: this.ErrorType.UNKNOWN,
            message: '操作失败，请稍后重试',
            detail: errorMsg,
        };
    },

    /**
     * 将错误信息记录到控制台（开发者视角）
     * 在控制台输出包含模块标识和详细堆栈的日志，
     * 便于开发者在调试时定位问题。
     *
     * @param {string} module - 模块标识（如 'DataLoader'、'WorkDetail'）
     * @param {string} action - 操作描述（如 '加载作品数据'）
     * @param {Error|string} error - 错误对象
     */
    logError(module, action, error) {
        const detail = (error instanceof Error) ? error.stack || error.message : String(error);
        console.error(`[${module}] ${action}失败:`, detail);
    },
};
