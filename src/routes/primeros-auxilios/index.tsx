import {createFileRoute} from "@tanstack/react-router";
import LearningCatalog from "../../features/learning/LearningCatalog";
export const Route=createFileRoute("/primeros-auxilios/")({head:()=>({meta:[{title:"Primeros auxilios | MED3D"}]}),component:()=> <LearningCatalog kind="first-aid"/>});