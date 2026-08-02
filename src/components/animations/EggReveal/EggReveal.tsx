"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { pickWeighted } from "@/lib/utils";
import type { PrizeItem } from "@/types";
import { fireConfettiBurst } from "../ConfettiBurst";
import { RevealPanel } from "../RevealPanel/RevealPanel";
import styles from "./EggReveal.module.scss";

interface EggRevealProps {
  prizes: PrizeItem[];
  label?: string;
}

type EggState = "idle" | "cracking" | "revealed";

export function EggReveal({ prizes, label = "Mystery Egg" }: EggRevealProps) {
  const eggRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<EggState>("idle");
  const [result, setResult] = useState<PrizeItem | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const prefersReducedMotion = usePrefersReducedMotion();
  const statusId = `egg-reveal-status-${label.replace(/\s+/g, "-").toLowerCase()}`;

  const handleCrack = async () => {
    if (state !== "idle") return;

    setState("cracking");
    setAnnouncement(`Cracking ${label}…`);

    const winner = pickWeighted(prizes);

    const reveal = () => {
      setResult(winner);
      setState("revealed");
      setAnnouncement(`You won ${winner.label}`);
      void fireConfettiBurst();
    };

    if (prefersReducedMotion || !eggRef.current) {
      reveal();
      return;
    }

    const { gsap } = await import("gsap");
    gsap
      .timeline({ onComplete: reveal })
      .to(eggRef.current, { rotate: -8, duration: 0.1 })
      .to(eggRef.current, { rotate: 8, duration: 0.1 })
      .to(eggRef.current, { rotate: -6, duration: 0.1 })
      .to(eggRef.current, { rotate: 6, duration: 0.1 })
      .to(eggRef.current, { rotate: 0, scale: 1.15, duration: 0.15 })
      .to(eggRef.current, { scale: 0, opacity: 0, duration: 0.25, ease: "power2.in" });
  };

  const handleReset = () => {
    setResult(null);
    setState("idle");
    if (eggRef.current) {
      eggRef.current.style.transform = "";
      eggRef.current.style.opacity = "";
    }
  };

  return (
    <div className={styles.wrapper}>
      {state !== "revealed" && (
        <button
          ref={eggRef}
          type="button"
          className={styles.egg}
          onClick={handleCrack}
          disabled={state === "cracking"}
          aria-describedby={statusId}
          aria-label={state === "cracking" ? `Cracking ${label}` : `Crack open ${label}`}
        >
          <Image
            src="/images/products/egg.svg"
            alt=""
            fill
            sizes="140px"
            className={styles.eggImage}
          />
        </button>
      )}

      <div id={statusId} role="status" aria-live="polite" className={styles.srOnly}>
        {announcement}
      </div>

      {result && state === "revealed" && (
        <RevealPanel prize={result} onReset={handleReset} resetLabel="Crack another" />
      )}
    </div>
  );
}
