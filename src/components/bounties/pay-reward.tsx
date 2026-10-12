"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { paymentMethods } from "@/lib/data/taxonomy";
import { formatMoney } from "@/lib/format";
import type { Bounty, PaymentMethod, User } from "@/lib/types";
import { Button } from "../ui/button";
import { Chip } from "../ui/form";
import { Overlay } from "../ui/overlay";

/** How a reward changed hands — PayNow, PayLah!, cash or bank transfer. */
export function PaymentMethodPicker({ value, onChange, label }: { value: PaymentMethod | null; onChange: (v: PaymentMethod) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {paymentMethods.map((m) => (
        <Chip key={m.id} tone="gold" active={value === m.id} onClick={() => onChange(m.id)}>
          {m.label}
        </Chip>
      ))}
    </div>
  );
}

/**
 * The owner confirms they have their item back and says how they paid the finder.
 * The money goes straight from one member to the other — we only record it.
 */
export function PayRewardDialog({
  open,
  onClose,
  bounty,
  finder,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  bounty: Bounty;
  finder: User;
  onConfirm: (paidVia: PaymentMethod) => void;
}) {
  const [via, setVia] = useState<PaymentMethod | null>(null);
  const first = finder.name.split(" ")[0];
  const label = `How did you pay ${first}?`;

  return (
    <Overlay
      open={open}
      onClose={onClose}
      title={`Got it back? Pay ${first} ${formatMoney(bounty.amount)}`}
      description={`Pay ${first} directly once the item is in your hands — wewillfind.it never holds or moves your money.`}
    >
      <div className="mt-4">
        <p className="mb-2.5 text-sm font-extrabold text-navy-900">{label}</p>
        <PaymentMethodPicker value={via} onChange={setVia} label={label} />
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>
            Not yet
          </Button>
          <Button
            variant="success"
            size="lg"
            className="flex-[1.3]"
            disabled={!via}
            iconLeft={<BadgeCheck className="size-5" aria-hidden />}
            onClick={() => {
              if (!via) return;
              onClose();
              onConfirm(via);
            }}
          >
            Received &amp; paid
          </Button>
        </div>
      </div>
    </Overlay>
  );
}
