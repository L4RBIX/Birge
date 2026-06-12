import type { ReactNode } from "react";

const stroke = "#222222";
const accent = "#007f67";
const fill = "#ffffff";
const soft = "#efefef";
const mid = "#d8d8d8";

function Stage() {
  return (
    <>
      <rect width="300" height="400" fill="#f4f4f4" />
      <ellipse cx="150" cy="338" rx="98" ry="12" fill="#e4e4e4" />
    </>
  );
}

function Headphones() {
  return (
    <g transform="translate(150, 205)">
      <path d="M-78 -58 C-78 -98 78 -98 78 -58" fill="none" stroke={stroke} strokeWidth="4" />
      <rect x="-86" y="-58" width="52" height="78" rx="22" fill={fill} stroke={stroke} strokeWidth="3" />
      <rect x="34" y="-58" width="52" height="78" rx="22" fill={fill} stroke={stroke} strokeWidth="3" />
      <rect x="-72" y="-38" width="24" height="44" rx="10" fill={soft} />
      <rect x="48" y="-38" width="24" height="44" rx="10" fill={soft} />
      <circle cx="0" cy="8" r="10" fill={accent} />
    </g>
  );
}

function Projector() {
  return (
    <g transform="translate(150, 215)">
      <rect x="-95" y="-48" width="190" height="86" rx="8" fill={fill} stroke={stroke} strokeWidth="3" />
      <circle cx="58" cy="-5" r="24" fill={soft} stroke={stroke} strokeWidth="2.5" />
      <circle cx="58" cy="-5" r="12" fill={accent} opacity="0.85" />
      <rect x="-78" y="-24" width="52" height="8" rx="2" fill={mid} />
      <rect x="-78" y="-8" width="36" height="6" rx="2" fill={mid} />
      <path d="M-95 38 H95" stroke={stroke} strokeWidth="2" />
    </g>
  );
}

function Watch() {
  return (
    <g transform="translate(150, 210)">
      <rect x="-22" y="-98" width="44" height="42" rx="10" fill={fill} stroke={stroke} strokeWidth="3" />
      <rect x="-22" y="56" width="44" height="42" rx="10" fill={fill} stroke={stroke} strokeWidth="3" />
      <circle cx="0" cy="0" r="58" fill={fill} stroke={stroke} strokeWidth="3.5" />
      <circle cx="0" cy="0" r="46" fill={soft} stroke={stroke} strokeWidth="1.5" />
      <line x1="0" y1="0" x2="0" y2="-28" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <line x1="0" y1="0" x2="22" y2="8" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="0" cy="0" r="4" fill={accent} />
    </g>
  );
}

function Battery() {
  return (
    <g transform="translate(150, 215)">
      <rect x="-52" y="-78" width="104" height="156" rx="14" fill={fill} stroke={stroke} strokeWidth="3" />
      <rect x="-24" y="-94" width="48" height="18" rx="5" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <rect x="-36" y="-18" width="72" height="14" rx="7" fill={accent} opacity="0.9" />
      <rect x="-36" y="10" width="72" height="10" rx="5" fill={mid} />
      <path d="M-20 42 H20" stroke={stroke} strokeWidth="2" />
      <path d="M58 -10 C78 10 78 50 58 70" fill="none" stroke={stroke} strokeWidth="3" />
      <circle cx="72" cy="78" r="8" fill={accent} />
    </g>
  );
}

function Vacuum() {
  return (
    <g transform="translate(150, 220)">
      <circle cx="0" cy="-10" r="72" fill={fill} stroke={stroke} strokeWidth="3.5" />
      <circle cx="0" cy="-10" r="48" fill={soft} stroke={stroke} strokeWidth="2" />
      <circle cx="28" cy="18" r="10" fill={accent} />
      <rect x="-8" y="58" width="16" height="34" fill={stroke} />
      <rect x="-30" y="88" width="60" height="10" rx="4" fill={stroke} />
    </g>
  );
}

