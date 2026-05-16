const DEEPSEEK_API_KEY = 'YOUR_DEEPSEEK_API_KEY_HERE';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

async function callDeepSeekAPI(question, hrData) {
    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: `Bạn là trợ lý phân tích nhân sự. Dữ liệu: ${JSON.stringify(hrData)}` },
                    { role: 'user', content: question }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        return offlineResponse(question, hrData);
    }
}

function offlineResponse(question, hrData) {
    const q = question.toLowerCase();
    if (q.includes('tổng') || q.includes('bao nhiêu')) {
        return `Tổng tuyển: ${hrData.summary.totalHired}, Nghỉ: ${hrData.summary.totalLeft}, Chênh lệch: ${hrData.summary.netChange}`;
    }
    if (q.includes('chi nhánh')) {
        let resp = 'Thống kê chi nhánh:\n';
        for (const [branch, stats] of Object.entries(hrData.branchStatistics)) {
            resp += `- ${branch}: ${stats.total} NV (Tuyển: ${stats.joined}, Nghỉ: ${stats.left})\n`;
        }
        return resp;
    }
    return 'Tôi có thể giúp: Tổng quan nhân sự, thống kê tuyển dụng/nghỉ việc, chi tiết theo chi nhánh. Hãy thử hỏi cụ thể hơn.';
}

function initChatbot() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendChatBtn');
    const messages = document.getElementById('chatMessages');
    const loading = document.getElementById('chatLoading');
    
    function addMessage(text, isUser) {
        const div = document.createElement('div');
        div.className = `message ${isUser ? 'user' : 'bot'}`;
        div.innerHTML = `<div class="message-content">${isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>'} ${text.replace(/\n/g, '<br>')}</div>`;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }
    
    async function sendMessage() {
        const question = input.value.trim();
        if (!question) return;
        addMessage(question, true);
        input.value = '';
        loading.style.display = 'block';
        try {
            const hrData = getHRSummaryData();
            let response;
            if (DEEPSEEK_API_KEY && DEEPSEEK_API_KEY !== 'YOUR_DEEPSEEK_API_KEY_HERE') {
                response = await callDeepSeekAPI(question, hrData);
            } else {
                response = offlineResponse(question, hrData);
            }
            addMessage(response, false);
        } catch (error) {
            addMessage('Xin lỗi, đã có lỗi xảy ra.', false);
        } finally {
            loading.style.display = 'none';
        }
    }
    
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initChatbot);
else initChatbot();