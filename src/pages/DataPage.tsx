import { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Database,
  FileJson,
  AlertTriangle,
  CheckCircle,
  X,
  Theater,
  Users,
  Calendar,
  Package,
  Mask,
  Clock,
  Home,
} from 'lucide-react';

export default function DataPage() {
  const {
    productions,
    scenes,
    roles,
    props,
    actors,
    availability,
    rooms,
    schedules,
    exportData,
    importData,
    resetToSampleData,
    clearAllData,
  } = useAppStore();

  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = [
    { label: '剧目', value: productions.length, icon: Theater, color: 'text-theater-burgundy-400' },
    { label: '场次', value: scenes.length, icon: Clock, color: 'text-theater-gold-400' },
    { label: '角色', value: roles.length, icon: Mask, color: 'text-emerald-400' },
    { label: '道具', value: props.length, icon: Package, color: 'text-blue-400' },
    { label: '演员', value: actors.length, icon: Users, color: 'text-purple-400' },
    { label: '档期', value: availability.length, icon: Calendar, color: 'text-orange-400' },
    { label: '排练室', value: rooms.length, icon: Home, color: 'text-pink-400' },
    { label: '排期方案', value: schedules.length, icon: Database, color: 'text-cyan-400' },
  ];

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `排练协调数据_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        if (!data.productions || !Array.isArray(data.productions)) {
          throw new Error('数据格式错误：缺少 productions 字段');
        }

        if (!confirm('导入将覆盖当前所有数据，确定继续吗？')) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        importData(data);
        setImportStatus({
          type: 'success',
          message: `成功导入 ${data.productions?.length || 0} 个剧目、${data.actors?.length || 0} 名演员的数据`,
        });
        setTimeout(() => setImportStatus({ type: null, message: '' }), 5000);
      } catch (err) {
        setImportStatus({
          type: 'error',
          message: err instanceof Error ? err.message : '导入失败：文件格式不正确',
        });
        setTimeout(() => setImportStatus({ type: null, message: '' }), 5000);
      }
    };
    reader.onerror = () => {
      setImportStatus({
        type: 'error',
        message: '文件读取失败',
      });
      setTimeout(() => setImportStatus({ type: null, message: '' }), 5000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    if (!confirm('确定要重置为示例数据吗？当前所有数据将被覆盖。')) return;
    resetToSampleData();
    setImportStatus({
      type: 'success',
      message: '已重置为示例数据',
    });
    setTimeout(() => setImportStatus({ type: null, message: '' }), 3000);
  };

  const handleClear = () => {
    if (!confirm('确定要清空所有数据吗？此操作不可撤销！')) return;
    if (!confirm('再次确认：真的要清空所有数据吗？')) return;
    clearAllData();
    setImportStatus({
      type: 'success',
      message: '已清空所有数据',
    });
    setTimeout(() => setImportStatus({ type: null, message: '' }), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="section-title flex items-center gap-2">
          <Database className="w-6 h-6 text-theater-gold-400" />
          数据管理
        </h2>
      </div>

      {/* 状态提示 */}
      {importStatus.type && (
        <div
          className={`mb-6 p-4 rounded-lg border flex items-center gap-3 animate-fade-in ${
            importStatus.type === 'success'
              ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-200'
              : 'bg-red-900/30 border-red-500/50 text-red-200'
          }`}
        >
          {importStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{importStatus.message}</span>
          <button
            onClick={() => setImportStatus({ type: null, message: '' })}
            className="ml-auto p-1 rounded hover:bg-black/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 数据统计 */}
      <div className="card mb-8">
        <h3 className="text-lg font-serif font-semibold text-theater-parchment-100 mb-4">
          当前数据统计
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-lg bg-theater-ink-800/50 border border-theater-ink-600/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-sm text-theater-ink-300">{stat.label}</span>
              </div>
              <p className="text-2xl font-serif font-semibold text-theater-parchment-100">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 操作卡片 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 导出 */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif font-semibold text-theater-parchment-100 mb-1">
                导出数据
              </h3>
              <p className="text-sm text-theater-ink-300 mb-4">
                将所有数据导出为 JSON 文件备份，可用于数据迁移或分享。
              </p>
              <button
                onClick={handleExport}
                className="btn-primary flex items-center gap-2"
              >
                <FileJson className="w-4 h-4" />
                导出 JSON 文件
              </button>
            </div>
          </div>
        </div>

        {/* 导入 */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif font-semibold text-theater-parchment-100 mb-1">
                导入数据
              </h3>
              <p className="text-sm text-theater-ink-300 mb-4">
                从 JSON 文件导入数据，将覆盖当前所有数据。
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={handleImportClick}
                className="btn-secondary flex items-center gap-2"
              >
                <FileJson className="w-4 h-4" />
                选择 JSON 文件
              </button>
            </div>
          </div>
        </div>

        {/* 重置示例数据 */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-theater-burgundy-600 to-theater-burgundy-800 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-6 h-6 text-theater-gold-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif font-semibold text-theater-parchment-100 mb-1">
                重置为示例数据
              </h3>
              <p className="text-sm text-theater-ink-300 mb-4">
                恢复为内置的《雷雨》示例数据，包含完整的剧目、演员和档期配置。
              </p>
              <button
                onClick={handleReset}
                className="btn-secondary flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重置示例数据
              </button>
            </div>
          </div>
        </div>

        {/* 清空数据 */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-6 h-6 text-red-200" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif font-semibold text-theater-parchment-100 mb-1">
                清空所有数据
              </h3>
              <p className="text-sm text-theater-ink-300 mb-4">
                删除所有剧目、演员、排期等数据，此操作不可撤销。
              </p>
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-lg border border-red-500/50 bg-red-900/30 text-red-300 hover:bg-red-900/50 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                清空全部数据
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 说明 */}
      <div className="card mt-8 bg-theater-ink-800/30">
        <h3 className="font-serif font-semibold text-theater-parchment-100 mb-3">
          数据说明
        </h3>
        <div className="space-y-2 text-sm text-theater-ink-300">
          <p>• 所有数据自动保存在浏览器本地存储（localStorage）中</p>
          <p>• 导出的 JSON 文件包含完整的数据结构，可在其他设备导入</p>
          <p>• 建议定期导出数据进行备份，防止浏览器缓存丢失</p>
          <p>• 排期引擎使用的是回溯启发式算法，会根据演员档期和冲突规则自动生成多组候选方案</p>
        </div>
      </div>
    </div>
  );
}
