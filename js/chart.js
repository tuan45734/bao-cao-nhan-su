// chart.js - Quản lý biểu đồ

let barChart = null, pieChart = null;
let barCharts = {};

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

function renderOverviewCharts(period, filterValue, onDataLoaded) {
    let stats = buildStats(period, filterValue);
    
    // Nếu là tháng, chỉ lấy 12 tháng gần nhất cho biểu đồ
    if (period === 'month') {
        stats = filterRecentMonths(stats);
    }
    
    const workingCount = getCurrentWorkingCount();
    document.getElementById('workingCount').innerText = workingCount;
    document.getElementById('totalHired').innerText = stats.totalHired;
    document.getElementById('totalLeft').innerText = stats.totalLeft;
    document.getElementById('netChange').innerText = stats.totalHired - stats.totalLeft;
    
    // Format lại labels cho biểu đồ
    const chartLabels = stats.labels.map(l => getDisplayName(l, period));
    
    if (barChart) barChart.destroy();
    barChart = new Chart(document.getElementById('hrFluctuationChart'), {
        type: 'bar',
        data: { labels: chartLabels, datasets: [
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
    
    if (onDataLoaded) onDataLoaded(stats, period);
}

function renderRoleCharts(period, filterValue, onDataLoaded) {
    const roles = ['ASM', 'GS', 'NV'];
    
    for (let role of roles) {
        let stats = buildStats(period, filterValue, role);
        
        // Nếu là tháng, chỉ lấy 12 tháng gần nhất cho biểu đồ
        if (period === 'month') {
            stats = filterRecentMonths(stats);
        }
        
        // Format lại labels cho biểu đồ
        const chartLabels = stats.labels.map(l => getDisplayName(l, period));
        
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
                    labels: chartLabels, 
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
        
        if (onDataLoaded) onDataLoaded(role, stats, period);
    }
}