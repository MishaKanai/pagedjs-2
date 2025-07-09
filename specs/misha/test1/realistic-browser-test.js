import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RealisticBrowserTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.outputDir = path.join(__dirname, 'realistic-test-output');
    }

    async initialize() {
        console.log('🚀 Initializing realistic browser test...');
        
        // Create output directory
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        // Launch browser with settings closer to real user experience
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null, // Use real browser viewport
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--start-maximized'
            ]
        });

        this.page = await this.browser.newPage();
        
        // Don't listen to console logs to avoid interference
        // Just let the page run naturally

        console.log('✅ Browser initialized with realistic settings');
    }

    async testFile(filename, description) {
        console.log(`\n📄 Testing: ${filename} - ${description}`);
        
        const filepath = path.resolve(__dirname, filename);
        const fileUrl = `file://${filepath}`;
        
        console.log(`🔗 Loading: ${fileUrl}`);
        
        // Load the page and wait for it to fully load
        await this.page.goto(fileUrl, { waitUntil: 'networkidle0' });
        
        // Take screenshot immediately after loading
        const initialPath = path.join(this.outputDir, `${filename}-01-initial.png`);
        await this.page.screenshot({ path: initialPath, fullPage: true });
        console.log('📸 Initial screenshot taken');
        
        // Wait 2 seconds for PagedJS to complete
        console.log('⏳ Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const finalPath = path.join(this.outputDir, `${filename}-02-final.png`);
        await this.page.screenshot({ path: finalPath, fullPage: true });
        console.log('📸 Final screenshot taken');
        
        // Check for content at the end
        const contentCheck = await this.page.evaluate(() => {
            // Look for the content that should be below "Events"
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let node;
            let foundEvents = false;
            let contentAfterEvents = [];
            
            while (node = walker.nextNode()) {
                const text = node.textContent.trim();
                
                if (text.includes('Events') && !foundEvents) {
                    foundEvents = true;
                    continue;
                }
                
                if (foundEvents && text.length > 10) {
                    const parentElement = node.parentElement;
                    const rect = parentElement.getBoundingClientRect();
                    const style = window.getComputedStyle(parentElement);
                    
                    contentAfterEvents.push({
                        text: text.substring(0, 100),
                        visible: style.display !== 'none' && 
                                style.visibility !== 'hidden' && 
                                style.opacity !== '0' &&
                                rect.height > 0 &&
                                rect.width > 0,
                        position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                    });
                }
            }
            
            return {
                foundEvents,
                contentAfterEvents: contentAfterEvents.slice(0, 10) // First 10 items
            };
        });
        
        console.log('\n📊 Content analysis:');
        console.log(`Events section found: ${contentCheck.foundEvents}`);
        console.log(`Content after Events: ${contentCheck.contentAfterEvents.length} items`);
        
        contentCheck.contentAfterEvents.forEach((item, index) => {
            console.log(`  ${index + 1}. "${item.text}..." - Visible: ${item.visible}, Position: (${item.position.x}, ${item.position.y})`);
        });
        
        return {
            filename,
            contentAfterEvents: contentCheck.contentAfterEvents,
            screenshots: {
                initial: initialPath,
                final: finalPath
            }
        };
    }

    async generateReport(results) {
        console.log('\n📊 Generating realistic test report...');
        
        const reportPath = path.join(this.outputDir, 'realistic-test-report.html');
        
        let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Realistic Browser Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-result { border: 1px solid #ddd; margin: 20px 0; padding: 15px; }
        .screenshot-timeline { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 20px 0; }
        .screenshot { border: 1px solid #ccc; padding: 5px; text-align: center; }
        .screenshot img { max-width: 100%; height: auto; }
        .content-analysis { background: #f9f9f9; padding: 10px; margin: 10px 0; }
        .visible { color: green; }
        .hidden { color: red; }
        .summary { background: #f0f8ff; padding: 15px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Realistic Browser Test Report</h1>
    <div class="summary">
        <h2>Test Summary</h2>
        <p>This test simulates real user behavior by loading the page and taking screenshots at regular intervals without interference.</p>
        <p>Generated at: ${new Date().toISOString()}</p>
    </div>
`;
        
        results.forEach(result => {
            html += `
    <div class="test-result">
        <h2>${result.filename}</h2>
        <div class="content-analysis">
            <h3>Content After Events Section</h3>
            <p>Found ${result.contentAfterEvents.length} content items after "Events"</p>
`;
            
            if (result.contentAfterEvents.length === 0) {
                html += '<p class="hidden"><strong>⚠️ NO CONTENT FOUND AFTER EVENTS - This indicates the missing content issue!</strong></p>';
            } else {
                html += '<ul>';
                result.contentAfterEvents.forEach(item => {
                    const visibilityClass = item.visible ? 'visible' : 'hidden';
                    const visibilityText = item.visible ? '✅ Visible' : '❌ Hidden';
                    html += `<li class="${visibilityClass}">"${item.text}..." - ${visibilityText}</li>`;
                });
                html += '</ul>';
            }
            
            html += `
        </div>
        <h3>Screenshot Timeline</h3>
        <div class="screenshot-timeline">
            <div class="screenshot">
                <h4>Initial Load</h4>
                <img src="${path.basename(result.screenshots.initial)}" alt="Initial">
            </div>
            <div class="screenshot">
                <h4>After 2 seconds</h4>
                <img src="${path.basename(result.screenshots.final)}" alt="Final">
            </div>
        </div>
    </div>
`;
        });
        
        html += '</body></html>';
        
        fs.writeFileSync(reportPath, html);
        console.log(`📄 Report saved: ${reportPath}`);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Browser closed');
        }
    }
}

async function runRealisticTest() {
    const test = new RealisticBrowserTest();
    const results = [];
    
    try {
        await test.initialize();
        
        // Test original file
        console.log('\n=== Testing Original File ===');
        const originalResult = await test.testFile('chrometest.html', 'Original file');
        results.push(originalResult);
        
        // Test fixed file
        console.log('\n=== Testing Fixed File ===');
        const fixedResult = await test.testFile('chrometest-with-fix.html', 'Fixed file');
        results.push(fixedResult);
        
        console.log('\n🎯 === REALISTIC TEST SUMMARY ===');
        console.log(`Original file: ${originalResult.contentAfterEvents.length} content items after Events`);
        console.log(`Fixed file: ${fixedResult.contentAfterEvents.length} content items after Events`);
        
        if (fixedResult.contentAfterEvents.length === 0) {
            console.log('❌ ISSUE CONFIRMED: Fixed file has no content after Events section');
        } else if (fixedResult.contentAfterEvents.length < originalResult.contentAfterEvents.length) {
            console.log('⚠️ ISSUE DETECTED: Fixed file has less content than original');
        } else {
            console.log('✅ No content issues detected');
        }
        
        await test.generateReport(results);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await test.close();
    }
}

runRealisticTest().catch(console.error);

export { RealisticBrowserTest }; 