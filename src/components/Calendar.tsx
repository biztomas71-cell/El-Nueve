import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { db, collection, query, where, onSnapshot, handleFirestoreError } from '../lib/firebase';
import { ClubEvent, OperationType } from '../types';
import { getPeriodInfo, getNextPeriod, getPrevPeriod } from '../lib/dateUtils';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Users, Trophy as SportsIcon, Dumbbell, Calendar as CalendarIcon } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import EventModal from './EventModal';
import RSVPSection from './RSVPSection';
import AttendanceModal from './AttendanceModal';

const Calendar: React.FC = () => {
  const { user, isAdmin, profile, isCoach } = useFirebase();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);

  const period = getPeriodInfo(currentDate);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'events'),
      where('periodId', '==', period.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClubEvent[];
      eventData.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      setEvents(eventData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'events');
    });

    return () => unsubscribe();
  }, [user, period.id]);

  const handlePrev = () => setCurrentDate(getPrevPeriod(currentDate));
  const handleNext = () => setCurrentDate(getNextPeriod(currentDate));

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'game': return 'border-orange-500 bg-orange-50 text-orange-600';
      case 'training': return 'border-blue-500 bg-blue-50 text-blue-600';
      default: return 'border-emerald-500 bg-emerald-50 text-emerald-600';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'game': return 'Partido';
      case 'training': return 'Entreno';
      default: return 'Evento';
    }
  };

  const nextMatch = events.find(e => e.type === 'game' && new Date(e.start) >= new Date());

  const periodProgress = 62; // Mock progress for the bento look

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header Bento */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Agenda del Club</h2>
          <p className="text-slate-500 font-medium">Gestionando actividades para {period.name}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
            <button onClick={handlePrev} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="px-4 flex items-center font-bold text-xs uppercase tracking-widest text-slate-400">
              Periodo
            </div>
            <button onClick={handleNext} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => { setSelectedEvent(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-md shadow-slate-200"
            >
              <Plus className="w-4 h-4" />
              Nuevo Evento
            </button>
          )}
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
        
        {/* Next Match Card */}
        <div className="md:col-span-2 lg:col-span-2 bg-slate-900 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between shadow-xl shadow-slate-200">
          <div className="relative z-10">
            <div className="text-orange-500 text-[10px] font-black tracking-widest uppercase mb-2">Próximo Partido</div>
            {nextMatch ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-orange-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg shadow-orange-900/40">
                    {nextMatch.category || 'Categoría pendiente'}
                  </span>
                </div>
                <h3 className="text-white text-4xl font-black mb-4 uppercase leading-none italic">{nextMatch.title}</h3>
                <div className="flex flex-col gap-2 text-white/60 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(nextMatch.start), "d MMM, HH:mm", { locale: es })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{nextMatch.location || 'Sede Local'}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col justify-center">
                <h3 className="text-white/20 text-2xl font-black mb-4 uppercase leading-none italic">Sin partidos próximos</h3>
              </div>
            )}
          </div>
          {nextMatch && (
            <div className="relative z-10 mt-8 flex flex-col gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[8px] font-black text-white/50">H</div>
                ))}
                <div className="w-8 h-8 rounded-full bg-orange-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white tracking-tighter">RSVP</div>
              </div>
              <button 
                onClick={() => { setSelectedEvent(nextMatch); setIsModalOpen(true); }}
                className="w-fit bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border border-white/10"
              >
                Ver Detalles
              </button>
            </div>
          )}
          <div className="absolute -right-8 -bottom-8 opacity-10 transform -rotate-12">
            <SportsIcon size={180} />
          </div>
        </div>

        {/* Monthly Activity Cards */}
        {[0, 1].map((offset) => {
          const monthDate = new Date(period.startDate);
          monthDate.setMonth(monthDate.getMonth() + offset);
          const monthEvents = events.filter(e => {
            const date = new Date(e.start);
            return date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear();
          });

          return (
            <div key={offset} className="md:col-span-2 lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">
                  {format(monthDate, 'MMMM', { locale: es })}
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg uppercase">
                  {monthEvents.length} Eventos
                </span>
              </div>
              
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-2 scrollbar-hide">
                {monthEvents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                    <CalendarIcon className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Sin actividades</p>
                  </div>
                ) : (
                  monthEvents.map((event) => (
                    <motion.div 
                      layout
                      key={event.id}
                      className="group bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:bg-white hover:border-slate-300 transition-all cursor-pointer shadow-none hover:shadow-lg hover:shadow-slate-100"
                      onClick={() => { setSelectedEvent(event); setIsModalOpen(true); }}
                    >
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                          <span className="text-[9px] font-black uppercase text-slate-400 leading-none mb-0.5">{format(new Date(event.start), 'EEE', { locale: es })}</span>
                          <span className="text-lg font-black text-slate-800 leading-none">{format(new Date(event.start), 'dd')}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("px-1.5 py-0.5 rounded-md border text-[8px] font-bold uppercase tracking-wider", getTypeColor(event.type))}>
                              {getTypeText(event.type)}
                            </span>
                            {event.category && (
                              <span className="text-[10px] font-black uppercase text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">
                                {event.category}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 truncate uppercase tracking-tight group-hover:text-orange-600 transition-colors">{event.title}</h4>
                          <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(event.start), 'HH:mm')}</span>
                            {event.location && <span className="truncate flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <RSVPSection eventId={event.id} />
                          {isCoach && (
                            <button 
                              onClick={() => { setSelectedEvent(event); setIsAttendanceOpen(true); }}
                              className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-orange-500 transition-colors shadow-sm border border-transparent hover:border-slate-100"
                              title="Ver Asistencia"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          );
        })}

        <div className="md:col-span-2 lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all">
          <div>
            <h3 className="font-bold text-slate-500 text-[10px] uppercase tracking-widest mb-4">Registro De Asistencia Directa</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">Controla quién asistió a las últimas sesiones y mantén el seguimiento técnico al día.</p>
          </div>
          <div className="mt-8 flex items-end gap-2 h-20">
            {[40, 70, 95, 60, 85, 45, 90].map((h, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex-1 rounded-t-xl transition-all duration-500",
                  i === 2 ? "bg-orange-500" : "bg-slate-100 group-hover:bg-slate-200"
                )}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-all">
            <Users size={120} />
          </div>
        </div>

      </div>

      {isModalOpen && (
        <EventModal 
          isOpen={isModalOpen} 
          onClose={() => { setIsModalOpen(false); setSelectedEvent(null); }} 
          periodId={period.id}
          event={selectedEvent}
        />
      )}

      {isAttendanceOpen && selectedEvent && (
        <AttendanceModal 
          isOpen={isAttendanceOpen} 
          onClose={() => { setIsAttendanceOpen(false); setSelectedEvent(null); }} 
          event={selectedEvent}
        />
      )}
    </div>
  );
};

export default Calendar;