function Organizer() {
  return (
    <g transform="translate(150, 215)">
      <rect x="-88" y="-62" width="176" height="124" rx="8" fill={fill} stroke={stroke} strokeWidth="3" />
      <line x1="-88" y1="-10" x2="88" y2="-10" stroke={stroke} strokeWidth="2" />
      <line x1="0" y1="-62" x2="0" y2="62" stroke={stroke} strokeWidth="2" />
      <rect x="-72" y="-48" width="56" height="34" rx="4" fill={soft} />
      <rect x="16" y="-48" width="56" height="34" rx="4" fill={soft} />
      <rect x="-72" y="6" width="56" height="34" rx="4" fill={soft} />
      <rect x="16" y="6" width="56" height="34" rx="4" fill={accent} opacity="0.2" stroke={accent} strokeWidth="2" />
    </g>
  );
}

function Blender() {
  return (
    <g transform="translate(150, 215)">
      <rect x="-34" y="-88" width="68" height="24" rx="8" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <path d="M-48 -64 H48 V58 C48 78 32 92 0 92 C-32 92 -48 78 -48 58 Z" fill={fill} stroke={stroke} strokeWidth="3" />
      <ellipse cx="0" cy="18" rx="30" ry="10" fill={accent} opacity="0.25" />
      <rect x="-12" y="78" width="24" height="16" rx="4" fill={stroke} />
    </g>
  );
}

function Humidifier() {
  return (
    <g transform="translate(150, 215)">
      <ellipse cx="0" cy="58" rx="54" ry="16" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <rect x="-44" y="-52" width="88" height="110" rx="40" fill={fill} stroke={stroke} strokeWidth="3" />
      <path d="M-18 -78 C-18 -98 18 -98 18 -78" fill="none" stroke={stroke} strokeWidth="2.5" />
      <path d="M-8 -90 C-8 -118 8 -118 8 -90" fill="none" stroke={accent} strokeWidth="2" opacity="0.7" />
      <path d="M8 -86 C8 -110 24 -110 24 -86" fill="none" stroke={accent} strokeWidth="2" opacity="0.5" />
      <circle cx="0" cy="8" r="14" fill={accent} opacity="0.35" />
    </g>
  );
}

function Skincare() {
  return (
    <g transform="translate(150, 220)">
      <rect x="-78" y="-18" width="36" height="72" rx="8" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <rect x="-18" y="-42" width="36" height="96" rx="8" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <rect x="42" y="-8" width="36" height="62" rx="8" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <rect x="-10" y="-54" width="20" height="14" rx="3" fill={accent} opacity="0.8" />
      <rect x="-70" y="-30" width="20" height="10" rx="3" fill={mid} />
      <rect x="50" y="-20" width="20" height="10" rx="3" fill={mid} />
    </g>
  );
}

function Styler() {
  return (
    <g transform="translate(150, 215)">
      <rect x="-88" y="-12" width="140" height="24" rx="12" fill={fill} stroke={stroke} strokeWidth="3" />
      <rect x="52" y="-6" width="36" height="84" rx="16" fill={fill} stroke={stroke} strokeWidth="3" />
      <rect x="-72" y="-4" width="48" height="16" rx="6" fill={accent} opacity="0.35" />
      <circle cx="70" cy="62" r="10" fill={accent} />
    </g>
  );
}

function Mirror() {
  return (
    <g transform="translate(150, 205)">
      <circle cx="0" cy="-18" r="72" fill={fill} stroke={stroke} strokeWidth="3.5" />
      <circle cx="0" cy="-18" r="58" fill={soft} stroke={accent} strokeWidth="2" opacity="0.9" />
      <circle cx="-20" cy="-34" r="14" fill="#ffffff" opacity="0.55" />
      <rect x="-4" y="54" width="8" height="48" fill={stroke} />
      <ellipse cx="0" cy="108" rx="42" ry="8" fill={stroke} />
    </g>
  );
}

function BeautyBox() {
  return Organizer();
}

function Basketball() {
  return (
    <g transform="translate(150, 215)">
      <circle cx="-28" cy="-8" r="58" fill={fill} stroke={stroke} strokeWidth="3" />
      <path d="M-86 -8 H30 M-28 -66 V50" stroke={stroke} strokeWidth="2" fill="none" />
      <path d="M-58 -38 C-28 -18 -28 22 -58 42" stroke={stroke} strokeWidth="2" fill="none" />
      <polygon points="58,-28 88,-8 72,28 42,28 28,-8" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <rect x="34" y="38" width="52" height="14" rx="4" fill={accent} opacity="0.35" stroke={accent} strokeWidth="1.5" />
    </g>
  );
}

