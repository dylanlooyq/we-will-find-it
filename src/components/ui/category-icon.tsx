import {
  Backpack,
  FileText,
  KeyRound,
  Package,
  PawPrint,
  Shirt,
  Smartphone,
  Wallet,
  Watch,
  type LucideProps,
} from "lucide-react";
import type { IconKey } from "@/lib/types";

const map: Record<IconKey, React.ComponentType<LucideProps>> = {
  smartphone: Smartphone,
  wallet: Wallet,
  key: KeyRound,
  backpack: Backpack,
  watch: Watch,
  shirt: Shirt,
  file: FileText,
  paw: PawPrint,
  package: Package,
};

export function CategoryIcon({ icon, ...props }: { icon: IconKey } & LucideProps) {
  const Icon = map[icon] ?? Package;
  return <Icon aria-hidden {...props} />;
}
