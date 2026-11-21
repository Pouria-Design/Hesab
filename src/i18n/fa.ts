export type Dict = { [key: string]: string | Dict };

// فقط متن‌های قالب که جایشان نگه داشته شده؛ بقیه‌ی متن‌ها در کد فارسی نوشته شده‌اند
export const fa: Dict = {
  sidebar: {
    groups: { menu: "منو" },
    items: { dashboard: "داشبورد", transactions: "تراکنش‌ها", budget: "بودجه", settings: "تنظیمات" },
    badges: { new: "جدید", pro: "پرو" },
  },
  header: { toggleSidebar: "باز و بسته کردن منو" },
  notFound: {
    error: "خطا",
    message: "صفحه‌ای که دنبالش هستی پیدا نشد!",
    backHome: "بازگشت به داشبورد",
  },
};
