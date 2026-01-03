// 路径配置 - 网站所有资源的路径规则都在这里定义
const PATHS = {
  // 基础目录结构
  artwork: {
    audio: 'artwork/audio/',
    score: 'artwork/score/',
    video: 'artwork/video/',
    cover: 'artwork/cover/'
  },
  // 文件扩展名
  extensions: {
    audio: '.mp3',
    score: '.jpg',
    video: '.mp4',
    cover: '.jpg'
  }
};

// 开发和生产环境使用不同基路径（根目录路径）
const BASE_URL = window.location.hostname === 'localhost' 
  ? '/'  // 本地开发
  : 'https://drcheese2025.github.io/my-music-portfolio/';  // 生产环境CDN

/**
 * 获取作品文件的完整路径
 * @param {string} artworkId - 作品ID，如 "S001"
 * @param {string} type - 文件类型："audio" | "score" | "video" | "cover"
 * @returns {string} 完整文件路径
 */
export function getArtworkPath(artworkId, type) {
  return `${BASE_URL}${PATHS.artwork[type]}${artworkId}${PATHS.extensions[type]}`;  // 生成绝对路径
}

/**
 * 获取作品的所有相关文件路径
 * @param {string} artworkId - 作品ID
 * @returns {Object} 包含所有文件路径的对象
 */
export function getAllArtworkPaths(artworkId) {
  return {
    audio: getArtworkPath(artworkId, 'audio'),
    score: getArtworkPath(artworkId, 'score'),
    video: getArtworkPath(artworkId, 'video'),
    cover: getArtworkPath(artworkId, 'cover')
  };
}

// 如果未来需要其它路径，也可以在这里添加
export function getDynamicImagePath(filename) {
  return `dynamic/${filename}.webp`;
}