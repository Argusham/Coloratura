import { RefObject } from "react";
import type { Color } from "@/types/game.types";
import { COLORS, COLOR_STYLES } from "@/config/game.config";

interface PlayingScreenProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  canvasWidth: number;
  canvasHeight: number;
  score: number;
  level: number;
  onZoneClick: (color: Color) => void;
  onGoToWelcome: () => void;
}

const colorGradients: Record<Color, string> = {
  red: "linear-gradient(135deg, #F47575 0%, #FF6B6B 100%)",
  green: "linear-gradient(135deg, #00B17A 0%, #009962 100%)",
  blue: "linear-gradient(135deg, #7DCAF6 0%, #5AB5E8 100%)",
  yellow: "linear-gradient(135deg, #FFDA57 0%, #FFE57F 100%)",
};

export function PlayingScreen({
  canvasRef,
  canvasWidth,
  canvasHeight,
  score,
  level,
  onZoneClick,
  onGoToWelcome,
}: PlayingScreenProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center p-3 sm:p-4 overflow-hidden bg-gray-50">
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-[#F47575] to-[#FF6B6B] opacity-20 blur-3xl animate-float" />
        <div className="absolute top-20 right-10 w-40 h-40 rounded-full bg-gradient-to-br from-[#00B17A] to-[#009962] opacity-20 blur-3xl animate-float-delayed" />
        <div className="absolute bottom-20 left-1/4 w-36 h-36 rounded-full bg-gradient-to-br from-[#7DCAF6] to-[#5AB5E8] opacity-20 blur-3xl animate-float" />
        <div className="absolute bottom-10 right-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-[#FFDA57] to-[#FFE57F] opacity-20 blur-3xl animate-float-delayed" />
      </div>

      <div className="w-full max-w-md relative z-10 my-auto">
        {/* Main glass card */}
        <div className="glass-card rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="flex justify-between items-center mb-3">
              <button
                onClick={onGoToWelcome}
                className="glass rounded-xl p-2 sm:p-3 border border-white/30 hover:border-white/50 transition-all hover:scale-110 active:scale-95"
              >
                <span className="text-gray-900 text-xl sm:text-2xl font-bold">←</span>
              </button>
              <h1 className="text-xl sm:text-2xl font-black bg-clip-text bg-gradient-multi">
                Colour Match
              </h1>
              <div className="w-10 sm:w-12"></div>
            </div>
            <div className="flex justify-between gap-3">
              <div className="flex-1 glass rounded-2xl p-3 border-2 border-white/40">
                <p className="text-gray-900 text-xs sm:text-sm font-semibold opacity-70 mb-1">Score</p>
                <p className="text-2xl sm:text-3xl font-black text-[#00B17A]">{score}</p>
              </div>
              <div className="flex-1 glass rounded-2xl p-3 border-2 border-white/40">
                <p className="text-gray-900 text-xs sm:text-sm font-semibold opacity-70 mb-1">Level</p>
                <p className="text-2xl sm:text-3xl font-black text-[#A5B3FF]">{level}</p>
              </div>
            </div>
          </div>

          {/* Game Canvas */}
          <div className="relative mb-4">
            <div className="absolute -inset-1 bg-gradient-multi rounded-2xl sm:rounded-3xl opacity-30 blur-md" />
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="relative w-full bg-[#100F06] rounded-2xl sm:rounded-3xl border-4 border-white/30 shadow-2xl"
            />
          </div>

          {/* Color Zones */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onZoneClick(color)}
                className="relative h-20 sm:h-24 rounded-2xl sm:rounded-3xl font-black text-gray-900 text-base sm:text-lg border-2 border-white/30 overflow-hidden group"
                style={{ background: colorGradients[color] }}
              >
                <span className="relative z-10 drop-shadow-lg">
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </span>
                <div className="absolute inset-0" />
              </button>
            ))}
          </div>

          {/* Instructions */}
          <div className="glass rounded-xl p-3 border border-white/30 text-center">
            <p className="text-gray-900 text-xs sm:text-sm font-semibold opacity-70">
              🎯 Tap the zones to match falling circles!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
