const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

const targetDir = path.join(__dirname, 'src');

walk(targetDir, function(filePath) {
    if (filePath.endsWith('.css')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        let newContent = content.replace(/font-size:\s*(\d*\.?\d+)px/g, (match, p1) => {
            modified = true;
            let currentSize = parseFloat(p1);
            let newSize = Math.round(currentSize * 1.15); // Increase by 15%
            return 'font-size: ' + newSize + 'px';
        });

        // specific button font sizes or padding might need scaling?
        // Let's also slightly increase padding on buttons
        newContent = newContent.replace(/padding:\s*(\d+)px\s*(\d+)px/g, (match, p1, p2) => {
            // only replace if we suspect it's a button or input (a bit risky globally, maybe just target btn?)
            return match;
        });

        if (modified) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated font sizes in: ' + filePath);
        }
    }
});
