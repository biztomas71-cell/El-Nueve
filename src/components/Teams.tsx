import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { db, collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, handleFirestoreError } from '../lib/firebase';
import { OperationType } from '../types';
import { Users, Plus, UserPlus, Shield, Trophy, ChevronRight, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Team {
  id: string;
  name: string;
  category: string;
  coach: string;
  players: string[]; // List of user IDs
  manualPlayers: string[]; // List of manual player names
}

const Teams: React.FC = () => {
  const { user, isAdmin, profile } = useFirebase();
  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCategory, setNewTeamCategory] = useState('');
  const [manualPlayerName, setManualPlayerName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  useEffect(() => {
    if (!user) return;

    // Fetch Teams
    const qTeams = query(collection(db, 'teams'));
    const unsubTeams = onSnapshot(qTeams, (snapshot) => {
      setTeams(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Team)));
    });

    // Fetch All Users (to assign)
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setAllUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubTeams(); unsubUsers(); };
  }, [user]);

  const rosterRef = React.useRef<HTMLDivElement>(null);

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'teams'), {
        name: newTeamName,
        category: newTeamCategory,
        coach: profile?.displayName || '',
        players: [],
        manualPlayers: []
      });
      setIsAddingTeam(false);
      setNewTeamName('');
      setNewTeamCategory('');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'teams');
    }
  };

  const assignPlayer = async (teamId: string, userId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team || team.players.includes(userId)) return;
    
    try {
      await updateDoc(doc(db, 'teams', teamId), {
        players: [...team.players, userId]
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `teams/${teamId}`);
    }
  };

  const removePlayer = async (teamId: string, userId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    try {
      await updateDoc(doc(db, 'teams', teamId), {
        players: team.players.filter(p => p !== userId)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `teams/${teamId}`);
    }
  };

  const addManualPlayer = async (teamId: string) => {
    if (!manualPlayerName.trim()) return;
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    try {
      await updateDoc(doc(db, 'teams', teamId), {
        manualPlayers: [...(team.manualPlayers || []), manualPlayerName.trim()]
      });
      setManualPlayerName('');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `teams/${teamId}`);
    }
  };

  const removeManualPlayer = async (teamId: string, playerName: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    try {
      await updateDoc(doc(db, 'teams', teamId), {
        manualPlayers: team.manualPlayers.filter(p => p !== playerName)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `teams/${teamId}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Equipos del Club</h2>
          <p className="text-slate-500 font-medium">Gestiona plantillas y categorías oficiales</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsAddingTeam(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-md shadow-slate-200"
          >
            <Plus className="w-4 h-4" />
            Crear Equipo
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Teams List */}
        <div className="lg:col-span-2 space-y-4">
          {teams.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center">
              <Users className="w-12 h-12 mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay equipos registrados</p>
            </div>
          ) : (
            teams.map(team => (
              <motion.div 
                layout
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={cn(
                  "bg-white p-6 rounded-3xl border transition-all cursor-pointer flex items-center justify-between group",
                  selectedTeamId === team.id ? "border-orange-500 ring-4 ring-orange-500/10 shadow-xl" : "border-slate-100 hover:border-slate-300 shadow-sm"
                )}
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-orange-500 tracking-widest mb-1">{team.category}</div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">{team.name}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-slate-200" /> 
                        {(team.players?.length || 0) + (team.manualPlayers?.length || 0)} Jugadores
                      </span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3 text-slate-200" /> Coach: {team.coach}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-slate-400 transition-colors" />
              </motion.div>
            ))
          )}
        </div>

        {/* Selected Team Roster */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedTeam ? (
              <motion.div 
                key={selectedTeam.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-slate-800 uppercase italic">Plantilla</h3>
                  {isAdmin && (
                    <button 
                      onClick={() => rosterRef.current?.scrollIntoView({ behavior: 'smooth' })}
                      className="p-2 bg-slate-50 rounded-full hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {selectedTeam.players.length === 0 && (!selectedTeam.manualPlayers || selectedTeam.manualPlayers.length === 0) ? (
                    <p className="text-sm text-slate-400 italic">No hay jugadores asignados a este equipo.</p>
                  ) : (
                    <>
                      {/* Linked Users */}
                      {selectedTeam.players.map(pId => {
                        const p = allUsers.find(u => u.id === pId);
                        return (
                          <div key={pId} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-xs shadow-sm">
                                <Shield className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700">{p?.displayName || 'Usuario Hoops'}</span>
                                <span className="text-[8px] font-black uppercase text-blue-400 tracking-widest">Registrado</span>
                              </div>
                            </div>
                            {isAdmin && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); removePlayer(selectedTeam.id, pId); }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* Manual Names */}
                      {selectedTeam.manualPlayers?.map((pName, idx) => (
                        <div key={`manual-${idx}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600 text-xs shadow-sm">
                              {pName[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700">{pName}</span>
                              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Jugador Libre</span>
                            </div>
                          </div>
                          {isAdmin && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeManualPlayer(selectedTeam.id, pName); }}
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
                  <div ref={rosterRef} className="mt-12 border-t border-slate-100 pt-8 space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Registro Rápido</h4>
                      <div className="flex gap-2">
                        <input 
                          value={manualPlayerName}
                          onChange={(e) => setManualPlayerName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addManualPlayer(selectedTeam.id)}
                          placeholder="Nombre del jugador..."
                          className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                        />
                        <button 
                          onClick={() => addManualPlayer(selectedTeam.id)}
                          className="p-2 bg-slate-900 text-white rounded-xl hover:bg-orange-600 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Asignar Registrados</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                        {allUsers.filter(u => !selectedTeam.players.includes(u.id)).length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">No hay más usuarios disponibles</p>
                      ) : (
                        allUsers.filter(u => !selectedTeam.players.includes(u.id)).map(u => (
                          <button 
                            key={u.id}
                            onClick={() => assignPlayer(selectedTeam.id, u.id)}
                            className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl text-left transition-colors"
                          >
                            <span className="text-xs font-semibold text-slate-600">{u.displayName}</span>
                            <Plus className="w-3.5 h-3.5 text-slate-300" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400 text-center">
                <Shield className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">Selecciona un equipo para ver los detalles</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Team Modal */}
      <AnimatePresence>
        {isAddingTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative shadow-2xl"
            >
              <button 
                onClick={() => setIsAddingTeam(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-8 italic uppercase text-center">Nuevo Equipo</h3>
              <form onSubmit={handleAddTeam} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Nombre</label>
                  <input 
                    required
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold"
                    placeholder="EJ. GUERREROS"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Categoría</label>
                  <input 
                    required
                    value={newTeamCategory}
                    onChange={e => setNewTeamCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold"
                    placeholder="EJ. SUB-18 MASCULINO"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase hover:bg-orange-600 transition-all"
                >
                  Registrar Equipo
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Teams;
