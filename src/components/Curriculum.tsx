import React, { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, doc, setDoc, updateDoc, handleFirestoreError } from '../lib/firebase';
import { Curriculum, CurriculumContent, CategoryType, PeriodBimester, ClubUser, OperationType } from '../types';
import { useFirebase } from './FirebaseProvider';
import { BookOpen, UserPlus, X, Plus, ChevronRight, GraduationCap, Users, Settings, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const CATEGORIES: CategoryType[] = ['Cebollitas', 'Premini', 'Mini', 'U13 Blanco', 'U13 Azul'];
const BIMESTERS: PeriodBimester[] = ['Marzo/Abril', 'Mayo/Junio', 'Julio', 'Agosto/Septiembre', 'Octubre/Noviembre'];

const CurriculumManager: React.FC = () => {
  const { user, isAdmin } = useFirebase();
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [users, setUsers] = useState<ClubUser[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(CATEGORIES[0]);
  const [selectedBimester, setSelectedBimester] = useState<PeriodBimester>(BIMESTERS[0]);
  
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [editingContent, setEditingContent] = useState<CurriculumContent | null>(null);
  
  const [contentTitle, setContentTitle] = useState('');
  const [contentDesc, setContentDesc] = useState('');
  const [assignedTeachers, setAssignedTeachers] = useState<string[]>([]);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [manualStaffName, setManualStaffName] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsubCurriculum = onSnapshot(collection(db, 'curriculum'), (snapshot) => {
      setCurriculums(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Curriculum)));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => d.data() as ClubUser));
    });
    return () => { unsubCurriculum(); unsubUsers(); };
  }, [user]);

  const currentCurriculum = curriculums.find(c => c.category === selectedCategory && c.bimester === selectedBimester);
  
  // Professors assigned to the category (shared across all bimesters for that category)
  // We can derive this from any curriculum of the same category, or keep a separate "CategorySettings" doc.
  // For simplicity, let's keep it in the curriculum doc for that category+bimester.
  const categoryProfessors = currentCurriculum?.categoryProfessors || [];
  const manualStaff = currentCurriculum?.manualStaff || [];

  const getDocId = (cat: string, bim: string) => `${cat}-${bim}`.replace(/\//g, '-');

  const updateCategoryProfessors = async (profId: string, action: 'add' | 'remove') => {
    if (!isAdmin) return;
    const id = getDocId(selectedCategory, selectedBimester);
    const currProfs = categoryProfessors;
    const newProfs = action === 'add' 
      ? [...new Set([...currProfs, profId])]
      : currProfs.filter(id => id !== profId);

    try {
      if (!currentCurriculum) {
        await setDoc(doc(db, 'curriculum', id), {
          category: selectedCategory,
          bimester: selectedBimester,
          contents: [],
          categoryProfessors: newProfs,
          manualStaff: manualStaff,
          updatedAt: new Date().toISOString()
        });
      } else {
        await updateDoc(doc(db, 'curriculum', id), {
          categoryProfessors: newProfs,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `curriculum/${id}`);
    }
  };

  const updateManualStaff = async (name: string, action: 'add' | 'remove') => {
    if (!isAdmin || (action === 'add' && !name.trim())) return;
    const id = getDocId(selectedCategory, selectedBimester);
    const currManual = manualStaff;
    const newManual = action === 'add' 
      ? [...new Set([...currManual, name.trim()])]
      : currManual.filter(n => n !== name);

    try {
      if (!currentCurriculum) {
        await setDoc(doc(db, 'curriculum', id), {
          category: selectedCategory,
          bimester: selectedBimester,
          contents: [],
          categoryProfessors: categoryProfessors,
          manualStaff: newManual,
          updatedAt: new Date().toISOString()
        });
      } else {
        await updateDoc(doc(db, 'curriculum', id), {
          manualStaff: newManual,
          updatedAt: new Date().toISOString()
        });
      }
      if (action === 'add') setManualStaffName('');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `curriculum/${id}`);
    }
  };

  const handleSaveContent = async () => {
    if (!isAdmin || !contentTitle.trim()) return;
    const id = getDocId(selectedCategory, selectedBimester);
    
    let newContents: CurriculumContent[] = [];
    
    if (editingContent) {
      newContents = currentCurriculum?.contents.map(c => 
        c.id === editingContent.id 
          ? { ...c, title: contentTitle.trim(), description: contentDesc.trim(), assignedTeachers: assignedTeachers }
          : c
      ) || [];
    } else {
      const newContent: CurriculumContent = {
        id: crypto.randomUUID(),
        title: contentTitle.trim(),
        description: contentDesc.trim(),
        assignedTeachers: assignedTeachers,
        createdAt: new Date().toISOString()
      };
      newContents = [...(currentCurriculum?.contents || []), newContent];
    }

    try {
      if (!currentCurriculum) {
        await setDoc(doc(db, 'curriculum', id), {
          category: selectedCategory,
          bimester: selectedBimester,
          contents: newContents,
          categoryProfessors: [],
          updatedAt: new Date().toISOString()
        });
      } else {
        await updateDoc(doc(db, 'curriculum', id), {
          contents: newContents,
          updatedAt: new Date().toISOString()
        });
      }
      setIsAddingContent(false);
      setEditingContent(null);
      setContentTitle('');
      setContentDesc('');
      setAssignedTeachers([]);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `curriculum/${id}`);
    }
  };

  const openAddModal = () => {
    setEditingContent(null);
    setContentTitle('');
    setContentDesc('');
    setAssignedTeachers([]);
    setIsAddingContent(true);
  };

  const openEditModal = (content: CurriculumContent) => {
    setEditingContent(content);
    setContentTitle(content.title);
    setContentDesc(content.description || '');
    setAssignedTeachers(content.assignedTeachers);
    setIsAddingContent(true);
  };

  const removeContent = async (contentId: string) => {
    if (!isAdmin || !currentCurriculum) return;
    const id = getDocId(selectedCategory, selectedBimester);
    try {
      await updateDoc(doc(db, 'curriculum', id), {
        contents: currentCurriculum.contents.filter(c => c.id !== contentId),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `curriculum/${id}`);
    }
  };

  const toggleContentGiven = async (contentId: string) => {
    if (!user || !currentCurriculum) return;
    const isCoachOrAdmin = isAdmin || users.find(u => u.uid === user.uid)?.role === 'coach';
    if (!isCoachOrAdmin) return;

    const id = getDocId(selectedCategory, selectedBimester);
    const newContents = currentCurriculum.contents.map(c => 
      c.id === contentId ? { ...c, isGiven: !c.isGiven } : c
    );

    try {
      await updateDoc(doc(db, 'curriculum', id), {
        contents: newContents,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `curriculum/${id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-[10px] font-black uppercase text-orange-500 tracking-widest mb-1 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Planificación Académica
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase italic">Contenidos</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  selectedCategory === cat 
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-8 overflow-x-auto pb-2 scrollbar-hide">
          {BIMESTERS.map(bim => (
            <button
              key={bim}
              onClick={() => setSelectedBimester(bim)}
              className={cn(
                "px-6 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border",
                selectedBimester === bim 
                  ? "bg-orange-50 border-orange-100 text-orange-600 shadow-sm" 
                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
              )}
            >
              {bim}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Contents */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 uppercase italic flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-orange-500" />
              Contenidos Técnicos
            </h3>
            {isAdmin && (
              <button 
                onClick={openAddModal}
                className="p-3 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-900/20 hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {!currentCurriculum || currentCurriculum.contents.length === 0 ? (
              <div className="bg-white/50 border border-dashed border-slate-200 rounded-[2rem] p-12 text-center text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="text-sm font-bold uppercase tracking-widest">No hay contenidos definidos para este periodo</p>
              </div>
            ) : (
              currentCurriculum.contents.map(content => {
                const isAssignedToMe = content.assignedTeachers.includes(user?.uid || '');
                return (
                  <motion.div
                    layout
                    key={content.id}
                    className={cn(
                      "bg-white p-6 rounded-[2rem] border transition-all shadow-sm group",
                      isAssignedToMe ? "border-orange-500 ring-4 ring-orange-500/5" : "border-slate-100 hover:border-orange-200",
                      content.isGiven && "bg-slate-50/50 grayscale-[0.5] opacity-80"
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <h4 className={cn(
                            "text-lg font-black text-slate-800 uppercase tracking-tight",
                            content.isGiven && "line-through text-slate-400"
                          )}>
                            {content.title}
                          </h4>
                          {isAssignedToMe && (
                            <span className="bg-orange-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Tu Tarea</span>
                          )}
                        </div>

                        {/* Explicit Toggle Button */}
                        <button
                          onClick={() => toggleContentGiven(content.id)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border w-fit",
                            content.isGiven 
                              ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-900/10" 
                              : "bg-slate-50 border-slate-100 text-slate-400 hover:border-orange-200 hover:text-orange-600 hover:bg-white"
                          )}
                        >
                          {content.isGiven ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />}
                          {content.isGiven ? 'Contenido Dado' : 'Marcar como Dado'}
                        </button>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => openEditModal(content)}
                            className="p-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => removeContent(content.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {content.description && <p className="text-sm text-slate-500 mb-4">{content.description}</p>}
                    
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mr-2 flex items-center h-8">Profesores:</div>
                    {content.assignedTeachers.length === 0 ? (
                      <span className="text-[10px] text-slate-400 italic flex items-center h-8">Sin asignar</span>
                    ) : (
                      content.assignedTeachers.map(teacherRef => {
                        const teacher = users.find(u => u.uid === teacherRef);
                        const isManual = !teacher;
                        return (
                          <div key={teacherRef} className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold",
                              isManual ? "bg-slate-100 text-slate-500" : "bg-orange-100 text-orange-600"
                            )}>
                              {isManual ? teacherRef[0] : (teacher?.displayName?.[0] || '?')}
                            </div>
                            <span className="text-[10px] font-bold text-slate-600">{isManual ? teacherRef : (teacher?.displayName || 'Desconocido')}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

        {/* Right Column: Category Professors */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase italic leading-none">Staff Técnico</h3>
                  <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-1">Categoría: {selectedCategory}</p>
                </div>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => setIsAddingStaff(!isAddingStaff)}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    isAddingStaff ? "bg-orange-600 text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                  )}
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              )}
            </div>

            <AnimatePresence>
              {isAddingStaff && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-slate-50 pb-6 mb-6"
                >
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Añadir Staff a la Categoría</h4>
                  
                  {/* Manual Name Input */}
                  <div className="flex gap-2 mb-4">
                    <input 
                      value={manualStaffName}
                      onChange={e => setManualStaffName(e.target.value)}
                      placeholder="Nombre del entrenador..."
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      onKeyDown={e => e.key === 'Enter' && updateManualStaff(manualStaffName, 'add')}
                    />
                    <button 
                      onClick={() => updateManualStaff(manualStaffName, 'add')}
                      disabled={!manualStaffName.trim()}
                      className="bg-slate-900 text-white px-4 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      Añadir
                    </button>
                  </div>

                  <div className="space-y-1 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                    {users
                      .filter(u => u.role === 'admin' || u.role === 'coach')
                      .filter(u => !categoryProfessors.includes(u.uid))
                      .map(u => (
                      <button 
                        key={u.uid}
                        onClick={() => updateCategoryProfessors(u.uid, 'add')}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                            {u.displayName?.[0]}
                          </div>
                          <span className="text-xs font-semibold text-slate-600">{u.displayName}</span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-500" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3 mb-8">
              {categoryProfessors.length === 0 && manualStaff.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No hay profesores asignados a la categoría.</p>
              ) : (
                <>
                  {categoryProfessors.map(profId => {
                    const prof = users.find(u => u.uid === profId);
                    return (
                      <div key={profId} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center font-bold text-slate-400 text-xs text-orange-600">
                            {prof?.displayName?.[0] || '?'}
                          </div>
                          <span className="text-sm font-bold text-slate-700">{prof?.displayName || 'Coach'}</span>
                        </div>
                        {isAdmin && (
                          <button 
                            onClick={() => updateCategoryProfessors(profId, 'remove')}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {manualStaff.map(name => (
                    <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center font-bold text-slate-400 text-xs">
                          {name[0]}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{name}</span>
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={() => updateManualStaff(name, 'remove')}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>

            {isAdmin && (
              <div className="border-t border-slate-50 pt-6">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Referenciar Staff</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                  {users
                    .filter(u => u.role === 'admin' || u.role === 'coach')
                    .filter(u => !categoryProfessors.includes(u.uid))
                    .map(u => (
                    <button 
                      key={u.uid}
                      onClick={() => updateCategoryProfessors(u.uid, 'add')}
                      className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl text-left transition-colors"
                    >
                      <span className="text-xs font-semibold text-slate-600">{u.displayName}</span>
                      <Plus className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add/Edit Content */}
      <AnimatePresence>
        {isAddingContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[3rem] p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAddingContent(false)}
                className="absolute top-8 right-8 p-3 hover:bg-slate-50 rounded-2xl transition-all"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-8 italic uppercase text-center">
                {editingContent ? 'Editar Contenido' : 'Nuevo Contenido'}
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Título del Contenido</label>
                  <input 
                    value={contentTitle}
                    onChange={e => setContentTitle(e.target.value)}
                    placeholder="EJ. FUNDAMENTOS DE PICK & ROLL"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Descripción (Opcional)</label>
                  <textarea 
                    value={contentDesc}
                    onChange={e => setContentDesc(e.target.value)}
                    placeholder="Detalles técnicos o ejercicios..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold h-32 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Asignar Profesores a esta Tarea</label>
                  <div className="flex flex-wrap gap-2">
                    {categoryProfessors.length === 0 && manualStaff.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">Debes asignar staff a la categoría primero.</p>
                    ) : (
                      <>
                        {categoryProfessors.map(profId => {
                          const prof = users.find(u => u.uid === profId);
                          const isAssigned = assignedTeachers.includes(profId);
                          return (
                            <button
                              key={profId}
                              onClick={() => {
                                setAssignedTeachers(prev => 
                                  isAssigned ? prev.filter(id => id !== profId) : [...prev, profId]
                                );
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                                isAssigned 
                                  ? "bg-slate-900 border-slate-900 text-white" 
                                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                              )}
                            >
                              {prof?.displayName}
                            </button>
                          );
                        })}
                        {manualStaff.map(name => {
                          const isAssigned = assignedTeachers.includes(name);
                          return (
                            <button
                              key={name}
                              onClick={() => {
                                setAssignedTeachers(prev => 
                                  isAssigned ? prev.filter(n => n !== name) : [...prev, name]
                                );
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                                isAssigned 
                                  ? "bg-slate-900 border-slate-900 text-white" 
                                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                              )}
                            >
                              {name}
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleSaveContent}
                  disabled={!contentTitle.trim()}
                  className="w-full bg-orange-600 text-white p-5 rounded-3xl font-black uppercase hover:bg-orange-700 transition-all shadow-lg shadow-orange-900/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {editingContent ? 'Guardar Cambios' : 'Crear Contenido'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CurriculumManager;
