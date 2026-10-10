# Budget Mate - تطبيق تسيير الميزانية الشخصية والعائلية

تطبيق ذكي لتسيير الميزانية الشخصية والعائلية، يعتمد على تقسيم المصاريف إلى أصناف وأقسام، تحديد أهداف مالية لكل صنف، التتبع اللحظي للتجاوز أو التوفير، وربط أفراد العائلة بصلاحيات مختلفة.

## النسخة الحالية: Personal V1

هذه النسخة مخصصة للاستعمال الشخصي والعائلي، وتمثل النواة الأساسية للمنتج النهائي.

### المميزات الرئيسية:

- نظام الأصناف والأقسام
- نظام الميزانية والأهداف
- إدارة المصروفات
- طلبات التسوق
- الحساب العائلي (نسخة مبسطة)
- التقارير والرسوم البيانية
- دعم اللغتين العربية والإنجليزية

## هيكل المشروع

```
budget-mate/
├── frontend/          # واجهة المستخدم (React)
├── backend/           # الواجهة الخلفية (Node.js)
├── database/          # ملفات قاعدة البيانات
└── docs/              # التوثيق
```

## 🚀 بدء التشغيل السريع

### الطريقة الأسهل - استخدام السكريبت التلقائي

**على Windows:**

```bash
setup.bat
```

**على Linux/Mac:**

```bash
chmod +x setup.sh
./setup.sh
```

### الطريقة التقليدية - الإعداد اليدوي

#### الواجهة الخلفية

```bash
cd backend
npm install
# انسخ ملف البيئة
cp env.example .env
# عدّل .env حسب إعدادات قاعدة البيانات الخاصة بك
npm run dev
```

#### الواجهة الأمامية

```bash
cd frontend
npm install
npm run dev
```

### 🐳 الطريقة المتقدمة - استخدام Docker

```bash
# تأكد من تثبيت Docker و Docker Compose
docker-compose up --build
```

**سيتم تشغيل التطبيق على:**

- الواجهة الأمامية: http://localhost:5173
- الواجهة الخلفية: http://localhost:5000

## ⚙️ خيارات الإعداد

### 🎯 وضع Demo (للتجربة السريعة)

إذا كنت تريد تجربة التطبيق بدون إعداد قاعدة بيانات:

**الطريقة السريعة:**

```bash
run-demo.bat    # على Windows
./run-demo.sh   # على Linux/Mac
```

**الطريقة اليدوية:**

1. شغّل السكريبت التلقائي
2. في الفرونت إند، أنشئ ملف `.env` وأضف:
   ```
   VITE_DEMO_MODE=true
   ```
3. شغّل التطبيق - ستحصل على حساب تجريبي جاهز

### 🛠️ وضع التطوير الكامل

للتطوير الكامل مع قاعدة بيانات:

1. ثبت PostgreSQL
2. أنشئ قاعدة بيانات جديدة
3. عدّل `backend/.env` ببيانات الاتصال
4. شغّل المايقريشن والسييد
5. شغّل التطبيق

### 🐳 وضع Docker

للإعداد السريع جداً:

```bash
docker-compose up --build
```

## 🛠️ أدوات التطوير

### أوامر سريعة

```bash
# إعداد المشروع
npm run setup

# تشغيل وضع demo
npm run dev:demo

# تشغيل التطبيق الكامل
npm run dev

# فحص الكود
npm run lint
npm run format

# قاعدة البيانات
npm run db:migrate
npm run db:seed
npm run db:studio

# Docker
npm run docker:up
npm run docker:down
```

### أدوات الكود

- **ESLint**: فحص أخطاء الكود
- **Prettier**: تنسيق الكود تلقائياً
- **Husky**: Git hooks للتحقق قبل الالتزام
- **lint-staged**: فحص الملفات المعدلة فقط
- **EditorConfig**: توحيد إعدادات المحرر

## التقنيات المستخدمة

- **الواجهة الأمامية**: React 18, Vite, Tailwind CSS, Material-UI, i18next
- **الواجهة الخلفية**: Node.js, Express, PostgreSQL, Prisma ORM
- **الأمان**: JWT, bcrypt, Helmet, CORS, express-rate-limit
- **التنمية**: Docker, ESLint, Prettier, Husky, GitHub Actions
- **الاختبار**: Jest, React Testing Library (قريباً)

## 🤝 المساهمة

نرحب بمساهماتكم! راجع [دليل المساهمة](CONTRIBUTING.md) للمزيد من التفاصيل.

### كيفية المساهمة:

1. Fork المشروع
2. أنشئ فرع للميزة: `git checkout -b feature/amazing-feature`
3. Commit التغييرات: `git commit -m 'Add amazing feature'`
4. Push للفرع: `git push origin feature/amazing-feature`
5. افتح Pull Request

## 📋 سجل التغييرات

راجع [سجل التغييرات](CHANGELOG.md) لمعرفة التحديثات الأخيرة.

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.
