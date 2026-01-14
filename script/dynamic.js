/**
 * 动态页面功能逻辑
 * 加载并展示动态数据
 * 版本：2.0（修订版）
 */

// ==================== 常量定义 ====================
const DATA_PATH = '/my-music-portfolio/data/dynamic.json';    // 动态数据JSON文件路径
const ITEMS_PER_PAGE = 5;                  // 每页显示动态数

// 错误信息常量
const ERROR_MSG = {
    LOAD_FAIL: '加载动态失败，请稍后重试',
    NOT_FOUND: '暂无动态内容',
    DATA_LOAD_FAIL: '数据加载失败',
    INVALID_FORMAT: '数据格式错误'
};

// 类型图标映射
const TYPE_ICONS = {
    '创作': '🎵',
    '演出': '🎭',
    '分享': '💬',
    '生活随笔': '📝',
    '默认': '📄'
};

// 附件类型图标
const ATTACHMENT_ICONS = {
    'audio': '🎵',
    'video': '🎬',
    'image': '🖼️',
    'default': '📎'
};

// ==================== 动态分页管理器 ====================
/**
 * 动态分页管理器
 * 负责动态数据的分页显示、导航和响应式布局
 */
const DynamicsPagination = {
    // 配置参数
    config: {
        itemsPerPage: ITEMS_PER_PAGE,      // 每页显示动态数
        containerId: 'dynamics-list',      // 动态列表容器ID
        paginationId: 'pagination-container', // 分页容器ID
        navigation: {                       // 分页导航配置（响应式更新）
            nearbyPages: 2,                // 当前页前后显示几页
            midPointThreshold: 10,         // 距离多少页才显示中间点
            alwaysShowFirstLast: true      // 是否始终显示首尾页
        }
    },

    // 状态管理
    state: {
        currentPage: 1,                    // 当前页码
        totalPages: 0,                     // 总页数
        allDynamics: [],                   // 所有动态数据
        resizeTimeout: null                // 窗口大小调整的防抖计时器
    },

    // ==================== 公共方法 ====================

    /**
     * 初始化分页系统
     * @param {Array} dynamics - 所有动态数据数组
     */
    init(dynamics) {
        console.log('初始化分页系统...');
        
        // 1. 设置响应式配置
        this.setupResponsiveConfig();
        
        // 2. 检查数据有效性
        if (!dynamics || !Array.isArray(dynamics) || dynamics.length === 0) {
            console.warn('动态数据为空或格式错误');
            this.showEmptyState();
            this.hidePagination();
            return;
        }
        
        // 3. 保存数据并计算总页数
        this.state.allDynamics = dynamics;
        this.state.totalPages = Math.ceil(dynamics.length / this.config.itemsPerPage);
        console.log(`总动态数: ${dynamics.length}, 总页数: ${this.state.totalPages}`);
        
        // 4. 从URL获取当前页码，并确保在有效范围内
        const urlPage = this.getPageFromURL();
        this.state.currentPage = urlPage 
            ? Math.max(1, Math.min(urlPage, this.state.totalPages)) 
            : 1;
        console.log(`当前页码: ${this.state.currentPage}`);
        
        // 5. 渲染分页和内容
        this.renderPagination();
        this.renderCurrentPage();
        this.updateURL();
        
        // 6. 设置窗口大小调整监听
        this.setupResizeListener();
    },

    /**
     * 设置响应式配置（根据屏幕宽度调整分页参数）
     */
    setupResponsiveConfig() {
        const width = window.innerWidth;
        let navigationConfig;
        
        if (width < 768) { // 移动设备
            navigationConfig = {
                nearbyPages: 1,
                midPointThreshold: 12,
                alwaysShowFirstLast: true
            };
        } else if (width < 1024) { // 平板设备
            navigationConfig = {
                nearbyPages: 2,
                midPointThreshold: 8,
                alwaysShowFirstLast: true
            };
        } else { // 桌面设备
            navigationConfig = {
                nearbyPages: 2,
                midPointThreshold: 10,
                alwaysShowFirstLast: true
            };
        }
        
        this.config.navigation = navigationConfig;
        console.log(`响应式配置已更新: ${width}px, nearbyPages=${navigationConfig.nearbyPages}`);
    },

    /**
     * 设置窗口大小调整监听器（带防抖）
     */
    setupResizeListener() {
        // 移除旧的监听器（如果存在）
        if (this.state.resizeHandler) {
            window.removeEventListener('resize', this.state.resizeHandler);
        }
        
        // 创建防抖函数
        const handleResize = () => {
            clearTimeout(this.state.resizeTimeout);
            this.state.resizeTimeout = setTimeout(() => {
                if (this.state.allDynamics && this.state.allDynamics.length > 0) {
                    console.log('窗口大小变化，重新配置分页...');
                    this.setupResponsiveConfig();
                    this.renderPagination(); // 重新渲染以应用新配置
                }
            }, 250); // 250ms防抖延迟
        };
        
        // 保存引用并添加监听器
        this.state.resizeHandler = handleResize;
        window.addEventListener('resize', handleResize);
    },

    /**
     * 智能生成页码项（改进的双点位导航算法）
     * @returns {Array} 页码项数组，包含数字和省略号
     */
    generatePageItems() {
        const { currentPage, totalPages } = this.state;
        const { 
            nearbyPages = 2, 
            midPointThreshold = 10, 
            alwaysShowFirstLast = true 
        } = this.config.navigation;
        
        const items = [];
        
        // 1. 如果总页数较少，直接显示所有页码
        const smallPageThreshold = nearbyPages * 2 + 5;
        if (totalPages <= smallPageThreshold) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(i);
            }
            return items;
        }
        
        // 2. 始终显示第1页（如果配置允许）
        if (alwaysShowFirstLast) {
            items.push(1);
        }
        
        // 3. 前部中间点（如果当前页离首页够远）
        if (currentPage > midPointThreshold) {
            const frontMidPoint = Math.floor((1 + currentPage) / 2);
            const minFrontGap = nearbyPages + 1;
            
            if (frontMidPoint > minFrontGap) {
                const lastItem = items.length > 0 ? items[items.length - 1] : 0;
                if (frontMidPoint > lastItem + 1) {
                    items.push('...');
                }
                items.push(frontMidPoint);
            }
        }
        
        // 4. 当前页及其附近页码
        const startPage = Math.max(2, currentPage - nearbyPages);
        const endPage = Math.min(totalPages - 1, currentPage + nearbyPages);
        
        // 判断是否需要添加省略号（当前页附近与前部内容有间隔）
        const lastItem = items.length > 0 ? items[items.length - 1] : 0;
        if (startPage > 2 && startPage > lastItem + 1) {
            items.push('...');
        }
        
        // 添加当前页附近的页码
        for (let i = startPage; i <= endPage; i++) {
            if (!items.includes(i)) {
                items.push(i);
            }
        }
        
        // 5. 后部中间点（如果当前页离尾页够远）
        if (currentPage < totalPages - (midPointThreshold - 1)) {
            const backMidPoint = Math.floor((currentPage + totalPages) / 2);
            const maxBackGap = totalPages - nearbyPages - 1;
            
            // 修正：检查后部中间点是否在当前页附近之后
            if (backMidPoint > endPage && backMidPoint < maxBackGap) {
                const lastItem = items[items.length - 1];
                if (backMidPoint > lastItem + 1) {
                    items.push('...');
                }
                items.push(backMidPoint);
            }
        }
        
        // 6. 添加尾页（如果配置允许且还没添加）
        if (alwaysShowFirstLast && !items.includes(totalPages)) {
            const lastItem = items[items.length - 1];
            if (totalPages > lastItem + 1) {
                items.push('...');
            }
            items.push(totalPages);
        }
        
        // 7. 清理连续的省略号
        return this.cleanConsecutiveEllipsis(items);
    },

    /**
     * 清理连续的省略号
     * @param {Array} items - 包含数字和省略号的数组
     * @returns {Array} 清理后的数组
     */
    cleanConsecutiveEllipsis(items) {
        const cleaned = [];
        let lastWasEllipsis = false;
        
        for (const item of items) {
            if (item === '...') {
                if (!lastWasEllipsis) {
                    cleaned.push(item);
                    lastWasEllipsis = true;
                }
            } else {
                cleaned.push(item);
                lastWasEllipsis = false;
            }
        }
        
        return cleaned;
    },

    /**
     * 渲染分页UI
     */
    renderPagination() {
        const { totalPages, currentPage } = this.state;
        
        // 如果只有一页或没有数据，隐藏分页
        if (totalPages <= 1) {
            this.hidePagination();
            return;
        }
        
        // 获取分页容器
        const container = document.getElementById(this.config.paginationId);
        if (!container) {
            console.warn('分页容器未找到:', this.config.paginationId);
            return;
        }
        
        // 显示分页容器
        container.style.display = 'block';
        
        // 生成页码项
        const pageItems = this.generatePageItems();
        
        // 构建分页HTML
        let html = `
            <nav class="pagination-nav" aria-label="动态分页导航">
                <ul class="pagination-list">
                    <!-- 上一页按钮 -->
                    <li>
                        <a href="#" class="pagination-item prev ${currentPage === 1 ? 'disabled' : ''}" 
                           aria-label="上一页" data-page="prev" ${currentPage === 1 ? 'tabindex="-1"' : ''}>
                            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                <path d="M15.41 16.09L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" fill="currentColor"/>
                            </svg>
                            <span class="sr-only"></span>
                        </a>
                    </li>
        `;
        
        // 添加页码项
        pageItems.forEach(item => {
            if (item === '...') {
                html += `
                    <li><span class="pagination-ellipsis" aria-hidden="true">…</span></li>
                `;
            } else {
                const isActive = item === currentPage;
                const isMidPoint = this.isMidPoint(item, currentPage, totalPages);
                const className = `pagination-item ${isActive ? 'active' : ''} ${isMidPoint ? 'mid-point' : ''}`;
                
                html += `
                    <li>
                        <a href="?page=${item}" class="${className}" 
                           data-page="${item}" 
                           aria-label="${isActive ? '当前页，第' + item + '页' : '第' + item + '页'}"
                           ${isActive ? 'aria-current="page"' : ''}>
                            ${item}
                        </a>
                    </li>
                `;
            }
        });
        
        // 下一页按钮
        html += `
                    <li>
                        <a href="#" class="pagination-item next ${currentPage === totalPages ? 'disabled' : ''}" 
                           aria-label="下一页" data-page="next" ${currentPage === totalPages ? 'tabindex="-1"' : ''}>
                            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
                            </svg>
                            <span class="sr-only"></span>
                        </a>
                    </li>
                </ul>
            </nav>
        `;
        
        container.innerHTML = html;
        
        // 添加事件监听
        this.attachPaginationEvents();
    },

    /**
     * 判断是否为中间点（用于添加特殊样式）
     * @param {number} page - 要检查的页码
     * @param {number} currentPage - 当前页码
     * @param {number} totalPages - 总页数
     * @returns {boolean} 是否为中间点
     */
    isMidPoint(page, currentPage, totalPages) {
        if (page === 1 || page === totalPages) return false;
        
        const { midPointThreshold = 10 } = this.config.navigation;
        
        // 前部中间点检查
        if (currentPage > midPointThreshold) {
            const frontMid = Math.floor((1 + currentPage) / 2);
            if (page === frontMid) return true;
        }
        
        // 后部中间点检查
        if (currentPage < totalPages - (midPointThreshold - 1)) {
            const backMid = Math.floor((currentPage + totalPages) / 2);
            if (page === backMid) return true;
        }
        
        return false;
    },

    /**
     * 渲染当前页的动态
     */
    renderCurrentPage() {
        const { currentPage, allDynamics } = this.state;
        const { itemsPerPage, containerId } = this.config;
        
        // 计算当前页数据的起始和结束索引
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageDynamics = allDynamics.slice(startIndex, endIndex);
        
        // 获取动态列表容器
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('动态列表容器未找到:', containerId);
            return;
        }
        
        // 添加页面切换动画
        this.animatePageTransition(container, pageDynamics);
    },

    /**
     * 页面切换动画
     * @param {HTMLElement} container - 动态列表容器
     * @param {Array} pageDynamics - 当前页的动态数据
     */
    animatePageTransition(container, pageDynamics) {
        // 添加淡出效果
        if (container.children.length > 0) {
            container.classList.add('page-changing');
            
            // 等待淡出动画完成后更新内容
            setTimeout(() => {
                this.renderDynamicsList(pageDynamics, container);
                
                // 淡入效果（延迟确保DOM已更新）
                requestAnimationFrame(() => {
                    container.classList.remove('page-changing');
                });
            }, 300); // 匹配CSS过渡时间
        } else {
            // 首次加载，直接渲染
            this.renderDynamicsList(pageDynamics, container);
        }
    },

    /**
     * 渲染动态列表
     * @param {Array} dynamics - 当前页的动态数据数组
     * @param {HTMLElement} container - 容器元素
     */
    renderDynamicsList(dynamics, container) {
        if (!dynamics || dynamics.length === 0) {
            this.showEmptyState(container);
            return;
        }
        
        const fragment = document.createDocumentFragment();
        
        dynamics.forEach(dynamic => {
            const card = this.createDynamicCard(dynamic);
            if (card) {
                fragment.appendChild(card);
            }
        });
        
        // 清空容器并添加新内容
        container.innerHTML = '';
        container.appendChild(fragment);
    },

    /**
     * 创建动态卡片
     * @param {Object} dynamic - 动态数据对象
     * @returns {HTMLElement} 动态卡片元素
     */
    createDynamicCard(dynamic) {
        // 数据验证
        if (!dynamic || !dynamic.title) {
            console.warn('动态数据不完整:', dynamic);
            return null;
        }
        
        const card = document.createElement('article');
        card.className = 'dynamic-card';
        card.setAttribute('data-dynamic-id', dynamic.id || Date.now());
        
        // 构建卡片内容
        card.innerHTML = `
            <div class="dynamic-header">
                <div class="dynamic-meta">
                    <h2 class="dynamic-title">${this.escapeHtml(dynamic.title)}</h2>
                    <div class="dynamic-info">
                        <span class="dynamic-date" aria-label="发布时间">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                                <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                            </svg>
                            ${this.escapeHtml(dynamic.date)} ${this.escapeHtml(dynamic.time || '')}
                        </span>
                    </div>
                </div>
                <span class="dynamic-type" aria-label="动态类型">
                    ${TYPE_ICONS[dynamic.type] || TYPE_ICONS['默认']} ${this.escapeHtml(dynamic.type || '默认')}
                </span>
            </div>
            
            ${dynamic.cover ? `
                <img src="${this.formatResourcePath(dynamic.cover)}" 
                     alt="${this.escapeHtml(dynamic.title)}" 
                     class="dynamic-cover" 
                     loading="lazy"
                     onerror="this.style.display='none'">
            ` : ''}
            
            <div class="dynamic-content">${this.formatContent(dynamic.content || '')}</div>
            
            ${dynamic.attachments && dynamic.attachments.length > 0 ? 
                this.renderAttachments(dynamic.attachments) : ''}
        `;
        
        return card;
    },

    /**
     * 格式化资源路径（处理相对路径）
     * @param {string} path - 资源路径
     * @returns {string} 格式化后的路径
     */
    formatResourcePath(path) {
        if (!path) return '';
        
        // 如果是完整URL或绝对路径，直接返回
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
            return path;
        }
        
        // 否则添加相对路径前缀
        return `../${path}`;
    },

    /**
     * 渲染附件
     * @param {Array} attachments - 附件数组
     * @returns {string} 附件HTML
     */
    renderAttachments(attachments) {
        if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
            return '';
        }
        
        const attachmentItems = attachments.map(attachment => {
            if (!attachment || !attachment.type) return '';
            
            return `
                <div class="attachment-item">
                    <div class="attachment-header">
                        <span class="attachment-icon" aria-hidden="true">
                            ${ATTACHMENT_ICONS[attachment.type] || ATTACHMENT_ICONS['default']}
                        </span>
                        <span>${this.escapeHtml(attachment.title || '附件')}</span>
                    </div>
                    <div class="attachment-content">
                        ${this.renderAttachmentContent(attachment)}
                    </div>
                </div>
            `;
        }).filter(item => item !== '').join('');
        
        return `
            <div class="dynamic-attachments">
                <h3 class="attachments-title"></h3>
                ${attachmentItems}
            </div>
        `;
    },

    /**
     * 渲染附件内容
     * @param {Object} attachment - 附件对象
     * @returns {string} 附件内容HTML
     */
    renderAttachmentContent(attachment) {
        if (!attachment || !attachment.type) return '';
        
        const url = this.formatResourcePath(attachment.url || '');
        
        switch (attachment.type.toLowerCase()) {
            case 'audio':
                return `<audio controls preload="metadata" src="${url}">
                            <source src="${url}" type="audio/mpeg">
                            您的浏览器不支持音频播放。
                        </audio>`;
            case 'video':
                return `<video controls preload="metadata" src="${url}" style="width: 100%; max-width: 100%;">
                            <source src="${url}" type="video/mp4">
                            您的浏览器不支持视频播放。
                        </video>`;
            case 'image':
                return `<img src="${url}" 
                            alt="${this.escapeHtml(attachment.title || '图片')}" 
                            style="max-width: 100%; border-radius: 4px;"
                            loading="lazy"
                            onerror="this.style.display='none'">`;
            default:
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="attachment-link">
                            下载附件
                        </a>`;
        }
    },

    /**
     * 格式化内容（换行转换）
     * @param {string} content - 原始内容
     * @returns {string} 格式化后的HTML
     */
    formatContent(content) {
        if (!content) return '';
        return this.escapeHtml(content).replace(/\n/g, '<br>');
    },

    /**
     * HTML转义（防止XSS攻击）
     * @param {string} text - 需要转义的文本
     * @returns {string} 转义后的安全文本
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 显示空状态
     * @param {HTMLElement|null} container - 目标容器
     */
    showEmptyState(container = null) {
        const targetContainer = container || document.getElementById(this.config.containerId);
        if (!targetContainer) return;
        
        targetContainer.innerHTML = `
            <div class="empty-state" aria-live="polite">
                <div class="empty-icon" aria-hidden="true">📝</div>
                <h3 class="empty-title">${ERROR_MSG.NOT_FOUND}</h3>
                <p class="empty-message">还没有发布任何动态，敬请期待...</p>
            </div>
        `;
        
        // 确保分页隐藏
        this.hidePagination();
    },

    /**
     * 为分页按钮添加事件监听
     */
    attachPaginationEvents() {
        const container = document.getElementById(this.config.paginationId);
        if (!container) return;
        
        // 使用事件委托提高性能
        container.addEventListener('click', (e) => {
            e.preventDefault();
            
            const target = e.target.closest('.pagination-item');
            if (!target || target.classList.contains('disabled') || target.classList.contains('active')) {
                return;
            }
            
            const pageAction = target.dataset.page;
            let newPage = this.state.currentPage;
            
            // 处理不同的点击动作
            if (pageAction === 'prev') {
                newPage = Math.max(1, this.state.currentPage - 1);
            } else if (pageAction === 'next') {
                newPage = Math.min(this.state.totalPages, this.state.currentPage + 1);
            } else if (!isNaN(parseInt(pageAction))) {
                newPage = parseInt(pageAction);
            } else {
                return; // 未知动作
            }
            
            // 如果页码有变化，更新页面
            if (newPage !== this.state.currentPage) {
                this.goToPage(newPage);
            }
        });
        
        // 添加键盘支持
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const target = e.target.closest('.pagination-item');
                if (target) {
                    e.preventDefault();
                    target.click();
                }
            }
        });
    },

    /**
     * 跳转到指定页码
     * @param {number} page - 目标页码
     */
    goToPage(page) {
        if (page < 1 || page > this.state.totalPages || page === this.state.currentPage) {
            return;
        }
        
        this.state.currentPage = page;
        this.renderPagination();
        this.renderCurrentPage();
        this.updateURL();
        
        // 平滑滚动到动态列表顶部
        const container = document.getElementById(this.config.containerId);
        if (container) {
            window.scrollTo({
                top: container.offsetTop - 120,
                behavior: 'smooth'
            });
        }
    },

    /**
     * 从URL获取页码
     * @returns {number|null} 页码或null
     */
    getPageFromURL() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const page = parseInt(urlParams.get('page'));
            
            // 验证页码有效性
            if (page && !isNaN(page) && page > 0) {
                return page;
            }
        } catch (error) {
            console.warn('解析URL页码失败:', error);
        }
        
        return null;
    },

    /**
     * 更新URL（不刷新页面）
     */
    updateURL() {
        const { currentPage } = this.state;
        
        try {
            const url = new URL(window.location);
            
            if (currentPage === 1) {
                url.searchParams.delete('page');
            } else {
                url.searchParams.set('page', currentPage);
            }
            
            window.history.replaceState({ page: currentPage }, '', url);
        } catch (error) {
            console.warn('更新URL失败:', error);
        }
    },

    /**
     * 隐藏分页
     */
    hidePagination() {
        const container = document.getElementById(this.config.paginationId);
        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
    },

    /**
     * 显示错误信息
     * @param {string} message - 错误消息
     * @param {HTMLElement|null} container - 目标容器
     */
    showError(message, container = null) {
        const targetContainer = container || document.getElementById(this.config.containerId);
        if (!targetContainer) return;
        
        const errorMessage = message || ERROR_MSG.LOAD_FAIL;
        
        targetContainer.innerHTML = `
            <div class="loading-state error-state" aria-live="assertive">
                <div class="error-icon" aria-hidden="true">⚠️</div>
                <p class="error-message">${this.escapeHtml(errorMessage)}</p>
                <button class="reload-button" onclick="window.location.reload()" autofocus>
                    重新加载
                </button>
            </div>
        `;
        
        // 确保分页隐藏
        this.hidePagination();
    }
};

// ==================== 数据加载函数 ====================

/**
 * 加载动态数据
 * @returns {Promise<Array>} 动态数据数组
 * @throws {Error} 加载失败时抛出错误
 */
async function loadDynamicsData() {
    console.log('开始加载动态数据...');
    
    try {
        const response = await fetch(DATA_PATH, {
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`${ERROR_MSG.DATA_LOAD_FAIL} (HTTP ${response.status})`);
        }
        
        // 验证内容类型
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('服务器返回的不是JSON数据');
        }
        
        const dynamics = await response.json();
        
        // 验证数据格式
        if (!Array.isArray(dynamics)) {
            throw new Error(ERROR_MSG.INVALID_FORMAT);
        }
        
        console.log(`成功加载 ${dynamics.length} 条动态数据`);
        
        // 按日期降序排序（最新的在前）
        const sortedDynamics = dynamics.sort((a, b) => {
            try {
                // 尝试解析日期时间
                const parseDateTime = (dynamic) => {
                    if (dynamic.date && dynamic.time) {
                        return new Date(`${dynamic.date} ${dynamic.time}`);
                    } else if (dynamic.date) {
                        return new Date(dynamic.date);
                    } else if (dynamic.timestamp) {
                        return new Date(dynamic.timestamp);
                    }
                    return new Date(0); // 无法解析时返回最早日期
                };
                
                const dateA = parseDateTime(a);
                const dateB = parseDateTime(b);
                return dateB - dateA;
            } catch (error) {
                console.warn('日期解析失败:', error);
                return 0;
            }
        });
        
        return sortedDynamics;
        
    } catch (error) {
        console.error('加载动态数据失败:', error);
        throw error;
    }
}

// ==================== 页面初始化 ====================

/**
 * 初始化页面
 */
async function initializePage() {
    console.log('页面初始化开始...');
    
    // 显示加载状态
    const dynamicsList = document.getElementById('dynamics-list');
    if (dynamicsList) {
        dynamicsList.innerHTML = `
            <div class="loading-state" aria-live="polite">
                <div class="loading-spinner" aria-hidden="true"></div>
                <p>正在加载动态内容...</p>
            </div>
        `;
    }
    
    try {
        const dynamics = await loadDynamicsData();
        DynamicsPagination.init(dynamics);
    } catch (error) {
        console.error('页面初始化失败:', error);
        DynamicsPagination.showError(
            error.message === ERROR_MSG.NOT_FOUND 
                ? ERROR_MSG.NOT_FOUND 
                : ERROR_MSG.LOAD_FAIL
        );
    } finally {
        console.log('页面初始化完成');
    }
}

// ==================== 全局导出 ====================
// 为了方便调试，将主要对象挂载到window
if (typeof window !== 'undefined') {
    window.DynamicsPagination = DynamicsPagination;
    window.loadDynamicsData = loadDynamicsData;
}

// ==================== 事件监听器 ====================

// 页面加载完成后执行初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    // DOM已经加载完成，直接执行
    setTimeout(initializePage, 0);
}

// 前进/后退按钮支持
window.addEventListener('popstate', () => {
    if (DynamicsPagination.state.allDynamics?.length > 0) {
        const urlPage = DynamicsPagination.getPageFromURL();
        const newPage = urlPage || 1;
        
        if (newPage !== DynamicsPagination.state.currentPage) {
            DynamicsPagination.goToPage(newPage);
        }
    }
});