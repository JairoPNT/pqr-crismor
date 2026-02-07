import React from 'react';
import { motion } from 'framer-motion';
import logoSkinHealth from '../assets/logo_skinhealth.png';

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
                <img
                    src={logoSkinHealth}
                    alt="SkinHealth Logo"
                    style={{ width: '180px', marginBottom: '2.5rem' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
                <motion.h1
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    style={{ fontSize: '3.5rem', marginBottom: '1rem', letterSpacing: '-1.5px', color: 'var(--primary-earth)' }}
                >
                    SkinHealth PQRS
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 1 }}
                    style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '3rem' }}
                >
                    Gestión Integral de Peticiones, Quejas y Reclamos <br />
                    <strong>Cristhel Moreno • Dermatocosmiatría</strong>
                </motion.p>

                <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(41, 80, 38, 0.2)" }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-primary"
                        style={{ padding: '1.5rem 2.5rem', fontSize: '1.1rem' }}
                        onClick={() => onNavigate('public')}
                    >
                        🔍 Consultar mi Ticket
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05, background: "rgba(41, 80, 38, 0.05)" }}
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
                style={{ marginTop: '4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}
            >
                <p>© 2026 SkinHealth | PQRS Crismor</p>
            </motion.div>
        </div>
    );
};

export default WelcomePage;
