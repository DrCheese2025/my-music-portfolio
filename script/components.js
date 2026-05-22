/**
 * ============================================================================
 * 鸥波艺境 - 通用 UI 组件 (components.js)
 * ============================================================================
 *
 * 本文件封装了全站通用的 UI 组件渲染方法，包括：
 *   1. 作品卡片组件
 *   2. 动态卡片组件
 *   3. 分页组件
 *   4. 标签页组件
 *   5. 消息提示组件
 *
 * 【设计原则】
 *   - 每个组件方法返回 HTMLElement，由调用者负责插入 DOM
 *   - 组件与数据解耦，通过参数传入数据
 *   - 事件监听通过回调函数传递，保持组件的可复用性
 *
 * @version 1.0.0
 * ============================================================================
 */

const UIComponents = {


    /* ========================================================================
     * 一、作品卡片组件
     * ========================================================================
     * 用于在首页和作品集页面展示作品缩略信息。
     * ====================================================================== */

    /**
     * 创建作品卡片元素
     *
     * @param {Object} work - 作品数据对象
     * @param {Function} [onClick] - 点击卡片的回调函数，参数为 work 对象
     * @returns {HTMLElement} 卡片元素
     */
    createWorkCard(work, onClick) {
        /* 创建卡片容器 */
        const card = Utils.createElement('article', {
            className: 'card card--clickable work-card',
            attributes: {
                'data-work-id': work.id,
                'role': 'link',
                'aria-label': `查看作品：${work.title}`,
                'tabindex': '0',
            },
        });

        /* 构建封面区域 - 有封面图时添加加载失败兜底 */
        const coverHTML = work.cover
            ? `<img class="card__cover" data-src="${work.cover}" alt="${work.title}封面" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="card__cover-placeholder" style="display:none" aria-hidden="true"><span>${work.type === 'video' ? '🎬' : '🎵'}</span></div>`
            : `<div class="card__cover-placeholder" aria-hidden="true">
                 <span>${work.type === 'video' ? '🎬' : '🎵'}</span>
               </div>`;

        /* 构建分类标签 */
        /* 获取标签样式信息 */
        const tagInfo = this._getTagInfo(work.tag);

        /* 构建卡片内容 */
        card.innerHTML = `
            ${coverHTML}
            <div class="card__body">
                <div class="work-card__tag">
                    <span class="tag ${tagInfo.cssClass}">${tagInfo.label}</span>
                </div>
                <h3 class="work-card__title">${work.title}</h3>
                ${work.subtitle ? `<p class="work-card__subtitle">${work.subtitle}</p>` : ''}
                <p class="work-card__meta">${work.createDate ? Utils.formatDateYearMonth(work.createDate) : ''}</p>
            </div>
        `;

        /* 绑定点击事件 */
        if (onClick) {
            card.addEventListener('click', () => onClick(work));
            /* 键盘回车键也可以触发点击 */
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick(work);
                }
            });
        }

        /* 防止音频控制条的点击冒泡到卡片 */
        const audioEl = card.querySelector('audio');
        if (audioEl) {
            audioEl.addEventListener('click', (e) => e.stopPropagation());
        }

        return card;
    },

    /**
     * 根据分类标签名获取对应的标签信息
     *
     * 从 CONFIG.tags.registry 中查找标签配置，返回 CSS 类名和显示名。
     * 如果标签未注册，返回默认（缺省）样式类。
     *
     * @param {string} tag - 分类标签名（如 "原创歌曲"、"纯音乐" 等）
     * @returns {{ cssClass: string, label: string, colorKey: string }}
     *   - cssClass: 用于该标签的 CSS 类名（如 "tag--song"）
     *   - label: 标签显示文本（若未注册则显示原始 tag 值）
     *   - colorKey: CSS 变量中对应的颜色键名（如 "song"）
     * @private
     */
    _getTagInfo(tag) {
        /* 标签未传入时返回默认缺省值 */
        if (!tag) {
            return { cssClass: 'tag--default', label: '未分类', colorKey: 'default' };
        }

        /* 从配置中心查找已注册的标签 */
        const registry = CONFIG.tags.registry;
        if (registry[tag]) {
            return {
                cssClass: `tag--${registry[tag].colorKey}`,
                label: tag,
                colorKey: registry[tag].colorKey,
            };
        }

        /* 未注册的标签使用缺省样式 */
        return { cssClass: 'tag--default', label: tag, colorKey: 'default' };
    },


    /* ========================================================================
     * 二、动态卡片组件
     * ========================================================================
     * 用于在首页和动态页面展示动态信息。
     * ====================================================================== */

    /**
     * 创建动态卡片元素
     *
     * @param {Object} dynamic - 动态数据对象
     *   - id: 动态唯一标识
     *   - title: 动态标题
     *   - content: 动态正文
     *   - image: 配图路径（可选）
     *   - relatedWorkId: 关联作品ID（可选）
     *   - relatedWorkTitle: 关联作品标题（可选，由调用方从作品数据中填充）
     *   - relatedWorkType: 关联作品类型（可选，由调用方从作品数据中填充）
     *   - date: 发布日期（格式 YYYY-MM-DD）
     *   - time: 发布时间（格式 HH:MM，可选）
     * @param {Function} [onRelatedWorkClick] - 点击关联作品的回调，参数为作品ID
     * @returns {HTMLElement} 卡片元素
     */
    createDynamicCard(dynamic, onRelatedWorkClick) {
        const card = Utils.createElement('article', {
            className: 'dynamic-card card',
            attributes: {
                'data-dynamic-id': dynamic.id,
            },
        });

        /* 格式化日期和时间 */
        const formattedDate = Utils.formatDate(dynamic.date, dynamic.time);

        /* 构建配图区域 */
        let imageHTML = '';
        if (dynamic.image) {
            imageHTML = `<div class="dynamic-card__image">
                <img data-src="${dynamic.image}" alt="${dynamic.title}">
            </div>`;
        }

        /* 构建关联作品区域 */
        let relatedWorkHTML = '';
        if (dynamic.relatedWorkId) {
            /* 使用关联作品的标题（如果调用方已填充），否则显示默认文字 */
            const displayText = dynamic.relatedWorkTitle || '关联作品';
            const icon = dynamic.relatedWorkType === 'video' ? '🎬' : '🎵';
            relatedWorkHTML = `<div class="dynamic-card__related-work" data-ref-id="${dynamic.relatedWorkId}" role="link" tabindex="0" aria-label="查看关联作品：${displayText}">
                <span class="dynamic-card__related-icon" aria-hidden="true">${icon}</span>
                <span class="dynamic-card__related-text">${displayText}</span>
            </div>`;
        }

        /* 组装卡片内容 */
        card.innerHTML = `
            <div class="card__body">
                <h3 class="dynamic-card__title">${dynamic.title}</h3>
                <div class="dynamic-card__content">
                    ${Utils.nl2br(dynamic.content)}
                </div>
                ${imageHTML}
                ${relatedWorkHTML}
                <div class="dynamic-card__meta">
                    <time datetime="${dynamic.date}">${formattedDate}</time>
                </div>
            </div>
        `;

        /* 绑定关联作品点击事件 */
        if (onRelatedWorkClick) {
            const relatedEl = card.querySelector('.dynamic-card__related-work');
            if (relatedEl) {
                relatedEl.addEventListener('click', (e) => {
                    e.stopPropagation();  /* 阻止冒泡到卡片 */
                    const refId = relatedEl.dataset.refId;
                    onRelatedWorkClick(refId);
                });
                /* 键盘回车/空格也可以触发关联作品跳转 */
                relatedEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        const refId = relatedEl.dataset.refId;
                        onRelatedWorkClick(refId);
                    }
                });
            }
        }

        return card;
    },


    /* ========================================================================
     * 三、分页组件
     * ========================================================================
     * 生成翻页按钮，支持省略号显示。
     * ====================================================================== */

    /**
     * 渲染分页组件
     *
     * @param {HTMLElement} container - 分页容器元素
     * @param {Object} pageInfo - 分页信息（由 Utils.paginate 返回）
     * @param {Function} onPageChange - 页码变化回调，参数为新页码
     */
    renderPagination(container, pageInfo, onPageChange) {
        if (!container) return;

        /* 总页数 ≤ 1 时不显示分页 */
        if (pageInfo.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        /* 获取页码数组 */
        const pageNumbers = Utils.getPageNumbers(pageInfo.totalPages, pageInfo.currentPage);

        /* 创建分页导航 */
        const nav = Utils.createElement('nav', {
            className: 'pagination',
            attributes: { 'aria-label': '分页导航' },
        });

        /* 上一页按钮 — 使用 ‹ 单尖括号 */
        const prevBtn = Utils.createElement('button', {
            className: 'pagination__btn',
            innerHTML: '&#8249;',   /* 左单尖号的十进制HTML实体表示 */
        });
        prevBtn.setAttribute('aria-label', '上一页');
        /* disabled 属性控制：仅当 hasPrev 为 false 时设置 disabled */
        if (!pageInfo.hasPrev) {
            prevBtn.disabled = true;
        } else {
            prevBtn.addEventListener('click', () => onPageChange(pageInfo.currentPage - 1));
        }
        nav.appendChild(prevBtn);

        /* 页码按钮 */
        pageNumbers.forEach((page) => {
            if (page === '...') {
                const ellipsis = Utils.createElement('span', {
                    className: 'pagination__ellipsis',
                    textContent: '…',
                });
                nav.appendChild(ellipsis);
            } else {
                const pageBtn = Utils.createElement('button', {
                    className: `pagination__btn${page === pageInfo.currentPage ? ' pagination__btn--active' : ''}`,
                    textContent: String(page),
                    attributes: {
                        'aria-label': `第${page}页`,
                        'aria-current': page === pageInfo.currentPage ? 'page' : 'false',
                    },
                });
                if (page !== pageInfo.currentPage) {
                    pageBtn.addEventListener('click', () => onPageChange(page));
                }
                nav.appendChild(pageBtn);
            }
        });

        /* 下一页按钮 — 使用 › 单尖括号 */
        const nextBtn = Utils.createElement('button', {
            className: 'pagination__btn',
            innerHTML: '&#8250;',  /* 右单尖号的十进制HTML实体表示 */
        });
        nextBtn.setAttribute('aria-label', '下一页');
        /* disabled 属性控制：仅当 hasNext 为 false 时设置 disabled */
        if (!pageInfo.hasNext) {
            nextBtn.disabled = true;
        } else {
            nextBtn.addEventListener('click', () => onPageChange(pageInfo.currentPage + 1));
        }
        nav.appendChild(nextBtn);

        /* 替换容器内容 */
        container.innerHTML = '';
        container.appendChild(nav);
    },


    /* ========================================================================
     * 四、标签页组件
     * ========================================================================
     * 用于作品详情页的"歌词/曲谱/创作手记"等内容切换。
     *
     * API 设计统一：createTabs(tabs, options) → 返回容器元素
     * 与 createWorkCard / createDynamicCard 风格一致。
     * ====================================================================== */

    /**
     * 创建标签页组件
     * 根据标签配置数组构建完整的标签页 DOM 结构，并自动绑定交互逻辑。
     * 返回一个包含标签导航和所有面板的容器元素，可直接插入页面。
     *
     * @param {Array<{id: string, label: string, content: string|HTMLElement}>} tabs - 标签配置数组
     *   - id: 标签唯一标识，用于 data-tab / data-panel 匹配
     *   - label: 标签按钮显示的文字
     *   - content: 面板内容，可以是 HTML 字符串或 DOM 元素
     * @param {Object} [options] - 可选配置
     * @param {string} [options.activeTab] - 初始激活的标签 id（默认取第一个）
     * @returns {HTMLElement} 标签页容器元素，包含导航和面板
     *
     * @example
     * const tabsEl = UIComponents.createTabs([
     *     { id: 'lyrics', label: '歌词', content: '<div>歌词内容</div>' },
     *     { id: 'score',  label: '曲谱', content: scoreImgElement },
     * ], { activeTab: 'lyrics' });
     * container.appendChild(tabsEl);
     */
    createTabs(tabs, options = {}) {
        if (!tabs || tabs.length === 0) return Utils.createElement('div');

        const activeTab = options.activeTab || tabs[0].id;

        /* --- 构建标签导航 --- */
        const nav = Utils.createElement('nav', {
            className: 'tabs',
            attributes: {
                'role': 'tablist',
                'aria-label': '内容标签页',
            },
        });

        /* --- 构建容器 --- */
        const wrapper = Utils.createElement('div', {
            className: 'tabs-container',
        });

        tabs.forEach((tab, index) => {
            /* 标签按钮 */
            const tabBtn = Utils.createElement('button', {
                className: `tabs__item${tab.id === activeTab ? ' tabs__item--active' : ''}`,
                textContent: tab.label,
                attributes: {
                    'data-tab': tab.id,
                    'role': 'tab',
                    'aria-selected': String(tab.id === activeTab),
                    'aria-controls': `tabpanel-${tab.id}`,
                    'id': `tab-${tab.id}`,
                    'tabindex': tab.id === activeTab ? '0' : '-1',
                },
            });
            nav.appendChild(tabBtn);

            /* 面板 */
            const panel = Utils.createElement('div', {
                className: `tabs__panel${tab.id === activeTab ? ' tabs__panel--active' : ''}`,
                attributes: {
                    'data-panel': tab.id,
                    'role': 'tabpanel',
                    'aria-labelledby': `tab-${tab.id}`,
                    'id': `tabpanel-${tab.id}`,
                    'tabindex': '0',
                },
            });

            /* 填充面板内容 */
            if (typeof tab.content === 'string') {
                panel.innerHTML = tab.content;
            } else if (tab.content instanceof HTMLElement) {
                panel.appendChild(tab.content);
            }

            wrapper.appendChild(panel);
        });

        wrapper.insertBefore(nav, wrapper.firstChild);

        /* --- 绑定交互逻辑 --- */
        this._bindTabsEvents(wrapper, nav);

        return wrapper;
    },

    /**
     * 为标签页容器绑定点击和键盘事件
     * 内部辅助方法，由 createTabs 调用
     *
     * @param {HTMLElement} container - 标签页容器（含 nav 和 panels）
     * @param {HTMLElement} nav - 标签导航栏
     * @private
     */
    _bindTabsEvents(container, nav) {
        const tabItems = Utils.queryAll('.tabs__item', container);
        const panels = Utils.queryAll('.tabs__panel', container);

        /* 标签点击事件 */
        tabItems.forEach((tab) => {
            tab.addEventListener('click', () => {
                this._activateTab(tab, tabItems, panels, container);
            });
        });

        /* 键盘导航（WAI-ARIA Tabs 键盘交互模式） */
        nav.addEventListener('keydown', (e) => {
            const currentTab = document.activeElement;
            if (!currentTab || !currentTab.classList.contains('tabs__item')) return;

            const currentIndex = tabItems.indexOf(currentTab);
            let newIndex = -1;

            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    /* 右/下箭头：移动到下一个标签，循环 */
                    newIndex = (currentIndex + 1) % tabItems.length;
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    /* 左/上箭头：移动到上一个标签，循环 */
                    newIndex = (currentIndex - 1 + tabItems.length) % tabItems.length;
                    break;
                case 'Home':
                    /* Home 键：跳到第一个标签 */
                    newIndex = 0;
                    break;
                case 'End':
                    /* End 键：跳到最后一个标签 */
                    newIndex = tabItems.length - 1;
                    break;
                default:
                    return;  /* 不处理其他按键 */
            }

            if (newIndex >= 0) {
                e.preventDefault();
                this._activateTab(tabItems[newIndex], tabItems, panels, container);
                tabItems[newIndex].focus();
            }
        });
    },

    /**
     * 激活指定标签及其对应面板
     * 内部辅助方法，处理标签切换的完整逻辑
     *
     * @param {HTMLElement} activeTab - 要激活的标签按钮
     * @param {Array} allTabs - 所有标签按钮
     * @param {Array} allPanels - 所有面板元素
     * @param {HTMLElement} container - 标签页容器
     * @private
     */
    _activateTab(activeTab, allTabs, allPanels, container) {
        const targetPanel = activeTab.dataset.tab;

        /* 取消所有标签的激活状态，并更新 ARIA 属性 */
        allTabs.forEach(t => {
            t.classList.remove('tabs__item--active');
            t.setAttribute('aria-selected', 'false');
            t.setAttribute('tabindex', '-1');
        });
        allPanels.forEach(p => p.classList.remove('tabs__panel--active'));

        /* 激活当前标签和对应面板 */
        activeTab.classList.add('tabs__item--active');
        activeTab.setAttribute('aria-selected', 'true');
        activeTab.setAttribute('tabindex', '0');

        const targetEl = Utils.query(`.tabs__panel[data-panel="${targetPanel}"]`, container);
        if (targetEl) {
            targetEl.classList.add('tabs__panel--active');
            /* 切换标签后，将焦点移到对应面板，方便屏幕阅读器用户继续阅读 */
            targetEl.focus();
        }
    },


    /* ========================================================================
     * 五、消息提示组件
     * ========================================================================
     * 用于替代 alert()，提供更友好的提示方式。
     * ====================================================================== */

    /**
     * 显示消息提示
     * 支持传入 Error 对象自动生成友好提示，也支持直接传入字符串。
     * 提示会自动消失（默认3秒），error 类型持续5秒。
     *
     * @param {string|Error} message - 提示消息或 Error 对象
     * @param {string} [type='info'] - 提示类型：'info' | 'success' | 'error' | 'warning'
     * @param {number} [duration] - 自动消失时间（毫秒），默认 info/success 3秒，error/warning 5秒，0 不消失
     *
     * @example
     * // 简单文本提示
     * UIComponents.showToast('操作成功', 'success');
     * // 传入 Error 对象，自动生成友好提示
     * UIComponents.showToast(new Error('请求超时'), 'error');
     */
    showToast(message, type = 'info', duration) {
        /* 如果传入的是 Error 对象，使用 classifyError 生成友好提示 */
        let displayMessage;
        if (message instanceof Error) {
            const classified = Utils.classifyError(message);
            displayMessage = classified.message;
        } else {
            displayMessage = String(message);
        }

        /* 根据提示类型设置默认持续时间：error/warning 更长 */
        if (duration === undefined) {
            duration = (type === 'error' || type === 'warning') ? 5000 : 3000;
        }

        /* 创建提示容器（如果不存在） */
        let toastContainer = Utils.getById('toast-container');
        if (!toastContainer) {
            toastContainer = Utils.createElement('div', {
                id: 'toast-container',
                attributes: {
                    'aria-live': 'polite',
                    'style': 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;',
                },
            });
            document.body.appendChild(toastContainer);
        }

        /* 创建单条提示 */
        const toast = Utils.createElement('div', {
            className: `toast toast--${type}`,
            innerHTML: `<span class="toast__message">${displayMessage}</span>`,
        });

        /* 添加基础样式 */
        Object.assign(toast.style, {
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            boxShadow: 'var(--shadow-lg)',
            pointerEvents: 'auto',
            opacity: '0',
            transform: 'translateX(20px)',
            transition: 'all 0.3s ease',
            maxWidth: '360px',
            wordBreak: 'break-word',
        });

        /* 根据类型设置颜色 */
        const colorMap = {
            info:    { bg: 'var(--color-primary-lighter)', color: 'var(--color-primary)' },
            success: { bg: '#e8f5e9', color: '#2e7d32' },
            error:   { bg: '#ffebee', color: '#c62828' },
            warning: { bg: '#fff8e1', color: '#e65100' },
        };
        const colors = colorMap[type] || colorMap.info;
        toast.style.backgroundColor = colors.bg;
        toast.style.color = colors.color;

        /* 添加到容器 */
        toastContainer.appendChild(toast);

        /* 触发入场动画 */
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });

        /* 自动消失 */
        if (duration > 0) {
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(20px)';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    },


    /* ========================================================================
     * 六、加载状态组件
     * ========================================================================
     * 显示加载中、错误、空状态的占位内容。
     * ====================================================================== */

    /**
     * 创建加载中状态元素
     *
     * @returns {HTMLElement}
     */
    createLoadingState() {
        return Utils.createElement('div', {
            className: 'loading',
            attributes: { 'aria-live': 'polite', 'aria-busy': 'true' },
            innerHTML: `
                <div class="loading__dots">
                    <span class="loading__dot"></span>
                    <span class="loading__dot"></span>
                    <span class="loading__dot"></span>
                </div>
                <p>加载中...</p>
            `,
        });
    },

    /**
     * 创建错误状态元素
     * 支持传入 Error 对象自动生成友好提示，也支持直接传入字符串。
     *
     * @param {string|Error} [error='数据加载失败'] - 错误消息或 Error 对象
     * @param {Function} [onRetry] - 重试回调
     * @returns {HTMLElement}
     *
     * @example
     * // 传入 Error 对象，自动生成友好提示
     * UIComponents.createErrorState(new Error('请求超时'), retryFn);
     * // 传入字符串
     * UIComponents.createErrorState('数据加载失败', retryFn);
     */
    createErrorState(error = '数据加载失败', onRetry) {
        /*
         * 如果传入的是 Error 对象，使用 classifyError 生成友好提示；
         * 如果传入的是字符串，直接作为提示文本。
         */
        let displayMessage;
        if (error instanceof Error) {
            const classified = Utils.classifyError(error);
            displayMessage = classified.message;
        } else {
            displayMessage = String(error);
        }

        const el = Utils.createElement('div', {
            className: 'loading loading--error',
            attributes: { 'role': 'alert' },
            innerHTML: `<p>${displayMessage}</p>`,
        });

        /* 添加重试按钮（仅在提供了重试回调时显示） */
        if (onRetry) {
            const retryBtn = Utils.createElement('button', {
                className: 'loading--error__retry',
                textContent: '重新加载',
                attributes: { 'aria-label': '重新加载数据' },
            });
            retryBtn.addEventListener('click', onRetry);
            el.appendChild(retryBtn);
        }

        return el;
    },

    /**
     * 创建空状态元素
     *
     * @param {string} [message='暂无内容'] - 空状态提示
     * @returns {HTMLElement}
     */
    createEmptyState(message = '暂无内容') {
        return Utils.createElement('div', {
            className: 'loading loading--empty',
            attributes: { 'aria-live': 'polite' },
            innerHTML: `<p>${message}</p>`,
        });
    },
};
