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

let virtualDate = '2000';

http.createServer(function (request, response) {
    // TODO: Implement a real blacklist (block urls)
    // TODO: Implement a whitelist to pass on to normal internets

    const requestUrl = url.parse(request.url);

    if (requestUrl.hostname === 'setdate') {
        virtualDate = requestUrl.pathname.split('/').pop();
        //TODO: validate the date
        response.writeHead(200, {
            'Content-Type': 'text/html',
        });
        response.end(`Date set to: ${virtualDate}`, 'utf8');
    } else if (request.url !== 'http://ocsp.digicert.com/' && request.url !== 'http://clients1.google.com/ocsp') {
        wayBack (requestUrl, response, virtualDate);
    }
}).listen(8080);


function wayBack (requestUrl, response, baseDate) {
    const ext = requestUrl.pathname.split('.').pop();
    const contentType = mimeTypes[ext] || 'text/html';
    const getUrl = `http://web.archive.org/web/${baseDate}id_/${requestUrl.href}`;

    const req = http.get(getUrl, res => {
        const data = [];
        res.on('data', chunk => {
            data.push(chunk);
        });
        res.on('end', () => {
            const buffer = Buffer.concat(data);
            const bufferStr = buffer.toString();
            if (bufferStr.substr(0, 13) === 'found capture') {
                baseDate = bufferStr.substr(17, 14);
                // TODO: Instead of recursion, use wayback api to get the date first.
                wayBack(requestUrl, response, baseDate);
            }
            else {
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
