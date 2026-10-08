"use client";

import { useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import type { NotificationType } from "@/lib/types";
import { notificationsFor } from "@/lib/world";
import { Button } from "../ui/button";
import { Tabs } from "../ui/form";
import { Container } from "../ui/section";
import { EmptyState } from "../ui/states";
import { NotificationItem } from "./notification-item";

type Tab = "all" | "match" | "bounty" | "comment" | "update";

const GROUP: Record<NotificationType, Tab> = { match: "match", bounty: "bounty", comment: "comment", update: "update", kudos: "update" };
const EMPTY: Record<Tab, { title: string; body: string }> = {
  all: { title: "You're all caught up", body: "We'll let you know about matches, bounty claims, comments and kudos." },
  match: { title: "No matches yet", body: "When someone posts something that looks like yours, it shows up here." },
  bounty: { title: "No bounty activity", body: "Claims, approvals and released rewards appear here." },
  comment: { title: "No comments yet", body: "Comments on your posts show up here." },
  update: { title: "No updates", body: "Returns, kudos and moderation notices appear here." },
};

export function NotificationsView() {
  const w = useWorld();
  const me = w.currentUser;
  const [tab, setTab] = useState<Tab>("all");
  const all = useMemo(() => (me ? notificationsFor(w, me.id) : []), [w, me]);
  const count = (t: Tab) => all.filter((n) => !n.read && (t === "all" || GROUP[n.type] === t)).length;
  const list = tab === "all" ? all : all.filter((n) => GROUP[n.type] === tab);
  const unread = count("all");

  if (!me) {
    return (
      <Container className="py-16">
        <EmptyState icon={<Bell className="size-9" aria-hidden />} title="Log in to see notifications" body="We'll tell you the moment there's a match, a claim or a message." tone="coral" action={<Button href="/login?next=/notifications">Log in</Button>} />
      </Container>
    );
  }

  return (
    <Container className="max-w-3xl pb-6 pt-8 sm:pt-12">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-coral-700">Inbox</p>
          <h1 className="mt-2 text-3xl font-extrabold text-navy-900 sm:text-4xl">Notifications</h1>
        </div>
        <Button variant="secondary" size="sm" disabled={unread === 0} onClick={() => actions.markAllNotificationsRead()} iconLeft={<CheckCheck className="size-4" aria-hidden />}>
          Mark all read
        </Button>
      </header>

      <Tabs<Tab>
        label="Notification categories"
        idPrefix="notif"
        value={tab}
        onChange={setTab}
        className="mt-6"
        tabs={[
          { value: "all", label: "All", count: count("all") || undefined },
          { value: "match", label: "Matches", count: count("match") || undefined },
          { value: "bounty", label: "Bounties", count: count("bounty") || undefined },
          { value: "comment", label: "Comments", count: count("comment") || undefined },
          { value: "update", label: "Updates", count: count("update") || undefined },
        ]}
      />

      <div id={`notif-panel-${tab}`} role="tabpanel" aria-labelledby={`notif-${tab}`} className="mt-4 overflow-hidden rounded-card bg-white shadow-soft">
        {list.length === 0 ? (
          <EmptyState icon={<Bell className="size-9" aria-hidden />} title={EMPTY[tab].title} body={EMPTY[tab].body} tone="coral" action={<Button href="/explore">Explore listings</Button>} />
        ) : (
          <ul className="divide-y divide-line">
            {list.map((n) => (
              <NotificationItem key={n.id} n={n} />
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}
