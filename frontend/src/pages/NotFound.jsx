import { Link } from 'react-router-dom';
import BrandMark from '../components/common/BrandMark';
import Icon from '../components/common/Icon';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <div className="premium-card w-full max-w-sm p-8 text-center">
      <span className="mx-auto mb-5 h-20 w-20 grid place-items-center rounded-[26px] bg-brand-50 dark:bg-brand-500/15">
        <BrandMark className="h-11 w-11" />
      </span>
      <h1 className="text-2xl font-bold text-ink dark:text-white mb-2">لم نجد هذه الصفحة</h1>
      <p className="text-stone-500 dark:text-stone-400 mb-7">
        ربما تغيّر الرابط أو كُتب خطأ. ارجع إلى الرئيسية وتابع من هناك.
      </p>
      <Link
        to="/dashboard"
        className="w-full min-h-[52px] inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-lg shadow-brand-500/30 transition-colors"
      >
        <Icon name="home" className="h-5 w-5" />
        العودة إلى الرئيسية
      </Link>
    </div>
  </div>
);

export default NotFound;
