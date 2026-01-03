/**
 * 功能：加载作品数据，并生成作品内容展示Html
 * @file 作品详情页作品数据展示逻辑
 */

/* **************************************
 *               常量定义               *
 * **************************************/

// JSON数据路径常量（相对于当前HTML文件）
// 修改：现在只使用一个JSON文件路径
const DATA_PATHS = {
    ARTWORKS: '../data/artwork.json'      // 作品完整数据路径（包含基本信息和内容）
    // 移除：不再需要artwork-content.json
};

// 错误信息常量
const ERROR_MSG = {
    NO_ID: '未指定作品ID',
    LOAD_FAIL: '加载作品失败，请稍后重试',
    NOT_FOUND: '作品不存在',
    DATA_LOAD_FAIL: '数据加载失败'
};

// 标签页系统配置
const TAB_CONFIG = {
    // 歌词标签配置
    lyrics: {
        label: '歌词',  // 标签显示文本
        // 渲染函数 - 返回歌词内容
        render: (content) => content.lyrics 
    },
    // 曲谱标签配置
    score: {
        label: '曲谱',  // 标签显示文本
        // 渲染函数 - 如果有曲谱路径则返回图片HTML，否则返回null
        render: (content) => content.score_path 
        ? `<img src="../${content.score_path}" alt="曲谱" class="score-image">`
        : null
    },
    // 创作故事标签配置
    stories: {
        label: '创作故事',  // 标签显示文本
        // 渲染函数 - 返回创作故事内容
        render: (content) => content.stories 
    }
    // 可以在此处添加新的标签页配置
};

// 页面来源配置
const PAGE_SOURCES = {  // 使用绝对路径
    index: '/index.html',
    artworks: '/page/artwork-list.html',
    dynamics: '/page/dynamic.html',
    external: '/index.html' // 默认值
};

/* **************************************
 *              主流程代码               *
 * **************************************/

// 当DOM内容完全加载后执行
document.addEventListener('DOMContentLoaded', async () => {
    // 获取媒体容器并显示加载状态
    const mediaContainer = document.getElementById('media-container');
    
    try {
        // 从URL参数获取作品ID
        const workId = new URLSearchParams(window.location.search).get('id');
        
        // 如果没有作品ID，抛出错误
        if (!workId) {
        throw new Error(ERROR_MSG.NO_ID);
        }
        
        // 设置返回按钮
        setupBackButton();
        
        // 修改：现在只加载一个JSON文件，获取完整的作品数据
        const work = await loadWorkData(workId);
        
        // 渲染作品详情页
        renderWorkDetail(work);
        
    } catch (error) {
        // 捕获并处理错误
        console.error('加载失败:', error);
        
        // 根据错误类型显示不同的错误信息
        showError(
        error.message === ERROR_MSG.NOT_FOUND 
            ? ERROR_MSG.NOT_FOUND 
            : ERROR_MSG.LOAD_FAIL,
        mediaContainer
        );
    }
});

/* **************************************
 *              工具函数               *
 * **************************************/

/**
 * 处理fetch响应
 * @param {Response} response fetch API的响应对象
 * @returns {Promise<any>} 解析后的JSON数据
 * @throws {Error} 当响应不成功时抛出错误
 */
function handleResponse(response) {
    // 检查HTTP状态码是否表示成功(200-299)
    if (!response.ok) {
        throw new Error(`${response.url}加载失败: ${response.status}`);
    }
    
    // 检查响应内容类型是否为JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`${response.url}返回的不是JSON数据`);
    }
    
    // 返回解析后的JSON数据
    return response.json();
}

/**
 * 显示错误信息
 * @param {string} message 要显示的错误信息
 * @param {HTMLElement} [container] 错误信息容器(默认为media-container)
 */
function showError(message, container) {
    // 如果没有指定容器，使用默认的media-container
    const errorContainer = container || document.getElementById('media-container');
    // 设置错误信息HTML，红色文字
    errorContainer.innerHTML = `<p class="loading" style="color: red;">${message}</p>`;
}

/* **************************************
 *            数据加载函数             *
 * **************************************/

/**
 * 加载作品数据
 * @param {string} workId 作品ID
 * @returns {Promise<Object>} 包含作品完整信息的对象
 * @throws {Error} 当作品不存在或数据加载失败时抛出错误
 */
async function loadWorkData(workId) {
    // 修改：现在只加载一个JSON文件
    // 加载作品完整信息（包含基本信息和内容）
    const artworks = await fetch(DATA_PATHS.ARTWORKS).then(handleResponse);

    // 在数组中查找匹配ID的作品
    const work = artworks.find(item => item.id === workId);
    
    // 如果找不到作品，抛出错误
    if (!work) {
        throw new Error(ERROR_MSG.NOT_FOUND);
    }
    
    // 返回找到的作品数据
    // 注意：现在work对象包含完整信息，包括之前content.json中的数据
    return work;
}

/* **************************************
 *            渲染函数               *
 * **************************************/

/**
 * 渲染媒体内容(音频/视频)
 * @param {Object} work 作品数据（包含完整信息）
 * @param {HTMLElement} container 容器元素
 */
