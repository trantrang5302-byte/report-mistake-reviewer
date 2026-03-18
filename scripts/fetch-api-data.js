const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        console.log(">>> Đăng nhập để lấy TOKEN...");
        await page.goto('https://cms-v2-dot-micro-enigma-235001.appspot.com/report-mistake', { waitUntil: 'networkidle2' });
        
        await page.waitForSelector('input');
        const inputs = await page.$$('input');
        await inputs[0].type('trangtran');
        await inputs[1].type('trangtran');
        await page.click('button');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 5000));

        // Lấy Token và User Info
        const authData = await page.evaluate(() => {
            return {
                token: localStorage.getItem('token') || sessionStorage.getItem('token'),
                user: JSON.parse(localStorage.getItem('user') || '{}'),
                cookies: document.cookie
            };
        });

        console.log(">>> ĐÃ LẤY ĐƯỢC AUTH DATA.");
        fs.writeFileSync('auth_debug.json', JSON.stringify(authData, null, 2));

        // Fetch dữ liệu các report chưa xử lý (status: 0)
        if (authData.token) {
            console.log(">>> Đang FETCH dữ liệu report chưa xử lý (status: 0)...");
            const response = await page.evaluate(async (token) => {
                const res = await fetch('https://api-cms-v2-dot-micro-enigma-235001.appspot.com/api/question/get-questions-report', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ page: 0, status: 0, limit: 100 }) // Sửa status thành 0
                });
                return await res.json();
            }, authData.token);

            if (response && response.questions) {
                fs.writeFileSync('all_reports.json', JSON.stringify(response.questions, null, 2));
                console.log(`>>> ĐÃ LƯU ${response.questions.length} REPORT VÀO all_reports.json.`);
            } else {
                console.log(">>> KHÔNG TÌM THẤY REPORT NÀO.");
            }
        }

    } catch (err) {
        console.error(">>> LỖI: " + err.message);
    } finally {
        await browser.close();
    }
})();
