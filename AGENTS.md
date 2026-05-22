# 鸥波艺境 - 项目文档

## 项目概览

"鸥波艺境"是一个个人原创音乐作品展示网站，风格简洁大方、宁静典雅。
网站标题为"鸥波艺境"，副标题为"写歌的人表达自我，听歌的人寻找自我。"

## 技术栈

- **HTML5 + CSS3 + 原生 JavaScript**（无框架依赖）
- **CSS 变量系统**：集中管理配色与主题
- **JSON 数据文件**：作品与动态数据存储
- **响应式布局**：移动端与桌面端兼容

## 目录结构

```
/
├── index.html              # 首页（Hero + 选录作品 + 最近动态）
├── page/
│   ├── works.html          # 作品集页面（搜索 + 网格 + 分页）
│   ├── work-detail.html    # 作品详情页（播放器 + 标签页 + 元信息）
│   ├── dynamic.html        # 动态页面（时间线 + 分页）
│   ├── contact.html        # 留言页面（表单）
│   └── about.html          # 关于页面（创作者介绍）
├── style/
│   ├── variables.css       # CSS 变量与主题系统（核心配置）
│   ├── base.css            # 基础样式重置
│   ├── layout.css          # 布局组件（Header / Footer / Container）
│   ├── components.css      # 通用组件（Card / Tag / Tabs / Pagination / Form）
│   ├── index.css           # 首页专用样式
│   ├── works.css           # 作品集专用样式
│   ├── work-detail.css     # 作品详情专用样式
│   ├── dynamic.css         # 动态页面专用样式
│   ├── contact.css         # 留言页面专用样式
│   └── about.css           # 关于页面专用样式
├── script/
│   ├── config.js           # 全局配置（站点信息、路径、分页等）
│   ├── utils.js            # 工具函数（DOM、日期、分页、防抖、懒加载等）
│   ├── data-loader.js      # 数据加载器（JSON 加载、缓存、查询）
│   ├── components.js       # UI 组件（卡片、分页、标签页、消息提示）
│   ├── index.js            # 首页逻辑
│   ├── works.js            # 作品集逻辑
│   ├── work-detail.js      # 作品详情逻辑
│   ├── dynamic.js          # 动态页面逻辑
│   ├── contact.js          # 留言页面逻辑
│   └── about.js            # 关于页面逻辑
├── data/
│   ├── artwork.json        # 作品数据
│   └── dynamic.json        # 动态数据
├── artwork/                # 作品资源目录
│   ├── audio/              # 音频文件 (MP3)
│   ├── cover/              # 封面图片
│   ├── score/              # 曲谱图片
│   └── video/              # 视频文件 (MP4)
├── dynamic/                # 动态资源目录
└── about/                  # 关于页面资源
```

## 核心架构设计

### 1. 配置集中化 (`script/config.js`)
所有可变参数集中管理，包括：
- **基础路径配置**（`basePath`：部署到子目录时只需修改此值）
- 站点基本信息（标题、副标题、作者）
- **标签注册表**（`tags.registry`：标签名 → colorKey 映射）
- 文件路径配置（数据目录、资源目录，自动基于 basePath 解析）
- 分页参数（每页显示数量）
- 首页展示配置（选录作品ID、动态条数）
- 功能开关（懒加载、搜索、联系表单）
- 媒体配置（预加载策略、格式）

### 2. 路径工具 (`PathUtils`，定义于 `script/config.js`)
提供基于 `CONFIG.basePath` 的路径解析方法，确保跨平台部署兼容：
- **HTML 静态引用**：使用相对路径（`./` `../`），天然适配任何部署位置
- **JS 运行时路径**：通过 `PathUtils.resolve()` 解析，自动拼合 basePath
- **页面导航**：统一使用 `PathUtils.navigate()`，禁止直接 `window.location.href`
- **JSON 资源路径**：使用时通过 `PathUtils.resolve()` 解析

| 方法 | 用途 |
|------|------|
| `resolve(path)` | 站点根相对路径 → 含 basePath 的完整路径 |
| `navigate(path)` | 跳转到指定页面（自动拼合 basePath） |
| `getCurrentPath()` | 获取当前页面的站点根相对路径 |

### 3. CSS 变量主题系统 (`style/variables.css`)
- 使用 CSS 自定义属性实现集中配色管理
- 支持 `data-theme="dark"` 切换暗色主题（当前为预留）
- 配色灵感来源于"鸥波"意境（海鸥掠过水面的淡蓝与波光）
- **标签颜色变量**：`--tag-{colorKey}-bg` / `--tag-{colorKey}-text`，与 config.js 标签注册表联动

### 4. 数据层 (`script/data-loader.js`)
- 自动缓存已加载的 JSON 数据，避免重复请求
- 提供按 ID、按关键词搜索的方法
- 支持强制刷新缓存

### 5. UI 组件化 (`script/components.js`)
- 作品卡片、动态卡片、分页、标签页、消息提示
- 组件与数据解耦，通过参数传入
- 事件监听通过回调传递，保持可复用性

### 6. 标签系统（三层架构）
标签系统采用 **配置层 → 样式层 → 渲染层** 三层分离架构：

| 层级 | 文件 | 职责 |
|------|------|------|
| 配置层 | `script/config.js` → `tags.registry` | 标签名 → colorKey 映射 |
| 样式层 | `style/variables.css` → `--tag-{key}-bg/text` | 每种标签的背景色与文字色 |
| 样式层 | `style/components.css` → `.tag--{key}` | 标签变体 CSS 类（引用变量） |
| 渲染层 | `script/components.js` → `_getTagInfo()` | 根据标签名查找注册表，返回 CSS 类名 |

