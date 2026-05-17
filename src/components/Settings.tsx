import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { Settings as SettingsIcon, User, Shield, Bell, Info, ChevronRight, LogOut, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signOut, db, doc, updateDoc } from '../lib/firebase';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

const Settings: React.FC = () => {
  const { profile, isAdmin } = useFirebase();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateRole = async (newRole: UserRole) => {
    if (!auth.currentUser) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Error updating role:", e);
    } finally {
      setIsUpdating(false);
    }
  };

  const roles: { id: UserRole; label: string; desc: string }[] = [
    { id: 'player', label: 'Jugador', desc: 'Acceso a calendario y avisos' },
    { id: 'coach', label: 'Entrenador', desc: 'Gestiona entrenamientos y contenidos' },
    { id: 'admin', label: 'Dirigente', desc: 'Control total del sistema y staff' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-[10px] font-black uppercase text-orange-500 tracking-widest mb-1 flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" /> Opciones del Sistema
            </div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase italic">Configuración</h2>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Account Profile Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
                <User className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-800 uppercase italic tracking-tight">Mi Perfil</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-1 p-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nombre Completo</span>
                <span className="text-sm font-bold text-slate-700">{profile?.displayName}</span>
              </div>
              <div className="flex flex-col gap-1 p-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Correo Electrónico</span>
                <span className="text-sm font-bold text-slate-700">{auth.currentUser?.email}</span>
              </div>
              
              <div className="pt-4 border-t border-slate-50">
                <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest block mb-4 ml-2">Asignar mi Rol</span>
                <div className="grid grid-cols-1 gap-2">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleUpdateRole(role.id)}
                      disabled={isUpdating}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group",
                        profile?.role === role.id 
                          ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                          : "bg-white border-slate-100 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider">{role.label}</div>
                        <div className={cn("text-[10px] font-medium opacity-60", profile?.role === role.id ? "text-white" : "text-slate-400")}>
                          {role.desc}
                        </div>
                      </div>
                      {profile?.role === role.id && (
                        <div className="bg-orange-600 rounded-full p-1">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-800 uppercase italic tracking-tight">Preferencias</h3>
            </div>
            <div className="p-6 space-y-1">
              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Notificaciones</span>
                <div className="w-8 h-4 bg-orange-600 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Idioma</span>
                <span className="text-sm font-bold text-slate-700">Español (ES)</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-800 uppercase italic tracking-tight">Seguridad</h3>
            </div>
            <div className="p-8">
              <p className="text-sm text-slate-500 mb-6 font-medium">Tu cuenta está protegida por Google Authentication. Todos los datos están encriptados en tránsito.</p>
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                <div className="text-[10px] font-black uppercase text-orange-600 tracking-widest mb-1">Estado de Seguridad</div>
                <div className="text-xs font-bold text-orange-950">Protección en tiempo real activa</div>
              </div>
            </div>
          </motion.div>

          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-between p-6 bg-red-50 border border-red-100 text-red-600 rounded-[2rem] hover:bg-red-100 transition-all font-black uppercase text-xs tracking-widest group shadow-sm"
          >
            <div className="flex items-center gap-4">
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Cerrar Sesión Activa
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
