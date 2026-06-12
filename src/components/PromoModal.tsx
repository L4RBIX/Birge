"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CrossIcon } from "@/components/icons";
import { promoModal } from "@/lib/content";

export function PromoModal() {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    sessionStorage.setItem("ff-promo-seen", "1");
    setVisible(false);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("ff-promo-seen")) return;

    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, 800);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismiss();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dismiss, visible]);

  function handleCtaClick() {
    sessionStorage.setItem("ff-promo-seen", "1");
    setVisible(false);
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      dismiss();
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[500] bg-[rgba(34,34,34,0.4)] flex items-center justify-center transition-opacity duration-200 opacity-100"
      onClick={handleOverlayClick}
      aria-label="Promotional offer overlay"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-modal-title"
        className="relative bg-white w-[400px] max-w-[calc(100vw-32px)]"
      >
        {/* Close button — positioned above the image */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-0 right-0 w-[44px] h-[44px] flex items-center justify-center z-10"
        >
          <CrossIcon className="w-6 h-6 text-[rgb(34,34,34)]" />
        </button>

        {/* Hero image */}
        <img
          src={promoModal.image}
          alt=""
          className="w-full aspect-[600/240] object-cover"
        />

        {/* Text content */}
        <div className="p-[24px] text-center">
          <h2
            id="promo-modal-title"
            className="text-[22px] leading-[28px] font-normal text-[rgb(34,34,34)]"
          >
            {promoModal.title}
          </h2>
          <p className="text-[15px] leading-5 mt-[8px]">
            {promoModal.body}
          </p>

          {/* Button row */}
          <div className="mt-[24px] flex gap-[12px]">
            <button
              type="button"
              onClick={dismiss}
              className="flex-1 h-[44px] bg-white border border-[rgb(34,34,34)] text-[15px] font-bold text-[rgb(34,34,34)] hover:bg-[rgb(34,34,34)] hover:text-white ff-transition"
            >
              {promoModal.dismissLabel}
            </button>
            <a
              href={promoModal.ctaHref}
              onClick={handleCtaClick}
              className="flex-1 h-[44px] flex items-center justify-center bg-[rgb(34,34,34)] text-white text-[15px] font-bold hover:opacity-80 ff-transition"
            >
              {promoModal.ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