function Bands() {
  return (
    <g transform="translate(150, 215)">
      <ellipse cx="-36" cy="0" rx="56" ry="34" fill="none" stroke={stroke} strokeWidth="5" />
      <ellipse cx="36" cy="8" rx="56" ry="34" fill="none" stroke={accent} strokeWidth="5" opacity="0.85" />
      <ellipse cx="0" cy="18" rx="48" ry="28" fill="none" stroke={mid} strokeWidth="4" />
    </g>
  );
}

function Shaker() {
  return (
    <g transform="translate(150, 215)">
      <rect x="-28" y="-78" width="56" height="110" rx="18" fill={fill} stroke={stroke} strokeWidth="3" />
      <rect x="-18" y="-92" width="36" height="18" rx="6" fill={fill} stroke={stroke} strokeWidth="2" />
      <rect x="44" y="-20" width="52" height="18" rx="6" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <rect x="72" y="6" width="18" height="52" rx="6" fill={accent} opacity="0.35" stroke={accent} strokeWidth="2" />
    </g>
  );
}

function Running() {
  return (
    <g transform="translate(150, 220)">
      <rect x="-78" y="-18" width="156" height="48" rx="20" fill={fill} stroke={stroke} strokeWidth="3" />
      <rect x="-10" y="-6" width="36" height="24" rx="6" fill={accent} opacity="0.35" stroke={accent} strokeWidth="2" />
      <rect x="-62" y="34" width="28" height="10" rx="3" fill={stroke} />
      <rect x="34" y="34" width="28" height="10" rx="3" fill={stroke} />
    </g>
  );
}

function Tablet() {
  return (
    <g transform="translate(150, 215)">
      <rect x="-72" y="-88" width="144" height="176" rx="16" fill={fill} stroke={stroke} strokeWidth="3.5" />
      <rect x="-58" y="-72" width="116" height="132" rx="8" fill={soft} />
      <circle cx="-34" cy="-48" r="10" fill={accent} opacity="0.8" />
      <rect x="-16" y="-52" width="44" height="10" rx="4" fill={accent} opacity="0.35" />
      <rect x="-16" y="-34" width="64" height="8" rx="3" fill={mid} />
      <rect x="-16" y="-20" width="52" height="8" rx="3" fill={mid} />
      <circle cx="0" cy="72" r="6" fill={stroke} />
    </g>
  );
}

function Monitor() {
  return (
    <g transform="translate(150, 215)">
      <rect x="-68" y="-72" width="136" height="96" rx="10" fill={fill} stroke={stroke} strokeWidth="3" />
      <rect x="-56" y="-60" width="112" height="72" rx="6" fill={soft} />
      <circle cx="40" cy="48" r="10" fill={accent} />
      <rect x="-24" y="24" width="48" height="34" rx="4" fill={fill} stroke={stroke} strokeWidth="2" />
      <rect x="-34" y="58" width="68" height="8" rx="3" fill={stroke} />
    </g>
  );
}

function Backpack() {
  return (
    <g transform="translate(150, 215)">
      <path d="M-52 -58 C-52 -92 52 -92 52 -58 V58 C52 82 28 96 0 96 C-28 96 -52 82 -52 58 Z" fill={fill} stroke={stroke} strokeWidth="3" />
      <path d="M-24 -78 C-24 -98 24 -98 24 -78" fill="none" stroke={stroke} strokeWidth="3" />
      <rect x="-18" y="-8" width="36" height="42" rx="6" fill={accent} opacity="0.25" stroke={accent} strokeWidth="2" />
      <rect x="-40" y="18" width="18" height="28" rx="4" fill={soft} stroke={stroke} strokeWidth="1.5" />
      <rect x="22" y="18" width="18" height="28" rx="4" fill={soft} stroke={stroke} strokeWidth="1.5" />
    </g>
  );
}

function Constructor() {
  return (
    <g transform="translate(150, 220)">
      <rect x="-72" y="-42" width="44" height="44" rx="4" fill="#f7c948" stroke={stroke} strokeWidth="2.5" />
      <rect x="-10" y="-18" width="44" height="44" rx="4" fill={accent} opacity="0.55" stroke={stroke} strokeWidth="2.5" />
      <rect x="30" y="-52" width="44" height="44" rx="4" fill="#6ea8fe" stroke={stroke} strokeWidth="2.5" />
      <rect x="-34" y="18" width="52" height="36" rx="4" fill="#f08c9b" stroke={stroke} strokeWidth="2.5" />
    </g>
  );
}

