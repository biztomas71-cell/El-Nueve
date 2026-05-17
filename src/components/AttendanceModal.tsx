import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, doc, updateDoc, handleFirestoreError } from '../lib/firebase';
import { ClubEvent, RSVP, ClubUser, OperationType, RSVPStatus, ManualRSVP } from '../types';
import { X, Check, Minus, UserPlus, Shield, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ClubEvent;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose, event }) => {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [users, setUsers] = useState<ClubUser[]>([]);
  const [manualName, setManualName] = useState('');
  const [manualStatus, setManualStatus] = useState<RSVPStatus>('going');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch RSVPs from subcollection
    const qRsvps = query(collection(db, 'events', event.id, 'rsvps'));
    const unsubRsvps = onSnapshot(qRsvps, (snapshot) => {
      setRsvps(snapshot.docs.map(d => d.data() as RSVP));
    });

    // Fetch Users (for display names)
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(d => d.data() as ClubUser));
    });

    return () => { unsubRsvps(); unsubUsers(); };
  }, [isOpen, event.id]);

  const updateRSVPStatus = async (userId: string, newStatus: RSVPStatus) => {
    try {
      await updateDoc(doc(db, 'events', event.id, 'rsvps', userId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `events/${event.id}/rsvps/${userId}`);
    }
  };

  const removeRSVP = async (userId: string) => {
    try {
      const { deleteDoc } = await import('../lib/firebase');
      await deleteDoc(doc(db, 'events', event.id, 'rsvps', userId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `events/${event.id}/rsvps/${userId}`);
    }
  };

  const addManualRSVP = async () => {
    if (!manualName.trim()) return;
    setSubmitting(true);
    try {
      const newManual: ManualRSVP = { name: manualName.trim(), status: manualStatus };
      await updateDoc(doc(db, 'events', event.id), {
        manualRSVPs: [...(event.manualRSVPs || []), newManual],
        updatedAt: new Date().toISOString()
      });
      setManualName('');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `events/${event.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  const updateManualStatus = async (name: string, newStatus: RSVPStatus) => {
    try {
      await updateDoc(doc(db, 'events', event.id), {
        manualRSVPs: (event.manualRSVPs || []).map(m => m.name === name ? { ...m, status: newStatus } : m),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `events/${event.id}`);
    }
  };

  const removeManualRSVP = async (name: string) => {
    try {
      await updateDoc(doc(db, 'events', event.id), {
        manualRSVPs: (event.manualRSVPs || []).filter(p => p.name !== name),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `events/${event.id}`);
    }
  };

  const getStatusIcon = (status: RSVPStatus) => {
    switch (status) {
      case 'going': return <Check className="w-4 h-4 text-emerald-500" />;
      case 'not_going': return <X className="w-4 h-4 text-red-500" />;
      case 'maybe': return <Minus className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusText = (status: RSVPStatus) => {
    switch (status) {
      case 'going': return 'Asiste';
      case 'not_going': return 'No Asiste';
      case 'maybe': return 'Duda';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
      >
        <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <div className="text-[10px] font-black uppercase text-orange-500 tracking-widest mb-1">Control de Asistencia</div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">{event.title}</h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl shadow-sm transition-all text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            {(['going', 'maybe', 'not_going'] as RSVPStatus[]).map(status => {
              const count = rsvps.filter(r => r.status === status).length + 
                            (event.manualRSVPs || []).filter(r => r.status === status).length;
              return (
                <div key={status} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center">
                  <div className="flex justify-center mb-1">{getStatusIcon(status)}</div>
                  <div className="text-2xl font-black text-slate-800">{count}</div>
                  <div className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{getStatusText(status)}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Registered Users */}
            <section>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                <Shield className="w-3 h-3" /> Usuarios App
              </h3>
              <div className="space-y-2">
                {rsvps.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">No hay registros aún.</p>
                ) : (
                  rsvps.map((rsvp, idx) => {
                    const u = users.find(u => u.uid === rsvp.userId);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm group">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase",
                            rsvp.status === 'going' ? "bg-emerald-50 text-emerald-600" :
                            rsvp.status === 'not_going' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                          )}>
                            {u?.displayName?.[0] || '?'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-700">{u?.displayName || 'Cargando...'}</div>
                            <div className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">{getStatusText(rsvp.status)}</div>
                          </div>
                          {getStatusIcon(rsvp.status)}
                        </div>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {(['going', 'maybe', 'not_going'] as RSVPStatus[]).map(s => (
                            <button
                              key={s}
                              onClick={() => updateRSVPStatus(rsvp.userId, s)}
                              className={cn(
                                "p-1.5 rounded-lg border transition-all",
                                rsvp.status === s ? "bg-slate-900 border-slate-900 text-white" : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                              )}
                            >
                              {getStatusIcon(s)}
                            </button>
                          ))}
                          <button 
                            onClick={() => removeRSVP(rsvp.userId)}
                            className="p-1.5 bg-red-50 border border-red-100 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Manual List */}
            <section>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                <User className="w-3 h-3" /> Invitados / Manual
              </h3>
              <div className="space-y-2 mb-6">
                {(!event.manualRSVPs || event.manualRSVPs.length === 0) ? (
                  <p className="text-[10px] text-slate-400 italic">No hay invitados manuales.</p>
                ) : (
                  event.manualRSVPs.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl group">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(m.status)}
                        <div>
                          <div className="text-xs font-bold text-slate-700">{m.name}</div>
                          <div className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">{getStatusText(m.status)}</div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {(['going', 'maybe', 'not_going'] as RSVPStatus[]).map(s => (
                          <button
                            key={s}
                            onClick={() => updateManualStatus(m.name, s)}
                            className={cn(
                              "p-1.5 rounded-lg border transition-all",
                              m.status === s ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                            )}
                          >
                            {getStatusIcon(s)}
                          </button>
                        ))}
                        <button 
                          onClick={() => removeManualRSVP(m.name)}
                          className="p-1.5 bg-red-50 border border-red-100 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Manual Form */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Añadir Asistencia Manual</h4>
                <input 
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none"
                />
                <div className="grid grid-cols-3 gap-2">
                  {(['going', 'maybe', 'not_going'] as RSVPStatus[]).map(s => (
                    <button 
                      key={s}
                      onClick={() => setManualStatus(s)}
                      className={cn(
                        "p-2 rounded-xl border text-[8px] font-black uppercase tracking-tighter transition-all",
                        manualStatus === s 
                          ? "bg-slate-900 border-slate-900 text-white" 
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                      )}
                    >
                      {getStatusText(s)}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={submitting || !manualName.trim()}
                  onClick={addManualRSVP}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-orange-900/20 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4 inline-block mr-2 mt-[-2px]" />
                  Registrar
                </button>
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AttendanceModal;
