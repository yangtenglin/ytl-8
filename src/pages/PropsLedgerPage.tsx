import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Prop, PropBorrowRecord, PropBorrowStatus } from '../types';
import {
  ClipboardList,
  ScanLine,
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  Search,
  Filter,
  X,
  CheckCircle,
  AlertTriangle,
  User,
  Phone,
  Clock,
  MapPin,
  FileText,
  Plus,
  Minus,
  Trash2,
  Barcode,
  ChevronDown,
} from 'lucide-react';

type TabMode = 'borrow' | 'return' | 'records' | 'inventory';

const STATUS_LABELS: Record<PropBorrowStatus, { label: string; className: string }> = {
  borrowed: { label: '借出中', className: 'bg-theater-burgundy-500/20 text-theater-burgundy-300 border-theater-burgundy-500/30' },
  returned: { label: '已归还', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  lost: { label: '已丢失', className: 'bg-red-500/20 text-red-300 border-red-500/30' },
  damaged: { label: '已损坏', className: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
};

export default function PropsLedgerPage() {
  const {
    props,
    propBorrowRecords,
    scenes,
    schedules,
    currentProductionId,
    currentScheduleId,
    addPropBorrowRecord,
    updatePropBorrowRecord,
    deletePropBorrowRecord,
    returnPropBorrowRecord,
    getPropAvailableQuantity,
    getPropBorrowedQuantity,
    checkPropBorrowConflict,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabMode>('borrow');
  const [scanInput, setScanInput] = useState('');
  const [selectedProp, setSelectedProp] = useState<Prop | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [borrower, setBorrower] = useState('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [selectedSceneId, setSelectedSceneId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<PropBorrowStatus | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const scanInputRef = useRef<HTMLInputElement>(null);

  const productionProps = useMemo(
    () => props.filter((p) => p.productionId === currentProductionId),
    [props, currentProductionId]
  );

  const productionScenes = useMemo(
    () => scenes.filter((s) => s.productionId === currentProductionId),
    [scenes, currentProductionId]
  );

  const currentScheduledScenes = useMemo(() => {
    const schedule = schedules.find((s) => s.id === currentScheduleId);
    if (!schedule) return [];
    return schedule.scheduledScenes;
  }, [schedules, currentScheduleId]);

  const productionRecords = useMemo(
    () =>
      propBorrowRecords
        .filter((r) => r.productionId === currentProductionId)
        .sort((a, b) => new Date(b.borrowTime).getTime() - new Date(a.borrowTime).getTime()),
    [propBorrowRecords, currentProductionId]
  );

  const filteredRecords = useMemo(() => {
    let result = productionRecords;
    if (filterStatus !== 'all') {
      result = result.filter((r) => r.status === filterStatus);
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter((r) => {
        const prop = props.find((p) => p.id === r.propId);
        return (
          r.borrower.toLowerCase().includes(kw) ||
          prop?.name.toLowerCase().includes(kw) ||
          prop?.barcode?.toLowerCase().includes(kw)
        );
      });
    }
    return result;
  }, [productionRecords, filterStatus, searchKeyword, props]);

  useEffect(() => {
    if (activeTab === 'borrow' || activeTab === 'return') {
      scanInputRef.current?.focus();
    }
  }, [activeTab]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleScan = () => {
    if (!scanInput.trim()) return;

    const found = productionProps.find(
      (p) =>
        p.barcode?.toLowerCase() === scanInput.trim().toLowerCase() ||
        p.name.toLowerCase() === scanInput.trim().toLowerCase() ||
        p.id === scanInput.trim()
    );

    if (found) {
      setSelectedProp(found);
      setQuantity(1);
      setScanInput('');
    } else {
      showToast('error', `未找到道具：${scanInput}`);
      setScanInput('');
    }
  };

  const handleBorrow = () => {
    if (!selectedProp || !currentProductionId) {
      showToast('error', '请先选择道具');
      return;
    }
    if (!borrower.trim()) {
      showToast('error', '请填写借用人');
      return;
    }
    if (quantity <= 0) {
      showToast('error', '借出数量必须大于0');
      return;
    }

    const scheduledSceneId = currentScheduledScenes.find(
      (ss) => ss.sceneId === selectedSceneId
    )?.id;

    const result = addPropBorrowRecord({
      propId: selectedProp.id,
      productionId: currentProductionId,
      sceneId: selectedSceneId || undefined,
      scheduledSceneId,
      borrower: borrower.trim(),
      borrowerContact: borrowerContact.trim() || undefined,
      quantity,
      borrowTime: new Date().toISOString(),
      status: 'borrowed',
      notes: notes.trim() || undefined,
    });

    if (result.success) {
      showToast('success', result.message);
      resetBorrowForm();
    } else {
      showToast('error', result.message);
    }
  };

  const handleReturn = (recordId: string, returnQty?: number) => {
    const result = returnPropBorrowRecord(recordId, returnQty);
    if (result.success) {
      showToast('success', result.message);
    } else {
      showToast('error', result.message);
    }
  };

  const resetBorrowForm = () => {
    setSelectedProp(null);
    setQuantity(1);
    setBorrower('');
    setBorrowerContact('');
    setSelectedSceneId('');
    setNotes('');
    scanInputRef.current?.focus();
  };

  const conflictInfo = useMemo(() => {
    if (!selectedProp) return null;
    return checkPropBorrowConflict(selectedProp.id, quantity, currentScheduledScenes.find((ss) => ss.sceneId === selectedSceneId)?.id);
  }, [selectedProp, quantity, selectedSceneId, currentScheduledScenes, checkPropBorrowConflict]);

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-900/90 border border-emerald-500/50 text-emerald-200'
              : 'bg-red-900/90 border border-red-500/50 text-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h2 className="section-title flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-theater-gold-400" />
          道具借还台账
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-theater-ink-600 overflow-x-auto">
        {[
          { id: 'borrow', label: '借出登记', icon: ArrowDownCircle },
          { id: 'return', label: '归还登记', icon: ArrowUpCircle },
          { id: 'records', label: '借还记录', icon: ClipboardList },
          { id: 'inventory', label: '实时库存', icon: Package },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabMode)}
            className={`px-4 py-2 -mb-px text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-theater-gold-400 border-b-2 border-theater-gold-500'
                : 'text-theater-ink-300 hover:text-theater-parchment-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 借出登记 */}
      {activeTab === 'borrow' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 扫码输入区 */}
          <div className="card space-y-4">
            <h3 className="font-serif font-semibold text-theater-parchment-100 flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-theater-gold-400" />
              扫码选择道具
            </h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theater-ink-400" />
                <input
                  ref={scanInputRef}
                  type="text"
                  className="input-field pl-10 font-mono"
                  placeholder="扫描条码或输入道具名称/编号"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                />
              </div>
              <button onClick={handleScan} className="btn-primary">
                确认
              </button>
            </div>

            {/* 道具快速选择 */}
            <div>
              <label className="input-label">或从列表选择</label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                {productionProps.map((prop) => {
                  const available = getPropAvailableQuantity(prop.id);
                  const isSelected = selectedProp?.id === prop.id;
                  return (
                    <button
                      key={prop.id}
                      onClick={() => {
                        setSelectedProp(prop);
                        setQuantity(1);
                      }}
                      className={`p-3 rounded-lg text-left transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-theater-gold-500/10 border border-theater-gold-500/50'
                          : 'bg-theater-ink-800/50 border border-theater-ink-600/50 hover:border-theater-ink-500'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded bg-theater-gold-500/10 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-theater-gold-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-theater-parchment-100 truncate">{prop.name}</p>
                          {prop.barcode && (
                            <p className="text-xs text-theater-ink-400 font-mono">{prop.barcode}</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-sm font-mono flex-shrink-0 ${available > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        可用 {available}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 借出登记表单 */}
          <div className="card space-y-4">
            <h3 className="font-serif font-semibold text-theater-parchment-100 flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-theater-burgundy-400" />
              借出信息
            </h3>

            {selectedProp ? (
              <div className="space-y-4">
                {/* 已选道具信息 */}
                <div className="p-4 rounded-lg bg-theater-gold-500/5 border border-theater-gold-500/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-serif font-semibold text-theater-gold-300">{selectedProp.name}</p>
                      {selectedProp.barcode && (
                        <p className="text-xs text-theater-ink-400 font-mono mt-1">
                          条码: {selectedProp.barcode}
                        </p>
                      )}
                      {selectedProp.location && (
                        <p className="text-xs text-theater-ink-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {selectedProp.location}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedProp(null)}
                      className="p-1 rounded hover:bg-theater-ink-600 text-theater-ink-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center text-sm">
                    <div className="p-2 rounded bg-theater-ink-800/50">
                      <p className="text-theater-ink-400 text-xs">总库存</p>
                      <p className="font-mono font-semibold text-theater-parchment-100">{selectedProp.totalQuantity}</p>
                    </div>
                    <div className="p-2 rounded bg-theater-ink-800/50">
                      <p className="text-theater-ink-400 text-xs">已借出</p>
                      <p className="font-mono font-semibold text-theater-burgundy-400">{getPropBorrowedQuantity(selectedProp.id)}</p>
                    </div>
                    <div className="p-2 rounded bg-theater-ink-800/50">
                      <p className="text-theater-ink-400 text-xs">可用</p>
                      <p className="font-mono font-semibold text-emerald-400">{getPropAvailableQuantity(selectedProp.id)}</p>
                    </div>
                  </div>
                </div>

                {/* 数量 */}
                <div>
                  <label className="input-label">借出数量</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-theater-ink-700 hover:bg-theater-ink-600 text-theater-parchment-100 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      className="input-field text-center font-mono text-xl flex-1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg bg-theater-ink-700 hover:bg-theater-ink-600 text-theater-parchment-100 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 冲突提示 */}
                {conflictInfo?.conflict && (
                  <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{conflictInfo.message}</p>
                  </div>
                )}

                {/* 借用人 */}
                <div>
                  <label className="input-label flex items-center gap-1">
                    <User className="w-3 h-3" /> 借用人 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="请输入借用人姓名"
                    value={borrower}
                    onChange={(e) => setBorrower(e.target.value)}
                  />
                </div>

                {/* 联系方式 */}
                <div>
                  <label className="input-label flex items-center gap-1">
                    <Phone className="w-3 h-3" /> 联系方式
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="手机号（选填）"
                    value={borrowerContact}
                    onChange={(e) => setBorrowerContact(e.target.value)}
                  />
                </div>

                {/* 使用场次 */}
                {productionScenes.length > 0 && (
                  <div>
                    <label className="input-label flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 使用场次
                    </label>
                    <div className="relative">
                      <select
                        className="input-field appearance-none pr-10"
                        value={selectedSceneId}
                        onChange={(e) => setSelectedSceneId(e.target.value)}
                      >
                        <option value="">-- 不指定场次 --</option>
                        {productionScenes.map((scene) => (
                          <option key={scene.id} value={scene.id}>
                            {scene.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theater-ink-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* 备注 */}
                <div>
                  <label className="input-label flex items-center gap-1">
                    <FileText className="w-3 h-3" /> 备注
                  </label>
                  <textarea
                    className="input-field min-h-[60px] resize-none"
                    placeholder="其他说明信息（选填）"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={resetBorrowForm} className="btn-ghost flex-1">
                    重置
                  </button>
                  <button
                    onClick={handleBorrow}
                    disabled={!!conflictInfo?.conflict}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    确认借出
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-theater-ink-400">
                <ScanLine className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p>请先扫码或从左侧选择道具</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 归还登记 */}
      {activeTab === 'return' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-serif font-semibold text-theater-parchment-100 flex items-center gap-2 mb-4">
              <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
              借出中道具（待归还）
            </h3>
            {productionRecords.filter((r) => r.status === 'borrowed').length === 0 ? (
              <div className="text-center py-12 text-theater-ink-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>当前没有借出中的道具</p>
              </div>
            ) : (
              <div className="space-y-2">
                {productionRecords
                  .filter((r) => r.status === 'borrowed')
                  .map((record) => {
                    const prop = props.find((p) => p.id === record.propId);
                    const scene = scenes.find((s) => s.id === record.sceneId);
                    return (
                      <div
                        key={record.id}
                        className="p-4 rounded-lg bg-theater-ink-800/50 border border-theater-ink-600/50 flex flex-wrap items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-theater-gold-500/10 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-theater-gold-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-theater-parchment-100">
                              {prop?.name || '未知道具'}
                              <span className="ml-2 text-sm font-mono text-theater-gold-400">×{record.quantity}</span>
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-theater-ink-400 mt-1">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" /> {record.borrower}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {formatDateTime(record.borrowTime)}
                              </span>
                              {scene && <span>场次: {scene.name}</span>}
                              {prop?.barcode && <span className="font-mono">{prop.barcode}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {record.quantity > 1 && (
                            <button
                              onClick={() => {
                                const qty = prompt(`部分归还，请输入归还数量（1-${record.quantity - 1}）`);
                                const n = parseInt(qty || '0');
                                if (n >= 1 && n < record.quantity) {
                                  handleReturn(record.id, n);
                                } else if (qty) {
                                  showToast('error', '数量无效');
                                }
                              }}
                              className="btn-secondary text-sm py-1.5 px-3"
                            >
                              部分归还
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`确认归还「${prop?.name}」×${record.quantity}？`)) {
                                handleReturn(record.id);
                              }
                            }}
                            className="btn-primary text-sm py-1.5 px-3"
                          >
                            <ArrowUpCircle className="w-4 h-4" />
                            全部归还
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 借还记录 */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {/* 筛选 */}
          <div className="card flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-theater-ink-400" />
              <span className="text-sm text-theater-ink-300">状态:</span>
              <div className="flex gap-1">
                {(['all', 'borrowed', 'returned', 'lost', 'damaged'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1 rounded text-sm transition-all ${
                      filterStatus === s
                        ? 'bg-theater-gold-500/20 text-theater-gold-300 border border-theater-gold-500/30'
                        : 'bg-theater-ink-700 text-theater-ink-300 hover:bg-theater-ink-600'
                    }`}
                  >
                    {s === 'all' ? '全部' : STATUS_LABELS[s].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theater-ink-400" />
              <input
                type="text"
                className="input-field pl-9"
                placeholder="搜索借用人、道具名称、条码..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
          </div>

          {/* 记录列表 */}
          <div className="card">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-theater-ink-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>暂无借还记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-theater-ink-600 text-theater-ink-300">
                      <th className="text-left py-3 px-2 font-medium">道具</th>
                      <th className="text-left py-3 px-2 font-medium">借用人</th>
                      <th className="text-left py-3 px-2 font-medium">数量</th>
                      <th className="text-left py-3 px-2 font-medium">借出时间</th>
                      <th className="text-left py-3 px-2 font-medium">归还时间</th>
                      <th className="text-left py-3 px-2 font-medium">场次</th>
                      <th className="text-left py-3 px-2 font-medium">状态</th>
                      <th className="text-right py-3 px-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => {
                      const prop = props.find((p) => p.id === record.propId);
                      const scene = scenes.find((s) => s.id === record.sceneId);
                      const status = STATUS_LABELS[record.status];
                      return (
                        <tr key={record.id} className="border-b border-theater-ink-700/50 hover:bg-theater-ink-800/30">
                          <td className="py-3 px-2">
                            <div>
                              <p className="text-theater-parchment-100">{prop?.name || '未知'}</p>
                              {prop?.barcode && (
                                <p className="text-xs font-mono text-theater-ink-400">{prop.barcode}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div>
                              <p className="text-theater-parchment-100">{record.borrower}</p>
                              {record.borrowerContact && (
                                <p className="text-xs text-theater-ink-400">{record.borrowerContact}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2 font-mono text-theater-gold-400">×{record.quantity}</td>
                          <td className="py-3 px-2 text-theater-ink-300 text-xs whitespace-nowrap">
                            {formatDateTime(record.borrowTime)}
                          </td>
                          <td className="py-3 px-2 text-theater-ink-300 text-xs whitespace-nowrap">
                            {record.actualReturnTime ? formatDateTime(record.actualReturnTime) : '-'}
                          </td>
                          <td className="py-3 px-2 text-theater-ink-300 text-xs">
                            {scene?.name || '-'}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded text-xs border ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            {record.status === 'borrowed' && (
                              <button
                                onClick={() => handleReturn(record.id)}
                                className="text-emerald-400 hover:text-emerald-300 text-xs mr-2"
                              >
                                归还
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm('确定删除此记录？')) {
                                  deletePropBorrowRecord(record.id);
                                  showToast('success', '已删除记录');
                                }
                              }}
                              className="text-theater-burgundy-400 hover:text-theater-burgundy-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 实时库存 */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productionProps.map((prop) => {
            const borrowed = getPropBorrowedQuantity(prop.id);
            const available = getPropAvailableQuantity(prop.id);
            const usageRate = prop.totalQuantity > 0 ? (borrowed / prop.totalQuantity) * 100 : 0;
            return (
              <div key={prop.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-theater-gold-500/10 flex items-center justify-center">
                      <Package className="w-6 h-6 text-theater-gold-400" />
                    </div>
                    <div>
                      <h4 className="font-serif font-semibold text-theater-parchment-100">{prop.name}</h4>
                      {prop.barcode && (
                        <p className="text-xs font-mono text-theater-ink-400">{prop.barcode}</p>
                      )}
                    </div>
                  </div>
                </div>

                {prop.description && (
                  <p className="text-xs text-theater-ink-400 mb-3">{prop.description}</p>
                )}

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="p-2 rounded bg-theater-ink-800/50 text-center">
                    <p className="text-xs text-theater-ink-400">总库存</p>
                    <p className="text-xl font-mono font-semibold text-theater-parchment-100">
                      {prop.totalQuantity}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-theater-ink-800/50 text-center">
                    <p className="text-xs text-theater-ink-400">借出</p>
                    <p className="text-xl font-mono font-semibold text-theater-burgundy-400">{borrowed}</p>
                  </div>
                  <div className="p-2 rounded bg-theater-ink-800/50 text-center">
                    <p className="text-xs text-theater-ink-400">可用</p>
                    <p className="text-xl font-mono font-semibold text-emerald-400">{available}</p>
                  </div>
                </div>

                {/* 使用率进度条 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-theater-ink-400">
                    <span>使用率</span>
                    <span>{usageRate.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-theater-ink-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usageRate >= 90
                          ? 'bg-red-500'
                          : usageRate >= 70
                          ? 'bg-orange-500'
                          : 'bg-theater-gold-500'
                      }`}
                      style={{ width: `${usageRate}%` }}
                    />
                  </div>
                </div>

                {prop.location && (
                  <div className="mt-3 pt-3 border-t border-theater-ink-700 flex items-center gap-1 text-xs text-theater-ink-400">
                    <MapPin className="w-3 h-3" />
                    {prop.location}
                  </div>
                )}
              </div>
            );
          })}

          {productionProps.length === 0 && (
            <div className="col-span-full text-center py-16 text-theater-ink-400">
              <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p>暂无道具数据</p>
              <p className="text-sm mt-1">请先在剧目管理中添加道具</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
