const puppeteer = require('puppeteer');

(async () => {
    console.log(">>> Đang khởi động trình duyệt để đăng nhập CMS...");
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    try {
        // 1. Vào trang CMS
        await page.goto('https://cms-v2-dot-micro-enigma-235001.appspot.com/report-mistake', { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });

        console.log(">>> Đang thực hiện đăng nhập...");
        
        // 2. Điền thông tin đăng nhập (Dựa trên cấu trúc text quét được trước đó)
        // Tìm các ô input cho Account và Password
        await page.waitForSelector('input[type="text"], input:not([type])');
        const inputs = await page.$$('input');
        
        if (inputs.length >= 2) {
            await inputs[0].type('trangtran');
            await inputs[1].type('trangtran');
            console.log(">>> Đã điền Account và Password.");
        } else {
            // Thử tìm theo placeholder hoặc label nếu input không xác định rõ
            await page.type('input[placeholder*="Account"]', 'trangtran').catch(() => {});
            await page.type('input[placeholder*="Password"]', 'trangtran').catch(() => {});
        }

        // 3. Nhấn nút LOGIN
        await page.click('button'); // Giả định nút duy nhất hoặc đầu tiên là LOGIN
        console.log(">>> Đã nhấn nút LOGIN. Đang chờ chuyển hướng...");

        // 4. Đợi trang report tải xong dữ liệu
        await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => console.log("Hết thời gian chờ chuyển hướng, tiếp tục quét..."));
        await new Promise(r => setTimeout(r, 5000)); // Đợi thêm 5s cho chắc chắn render xong dữ liệu

        // 5. Trích xuất toàn bộ dữ liệu bảng report
        const data = await page.evaluate(() => {
            // Cố gắng lấy dữ liệu từ bảng hoặc các hàng danh sách
            const rows = Array.from(document.querySelectorAll('tr, .row, .list-item'));
            return rows.map(row => row.innerText).join('\n---\n');
        });

        const bodyText = await page.evaluate(() => document.body.innerText);

        console.log(">>> DỮ LIỆU TRÍCH XUẤT SAU ĐĂNG NHẬP:");
        console.log("======================================");
        console.log(bodyText);
        console.log("======================================");

    } catch (err) {
        console.error(">>> LỖI: " + err.message);
        // Chụp ảnh màn hình lỗi để debug nếu cần
        await page.screenshot({ path: 'debug-error.png' });
    } finally {
        await browser.close();
    }
})();
