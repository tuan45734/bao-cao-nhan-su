let barChart = null, pieChart = null;
let barCharts = {};
let currentPeriod = 'month';
let currentSelectedMonth = '';
let currentKhuVucFilter = 'all';
let currentNhomFilter = 'all';
let currentNppFilter = 'all';

function parseDate(str) {
    if (!str || str === "") return null;
    let parts = str.split('/');
    if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return null;
}

function isStillWorking(emp) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let lastLeaveDate = null;
    if (emp.ngay_ra_1) {
        let leave1 = parseDate(emp.ngay_ra_1);
        if (leave1 && (!lastLeaveDate || leave1 > lastLeaveDate)) lastLeaveDate = leave1;
    }
    if (emp.ngay_ra_2) {
        let leave2 = parseDate(emp.ngay_ra_2);
        if (leave2 && (!lastLeaveDate || leave2 > lastLeaveDate)) lastLeaveDate = leave2;
    }
    
    if (!lastLeaveDate) return true;
    return lastLeaveDate >= today;
}

// Lấy danh sách nhóm theo khu vực
function getNhomByKV(kv) {
    const nhomSet = new Set();
    rawData.forEach(emp => {
        if (kv === 'all' || emp.khu_vuc === kv) {
            if (emp.nhom && emp.nhom !== "") {
                nhomSet.add(emp.nhom);
            }
        }
    });
    return Array.from(nhomSet).sort();
}

// Lấy danh sách NPP theo nhóm và khu vực
function getNPPByNhomAndKV(nhom, kv) {
    const nppSet = new Set();
    rawData.forEach(emp => {
        const includeKV = (kv === 'all' || emp.khu_vuc === kv);
        const includeNhom = (nhom === 'all' || emp.nhom === nhom);
        if (includeKV && includeNhom && emp.npp && emp.npp !== "") {
            nppSet.add(emp.npp);
        }
    });
    return Array.from(nppSet).sort();
}

function updateNhomDropdown() {
    const nhomSelect = document.getElementById('nhomFilter');
    if (!nhomSelect) return;
    
    const nhomList = getNhomByKV(currentKhuVucFilter);
    nhomSelect.innerHTML = '<option value="all">📁 Tất cả nhóm</option>';
    nhomList.forEach(nhom => {
        const option = document.createElement('option');
        option.value = nhom;
        option.textContent = nhom;
        nhomSelect.appendChild(option);
    });
    
    currentNhomFilter = 'all';
    nhomSelect.value = 'all';
}

function updateNPPDropdown() {
    const nppSelect = document.getElementById('nppFilter');
    if (!nppSelect) return;
    
    const nppList = getNPPByNhomAndKV(currentNhomFilter, currentKhuVucFilter);
    nppSelect.innerHTML = '<option value="all">📊 Tất cả NPP</option>';
    nppList.forEach(npp => {
        const option = document.createElement('option');
        option.value = npp;
        option.textContent = npp;
        nppSelect.appendChild(option);
    });
    
    currentNppFilter = 'all';
    nppSelect.value = 'all';
}

function filterDataByArea(role = null) {
    let filteredJoin = [], filteredLeave = [];
    rawData.forEach(emp => {
        const includeKhuVuc = (currentKhuVucFilter === 'all' || emp.khu_vuc === currentKhuVucFilter);
        const includeNhom = (currentNhomFilter === 'all' || emp.nhom === currentNhomFilter);
        const includeNpp = (currentNppFilter === 'all' || emp.npp === currentNppFilter);
        const includeRole = (role === null || emp.chuc_danh === role);
        
        if (includeKhuVuc && includeNhom && includeNpp && includeRole) {
            let join1 = parseDate(emp.ngay_vao_1);
            if (join1) filteredJoin.push(join1);
            let join2 = parseDate(emp.ngay_vao_2);
            if (join2) filteredJoin.push(join2);
            let leave1 = parseDate(emp.ngay_ra_1);
            if (leave1) filteredLeave.push(leave1);
            let leave2 = parseDate(emp.ngay_ra_2);
            if (leave2) filteredLeave.push(leave2);
        }
    });
    return { joinEvents: filteredJoin, leaveEvents: filteredLeave };
}

function getCurrentWorkingCount(role = null) {
    let workingCount = 0;
    rawData.forEach(emp => {
        const includeKhuVuc = (currentKhuVucFilter === 'all' || emp.khu_vuc === currentKhuVucFilter);
        const includeNhom = (currentNhomFilter === 'all' || emp.nhom === currentNhomFilter);
        const includeNpp = (currentNppFilter === 'all' || emp.npp === currentNppFilter);
        const includeRole = (role === null || emp.chuc_danh === role);
        if (includeKhuVuc && includeNhom && includeNpp && includeRole && isStillWorking(emp)) {
            workingCount++;
        }
    });
    return workingCount;
}

