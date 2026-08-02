"use client";

import { useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { pickWeighted } from "@/lib/utils";
import type { PrizeItem } from "@/types";
import { fireConfettiBurst } from "../ConfettiBurst";
import { RevealPanel } from "../RevealPanel/RevealPanel";
import styles from "./WheelSpin.module.scss";

interface WheelSpinProps {
  prizes: PrizeItem[];
}

const SEGMENT_COLORS = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-accent)",
  "var(--color-primary-dark)",
  "var(--color-secondary-dark)",
  "var(--color-accent-dark)",
];

const EXTRA_SPINS = 6;
const SPIN_DURATION = 4.2;

export function WheelSpin({ prizes }: WheelSpinProps) {
  const discRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<PrizeItem | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const prefersReducedMotion = usePrefersReducedMotion();

  const segmentAngle = 360 / prizes.length;
  const conicGradient = `conic-gradient(${prizes
    .map((_, index) => {
      const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
      const start = index * segmentAngle;
      const end = start + segmentAngle;
      return `${color} ${start}deg ${end}deg`;
    })
    .join(", ")})`;

  const handleWin = (winner: PrizeItem) => {
    setResult(winner);
    setIsSpinning(false);
    setAnnouncement(`You won ${winner.label}`);
    void fireConfettiBurst();
  };

  const handleSpin = async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);
    setAnnouncement("Spinning the wheel…");

    const winner = pickWeighted(prizes);
    const winnerPosition = prizes.findIndex((prize) => prize.id === winner.id);
    const targetSegmentCenter = winnerPosition * segmentAngle + segmentAngle / 2;

    if (prefersReducedMotion || !discRef.current) {
      handleWin(winner);
      return;
    }

    const currentNormalized = rotationRef.current % 360;
    const desiredNormalized = (360 - targetSegmentCenter) % 360;
    let delta = desiredNormalized - currentNormalized;
    if (delta <= 0) delta += 360;

    const finalRotation = rotationRef.current + EXTRA_SPINS * 360 + delta;
    rotationRef.current = finalRotation;

    const { gsap } = await import("gsap");
    gsap.to(discRef.current, {
      rotate: finalRotation,
      duration: SPIN_DURATION,
      ease: "power4.out",
      onComplete: () => handleWin(winner),
    });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.wheelArea}>
        <span className={styles.pointer} aria-hidden="true" />
        <div ref={discRef} className={styles.disc} style={{ background: conicGradient }}>
          {prizes.map((prize, index) => {
            const angle = index * segmentAngle + segmentAngle / 2;
            return (
              <span
                key={prize.id}
                className={styles.segmentLabel}
                style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-118px)` }}
              >
                {prize.label}
              </span>
            );
          })}
        </div>
        <button
          type="button"
          className={styles.hub}
          onClick={handleSpin}
          disabled={isSpinning}
          aria-describedby="wheel-spin-status"
        >
          {isSpinning ? "…" : "SPIN"}
        </button>
      </div>

      <div id="wheel-spin-status" role="status" aria-live="polite" className={styles.srOnly}>
        {announcement}
      </div>

      {result && (
        <div className={styles.resultArea}>
          <RevealPanel prize={result} onReset={() => setResult(null)} resetLabel="Spin again" />
        </div>
      )}
    </div>
  );
}
