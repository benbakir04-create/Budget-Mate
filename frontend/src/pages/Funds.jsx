import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/common/Sidebar';
import { jointFundService } from '../services/jointFundService';
import { shoppingOrderService } from '../services/shoppingOrderService';
import { categoryService } from '../services/categoryService';
import { authService } from '../services/authService';

const Funds = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Tab control: 'funds', 'orders', 'invite'
  const [activeTab, setActiveTab] = useState('funds');
  
  // Data states
  const [funds, setFunds] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedFund, setSelectedFund] = useState(null);
  const [fundDetails, setFundDetails] = useState(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Modals state
  const [showCreateFund, setShowCreateFund] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showPurchaseOrder, setShowPurchaseOrder] = useState(false);
  
  // Form states
  const [fundName, setFundName] = useState('');
  const [fundInitialBalance, setFundInitialBalance] = useState('');
  
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDesc, setDepositDesc] = useState('');
  
  const [newOrderTitle, setNewOrderTitle] = useState('');
  const [newOrderEstAmount, setNewOrderEstAmount] = useState('');
  const [newOrderFundId, setNewOrderFundId] = useState('');
  
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [purchaseOrderTitle, setPurchaseOrderTitle] = useState('');
  const [purchaseEstAmount, setPurchaseEstAmount] = useState('');
  const [purchaseActualAmount, setPurchaseActualAmount] = useState('');
  const [purchaseCategoryId, setPurchaseCategoryId] = useState('');
  const [purchaseDesc, setPurchaseDesc] = useState('');
  
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPassword, setPartnerPassword] = useState('');

  // Load basic data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fundsList = await jointFundService.getJointFunds();
      setFunds(fundsList);
      
      const ordersList = await shoppingOrderService.getShoppingOrders();
      setOrders(ordersList);
      
      const catsList = await categoryService.getCategories();
      // Filter only expense categories
      setCategories(catsList.filter(c => c.type === 'expense'));
      
      // Auto-select first fund if available
      if (fundsList.length > 0) {
        handleSelectFund(fundsList[0]);
      }
    } catch (err) {
      console.error(err);
      setError('فشل في تحميل البيانات، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFund = async (fund) => {
    setSelectedFund(fund);
    try {
      const details = await jointFundService.getJointFund(fund.id);
      setFundDetails(details);
    } catch (err) {
      console.error('Error loading fund details:', err);
    }
  };

  // 1. Create Fund Submit
  const handleCreateFundSubmit = async (e) => {
    e.preventDefault();
    if (!fundName) return;
    
    try {
      setSubmitting(true);
      setError(null);
      await jointFundService.createJointFund({
        name: fundName,
        initialBalance: fundInitialBalance ? parseFloat(fundInitialBalance) : 0
      });
      
      setSuccessMsg('تم إنشاء الصندوق بنجاح');
      setFundName('');
      setFundInitialBalance('');
      setShowCreateFund(false);
      
      // Reload
      await loadAllData();
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'فشل في إنشاء الصندوق');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Deposit Money Submit
  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFund || !depositAmount) return;
    
    try {
      setSubmitting(true);
      setError(null);
      await jointFundService.addMoneyToFund(selectedFund.id, {
        amount: parseFloat(depositAmount),
        description: depositDesc
      });
      
      setSuccessMsg('تم ضخ التمويل للصندوق بنجاح');
      setDepositAmount('');
      setDepositDesc('');
      setShowAddMoney(false);
      
      // Reload Details
      await handleSelectFund(selectedFund);
      // Reload All Funds List
      const fundsList = await jointFundService.getJointFunds();
      setFunds(fundsList);
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'فشل في عملية الإيداع');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Request Shopping Order Submit
  const handleRequestOrderSubmit = async (e) => {
    e.preventDefault();
    const fundId = newOrderFundId || (funds.length > 0 ? funds[0].id : '');
    if (!newOrderTitle || !newOrderEstAmount || !fundId) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      await shoppingOrderService.createShoppingOrder({
        title: newOrderTitle,
        estAmount: parseFloat(newOrderEstAmount),
        fundId: fundId
      });
      
      setSuccessMsg('تم إرسال طلب الشراء بنجاح بانتظار موافقة المالك');
      setNewOrderTitle('');
      setNewOrderEstAmount('');
      
      // Reload
      const ordersList = await shoppingOrderService.getShoppingOrders();
      setOrders(ordersList);
      
      if (selectedFund && selectedFund.id === fundId) {
        await handleSelectFund(selectedFund);
      }
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'فشل في إرسال طلب الشراء');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Approve Order
  const handleApproveOrder = async (orderId) => {
    try {
      setError(null);
      await shoppingOrderService.approveShoppingOrder(orderId);
      setSuccessMsg('تم اعتماد طلب الشراء بنجاح');
      
      // Reload
      const ordersList = await shoppingOrderService.getShoppingOrders();
      setOrders(ordersList);
      if (selectedFund) {
        await handleSelectFund(selectedFund);
      }
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'فشل في اعتماد الطلب');
    }
  };

  // 5. Delete Order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف/إلغاء هذا الطلب؟')) return;
    try {
      setError(null);
      await shoppingOrderService.deleteShoppingOrder(orderId);
      setSuccessMsg('تم إلغاء الطلب بنجاح');
      
      // Reload
      const ordersList = await shoppingOrderService.getShoppingOrders();
      setOrders(ordersList);
      if (selectedFund) {
        await handleSelectFund(selectedFund);
      }
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'فشل في حذف الطلب');
    }
  };

  // 6. Open Purchase Dialog
  const openPurchaseDialog = (order) => {
    setPurchaseOrderId(order.id);
    setPurchaseOrderTitle(order.title);
    setPurchaseEstAmount(order.estAmount);
    setPurchaseActualAmount(order.estAmount);
    setPurchaseDesc(`شراء طلب: ${order.title}`);
    
    // Choose first category as default
    if (categories.length > 0) {
      setPurchaseCategoryId(categories[0].id);
    } else {
      setPurchaseCategoryId('');
    }
    
    setShowPurchaseOrder(true);
  };

  // 7. Purchase (Debit Joint Fund & convert to transaction)
  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!purchaseOrderId || !purchaseActualAmount || !purchaseCategoryId) {
      setError('يرجى تحديد المبلغ الفعلي والتصنيف');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      await shoppingOrderService.purchaseShoppingOrder(purchaseOrderId, {
        actualAmount: parseFloat(purchaseActualAmount),
        categoryId: purchaseCategoryId,
        description: purchaseDesc
      });
      
      setSuccessMsg('تم تسجيل عملية الشراء وخصم المبلغ من الصندوق بنجاح');
      setShowPurchaseOrder(false);
      
      // Reload All
      await loadAllData();
      if (selectedFund) {
        const updatedFund = funds.find(f => f.id === selectedFund.id);
        if (updatedFund) {
          await handleSelectFund(updatedFund);
        }
      }
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'فشل في إتمام عملية الشراء');
    } finally {
      setSubmitting(false);
    }
  };

  // 8. Invite Partner Submit
  const handleInvitePartnerSubmit = async (e) => {
    e.preventDefault();
    if (!partnerName || !partnerEmail || !partnerPassword) {
      setError('يرجى إدخال جميع معلومات الشريك');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      await authService.registerPartner(partnerName, partnerEmail, partnerPassword);
      
      setSuccessMsg(`تم تسجيل الشريك "${partnerName}" بنجاح! يمكنه الآن تسجيل الدخول.`);
      setPartnerName('');
      setPartnerEmail('');
      setPartnerPassword('');
      
      setTimeout(() => setSuccessMsg(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] flex transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 max-w-7xl mx-auto p-4 md:p-8 md:mr-64 transition-all duration-300">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
              إدارة الصناديق والطلبيات المشتركة
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base">
              إدارة المصاريف العائلية والعهد المالية المشتركة مع شركائك بكل شفافية وفخامة.
            </p>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border-r-4 border-rose-500 text-rose-800 dark:text-rose-400 rounded-xl font-bold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border-r-4 border-emerald-500 text-emerald-800 dark:text-emerald-400 rounded-xl font-bold flex items-center animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {successMsg}
          </div>
        )}

        {/* Tab Navigation Menu */}
        <div className="flex space-x-2 space-x-reverse mb-8 p-1.5 bg-slate-100 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.05] rounded-2xl w-max">
          <button
            onClick={() => setActiveTab('funds')}
            className={`px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              activeTab === 'funds'
                ? 'bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            الصناديق المشتركة
          </button>
          
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              activeTab === 'orders'
                ? 'bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            طلبيات الشراء ({orders.filter(o => o.status !== 'purchased').length})
          </button>

          {user.role === 'owner' && (
            <button
              onClick={() => setActiveTab('invite')}
              className={`px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'invite'
                  ? 'bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              دعوة الشركاء
            </button>
          )}
        </div>

        {/* Content Loading State */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: FUNDS LIST */}
            {activeTab === 'funds' && (
              <div className="space-y-10">
                {/* Header Action inside tab */}
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">الصناديق المتاحة</h2>
                  {user.role === 'owner' && (
                    <button
                      onClick={() => setShowCreateFund(true)}
                      className="bg-primary hover:bg-emerald-600 text-white px-5 py-3 rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center space-x-2 space-x-reverse"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8l-8 8-8-8" />
                      </svg>
                      <span>إنشاء صندوق جديد</span>
                    </button>
                  )}
                </div>

                {/* Funds Grid */}
                {funds.length === 0 ? (
                  <div className="premium-card p-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="bg-slate-100 dark:bg-[#0f172a] h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-200 dark:border-white/[0.05]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="font-extrabold text-lg text-slate-800 dark:text-slate-200">لا توجد صناديق مشتركة حالياً</p>
                    <p className="text-sm mt-1">الرجاء الضغط على زر "إنشاء صندوق جديد" للبدء.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Funds List cards */}
                    <div className="lg:col-span-1 space-y-4">
                      {funds.map((fund) => {
                        const isSelected = selectedFund && selectedFund.id === fund.id;
                        return (
                          <div
                            key={fund.id}
                            onClick={() => handleSelectFund(fund)}
                            className={`p-6 rounded-[2rem] cursor-pointer transition-all duration-300 border ${
                              isSelected
                                ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl scale-[1.02] border-slate-700 dark:border-white/10'
                                : 'bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white border-slate-100 dark:border-white/[0.05] hover:border-primary/40 hover:-translate-y-1 shadow-[0_4px_20px_rgb(0,0,0,0.02)]'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                              }`}>
                                {fund.ownerId === user.id ? 'أنت المالك' : 'شريك'}
                              </span>
                              
                              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isSelected ? 'text-white/60' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            </div>

                            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                              الرصيد المتاح
                            </p>
                            <div className="flex items-end mb-4">
                              <p className="text-3xl font-extrabold tracking-tight">
                                {fund.balance.toLocaleString()}
                              </p>
                              <span className="text-sm font-medium mr-1.5 mb-1 opacity-70">{user.currency || 'SAR'}</span>
                            </div>

                            <h3 className="text-lg font-extrabold truncate">{fund.name}</h3>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column: Selected Fund Details Panel */}
                    <div className="lg:col-span-2">
                      {selectedFund ? (
                        <div className="premium-card p-8 space-y-8">
                          
                          {/* Top Detail Card Header */}
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 dark:border-white/[0.05] pb-6 space-y-4 md:space-y-0">
                            <div>
                              <div className="flex items-center space-x-3 space-x-reverse mb-1">
                                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{selectedFund.name}</h3>
                                <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 dark:border-transparent">نشط</span>
                              </div>
                              <p className="text-slate-500 dark:text-slate-400 text-sm">أُنشئ في {new Date(selectedFund.createdAt).toLocaleDateString()}</p>
                            </div>
                            
                            {user.role === 'owner' && (
                              <div className="flex space-x-2 space-x-reverse">
                                <button
                                  onClick={() => setShowAddMoney(true)}
                                  className="bg-primary hover:bg-emerald-600 text-white px-5 py-3 rounded-full font-bold shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all flex items-center space-x-1.5 space-x-reverse"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8l-8 8-8-8" />
                                  </svg>
                                  <span>ضخ تمويل للصندوق</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Stats Info Grid inside fund */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-slate-50 dark:bg-white/[0.01] rounded-2xl border border-slate-100 dark:border-white/[0.03]">
                              <span className="text-slate-400 text-xs font-bold uppercase">الرصيد الكلي</span>
                              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                                {selectedFund.balance.toLocaleString()} <span className="text-lg font-medium text-slate-400">{user.currency || 'SAR'}</span>
                              </p>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-white/[0.01] rounded-2xl border border-slate-100 dark:border-white/[0.03]">
                              <span className="text-slate-400 text-xs font-bold uppercase">إجمالي العمليات المسجلة</span>
                              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                                {fundDetails?.transactions?.length || 0} عملية
                              </p>
                            </div>
                          </div>

                          {/* Recent Transactions inside this Joint Fund */}
                          <div>
                            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">آخر العمليات على الصندوق</h4>
                            {fundDetails?.transactions && fundDetails.transactions.length > 0 ? (
                              <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                                {fundDetails.transactions.map((tx) => (
                                  <div key={tx.id} className="py-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-3 space-x-reverse">
                                      <div className={`p-3 rounded-xl ${tx.type === 'income' ? 'bg-green-50 dark:bg-green-500/10 text-green-500' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          {tx.type === 'income' ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8l-8 8-8-8" />
                                          ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 20V4m8 8l-8-8-8 8" />
                                          )}
                                        </svg>
                                      </div>
                                      <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{tx.description}</p>
                                        <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-400 font-medium">
                                          <span>بواسطة {tx.user?.name}</span>
                                          <span>•</span>
                                          <span>{new Date(tx.date).toLocaleDateString()}</span>
                                          <span>•</span>
                                          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{tx.category?.nameAr || tx.category?.name}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <span className={`font-extrabold text-sm ${tx.type === 'income' ? 'text-green-500' : 'text-slate-900 dark:text-white'}`}>
                                      {tx.type === 'income' ? '+' : '-'}{parseFloat(tx.amount).toLocaleString()} {user.currency || 'SAR'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-400 text-sm py-4">لا توجد عمليات مسجلة على هذا الصندوق حتى الآن.</p>
                            )}
                          </div>

                        </div>
                      ) : (
                        <div className="premium-card p-12 text-center text-slate-400">
                          يرجى اختيار صندوق من القائمة الجانبية لعرض تفاصيله وإدارته.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SHOPPING ORDERS */}
            {activeTab === 'orders' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side: request shopping order form */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="premium-card p-7">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-5">طلب شراء جديد</h3>
                    
                    {funds.length === 0 ? (
                      <p className="text-sm text-slate-400">يرجى إنشاء صندوق مشترك أولاً قبل طلب الشراء.</p>
                    ) : (
                      <form onSubmit={handleRequestOrderSubmit} className="space-y-4">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">اسم الطلب / الغرض</label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: مقاضي السوبرماركت للشهر"
                            value={newOrderTitle}
                            onChange={(e) => setNewOrderTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:border-primary text-slate-900 dark:text-white text-sm transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">المبلغ التقريبي المطلق (SAR)</label>
                          <input
                            type="number"
                            required
                            placeholder="0.00"
                            value={newOrderEstAmount}
                            onChange={(e) => setNewOrderEstAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:border-primary text-slate-900 dark:text-white text-sm transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">الصندوق التمويلي المشترك</label>
                          <select
                            value={newOrderFundId}
                            onChange={(e) => setNewOrderFundId(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:border-primary text-slate-900 dark:text-white text-sm transition-all"
                          >
                            <option value="">-- اختر الصندوق المشترك --</option>
                            {funds.map((f) => (
                              <option key={f.id} value={f.id}>{f.name} (رصيد: {f.balance.toLocaleString()} {user.currency || 'SAR'})</option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full bg-primary hover:bg-emerald-600 disabled:bg-slate-400 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all text-sm mt-2"
                        >
                          {submitting ? 'جاري الإرسال...' : 'إرسال طلب الشراء'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Right side: Shopping orders list */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="premium-card p-7">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6">قائمة الطلبات الجارية</h3>

                    {orders.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="font-bold">لا توجد طلبات شراء مسجلة حالياً</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => {
                          const isPending = order.status === 'pending_approval';
                          const isApproved = order.status === 'approved';
                          return (
                            <div
                              key={order.id}
                              className="p-5 bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/[0.03] rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0"
                            >
                              <div>
                                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{order.title}</h4>
                                  
                                  {isPending && (
                                    <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-500 px-2 py-0.5 border border-amber-100 dark:border-transparent rounded-full text-xs font-bold">بانتظار موافقة المالك</span>
                                  )}
                                  {isApproved && (
                                    <span className="bg-green-50 dark:bg-green-500/10 text-green-500 px-2 py-0.5 border border-green-100 dark:border-transparent rounded-full text-xs font-bold">معتمد للشراء</span>
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                  <span>الصندوق: <strong className="text-slate-700 dark:text-slate-200">{order.fund?.name}</strong></span>
                                  <span>•</span>
                                  <span>المبلغ المقدر: <strong className="text-slate-700 dark:text-slate-200">{order.estAmount.toLocaleString()} {user.currency || 'SAR'}</strong></span>
                                  <span>•</span>
                                  <span>تاريخ الطلب: {new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="flex space-x-2 space-x-reverse w-full md:w-auto">
                                {/* Owner Actions on Pending */}
                                {isPending && user.role === 'owner' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveOrder(order.id)}
                                      className="bg-primary hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                                    >
                                      اعتماد
                                    </button>
                                    <button
                                      onClick={() => handleDeleteOrder(order.id)}
                                      className="bg-rose-50 dark:bg-rose-500/15 text-rose-500 hover:bg-rose-100 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                    >
                                      رفض الطلب
                                    </button>
                                  </>
                                )}

                                {/* Partner Action on pending (only delete own) */}
                                {isPending && user.role !== 'owner' && (
                                  <button
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="bg-rose-50 dark:bg-rose-500/15 text-rose-500 hover:bg-rose-100 px-4 py-2 rounded-xl text-xs font-bold transition-all w-full md:w-auto text-center"
                                  >
                                    إلغاء الطلب
                                  </button>
                                )}

                                {/* Purchase Action on Approved */}
                                {isApproved && (
                                  <>
                                    <button
                                      onClick={() => openPurchaseDialog(order)}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1 space-x-reverse"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      <span>تأكيد الشراء الفعلي</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteOrder(order.id)}
                                      className="bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                    >
                                      حذف
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PARTNER INVITATION (Owner Only) */}
            {activeTab === 'invite' && user.role === 'owner' && (
              <div className="max-w-2xl mx-auto">
                <div className="premium-card p-8">
                  <div className="text-center max-w-md mx-auto mb-8">
                    <div className="bg-primary/10 dark:bg-primary/20 h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">تسجيل شريك مالي جديد</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">سجل حساباً لشريكك لكي يدخل للتطبيق ويطلب طلبيات شرائية ويتحكم في الصناديق المشتركة.</p>
                  </div>

                  <form onSubmit={handleInvitePartnerSubmit} className="space-y-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">اسم الشريك الكامل</label>
                      <input
                        type="text"
                        required
                        placeholder="اسم الشريك (مثال: نورة أو محمد)"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:border-primary text-slate-900 dark:text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">البريد الإلكتروني للشريك</label>
                      <input
                        type="email"
                        required
                        placeholder="partner@example.com"
                        value={partnerEmail}
                        onChange={(e) => setPartnerEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:border-primary text-slate-900 dark:text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">كلمة المرور للشريك</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={partnerPassword}
                        onChange={(e) => setPartnerPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:border-primary text-slate-900 dark:text-white text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-primary hover:bg-emerald-600 disabled:bg-slate-400 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all text-sm mt-4"
                    >
                      {submitting ? 'جاري التسجيل...' : 'تسجيل الشريك الآن'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODALS SECTION */}
      {/* ========================================================================= */}

      {/* 1. Create Joint Fund Modal */}
      {showCreateFund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir="rtl">
          <div className="bg-white dark:bg-[#0f172a] rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-slate-100 dark:border-white/5 animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">إنشاء صندوق جديد</h3>
              <button
                onClick={() => setShowCreateFund(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateFundSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">اسم الصندوق</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ميزانية البقالة / مصروف المنزل"
                  value={fundName}
                  onChange={(e) => setFundName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:border-primary text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">التمويل الأولي (اختياري)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={fundInitialBalance}
                  onChange={(e) => setFundInitialBalance(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:border-primary text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="flex space-x-2 space-x-reverse pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary hover:bg-emerald-600 disabled:bg-slate-400 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all text-sm"
                >
                  {submitting ? 'جاري الإنشاء...' : 'تأكيد الإنشاء'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateFund(false)}
                  className="px-6 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 rounded-2xl font-bold text-sm"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Deposit Money Modal */}
      {showAddMoney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir="rtl">
          <div className="bg-white dark:bg-[#0f172a] rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-slate-100 dark:border-white/5 animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">ضخ تمويل إضافي</h3>
              <button
                onClick={() => setShowAddMoney(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                أنت تقوم بضخ تمويل مالي مباشر إلى صندوق: <strong className="text-slate-900 dark:text-white font-extrabold">{selectedFund?.name}</strong>
              </p>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">المبلغ المراد إضافته (SAR)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:border-primary text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">الوصف / التفاصيل</label>
                <input
                  type="text"
                  placeholder="مثال: تمويل دورة البقالة الجديدة"
                  value={depositDesc}
                  onChange={(e) => setDepositDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:border-primary text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="flex space-x-2 space-x-reverse pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary hover:bg-emerald-600 disabled:bg-slate-400 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all text-sm"
                >
                  {submitting ? 'جاري التمويل...' : 'تأكيد التمويل'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMoney(false)}
                  className="px-6 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 rounded-2xl font-bold text-sm"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Confirm Purchase Order Modal */}
      {showPurchaseOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir="rtl">
          <div className="bg-white dark:bg-[#0f172a] rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-slate-100 dark:border-white/5 animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">تأكيد عملية الشراء</h3>
              <button
                onClick={() => setShowPurchaseOrder(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                تسجيل شراء غرض: <strong className="text-slate-900 dark:text-white font-extrabold">{purchaseOrderTitle}</strong>
              </p>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">المبلغ الفعلي المدفوع (SAR)</label>
                <input
                  type="number"
                  required
                  placeholder={purchaseEstAmount}
                  value={purchaseActualAmount}
                  onChange={(e) => setPurchaseActualAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:border-primary text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">تصنيف المصروف</label>
                <select
                  required
                  value={purchaseCategoryId}
                  onChange={(e) => setPurchaseCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:border-primary text-slate-900 dark:text-white text-sm transition-all"
                >
                  <option value="">-- اختر التصنيف --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nameAr || cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">الوصف</label>
                <input
                  type="text"
                  placeholder="الوصف أو اسم المحل"
                  value={purchaseDesc}
                  onChange={(e) => setPurchaseDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:border-primary text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="flex space-x-2 space-x-reverse pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary hover:bg-emerald-600 disabled:bg-slate-400 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all text-sm"
                >
                  {submitting ? 'جاري التسجيل والخصم...' : 'تأكيد الشراء والخصم'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPurchaseOrder(false)}
                  className="px-6 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 rounded-2xl font-bold text-sm"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Funds;
