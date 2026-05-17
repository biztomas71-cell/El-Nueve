import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { db, collection, query, onSnapshot, addDoc, handleFirestoreError, Timestamp } from '../lib/firebase';
import { OperationType } from '../types';
import { Bell, Plus, Send, Clock, Info, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: any;
  type: 'urgent' | 'info' | 'event';
}

const Notices: React.FC = () => {
  const { user, isAdmin, profile } = useFirebase();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'urgent' | 'info' | 'event'>('info');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notices'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notice));
      data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setNotices(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'notices'), {
        title,
        content,
        type,
        author: profile?.displayName || 'Admin',
        createdAt: Timestamp.now()
      });
      setTitle('');
      setContent('');
      setIsAdding(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'notices');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Comunicados</h2>
          <p className="text-slate-500 font-medium">Información y avisos del club</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-md shadow-orange-900/20"
          >
            <Megaphone className="w-4 h-4" />
            Publicar
          </button>
        )}
      </header>

      <div className="space-y-6">
        {notices.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center">
            <Bell className="w-16 h-16 mx-auto text-slate-100 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay avisos recientes</p>
          </div>
        ) : (
          notices.map(notice => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={notice.id}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                notice.type === 'urgent' ? 'bg-red-500' : notice.type === 'event' ? 'bg-orange-500' : 'bg-blue-500'
              }`} />
              
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      notice.type === 'urgent' ? 'bg-red-50 text-red-600' : 
                      notice.type === 'event' ? 'bg-orange-50 text-orange-600' : 
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {notice.type === 'urgent' ? 'Urgente' : notice.type === 'event' ? 'Evento' : 'Info'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {notice.createdAt ? format(notice.createdAt.toDate(), "d 'de' MMMM, HH:mm", { locale: es }) : 'Recién'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">{notice.title}</h3>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Posteado por: {notice.author}</div>
              </div>
              
              <p className="text-slate-600 leading-relaxed font-medium">{notice.content}</p>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 relative shadow-2xl"
            >
              <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-8 uppercase italic">Nuevo Comunicado</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Título</label>
                  <input 
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold"
                    placeholder="EJ. TORNEO DE VERANO"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Prioridad</label>
                  <select 
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold"
                  >
                    <option value="info">Información General</option>
                    <option value="urgent">Urgente / Importante</option>
                    <option value="event">Evento Social</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Mensaje</label>
                  <textarea 
                    required
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold resize-none"
                    placeholder="Escribe aquí el anuncio club..."
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 bg-slate-100 text-slate-600 p-5 rounded-2xl font-black uppercase hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    disabled={submitting}
                    type="submit"
                    className="flex-1 bg-orange-600 text-white p-5 rounded-2xl font-black uppercase hover:bg-orange-700 transition-all shadow-lg shadow-orange-900/20 disabled:opacity-50"
                  >
                    {submitting ? 'Publicando...' : 'Publicar Aviso'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notices;
