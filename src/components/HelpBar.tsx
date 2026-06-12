import type { HelpBarItem } from "@/types/farfetch";
import {
  HangerIcon,
  QuestionMarkCircleIcon,
  BubbleIcon,
} from "@/components/icons";

function getIcon(icon: HelpBarItem["icon"]) {
  switch (icon) {
    case "hanger":
      return <HangerIcon className="w-6 h-6 text-[rgb(34,34,34)]" />;
    case "question":
      return <QuestionMarkCircleIcon className="w-6 h-6 text-[rgb(34,34,34)]" />;
    case "bubble":
      return <BubbleIcon className="w-6 h-6 text-[rgb(34,34,34)]" />;
  }
}

export function HelpBar({ items }: { items: HelpBarItem[] }) {
  return (
    <div className="max-w-[1440px] mx-auto px-[24px]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-[24px] gap-y-[16px] mt-[54px] mb-[54px]">
        {items.map((item) => (
          <article
            key={item.href}
            className="h-[110px] border border-ff-gray-mid bg-white flex flex-col gap-[8px] p-[16px]"
          >
            <div>{getIcon(item.icon)}</div>
            <div className="flex flex-col gap-[4px]">
              <a
                href={item.href}
                className="text-[15px] leading-5 uppercase text-[rgb(34,34,34)] hover:underline"
              >
                {item.title}
              </a>
              <p className="text-[15px] leading-5 text-[rgb(34,34,34)]">
                {item.body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
