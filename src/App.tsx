import React from 'react';
import { FirebaseProvider, useFirebase } from './components/FirebaseProvider';
import Calendar from './components/Calendar';
import Teams from './components/Teams';
import Notices from './components/Notices';
import Curriculum from './components/Curriculum';
import SettingsView from './components/Settings';
import { signInWithPopup, googleProvider, auth, signOut } from './lib/firebase';
import { LayoutDashboard, LogIn, LogOut, Users, Settings, Bell, Trophy as SportsIcon, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SidebarLink: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 rounded-xl group ${active ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
  >
    <div className={`transition-transform duration-300 group-hover:scale-110`}>{icon}</div>
    <span className="font-bold uppercase tracking-widest text-[10px]">{label}</span>
  </button>
);

const AppContent: React.FC = () => {
  const { user, profile, loading } = useFirebase();
  const [activeTab, setActiveTab] = React.useState<'schedule' | 'teams' | 'notices' | 'curriculum' | 'settings'>('schedule');

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <SportsIcon className="w-16 h-16 text-orange-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Sidebar - Bento Style */}
      <aside className="w-full md:w-64 bg-slate-950 text-white flex flex-col z-40">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl p-1 flex items-center justify-center overflow-hidden shadow-inner shrink-0 leading-none">
              <span className="text-[20px] font-black text-slate-900 leading-none">9</span>
            </div>
            <div>
              <h1 className="text-xl font-black uppercase leading-none tracking-tighter italic text-orange-500">EL NUEVE</h1>
              <p className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-bold">Nueve de Julio</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-2">Gestión</div>
          <SidebarLink icon={<LayoutDashboard className="w-5 h-5" />} label="Calendario" active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
          <SidebarLink icon={<Users className="w-5 h-5" />} label="Equipos" active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} />
          <SidebarLink icon={<BookOpen className="w-5 h-5" />} label="Contenidos" active={activeTab === 'curriculum'} onClick={() => setActiveTab('curriculum')} />
          <SidebarLink icon={<Bell className="w-5 h-5" />} label="Avisos" active={activeTab === 'notices'} onClick={() => setActiveTab('notices')} />
          {user && <SidebarLink icon={<Settings className="w-5 h-5" />} label="Configuración" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />}
        </nav>

        <div className="p-4 bg-slate-900">
          {user ? (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="w-10 h-10 rounded-full border border-slate-700" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold text-orange-500">
                    {profile?.displayName?.[0]}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="font-bold text-xs truncate">{profile?.displayName}</p>
                  <p className="text-[9px] text-slate-500 uppercase font-mono font-bold">
                    {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'coach' ? 'Entrenador' : 'Jugador'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => signOut(auth)}
                className="w-full flex items-center justify-center gap-2 p-2 bg-slate-800 hover:bg-red-900/30 hover:text-red-400 rounded-xl transition-all font-bold uppercase text-[10px] tracking-widest"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signInWithPopup(auth, googleProvider)}
              className="w-full flex items-center justify-center gap-2 p-4 bg-orange-600 rounded-2xl text-white hover:bg-orange-700 transition-all font-bold uppercase tracking-widest shadow-lg shadow-orange-900/20 active:scale-95"
            >
              <LogIn className="w-5 h-5" />
              Acceso Club
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative p-6">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full flex items-center justify-center text-center"
            >
              <div className="max-w-xl bg-white p-12 rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-100">
                <div className="w-24 h-24 bg-slate-950 rounded-3xl mx-auto mb-8 flex items-center justify-center text-white shadow-xl relative overflow-hidden">
                  <span className="text-5xl font-black italic relative z-10">9</span>
                  <div className="absolute inset-0 bg-orange-600 opacity-20 transform -rotate-12 translate-x-4 translate-y-4" />
                </div>
                <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-4 uppercase italic">EL NUEVE</h2>
                <p className="text-lg text-slate-500 font-medium mb-12">Bienvenido a la plataforma oficial del Club Nueve de Julio. Gestiona tu equipo, revisa contenidos y mantente al día.</p>
                <div className="p-6 border-2 border-dashed border-slate-100 rounded-2xl">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Acceso Restringido • Solo Miembros</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="h-full"
            >
              {activeTab === 'schedule' && <Calendar />}
              {activeTab === 'teams' && <Teams />}
              {activeTab === 'notices' && <Notices />}
              {activeTab === 'curriculum' && <Curriculum />}
              {activeTab === 'settings' && <SettingsView />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
