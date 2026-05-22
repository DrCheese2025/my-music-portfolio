/**
 * ============================================================================
 * 鸥波艺境 - 联系页面逻辑 (contact.js)
 * ============================================================================
 *
 * 联系页面的核心逻辑，负责：
 *   1. 表单验证
 *   2. 表单提交（预留后端接口）
 *   3. 提交成功反馈
 *
 * 【后端说明】
 *   当前版本仅实现前端逻辑，表单提交到 CONFIG.features.contactFormEndpoint
 *   指定的接口。后端接口需另行开发。
 *
 * @version 1.0.0
 * ============================================================================
 */

/**
 * 页面初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    initContactForm();
});


/**
 * 初始化联系表单
 * 绑定表单提交事件和验证逻辑
 */
function initContactForm() {
    const form = Utils.getById('contact-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        /* 阻止默认提交行为 */
        e.preventDefault();

        /* 获取表单数据 */
        const formData = getFormData(form);

        /* 表单验证 */
        const validation = validateForm(formData);
        if (!validation.valid) {
            UIComponents.showToast(validation.message, 'error');
            return;
        }

        /* 提交表单 */
        await submitForm(formData, form);
    });
}


/**
 * 获取表单数据
 *
 * @param {HTMLFormElement} form - 表单元素
 * @returns {Object} 表单数据对象
 */
function getFormData(form) {
    return {
        name:    form.querySelector('[name="name"]')?.value?.trim()    || '',
        email:   form.querySelector('[name="email"]')?.value?.trim()   || '',
        subject: form.querySelector('[name="subject"]')?.value?.trim() || '',
        message: form.querySelector('[name="message"]')?.value?.trim() || '',
    };
}


/**
 * 表单验证
 *
 * @param {Object} data - 表单数据
 * @returns {Object} { valid: boolean, message: string }
 */
function validateForm(data) {
    /* 昵称必填 */
    if (!data.name) {
        return { valid: false, message: '请输入您的称呼' };
    }

    /* 邮箱格式验证（如果填写了邮箱） */
    if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            return { valid: false, message: '邮箱格式不正确' };
        }
    }

    /* 留言内容必填 */
    if (!data.message) {
        return { valid: false, message: '请输入留言内容' };
    }

    /* 留言内容长度限制 */
    if (data.message.length < 5) {
        return { valid: false, message: '留言内容至少5个字' };
    }

    return { valid: true, message: '' };
}


/**
 * 提交表单数据
 * 区分不同的错误场景，向用户提供精确的反馈：
 *   - 功能未启用：明确告知用户当前不可用
 *   - 网络错误：提示检查网络连接
 *   - 服务器错误：提示稍后重试
 *   - 超时：提示网络不稳定
 *
 * @param {Object} data - 表单数据
 * @param {HTMLFormElement} form - 表单元素
 */
async function submitForm(data, form) {
    const submitBtn = form.querySelector('[type="submit"]');

    try {
        /* 禁用提交按钮，防止重复提交 */
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '发送中...';
        }

        /* 检查留言功能是否启用 */
        if (!CONFIG.features.contactFormEnabled) {
            UIComponents.showToast('留言功能暂未启用，敬请期待', 'warning');
            resetSubmitButton(submitBtn);
            return;
        }

        /* 检查是否配置了后端接口 */
        if (CONFIG.features.contactFormEndpoint) {
            /* 向后端接口发送数据，带超时保护 */
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            let response;
            try {
                response = await fetch(CONFIG.features.contactFormEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    signal: controller.signal,
                });
            } finally {
                clearTimeout(timeoutId);
            }

            /* 处理不同的 HTTP 状态码 */
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('RATE_LIMIT');
                } else if (response.status >= 500) {
                    throw new Error('SERVER_ERROR');
                } else if (response.status >= 400) {
                    throw new Error('CLIENT_ERROR');
                } else {
                    throw new Error(`HTTP_${response.status}`);
                }
            }
        } else {
            /* 后端接口未配置时，模拟提交延迟 */
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('[联系页面] 表单数据（后端未配置）:', data);
        }

        /* 显示成功状态 */
        showSubmitSuccess();

    } catch (error) {
        /* 根据错误类型给出精确提示 */
        handleFormSubmitError(error);
        resetSubmitButton(submitBtn);
    }
}


/**
 * 处理表单提交错误
 * 根据错误类型给出精确的用户提示
 *
 * @param {Error} error - 错误对象
 */
function handleFormSubmitError(error) {
    const errorMsg = error.message || '';

    /* 超时 / 网络中断 */
    if (error.name === 'AbortError' || errorMsg.includes('abort') || errorMsg.includes('timeout')) {
        Utils.logError('联系页面', '表单提交', error);
        UIComponents.showToast('请求超时，请检查网络连接后重试', 'error');
        return;
    }

    /* 网络连接失败（无法到达服务器） */
    if (error.name === 'TypeError' && errorMsg.includes('fetch')) {
        Utils.logError('联系页面', '表单提交', error);
        UIComponents.showToast('网络连接失败，请检查网络后重试', 'error');
        return;
    }

    /* 请求频率限制 */
    if (errorMsg === 'RATE_LIMIT') {
        UIComponents.showToast('提交过于频繁，请稍后再试', 'warning');
        return;
    }

    /* 服务器错误 */
    if (errorMsg === 'SERVER_ERROR') {
        Utils.logError('联系页面', '表单提交', error);
        UIComponents.showToast('服务器暂时无法处理，请稍后重试', 'error');
        return;
    }

    /* 客户端请求错误 */
    if (errorMsg === 'CLIENT_ERROR') {
        Utils.logError('联系页面', '表单提交', error);
        UIComponents.showToast('提交信息有误，请检查后重试', 'error');
        return;
    }

    /* 其他未知错误 */
    const classified = Utils.classifyError(error);
    Utils.logError('联系页面', '表单提交', error);
    UIComponents.showToast(classified.message, 'error');
}


/**
 * 恢复提交按钮状态
 *
 * @param {HTMLButtonElement} submitBtn - 提交按钮元素
 */
function resetSubmitButton(submitBtn) {
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '发送留言';
    }
}


/**
 * 显示提交成功状态
 * 替换表单内容为成功提示
 */
function showSubmitSuccess() {
    const container = Utils.getById('contact-form-container');
    if (!container) return;

    container.innerHTML = `
        <div class="contact-success">
            <div class="contact-success__icon">✓</div>
            <h3 class="contact-success__title">留言已发送</h3>
            <p class="contact-success__text">
                感谢你的留言！
            </p>
            <button class="btn btn--outline" onclick="location.reload()">
                继续留言
            </button>
        </div>
    `;
}
