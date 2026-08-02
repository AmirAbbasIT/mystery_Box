// Dynamically imported by WheelSpin/EggReveal only at the moment of a win,
// so canvas-confetti never ships in the shared bundle for pages without it.
export async function fireConfettiBurst() {
  const { default: confetti } = await import("canvas-confetti");

  confetti({
    particleCount: 120,
    spread: 80,
    startVelocity: 45,
    origin: { y: 0.6 },
    colors: ["#ff6fa5", "#9b5de5", "#ffd166", "#ffffff"],
  });
}
