/**
 * ============================================================================
 * 鸥波艺境 - 作品详情页逻辑 (work-detail.js)
 * ============================================================================
 *
 * 作品详情页的核心逻辑，负责：
 *   1. 根据 URL 参数加载指定作品数据
 *   2. 渲染音频/视频播放器
 *   3. 渲染标签页内容（歌词/曲谱/创作手记）
 *   4. 渲染元信息侧边栏
 *   5. 初始化标签页切换
 *
 * @version 1.0.0
 * ============================================================================
 */

/**
 * 页面初始化
 * DOM 加载完成后执行
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        /* 从 URL 参数获取作品 ID */
        const workId = Utils.getParam('id');

        if (!workId) {
            showDetailError(new Error('缺少作品ID参数，请从作品集页面进入'));
            return;
        }

        /* 加载作品数据 */
        const work = await DataLoader.getWorkById(workId);

        if (!work) {
            showDetailError(new Error(`未找到ID为"${workId}"的作品，该作品可能已被移除`));
            return;
        }

        /* 渲染页面各部分 */
        renderPlayer(work);
        renderTabs(work);
        renderSidebar(work);

        /* 更新页面标题 */
        document.title = `${work.title} | ${CONFIG.site.title}`;

        /* 观察页面内所有懒加载图片（封面、曲谱等） */
        Utils.observeLazyImages(document);

    } catch (error) {
        Utils.logError('作品详情', '加载页面', error);
        showDetailError(error);
    }
});


/**
 * 渲染播放器区域
 * 根据作品类型（音频/视频）渲染对应的播放器，
 * 并绑定媒体加载失败的处理逻辑
 *
 * @param {Object} work - 作品数据
 */
function renderPlayer(work) {
    const container = Utils.getById('detail-player');
    if (!container) return;

    /* 构建封面元素，绑定封面图片加载失败处理 */
    const coverHTML = work.cover
        ? `<img class="detail-player__cover" data-src="${work.cover}" alt="${work.title}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="detail-player__cover-placeholder" style="display:none" aria-hidden="true">
               <span>${work.type === 'video' ? '🎬' : '🎵'}</span>
           </div>`
        : `<div class="detail-player__cover-placeholder" aria-hidden="true">
               <span>${work.type === 'video' ? '🎬' : '🎵'}</span>
           </div>`;

    /* 根据作品类型构建播放器 */
    let playerHTML = '';

    if (work.type === 'video' && work.video) {
        /* 视频播放器，添加加载失败提示 */
        playerHTML = `
            <video class="detail-player__video" controls preload="${CONFIG.media.videoPreload}">
                <source src="${work.video}" type="${CONFIG.media.videoFormat}">
                您的浏览器不支持视频播放
            </video>
            <div class="media-error" style="display:none">
                <p class="media-error__message" aria-live="polite">视频加载失败，请检查网络连接</p>
                <button class="media-error__retry" aria-label="重新加载视频">重新加载</button>
            </div>
        `;
    } else if (work.audio) {
        /* 音频播放器，添加加载失败提示 */
        playerHTML = `
            <div class="detail-player__audio-wrap">
                <div class="detail-player__info">
                    ${coverHTML}
                    <div class="detail-player__text">
                        <h2 class="detail-player__title">${work.title}</h2>
                        ${work.subtitle ? `<p class="detail-player__subtitle">${work.subtitle}</p>` : ''}
                    </div>
                </div>
                <audio class="detail-player__audio" controls preload="${CONFIG.media.audioPreload}">
                    <source src="${work.audio}" type="${CONFIG.media.audioFormat}">
                    您的浏览器不支持音频播放
                </audio>
                <div class="media-error" style="display:none">
                    <p class="media-error__message" aria-live="polite">音频加载失败，请检查网络连接</p>
                    <button class="media-error__retry" aria-label="重新加载音频">重新加载</button>
                </div>
            </div>
        `;
    }

    container.innerHTML = playerHTML;

    /* 为媒体元素绑定加载失败事件 */
    bindMediaErrorHandlers(container);
}


/**
 * 渲染标签页内容和导航
 * 使用 UIComponents.createTabs 统一 API 构建标签页，
 * 根据 work 数据动态决定显示哪些标签（歌词/曲谱/创作手记等）。
 *
 * @param {Object} work - 作品数据
 */
function renderTabs(work) {
    const tabsContainer = Utils.getById('detail-tabs');
    if (!tabsContainer) return;

    /* 收集可用的标签页配置 */
    const tabs = [];

    /* 歌词标签页（仅有歌词时显示） */
    if (work.lyrics) {
        tabs.push({
            id: 'lyrics',
            label: '歌词',
            content: `<div class="lyrics-content">${Utils.nl2br(work.lyrics)}</div>`,
        });
    }

    /* 曲谱标签页（仅有曲谱时显示） */
    if (work.score) {
        tabs.push({
            id: 'score',
            label: '曲谱',
            content: `<div class="score-content"><img data-src="${work.score}" alt="${work.title}曲谱"></div>`,
        });
    }

    /* 创作手记标签页（仅有手记时显示） */
    if (work.diary) {
        const paragraphsHTML = work.diary.paragraphs
            ? work.diary.paragraphs.map(p => `<p class="diary-content__paragraph">${p}</p>`).join('')
            : '';

        tabs.push({
            id: 'diary',
            label: '创作手记',
            content: `
                <div class="diary-content">
                    ${work.diary.title ? `<h3 class="diary-content__title">${work.diary.title}</h3>` : ''}
                    ${paragraphsHTML}
                </div>
            `,
        });
    }

    /* 无可用标签页时隐藏标签区域 */
    if (tabs.length === 0) {
        tabsContainer.style.display = 'none';
        return;
    }

    /* 使用统一 API 创建标签页 */
    const tabsEl = UIComponents.createTabs(tabs);
    tabsContainer.innerHTML = '';
    tabsContainer.appendChild(tabsEl);

    /* 为曲谱图片绑定加载失败处理 */
    bindScoreImageErrorHandler(tabsContainer);
}


