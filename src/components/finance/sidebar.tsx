"use client";

import { logout } from "@/components/auth-gate";
import { useFinance } from "@/context/finance-context";
import { GearIcon, LayoutGridIcon, ListIcon, LockIcon, PieChartIcon, TagIcon } from "@/icons";
import { toFaDigits } from "@/lib/finance";
import Link from "next/link";
import { usePathname } from "next/navigation";

type IconType = typeof LayoutGridIcon;

const SECTIONS: { title: string; items: { href: string; label: string; icon: IconType }[] }[] = [
  {
    title: "اصلی",
    items: [
      { href: "/", label: "داشبورد", icon: LayoutGridIcon },
      { href: "/transactions", label: "تراکنش‌ها", icon: ListIcon },
    ],
  },
  {
    title: "مالی",
    items: [
      { href: "/categories", label: "دسته‌بندی‌ها", icon: TagIcon },
      { href: "/budget", label: "بودجه", icon: PieChartIcon },
    ],
  },
];

function NavLink({ href, label, Icon, active, onClose }: { href: string; label: string; Icon: IconType; active: boolean; onClose: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
        active
          ? "bg-brand-50 font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
      }`}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();
  const { pendingCount, syncInfo, refresh } = useFinance();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-40 flex w-[260px] flex-col border-l border-gray-200 bg-white p-4 transition-transform duration-300 lg:translate-x-0 dark:border-gray-800 dark:bg-gray-900 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="mb-6 flex items-center gap-3 px-2 pt-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-500 text-lg font-bold text-white">H</span>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">مدیریت مالی شخصی</div>
          <div className="font-semibold text-gray-900 dark:text-white">Hashem-Budget</div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <div className="mb-2 px-3 text-xs font-medium text-gray-400 dark:text-gray-500">{s.title}</div>
            <div className="space-y-1">
              {s.items.map((i) => (
                <NavLink key={i.href} href={i.href} label={i.label} Icon={i.icon} active={active(i.href)} onClose={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-gray-200 pt-3 dark:border-gray-800">
        <div className="space-y-1.5 px-3 pb-2 text-xs">
          <div className={pendingCount > 0 ? "text-orange-500" : "text-gray-400 dark:text-gray-500"}>
            {pendingCount > 0 ? `${toFaDigits(String(pendingCount))} تغییر در صف ارسال` : "همه‌ی تغییرات ذخیره شده‌اند"}
          </div>
          <div className={syncInfo.error ? "text-red-500" : "text-gray-400 dark:text-gray-500"}>
            {syncInfo.error
              ? "دریافت اطلاعات از سرور ممکن نشد"
              : syncInfo.at
                ? `آخرین همگام‌سازی: ${toFaDigits(syncInfo.at)}`
                : "در حال اتصال به سرور..."}
          </div>
          <button type="button" onClick={refresh} className="text-brand-600 hover:underline dark:text-brand-400">
            همگام‌سازی الان
          </button>
        </div>
        <NavLink href="/settings" label="تنظیمات" Icon={GearIcon} active={active("/settings")} onClose={onClose} />
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
        >
          <LockIcon className="size-5" />
          خروج
        </button>
      </div>
    </aside>
  );
}
