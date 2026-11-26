# بلدي بلدي — Baladi Baladi

موقع مطعم عربي (RTL) مع منيو رقمي، لوحة تحكم، إعلانات، ورموز QR للطاولات.

## التقنيات

- Frontend: React + Vite + Tailwind CSS
- Backend: Django + Django REST Framework + SimpleJWT
- Database: SQLite محلياً / PostgreSQL على Render
- الصور: Cloudinary في الإنتاج (إلزامي لأن قرص Render مؤقت)
- QR/PDF: `qrcode` + Pillow + ReportLab

## التشغيل المحلي

### 1) Backend

```powershell
cd baladi-baladi
copy .env.example .env
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_baladi --admin-password "YOUR_PASSWORD"
python manage.py runserver
```

API: `http://127.0.0.1:8000/api/`

### 2) Frontend

```powershell
cd baladi-baladi\frontend
npm install
npm run dev
```

الموقع: `http://localhost:5173`  
لوحة التحكم: `http://localhost:5173/admin/login`

### بيانات أولية موثّقة من السوشيال

- الاسم، الشعار النصي، الوصف، الهاتف `0775051801`، العنوان (إربد / شارع البتراء)
- تصنيفات فارغة: فطور، برجر، وجبات، مشروبات (بدون أسعار مخترعة)

## Cloudinary (مطلوب قبل النشر)

1. أنشئ حساباً مجانياً على [cloudinary.com](https://cloudinary.com)
2. انسخ Cloud name / API Key / API Secret إلى متغيرات Render و/أو `.env`:

```
USE_CLOUDINARY=True
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

بدون Cloudinary تُحفظ الصور محلياً فقط — وهذا **لا يعمل** بشكل موثوق على Render Free.

## النشر على Render (حسابك الحالي)

### قيود الخطة المجانية (مهمة)

| القيد | التأثير |
|--------|---------|
| السكون بعد الخمول | أول طلب بعد فترة قد يستغرق 30–60 ثانية |
| قرص مؤقت | ارفع الصور عبر Cloudinary فقط |
| PostgreSQL Free | قد تنتهي صلاحية القاعدة خلال ~90 يوماً ما لم تُرقَّ |

### الخطوات

1. ارفع المشروع إلى GitHub (مستودع خاص أو عام).
2. في Render → **New** → **Blueprint** واختر المستودع (يستخدم `render.yaml`)، أو أنشئ Web Service يدوياً:
   - **Build:** `chmod +x backend/build.sh && ./backend/build.sh`
   - **Start:** `cd backend && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
3. أضف PostgreSQL واربط `DATABASE_URL`.
4. عيّن المتغيرات:

```
DEBUG=False
SECRET_KEY=<عشوائي طويل>
ALLOWED_HOSTS=YOUR-APP.onrender.com
PUBLIC_SITE_URL=https://YOUR-APP.onrender.com
USE_CLOUDINARY=True
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CORS_ALLOWED_ORIGINS=https://YOUR-APP.onrender.com
```

5. بعد أول نشر ناجح، من Shell في Render أو محلياً عبر `DATABASE_URL` الإنتاجي:

```bash
python manage.py seed_baladi --admin-password "STRONG_PASSWORD"
```

6. سجّل الدخول إلى `/admin` → **إعدادات الموقع** → ضع `public_site_url` = رابط Render، ثم أنشئ الطاولات ونزّل بطاقات QR/PDF.

## إدارة المحتوى

| الصفحة | الوظيفة |
|---------|---------|
| التصنيفات | إضافة/ترتيب/تفعيل تصنيفات المنيو |
| أصناف المنيو | أسعار، صور، شائع/موصى، إخفاء دون حذف |
| الإعلانات | جدولة، خصم، معاينة، مكان الظهور |
| الطاولات و QR | توليد، تنزيل PNG، PDF للطباعة |
| الإعدادات | الهوية، التواصل، الخريطة، ساعات العمل، رابط QR |

## هيكل المجلدات

```
baladi-baladi/
  backend/     Django API + SPA serving
  frontend/    React app
  render.yaml  Render Blueprint
  .env.example
```
