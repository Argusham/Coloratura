"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 bg-brutal-cream min-h-[calc(100vh-4rem)] overflow-y-auto pattern-dots">
      <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center p-3 sm:p-4 overflow-hidden">
        {/* Neo-brutalist decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-5 w-24 h-24 bg-brutal-pink border-4 border-brutal-black rotate-12 animate-wiggle" />
          <div className="absolute top-32 right-8 w-32 h-32 bg-brutal-blue border-4 border-brutal-black -rotate-6" />
          <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-brutal-yellow border-4 border-brutal-black rotate-45" />
          <div className="absolute bottom-32 right-1/3 w-28 h-28 bg-brutal-green border-4 border-brutal-black -rotate-12 animate-bounce-slow" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Hero Card */}
          <div className="card-brutal bg-brutal-white p-5 sm:p-7 mb-4 sm:mb-5">
            <div className="text-center mb-5 sm:mb-7">
              <div className="text-6xl sm:text-7xl mb-4 sm:mb-5 inline-block transform hover:rotate-12 transition-transform">🎯</div>
              <h1 className="text-4xl sm:text-5xl font-black text-brutal-black mb-3 uppercase tracking-tight transform -rotate-1">
                Color Match
              </h1>
              <div className="inline-block border-4 border-brutal-black bg-brutal-yellow px-4 py-2 shadow-brutal-sm transform rotate-1">
                <span className="text-brutal-black font-black text-xs sm:text-sm uppercase">Built on Celo</span>
              </div>
            </div>

            <p className="text-brutal-black text-center mb-5 sm:mb-7 text-sm sm:text-base leading-relaxed font-bold">
              Match falling circles by tapping the right color zone before they hit the bottom.
            </p>

            <Link
              href="/game"
              className="block w-full text-center px-6 py-4 sm:py-5 text-base sm:text-lg btn-brutal-primary"
            >
              Play Now
            </Link>
          </div>

          {/* Reward Info Card */}
          <div className="card-brutal bg-brutal-green p-4 sm:p-5 mb-4 sm:mb-5 transform -rotate-1">
            <p className="text-brutal-black text-sm sm:text-base font-black text-center uppercase tracking-tight">
              Daily rewards require 3+ players! Invite friends to compete!
            </p>
          </div>

          {/* Game Info Card */}
          <div className="card-brutal bg-brutal-white p-4 sm:p-5 mb-3 sm:mb-4 transform rotate-1">
            <h2 className="text-lg sm:text-xl font-black text-brutal-black mb-4 sm:mb-5 flex items-center gap-2 uppercase">
              <span className="text-2xl">💡</span> How to Play
            </h2>
            <ul className="space-y-3 sm:space-y-4 text-brutal-black text-sm sm:text-base font-bold">
              <li className="flex items-start gap-3 border-l-4 border-brutal-pink pl-3 py-1">
                <span className="text-base sm:text-lg flex-shrink-0 font-black">1</span>
                <span>Tap the matching color zone before they reach the bottom</span>
              </li>
              <li className="flex items-start gap-3 border-l-4 border-brutal-blue pl-3 py-1">
                <span className="text-base sm:text-lg flex-shrink-0 font-black">2</span>
                <span>Level up every 100 points - speed increases!</span>
              </li>
              <li className="flex items-start gap-3 border-l-4 border-brutal-yellow pl-3 py-1">
                <span className="text-base sm:text-lg flex-shrink-0 font-black">3</span>
                <span>Miss a circle or tap wrong = Game Over</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
