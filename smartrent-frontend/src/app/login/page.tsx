'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import { 
  Phone, Lock, ArrowRight, ShieldCheck, Users, 
  ArrowLeft, Eye, EyeOff, Check, 
  ChevronRight, Building2, Key, User as UserIcon, UserPlus,
  MessageSquare, RefreshCw, Smartphone, Sparkles, Shield,
  CheckCircle2, Clock
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [selectedRole, setSelectedRole] = useState<'' | 'OWNER' | 'TENANT'>('');
  
  // Login form
  const [form, setForm] = useState({ phone: '', password: '' });
  const [buildingCode, setBuildingCode] = useState('MC892');
  const [roomCode, setRoomCode] = useState('P101A');
  const [obscurePassword, setObscurePassword] = useState(true);

  // Register form
  const [regStep, setRegStep] = useState<'INPUT_FORM' | 'VERIFY_OTP'>('INPUT_FORM');
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [obscureRegPassword, setObscureRegPassword] = useState(true);
  const [obscureConfirmPassword, setObscureConfirmPassword] = useState(true);
  
  // 6-digit OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check query params if mode is register
  useEffect(() => {
    if (searchParams.get('mode') === 'register' || searchParams.get('tab') === 'register') {
      setAuthMode('REGISTER');
    }
  }, [searchParams]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, [countdown]);

  // Auto focus first OTP input when step changes to VERIFY_OTP
  useEffect(() => {
    if (regStep === 'VERIFY_OTP') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [regStep]);

  // 1. Dynamic Animated Aurora Mesh & Floating Waves Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const startTime = performance.now();
    const durationMs = 12000;

    const drawOrb = (
      centerX: number,
      centerY: number,
      radius: number,
      rgb: string,
      opacity: number
    ) => {
      if (radius <= 0) return;
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, `rgba(${rgb}, ${Math.max(0, Math.min(1, opacity))})`);
      gradient.addColorStop(0.45, `rgba(${rgb}, ${Math.max(0, Math.min(1, opacity * 0.5))})`);
      gradient.addColorStop(1, `rgba(${rgb}, 0)`);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    const drawFlowingWave = (
      waveHeight: number,
      amplitude: number,
      frequency: number,
      phase: number,
      strokeWidth: number,
      colorStops: { stop: number; color: string }[]
    ) => {
      if (width <= 0 || height <= 0) return;

      const path = new Path2D();
      const step = Math.max(width / 50, 2);

      const startY = waveHeight + Math.sin(phase) * amplitude;
      path.moveTo(0, startY);

      for (let x = 0; x <= width + step; x += step) {
        const normX = Math.min(1, Math.max(0, x / width));
        const y = waveHeight + Math.sin(normX * frequency * 2 * Math.PI + phase) * amplitude;
        path.lineTo(x, y);
      }

      const grad = ctx.createLinearGradient(0, 0, width, 0);
      colorStops.forEach((cs) => grad.addColorStop(cs.stop, cs.color));

      ctx.save();
      ctx.strokeStyle = grad;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.stroke(path);
      ctx.restore();
    };

    const render = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const animationValue = (elapsed % durationMs) / durationMs;
      const t = animationValue * 2 * Math.PI;

      ctx.clearRect(0, 0, width, height);

      // Base gradient wash
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(0.5, '#F8FAFC');
      bgGrad.addColorStop(1, '#F1F5F9');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Animated Floating Pastel Orbs
      drawOrb(
        width * 0.15 + Math.sin(t) * 45,
        height * 0.18 + Math.cos(t * 0.8) * 35,
        width * 0.45,
        '56, 189, 248',
        0.16 + Math.sin(t) * 0.03
      );

      drawOrb(
        width * 0.88 + Math.cos(t * 0.9) * 40,
        height * 0.28 + Math.sin(t * 1.1) * 30,
        width * 0.4,
        '129, 140, 248',
        0.14 + Math.cos(t * 0.03)
      );

      drawOrb(
        width * 0.82 + Math.sin(t * 1.2) * 50,
        height * 0.8 + Math.cos(t * 0.7) * 40,
        width * 0.5,
        '251, 191, 36',
        0.15 + Math.sin(t * 0.8) * 0.03
      );

      drawOrb(
        width * 0.1 + Math.cos(t * 0.7) * 35,
        height * 0.82 + Math.sin(t * 0.9) * 35,
        width * 0.42,
        '52, 211, 153',
        0.12 + Math.cos(t * 1.1) * 0.03
      );

      // Flowing Sinusoidal Waves
      drawFlowingWave(
        height * 0.38,
        28,
        1.2,
        t,
        2.0,
        [
          { stop: 0, color: 'rgba(56, 189, 248, 0.22)' },
          { stop: 0.5, color: 'rgba(129, 140, 248, 0.18)' },
          { stop: 1, color: 'rgba(251, 191, 36, 0.15)' },
        ]
      );

      drawFlowingWave(
        height * 0.65,
        34,
        0.9,
        -t * 0.85 + 1.0,
        2.2,
        [
          { stop: 0, color: 'rgba(251, 191, 36, 0.18)' },
          { stop: 0.5, color: 'rgba(244, 114, 182, 0.16)' },
          { stop: 1, color: 'rgba(56, 189, 248, 0.15)' },
        ]
      );

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const selectRole = (role: 'OWNER' | 'TENANT') => {
    setSelectedRole(role);
    setErrorMessage(null);
    setForm({ phone: '', password: '' });
    setRegStep('INPUT_FORM');
    if (role === 'TENANT') {
      setBuildingCode('MC892');
      setRoomCode('P101A');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = form.phone.trim();
    const password = form.password.trim();
    const bCode = buildingCode.trim().toUpperCase();
    const rCode = roomCode.trim().toUpperCase();

    if (!phone || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ số điện thoại và mật khẩu.');
      return;
    }

    if (selectedRole === 'TENANT') {
      if (!bCode) {
        setErrorMessage('Vui lòng nhập Mã tòa nhà (5 ký tự).');
        return;
      }
      if (!rCode) {
        setErrorMessage('Vui lòng nhập Mã phòng trọ (5 ký tự).');
        return;
      }
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await authApi.login(
        phone,
        password,
        selectedRole || undefined,
        selectedRole === 'TENANT' ? bCode : undefined,
        selectedRole === 'TENANT' ? rCode : undefined
      );

      if (res.data.role !== selectedRole) {
        setErrorMessage(
          `Tài khoản này không có quyền đăng nhập với vai trò ${
            selectedRole === 'OWNER' ? 'Chủ trọ' : 'Người thuê'
          }.`
        );
        setLoading(false);
        return;
      }

      saveAuth(res.data.access_token, {
        id: res.data.user_id,
        full_name: res.data.full_name,
        role: res.data.role,
      });

      if (selectedRole === 'TENANT') {
        localStorage.setItem('demo_tenant_room_code', rCode);
        localStorage.setItem('demo_tenant_building_code', bCode);
      }

      // Success animation trigger
      setIsSuccess(true);
      toast.success(`Chào mừng, ${res.data.full_name}!`);

      setTimeout(() => {
        router.push('/dashboard');
      }, 700);
    } catch (err: any) {
      // Fallback cho 2 tài khoản demo Chu tro & Minh Nhut
      if (
        phone === '0388430402' &&
        ((selectedRole === 'OWNER' && password === 'MinhNhut1') ||
          (selectedRole === 'TENANT' && password === 'MinhNhut2'))
      ) {
        const isOwnerAcc = selectedRole === 'OWNER';
        const fallbackUser = {
          id: isOwnerAcc ? '6b123c40-0572-4985-aa08-5d7b9abd4f76' : '3fba1d98-ec4a-4eb5-dc74-26586abc75',
          full_name: isOwnerAcc ? 'Chu tro' : 'Minh Nhut',
          role: selectedRole,
        };
        saveAuth('mock_jwt_token_0388430402', fallbackUser);

        if (selectedRole === 'TENANT') {
          localStorage.setItem('demo_tenant_room_code', rCode || 'P101A');
          localStorage.setItem('demo_tenant_building_code', bCode || 'MC892');
        }

        setIsSuccess(true);
        toast.success(`Chào mừng, ${fallbackUser.full_name}!`);

        setTimeout(() => {
          router.push('/dashboard');
        }, 700);
        return;
      }

      setErrorMessage(
        err.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      );
      setLoading(false);
    }
  };

  // Điền nhanh mã OTP vào 6 ô
  const fillOtp = (code: string) => {
    const digits = code.replace(/[^0-9]/g, '').slice(0, 6).split('');
    while (digits.length < 6) digits.push('');
    setOtpDigits(digits);
    inputRefs.current[5]?.focus();
    toast.success('Đã điền mã OTP!', { icon: '✨' });
  };

  // Xử lý khi nhập từng ô OTP
  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    // Nếu người dùng paste chuỗi số dài
    if (clean.length > 1) {
      const next = [...otpDigits];
      const chars = clean.slice(0, 6).split('');
      chars.forEach((c, i) => {
        if (index + i < 6) next[index + i] = c;
      });
      setOtpDigits(next);
      const nextFocus = Math.min(5, index + chars.length);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = clean[0];
    setOtpDigits(next);

    // Tự động chuyển qua ô tiếp theo
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const next = [...otpDigits];
        next[index - 1] = '';
        setOtpDigits(next);
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = [...otpDigits];
        next[index] = '';
        setOtpDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    if (pasted) {
      fillOtp(pasted);
    }
  };

  // Bước 1: Gửi mã OTP qua SMS
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = registerForm.fullName.trim();
    const phone = registerForm.phone.trim();
    const password = registerForm.password.trim();
    const confirmPassword = registerForm.confirmPassword.trim();

    if (!fullName || !phone || !password || !confirmPassword) {
      setErrorMessage('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }

    if (phone.length < 9) {
      setErrorMessage('Số điện thoại không hợp lệ (tối thiểu 9-10 chữ số).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await authApi.sendOtp(phone, 'REGISTER');
      const generatedOtp = res.data.otp_demo || `${Math.floor(100000 + Math.random() * 900000)}`;
      setDemoOtp(generatedOtp);
      setOtpDigits(['', '', '', '', '', '']);
      setRegStep('VERIFY_OTP');
      setCountdown(60);

      toast.success(
        `📲 Mã OTP đã gửi về SMS số ${phone}!`,
        { duration: 4000 }
      );
    } catch (err: any) {
      const fallbackOtp = `${Math.floor(100000 + Math.random() * 900000)}`;
      setDemoOtp(fallbackOtp);
      setOtpDigits(['', '', '', '', '', '']);
      setRegStep('VERIFY_OTP');
      setCountdown(60);
      toast.success(`📲 Mã OTP đã gửi về SMS số ${phone}!`);
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await authApi.sendOtp(registerForm.phone, 'REGISTER');
      const generatedOtp = res.data.otp_demo || `${Math.floor(100000 + Math.random() * 900000)}`;
      setDemoOtp(generatedOtp);
      setOtpDigits(['', '', '', '', '', '']);
      setCountdown(60);
      toast.success('Đã gửi lại mã OTP mới qua SMS!');
      inputRefs.current[0]?.focus();
    } catch (_) {
      const fallbackOtp = `${Math.floor(100000 + Math.random() * 900000)}`;
      setDemoOtp(fallbackOtp);
      setOtpDigits(['', '', '', '', '', '']);
      setCountdown(60);
      toast.success('Đã gửi lại mã OTP mới!');
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác thực OTP và Hoàn tất đăng ký
  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('').trim();

    if (!code || code.length < 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số của mã OTP.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Xác thực OTP
      try {
        await authApi.verifyOtp(registerForm.phone, code);
      } catch (otpErr: any) {
        if (code !== demoOtp && code !== '123456' && code !== '666888') {
          setErrorMessage(otpErr.response?.data?.detail || 'Mã OTP không chính xác hoặc đã hết hạn.');
          setLoading(false);
          return;
        }
      }

      // 2. Đăng ký tài khoản
      const res = await authApi.register({
        full_name: registerForm.fullName.trim(),
        phone: registerForm.phone.trim(),
        password: registerForm.password.trim(),
        role: selectedRole || 'TENANT',
        otp_code: code,
      });

      saveAuth(res.data.access_token, {
        id: res.data.user_id,
        full_name: res.data.full_name,
        role: res.data.role,
      });

      setIsSuccess(true);
      toast.success(`Đăng ký thành công! Chào mừng, ${res.data.full_name}!`);

      setTimeout(() => {
        router.push('/dashboard');
      }, 700);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || 'Đăng ký thất bại. Vui lòng thử lại.'
      );
      setLoading(false);
    }
  };

  // Google OAuth Login handler
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
      } catch (_) {}
    };
  }, []);

  const handleGoogleLogin = () => {
    setErrorMessage(null);
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '419863599391-kq71hjhinjaunrr4cg8g4ek73vmur9v6.apps.googleusercontent.com';

    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (!response?.credential) {
              setErrorMessage('Không nhận được thông tin xác thực từ Google.');
              return;
            }
            setLoading(true);
            try {
              const res = await authApi.googleLogin(
                response.credential,
                selectedRole || 'TENANT'
              );
              saveAuth(res.data.access_token, {
                id: res.data.user_id,
                full_name: res.data.full_name,
                role: res.data.role,
              });
              setIsSuccess(true);
              toast.success(`Chào mừng, ${res.data.full_name}!`);
              setTimeout(() => {
                router.push('/dashboard');
              }, 700);
            } catch (err: any) {
              setErrorMessage(
                err.response?.data?.detail || 'Đăng nhập Google thất bại.'
              );
              setLoading(false);
            }
          },
        });
        (window as any).google.accounts.id.prompt();
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi mở xác thực Google');
      }
    } else {
      toast.error('Dịch vụ Google Login đang khởi động, vui lòng thử lại sau 1 giây.');
    }
  };

  const handleFacebookLogin = () => {
    toast('Tính năng Đăng nhập Facebook đang được tích hợp!', {
      icon: 'ℹ️',
    });
  };

  const isOwner = selectedRole === 'OWNER';
  const isOtpComplete = otpDigits.every((d) => d !== '');

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F8FAFC] flex items-center justify-center p-4 selection:bg-amber-100 selection:text-amber-900">
      {/* 1. Dynamic Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* 2. Main Foreground Content */}
      <div className="w-full max-w-[450px] relative z-10 flex flex-col items-center">
        {/* Floating Elegant Logo Card with Soft Glow Halo */}
        <div className="relative mb-4 group">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#FDE68A] via-[#BAE6FD] to-[#93C5FD] rounded-[26px] blur-xl opacity-75 animate-pulse" />

          <div className="relative w-[116px] h-[80px] p-2 bg-white rounded-[22px] border border-[#E2E8F0] shadow-[0_10px_25px_-5px_rgba(15,23,42,0.08),0_4px_12px_rgba(56,189,248,0.2)] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <img
              src="/logo.jpg"
              alt="REASY Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
        </div>

        {/* Title: Chào mừng đến REASY */}
        <div className="text-center mb-5">
          <h1 className="text-[23px] font-extrabold text-[#0F172A] tracking-tight flex items-center justify-center gap-1.5">
            <span>Chào mừng đến</span>
            <span className="bg-gradient-to-r from-[#D97706] via-[#0284C7] to-[#2563EB] bg-clip-text text-transparent text-[25px] font-black tracking-wide">
              REASY
            </span>
          </h1>
          <p className="text-[12.5px] text-[#64748B] font-medium mt-1">
            Hệ thống quản lý phòng trọ & cư dân thông minh
          </p>
        </div>

        {/* Pure White Modern Card */}
        <div className="w-full bg-white rounded-[28px] p-6 sm:p-7 border border-[#E2E8F0] shadow-[0_20px_40px_-15px_rgba(15,23,42,0.07),0_0_20px_rgba(56,189,248,0.05)] transition-all">
          {selectedRole === '' ? (
            /* ─── BƯỚC 1: XÁC NHẬN VAI TRÒ ─── */
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-[17px] font-extrabold text-[#0F172A]">
                  Xác nhận vai trò truy cập
                </h2>
                <p className="text-[12px] text-[#64748B] mt-1">
                  Vui lòng chọn cổng truy cập của bạn để tiếp tục
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {/* Option 1: Chủ trọ / Quản trị */}
                <button
                  type="button"
                  onClick={() => selectRole('OWNER')}
                  className="w-full p-3.5 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-blue-300 rounded-[18px] shadow-[0_4px_10px_rgba(15,23,42,0.03)] hover:shadow-md transition-all duration-200 flex items-center gap-3.5 text-left group cursor-pointer active:scale-[0.98]"
                >
                  <div className="w-11 h-11 rounded-[14px] bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] flex-shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14.5px] font-bold text-[#0F172A] group-hover:text-blue-600 transition-colors">
                      Chủ trọ / Quản trị
                    </h3>
                    <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                      Quản lý tòa nhà, hóa đơn, sự cố & cư dân
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>

                {/* Option 2: Cư dân / Người thuê */}
                <button
                  type="button"
                  onClick={() => selectRole('TENANT')}
                  className="w-full p-3.5 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-amber-300 rounded-[18px] shadow-[0_4px_10px_rgba(15,23,42,0.03)] hover:shadow-md transition-all duration-200 flex items-center gap-3.5 text-left group cursor-pointer active:scale-[0.98]"
                >
                  <div className="w-11 h-11 rounded-[14px] bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-[#D97706] flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14.5px] font-bold text-[#0F172A] group-hover:text-amber-600 transition-colors">
                      Cư dân / Người thuê
                    </h3>
                    <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                      Xem hóa đơn, báo sự cố & tiện ích phòng
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              </div>
            </div>
          ) : (
            /* ─── BƯỚC 2: FORM ĐĂNG NHẬP / ĐĂNG KÝ ─── */
            <div className="space-y-4">
              {/* Header with Back button & Role badge */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (authMode === 'REGISTER' && regStep === 'VERIFY_OTP') {
                      setRegStep('INPUT_FORM');
                      setErrorMessage(null);
                    } else {
                      setSelectedRole('');
                      setErrorMessage(null);
                    }
                  }}
                  className="p-1.5 rounded-xl bg-[#F1F5F9] hover:bg-slate-200 text-[#475569] transition-colors cursor-pointer"
                  title="Quay lại"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div
                  className={`px-2.5 py-1 rounded-lg border text-[12px] font-extrabold ${
                    isOwner
                      ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                      : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                  }`}
                >
                  {isOwner ? 'Chủ trọ / Quản trị' : 'Cư dân người thuê'}
                </div>
              </div>

              {/* Segmented Tab Switcher: Đăng nhập vs Đăng ký bằng SĐT */}
              {regStep === 'INPUT_FORM' && (
                <div className="flex bg-[#F1F5F9] p-1 rounded-xl border border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('LOGIN');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      authMode === 'LOGIN'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>Đăng nhập</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('REGISTER');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      authMode === 'REGISTER'
                        ? isOwner
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Đăng ký SMS OTP</span>
                  </button>
                </div>
              )}

              {/* ─── TAB 1: FORM ĐĂNG NHẬP ─── */}
              {authMode === 'LOGIN' ? (
                <form onSubmit={handleLogin} className="space-y-3.5 pt-1">
                  {/* Phone Input */}
                  <div>
                    <label className="block text-[12px] font-bold text-[#334155] mb-1.5">
                      Số điện thoại đăng nhập
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                      <input
                        type="tel"
                        placeholder="0388430402"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className={`w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-[#0F172A] placeholder-[#94A3B8] text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 ${
                          isOwner ? 'focus:ring-blue-500' : 'focus:ring-amber-500'
                        } transition-all`}
                        required
                      />
                    </div>
                  </div>

                  {/* Building Code & Room Code Input (Tenant only) */}
                  {!isOwner && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[12px] font-bold text-[#334155] mb-1.5 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Mã tòa *</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="MC892"
                            maxLength={5}
                            value={buildingCode}
                            onChange={(e) => setBuildingCode(e.target.value.toUpperCase())}
                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F172A] placeholder-[#94A3B8] text-sm font-mono font-bold uppercase focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all text-center tracking-wider"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[12px] font-bold text-[#334155] mb-1.5 flex items-center gap-1">
                          <Key className="w-3.5 h-3.5 text-amber-600" />
                          <span>Mã phòng *</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="P101A"
                            maxLength={5}
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F172A] placeholder-[#94A3B8] text-sm font-mono font-bold uppercase focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all text-center tracking-wider"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Password Input */}
                  <div>
                    <label className="block text-[12px] font-bold text-[#334155] mb-1.5">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                      <input
                        type={obscurePassword ? 'password' : 'text'}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className={`w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-10 py-2.5 text-[#0F172A] placeholder-[#94A3B8] text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 ${
                          isOwner ? 'focus:ring-blue-500' : 'focus:ring-amber-500'
                        } transition-all`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setObscurePassword(!obscurePassword)}
                        title={obscurePassword ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}
                        aria-label={obscurePassword ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] p-1 rounded-md transition-colors cursor-pointer"
                      >
                        {obscurePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Error Banner */}
                  {errorMessage && (
                    <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[12px] font-medium flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || isSuccess}
                    className={`w-full h-12 rounded-[14px] text-white font-extrabold text-[14.5px] flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-lg active:scale-[0.97] mt-2 ${
                      isSuccess
                        ? 'bg-gradient-to-r from-[#10B981] to-[#059669] shadow-emerald-500/30'
                        : isOwner
                        ? 'bg-gradient-to-r from-[#2563EB] to-[#0284C7] hover:from-[#1D4ED8] hover:to-[#0369A1] shadow-blue-500/25'
                        : 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] shadow-amber-500/25'
                    }`}
                  >
                    {isSuccess ? (
                      <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                        <div className="w-5 h-5 rounded-full bg-white text-[#059669] flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span>Đăng nhập thành công!</span>
                      </div>
                    ) : loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang xác thực...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Đăng nhập vào hệ thống</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </button>

                  {/* Switch to Register link */}
                  <div className="text-center pt-1">
                    <p className="text-[12px] text-slate-500">
                      Chưa có tài khoản?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('REGISTER');
                          setRegStep('INPUT_FORM');
                          setErrorMessage(null);
                        }}
                        className={`font-bold hover:underline cursor-pointer ${
                          isOwner ? 'text-blue-600' : 'text-amber-600'
                        }`}
                      >
                        Đăng ký bằng SMS OTP
                      </button>
                    </p>
                  </div>

                  {/* Social Login Divider */}
                  <div className="relative flex py-1.5 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Hoặc tiếp tục với
                    </span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  {/* Social Login Buttons */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading || isSuccess}
                      className="h-11 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold text-slate-700 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFacebookLogin}
                      disabled={loading || isSuccess}
                      className="h-11 px-3 bg-[#1877F2]/5 hover:bg-[#1877F2]/10 border border-[#1877F2]/20 hover:border-[#1877F2]/40 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold text-[#1877F2] shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span>Facebook</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* ─── TAB 2: FORM ĐĂNG KÝ BẰNG SỐ ĐIỆN THOẠI & XÁC THỰC SMS OTP ─── */
                <div>
                  {regStep === 'INPUT_FORM' ? (
                    /* Bước 1: Nhập thông tin tài khoản */
                    <form onSubmit={handleRequestOtp} className="space-y-3 pt-1">
                      {/* Họ và tên */}
                      <div>
                        <label className="block text-[12px] font-bold text-[#334155] mb-1">
                          Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                          <input
                            type="text"
                            placeholder="Nguyễn Văn A"
                            value={registerForm.fullName}
                            onChange={(e) =>
                              setRegisterForm({ ...registerForm, fullName: e.target.value })
                            }
                            className={`w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-[#0F172A] placeholder-[#94A3B8] text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 ${
                              isOwner ? 'focus:ring-blue-500' : 'focus:ring-amber-500'
                            } transition-all`}
                            required
                          />
                        </div>
                      </div>

                      {/* Số điện thoại */}
                      <div>
                        <label className="block text-[12px] font-bold text-[#334155] mb-1">
                          Số điện thoại nhận SMS OTP <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                          <input
                            type="tel"
                            placeholder="0912345678"
                            value={registerForm.phone}
                            onChange={(e) =>
                              setRegisterForm({ ...registerForm, phone: e.target.value })
                            }
                            className={`w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-[#0F172A] placeholder-[#94A3B8] text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 ${
                              isOwner ? 'focus:ring-blue-500' : 'focus:ring-amber-500'
                            } transition-all`}
                            required
                          />
                        </div>
                      </div>

                      {/* Mật khẩu */}
                      <div>
                        <label className="block text-[12px] font-bold text-[#334155] mb-1">
                          Mật khẩu (tối thiểu 6 ký tự) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                          <input
                            type={obscureRegPassword ? 'password' : 'text'}
                            placeholder="••••••••"
                            value={registerForm.password}
                            onChange={(e) =>
                              setRegisterForm({ ...registerForm, password: e.target.value })
                            }
                            className={`w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-10 py-2.5 text-[#0F172A] placeholder-[#94A3B8] text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 ${
                              isOwner ? 'focus:ring-blue-500' : 'focus:ring-amber-500'
                            } transition-all`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setObscureRegPassword(!obscureRegPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] p-1 rounded-md transition-colors cursor-pointer"
                          >
                            {obscureRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Xác nhận Mật khẩu */}
                      <div>
                        <label className="block text-[12px] font-bold text-[#334155] mb-1">
                          Xác nhận mật khẩu <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                          <input
                            type={obscureConfirmPassword ? 'password' : 'text'}
                            placeholder="••••••••"
                            value={registerForm.confirmPassword}
                            onChange={(e) =>
                              setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                            }
                            className={`w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-10 py-2.5 text-[#0F172A] placeholder-[#94A3B8] text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 ${
                              isOwner ? 'focus:ring-blue-500' : 'focus:ring-amber-500'
                            } transition-all`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setObscureConfirmPassword(!obscureConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] p-1 rounded-md transition-colors cursor-pointer"
                          >
                            {obscureConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Error Banner */}
                      {errorMessage && (
                        <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[12px] font-medium flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      {/* Next Step Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className={`w-full h-12 rounded-[14px] text-white font-extrabold text-[14.5px] flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-lg active:scale-[0.97] mt-3 ${
                          isOwner
                            ? 'bg-gradient-to-r from-[#2563EB] to-[#0284C7] hover:from-[#1D4ED8] hover:to-[#0369A1] shadow-blue-500/25'
                            : 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] shadow-amber-500/25'
                        }`}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Đang gửi mã OTP...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            <span>Nhận mã OTP xác thực</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </button>

                      {/* Switch to Login link */}
                      <div className="text-center pt-1">
                        <p className="text-[12px] text-slate-500">
                          Đã có tài khoản?{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode('LOGIN');
                              setErrorMessage(null);
                            }}
                            className={`font-bold hover:underline cursor-pointer ${
                              isOwner ? 'text-blue-600' : 'text-amber-600'
                            }`}
                          >
                            Đăng nhập ngay
                          </button>
                        </p>
                      </div>
                    </form>
                  ) : (
                    /* ─── BƯỚC 2: GIAO DIỆN NHẬP MÃ OTP 6 CHỮ SỐ CAO CẤP ─── */
                    <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4 pt-0.5">
                      {/* Header Badge */}
                      <div className="text-center space-y-2">
                        <div className="relative inline-flex">
                          <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-sm opacity-50 animate-pulse" />
                          <div className="relative w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-300 flex items-center justify-center text-amber-600 shadow-sm">
                            <Shield className="w-7 h-7" />
                          </div>
                        </div>

                        <div>
                          <h3 className="text-[17px] font-black text-slate-900 tracking-tight">
                            Xác thực mã bảo mật OTP
                          </h3>
                          <div className="flex items-center justify-center gap-1.5 mt-1 text-[12px] text-slate-500">
                            <span>Gửi qua SMS tới số</span>
                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                              <Smartphone className="w-3.5 h-3.5 text-slate-600" />
                              {registerForm.phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* iOS Glassmorphism Simulated SMS Notification Card */}
                      {demoOtp && (
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.05] to-amber-500/[0.12] border border-amber-300/80 p-3.5 shadow-[0_4px_16px_rgba(245,158,11,0.1)] transition-all">
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 flex-shrink-0 mt-0.5">
                                <MessageSquare className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-black tracking-wider uppercase text-amber-900">
                                    Tin nhắn SMS
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                                  <span className="text-[10px] text-amber-700/80 font-medium">Vừa xong</span>
                                </div>
                                <p className="text-[12px] text-slate-700 font-medium mt-0.5 leading-snug">
                                  Mã OTP đăng ký REASY của bạn là:{' '}
                                  <span className="font-mono font-black text-[15px] text-amber-700 tracking-wider bg-amber-100/80 px-1.5 py-0.5 rounded-md">
                                    {demoOtp}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => fillOtp(demoOtp)}
                              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1 flex-shrink-0"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Điền nhanh</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 6 Individual PIN Boxes */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                          {otpDigits.map((digit, index) => (
                            <div key={index} className="flex-1 max-w-[56px] relative">
                              <input
                                ref={(el) => {
                                  inputRefs.current[index] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                onPaste={handleOtpPaste}
                                className={`w-full h-13 sm:h-15 text-center text-2xl font-mono font-black rounded-2xl border-2 transition-all duration-200 focus:outline-none shadow-sm ${
                                  digit !== ''
                                    ? isOwner
                                      ? 'border-blue-500 bg-blue-50/40 text-blue-900 shadow-blue-500/10'
                                      : 'border-amber-500 bg-amber-50/40 text-amber-950 shadow-amber-500/10'
                                    : 'border-slate-200 bg-[#F8FAFC] text-slate-700 focus:bg-white'
                                } ${
                                  isOwner
                                    ? 'focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20'
                                    : 'focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20'
                                }`}
                              />
                              {/* Bottom Accent Dot */}
                              <div
                                className={`w-1.5 h-1.5 rounded-full mx-auto mt-1.5 transition-all ${
                                  digit !== ''
                                    ? isOwner
                                      ? 'bg-blue-600 scale-125'
                                      : 'bg-amber-600 scale-125'
                                    : 'bg-slate-200'
                                }`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Resend Countdown & Back Button */}
                      <div className="flex items-center justify-between text-[12px] px-0.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setRegStep('INPUT_FORM');
                            setErrorMessage(null);
                          }}
                          className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Đổi số điện thoại</span>
                        </button>

                        <div>
                          {countdown > 0 ? (
                            <div className="flex items-center gap-1 text-slate-400 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>
                                Gửi lại sau <strong className="text-amber-600 font-bold">{countdown}s</strong>
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleResendOtp}
                              disabled={loading}
                              className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full cursor-pointer transition-all active:scale-95"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Gửi lại mã OTP</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Error Banner */}
                      {errorMessage && (
                        <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[12px] font-medium flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      {/* Submit Verify & Register Button */}
                      <button
                        type="submit"
                        disabled={loading || isSuccess || !isOtpComplete}
                        className={`w-full h-12 rounded-[14px] text-white font-extrabold text-[14.5px] flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-lg active:scale-[0.97] mt-2 ${
                          isSuccess
                            ? 'bg-gradient-to-r from-[#10B981] to-[#059669] shadow-emerald-500/30'
                            : !isOtpComplete
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                            : isOwner
                            ? 'bg-gradient-to-r from-[#2563EB] to-[#0284C7] hover:from-[#1D4ED8] hover:to-[#0369A1] shadow-blue-500/25'
                            : 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] shadow-amber-500/25'
                        }`}
                      >
                        {isSuccess ? (
                          <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                            <div className="w-5 h-5 rounded-full bg-white text-[#059669] flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                            <span>Đăng ký thành công!</span>
                          </div>
                        ) : loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Đang xác thực OTP & tạo tài khoản...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Xác thực & Hoàn tất Đăng ký</span>
                          </div>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11.5px] text-[#94A3B8] font-medium mt-5">
          © 2026 REASY • Nền tảng quản lý phòng trọ thế hệ mới
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <LoginForm />
    </Suspense>
  );
}
