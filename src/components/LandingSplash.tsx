"use client";

import { useEffect, useState } from "react";
import Splash from "./Splash";

// Brief branded splash shown when landing on the marketing home, then fades out.
export default function LandingSplash() {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("fade"), 1100);
    const t2 = setTimeout(() => setPhase("gone"), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "gone") return null;
  return (
    <div className={phase === "fade" ? "splash-fade" : undefined}>
      <Splash />
    </div>
  );
}
