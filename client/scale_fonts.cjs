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

        if (modified) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated font sizes in: ' + filePath);
        }
    }
});
