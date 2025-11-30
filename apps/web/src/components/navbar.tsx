"use client";

import Link from "next/link";
import { ConnectButton } from "@/components/connect-button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-brutal-white border-b-4 border-brutal-black">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 group"
        >
          <span className="font-black text-xl sm:text-2xl text-brutal-black uppercase tracking-tight transform group-hover:-rotate-2 transition-transform">
            Color Match
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
