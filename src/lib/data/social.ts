import { DAY, HOUR, MIN, ago } from "../clock";
import type {
  AppNotification,
  Claim,
  Conversation,
  Kudos,
  Message,
  PointsTransaction,
  Report,
} from "../types";

/* Item / bounty ids follow the `make()` convention in items.ts */
const WALLET = "itm_brown_leather_wallet_tampines_mall";
const KEYS = "itm_toyota_car_keys_punggol_waterway";
const IPHONE = "itm_iphone_14_pro_orchard";

/* ── Claims ───────────────────────────────────────────────── */

export const seedClaims: Claim[] = [
  {
    id: "clm_wallet_cheryl",
    bountyId: "bty_brown_leather_wallet_tampines_mall",
    itemId: WALLET,
    claimantId: "u_cheryl",
    status: "submitted",
    proof: [
      { file: "claim-wallet-cheryl-1.jpg", label: "Wallet sitting beside the Tampines Mall customer service counter" },
      { file: "claim-wallet-cheryl-2.jpg", label: "Folded family photo behind the wallet's ID slot" },
    ],
    message:
      "Hi Dylan! I found your wallet beside the escalators outside NTUC. There's an EZ-Link card and a folded photo of two older folks behind the ID slot. It's at the Level 1 customer service counter — I'll wait there.",
    createdAt: ago(40 * MIN),
    conversationId: "conv_wallet",
  },
  {
    id: "clm_iphone_weilin",
    bountyId: "bty_iphone_14_pro_orchard",
    itemId: IPHONE,
    claimantId: "u_weilin",
    status: "submitted",
    proof: [
      { file: "claim-iphone-weilin-1.jpg", label: "Purple iPhone 14 Pro on a platform bench" },
      { file: "claim-iphone-weilin-2.jpg", label: "Back of the phone showing the sticker" },
    ],
    message:
      "Hi Priya, I picked up a purple iPhone 14 Pro on the Marina Bay-bound platform at Orchard on Tuesday morning. Clear case, small sticker on the back. It's locked so I couldn't see the wallpaper. Happy to meet at Orchard MRT.",
    createdAt: ago(95 * MIN),
    conversationId: "conv_iphone",
  },
  {
    id: "clm_iphone_flag",
    bountyId: "bty_iphone_14_pro_orchard",
    itemId: IPHONE,
    claimantId: "u_vikram",
    status: "flagged",
    proof: [],
    message: "I have your phone. Send S$100 first via PayNow and I will return it tomorrow, trust me.",
    createdAt: ago(5 * HOUR),
    ownerNote: "Flagged by moderators — asks for payment before returning.",
  },
];

/* ── Conversations ────────────────────────────────────────── */

let n = 0;
const msg = (
  conversationId: string,
  senderId: string,
  agoMs: number,
  m: Partial<Message> & Pick<Message, "kind">,
): Message => ({ id: `${conversationId}_m${++n}`, conversationId, senderId, at: ago(agoMs), ...m });

