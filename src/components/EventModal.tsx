import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { db, collection, doc, setDoc, updateDoc, addDoc, handleFirestoreError } from '../lib/firebase';
import { ClubEvent, OperationType, EventType } from '../types';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodId: string;
  event?: ClubEvent | null;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, periodId, event }) => {
  const { user } = useFirebase();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('training');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:30');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setType(event.type);
      setCategory(event.category || '');
      setDescription(event.description || '');
      const startDate = new Date(event.start);
      setDate(startDate.toISOString().split('T')[0]);
      setStartTime(startDate.toTimeString().slice(0, 5));
      setEndTime(new Date(event.end).toTimeString().slice(0, 5));
      setLocation(event.location || '');
    }
  }, [event]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const start = new Date(`${date}T${startTime}`).toISOString();
      const end = new Date(`${date}T${endTime}`).toISOString();
      
      const selectedDate = new Date(date);
      const periodIdForEvent = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;

      const eventData: any = {
        title,
        type,
        category,
        description,
        start,
        end,
        location,
        periodId: periodIdForEvent,
        updatedAt: new Date().toISOString(),
      };

      if (event) {
        await updateDoc(doc(db, 'events', event.id), eventData);
      } else {
        eventData.createdBy = user.uid;
        eventData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'events'), eventData);
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, event ? OperationType.UPDATE : OperationType.CREATE, 'events');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 relative shadow-2xl shadow-slate-900/20 border border-slate-100"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full transition-colors">
          <X className="w-6 h-6 text-slate-400" />
        </button>

        <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-8">
          {event ? 'Actualizar Actividad' : 'Nueva Actividad'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título de la Actividad</label>
            <input 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all"
              placeholder="EJ. VS SPARTANS"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="game">Partido</option>
                <option value="training">Entrenamiento</option>
                <option value="event">Evento / Otro</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fecha</label>
              <input 
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Inicia</label>
              <input 
                required
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-800 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Finaliza</label>
              <input 
                required
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoría</label>
            <input 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all"
              placeholder="EJ. MINI, U13, PRIMERA"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ubicación / Pabellón</label>
            <input 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all"
              placeholder="PISTA CENTRAL / VISITANTE"
            />
          </div>

          <button 
            disabled={submitting}
            type="submit"
            className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
          >
            {submitting ? 'Procesando...' : 'Confirmar Detalles'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default EventModal;
