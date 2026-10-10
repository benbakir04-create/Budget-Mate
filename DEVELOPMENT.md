# 🛠️ دليل التطوير - Budget Mate

## 📋 متطلبات التطوير

### البرمجيات الأساسية

- **Node.js 18+** - محرك JavaScript
- **PostgreSQL 15+** - قاعدة البيانات (اختياري للوضع التجريبي)
- **Git** - نظام التحكم في الإصدارات
- **Docker** (اختياري) - للإعداد السريع

### أدوات التطوير الموصى بها

- **VS Code** - محرر الكود
- **Postman/Thunder Client** - اختبار APIs
- **pgAdmin** - إدارة قاعدة البيانات
- **Browser DevTools** - فحص وتصحيح الكود

## 🚀 إعداد بيئة التطوير

### 1. استنساخ المشروع

```bash
git clone <repository-url>
cd budget-mate
```

### 2. الإعداد التلقائي

```bash
# على Windows
setup.bat

# على Linux/Mac
chmod +x setup.sh && ./setup.sh
```

### 3. اختيار وضع التطوير

#### وضع Demo (موصى به للمبتدئين)

```bash
run-demo.bat    # Windows
./run-demo.sh   # Linux/Mac
```

#### وضع التطوير الكامل

```bash
# إعداد قاعدة البيانات
# ... ثم
run-backend.bat && run.bat    # Windows
./run-backend.sh && ./run.sh  # Linux/Mac
```

#### وضع Docker

```bash
docker-compose up --build
```

## 📁 هيكل المشروع

```
budget-mate/
├── backend/              # الواجهة الخلفية
│   ├── src/
│   │   ├── controllers/  # معالجات الطلبات
│   │   ├── routes/       # مسارات API
│   │   ├── services/     # منطق العمل
│   │   ├── middleware/   # وسطاء Express
│   │   └── config/       # الإعدادات
│   ├── prisma/           # schema قاعدة البيانات
│   └── Dockerfile
├── frontend/             # الواجهة الأمامية
│   ├── src/
│   │   ├── components/   # مكونات React
│   │   ├── pages/        # صفحات التطبيق
│   │   ├── contexts/     # React contexts
│   │   ├── services/     # خدمات API
│   │   └── i18n/         # الترجمة
│   └── Dockerfile
├── docker-compose.yml    # إعداد Docker
├── setup.bat/sh          # سكريبت الإعداد
└── run-demo.bat/sh       # تشغيل وضع demo
```

## 🔧 أوامر التطوير الشائعة

### الباك إند

```bash
cd backend

# تثبيت الحزم
npm install

# تشغيل الخادم
npm run dev

# تشغيل الاختبارات (عند إضافتها)
npm test

# إدارة قاعدة البيانات
npm run prisma:migrate    # تطبيق التغييرات
npm run prisma:generate   # توليد Prisma client
npm run prisma:seed       # إضافة البيانات الأولية
npm run prisma:studio     # واجهة إدارة البيانات
```

### الفرونت إند

```bash
cd frontend

# تثبيت الحزم
npm install

# تشغيل الخادم
npm run dev

# بناء للإنتاج
npm run build

# معاينة البناء
npm run preview
```

## 🧪 الاختبار والتصحيح

### اختبار APIs

```bash
# استخدم Postman أو Thunder Client
# أو استخدم السكريبت المدمج
cd backend && npm run test:api
```

### فحص قاعدة البيانات

```bash
cd backend
npm run prisma:studio
# ثم افتح http://localhost:5555
```

### فحص الأخطاء

- **Frontend**: افتح DevTools (F12) → Console
- **Backend**: راجع terminal الخادم
- **Database**: استخدم pgAdmin أو Prisma Studio

## 📝 إرشادات الكود

### أسلوب الكتابة

- استخدم **ES6+** features
- اتبع **camelCase** للمتغيرات والدوال
- استخدم **PascalCase** للمكونات
- أضف تعليقات للمنطق المعقد

### Git Workflow

```bash
# إنشاء فرع جديد
git checkout -b feature/new-feature

# إضافة التغييرات
git add .
git commit -m "Add: new feature description"

# دفع التغييرات
git push origin feature/new-feature

# إنشاء Pull Request
```

### إدارة البيئة

- لا تضع مفاتيح سرية في الكود
- استخدم متغيرات البيئة (.env)
- أضف .env إلى .gitignore

## 🚀 النشر

### البناء للإنتاج

```bash
# الباك إند
cd backend
npm run build  # إذا كان مطلوباً

# الفرونت إند
cd frontend
npm run build
```

### نشر مع Docker

```bash
# بناء الصور
docker-compose build

# النشر
docker-compose up -d
```

## 📞 المساعدة والدعم

### الملفات المرجعية

- `QUICK_START.md` - البدء السريع
- `TESTING_GUIDE.md` - دليل الاختبار
- `TROUBLESHOOTING.md` - حل المشاكل

### المشاكل الشائعة

- **Port conflicts**: غيّر المنافذ في .env
- **Database errors**: تأكد من تشغيل PostgreSQL
- **Build errors**: احذف node_modules وأعد التثبيت

---

**💡 نصيحة:** ابدأ بوضع Demo للتعرف على المشروع، ثم انتقل للوضع الكامل للتطوير المتقدم!
