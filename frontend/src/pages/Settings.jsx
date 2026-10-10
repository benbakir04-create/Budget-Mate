import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/common/Sidebar';
import { categoryService } from '../services/categoryService';

const Settings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // App settings state
  const [appName, setAppName] = useState(localStorage.getItem('appName') || import.meta.env.VITE_APP_NAME || 'وازن');
  const [currency, setCurrency] = useState(user?.currency || 'SAR');
  const [lang] = useState('ar');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Categories state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newCategoryData, setNewCategoryData] = useState({
    nameAr: '',
    name: '',
    type: 'expense',
    color: '#10B981',
    icon: 'folder'
  });
  
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getCategories();
      setCategories(data);
      if (data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0]);
      } else if (data.length > 0) {
        const updatedSelected = data.find(c => c.id === selectedCategory.id);
        setSelectedCategory(updatedSelected || data[0]);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneralSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('appName', appName);
    
    // Update currency in current user session
    if (user) {
      const updatedUser = { ...user, currency };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // Force reload page to apply changes app-wide
      setSuccessMsg('تم حفظ الإعدادات بنجاح! جاري تحديث التطبيق...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setSuccessMsg('تم حفظ الإعدادات بنجاح!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryData.nameAr) return;
    try {
      const data = {
        ...newCategoryData,
        name: newCategoryData.name || newCategoryData.nameAr // Fallback for English name
      };
      const created = await categoryService.createCategory(data);
      setShowAddCategory(false);
      setNewCategoryData({
        nameAr: '',
        name: '',
        type: 'expense',
        color: '#10B981',
        icon: 'folder'
      });
      await loadCategories();
      setSelectedCategory(created);
      setSuccessMsg('تم إضافة القسم بنجاح!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا القسم؟ سيتم حذف جميع الفئات الفرعية التابعة له.')) {
      try {
        await categoryService.deleteCategory(id);
        if (selectedCategory?.id === id) {
          setSelectedCategory(null);
        }
        await loadCategories();
        setSuccessMsg('تم حذف القسم بنجاح!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    if (!newSubcategoryName || !selectedCategory) return;
    
    try {
      const subcategories = selectedCategory.subcategories ? [...selectedCategory.subcategories] : [];
      const newSub = {
        id: 'sub-' + Date.now(),
        nameAr: newSubcategoryName
      };
      subcategories.push(newSub);
      
      await categoryService.updateCategory(selectedCategory.id, { subcategories });
      setNewSubcategoryName('');
      await loadCategories();
      setSuccessMsg('تم إضافة الصنف الفرعي بنجاح!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubcategory = async (subId) => {
    if (!selectedCategory) return;
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الصنف الفرعي؟')) {
      try {
        const subcategories = selectedCategory.subcategories.filter(s => s.id !== subId);
        await categoryService.updateCategory(selectedCategory.id, { subcategories });
        await loadCategories();
        setSuccessMsg('تم حذف الصنف الفرعي!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const colors = [
    '#10B981', '#1D9E75', '#3B82F6', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280', '#111827'
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 max-w-7xl mx-auto p-4 md:mr-64">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">إعدادات التطبيق</h1>
        </div>

        {successMsg && (
          <div className="mb-6 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-sm transition-all duration-300">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: General Settings */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                الضبط العام للتطبيق
              </h2>

              <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم التطبيق التجريبي</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    required
                    placeholder="أدخل اسم التطبيق"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary focus:border-primary text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">يتغير فوراً في أعلى القائمة الجانبية عند الحفظ.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العملة الافتراضية</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary focus:border-primary text-sm bg-white"
                  >
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="EUR">يورو (EUR)</option>
                    <option value="AED">درهم إماراتي (AED)</option>
                    <option value="KWD">دينار كويتي (KWD)</option>
                    <option value="QAR">ريال قطري (QAR)</option>
                    <option value="EGP">جنيه مصري (EGP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">لغة التطبيق</label>
                  <div className="relative">
                    <select
                      value={lang}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                    >
                      <option value="ar">العربية (RTL)</option>
                    </select>
                    <span className="absolute left-3 top-2 px-1.5 py-0.5 text-[10px] font-bold text-white bg-green-500 rounded-md">
                      اللغة الحالية الوحيدة
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">تنسيق اتجاه الصفحات معتمد بشكل كامل من اليمين إلى اليسار.</p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-green-600 text-white font-medium py-2 rounded-lg text-sm shadow-sm transition-colors mt-6"
                >
                  حفظ الضبط العام
                </button>
              </form>
            </div>
          </div>

          {/* Right/Middle Columns: Categories & Subcategories */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category and Subcategory Layout */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  إدارة الأقسام والأصناف الفرعية
                </h2>
                <button
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="bg-primary hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  {showAddCategory ? 'إلغاء' : 'إضافة قسم جديد'}
                </button>
              </div>

              {/* Add Category Form Overlay */}
              {showAddCategory && (
                <div className="p-6 bg-green-50/50 border-b border-gray-100">
                  <form onSubmit={handleAddCategory} className="space-y-4">
                    <h3 className="text-sm font-bold text-green-800">إضافة قسم رئيسي جديد</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">اسم القسم (بالعربية)</label>
                        <input
                          type="text"
                          required
                          value={newCategoryData.nameAr}
                          onChange={(e) => setNewCategoryData({ ...newCategoryData, nameAr: e.target.value })}
                          placeholder="مثال: اشتراكات، إيجار..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-primary focus:border-primary bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">النوع</label>
                        <select
                          value={newCategoryData.type}
                          onChange={(e) => setNewCategoryData({ ...newCategoryData, type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-primary focus:border-primary bg-white"
                        >
                          <option value="expense">مصروف (Expense)</option>
                          <option value="income">دخل (Income)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">اللون المميز</label>
                        <div className="flex space-x-1 space-x-reverse items-center h-8">
                          {colors.map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewCategoryData({ ...newCategoryData, color })}
                              className={`w-5 h-5 rounded-full border ${newCategoryData.color === color ? 'ring-2 ring-primary ring-offset-1 scale-110' : ''}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 space-x-reverse mt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddCategory(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 bg-white"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary hover:bg-green-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        إضافة القسم
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {loading ? (
                <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-x-reverse divide-gray-100 min-h-[400px]">
                  {/* Category Selection List */}
                  <div className="p-6">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">الأقسام الرئيسية</h3>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {categories.map(category => (
                        <div
                          key={category.id}
                          onClick={() => setSelectedCategory(category)}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                            selectedCategory?.id === category.id
                              ? 'bg-green-50 border-green-200 ring-1 ring-primary'
                              : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <span
                              className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <span className="text-sm font-semibold text-gray-900">{category.nameAr}</span>
                              <span className="text-[10px] text-gray-400 block">
                                {category.type === 'income' ? 'قسم دخل' : 'قسم مصروف'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <span className="text-[10px] px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">
                              {(category.subcategories || []).length} أصناف
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCategory(category.id);
                              }}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-white rounded-md transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subcategories Management Panel */}
                  <div className="p-6 bg-gray-50/30">
                    {selectedCategory ? (
                      <div>
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                          <div>
                            <h3 className="text-sm font-bold text-gray-800">
                              الأصناف الفرعية لقسم <span className="text-primary">{selectedCategory.nameAr}</span>
                            </h3>
                            <p className="text-[11px] text-gray-500">قم بإضافة أصناف مخصصة دقيقة لمراقبة تفاصيل الصرف.</p>
                          </div>
                        </div>

                        {/* Add Subcategory Form */}
                        <form onSubmit={handleAddSubcategory} className="flex space-x-2 space-x-reverse mb-4">
                          <input
                            type="text"
                            required
                            value={newSubcategoryName}
                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                            placeholder="صنف فرعي جديد (مثال: صيانة سيارة، مطاعم فطور...)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-primary focus:border-primary bg-white shadow-sm"
                          />
                          <button
                            type="submit"
                            className="bg-primary hover:bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8l-8 8-8-8" />
                            </svg>
                            إضافة
                          </button>
                        </form>

                        {/* Subcategories List */}
                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                          {(selectedCategory.subcategories || []).length > 0 ? (
                            selectedCategory.subcategories.map(sub => (
                              <div
                                key={sub.id}
                                className="flex justify-between items-center bg-white border border-gray-150 p-2.5 rounded-lg shadow-sm hover:shadow transition-shadow"
                              >
                                <span className="text-xs font-medium text-gray-800">{sub.nameAr}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubcategory(sub.id)}
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-md transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-10 text-xs text-gray-500">
                              لا توجد فئات فرعية مضافة في هذا القسم حالياً.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-xs font-semibold">الرجاء تحديد قسم رئيسي من القائمة على اليمين للتحكم في فئاته الفرعية.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
