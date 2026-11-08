import http from 'node:http';
import tls from 'node:tls';
const proxy = new URL(process.env.HTTPS_PROXY || 'http://127.0.0.1:7897');
await Promise.all(['198.41.192.167:7844','198.41.200.13:7844'].flatMap(address => ['TLSv1.2', 'TLSv1.3'].map(version =>
  new Promise(resolve => {
    const request = http.request({ hostname: proxy.hostname, port: proxy.port, method: 'CONNECT', path: address });
    request.setTimeout(12000, () => request.destroy(new Error('CONNECT timeout')));
    request.once('error', error => { console.log(address, error.message); resolve(); });
    request.once('connect', (response, socket, head) => {
      console.log(address, 'CONNECT', response.statusCode);
      if (response.statusCode !== 200) { socket.destroy(); resolve(); return; }
      if (head.length) socket.unshift(head);
      const secure = tls.connect({socket, servername:'h2.cftunnel.com', minVersion:version, maxVersion:version, ecdhCurve:'X25519:P-256'});
      secure.setTimeout(12000, () => secure.destroy(new Error('TLS timeout')));
      secure.once('secureConnect', () => { console.log(address, version, 'TLS', secure.authorized, secure.getProtocol()); secure.destroy(); resolve(); });
      secure.once('error', error => { console.log(address, version, error.message); secure.destroy(); resolve(); });
    });
    request.end();
  }))
));
