import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');let file;try{file=path.resolve(root,'.'+decodeURIComponent(url.pathname));}catch{res.writeHead(400).end();return;}if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}if(file===root)file=path.join(root,'index.html');try{const stat=fs.statSync(file);if(!stat.isFile())throw new Error();res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);}catch{res.writeHead(404).end('No encontrado');}});
const port=Number(process.env.PORT||4173);
const host=process.env.HOST||'127.0.0.1';
server.listen(port,host,()=>console.log(`Local: http://${host}:${port}`));
