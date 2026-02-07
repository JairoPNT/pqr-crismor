import React from 'react';
import { motion } from 'framer-motion';

const WelcomePage = ({ onNavigate }) => {
    return (
        <div className="container" style={{ textAlign: 'center', paddingTop: '10vh' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="glass-card"
                style={{ padding: '4rem', maxWidth: '800px', margin: '0 auto' }}
            >
                <motion.h1
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    style={{ fontSize: '4rem', marginBottom: '1rem', letterSpacing: '-1px' }}
                >
                    PQR-Crismor
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 1 }}
                    style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '3rem' }}
                >
                    Gestión Integral de Peticiones, Quejas y Reclamos <br />
                    <strong>Cristhel Moreno • Especialista en Dermatocosmiatría</strong>
                </motion.p>

                <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(139, 115, 85, 0.2)" }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-primary"
                        style={{ padding: '1.5rem 2.5rem', fontSize: '1.1rem' }}
                        onClick={() => onNavigate('public')}
                    >
                        🔍 Consultar mi Ticket
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05, background: "rgba(139, 115, 85, 0.1)" }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-outline"
                        style={{ padding: '1.5rem 2.5rem', fontSize: '1.1rem' }}
                        onClick={() => onNavigate('login')}
                    >
                        🔑 Acceso Gestor
                    </motion.button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{ marginTop: '4rem', color: 'var(--text-muted)' }}
            >
                <p>© 2026 PQR-Crismor | Belleza & Salud</p>
            </motion.div>
        </div>
    );
};

export default WelcomePage;
