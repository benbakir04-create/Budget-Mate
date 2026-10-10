# 🤝 دليل المساهمة في Budget Mate

مرحباً بك في مشروع Budget Mate! نحن سعداء بمساهمتك في تطوير هذا التطبيق.

## 📋 قبل البدء

### 1. اقرأ الوثائق
- `README.md` - نظرة عامة على المشروع
- `DEVELOPMENT.md` - إرشادات التطوير
- `QUICK_START.md` - البدء السريع

### 2. إعداد البيئة
```bash
# استنساخ المشروع
git clone <repository-url>
cd budget-mate

# إعداد البيئة
make setup

# تشغيل وضع demo للتعرف
make run-demo
```

### 3. فهم هيكل المشروع
- **Backend**: Node.js + Express + PostgreSQL + Prisma
- **Frontend**: React + Vite + Tailwind CSS + i18next
- **Architecture**: RESTful API مع JWT authentication

## 🐛 الإبلاغ عن مشاكل

### قبل الإبلاغ:
1. تحقق من أن المشكلة غير موجودة مسبقاً
2. جرب أحدث إصدار من الكود
3. راجع `TROUBLESHOOTING.md`

### كيفية الإبلاغ:
1. استخدم قالب Issue المناسب
2. وصف المشكلة بوضوح مع خطوات التكرار
3. أضف معلومات النظام وإصدارات البرمجيات
4. أرفق لقطات شاشة إذا أمكن

## 💡 اقتراح ميزات جديدة

### قبل الاقتراح:
1. تحقق من أن الميزة غير موجودة
2. راجع الخطة المستقبلية في الوثائق

### كيفية الاقتراح:
1. وصف الميزة والمشكلة التي تحلها
2. شرح كيفية عملها
3. مناقشة البدائل المحتملة

## 🛠️ المساهمة في الكود

### سير العمل:
1. **Fork** المشروع
2. **Create** فرع جديد: `git checkout -b feature/your-feature`
3. **Commit** التغييرات: `git commit -m "Add: feature description"`
4. **Push** التغييرات: `git push origin feature/your-feature`
5. **Create** Pull Request

### معايير الكود:
- اتبع أسلوب الكود الموجود
- أضف تعليقات للمنطق المعقد
- اختبر التغييرات محلياً
- تأكد من عدم كسر الوظائف الموجودة

### أنواع المساهمات:
- 🐛 **Bug fixes** - إصلاح الأخطاء
- ✨ **Features** - ميزات جديدة
- 📚 **Documentation** - تحسين الوثائق
- 🎨 **UI/UX** - تحسين التصميم
- 🧪 **Tests** - إضافة اختبارات
- 🔧 **Tools** - تحسين أدوات التطوير

## 📝 إرشادات الكتابة

### الرسائل الالتزام (Commits):
```
type(scope): description

[optional body]

[optional footer]
```

**أنواع الالتزام:**
- `feat`: ميزة جديدة
- `fix`: إصلاح خطأ
- `docs`: تغييرات في الوثائق
- `style`: تغييرات في التنسيق
- `refactor`: إعادة هيكلة الكود
- `test`: إضافة اختبارات
- `chore`: مهام صيانة

**أمثلة:**
```
feat(auth): add password reset functionality
fix(api): resolve user registration validation error
docs(readme): update installation instructions
```

### رسائل Pull Request:
- **Title**: وصف واضح للتغييرات
- **Description**: شرح مفصل للمشكلة والحل
- **Testing**: كيفية اختبار التغييرات
- **Screenshots**: لتغييرات UI

## 🧪 الاختبار

### قبل إرسال PR:
1. اختبر التغييرات محلياً
2. شغّل التطبيق في وضع demo
3. تأكد من عدم كسر الوظائف الموجودة
4. راجع `TESTING_GUIDE.md` للاختبار الشامل

### الاختبار الآلي (مستقبلاً):
```bash
# تشغيل جميع الاختبارات
npm test

# اختبارات الباك إند
cd backend && npm test

# اختبارات الفرونت إند
cd frontend && npm test
```

## 🎨 إرشادات التصميم

### UI/UX:
- اتبع تصميم Material Design
- استخدم ألوان التطبيق المحددة
- ضمن الاستجابة على جميع الأجهزة
- ركز على تجربة المستخدم العربي

### الألوان:
- Primary: #10B981 (أخضر)
- Danger: #EF4444 (أحمر)
- Warning: #F59E0B (برتقالي)
- Info: #3B82F6 (أزرق)

## 🌍 الترجمة

### إضافة نصوص جديدة:
1. أضف المفتاح في `frontend/src/i18n/locales/ar.json`
2. أضف الترجمة الإنجليزية في `en.json`
3. استخدم `useTranslation` hook في المكونات

### مثال:
```json
{
  "newFeature": {
    "title": "الميزة الجديدة",
    "description": "وصف الميزة"
  }
}
```

## 📞 التواصل

- **Issues**: للأخطاء والاقتراحات
- **Discussions**: للأسئلة والمناقشات
- **Pull Requests**: للمراجعة والدمج

## 🙏 قواعد السلوك

- كن محترماً ومهذباً
- ساعد الآخرين في المجتمع
- ركز على تحسين المشروع
- اتبع إرشادات المشروع

---

**شكراً لمساهمتك في تطوير Budget Mate! 🎉**