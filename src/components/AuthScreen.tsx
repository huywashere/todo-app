import { useState } from 'react';
import { CheckCircle2, Cloud, LockKeyhole, WifiOff } from 'lucide-react';
import { ApiError, authService } from '../services/api';
import type { AuthSession } from '../types/todo';

interface AuthScreenProps {
  onAuthenticated: (session: AuthSession) => void;
  onOffline: () => void;
}

export function AuthScreen({ onAuthenticated, onOffline }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('demo@todo.local');
  const [password, setPassword] = useState('TodoDemo!2026');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      if (mode === 'forgot') {
        const result = await authService.forgotPassword(email);
        if (result.developmentToken) setResetToken(result.developmentToken);
        setMessage(`${result.message}${result.developmentToken ? ' Mã demo đã được điền tự động.' : ''}`);
        setMode('reset');
        return;
      }
      if (mode === 'reset') {
        await authService.resetPassword(resetToken, password);
        setMessage('Đặt lại mật khẩu thành công. Bạn có thể đăng nhập.');
        setMode('login');
        return;
      }
      const session = mode === 'login'
        ? await authService.login(email, password)
        : await authService.register(displayName, email, password);
      onAuthenticated(session);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể kết nối máy chủ. Bạn có thể dùng chế độ ngoại tuyến.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-showcase" aria-label="Giới thiệu sản phẩm">
        <div className="auth-brand"><CheckCircle2 size={28} /> FocusFlow</div>
        <div>
          <span className="auth-kicker">OFFLINE-FIRST TASK MANAGEMENT</span>
          <h1>Lập kế hoạch rõ ràng.<br />Hoàn thành đúng lúc.</h1>
          <p>Quản lý công việc trên mọi thiết bị với đồng bộ an toàn, lịch biểu trực quan và trải nghiệm tập trung.</p>
        </div>
        <div className="auth-benefits">
          <span><Cloud size={16} /> Đồng bộ nhiều thiết bị</span>
          <span><LockKeyhole size={16} /> Dữ liệu riêng theo tài khoản</span>
          <span><WifiOff size={16} /> Tiếp tục làm việc khi mất mạng</span>
        </div>
      </section>

      <section className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <div>
            <span className="auth-eyebrow">FOCUSFLOW WORKSPACE</span>
            <h2>{mode === 'login' ? 'Chào mừng trở lại' : mode === 'register' ? 'Tạo không gian làm việc' : mode === 'forgot' ? 'Khôi phục tài khoản' : 'Đặt mật khẩu mới'}</h2>
            <p>{mode === 'login' ? 'Đăng nhập để đồng bộ công việc của bạn.' : mode === 'register' ? 'Bắt đầu với tài khoản miễn phí dành cho cá nhân.' : mode === 'forgot' ? 'Nhập email để nhận mã đặt lại mật khẩu.' : 'Nhập mã xác nhận và mật khẩu mới.'}</p>
          </div>

          {mode === 'register' && (
            <label>
              Tên hiển thị
              <input value={displayName} onChange={event => setDisplayName(event.target.value)} required maxLength={120} autoComplete="name" />
            </label>
          )}
          {mode !== 'reset' && <label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" /></label>}
          {mode === 'reset' && <label>Mã đặt lại mật khẩu<input value={resetToken} onChange={event => setResetToken(event.target.value)} required /></label>}
          {mode !== 'forgot' && <label>Mật khẩu{mode === 'reset' ? ' mới' : ''}<input type="password" value={password} onChange={event => setPassword(event.target.value)} required minLength={10} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>}

          {error && <div className="auth-error" role="alert">{error}</div>}
          {message && <div className="auth-success" role="status">{message}</div>}

          <button className="auth-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang kết nối…' : mode === 'login' ? 'Đăng nhập' : mode === 'register' ? 'Tạo tài khoản' : mode === 'forgot' ? 'Tạo mã khôi phục' : 'Đặt lại mật khẩu'}
          </button>
          <button className="auth-secondary" type="button" onClick={onOffline}>
            <WifiOff size={16} /> Tiếp tục ngoại tuyến
          </button>

          {(mode === 'login' || mode === 'register') && <p className="auth-switch">
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </p>}
          {mode === 'login' && <button type="button" className="auth-link" onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}>Quên mật khẩu?</button>}
          {(mode === 'forgot' || mode === 'reset') && <button type="button" className="auth-link" onClick={() => { setMode('login'); setError(''); }}>Quay lại đăng nhập</button>}
          {mode === 'login' && <small>Tài khoản demo đã được điền sẵn để bạn trải nghiệm.</small>}
        </form>
      </section>
    </main>
  );
}