export const seedConversations: Conversation[] = [
  {
    id: "conv_keys",
    itemId: KEYS,
    participantIds: ["u_dylan", "u_joel"],
    readAt: { u_dylan: ago(40 * MIN) },
    messages: [
      msg("conv_keys", "u_joel", 2 * HOUR + 12 * MIN, {
        kind: "text",
        text: "Hi! I think those are my keys! Can I confirm the key pouch colour?",
      }),
      msg("conv_keys", "u_dylan", 2 * HOUR + 4 * MIN, {
        kind: "text",
        text: "Sure! It's a black Toyota key with 2 buttons and a small red tag.",
      }),
      msg("conv_keys", "u_dylan", 2 * HOUR + 3 * MIN, {
        kind: "photo",
        photo: { file: "chat-keys-1.jpg", label: "Toyota key with two buttons in a black pouch with a red tag" },
      }),
      msg("conv_keys", "u_joel", 1 * HOUR + 48 * MIN, {
        kind: "text",
        text: "Yes!! That's mine 🙏 I dropped them while jogging this morning. Can I come get them today?",
      }),
      msg("conv_keys", "u_dylan", 1 * HOUR + 40 * MIN, {
        kind: "text",
        text: "Of course. How about Punggol MRT (Exit A) at 6 PM? It's public and well-lit.",
      }),
      msg("conv_keys", "u_joel", 55 * MIN, { kind: "text", text: "Perfect, see you there. I'll be in a grey cap." }),
    ],
  },
  {
    id: "conv_wallet",
    itemId: WALLET,
    participantIds: ["u_dylan", "u_cheryl"],
    claimId: "clm_wallet_cheryl",
    readAt: {},
    messages: [
      msg("conv_wallet", "u_cheryl", 40 * MIN, {
        kind: "text",
        text: "Hi Dylan! I found a dark-brown wallet by the Tampines Mall escalators. I think it's yours.",
      }),
      msg("conv_wallet", "u_cheryl", 39 * MIN, {
        kind: "photo",
        photo: { file: "chat-wallet-1.jpg", label: "Brown wallet on the Level 1 service counter" },
      }),
      msg("conv_wallet", "u_cheryl", 38 * MIN, {
        kind: "text",
        text: "I haven't opened it past checking for ID. I'm at the Level 1 counter wearing a yellow top.",
      }),
    ],
  },
  {
    id: "conv_returned",
    itemId: "itm_iphone_14_black_orchard_returned",
    participantIds: ["u_dylan", "u_nicole"],
    readAt: { u_dylan: ago(2 * DAY) },
    returned: true,
    messages: [
      msg("conv_returned", "u_nicole", 3 * DAY, { kind: "text", text: "OMG is this my phone?? I lost it Sunday evening at Orchard." }),
      msg("conv_returned", "u_dylan", 3 * DAY - 6 * MIN, { kind: "text", text: "Maybe! What's your lock screen photo?" }),
      msg("conv_returned", "u_nicole", 3 * DAY - 9 * MIN, { kind: "text", text: "My dog Mochi in a yellow raincoat 😅" }),
      msg("conv_returned", "u_dylan", 3 * DAY - 12 * MIN, { kind: "quick", text: "I've found your item" }),
      msg("conv_returned", "u_dylan", 2 * DAY + 2 * HOUR, { kind: "location", locationId: "orchard-mrt", text: "Meeting at Orchard MRT customer service counter" }),
      msg("conv_returned", "u_nicole", 2 * DAY + HOUR, { kind: "text", text: "Got it back!! You are a lifesaver. Thank you so, so much 🥹" }),
      msg("conv_returned", "u_dylan", 2 * DAY, { kind: "system", text: "Item returned · +50 points" }),
    ],
  },
  {
    id: "conv_iphone",
    itemId: IPHONE,
    participantIds: ["u_priya", "u_weilin"],
    claimId: "clm_iphone_weilin",
    readAt: {},
    messages: [
      msg("conv_iphone", "u_weilin", 95 * MIN, {
        kind: "text",
        text: "Hi Priya, I think I found your phone at Orchard MRT on Tuesday morning. Purple iPhone 14 Pro, clear case, small sticker on the back.",
      }),
      msg("conv_iphone", "u_weilin", 94 * MIN, {
        kind: "photo",
        photo: { file: "chat-iphone-1.jpg", label: "Purple iPhone 14 Pro with a clear case" },
      }),
      msg("conv_iphone", "u_weilin", 92 * MIN, { kind: "text", text: "It's locked, so I can't see the wallpaper. Can you describe the sticker?" }),
    ],
  },
  {
    id: "conv_airpods",
    itemId: "itm_airpods_3rd_gen_bugis_found",
    participantIds: ["u_jasmine", "u_daniel"],
    readAt: { u_jasmine: ago(5 * HOUR) },
    messages: [
      msg("conv_airpods", "u_daniel", 5 * HOUR, { kind: "text", text: "Hi! Are these AirPods Pro? I lost mine at Bugis last night." }),
      msg("conv_airpods", "u_jasmine", 4 * HOUR + 30 * MIN, {
        kind: "text",
        text: "These are 3rd gen, not Pro — sorry! There's no ear-tip on them. Hope you find yours.",
      }),
    ],
  },
];

/* ── Notifications ────────────────────────────────────────── */

let nn = 0;
const note = (userId: string, agoMs: number, p: Omit<AppNotification, "id" | "userId" | "at" | "read"> & { read?: boolean }): AppNotification => ({
  id: `ntf_${++nn}`,
  userId,
  at: ago(agoMs),
  read: p.read ?? false,
  ...p,
});

