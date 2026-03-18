const puppeteer = require('puppeteer');

const targetId = process.argv[2];
if (!targetId) {
    console.error("Vui lòng cung cấp Question ID. Ví dụ: node fetch-report-details.js 5795245392396288");
    process.exit(1);
}

(async () => {
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200 });
    
    try {
        await page.goto('https://cms-v2-dot-micro-enigma-235001.appspot.com/report-mistake', { waitUntil: 'networkidle2' });
        
        // Đăng nhập
        await page.waitForSelector('input');
        const inputs = await page.$$('input');
        await inputs[0].type('trangtran');
        await inputs[1].type('trangtran');
        await page.click('button');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 5000));

        // Nhập ID vào ô search
        await page.evaluate((id) => {
            const inputs = Array.from(document.querySelectorAll('input'));
            const qidInput = inputs.find(i => i.parentElement && i.parentElement.innerText.includes('QuestionId'));
            if (qidInput) {
                qidInput.value = id;
                qidInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, targetId);
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 5000));

        // Tìm hàng chứa ID
        const rowData = await page.evaluate((id) => {
            const rows = Array.from(document.querySelectorAll('tr'));
            const row = rows.find(r => r.innerText.includes(id));
            if (!row) return null;
            return {
                text: row.innerText,
                index: rows.indexOf(row)
            };
        }, targetId);

        if (!rowData) {
            console.error(`>>> Không tìm thấy report với ID ${targetId} ở trạng thái Chưa Sửa.`);
            await browser.close();
            return;
        }

        // 1. Mở DETAILS REPORT để lấy lý do và ghi chú người dùng
        await page.evaluate((id) => {
            const rows = Array.from(document.querySelectorAll('tr'));
            const row = rows.find(r => r.innerText.includes(id));
            const btn = Array.from(row.querySelectorAll('button, a')).find(el => el.innerText.includes('DETAILS REPORT'));
            if (btn) btn.click();
        }, targetId);
        await new Promise(r => setTimeout(r, 3000));

        const reportDetails = await page.evaluate(() => {
            const body = document.body.innerText;
            // Cố gắng trích xuất Reason và Note từ text
            const reasonMatch = body.match(/Reason:\s*(.*)/i);
            const noteMatch = body.match(/Note:\s*([\s\S]*?)(?=\n[A-Z]|$)/i);
            const screenshotMatch = body.match(/https:\/\/storage\.googleapis\.com\/.*\.png/);
            
            return {
                reason: reasonMatch ? reasonMatch[1].trim() : "N/A",
                note: noteMatch ? noteMatch[1].trim() : "N/A",
                screenshot: screenshotMatch ? screenshotMatch[0] : "N/A"
            };
        });

        // Đóng modal details
        await page.keyboard.press('Escape');
        await new Promise(r => setTimeout(r, 1000));

        // 2. Mở SỬA CÂU HỎI để lấy nội dung câu hỏi, đáp án, giải thích
        await page.evaluate((id) => {
            const rows = Array.from(document.querySelectorAll('tr'));
            const row = rows.find(r => r.innerText.includes(id));
            const btn = Array.from(row.querySelectorAll('button, a')).find(el => el.innerText.includes('EDIT QUESTION'));
            if (btn) btn.click();
        }, targetId);
        await new Promise(r => setTimeout(r, 5000));

        const questionData = await page.evaluate(() => {
            const textareas = Array.from(document.querySelectorAll('textarea'));
            const question = textareas[0] ? textareas[0].value : "N/A";
            const options = textareas.slice(1, 5).map(t => t.value);
            const explanation = textareas[5] ? textareas[5].value : "N/A";
            
            const checks = Array.from(document.querySelectorAll('input[type="checkbox"], input[type="radio"]'));
            // Lấy 4 cái checkbox đầu tiên cho 4 đáp án
            const correctIndices = [];
            for(let i=0; i<4; i++) {
                if(checks[i] && checks[i].checked) correctIndices.push(i);
            }

            return {
                question,
                options: options.map((opt, i) => ({
                    text: opt,
                    isCorrect: correctIndices.includes(i)
                })),
                explanation
            };
        });

        console.log(JSON.stringify({
            questionId: targetId,
            report: reportDetails,
            content: questionData
        }, null, 2));

    } catch (err) {
        console.error(">>> LỖI: " + err.message);
    } finally {
        await browser.close();
    }
})();
