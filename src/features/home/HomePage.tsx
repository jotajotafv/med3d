import HomeHero from "./HomeHero";
import "./home.css";

export default function HomePage() {
  // Preserve the hero's existing anchor without adding content below it.
  return <main className="home-page" id="plataforma"><HomeHero/></main>;
}