export const seedNotifications: AppNotification[] = [
  note("u_dylan", 35 * MIN, {
    type: "match",
    title: "🎯 New potential match for your lost wallet",
    body: "A brown leather wallet was found near Tampines Mall — 92% match.",
    href: "/item/brown-leather-wallet-tampines-found",
    itemId: "itm_brown_leather_wallet_tampines_found",
  }),
  note("u_dylan", 40 * MIN, {
    type: "bounty",
    title: "💰 S$50 bounty claim received",
    body: "Cheryl L. says she found your wallet. Review her proof.",
    href: "/messages/conv_wallet",
    itemId: WALLET,
  }),
  note("u_dylan", 55 * MIN, {
    type: "update",
    title: "💬 Joel T. replied about the Toyota car keys",
    body: "“Perfect, see you there. I'll be in a grey cap.”",
    href: "/messages/conv_keys",
    itemId: KEYS,
  }),
  note("u_dylan", 3 * HOUR, {
    type: "kudos",
    title: "❤️ Amanda W. thanked you",
    body: "“Super helpful and responsive!” · +20 points",
    href: "/user/dylan",
    read: true,
  }),
  note("u_dylan", 5 * HOUR, {
    type: "comment",
    title: "💬 Bryan T. commented on your post",
    body: "“Hope the owner sees this — such a lovely thing to do.” on Car keys (Toyota)",
    href: "/item/toyota-car-keys-punggol-waterway",
    itemId: KEYS,
  }),
  note("u_dylan", 5 * HOUR, {
    type: "update",
    title: "👀 Your wallet post was viewed 56 times",
    body: "Share it to reach more people around Tampines.",
    href: "/item/brown-leather-wallet-tampines-mall",
    itemId: WALLET,
    read: true,
  }),
  note("u_dylan", 2 * DAY, {
    type: "update",
    title: "🎉 Your item has been marked as returned",
    body: "iPhone 14 (Black) found its way home. +50 points",
    href: "/item/iphone-14-black-orchard-returned",
    read: true,
  }),
  note("u_dylan", 2 * DAY + HOUR, {
    type: "bounty",
    title: "💰 Your claim was approved",
    body: "The owner verified your claim for the iPhone 14 (Black).",
    href: "/messages/conv_returned",
    read: true,
  }),
  note("u_dylan", 3 * DAY, {
    type: "match",
    title: "🎯 You helped confirm a match",
    body: "Thanks for confirming the iPhone 14 (Black). +10 points",
    href: "/item/iphone-14-black-orchard-returned",
    read: true,
  }),

  note("u_priya", 95 * MIN, {
    type: "bounty",
    title: "💰 S$200 bounty claim received",
    body: "Wei Lin C. says she found your iPhone 14 Pro.",
    href: "/messages/conv_iphone",
    itemId: IPHONE,
  }),
  note("u_priya", 2 * HOUR, {
    type: "match",
    title: "🎯 New potential match for your lost iPhone",
    body: "iPhone 14 Pro — Purple, found at Orchard MRT · 95% match.",
    href: "/item/iphone-14-pro-purple-orchard-found",
  }),
  note("u_priya", 5 * HOUR, {
    type: "update",
    title: "🛡️ A suspicious claim was blocked",
    body: "Our moderators removed a claim that asked for payment first. Never pay a finder in advance.",
    href: "/item/iphone-14-pro-orchard",
    itemId: IPHONE,
  }),

  note("u_marcus", 3 * HOUR, {
    type: "match",
    title: "🎯 Potential match for your iPad Air",
    body: "No match yet — we'll keep looking and notify you.",
    href: "/item/ipad-air-apple-pencil-changi",
  }),
];

/* ── Kudos ────────────────────────────────────────────────── */

