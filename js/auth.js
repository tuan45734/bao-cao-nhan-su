// auth.js - Quản lý đăng nhập & phân quyền

const ACCOUNTS = {
    'KV1ADZ': 'KV1',
    'KV2ZAC': 'KV2',
    'KV3CCC': 'KV3',
    'KV4YXY': 'KV4',
    'KV5XXZ': 'KV5',
    'KV6XBC': 'KV6',
    'KV7ZZA': 'KV7',
    '99': 'ADMIN'
};

const SESSION_KEY = 'hr_dashboard_user';

// Kiểm tra đã đăng nhập chưa
function getCurrentUser() {
    const data = sessionStorage.getItem(SESSION_KEY);
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Đăng nhập
function login(accountCode) {
    const code = accountCode.trim();
    const role = ACCOUNTS[code];
    if (!role) {
        return { success: false, message: 'Mã đăng nhập không đúng!' };
    }
    const user = {
        code: code,
        role: role,
        kv: role === 'ADMIN' ? null : role
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return { success: true, user: user };
}

// Đăng xuất
function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
}

// Kiểm tra quyền truy cập KV
function getAccessibleKV() {
    const user = getCurrentUser();
    if (!user) return [];
    if (user.role === 'ADMIN') return ['KV1','KV2','KV3','KV4','KV5','KV6','KV7'];
    return [user.kv];
}

// Người dùng có phải admin không
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'ADMIN';
}

// Kiểm tra xem employee có thuộc quyền truy cập không
function isEmployeeAccessible(emp) {
    if (isAdmin()) return true;
    const user = getCurrentUser();
    if (!user) return false;
    return emp.khu_vuc === user.kv;
}

// Lọc dữ liệu theo quyền
function filterDataByAuth(dataArray) {
    const user = getCurrentUser();
    if (!user) return [];
    if (user.role === 'ADMIN') return dataArray;
    return dataArray.filter(emp => emp.khu_vuc === user.kv);
}
