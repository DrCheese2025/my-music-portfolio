/**
 * 功能：加载作品数据，并生成作品卡片Html
 * 新增：搜索功能
 */

/* **************************************
 *               常量定义               *
 * **************************************/

// JSON数据路径常量（相对于当前HTML文件）
const DATA_PATH = '../data/artwork.json';

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
            <audio controls preload="metadata" src="../${work.file_path}"></audio>
        </div>
    `,
    
    video: (work) => `
        <div class="media-container">
            <video controls preload="metadata">
                <picture>
                    <img src="../${work.cover_path || 'placeholder.webp'}" alt="${work.title}封面">
                </picture>
                <source src="../${work.file_path}" type="video/mp4">
            </video>
        </div>
    `
};

/* **************************************
 *            全局变量                 *
 * **************************************/
let allWorks = []; // 存储所有作品数据，用于搜索

/* **************************************
 *            主流程代码               *
 * **************************************/

// 当DOM内容完全加载后执行以下代码
document.addEventListener('DOMContentLoaded', () => {
    // 获取作品集容器对象
    const container = document.getElementById('works-container');
    const loadingState = container.querySelector('.loading-state');

    // 初始化搜索功能
    initSearchFunction();

    // 加载作品数据并处理
    loadArtworksData()
        .then(works => {
            allWorks = works; // 保存所有作品到全局变量
            
            // 渲染作品列表
            renderWorks(works, container);
            
            // 移除加载状态
            loadingState.remove();
        })
        .catch(error => {
            // 显示适当的错误信息
            handleDataError(error, loadingState);
        });
});

/* **************************************
 *            搜索功能函数             *
 * **************************************/

/**
 * 初始化搜索功能
 */
function initSearchFunction() {
    const searchInput = document.getElementById('search-input');
    const clearSearch = document.getElementById('clear-search');
    
    if (!searchInput) return;
    
    // 输入事件监听
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        // 显示/隐藏清除按钮
        if (clearSearch) {
            clearSearch.style.display = searchTerm ? 'block' : 'none';
        }
        
        // 执行搜索
        performSearch(searchTerm);
    });
    
    // 清除搜索按钮事件
    if (clearSearch) {
        clearSearch.addEventListener('click', function() {
            searchInput.value = '';
            this.style.display = 'none';
            performSearch(''); // 清空搜索，显示所有作品
            searchInput.focus();
        });
    }
}

/**
 * 执行搜索
 * @param {string} searchTerm 搜索关键词
 */
function performSearch(searchTerm) {
    const container = document.getElementById('works-container');
    
    if (!searchTerm) {
        // 如果没有搜索词，显示所有作品
        renderWorks(allWorks, container);
        return;
    }
    
    // 过滤作品
    const filteredWorks = allWorks.filter(work => {
        return (
            work.title.toLowerCase().includes(searchTerm) ||
            (work.subtitle && work.subtitle.toLowerCase().includes(searchTerm)) ||
            work.tag.toLowerCase().includes(searchTerm) ||
            work.create_date.includes(searchTerm) ||
            (work.creator && work.creator.toLowerCase().includes(searchTerm)) ||
            work.id.toLowerCase().includes(searchTerm) || 
            (work.lyrics && work.lyrics.toLowerCase().includes(searchTerm))
        );
    });
    
    // 渲染筛选结果
    renderWorks(filteredWorks, container);
}

/**
 * 渲染作品列表
 * @param {Array} works 作品数组
 * @param {HTMLElement} container 容器元素
 */
function renderWorks(works, container) {
    // 使用文档片段优化性能
    const fragment = document.createDocumentFragment();
    
    if (works.length === 0) {
        // 没有作品时显示提示
        container.innerHTML = `
            <div class="no-results">
                <div class="icon">🔍</div>
                <h3>未找到相关作品</h3>
                <p>请尝试其他搜索关键词</p>
            </div>
        `;
        return;
    }
    
    // 遍历works数组，为每个作品创建卡片并添加到片段中
    works.forEach(work => {
        fragment.appendChild(createWorkCard(work));
    });
    
    // 清空容器并添加新内容
    container.innerHTML = '';
    container.appendChild(fragment);
}

/* **************************************
 *              原有功能函数           *
 * **************************************/

/**
 * 加载作品数据
 * @returns {Promise<Array>} 包含作品数据的Promise
 */
async function loadArtworksData() {
    const response = await fetch(DATA_PATH);
    
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
    
    container.innerHTML = `
        <div class="error-state">
            <p class="error">${errorMessage}</p>
            <button onclick="window.location.reload()">重试</button>
        </div>
    `;
}

/**
 * 为work对象创建一个Html卡片
 */
function createWorkCard(work) {
    const workCard = document.createElement('div');
    workCard.className = 'work-card';

    // 点击卡片跳转到详情页
    workCard.addEventListener('click', () => {
        sessionStorage.setItem('artworkSource', 'artworks');
        window.location.href = `../page/artwork-detail.html?id=${work.id}`;
    });
    
    // 组装完整的作品卡片
    workCard.innerHTML = `
        ${createWorkPlayHTML(work)}
        ${createWorkInfoHTML(work)}
    `;

    // 如果是音频作品，防止点击音频控制条时触发卡片点击事件
    if (work.type === 'audio') {
        const audioElement = workCard.querySelector('audio');
        if (audioElement) {
            audioElement.addEventListener('click', e => {
                e.stopPropagation();
            });
        }
    }

    return workCard;
}

/**
 * 创建作品媒体播放区域的HTML
 */
function createWorkPlayHTML(work) {
    return MEDIA_TEMPLATES[work.type]?.(work) || '';
}

/**
 * 创建作品信息区域的HTML
 */
function createWorkInfoHTML(work) {
    return `
    <div class="work-info">
        <h2 class="work-title">${work.title}</h2>
        <div class="work-meta">
            <div class="meta-item"><strong>类别:</strong> ${work.tag}</div>
            ${work.creator ? `<div class="meta-item"><strong>词曲编混唱:</strong> ${work.creator}</div>` : ''}
            <div class="meta-item"><strong>创作时间:</strong> ${work.create_date}</div>
            <div class="meta-item">
                <span class="work-id">ID: ${work.id}</span>
            </div>
        </div>
    </div>
    `;
}