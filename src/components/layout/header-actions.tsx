"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ListChecks, LogOut, MessageCircle, Shield, ShieldCheck, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { useWorld } from "@/lib/store/hooks";
import { toast } from "@/lib/store/events";
import { forgetWorld, refreshWorld } from "@/lib/store/store";
import { conversationsFor, notificationsFor, unreadCount } from "@/lib/world";
import { UserLevel } from "../community/level";
import { UserAvatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { DropdownMenu, MenuButton, MenuDivider, MenuLink } from "../ui/dropdown";
import { PostButton } from "./post-chooser";

function CountDot({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="absolute right-1 top-1 flex min-w-[1.1rem] items-center justify-center rounded-full bg-coral-600 px-1 text-[0.62rem] font-extrabold leading-[1.1rem] text-white ring-2 ring-white">
      {n > 9 ? "9+" : n}
      <span className="sr-only"> unread</span>
    </span>
  );
}

const iconBtn = "relative inline-flex size-11 items-center justify-center rounded-full text-navy-700 transition-colors hover:bg-navy-100";

export function HeaderActions() {
  const w = useWorld();
  const router = useRouter();
  const me = w.currentUser;

  if (!me) {
    return (
      <div className="flex items-center gap-2">
        <Button href="/login" variant="ghost" size="sm" className="max-sm:hidden">
          Log in
        </Button>
        <Button href="/signup" size="sm">
          Sign up
        </Button>
      </div>
    );
  }

  const unreadNotes = notificationsFor(w, me.id).filter((n) => !n.read).length;
  const unreadChats = conversationsFor(w, me.id).filter((c) => unreadCount(c, me.id) > 0).length;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <PostButton size="sm" className="max-lg:hidden" />
      <Link href="/messages" aria-label="Messages" className={cn(iconBtn, "max-sm:hidden")}>
        <MessageCircle className="size-[1.4rem]" aria-hidden />
        <CountDot n={unreadChats} />
      </Link>
      <Link href="/notifications" aria-label="Notifications" className={iconBtn}>
        <Bell className="size-[1.4rem]" aria-hidden />
        <CountDot n={unreadNotes} />
      </Link>

      <DropdownMenu
        label="Account menu"
        buttonClassName="rounded-full p-0.5 transition-shadow hover:shadow-soft"
        button={<UserAvatar user={me} size="md" tick />}
      >
        <div className="flex items-center gap-3 rounded-xl bg-navy-50 p-3">
          <UserAvatar user={me} size="lg" tick />
          <div className="min-w-0">
            <p className="truncate text-[0.98rem] font-extrabold text-navy-900">{me.name}</p>
            <UserLevel points={me.points.allTime} className="mt-1" />
          </div>
        </div>
        <div className="mt-2">
          <MenuLink href={`/user/${me.handle}`} icon={<UserRound className="size-[1.15rem]" />}>
            My profile
          </MenuLink>
          <MenuLink href="/my-posts" icon={<ListChecks className="size-[1.15rem]" />}>
            My posts
          </MenuLink>
          <MenuLink href="/messages" icon={<MessageCircle className="size-[1.15rem]" />} badge={unreadChats ? <span className="rounded-full bg-coral-600 px-1.5 text-[0.65rem] font-extrabold text-white">{unreadChats}</span> : null}>
            Messages
          </MenuLink>
          <MenuLink href="/safety" icon={<ShieldCheck className="size-[1.15rem]" />}>
            Safety &amp; trust
          </MenuLink>
          {me.role === "admin" && (
            <MenuLink href="/admin" icon={<Shield className="size-[1.15rem]" />}>
              Moderation
            </MenuLink>
          )}
        </div>
        <MenuDivider />
        <MenuButton
          danger
          icon={<LogOut className="size-[1.15rem]" />}
          onClick={async () => {
            await authClient.signOut();
            forgetWorld();
            await refreshWorld(true);
            toast("You've been logged out", { tone: "info" });
            router.push("/");
          }}
        >
          Log out
        </MenuButton>
      </DropdownMenu>
    </div>
  );
}
