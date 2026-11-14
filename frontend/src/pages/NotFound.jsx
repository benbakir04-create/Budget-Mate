import { Link } from 'react-router-dom';
import BrandMark from '../components/common/BrandMark';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <div className="text-center max-w-sm">
      <BrandMark className="h-14 w-14 mx-auto mb-6" />
      <h1 className="text-2xl font-bold text-ink dark:text-white mb-2">لم نجد هذه الصفحة</h1>
      <p className="text-stone-500 dark:text-stone-400 mb-8">
        ربما تغيّر الرابط أو كُتب خطأ. ارجع إلى الرئيسية وتابع من هناك.
      </p>
      <Link
        to="/dashboard"
        className="inline-block bg-primary hover:bg-qashani-800 text-white font-bold px-6 py-3 rounded-field transition-colors"
      >
        العودة إلى الرئيسية
      </Link>
    </div>
  </div>
);

export default NotFound;
