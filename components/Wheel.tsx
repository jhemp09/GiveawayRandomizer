"use client";

import { useEffect, useRef, useState } from "react";
import type { UniqueUser } from "@/lib/supabaseClient";

const COLORS = ["#7F77DD", "#1D9E75", "#D85A30", "#D4537E"];

export default function Wheel({ users }: { users: UniqueUser[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<UniqueUser | null>(null);

  const n = users.length;
  const slice = 360 / Math.max(n, 1);

  function drawWheel(rotationDeg: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 4;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotationDeg * Math.PI) / 180);

    users.forEach((user, i) => {
      const start = (i * slice * Math.PI) / 180;
      const end = ((i + 1) * slice * Math.PI) / 180;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, start, end);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();

      const mid = start + (end - start) / 2;
      ctx.save();
      ctx.rotate(mid);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "9px sans-serif";
      let label = user.username;
      if (label.length > 16) label = label.slice(0, 14) + "..";
      ctx.fillText(label, r - 8, 0);
      ctx.restore();
    });

    ctx.restore();
  }

  useEffect(() => {
    drawWheel(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  function spin() {
    if (spinning || n === 0) return;
    setSpinning(true);
    setWinner(null);

    const winnerIndex = Math.floor(Math.random() * n);
    const sliceCenter = winnerIndex * slice + slice / 2;
    const extraSpins = 5 * 360;
    const startRotation = rotationRef.current;
    const targetTotal =
      startRotation + extraSpins + (360 - ((startRotation + 360 - sliceCenter) % 360));
    const delta = targetTotal - startRotation;
    const duration = 3200;
    const startTime = performance.now();

    function ease(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function frame(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const current = startRotation + delta * ease(t);
      drawWheel(current % 360);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        rotationRef.current = targetTotal % 360;
        setSpinning(false);
        setWinner(users[winnerIndex]);
      }
    }
    requestAnimationFrame(frame);
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative" style={{ width: 340, height: 340, maxWidth: "100%" }}>
        <div
          className="absolute z-10"
          style={{
            top: -6,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "16px solid #222",
          }}
        />
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          className="block rounded-full border border-gray-300"
          style={{ width: "100%", height: "auto" }}
        />
      </div>
      <button
        onClick={spin}
        disabled={spinning || n === 0}
        className="rounded-lg border border-gray-400 bg-white px-5 py-2 text-base disabled:opacity-50"
      >
        {spinning ? "Spinning..." : "Spin the wheel"}
      </button>
      <div className="flex min-h-[40px] items-center justify-center">
        {winner ? (
          <p className="text-lg font-semibold">{`\u{1F3C6} @${winner.username} wins!`}</p>
        ) : (
          <p className="text-sm text-gray-500">
            {n > 0 ? `${n} unique commenters loaded. Press spin.` : "No commenters found."}
          </p>
        )}
      </div>
    </div>
  );
}
