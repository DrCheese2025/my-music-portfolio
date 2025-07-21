/**
 * 作品详情页逻辑
 * 功能：
 * 1. 从URL参数获取作品ID
 * 2. 加载作品基本信息(artworks.json)
 * 3. 加载作品详细内容(artworks_content.json)
 * 4. 动态渲染页面内容
 */

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const mediaContainer = document.getElementById('media-container');
    const contentContainer = document.getElementById('content-container');
    const titleElement = document.getElementById('detail-title');
    
    // 显示加载状态
    mediaContainer.innerHTML = '<p class="loading">加载作品中...</p>';
    contentContainer.innerHTML = '';
    
    // 从URL获取作品ID
    const urlParams = new URLSearchParams(window.location.search);
    const workId = urlParams.get('id');
    
    if (!workId) {
        showError('未指定作品ID');
        return;
    }
    
    // 并行加载两个JSON文件
    Promise.all([
        fetch('/data/artworks.json').then(res => res.json()),
        fetch('/data/artworks-content.json').then(res => res.json())
    ])
    .then(([artworks, worksContent]) => {
        // 查找当前作品
        const work = artworks.find(item => item.id === workId);
        const content = worksContent[workId];
        
        if (!work || !content) {
            throw new Error('作品不存在');
        }
        
        // 设置页面标题
        document.title = `${work.title} | 我的多媒体作品集`;
        titleElement.textContent = work.title;
        
        // 渲染媒体内容
        renderMedia(work, mediaContainer);
        
        // 渲染文字内容
        renderContent(work, content, contentContainer);
    })
    .catch(error => {
        console.error('加载失败:', error);
        showError('加载作品失败，请稍后重试');
    });
});

/**
 * 渲染媒体内容
 * @param {Object} work 作品数据
 * @param {HTMLElement} container 容器元素
 */
function renderMedia(work, container) {
    if (work.type === 'audio') {
        container.innerHTML = `
            <div class="audio-display">
                <audio controls preload="metadata" src="${work.file_path}"></audio>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="video-display">
                <video controls preload="metadata" poster="${work.cover_path || 'placeholder.jpg'}">
                    <source src="${work.file_path}" type="video/mp4">
                    您的浏览器不支持HTML5视频
                </video>
            </div>
        `;
    }
}

/**
 * 渲染文字内容
 * @param {Object} work 作品数据
 * @param {Object} content 作品内容
 * @param {HTMLElement} container 容器元素
 */
function renderContent(work, content, container) {
    // 显示作品信息
    let html = `
        <div class="work-info">
            <h2>作品信息</h2>
            <div class="meta-item"><strong>标题:</strong> <span>${work.title}</span></div>
            ${work.subtitle ? `<div class="meta-item"><strong>副标题:</strong> <span>${work.subtitle}</span></div>` : ''}
            <div class="meta-item"><strong>类别:</strong> <span>${work.tag}</span></div>

            ${work.author ? `<div class="meta-item"><strong>作者:</strong> <span>${work.author}</span></div>` : ''}

            ${work.songwriter ? `<div class="meta-item"><strong>词曲:</strong> <span>${work.songwriter}</span></div>` : ''}
            ${work.singer ? `<div class="meta-item"><strong>演唱:</strong> <span>${work.singer}</span></div>` : ''}
            ${work.accompanist ? `<div class="meta-item"><strong>伴奏:</strong> <span>${work.accompanist}</span></div>` : ''}

            ${work.duration ? `<div class="meta-item"><strong>时长:</strong> <span>${work.duration}</span></div>` : ''}
            
            <div class="meta-item"><strong>创作时间:</strong> <span>${work.create_date}</span></div>
            <div class="meta-item"><strong>作品ID:</strong> <span>${work.id}</span></div>
        </div>
    `;
    /*  这段注释要保留！
        creator是所有作品都有的“创作者” ，
        author是视频作品的作者，
        songwriter是词曲作者，singer是演唱者，accompanist是伴奏，即编混。
    */
    
    container.innerHTML = html;
    

    // 备注区域添加逻辑
    if (content.notes && content.notes !== "") {
        // 1. 获取左侧内容容器（已在HTML中预定义）
        // querySelector通过CSS类名选择元素，比动态创建更可靠
        const leftContent = document.querySelector('.left-content');
        
        // 2. 检查是否已存在备注容器（避免重复添加）
        // 使用document.querySelector检查整个文档中是否已有.notes-container
        if (!document.querySelector('.notes-container')) {
            // 3. 创建备注容器元素
            const notesContainer = document.createElement('div');
            
            // 4. 为容器添加CSS类名（用于样式控制）
            notesContainer.className = 'notes-container';
            
            // 5. 填充备注内容HTML
            // 使用模板字符串动态插入作品说明内容（${content.notes}）
            notesContainer.innerHTML = `
                <h3>作品说明</h3>
                <div class="notes-content">${content.notes}</div>
            `;
            
            // 6. 将备注容器添加到左侧内容底部
            // appendChild方法将元素添加为left-content的最后一个子元素
            leftContent.appendChild(notesContainer);
        }
    }

    // 修复标签页系统：移除重复的备注标签
    if (work.type === 'audio') {
        createTabSystem(work, {
            ...content,
            notes: undefined // 防止在标签页重复显示备注
        });
    }
}

/**
 * 创建极简风格的标签页系统
 * @param {Object} work 作品数据
 * @param {Object} content 作品内容
 */
function createTabSystem(work, content) {
    const mediaContainer = document.getElementById('media-container');
    
    // 创建标签页容器
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';
    
    // 创建标签导航
    const tabNav = document.createElement('div');
    tabNav.className = 'tab-nav';
    
    // 创建内容区域
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    
    // 默认总是有歌词标签
    const tabs = [
        { id: 'lyrics', label: '歌词', content: content.lyrics }
    ];
    
    // 如果有曲谱路径，添加曲谱标签
    if (content.score_path) {
        tabs.push({
            id: 'score', 
            label: '曲谱', 
            content: `<img src="${content.score_path}" alt="曲谱" class="score-image">`
        });
    }

    /*
    // 如果要添加新的卡片，就添加如下代码
    if (content.score_path) {
        tabs.push({
            id: 'story', 
            label: '创作背景', 
            content: content.story
        });
    }
    */
    
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
    mediaContainer.appendChild(tabContainer);
    
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
 * 显示错误信息
 * @param {String} message 错误信息
 */
function showError(message) {
    const container = document.getElementById('media-container');
    container.innerHTML = `<p class="loading" style="color: red;">${message}</p>`;
}