function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const year = d.getFullYear();
    const week = Math.floor((d - new Date(year, 0, 4)) / 86400000 / 7) + 1;
    return `${year}-W${week.toString().padStart(2, '0')}`;
}

function getQuarter(date) {
    const month = date.getMonth() + 1;
    return Math.ceil(month / 3);
}

function getPeriodKey(date, periodType, filterValue = null) {
    if (periodType === 'week') {
        if (filterValue) {
            const [year, month] = filterValue.split('-');
            if (date.getFullYear() === parseInt(year) && date.getMonth() + 1 === parseInt(month)) {
                return `Tuần ${Math.ceil(date.getDate() / 7)}`;
            }
            return null;
        }
        return getWeekNumber(date);
    } else if (periodType === 'month') {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    } else if (periodType === 'quarter') {
        const quarter = getQuarter(date);
        if (filterValue !== 'all' && filterValue !== null) {
            if (quarter !== parseInt(filterValue)) return null;
        }
        return `Quý ${quarter}/${date.getFullYear()}`;
    } else {
        return `${date.getFullYear()}`;
    }
}

function getDisplayName(key, periodType) {
    if (periodType === 'week') {
        if (key.includes('Tuần')) return key;
        const match = key.match(/(\d{4})-W(\d+)/);
        return match ? `Tuần ${match[2]}/${match[1]}` : key;
    } else if (periodType === 'month') {
        const [y, m] = key.split('-');
        return `Tháng ${parseInt(m)}/${y}`;
    } else if (periodType === 'quarter') {
        return key;
    } else {
        return `Năm ${key}`;
    }
}

function buildStats(periodType, filterValue = null, role = null) {
    const { joinEvents: joins, leaveEvents: leaves } = filterDataByArea(role);
    
    const joinMap = new Map(), leaveMap = new Map();
    joins.forEach(d => {
        let key = getPeriodKey(d, periodType, filterValue);
        if (key) joinMap.set(key, (joinMap.get(key) || 0) + 1);
    });
    leaves.forEach(d => {
        let key = getPeriodKey(d, periodType, filterValue);
        if (key) leaveMap.set(key, (leaveMap.get(key) || 0) + 1);
    });
    
    let allKeys = new Set([...joinMap.keys(), ...leaveMap.keys()]);
    let sorted = Array.from(allKeys).sort();
    
    const labels = [], hires = [], leavesArr = [];
    for (let k of sorted) {
        labels.push(getDisplayName(k, periodType));
        hires.push(joinMap.get(k) || 0);
        leavesArr.push(leaveMap.get(k) || 0);
    }
    
    return {
        labels, hires, leaves: leavesArr,
        totalHired: Array.from(joinMap.values()).reduce((a, b) => a + b, 0),
        totalLeft: Array.from(leaveMap.values()).reduce((a, b) => a + b, 0)
    };
}

// Lấy 10 tháng gần nhất có dữ liệu
function getRecentMonths(limit = 10) {
    const allMonths = new Set();
    const allDates = [];
    
    rawData.forEach(emp => {
        let join1 = parseDate(emp.ngay_vao_1);
        if (join1) allDates.push(join1);
        let join2 = parseDate(emp.ngay_vao_2);
        if (join2) allDates.push(join2);
        let leave1 = parseDate(emp.ngay_ra_1);
        if (leave1) allDates.push(leave1);
        let leave2 = parseDate(emp.ngay_ra_2);
        if (leave2) allDates.push(leave2);
    });
    
    allDates.forEach(date => {
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        allMonths.add(monthKey);
    });
    
    const sortedMonths = Array.from(allMonths).sort().reverse();
    return sortedMonths.slice(0, limit);
}

function updateMonthDropdown() {
    const monthSelect = document.getElementById('monthSelect');
    if (!monthSelect) return;
    
    const recentMonths = getRecentMonths(10);
    
    monthSelect.innerHTML = '<option value="">-- Chọn tháng --</option>';
    recentMonths.forEach(month => {
        const [year, monthNum] = month.split('-');
        const option = document.createElement('option');
        option.value = month;
        option.textContent = `Tháng ${parseInt(monthNum)}/${year}`;
        monthSelect.appendChild(option);
    });
    
    if (recentMonths.length > 0 && !currentSelectedMonth) {
        currentSelectedMonth = recentMonths[0];
        monthSelect.value = currentSelectedMonth;
    }
}

