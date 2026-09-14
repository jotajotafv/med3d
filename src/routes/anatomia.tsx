import {createFileRoute} from "@tanstack/react-router";
import AnatomyPage from "../features/anatomy/AnatomyPage";
export const Route=createFileRoute("/anatomia")({head:()=>({meta:[{title:"Anatomía 3D | MED3D"},{name:"description",content:"Explora el sistema óseo por estructuras, regiones y capas, junto a los modelos de corazón, pulmones y encéfalo."}]}),component:AnatomyPage});