import {createFileRoute} from "@tanstack/react-router";
import ArchitecturePage from "../features/about/ArchitecturePage";
export const Route=createFileRoute("/arquitectura")({head:()=>({meta:[{title:"Arquitectura y evolución | MED3D"}]}),component:ArchitecturePage});