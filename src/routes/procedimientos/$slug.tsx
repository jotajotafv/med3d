import {createFileRoute} from "@tanstack/react-router";
import LessonPage from "../../features/learning/LessonPage";
export const Route=createFileRoute("/procedimientos/$slug")({head:()=>({meta:[{title:"Procedimiento educativo | MED3D"}]}),component:Page});
function Page(){const {slug}=Route.useParams();return <LessonPage kind="procedure" slug={slug}/>}