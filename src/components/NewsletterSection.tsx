"use client";

import { newsletter } from "@/lib/content";

export function NewsletterSection() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const [legalBefore, legalAfter] = newsletter.legal.split("Privacy Policy");

  return (
    <div className="max-w-[1440px] mx-auto px-[24px]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px] pb-[64px]">
        {/* Left column */}
        <div>
          <h2 className="text-[30px] leading-[38px] font-normal text-[rgb(34,34,34)]">
            {newsletter.heading}
          </h2>
          <p className="text-[15px] leading-5 text-[rgb(34,34,34)] mt-[12px]">
            {newsletter.body}
          </p>
        </div>

        {/* Right column */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <p className="text-[15px] leading-5 uppercase text-[rgb(34,34,34)]">
            {newsletter.updatesLabel}
          </p>
          <p className="text-[15px] leading-5 text-[rgb(34,34,34)] mt-[12px]">
            {newsletter.methodLabel}
          </p>

          <div className="mt-[8px] w-[300px] lg:w-[300px] max-w-[343px] h-[44px] border border-ff-gray-mid">
            <input
              type="email"
              className="w-full h-[42px] pl-[16px] text-[15px] outline-none placeholder:text-ff-gray-mid bg-white"
              placeholder={newsletter.placeholder}
            />
          </div>

          <button
            type="submit"
            className="mt-[16px] h-[44px] px-[16px] py-[10px] bg-[rgb(34,34,34)] text-white text-[15px] font-bold w-fit hover:opacity-80 ff-transition"
          >
            {newsletter.buttonLabel}
          </button>

          <p className="text-[15px] leading-5 text-[rgb(34,34,34)] mt-[16px]">
            {legalBefore}
            <a
              href={newsletter.privacyHref}
              className="underline"
            >
              Privacy Policy
            </a>
            {legalAfter}
          </p>
        </form>
      </div>
    </div>
  );
}
