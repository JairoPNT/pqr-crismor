import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import logoSkinHealth from '../assets/logo_skinhealth.png';
import API_URL from '../api';

const Dashboard = ({ user: initialUser, onLogout, initialLogo }) => {
    const [user, setUser] = useState(initialUser);
    const [logo, setLogo] = useState(initialLogo);
    const [activeTab, setActiveTab] = useState('new');
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchTickets();
        fetchStats();
        if (user.role === 'SUPERADMIN') fetchUsers();
    }, [user]);

    // Mobile Responsive Logic
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth >= 1024) setSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchTickets = async () => {
        try {
            const response = await fetch(`${API_URL}/api/tickets`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            if (response.ok) setTickets(data);
        } catch (err) { console.error('Error fetching tickets', err); }
    };

    const fetchStats = async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await fetch(`${API_URL}/api/tickets/stats?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            if (response.ok) setStats(data);
        } catch (err) { console.error('Error fetching stats', err); }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/users`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            if (response.ok) setUsers(data);
        } catch (err) { console.error('Error fetching users', err); }
    };

    const handleProfileUpdate = (updatedData) => {
        setUser({ ...user, ...updatedData });
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
            {/* Mobile Actions Overlay */}
            {isMobile && !sidebarOpen && (
                <div style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 100, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        style={{ background: 'var(--primary-earth)', color: 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', fontSize: '1.5rem' }}
                    >
                        ☰
                    </button>
                    {/* Mobile Logo for context when sidebar is closed */}
                    <div style={{ background: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src={logo || logoSkinHealth} alt="Logo" style={{ height: '25px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <AnimatePresence>
                {(!isMobile || sidebarOpen) && (
                    <>
                        {isMobile && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setSidebarOpen(false)}
                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
                            />
                        )}
                        <motion.div
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{
                                width: '280px',
                                background: 'var(--primary-earth)',
                                color: 'white',
                                padding: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                position: isMobile ? 'fixed' : 'relative',
                                top: 0, bottom: 0, left: 0,
                                zIndex: 100,
                                height: '100vh',
                                boxShadow: isMobile ? '4px 0 20px rgba(0,0,0,0.2)' : 'none'
                            }}
                        >
                            {/* Close button for mobile */}
                            {isMobile && (
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
                                >
                                    ✕
                                </button>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
                                <img
                                    src={logo || logoSkinHealth}
                                    alt="Logo"
                                    style={{ width: '120px', marginBottom: '1.5rem', filter: 'brightness(0) invert(1)' }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {user.avatar ? (
                                        <img src={user.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white' }} />
                                    ) : (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👤</div>
                                    )}
                                    <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>PQR-Crismor</h2>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                                <p style={{ opacity: 0.8, fontSize: '0.85rem' }}>Bienvenido,</p>
                                <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>{user.name || user.username}</p>
                                <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>{user.role}</span>
                            </div>

                            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
                                <TabButton active={activeTab === 'new'} onClick={() => { setActiveTab('new'); if (isMobile) setSidebarOpen(false); }} label="🎫 Nuevo PQR" />
                                <TabButton active={activeTab === 'follow'} onClick={() => { setActiveTab('follow'); if (isMobile) setSidebarOpen(false); }} label="📋 Gestión Casos" />
                                <TabButton active={activeTab === 'reports'} onClick={() => { setActiveTab('reports'); if (isMobile) setSidebarOpen(false); }} label="📊 Informes" />
                                <TabButton active={activeTab === 'stats'} onClick={() => { setActiveTab('stats'); if (isMobile) setSidebarOpen(false); }} label="📈 Estadísticas" />
                                {user.role === 'SUPERADMIN' && (
                                    <TabButton active={activeTab === 'users'} onClick={() => { setActiveTab('users'); if (isMobile) setSidebarOpen(false); }} label="👥 Usuarios" />
                                )}
                            </nav>

                            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <TabButton active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); if (isMobile) setSidebarOpen(false); }} label="👤 Mi Perfil" />
                                <button
                                    onClick={onLogout}
                                    className="btn-outline"
                                    style={{ border: '1px solid rgba(255,255,255,0.3)', color: 'white', marginTop: '0.3rem', padding: '0.6rem' }}
                                >
                                    Cerrar Sesión
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div style={{ flex: 1, padding: isMobile ? '5rem 1rem 2rem 1rem' : '3rem', overflowY: 'auto', background: '#F4F7F4', width: '100%' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {activeTab === 'new' && <NewTicketForm user={user} isMobile={isMobile} onSuccess={() => { fetchTickets(); setActiveTab('follow'); }} />}
                        {activeTab === 'follow' && <TicketList tickets={tickets} user={user} users={users} isMobile={isMobile} onUpdate={fetchTickets} />}
                        {activeTab === 'stats' && <StatsView stats={stats} users={users} user={user} isMobile={isMobile} onRefresh={fetchStats} />}
                        {activeTab === 'reports' && <ReportsView tickets={tickets} user={user} users={users} isMobile={isMobile} />}
                        {activeTab === 'profile' && <ProfileView user={user} isMobile={isMobile} onUpdate={handleProfileUpdate} />}
                        {activeTab === 'users' && user.role === 'SUPERADMIN' && <UserManagement user={user} users={users} isMobile={isMobile} onUpdate={fetchUsers} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, label }) => (
    <motion.button
        whileHover={{ x: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        style={{
            padding: '1rem',
            textAlign: 'left',
            borderRadius: '12px',
            background: active ? 'white' : 'transparent',
            color: active ? 'var(--primary-earth)' : 'white',
            fontWeight: active ? '600' : '400',
            transition: 'background 0.3s, color 0.3s'
        }}
    >
        {label}
    </motion.button>
);


const NewTicketForm = ({ user, onSuccess, isMobile }) => {
    const [formData, setFormData] = useState({
        patientName: '', contactMethod: '', city: '', phone: '', email: '', description: ''
    });
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        photos.forEach(photo => data.append('photos', photo));

        try {
            const response = await fetch(`${API_URL}/api/tickets`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: data
            });
            if (response.ok) onSuccess();
        } catch (err) { alert('Error al crear ticket'); }
        finally { setLoading(false); }
    };

    return (
        <div className="glass-card" style={{ maxWidth: '800px' }}>
            <h3 style={{ marginBottom: '2rem' }}>Registrar Nuevo Caso</h3>
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '1.5rem' }}>
                    <div className="form-group">
                        <label className="form-label">Nombre del Paciente</label>
                        <input className="input-field" value={formData.patientName} onChange={e => setFormData({ ...formData, patientName: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Ciudad</label>
                        <input className="input-field" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Medio de Contacto</label>
                        <input className="input-field" value={formData.contactMethod} onChange={e => setFormData({ ...formData, contactMethod: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Teléfono</label>
                        <input className="input-field" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Correo</label>
                        <input className="input-field" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Descripción del Caso</label>
                    <textarea
                        className="input-field"
                        style={{ height: '100px', resize: 'vertical' }}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Fotos de Referencia (Máx 3)</label>
                    <input type="file" multiple onChange={e => setPhotos([...e.target.files].slice(0, 3))} />
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '1rem 3rem' }}>
                    {loading ? 'Generando...' : 'Generar Ticket'}
                </button>
            </form>
        </div>
    );
};

const TicketList = ({ tickets, user, users, onUpdate, isMobile }) => {
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [reassigning, setReassigning] = useState(null);

    const handleReassign = async (ticketId, userId) => {
        try {
            const response = await fetch(`${API_URL}/api/tickets/${ticketId}/reassign`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ assignedToId: userId })
            });
            if (response.ok) {
                setReassigning(null);
                onUpdate();
            }
        } catch (err) { alert('Error al reasignar'); }
    };

    return (
        <div>
            <h3 style={{ marginBottom: '2rem' }}>Gestión de Casos ({tickets.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tickets.map((t, idx) => {
                    const isOwner = t.assignedToId === user.id || user.role === 'SUPERADMIN';
                    return (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-card"
                            style={{
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                justifyContent: 'space-between',
                                alignItems: isMobile ? 'flex-start' : 'center',
                                gap: isMobile ? '1rem' : '0',
                                padding: '1.2rem 2rem'
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.3rem' }}>
                                    <p style={{ fontWeight: '600', color: 'var(--primary-earth)', margin: 0 }} title={t.id}>
                                        {t.id.length > 8 ? t.id.substring(0, 8) + '...' : t.id}
                                    </p>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gestor: {t.assignedTo?.username || 'Sin asignar'}</span>
                                </div>
                                <p style={{ fontWeight: '500', marginBottom: '0.3rem' }}>{t.patientName}</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.city} • {new Date(t.createdAt).toLocaleDateString()}</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '0.8rem' : '1.5rem', width: isMobile ? '100%' : 'auto' }}>
                                <span className={`status-badge status-${t.status.toLowerCase()}`}>{t.status}</span>

                                {user.role === 'SUPERADMIN' && (
                                    <div style={{ position: 'relative' }}>
                                        <button className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setReassigning(reassigning === t.id ? null : t.id)}>
                                            Reasignar
                                        </button>
                                        <AnimatePresence>
                                            {reassigning === t.id && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: '110%', right: 0, background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderRadius: '10px', zIndex: 10, width: '220px', padding: '0.8rem' }}>
                                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Asignar a:</label>
                                                    <select
                                                        className="input-field"
                                                        style={{ fontSize: '0.85rem', padding: '0.4rem' }}
                                                        value={t.assignedToId}
                                                        onChange={(e) => handleReassign(t.id, e.target.value)}
                                                    >
                                                        <option value="">Seleccionar gestor...</option>
                                                        {users.map(u => (
                                                            <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                                                        ))}
                                                    </select>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {isOwner ? (
                                    <button className="btn-primary" style={{ padding: '0.5rem 1.2rem', width: isMobile ? '100%' : 'auto' }} onClick={() => setSelectedTicket(t)}>Gestionar</button>
                                ) : (
                                    <button className="btn-outline" style={{ padding: '0.5rem 1.2rem', opacity: 0.5, cursor: 'not-allowed', width: isMobile ? '100%' : 'auto' }} disabled>Lectura</button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <AnimatePresence>
                {selectedTicket && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="glass-card"
                            style={{ background: 'white', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h4>Gestión de Ticket: {selectedTicket.id}</h4>
                                <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', fontSize: '1.5rem', opacity: 0.5 }}>✕</button>
                            </div>
                            <FollowUpForm ticket={selectedTicket} user={user} onDone={() => { setSelectedTicket(null); onUpdate(); }} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FollowUpForm = ({ ticket, user, onDone }) => {
    const [form, setForm] = useState({ content: '', diagnosis: '', protocol: '', bonusInfo: '', status: ticket.status });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await fetch(`${API_URL}/api/tickets/${ticket.id}/follow-up`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify(form)
            });
            onDone();
        } catch (err) { alert('Error al actualizar'); }
        finally { setSubmitting(false); }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                    <label className="form-label">Diagnóstico</label>
                    <input className="input-field" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} required />
                </div>
                <div className="form-group">
                    <label className="form-label">Bonificación/Obsequio</label>
                    <input className="input-field" value={form.bonusInfo} onChange={e => setForm({ ...form, bonusInfo: e.target.value })} />
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">Protocolo de Procedimiento</label>
                <textarea className="input-field" style={{ height: '80px' }} value={form.protocol} onChange={e => setForm({ ...form, protocol: e.target.value })} />
            </div>
            <div className="form-group">
                <label className="form-label">Cambiar Estado</label>
                <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="INICIAL">Inicial</option>
                    <option value="EN_SEGUIMIENTO">En Seguimiento</option>
                    <option value="FINALIZADO">Finalizado</option>
                </select>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}>
                {submitting ? 'Guardando...' : 'Guardar Gestión'}
            </button>
        </form>
    );
};

const ReportsView = ({ tickets, user, users, isMobile }) => {
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedGestor, setSelectedGestor] = useState('all');
    const [filteredTickets, setFilteredTickets] = useState([]);

    useEffect(() => {
        const filtered = tickets.filter(t => {
            const ticketDate = new Date(t.createdAt).toISOString().split('T')[0];
            const dateMatch = ticketDate >= startDate && ticketDate <= endDate;
            const gestorMatch = selectedGestor === 'all' || t.assignedToId === parseInt(selectedGestor);
            return dateMatch && gestorMatch;
        });
        setFilteredTickets(filtered);
    }, [startDate, endDate, selectedGestor, tickets]);

    const totalCommission = filteredTickets.length * 70000;

    const generatePDF = () => {
        const doc = new jsPDF();
        const now = new Date().toLocaleString();

        doc.setFontSize(22);
        doc.setTextColor(41, 80, 38);
        doc.text('Reporte de Gestión PQR-Crismor', 20, 30);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Generado por: ${user.name || user.username}`, 20, 50);
        doc.text(`Fecha del Reporte: ${now}`, 20, 60);
        doc.text(`Periodo: desde ${startDate} hasta ${endDate}`, 20, 70);
        if (selectedGestor !== 'all') {
            const gName = users.find(u => u.id === parseInt(selectedGestor))?.username;
            doc.text(`Gestor: ${gName}`, 20, 80);
        }

        doc.line(20, 85, 190, 85);

        doc.setFontSize(14);
        doc.text('Resumen del Periodo', 20, 100);
        doc.text(`Casos gestionados: ${filteredTickets.length}`, 30, 110);
        doc.text(`Valor total comisionado: $${totalCommission.toLocaleString()} COP`, 30, 120);

        doc.setFontSize(10);
        doc.text('Detalle de Casos:', 20, 140);
        filteredTickets.forEach((t, i) => {
            const y = 150 + (i * 10);
            if (y < 280) {
                doc.text(`${t.id} - ${t.patientName} (${t.city}) - ${new Date(t.createdAt).toLocaleDateString()}`, 25, y);
            }
        });

        doc.save(`Reporte_PQR_${user.username}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="glass-card">
            <h3 style={{ marginBottom: '2rem' }}>Generar Informe de Gestión</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Desde</label>
                    <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Hasta</label>
                    <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                {user.role === 'SUPERADMIN' && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Filtrar por Gestor</label>
                        <select className="input-field" value={selectedGestor} onChange={e => setSelectedGestor(e.target.value)}>
                            <option value="all">Todos los gestores</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                        </select>
                    </div>
                )}
                <button className="btn-primary" onClick={generatePDF}>
                    📥 Descargar Informe PDF
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                <div style={{ padding: '2rem', background: 'white', borderRadius: '15px', border: '1px solid rgba(41, 80, 38, 0.1)' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Casos en el periodo</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{filteredTickets.length}</p>
                </div>
                <div style={{ padding: '2rem', background: 'white', borderRadius: '15px', border: '1px solid rgba(41, 80, 38, 0.1)' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Comisionado</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-earth)' }}>
                        ${totalCommission.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

const UserManagement = ({ user, users, onUpdate, isMobile }) => {
    const [editingUser, setEditingUser] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify(editingUser)
            });
            if (response.ok) {
                setEditingUser(null);
                onUpdate();
            }
        } catch (err) { alert('Error al actualizar usuario'); }
        finally { setLoading(false); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0 }}>Administración de Usuarios y Gestores</h3>
                <button className="btn-primary" onClick={() => setIsCreating(true)}>+ Nuevo Gestor</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
                {users.map(u => (
                    <motion.div key={u.id} className="glass-card" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: '1.5rem', padding: '1.5rem' }}>
                        {u.avatar ? (
                            <img src={u.avatar} alt="Avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--pale-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👤</div>
                        )}
                        <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.2rem' }}>{u.name || u.username}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>@{u.username}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{u.email || 'Sin correo'}</p>
                            <span style={{ fontSize: '0.75rem', background: 'var(--pale-green)', padding: '2px 8px', borderRadius: '10px' }}>{u.role}</span>
                        </div>
                        <button className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setEditingUser(u)}>Editar</button>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {editingUser && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ background: 'white', width: '90%', maxWidth: '500px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h4>Editar Usuario: {editingUser.username}</h4>
                                <button onClick={() => setEditingUser(null)} style={{ background: 'none', fontSize: '1.2rem' }}>✕</button>
                            </div>
                            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Nombre Completo</label>
                                    <input className="input-field" value={editingUser.name || ''} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Usuario / Correo / ID</label>
                                    <input className="input-field" value={editingUser.username} onChange={e => setEditingUser({ ...editingUser, username: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Rol</label>
                                    <select className="input-field" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                                        <option value="GESTOR">Gestor</option>
                                        <option value="SUPERADMIN">Super Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Correo</label>
                                    <input className="input-field" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Cambios'}</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCreating && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ background: 'white', width: '90%', maxWidth: '500px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h4>Registrar Nuevo Gestor</h4>
                                <button onClick={() => setIsCreating(false)} style={{ background: 'none', fontSize: '1.2rem' }}>✕</button>
                            </div>
                            <NewUserForm user={user} onDone={() => { setIsCreating(false); onUpdate(); }} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const NewUserForm = ({ user, onDone }) => {
    const [formData, setFormData] = useState({ username: '', name: '', email: '', password: '', role: 'GESTOR', phone: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify(formData)
            });
            if (response.ok) onDone();
            else {
                const data = await response.json();
                alert(data.message || 'Error al crear usuario');
            }
        } catch (err) { alert('Error de conexión'); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="form-group">
                <label className="form-label">Usuario (Correo, Tel, etc.)</label>
                <input className="input-field" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
            </div>
            <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input className="input-field" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
            </div>
            <div className="form-group">
                <label className="form-label">Correo</label>
                <input className="input-field" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="form-group">
                <label className="form-label">Rol</label>
                <select className="input-field" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                    <option value="GESTOR">Gestor</option>
                    <option value="SUPERADMIN">Super Admin</option>
                </select>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Registrando...' : 'Registrar Gestor'}</button>
        </form>
    );
};

const StatsView = ({ stats, users, user, onRefresh, isMobile }) => {
    const [filters, setFilters] = useState({ city: '', gestorId: '', status: '' });

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onRefresh(newFilters);
    };

    if (!stats) return <div className="loading-placeholder" style={{ height: '200px' }}></div>;
    return (
        <div>
            <h3 style={{ marginBottom: '2rem' }}>Análisis de Gestión Estratégica</h3>

            <div className="glass-card" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.5rem', marginBottom: '2rem', padding: '1.5rem', alignItems: isMobile ? 'stretch' : 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Ciudad</label>
                    <select className="input-field" value={filters.city} onChange={e => handleFilterChange('city', e.target.value)}>
                        <option value="">Todas</option>
                        {stats.cityStats.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                    </select>
                </div>
                {user.role === 'SUPERADMIN' && (
                    <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Gestor</label>
                        <select className="input-field" value={filters.gestorId} onChange={e => handleFilterChange('gestorId', e.target.value)}>
                            <option value="">Todos</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                        </select>
                    </div>
                )}
                <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Estado</label>
                    <select className="input-field" value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
                        <option value="">Todos</option>
                        <option value="PROCESO">En Proceso</option>
                        <option value="CERRADO">Cerrados (Finalizados)</option>
                    </select>
                </div>
                <button className="btn-outline" style={{ padding: '0.8rem' }} onClick={() => handleFilterChange('reset', '')}>🔄</button>
            </div>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <StatCard label="Total PQRs" value={stats.totalTickets} color="var(--primary-earth)" />
                <StatCard label="Finalizados" value={stats.resolvedTickets} color="var(--success)" />
                <StatCard label="Ingresos" value={`$${stats.totalRevenue.toLocaleString()}`} color="#3a6b36" />
            </div>

            <div className="glass-card">
                <h4>Distribución Geográfica</h4>
                <div style={{ marginTop: '1.5rem' }}>
                    {stats.cityStats.map(c => (
                        <div key={c.city} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <span style={{ fontWeight: '500' }}>{c.city}</span>
                            <span className="status-badge" style={{ background: 'var(--pale-green)', color: 'var(--text-dark)' }}>{c._count._all} casos</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, color }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="glass-card"
        style={{ textAlign: 'center', borderTop: `6px solid ${color}`, padding: '2rem 1rem' }}
    >
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
        <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: color }}>{value}</p>
    </motion.div>
);
const ProfileView = ({ user, onUpdate, isMobile }) => {
    const [formData, setFormData] = useState({
        username: user.username,
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const response = await fetch(`${API_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (response.ok) {
                onUpdate(data);
                setMessage({ type: 'success', text: 'Perfil actualizado con éxito' });
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (err) { setMessage({ type: 'error', text: 'Error al actualizar' }); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
            <div className="glass-card">
                <h3 style={{ marginBottom: '2rem' }}>Configuración de Perfil</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nombre Completo</label>
                        <input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nombre de Usuario / Login</label>
                        <input className="input-field" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Correo Electrónico</label>
                        <input className="input-field" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <hr style={{ margin: '2rem 0', opacity: 0.1 }} />
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Seguridad (Opcional)</p>
                    <div className="form-group">
                        <label className="form-label">Contraseña Actual</label>
                        <input className="input-field" type="password" value={formData.currentPassword} onChange={e => setFormData({ ...formData, currentPassword: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nueva Contraseña</label>
                        <input className="input-field" type="password" value={formData.newPassword} onChange={e => setFormData({ ...formData, newPassword: e.target.value })} />
                    </div>
                    {message && <p style={{ color: message.type === 'success' ? 'var(--success)' : 'var(--error)', marginBottom: '1rem' }}>{message.text}</p>}
                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Actualizando...' : 'Guardar Cambios'}</button>
                </form>
            </div>

            {user.role === 'SUPERADMIN' && <BrandManagement user={user} />}
        </div>
    );
};

const BrandManagement = ({ user }) => {
    const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'file'
    const [logoUrl, setLogoUrl] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleUpdateLogo = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        if (uploadMode === 'file' && logoFile) {
            formData.append('logo', logoFile);
        } else {
            formData.append('logoUrl', logoUrl);
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/settings`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                alert('Logo actualizado exitosamente. Reinicia la página para ver los cambios.');
                if (data.logoUrl) setLogoUrl(data.logoUrl);
            } else {
                alert(data.message || 'Error al actualizar logo');
            }
        } catch (err) {
            console.error(err);
            alert('Error al actualizar marca');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card">
            <h3 style={{ marginBottom: '2rem' }}>🎨 Gestión de Marca</h3>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    type="button"
                    className={uploadMode === 'url' ? 'btn-primary' : 'btn-outline'}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => setUploadMode('url')}
                >
                    Enlace Externo
                </button>
                <button
                    type="button"
                    className={uploadMode === 'file' ? 'btn-primary' : 'btn-outline'}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => setUploadMode('file')}
                >
                    Subir Archivo
                </button>
            </div>

            <form onSubmit={handleUpdateLogo}>
                {uploadMode === 'url' ? (
                    <div className="form-group">
                        <label className="form-label">URL del Logo</label>
                        <input
                            className="input-field"
                            placeholder="https://ejemplo.com/logo.png"
                            value={logoUrl}
                            onChange={e => setLogoUrl(e.target.value)}
                        />
                    </div>
                ) : (
                    <div className="form-group">
                        <label className="form-label">Seleccionar Imagen (PNG/JPG)</label>
                        <input
                            type="file"
                            className="input-field"
                            accept="image/*"
                            onChange={e => setLogoFile(e.target.files[0])}
                        />
                    </div>
                )}
                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'Procesando...' : 'Actualizar Identidad Visual'}
                </button>
            </form>

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '15px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Vista previa del logo:</p>
                <div style={{ background: 'var(--primary-earth)', padding: '1rem', display: 'inline-block', borderRadius: '10px' }}>
                    <img src={logoUrl || logoSkinHealth} alt="Preview" style={{ maxWidth: '120px', maxHeight: '60px', objectFit: 'contain' }} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
