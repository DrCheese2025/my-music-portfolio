/**
 * ============================================================================
 * 鸥波艺境 - 动态页面逻辑 (dynamic.js)
 * ============================================================================
 *
 * 动态页面的核心逻辑，负责：
 *   1. 加载动态数据（带缓存）
 *   2. 按时间倒序排列动态
 *   3. 渲染动态列表
 *   4. 实现分页功能（URL 参数状态保持）
 *   5. 处理动态中的关联作品点击（跳转作品详情）
 *   6. 处理高亮定位（从首页跳转来时高亮指定动态）
 *
 * @version 2.0.0
 * ============================================================================
 */

/**
 * 页面状态管理
 */
const DynamicPage = {

    /** 当前页码（从1开始） */
    currentPage: 1,

    /** 已加载的全量动态数据（缓存，避免翻页时重复请求） */
    allDynamics: null,

    /**
     * 从 URL 参数恢复页面状态
     * 支持 page 参数，使页面刷新后能恢复分页位置
     */
    restoreFromUrl() {
        this.currentPage = parseInt(Utils.getUrlParam('page', '1'), 10) || 1;
    },

    /**
     * 将当前状态同步到 URL 参数
     * 使用 replaceState 不产生多余历史记录
     */
    syncToUrl() {
        Utils.updateUrlParams({
            page: this.currentPage > 1 ? String(this.currentPage) : '',
        });
    },
};


/**
 * 页面初始化
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        /* 从 URL 恢复分页状态 */
        DynamicPage.restoreFromUrl();

        /* 加载并渲染动态 */
        await loadAndRenderDynamics();

        /* 处理从首页跳转来的高亮定位 */
        handleHighlightFromIndex();

    } catch (error) {
        console.error('[动态页] 加载失败:', error);
        showDynamicError(error);
    }
});


/**
 * 加载并渲染动态列表
 * 数据加载后缓存到 DynamicPage.allDynamics，翻页时不再重新请求
 */
async function loadAndRenderDynamics() {
    /* 如果已有缓存，直接使用缓存数据渲染 */
    if (DynamicPage.allDynamics) {
        renderDynamics(DynamicPage.allDynamics);
        return;
    }

    /* 并行加载动态和作品数据（作品数据用于解析关联作品） */
    const { dynamics, works } = await DataLoader.loadAll();

    /* 按时间倒序排列（最新动态在前） */
    dynamics.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        /* 同一日期按时间倒序 */
        const timeA = a.time || '';
        const timeB = b.time || '';
        return timeB.localeCompare(timeA);
    });

    /* 为每条动态填充关联作品的标题和类型信息 */
    DataLoader.enrichDynamicsWithRelatedWork(dynamics, works);

    /* 缓存全量数据 */
    DynamicPage.allDynamics = dynamics;

    renderDynamics(dynamics);
}


/**
 * 渲染动态列表
 * 根据当前页码从缓存数据中切片渲染
 *
 * @param {Array} allDynamics - 按时间倒序排列的全部动态
 */
function renderDynamics(allDynamics) {
    const container = Utils.getById('dynamics-list');
    const paginationContainer = Utils.getById('dynamics-pagination');
    if (!container) return;

    /* 计算分页 */
    const pageInfo = Utils.paginate(
        allDynamics.length,
        CONFIG.pagination.dynamicsPerPage,
        DynamicPage.currentPage
    );

    /* 获取当前页的动态 */
    const pageDynamics = allDynamics.slice(pageInfo.startIndex, pageInfo.endIndex + 1);

    /* 清空容器 */
    container.innerHTML = '';

    /* 无数据时显示空状态 */
    if (pageDynamics.length === 0) {
        container.appendChild(UIComponents.createEmptyState('暂无动态'));
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    /* 批量渲染动态卡片 */
    const fragment = document.createDocumentFragment();
    pageDynamics.forEach(dynamic => {
        const card = UIComponents.createDynamicCard(dynamic, (refId) => {
            /* 点击关联作品跳转到对应作品详情 */
            PathUtils.navigate(`${CONFIG.paths.pages}work-detail.html?id=${refId}`);
        });

        /* 为动态配图绑定加载失败处理 */
        const dynamicImg = card.querySelector('.dynamic-card__image img');
        if (dynamicImg) {
            dynamicImg.addEventListener('error', () => {
                Utils.logError('动态页', '配图加载', new Error(`动态 ${dynamic.id} 的配图加载失败`));
                dynamicImg.style.display = 'none';
            });
        }

        fragment.appendChild(card);
    });

    container.appendChild(fragment);

    /* 渲染分页（使用缓存数据，不再重新请求） */
    if (paginationContainer) {
        UIComponents.renderPagination(paginationContainer, pageInfo, (newPage) => {
            DynamicPage.currentPage = newPage;
            renderDynamics(allDynamics);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* 将当前状态同步到 URL 参数 */
    DynamicPage.syncToUrl();
}


/**
 * 处理从首页跳转来的高亮定位
 * URL 中若包含 highlight 参数，则滚动到对应动态并高亮
 */
function handleHighlightFromIndex() {
    const highlightId = Utils.getParam('highlight');
    if (!highlightId) return;

    /* 等待 DOM 渲染完成后定位 */
    requestAnimationFrame(() => {
        const targetCard = Utils.query(`[data-dynamic-id="${highlightId}"]`);
        if (targetCard) {
            /* 滚动到目标位置 */
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

            /* 添加高亮动画效果 */
            targetCard.style.boxShadow = `0 0 0 2px var(--color-primary), var(--shadow-md)`;
            targetCard.style.transition = 'box-shadow 0.3s ease';

            /* 3秒后移除高亮 */
            setTimeout(() => {
                targetCard.style.boxShadow = '';
            }, 3000);
        }
    });
}


/**
 * 显示加载错误
 * 使用 classifyError 将技术性错误转换为用户友好的提示
 *
 * @param {Error} error - 错误对象
 */
function showDynamicError(error) {
    /* 记录技术细节到控制台 */
    Utils.logError('动态页', '加载动态', error);

    /* 分类错误并获取用户友好提示 */
    const classified = Utils.classifyError(error);

    const container = Utils.getById('dynamics-list');
    if (!container) return;

    container.innerHTML = '';
    container.appendChild(
        UIComponents.createErrorState(classified.message, () => {
            window.location.reload();
        })
    );
}