function renderMedia(work, container) {
    // 清空容器内容
    container.innerHTML = '';
    
    // 根据作品类型选择不同的渲染方式
    if (work.type === 'audio') {
        // 音频作品渲染逻辑
        container.innerHTML = `
        <div class="audio-display">
            <!-- 音频播放器 -->
            <audio controls preload="metadata" src="../${work.file_path}"></audio>
            <!-- 
            controls: 显示音频控制条
            preload="metadata": 只预加载元数据
            src: 音频文件路径，使用相对路径(相对于HTML文件)
            -->
        </div>
        `;
    } else {
    // 视频作品渲染逻辑
    container.innerHTML = `
      <div class="video-display">
        <!-- 视频播放器 -->
        <video controls preload="metadata" poster="../${work.cover_path || '../placeholder.webp'}">
          <!-- 
            controls: 显示视频控制条
            preload="metadata": 只预加载元数据
            poster: 视频封面图，如果没有则使用占位图
          -->
          <source src="../${work.file_path}" type="video/mp4">
          您的浏览器不支持HTML5视频 <!-- 浏览器不支持时的后备文本 -->
        </video>
      </div>
    `;
  }
}

/**
 * 生成作品信息HTML
 * @param {Object} work 作品数据（包含完整信息）
 * @returns {string} 作品信息HTML字符串
 */
function generateWorkInfoHTML(work) {
    return `
        <h2>作品信息</h2>

        <!-- 作品ID -->
        <div class="meta-item"><strong>作品ID:</strong> <span>${work.id}</span></div>

        <!-- 作品标题 -->
        <div class="meta-item"><strong>标题:</strong> <span>${work.title}</span></div>

        <!-- 副标题，添加彩蛋功能 -->
            ${work.subtitle ? `
            <div class="meta-item">
                <strong>副标题:</strong> 
                <span ${work.id === 'S001' ? 'id="thanksgiving-trigger"' : ''}>${work.subtitle}</span>
            </div>
        ` : ''}

        <!-- 作品类别 -->
        <div class="meta-item"><strong>类别:</strong> <span>${work.tag}</span></div>
        <!-- 创作人员信息 -->
        ${work.creator ? `<div class="meta-item"><strong>词曲编混唱:</strong> <span>${work.creator}</span></div>` : ''}
        <!-- 完成时间 -->
        <div class="meta-item"><strong>创作时间:</strong> <span>${work.create_date}</span></div>
        <!-- ISRC编码 -->
        ${work.isrc ? `<div class="meta-item"><strong>词曲编混唱:</strong> <span>${work.isrc}</span></div>` : ''}
        
    `;
}

/**
 * 渲染作品内容区域
 * @param {Object} work 作品数据（包含完整信息）
 * @param {HTMLElement} container 容器元素
 */
function renderContent(work, container) {
    // 创建文档片段(优化性能，减少DOM操作)
    const fragment = document.createDocumentFragment();
    
    // 创建作品信息元素
    const infoElement = document.createElement('div');
    infoElement.className = 'work-info';
    infoElement.innerHTML = generateWorkInfoHTML(work);
    fragment.appendChild(infoElement);
    
    // 如果有备注内容，添加到左侧区域
    // 修改：现在从work对象直接获取notes
    if (work.notes && work.notes.trim() !== '') {
        addNotesContent(work.notes);
    }

    // 清空容器并一次性添加所有元素
    container.innerHTML = '';
    container.appendChild(fragment);
    
    // 如果是音频作品，创建标签页系统
    if (work.type === 'audio') {
        // 修改：直接将work对象传递给标签系统，它包含所有内容数据
        createTabSystem(work);
    }
}

/**
 * 添加备注内容到左侧区域
 * @param {string} notes 备注内容
 */
function addNotesContent(notes) {
    // 检查是否已存在备注容器（避免重复添加）
    if (!document.querySelector('.notes-container')) {
        // 获取左侧内容容器
        const leftContent = document.querySelector('.left-content');
        
        // 创建备注容器元素
        const notesContainer = document.createElement('div');
        notesContainer.className = 'notes-container';
        notesContainer.innerHTML = `
        <h3>作品说明</h3>
        <div class="notes-content">${notes}</div>
        `;
        
        // 将备注容器添加到左侧内容底部
        leftContent.appendChild(notesContainer);
    }
}

/**
 * 创建极简风格的标签页系统
 * @param {Object} work 作品数据（包含完整信息）
 */
