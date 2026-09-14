import {createFileRoute} from "@tanstack/react-router";
import AnatomyPage from "../features/anatomy/AnatomyPage";
export const Route=createFileRoute("/anatomia")({head:()=>({meta:[{title:"Anatomía 3D | MED3D"},{name:"description",content:"Explora estructuras reales del corazón, pulmones y encéfalo."}]}),component:AnatomyPage});