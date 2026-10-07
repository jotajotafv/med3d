import {mkdir,readFile,writeFile} from 'node:fs/promises';
const base=process.env.BASE_PATH || '/med3d/';
const origin=process.env.SITE_ORIGIN || 'https://jotajotafv.github.io';
const paths=['','anatomia','acerca'];
const retiredPaths=['procedimientos','primeros-auxilios',...['presion-arterial','signos-vitales','vendaje','inmovilizacion'].map(x=>'procedimientos/'+x),...['rcp','atragantamiento','hemorragias','quemaduras','fracturas','desmayos','convulsiones','botiquin'].map(x=>'primeros-auxilios/'+x)];
const html=await readFile('dist/index.html','utf8');
for(const path of paths){if(path){await mkdir('dist/'+path,{recursive:true});await writeFile('dist/'+path+'/index.html',html);}}
// Static hosting keeps old bookmarks working, including without JavaScript.
// Router beforeLoad redirects also cover incoming URLs served by the SPA fallback.
for(const path of [...retiredPaths,'arquitectura']){
  const href=base+(path==='arquitectura'?'acerca/#metodologia':'anatomia/');
  const canonical=origin+href.split('#')[0];
  await mkdir('dist/'+path,{recursive:true});
  await writeFile('dist/'+path+'/index.html',`<!doctype html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MED3D</title><meta name="robots" content="noindex"><link rel="canonical" href="${canonical}"><meta http-equiv="refresh" content="0;url=${href}">
<style>body{margin:0;min-height:100vh;display:grid;place-content:center;padding:24px;box-sizing:border-box;background:#050607;color:#eef1f2;font:16px/1.7 system-ui}a{color:#a8d2dc;text-underline-offset:4px}a:focus-visible{outline:2px solid #86bec8;outline-offset:5px}</style></head>
<body><p>Continúa explorando MED3D.</p><a href="${href}">Abrir la página actual</a></body></html>`);
}
await writeFile('dist/404.html',html);
await writeFile('dist/.nojekyll','');
await writeFile('dist/robots.txt','User-agent: *\nAllow: /\nSitemap: '+origin+base+'sitemap.xml\n');
await writeFile('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(path=>'<url><loc>'+origin+base+path+'</loc></url>').join('')+'</urlset>');
console.log('Static pages: '+paths.length+'; compatibility redirects: '+(retiredPaths.length+1));