export const seedKudos: Kudos[] = [
  { id: "k1", fromUserId: "u_amanda", toUserId: "u_dylan", tone: "heart", message: "Super helpful and responsive!", at: ago(3 * HOUR) },
  { id: "k2", fromUserId: "u_nicole", toUserId: "u_dylan", tone: "thumb", message: "Made the return really easy.", at: ago(2 * DAY) },
  { id: "k3", fromUserId: "u_sarah", toUserId: "u_dylan", tone: "star", message: "Really kind person.", at: ago(6 * DAY) },
  { id: "k4", fromUserId: "u_marcus", toUserId: "u_dylan", tone: "heart", message: "Sorted my EZ-Link in 20 minutes. Legend.", at: ago(12 * DAY) },
  { id: "k5", fromUserId: "u_cheryl", toUserId: "u_dylan", tone: "thumb", message: "Met me at the MRT counter — very safe and friendly.", at: ago(20 * DAY) },
  { id: "k6", fromUserId: "u_priya", toUserId: "u_jasmine", tone: "star", message: "Found my earbuds within an hour of posting!", at: ago(4 * DAY) },
  { id: "k7", fromUserId: "u_aisha", toUserId: "u_jasmine", tone: "heart", message: "The kindest and fastest finder in Orchard.", at: ago(9 * DAY) },
  { id: "k8", fromUserId: "u_cheryl", toUserId: "u_marcus", tone: "heart", message: "Returned my Kånken within the hour. Hero.", at: ago(5 * DAY) },
  { id: "k9", fromUserId: "u_rachel", toUserId: "u_amanda", tone: "heart", message: "Waffles is home because of you. Thank you.", at: ago(2 * DAY) },
  { id: "k10", fromUserId: "u_kenji", toUserId: "u_weilin", tone: "thumb", message: "Quick, honest and so polite.", at: ago(7 * DAY) },
];

/* ── Points history ───────────────────────────────────────── */

export const seedPoints: PointsTransaction[] = [
  { id: "p1", userId: "u_dylan", kind: "post_found", points: 10, label: "Posted a found item · Car keys (Toyota)", at: ago(4 * HOUR), itemId: KEYS },
  { id: "p2", userId: "u_dylan", kind: "thank_you", points: 20, label: "Received thank you from Amanda W.", at: ago(3 * HOUR) },
  { id: "p3", userId: "u_dylan", kind: "bounty_return", points: 50, label: "Returned iPhone 14 (Black) to owner", at: ago(2 * DAY), itemId: "itm_iphone_14_black_orchard_returned" },
  { id: "p4", userId: "u_dylan", kind: "confirm_match", points: 10, label: "Helped confirm a match", at: ago(3 * DAY) },
  { id: "p5", userId: "u_dylan", kind: "post_found", points: 10, label: "Found AirPods (3rd Gen)", at: ago(7 * DAY) },
  { id: "p6", userId: "u_dylan", kind: "return", points: 30, label: "Marked item as returned · Car keys (Toyota)", at: ago(9 * DAY) },
  { id: "p7", userId: "u_dylan", kind: "thank_you", points: 20, label: "Received thank you from Sarah N.", at: ago(6 * DAY) },
  { id: "p8", userId: "u_dylan", kind: "profile_complete", points: 10, label: "Completed your profile", at: ago(560 * DAY) },
];

/* ── Reports (moderation queue) ───────────────────────────── */

export const seedReports: Report[] = [
  {
    id: "rep_1",
    targetType: "claim",
    targetId: "clm_iphone_flag",
    reporterId: "u_priya",
    reason: "Scam / asks for money",
    detail: "They asked me to PayNow S$100 before returning the phone.",
    status: "open",
    at: ago(4 * HOUR),
  },
  {
    id: "rep_2",
    targetType: "user",
    targetId: "u_vikram",
    reporterId: "u_weilin",
    reason: "Spam or duplicate",
    detail: "Posted the same claim on three different lost phones.",
    status: "reviewing",
    at: ago(1 * DAY),
  },
  {
    id: "rep_3",
    targetType: "item",
    targetId: "itm_hdb_keys_doraemon_yishun",
    reporterId: "u_sarah",
    reason: "Spam or duplicate",
    detail: "Looks like a duplicate of my found-keys post.",
    status: "open",
    at: ago(1 * DAY + 3 * HOUR),
  },
  {
    id: "rep_4",
    targetType: "item",
    targetId: "itm_airpods_pro_bugis",
    reporterId: "u_jasmine",
    reason: "Wrong information",
    detail: "The listing says Bugis MRT but mentions the DTL platform at Little India.",
    status: "dismissed",
    at: ago(2 * DAY),
  },
];
