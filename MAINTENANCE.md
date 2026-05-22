# 鸥波艺境 — 项目维护与扩展手册

> 本手册是"鸥波艺境"网站的权威开发参考，面向后续维护与扩展人员。
> 阅读本手册后，你将清晰了解项目架构与组织方式，理解原项目的设计风格与理念，
> 并能在后续开发中保持项目的系统性与风格一致性。

---

## 第一章 项目总览

### 1.1 项目定位

"鸥波艺境"是一个个人原创音乐作品展示网站，用于展示创作者的原创歌曲、纯音乐、MV 视频等作品，以及发布创作相关的文字动态。网站追求**宁静典雅、简洁大方**的视觉风格，让访客沉浸在音乐与文字的意境中。

- **网站标题**：鸥波艺境
- **网站副标题**：写歌的人表达自我，听歌的人寻找自我。
- **创作者署名**：鸥波萍迹

### 1.2 设计理念

"鸥波"二字取自"鸥鸟掠过水面"的意象——海鸥、波光、水面，构成一个宁静而灵动的画面。这一意象贯穿了网站的视觉设计与交互体验：

| 意象元素 | 设计体现 |
|----------|----------|
| 海水深处的宁静蓝调 | 主色调 `--color-primary: #2c5f6e`（深海青蓝） |
| 阳光下海面的粼粼波光 | 强调色 `--color-accent: #6aacb8`（柔和青绿） |
| 晨间象牙色的柔和光线 | 页面背景 `--color-bg: #f5f3ef`（暖象牙白） |
| 水面波纹的轻柔起伏 | 间距与阴影的微妙层次感 |

**核心理念**：克制的表达，留白的呼吸感，让内容本身成为焦点。

### 1.3 技术栈选型

| 层面 | 技术选择 | 选择理由 |
|------|----------|----------|
| 页面结构 | HTML5 语义化标签 | 无框架依赖、长期可维护、SEO 友好 |
| 样式系统 | CSS3 + CSS 变量 | 集中管理配色、支持主题切换、无需构建工具 |
| 交互逻辑 | 原生 JavaScript (ES6+) | 无框架依赖、代码轻量、长期兼容 |
| 数据存储 | JSON 文件 | 简单直接、无需数据库、版本管理友好 |
| 媒体格式 | MP3（音频）/ MP4（视频）/ JPG（图片） | 兼容性最佳、网络访问流畅 |

---

## 第二章 目录结构与模块划分

### 2.1 完整目录树

```
/
├── index.html                  # 首页
├── page/
│   ├── works.html              # 作品集页面
│   ├── work-detail.html        # 作品详情页面
│   ├── dynamic.html            # 动态页面
│   ├── contact.html            # 留言页面
│   └── about.html              # 关于页面
├── style/
│   ├── variables.css           # ★ CSS 变量与主题系统（核心配色与设计令牌）
│   ├── base.css                # 基础样式重置与全局默认
│   ├── layout.css              # 布局组件（Header / Footer / Container / Skip-nav）
│   ├── components.css          # ★ 通用组件样式（Card / Tag / Tabs / Pagination / Toast / Loading）
│   ├── index.css               # 首页专用样式
│   ├── works.css               # 作品集专用样式
│   ├── work-detail.css         # 作品详情专用样式
│   ├── dynamic.css             # 动态页面专用样式
│   ├── contact.css             # 留言页面专用样式
│   └── about.css               # 关于页面专用样式
├── script/
│   ├── config.js               # ★ 全局配置中心（站点信息、路径、分页、功能开关）
│   ├── utils.js                # ★ 工具函数库（DOM、加载、日期、防抖、懒加载、错误分类）
│   ├── data-loader.js          # ★ 数据加载器（JSON 加载、缓存、查询）
│   ├── components.js           # ★ UI 组件库（卡片、分页、标签页、消息提示、错误状态）
│   ├── index.js                # 首页逻辑
│   ├── works.js                # 作品集逻辑
│   ├── work-detail.js          # 作品详情逻辑
│   ├── dynamic.js              # 动态页面逻辑
│   ├── contact.js              # 留言页面逻辑
│   └── about.js                # 关于页面逻辑
├── data/
│   ├── artwork.json            # 作品数据
│   └── dynamic.json            # 动态数据
├── artwork/                    # 作品资源目录
│   ├── audio/                  # 音频文件 (MP3)
│   ├── cover/                  # 封面图片 (JPG/PNG)
│   ├── score/                  # 曲谱图片 (JPG/PNG)
│   └── video/                  # 视频文件 (MP4)
├── dynamic/                    # 动态资源目录（配图等）
└── about/                      # 关于页面资源
```

