import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { db, doc, setDoc, onSnapshot, collection, query, handleFirestoreError } from '../lib/firebase';
import { RSVP, RSVPStatus, OperationType } from '../types';
import { Check, X, HelpCircle, Users } from 'lucide-react';
import { cn } from '../lib/utils';

interface RSVPSectionProps {
  eventId: string;
}

const RSVPSection: React.FC<RSVPSectionProps> = ({ eventId }) => {
  const { user, profile } = useFirebase();
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [myRsvp, setMyRsvp] = useState<RSVPStatus | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'events', eventId, 'rsvps'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as RSVP);
      setRsvps(data);
      const mine = data.find(r => r.userId === user?.uid);
      if (mine) setMyRsvp(mine.status);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `events/${eventId}/rsvps`);
    });

    return () => unsubscribe();
  }, [eventId, user?.uid]);

  const handleRSVP = async (status: RSVPStatus) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'events', eventId, 'rsvps', user.uid), {
        eventId,
        userId: user.uid,
        status,
        updatedAt: new Date().toISOString()
      } as RSVP);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `events/${eventId}/rsvps/${user.uid}`);
    }
  };

  const goingCount = rsvps.filter(r => r.status === 'going').length;

  return (
    <div className="flex items-center gap-4">
      {/* RSVP Toggles */}
      {!myRsvp ? (
        <div className="flex bg-slate-100 rounded-full p-1 border border-slate-200">
          <button 
            onClick={(e) => { e.stopPropagation(); handleRSVP('going'); }}
            className="p-1.5 rounded-full transition-all hover:bg-white text-slate-400 hover:text-emerald-600"
            title="Asistiré"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleRSVP('maybe'); }}
            className="p-1.5 rounded-full transition-all hover:bg-white text-slate-400 hover:text-amber-600"
            title="Duda"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleRSVP('not_going'); }}
            className="p-1.5 rounded-full transition-all hover:bg-white text-slate-400 hover:text-rose-600"
            title="No asistiré"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
          myRsvp === 'going' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
          myRsvp === 'not_going' ? "bg-red-50 border-red-100 text-red-600" : "bg-amber-50 border-amber-100 text-amber-600"
        )}>
          {myRsvp === 'going' ? <Check className="w-3 h-3" /> :
           myRsvp === 'not_going' ? <X className="w-3 h-3" /> : <HelpCircle className="w-3 h-3" />}
          {myRsvp === 'going' ? 'Asisto' : myRsvp === 'not_going' ? 'No asisto' : 'Duda'}
        </div>
      )}

      {/* Stats */}
      {goingCount > 0 && (
        <div className="hidden lg:flex items-center gap-1 font-black text-[10px] text-slate-400 uppercase tracking-widest">
          <Users className="w-3 h-3" />
          {goingCount} {goingCount === 1 ? 'Persona' : 'Personas'}
        </div>
      )}
    </div>
  );
};

export default RSVPSection;
