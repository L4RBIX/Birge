"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { categoryNav } from "@/lib/birge-content";
import {
  KzFlagIcon,
  UserIcon,
  BagIcon,
  MagnifierIcon,
} from "@/components/icons";

export function SiteHeader({ activeCategory = "all" }: { activeCategory?: string }) {
  const [language, setLanguage] = useState<"RU" | "KZ">("RU");

  return (
    <header
      className="sticky top-0 z-[200] h-[68px] max-[479px]:h-[44px] lg:h-[124px] bg-white"
    >
      <div className="max-w-[1440px] mx-auto px-[24px]">

        {/* ROW 1 — h-[68px]: city tabs + logo + trust utilities */}
        <div
          className="hidden lg:grid items-center"
          style={{
            height: "68px",
            gridTemplateColumns: "1fr 201px 1fr",
            gap: "24px",
          }}
        >
          {/* Left: city tabs */}
          <nav aria-label="City selection">
            <ul className="flex -ml-[12px]">
              {[
                { label: "Алматы", active: true },
                { label: "Астана", active: false },
                { label: "Шымкент", active: false },
              ].map((tab) => (
                <li key={tab.label}>
                  <a
                    href="#deals"
                    className={cn(
                      "flex items-center h-[44px] px-[12px] py-[10px] text-[15px] text-[rgb(34,34,34)] hover:underline ff-transition",
                      tab.active ? "font-bold" : "font-normal"
                    )}
                  >
                    {tab.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Center: Birge logo */}
          <div className="flex items-center justify-center">
            <Link href="/" aria-label="Birge homepage." className="text-[rgb(34,34,34)]">
              <span className="block text-[32px] leading-none font-bold tracking-[0.18em]">
                BIRGE
              </span>
            </Link>
          </div>

          {/* Right: utility icons */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              className="flex items-center justify-center gap-[6px] h-[44px] px-[10px] text-[rgb(34,34,34)] ff-transition"
              aria-label="Language and region"
              onClick={() => setLanguage((current) => (current === "RU" ? "KZ" : "RU"))}
            >
              <KzFlagIcon className="w-6 h-6" />
              <span className="text-[13px] font-bold">{language}</span>
            </button>
            <Link
              href="/profile"
              className="flex items-center justify-center w-[44px] h-[44px] text-[rgb(34,34,34)] ff-transition"
              aria-label="Profile page."
            >
              <UserIcon className="w-6 h-6" />
            </Link>
            <Link
              href="/security"
              className="flex items-center justify-center w-[44px] h-[44px] text-[rgb(34,34,34)] ff-transition"
              aria-label="SIM ID Security."
            >
              <span className="text-[13px] font-bold text-[#007f67]">SIM</span>
            </Link>
            <Link
              href="/deal/demo"
              className="flex items-center justify-center w-[44px] h-[44px] text-[rgb(34,34,34)] ff-transition"
              aria-label="Live deal demo."
            >
              <BagIcon className="w-6 h-6" />
            </Link>
            <Link
              href="/onboarding"
              className="ml-[8px] flex h-[44px] items-center justify-center border border-[rgb(34,34,34)] px-[14px] text-[13px] font-bold text-[rgb(34,34,34)] ff-transition hover:bg-[rgb(34,34,34)] hover:text-white"
            >
              Начать
            </Link>
          </div>
        </div>

        {/* ROW 2 — h-[56px]: nav + search (desktop only) */}
        <div
          className="hidden lg:grid items-center"
          style={{
            height: "56px",
            gridTemplateColumns: "1fr 270px",
            gap: "24px",
          }}
        >
          {/* Left: nav items */}
          <nav aria-label="Navigation menu">
            <ul className="flex -ml-[12px]">
              {[...categoryNav, { label: "How it works", value: "how", href: "/#how-it-works" }, { label: "Security", value: "security", href: "/security" }].map((item) => (
                <li key={item.label} className="relative">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center h-[44px] px-[12px] py-[10px] text-[15px] font-normal hover:underline ff-transition",
                      activeCategory === item.value ? "text-[#007f67] font-bold" : "text-[rgb(34,34,34)]"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right: search */}
          <div
            className="grid items-center h-[44px] border-b border-[rgb(34,34,34)]"
            style={{ gridTemplateColumns: "44px 1fr" }}
          >
            <button
              type="button"
              className="flex items-center justify-center w-[32px] h-[32px] text-ff-gray-mid"
              aria-label="Search"
            >
              <MagnifierIcon className="w-6 h-6" />
            </button>
            <input
              type="search"
              className="h-[42px] text-[15px] outline-none border-0 bg-transparent pr-[16px] placeholder:text-ff-gray-mid"
              placeholder="Искать сделку, категорию или город"
              aria-label="Search"
            />
          </div>
        </div>

        {/* MOBILE ROW — visible < lg */}
        <div
          className="flex lg:hidden items-center justify-between h-[68px] max-[479px]:h-[44px]"
        >
          {/* Left: hamburger */}
          <button
            type="button"
            className="flex items-center justify-center w-[44px] h-[44px] text-[rgb(34,34,34)]"
            aria-label="Navigation menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="3" y="7.25" width="18" height="1.5" rx="0.75" />
              <rect x="3" y="11.25" width="18" height="1.5" rx="0.75" />
              <rect x="3" y="15.25" width="18" height="1.5" rx="0.75" />
            </svg>
          </button>

          {/* Left-center: search */}
          <button
            type="button"
            className="flex items-center justify-center w-[44px] h-[44px] text-[rgb(34,34,34)]"
            aria-label="Search"
          >
            <MagnifierIcon className="w-6 h-6" />
          </button>

          {/* Center: logo */}
          <Link
            href="/"
            aria-label="Birge homepage."
            className="absolute left-1/2 -translate-x-1/2"
          >
            <span className="block text-[20px] max-[479px]:text-[18px] leading-none font-bold tracking-[0.16em]">
              BIRGE
            </span>
          </Link>

          {/* Right: security + profile */}
          <div className="flex items-center">
            <Link
              href="/security"
              className="flex items-center justify-center w-[44px] h-[44px] text-[rgb(34,34,34)]"
              aria-label="SIM ID Security."
            >
              <span className="text-[12px] font-bold text-[#007f67]">SIM</span>
            </Link>
            <Link
              href="/profile"
              className="flex items-center justify-center w-[44px] h-[44px] text-[rgb(34,34,34)]"
              aria-label="Profile page."
            >
              <UserIcon className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
