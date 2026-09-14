import {createFileRoute} from "@tanstack/react-router";
import AboutPage from "../features/about/AboutPage";
export const Route=createFileRoute("/acerca")({head:()=>({meta:[{title:"Acerca del proyecto | MED3D"}]}),component:AboutPage});