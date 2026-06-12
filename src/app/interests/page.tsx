"use client";

import Link from "next/link";
import { useState } from "react";
import { getCurrentUser, saveCurrentUser } from "@/lib/user-store";

const interests = [
  "Электроника",
  "Дом",
  "Красота",
  "Спорт",
  "Детям",
  "Авто",
  "Одежда",
  "Гаджеты",
  "Кухня",
  "Хобби",
];

export default function InterestsPage() {
  const [selected, setSelected] = useState<string[]>(["Электроника", "Дом"]);

  function toggle(item: string) {
    setSelected((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    );
  }

  function handleContinue() {
    const currentUser = getCurrentUser();
    if (currentUser) {
      saveCurrentUser({
        ...currentUser,
        interests: selected.map((i) => i.toLowerCase()),
      });
    }
  }

  return (
    <main className="min-h-dvh bg-white px-[24px] py-[32px] text-[rgb(34,34,34)]">
      <section className="mx-auto max-w-[720px]">
        <Link href="/" className="text-[24px] leading-none font-bold tracking-[0.18em]">
          BIRGE
        </Link>
        <h1 className="mt-[40px] text-[34px] leading-[40px] font-normal">
          Выберите интересы
        </h1>
        <p className="mt-[12px] max-w-[560px] text-[15px] leading-5 text-ff-gray-text">
          Birge использует интересы, город и бюджет, чтобы собрать персональную ленту сделок.
        </p>
        <p className="mt-[12px] text-[15px] leading-5 font-bold text-[#007f67]">
          {Math.min(selected.length, 3)}/3 минимум
        </p>
        <div className="mt-[28px] grid grid-cols-2 gap-[10px] sm:grid-cols-3">
          {interests.map((item) => {
            const active = selected.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                className={
                  active
                    ? "h-[50px] border border-[#007f67] px-[14px] text-[15px] font-bold text-[#007f67]"
                    : "h-[50px] border border-ff-hairline px-[14px] text-[15px] font-bold text-[rgb(34,34,34)]"
                }
              >
                {item}
              </button>
            );
          })}
        </div>
        <div className="mt-[28px] border-y border-ff-hairline py-[18px]">
          <p className="text-[15px] leading-5 font-bold">
            Рекомендации = интересы + город + бюджет + скорость набора группы
          </p>
          <p className="mt-[8px] text-[13px] leading-[17px] text-ff-gray-text">
            Формула MVP: score = 0.40 interestMatch + 0.20 budgetFit + 0.20 cityMatch + 0.20 momentum.
            В проде этот слой можно заменить на learning-to-rank.
          </p>
        </div>
        <Link
          href="/"
          onClick={handleContinue}
          aria-disabled={selected.length < 3}
          className={
            selected.length >= 3
              ? "mt-[24px] flex h-[50px] w-full items-center justify-center bg-[rgb(34,34,34)] px-[16px] text-[15px] font-bold text-white"
              : "mt-[24px] flex h-[50px] w-full pointer-events-none items-center justify-center bg-[rgb(34,34,34)] px-[16px] text-[15px] font-bold text-white opacity-40"
          }
        >
          Показать мои сделки
        </Link>
      </section>
    </main>
  );
}
