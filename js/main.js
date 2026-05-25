// main.js - Khởi tạo chính

let currentPeriod = 'month';
let currentSelectedMonth = '';

function updateMonthDropdown() {
    const monthSelect = document.getElementById('monthSelect');
    if (!monthSelect) return;
    
    const recentMonths = getRecentMonths(12);
    
    monthSelect.innerHTML = '<option value="">-- Chọn tháng --</option>';
    recentMonths.forEach(month => {
        const [year, monthNum] = month.split('-');
        const option = document.createElement('option');
        option.value = month;
        option.textContent = `Tháng ${parseInt(monthNum)}/${year}`;
        monthSelect.appendChild(option);
    });
    
    if (recentMonths.length > 0) {
        if (!currentSelectedMonth || !recentMonths.includes(currentSelectedMonth)) {
            currentSelectedMonth = recentMonths[0];
        }
        monthSelect.value = currentSelectedMonth;
    } else {
        currentSelectedMonth = '';
        monthSelect.value = '';
    }
}

function renderDashboard(period, filterValue = null) {
    let periodText = '';
    let filterText = '';
    
    if (period === 'week') {
        periodText = 'Theo tuần';
        if (filterValue) {
            const [year, month] = filterValue.split('-');
            filterText = ` - Tháng ${parseInt(month)}/${year}`;
        }
        const monthSelect = document.getElementById('monthSelect');
        if (monthSelect && filterValue) {
            monthSelect.value = filterValue;
        }
    } else if (period === 'month') {
        periodText = 'Theo tháng (12 tháng gần nhất)';
        filterText = '';
    } else if (period === 'quarter') {
        periodText = 'Theo quý';
        filterText = filterValue && filterValue !== 'all' ? ` - Quý ${filterValue}` : '';
    } else {
        periodText = 'Theo năm';
        filterText = '';
    }
    
    const periodLabel = document.getElementById('periodLabel');
    if (periodLabel) periodLabel.innerHTML = `(${periodText}${filterText})`;
    
    // Render tổng quan
    renderOverviewCharts(period, filterValue, (stats, pType) => {
        renderOverviewTable(stats, pType);
    });
    
    // Render theo chức danh
    renderRoleCharts(period, filterValue, (role, stats, pType) => {
        renderRoleDetailTable(role, stats, pType);
    });
}

function renderWithCurrentPeriod() {
    if (currentPeriod === 'week') {
        renderDashboard(currentPeriod, currentSelectedMonth);
    } else if (currentPeriod === 'month') {
        renderDashboard(currentPeriod, null);
    } else if (currentPeriod === 'quarter') {
        renderDashboard(currentPeriod, 'all');
    } else {
        renderDashboard(currentPeriod, null);
    }
}

function setupEventListeners() {
    // Sự kiện cho nút thời gian
    const timeBtns = document.querySelectorAll('.time-btn');
    timeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            timeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPeriod = btn.dataset.period;
            
            const monthSelector = document.getElementById('monthSelector');
            if (monthSelector) monthSelector.style.display = currentPeriod === 'week' ? 'flex' : 'none';
            
            if (currentPeriod === 'week') {
                updateMonthDropdown();
                renderDashboard(currentPeriod, currentSelectedMonth);
            } else {
                renderWithCurrentPeriod();
            }
        });
    });
    
    // Sự kiện cho bộ lọc miền
    const mienFilter = document.getElementById('mienFilter');
    if (mienFilter) {
        mienFilter.addEventListener('change', (e) => {
            currentMienFilter = e.target.value;
            
            // Cập nhật dropdown Khu vực theo miền
            updateKVDropdown();
            
            // Reset nhóm và NPP
            updateNhomDropdown();
            updateNPPDropdown();
            
            const nhomSelect = document.getElementById('nhomFilter');
            const nppSelect = document.getElementById('nppFilter');
            if (nhomSelect) nhomSelect.style.display = 'none';
            if (nppSelect) nppSelect.style.display = 'none';
            
            renderWithCurrentPeriod();
        });
    }
    
    // Sự kiện cho bộ lọc khu vực
    const kvFilter = document.getElementById('kvFilter');
    if (kvFilter) {
        kvFilter.addEventListener('change', (e) => {
            currentKhuVucFilter = e.target.value;
            updateNhomDropdown();
            updateNPPDropdown();
            renderWithCurrentPeriod();
        });
    }
    
    // Sự kiện cho bộ lọc nhóm
    const nhomFilter = document.getElementById('nhomFilter');
    if (nhomFilter) {
        nhomFilter.addEventListener('change', (e) => {
            currentNhomFilter = e.target.value;
            updateNPPDropdown();
            renderWithCurrentPeriod();
        });
    }
    
    // Sự kiện cho bộ lọc NPP
    const nppFilter = document.getElementById('nppFilter');
    if (nppFilter) {
        nppFilter.addEventListener('change', (e) => {
            currentNppFilter = e.target.value;
            renderWithCurrentPeriod();
        });
    }
    
    // Sự kiện cho chọn tháng
    const monthSelect = document.getElementById('monthSelect');
    if (monthSelect) {
        monthSelect.addEventListener('change', (e) => {
            currentSelectedMonth = e.target.value;
            if (currentPeriod === 'week' && currentSelectedMonth) {
                renderDashboard('week', currentSelectedMonth);
            }
        });
    }
}

