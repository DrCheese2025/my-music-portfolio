
/*
 * 扩展建议
未来过渡到后端数据库：
后续只需将 fetch('../data/works.json') 替换为 fetch('http://你的API地址/works')，其他代码无需改动。
 */

document.addEventListener('DOMContentLoaded', () => {

    // 获取作品集容器对象
    const container = document.getElementById('works-container');
    
    // 添加加载状态提示（在fetch之前，等fetch取回数据就清空这行提示语）
    container.innerHTML = '<p class="loading">加载作品中...</p>';

    // 1. 加载JSON数据
    fetch('/data/artworks.json')
        .then(response => response.json())
        .then(works => {
            
            // 清空加载状态
            container.innerHTML = '';
            
            // 2. 遍历所有作品并生成HTML
            works.forEach(work => {
                const workCard = document.createElement('div');
                workCard.className = 'work-card';

                // 作品卡片的点击事件
                workCard.addEventListener('click', () => {
                    // 跳转到详情页，传递作品ID
                    window.location.href = `/pages/artwork-detail.html?id=${work.id}`;
                });
                // 阻止音频控制条的点击事件冒泡
                if (work.type === 'audio') {
                    workCard.querySelector('audio')?.addEventListener('click', e => {
                        e.stopPropagation();
                    });
                }
                
                // 3. 根据作品类型生成不同的媒体HTML
                const mediaHTML = work.type === 'audio' 
                ? `<div class="media-container audio">
                    <div class="audio-icon">🎵</div>
                    <audio controls preload="metadata" src="${work.file_path}"></audio>
                </div>`
                : `<div class="media-container">
                    <video controls preload="metadata">
                        <picture>
                            <source srcset="${work.cover_path?.replace('.jpg', '.webp')}" type="image/webp">
                            <img src="${work.cover_path || 'placeholder.jpg'}" alt="${work.title}封面">
                        </picture>
                        <source src="${work.file_path}" type="video/mp4">
                    </video>
                </div>`;
                /*  preload模式，只预加载多媒体的元数据，加载更快。webp比jpg图片体积小。 */
                
                // 4. 组装完整的作品卡片
                workCard.innerHTML = `
                    ${mediaHTML}
                    <div class="work-info">
                        <h2 class="work-title">${work.title}</h2>
                        <div class="work-meta">
                            <div class="meta-item"><strong>类别:</strong> ${work.tag}</div>
                            ${work.creator ? `<div class="meta-item"><strong>作者:</strong> ${work.creator}</div>` : ''}
                            <div class="meta-item"><strong>创作时间:</strong> ${work.create_date}</div>
                            <div class="meta-item"><span class="work-id">ID: ${work.id}</span></div>
                        </div>
                    </div>
                `;
                
                container.appendChild(workCard);
            });
        })
        .catch(error => {
            console.error('加载作品数据失败:', error);
            document.getElementById('works-container').innerHTML = 
                '<p style="color: red;">无法加载作品，请检查数据文件。</p>';
        });
});