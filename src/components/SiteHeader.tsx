import SiteLink from "./SiteLink";
import {useEffect,useRef,useState} from "react";
import {Link,useRouterState} from "@tanstack/react-router";
import {List,X,ArrowUpRight} from "@phosphor-icons/react";
const links=[["/","Inicio"],["/anatomia","Anatomía 3D"],["/procedimientos","Procedimientos"],["/primeros-auxilios","Primeros auxilios"],["/acerca","Acerca del proyecto"]] as const;
export default function SiteHeader(){
 const [open,setOpen]=useState(false);const toggle=useRef<HTMLButtonElement>(null);
 const path=useRouterState({select:s=>s.location.pathname.replace(new RegExp('^'+import.meta.env.BASE_URL.replace(/\/$/,'')), '') || '/'});
 useEffect(()=>{setOpen(false)},[path]);
 useEffect(()=>{if(!open)return;const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape"){setOpen(false);toggle.current?.focus()}};document.addEventListener("keydown",onKey);return()=>document.removeEventListener("keydown",onKey)},[open]);
 return <header className="site-header"><SiteLink className="skip-link" href="#contenido">Saltar al contenido</SiteLink><div className="site-header-inner">
 <Link to="/" className="site-wordmark" aria-label="MED3D, inicio">MED<span>3D</span><span className="brand-rule" aria-hidden="true"/></Link>
 <button className="nav-toggle" ref={toggle} aria-expanded={open} aria-controls="main-nav" onClick={()=>setOpen(!open)} aria-label={open?"Cerrar menú":"Abrir menú"}>{open?<X size={22}/>:<List size={22}/>}</button>
 <nav id="main-nav" aria-label="Navegación principal" className={open?"main-nav is-open":"main-nav"}>{links.map(([href,label])=><SiteLink key={href} href={href} aria-current={(href==="/"?path==="/":path.startsWith(href))?"page":undefined}>{label}</SiteLink>)}</nav>
 <SiteLink href="/anatomia" className="nav-atlas">Abrir atlas <ArrowUpRight size={16}/></SiteLink></div></header>;
}