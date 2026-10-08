import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import type { User } from "@/lib/types";

const sizes = {
  xs: { box: "size-6 text-[0.6rem]", tick: "size-3" },
  sm: { box: "size-8 text-xs", tick: "size-3.5" },
  md: { box: "size-10 text-sm", tick: "size-4" },
  lg: { box: "size-14 text-lg", tick: "size-5" },
  xl: { box: "size-20 text-2xl", tick: "size-6" },
  "2xl": { box: "size-28 text-4xl", tick: "size-7" },
} as const;

export type AvatarSize = keyof typeof sizes;

type Props = {
  user: Pick<User, "name" | "hue" | "avatarSrc" | "verified">;
  size?: AvatarSize;
  /** Show the verified tick in the corner */
  tick?: boolean;
  /** Decorative ring (e.g. level colour or "you") */
  ring?: "coral" | "gold" | "white" | "none";
  className?: string;
};

/**
 * Generated avatar — a hue-seeded gradient with initials. Real photos can be
 * provided via `user.avatarSrc`. Deliberately no stock faces.
 */
export function UserAvatar({ user, size = "md", tick, ring = "none", className }: Props) {
  const s = sizes[size];
  const h = user.hue;
  const ringCls = {
    none: "",
    coral: "ring-2 ring-coral-500 ring-offset-2 ring-offset-white",
    gold: "ring-2 ring-gold-400 ring-offset-2 ring-offset-white",
    white: "ring-[3px] ring-white",
  }[ring];
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {user.avatarSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL
        <img src={user.avatarSrc} alt="" className={cn("rounded-full object-cover", s.box, ringCls)} />
      ) : (
        <span
          aria-hidden
          className={cn("inline-flex items-center justify-center rounded-full font-extrabold text-white", s.box, ringCls)}
          style={{ backgroundImage: `linear-gradient(135deg, hsl(${h} 62% 48%), hsl(${(h + 38) % 360} 66% 38%))` }}
        >
          {initials(user.name)}
        </span>
      )}
      {tick && user.verified && (
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-px">
          <BadgeCheck className={cn("fill-found-100 text-found-700", s.tick)} aria-hidden />
        </span>
      )}
    </span>
  );
}

export function AvatarStack({ users, max = 4, size = "sm" }: { users: User[]; max?: number; size?: AvatarSize }) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <span className="inline-flex items-center">
      {shown.map((u, i) => (
        <span key={u.id} className={cn("rounded-full ring-2 ring-white", i > 0 && "-ml-2")}>
          <UserAvatar user={u} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span className="-ml-2 inline-flex size-8 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700 ring-2 ring-white">
          +{extra}
        </span>
      )}
    </span>
  );
}
