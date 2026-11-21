import { type Dict, fa } from "./fa";

type Values = Record<string, string | number>;

function lookup(path: string): string | undefined {
  let node: string | Dict | undefined = fa;
  for (const key of path.split(".")) {
    if (typeof node !== "object") return undefined;
    node = node[key];
  }
  return typeof node === "string" ? node : undefined;
}

// جایگزین next-intl: همان امضای t("a.b") را دارد و بدون routing کار می‌کند
export function useTranslations(ns?: string) {
  return (key: string, values?: Values) => {
    const path = ns ? `${ns}.${key}` : key;
    let text = lookup(path) ?? path;
    for (const [k, v] of Object.entries(values ?? {})) text = text.replace(`{${k}}`, String(v));
    return text;
  };
}

export const useLocale = () => "fa";