function Inflator() {
  return (
    <g transform="translate(150, 220)">
      <rect x="-72" y="-28" width="112" height="56" rx="20" fill={fill} stroke={stroke} strokeWidth="3" />
      <circle cx="58" cy="0" r="22" fill={soft} stroke={stroke} strokeWidth="2.5" />
      <rect x="-52" y="-8" width="36" height="16" rx="4" fill={accent} opacity="0.35" />
      <path d="M80 0 C104 0 118 18 118 38" fill="none" stroke={stroke} strokeWidth="3" />
      <circle cx="118" cy="38" r="8" fill={accent} />
    </g>
  );
}

function CarVac() {
  return (
    <g transform="translate(150, 220)">
      <rect x="-58" y="-24" width="116" height="48" rx="18" fill={fill} stroke={stroke} strokeWidth="3" />
      <rect x="-42" y="-8" width="28" height="16" rx="4" fill={accent} opacity="0.35" />
      <rect x="52" y="-10" width="34" height="20" rx="6" fill={soft} stroke={stroke} strokeWidth="2" />
      <path d="M86 0 H118" stroke={stroke} strokeWidth="3" />
      <circle cx="122" cy="0" r="8" fill={stroke} />
    </g>
  );
}

function Holder() {
  return (
    <g transform="translate(150, 215)">
      <rect x="-28" y="-72" width="56" height="96" rx="10" fill={fill} stroke={stroke} strokeWidth="3" />
      <rect x="-18" y="-62" width="36" height="64" rx="6" fill={soft} />
      <path d="M-8 24 H8 V78 H-8 Z" fill={stroke} />
      <ellipse cx="0" cy="86" rx="34" ry="8" fill={stroke} />
      <circle cx="0" cy="-28" r="8" fill={accent} />
    </g>
  );
}

function Dashcam() {
  return (
    <g transform="translate(150, 215)">
      <rect x="-58" y="-34" width="116" height="68" rx="12" fill={fill} stroke={stroke} strokeWidth="3" />
      <circle cx="28" cy="0" r="20" fill={soft} stroke={stroke} strokeWidth="2.5" />
      <circle cx="28" cy="0" r="10" fill={accent} opacity="0.8" />
      <rect x="-44" y="-16" width="36" height="10" rx="3" fill={mid} />
      <path d="M-8 34 H8 V72 H-8 Z" fill={stroke} />
    </g>
  );
}

function Jacket() {
  return (
    <g transform="translate(150, 215)">
      <path d="M-68 -72 L-28 -92 L0 -72 L28 -92 L68 -72 V72 L40 92 H-40 L-68 72 Z" fill={fill} stroke={stroke} strokeWidth="3" />
      <path d="M0 -72 V92" stroke={stroke} strokeWidth="2" />
      <rect x="-12" y="-40" width="24" height="72" fill={accent} opacity="0.18" />
      <circle cx="0" cy="-52" r="6" fill={stroke} />
    </g>
  );
}

function Shirt() {
  return (
    <g transform="translate(150, 215)">
      <path d="M-72 -48 L-28 -72 L0 -40 L28 -72 L72 -48 V78 H-72 Z" fill={fill} stroke={stroke} strokeWidth="3" />
      <path d="M0 -40 V78" stroke={stroke} strokeWidth="2" />
      <path d="M-28 -72 L-18 -20 M28 -72 L18 -20" stroke={stroke} strokeWidth="2" fill="none" />
      <rect x="-10" y="8" width="20" height="34" fill={accent} opacity="0.15" />
    </g>
  );
}

function Sneakers() {
  return (
    <g transform="translate(150, 230)">
      <path d="M-88 8 H64 C78 8 88 0 88 -12 C88 -28 72 -36 48 -36 H-20 C-48 -36 -72 -20 -82 0 Z" fill={fill} stroke={stroke} strokeWidth="3" />
      <path d="M-72 8 V18 C-72 28 -60 34 -44 34 H52" fill="none" stroke={stroke} strokeWidth="3" />
      <rect x="-48" y="-18" width="58" height="12" rx="4" fill={accent} opacity="0.35" />
      <circle cx="58" cy="-18" r="8" fill={accent} />
    </g>
  );
}

