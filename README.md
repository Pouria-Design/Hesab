# حساب

داشبورد مالی شخصی با Next.js (خروجی استاتیک برای Cloudflare Pages).

## اجرای محلی (اختیاری)
    npm ci
    npm run dev

## استقرار
- Build command: `npm ci && npm run build`
- Output directory: `out`
- Environment variable: `NODE_VERSION` = `22`

## داده
- آدرس Apps Script در `src/lib/sync.ts` (ثابت `API_URL`).
- توکن هنگام اولین ورود پرسیده می‌شود و فقط داخل همان گوشی/مرورگر ذخیره می‌شود.
- تراکنش‌های بی‌اینترنت در IndexedDB صف می‌شوند و بعداً ارسال می‌شوند.
