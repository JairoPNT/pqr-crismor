import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoSkinHealth from '../assets/logo_skinhealth.png';
import API_URL from '../api';

const PublicTracker = ({ onBack, logo }) => {
    const [ticketId, setTicketId] = useState('');
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setTicket(null);
        setLoading(true);

        // Limpiar el ID para la búsqueda
        const cleanId = ticketId.trim().toUpperCase().replace(/-/g, '');

        try {
            const response = await fetch(`${API_URL}/api/tickets/public/${cleanId}`);
            const data = await response.json();

            if (response.ok) {
                setTicket(data);
            } else {
                setError(data.message || 'Caso no encontrado');
            }
        } catch (err) {
            setError('Error al consultar el caso');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 font-sans text-primary dark:text-gray-200 overflow-x-hidden relative selection:bg-accent/30 selection:text-white transition-colors duration-500">

            {/* Decoración de Fondo */}
            <div className="fixed top-[-10%] right-[-10%] w-96 h-96 bg-secondary/10 dark:bg-secondary/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-96 h-96 bg-primary/5 dark:bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Contenedor Principal */}
            <motion.main
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-[480px] relative z-10 my-8"
            >
                <div className="glass-card p-8 sm:p-12 rounded-[2rem] relative overflow-hidden transition-all duration-500">

                    {/* Link Volver */}
                    <button
                        onClick={onBack}
                        className="absolute left-8 top-8 flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-accent transition-colors group bg-none border-none p-0 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Inicio
                    </button>

                    {/* Header Original Centrado */}
                    <div className="flex flex-col items-center mb-8 mt-6 text-center">
                        {/* Logo */}
                        <div className="w-16 h-16 mb-5 rounded-full bg-white flex items-center justify-center shadow-xl shadow-black/5 overflow-hidden border border-gray-100">
                            <img
                                src={logo || logoSkinHealth}
                                alt="Logo"
                                className="w-14 h-14 object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<span class="material-symbols-outlined text-3xl text-primary">search_check</span>';
                                }}
                            />
                        </div>

                        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-primary dark:text-white tracking-tight">
                            Consulta tu Caso
                        </h1>
                        <p className="text-sm text-primary/60 dark:text-gray-300 mt-3 max-w-xs font-light">
                            Ingresa el código único de tu radicado para ver el estado en tiempo real.
                        </p>
                    </div>

                    {/* Formulario Vertical */}
                    <form onSubmit={handleSearch} className="space-y-6">
                        <div className="space-y-2 group text-left">
                            <label htmlFor="ticket-id" className="text-sm font-semibold text-primary/80 dark:text-gray-300 ml-1">Número de Ticket / Radicado</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors z-10">
                                    <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
                                </div>
                                <input
                                    type="text"
                                    id="ticket-id"
                                    placeholder="EJ: PQRAFAS12"
                                    value={ticketId}
                                    onChange={(e) => setTicketId(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-black/50 border border-gray-300 dark:border-white/20 rounded-xl text-base outline-none focus:bg-white dark:focus:bg-black/70 text-primary dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm relative z-0 tracking-wide uppercase transition-all focus:ring-2 focus:ring-accent/10 font-montserrat"
                                    required
                                />
                            </div>
                        </div>

                        {/* Botón Buscar */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary dark:bg-accent text-white dark:text-primary rounded-xl shadow-lg shadow-primary/20 dark:shadow-accent/20 flex items-center justify-center gap-2 hover:bg-primary/90 dark:hover:bg-accent/90 transition-all font-medium text-sm tracking-wide transform hover:-translate-y-1 mt-2 disabled:opacity-50"
                        >
                            <span>{loading ? 'Consultando...' : 'Consultar'}</span>
                            <span className="material-symbols-outlined text-xl">search</span>
                        </button>
                    </form>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-red-500 text-sm mt-4 font-medium"
                        >
                            {error}
                        </motion.p>
                    )}

                    {/* --- SECCIÓN DE RESULTADOS --- */}
                    <AnimatePresence>
                        {ticket && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-gray-200 dark:border-white/10 pt-8 mt-8 text-left"
                            >
                                {/* Encabezado del Estado */}
                                <div className="flex justify-between items-center mb-6 bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-white/50 dark:border-white/5">
                                    <div>
                                        <span className="text-xs text-primary/50 dark:text-gray-400 block mb-1">Estado Actual</span>
                                        <span className="text-secondary dark:text-green-400 font-bold text-lg tracking-wide uppercase">{ticket.status}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Fecha de Radicado</span>
                                        <span className="text-sm font-medium text-primary dark:text-white">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="flex items-center justify-between font-montserrat">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">ID de Caso:</span>
                                        <span className="text-sm font-bold text-primary dark:text-white uppercase tracking-wider">{ticket.id.replace(/-/g, '')}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Gestor asignado:</span>
                                        <span className="text-sm font-medium text-primary dark:text-white">{ticket.assignedTo?.username || 'Equipo Crismor'}</span>
                                    </div>

                                    {/* Card Interna para Paciente y Descripción */}
                                    <div className="bg-white/60 dark:bg-black/20 rounded-xl p-5 border border-gray-100 dark:border-white/5 shadow-inner">
                                        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-white/10">
                                            <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Paciente</p>
                                            <p className="text-lg font-serif font-bold text-primary dark:text-white">{ticket.patientName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Descripción</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                                "{ticket.description || 'Sin descripción'}"
                                            </p>
                                        </div>
                                    </div>

                                    {/* Historial */}
                                    <div className="pt-4">
                                        <h3 className="font-serif font-bold text-primary dark:text-white text-base mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-accent text-lg">history</span>
                                            Historial de Seguimiento
                                        </h3>

                                        {ticket.followUps.length === 0 ? (
                                            <div className="bg-light dark:bg-white/5 rounded-lg p-6 text-center border border-dashed border-gray-300 dark:border-white/10">
                                                <p className="text-xs text-gray-400 italic">
                                                    No hay actualizaciones todavía. Nuestro equipo está revisando tu caso.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6 relative ml-2 px-4 border-l-2 border-accent/20">
                                                {ticket.followUps.map((fu, idx) => (
                                                    <div key={fu.id} className="relative pb-2">
                                                        <div className="absolute -left-[25px] top-1.5 w-3 h-3 rounded-full bg-accent shadow-sm border-2 border-white dark:border-darkbg"></div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mb-1">{new Date(fu.createdAt).toLocaleDateString()}</p>
                                                        <p className="text-xs font-semibold text-primary dark:text-white mb-1">Actualización Crismor:</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">"{fu.diagnosis}"</p>
                                                        {fu.bonusInfo && (
                                                            <div className="mt-2 p-2 bg-accent/10 border border-accent/20 rounded-lg text-accent text-xs font-bold flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-sm">redeem</span>
                                                                Beneficio: {fu.bonusInfo}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.main>

            {/* Botón Flotante Tema */}
            <button
                onClick={() => document.documentElement.classList.toggle('dark')}
                className="fixed bottom-6 right-6 w-12 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur text-primary dark:text-accent rounded-full shadow-lg border border-white dark:border-gray-700 flex items-center justify-center hover:scale-110 transition-all z-50 group"
            >
                <span className="material-symbols-outlined text-xl group-hover:rotate-180 transition-transform duration-500 dark:hidden block">dark_mode</span>
                <span className="material-symbols-outlined text-xl group-hover:rotate-180 transition-transform duration-500 hidden dark:block">light_mode</span>
            </button>

        </div>
    );
};

export default PublicTracker;