> 标注 ★ 的文件是核心公共模块，被所有页面引用，修改时需特别谨慎。

### 2.2 模块依赖关系

**CSS 加载顺序**（严格按此顺序引入，后者可覆盖前者）：

```
variables.css → base.css → layout.css → components.css → 页面专用.css
```

**JS 加载顺序**（严格按此顺序引入，存在依赖链）：

```
config.js → utils.js → data-loader.js → components.js → 页面专用.js
```

依赖链说明：
- `config.js` 无依赖，必须最先加载
- `utils.js` 依赖 `config.js`（读取配置）
- `data-loader.js` 依赖 `config.js`（数据路径）和 `utils.js`（loadJSON）
- `components.js` 依赖 `utils.js`（日期格式化、错误分类）和 `data-loader.js`（读取数据）
- 页面专用 JS 依赖以上所有模块

### 2.3 全局对象

脚本加载后会在全局作用域注册以下对象，页面 JS 直接使用：

| 全局对象 | 定义文件 | 职责 |
|----------|----------|------|
| `CONFIG` | config.js | 站点配置 |
| `Utils` | utils.js | 工具函数 |
| `DataLoader` | data-loader.js | 数据加载与查询 |
| `UIComponents` | components.js | UI 组件渲染 |

---

## 第三章 核心模块详解

### 3.1 配置中心 `config.js`

这是项目的**控制面板**，所有可变参数集中于此。修改项目参数时，**必须优先在此文件中查找和调整**，禁止在业务代码中硬编码配置值。

**配置分区**：

| 分区 | 关键字段 | 修改场景 |
|------|----------|----------|
| `site` | title, subtitle, author | 站点更名、作者变更 |
| `paths` | data, artwork, audio 等 | 调整目录结构 |
| `dataFiles` | artworks, dynamics | 更换数据源位置 |
| `pagination` | worksPerPage, dynamicsPerPage | 调整分页数量 |
| `featured` | workIds, dynamicsCount | 更新首页展示内容 |
| `features` | lazyLoad, searchEnabled, contactFormEnabled | 开关功能 |
| `media` | audioPreload, videoPreload, audioFormat | 调整媒体策略 |

### 3.2 工具函数库 `utils.js`

提供全站通用的底层工具，按功能分区组织：

| 分区 | 核心方法 | 说明 |
|------|----------|------|
| DOM 操作 | `getById`, `querySelector` | 简化 DOM 查询 |
| 数据加载 | `fetchWithTimeout`, `loadJSON` | 带超时和自动重试的网络请求 |
| 日期格式化 | `formatDate`, `formatDateYearMonth` | 统一日期显示格式 |
| URL 工具 | `getUrlParam` | 解析 URL 参数 |
| 防抖节流 | `debounce` | 搜索框 300ms 防抖 |
| 懒加载 | `createLazyLoader` | IntersectionObserver 图片懒加载 |
| 错误处理 | `classifyError`, `logError`, `ErrorType` | 错误分类与友好提示 |
| 分页计算 | `paginate` | 通用分页逻辑 |

**关键设计决策**：

1. **`loadJSON`** 是整个数据层的基石，内置三层保护：
   - 超时保护（默认 8 秒）
   - 自动重试（服务器错误最多重试 2 次，指数退避）
   - Content-Type 校验（确保返回 JSON）

2. **`classifyError`** 将技术错误翻译为用户友好的提示：
   - 网络断开 → "网络连接失败，请检查网络后重试"
   - 请求超时 → "请求超时，请检查网络连接后重试"
   - 服务器错误 → "服务器暂时无法响应，请稍后重试"
   - 功能未启用 → "该功能暂未开放"

3. **`formatDateYearMonth`** 与 **`formatDate`** 的区分：
   - 作品日期只显示年月（`formatDateYearMonth`）
   - 动态日期显示年月日+时分，时分强制两位数（`formatDate`）

### 3.3 数据加载器 `data-loader.js`

封装了作品和动态数据的加载、缓存、查询逻辑。

