import { useRef } from "react";
import { useGSAP } from "@gsap/react";   // shipped with GSAP 3.13
import gsap from "gsap";
import "./App.css";

export default function App() {
  const box = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.to(box.current, { rotation: 360, x: 200, duration: 2, repeat: -1 });
  }, []);

  return <div ref={box} className="w-32 h-32 bg-sky-500 rounded-2xl" />;
}