function createTabSystem(work) {
    // 修改：现在直接使用work对象，它包含所有标签页所需的内容
    const mediaContainer = document.getElementById('media-container');
    
    // 创建文档片段(优化性能)
    const fragment = document.createDocumentFragment();
    
    // 创建标签页容器
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';
    
    // 创建标签导航
    const tabNav = document.createElement('div');
    tabNav.className = 'tab-nav';
    
    // 创建内容区域
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    
    // 根据配置生成有效的标签页(过滤掉没有内容的标签)
    const tabs = Object.entries(TAB_CONFIG)
        .map(([id, config]) => ({
        id,
        label: config.label,
        content: config.render(work) // 修改：直接从work对象获取内容
        }))
        .filter(tab => tab.content); // 过滤掉内容为空的标签

    // 如果没有有效标签，则不创建标签系统
    if (tabs.length === 0) return;
    
    // 生成标签导航HTML
    tabNav.innerHTML = tabs.map((tab, index) => `
        <button class="tab-button ${index === 0 ? 'active' : ''}" 
                data-tab="${tab.id}"
                aria-label="切换到${tab.label}标签">
        ${tab.label}
        </button>
    `).join('');
    
    // 生成标签内容HTML
    tabContent.innerHTML = tabs.map((tab, index) => `
        <div class="tab-pane ${index === 0 ? 'active' : ''}" 
            id="${tab.id}-pane" 
            role="tabpanel"
            aria-labelledby="${tab.id}-tab">
        <div class="tab-pane-content">${tab.content}</div>
        </div>
    `).join('');
    
    // 组装标签系统
    tabContainer.appendChild(tabNav);
    tabContainer.appendChild(tabContent);
    fragment.appendChild(tabContainer);
    
    // 将标签系统添加到媒体容器
    mediaContainer.appendChild(fragment);
    
    // 添加标签切换事件
    tabNav.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-button')) {
        const tabId = e.target.dataset.tab;
        
        // 更新活动标签按钮
        tabNav.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // 更新活动内容面板
        tabContent.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabId}-pane`).classList.add('active');
        }
    });
}

/**
 * 渲染整个作品详情页
 * @param {Object} work 作品完整数据
 */
function renderWorkDetail(work) {
    // 设置页面标题
    document.title = `${work.title} | 鸥波艺境`;
    document.getElementById('detail-title').textContent = work.title;
    
    // 渲染媒体内容
    renderMedia(work, document.getElementById('media-container'));
    
    // 渲染文字内容
    // 修改：现在只传递work对象，不需要单独的content对象
    renderContent(work, document.getElementById('content-container'));

    // 初始化2025感恩节彩蛋（只在特定作品页面）
    initThanksgivingEasterEgg(work);
}


/* **************************************
 *            页面返回函数               *
 * **************************************/

/**
 * 设置返回按钮链接
 * 优先使用sessionStorage记录的来源，其次根据referrer推断
 */
function setupBackButton() {
    const backButton = document.querySelector('.back-button');
    if (!backButton) return;
    
    // 获取来源，优先用sessionStorage，其次用referrer判断
    let source = sessionStorage.getItem('artworkSource');
    if (!source) {
        // 根据上一页URL判断来源
        const referrer = document.referrer;
        if (referrer.includes('artwork-list.html')) source = 'artworks';
        else if (referrer.includes('index.html') || referrer.endsWith('/')) source = 'index';
        else source = 'index'; // 默认返回首页
    }
    
    // 设置返回链接
    if (source === 'artworks') {
        backButton.href = '../page/artwork-list.html';
    } else {
        backButton.href = '../index.html';
    }
    
    // 清除记录
    sessionStorage.removeItem('artworkSource');
}


/* **************************************
 *            2025感恩节彩蛋             *
 * **************************************/

/**
 * 初始化感恩节彩蛋
 * 只在《写给春天的歌》页面显示（作品ID: S001）
 */
function initThanksgivingEasterEgg(work) {
    // 只在特定作品页面启用彩蛋
    if (work.id !== 'S001') return;
    
    const trigger = document.getElementById('thanksgiving-trigger');
    if (!trigger) return;

    // 为副标题添加特效类名
    trigger.classList.add('subtitle-clickable');
    
    // 创建彩蛋HTML结构 - 将关闭按钮移到卡片外部
    const easterEggHTML = `
        <div class="thanksgiving-overlay" id="thanksgiving-easter-egg">
            <button class="thanksgiving-close" aria-label="关闭">×</button>
            <div class="thanksgiving-card">
                <div class="thanksgiving-heart">❤️</div>
                <div class="thanksgiving-message">
                    <div class="line1">特别的爱给特别的你</div>
                    <div class="line2">愿您开心快乐</div>
                    <div class="line3">鸥波萍迹 2025感恩节</div>
                </div>
            </div>
        </div>
    `;
    
    // 插入到页面
    document.body.insertAdjacentHTML('beforeend', easterEggHTML);
    
    const overlay = document.getElementById('thanksgiving-easter-egg');
    const closeBtn = overlay.querySelector('.thanksgiving-close');
    
    // 计算滚动条宽度-防止弹出彩蛋时页面左右跳动
    function getScrollbarWidth() {
        return window.innerWidth - document.documentElement.clientWidth;
    }
    
    // 关闭彩蛋的统一函数
    function closeThanksgiving() {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }
    
    // 点击副标题显示彩蛋
    trigger.addEventListener('click', () => {
        const scrollbarWidth = getScrollbarWidth();
        document.body.style.paddingRight = `${scrollbarWidth}px`;
        document.body.style.overflow = 'hidden';
        overlay.style.display = 'flex';
    });
    
    // 关闭事件
    closeBtn.addEventListener('click', closeThanksgiving);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeThanksgiving();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.style.display === 'flex') closeThanksgiving();
    });
}