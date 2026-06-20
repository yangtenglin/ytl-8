import { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Plus,
  Edit2,
  Trash2,
  Theater,
  Users,
  Package,
  Clock,
  ArrowRight,
  X,
  Check,
  Link2,
} from 'lucide-react';
import { Scene, Role, Prop } from '../types';
import { useNavigate } from 'react-router-dom';

export default function ProductionsPage() {
  const navigate = useNavigate();
  const {
    productions,
    scenes,
    roles,
    props,
    currentProductionId,
    setCurrentProduction,
    addProduction,
    updateProduction,
    deleteProduction,
    addScene,
    updateScene,
    deleteScene,
    addRole,
    updateRole,
    deleteRole,
    addProp,
    updateProp,
    deleteProp,
  } = useAppStore();

  const [showProductionModal, setShowProductionModal] = useState(false);
  const [editingProduction, setEditingProduction] = useState<{
    id?: string;
    title: string;
    description: string;
  }>({ title: '', description: '' });

  const [activeTab, setActiveTab] = useState<'scenes' | 'roles' | 'props'>(
    'scenes'
  );
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [editingScene, setEditingScene] = useState<
    Partial<Scene> & { id?: string }
  >({
    name: '',
    durationMinutes: 45,
    sequence: 1,
    roleIds: [],
    propIds: [],
    dependsOnSceneIds: [],
  });

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<Role> & { id?: string }>({
    name: '',
    description: '',
  });

  const [showPropModal, setShowPropModal] = useState(false);
  const [editingProp, setEditingProp] = useState<Partial<Prop> & { id?: string }>({
    name: '',
    quantity: 1,
  });

  const currentProduction = useMemo(
    () => productions.find((p) => p.id === currentProductionId),
    [productions, currentProductionId]
  );

  const productionScenes = useMemo(
    () =>
      scenes
        .filter((s) => s.productionId === currentProductionId)
        .sort((a, b) => a.sequence - b.sequence),
    [scenes, currentProductionId]
  );

  const productionRoles = useMemo(
    () => roles.filter((r) => r.productionId === currentProductionId),
    [roles, currentProductionId]
  );

  const productionProps = useMemo(
    () => props.filter((p) => p.productionId === currentProductionId),
    [props, currentProductionId]
  );

  const handleSaveProduction = () => {
    if (!editingProduction.title.trim()) return;

    if (editingProduction.id) {
      updateProduction(editingProduction.id, {
        title: editingProduction.title,
        description: editingProduction.description,
      });
    } else {
      addProduction({
        title: editingProduction.title,
        description: editingProduction.description,
      });
    }
    setShowProductionModal(false);
    setEditingProduction({ title: '', description: '' });
  };

  const handleEditProduction = (production: typeof productions[0]) => {
    setEditingProduction({
      id: production.id,
      title: production.title,
      description: production.description,
    });
    setShowProductionModal(true);
  };

  const handleSaveScene = () => {
    if (!editingScene.name?.trim() || !currentProductionId) return;

    const sceneData = {
      productionId: currentProductionId,
      name: editingScene.name,
      durationMinutes: editingScene.durationMinutes || 45,
      sequence: editingScene.sequence || 1,
      roleIds: editingScene.roleIds || [],
      propIds: editingScene.propIds || [],
      dependsOnSceneIds: editingScene.dependsOnSceneIds || [],
    };

    if (editingScene.id) {
      updateScene(editingScene.id, sceneData);
    } else {
      addScene(sceneData);
    }
    setShowSceneModal(false);
    resetSceneForm();
  };

  const handleEditScene = (scene: Scene) => {
    setEditingScene({ ...scene });
    setShowSceneModal(true);
  };

  const resetSceneForm = () => {
    setEditingScene({
      name: '',
      durationMinutes: 45,
      sequence: productionScenes.length + 1,
      roleIds: [],
      propIds: [],
      dependsOnSceneIds: [],
    });
  };

  const handleSaveRole = () => {
    if (!editingRole.name?.trim() || !currentProductionId) return;

    const roleData = {
      productionId: currentProductionId,
      name: editingRole.name,
      description: editingRole.description || '',
    };

    if (editingRole.id) {
      updateRole(editingRole.id, roleData);
    } else {
      addRole(roleData);
    }
    setShowRoleModal(false);
    setEditingRole({ name: '', description: '' });
  };

  const handleEditRole = (role: Role) => {
    setEditingRole({ ...role });
    setShowRoleModal(true);
  };

  const handleSaveProp = () => {
    if (!editingProp.name?.trim() || !currentProductionId) return;

    const propData = {
      productionId: currentProductionId,
      name: editingProp.name,
      quantity: editingProp.quantity || 1,
    };

    if (editingProp.id) {
      updateProp(editingProp.id, propData);
    } else {
      addProp(propData);
    }
    setShowPropModal(false);
    setEditingProp({ name: '', quantity: 1 });
  };

  const handleEditProp = (prop: Prop) => {
    setEditingProp({ ...prop });
    setShowPropModal(true);
  };

  const toggleArrayItem = <T,>(arr: T[], item: T): T[] => {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gradient-gold">
            剧目管理
          </h2>
          <p className="text-theater-ink-300">
            管理剧目、场次、角色和道具
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduction({ title: '', description: '' });
            setShowProductionModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增剧目
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <h3 className="section-title">剧目列表</h3>
          <div className="space-y-3">
            {productions.map((production) => (
              <div
                key={production.id}
                onClick={() => setCurrentProduction(production.id)}
                className={`card-hoverable p-4 ${
                  currentProductionId === production.id
                    ? 'border-theater-gold-500/50 bg-theater-gold-500/5'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Theater className="w-4 h-4 text-theater-gold-400 flex-shrink-0" />
                      <h4 className="font-serif font-semibold text-theater-parchment-100 truncate">
                        {production.title}
                      </h4>
                    </div>
                    <p className="text-xs text-theater-ink-400 mt-1 line-clamp-2">
                      {production.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-theater-ink-300">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {
                          scenes.filter((s) => s.productionId === production.id)
                            .length
                        }{' '}
                        场
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {
                          roles.filter((r) => r.productionId === production.id)
                            .length
                        }{' '}
                        角色
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProduction(production);
                      }}
                      className="p-1.5 rounded hover:bg-theater-ink-600 text-theater-ink-300 hover:text-theater-parchment-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(`确定要删除剧目「${production.title}」吗？`)
                        ) {
                          deleteProduction(production.id);
                        }
                      }}
                      className="p-1.5 rounded hover:bg-theater-burgundy-500/30 text-theater-ink-300 hover:text-theater-burgundy-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {productions.length === 0 && (
              <div className="text-center py-8 text-theater-ink-400">
                <Theater className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无剧目</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {currentProduction ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title mb-0">
                  {currentProduction.title}
                </h3>
                <button
                  onClick={() => navigate('/scheduler')}
                  className="btn-secondary flex items-center gap-2 text-sm py-1.5 px-3"
                >
                  前往排期
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 mb-6 border-b border-theater-ink-600">
                {[
                  { id: 'scenes', label: '场次', icon: Clock },
                  { id: 'roles', label: '角色', icon: Users },
                  { id: 'props', label: '道具', icon: Package },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 -mb-px text-sm font-medium transition-all flex items-center gap-2 ${
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

              {activeTab === 'scenes' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-theater-ink-300">
                      共 {productionScenes.length} 场
                    </p>
                    <button
                      onClick={() => {
                        resetSceneForm();
                        setShowSceneModal(true);
                      }}
                      className="btn-secondary flex items-center gap-2 text-sm py-1.5 px-3"
                    >
                      <Plus className="w-4 h-4" />
                      添加场次
                    </button>
                  </div>

                  <div className="space-y-3">
                    {productionScenes.map((scene, index) => (
                      <div
                        key={scene.id}
                        className="card p-4 hover:border-theater-burgundy-500/30 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-theater-burgundy-700 flex items-center justify-center font-serif font-bold text-theater-gold-300">
                                {scene.sequence}
                              </span>
                              <div>
                                <h4 className="font-serif font-semibold text-theater-parchment-100">
                                  {scene.name}
                                </h4>
                                <div className="flex items-center gap-4 mt-1 text-xs text-theater-ink-300">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {scene.durationMinutes} 分钟
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {scene.roleIds.length} 角色
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    {scene.propIds.length} 道具
                                  </span>
                                  {scene.dependsOnSceneIds.length > 0 && (
                                    <span className="flex items-center gap-1 text-theater-gold-400">
                                      <Link2 className="w-3 h-3" />
                                      依赖 {scene.dependsOnSceneIds.length} 场
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {(scene.roleIds.length > 0 ||
                              scene.propIds.length > 0) && (
                              <div className="flex flex-wrap gap-2 mt-3 ml-11">
                                {scene.roleIds.map((rid) => {
                                  const role = productionRoles.find(
                                    (r) => r.id === rid
                                  );
                                  return role ? (
                                    <span
                                      key={rid}
                                      className="px-2 py-0.5 text-xs rounded bg-theater-burgundy-500/20 text-theater-burgundy-300 border border-theater-burgundy-500/30"
                                    >
                                      {role.name}
                                    </span>
                                  ) : null;
                                })}
                                {scene.propIds.map((pid) => {
                                  const prop = productionProps.find(
                                    (p) => p.id === pid
                                  );
                                  return prop ? (
                                    <span
                                      key={pid}
                                      className="px-2 py-0.5 text-xs rounded bg-theater-gold-500/20 text-theater-gold-300 border border-theater-gold-500/30"
                                    >
                                      {prop.name}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditScene(scene)}
                              className="p-2 rounded hover:bg-theater-ink-600 text-theater-ink-300 hover:text-theater-parchment-100"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `确定要删除场次「${scene.name}」吗？`
                                  )
                                ) {
                                  deleteScene(scene.id);
                                }
                              }}
                              className="p-2 rounded hover:bg-theater-burgundy-500/30 text-theater-ink-300 hover:text-theater-burgundy-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {productionScenes.length === 0 && (
                      <div className="text-center py-12 text-theater-ink-400">
                        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>暂未添加场次</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'roles' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-theater-ink-300">
                      共 {productionRoles.length} 个角色
                    </p>
                    <button
                      onClick={() => {
                        setEditingRole({ name: '', description: '' });
                        setShowRoleModal(true);
                      }}
                      className="btn-secondary flex items-center gap-2 text-sm py-1.5 px-3"
                    >
                      <Plus className="w-4 h-4" />
                      添加角色
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {productionRoles.map((role) => (
                      <div
                        key={role.id}
                        className="card p-4 flex items-start justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-theater-burgundy-400" />
                            <h4 className="font-serif font-semibold text-theater-parchment-100">
                              {role.name}
                            </h4>
                          </div>
                          {role.description && (
                            <p className="text-sm text-theater-ink-400 mt-1 ml-6">
                              {role.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="p-1.5 rounded hover:bg-theater-ink-600 text-theater-ink-300"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(`确定要删除角色「${role.name}」吗？`)
                              ) {
                                deleteRole(role.id);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-theater-burgundy-500/30 text-theater-ink-300 hover:text-theater-burgundy-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {productionRoles.length === 0 && (
                      <div className="col-span-2 text-center py-12 text-theater-ink-400">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>暂未添加角色</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'props' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-theater-ink-300">
                      共 {productionProps.length} 种道具
                    </p>
                    <button
                      onClick={() => {
                        setEditingProp({ name: '', quantity: 1 });
                        setShowPropModal(true);
                      }}
                      className="btn-secondary flex items-center gap-2 text-sm py-1.5 px-3"
                    >
                      <Plus className="w-4 h-4" />
                      添加道具
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {productionProps.map((prop) => (
                      <div
                        key={prop.id}
                        className="card p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-theater-gold-500/10 flex items-center justify-center">
                            <Package className="w-5 h-5 text-theater-gold-400" />
                          </div>
                          <div>
                            <h4 className="font-serif font-medium text-theater-parchment-100">
                              {prop.name}
                            </h4>
                            <p className="text-xs text-theater-ink-400">
                              数量: {prop.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditProp(prop)}
                            className="p-1.5 rounded hover:bg-theater-ink-600 text-theater-ink-300"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(`确定要删除道具「${prop.name}」吗？`)
                              ) {
                                deleteProp(prop.id);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-theater-burgundy-500/30 text-theater-ink-300 hover:text-theater-burgundy-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {productionProps.length === 0 && (
                      <div className="col-span-full text-center py-12 text-theater-ink-400">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>暂未添加道具</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <Theater className="w-16 h-16 mx-auto mb-4 text-theater-ink-400" />
              <h3 className="text-xl font-serif font-semibold text-theater-parchment-200 mb-2">
                选择或创建剧目
              </h3>
              <p className="text-theater-ink-400">
                从左侧列表选择一个剧目，或创建新的剧目开始管理
              </p>
            </div>
          )}
        </div>
      </div>

      {showProductionModal && (
        <Modal
          title={editingProduction.id ? '编辑剧目' : '新增剧目'}
          onClose={() => setShowProductionModal(false)}
          onSave={handleSaveProduction}
        >
          <div className="space-y-4">
            <div>
              <label className="input-label">剧目名称</label>
              <input
                type="text"
                className="input-field"
                placeholder="例如：雷雨"
                value={editingProduction.title}
                onChange={(e) =>
                  setEditingProduction({
                    ...editingProduction,
                    title: e.target.value,
                  })
                }
                autoFocus
              />
            </div>
            <div>
              <label className="input-label">剧目描述</label>
              <textarea
                className="input-field min-h-[100px] resize-none"
                placeholder="简要描述剧目内容"
                value={editingProduction.description}
                onChange={(e) =>
                  setEditingProduction({
                    ...editingProduction,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </Modal>
      )}

      {showSceneModal && (
        <Modal
          title={editingScene.id ? '编辑场次' : '添加场次'}
          onClose={() => setShowSceneModal(false)}
          onSave={handleSaveScene}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">场次名称</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="例如：第一幕"
                  value={editingScene.name || ''}
                  onChange={(e) =>
                    setEditingScene({
                      ...editingScene,
                      name: e.target.value,
                    })
                  }
                  autoFocus
                />
              </div>
              <div>
                <label className="input-label">序号</label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={editingScene.sequence || 1}
                  onChange={(e) =>
                    setEditingScene({
                      ...editingScene,
                      sequence: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <label className="input-label">时长（分钟）</label>
              <input
                type="number"
                min="15"
                step="15"
                className="input-field"
                value={editingScene.durationMinutes || 45}
                onChange={(e) =>
                  setEditingScene({
                    ...editingScene,
                    durationMinutes: parseInt(e.target.value) || 45,
                  })
                }
              />
            </div>
            <div>
              <label className="input-label">所需角色</label>
              <div className="flex flex-wrap gap-2">
                {productionRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() =>
                      setEditingScene({
                        ...editingScene,
                        roleIds: toggleArrayItem(
                          editingScene.roleIds || [],
                          role.id
                        ),
                      })
                    }
                    className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 transition-all ${
                      editingScene.roleIds?.includes(role.id)
                        ? 'bg-theater-burgundy-600 text-theater-parchment-100'
                        : 'bg-theater-ink-700 text-theater-ink-300 hover:bg-theater-ink-600'
                    }`}
                  >
                    {editingScene.roleIds?.includes(role.id) && (
                      <Check className="w-3 h-3" />
                    )}
                    {role.name}
                  </button>
                ))}
                {productionRoles.length === 0 && (
                  <span className="text-sm text-theater-ink-400">
                    请先添加角色
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="input-label">所需道具</label>
              <div className="flex flex-wrap gap-2">
                {productionProps.map((prop) => (
                  <button
                    key={prop.id}
                    type="button"
                    onClick={() =>
                      setEditingScene({
                        ...editingScene,
                        propIds: toggleArrayItem(
                          editingScene.propIds || [],
                          prop.id
                        ),
                      })
                    }
                    className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 transition-all ${
                      editingScene.propIds?.includes(prop.id)
                        ? 'bg-theater-gold-600 text-theater-ink-900'
                        : 'bg-theater-ink-700 text-theater-ink-300 hover:bg-theater-ink-600'
                    }`}
                  >
                    {editingScene.propIds?.includes(prop.id) && (
                      <Check className="w-3 h-3" />
                    )}
                    {prop.name}
                  </button>
                ))}
                {productionProps.length === 0 && (
                  <span className="text-sm text-theater-ink-400">
                    请先添加道具
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="input-label">前置依赖场次</label>
              <div className="flex flex-wrap gap-2">
                {productionScenes
                  .filter((s) => s.id !== editingScene.id)
                  .map((scene) => (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() =>
                        setEditingScene({
                          ...editingScene,
                          dependsOnSceneIds: toggleArrayItem(
                            editingScene.dependsOnSceneIds || [],
                            scene.id
                          ),
                        })
                      }
                      className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 transition-all ${
                        editingScene.dependsOnSceneIds?.includes(scene.id)
                          ? 'bg-theater-forest-700 text-theater-parchment-100'
                          : 'bg-theater-ink-700 text-theater-ink-300 hover:bg-theater-ink-600'
                      }`}
                    >
                      {editingScene.dependsOnSceneIds?.includes(scene.id) && (
                        <Check className="w-3 h-3" />
                      )}
                      {scene.name}
                    </button>
                  ))}
                {productionScenes.filter((s) => s.id !== editingScene.id)
                  .length === 0 && (
                  <span className="text-sm text-theater-ink-400">
                    暂无可依赖的场次
                  </span>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showRoleModal && (
        <Modal
          title={editingRole.id ? '编辑角色' : '添加角色'}
          onClose={() => setShowRoleModal(false)}
          onSave={handleSaveRole}
        >
          <div className="space-y-4">
            <div>
              <label className="input-label">角色名称</label>
              <input
                type="text"
                className="input-field"
                placeholder="例如：周朴园"
                value={editingRole.name || ''}
                onChange={(e) =>
                  setEditingRole({ ...editingRole, name: e.target.value })
                }
                autoFocus
              />
            </div>
            <div>
              <label className="input-label">角色描述</label>
              <textarea
                className="input-field min-h-[80px] resize-none"
                placeholder="角色简介、性格特点等"
                value={editingRole.description || ''}
                onChange={(e) =>
                  setEditingRole({
                    ...editingRole,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </Modal>
      )}

      {showPropModal && (
        <Modal
          title={editingProp.id ? '编辑道具' : '添加道具'}
          onClose={() => setShowPropModal(false)}
          onSave={handleSaveProp}
        >
          <div className="space-y-4">
            <div>
              <label className="input-label">道具名称</label>
              <input
                type="text"
                className="input-field"
                placeholder="例如：真皮沙发"
                value={editingProp.name || ''}
                onChange={(e) =>
                  setEditingProp({ ...editingProp, name: e.target.value })
                }
                autoFocus
              />
            </div>
            <div>
              <label className="input-label">数量</label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={editingProp.quantity || 1}
                onChange={(e) =>
                  setEditingProp({
                    ...editingProp,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
  onSave,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-serif font-semibold text-theater-parchment-100">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-theater-ink-600 text-theater-ink-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1">
            取消
          </button>
          <button onClick={onSave} className="btn-primary flex-1">
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