// Xử lý đăng nhập
function handleLogin() {
    const codeInput = document.getElementById('loginCode');
    const errorEl = document.getElementById('loginError');
    const code = codeInput.value.trim();
    
    if (!code) {
        errorEl.textContent = 'Vui lòng nhập mã đăng nhập!';
        return;
    }
    
    const result = login(code);
    if (result.success) {
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('userBar').style.display = 'flex';
        const displayName = result.user.role === 'ADMIN' ? 'ADMIN (Toàn quyền)' : result.user.kv;
        document.getElementById('userDisplay').textContent = `👤 ${result.user.code} - ${displayName}`;
        
        // Nếu không phải ADMIN, khóa bộ lọc KV + Miền và đặt theo quyền
        if (!isAdmin()) {
            const kvSelect = document.getElementById('kvFilter');
            if (kvSelect) {
                kvSelect.value = result.user.kv;
                kvSelect.disabled = true;
                kvSelect.style.opacity = '0.6';
                kvSelect.style.cursor = 'not-allowed';
                currentKhuVucFilter = result.user.kv;
            }
            const mienSelect = document.getElementById('mienFilter');
            if (mienSelect) {
                mienSelect.disabled = true;
                mienSelect.style.opacity = '0.6';
                mienSelect.style.cursor = 'not-allowed';
            }
        }
        
        initDashboard();
    } else {
        errorEl.textContent = result.message;
        codeInput.value = '';
        codeInput.focus();
    }
}

function initDashboard() {
    updateNhomDropdown();
    updateNPPDropdown();
    setupEventListeners();
    updateMonthDropdown();
    renderDashboard('month');
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra đã đăng nhập chưa
    const user = getCurrentUser();
    if (user) {
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('userBar').style.display = 'flex';
        const displayName = user.role === 'ADMIN' ? 'ADMIN (Toàn quyền)' : user.kv;
        document.getElementById('userDisplay').textContent = `👤 ${user.code} - ${displayName}`;
        
        // Nếu không phải ADMIN, khóa bộ lọc KV + Miền
        if (!isAdmin()) {
            const kvSelect = document.getElementById('kvFilter');
            if (kvSelect) {
                kvSelect.value = user.kv;
                kvSelect.disabled = true;
                kvSelect.style.opacity = '0.6';
                kvSelect.style.cursor = 'not-allowed';
                currentKhuVucFilter = user.kv;
            }
            const mienSelect = document.getElementById('mienFilter');
            if (mienSelect) {
                mienSelect.disabled = true;
                mienSelect.style.opacity = '0.6';
                mienSelect.style.cursor = 'not-allowed';
            }
        }
        
        initDashboard();
    }
    
    // Sự kiện đăng nhập
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    const loginCode = document.getElementById('loginCode');
    if (loginCode) {
        loginCode.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }
    
    // Sự kiện đăng xuất
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});