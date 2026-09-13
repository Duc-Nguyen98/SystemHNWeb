import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
export function serve(root = resolve('.'), port = 4174) {
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
  return new Promise(resolveServer => {
    const server = createServer(async (req, res) => {
      try {
        let path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
        if (path !== root && !path.startsWith(root + sep)) throw new Error('outside root');
        if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
        res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(await readFile(path));
      } catch { res.writeHead(404); res.end('Not found'); }
    }).listen(port, '127.0.0.1', () => resolveServer(server));
  });
}
if (resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await serve(resolve('.'), Number(process.env.PORT || 4174));
  console.log(`Gallery: http://127.0.0.1:${server.address().port}/`);
}
