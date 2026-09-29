'use client';
import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Phone, ArrowRight, Check, Eye, EyeOff, Building2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { saveAuth, UserAuthData } from '@/lib/auth';

function AdminLoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ phone: '0388430402', password: '' });
  const [obscurePassword, setObscurePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = form.phone.trim();
    const password = form.password.trim();

    if (!phone || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Số điện thoại và Mật khẩu Quản trị viên.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await authApi.login(phone, password, 'SUPERADMIN');
      if (res.data.role !== 'SUPERADMIN' && res.data.role !== 'ADMIN') {
        setErrorMessage('Tài khoản này không có quyền Quản trị viên Hệ thống (SUPERADMIN).');
        setLoading(false);
        return;
      }

      saveAuth(res.data.access_token, {
        id: res.data.user_id,
        full_name: res.data.full_name,
        role: res.data.role,
      });

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/admin/kyc');
      }, 600);
    } catch (err: any) {
      // Fallback cho tài khoản demo Admin
      if (phone === '0388430402' && password === 'MinhNhut2007') {
        const adminUser: UserAuthData = {
          id: '00000000-0000-0000-0000-000000000001',
          full_name: 'Quản trị viên Minh Nhựt',
          phone: '0388430402',
          role: 'SUPERADMIN',
        };
        saveAuth('mock_jwt_superadmin_0388430402', adminUser);
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/admin/kyc');
        }, 600);
        return;
      }

      setErrorMessage(
        err.response?.data?.detail || 'Sai thông tin đăng nhập Quản trị viên.'
      );
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setForm({ phone: '0388430402', password: 'MinhNhut2007' });
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-400/30 text-indigo-400 mb-3 shadow-lg shadow-indigo-600/20">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>REASY</span>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
              ADMIN PORTAL
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cổng xác thực Quản trị viên & Phê duyệt KYC Chủ trọ
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" /> Đăng nhập Quản trị viên
            </span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[10px] font-extrabold text-indigo-300 hover:text-white bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs"
            >
              Điền nhanh (Minh Nhựt)
            </button>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-3.5">
            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Số điện thoại Admin
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  placeholder="0388430402"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Mật khẩu Quản trị
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={obscurePassword ? 'password' : 'text'}
                  placeholder="MinhNhut2007"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setObscurePassword(!obscurePassword)}
                  title={obscurePassword ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {obscurePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isSuccess}
              className={`w-full h-11 rounded-xl text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-lg active:scale-[0.98] ${
                isSuccess
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              {isSuccess ? (
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Xác thực thành công, đang chuyển hướng...</span>
                </div>
              ) : loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang kiểm tra quyền Admin...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Đăng nhập Admin Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>
          </form>

          {/* Quick Info Box */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Tài khoản Admin hệ thống:</span>
            <span className="font-mono text-indigo-300 font-bold">0388430402 / MinhNhut2007</span>
          </div>
        </div>

        {/* Back to regular site link */}
        <div className="text-center mt-4">
          <a
            href="/login"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Quay lại trang đăng nhập người dùng thông thường
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
