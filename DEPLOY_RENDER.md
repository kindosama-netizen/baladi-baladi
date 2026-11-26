# دليل النشر على Render — بلدي بلدي

## قبل البدء

1. أنشئ حساب Cloudinary مجاني: https://cloudinary.com/users/register/free  
   انسخ: Cloud name / API Key / API Secret
2. تأكد أن المستودع على GitHub جاهز (تم إنشاؤه من المشروع).
3. سجّل دخول Render: https://dashboard.render.com

## الطريقة أ — Blueprint (مستحسنة)

1. Render → **New** → **Blueprint**
2. اختر مستودع `baladi-baladi`
3. طبّق `render.yaml`
4. املأ المتغيرات التي تظهر `sync: false`:

| المتغير | قيمة مثال |
|----------|-----------|
| `PUBLIC_SITE_URL` | `https://baladi-baladi.onrender.com` (بعد معرفة الاسم الفعلي) |
| `ALLOWED_HOSTS` | `baladi-baladi.onrender.com` |
| `CLOUDINARY_CLOUD_NAME` | من Cloudinary |
| `CLOUDINARY_API_KEY` | من Cloudinary |
| `CLOUDINARY_API_SECRET` | من Cloudinary |
| `CORS_ALLOWED_ORIGINS` | نفس `PUBLIC_SITE_URL` |

5. انتظر انتهاء أول Build (يثبّت Node + يبني React + migrate).

## الطريقة ب — يدوي

1. **New PostgreSQL** (Free) → انسخ Internal Database URL  
2. **New Web Service** من المستودع:
   - Runtime: Python
   - Build: `chmod +x backend/build.sh && ./backend/build.sh`
   - Start: `cd backend && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
3. Environment:

```
DEBUG=False
SECRET_KEY=<generate>
DATABASE_URL=<from postgres>
USE_CLOUDINARY=True
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ALLOWED_HOSTS=<service>.onrender.com
PUBLIC_SITE_URL=https://<service>.onrender.com
CORS_ALLOWED_ORIGINS=https://<service>.onrender.com
PYTHON_VERSION=3.12.10
```

## بعد أول نشر ناجح

من Render Shell للخدمة:

```bash
cd backend
python manage.py seed_baladi --admin-password "CHANGE_ME_STRONG"
```

ثم:

1. افتح `https://YOUR-APP.onrender.com/admin/login`
2. ادخل بنفس بيانات الـ seed
3. **إعدادات الموقع** → ضع `public_site_url` = رابط الإنتاج
4. **الطاولات و QR** → توليد الطاولات → تنزيل PDF للطباعة

## تحقق سريع للإنتاج

- [ ] `/` الصفحة الرئيسية
- [ ] `/menu` و `/menu?table=1`
- [ ] `/admin` تسجيل الدخول
- [ ] رفع صورة صنف تظهر عبر Cloudinary URL
- [ ] QR يفتح رابط `onrender.com` وليس localhost

## قيود الخطة المجانية

- الخدمة تنام بعد الخمول → أول زيارة بطيئة
- بدون Cloudinary تُفقد الصور عند إعادة التشغيل
- قاعدة PostgreSQL المجانية قد تنتهي خلال ~90 يوماً
