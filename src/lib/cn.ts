type ClassValue = string | number | false | null | undefined | ClassValue[];

/** Tiny className joiner — keeps components free of a dependency. */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input && input !== 0) continue;
    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) out.push(nested);
    } else {
      out.push(String(input));
    }
  }
  return out.join(" ");
}
