import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoSkinHealth from '../assets/logo_skinhealth.png';

const PublicTracker = ({ onBack, logo }) => {
    const [ticketId, setTicketId] = useState('');
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        setTicket(null);
        setLoading(true);

        try {
            const response = await fetch(`http://127.0.0.1:3000/api/tickets/public/${ticketId.trim().toUpperCase()}`);
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
        <div className="container">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem' }}>
                <img
                    src={logo || logoSkinHealth}
                    alt="Logo"
                    style={{ width: '180px', marginBottom: '2rem' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
                <h1 style={{ color: 'var(--primary-earth)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>SkinHealth PQRS</h1>
                <p style={{ color: 'var(--text-muted)' }}>Módulo de Consulta Ciudadana</p>
            </div>

            <button onClick={onBack} style={{ background: 'none', color: 'var(--text-muted)', marginBottom: '2rem', padding: 0, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>←</span> Volver al inicio
            </button>
            <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Consulta tu Caso</h2>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <input
                        className="input-field"
                        type="text"
                        value={ticketId}
                        onChange={(e) => setTicketId(e.target.value)}
                        placeholder="Nº de caso (Ej: PQR1A2B)"
                        required
                    />
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Buscando...' : 'Consultar'}
                    </button>
                </form>

                {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--error)', textAlign: 'center', marginBottom: '1rem' }}>{error}</motion.p>}

                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="loading-placeholder" style={{ height: '40px' }}></div>
                        <div className="loading-placeholder" style={{ height: '100px' }}></div>
                    </div>
                )}

                <AnimatePresence>
                    {ticket && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1.5rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>Estado: <span className={`status-badge status-${ticket.status.toLowerCase()}`}>{ticket.status}</span></h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Gestor asignado: {ticket.assignedTo?.username || 'Equipo Crismor'}</p>
                                </div>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '15px', marginBottom: '2rem', border: '1px solid rgba(0,0,0,0.03)' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Paciente:</p>
                                <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '1rem' }}>{ticket.patientName}</p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Descripción:</p>
                                <p>{ticket.description}</p>
                            </div>

                            <h4 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--pale-green)', width: 'fit-content', paddingBottom: '0.3rem' }}>Historial de Seguimiento</h4>

                            {ticket.followUps.length === 0 ? (
                                <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No hay actualizaciones todavía. Nuestro equipo está revisando tu caso.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                                    {ticket.followUps.map((fu, idx) => (
                                        <motion.div
                                            key={fu.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            style={{
                                                position: 'relative',
                                                paddingLeft: '2rem',
                                                paddingBottom: '2rem',
                                                borderLeft: idx === ticket.followUps.length - 1 ? 'none' : '2px solid var(--pale-green)'
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute',
                                                left: '-7px',
                                                top: '0',
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                background: 'var(--primary-earth)',
                                                border: '2px solid white'
                                            }}></div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(fu.createdAt).toLocaleDateString()}</p>
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <p style={{ fontWeight: 500 }}>Actualización Crismor:</p>
                                                <p style={{ fontSize: '0.95rem' }}>{fu.diagnosis}</p>
                                                {fu.bonusInfo && (
                                                    <div style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: 'var(--pale-green)', borderRadius: '10px', fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: 600 }}>
                                                        🎁 Beneficio: {fu.bonusInfo}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PublicTracker;
