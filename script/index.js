// 配置常量
const FEATURED_WORK_IDS = ['S003', 'V001']; // 指定展示的作品ID
const RECENT_DYNAMICS_COUNT = 2; // 最新动态显示条数

// 修正路径常量 - 相对于index.html的位置
const DATA_PATHS = {
    ARTWORKS: '/my-music-portfolio/data/artwork.json',      // 作品数据JSON文件
    DYNAMICS: '/my-music-portfolio/data/dynamic.json'       // 动态数据JSON文件
};

// 错误提示信息
const ERROR_MSG = {
    DEFAULT: '<p style="color: red;">无法加载作品，请稍后再试。</p>',
    NOT_FOUND: '<p style="color: red;">数据文件不存在，请检查路径。</p>',
    INVALID_FORMAT: '<p style="color: red;">数据格式不正确，请检查数据源。</p>',
    INVALID_DATA: '<p style="color: red;">数据内容错误，请检查数据文件。</p>'
};

/**
 * 媒体类型模板定义
 */
const MEDIA_TEMPLATES = {
    audio: (work) => `
        <div class="media-container audio">
            <div class="audio-icon">🎵</div>
            <audio controls preload="metadata" src="${work.file_path}"></audio>
        </div>
    `,
    
    video: (work) => `
        <div class="media-container">
            <video controls preload="metadata">
                <picture>
                    <img src="${work.cover_path || 'placeholder.webp'}" alt="${work.title}封面">
                </picture>
                <source src="${work.file_path}" type="video/mp4">
            </video>
        </div>
    `
};

/**
 * 首页主函数
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('开始加载首页数据...');
        
        // 并行加载作品和动态数据
        const [works, dynamics] = await Promise.all([
            loadArtworksData(),
            loadRecentDynamics()
        ]);
        
        console.log('数据加载成功:', { works, dynamics });
        
        // 渲染作品区域
        renderFeaturedWorks(works);
        
        // 渲染动态区域
        renderRecentDynamics(dynamics);
        
    } catch (error) {
        console.error('首页数据加载失败:', error);
        handleDataError(error);
    }
});

/**
 * 加载作品数据（修正路径）
 */
async function loadArtworksData() {
    console.log('加载作品数据，路径:', DATA_PATHS.ARTWORKS);
    const response = await fetch(DATA_PATHS.ARTWORKS);
    
    if (!response.ok) {
        throw new Error(`作品数据加载失败! 状态: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('作品数据不是JSON格式');
    }
    
    const works = await response.json();
    
    if (!Array.isArray(works)) {
        throw new Error('作品数据格式错误：预期是数组');
    }
    
    console.log('作品数据加载成功，数量:', works.length);
    return works;
}

/**
 * 加载最新动态（修正路径）
 */
async function loadRecentDynamics() {
    console.log('加载动态数据，路径:', DATA_PATHS.DYNAMICS);
    const response = await fetch(DATA_PATHS.DYNAMICS);
    
    if (!response.ok) {
        throw new Error(`动态数据加载失败! 状态: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('动态数据不是JSON格式');
    }
    
    const dynamics = await response.json();
    
    if (!Array.isArray(dynamics)) {
        throw new Error('动态数据格式错误：预期是数组');
    }
    
    // 按时间倒序排序并取前N条
    const sortedDynamics = dynamics
        .sort((a, b) => {
            // 组合date和time进行排序
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateB - dateA;
        })
        .slice(0, RECENT_DYNAMICS_COUNT);
    
    console.log('动态数据加载成功，数量:', sortedDynamics.length);
    return sortedDynamics;
}

/**
 * 渲染指定作品
 */
function renderFeaturedWorks(works) {
    const container = document.getElementById('featured-works-container');
    if (!container) {
        console.error('未找到作品容器元素');
        return;
    }
    
    const loadingState = container.querySelector('.loading-state');
    
    // 筛选出指定ID的作品
    const featuredWorks = works.filter(work => 
        FEATURED_WORK_IDS.includes(work.id)
    );
    
    console.log('筛选出的展示作品:', featuredWorks);
    
    if (featuredWorks.length === 0) {
        loadingState.innerHTML = '<p class="error">未找到指定的展示作品</p>';
        return;
    }
    
    // 使用文档片段优化性能
    const fragment = document.createDocumentFragment();
    featuredWorks.forEach(work => {
        const card = createWorkCard(work);
        if (card) {
            fragment.appendChild(card);
        }
    });
    
    // 更新容器
    container.appendChild(fragment);
    loadingState.remove();
}

/**
 * 渲染最新动态
 */
function renderRecentDynamics(dynamics) {
    const container = document.getElementById('dynamics-container');
    if (!container) {
        console.error('未找到动态容器元素');
        return;
    }
    
    const loadingState = container.querySelector('.loading-state');
    
    if (dynamics.length === 0) {
        loadingState.innerHTML = '<p>暂无动态</p>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    dynamics.forEach(dynamic => {
        const card = createDynamicCard(dynamic);
        if (card) {
            fragment.appendChild(card);
        }
    });
    
    container.appendChild(fragment);
    loadingState.remove();
}

