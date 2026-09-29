import { useState } from 'react';
import { CheckCircle2, KeyRound, LogOut, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import { ApiError, authService } from '../services/api';
import type { AuthSession, AuthUser } from '../types/todo';

interface AccountPanelProps {
  session: AuthSession;
  onClose: () => void;
  onUserUpdated: (user: AuthUser) => void;
  onLogout: () => void;
  onAccountDeleted: () => void;
}

export function AccountPanel({ session, onClose, onUserUpdated, onLogout, onAccountDeleted }: AccountPanelProps) {
  const [displayName, setDisplayName] = useState(session.user.displayName);
  const [timezone, setTimezone] = useState(session.user.timezone || 'Asia/Ho_Chi_Minh');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError(''); setMessage('');
    try { await action(); } catch (reason) { setError(reason instanceof ApiError ? reason.message : 'Không thể hoàn thành thao tác'); }
    finally { setBusy(false); }
  };

  return (
    <div className="workspace-overlay" onClick={onClose}>
      <aside className="workspace-drawer account-drawer" onClick={event => event.stopPropagation()} aria-label="Tài khoản">
        <header><div><span className="pane-kicker"><UserRound size={14} /> Account</span><h2>Tài khoản</h2></div><button type="button" className="icon-btn-ghost" onClick={onClose}><X size={18} /></button></header>
        <div className="account-section">
          <h3>Hồ sơ</h3>
          <label>Email<input value={session.user.email} disabled /></label>
          <label>Tên hiển thị<input value={displayName} onChange={event => setDisplayName(event.target.value)} /></label>
          <label>Múi giờ<select value={timezone} onChange={event => setTimezone(event.target.value)}><option value="Asia/Ho_Chi_Minh">Việt Nam (UTC+7)</option><option value="Asia/Bangkok">Bangkok (UTC+7)</option><option value="UTC">UTC</option><option value="Asia/Tokyo">Tokyo (UTC+9)</option></select></label>
          <button type="button" className="primary-action" disabled={busy} onClick={() => void run(async () => { const user = await authService.updateProfile(displayName, timezone); onUserUpdated(user); setMessage('Đã cập nhật hồ sơ.'); })}>Lưu hồ sơ</button>
        </div>
        <div className="account-section">
          <h3><ShieldCheck size={16} /> Xác minh email</h3>
          {session.user.emailVerified ? <p className="verified-copy"><CheckCircle2 size={16} /> Email đã được xác minh</p> : <>
            <button type="button" className="secondary-action" disabled={busy} onClick={() => void run(async () => { const result = await authService.requestEmailVerification(); setVerificationToken(result.developmentToken || ''); setMessage(result.message); })}>Tạo mã xác minh</button>
            <label>Mã xác minh<input value={verificationToken} onChange={event => setVerificationToken(event.target.value)} /></label>
            <button type="button" className="primary-action" disabled={busy || !verificationToken} onClick={() => void run(async () => { const user = await authService.verifyEmail(verificationToken); onUserUpdated(user); setMessage('Email đã được xác minh.'); })}>Xác nhận email</button>
          </>}
        </div>
        <div className="account-section">
          <h3><KeyRound size={16} /> Đổi mật khẩu</h3>
          <label>Mật khẩu hiện tại<input type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /></label>
          <label>Mật khẩu mới<input type="password" minLength={10} value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label>
          <button type="button" className="primary-action" disabled={busy || newPassword.length < 10} onClick={() => void run(async () => { await authService.changePassword(currentPassword, newPassword); setCurrentPassword(''); setNewPassword(''); setMessage('Đã đổi mật khẩu. Hãy đăng nhập lại ở lần tiếp theo.'); })}>Đổi mật khẩu</button>
        </div>
        {message && <p className="account-message success">{message}</p>}
        {error && <p className="account-message error">{error}</p>}
        <div className="account-section account-danger">
          <button type="button" className="secondary-action" onClick={onLogout}><LogOut size={15} /> Đăng xuất</button>
          <label>Mật khẩu để xóa tài khoản<input type="password" value={deletePassword} onChange={event => setDeletePassword(event.target.value)} /></label>
          <button type="button" className="danger-action" disabled={busy || !deletePassword} onClick={() => { if (window.confirm('Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu?')) void run(async () => { await authService.deleteAccount(deletePassword); onAccountDeleted(); }); }}><Trash2 size={15} /> Xóa tài khoản</button>
        </div>
      </aside>
    </div>
  );
}
