'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { getUser } from '@/lib/auth';
import { ShoppingBag, Clock, Calendar, QrCode, Plus, Minus, Tag, AlertCircle, ShoppingCart, X, Info, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  category: string;
  packSize: string;
  expiry: string;
  originalPrice: number;
  promoPrice: number;
  description: string;
  image: string;
}

interface Order {
  id: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  receiverName: string;
  receiverPhone: string;
  roomNumber: string;
  paymentMethod: 'COD' | 'VIETQR';
  orderDate: string;
  status: 'PENDING_SUNDAY_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  isPaid: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
  checked: boolean;
}

const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Gói Sữa Tươi Tiết Kiệm Vinamilk',
    category: 'Đồ uống',
    packSize: '12 lốc (48 hộp x 180ml)',
    expiry: '6 tháng',
    originalPrice: 384000,
    promoPrice: 295000,
    description: 'Sữa tươi tiệt trùng Vinamilk 100% có đường, thơm ngon nhiều dinh dưỡng.',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  {
    id: 'p2',
    name: 'Gói Snack Khoai Tây Lay\'s Party',
    category: 'Snack & Bánh kẹo',
    packSize: '20 bịch lớn (tự chọn vị)',
    expiry: '6 tháng',
    originalPrice: 220000,
    promoPrice: 155000,
    description: 'Snack khoai tây Lays giòn rụm với các vị khoai tây tự nhiên, sườn nướng, tảo biển.',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  {
    id: 'p3',
    name: 'Gói Mỳ Tôm Hảo Hảo Tôm Chua Cay',
    category: 'Mỳ ăn liền',
    packSize: '1 thùng sỉ (30 gói)',
    expiry: '8 tháng',
    originalPrice: 145000,
    promoPrice: 118000,
    description: 'Mỳ ăn liền quốc dân Hảo Hảo hương vị Tôm Chua Cay chua thanh, cay nồng hấp dẫn.',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  {
    id: 'p4',
    name: 'Gói Nước Ngọt Coca-Cola Tiết Kiệm',
    category: 'Đồ uống',
    packSize: '1 thùng (24 lon x 320ml)',
    expiry: '12 tháng',
    originalPrice: 240000,
    promoPrice: 185000,
    description: 'Nước giải khát có ga Coca-Cola chính hãng mang lại cảm giác sảng khoái tức thì.',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  {
    id: 'p5',
    name: 'Gói Nước Khoáng Aquafina Tinh Khiết',
    category: 'Đồ uống',
    packSize: '1 thùng (24 chai x 500ml)',
    expiry: '12 tháng',
    originalPrice: 120000,
    promoPrice: 89000,
    description: 'Nước uống đóng chai Aquafina tinh khiết được lọc qua hệ thống tuần hoàn khép kín.',
    image: 'https://images.unsplash.com/photo-1616180373449-33b006093557?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  }
];

export default function UniPackPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Modals visibility
  const [showCartModal, setShowCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VIETQR'>('COD');
  
  // Giao hàng info
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  // QR Modal info
  const [qrOrder, setQrOrder] = useState<Order | null>(null);
  const [paymentQrOrder, setPaymentQrOrder] = useState<Order | null>(null);

  // Mock progress orders
  const [progressOrders, setProgressOrders] = useState(8);

  useEffect(() => {
    const user = getUser();
    setCurrentUser(user);
    if (user) {
      setReceiverName(user.full_name || '');
      setReceiverPhone(user.phone || '');
      const savedRoom = localStorage.getItem('demo_tenant_room_code');
      setRoomNumber(savedRoom || '101');
    }

    // Load orders
    const savedOrders = localStorage.getItem('unipack_orders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }

    // Load cart
    const savedCart = localStorage.getItem('unipack_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    let updated: CartItem[];
    if (existing) {
      updated = cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updated = [...cart, { product, quantity: 1, checked: true }];
    }
    setCart(updated);
    localStorage.setItem('unipack_cart', JSON.stringify(updated));
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  // Adjust product quantity in cart
  const handleCartQtyChange = (productId: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCart(updated);
    localStorage.setItem('unipack_cart', JSON.stringify(updated));
  };

  // Toggle item check status in cart
  const handleCartCheckToggle = (productId: string) => {
    const updated = cart.map(item =>
      item.product.id === productId
        ? { ...item, checked: !item.checked }
        : item
    );
    setCart(updated);
    localStorage.setItem('unipack_cart', JSON.stringify(updated));
  };

  // Toggle select all items in cart
  const handleToggleSelectAll = (isChecked: boolean) => {
    const updated = cart.map(item => ({ ...item, checked: isChecked }));
    setCart(updated);
    localStorage.setItem('unipack_cart', JSON.stringify(updated));
  };

  // Remove item from cart
  const handleRemoveFromCart = (productId: string) => {
    const updated = cart.filter(item => item.product.id !== productId);
    setCart(updated);
    localStorage.setItem('unipack_cart', JSON.stringify(updated));
    toast.success('Đã xóa sản phẩm khỏi giỏ hàng.');
  };

  // Quick buy action
  const handleQuickBuy = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    let updated: CartItem[];
    if (existing) {
      updated = cart.map(item => ({
        ...item,
        checked: item.product.id === product.id
      }));
    } else {
      updated = cart.map(item => ({ ...item, checked: false }));
      updated.push({ product, quantity: 1, checked: true });
    }
    setCart(updated);
    localStorage.setItem('unipack_cart', JSON.stringify(updated));
    setShowCheckoutModal(true);
  };


  // Place orders and clear checked items in cart
  const handlePlaceOrder = () => {
    if (!receiverName.trim() || !receiverPhone.trim() || !roomNumber.trim()) {
      return toast.error('Vui lòng điền đầy đủ thông tin giao nhận hàng');
    }

    const checkedItems = cart.filter(item => item.checked);
    if (checkedItems.length === 0) {
      return toast.error('Không có sản phẩm nào được chọn thanh toán');
    }

    const newOrders: Order[] = checkedItems.map(item => ({
      id: 'UP' + Math.floor(100000 + Math.random() * 900000),
      productName: item.product.name,
      quantity: item.quantity,
      totalPrice: item.product.promoPrice * item.quantity,
      receiverName: receiverName,
      receiverPhone: receiverPhone,
      roomNumber: roomNumber,
      paymentMethod: paymentMethod,
      orderDate: new Date().toLocaleString('vi-VN'),
      status: 'PENDING_SUNDAY_DELIVERY',
      isPaid: paymentMethod === 'VIETQR' // VIETQR is pre-paid, COD is pay-later
    }));

    const updatedOrders = [...newOrders, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('unipack_orders', JSON.stringify(updatedOrders));

    const remainingCart = cart.filter(item => !item.checked);
    setCart(remainingCart);
    localStorage.setItem('unipack_cart', JSON.stringify(remainingCart));

    setProgressOrders(prev => prev + newOrders.length);

    toast.success('Đặt hàng UniPack thành công! Đã sinh mã QR nhận hàng.');
    setShowCheckoutModal(false);
    setShowCartModal(false);
  };

  const handleTogglePaymentStatus = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order && order.status === 'CANCELLED') {
      toast.error('Không thể đổi trạng thái thanh toán của đơn hàng đã hủy!');
      return;
    }
    const updated = orders.map(o =>
      o.id === orderId ? { ...o, isPaid: !o.isPaid } : o
    );
    setOrders(updated);
    localStorage.setItem('unipack_orders', JSON.stringify(updated));
    toast.success('Đã cập nhật trạng thái thanh toán!');
  };

  const handleCancelOrder = (orderId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
    const updated = orders.map(o =>
      o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o
    );
    setOrders(updated);
    localStorage.setItem('unipack_orders', JSON.stringify(updated));
    setProgressOrders(prev => Math.max(0, prev - 1));
    toast.success('Đã hủy đơn hàng thành công.');
  };

  const fm = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

  // Calculate cart states
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const checkedItemsCount = cart.filter(item => item.checked).length;
  const isAllChecked = cart.length > 0 && checkedItemsCount === cart.length;
  
  const checkedTotal = cart
    .filter(item => item.checked)
    .reduce((sum, item) => sum + item.product.promoPrice * item.quantity, 0);

  return (
    <div>
      <Header title="Tiện ích Cư dân: UniPack Thực Phẩm Giá Sỉ" />
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        
        {/* Banner Giới Thiệu UniPack */}
        <div className="bg-gradient-to-r from-violet-700 via-indigo-800 to-blue-700 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-3 max-w-2xl">
            <span className="bg-yellow-400 text-slate-900 text-xs font-extrabold uppercase px-3 py-1 rounded-full tracking-wider">Tiện ích đặc quyền RENTEASY</span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">UniPack - Thực phẩm giá sỉ sập sàn</h2>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Dịch vụ cung cấp các gói thực phẩm sỉ hạn sử dụng dài hạn (6-12 tháng) độc quyền cho các tòa nhà đối tác của RENTEASY. Giá rẻ hơn từ 20% - 30% so với siêu thị &amp; tạp hóa ngoài thị trường!
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <Clock className="w-4 h-4 text-yellow-300" /> Hạn chót đặt: Trước 22h Thứ Bảy hàng tuần
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <Calendar className="w-4 h-4 text-emerald-300" /> Vận chuyển: Giao đồng loạt vào Chủ Nhật
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 z-0">
            <ShoppingBag className="w-80 h-80" />
          </div>
        </div>

        {/* Thanh Tiến Trình Đơn Hàng Của Khu Trọ (Tuần này) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                Tiến trình đặt hàng chung của khu trọ tuần này
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Đặt chung gom đơn để nhận ưu đãi đặc biệt của khu trọ.</p>
            </div>
            <span className="text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
              Đã đặt: {progressOrders} / 15 đơn hàng
            </span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (progressOrders / 15) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>0 đơn</span>
              <span className="font-bold text-indigo-600">Đạt 15 đơn: Cả khu trọ được FREESHIP đợt Chủ Nhật! {progressOrders >= 15 ? '🎉 Đã đạt' : ''}</span>
            </div>
          </div>
        </div>

        {/* Categories Bar and Shopping Cart Action Trigger */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Tag className="w-5 h-5 text-yellow-500" /> Danh mục gói sỉ siêu tiết kiệm
          </h3>
          
          <button 
            onClick={() => setShowCartModal(true)} 
            className="relative bg-white border border-slate-200 hover:border-indigo-300 p-3 rounded-xl transition-all shadow-sm flex items-center gap-2 text-slate-700"
          >
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-bold hidden sm:inline">Giỏ hàng</span>
            {totalCartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>

        {/* Danh Sách Mặt Hàng Gói Thực Phẩm */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((p) => {
            const discount = Math.round(((p.originalPrice - p.promoPrice) / p.originalPrice) * 100);
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="h-44 relative bg-slate-100 overflow-hidden">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 bg-red-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow">
                      Tiết kiệm {discount}%
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{p.category}</span>
                    <h4 className="font-bold text-slate-800 text-base line-clamp-1">{p.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{p.description}</p>
                    
                    <div className="pt-2 grid grid-cols-2 gap-2 text-xs border-t border-slate-50 mt-3">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Quy cách đóng gói</span>
                        <span className="font-bold text-slate-700">{p.packSize}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Hạn sử dụng</span>
                        <span className="font-bold text-slate-700">{p.expiry}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-50/50 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-400 line-through block">{fm(p.originalPrice)}</span>
                    <span className="text-lg font-extrabold text-indigo-700">{fm(p.promoPrice)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAddToCart(p)}
                      className="bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 font-semibold text-xs px-3 py-2.5 rounded-xl flex items-center gap-1 shadow-sm transition-colors"
                      title="Thêm vào giỏ hàng"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-indigo-600" />
                      Giỏ hàng
                    </button>
                    <button 
                      onClick={() => handleQuickBuy(p)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1 shadow shadow-indigo-600/10 transition-colors"
                    >
                      Mua nhanh
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lịch Sử Đơn Hàng UniPack Đã Đặt */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">Đơn hàng UniPack của bạn</h3>
            <span className="text-xs text-slate-400">Tự động đồng bộ QR nhận hàng</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-left">
                  {['Mã đơn', 'Sản phẩm', 'SL', 'Tổng tiền', 'Người nhận / Phòng', 'Trạng thái', 'Thanh toán', 'Phương thức', 'Thao tác'].map((h) => (
                    <th key={h} className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">Bạn chưa đặt đơn hàng UniPack nào trong tuần này.</td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600">#{o.id}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{o.productName}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{o.quantity}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{fm(o.totalPrice)}</td>
                      <td className="px-6 py-4">
                        <div className="text-slate-800 font-medium">{o.receiverName}</div>
                        <div className="text-xs text-slate-400">Phòng {o.roomNumber} - {o.receiverPhone}</div>
                      </td>
                      <td className="px-6 py-4">
                        {o.status === 'CANCELLED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200">
                            Đã hủy đơn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            <Clock className="w-3 h-3" /> Giao Chủ Nhật
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {o.status === 'CANCELLED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200">
                            Chưa thanh toán
                          </span>
                        ) : currentUser?.role === 'TENANT' ? (
                          o.isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                              Đã thanh toán
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                              Chưa thanh toán
                            </span>
                          )
                        ) : o.isPaid ? (
                          <span 
                            onClick={() => handleTogglePaymentStatus(o.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100 cursor-pointer hover:bg-green-100 transition-colors"
                            title="Click để đổi sang Chưa thanh toán"
                          >
                            Đã thanh toán
                          </span>
                        ) : (
                          <button
                            onClick={() => handleTogglePaymentStatus(o.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 transition-colors"
                            title="Click để đánh dấu Đã thanh toán"
                          >
                            Chưa thanh toán
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {o.status === 'CANCELLED' ? (
                          <span className="text-slate-400">—</span>
                        ) : o.paymentMethod === 'COD' ? (
                          <span className="text-slate-600 font-medium flex items-center gap-1 text-xs">
                            💵 Tiền mặt
                          </span>
                        ) : (
                          <button
                            onClick={() => setPaymentQrOrder(o)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50/30 hover:bg-blue-50 transition-colors"
                            title="Click để xem mã QR chuyển khoản"
                          >
                            <QrCode className="w-3.5 h-3.5" /> Quét QR
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {o.status !== 'CANCELLED' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setQrOrder(o)}
                              className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <QrCode className="w-4 h-4" /> Xem QR
                            </button>
                            <button
                              onClick={() => handleCancelOrder(o.id)}
                              className="flex items-center gap-1 text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                              title="Hủy đơn hàng"
                            >
                              Hủy đơn
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 1. Modal Giỏ Hàng Chi Tiết */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                Giỏ hàng của bạn ({totalCartCount} sản phẩm)
              </h3>
              <button onClick={() => setShowCartModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <ShoppingCart className="w-12 h-12 text-slate-200" />
                  <p className="text-sm">Giỏ hàng đang trống.</p>
                  <p className="text-xs">Hãy quay lại thêm các gói sỉ giá tốt nhé!</p>
                </div>
              ) : (
                <>
                  {/* Select All Toggle Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-semibold text-slate-500">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={isAllChecked}
                        onChange={(e) => handleToggleSelectAll(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Chọn tất cả ({cart.length} gói)</span>
                    </label>
                    <span>Món đã chọn: {checkedItemsCount}</span>
                  </div>

                  {/* Cart Items list */}
                  <div className="space-y-3.5">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100/50">
                        {/* Checkbox item selection */}
                        <input 
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => handleCartCheckToggle(item.product.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4.5 h-4.5 cursor-pointer flex-shrink-0"
                        />
                        
                        {/* Image */}
                        <img src={item.product.image} alt={item.product.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />

                        {/* Title details */}
                        <div className="flex-1 space-y-0.5">
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{item.product.name}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">{item.product.packSize}</p>
                          <p className="text-xs font-extrabold text-indigo-600">{fm(item.product.promoPrice)}</p>
                        </div>

                        {/* Qty controls and delete actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-lg p-1">
                            <button 
                              onClick={() => handleCartQtyChange(item.product.id, -1)}
                              className="p-0.5 rounded hover:bg-slate-100"
                            >
                              <Minus className="w-3 h-3 text-slate-600" />
                            </button>
                            <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => handleCartQtyChange(item.product.id, 1)}
                              className="p-0.5 rounded hover:bg-slate-100"
                            >
                              <Plus className="w-3 h-3 text-slate-600" />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => handleRemoveFromCart(item.product.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Xóa khỏi giỏ"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer cart action section */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                <div>
                  <span className="text-xs text-slate-400 block font-semibold">Tổng tiền thanh toán ({checkedItemsCount} món):</span>
                  <span className="text-xl font-extrabold text-indigo-700">{fm(checkedTotal)}</span>
                </div>
                <button
                  onClick={() => {
                    if (checkedItemsCount === 0) {
                      toast.error('Vui lòng chọn ít nhất 1 sản phẩm để thanh toán');
                      return;
                    }
                    setShowCheckoutModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md shadow-indigo-600/10 transition-transform active:scale-95"
                >
                  Thanh toán tất cả ({checkedItemsCount})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Modal Thông Tin Giao Nhận & Xác Nhận Đặt Hàng Giỏ Hàng */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">Thông tin thanh toán đơn</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Danh sách đặt mua</span>
                <div className="space-y-1 text-xs text-slate-700">
                  {cart.filter(item => item.checked).map(item => (
                    <div key={item.product.id} className="flex justify-between">
                      <span className="truncate max-w-[70%]">{item.product.name}</span>
                      <span className="font-bold text-slate-800">x{item.quantity} ({fm(item.product.promoPrice * item.quantity)})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thông tin giao hàng */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Thông tin giao nhận (Giao Chủ Nhật)</p>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Họ tên người nhận *</label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={e => setReceiverName(e.target.value)}
                    className="input py-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Số điện thoại *</label>
                    <input
                      type="text"
                      value={receiverPhone}
                      onChange={e => setReceiverPhone(e.target.value)}
                      className="input py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Số phòng trọ *</label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={e => setRoomNumber(e.target.value)}
                      className="input py-2 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Hình thức thanh toán */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600">Hình thức thanh toán</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('COD')}
                    className={`py-2 px-3 rounded-lg border-2 text-xs font-semibold transition-all ${
                      paymentMethod === 'COD' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Thanh toán khi nhận (COD)
                  </button>
                  <button
                    onClick={() => setPaymentMethod('VIETQR')}
                    className={`py-2 px-3 rounded-lg border-2 text-xs font-semibold transition-all ${
                      paymentMethod === 'VIETQR' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Chuyển khoản VietQR
                  </button>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl flex gap-2 items-start text-xs text-yellow-800">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Hàng được giao đồng loạt vào **Chủ Nhật tuần này** trước phòng trọ của bạn.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-semibold">Tổng cộng:</span>
                <span className="text-lg font-extrabold text-indigo-700">{fm(checkedTotal)}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md shadow-indigo-600/10 transition-transform active:scale-95"
              >
                Xác nhận thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Mã QR Nhận Hàng Lẻ */}
      {qrOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setQrOrder(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setQrOrder(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            
            <h3 className="font-extrabold text-slate-800 text-base mb-1">Mã QR Nhận Hàng UniPack</h3>
            <p className="text-xs text-slate-400 mb-4">Mã đơn: <span className="font-bold text-indigo-600">#{qrOrder.id}</span></p>
            
            <div className="bg-slate-50 rounded-2xl p-4 inline-block mb-4 border border-slate-100">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=RENTEASY-UNIPACK-${qrOrder.id}-${qrOrder.roomNumber}`}
                alt="Mã QR Nhận hàng"
                className="w-44 h-44 object-contain mx-auto"
              />
            </div>

            <div className="space-y-1 text-left p-3.5 bg-slate-50 rounded-xl mb-4 text-xs text-slate-600">
              <div className="flex justify-between"><span className="text-slate-400">Sản phẩm:</span><span className="font-bold text-slate-800">{qrOrder.productName} (x{qrOrder.quantity})</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Người nhận:</span><span className="font-semibold text-slate-800">{qrOrder.receiverName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Vị trí giao:</span><span className="font-bold text-slate-800">Phòng #{qrOrder.roomNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Thời gian giao:</span><span className="font-bold text-blue-600">Chủ Nhật tuần này</span></div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-700 text-left leading-relaxed flex gap-2">
              <Info className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>
                <strong>HƯỚNG DẪN:</strong> Khi shipper tới giao hàng vào Chủ Nhật, bạn xuất trình mã QR này để shipper quét xác thực. Chỉ cư dân trong khu trọ mới được quyền nhận hàng để đảm bảo an ninh.
              </span>
            </div>

            <button onClick={() => setQrOrder(null)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md mt-4">
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* 4. Modal Quét QR Thanh Toán */}
      {paymentQrOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setPaymentQrOrder(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPaymentQrOrder(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            
            <h3 className="font-extrabold text-slate-800 text-base mb-1">QR Chuyển Khoản Thanh Toán</h3>
            <p className="text-xs text-slate-400 mb-4">Đơn hàng: <span className="font-bold text-indigo-600">#{paymentQrOrder.id}</span></p>
            
            <div className="bg-slate-50 rounded-2xl p-4 inline-block mb-4 border border-slate-100">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=247001-0901234567-MBBANK-RENTEASY-UNIPACK-${paymentQrOrder.id}`}
                alt="QR Chuyển khoản"
                className="w-44 h-44 object-contain mx-auto"
              />
            </div>

            <div className="space-y-1 text-left p-3.5 bg-slate-50 rounded-xl mb-4 text-xs text-slate-600">
              <div className="flex justify-between"><span className="text-slate-400">Ngân hàng:</span><span className="font-bold text-slate-800">MB Bank (Quân Đội)</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Số tài khoản:</span><span className="font-bold text-slate-800">0901234567</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Chủ tài khoản:</span><span className="font-bold text-slate-800">NGUYEN VAN A</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Số tiền chuyển:</span><span className="font-extrabold text-indigo-600 text-sm">{fm(paymentQrOrder.totalPrice)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Nội dung chuyển:</span><span className="font-mono font-bold text-red-600">RENTEASY UP {paymentQrOrder.id}</span></div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[10px] text-blue-700 text-left leading-relaxed flex gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                Sau khi chuyển khoản thành công, hệ thống sẽ xác nhận tự động. Bạn cũng có thể click trực tiếp vào trạng thái thanh toán để đánh dấu là Đã thanh toán.
              </span>
            </div>

            <button onClick={() => setPaymentQrOrder(null)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md mt-4">
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
