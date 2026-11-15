import BrandMark from '../common/BrandMark';
import { APP_NAME } from '../../brand';

// Sign in and sign up share one frame: an emerald welcome panel (on top on the phone, beside
// the form on a wide screen) and a white card holding the form.
const AuthLayout = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-canvas dark:bg-night md:grid md:grid-cols-[1fr_1.05fr]">
    <section className="luxury-gradient relative overflow-hidden text-white px-6 pt-12 pb-20 md:p-12 md:flex md:flex-col md:justify-between">
      <div className="flex items-center gap-2.5">
        <span className="h-11 w-11 grid place-items-center rounded-2xl bg-white/95">
          <BrandMark className="h-7 w-7" />
        </span>
        <span className="text-2xl font-bold">{APP_NAME}</span>
      </div>
      <div className="mt-8 md:mt-0 max-w-md">
        <h1 className="text-3xl md:text-4xl font-bold leading-snug">
          مصروف البيت،
          <br />
          بوضوح ومعًا.
        </h1>
        <p className="mt-3 text-white/85 md:text-lg">
          صندوق واحد للعائلة: تموّله، ويصرف منه شريكك، وترى كل دينار أين ذهب.
        </p>
      </div>
      {/* A small sample of the home card, so the first screen already shows the app. */}
      <div className="hidden md:block max-w-sm rounded-[26px] bg-white/15 backdrop-blur-sm p-5 border border-white/20">
        <p className="text-sm text-white/80">صندوق البيت · متاح الآن</p>
        <p className="num text-4xl font-bold mt-1">
          18,450 <span className="text-lg font-normal text-white/80">د.ج</span>
        </p>
        <div className="h-2.5 rounded-full bg-white/25 overflow-hidden mt-4">
          <div className="h-full w-[41%] rounded-full bg-sun-300" />
        </div>
        <p className="text-xs text-white/85 mt-2">بهذا المعدّل يكفي حتى آخر الشهر</p>
      </div>
    </section>

    <section className="relative -mt-10 md:mt-0 flex md:items-center justify-center px-4 pb-10 md:p-12">
      <div className="w-full max-w-md bg-white dark:bg-night-card rounded-[30px] p-6 md:p-8 shadow-[0_18px_40px_rgba(20,24,60,0.10)]">
        <h2 className="text-2xl font-bold text-ink dark:text-white">{title}</h2>
        {subtitle && <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </section>
  </div>
);

export const authError = (err, fallback) => {
  const status = err.response?.status;
  if (!err.response) return 'تعذّر الوصول إلى الخادم. تأكد من الاتصال وحاول مرة أخرى.';
  if (status === 401) return 'البريد أو كلمة المرور غير صحيحة.';
  if (status === 409) return 'هذا البريد مستعمل في حساب آخر. جرّب تسجيل الدخول.';
  if (status === 429) return 'محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.';
  if (status === 400) return 'تأكد من البيانات: بريد صحيح وكلمة مرور من 8 أحرف على الأقل.';
  return fallback;
};

export default AuthLayout;
