"use client";

import { useCallback } from "react";
import type { Circle, Color } from "@/types/game.types";
import { COLOR_HEX } from "@/config/game.config";

interface UseCanvasRendererProps {
  canvasWidth: number;
  canvasHeight: number;
  circleRadius: number;
}

export function useCanvasRenderer({
  canvasWidth,
  canvasHeight,
  circleRadius,
}: UseCanvasRendererProps) {
  const drawCircles = useCallback(
    (
      canvas: HTMLCanvasElement | null,
      circles: Circle[],
      expectedColor: Color | null
    ) => {
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = "#1d1d1f";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const targetCircle = expectedColor
        ? circles.find(
            (circle) =>
              circle.color === expectedColor && circle.y >= -circleRadius
          )
        : null;

      circles.forEach((circle) => {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);

        ctx.fillStyle = COLOR_HEX[circle.color];
        ctx.fill();

        if (targetCircle && circle.id === targetCircle.id) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      });
    },
    [canvasWidth, canvasHeight, circleRadius]
  );

  return { drawCircles };
}
