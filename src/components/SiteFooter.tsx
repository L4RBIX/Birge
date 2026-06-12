import Link from "next/link";
import { MastercardLogo, VisaLogo } from "@/components/icons";

const footerColumns = [
  {
    heading: "Для презентации",
    links: [
      { label: "Start scenario", href: "/onboarding" },
      { label: "Live demo", href: "/deal/demo" },
      { label: "Security architecture", href: "/security" },
      { label: "Profile", href: "/profile" },
    ],
  },
  {
    heading: "Birge",
    links: ["Deals", "How it works", "Cities", "Live demo"].map((label) => ({
      label,
      href: label === "Live demo" ? "/deal/demo" : "/#deals",
    })),
  },
  {
    heading: "Trust",
    links: ["SIM ID Security", "Escrow", "Auto-refund", "Anti-fraud"].map((label) => ({
      label,
      href: label === "SIM ID Security" ? "/security" : "/#deal-detail",
    })),
  },
  {
    heading: "Categories",
    links: ["Electronics", "Home", "Beauty", "Sport", "Kids", "Auto"].map((label) => ({
      label,
      href: "/#deals",
    })),
  },
  {
    heading: "Account",
    links: ["Profile", "My deals", "Saved money", "RU / KZ"].map((label) => ({
      label,
      href: label === "Profile" ? "/profile" : "/#deals",
    })),
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-white">
      {/* Top divider */}
      <hr className="border-t border-ff-hairline mb-[12px]" />

      {/* Payment methods */}
      <div className="max-w-[1440px] mx-auto px-[24px] pt-[4px] pb-[16px]">
        <h2 className="text-[15px] font-bold leading-5">
          Payment methods
        </h2>
        <div className="flex flex-wrap gap-[16px] mt-[12px]">
          <MastercardLogo
            className="w-[48px] h-[30px] border border-ff-hairline"
          />
          <VisaLogo
            className="w-[48px] h-[30px] border border-ff-hairline"
          />
          <span className="inline-flex h-[30px] items-center border border-ff-hairline px-[12px] text-[13px] font-bold text-[#d71920]">
            Kaspi mock
          </span>
        </div>
      </div>

      {/* Gray block */}
      <div className="w-full bg-ff-bg-gray py-[24px]">
        {/* Navigation columns */}
        <nav className="max-w-[1440px] mx-auto px-[24px] grid grid-cols-5 max-[1023px]:grid-cols-2 max-[479px]:grid-cols-1 gap-[24px]">
          {footerColumns.map((col) => (
            <div key={col.heading}>
              <h2 className="text-[15px] font-bold leading-5 mb-[7px]">
                {col.heading}
              </h2>
              <ul>
                {col.links.map((link) => (
                  <li key={`${col.heading}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="block text-[15px] py-[6px] h-[34px] text-[rgb(34,34,34)] hover:underline leading-[22px]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Divider inside gray block */}
        <hr className="border-t border-white mt-[24px]" />

        {/* Legal area */}
        <div className="max-w-[1440px] mx-auto px-[24px] pt-[24px]">
          <div className="flex flex-wrap gap-[24px]">
            {[
              { label: "Privacy Policy", href: "#" },
              { label: "Terms of use", href: "#" },
              { label: "Accessibility", href: "#" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[15px] underline text-[rgb(34,34,34)]"
              >
                {link.label}
              </a>
            ))}
          </div>
          <p className="text-[13px] leading-[17px] mt-[18px] text-[rgb(34,34,34)]">
            Birge is a hackathon demo for SIM-backed group buying in Kazakhstan.
          </p>
          <p className="text-[13px] leading-[17px] mt-[4px] pb-[24px] text-[rgb(34,34,34)]">
            © 2026 Birge. Premium group deals with telecom trust.
          </p>
        </div>
      </div>

      {/* Very bottom dark bar */}
      <div className="h-[40px] bg-[rgb(34,34,34)] w-full" />
    </footer>
  );
}
