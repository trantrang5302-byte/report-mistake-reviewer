const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function loginAndSaveToken() {
    console.log(">>> Đang tự động đăng nhập để lấy SESSION_ID mới...");
    try {
        const response = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                account: 'trangtran',
                password: 'trangtran' // Thông tin lấy từ các script cũ của bạn
            })
        });

        const data = await response.json();
        if (data && data.token) {
            const token = data.token;
            // Lưu vào file .env trong thư mục dự án
            const envPath = path.join(__dirname, '../.env');
            fs.writeFileSync(envPath, `SESSION_ID=${token}`);
            console.log(">>> Đã lấy và lưu SESSION_ID mới thành công!");
            return token;
        } else {
            console.error(">>> Lỗi: Không nhận được token từ API.");
        }
    } catch (error) {
        console.error(">>> Lỗi đăng nhập:", error.message);
    }
    return null;
}

loginAndSaveToken();
