import type {AnchorHTMLAttributes} from 'react';
export function siteHref(href:string|undefined){
 if(!href || !href.startsWith('/') || href.startsWith('//')) return href;
 const base=import.meta.env.BASE_URL;
 if(base!=='/' && (href===base.slice(0,-1)||href.startsWith(base)))return href;
 return base+href.slice(1);
}
export default function SiteLink({href,...props}:AnchorHTMLAttributes<HTMLAnchorElement>){return <a {...props} href={siteHref(href)}/>;}