function getStatsWithRecentMonths(stats) {
    const recentMonths = getRecentMonths(10);
    const filteredLabels = [];
    const filteredHires = [];
    const filteredLeaves = [];
    
    for (let i = 0; i < stats.labels.length; i++) {
        const label = stats.labels[i];
        const match = label.match(/Tháng (\d+)\/(\d+)/);
        if (match) {
            const month = match[1].padStart(2, '0');
            const year = match[2];
            const monthKey = `${year}-${month}`;
            if (recentMonths.includes(monthKey)) {
                filteredLabels.push(label);
                filteredHires.push(stats.hires[i]);
                filteredLeaves.push(stats.leaves[i]);
            }
        } else {
            filteredLabels.push(label);
            filteredHires.push(stats.hires[i]);
            filteredLeaves.push(stats.leaves[i]);
        }
    }
    
    return {
        labels: filteredLabels,
        hires: filteredHires,
        leaves: filteredLeaves,
        totalHired: filteredHires.reduce((a, b) => a + b, 0),
        totalLeft: filteredLeaves.reduce((a, b) => a + b, 0)
    };
}

// Plugin hiển thị số trên cột
const dataLabelsPlugin = {
    id: 'dataLabels',
    afterDatasetsDraw(chart) {
        const ctx = chart.ctx;
        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            if (!meta.hidden) {
                meta.data.forEach((element, index) => {
                    const value = dataset.data[index];
                    if (value > 0) {
                        ctx.save();
                        ctx.font = 'bold 11px "Segoe UI"';
                        ctx.fillStyle = dataset.backgroundColor === '#2e7d64' ? '#1a5c4a' : '#a84f30';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        const position = element.tooltipPosition();
                        ctx.fillText(value.toString(), position.x, position.y - 4);
                        ctx.restore();
                    }
                });
            }
        });
    }
};

function renderOverviewCharts(period, filterValue) {
    let stats = buildStats(period, filterValue);
    
    if (period === 'month') {
        stats = getStatsWithRecentMonths(stats);
    }
    
    const workingCount = getCurrentWorkingCount();
    document.getElementById('workingCount').innerText = workingCount;
    document.getElementById('totalHired').innerText = stats.totalHired;
    document.getElementById('totalLeft').innerText = stats.totalLeft;
    document.getElementById('netChange').innerText = stats.totalHired - stats.totalLeft;
    
    if (barChart) barChart.destroy();
    barChart = new Chart(document.getElementById('hrFluctuationChart'), {
        type: 'bar',
        data: { labels: stats.labels, datasets: [
            { label: 'Tuyển dụng mới', data: stats.hires, backgroundColor: '#2e7d64', borderRadius: 8, barPercentage: 0.65 },
            { label: 'Nghỉ việc', data: stats.leaves, backgroundColor: '#c96f4d', borderRadius: 8, barPercentage: 0.65 }
        ]},
        options: { 
            responsive: true, 
            maintainAspectRatio: true, 
            plugins: { 
                legend: { position: 'top' },
                tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw}` } }
            }, 
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } }
        },
        plugins: [dataLabelsPlugin]
    });
    
    if (pieChart) pieChart.destroy();
    const total = stats.totalHired + stats.totalLeft;
    pieChart = new Chart(document.getElementById('pieTurnoverChart'), {
        type: 'pie',
        data: { labels: ['Tuyển dụng', 'Nghỉ việc'], datasets: [{ data: [stats.totalHired, stats.totalLeft], backgroundColor: ['#2e7d64', '#c96f4d'] }] },
        options: { responsive: true, plugins: { tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw} (${total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0}%)` } } } }
    });
    
    // Render bảng chi tiết - SỬA LỖI HIỂN THỊ
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    if (stats.labels.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Không có dữ liệu</td></tr>';
    } else {
        for (let i = 0; i < stats.labels.length; i++) {
            const net = stats.hires[i] - stats.leaves[i];
            const row = tbody.insertRow();
            
            // Cột số thứ tự
            const cellStt = row.insertCell(0);
            cellStt.innerText = (i + 1).toString();
            cellStt.style.fontWeight = '600';
            cellStt.style.color = '#2b5a8c';
            
            // Cột kỳ
            const cellKy = row.insertCell(1);
            cellKy.innerText = stats.labels[i];
            cellKy.style.fontWeight = '500';
            
            // Cột tuyển mới
            const cellTuyen = row.insertCell(2);
            cellTuyen.innerText = stats.hires[i].toString();
            
            // Cột nghỉ việc
            const cellNghi = row.insertCell(3);
            cellNghi.innerText = stats.leaves[i].toString();
            
            // Cột biến động ròng
            const cellBienDong = row.insertCell(4);
            cellBienDong.innerText = (net >= 0 ? '+' : '') + net.toString();
            cellBienDong.style.color = net > 0 ? '#2e7d64' : (net < 0 ? '#c96f4d' : '#666');
            cellBienDong.style.fontWeight = '600';
        }
    }
}

