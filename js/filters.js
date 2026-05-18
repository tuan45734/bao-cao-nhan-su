// filters.js - Quản lý bộ lọc

let currentKhuVucFilter = 'all';
let currentNhomFilter = 'all';
let currentNppFilter = 'all';

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

function buildStats(periodType, filterValue = null, role = null) {
    const { joinEvents: joins, leaveEvents: leaves } = filterDataByArea(role);
    
    const joinMap = new Map(), leaveMap = new Map();
    
    joins.forEach(d => {
        const result = getPeriodKey(d, periodType, filterValue);
        if (result) {
            const key = result.key;
            joinMap.set(key, (joinMap.get(key) || 0) + 1);
        }
    });
    
    leaves.forEach(d => {
        const result = getPeriodKey(d, periodType, filterValue);
        if (result) {
            const key = result.key;
            leaveMap.set(key, (leaveMap.get(key) || 0) + 1);
        }
    });
    
    // Gộp tất cả các key
    const allKeys = new Set([...joinMap.keys(), ...leaveMap.keys()]);
    
    // Tạo mảng dữ liệu
    const dataArray = [];
    for (let key of allKeys) {
        dataArray.push({
            period: key,
            hires: joinMap.get(key) || 0,
            leaves: leaveMap.get(key) || 0
        });
    }
    
    // Sắp xếp cho biểu đồ (tăng dần theo thời gian - từ cũ đến mới)
    if (periodType === 'week') {
        // Sắp xếp tuần tăng dần
        dataArray.sort((a, b) => {
            const matchA = a.period.match(/Tuần (\d+)/);
            const matchB = b.period.match(/Tuần (\d+)/);
            if (matchA && matchB) {
                return parseInt(matchA[1]) - parseInt(matchB[1]);
            }
            return a.period.localeCompare(b.period);
        });
    } else if (periodType === 'month') {
        // Sắp xếp tháng tăng dần (từ cũ đến mới) cho biểu đồ
        dataArray.sort((a, b) => {
            const matchA = a.period.match(/Tháng (\d+)\/(\d+)/);
            const matchB = b.period.match(/Tháng (\d+)\/(\d+)/);
            if (matchA && matchB) {
                const yearA = parseInt(matchA[2]);
                const yearB = parseInt(matchB[2]);
                if (yearA !== yearB) return yearA - yearB;
                return parseInt(matchA[1]) - parseInt(matchB[1]);
            }
            return a.period.localeCompare(b.period);
        });
    } else if (periodType === 'quarter') {
        // Sắp xếp quý tăng dần
        dataArray.sort((a, b) => {
            const matchA = a.period.match(/Quý (\d+)\/(\d+)/);
            const matchB = b.period.match(/Quý (\d+)\/(\d+)/);
            if (matchA && matchB) {
                const yearA = parseInt(matchA[2]);
                const yearB = parseInt(matchB[2]);
                if (yearA !== yearB) return yearA - yearB;
                return parseInt(matchA[1]) - parseInt(matchB[1]);
            }
            return a.period.localeCompare(b.period);
        });
    } else {
        // Năm: sắp xếp tăng dần
        dataArray.sort((a, b) => {
            const yearA = parseInt(a.period);
            const yearB = parseInt(b.period);
            return yearA - yearB;
        });
    }
    
    const labels = [], hires = [], leavesArr = [];
    for (let item of dataArray) {
        labels.push(item.period);
        hires.push(item.hires);
        leavesArr.push(item.leaves);
    }
    
    return {
        labels, hires, leaves: leavesArr,
        totalHired: hires.reduce((a, b) => a + b, 0),
        totalLeft: leavesArr.reduce((a, b) => a + b, 0)
    };
}