import {createFileRoute} from "@tanstack/react-router";
import LessonPage from "../../features/learning/LessonPage";
export const Route=createFileRoute("/primeros-auxilios/$slug")({head:()=>({meta:[{title:"Guía de primeros auxilios | MED3D"}]}),component:Page});
function Page(){const {slug}=Route.useParams();return <LessonPage kind="first-aid" slug={slug}/>}