/**
 * 渲染侧边栏元信息
 *
 * @param {Object} work - 作品数据
 */
function renderSidebar(work) {
    const container = Utils.getById('detail-sidebar');
    if (!container) return;

    /* 构建元信息列表项 */
    const metaItems = [
        { label: '作品ID', value: work.id },
        { label: '标题', value: work.title },
    ];

    /* 可选字段 */
    if (work.subtitle) metaItems.push({ label: '副标题', value: work.subtitle });
    /* 可选字段：分类标签使用带样式的标签组件 */
    if (work.tag) {
        const tagInfo = UIComponents._getTagInfo(work.tag);
        metaItems.push({
            label: '分类',
            value: `<span class="tag ${tagInfo.cssClass}">${tagInfo.label}</span>`,
            isHtml: true
        });
    }
    if (work.creator) metaItems.push({ label: '创作者', value: work.creator });
    if (work.createDate) metaItems.push({ label: '创作日期', value: Utils.formatDateYearMonth(work.createDate) });
    if (work.type) metaItems.push({ label: '类型', value: work.type === 'video' ? 'MV视频' : '音频' });

    /* 渲染：支持 HTML 值（如标签组件）和纯文本值 */
    container.innerHTML = `
        <h4 class="detail-sidebar__title">作品信息</h4>
        <dl class="meta-list">
            ${metaItems.map(item => `
                <div class="meta-list__item">
                    <dt class="meta-list__label">${item.label}</dt>
                    <dd class="meta-list__value">${item.isHtml ? item.value : item.value}</dd>
                </div>
            `).join('')}
        </dl>
    `;
}


/**
 * 显示详情页错误
 * 使用 classifyError 将技术性错误转换为用户友好的提示，
 * 提供返回作品集的链接
 *
 * @param {Error|string} error - 错误对象或错误消息
 */
function showDetailError(error) {
    /* 记录技术细节 */
    if (error instanceof Error) {
        Utils.logError('作品详情', '页面加载', error);
    }

    /* 分类错误并获取用户友好提示 */
    const message = error instanceof Error
        ? Utils.classifyError(error).message
        : String(error);

    const mainEl = Utils.query('.page-main');
    if (!mainEl) return;

    mainEl.innerHTML = '';
    mainEl.appendChild(
        UIComponents.createErrorState(message, () => {
            window.location.href = `${CONFIG.paths.pages}works.html`;
        })
    );
}


/**
 * 为媒体元素绑定加载失败事件处理器
 * 当音频或视频无法加载时，隐藏播放器并显示友好的错误提示，
 * 同时为重试按钮绑定点击事件，支持用户手动重试加载
 *
 * @param {HTMLElement} container - 包含媒体元素的容器
 */
function bindMediaErrorHandlers(container) {
    /**
     * 通用的媒体加载失败处理逻辑
     * 隐藏媒体元素，显示错误提示，绑定重试按钮
     *
     * @param {HTMLAudioElement|HTMLVideoElement} mediaEl - 媒体元素
     */
    function handleMediaError(mediaEl) {
        Utils.logError('作品详情', '媒体加载', mediaEl.error || new Error('媒体加载失败'));

        /* 隐藏播放器控件 */
        mediaEl.style.display = 'none';

        /* 显示错误提示 */
        const errorEl = container.querySelector('.media-error');
        if (errorEl) {
            errorEl.style.display = 'block';
        }

        /* 为重试按钮绑定点击事件 */
        const retryBtn = container.querySelector('.media-error__retry');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                /* 隐藏错误提示 */
                if (errorEl) errorEl.style.display = 'none';
                /* 重新显示媒体元素并重置 src 以触发重新加载 */
                mediaEl.style.display = '';
                const currentSrc = mediaEl.currentSrc || mediaEl.querySelector('source')?.src;
                if (currentSrc) {
                    mediaEl.load();
                }
            });
        }
    }

    /* 处理音频加载失败（使用捕获阶段以捕获 source 子元素的错误） */
    const audio = container.querySelector('.detail-player__audio');
    if (audio) {
        audio.addEventListener('error', () => handleMediaError(audio), true);
    }

    /* 处理视频加载失败 */
    const video = container.querySelector('.detail-player__video');
    if (video) {
        video.addEventListener('error', () => handleMediaError(video), true);
    }
}


/**
 * 为曲谱图片绑定加载失败处理
 * 当曲谱图片无法加载时显示替代文字
 *
 * @param {HTMLElement} container - 包含曲谱图片的容器
 */
function bindScoreImageErrorHandler(container) {
    const scoreImg = container.querySelector('.score-content img');
    if (scoreImg) {
        scoreImg.addEventListener('error', () => {
            Utils.logError('作品详情', '曲谱加载', new Error('曲谱图片加载失败'));
            scoreImg.style.display = 'none';
            const fallback = Utils.createElement('p', {
                className: 'score-fallback',
                textContent: '曲谱图片加载失败，请检查网络连接后刷新页面',
                attributes: { 'role': 'alert' },
            });
            scoreImg.parentElement.appendChild(fallback);
        });
    }
}
