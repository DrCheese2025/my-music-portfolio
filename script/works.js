/**
 * ============================================================================
 * 鸥波艺境 - 作品集页面逻辑 (works.js)
 * ============================================================================
 *
 * 作品集页面的核心逻辑，负责：
 *   1. 加载所有作品数据（带缓存）
 *   2. 渲染作品网格
 *   3. 实现搜索过滤功能
 *   4. 实现分页功能（URL 参数状态保持）
 *   5. 实现懒加载
 *
 * @version 2.0.0
 * ============================================================================
 */

/**
 * 页面状态管理
 * 使用对象集中管理当前页面的状态
 */
const WorksPage = {

    /** 当前页码（从1开始） */
    currentPage: 1,

    /** 当前搜索关键词 */
    searchKeyword: '',

    /** 筛选后的作品列表（由缓存的全量数据派生） */
    filteredWorks: [],

    /**
     * 从 URL 参数恢复页面状态
     * 支持 page 和 search 两个参数，使页面刷新或分享链接时能恢复状态
     */
    restoreFromUrl() {
        this.currentPage = parseInt(Utils.getUrlParam('page', '1'), 10) || 1;
        this.searchKeyword = Utils.getUrlParam('search', '');
    },

    /**
     * 将当前状态同步到 URL 参数
     * 使用 replaceState 不产生多余历史记录
     */
    syncToUrl() {
        Utils.updateUrlParams({
            page: this.currentPage > 1 ? String(this.currentPage) : '',
            search: this.searchKeyword || '',
        });
    },
};


/**
 * 页面初始化
 * DOM 加载完成后执行
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        /* 从 URL 恢复状态（支持刷新后保持分页/搜索） */
        WorksPage.restoreFromUrl();

        /* 如果 URL 中有搜索词，回填到搜索框 */
        if (WorksPage.searchKeyword) {
            const searchInput = Utils.getById('works-search-input');
            if (searchInput) searchInput.value = WorksPage.searchKeyword;
        }

        /* 绑定搜索事件 */
        initSearch();

        /* 加载并渲染作品（DataLoader 内部有缓存，不会重复请求） */
        await loadAndRenderWorks();

    } catch (error) {
        console.error('[作品集] 加载失败:', error);
        showWorksError(error);
    }
});


/**
 * 初始化搜索功能
 * 绑定搜索输入事件，使用防抖优化性能
 */
function initSearch() {
    const searchInput = Utils.getById('works-search-input');
    if (!searchInput) return;

    /* 使用防抖处理搜索输入 */
    const debouncedSearch = Utils.debounce((keyword) => {
        WorksPage.searchKeyword = keyword;
        WorksPage.currentPage = 1;  /* 搜索时重置页码 */
        renderWorks();
    }, 300);

    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value.trim());
    });
}


/**
 * 加载并渲染作品
 * 从数据源加载全部作品（DataLoader 内部有缓存机制），然后渲染当前页
 */
async function loadAndRenderWorks() {
    const allWorks = await DataLoader.loadWorks();
    WorksPage.filteredWorks = allWorks;
    renderWorks();
}


/**
 * 渲染作品列表
 * 根据当前搜索关键词和页码，渲染对应的作品卡片
 * 每次渲染后将状态同步到 URL 参数
 */
async function renderWorks() {
    const container = Utils.getById('works-grid');
    const paginationContainer = Utils.getById('works-pagination');
    if (!container) return;

    /* 根据关键词筛选作品 */
    let displayWorks = WorksPage.filteredWorks;
    if (WorksPage.searchKeyword) {
        displayWorks = await DataLoader.searchWorks(WorksPage.searchKeyword);
    }

    /* 计算分页信息 */
    const pageInfo = Utils.paginate(
        displayWorks.length,
        CONFIG.pagination.worksPerPage,
        WorksPage.currentPage
    );

    /* 获取当前页的作品 */
    const pageWorks = displayWorks.slice(pageInfo.startIndex, pageInfo.endIndex + 1);

    /* 清空容器 */
    container.innerHTML = '';

    /* 无搜索结果时显示提示 */
    if (pageWorks.length === 0) {
        const emptyEl = Utils.createElement('div', {
            className: 'works-empty',
            innerHTML: `
                <div class="works-empty__icon">🔍</div>
                <p class="works-empty__text">${
                    WorksPage.searchKeyword
                        ? `未找到与"${WorksPage.searchKeyword}"相关的作品`
                        : '暂无作品'
                }</p>
            `,
        });
        container.appendChild(emptyEl);
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    /* 使用文档片段批量插入 */
    const fragment = document.createDocumentFragment();
    pageWorks.forEach(work => {
        const card = UIComponents.createWorkCard(work, (w) => {
            PathUtils.navigate(`${CONFIG.paths.pages}work-detail.html?id=${w.id}`);
        });
        fragment.appendChild(card);
    });

    container.appendChild(fragment);

    /* 对容器内的所有 data-src 图片启用懒加载观察 */
    Utils.observeLazyImages(container);

    /* 渲染分页 */
    if (paginationContainer) {
        UIComponents.renderPagination(paginationContainer, pageInfo, (newPage) => {
            WorksPage.currentPage = newPage;
            renderWorks();
            /* 滚动到页面顶部 */
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* 将当前状态同步到 URL 参数 */
    WorksPage.syncToUrl();
}


/**
 * 显示加载错误
 * 使用 classifyError 将技术性错误转换为用户友好的提示
 *
 * @param {Error} error - 错误对象
 */
function showWorksError(error) {
    /* 记录技术细节到控制台 */
    Utils.logError('作品集', '加载作品', error);

    /* 分类错误并获取用户友好提示 */
    const classified = Utils.classifyError(error);

    const container = Utils.getById('works-grid');
    if (!container) return;

    container.innerHTML = '';
    container.appendChild(
        UIComponents.createErrorState(classified.message, () => {
            window.location.reload();
        })
    );
}