**缓存机制**：首次加载数据后写入 `_cache` 对象，后续调用直接返回缓存。如需强制刷新，传入 `forceRefresh = true` 或调用 `clearCache()`。

**查询方法一览**：

| 方法 | 用途 |
|------|------|
| `loadWorks()` / `loadDynamics()` | 加载全部数据 |
| `loadAll()` | 并行加载作品+动态 |
| `getWorkById(id)` | 按 ID 获取单个作品 |
| `getWorksByIds(ids)` | 按 ID 列表获取多个作品 |
| `getWorksByType(type)` | 按类型筛选（audio/video） |
| `getWorksByTag(tag)` | 按分类标签筛选 |
| `searchWorks(keyword)` | 在标题、副标题、标签、ID、日期、歌词中搜索 |
| `getDynamicsLatest(limit)` | 获取最新动态（按时间倒序） |
| `getDynamicById(id)` | 按 ID 获取单条动态 |
| `searchDynamics(keyword)` | 在标题和内容中搜索 |
| `getAllTags()` | 获取所有去重的分类标签 |

### 3.4 UI 组件库 `components.js`

每个组件方法返回 `HTMLElement`，由调用者负责插入 DOM。事件监听通过回调函数传递，保持组件的可复用性。

| 组件 | 方法 | 核心回调 |
|------|------|----------|
| 作品卡片 | `createWorkCard(work, callbacks)` | `onClick` |
| 动态卡片 | `createDynamicCard(dynamic, callbacks)` | `onRelatedWorkClick` |
| 分页 | `renderPagination(container, pageInfo, onPageChange)` | `onPageChange` |
| 标签页 | `createTabs(tabs, options)` | `onTabChange` |
| 消息提示 | `showToast(message, type)` | — |
| 错误状态 | `createErrorState(options)` | `onRetry` |
| 加载状态 | `createLoadingState(message)` | — |

**标签页组件的 WAI-ARIA 实现**：

标签页组件遵循 WAI-ARIA Tabs 规范，包含：
- `role="tablist"` / `role="tab"` / `role="tabpanel"` 语义
- `aria-selected` / `aria-controls` / `aria-labelledby` 关联
- 左右箭头键切换标签、Home/End 跳转首尾
- 切换后焦点自动移到对应面板

---

## 第四章 数据结构规范

### 4.1 作品数据 `data/artwork.json`

