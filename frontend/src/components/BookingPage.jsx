import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API_URL from '../api';

const BookingPage = ({ onBack, logo }) => {
    const [formData, setFormData] = useState({
        date: '',
        startTime: '',
        endTime: '',
        authCode: '',
        entityName: ''
    });
    const [availability, setAvailability] = useState(null); // null, 'available', 'busy', 'searching'
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (formData.date && formData.startTime && formData.endTime) {
            checkAvailability();
        }
    }, [formData.date, formData.startTime, formData.endTime]);

    const checkAvailability = async () => {
        setAvailability('searching');
        const start = `${formData.date}T${formData.startTime}:00`;
        const end = `${formData.date}T${formData.endTime}:00`;

        try {
            const response = await fetch(`${API_URL}/api/training/availability?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
            const data = await response.json();
            setAvailability(data.available ? 'available' : 'busy');
        } catch (error) {
            setAvailability(null);
            console.error('Error checking availability:', error);
        }
    };

    const handleBook = async (e) => {
        e.preventDefault();
        if (availability !== 'available') return;

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const start = `${formData.date}T${formData.startTime}:00`;
            const end = `${formData.date}T${formData.endTime}:00`;

            const response = await fetch(`${API_URL}/api/training/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startTime: start,
                    endTime: end,
                    authCode: formData.authCode,
                    entityName: formData.entityName
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: '¡Reserva realizada con éxito! Recibirás un correo de confirmación.' });
                setFormData({ date: '', startTime: '', endTime: '', authCode: '', entityName: '' });
                setAvailability(null);
            } else {
                setMessage({ type: 'error', text: data.message || 'Error al realizar la reserva' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión con el servidor' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-sidebar transition-colors flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-accent/5 dark:bg-accent/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl bg-white dark:bg-black/20 backdrop-blur-xl rounded-[40px] border border-gray-100 dark:border-white/5 shadow-2xl p-8 sm:p-12 z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <button
                        onClick={onBack}
                        className="self-start flex items-center gap-2 text-xs font-bold text-primary/50 dark:text-white/50 hover:text-accent transition-all mb-6 group"
                    >
                        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        VOLVER
                    </button>
                    <div className="p-4 bg-primary/5 dark:bg-white/5 rounded-3xl mb-4 border border-primary/10">
                        <span className="material-symbols-outlined text-4xl text-primary dark:text-accent">calendar_add_on</span>
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-primary dark:text-white text-center">Reserva de Capacitación</h2>
                    <p className="text-sm text-primary/60 dark:text-white/40 text-center mt-2 max-w-xs font-light">Seleccione su horario y valide su código de autorización corporativo.</p>
                </div>

                <form onSubmit={handleBook} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-accent uppercase tracking-widest block ml-2">Nombre de Entidad / Encargado</label>
                            <input
                                type="text"
                                required
                                value={formData.entityName}
                                onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
                                placeholder="Ej: SkinHealth - Carlos Fiallo"
                                className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-accent/30 dark:text-white transition-all outline-none text-sm shadow-inner"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-accent uppercase tracking-widest block ml-2">Fecha de Sesión</label>
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-accent/30 dark:text-white transition-all outline-none text-sm shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-accent uppercase tracking-widest block ml-2">Hora Inicio</label>
                            <input
                                type="time"
                                required
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-accent/30 dark:text-white transition-all outline-none text-sm shadow-inner"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-accent uppercase tracking-widest block ml-2">Hora Fin</label>
                            <input
                                type="time"
                                required
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-accent/30 dark:text-white transition-all outline-none text-sm shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Semáforo de Disponibilidad */}
                    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent transition-all">
                        <div className={`w-4 h-4 rounded-full transition-all duration-500 shadow-lg ${availability === 'available' ? 'bg-green-500 shadow-green-500/50' :
                                availability === 'busy' ? 'bg-red-500 shadow-red-500/50 scale-110 animate-pulse' :
                                    availability === 'searching' ? 'bg-orange-400 animate-bounce' :
                                        'bg-gray-300 dark:bg-gray-700'
                            }`}></div>
                        <div className="flex-grow">
                            <span className="text-xs font-bold text-primary/80 dark:text-gray-200">
                                {availability === 'available' ? 'Horario Disponible' :
                                    availability === 'busy' ? 'Horario Ocupado' :
                                        availability === 'searching' ? 'Consultando agenda...' :
                                            'Seleccione un horario'}
                            </span>
                        </div>
                        {availability === 'busy' && (
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Cerrado</span>
                        )}
                        {availability === 'available' && (
                            <span className="material-symbols-outlined text-green-500">task_alt</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-accent uppercase tracking-widest block ml-2">Código de Autorización Corporativo</label>
                        <input
                            type="text"
                            required
                            value={formData.authCode}
                            onChange={(e) => setFormData({ ...formData, authCode: e.target.value })}
                            placeholder="Ingrese su código (Ej: SKNXXXX)"
                            className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-accent/30 dark:text-white transition-all outline-none text-sm shadow-inner font-mono tracking-widest"
                        />
                    </div>

                    {message.text && (
                        <div className={`p-4 rounded-xl text-xs font-bold text-center animate-fade-in ${message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || availability !== 'available'}
                        className={`w-full py-5 rounded-2xl font-bold text-sm tracking-widest shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 ${availability === 'available'
                                ? 'bg-primary dark:bg-accent text-white dark:text-primary shadow-primary/20 dark:shadow-accent/20 hover:shadow-2xl translate-y-0 hover:-translate-y-1'
                                : 'bg-gray-200 dark:bg-white/5 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {loading ? 'PROCESANDO...' : 'SOLICITAR CAPACITACIÓN'}
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>

                    <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest">Validación Instantánea vía Google Calendar</p>
                </form>
            </motion.div>
        </div>
    );
};

export default BookingPage;
