const bannerMessages: { text: string; href: string }[] = [
  {
    text: "Собери группу — получи опт.",
    href: "#deals",
  },
  {
    text: "1 SIM = 1 место. Реальные покупатели, честный счетчик.",
    href: "/security",
  },
  {
    text: "Деньги удерживаются в эскроу. Если группа не собралась — авто-возврат.",
    href: "#deal-detail",
  },
];

export function BannerStrip() {
  return (
    <div
      className="w-full relative z-[210] overflow-hidden"
      style={{ height: "30px" }}
      aria-live="polite"
    >
      <ul className="grid h-full" style={{ gridTemplateColumns: "1fr" }}>
        {bannerMessages.map((msg, i) => (
          <li
            key={i}
            className="row-start-1 col-start-1 bg-[rgb(34,34,34)] text-white flex items-center justify-center"
            style={{
              fontSize: "13px",
              lineHeight: "17px",
              animation: `ff-banner-fade 15s infinite`,
              animationDelay: `${i * 5}s`,
              opacity: i === 0 ? 1 : 0,
            }}
          >
            <a
              href={msg.href}
              className="block w-full text-center text-white underline overflow-hidden whitespace-nowrap text-ellipsis px-[48px] py-[6px]"
              style={{ fontSize: "13px", lineHeight: "17px" }}
            >
              {msg.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
