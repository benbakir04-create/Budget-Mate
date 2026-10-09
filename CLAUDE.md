# CLAUDE.md — وازن | Wazen (Budget Mate)

تطبيق مالي تشاركي لإدارة الصناديق المسبقة الدفع والعهد المالية (وازن عائلي + وازن أعمال).
الواجهة بالعربية RTL أولًا.

## البنية

```
backend/    Express 4 + Prisma 5 + PostgreSQL (JWT + bcryptjs)
frontend/   React 18 + Vite 4 + MUI 5 + Tailwind + i18next (ar/en) + Recharts
docs/       وثائق المشروع وقرارات ADR
scripts/    setup.js لتهيئة المشروع
```

يوجد `package.json` في الجذر يجمع أوامر الجزأين (concurrently) وأدوات الجودة (ESLint, Prettier, husky, lint-staged).

### الخادم (`backend/`)
- نقطة الدخول: `src/server.js` (helmet, cors, rate-limit, morgan, cookie-parser).
- الطبقات: `routes/` ← `controllers/` ← `services/`، والتحقق في `middleware/validators/` (express-validator).
- الموارد: auth, budgets, categories, transactions, joint funds, shopping orders.
- قاعدة البيانات: `prisma/schema.prisma` (PostgreSQL) بستة نماذج: User, JointFund, Category, Transaction, ShoppingOrder, Budget.
  الـ migrations في `prisma/migrations/` (أولها `20261009000000_init`).
- متغيرات البيئة تُفحص عند الإقلاع في `src/config/env.js`؛ القالب في `backend/env.example`.
- الأخطاء تُعاد بشكل `{ success: false, ... }` عبر `middleware/errorHandler.js`.

### الواجهة (`frontend/`)
- `src/pages/` الصفحات، `src/services/` استدعاءات API عبر axios، `src/contexts/AuthContext.jsx` المصادقة.
- الترجمة في `src/i18n/locales/{ar,en}.json`، ودعم RTL عبر `stylis-plugin-rtl`.
- وضع تجريبي بلا خادم: `src/services/demoData.js` ويُفعَّل بـ `VITE_DEMO_MODE=true`.
- خادم Vite يعمل على المنفذ 3000 (`vite.config.js`)، وكل إعدادات CORS وDocker موحّدة عليه.

## الأوامر

```bash
# من الجذر
npm run install:all          # تثبيت الخادم والواجهة
npm run dev                  # تشغيل الخادم والواجهة معًا
npm run dev:demo             # الواجهة فقط بالوضع التجريبي
npm run lint / lint:fix
npm run format / format:check
npm run db:migrate | db:seed | db:studio
npm run docker:up            # docker-compose

# الخادم
cd backend
cp env.example .env          # ثم عدّل القيم
npx prisma migrate dev       # يطبّق الـ migrations على قاعدة التطوير
npm run dev                  # nodemon على src/server.js
npm run test:api             # سكربت يدوي يضرب API قيد التشغيل، ليس اختبارات وحدة
```

تنبيه: `npm test` و`npm run build:backend` في الجذر يستدعيان سكربتات غير معرّفة في `backend/` و`frontend/`، فيفشلان حاليًا.

## الأعراف

- الردود والأوصاف والتعليقات الموجهة للمستخدم بالعربية الواضحة.
- لا أسرار في الكود: استخدم متغيرات البيئة، وحدّث `backend/env.example` عند إضافة متغير. ملفات `.env` الحقيقية لا تُرفع.
- كل تغيير على فرع مستقل ثم PR بوصف عربي مختصر، ولا دمج مباشر في `main`.
- أي تعديل على `schema.prisma` يمر عبر migration (`npx prisma migrate dev --name <وصف>`) مع ذكر أثره على البيانات في وصف الـ PR. لا تعدّل migration سبق دمجه.
- العمليات المالية (رصيد، صرف، عهدة) تتحقق من الصلاحيات في الخادم وتُسجَّل في سجل تدقيق.
- أضف اختبارات للمنطق المالي الحرج قبل الدمج.
- لا تعدّل ولا تعتمد على: `everything-claude-code-main/` (مكتبة أدوات خارجية لا تخص التطبيق)، `frontend/dist/`، `logs/`، `node_modules/`، ولا ملفات "تحليل ai *.txt" و`.docx` (مواد مرجعية فقط).
- عند الشك في قرار معماري كبير، اسأل قبل التنفيذ.

## أسئلة مفتوحة

- **ADR مقابل الكود:** قرارات `docs/ADR/` تنص على Next.js App Router وSupabase وتصميم Glassmorphism، بينما الكود الفعلي Vite + Express + Prisma. لا تحسم هذا التعارض دون الرجوع إلى المستخدم.
- **الأسرار في تاريخ git:** `backend/.env` (وفيه `JWT_SECRET`) موجود في تاريخ git وعلى `origin/main`. أُلغي تتبّعه محليًا، لكن السر القديم يُعتبر مكشوفًا ويجب تدويره.
- **نقص النمذجة:** مفاهيم العهد والأدوار التفصيلية وسجل التدقيق لم تُنمذج بعد في المخطط.
- **لا توجد اختبارات** وحدة أو تكامل في أي من الجزأين.
