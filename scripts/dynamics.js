/**
 * 动态页面功能逻辑
 * 加载并展示动态数据
 */

// 常量定义
const DATA_PATH = '../data/dynamics.json';

// 错误信息
const ERROR_MSG = {
    LOAD_FAIL: '加载动态失败，请稍后重试',
    NOT_FOUND: '暂无动态内容',
    DATA_LOAD_FAIL: '数据加载失败'
};

// 类型图标映射
const TYPE_ICONS = {
    '创作': '🎵',
    '演出': '🎭',
    '分享': '💬',
    '生活随笔': '📝'
};

// 附件类型图标
const ATTACHMENT_ICONS = {
    'audio': '🎵',
    'video': '🎬',
    'image': '🖼️',
    'default': '📎'
};

// 主流程
document.addEventListener('DOMContentLoaded', async () => {
    const dynamicsList = document.getElementById('dynamics-list');
    
    try {
        const dynamics = await loadDynamicsData();
        renderDynamicsList(dynamics, dynamicsList);
    } catch (error) {
        console.error('加载动态失败:', error);
        showError(
            error.message === ERROR_MSG.NOT_FOUND 
                ? ERROR_MSG.NOT_FOUND 
                : ERROR_MSG.LOAD_FAIL,
            dynamicsList
        );
    }
});

/**
 * 加载动态数据
 */
async function loadDynamicsData() {
    const response = await fetch(DATA_PATH);
    
    if (!response.ok) {
        throw new Error(ERROR_MSG.DATA_LOAD_FAIL);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('服务器返回的不是JSON数据');
    }
    
    const dynamics = await response.json();
    
    if (!Array.isArray(dynamics)) {
        throw new Error('数据格式错误：预期是数组');
    }
    
    // 按日期降序排序
    return dynamics.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
}

/**
 * 渲染动态列表
 */
function renderDynamicsList(dynamics, container) {
    if (dynamics.length === 0) {
        showEmptyState(container);
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    dynamics.forEach(dynamic => {
        fragment.appendChild(createDynamicCard(dynamic));
    });
    
    // 清空容器并添加新内容
    container.innerHTML = '';
    container.appendChild(fragment);
}

/**
 * 创建动态卡片
 */
function createDynamicCard(dynamic) {
    const card = document.createElement('article');
    card.className = 'dynamic-card';
    
    card.innerHTML = `
        <div class="dynamic-header">
            <div class="dynamic-meta">
                <h2 class="dynamic-title">${dynamic.title}</h2>
                <div class="dynamic-info">
                    <span class="dynamic-date">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                            <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                        </svg>
                        ${dynamic.date} ${dynamic.time}
                    </span>
                </div>
            </div>
            <span class="dynamic-type">${TYPE_ICONS[dynamic.type] || TYPE_ICONS['默认']} ${dynamic.type}</span>
        </div>
        
        ${dynamic.cover ? `<img src="../${dynamic.cover}" alt="${dynamic.title}" class="dynamic-cover" loading="lazy">` : ''}
        
        <div class="dynamic-content">${dynamic.content}</div>
        
        ${dynamic.attachments && dynamic.attachments.length > 0 ? renderAttachments(dynamic.attachments) : ''}
    `;
    
    return card;
}

/**
 * 渲染附件
 */
function renderAttachments(attachments) {
    return `
        <div class="dynamic-attachments">
            ${attachments.map(attachment => `
                <div class="attachment-item">
                    <div class="attachment-header">
                        <span class="attachment-icon">${ATTACHMENT_ICONS[attachment.type] || ATTACHMENT_ICONS['default']}</span>
                        <span>${attachment.title}</span>
                    </div>
                    <div class="attachment-content">
                        ${renderAttachmentContent(attachment)}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * 渲染附件内容
 */
function renderAttachmentContent(attachment) {
    switch (attachment.type) {
        case 'audio':
            return `<audio controls preload="metadata" src="../${attachment.url}"></audio>`;
        case 'video':
            return `<video controls preload="metadata" src="../${attachment.url}" style="width: 100%;"></video>`;
        case 'image':
            return `<img src="../${attachment.url}" alt="${attachment.title}" style="max-width: 100%; border-radius: 4px;">`;
        default:
            return `<a href="../${attachment.url}" target="_blank">查看附件</a>`;
    }
}

/**
 * 显示错误信息
 */
function showError(message, container) {
    container.innerHTML = `
        <div class="loading-state error-state">
            <p>${message}</p>
            <button onclick="window.location.reload()">重新加载</button>
        </div>
    `;
}

/**
 * 显示空状态
 */
function showEmptyState(container) {
    container.innerHTML = `
        <div class="empty-state">
            <div class="icon">📝</div>
            <h3>暂无动态</h3>
            <p>还没有发布任何动态，敬请期待...</p>
        </div>
    `;
}