function renderRoleCharts(period, filterValue) {
    const roles = ['ASM', 'GS', 'NV'];
    
    for (let role of roles) {
        let stats = buildStats(period, filterValue, role);
        
        if (period === 'month') {
            stats = getStatsWithRecentMonths(stats);
        }
        
        const workingCount = getCurrentWorkingCount(role);
        
        document.getElementById(`${role}_working`).innerText = workingCount;
        document.getElementById(`${role}_totalHired`).innerText = stats.totalHired;
        document.getElementById(`${role}_totalLeft`).innerText = stats.totalLeft;
        document.getElementById(`${role}_netChange`).innerText = stats.totalHired - stats.totalLeft;
        
        const canvasId = `chart_${role}`;
        const ctx = document.getElementById(canvasId);
        if (ctx) {
            if (barCharts[role]) barCharts[role].destroy();
            barCharts[role] = new Chart(ctx, {
                type: 'bar',
                data: { 
                    labels: stats.labels, 
                    datasets: [
                        { label: 'Tuyển dụng mới', data: stats.hires, backgroundColor: '#2e7d64', borderRadius: 8, barPercentage: 0.65 },
                        { label: 'Nghỉ việc', data: stats.leaves, backgroundColor: '#c96f4d', borderRadius: 8, barPercentage: 0.65 }
                    ]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: true,
                    plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } }
                },
                plugins: [dataLabelsPlugin]
            });
        }
    }
}

function renderDashboard(period, filterValue = null) {
    let periodText = '';
    let filterText = '';
    
    if (period === 'week') {
        periodText = 'Theo tuần';
        filterText = filterValue ? ` - Tháng ${filterValue.split('-')[1]}/${filterValue.split('-')[0]}` : '';
        updateMonthDropdown();
    } else if (period === 'month') {
        periodText = 'Theo tháng (10 tháng gần nhất)';
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
    
    renderOverviewCharts(period, filterValue);
    renderRoleCharts(period, filterValue);
}

document.addEventListener('DOMContentLoaded', () => {
    updateNhomDropdown();
    updateNPPDropdown();
    
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
            } else if (currentPeriod === 'month') {
                renderDashboard(currentPeriod, null);
            } else if (currentPeriod === 'quarter') {
                renderDashboard(currentPeriod, 'all');
            } else {
                renderDashboard(currentPeriod, null);
            }
        });
    });
    
    const kvFilter = document.getElementById('kvFilter');
    if (kvFilter) {
        kvFilter.addEventListener('change', (e) => {
            currentKhuVucFilter = e.target.value;
            updateNhomDropdown();
            updateNPPDropdown();
            
            const nhomSelect = document.getElementById('nhomFilter');
            const nppSelect = document.getElementById('nppFilter');
            if (nhomSelect) nhomSelect.style.display = currentKhuVucFilter !== 'all' ? 'inline-block' : 'none';
            if (nppSelect) nppSelect.style.display = 'none';
            
            if (currentPeriod === 'week') {
                renderDashboard(currentPeriod, currentSelectedMonth);
            } else if (currentPeriod === 'month') {
                renderDashboard(currentPeriod, null);
            } else if (currentPeriod === 'quarter') {
                renderDashboard(currentPeriod, 'all');
            } else {
                renderDashboard(currentPeriod, null);
            }
        });
    }
    
    const nhomFilter = document.getElementById('nhomFilter');
    if (nhomFilter) {
        nhomFilter.addEventListener('change', (e) => {
            currentNhomFilter = e.target.value;
            updateNPPDropdown();
            
            const nppSelect = document.getElementById('nppFilter');
            if (nppSelect) nppSelect.style.display = currentNhomFilter !== 'all' ? 'inline-block' : 'none';
            
            if (currentPeriod === 'week') {
                renderDashboard(currentPeriod, currentSelectedMonth);
            } else if (currentPeriod === 'month') {
                renderDashboard(currentPeriod, null);
            } else if (currentPeriod === 'quarter') {
                renderDashboard(currentPeriod, 'all');
            } else {
                renderDashboard(currentPeriod, null);
            }
        });
    }
    
    const nppFilter = document.getElementById('nppFilter');
    if (nppFilter) {
        nppFilter.addEventListener('change', (e) => {
            currentNppFilter = e.target.value;
            if (currentPeriod === 'week') {
                renderDashboard(currentPeriod, currentSelectedMonth);
            } else if (currentPeriod === 'month') {
                renderDashboard(currentPeriod, null);
            } else if (currentPeriod === 'quarter') {
                renderDashboard(currentPeriod, 'all');
            } else {
                renderDashboard(currentPeriod, null);
            }
        });
    }
    
    const monthSelect = document.getElementById('monthSelect');
    if (monthSelect) {
        monthSelect.addEventListener('change', (e) => {
            currentSelectedMonth = e.target.value;
            if (currentPeriod === 'week' && currentSelectedMonth) {
                renderDashboard('week', currentSelectedMonth);
            }
        });
    }
    
    updateMonthDropdown();
    renderDashboard('month');
});