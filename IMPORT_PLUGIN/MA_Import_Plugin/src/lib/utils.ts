import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Classes carry the `mna:` prefix (see globals.css), so tailwind-merge has to
// be told about it or it cannot recognise — and de-duplicate — any of them.
const twMerge = extendTailwindMerge({ prefix: "mna" });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
