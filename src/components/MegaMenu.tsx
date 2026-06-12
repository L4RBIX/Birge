import { cn } from "@/lib/utils";
import type { MegaMenuContent } from "@/types/farfetch";

interface MegaMenuProps {
  menu: MegaMenuContent;
  open: boolean;
  onClose?: () => void;
}

export function MegaMenu({ menu, open, onClose }: MegaMenuProps) {
  return (
    <>
      {/* Scrim — starts below the 124px header so the nav bar remains hoverable */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 bg-[rgba(34,34,34,0.4)] z-[150] transition-opacity duration-150",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{ top: "124px" }}
        aria-hidden="true"
        onMouseEnter={() => onClose?.()}
      />

      {/* Panel */}
      <div
        className={cn(
          "absolute left-0 w-screen bg-white z-[200] transition-opacity duration-150",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        role="region"
        aria-hidden={!open}
      >
        <div className="max-w-[1392px] mx-auto px-[24px] py-[24px]">
          <div
            className="grid gap-x-[12px]"
            style={{
              gridTemplateColumns: menu.spotlight
                ? "920px 460px"
                : "1fr",
            }}
          >
            {/* Links area */}
            <div
              className="grid gap-x-[12px] gap-y-[36px]"
              style={{
                gridTemplateColumns: "repeat(3, 1fr)",
              }}
            >
              {menu.columns.map((col, colIdx) => (
                <div key={colIdx}>
                  <h3
                    className="text-[15px] font-bold text-[rgb(34,34,34)] mb-[12px] h-[34px] leading-[34px] truncate"
                  >
                    {col.heading}
                  </h3>
                  <ul>
                    {col.links.map((link, linkIdx) => (
                      <li key={linkIdx}>
                        <a
                          href={link.href}
                          className="block text-[15px] font-normal text-[rgb(34,34,34)] h-[34px] py-[6px] leading-[22px] hover:underline ff-transition"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Spotlight */}
            {menu.spotlight && (
              <article className="flex flex-col gap-[12px] pt-[24px] pb-[16px]">
                <p className="text-[15px] font-bold text-[rgb(34,34,34)]">
                  Spotlight on
                </p>
                <img
                  src={menu.spotlight.image}
                  alt={menu.spotlight.label}
                  className="w-full aspect-[4/3] object-cover"
                />
                {menu.spotlight.label && (
                  <p className="text-[15px] uppercase text-[rgb(34,34,34)]">
                    {menu.spotlight.label}
                  </p>
                )}
                <a
                  href={menu.spotlight.href}
                  className="text-[15px] font-bold underline text-[rgb(34,34,34)] hover:text-[rgb(34,34,34)] ff-transition"
                >
                  Shop Now
                </a>
              </article>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
