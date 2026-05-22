/**
 * ============================================================================
 * 鸥波艺境 - 首页逻辑 (index.js)
 * ============================================================================
 *
 * 首页的核心逻辑，负责：
 *   1. 加载选录作品数据并渲染卡片
 *   2. 加载最近动态数据并渲染卡片
 *
 * @version 1.0.0
 * ============================================================================
 */

/**
 * 首页主函数
 * DOM 加载完成后执行
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        /* 并行加载作品和动态数据 */
        const { works, dynamics } = await DataLoader.loadAll();

        /* 渲染选录作品 */
        renderFeaturedWorks(works);

        /* 为动态填充关联作品信息后渲染 */
        DataLoader.enrichDynamicsWithRelatedWork(dynamics, works);
        renderRecentDynamics(dynamics);

    } catch (error) {
        console.error('[首页] 数据加载失败:', error);
        handleLoadError(error);
    }
});


/**
 * 渲染选录作品区域
 *
 * 从配置中读取需要展示的作品 ID 列表，
 * 筛选出对应的作品并渲染为卡片。
 *
 * @param {Array} allWorks - 全部作品数据
 */
function renderFeaturedWorks(allWorks) {
    const container = Utils.getById('featured-works-container');
    if (!container) return;

    /* 获取配置中指定的选录作品 ID */
    const featuredIds = CONFIG.featured.workIds || [];

    /* 筛选出对应的作品 */
    const featuredWorks = featuredIds
        .map(id => allWorks.find(w => w.id === id))
        .filter(Boolean);   /* 过滤掉未找到的 */

    /* 无数据时显示空状态 */
    if (featuredWorks.length === 0) {
        container.innerHTML = '';
        container.appendChild(UIComponents.createEmptyState('暂无选录作品'));
        return;
    }

    /* 使用文档片段优化 DOM 操作 */
    const fragment = document.createDocumentFragment();
    featuredWorks.forEach(work => {
        const card = UIComponents.createWorkCard(work, (w) => {
            /* 点击卡片跳转到作品详情页 */
            PathUtils.navigate(`${CONFIG.paths.pages}work-detail.html?id=${w.id}`);
        });
        fragment.appendChild(card);
    });

    /* 替换容器内容 */
    container.innerHTML = '';
    container.appendChild(fragment);
}


/**
 * 渲染最近动态区域
 *
 * 按时间倒序排列，取前 N 条动态展示。
 *
 * @param {Array} allDynamics - 全部动态数据
 */
function renderRecentDynamics(allDynamics) {
    const container = Utils.getById('recent-dynamics-container');
    if (!container) return;

    /* 按时间倒序排序 */
    const sorted = [...allDynamics].sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time || '00:00'}`);
        const dateB = new Date(`${b.date} ${b.time || '00:00'}`);
        return dateB - dateA;
    });

    /* 取前 N 条 */
    const recent = sorted.slice(0, CONFIG.featured.dynamicsCount);

    if (recent.length === 0) {
        container.innerHTML = '';
        container.appendChild(UIComponents.createEmptyState('暂无动态'));
        return;
    }

    const fragment = document.createDocumentFragment();
    recent.forEach(dynamic => {
        const card = UIComponents.createDynamicCard(dynamic, (refId) => {
            /* 点击关联作品跳转到对应作品详情 */
            PathUtils.navigate(`${CONFIG.paths.pages}work-detail.html?id=${refId}`);
        });
        fragment.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
}


/**
 * 为动态数据填充关联作品的标题和类型
 * 动态数据中只有 relatedWorkId，需要在渲染前解析出作品的标题和类型
 *
 * @param {Array} dynamics - 动态数据数组
 * @param {Array} works - 作品数据数组
 */

/**
 * 统一错误处理
 * 使用 classifyError 将技术性错误转换为用户友好的提示，
 * 同时在控制台保留详细的技术信息供调试。
 *
 * @param {Error} error - 错误对象
 */
function handleLoadError(error) {
    /* 记录技术细节到控制台 */
    Utils.logError('首页', '加载数据', error);

    /* 分类错误并获取用户友好提示 */
    const classified = Utils.classifyError(error);

    /* 在作品和动态容器中显示错误状态，提供重试按钮 */
    const containers = ['featured-works-container', 'recent-dynamics-container'];
    containers.forEach(id => {
        const el = Utils.getById(id);
        if (el) {
            el.innerHTML = '';
            el.appendChild(UIComponents.createErrorState(classified.message, () => {
                window.location.reload();
            }));
        }
    });
}
