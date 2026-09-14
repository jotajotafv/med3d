import {createFileRoute} from "@tanstack/react-router";
import LearningCatalog from "../../features/learning/LearningCatalog";
export const Route=createFileRoute("/procedimientos/")({head:()=>({meta:[{title:"Procedimientos médicos | MED3D"}]}),component:()=> <LearningCatalog kind="procedure"/>});