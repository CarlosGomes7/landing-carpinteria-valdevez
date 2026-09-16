import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { coverLayout, targetGaze, damp, FACE } from './dist/motion-math.js';

// Verify cursor mapping for wide, tablet and narrow cover crops.
for (const [width,height] of [[1440,570],[1024,505],[390,405],[320,405],[1920,650]]) {
  const layout=coverLayout(width,height,width<=760);
  const rect={left:0,top:96,width,height};
  const eyeX=(FACE[0]-layout.offset[0])/layout.scale[0]*width;
  const eyeY=96+(FACE[1]-layout.offset[1])/layout.scale[1]*height;
  const center=targetGaze(eyeX,eyeY,rect,layout);
  assert(center.every(v=>Math.abs(v)<1e-9));
  assert(targetGaze(eyeX-300,eyeY,rect,layout)[0]<0);
  assert(targetGaze(eyeX+300,eyeY,rect,layout)[0]>0);
  assert(targetGaze(eyeX,eyeY-300,rect,layout)[1]<0);
  assert(targetGaze(eyeX,eyeY+300,rect,layout)[1]>0);
  assert(targetGaze(1e6,-1e6,rect,layout).every(v=>v>=-1&&v<=1));
  assert(layout.scale.every(v=>v>0&&v<=1));
}
let position=0;
for(let i=0;i<90;i++) { const next=damp(position,1,1/60,14); assert(next>=position&&next<=1); position=next; }
assert(position>.999);

const html=fs.readFileSync('dist/index.html','utf8');
const css=fs.readFileSync('dist/styles.css','utf8')+fs.readFileSync('dist/centered-hero.css','utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate HTML ID');
for(const m of html.matchAll(/href="#([^"]+)"/g))assert(ids.includes(m[1]),`Missing anchor ${m[1]}`);
const files=new Set();
for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!/^(https?:|tel:)/.test(m[1]))files.add(m[1]);
for(const m of css.matchAll(/url\(['"]?([^)'"\s]+)/g))if(!m[1].startsWith('http'))files.add(m[1]);
for(const file of files)assert(fs.existsSync(path.join('dist',file.split('?')[0])),`Missing asset ${file}`);
for(const m of html.matchAll(/href="(https:\/\/wa.me\/[^" ]+)"/g)){
  const url=new URL(m[1]);assert.equal(url.pathname,'/584140331941');assert(url.searchParams.get('text')?.startsWith('Hola'));
}
assert.match(css,/prefers-reduced-motion/);
assert.doesNotMatch(html,/id="portrait-canvas"|id="motion-toggle"|class="gaze-hint"/);
assert.doesNotMatch(fs.readFileSync("dist/app.js", "utf8"), /initPortrait|portrait\.js/);
assert.match(html,/lang="es"/);
console.log('PASS: 5 viewport coordinate mappings, bidirectional gaze, damping, anchors, local assets, WhatsApp links, Spanish metadata and motion preference hooks.');
