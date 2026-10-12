import { cn } from "@/lib/cn";

/**
 * Original hero illustration: a stylised Singapore skyline at golden hour —
 * Marina Bay Sands, the Flyer, the Supertrees and the bay — in brand colours.
 * Pure inline SVG, no raster weight, scales to any size.
 */
export function SkylineArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 560" className={cn("block h-full w-full", className)} role="img" aria-label="Illustration of the Singapore skyline at sunset" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe6d8" />
          <stop offset="0.5" stopColor="#ffc3d0" />
          <stop offset="1" stopColor="#d7ccff" />
        </linearGradient>
        <radialGradient id="sg-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff7ea" />
          <stop offset="0.45" stopColor="#ffd9c0" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffc3d0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sg-tower" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fffdfb" />
          <stop offset="0.7" stopColor="#ffe8e2" />
          <stop offset="1" stopColor="#ffcfca" />
        </linearGradient>
        <linearGradient id="sg-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd3cf" />
          <stop offset="1" stopColor="#c9bdfb" />
        </linearGradient>
        <linearGradient id="sg-tree" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff8fa6" />
          <stop offset="1" stopColor="#c978d6" />
        </linearGradient>
      </defs>

      <rect width="600" height="560" fill="url(#sg-sky)" />
      <circle cx="410" cy="330" r="150" fill="url(#sg-sun)" />

      {/* soft clouds */}
      <g fill="#fff" opacity="0.55">
        <ellipse cx="110" cy="105" rx="64" ry="14" />
        <ellipse cx="150" cy="92" rx="42" ry="12" />
        <ellipse cx="470" cy="70" rx="70" ry="12" />
        <ellipse cx="520" cy="58" rx="40" ry="10" />
      </g>

      {/* far skyline */}
      <g fill="#d9cffa" opacity="0.8">
        <rect x="0" y="352" width="42" height="70" />
        <rect x="46" y="372" width="30" height="50" />
        <rect x="80" y="338" width="26" height="84" />
        <rect x="190" y="366" width="26" height="56" />
        <rect x="420" y="352" width="30" height="70" />
        <rect x="454" y="372" width="34" height="50" />
        <rect x="560" y="340" width="40" height="82" />
      </g>

      {/* Singapore Flyer */}
      <g stroke="#fffaf6" fill="none" strokeLinecap="round" opacity="0.95">
        <circle cx="122" cy="332" r="64" strokeWidth="4" />
        <circle cx="122" cy="332" r="56" strokeWidth="1.5" opacity="0.7" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          return <line key={i} x1={122} y1={332} x2={(122 + Math.cos(a) * 64).toFixed(1)} y2={(332 + Math.sin(a) * 64).toFixed(1)} strokeWidth="1.2" opacity="0.75" />;
        })}
        <path d="M122 332 L98 424 M122 332 L146 424" strokeWidth="5" />
      </g>
      <g fill="#fffaf6">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          return <circle key={i} cx={(122 + Math.cos(a) * 64).toFixed(1)} cy={(332 + Math.sin(a) * 64).toFixed(1)} r="4.5" />;
        })}
      </g>

      {/* Marina Bay Sands */}
      <g>
        <polygon points="230,424 252,252 288,252 286,424" fill="url(#sg-tower)" />
        <polygon points="292,424 298,248 338,248 340,424" fill="url(#sg-tower)" />
        <polygon points="352,424 346,252 382,252 404,424" fill="url(#sg-tower)" />
        <g stroke="#ffcfc8" strokeWidth="1.4" opacity="0.8">
          {Array.from({ length: 12 }, (_, i) => {
            const y = 268 + i * 13;
            return (
              <g key={i}>
                <line x1={248 - (y - 252) * 0.1} y1={y} x2={287 - (y - 252) * 0.0} y2={y} />
                <line x1="298" y1={y} x2="339" y2={y} />
                <line x1="348" y1={y} x2={382 + (y - 252) * 0.12} y2={y} />
              </g>
            );
          })}
        </g>
        <path d="M206 248 C 262 230 340 224 410 234 C 440 238 426 254 394 256 L 236 260 C 208 260 194 253 206 248 Z" fill="#fffdfb" />
        <path d="M222 247 C 280 234 340 230 396 238" stroke="#ff8fa6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M236 260 L394 256" stroke="#ffcfc8" strokeWidth="2" />
      </g>

      {/* Supertrees */}
      <g>
        <g stroke="#b98ad0" strokeWidth="5" strokeLinecap="round">
          <line x1="478" y1="424" x2="480" y2="318" />
          <line x1="526" y1="424" x2="522" y2="286" />
          <line x1="568" y1="424" x2="566" y2="334" />
        </g>
        <ellipse cx="480" cy="312" rx="38" ry="22" fill="url(#sg-tree)" />
        <ellipse cx="522" cy="278" rx="46" ry="26" fill="url(#sg-tree)" />
        <ellipse cx="566" cy="328" rx="32" ry="19" fill="url(#sg-tree)" />
        <g fill="#fff" opacity="0.55">
          <circle cx="470" cy="308" r="2.5" />
          <circle cx="492" cy="316" r="2" />
          <circle cx="510" cy="272" r="2.5" />
          <circle cx="534" cy="282" r="2.2" />
          <circle cx="558" cy="324" r="2" />
        </g>
      </g>

      {/* bay */}
      <rect x="0" y="424" width="600" height="136" fill="url(#sg-water)" />
      <g stroke="#fff" strokeLinecap="round" opacity="0.55">
        <line x1="268" y1="436" x2="372" y2="436" strokeWidth="3" />
        <line x1="286" y1="448" x2="356" y2="448" strokeWidth="2.5" />
        <line x1="300" y1="460" x2="344" y2="460" strokeWidth="2" />
        <line x1="90" y1="440" x2="150" y2="440" strokeWidth="2.5" />
        <line x1="104" y1="454" x2="138" y2="454" strokeWidth="2" />
        <line x1="462" y1="438" x2="560" y2="438" strokeWidth="2.5" />
        <line x1="478" y1="452" x2="540" y2="452" strokeWidth="2" />
        <line x1="200" y1="476" x2="300" y2="476" strokeWidth="1.8" />
        <line x1="380" y1="482" x2="470" y2="482" strokeWidth="1.8" />
      </g>
      <path d="M0 520 C 100 502 180 534 300 516 C 420 498 500 530 600 508 L 600 560 L 0 560 Z" fill="#bcaff2" opacity="0.55" />
    </svg>
  );
}

/** Location pin used for floating markers over the art. `left`/`top` place the tip, not the corner. */
export function FloatPin({ tone, className, delay = "0s" }: { tone: "lost" | "found" | "gold"; className?: string; delay?: string }) {
  const c = { lost: "#e11d48", found: "#2b4fdb", gold: "#f59e0b" }[tone];
  return (
    <span aria-hidden className={cn("absolute -translate-x-1/2 -translate-y-full animate-float", className)} style={{ animationDelay: delay }}>
      <span className="absolute left-1/2 top-[88%] block h-2 w-6 -translate-x-1/2 rounded-full bg-navy-900/15 blur-[2px]" />
      <svg viewBox="0 0 40 52" width="40" height="52" className="relative drop-shadow-lg">
        <path d="M20 51 C 8 36 2 28 2 19 a 18 18 0 1 1 36 0 c 0 9 -6 17 -18 32 Z" fill={c} />
        <circle cx="20" cy="19" r="8" fill="#fff" />
      </svg>
    </span>
  );
}
