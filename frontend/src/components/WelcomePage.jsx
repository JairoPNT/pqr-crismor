import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import logoSkinHealth from '../assets/logo_skinhealth.png';

const WelcomePage = ({ onNavigate, logo, activeManagers = [] }) => {
    // Para el diseño de Tailwind del documento, usaremos clases de utilidad
    // y manejaremos el modo oscuro mediante la clase 'dark' en el documento raíz.

    return (
        <div className="min-h-screen flex flex-col font-sans text-primary dark:text-gray-200 overflow-x-hidden selection:bg-accent/30 selection:text-white transition-colors duration-500">

            {/* Navbar */}
            <nav className="w-full px-6 py-4 lg:px-12 flex justify-between items-center relative z-20">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg shadow-secondary/20">
                        <span className="material-symbols-outlined text-xl">spa</span>
                    </div>
                    <span className="font-serif text-2xl font-bold tracking-tight text-primary dark:text-white">
                        CriisApp
                    </span>
                </div>

                {/* Botón Login Sutil para Gestor */}
                <button
                    onClick={() => onNavigate('login')}
                    className="group flex items-center gap-2 px-4 py-2 rounded-full border border-primary/10 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-colors text-primary/80 dark:text-white/80 text-sm font-medium"
                >
                    <span className="material-symbols-outlined text-lg group-hover:text-accent transition-colors">lock</span>
                    <span>Login</span>
                </button>
            </nav>

            {/* Contenido Principal */}
            <main className="flex-grow flex flex-col lg:flex-row items-center justify-center px-6 lg:px-12 py-8 gap-12 max-w-5xl mx-auto w-full z-10">

                {/* Columna Izquierda: Branding e Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex-1 text-center lg:text-left space-y-6 w-full"
                >
                    <div className="relative inline-block">
                        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tighter text-primary/90 dark:text-white font-montserrat transition-colors duration-500">
                            PQRS
                        </h1>
                        <div className="absolute -top-10 -right-6 sm:-top-16 sm:-right-8 text-accent/15 dark:text-accent/25 rotate-12 pointer-events-none select-none">
                            <span className="material-symbols-outlined text-[100px] sm:text-[140px] lg:text-[180px]">verified_user</span>
                        </div>
                    </div>

                    <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-primary dark:text-gray-100 leading-tight transition-colors duration-500">
                        Gestión Integral de Peticiones, <br className="hidden lg:block" />Quejas y Reclamos
                    </h2>

                    <div className="flex items-center justify-center lg:justify-start gap-4 py-2">
                        <div className="h-px w-12 bg-accent"></div>
                        <p className="font-serif italic text-base sm:text-lg text-primary/80 dark:text-gray-300">
                            Cristhel Moreno <span className="text-accent mx-1">•</span> Dermatocosmiatría
                        </p>
                    </div>

                    <p className="text-primary/70 dark:text-gray-300 leading-relaxed max-w-lg mx-auto lg:mx-0 font-light text-sm sm:text-base lg:text-lg transition-colors duration-500">
                        Bienvenido a nuestro portal de atención exclusivo. Su bienestar es nuestra prioridad.
                    </p>
                </motion.div>

                {/* Columna Derecha: Tarjeta de Acción Principal */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="flex-1 w-full max-w-sm lg:max-w-md flex flex-col justify-center"
                >
                    {/* Tarjeta 1: Pacientes */}
                    <div
                        onClick={() => onNavigate('public')}
                        className="glass-card p-6 sm:p-8 rounded-2xl group cursor-pointer relative overflow-hidden transform transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10"
                    >
                        {/* Decoración hover */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 dark:bg-accent/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700 ease-out"></div>

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="p-3 bg-white/80 dark:bg-white/10 rounded-xl text-secondary dark:text-accent shadow-sm dark:shadow-none transition-colors">
                                <span className="material-symbols-outlined text-3xl">search_check</span>
                            </div>
                            <span className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase bg-accent/5 dark:bg-accent/10 px-3 py-1 rounded-full border border-transparent dark:border-accent/20 h-fit">Pacientes</span>
                        </div>

                        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-primary dark:text-white mb-3 relative z-10 transition-colors">Consultar Ticket</h3>
                        <p className="text-sm sm:text-base text-primary/60 dark:text-gray-300 mb-8 font-light leading-relaxed relative z-10 transition-colors">
                            Verifique el estado de su solicitud actual en tiempo real y de forma segura a través de nuestro sistema unificado.
                        </p>

                        <button className="w-full py-4 bg-primary dark:bg-accent text-white dark:text-primary rounded-xl shadow-lg shadow-primary/20 dark:shadow-accent/20 flex items-center justify-center gap-2 group-hover:bg-primary/90 dark:group-hover:bg-accent/90 transition-all font-medium text-sm tracking-wide transform group-hover:-translate-y-1">
                            <span>Consultar Ahora</span>
                            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                    </div>

                </motion.div>
            </main>

            {/* Footer */}
            <footer className="w-full px-6 py-6 border-t border-primary/5 dark:border-white/5 bg-white/30 dark:bg-black/20 backdrop-blur-sm mt-auto relative z-10 transition-colors">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    <p>© 2024 CriisApp <span className="mx-2 text-accent">•</span> Excelance Dermatológica</p>

                    <div className="flex items-center gap-1.5 bg-white/50 dark:bg-white/5 px-4 py-2 rounded-full border border-white/50 dark:border-white/10 shadow-sm overflow-hidden">
                        <div className="flex -space-x-2 mr-2">
                            {activeManagers.length > 0 ? (
                                activeManagers.map((manager) => (
                                    <div key={manager.id} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-primary flex items-center justify-center overflow-hidden transition-transform hover:scale-110" title={manager.name || manager.username}>
                                        {manager.avatar ? (
                                            <img src={manager.avatar} alt={manager.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] text-white font-bold">{manager.username.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 flex items-center justify-center overflow-hidden">
                                    <img src={logo || logoSkinHealth} alt="Logo" className="w-full h-full object-contain" />
                                </div>
                            )}
                        </div>
                        <span className="text-primary/70 dark:text-gray-300 font-medium">Especialistas disponibles</span>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1"></div>
                    </div>
                </div>
            </footer>

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

export default WelcomePage;
