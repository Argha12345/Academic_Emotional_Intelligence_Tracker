const fs = require('fs');
const path = require('path');

function processDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let matched = false;
            content = content.replace(/font-size:\s*(\d+)px;/g, (match, p1) => {
                matched = true;
                return `font-size: ${parseInt(p1) + 2}px;`;
            });
            if (matched) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    });
}

processDir('./src');
console.log('Done incrementing font sizes');
