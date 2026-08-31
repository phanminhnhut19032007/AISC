'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { buildingsApi, roomsApi, Building, Room } from '@/lib/api';
import { Building2, MapPin, Plus, DoorOpen, Zap, Droplets, Info, X, Trash2, Edit3, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  AVAILABLE: { label: 'Còn trống', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  OCCUPIED: { label: 'Đang thuê', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  MAINTENANCE: { label: 'Bảo trì', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [roomsMap, setRoomsMap] = useState<Record<string, Room[]>>({});
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  
  // 1. States quản lý Modal Tòa nhà (Thêm tòa nhà)
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    province: '',
    total_floors: 3,
    rooms_count: 6,
    default_rent: 3000000,
  });
  const [saving, setSaving] = useState(false);

  // 2. States quản lý Modal Xóa Tòa nhà (Xác nhận 2 lớp)
  const [buildingToDelete, setBuildingToDelete] = useState<Building | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingBuilding, setDeletingBuilding] = useState(false);

  // 3. States quản lý Modal Thêm phòng lẻ
  const [buildingToAddRoom, setBuildingToAddRoom] = useState<Building | null>(null);
  const [roomForm, setRoomForm] = useState({
    room_number: '',
    floor: 1,
    base_rent: 3000000,
    electricity_rate: 4000,
    water_rate: 25000
  });
  const [savingRoom, setSavingRoom] = useState(false);

  // 4. States quản lý Popup Chi tiết & Chỉnh sửa phòng trọ
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showRoomDetail, setShowRoomDetail] = useState(false);
  const [editRoomMode, setEditRoomMode] = useState(false);
  const [editRoomForm, setEditRoomForm] = useState({
    base_rent: 0,
    electricity_rate: 0,
    water_rate: 0,
    status: 'AVAILABLE' as 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE',
    floor: 1
  });
  const [updatingRoom, setUpdatingRoom] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);

  const load = async (deletedOnly: boolean = showDeleted) => {
    setLoading(true);
    try {
      const res = await buildingsApi.list({ include_deleted: deletedOnly });
      setBuildings(res.data);
      const rm: Record<string, Room[]> = {};
      for (const b of res.data) {
        const r = await buildingsApi.rooms(b.id);
        rm[b.id] = r.data;
      }
      setRoomsMap(rm);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(showDeleted); }, [showDeleted]);

  const handleAddBuilding = async () => {
    if (!form.name || !form.address) return toast.error('Vui lòng nhập đầy đủ thông tin Tên và Địa chỉ tòa nhà');
    if (form.rooms_count <= 0) return toast.error('Số lượng phòng cần lớn hơn 0');
    
    setSaving(true);
    try {
      const bRes = await buildingsApi.create({
        name: form.name,
        address: form.address,
        province: form.province,
        total_floors: form.total_floors
      } as any);
      
      const buildingId = bRes.data.id;
      const roomsPerFloor = Math.ceil(form.rooms_count / form.total_floors);
      const roomPromises = [];
      let createdCount = 0;
      
      for (let f = 1; f <= form.total_floors; f++) {
        for (let r = 1; r <= roomsPerFloor; r++) {
          if (createdCount >= form.rooms_count) break;
          const roomNumber = `${f}${r < 10 ? '0' + r : r}`;
          roomPromises.push(
            roomsApi.create({
              building_id: buildingId,
              room_number: roomNumber,
              base_rent: form.default_rent,
              electricity_rate: 4000,
              water_rate: 25000
            })
          );
          createdCount++;
        }
      }
      await Promise.all(roomPromises);
      
      toast.success(`Tạo tòa nhà thành công và tự động khởi tạo ${form.rooms_count} phòng trọ!`);
      setShowAdd(false);
      setForm({
        name: '',
        address: '',
        province: '',
        total_floors: 3,
        rooms_count: 6,
        default_rent: 3000000,
      });
      await load(showDeleted);
    } catch {
      toast.error('Lỗi khi tạo tòa nhà hoặc phòng trọ');
    } finally {
      setSaving(false);
    }
  };

  // Xóa tòa nhà xác nhận 2 lớp
  const handleDeleteBuilding = async () => {
    if (!buildingToDelete) return;
    if (deleteConfirmText.trim().toUpperCase() !== 'Y') {
      return toast.error('Vui lòng nhập chính xác chữ "Y" để xác nhận');
    }

    setDeletingBuilding(true);
    try {
      await buildingsApi.delete(buildingToDelete.id);
      toast.success(`Đã chuyển tòa nhà "${buildingToDelete.name}" vào thùng rác!`);
      setBuildingToDelete(null);
      setDeleteConfirmText('');
      await load(showDeleted);
    } catch {
      toast.error('Lỗi khi xóa tòa nhà');
    } finally {
      setDeletingBuilding(false);
    }
  };

  const handleRestoreBuilding = async (id: string) => {
    try {
      await buildingsApi.restore(id);
      toast.success('Khôi phục tòa nhà thành công!');
      await load(showDeleted);
    } catch {
      toast.error('Lỗi khi khôi phục tòa nhà');
    }
  };

  // Thêm phòng lẻ
  const handleAddRoom = async () => {
    if (!buildingToAddRoom) return;
    if (!roomForm.room_number.trim()) return toast.error('Vui lòng điền số phòng');

    setSavingRoom(true);
    try {
      await roomsApi.create({
        building_id: buildingToAddRoom.id,
        room_number: roomForm.room_number,
        base_rent: roomForm.base_rent,
        electricity_rate: roomForm.electricity_rate,
        water_rate: roomForm.water_rate
      });
      toast.success(`Đã thêm phòng ${roomForm.room_number} thành công!`);
      setBuildingToAddRoom(null);
      setRoomForm({
        room_number: '',
        floor: 1,
        base_rent: 3000000,
        electricity_rate: 4000,
        water_rate: 25000
      });
      await load(showDeleted);
    } catch {
      toast.error('Lỗi khi thêm phòng');
    } finally {
      setSavingRoom(false);
    }
  };

  // Lưu chỉnh sửa phòng
  const handleUpdateRoom = async () => {
    if (!selectedRoom) return;
    setUpdatingRoom(true);
    try {
      const res = await roomsApi.update(selectedRoom.id, {
        base_rent: editRoomForm.base_rent,
        electricity_rate: editRoomForm.electricity_rate,
        water_rate: editRoomForm.water_rate,
        status: editRoomForm.status,
        floor: editRoomForm.floor
      });
      toast.success(`Đã cập nhật phòng #${res.data.room_number} thành công!`);
      setShowRoomDetail(false);
      setEditRoomMode(false);
      await load(showDeleted);
    } catch {
      toast.error('Lỗi khi cập nhật phòng');
    } finally {
      setUpdatingRoom(false);
    }
  };

  // Xóa một phòng cụ thể
  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn phòng #${selectedRoom.room_number} không?`)) return;

    setDeletingRoom(true);
    try {
      await roomsApi.delete(selectedRoom.id);
      toast.success(`Đã xóa phòng #${selectedRoom.room_number} thành công!`);
      setShowRoomDetail(false);
      setEditRoomMode(false);
      await load(showDeleted);
    } catch {
      toast.error('Lỗi khi xóa phòng');
    } finally {
      setDeletingRoom(false);
    }
  };

  const fm = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' VND';

  return (
    <div>
      <Header title="Quản lý Tòa nhà & Phòng" />
      <div className="p-6 space-y-5">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowDeleted(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                !showDeleted 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              Hoạt động
            </button>
            <button
              onClick={() => setShowDeleted(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-all ${
                showDeleted 
                  ? 'bg-red-50 border-red-200 text-red-700 font-bold' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              🗑️ Tòa nhà đã xóa
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => load(showDeleted)} className="btn-secondary">Tải lại</button>
            <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Thêm tòa nhà
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4">{[...Array(2)].map((_, i) => <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-2xl" />)}</div>
        ) : buildings.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{showDeleted ? "Không có tòa nhà nào trong thùng rác" : "Chưa có tòa nhà nào. Hãy tạo tòa nhà đầu tiên của bạn!"}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {buildings.map((b) => {
              const bRooms = roomsMap[b.id] || [];
              const occupied = bRooms.filter(r => r.status === 'OCCUPIED').length;
              return (
                <div key={b.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                  {/* Tiêu đề tòa nhà */}
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-lg">{b.name}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />{b.address}
                        </p>
                      </div>
                    </div>
                    {/* Hành động tòa nhà */}
                    <div className="flex items-center gap-2">
                      {showDeleted ? (
                        <button
                          onClick={() => handleRestoreBuilding(b.id)}
                          className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          🔄 Khôi phục
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setBuildingToAddRoom(b);
                              setRoomForm({ ...roomForm, floor: (bRooms.length ? Math.max(...bRooms.map(r=>r.floor||1)) : 1) });
                            }}
                            className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Thêm phòng
                          </button>
                          <button
                            onClick={() => setBuildingToDelete(b)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa tòa nhà này"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Còn trống', value: bRooms.filter(r=>r.status==='AVAILABLE').length, color: 'text-emerald-600 bg-emerald-50' },
                      { label: 'Đang thuê', value: occupied, color: 'text-blue-600 bg-blue-50' },
                      { label: 'Bảo trì', value: bRooms.filter(r=>r.status==='MAINTENANCE').length, color: 'text-orange-600 bg-orange-50' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
                        <div className="font-bold text-xl">{value}</div>
                        <div className="text-xs mt-0.5 opacity-80">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Rooms List Grid */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Danh sách phòng ({bRooms.length})</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {bRooms.map((r) => {
                        const sc = STATUS_CONFIG[r.status] || { label: r.status, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' };
                        return (
                          <div
                            key={r.id}
                            onClick={() => {
                              setSelectedRoom(r);
                              setEditRoomForm({
                                base_rent: r.base_rent,
                                electricity_rate: r.electricity_rate,
                                water_rate: r.water_rate,
                                status: r.status,
                                floor: r.floor || 1
                              });
                              setEditRoomMode(false); // ban đầu xem chi tiết trước
                              setShowRoomDetail(true);
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer transition-all active:scale-95 ${sc.bg} ${sc.border}`}
                          >
                            <div className="flex items-center gap-2">
                              <DoorOpen className={`w-4 h-4 ${sc.text}`} />
                              <span className={`font-bold text-sm ${sc.text}`}>#{r.room_number}</span>
                            </div>
                            <span className="text-[10px] opacity-70 font-medium font-mono">
                              {r.status === 'OCCUPIED' ? 'Đã thuê' : r.status === 'AVAILABLE' ? 'Trống' : 'Bảo trì'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 1. Modal Thêm Tòa Nhà + Khởi tạo phòng tự động */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Thêm tòa nhà mới</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl space-y-3.5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Thông tin cơ bản</p>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tên tòa nhà *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input" placeholder="Nhà trọ Minh Châu, Chung cư mini..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Địa chỉ *</label>
                  <input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="input" placeholder="123 Nguyễn Trãi, Q1, TP.HCM" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tỉnh / Thành phố</label>
                  <input value={form.province} onChange={e=>setForm({...form,province:e.target.value})} className="input" placeholder="Hồ Chí Minh" />
                </div>
              </div>

              <div className="p-4 bg-blue-50/40 border border-blue-100/50 rounded-xl space-y-3.5">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5"><DoorOpen className="w-4 h-4" /> Cấu hình khởi tạo phòng trọ tự động</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Số lượng tầng *</label>
                    <input type="number" min={1} max={20} value={form.total_floors} onChange={e=>setForm({...form,total_floors: e.target.value === '' ? '' : Number(e.target.value) as any})} className="input font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tổng số phòng cần tạo *</label>
                    <input type="number" min={1} max={100} value={form.rooms_count} onChange={e=>setForm({...form,rooms_count: e.target.value === '' ? '' : Number(e.target.value) as any})} className="input font-bold text-blue-700" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giá thuê phòng mặc định (VND/tháng) *</label>
                  <input type="number" min={100000} step={100000} value={form.default_rent} onChange={e=>setForm({...form,default_rent: e.target.value === '' ? '' : Number(e.target.value) as any})} className="input font-bold" />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button onClick={() => setShowAdd(false)} className="btn-secondary">Hủy</button>
              <button onClick={handleAddBuilding} disabled={saving} className="btn-primary min-w-[120px]">
                {saving ? 'Đang khởi tạo...' : 'Tạo tòa nhà'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Xóa Tòa Nhà (Xác nhận 2 lớp) */}
      {buildingToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-red-600 flex items-center gap-1.5"><Trash2 className="w-5 h-5" /> Cảnh báo xóa tòa nhà</h2>
              <button onClick={() => setBuildingToDelete(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed">
              Bạn đang yêu cầu xóa vĩnh viễn tòa nhà <span className="font-bold text-slate-800">"{buildingToDelete.name}"</span>. 
              Hành động này sẽ <span className="font-bold text-red-600">xóa toàn bộ các phòng trọ và dữ liệu hóa đơn</span> liên quan bên trong tòa nhà đó và không thể khôi phục lại.
            </p>

            <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl space-y-2">
              <p className="text-xs text-red-800 font-bold">Vui lòng nhập chữ "Y" để xác nhận:</p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Nhập Y để xác nhận"
                className="w-full border-2 border-red-200 focus:border-red-500 rounded-lg px-3 py-2 text-sm focus:outline-none uppercase font-bold text-red-700 bg-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setBuildingToDelete(null)} className="btn-secondary">Hủy bỏ</button>
              <button
                onClick={handleDeleteBuilding}
                disabled={deletingBuilding || deleteConfirmText.trim().toUpperCase() !== 'Y'}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {deletingBuilding ? 'Đang xóa...' : 'Tôi chắc chắn, xóa tòa nhà'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Thêm phòng lẻ cho Tòa nhà */}
      {buildingToAddRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Thêm phòng mới ({buildingToAddRoom.name})</h2>
              <button onClick={() => setBuildingToAddRoom(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Số phòng *</label>
                  <input
                    type="text"
                    value={roomForm.room_number}
                    onChange={e => setRoomForm({ ...roomForm, room_number: e.target.value })}
                    placeholder="Ví dụ: 303"
                    className="input font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tầng *</label>
                  <input
                    type="number"
                    value={roomForm.floor}
                    onChange={e => setRoomForm({ ...roomForm, floor: e.target.value === '' ? '' : Number(e.target.value) as any })}
                    className="input font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Giá thuê phòng (VND/tháng) *</label>
                <input
                  type="number"
                  value={roomForm.base_rent}
                  onChange={e => setRoomForm({ ...roomForm, base_rent: e.target.value === '' ? '' : Number(e.target.value) as any })}
                  className="input font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giá điện (VND/kWh)</label>
                  <input
                    type="number"
                    value={roomForm.electricity_rate}
                    onChange={e => setRoomForm({ ...roomForm, electricity_rate: e.target.value === '' ? '' : Number(e.target.value) as any })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giá nước (VND/m³)</label>
                  <input
                    type="number"
                    value={roomForm.water_rate}
                    onChange={e => setRoomForm({ ...roomForm, water_rate: e.target.value === '' ? '' : Number(e.target.value) as any })}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button onClick={() => setBuildingToAddRoom(null)} className="btn-secondary">Hủy</button>
              <button onClick={handleAddRoom} disabled={savingRoom} className="btn-primary min-w-[100px]">
                {savingRoom ? 'Đang thêm...' : 'Thêm phòng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Popup/Modal Chi Tiết & Chỉnh Sửa Phòng Trọ */}
      {showRoomDetail && selectedRoom && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowRoomDetail(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header popup */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DoorOpen className="w-6 h-6" />
                <div>
                  <h3 className="font-extrabold text-lg">Phòng #{selectedRoom.room_number}</h3>
                  <p className="text-xs text-blue-100">{editRoomMode ? 'Chế độ chỉnh sửa' : 'Chi tiết phòng trọ'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!editRoomMode && (
                  <button
                    onClick={() => setEditRoomMode(true)}
                    className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
                    title="Chỉnh sửa thông tin phòng"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setShowRoomDetail(false)}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content popup */}
            <div className="p-6 space-y-4">
              {editRoomMode ? (
                /* CHẾ ĐỘ CHỈNH SỬA PHÒNG TRỌ */
                <div className="space-y-4">
                  {/* Trạng thái phòng */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Trạng thái phòng *</label>
                    <select
                      value={editRoomForm.status}
                      onChange={e => setEditRoomForm({ ...editRoomForm, status: e.target.value as any })}
                      className="input py-2 font-semibold text-slate-700"
                    >
                      <option value="AVAILABLE">Còn trống (AVAILABLE)</option>
                      <option value="OCCUPIED">Đang thuê (OCCUPIED)</option>
                      <option value="MAINTENANCE">Đang bảo trì (MAINTENANCE)</option>
                    </select>
                  </div>

                  {/* Giá thuê */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Giá thuê (VND/tháng) *</label>
                    <input
                      type="number"
                      value={editRoomForm.base_rent}
                      onChange={e => setEditRoomForm({ ...editRoomForm, base_rent: e.target.value === '' ? '' : Number(e.target.value) as any })}
                      className="input py-2 font-bold text-slate-700 border-blue-200"
                    />
                  </div>

                  {/* Vị trí tầng */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Vị trí tầng *</label>
                    <input
                      type="number"
                      value={editRoomForm.floor}
                      onChange={e => setEditRoomForm({ ...editRoomForm, floor: e.target.value === '' ? '' : Number(e.target.value) as any })}
                      className="input py-2 font-semibold text-slate-700"
                    />
                  </div>

                  {/* Điện nước */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Giá điện (VND/kWh)</label>
                      <input
                        type="number"
                        value={editRoomForm.electricity_rate}
                        onChange={e => setEditRoomForm({ ...editRoomForm, electricity_rate: e.target.value === '' ? '' : Number(e.target.value) as any })}
                        className="input py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Giá nước (VND/m³)</label>
                      <input
                        type="number"
                        value={editRoomForm.water_rate}
                        onChange={e => setEditRoomForm({ ...editRoomForm, water_rate: e.target.value === '' ? '' : Number(e.target.value) as any })}
                        className="input py-2"
                      />
                    </div>
                  </div>

                  {/* Nút lưu chỉnh sửa & xóa */}
                  <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
                    <button
                      onClick={handleDeleteRoom}
                      disabled={deletingRoom}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 rounded-xl transition-all border border-red-200 flex items-center justify-center gap-1.5 text-sm"
                    >
                      <Trash2 className="w-4 h-4" /> Xóa phòng
                    </button>
                    <button
                      onClick={handleUpdateRoom}
                      disabled={updatingRoom}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-sm"
                    >
                      <Save className="w-4 h-4" /> Lưu thông tin
                    </button>
                  </div>
                </div>
              ) : (
                /* CHẾ ĐỘ XEM CHI TIẾT */
                <div className="space-y-5">
                  {/* Trạng thái phòng */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-500">Trạng thái phòng:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      selectedRoom.status === 'AVAILABLE' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : selectedRoom.status === 'OCCUPIED' ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-orange-50 border-orange-200 text-orange-700'
                    }`}>
                      {selectedRoom.status === 'AVAILABLE' ? 'Còn trống'
                      : selectedRoom.status === 'OCCUPIED' ? 'Đã cho thuê'
                      : 'Đang bảo trì'}
                    </span>
                  </div>

                  {/* Chi tiết biểu phí */}
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Vị trí tầng:</span>
                      <span className="text-sm font-bold text-slate-800">Tầng {selectedRoom.floor || 1}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Tiền thuê phòng:</span>
                      <span className="text-sm font-extrabold text-blue-600">{fm(selectedRoom.base_rent)}/tháng</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 flex items-center gap-1.5"><Zap className="w-4 h-4 text-yellow-500" /> Giá điện:</span>
                      <span className="text-sm font-bold text-slate-800">{fm(selectedRoom.electricity_rate)}/kWh</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 flex items-center gap-1.5"><Droplets className="w-4 h-4 text-blue-500" /> Giá nước:</span>
                      <span className="text-sm font-bold text-slate-800">{fm(selectedRoom.water_rate)}/m³</span>
                    </div>
                  </div>

                  {/* Thông tin mô tả nhanh */}
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl flex gap-2.5 items-start">
                    <Info className="w-4.5 h-4.5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Để thay đổi hoặc chỉnh sửa thông tin dịch vụ phòng, hãy bấm vào biểu tượng cây bút chỉnh sửa ở góc trên bên phải.
                    </p>
                  </div>

                  {/* Nút đóng */}
                  <button
                    onClick={() => setShowRoomDetail(false)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/10"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