/**
 * 创建动态卡片
 */
function createDynamicCard(dynamic) {
    const dynamicCard = document.createElement('div');
    dynamicCard.className = 'dynamic-card';
    dynamicCard.setAttribute('data-type', dynamic.type);
    dynamicCard.setAttribute('data-dynamic-id', dynamic.id); // 添加ID属性
    
    // 添加点击事件
    dynamicCard.addEventListener('click', () => {
        // 跳转到动态页面，并传递动态ID
        window.location.href = `page/dynamic.html?highlight=${dynamic.id}`;
    });
    
    // 格式化日期
    const date = new Date(`${dynamic.date} ${dynamic.time}`).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // 构建动态内容HTML
    let dynamicHTML = `
        <div class="dynamic-header">
            <span class="dynamic-type">${dynamic.type}</span>
            <h3 class="dynamic-title">${dynamic.title}</h3>
        </div>
        <div class="dynamic-content">
            <p>${dynamic.content}</p>
        </div>
        <div class="dynamic-meta">
            <span class="dynamic-date">${date}</span>
    `;
    
    // 如果有附件，添加附件信息
    if (dynamic.attachments && dynamic.attachments.length > 0) {
        dynamic.attachments.forEach(attachment => {
            dynamicHTML += `<span class="dynamic-attachment">${attachment.title}</span>`;
        });
    }
    
    dynamicHTML += `</div>`;
    
    dynamicCard.innerHTML = dynamicHTML;
    
    return dynamicCard;
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
        sessionStorage.setItem('artworkSource', 'index');
        window.location.href = `page/artwork-detail.html?id=${work.id}`;
    });
    
    // 组装完整的作品卡片
    workCard.innerHTML = `
        ${createWorkPlayHTML(work)} <!-- 媒体播放区域HTML -->
        ${createWorkInfoHTML(work)} <!-- 作品信息区域HTML -->
    `;

    // 如果是音频作品，防止点击音频控制条时触发卡片点击事件
    if (work.type === 'audio') {
        // 查找卡片中的audio元素，如果存在则阻止其点击事件冒泡
        const audioElement = workCard.querySelector('audio');
        if (audioElement) {
            audioElement.addEventListener('click', e => {
                e.stopPropagation(); // 阻止事件冒泡
            });
        }
    }

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
        <h3 class="work-title">${work.title}</h2>
        
        <!-- 元数据部分 -->
        <div class="work-meta">
            <!-- 类别 -->
            <div class="meta-item"><strong>类别:</strong> ${work.tag}</div>
            
            <!-- 创作者 -->
            ${work.creator ? `<div class="meta-item"><strong>词曲编混唱:</strong> ${work.creator}</div>` : ''}
            
            <!-- 创作完成时间 -->
            <div class="meta-item"><strong>创作时间:</strong> ${work.create_date}</div>
            
            <!-- 作品ID -->
            <div class="meta-item">
                <span class="work-id">ID: ${work.id}</span>
            </div>
        </div>
    </div>
    `;
}

/**
 * 统一错误处理
 */
function handleDataError(error) {
    console.error('处理数据错误:', error);
    
    const errorMessage = `
        <div class="error-state">
            <p class="error">数据加载失败: ${error.message}</p>
            <button onclick="window.location.reload()">重新加载</button>
        </div>
    `;
    
    // 同时更新两个容器的错误状态
    ['featured-works-container', 'dynamics-container'].forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            const loadingState = container.querySelector('.loading-state');
            if (loadingState) {
                loadingState.innerHTML = errorMessage;
                loadingState.classList.add('error-state');
            }
        }
    });
}



