// utils.js - Các hàm tiện ích

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

function getQuarterYear(date) {
    const quarter = getQuarter(date);
    const year = date.getFullYear();
    return { quarter, year };
}

function getPeriodKey(date, periodType, filterValue = null) {
    if (periodType === 'week') {
        if (filterValue) {
            const [year, month] = filterValue.split('-');
            if (date.getFullYear() === parseInt(year) && date.getMonth() + 1 === parseInt(month)) {
                const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                let startDayOfWeek = firstDayOfMonth.getDay();
                if (startDayOfWeek === 0) startDayOfWeek = 7;
                const firstSunday = 1 + (7 - startDayOfWeek);
                
                let weekNum;
                if (date.getDate() <= firstSunday) {
                    weekNum = 1;
                } else {
                    weekNum = Math.ceil((date.getDate() - firstSunday) / 7) + 1;
                }
                return { key: `Tuần ${weekNum}`, sortValue: weekNum, year: parseInt(year), month: parseInt(month) };
            }
            return null;
        }
        const weekNum = getWeekNumber(date);
        const match = weekNum.match(/(\d{4})-W(\d+)/);
        return { key: weekNum, sortValue: match ? parseInt(match[2]) : 0, year: match ? parseInt(match[1]) : 0 };
    } else if (periodType === 'month') {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        return { key: `${year}-${month.toString().padStart(2, '0')}`, sortValue: year * 100 + month, year, month };
    } else if (periodType === 'quarter') {
        const { quarter, year } = getQuarterYear(date);
        if (filterValue !== 'all' && filterValue !== null) {
            if (quarter !== parseInt(filterValue)) return null;
        }
        return { key: `Quý ${quarter}/${year}`, sortValue: year * 10 + quarter, year, quarter };
    } else {
        const year = date.getFullYear();
        return { key: `${year}`, sortValue: year, year };
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

// Lấy 12 tháng gần nhất có dữ liệu
function getRecentMonths(limit = 12) {
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

// Lọc chỉ lấy 12 tháng gần nhất cho biểu đồ
function filterRecentMonths(stats) {
    const recentMonths = getRecentMonths(12);
    const filteredLabels = [];
    const filteredHires = [];
    const filteredLeaves = [];
    
    for (let i = 0; i < stats.labels.length; i++) {
        const label = stats.labels[i];
        // Label tháng có dạng YYYY-MM (ví dụ: 2026-05)
        if (recentMonths.includes(label)) {
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