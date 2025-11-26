"use client";

import Link from "next/link";
import { ConnectButton } from "@/components/connect-button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="font-bold text-xl">Color Match</span>
        </Link>

        <div className="flex items-center gap-3">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
