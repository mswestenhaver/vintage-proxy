const http = require('http');
const url = require('url');

const mimeTypes = {
    'html': 'text/html',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'gif': 'image/gif',
    'js': 'text/javascript',
    'css': 'text/css',
};


http.createServer(function (request, response) {
    // TODO: Implement a date controller
    // TODO: Implement a real blacklist (block urls)
    // TODO: Implement a whitelist to pass on to normal internets
    if (request.url !== 'http://ocsp.digicert.com/' && request.url !== 'http://clients1.google.com/ocsp') {
        wayBack (request, response, '19970404064352');
    }
}).listen(8080);


function wayBack (request, response, baseDate) {
    //TODO: pull out the getting and responding functions if possible.
    const requestUrl = url.parse(request.url);
    const ext = requestUrl.pathname.split('.').pop();
    const contentType = mimeTypes[ext] || 'text/html';
    const getUrl = `http://web.archive.org/web/${baseDate}id_/${request.url}`;

    const req = http.get(getUrl, res => {
        const data = [];
        res.on('data', chunk => {
            data.push(chunk);
        });
        res.on('end', () => {
            const buffer = Buffer.concat(data);
            const bufferStr = buffer.toString();
            // console.log('stream starts with: ' + body.substr(0, 19));
            if (bufferStr.substr(0, 13) === 'found capture') {
                baseDate = bufferStr.substr(17, 14);
                // console.log('resetting date to: ' + baseDate);
                // TODO: Instead of recursion, use wayback api to get the date first.
                wayBack(request, response, baseDate);
            }
            else {
                // console.log ('received: ' + url);
                response.writeHead(200, {
                    'Content-Type': contentType,
                });
                response.end(buffer, 'binary');
            }
        });
    });
    req.on('error', ex => {
        console.log('///////////// Error with the request /////////////');
        console.log ('Path: ' + req.path);
        console.log ('ex: ' + ex);
    });
}
