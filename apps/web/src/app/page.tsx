"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex-1 bg-gray-50 min-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center p-3 sm:p-4 overflow-hidden">
        {/* Animated background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-[#F47575] to-[#FF6B6B] opacity-20 blur-3xl animate-float" />
          <div className="absolute top-20 right-10 w-40 h-40 rounded-full bg-gradient-to-br from-[#00B17A] to-[#009962] opacity-20 blur-3xl animate-float-delayed" />
          <div className="absolute bottom-20 left-1/4 w-36 h-36 rounded-full bg-gradient-to-br from-[#7DCAF6] to-[#5AB5E8] opacity-20 blur-3xl animate-float" />
          <div className="absolute bottom-10 right-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-[#FFDA57] to-[#FFE57F] opacity-20 blur-3xl animate-float-delayed" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Hero Card */}
          <div className="glass-card rounded-3xl sm:rounded-[2.5rem] shadow-2xl p-4 sm:p-6 mb-3 sm:mb-4">
            <div className="text-center mb-4 sm:mb-6">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🎯</div>
              <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-multi mb-2">
                Color Match
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium glass rounded-full border border-white/30">
                <span className="text-gray-800 font-semibold">Built on Celo</span>
              </div>
            </div>

            <p className="text-gray-800 text-center mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed font-medium">
              Test your reflexes! Match falling circles by tapping the right color
              zone before they hit the bottom.
            </p>

            <Button
              asChild
              className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-gradient-to-r from-[#00B17A] to-[#009962] hover:from-[#009962] hover:to-[#00B17A] rounded-2xl shadow-lg border-2 border-white/30 text-white transition-all hover:scale-105 active:scale-95"
            >
              <Link href="/game">Play Now</Link>
            </Button>
          </div>

          {/* Game Info Card */}
          <div className="glass-card rounded-3xl sm:rounded-[2.5rem] shadow-2xl p-4 sm:p-6 mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-black text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <span>💡</span> How to Play
            </h2>
            <ul className="space-y-2 sm:space-y-3 text-gray-700 text-sm sm:text-base font-medium">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-base sm:text-lg flex-shrink-0">1️⃣</span>
                <span>Circles fall from the top with different colors</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-base sm:text-lg flex-shrink-0">2️⃣</span>
                <span>
                  Tap the matching color zone before they reach the bottom
                </span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-base sm:text-lg flex-shrink-0">3️⃣</span>
                <span>Level up every 100 points - speed increases!</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-base sm:text-lg flex-shrink-0">4️⃣</span>
                <span>Miss a circle or tap wrong = Game Over</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
