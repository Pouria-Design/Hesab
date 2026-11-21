import { UsFlagIcon } from "@/icons";
import type { ComponentType, SVGProps } from "react";

export type Locale = "fa";

export interface Language {
  id: Locale;
  name: string;
  dir: "ltr" | "rtl";
  FlagIcon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const languages: Language[] = [{ id: "fa", name: "فارسی", dir: "rtl", FlagIcon: UsFlagIcon }];

export function getLanguage(_locale: Locale): Language {
  return languages[0];
}

export function isRtl(locale: Locale): boolean {
  return getLanguage(locale).dir === "rtl";
}
