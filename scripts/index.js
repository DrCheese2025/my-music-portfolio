/**
 * 功能：加载作品数据，并生成作品卡片Html
 * @file 首页作品列表展示逻辑
 */

/* **************************************
 *               常量定义               *
 * **************************************/

// JSON数据路径常量（相对于当前HTML文件）
const DATA_PATH = 'data/artworks.json';     // 作品基本信息路径

// 错误提示信息
const ERROR_MSG = {
    DEFAULT: '<p style="color: red;">无法加载作品，请稍后再试。</p>',
    NOT_FOUND: '<p style="color: red;">数据文件不存在，请检查路径。</p>',
    INVALID_FORMAT: '<p style="color: red;">数据格式不正确，请检查数据源。</p>',
    INVALID_DATA: '<p style="color: red;">数据内容错误，请检查数据文件。</p>'
};

/**
 * 媒体类型模板定义
 * 使用对象映射不同媒体类型的HTML模板，便于扩展新的媒体类型
 * 每个模板函数接收work对象作为参数，返回对应的HTML字符串
 */
const MEDIA_TEMPLATES = {
    /**
     * 音频作品模板
     * @param {Object} work 作品数据对象
     * @returns {string} 音频播放器HTML
     */
    audio: (work) => `
        <div class="media-container audio">
            <div class="audio-icon">🎵</div>    <!-- 音频图标 -->
            <audio controls preload="metadata" src="${work.file_path}"></audio> <!-- 音频播放器 -->
        </div>
    `,
    
    /**
     * 视频作品模板
     * @param {Object} work 作品数据对象
     * @returns {string} 视频播放器HTML
     */
    video: (work) => `
        <div class="media-container">
            <video controls preload="metadata"> <!-- 视频播放器 -->
            <!-- preload="metadata" - 只预加载多媒体的元数据，加载更快 -->
                <picture>
                    <!-- 视频封面图片，如果cover_path不存在则使用占位图 -->
                    <img src="${work.cover_path || 'placeholder.webp'}" alt="${work.title}封面">
                    <!-- webp比jpg图片体积小，加载更快-->
                </picture>
                <source src="${work.file_path}" type="video/mp4"> <!-- 视频源文件 -->
            </video>
        </div>
    `
};

/* **************************************
 *            主流程代码               *
 * **************************************/

// 当DOM内容完全加载后执行以下代码
document.addEventListener('DOMContentLoaded', () => {
    // 获取作品集容器对象 - 这是HTML中id为'works-container'的div元素
    const container = document.getElementById('works-container');

    // 加载作品数据并处理
    loadArtworksData()
        .then(works => {
            // 使用文档片段优化性能 - 先在内存中构建DOM，最后一次性添加到页面
            // 这样可以减少页面重绘次数，提高性能
            const fragment = document.createDocumentFragment();

            // 获取加载状态元素
            const loadingState = container.querySelector('.loading-state');
            
            // 遍历works数组，为每个作品创建卡片并添加到片段中
            works.forEach(work => {
                fragment.appendChild(createWorkCard(work));
            });
            
            // 向页面添加新内容
            container.appendChild(fragment);
            
            // 移除html中显示的加载状态（而不是清空整个容器）
            loadingState.remove();

        })
        .catch(error => {
            // 显示适当的错误信息
            handleDataError(error, loadingState);
        });
});

/* **************************************
 *              功能函数               *
 * **************************************/

/**
 * 加载作品数据
 * @returns {Promise<Array>} 包含作品数据的Promise
 * @throws {Error} 当数据加载或解析失败时抛出错误
 */
