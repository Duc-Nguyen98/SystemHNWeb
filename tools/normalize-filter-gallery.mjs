import { readFile, writeFile } from 'node:fs/promises';
const path = 'previews/overview-filter-v2/index.html';
let html = await readFile(path,'utf8');
if (!html.includes('assets/gallery.css')) html = html.replace('</head>','<link rel="stylesheet" href="../../assets/gallery.css"></head>');
html = html.replace(/<script>[\s\S]*?<\/script>/,'<script type="module" src="../../assets/filter-gallery.js"></script>');
await writeFile(path,html);
// Remove the 480px embedded previews too, so the gallery never enlarges them.
const manifest=JSON.parse(await readFile('screen-manifest.json','utf8'));
for(const page of ['index.html',path]) {
  let content=await readFile(page,'utf8');
  content=content.replace(/<article\b[^>]*>[\s\S]*?<\/article>/g,card=>{
    const id=card.match(/screen=(filter-[^"&]+)/)?.[1];
    if(!id)return card;
    const screen=manifest.screens.find(s=>s.id===id);
    const previous=card.match(/<img\b[^>]*>/)[0];
    const alt=previous.match(/alt="([^"]*)"/)?.[1]||id;
    return card.replace(previous,`<img loading="lazy" decoding="async" src="${page==='index.html'?'':'../../'}${screen.src}" width="${screen.width}" height="${screen.height}" alt="${alt}">`);
  });
  await writeFile(page,content);
}
