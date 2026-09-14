import {mkdir,readFile,writeFile} from 'node:fs/promises';
const base=process.env.BASE_PATH || '/med3d/';
const origin=process.env.SITE_ORIGIN || 'https://jotajotafv.github.io';
const paths=['','anatomia','acerca','arquitectura','procedimientos','primeros-auxilios',...['presion-arterial','signos-vitales','vendaje','inmovilizacion'].map(x=>'procedimientos/'+x),...['rcp','atragantamiento','hemorragias','quemaduras','fracturas','desmayos','convulsiones','botiquin'].map(x=>'primeros-auxilios/'+x)];
const html=await readFile('dist/index.html','utf8');
for(const path of paths){if(path){await mkdir('dist/'+path,{recursive:true});await writeFile('dist/'+path+'/index.html',html);}}
await writeFile('dist/404.html',html);
await writeFile('dist/.nojekyll','');
await writeFile('dist/robots.txt','User-agent: *\nAllow: /\nSitemap: '+origin+base+'sitemap.xml\n');
await writeFile('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(path=>'<url><loc>'+origin+base+path+'</loc></url>').join('')+'</urlset>');
console.log('Static routes generated: '+paths.length);
