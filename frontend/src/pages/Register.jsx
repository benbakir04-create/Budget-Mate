import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout, { authError } from '../components/auth/AuthLayout';
import { TextField, SubmitButton } from '../components/common/Sheet';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('كلمة المرور 8 أحرف على الأقل.');
      return;
    }
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(authError(err, 'تعذّر إنشاء الحساب، حاول مرة أخرى.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="أنشئ حسابك" subtitle="أنت مالك الحساب: تنشئ صندوق البيت وتضيف شريكك لاحقًا.">
      <form onSubmit={handleSubmit}>
        <TextField
          label="الاسم"
          required
          autoComplete="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="مثال: علي"
        />
        <TextField
          label="البريد الإلكتروني"
          type="email"
          dir="ltr"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="name@example.com"
        />
        <TextField
          label="كلمة المرور (8 أحرف على الأقل)"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <TextField
          label="أعد كتابة كلمة المرور"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />
        {error && (
          <p
            role="alert"
            className="mb-3 rounded-2xl bg-alert-50 dark:bg-alert-500/15 px-4 py-3 text-sm font-medium text-alert-600 dark:text-alert-400"
          >
            {error}
          </p>
        )}
        <SubmitButton disabled={loading || !name || !email || !password || !confirm}>
          {loading ? 'جارٍ الإنشاء...' : 'أنشئ الحساب'}
        </SubmitButton>
      </form>
      <p className="mt-5 text-center text-sm text-stone-500 dark:text-stone-400">
        لديك حساب؟{' '}
        <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-300">
          سجّل الدخول
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
