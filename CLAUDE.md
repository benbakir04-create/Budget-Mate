# CLAUDE.md — وازن | Wazen (Budget Mate)

تطبيق مالي تشاركي لإدارة الصناديق المسبقة الدفع والعهد المالية (وازن عائلي + وازن أعمال).
الواجهة بالعربية RTL أولًا. سوق الإطلاق: الجزائر، والعملة الافتراضية الدينار (DZD). البداية بالمسار العائلي، ومسار الأعمال مؤجَّل.

## البنية

```
backend/    Express 4 + Prisma 5 + PostgreSQL (JWT + bcryptjs)
frontend/   React 18 + Vite 4 + Tailwind + i18next (ar/en) + Recharts
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
- أنواع العمليات في `src/constants/money.js`: `income` و`expense` يدخلهما المستخدم، و`transfer` يُنشئه الخادم وحده عند تمويل صندوق، ولا يُحسب في الدخل ولا في المصروف.
- الاختبارات في `backend/tests/` (Jest، مع Prisma مُحاكى في `tests/helpers/mockPrisma.js`).

### الواجهة (`frontend/`)

- `src/pages/` الصفحات، `src/services/` استدعاءات API عبر axios، `src/contexts/AuthContext.jsx` المصادقة.
- `src/utils/currency.js` العملات (الدينار افتراضيًا)، و`src/utils/money.js` حساب الإجماليات وتنسيق المبالغ، و`src/utils/dates.js` التواريخ («اليوم»، «أمس»، «12 نوفمبر»)، ولكل منهما اختبار `*.test.js`.
- الترجمة في `src/i18n/locales/{ar,en}.json`، والاتجاه RTL من `dir="rtl"` في `index.html`.
- **نظام التصميم (الاتجاه الرابع «مشرق ومرح»، باللون الزمردي):** الألوان والخط والزوايا في `tailwind.config.js`: `brand` زمردي أساسي، و`sun` للتمييز وحالة «اقترب»، و`mint` للمال الداخل، و`alert` للتجاوز والحذف، والخلفية `canvas`. الخط Readex Pro. لا ألوان مكتوبة يدويًا في الصفحات.
  اعرض كل مبلغ عبر `components/common/Money.jsx` حتى لا تقفز الإشارة، واسم التطبيق من `src/brand.js`، والشعار المؤقت `BrandMark.jsx`.
  مرجع ذوق علي في التصميم: لوحتاه في Pinterest (app-design ثم shopify-website-design). الشريط السفلي على الجوال يكون فاتحًا لا داكنًا.
- وضع تجريبي بلا خادم: `src/services/demoData.js` ويُفعَّل بـ `VITE_DEMO_MODE=true`.
- خادم Vite يعمل على المنفذ 3000 (`vite.config.js`)، وكل إعدادات CORS وDocker موحّدة عليه.

## الأوامر

```bash
# من الجذر
npm run install:all          # تثبيت الخادم والواجهة
npm run dev                  # تشغيل الخادم والواجهة معًا
npm run dev:demo             # الواجهة فقط بالوضع التجريبي
npm test                     # اختبارات الخادم (Jest) والواجهة (node --test)
npm run lint / lint:fix
npm run format / format:check
npm run db:migrate | db:seed | db:studio
npm run docker:up            # docker-compose

# الخادم
cd backend
cp env.example .env          # ثم عدّل القيم
npx prisma migrate dev       # يطبّق الـ migrations على قاعدة التطوير ويولّد عميل Prisma
npm run dev                  # nodemon على src/server.js
npm test                     # اختبارات Jest للمنطق المالي
npm run test:api             # سكربت يدوي يضرب API قيد التشغيل، ليس اختبارات وحدة
```

تنبيه: `npm run build:backend` في الجذر يستدعي سكربتًا غير معرّف في `backend/`، فيفشل حاليًا.
بعد سحب تغيير على `schema.prisma` شغّل `npx prisma migrate dev` (أو `npx prisma generate`)، وإلا بقي عميل Prisma القديم بقيمه الافتراضية القديمة.

## الأعراف

- الردود والأوصاف والتعليقات الموجهة للمستخدم بالعربية الواضحة.
- لا أسرار في الكود: استخدم متغيرات البيئة، وحدّث `backend/env.example` عند إضافة متغير. ملفات `.env` الحقيقية لا تُرفع.
- كل تغيير على فرع مستقل ثم PR بوصف عربي مختصر، ولا دمج مباشر في `main`.
- أي تعديل على `schema.prisma` يمر عبر migration (`npx prisma migrate dev --name <وصف>`) مع ذكر أثره على البيانات في وصف الـ PR. لا تعدّل migration سبق دمجه.
- العمليات المالية (رصيد، صرف، عهدة) تتحقق من الصلاحيات في الخادم وتُسجَّل في سجل تدقيق.
- أضف اختبارات للمنطق المالي الحرج قبل الدمج.
- لا تعدّل ولا تعتمد على: `everything-claude-code-main/` (مكتبة أدوات خارجية لا تخص التطبيق)، `frontend/dist/`، `logs/`، `node_modules/`، ولا ملفات "تحليل ai \*.txt" و`.docx` (مواد مرجعية فقط).
- عند الشك في قرار معماري كبير، اسأل قبل التنفيذ.

## أسئلة مفتوحة

- **ADR قديمة:** قرارات `docs/ADR/` (Next.js وSupabase) تجاوزتها وثائق المستخدم الأحدث: المعتمد Vite + Express + Prisma، والواجهة Tailwind (أُزيلت MUI).
- **الأسرار في تاريخ git:** `backend/.env` (وفيه `JWT_SECRET`) موجود في تاريخ git وعلى `origin/main`. أُلغي تتبّعه محليًا، لكن السر القديم يُعتبر مكشوفًا ويجب تدويره.
- **نقص النمذجة:** مفاهيم العهد والأدوار التفصيلية وسجل التدقيق لم تُنمذج بعد في المخطط.
- **الاختبارات جزئية:** تغطي التمويل والصرف والطلبيات في الخادم وحساب الإجماليات في الواجهة، ولا توجد اختبارات تكامل على قاعدة بيانات حقيقية في CI.
- **سجل التدقيق** المطلوب للعمليات المالية لم يُبنَ بعد (مؤجَّل لما بعد التجربة).
