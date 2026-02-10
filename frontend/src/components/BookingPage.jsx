import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API_URL from '../api';

const BookingPage = ({ onBack }) => {
    const [step, setStep] = useState(0); // 0: Manager, 1: Date/Duration, 2: Time, 3: Form
    const [managers, setManagers] = useState([]);
    const [selectedManager, setSelectedManager] = useState(null);
    const [formData, setFormData] = useState({
        date: '',
        duration: 1,
        startTime: '',
        endTime: '',
        authCode: '',
        description: ''
    });
    const [busySlots, setBusySlots] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));

    // Toggle Dark Mode
    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        if (newMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    };

    // Fetch Managers
    useEffect(() => {
        const fetchManagers = async () => {
            try {
                const response = await fetch(`${API_URL}/api/training/managers`);
                const data = await response.json();
                setManagers(Array.isArray(data) ? data : []);
            } catch (err) { console.error(err); setManagers([]); }
        };
        fetchManagers();
    }, []);

    // Fetch Busy Indicators (for colors)
    useEffect(() => {
        if (!selectedManager) return;
        const fetchBusyDots = async () => {
            const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
            const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString();
            try {
                const response = await fetch(`${API_URL}/api/training/schedule?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&managerId=${selectedManager.id}`);
                const data = await response.json();
                setBusySlots(Array.isArray(data) ? data : []);
            } catch (err) { console.error(err); setBusySlots([]); }
        };
        fetchBusyDots();
    }, [currentMonth, selectedManager]);

    // Fetch Available Slots
    useEffect(() => {
        if (formData.date && formData.duration && selectedManager) {
            fetchAvailableSlots();
        }
    }, [formData.date, formData.duration, selectedManager]);

    const fetchAvailableSlots = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/training/slots?date=${formData.date}&duration=${formData.duration}&managerId=${selectedManager.id}`);
            const data = await response.json();
            setAvailableSlots(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); setAvailableSlots([]); }
        finally { setLoading(false); }
    };

    const handleBook = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const response = await fetch(`${API_URL}/api/training/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startTime: formData.startTime,
                    endTime: formData.endTime,
                    authCode: formData.authCode,
                    description: formData.description,
                    managerId: selectedManager.id
                })
            });
            const data = await response.json();
            if (response.ok) {
                setMessage({ type: 'success', text: '¡Reserva exitosa! Te esperamos.' });
                setTimeout(() => onBack(), 2000);
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (err) { setMessage({ type: 'error', text: 'Error de conexión' }); }
        finally { setLoading(false); }
    };

    const daysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
    const firstDay = (m, y) => new Date(y, m, 1).getDay();

    const renderCalendar = () => {
        const m = currentMonth.getMonth();
        const y = currentMonth.getFullYear();
        const total = daysInMonth(m, y);
        const start = firstDay(m, y);
        const cells = [];

        for (let i = 0; i < start; i++) cells.push(<div key={`e-${i}`} />);

        for (let d = 1; d <= total; d++) {
            const dateObj = new Date(y, m, d);
            const dayOfWeek = dateObj.getDay();
            if (dayOfWeek === 0) { // Quitar Domingos
                cells.push(<div key={`sun-${d}`} className="h-10 w-10 sm:h-12 sm:w-12 opacity-0" />);
                continue;
            }

            const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isSelected = formData.date === dStr;
            const isPast = new Date(dStr + 'T23:59:59') < new Date();

            // Lógica de colores basada en horas ocupadas reales
            const slotsToFilter = Array.isArray(busySlots) ? busySlots : [];

            // Filtrar eventos del día
            const dayEvents = slotsToFilter.filter(s => {
                if (!s.start || !s.end) return false;
                // Convertir a fecha local para comparar día
                const eventStart = new Date(s.start);
                return eventStart.getDate() === d && eventStart.getMonth() === m && eventStart.getFullYear() === y;
            });

            // Calcular horas totales ocupadas
            let totalBusyHours = 0;
            dayEvents.forEach(event => {
                const start = new Date(event.start);
                const end = new Date(event.end);
                // Diferencia en horas
                const duration = (end - start) / (1000 * 60 * 60);
                totalBusyHours += duration;
            });

            // Asumiendo jornada laboral de 10 horas (8am - 6pm)
            // Rojo: >= 8 horas ocupadas (casi lleno)
            // Verde: > 0 y < 8 horas ocupadas (parcial)
            let statusColor = "";
            if (totalBusyHours >= 8) statusColor = "bg-red-500";
            else if (totalBusyHours > 0) statusColor = "bg-green-500";

            cells.push(
                <button
                    key={d}
                    disabled={isPast}
                    onClick={() => { setFormData({ ...formData, date: dStr }); setStep(1); }}
                    className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full relative flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-primary text-white shadow-xl scale-110 z-10' :
                        isPast ? 'opacity-20 cursor-not-allowed' : 'hover:bg-primary/5 dark:hover:bg-white/5 dark:text-white'
                        }`}
                >
                    <span className="text-sm font-bold">{d}</span>
                    {statusColor && !isSelected && !isPast && (
                        <span className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${statusColor} animate-pulse`} />
                    )}
                </button>
            );
        }
        return cells;
    };

    return (
        <div className="min-h-screen bg-white dark:bg-sidebar transition-colors flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
            {/* Decoración Fondo */}
            <div className="fixed top-0 left-0 w-80 h-80 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-96 h-96 bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <button
                onClick={toggleDarkMode}
                className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white dark:border-white/5 shadow-2xl z-50 hover:scale-110 transition-all text-primary dark:text-accent flex items-center justify-center group"
            >
                <span className="material-symbols-outlined text-2xl group-hover:rotate-180 transition-transform duration-500">
                    {darkMode ? 'light_mode' : 'dark_mode'}
                </span>
            </button>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-6xl bg-white/80 dark:bg-black/60 backdrop-blur-2xl rounded-[48px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_128px_-16px_rgba(0,0,0,0.4)] border border-white dark:border-white/10 overflow-hidden flex flex-col lg:flex-row z-10"
            >
                {/* Panel Izquierdo: Configuración */}
                <div className="lg:w-1/2 p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-white/5">
                    <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-bold text-primary/40 dark:text-white/40 hover:text-accent mb-8 uppercase tracking-widest group">
                        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span> Volver
                    </button>

                    <AnimatePresence mode="wait">
                        {step === 0 ? (
                            <motion.div key="manager" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <div>
                                    <h2 className="text-3xl font-serif font-bold text-primary dark:text-white mb-3 tracking-tight">Elige un Gestor</h2>
                                    <p className="text-xs text-primary/50 dark:text-white/40 font-medium uppercase tracking-wider">Selecciona quién dirigirá tu capacitación.</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {managers.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => { setSelectedManager(m); setStep(1); }}
                                            className="p-6 rounded-[32px] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-accent hover:shadow-2xl transition-all flex items-center gap-4 text-left group"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-primary/5 dark:bg-white/10 flex items-center justify-center overflow-hidden">
                                                {m.avatar ? <img src={m.avatar} alt={m.name || 'Gestor'} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-2xl text-primary/40 font-bold">{m.name?.[0] || m.username?.[0] || 'G'}</span>}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-primary dark:text-white font-serif">{m.name || m.username}</p>
                                                <p className="text-[9px] font-bold text-accent uppercase tracking-widest">Gestor Asignado</p>
                                            </div>
                                            <span className="material-symbols-outlined ml-auto text-primary/20 group-hover:text-accent transition-colors">chevron_right</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="calendar-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                <div className="mb-8 flex items-center gap-4">
                                    <button onClick={() => setStep(0)} className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center hover:scale-110 transition-all">
                                        <span className="material-symbols-outlined text-sm">person</span>
                                    </button>
                                    <div>
                                        <h2 className="text-xl font-serif font-bold text-primary dark:text-white">Con {selectedManager?.name || selectedManager?.username || 'Gestor'}</h2>
                                        <p className="text-[9px] font-bold text-accent uppercase tracking-[0.2em]">Gestor Seleccionado</p>
                                    </div>
                                </div>

                                {/* Selector de Duración */}
                                <div className="mb-10">
                                    <p className="text-[10px] font-bold text-primary/40 dark:text-white/30 uppercase tracking-[0.2em] mb-4 ml-2">Duración de la capacitación</p>
                                    <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-[24px] flex gap-2">
                                        {[1, 2, 3, 4].map(h => (
                                            <button
                                                key={h}
                                                onClick={() => setFormData({ ...formData, duration: h })}
                                                className={`flex-grow py-3 rounded-2xl text-[10px] font-bold tracking-widest transition-all ${formData.duration === h ? 'bg-primary text-white shadow-lg' : 'text-primary/50 dark:text-white/40 hover:bg-white dark:hover:bg-white/5'}`}
                                            >
                                                {h}H
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Calendario */}
                                <div className="flex items-center justify-between mb-6 px-4">
                                    <span className="text-xs font-bold text-accent uppercase tracking-[0.2em]">{currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-1 text-center mb-4">
                                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d} className="text-[10px] font-bold text-gray-300 py-2">{d}</div>)}
                                </div>
                                <div className="grid grid-cols-7 gap-1 select-none">
                                    {renderCalendar()}
                                </div>

                                {/* Leyenda Colores */}
                                <div className="mt-8 flex gap-4 justify-center sm:justify-start ml-2">
                                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Ocupado</span></div>
                                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Parcial</span></div>
                                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full border border-gray-200" /><span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Libre</span></div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Panel Derecho */}
                <div className="lg:w-1/2 bg-gray-50/30 dark:bg-white/[0.01] p-8 sm:p-12 relative">
                    <AnimatePresence mode="wait">
                        {!formData.date ? (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-300 dark:text-white/10"><span className="material-symbols-outlined text-4xl">touch_app</span></div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Selecciona un día para ver disponibilidad</p>
                            </motion.div>
                        ) : step === 1 ? (
                            <motion.div key="slots" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 h-full flex flex-col">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-serif font-bold text-primary dark:text-white">Horas Disponibles</h3>
                                    <span className="text-[10px] font-bold bg-accent/10 text-accent px-4 py-1.5 rounded-full tracking-widest">{new Date(formData.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span>
                                </div>

                                {loading ? (
                                    <div className="flex-grow flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
                                ) : availableSlots.length === 0 ? (
                                    <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
                                        <span className="material-symbols-outlined text-5xl text-red-300">block</span>
                                        <p className="text-xs text-primary/40 font-medium">No hay bloques de {formData.duration}H libres este día.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                                        {availableSlots.map((s, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => { setFormData({ ...formData, startTime: s.start, endTime: s.end }); setStep(3); }}
                                                className="group p-5 bg-white dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-accent hover:shadow-xl transition-all text-left flex flex-col gap-1"
                                            >
                                                <span className="text-[10px] font-bold text-gray-300 dark:text-white/20 uppercase tracking-widest group-hover:text-accent">Módulo de {formData.duration}H</span>
                                                <span className="text-sm font-bold text-primary dark:text-white">{s.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div key="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col">
                                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-[10px] font-bold text-accent mb-10 hover:translate-x-[-4px] transition-transform">
                                    <span className="material-symbols-outlined text-sm">arrow_back</span> VER OTROS HORARIOS
                                </button>
                                <div className="mb-10">
                                    <h3 className="text-2xl font-serif font-bold text-primary dark:text-white mb-2 tracking-tight">Detalles de la Reserva</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-[9px] font-bold px-3 py-1 bg-primary/5 dark:bg-white/10 text-primary/60 dark:text-white/60 rounded-full tracking-widest uppercase">📅 {new Date(formData.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                        <span className="text-[9px] font-bold px-3 py-1 bg-accent/10 dark:bg-accent/20 text-accent rounded-full tracking-widest uppercase">🕒 {new Date(formData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({formData.duration}H)</span>
                                    </div>
                                </div>

                                <form onSubmit={handleBook} className="space-y-6 flex-grow">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-primary/40 dark:text-white/30 uppercase tracking-[0.2em] ml-2">Descripción del Evento</label>
                                        <textarea
                                            required placeholder="Ej: Capacitación sobre el uso de la app CriisApp para el equipo de ventas..." value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-6 py-5 rounded-[24px] bg-white dark:bg-white/5 border-none dark:text-white text-sm outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium min-h-[120px] resize-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-primary/40 dark:text-white/30 uppercase tracking-[0.2em] ml-2">Código Autorizado</label>
                                        <input
                                            type="text" required placeholder="Ingresa tu código de autorización" value={formData.authCode}
                                            onChange={e => setFormData({ ...formData, authCode: e.target.value })}
                                            className="w-full px-6 py-5 rounded-[24px] bg-white dark:bg-white/5 border-none dark:text-white text-sm font-mono tracking-widest outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                                        />
                                    </div>

                                    {message.text && (
                                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`p-5 rounded-3xl text-[9px] font-bold tracking-[0.2em] text-center uppercase ${message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                            {message.text}
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit" disabled={loading}
                                        className="w-full py-6 rounded-[32px] bg-primary dark:bg-accent text-white dark:text-primary font-bold text-[10px] tracking-[0.4em] shadow-2xl hover:shadow-primary/40 dark:hover:shadow-accent/40 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                                    >
                                        {loading ? 'PROCESANDO...' : 'SOLICITAR CAPACITACIÓN'}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default BookingPage;
