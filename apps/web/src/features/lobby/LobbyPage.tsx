import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../stores/authStore';
import { RoomData, TIME_CONTROLS, SOCKET_EVENTS } from '@online-chess/shared';
import {
  Plus,
  Swords,
  Bot,
  Hash,
  Clock,
  Users,
  RefreshCw,
  X,
  ChevronRight,
  Search,
} from 'lucide-react';

export default function LobbyPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const socket = getSocket();

  const [searchParams] = useSearchParams();
  const urlJoinCode = searchParams.get('join') || '';

  // Create room modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [colorPref, setColorPref] = useState<'white' | 'black' | 'random'>('random');
  const [selectedTimeKey, setSelectedTimeKey] = useState<keyof typeof TIME_CONTROLS>('BLITZ_5');

  // Join code state
  const [joinCode, setJoinCode] = useState(urlJoinCode);
  const [joinError, setJoinError] = useState('');

  // Matchmaking state
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  const [searchTimer, setSearchTimer] = useState(0);

  // Search/Filter rooms
  const [filterQuery, setFilterQuery] = useState('');

  // Fetch public rooms
  const {
    data: rooms = [],
    isLoading: isLoadingRooms,
    refetch: refetchRooms,
    isFetching: isFetchingRooms,
  } = useQuery({
    queryKey: ['publicRooms'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return (res.data.data as RoomData[]) || [];
    },
    refetchInterval: 4000,
  });

  // Socket listeners for matchmaking and room events
  useEffect(() => {
    const handleMatchFound = (data: { gameId: string }) => {
      setIsSearchingMatch(false);
      navigate(`/game/${data.gameId}`);
    };

    socket.on(SOCKET_EVENTS.MATCH_FOUND, handleMatchFound);

    return () => {
      socket.off(SOCKET_EVENTS.MATCH_FOUND, handleMatchFound);
    };
  }, [socket, navigate]);

  // Matchmaking timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isSearchingMatch) {
      interval = setInterval(() => {
        setSearchTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setSearchTimer(0);
    }
    return () => clearInterval(interval);
  }, [isSearchingMatch]);

  const handleStartMatchmaking = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const tc = TIME_CONTROLS[selectedTimeKey];
    setIsSearchingMatch(true);
    socket.emit(SOCKET_EVENTS.MATCHMAKING_JOIN, {
      initialTimeMs: tc.initialTimeMs,
      incrementMs: tc.incrementMs,
    });
  };

  const handleCancelMatchmaking = () => {
    setIsSearchingMatch(false);
    socket.emit(SOCKET_EVENTS.MATCHMAKING_CANCEL);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const tc = TIME_CONTROLS[selectedTimeKey];
      const res = await api.post('/rooms', {
        name: roomName.trim() || `Phòng của ${user?.username}`,
        visibility,
        colorPreference: colorPref,
        initialTimeMs: tc.initialTimeMs,
        incrementMs: tc.incrementMs,
      });

      if (res.data.success && res.data.data) {
        setShowCreateModal(false);
        const newRoom: RoomData = res.data.data;
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId: newRoom.id });
        if (newRoom.gameId) {
          navigate(`/game/${newRoom.gameId}`);
        } else {
          navigate(`/game/waiting?roomId=${newRoom.id}&code=${newRoom.roomCode}`);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo phòng đấu');
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!joinCode.trim()) return;

    setJoinError('');
    try {
      const targetCode = joinCode.trim().toUpperCase();
      const res = await api.post(`/rooms/${targetCode}/join`, {});
      if (res.data.success && res.data.data) {
        const { gameId, room } = res.data.data;
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode: targetCode, roomId: room?.id });
        if (gameId) {
          navigate(`/game/${gameId}`);
        }
      }
    } catch (err: any) {
      setJoinError(err.response?.data?.message || 'Mã phòng không tồn tại hoặc phòng đã đầy');
    }
  };

  const handleJoinDirect = async (roomId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/rooms/${roomId}/join`, {});
      if (res.data.success && res.data.data) {
        const { gameId, room } = res.data.data;
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, roomCode: room?.roomCode });
        if (gameId) {
          navigate(`/game/${gameId}`);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tham gia phòng này');
    }
  };

  const filteredRooms = rooms.filter((r) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.roomCode.toLowerCase().includes(q) ||
      r.players[0]?.username?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col gap-8">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sảnh Chờ & Ghép Trận
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Chọn hình thức thi đấu nhanh, luyện tập với máy hoặc tham gia các phòng cờ đang mở.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-300 text-slate-800 font-bold rounded-xl text-sm flex items-center gap-2 shadow-subtle hover:border-slate-400 transition-all duration-150"
          >
            <Plus className="w-4 h-4 text-slate-700" />
            <span>Tạo phòng mới</span>
          </button>
        </div>
      </div>

      {/* Quick Play Cards (3 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Matchmaking */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center mb-4">
              <Swords className="w-5 h-5 text-sky-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Ghép Cặp Tự Động</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
              Tìm đối thủ cùng khoảng điểm ELO và thi đấu cờ chớp Blitz 5 phút.
            </p>
          </div>

          <div>
            {isSearchingMatch ? (
              <div className="p-4 bg-sky-50/90 border border-sky-200 rounded-xl text-center space-y-3">
                <div className="flex items-center justify-center gap-2.5 text-sky-700 font-semibold text-sm">
                  <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                  <span>
                    Đang tìm đối thủ... (
                    <span className="font-mono tabular-nums font-bold">{searchTimer}s</span>)
                  </span>
                </div>
                <button
                  onClick={handleCancelMatchmaking}
                  className="w-full py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold transition-colors duration-150"
                >
                  Hủy Ghép Trận
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartMatchmaking}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] font-bold text-white rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 text-sm"
              >
                <Swords className="w-4 h-4 text-sky-400" />
                <span>Tìm trận nhanh (5 phút)</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Play AI */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mb-4">
              <Bot className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Đấu Với Máy AI</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
              Luyện cờ cùng thuật toán Minimax và Alpha-Beta với 3 mức độ Dễ, Trung bình, Khó.
            </p>
          </div>

          <button
            onClick={() => navigate('/ai')}
            className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200/90 font-bold text-slate-800 hover:text-sky-700 hover:border-slate-300 active:scale-[0.98] rounded-xl transition-all duration-150 flex items-center justify-center gap-2 text-sm shadow-subtle"
          >
            <Bot className="w-4 h-4 text-sky-600" />
            <span>Chơi Với Máy Ngay</span>
          </button>
        </div>

        {/* Card 3: Join by Room Code */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center mb-4">
              <Hash className="w-5 h-5 text-sky-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Nhập Mã Phòng</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
              Nhập mã 6 ký tự để tham gia phòng đấu riêng của bạn bè.
            </p>
          </div>

          <form onSubmit={handleJoinByCode} className="space-y-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="VD: K8X9B2"
              maxLength={10}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-slate-900 uppercase tracking-widest text-center font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white text-base sm:text-sm transition-colors duration-150"
            />
            {joinError && <p className="text-xs text-rose-600 text-center font-medium">{joinError}</p>}
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white font-bold rounded-xl shadow-sm transition-all duration-150 text-sm"
            >
              Tham Gia Bằng Mã
            </button>
          </form>
        </div>
      </div>

      {/* Public Rooms Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Phòng Đang Chờ Đối Thủ</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 tabular-nums">
                  {rooms.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các phòng công khai đang tìm kỳ thủ giao lưu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Filter */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Lọc phòng hoặc chủ phòng..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200/90 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
              />
            </div>

            <button
              onClick={() => refetchRooms()}
              aria-label="Làm mới danh sách phòng"
              title="Làm mới"
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-600 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isFetchingRooms ? 'animate-spin text-sky-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Room Grid */}
        <div className="flex-1 mt-6">
          {isLoadingRooms ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center">
              <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-sm font-medium">Đang tải danh sách phòng...</span>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 text-slate-400">
                <Users className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-slate-700">Chưa có phòng nào đang chờ</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Hãy là người đầu tiên tạo phòng mới hoặc bấm Ghép Trận Nhanh để thi đấu!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Tạo Phòng Ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map((r) => {
                const host = r.players[0];
                return (
                  <div
                    key={r.id}
                    className="p-4 bg-slate-50/60 hover:bg-white border border-slate-200/80 hover:border-sky-300 rounded-xl transition-all duration-150 flex flex-col justify-between gap-4 hover:shadow-subtle group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 font-bold border border-sky-200/60">
                          #{r.roomCode}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                          <Clock className="w-3.5 h-3.5 text-sky-600" />
                          <span className="font-mono tabular-nums">
                            {Math.round(r.initialTimeMs / 60000)}p
                            {r.incrementMs > 0 ? ` + ${r.incrementMs / 1000}s` : ''}
                          </span>
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-sky-700 transition-colors">
                        {r.name}
                      </h4>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {host?.username?.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="text-xs text-slate-600">
                          Chủ phòng: <strong className="text-slate-900">{host?.username}</strong>
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-slate-400">
                          ({host?.eloRating} ELO)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleJoinDirect(r.id)}
                      className="w-full py-2 bg-sky-600 hover:bg-sky-700 active:scale-[0.98] font-bold text-xs text-white rounded-lg transition-all duration-150 shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <span>Vào Thách Đấu</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 sm:p-7 shadow-modal relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowCreateModal(false)}
              aria-label="Đóng cửa sổ tạo phòng"
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 id="modal-title" className="text-xl font-extrabold text-slate-900 mb-1">
              Tạo Phòng Chơi Mới
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Thiết lập cấu hình thời gian thi đấu và quy tắc ván cờ.
            </p>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              {/* Room name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tên phòng
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder={`Phòng của ${user?.username}`}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base sm:text-sm focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Time Control selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kiểm soát thời gian (Time control)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(TIME_CONTROLS).map(([key, val]) => {
                    const isSelected = selectedTimeKey === key;
                    const tc = val as any;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedTimeKey(key as keyof typeof TIME_CONTROLS)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-subtle'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {tc.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color preference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Màu quân ưu tiên
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'random', label: 'Ngẫu nhiên' },
                    { key: 'white', label: 'Quân Trắng' },
                    { key: 'black', label: 'Quân Đen' },
                  ].map((c) => {
                    const isSelected = colorPref === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setColorPref(c.key as any)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-subtle'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visibility mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Chế độ hiển thị
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility('PUBLIC')}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                      visibility === 'PUBLIC'
                        ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-subtle'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Công khai (Sảnh chờ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('PRIVATE')}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                      visibility === 'PRIVATE'
                        ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-subtle'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Riêng tư (Chỉ bằng mã)
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors duration-150"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold rounded-xl text-sm shadow-sm transition-all duration-150"
                >
                  Tạo Phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
