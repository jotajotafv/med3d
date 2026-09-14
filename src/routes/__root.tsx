import SiteLink from "../components/SiteLink";
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {Outlet,createRootRouteWithContext,HeadContent} from '@tanstack/react-router';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import appMeta from '../app-meta.json';
export const Route=createRootRouteWithContext<{queryClient:QueryClient}>()({
head:()=>({meta:[{title:'MED3D'},{name:'description',content:appMeta.og_description}]}),
component:RootComponent,
notFoundComponent:()=> <main className="site-error"><span>404</span><h1>No encontramos esta página.</h1><p>Vuelve al inicio para seguir explorando la plataforma.</p><SiteLink href="/">Volver al inicio</SiteLink></main>,
errorComponent:({reset})=><main className="site-error"><h1>No fue posible abrir esta página.</h1><p>Inténtalo de nuevo para continuar.</p><button onClick={reset}>Reintentar</button><SiteLink href="/">Volver al inicio</SiteLink></main>});
function RootComponent(){const {queryClient}=Route.useRouteContext();return <QueryClientProvider client={queryClient}><HeadContent/><SiteHeader/><div id="contenido" tabIndex={-1}><Outlet/></div><SiteFooter/></QueryClientProvider>}
