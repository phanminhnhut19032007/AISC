'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import { 
  Phone, Lock, ArrowRight, UserCheck, Users, 
  ArrowLeft, Home as HomeIcon, Sparkles
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [roleSelection, setRoleSelection] = useState<'OWNER' | 'TENANT' | null>(null);
  const [form, setForm] = useState({ phone: '', password: '' });
  const [roomCode, setRoomCode] = useState('101');
  const [loading, setLoading] = useState(false);

  // Mouse coordinate state for dynamic zero-G parallax on the card and background
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Anti-gravity interactive particles canvas
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

    // Particle definition: anti-gravity motes drifting upwards
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      color: string;
      pulseSpeed: number;
    }

    const colors = [
      'rgba(248, 215, 100, ', // Gold from logo
      'rgba(96, 181, 230, ',  // Cyan from logo
      'rgba(59, 130, 246, ',  // Royal Blue
      'rgba(168, 85, 247, ',  // Purple
      'rgba(255, 255, 255, ', // Starlight White
    ];

    const particles: Particle[] = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1,
      speedY: -(Math.random() * 0.75 + 0.25), // Rising upwards against gravity
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.7 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulseSpeed: Math.random() * 0.02 + 0.01,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw and update rising zero-gravity particles
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;

        // Wave oscillation (subtle zero-g float)
        p.x += Math.sin(p.y * 0.015) * 0.3;

        // Wrap around when particle floats off the top
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Glow pulse
        p.opacity += Math.sin(Date.now() * 0.003 * p.pulseSpeed) * 0.01;
        const currentOpacity = Math.max(0.15, Math.min(0.85, p.opacity));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${currentOpacity})`;
        ctx.shadowBlur = p.size * 3.5;
        ctx.shadowColor = `${p.color}0.8)`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Track mouse position for soft 3D zero-G parallax
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    setMousePos({
      x: (clientX - centerX) / 45,
      y: (clientY - centerY) / 45,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleSelection) return;
    
    if (roleSelection === 'TENANT' && !roomCode.trim()) {
      toast.error('Vui lòng nhập Mã trọ / Mã phòng trọ của bạn');
      return;
    }
    
    setLoading(true);
    try {
      const res = await authApi.login(form.phone, form.password);
      
      if (res.data.role !== roleSelection) {
        toast.error(`Tài khoản này không có quyền đăng nhập với vai trò ${roleSelection === 'OWNER' ? 'Chủ trọ' : 'Người thuê'}`);
        setLoading(false);
        return;
      }

      saveAuth(res.data.access_token, {
        id: res.data.user_id,
        full_name: res.data.full_name,
        role: res.data.role,
      });
      
      if (roleSelection === 'TENANT') {
        localStorage.setItem('demo_tenant_room_code', roomCode.trim());
      }
      
      toast.success(`Chào mừng, ${res.data.full_name}!`);
      toast.success('Đăng nhập thành công! Đang chuyển hướng...');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setForm({ ...form, password: '' });
      setLoading(false);
    }
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen relative overflow-hidden bg-slate-950 flex items-center justify-center p-4 selection:bg-amber-400/30 selection:text-white"
    >
      {/* 1. Interactive Anti-Gravity Canvas Particles (Bụi sao & hạt ánh sáng trôi ngược trọng lực) */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* 2. Zero-G Nebula Cosmic Glow Orbs (Ánh sáng vũ trụ nền lơ lửng) */}
      <div 
        style={{ transform: `translate3d(${-mousePos.x * 0.8}px, ${-mousePos.y * 0.8}px, 0)` }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl animate-pulse-glow pointer-events-none transition-transform duration-300 ease-out" 
      />
      <div 
        style={{ transform: `translate3d(${mousePos.x * 0.9}px, ${mousePos.y * 0.9}px, 0)` }}
        className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-amber-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000 pointer-events-none transition-transform duration-300 ease-out" 
      />
      <div 
        style={{ transform: `translate3d(${-mousePos.x * 0.5}px, ${mousePos.y * 0.5}px, 0)` }}
        className="absolute top-1/2 right-1/3 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl animate-pulse-glow delay-2000 pointer-events-none transition-transform duration-300 ease-out" 
      />

      {/* 3. Main Login Container */}
      <div 
        style={{ transform: `translate3d(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px, 0)` }}
        className="w-full max-w-md relative z-20 transition-transform duration-300 ease-out"
      >
        
        {/* Brand Logo Header with Anti-gravity Glow */}
        <div className="text-center mb-6 flex flex-col items-center">
          {/* Logo Badge with floating 3D effect */}
          <div className="relative group mb-3">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 via-sky-400 to-blue-600 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-500 animate-pulse-glow" />
            <div className="relative w-28 h-20 bg-white/95 rounded-2xl p-2 flex items-center justify-center shadow-2xl backdrop-blur-xl border border-white/30 transform group-hover:scale-105 transition-transform duration-300">
              <img 
                src="/logo.jpg" 
                alt="REASY Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Chào mừng đến <span className="bg-gradient-to-r from-amber-300 via-sky-300 to-blue-400 bg-clip-text text-transparent">REASY</span>
          </h1>
        </div>

        {/* Floating Glass Card */}
        <div className="bg-slate-900/65 backdrop-blur-2xl border border-white/15 rounded-3xl p-7 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7),0_0_40px_rgba(59,130,246,0.12)]">
          {roleSelection === null ? (
            /* BƯỚC 1: XÁC NHẬN VAI TRÒ */
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold text-white">Xác nhận vai trò truy cập</h2>
                <p className="text-xs text-slate-400">Vui lòng chọn cổng đăng nhập của bạn để tiếp tục</p>
              </div>

              <div className="grid gap-3.5 pt-1">
                {/* Lựa chọn CHỦ TRỌ */}
                <button
                  onClick={() => {
                    setRoleSelection('OWNER');
                    setForm({ phone: '0901234567', password: 'smartrent123' });
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-blue-600/15 hover:border-sky-400/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all text-left group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300 flex-shrink-0">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-base group-hover:text-sky-300 transition-colors">Chủ trọ / Quản trị</h3>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </button>

                {/* Lựa chọn NGƯỜI THUÊ */}
                <button
                  onClick={() => {
                    setRoleSelection('TENANT');
                    setForm({ phone: '0912345001', password: 'tenant123' });
                    setRoomCode('101');
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-amber-500/15 hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.25)] transition-all text-left group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 flex-shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-base group-hover:text-amber-300 transition-colors">Cư dân / Người thuê</h3>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </button>
              </div>
            </div>
          ) : (
            /* BƯỚC 2: FORM ĐĂNG NHẬP */
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRoleSelection(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Quay lại chọn vai trò"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-bold text-white">
                  Đăng nhập: <span className={roleSelection === 'OWNER' ? 'text-sky-400' : 'text-amber-400'}>
                    {roleSelection === 'OWNER' ? 'Chủ trọ / Quản trị' : 'Cư dân người thuê'}
                  </span>
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Trường Số điện thoại */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Số điện thoại đăng nhập</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="0901234567"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-white/10 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm transition-all"
                      required
                    />
                  </div>
                </div>

                {/* 2. Trường Mã trọ / Mã phòng (Chỉ hiển thị nếu chọn NGƯỜI THUÊ) */}
                {roleSelection === 'TENANT' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mã phòng trọ của bạn</label>
                    <div className="relative">
                      <HomeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ví dụ: 101, 202, 301..."
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        className="w-full bg-white/10 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* 3. Trường Mật khẩu */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full bg-white/10 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all mt-3 shadow-xl cursor-pointer ${
                    roleSelection === 'OWNER' 
                      ? 'bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 shadow-sky-500/25' 
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25'
                  }`}
                >
                  {loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              {/* Thông tin đăng nhập thử nghiệm */}
              <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-[11px] text-sky-300 font-bold mb-1">Tài khoản demo sẵn:</p>
                {roleSelection === 'OWNER' ? (
                  <p className="text-xs text-slate-300">SĐT: <span className="font-bold text-amber-300">0901234567</span> | Mật khẩu: <span className="font-bold text-amber-300">smartrent123</span></p>
                ) : (
                  <p className="text-xs text-slate-300">
                    SĐT: <span className="font-bold text-amber-300">0912345001</span> | Pass: <span className="font-bold text-amber-300">tenant123</span> | Phòng: <span className="font-bold text-amber-300">101</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer brand credit */}
        <p className="text-center text-[11px] text-slate-500 mt-5">
          © 2026 <span className="text-slate-400 font-semibold">REASY</span> • Nền tảng quản lý phòng trọ thế hệ mới
        </p>
      </div>
    </div>
  );
}
