"use client";

import confetti from "canvas-confetti";

export function triggerConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  const colors = ["#fbbf24", "#f59e0b", "#d97706", "#ffffff"];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

// Also export a big burst for initial celebration
export function triggerBigConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#fbbf24", "#f59e0b", "#d97706", "#ffffff"],
  });
}
