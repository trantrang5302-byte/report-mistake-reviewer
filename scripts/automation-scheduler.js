const { execSync } = require('child_process');
const fs = require('fs');

async function runAutomation() {
    console.log("🚀 BẮT ĐẦU QUY TRÌNH THẨM ĐỊNH TỰ ĐỘNG...");

    try {
        // 1. Lấy danh sách report chưa xử lý
        console.log(">>> Đang lấy danh sách report...");
        const res = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/get-questions-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: 0, status: 0, limit: 50 })
        });
        const reports = await res.json();

        if (!reports || reports.length === 0) {
            console.log("✅ Không có báo cáo nào cần xử lý.");
            return;
        }

        console.log(`>>> Tìm thấy ${reports.length} báo cáo. Bắt đầu thẩm định...`);

        // 2. Với mỗi report, gọi Agent xử lý (Hoặc chạy script thẩm định)
        for (const report of reports) {
            console.log(`\n--- Đang thẩm định Question ID: ${report.questionId} ---`);
            
            // Ở đây chúng ta sẽ gọi script thẩm định và push discord cho từng câu
            // Tôi sẽ tích hợp logic thẩm định nhanh vào đây hoặc gọi lại script bạn đã có
            try {
                // Giả sử chúng ta dùng một câu lệnh CLI để Agent thực hiện thẩm định 1 câu cụ thể
                // Hoặc gọi script push-detailed-report với dữ liệu đã được thẩm định
                // Để đơn giản và nhanh, tôi sẽ gọi script xử lý đã có của bạn
                execSync(`node scripts/auto-review-and-push.js ${report.questionId}`, { stdio: 'inherit' });
            } catch (e) {
                console.error(`❌ Lỗi khi xử lý câu ${report.questionId}:`, e.message);
            }
        }

        console.log("\n✨ HOÀN TẤT QUY TRÌNH TỰ ĐỘNG.");
    } catch (err) {
        console.error("❌ LỖI HỆ THỐNG:", err.message);
    }
}

runAutomation();
