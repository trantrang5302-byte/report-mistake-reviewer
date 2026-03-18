const { execSync } = require('child_process');
const fs = require('fs');

async function runAutomation() {
    console.log("🚀 KHỞI ĐỘNG QUY TRÌNH THẨM ĐỊNH TỰ ĐỘNG...");
    console.log(`⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`);

    try {
        // 1. Lấy danh sách report chưa xử lý
        console.log(">>> [1/3] Đang kết nối CMS lấy danh sách report...");
        const res = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/get-questions-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: 0, status: 0, limit: 50 })
        });
        
        if (!res.ok) throw new Error(`Lỗi kết nối API CMS: ${res.status}`);
        const reports = await res.json();

        if (!reports || reports.length === 0) {
            console.log("✅ THÔNG BÁO: Hiện tại không có báo cáo lỗi nào chưa xử lý.");
            return;
        }

        console.log(`>>> [2/3] Tìm thấy ${reports.length} báo cáo. Bắt đầu thẩm định hàng loạt...`);

        // 2. Duyệt qua từng report
        for (let i = 0; i < reports.length; i++) {
            const report = reports[i];
            console.log(`\n--- (${i + 1}/${reports.length}) Thẩm định Question ID: ${report.questionId} ---`);
            
            try {
                // Thực thi script thẩm định và push discord
                // Chúng ta truyền thêm biến môi trường để chắc chắn script con nhận được
                execSync(`node scripts/auto-review-and-push.js ${report.questionId}`, { 
                    stdio: 'inherit',
                    env: process.env 
                });
                console.log(`✅ Thành công: ${report.questionId}`);
            } catch (e) {
                console.error(`❌ Thất bại tại ID ${report.questionId}:`, e.message);
            }
        }

        console.log("\n✨ [3/3] HOÀN TẤT QUY TRÌNH HÀNG NGÀY.");
    } catch (err) {
        console.error("💥 LỖI HỆ THỐNG NGHIÊM TRỌNG:", err.message);
        process.exit(1);
    }
}

runAutomation();
