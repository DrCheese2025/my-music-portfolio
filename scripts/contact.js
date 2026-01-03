// 简单的脏话过滤列表（你可以根据需要扩展）
const blockedWords = [
    '脏话1', '脏话2', '垃圾词1', '广告词'
    // 这里添加需要过滤的词汇
];

// 简单的垃圾信息检测
function containsSpam(text) {
    const spamPatterns = [
        /http[s]?:\/\/[^\s]+/g, // URL检测
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/g, // 邮箱检测
        /[\d\-()\s+]{10,}/g // 可能包含电话号
    ];
    
    return spamPatterns.some(pattern => pattern.test(text));
}

// 内容安全过滤
function sanitizeContent(content) {
    // HTML转义，防止XSS攻击
    const div = document.createElement('div');
    div.textContent = content;
    return div.innerHTML;
}

// 脏话过滤
function filterBadWords(text) {
    let filteredText = text;
    blockedWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        filteredText = filteredText.replace(regex, '***');
    });
    return filteredText;
}

// 表单提交处理
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    const messageTextarea = document.getElementById('contact-message');
    const charCount = document.getElementById('char-count');
    const submitButton = document.getElementById('submit-button');
    
    // 字符计数
    if (messageTextarea && charCount) {
        messageTextarea.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            
            if (count > 900) {
                charCount.classList.add('warning');
            } else {
                charCount.classList.remove('warning');
            }
        });
    }
    
    // 表单提交
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const messageData = {
                name: sanitizeContent(formData.get('name').trim()),
                email: sanitizeContent(formData.get('email')?.trim() || ''),
                message: sanitizeContent(formData.get('message').trim()),
                timestamp: new Date().toISOString(),
                ip: await getClientIP() // 获取IP用于简单的重复提交检测
            };
            
            // 验证表单
            if (!validateForm(messageData)) {
                return;
            }
            
            // 过滤内容
            messageData.message = filterBadWords(messageData.message);
            
            // 提交留言
            await submitMessage(messageData);
        });
    }
    
    async function getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }
    
    function validateForm(data) {
        // 基础验证
        if (!data.name || data.name.length < 2) {
            alert('请输入有效的称呼（至少2个字符）');
            return false;
        }
        
        if (!data.message || data.message.length < 10) {
            alert('留言内容太短了，请至少输入10个字符');
            return false;
        }
        
        if (data.message.length > 1000) {
            alert('留言内容过长，请控制在1000字符以内');
            return false;
        }
        
        // 垃圾信息检测
        if (containsSpam(data.message) || containsSpam(data.name)) {
            alert('检测到可能包含垃圾信息的内容，请修改后重新提交');
            return false;
        }
        
        // 重复内容检测（简单版）
        const lastSubmission = localStorage.getItem('lastContactSubmission');
        if (lastSubmission) {
            const lastData = JSON.parse(lastSubmission);
            const timeDiff = Date.now() - lastData.timestamp;
            
            if (timeDiff < 60000 && lastData.message === data.message) { // 1分钟内重复提交
                alert('请勿重复提交相同的留言');
                return false;
            }
        }
        
        return true;
    }
    
    async function submitMessage(messageData) {
        const buttonText = submitButton.querySelector('.button-text');
        const loadingSpinner = submitButton.querySelector('.loading-spinner');
        
        // 显示加载状态
        buttonText.style.display = 'none';
        loadingSpinner.textContent = "发送中...";
        loadingSpinner.style.display = 'inline';
        submitButton.disabled = true;
        
        try {
            // 存储到本地（模拟提交）
            const submissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
            submissions.push(messageData);
            localStorage.setItem('contactSubmissions', JSON.stringify(submissions));
            
            // 记录最后提交时间
            localStorage.setItem('lastContactSubmission', JSON.stringify({
                message: messageData.message,
                timestamp: Date.now()
            }));
            
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            alert('留言发送成功！感谢你的分享。虽然我可能不会回复，但我会认真阅读每一条留言。');
            contactForm.reset();
            charCount.textContent = '0';
            charCount.classList.remove('warning');
            
        } catch (error) {
            console.error('提交失败:', error);
            alert('发送失败，请稍后重试。如果问题持续存在，你可以通过其它方式联系我。');
        } finally {
            // 恢复按钮状态
            buttonText.style.display = 'inline';
            loadingSpinner.style.display = 'none';
            submitButton.disabled = false;
        }
    }
});