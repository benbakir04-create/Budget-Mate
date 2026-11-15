import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout, { authError } from '../components/auth/AuthLayout';
import { TextField, SubmitButton } from '../components/common/Sheet';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(authError(err, 'تعذّر تسجيل الدخول، حاول مرة أخرى.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="أهلًا بعودتك" subtitle="ادخل لترى صندوق البيت وآخر المصاريف.">
      <form onSubmit={handleSubmit}>
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
          label="كلمة المرور"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && (
          <p
            role="alert"
            className="mb-3 rounded-2xl bg-alert-50 dark:bg-alert-500/15 px-4 py-3 text-sm font-medium text-alert-600 dark:text-alert-400"
          >
            {error}
          </p>
        )}
        <SubmitButton disabled={loading || !email || !password}>
          {loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
        </SubmitButton>
      </form>
      <p className="mt-5 text-center text-sm text-stone-500 dark:text-stone-400">
        ليس لديك حساب؟{' '}
        <Link to="/register" className="font-semibold text-brand-600 dark:text-brand-300">
          أنشئ حسابك
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
