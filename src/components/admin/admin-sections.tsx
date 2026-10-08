"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Ban, CheckCheck, Coins, Eye, EyeOff, Flag, ShieldAlert, Sparkles, Trash2, UserRoundCheck, UserRoundX } from "lucide-react";
import { cn } from "@/lib/cn";
import { getLocation } from "@/lib/data/taxonomy";
import { formatMoney } from "@/lib/format";
import { mockMatchingService } from "@/lib/matching";
import { useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import { toast } from "@/lib/store/events";
import type { Claim, Item, ModerationState, Report, ReportStatus } from "@/lib/types";
import { UserLevel } from "../community/level";
import { MatchScore } from "../items/matches-section";
import { UserAvatar } from "../ui/avatar";
import { Pill, StatusBadge } from "../ui/badges";
import { Button } from "../ui/button";
import { Chip, SearchInput } from "../ui/form";
import { ItemImage } from "../ui/item-image";
import { RelativeTime } from "../ui/meta";
import { EmptyState } from "../ui/states";

function Panel({ title, subtitle, toolbar, children }: { title: string; subtitle?: string; toolbar?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby="admin-h">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="admin-h" className="text-3xl font-extrabold text-navy-900">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-navy-600">{subtitle}</p>}
        </div>
      </header>
      {toolbar && <div className="mt-5">{toolbar}</div>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

const MOD_LABEL: Record<ModerationState, { label: string; tone: "mint" | "gold" | "coral" | "neutral" }> = {
  ok: { label: "Live", tone: "mint" },
  hidden: { label: "Hidden", tone: "gold" },
  removed: { label: "Removed", tone: "neutral" },
  fraud: { label: "Fraudulent", tone: "coral" },
};

/* ── Overview ─────────────────────────────────────────────── */

export function AdminOverview() {
  const w = useWorld();
  const open = w.reports.filter((r) => r.status === "open");
  const flagged = w.claims.filter((c) => c.status === "flagged");
  const hidden = w.items.filter((i) => i.moderation === "hidden" || i.moderation === "fraud");
  const cards = [
    { href: "/admin/reports", label: "Open reports", n: open.length, tone: "bg-coral-100 text-coral-700", icon: Flag },
    { href: "/admin/bounties", label: "Flagged claims", n: flagged.length, tone: "bg-gold-100 text-gold-800", icon: Coins },
    { href: "/admin/posts", label: "Hidden or fraudulent posts", n: hidden.length, tone: "bg-navy-100 text-navy-700", icon: EyeOff },
    { href: "/admin/users", label: "Suspended users", n: w.users.filter((u) => u.suspended).length, tone: "bg-violet-100 text-violet-700", icon: UserRoundX },
  ];
  return (
    <Panel title="Needs attention" subtitle="A short list. Everything else is running smoothly.">
      <ul className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <li key={c.href}>
            <Link href={c.href} className="flex items-center gap-4 rounded-card bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
              <span className={cn("flex size-14 items-center justify-center rounded-2xl", c.tone)}>
                <c.icon className="size-7" aria-hidden />
              </span>
              <span>
                <span className="block text-4xl font-extrabold tabular-nums leading-none text-navy-900">{c.n}</span>
                <span className="mt-1 block text-sm font-semibold text-navy-600">{c.label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="mt-10 text-xl font-extrabold text-navy-900">Latest reports</h2>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-card bg-white shadow-soft">
        {w.reports.slice(0, 4).map((r) => (
          <li key={r.id} className="flex items-center gap-3 p-4">
            <Pill tone={r.status === "open" ? "coral" : r.status === "reviewing" ? "gold" : "neutral"}>{r.status}</Pill>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-navy-800">
              {r.reason} · <span className="font-medium text-navy-500">{r.detail}</span>
            </p>
            <RelativeTime iso={r.at} className="text-xs text-navy-400" />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ── Posts ────────────────────────────────────────────────── */

export function PostsSection() {
  const w = useWorld();
  const [q, setQ] = useState("");
  const [f, setF] = useState<"all" | ModerationState>("all");
  const rows = useMemo(
    () =>
      [...w.items]
        .sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt))
        .filter((i) => (f === "all" ? true : i.moderation === f))
        .filter((i) => !q || `${i.title} ${w.userById.get(i.ownerId)?.name ?? ""}`.toLowerCase().includes(q.toLowerCase())),
    [w, q, f],
  );
  const set = (i: Item, m: ModerationState) => {
    actions.setModeration(i.id, m);
    toast(m === "ok" ? "Post restored" : m === "hidden" ? "Post hidden" : m === "removed" ? "Post removed" : "Marked as fraudulent", { body: i.title, tone: "info" });
  };
  return (
    <Panel
      title="Posts"
      subtitle={`${w.items.length} listings`}
      toolbar={
        <div className="space-y-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search by title or poster…" label="Search posts" />
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {(["all", "ok", "hidden", "fraud", "removed"] as const).map((k) => (
              <Chip key={k} active={f === k} onClick={() => setF(k)} className="!h-9">
                {k === "all" ? "All" : MOD_LABEL[k].label}
              </Chip>
            ))}
          </div>
        </div>
      }
    >
      {rows.length === 0 ? (
        <EmptyState icon={<Eye className="size-9" aria-hidden />} title="No posts match" body="Try a different search or filter." />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card bg-white shadow-soft">
          {rows.slice(0, 40).map((i) => {
            const owner = w.userById.get(i.ownerId);
            const m = MOD_LABEL[i.moderation];
            return (
              <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
                <ItemImage image={i.images[0]} category={i.category} compact className="size-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 basis-56">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge type={i.type} pet={i.category === "pets"} resolved={i.status === "resolved"} variant="soft" />
                    <Pill tone={m.tone}>{m.label}</Pill>
                  </div>
                  <p className="mt-1 truncate text-[0.95rem] font-extrabold text-navy-900">
                    <Link href={`/item/${i.slug}`} className="hover:underline">
                      {i.title}
                    </Link>
                  </p>
                  <p className="text-xs text-navy-500">
                    {owner?.name} · {getLocation(i.locationId).name} · <RelativeTime iso={i.postedAt} />
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {i.moderation === "ok" ? (
                    <Button size="sm" variant="secondary" iconLeft={<EyeOff className="size-4" aria-hidden />} onClick={() => set(i, "hidden")}>
                      Hide
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" iconLeft={<Eye className="size-4" aria-hidden />} onClick={() => set(i, "ok")}>
                      Restore
                    </Button>
                  )}
                  {i.moderation !== "fraud" && (
                    <Button size="sm" variant="soft" iconLeft={<ShieldAlert className="size-4" aria-hidden />} onClick={() => set(i, "fraud")}>
                      Mark fraud
                    </Button>
                  )}
                  {i.moderation !== "removed" && (
                    <Button size="sm" variant="ghost" iconLeft={<Trash2 className="size-4" aria-hidden />} onClick={() => set(i, "removed")}>
                      Remove
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/* ── Users ────────────────────────────────────────────────── */

export function UsersSection() {
  const w = useWorld();
  const [q, setQ] = useState("");
  const rows = w.users.filter((u) => u.role !== "admin" && (!q || `${u.name} ${u.handle}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <Panel title="Users" subtitle={`${rows.length} members`} toolbar={<SearchInput value={q} onChange={setQ} placeholder="Search by name or username…" label="Search users" />}>
      <div className="overflow-x-auto rounded-card bg-white shadow-soft">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-line text-xs font-bold uppercase tracking-wider text-navy-400">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Returned</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((u) => (
              <tr key={u.id} className={u.suspended ? "bg-coral-50/40" : undefined}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={u} size="sm" tick />
                    <div>
                      <Link href={`/user/${u.handle}`} className="font-extrabold text-navy-900 hover:underline">
                        {u.name}
                      </Link>
                      <p className="text-xs text-navy-500">@{u.handle}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <UserLevel points={u.points.allTime} tone="plain" />
                </td>
                <td className="px-4 py-3 font-bold tabular-nums">{u.rating.toFixed(1)}</td>
                <td className="px-4 py-3 font-bold tabular-nums">{u.stats.itemsReturned}</td>
                <td className="px-4 py-3">{u.suspended ? <Pill tone="coral">Suspended</Pill> : u.verified ? <Pill tone="mint">Verified</Pill> : <Pill>Unverified</Pill>}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant={u.suspended ? "secondary" : "soft"}
                    iconLeft={u.suspended ? <UserRoundCheck className="size-4" aria-hidden /> : <Ban className="size-4" aria-hidden />}
                    onClick={() => {
                      actions.setSuspended(u.id, !u.suspended);
                      toast(u.suspended ? "User reinstated" : "User suspended", { body: u.name, tone: "info" });
                    }}
                  >
                    {u.suspended ? "Reinstate" : "Suspend"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ── Reports ──────────────────────────────────────────────── */

function ReportCard({ r }: { r: Report }) {
  const w = useWorld();
  const reporter = w.userById.get(r.reporterId);
  const item = r.targetType === "item" ? w.itemById.get(r.targetId) : undefined;
  const user = r.targetType === "user" ? w.userById.get(r.targetId) : undefined;
  const claim = r.targetType === "claim" ? w.claimById.get(r.targetId) : undefined;
  const set = (s: ReportStatus) => actions.setReportStatus(r.id, s);

  const act = () => {
    if (item) actions.setModeration(item.id, "hidden");
    if (user) actions.setSuspended(user.id, true);
    if (claim) actions.setClaimStatus(claim.id, "flagged");
    set("actioned");
    toast("Action taken", { body: item ? "Post hidden" : user ? "User suspended" : "Claim flagged", tone: "success" });
  };

  return (
    <li className="rounded-card bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={r.status === "open" ? "coral" : r.status === "reviewing" ? "gold" : r.status === "actioned" ? "mint" : "neutral"}>{r.status}</Pill>
        <Pill tone="neutral">{r.targetType}</Pill>
        <p className="text-[0.95rem] font-extrabold text-navy-900">{r.reason}</p>
        <RelativeTime iso={r.at} className="ml-auto text-xs text-navy-400" />
      </div>
      {r.detail && <p className="mt-3 rounded-xl bg-navy-50 p-3 text-sm leading-relaxed text-navy-700">“{r.detail}”</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-navy-600">
        <span>
          Reported by <strong className="text-navy-900">{reporter?.name ?? "anonymous"}</strong>
        </span>
        {item && (
          <Link href={`/item/${item.slug}`} className="font-bold text-found-700 hover:underline">
            View post: {item.title}
          </Link>
        )}
        {user && (
          <Link href={`/user/${user.handle}`} className="font-bold text-found-700 hover:underline">
            View profile: {user.name}
          </Link>
        )}
        {claim && (
          <span className="font-semibold text-coral-800">
            Claim by {w.userById.get(claim.claimantId)?.name}: “{claim.message.slice(0, 80)}…”
          </span>
        )}
      </div>
      {(r.status === "open" || r.status === "reviewing") && (
        <div className="mt-4 flex flex-wrap gap-2">
          {r.status === "open" && (
            <Button size="sm" variant="secondary" onClick={() => set("reviewing")}>
              Start review
            </Button>
          )}
          <Button size="sm" variant="primary" onClick={act} iconLeft={<ShieldAlert className="size-4" aria-hidden />}>
            {item ? "Hide post" : user ? "Suspend user" : "Flag claim"} &amp; resolve
          </Button>
          <Button size="sm" variant="ghost" onClick={() => set("dismissed")}>
            Dismiss
          </Button>
        </div>
      )}
    </li>
  );
}

export function ReportsSection() {
  const w = useWorld();
  const [f, setF] = useState<"all" | ReportStatus>("all");
  const rows = w.reports.filter((r) => f === "all" || r.status === f).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return (
    <Panel
      title="Reports"
      subtitle="Reviewed by people, never by bots alone."
      toolbar={
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {(["all", "open", "reviewing", "actioned", "dismissed"] as const).map((k) => (
            <Chip key={k} active={f === k} onClick={() => setF(k)} className="!h-9 capitalize" count={k === "all" ? undefined : w.reports.filter((r) => r.status === k).length}>
              {k}
            </Chip>
          ))}
        </div>
      }
    >
      {rows.length === 0 ? <EmptyState icon={<CheckCheck className="size-9" aria-hidden />} title="Inbox zero" body="No reports in this view." tone="found" /> : <ul className="space-y-3">{rows.map((r) => <ReportCard key={r.id} r={r} />)}</ul>}
    </Panel>
  );
}

/* ── Bounties & claims ────────────────────────────────────── */

function ClaimRow({ c }: { c: Claim }) {
  const w = useWorld();
  const u = w.userById.get(c.claimantId);
  return (
    <li className={cn("rounded-2xl border p-4", c.status === "flagged" ? "border-coral-200 bg-coral-50/60" : "border-line bg-white")}>
      <div className="flex flex-wrap items-center gap-3">
        {u && <UserAvatar user={u} size="sm" tick />}
        <p className="font-extrabold text-navy-900">{u?.name}</p>
        <Pill tone={c.status === "flagged" ? "coral" : c.status === "approved" || c.status === "received" ? "mint" : c.status === "rejected" ? "neutral" : "gold"}>{c.status.replace("_", " ")}</Pill>
        <RelativeTime iso={c.createdAt} className="ml-auto text-xs text-navy-400" />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-navy-700">“{c.message}”</p>
      {c.status !== "received" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {c.status !== "flagged" && (
            <Button size="sm" variant="soft" iconLeft={<ShieldAlert className="size-4" aria-hidden />} onClick={() => actions.setClaimStatus(c.id, "flagged", "Flagged by moderators — suspicious")}>
              Flag as suspicious
            </Button>
          )}
          {c.status === "flagged" && (
            <Button size="sm" variant="secondary" onClick={() => actions.setClaimStatus(c.id, "submitted")}>
              Clear flag
            </Button>
          )}
          {c.status !== "rejected" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                actions.setClaimStatus(c.id, "rejected", "Resolved by moderators");
                toast("Dispute resolved", { body: "Claim declined and bounty reopened.", tone: "success" });
              }}
            >
              Resolve dispute
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

export function BountiesSection() {
  const w = useWorld();
  const flaggedCount = (id: string) => w.claims.filter((c) => c.bountyId === id && c.status === "flagged").length;
  const claimCount = (id: string) => w.claims.filter((c) => c.bountyId === id).length;
  const rows = w.bounties
    .filter((b) => w.itemById.get(b.itemId))
    .sort((a, b) => flaggedCount(b.id) - flaggedCount(a.id) || claimCount(b.id) - claimCount(a.id) || b.amount - a.amount);
  return (
    <Panel title="Bounties" subtitle="Review suspicious claims and resolve disputes.">
      <ul className="space-y-4">
        {rows.map((b) => {
          const item = w.itemById.get(b.itemId)!;
          const claims = w.claims.filter((c) => c.bountyId === b.id);
          const flagged = claims.some((c) => c.status === "flagged");
          return (
            <li key={b.id} className={cn("rounded-card bg-white p-5 shadow-soft", flagged && "ring-2 ring-coral-300")}>
              <div className="flex flex-wrap items-center gap-4">
                <ItemImage image={item.images[0]} category={item.category} compact className="size-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 basis-48">
                  <Link href={`/item/${item.slug}`} className="block truncate text-[0.98rem] font-extrabold text-navy-900 hover:underline">
                    {item.title}
                  </Link>
                  <p className="text-xs text-navy-500">
                    Owner: {w.userById.get(item.ownerId)?.name} · {claims.length} claim{claims.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Pill tone={b.status === "released" ? "mint" : b.status === "open" ? "gold" : "found"}>{b.status}</Pill>
                <p className="text-xl font-extrabold tabular-nums text-navy-900">{formatMoney(b.amount)}</p>
              </div>
              {claims.length > 0 && (
                <ul className="mt-4 space-y-3">
                  {claims.map((c) => (
                    <ClaimRow key={c.id} c={c} />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* ── Matches ──────────────────────────────────────────────── */

export function MatchesAdmin() {
  const w = useWorld();
  const rows = useMemo(() => {
    const live = w.items.filter((i) => i.moderation === "ok" && i.status === "active");
    return live
      .filter((i) => i.type === "lost")
      .flatMap((l) => mockMatchingService.getMatches(l, live).map((m) => ({ m, lost: l, found: w.itemById.get(m.foundItemId)! })))
      .filter((x) => x.found && x.m.score >= 70)
      .sort((a, b) => b.m.score - a.m.score);
  }, [w]);
  return (
    <Panel title="Matches" subtitle="High-confidence pairs surfaced by the matching service (mock engine).">
      {rows.length === 0 ? (
        <EmptyState icon={<Sparkles className="size-9" aria-hidden />} title="No strong matches" body="New pairs show up here as listings arrive." />
      ) : (
        <ul className="space-y-3">
          {rows.map(({ m, lost, found }) => (
            <li key={m.id} className="flex flex-wrap items-center gap-4 rounded-card bg-white p-4 shadow-soft">
              <MatchScore score={m.score} />
              <div className="min-w-0 flex-1 basis-64 text-sm">
                <p className="font-extrabold text-navy-900">
                  <Link href={`/item/${lost.slug}`} className="hover:underline">{lost.title}</Link>
                  <span className="mx-2 font-medium text-navy-400">↔</span>
                  <Link href={`/item/${found.slug}`} className="hover:underline">{found.title}</Link>
                </p>
                <p className="mt-0.5 text-xs text-navy-500">
                  {w.userById.get(lost.ownerId)?.name} (lost) · {w.userById.get(found.ownerId)?.name} (found) · {m.reasons.join(", ")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ── Resolved ─────────────────────────────────────────────── */

export function ResolvedSection() {
  const w = useWorld();
  const rows = w.items.filter((i) => i.status === "resolved").sort((a, b) => Date.parse(b.resolvedAt ?? b.postedAt) - Date.parse(a.resolvedAt ?? a.postedAt));
  return (
    <Panel title="Resolved items" subtitle={`${rows.length} reunited`}>
      {rows.length === 0 ? (
        <EmptyState icon={<CheckCheck className="size-9" aria-hidden />} title="Nothing reunited yet" body="Resolved listings appear here." />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card bg-white shadow-soft">
          {rows.map((i) => {
            const helper = i.resolvedWithUserId ? w.userById.get(i.resolvedWithUserId) : undefined;
            const b = i.bountyId ? w.bountyById.get(i.bountyId) : undefined;
            return (
              <li key={i.id} className="flex flex-wrap items-center gap-4 p-4">
                <ItemImage image={i.images[0]} category={i.category} compact className="size-12 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 basis-56">
                  <Link href={`/item/${i.slug}`} className="block truncate text-[0.95rem] font-extrabold text-navy-900 hover:underline">
                    {i.title}
                  </Link>
                  <p className="text-xs text-navy-500">
                    {helper ? `Returned via ${helper.name}` : "Resolved"} · <RelativeTime iso={i.resolvedAt ?? i.postedAt} />
                  </p>
                </div>
                {b?.status === "released" && <Pill tone="gold">{formatMoney(b.amount)} released</Pill>}
                <Pill tone="mint">Reunited</Pill>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
