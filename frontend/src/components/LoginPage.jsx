import React, { useState } from 'react';
import { motion } from 'framer-motion';
import logoSkinHealth from '../assets/logo_skinhealth.png';
import API_URL from '../api';

const LoginPage = ({ onLogin, onBack, logo }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('pqr_user', JSON.stringify(data));
                onLogin(data);
            } else {
                setError(data.message || 'Error al iniciar sesión');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 font-sans text-primary dark:text-gray-200 overflow-hidden relative selection:bg-accent/30 selection:text-white transition-colors duration-500">

            {/* Elementos Decorativos de Fondo */}
            <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-primary/5 dark:bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Contenedor Principal (Tarjeta Login) */}
            <motion.main
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-[420px] relative z-10"
            >
                <div className="glass-card p-8 sm:p-10 rounded-3xl relative overflow-hidden">

                    {/* Header: Volver y Logo */}
                    <div className="flex flex-col items-center mb-8 relative">
                        {/* Link Volver */}
                        <button
                            onClick={onBack}
                            className="absolute left-0 top-1 flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-accent transition-colors group bg-none border-none p-0 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">arrow_back</span>
                            Volver
                        </button>

                        {/* Logo Animado */}
                        <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-xl shadow-secondary/20 mt-8 sm:mt-0 overflow-hidden">
                            <img
                                src={logo || logoSkinHealth}
                                alt="Logo"
                                className="w-10 h-10 object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<span class="material-symbols-outlined text-3xl">spa</span>';
                                }}
                            />
                        </div>

                        <h1 className="font-serif text-3xl font-bold text-primary dark:text-white tracking-tight text-center">
                            Acceso Gestor
                        </h1>
                        <p className="text-xs text-accent uppercase tracking-[0.2em] mt-2 font-semibold">Panel Administrativo</p>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center text-xs p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Input Usuario */}
                        <div className="space-y-2 group">
                            <label htmlFor="username" className="text-sm font-semibold text-primary/80 dark:text-gray-300 ml-1">Usuario</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors z-10">
                                    <span className="material-symbols-outlined text-[20px]">person</span>
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="Introduce tu usuario"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-black/50 border border-gray-300 dark:border-white/20 rounded-xl text-sm outline-none focus:bg-white dark:focus:bg-black/70 text-primary dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm relative z-0 transition-all focus:ring-2 focus:ring-accent/10"
                                    required
                                />
                            </div>
                        </div>

                        {/* Input Contraseña */}
                        <div className="space-y-2 group">
                            <label htmlFor="password" className="text-sm font-semibold text-primary/80 dark:text-gray-300 ml-1">Contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors z-10">
                                    <span className="material-symbols-outlined text-[20px]">lock</span>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3.5 bg-white dark:bg-black/50 border border-gray-300 dark:border-white/20 rounded-xl text-sm outline-none focus:bg-white dark:focus:bg-black/70 text-primary dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm relative z-0 transition-all focus:ring-2 focus:ring-accent/10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-accent transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Botón Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary dark:bg-accent text-white dark:text-primary rounded-xl shadow-lg shadow-primary/20 dark:shadow-accent/20 flex items-center justify-center gap-2 hover:bg-primary/90 dark:hover:bg-accent/90 transition-all font-medium text-sm tracking-wide transform hover:-translate-y-1 mt-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            <span>{loading ? 'Validando...' : 'Entrar al Sistema'}</span>
                            <span className="material-symbols-outlined text-sm">login</span>
                        </button>

                    </form>

                    {/* Footer Tarjeta */}
                    <div className="mt-8 text-center">
                        <p className="text-[10px] text-primary/40 dark:text-gray-500">
                            © 2024 PQRS CriisApp • Acceso Restringido
                        </p>
                    </div>

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

export default LoginPage;
