// table.js - Quản lý bảng dữ liệu

// Hàm lấy giá trị sắp xếp từ chuỗi kỳ
function getSortValueFromPeriod(periodStr) {
    // Xử lý theo định dạng YYYY-MM (tháng từ buildStats)
    let match = periodStr.match(/^(\d{4})-(\d{2})$/);
    if (match) {
        return parseInt(match[1]) * 100 + parseInt(match[2]);
    }
    // Xử lý theo định dạng YYYY-WXX (tuần từ buildStats)
    match = periodStr.match(/^(\d{4})-W(\d+)$/);
    if (match) {
        return parseInt(match[1]) * 100 + parseInt(match[2]);
    }
    // Xử lý theo định dạng Tháng X/YYYY
    match = periodStr.match(/Tháng (\d+)\/(\d+)/);
    if (match) {
        return parseInt(match[2]) * 100 + parseInt(match[1]);
    }
    // Xử lý theo định dạng Tuần X/YYYY
    match = periodStr.match(/Tuần (\d+)\/(\d+)/);
    if (match) {
        return parseInt(match[2]) * 100 + parseInt(match[1]);
    }
    // Xử lý theo định dạng Quý X/YYYY
    match = periodStr.match(/Quý (\d+)\/(\d+)/);
    if (match) {
        return parseInt(match[2]) * 10 + parseInt(match[1]);
    }
    // Xử lý theo định dạng Năm XXXX
    match = periodStr.match(/Năm (\d+)/);
    if (match) {
        return parseInt(match[1]);
    }
    // Xử lý theo định dạng Tuần X (trong tháng)
    match = periodStr.match(/Tuần (\d+)$/);
    if (match) {
        return parseInt(match[1]);
    }
    return 0;
}

// Hàm sắp xếp dữ liệu bảng giảm dần (mới nhất lên đầu)
function sortTableDataDescending(tableData) {
    return tableData.sort((a, b) => {
        return getSortValueFromPeriod(b.period) - getSortValueFromPeriod(a.period);
    });
}

// Render bảng tổng quan
function renderOverviewTable(stats, periodType) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (stats.labels.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Không có dữ liệu</td>';
        return;
    }
    
    // Tạo mảng dữ liệu
    const tableData = [];
    for (let i = 0; i < stats.labels.length; i++) {
        tableData.push({
            period: stats.labels[i],
            hires: stats.hires[i],
            leaves: stats.leaves[i],
            net: stats.hires[i] - stats.leaves[i]
        });
    }
    
    // Sắp xếp giảm dần (mới nhất lên đầu)
    const sortedData = sortTableDataDescending(tableData);
    
    // Hiển thị bảng
    for (let i = 0; i < sortedData.length; i++) {
        const row = tbody.insertRow();
        
        const cellStt = row.insertCell(0);
        cellStt.innerText = (i + 1).toString();
        cellStt.style.fontWeight = '600';
        cellStt.style.color = '#2b5a8c';
        
        const cellKy = row.insertCell(1);
        cellKy.innerText = getDisplayName(sortedData[i].period, periodType);
        cellKy.style.fontWeight = '500';
        
        const cellTuyen = row.insertCell(2);
        cellTuyen.innerText = sortedData[i].hires.toString();
        
        const cellNghi = row.insertCell(3);
        cellNghi.innerText = sortedData[i].leaves.toString();
        
        const cellBienDong = row.insertCell(4);
        const net = sortedData[i].net;
        cellBienDong.innerText = (net >= 0 ? '+' : '') + net.toString();
        cellBienDong.style.color = net > 0 ? '#2e7d64' : (net < 0 ? '#c96f4d' : '#666');
        cellBienDong.style.fontWeight = '600';
    }
}

// Render bảng chi tiết theo chức danh
function renderRoleDetailTable(role, stats, periodType) {
    const tableId = `table_${role}`;
    let tableContainer = document.getElementById(tableId);
    
    // Nếu chưa có bảng, tạo mới trong card của role đó
    if (!tableContainer) {
        const roleCard = document.querySelector(`.card:has(#chart_${role})`);
        if (roleCard) {
            let existingTable = roleCard.querySelector(`#${tableId}`);
            if (!existingTable) {
                const newTable = document.createElement('div');
                newTable.className = 'table-wrapper';
                newTable.style.marginTop = '20px';
                newTable.innerHTML = `
                    <div class="card-header" style="padding-top:0; margin-bottom:12px">
                        <h4 style="font-size:0.95rem"><i class="fas fa-table-list"></i> Chi tiết biến động - ${role}</h4>
                    </div>
                    <table class="data-table" id="${tableId}">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Kỳ</th>
                                <th>Tuyển mới</th>
                                <th>Nghỉ việc</th>
                                <th>Chênh lệch</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `;
                roleCard.appendChild(newTable);
                tableContainer = document.getElementById(tableId);
            } else {
                tableContainer = existingTable;
            }
        }
    }
    
    if (tableContainer) {
        const tbody = tableContainer.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '';
            if (stats.labels.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Không có dữ liệu</td>';
            } else {
                // Tạo mảng dữ liệu
                const tableData = [];
                for (let i = 0; i < stats.labels.length; i++) {
                    tableData.push({
                        period: stats.labels[i],
                        hires: stats.hires[i],
                        leaves: stats.leaves[i],
                        net: stats.hires[i] - stats.leaves[i]
                    });
                }
                
                // Sắp xếp giảm dần (mới nhất lên đầu)
                const sortedData = sortTableDataDescending(tableData);
                
                for (let i = 0; i < sortedData.length; i++) {
                    const row = tbody.insertRow();
                    
                    const cellStt = row.insertCell(0);
                    cellStt.innerText = (i + 1).toString();
                    cellStt.style.fontWeight = '600';
                    cellStt.style.color = '#2b5a8c';
                    
                    const cellKy = row.insertCell(1);
                    cellKy.innerText = getDisplayName(sortedData[i].period, periodType);
                    cellKy.style.fontWeight = '500';
                    
                    const cellTuyen = row.insertCell(2);
                    cellTuyen.innerText = sortedData[i].hires.toString();
                    
                    const cellNghi = row.insertCell(3);
                    cellNghi.innerText = sortedData[i].leaves.toString();
                    
                    const cellChenhLech = row.insertCell(4);
                    const net = sortedData[i].net;
                    cellChenhLech.innerText = (net >= 0 ? '+' : '') + net.toString();
                    cellChenhLech.style.color = net > 0 ? '#2e7d64' : (net < 0 ? '#c96f4d' : '#666');
                    cellChenhLech.style.fontWeight = '600';
                }
            }
        }
    }
}