async function loadArtworksData() {
    const response = await fetch(DATA_PATH);
    /* 这里的fetch()，路径参数是相对于调用本JS代码的index.html所在目录的。 */
    
    // 检查HTTP状态码
    if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`);
    }
    
    // 检查Content-Type是否正确
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('服务器返回的不是JSON数据');
    }
    
    const works = await response.json();
    
    // 检查数据格式是否正确
    if (!Array.isArray(works)) {
        throw new Error('数据格式错误：预期是数组');
    }
    
    return works;
}

/**
 * 处理数据加载错误
 * @param {Error} error 错误对象
 * @param {HTMLElement} container 容器元素
 */
function handleDataError(error, container) {
    console.error('加载作品数据失败:', error);
    
    let errorMessage = ERROR_MSG.DEFAULT;
    if (error.message.includes('状态: 404')) {
        errorMessage = ERROR_MSG.NOT_FOUND;
    } else if (error.message.includes('不是JSON数据')) {
        errorMessage = ERROR_MSG.INVALID_FORMAT;
    } else if (error.message.includes('数据格式错误')) {
        errorMessage = ERROR_MSG.INVALID_DATA;
    }
    
    // 更新加载状态元素而不是替换整个容器
    loadingState.innerHTML = `
        <p class="error" style="color: red;">${errorMessage}</p>
        <button onclick="window.location.reload()">重试</button>
    `;
    
    // 添加重试按钮的样式（可以在CSS中添加）
    loadingState.classList.add('error-state');
}

/**
 * 为work对象创建一个Html卡片
 * @param {Object} work 作品数据对象
 * @returns {HTMLElement} 创建好的作品卡片元素
 */
function createWorkCard(work) {
    // 创建一个div元素作为作品卡片
    const workCard = document.createElement('div');
    // 为卡片添加CSS类名'work-card'
    workCard.className = 'work-card';

    // 当点击卡片时跳转到详情页，并传递作品ID作为URL参数
    workCard.addEventListener('click', () => {
        // 跳转到详情页
        window.location.href = `pages/artwork-detail.html?id=${work.id}`;
        /* 注意路径是相对于index.html的，因为这是生成index.html中的片段 */
    });
    
    // 如果是音频作品，防止点击音频控制条时触发卡片点击事件
    if (work.type === 'audio') {
        // 查找卡片中的audio元素，如果存在则阻止其点击事件冒泡
        workCard.querySelector('audio')?.addEventListener('click', e => {
            e.stopPropagation(); // 阻止事件冒泡
        });
    }

    // 组装完整的作品卡片
    workCard.innerHTML = `
        ${createWorkPlayHTML(work)} <!-- 媒体播放区域HTML -->
        ${createWorkInfoHTML(work)} <!-- 作品信息区域HTML -->
    `;

    return workCard;
}

/**
 * 创建作品媒体播放区域的HTML
 * @param {Object} work 作品数据对象
 * @returns {string} 媒体播放区域的HTML字符串
 */
function createWorkPlayHTML(work) {
    // 从模板中获取对应媒体类型的HTML，如果没有匹配则返回空字符串
    return MEDIA_TEMPLATES[work.type]?.(work) || '';
}

/**
 * 创建作品信息区域的HTML
 * @param {Object} work 作品数据对象
 * @returns {string} 作品信息区域的HTML字符串
 */
function createWorkInfoHTML(work) {
    return `
    <!-- 作品信息 -->
    <div class="work-info">
        <!-- 标题部分 -->
        <h2 class="work-title">${work.title}</h2>
        
        <!-- 元数据部分 -->
        <div class="work-meta">
            <!-- 标题 -->
            <div class="meta-item"><strong>类别:</strong> ${work.tag}</div>

            <!-- 副标题 -->
            ${work.subtitle ? `<div class="meta-item"><strong>作者:</strong> ${work.subtitle}</div>` : '\n'}
            
            <!-- 创作者信息 -->
            ${work.creator ? `<div class="meta-item"><strong>作者:</strong> ${work.creator}</div>` : '\n'}
            
            <!-- 作品ID -->
            <div class="meta-item">
                <span class="work-id">${work.id-info}</span>
            </div>
        </div>
    </div>
    `;
}