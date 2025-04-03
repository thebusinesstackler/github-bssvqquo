const fs = require('fs'); const tar = require('tar'); fs.createReadStream('node-v22.0.4-linux-x64.tar.xz').pipe(tar.x({ C: './' })).on('finish', () => console.log('Done!'));