```json
{
  "id": "S001",
  "title": "作品标题",
  "subtitle": "",
  "type": "audio",
  "tag": "原创歌曲",
  "creator": "鸥波萍迹",
  "createDate": "2025-03",
  "description": "简短描述",
  "audio": "/artwork/audio/S001.mp3",
  "video": null,
  "cover": "/artwork/cover/S001.jpg",
  "lyrics": "歌词文本",
  "score": "/artwork/score/S001.jpg",
  "diary": {
    "title": "手记标题",
    "paragraphs": ["段落1", "段落2"]
  }
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | **是** | 唯一标识，格式建议 `S` + 三位数字 |
| `title` | string | **是** | 主标题 |
| `subtitle` | string | 否 | 副标题 |
| `type` | string | **是** | 媒体类型：`"audio"` 或 `"video"` |
| `tag` | string | **是** | 分类标签：`"原创歌曲"` / `"纯音乐"` / 自定义 |
| `creator` | string | **是** | 创作者名称 |
| `createDate` | string | **是** | 创作日期，格式 `"YYYY-MM"` |
| `description` | string | 否 | 简短描述 |
| `audio` | string\|null | 否 | 音频路径（相对根目录），纯视频作品可为 null |
| `video` | string\|null | 否 | 视频路径，纯音频作品可为 null |
| `cover` | string\|null | 否 | 封面图路径，暂无封面可为 null |
| `lyrics` | string\|null | 否 | 歌词文本，纯音乐可为 null |
| `score` | string\|null | 否 | 曲谱图片路径，纯音乐可为 null |
| `diary` | object\|null | 否 | 创作手记，结构见下方 |

**创作手记 `diary` 结构**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 手记标题 |
| `paragraphs` | string[] | 手记段落文本数组 |

> **扩展注意**：如果未来需要新增作品属性，只需在 JSON 中添加字段，然后在 `components.js`（卡片渲染）和 `work-detail.js`（详情页渲染）中读取即可。标签页系统天然支持扩展——新增标签只需在 `tabs` 数组中追加一项。

### 4.2 动态数据 `data/dynamic.json`

```json
{
  "id": "D001",
  "title": "动态标题",
  "content": "动态内容",
  "image": null,
  "relatedWorkId": "S001",
  "date": "2025-03-25",
  "time": "09:48"
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | **是** | 唯一标识，格式建议 `D` + 三位数字 |
| `title` | string | **是** | 动态标题 |
| `content` | string | **是** | 动态内容 |
| `image` | string\|null | 否 | 配图路径 |
| `relatedWorkId` | string\|null | 否 | 关联作品的 ID（如 `"S001"`） |
| `date` | string | **是** | 发布日期，格式 `"YYYY-MM-DD"` |
| `time` | string\|null | 否 | 发布时间，格式 `"HH:MM"`（24小时制，两位数） |

> **关键约束**：`relatedWorkId` 引用的是 `artwork.json` 中的作品 ID。在渲染动态卡片时，JS 会自动从作品数据中查找该 ID 对应的作品标题和类型，用于显示"关联作品"链接。如果关联的作品不存在，该链接不会显示。

---

## 第五章 设计系统

### 5.1 CSS 变量体系

所有视觉样式值**必须通过 CSS 变量引用**，禁止硬编码颜色值、字号、间距等。

**变量分类**：

| 类别 | 变量前缀 | 示例 |
|------|----------|------|
| 颜色 | `--color-*` | `--color-primary`, `--color-text` |
| 间距 | `--space-*` | `--space-md: 16px` |
| 圆角 | `--radius-*` | `--radius-lg: 12px` |
| 字体 | `--font-*` | `--font-body`, `--font-heading` |
| 字号 | `--text-*` | `--text-base: 1rem` |
| 阴影 | `--shadow-*` | `--shadow-md` |
| 过渡 | `--duration-*`, `--ease-*` | `--duration-normal: 0.25s` |
| 布局 | `--max-width-*`, `--header-height` | `--max-width-content: 960px` |

**配色层次**（浅色主题）：

```
主色调
  --color-primary         #2c5f6e    深海青蓝（标题、链接、强调）
  --color-primary-light   #4a8b9d    浅色变体（次要强调）
  --color-primary-lighter #e8f2f5    极浅变体（背景装饰）
  --color-primary-dark    #1d3f4a    深色变体（深色按钮）

强调色
  --color-accent          #6aacb8    柔和青绿
  --color-accent-light    #a3ced6    浅色变体

文字层次
  --color-text            #2c3e50    主要文字（深蓝灰）
  --color-text-secondary  #5d6d7e    次要文字（雾霭灰）
  --color-text-muted      #95a5a6    弱化文字（浅灰）

背景层次
  --color-bg              #f5f3ef    页面主背景（暖象牙白）
  --color-bg-card         #ffffff    卡片背景（纯白）
  --color-bg-subtle       #f0eeea    代码/引用背景（微灰）

功能色
  --color-success         #5b9a6f
  --color-warning         #d4a843
  --color-error           #c0564f
  --color-info            = --color-primary-light
```

### 5.2 字体系统

```
正文/标题字体族
  --font-body:     'Source Han Serif SC', 'Noto Serif SC', 'Georgia', serif
  --font-heading:  'Source Han Serif SC', 'Noto Serif SC', 'Georgia', serif

界面字体族（按钮、标签等）
  --font-ui:       -apple-system, BlinkMacSystemFont, 'Segoe UI',
                   'PingFang SC', 'Microsoft YaHei', sans-serif
```

> **设计决策**：中文网站优先使用中文字体（思源宋体），否则数字显示会有异常。副标题用正常字体，不用斜体。

### 5.3 间距系统

基于 4px 网格的间距体系，确保视觉节奏统一：

```
--space-xs:   4px     极小间距
--space-sm:   8px     小间距
--space-md:   16px    中间距（最常用）
--space-lg:   24px    大间距
--space-xl:   32px    超大间距
--space-2xl:  48px    巨大间距
--space-3xl:  64px    极大间距
```

### 5.4 主题切换

暗色主题已预留，通过在 `<html>` 标签上设置 `data-theme="dark"` 激活。暗色主题的色值定义在 `variables.css` 的注释块中，取消注释即可启用。

---

## 第六章 页面架构

### 6.1 公共结构

每个页面的 HTML 结构遵循统一模式：

```html
<html lang="zh-CN">
<head>
  <!-- 1. Meta 标签 -->
  <!-- 2. CSS 引入：variables → base → layout → components → 页面专用 -->
</head>
<body>
  <!-- 跳过导航链接（无障碍） -->
  <a href="#main-content" class="skip-nav">跳到主要内容</a>

  <!-- 页面头部（由 layout.css 控制样式） -->
  <header class="page-header">...</header>

  <!-- 主内容区 -->
  <main id="main-content">
    <section aria-labelledby="区域标题ID">...</section>
  </main>

  <!-- 页面底部 -->
  <footer class="page-footer">...</footer>

  <!-- JS 引入：config → utils → data-loader → components → 页面专用 -->
</body>
</html>
```

### 6.2 各页面职责

| 页面 | 文件 | 数据依赖 | 核心交互 |
|------|------|----------|----------|
| 首页 | index.html + index.js + index.css | 作品+动态 | 选录作品卡片点击、动态关联作品点击 |
| 作品集 | works.html + works.js + works.css | 作品 | 搜索（300ms 防抖）、分页、卡片点击 |
| 作品详情 | work-detail.html + work-detail.js + work-detail.css | 单个作品 | 音频/视频播放、标签页切换、键盘导航 |
| 动态 | dynamic.html + dynamic.js + dynamic.css | 动态+作品 | 分页、关联作品点击 |
| 留言 | contact.html + contact.js + contact.css | 无 | 表单填写与提交（功能开关控制） |
| 关于 | about.html + about.js + about.css | 无 | 纯静态展示 |

### 6.3 作品详情页架构

作品详情页是最复杂的页面，采用两栏布局：

```
┌─────────────────────────────────────────┐
│  返回链接                                │
├───────────────────────┬─────────────────┤
│  主内容区              │  侧边栏          │
│  ┌─────────────────┐  │  ┌─────────────┐│
│  │ 封面 + 播放器     │  │  │ 元信息列表   ││
│  └─────────────────┘  │  │ (dl/dt/dd)  ││
│  ┌─────────────────┐  │  └─────────────┘│
│  │ 标签页导航        │  │                 │
│  │ [歌词][曲谱][手记] │  │                 │
│  ├─────────────────┤  │                 │
│  │ 标签页内容面板     │  │                 │
│  └─────────────────┘  │                 │
└───────────────────────┴─────────────────┘
```

**标签页系统**采用数据驱动渲染：`work-detail.js` 根据作品数据动态生成标签页（如该作品没有歌词则不显示歌词标签），天然支持扩展。

---

## 第七章 错误处理体系

### 7.1 分层架构

错误处理按层级分工，每层只处理自己关心的问题：

```
┌─────────────────────────────────────┐
│  页面层 (index.js / works.js / ...)  │  ← catch 块：调用 classifyError 展示友好提示
├─────────────────────────────────────┤
│  组件层 (components.js)               │  ← createErrorState：展示错误 + 重试按钮
├─────────────────────────────────────┤
│  数据层 (data-loader.js)              │  ← 数据校验、缓存容错
├─────────────────────────────────────┤
│  工具层 (utils.js)                    │  ← loadJSON：超时、重试、错误分类
└─────────────────────────────────────┘
```

### 7.2 错误分类系统

`Utils.ErrorType` 枚举定义了 9 种错误类型，`classifyError()` 自动识别并翻译：

| 错误类型 | 枚举值 | 典型场景 | 用户提示 |
|----------|--------|----------|----------|
| 网络断开 | `NETWORK` | fetch TypeError | "网络连接失败，请检查网络后重试" |
| 请求超时 | `TIMEOUT` | AbortError | "请求超时，请检查网络连接后重试" |
| 服务器错误 | `SERVER` | HTTP 5xx | "服务器暂时无法响应，请稍后重试" |
| 客户端错误 | `CLIENT` | HTTP 4xx | "请求的内容不存在" / "没有访问权限" |
| 数据格式 | `DATA_FORMAT` | 非 JSON 响应 | "数据格式异常，请刷新页面重试" |
| 媒体加载 | `MEDIA_LOAD` | audio/video error | "媒体资源加载失败，请刷新重试" |
| 功能未启用 | `FEATURE_DISABLED` | 功能开关关闭 | "该功能暂未开放" |
| 表单验证 | `VALIDATION` | 空字段/格式错误 | 具体验证消息 |
| 未知错误 | `UNKNOWN` | 其他 | "操作失败，请稍后重试" |

### 7.3 媒体加载失败处理

作品详情页对四种媒体资源都做了失败兜底：

| 资源 | 错误处理 | 用户可见 |
|------|----------|----------|
| 音频 `<audio>` | error 事件 → 显示提示 + 重试按钮 | "音频加载失败" + "重试"按钮 |
| 视频 `<video>` | error 事件 → 显示提示 + 重试按钮 | "视频加载失败" + "重试"按钮 |
| 曲谱 `<img>` | onerror → 显示文字提示 + 重新加载链接 | "曲谱图片加载失败" + "重新加载" |
| 封面 `<img>` | onerror → 回退到音符占位符 | 音符占位图标 |

### 7.4 留言表单错误处理

留言表单区分 6 种错误场景，给出针对性提示：

| 场景 | 识别方式 | 提示 |
|------|----------|------|
| 网络断开 | TypeError + fetch | "网络连接失败，请检查网络后重试" |
| 请求超时 | AbortError | "请求超时，请稍后重试" |
| 服务器错误 | HTTP 5xx | "服务器暂时无法响应，请稍后重试" |
| 功能未启用 | CONFIG.features.contactFormEnabled = false | "留言功能暂未开放" |
| 表单验证 | 空字段/邮箱格式 | 字段级红色边框 + 具体提示 |
| 未知错误 | 其他 | "提交失败，请稍后重试" |

---

## 第八章 无障碍设计规范

### 8.1 已实现的无障碍特性

| 特性 | 实现方式 | 涉及文件 |
|------|----------|----------|
| 跳过导航 | `.skip-nav` 链接，Tab 键可见 | 所有 HTML 页面 |
| 语义化 HTML | `<header>`, `<main>`, `<nav>`, `<section>`, `<aside>`, `<footer>`, `<article>` | 所有 HTML 页面 |
| 语言声明 | `<html lang="zh-CN">` | 所有 HTML 页面 |
| ARIA 区域标签 | `aria-labelledby` 关联 `<h2>` | 所有 section |
| 动态内容播报 | `aria-live="polite"` | 数据容器、Toast 组件 |
| 键盘导航 | `tabindex="0"` + Enter/Space 事件 | 作品卡片、关联作品链接、标签页 |
| 标签页 ARIA | `role="tablist/tab/tabpanel"`, `aria-selected/controls/labelledby` | work-detail.html |
| 焦点管理 | 标签页切换后焦点移到面板 | work-detail.js |
| 焦点可见 | `:focus-visible` 轮廓样式 | base.css |
| 表单标签 | `<label>` + `for` 属性 | contact.html |
| 图片替代文本 | 所有 `<img>` 有描述性 `alt` | components.js, work-detail.js |
| 装饰元素隐藏 | SVG、分隔符 `aria-hidden="true"` | 所有 HTML 页面 |
| 搜索标记 | `role="search"` | works.html |
| 分页标记 | `role="navigation"` + `aria-label` | components.js |
| 错误播报 | `role="alert"` | 错误状态组件、Toast 组件 |

### 8.2 禁止事项

- **禁止使用 `:hover` 伪类**作为唯一的交互反馈方式（移动端无 hover）
- 禁止使用 `tabindex > 0`（干扰自然 Tab 顺序）
- 禁止在交互元素上省略 `aria-label`（如仅包含图标的按钮）
- 禁止自动播放音频/视频

---

## 第九章 开发规范与编码约定

### 9.1 CSS 编码规范

1. **所有颜色必须通过 `var(--变量名)` 引用**，禁止硬编码 hex/rgb 值
2. **所有间距、圆角、阴影使用 CSS 变量**，禁止硬编码像素值
3. **禁止使用 `:hover` 伪类**（移动端兼容性）
4. **使用 `:focus-visible`** 替代 `:focus`（仅键盘导航时显示焦点轮廓）
5. 每个页面一个专用 CSS 文件，公共样式写在 `components.css` 或 `layout.css`
6. CSS 注释使用中文，说明设计意图而非简单翻译属性名
7. 响应式断点统一使用 `@media (max-width: 768px)`

### 9.2 JavaScript 编码规范

1. **所有函数和方法必须添加 JSDoc 注释**，包含 `@param`、`@returns`、`@throws`
2. **禁止使用 `var`**，统一使用 `const` 和 `let`
3. **禁止在全局作用域声明变量**（除了四个全局对象 `CONFIG`、`Utils`、`DataLoader`、`UIComponents`）
4. **异步操作必须使用 `try-catch`**，catch 块使用 `classifyError` 生成友好提示
5. **事件监听使用回调模式**，组件不直接操作页面逻辑
6. **防抖搜索**：搜索输入统一使用 300ms 防抖（`Utils.debounce`）
7. **懒加载**：图片统一使用 `data-src` + IntersectionObserver（`Utils.observeLazyImages`），不使用原生 `loading="lazy"`，便于扩展和兼容
8. **日期格式化**：作品用 `formatDateYearMonth`，动态用 `formatDate`，禁止手动拼接日期
9. 注释使用中文，说明"为什么"而非"做什么"
10. 代码缩进使用 4 个空格

### 9.3 HTML 编码规范

1. **使用 HTML5 语义化标签**：`<header>`, `<main>`, `<nav>`, `<section>`, `<aside>`, `<footer>`
2. **每个页面必须有 `<html lang="zh-CN">`**
3. **所有交互元素必须有 `aria-label` 或关联 `<label>`**
4. **装饰性 SVG 和图标添加 `aria-hidden="true"`**
5. **CSS/JS 引入顺序严格遵循第二章规定的依赖链**
6. 页面标题格式：`页面名 - 鸥波艺境`（作品详情页由 JS 动态设置为作品标题）

### 9.4 命名约定

| 类别 | 规范 | 示例 |
|------|------|------|
| CSS 类名 | BEM 风格：`block__element--modifier` | `.work-card__title--featured` |
| JS 全局对象 | PascalCase | `DataLoader`, `UIComponents` |
| JS 方法 | camelCase | `getWorkById`, `formatDate` |
| JS 私有属性 | `_` 前缀 | `_cache`, `_fetchConfig` |
| JSON 字段 | camelCase | `createDate`, `relatedWorkId` |
| 文件名 | kebab-case | `work-detail.html`, `data-loader.js` |
| CSS 变量 | `--category-variant` | `--color-primary-light` |

---

## 第十章 常见扩展场景

### 10.1 添加新作品

1. 在 `data/artwork.json` 中追加新对象（参照第四章数据结构）
2. 将音频文件放入 `artwork/audio/`，命名格式 `S00X.mp3`
3. 将封面图放入 `artwork/cover/`，命名格式 `S00X.jpg`
4. 如需在首页展示，编辑 `config.js` → `featured.workIds` 数组

### 10.2 添加新动态

1. 在 `data/dynamic.json` 中追加新对象
2. 如有配图，放入 `dynamic/` 目录，在 `image` 字段填写路径
3. 如关联作品，在 `relatedWorkId` 填写作品 ID

### 10.3 添加新的标签页（作品详情页）

1. 在 `work-detail.js` 的 `buildTabs` 函数中，向 `tabs` 数组追加新项：
   ```javascript
   {
       id: 'new-tab-id',        // 唯一标识
       label: '标签名',          // 显示文字
       icon: '<svg>...</svg>',   // 可选图标
       content: HTMLElement,     // 内容 DOM 节点
       visible: true             // 是否显示（可根据数据判断）
   }
   ```
2. 标签页组件会自动生成导航按钮和内容面板，无需额外 CSS
3. 如需专用样式，在 `work-detail.css` 中添加

### 10.4 添加新页面

1. 在 `page/` 目录创建 HTML 文件，引入公共 CSS 和 JS（严格按第二章顺序）
2. 在 `style/` 目录创建对应 CSS 文件
3. 在 `script/` 目录创建对应 JS 文件
4. 在导航栏中添加链接（修改所有 HTML 页面的 `.page-header__nav` 部分）
5. 如需数据，通过 `DataLoader` 的查询方法获取

### 10.5 启用暗色主题

1. 编辑 `style/variables.css`，取消暗色主题注释块
2. 可在页面头部添加主题切换按钮，通过 JS 切换 `data-theme` 属性：
   ```javascript
   document.documentElement.setAttribute('data-theme', 'dark');
   ```

### 10.6 启用留言功能

1. 实现 `CONFIG.features.contactFormEndpoint` 指定的后端接口
2. 在 `config.js` 中将 `features.contactFormEnabled` 设为 `true`
3. 前端表单逻辑（`contact.js`）已完整实现，无需修改

### 10.7 更换数据源

如果需要从 JSON 文件迁移到 API 接口：

1. 修改 `data-loader.js` 中的 `loadWorks()` 和 `loadDynamics()` 方法，将 `Utils.loadJSON(CONFIG.dataFiles.artworks)` 替换为 API 调用
2. 保持返回值格式不变（数组），上层代码无需任何修改
3. 缓存机制仍然可用，API 场景下建议设置合理的缓存过期策略

---

## 第十一章 性能与安全

### 11.1 性能策略

| 策略 | 实现方式 |
|------|----------|
| 图片懒加载 | `data-src` + IntersectionObserver（`Utils.observeLazyImages`） |
| 数据缓存 | DataLoader 内存缓存，避免重复请求；分页页面缓存全量数据，切换页码不重新请求 |
| URL 状态保持 | 分页页码通过 URL 参数 `?page=N` 保持，刷新页面不丢失状态 |
| 搜索防抖 | 300ms debounce，减少无效搜索 |
| 媒体预加载 | `preload="metadata"`，仅预加载元信息 |
| 分页加载 | 作品集和动态均支持分页，按需渲染 |

### 11.2 安全注意

- 留言表单提交前进行输入验证和 XSS 防护
- 不在前端代码中存储敏感信息
- JSON 数据文件仅作为只读数据源，不接受前端写入

---

## 第十二章 开发与部署

### 12.1 开发环境

```bash
# 启动开发服务器（端口 5000，支持热更新）
coze dev

# 访问地址
http://localhost:5000
```

### 12.2 构建与部署

```bash
# 构建生产版本
coze build

# 启动生产环境
coze start
```

### 12.3 文件修改后的生效方式

本项目配置了热更新（HMR），修改代码后会自动触发页面更新，无需手动重启服务或刷新浏览器。

---

## 附录 A 代码规模参考

| 文件 | 行数 | 说明 |
|------|------|------|
| utils.js | ~820 | 最大文件，含完整错误处理体系 |
| components.js | ~600 | UI 组件库 |
| components.css | ~730 | 通用组件样式 |
| variables.css | ~260 | 主题系统 |
| layout.css | ~310 | 布局组件 |
| work-detail.js | ~350 | 最复杂的页面逻辑 |
| work-detail.css | ~320 | 最复杂的页面样式 |
| base.css | ~260 | 基础样式 |
| index.css | ~275 | 首页样式 |
| data-loader.js | ~280 | 数据层 |
| config.js | ~175 | 配置中心 |
| contact.js | ~260 | 含完整表单验证 |
| **CSS 总计** | **~2,670** | |
| **JS 总计** | **~2,900** | |

---

## 附录 B 故障排查速查表

| 症状 | 排查方向 |
|------|----------|
| 页面空白，无内容 | 打开浏览器控制台，查看 JSON 加载是否成功；检查 CSS/JS 引入顺序 |
| 作品/动态不显示 | 检查 JSON 数据格式是否正确（必须是数组）；检查字段名是否匹配 |
| 动态页面关联作品不显示 | 检查 `relatedWorkId` 是否与 `artwork.json` 中的 `id` 匹配 |
| 搜索不工作 | 检查 `config.js` 中 `features.searchEnabled` 是否为 `true` |
| 留言提交失败 | 检查 `config.js` 中 `features.contactFormEnabled` 是否为 `true`；检查后端接口 |
| 音频/视频不播放 | 检查文件路径是否正确；检查文件是否存在；查看控制台媒体错误日志 |
| 标签页不切换 | 检查标签页数据是否正确传入；检查控制台 JS 错误 |
| 分页不工作 | 检查数据量是否超过 `pagination.xxxPerPage` 阈值 |
| 日期显示异常 | 作品用 `formatDateYearMonth`，动态用 `formatDate`；检查日期字段格式 |
| 手机端布局异常 | 检查是否误用了 `:hover` 伪类；检查响应式断点 |
