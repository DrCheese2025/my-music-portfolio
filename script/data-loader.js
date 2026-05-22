/**
 * ============================================================================
 * 鸥波艺境 - 数据加载器 (data-loader.js)
 * ============================================================================
 *
 * 本文件封装了作品和动态数据的加载、缓存、查询逻辑，
 * 为各个页面提供统一的数据访问接口。
 *
 * 【核心功能】
 *   1. 加载并缓存 JSON 数据，避免重复请求
 *   2. 提供按 ID、按类型、按关键词查询的方法
 *   3. 支持作品和动态的排序
 *
 * 【使用方式】
 *   本文件需要在 config.js 和 utils.js 之后引入。
 *   通过全局 DataLoader 对象访问。
 *
 * @version 1.0.0
 * ============================================================================
 */

const DataLoader = {


    /* ========================================================================
     * 内部缓存
     * ========================================================================
     * 使用对象缓存已加载的数据，避免同一数据被多次请求。
     * _cache.works   : 作品数据数组
     * _cache.dynamics : 动态数据数组
     * ====================================================================== */

    _cache: {
        works: null,
        dynamics: null,
    },


    /* ========================================================================
     * 一、数据加载方法
     * ========================================================================
     * 提供数据加载入口，支持单类加载和并行加载。
     * 已缓存的数据直接返回，不会重复请求网络。
     * ====================================================================== */

    /**
     * 加载作品数据
     * 如果数据已缓存，直接返回缓存数据。
     * 首次加载时使用 loadJSON 提供超时保护和自动重试。
     *
     * @param {boolean} [forceRefresh=false] - 是否强制刷新（忽略缓存）
     * @returns {Promise<Array>} 作品数据数组
     * @throws {Error} 网络错误、超时、或数据格式错误
     */
    async loadWorks(forceRefresh = false) {
        /* 如果有缓存且不强制刷新，直接返回 */
        if (this._cache.works && !forceRefresh) {
            return this._cache.works;
        }

        /* 使用 loadJSON 加载数据，内置超时保护和自动重试 */
        const data = await Utils.loadJSON(CONFIG.dataFiles.artworks);

        /* 校验数据格式 */
        if (!Array.isArray(data)) {
            throw new Error('作品数据格式错误：预期为数组');
        }

        /* 写入缓存 */
        this._cache.works = data;
        return data;
    },

    /**
     * 加载动态数据
     * 首次加载时使用 loadJSON 提供超时保护和自动重试。
     *
     * @param {boolean} [forceRefresh=false] - 是否强制刷新
     * @returns {Promise<Array>} 动态数据数组
     * @throws {Error} 网络错误、超时、或数据格式错误
     */
    async loadDynamics(forceRefresh = false) {
        if (this._cache.dynamics && !forceRefresh) {
            return this._cache.dynamics;
        }

        /* 使用 loadJSON 加载数据，内置超时保护和自动重试 */
        const data = await Utils.loadJSON(CONFIG.dataFiles.dynamics);

        if (!Array.isArray(data)) {
            throw new Error('动态数据格式错误：预期为数组');
        }

        this._cache.dynamics = data;
        return data;
    },

    /**
     * 并行加载作品和动态数据
     *
     * @param {boolean} [forceRefresh=false] - 是否强制刷新
     * @returns {Promise<Object>} { works: Array, dynamics: Array }
     */
    async loadAll(forceRefresh = false) {
        const [works, dynamics] = await Promise.all([
            this.loadWorks(forceRefresh),
            this.loadDynamics(forceRefresh),
        ]);

        return { works, dynamics };
    },

    /**
     * 清除所有缓存
     * 在数据文件更新后调用，确保下次加载获取最新数据。
     */
    clearCache() {
        this._cache.works = null;
        this._cache.dynamics = null;
    },


    /* ========================================================================
     * 二、作品查询方法
     * ========================================================================
     * 提供多种维度的作品查询能力。
     * ====================================================================== */

    /**
     * 根据作品 ID 获取单个作品
     *
     * @param {string} id - 作品 ID（如 "S001"）
     * @returns {Promise<Object|null>} 作品对象，未找到返回 null
     */
    async getWorkById(id) {
        const works = await this.loadWorks();
        return works.find(work => work.id === id) || null;
    },

    /**
     * 根据作品 ID 列表获取多个作品
     * 返回的结果顺序与传入的 ID 列表顺序一致。
     *
     * @param {string[]} ids - 作品 ID 数组
     * @returns {Promise<Array>} 作品数组
     */
    async getWorksByIds(ids) {
        const works = await this.loadWorks();
        return ids
            .map(id => works.find(work => work.id === id))
            .filter(Boolean);  /* 过滤掉未找到的作品 */
    },

    /**
     * 按类型筛选作品
     *
     * @param {string} type - 作品类型："audio" | "video"
     * @returns {Promise<Array>} 符合类型的作品数组
     */
    async getWorksByType(type) {
        const works = await this.loadWorks();
        return works.filter(work => work.type === type);
    },

    /**
     * 按分类标签筛选作品
     *
     * @param {string} tag - 分类标签（如"原创歌曲"、"纯音乐"）
     * @returns {Promise<Array>}
     */
    async getWorksByTag(tag) {
        const works = await this.loadWorks();
        return works.filter(work => work.tag === tag);
    },

    /**
     * 关键词搜索作品
     * 在标题、副标题、标签、作品ID、创作日期、歌词中搜索匹配的作品。
     *
     * @param {string} keyword - 搜索关键词
     * @returns {Promise<Array>} 匹配的作品数组
     */
    async searchWorks(keyword) {
        if (!keyword || !keyword.trim()) {
            return this.loadWorks();
        }

        const works = await this.loadWorks();
        const lowerKeyword = keyword.toLowerCase().trim();

        return works.filter(work => {
            /* 在多个字段中搜索关键词 */
            const searchFields = [
                work.title,
                work.subtitle,
                // work.description,    /* 作品描述信息暂不作为筛选信息源 */
                work.tag,
                work.id,
                work.createDate,
                work.lyrics
            ].filter(Boolean);  /* 过滤掉空值 */

            return searchFields.some(field =>
                field.toLowerCase().includes(lowerKeyword)
            );
        });
    },

    /**
     * 获取所有作品的分类标签列表（去重）
     *
     * @returns {Promise<string[]>} 标签数组
     */
    async getAllTags() {
        const works = await this.loadWorks();
        const tags = [...new Set(works.map(work => work.tag).filter(Boolean))];
        return tags;
    },


    /* ========================================================================
     * 三、动态查询方法
     * ========================================================================
     * 提供动态数据的查询和排序能力。
     * ====================================================================== */

    /**
     * 获取按时间倒序排列的动态列表
     *
     * @param {number} [limit] - 限制返回条数，不传则返回全部
     * @returns {Promise<Array>} 排序后的动态数组
     */
    async getDynamicsLatest(limit) {
        let dynamics = await this.loadDynamics();

        /* 按日期+时间倒序排序（最新的在前） */
        dynamics = dynamics.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time || '00:00'}`);
            const dateB = new Date(`${b.date} ${b.time || '00:00'}`);
            return dateB - dateA;
        });

        /* 如果指定了限制条数，截取前 N 条 */
        if (limit && limit > 0) {
            dynamics = dynamics.slice(0, limit);
        }

        return dynamics;
    },

    /**
     * 根据动态 ID 获取单条动态
     *
     * @param {string} id - 动态 ID
     * @returns {Promise<Object|null>}
     */
    async getDynamicById(id) {
        const dynamics = await this.loadDynamics();
        return dynamics.find(d => d.id === id) || null;
    },

    /**
     * 搜索动态
     * 在标题和内容中搜索
     *
     * @param {string} keyword - 搜索关键词
     * @returns {Promise<Array>}
     */
    async searchDynamics(keyword) {
        if (!keyword || !keyword.trim()) {
            return this.getDynamicsLatest();
        }

        const dynamics = await this.getDynamicsLatest();
        const lowerKeyword = keyword.toLowerCase().trim();

        return dynamics.filter(d => {
            const fields = [d.title, d.content].filter(Boolean);
            return fields.some(f => f.toLowerCase().includes(lowerKeyword));
        });
    },


    /* =================================================================
     * 数据关联与富化
     * ================================================================= */

    /**
     * 为动态数据富化关联作品信息
     * 将动态的 relatedWorkId 解析为具体的作品标题和类型，
     * 以便 UI 组件可以直接使用，无需自行查找。
     *
     * 此函数是对原地数据的修改（mutate），会直接在动态对象上
     * 添加 relatedWorkTitle 和 relatedWorkType 属性。
     *
     * @param {Array} dynamics - 动态数据数组
     * @param {Array} works - 作品数据数组
     *
     * @example
     * const [works, dynamics] = await DataLoader.loadAll();
     * DataLoader.enrichDynamicsWithRelatedWork(dynamics, works);
     * // 现在 dynamics[i].relatedWorkTitle 可用
     */
    enrichDynamicsWithRelatedWork(dynamics, works) {
        if (!dynamics || !works) return;

        dynamics.forEach(d => {
            if (d.relatedWorkId) {
                const work = works.find(w => w.id === d.relatedWorkId);
                if (work) {
                    d.relatedWorkTitle = work.title;
                    d.relatedWorkType = work.type;
                }
            }
        });
    },
};