function Cap() {
  return (
    <g transform="translate(150, 215)">
      <ellipse cx="0" cy="18" rx="74" ry="20" fill={fill} stroke={stroke} strokeWidth="3" />
      <path d="M-58 18 C-58 -38 58 -38 58 18 Z" fill={fill} stroke={stroke} strokeWidth="3" />
      <path d="M58 18 C88 24 98 34 92 42 H24" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <rect x="-10" y="-28" width="20" height="8" rx="2" fill={accent} opacity="0.5" />
    </g>
  );
}

function Fallback({ label }: { label: string }) {
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <g transform="translate(150, 215)">
      <rect x="-78" y="-78" width="156" height="156" rx="18" fill={fill} stroke={stroke} strokeWidth="3" />
      <text x="0" y="12" textAnchor="middle" fontSize="42" fontWeight="700" fill={accent} fontFamily="Arial, sans-serif">
        {initials || "BG"}
      </text>
    </g>
  );
}

const shapeMap: Record<string, () => ReactNode> = {
  audio: Headphones,
  projector: Projector,
  watch: Watch,
  battery: Battery,
  vacuum: Vacuum,
  organizer: Organizer,
  blender: Blender,
  humidifier: Humidifier,
  skincare: Skincare,
  styler: Styler,
  mirror: Mirror,
  beautybox: BeautyBox,
  basketball: Basketball,
  bands: Bands,
  shaker: Shaker,
  running: Running,
  tablet: Tablet,
  monitor: Monitor,
  backpack: Backpack,
  constructor: Constructor,
  inflator: Inflator,
  carvac: CarVac,
  holder: Holder,
  dashcam: Dashcam,
  jacket: Jacket,
  shirt: Shirt,
  sneakers: Sneakers,
  cap: Cap,
};

const categoryFallback: Record<string, string> = {
  electronics: "audio",
  home: "vacuum",
  beauty: "skincare",
  sport: "basketball",
  kids: "tablet",
  auto: "carvac",
  fashion: "jacket",
};

export function resolveVisualTone(deal: {
  id: string;
  category: string;
  titleRu: string;
  visualTone?: string;
}): string {
  if (deal.visualTone && shapeMap[deal.visualTone]) return deal.visualTone;

  const slug = deal.id.toLowerCase();
  const title = deal.titleRu.toLowerCase();

  const slugRules: [RegExp, string][] = [
    [/headphone|naushnik|құлаққап/, "audio"],
    [/projector|проектор/, "projector"],
    [/watch|smartwatch/, "watch"],
    [/power-bank|power bank/, "battery"],
    [/robot-vacuum|пылесос/, "vacuum"],
    [/organizer|органайзер/, "organizer"],
    [/blender|блендер/, "blender"],
    [/humidifier|увлажн/, "humidifier"],
    [/skincare|уход/, "skincare"],
    [/styler|стайлер/, "styler"],
    [/mirror|зеркал/, "mirror"],
    [/makeup-organizer/, "beautybox"],
    [/basketball|баскетбол/, "basketball"],
    [/resistance|эспандер/, "bands"],
    [/shaker|шейкер/, "shaker"],
    [/running|бег/, "running"],
    [/tablet|планшет/, "tablet"],
    [/monitor|няня/, "monitor"],
    [/backpack|рюкзак/, "backpack"],
    [/constructor|конструктор/, "constructor"],
    [/inflator|компрессор/, "inflator"],
    [/car-vacuum|автомобильн/, "carvac"],
    [/phone-holder|держатель/, "holder"],
    [/dash-cam|регистратор/, "dashcam"],
    [/jacket|куртк/, "jacket"],
    [/shirt|рубаш/, "shirt"],
    [/sneaker|кроссов/, "sneakers"],
    [/cap|кепк/, "cap"],
  ];

  for (const [pattern, tone] of slugRules) {
    if (pattern.test(slug) || pattern.test(title)) return tone;
  }

  return categoryFallback[deal.category] ?? "audio";
}

export function ProductArt({
  tone,
  label,
}: {
  tone: string;
  label: string;
}) {
  const Shape = shapeMap[tone];

  return (
    <svg viewBox="0 0 300 400" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <Stage />
      {Shape ? <Shape /> : <Fallback label={label} />}
    </svg>
  );
}