**工作流程**：
1. 作品数据中的 `tag` 字段（如 `"原创歌曲"`）传入 `UIComponents._getTagInfo(tag)`
2. `_getTagInfo` 在 `CONFIG.tags.registry` 中查找，返回 `{ cssClass: 'tag--song', label: '原创歌曲', colorKey: 'song' }`
3. 渲染时生成 `<span class="tag tag--song">原创歌曲</span>`
4. CSS 中 `.tag--song` 引用 `var(--tag-song-bg)` 和 `var(--tag-song-text)` 获取颜色

**已注册标签**：
- `原创歌曲` → colorKey: `song`（柔和红）
- `纯音乐` → colorKey: `instrumental`（柔和蓝）
- `音乐MV` → colorKey: `video`（柔和绿）
- `生活随笔` → colorKey: `essay`（柔和黄，预留）
- `创作记录` → colorKey: `creation`（柔和紫，预留）
- 未注册标签 → colorKey: `default`（浅灰）

## 数据结构

### 作品数据 (`data/artwork.json`)
```json
{
  "id": "S001",              // 唯一标识
  "title": "作品标题",        // 主标题
  "subtitle": "",            // 副标题（可选）
  "type": "audio|video",     // 媒体类型
  "tag": "原创歌曲",          // 分类标签
  "creator": "鸥波萍迹",      // 创作者
  "createDate": "2025-03", // 创作日期
  "description": "简短描述",  // 描述（可选）
  "audio": "/artwork/audio/S001.mp3",  // 音频路径（站点根相对，运行时通过 PathUtils.resolve() 解析）
  "video": null,             // 视频路径（站点根相对，可选）
  "cover": "/artwork/cover/S001.jpg",  // 封面图（站点根相对，可选）
  "lyrics": "歌词文本",       // 歌词（可选）
  "score": "/artwork/score/S001.jpg",  // 曲谱图片（站点根相对，可选）
  "diary": {                 // 创作手记（可选）
    "title": "手记标题",
    "paragraphs": ["段落1", "段落2"]
  }
}
```

### 动态数据 (`data/dynamic.json`)
```json
{
  "id": "D001",              // 唯一标识
  "title": "动态标题",
  "content": "动态内容",
  "image": null,             // 配图路径（可选）
  "relatedWorkId": "S001",   // 关联作品ID（可选）
  "date": "2025-03-25",      // 发布日期
  "time": "09:48"            // 发布时间（可选）
}
```

## 修改指南

### 添加新作品
1. 在 `data/artwork.json` 中添加新对象
2. 将对应资源文件放入 `artwork/` 子目录
3. 在 `script/config.js` 的 `featured.workIds` 中更新首页选录

### 添加新动态
1. 在 `data/dynamic.json` 中添加新对象
2. 将配图放入 `dynamic/` 目录

### 修改配色
1. 编辑 `style/variables.css` 中的 CSS 变量
2. 暗色主题在 `[data-theme="dark"]` 选择器中覆盖

### 添加新标签类型
1. 在 `script/config.js` 的 `tags.registry` 中新增条目：`'标签名': { colorKey: 'key' }`
2. 在 `style/variables.css` 中添加 `--tag-key-bg` 和 `--tag-key-text` CSS 变量
3. 在 `style/components.css` 中添加 `.tag--key` 样式类
4. 在 `data/artwork.json` 中使用该标签名作为 `tag` 字段值

### 修改站点信息
1. 编辑 `script/config.js` 中的 `site` 配置项
2. 同步更新各 HTML 页面的 `<title>` 和 `<meta>` 标签

### 添加新页面
1. 在 `page/` 目录创建 HTML 文件
2. 在 `style/` 目录创建对应 CSS 文件
3. 在 `script/` 目录创建对应 JS 文件
4. 引入公共模块：variables.css → base.css → layout.css → components.css → 页面CSS
5. 引入公共脚本：config.js → utils.js → data-loader.js → components.js → 页面JS
6. HTML 中使用相对路径引用 CSS/JS（`../style/`、`../script/`）

### 部署到 GitHub Pages
1. 修改 `script/config.js` 中的 `basePath` 为 `'/仓库名/'`
2. 确保路径以 `/` 开头和结尾
3. 推送代码到 GitHub，在仓库 Settings → Pages 中选择分支和目录
4. HTML 中的相对路径无需修改

## 开发与部署

- 开发环境：`coze dev`（端口 5000，支持热更新）
- 构建部署：`coze build && coze start`
- 包管理器：本项目无 npm 依赖，纯原生开发

### 跨平台部署（basePath 配置）

- 根目录部署：`CONFIG.basePath = '/'`（默认值）
- GitHub Pages：`CONFIG.basePath = '/仓库名/'`
- 自定义子目录：`CONFIG.basePath = '/子目录/'`
- **只需修改 `config.js` 中的一处 `basePath`**，所有 JS 运行时路径自动更新
- HTML 中使用相对路径（`./` `../`），无需随 basePath 变化

## 注意事项

- **禁止使用 Hover 伪类**：移动端兼容性考虑
- **CSS 变量引用**：所有颜色值通过 `var(--变量名)` 引用
- **HTML 路径规范**：所有 CSS/JS/页面链接使用相对路径（`./` `../`），禁止绝对路径（`/`）
- **JS 路径规范**：页面导航使用 `PathUtils.navigate()`，资源路径使用 `PathUtils.resolve()`
- **懒加载**：作品封面、曲谱图片统一使用 `data-src` + IntersectionObserver（`Utils.observeLazyImages`）
- **搜索防抖**：搜索输入使用 300ms 防抖优化
- **无障碍**：卡片支持 `tabindex` + 键盘回车导航
- **日期格式**：作品日期只显示年月（`formatDateYearMonth`），动态日期显示年月日+时分（`formatDate`，时分强制两位数）
