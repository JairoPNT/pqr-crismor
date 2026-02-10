import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import logoSkinHealth from '../assets/logo_skinhealth.png';
import API_URL from '../api';

const Dashboard = ({ user: initialUser, onLogout, initialLogo }) => {
    const [user, setUser] = useState(initialUser);
    const [view, setView] = useState('new');
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [logoUrl, setLogoUrl] = useState(initialLogo);
    const [horizontalLogoUrl, setHorizontalLogoUrl] = useState('');
    const [panelLogoUrl, setPanelLogoUrl] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showArchived, setShowArchived] = useState(false);
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

    const toggleDarkMode = () => {
        const newMode = !isDark;
        setIsDark(newMode);
        document.documentElement.classList.toggle('dark', newMode);
    };

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth >= 1024) setIsSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);

        // Sync user role and profile on mount
        const syncProfile = async () => {
            try {
                const response = await fetch(`${API_URL}/api/auth/profile`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (response.ok) {
                    const latestUser = await response.json();
                    setUser(prev => ({ ...prev, ...latestUser }));
                    localStorage.setItem('pqr_user', JSON.stringify({ ...user, ...latestUser }));
                }
            } catch (err) {
                console.error('Error syncing profile:', err);
            }
        };

        syncProfile();
        fetchTickets();
        fetchStats();
        fetchSettings();
        if (user.role === 'SUPERADMIN') fetchUsers();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [showArchived]);

    const fetchTickets = async () => {
        try {
            const response = await fetch(`${API_URL}/api/tickets?archived=${showArchived}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            setTickets(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching tickets:', err);
            setTickets([]);
        }
    };

    const fetchStats = async (filters = {}) => {
        try {
            const params = new URLSearchParams(filters);
            const response = await fetch(`${API_URL}/api/tickets/stats?${params}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            setStats(data);
        } catch (err) { console.error('Error fetching stats:', err); }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/users`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setUsers([]);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/settings`);
            if (response.ok) {
                const data = await response.json();
                if (data.logoUrl) setLogoUrl(data.logoUrl);
                if (data.horizontalLogoUrl) setHorizontalLogoUrl(data.horizontalLogoUrl);
                if (data.panelLogoUrl) setPanelLogoUrl(data.panelLogoUrl);
            }
        } catch (err) { console.error('Error fetching settings:', err); }
    };

    const handleProfileUpdate = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem('pqr_user', JSON.stringify(newUser));
        if (updatedData.avatar) {
            if (user.role === 'SUPERADMIN') fetchUsers();
        }
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const navItems = [
        { id: 'new', label: 'Nuevo PQR', icon: 'add_box' },
        { id: 'list', label: 'Gestión Casos', icon: 'folder_managed' },
        { id: 'reports', label: 'Informes', icon: 'analytics' },
        { id: 'stats', label: 'Estadísticas', icon: 'bar_chart' },
        { id: 'profile', label: 'Mi Perfil', icon: 'person', mt: 'mt-8' }
    ];

    if (user.role === 'SUPERADMIN' || user.role === 'GESTOR') {
        if (user.role === 'SUPERADMIN') navItems.push({ id: 'users', label: 'Gestión Usuarios', icon: 'group' });
        navItems.push({ id: 'trainings', label: 'Capacitaciones', icon: 'calendar_month' });
        if (user.role === 'SUPERADMIN') navItems.push({ id: 'settings', label: 'Configuración', icon: 'settings' });
    }

    const viewTitleMap = {
        'new': { title: 'Registrar Nuevo Caso', desc: 'Ingresa los detalles del paciente para generar un número de radicado PQR.' },
        'list': {
            title: showArchived ? `Historial de Archivados (${tickets.length})` : `Gestión de Casos (${tickets.length})`,
            desc: showArchived ? 'Consulta tickets que han sido archivados para histórico.' : 'Administra y realiza el seguimiento de las PQRs registradas.'
        },
        'reports': { title: 'Informes de Gestión', desc: 'Genera reportes detallados y descarga en formato PDF.' },
        'stats': { title: 'Análisis de Gestión', desc: 'Monitoreo en tiempo real del rendimiento y distribución de PQRs.' },
        'users': { title: 'Gestión de Usuarios', desc: 'Administra los accesos y roles de los gestores del sistema.' },
        'trainings': { title: 'Gestión de Capacitaciones', desc: 'Administra y supervisa las reservas de capacitación de las entidades.' },
        'profile': { title: 'Mi Perfil', desc: 'Gestiona tu información personal y credenciales de acceso.' },
        'settings': { title: 'Identidad Visual', desc: 'Personaliza el logotipo y favicon de la aplicación.' }
    };

    const renderContent = () => {
        switch (view) {
            case 'new': return <NewTicketForm user={user} onSuccess={() => { setView('list'); fetchTickets(); }} isMobile={isMobile} />;
            case 'list': return <TicketList tickets={tickets} user={user} users={users} onUpdate={fetchTickets} isMobile={isMobile} showArchived={showArchived} setShowArchived={setShowArchived} />;
            case 'reports': return <ReportsView tickets={tickets} user={user} users={users} isMobile={isMobile} />;
            case 'stats': return <StatsView stats={stats} users={users} user={user} onRefresh={fetchStats} isMobile={isMobile} />;
            case 'users': return <UserManagement user={user} users={users} onUpdate={fetchUsers} isMobile={isMobile} />;
            case 'trainings': return <TrainingsView user={user} isMobile={isMobile} />;
            case 'profile': return <ProfileView user={user} onUpdate={handleProfileUpdate} isMobile={isMobile} />;
            case 'settings': return <BrandManagement user={user} />;
            default: return <NewTicketForm user={user} onSuccess={() => { setView('list'); fetchTickets(); }} isMobile={isMobile} />;
        }
    };

    return (
        <div className="flex bg-light dark:bg-darkbg text-[#1A2B2A] dark:text-text-dark h-screen overflow-hidden transition-colors duration-500 w-full">
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-sidebar dark:bg-sidebar-dark text-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none h-full`}>
                <div className="p-8 flex flex-col items-center border-b border-white/10">
                    <div className="w-32 h-32 flex items-center justify-center mb-4 transition-all">
                        <img
                            src={panelLogoUrl || logoUrl || logoSkinHealth}
                            alt="Panel Logo"
                            className="w-full h-full object-contain drop-shadow-2xl"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<span class="material-symbols-outlined text-6xl text-secondary">spa</span>';
                            }}
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-1 text-center">Panel Administrativo</p>
                </div>

                <div onClick={() => { setView('profile'); if (isMobile) setIsSidebarOpen(false); }} className="px-6 py-6 flex items-center gap-4 bg-black/20 mx-4 mt-6 rounded-xl border border-white/5 cursor-pointer hover:bg-black/30 transition-all group overflow-hidden">
                    <div className="relative shrink-0">
                        {user.avatar ? (
                            <img src={user.avatar} alt="Admin" className="w-12 h-12 rounded-full border-2 border-accent object-cover bg-white" />
                        ) : (
                            <div className="w-12 h-12 rounded-full border-2 border-accent bg-primary flex items-center justify-center text-white text-xl font-serif">{user.username.charAt(0).toUpperCase()}</div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar"></div>
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-white font-serif truncate">{user.name || user.username}</p>
                        <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded text-center font-bold tracking-wide border border-accent/20 block w-fit truncate">{user.role}</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto no-scrollbar scroll-smooth">
                    {navItems.map((item) => (
                        <button key={item.id} onClick={() => { setView(item.id); if (isMobile) setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-4 py-3.5 w-full text-left transition-all group rounded-xl font-medium ${view === item.id ? 'bg-white text-primary shadow-lg shadow-black/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'} ${item.mt || ''}`}>
                            <span className={`material-symbols-outlined ${view === item.id ? 'text-accent' : 'group-hover:text-accent transition-colors'}`}>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10 space-y-2">
                    <button onClick={onLogout} className="flex items-center justify-center gap-2 w-full py-3 border border-white/20 rounded-lg text-sm text-gray-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all">
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={toggleSidebar} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" />
                )}
            </AnimatePresence>

            <main className="flex-1 flex flex-col h-full lg:ml-72 relative transition-all duration-300">
                <header className="h-16 flex items-center justify-between px-4 lg:hidden bg-white/90 dark:bg-sidebar/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 z-30 sticky top-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <img
                            src={horizontalLogoUrl || logoUrl || logoSkinHealth}
                            alt="Logo"
                            className="h-8 w-auto object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<span class="material-symbols-outlined text-accent text-xl shrink-0">spa</span><span class="font-serif font-bold text-sm dark:text-white truncate">CriisApp</span>';
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={toggleSidebar} className="p-2 rounded-lg text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-white/10">
                            <span className="material-symbols-outlined text-xl">menu</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 relative no-scrollbar scroll-smooth">
                    <div className="max-w-5xl mx-auto w-full">
                        {/* Centralized Page Header */}
                        <motion.div
                            key={`header-${view}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-8 lg:mb-12"
                        >
                            <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary dark:text-white mb-2 leading-tight">
                                {viewTitleMap[view]?.title}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-2xl">
                                {viewTitleMap[view]?.desc}
                            </p>
                        </motion.div>
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            {renderContent()}
                        </motion.div>
                        <footer className="mt-12 text-center text-[10px] text-gray-400 pb-6 space-y-1">
                            <p>© 2026 CriisApp - Panel de Gestión v2.1</p>
                            <p>Desarrollado por <a href="https://maeva.studio" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors font-semibold">Maeva Studio</a></p>
                        </footer>
                    </div>
                </div>
            </main>

            <button
                onClick={toggleDarkMode}
                className="fixed bottom-6 right-6 w-12 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur text-primary dark:text-accent rounded-full shadow-lg border border-white dark:border-gray-700 flex items-center justify-center hover:scale-110 transition-all z-50 group"
            >
                <span className="material-symbols-outlined text-xl group-hover:rotate-180 transition-transform duration-500">
                    {isDark ? 'light_mode' : 'dark_mode'}
                </span>
            </button>
        </div>
    );
};





const NewTicketForm = ({ user, onSuccess, isMobile }) => {
    const [form, setForm] = useState({ patientName: '', contactMethod: 'WhatsApp', city: '', phone: '', email: '', description: '' });
    const [mediaFiles, setMediaFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.keys(form).forEach(key => data.append(key, form[key]));
        mediaFiles.forEach(file => data.append('photos', file));

        try {
            const response = await fetch(`${API_URL}/api/tickets`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: data
            });
            if (response.ok) {
                const newTicket = await response.json();
                alert(`Ticket creado con éxito: ${newTicket.id}`);
                onSuccess();
            } else {
                const err = await response.json();
                alert(err.message || 'Error al crear ticket');
            }
        } catch (err) { alert('Error de conexión'); }
        finally { setLoading(false); }
    };

    return (
        <div className="fade-in-up">

            <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 md:p-10 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* Columna Izquierda */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Nombre del Paciente</label>
                            <input
                                type="text"
                                placeholder="Nombre completo"
                                className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white transition-all"
                                value={form.patientName}
                                onChange={e => setForm({ ...form, patientName: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Medio de Contacto</label>
                            <div className="relative">
                                <select
                                    className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm appearance-none text-gray-600 dark:text-gray-300 transition-all cursor-pointer"
                                    value={form.contactMethod}
                                    onChange={e => setForm({ ...form, contactMethod: e.target.value })}
                                >
                                    <option>WhatsApp</option>
                                    <option>Instagram</option>
                                    <option>Llamada</option>
                                    <option>Presencial</option>
                                    <option>Otro</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-3 pointer-events-none text-gray-400 text-lg">expand_more</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Correo Electrónico (Opcional)</label>
                            <input
                                type="email"
                                placeholder="ejemplo@correo.com"
                                className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white transition-all"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Columna Derecha */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Ciudad</label>
                            <input
                                type="text"
                                placeholder="Ciudad de residencia"
                                className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white transition-all"
                                value={form.city}
                                onChange={e => setForm({ ...form, city: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Teléfono</label>
                            <input
                                type="tel"
                                placeholder="+57 300 ..."
                                className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white transition-all"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                required
                            />
                        </div>

                        {/* Input Archivo */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Fotos de Referencia (Máx 3)</label>
                            <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-dashed border-gray-300 dark:border-white/20 cursor-pointer hover:bg-white dark:hover:bg-white/5 hover:border-accent transition-all group">
                                <span className="material-symbols-outlined text-gray-400 group-hover:text-accent">add_photo_alternate</span>
                                <span className="text-sm text-gray-500 group-hover:text-primary dark:text-gray-400 truncate">
                                    {mediaFiles.length > 0 ? `${mediaFiles.length} archivos seleccionados` : 'Elegir archivos...'}
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    multiple
                                    accept="image/*"
                                    onChange={e => setMediaFiles(Array.from(e.target.files).slice(0, 3))}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Fila Completa: Descripción */}
                <div className="mt-6 space-y-2">
                    <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Descripción del Caso</label>
                    <textarea
                        rows="4"
                        placeholder="Detalles importantes de la solicitud..."
                        className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white resize-none transition-all"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        required
                    ></textarea>
                </div>

                {/* Botón Acción */}
                <div className="mt-8 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-primary-light transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 font-serif"
                    >
                        <span>{loading ? 'Generando...' : 'Generar Ticket'}</span>
                        <span className="material-symbols-outlined">confirmation_number</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

const CaseDetailView = ({ ticket: initialTicket, user, onClose, onUpdate }) => {
    const [ticket, setTicket] = useState(initialTicket);
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [editForm, setEditForm] = useState({
        patientName: ticket.patientName,
        phone: ticket.phone,
        email: ticket.email,
        city: ticket.city
    });
    const [saving, setSaving] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const handleSaveInfo = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/api/tickets/${ticket.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(editForm)
            });

            if (response.ok) {
                const updatedTicket = await response.json();
                // Merge with existing ticket to keep relations (followUps, media, etc)
                const mergedTicket = { ...ticket, ...updatedTicket };
                setTicket(mergedTicket);
                setIsEditingInfo(false);
                if (onUpdate) onUpdate(); // Trigger refresh in list if needed
            } else {
                const err = await response.json();
                alert(err.message || 'Error al actualizar información');
            }
        } catch (err) {
            alert('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    // Organizar seguimientos por fecha descendente
    const sortedFollowUps = [...(ticket.followUps || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header / Datos Personales (Estilo CV) */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex items-start gap-5 flex-1 w-full">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 dark:bg-white/5 flex items-center justify-center text-primary dark:text-accent shadow-inner border border-primary/5 shrink-0">
                        <span className="material-symbols-outlined text-4xl">person</span>
                    </div>
                    <div className="space-y-1 flex-1">
                        {isEditingInfo ? (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    className="text-2xl font-serif font-bold text-primary dark:text-white bg-white/50 dark:bg-black/20 border border-accent/30 rounded-lg px-3 py-1 w-full outline-none focus:border-accent"
                                    value={editForm.patientName}
                                    onChange={e => setEditForm({ ...editForm, patientName: e.target.value })}
                                    placeholder="Nombre del Paciente"
                                />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-2">
                                        <span className="material-symbols-outlined text-xs text-gray-400">mail</span>
                                        <input
                                            type="email"
                                            className="bg-transparent text-xs py-2 outline-none w-full dark:text-gray-300"
                                            value={editForm.email}
                                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                            placeholder="Correo"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-2">
                                        <span className="material-symbols-outlined text-xs text-gray-400">call</span>
                                        <input
                                            type="tel"
                                            className="bg-transparent text-xs py-2 outline-none w-full dark:text-gray-300"
                                            value={editForm.phone}
                                            onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                            placeholder="Teléfono"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-2">
                                        <span className="material-symbols-outlined text-xs text-gray-400">location_on</span>
                                        <input
                                            type="text"
                                            className="bg-transparent text-xs py-2 outline-none w-full dark:text-gray-300"
                                            value={editForm.city}
                                            onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                                            placeholder="Ciudad"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={handleSaveInfo}
                                        disabled={saving}
                                        className="px-4 py-1.5 bg-success text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-success/80 transition-all disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-sm">{saving ? 'sync' : 'check'}</span>
                                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditingInfo(false);
                                            setEditForm({
                                                patientName: ticket.patientName,
                                                phone: ticket.phone,
                                                email: ticket.email,
                                                city: ticket.city
                                            });
                                        }}
                                        className="px-4 py-1.5 bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-300 dark:hover:bg-white/20 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-3xl font-serif font-bold text-primary dark:text-white leading-tight">{ticket.patientName}</h2>
                                    <button
                                        onClick={() => setIsEditingInfo(true)}
                                        className="p-1.5 rounded-full hover:bg-accent/10 text-gray-400 hover:text-accent transition-all group"
                                        title="Editar información básica"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-400">
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm">mail</span>
                                        {ticket.email || 'Sin correo'}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm">call</span>
                                        {ticket.phone}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm">location_on</span>
                                        {ticket.city}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${ticket.status === 'FINALIZADO' ? 'bg-success/10 text-success' :
                        ticket.status === 'EN_SEGUIMIENTO' ? 'bg-secondary/10 text-secondary' :
                            'bg-orange-500/10 text-orange-500'
                        }`}>
                        {ticket.status}
                    </span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">
                        Caso #{ticket.id.replace(/-/g, '').slice(0, 8)} • {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="mt-2 px-6 py-2 bg-accent text-primary rounded-full font-bold text-xs flex items-center gap-2 hover:scale-105 transition-all shadow-md"
                    >
                        <span className="material-symbols-outlined text-sm">share</span>
                        Enviar Caso
                    </button>
                </div>
            </div>

            {showShareModal && (
                <ReportShareModal
                    ticket={ticket}
                    user={user}
                    onClose={() => setShowShareModal(false)}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Diagnóstico e Info Inicial (Columna Izquierda) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/10">
                        <h3 className="text-sm font-bold text-primary dark:text-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">medical_information</span>
                            Diagnóstico Inicial
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-light italic">
                            "{ticket.description}"
                        </p>
                    </div>

                    {ticket.media && ticket.media.length > 0 && (
                        <div className="glass-panel p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                            <h3 className="text-sm font-bold text-primary dark:text-accent uppercase tracking-widest mb-4">Fotos Iniciales</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {ticket.media.map((img, i) => (
                                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-black/5 cursor-zoom-in hover:scale-[1.02] transition-all" onClick={() => window.open(`${API_URL}/${img.path}`, '_blank')}>
                                        <img src={`${API_URL}/${img.path}`} alt={`Media ${i}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Línea de Tiempo de Evolución (Columna Derecha / Central) */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-sm font-bold text-primary dark:text-accent uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">timeline</span>
                        Evolución del Proceso
                    </h3>

                    <div className="relative border-l-2 border-gray-100 dark:border-white/5 ml-4 pl-8 space-y-10">
                        {sortedFollowUps.length > 0 ? (
                            sortedFollowUps.map((fu, idx) => (
                                <div key={fu.id} className="relative">
                                    {/* Marcador de línea de tiempo */}
                                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-white dark:bg-sidebar border-4 border-accent shadow-sm z-10"></div>

                                    <div className="glass-panel p-6 rounded-2xl border border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/5 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-primary dark:text-white mb-1">{fu.diagnosis || 'Actualización de Seguimiento'}</h4>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{new Date(fu.createdAt).toLocaleString()}</p>
                                            </div>
                                            <span className="text-[10px] bg-primary/5 px-2 py-1 rounded text-primary/60 dark:text-gray-400 font-bold uppercase">{fu.status}</span>
                                        </div>

                                        <div className="space-y-4">
                                            {fu.protocol && (
                                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                                    <span className="font-bold text-accent text-xs uppercase block mb-1">Protocolo:</span>
                                                    {fu.protocol}
                                                </div>
                                            )}
                                            {fu.content && (
                                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                                    <span className="font-bold text-accent text-xs uppercase block mb-1">Observaciones:</span>
                                                    {fu.content}
                                                </div>
                                            )}
                                            {fu.media && fu.media.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                                    {fu.media.map((img, i) => (
                                                        <div key={i} className="w-24 h-24 rounded-lg overflow-hidden cursor-zoom-in hover:scale-105 transition-all" onClick={() => window.open(`${API_URL}/${img.url}`, '_blank')}>
                                                            <img src={`${API_URL}/${img.url}`} className="w-full h-full object-cover" alt="Proceso" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 opacity-30 italic">No hay actualizaciones aún...</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const TicketList = ({ tickets, user, users, onUpdate, isMobile, showArchived, setShowArchived }) => {
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [viewingCase, setViewingCase] = useState(null);
    const [reassigning, setReassigning] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);

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

    const handleArchiveTicket = async (ticketId, archivedState) => {
        try {
            const response = await fetch(`${API_URL}/api/tickets/${ticketId}/archive`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ archived: archivedState })
            });

            if (response.ok) {
                setOpenMenu(null);
                onUpdate();
            }
        } catch (err) { alert('Error al archivar'); }
    };

    const handleDeleteTicket = async (ticketId) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este ticket permanentemente? Esta acción borrará también todas las fotos y seguimientos asociados.')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (response.ok) {
                alert('Ticket eliminado con éxito');
                onUpdate();
            } else {
                const error = await response.json();
                alert(error.message || 'Error al eliminar');
            }
        } catch (err) {
            alert('Error al conectar con el servidor');
        }
    };

    if (viewingCase) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => setViewingCase(null)}
                    className="flex items-center gap-2 text-primary dark:text-white hover:text-accent transition-all font-bold text-sm mb-4"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Volver al listado
                </button>
                <CaseDetailView ticket={viewingCase} user={user} onClose={() => setViewingCase(null)} onUpdate={onUpdate} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {user.role === 'SUPERADMIN' && (
                <div className="flex justify-end gap-2 mb-4">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all border ${showArchived
                            ? 'bg-accent text-primary border-accent'
                            : 'bg-white/50 dark:bg-black/20 text-gray-500 border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10'}`}
                    >
                        <span className="material-symbols-outlined text-sm">{showArchived ? 'folder_open' : 'archive'}</span>
                        {showArchived ? 'Ver Activos' : 'Ver Archivados'}
                    </button>
                </div>
            )}

            <div className="grid gap-4">
                {tickets.map((t, idx) => {
                    // Check if Superadmin or owner to enable "Gestionar"
                    const isSuperAdmin = user.role === 'SUPERADMIN' || user.role === 'ADMIN';
                    const isOwner = t.assignedToId === user.id || t.creatorId === user.id || isSuperAdmin;
                    return (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setViewingCase(t)}
                            className="glass-panel p-5 md:p-6 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-accent/30 transition-all flex flex-col md:flex-row md:items-center gap-6 group cursor-pointer"
                        >
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <span
                                        className="font-montserrat font-bold text-accent cursor-pointer flex items-center gap-1 hover:underline tracking-wider"
                                        title="Click para compartir en WhatsApp"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const ticketIdClean = t.id.replace(/-/g, '');
                                            const message = `Hola ${t.patientName}, su número de caso es el ${ticketIdClean}. Puede consultar el estado en: criisapp.nariionline.cloud`;
                                            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                                        }}
                                    >
                                        #{t.id.replace(/-/g, '')}
                                        <span className="material-symbols-outlined text-sm">share</span>
                                    </span>
                                    <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">
                                        Gestor: {t.assignedTo?.username || 'Sin asignar'}
                                    </span>
                                </div>
                                <h4 className="text-lg font-bold text-primary dark:text-white">{t.patientName}</h4>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">location_on</span>
                                        {t.city}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                                        {new Date(t.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 justify-between md:justify-end shrink-0">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${t.status === 'FINALIZADO' ? 'bg-success/10 text-success' :
                                    t.status === 'EN_SEGUIMIENTO' ? 'bg-blue-500/10 text-blue-500' :
                                        'bg-orange-500/10 text-orange-500'
                                    }`}>
                                    {t.status}
                                </span>

                                {isSuperAdmin && (
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenu(openMenu === t.id ? null : t.id);
                                            }}
                                            className={`p-2 rounded-lg transition-all ${openMenu === t.id ? 'bg-accent text-primary' : 'text-gray-400 hover:text-accent hover:bg-accent/10'}`}
                                            title="Opciones"
                                        >
                                            <span className="material-symbols-outlined">more_vert</span>
                                        </button>
                                        <AnimatePresence>
                                            {openMenu === t.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    className="absolute bottom-full right-0 mb-2 w-48 glass-panel p-2 rounded-xl border border-white/10 shadow-2xl z-20 flex flex-col gap-1"
                                                >
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setReassigning(t.id); setOpenMenu(null); }}
                                                        className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-accent/10 hover:text-accent transition-all flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">person_pin_circle</span>
                                                        Reasignar
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleArchiveTicket(t.id, !t.isArchived); }}
                                                        className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-accent/10 hover:text-accent transition-all flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">{t.isArchived ? 'unarchive' : 'archive'}</span>
                                                        {t.isArchived ? 'Restaurar' : 'Archivar'}
                                                    </button>
                                                    <div className="h-px bg-white/5 my-1" />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteTicket(t.id); setOpenMenu(null); }}
                                                        className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-red-500/10 text-red-500 transition-all flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">delete_forever</span>
                                                        Eliminar
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {isOwner ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); }}
                                            className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-primary/20 transition-all hover:scale-105 font-serif"
                                        >
                                            Gestionar
                                        </button>
                                    </div>
                                ) : (
                                    <button disabled className="px-6 py-2 border border-gray-200 dark:border-white/10 text-gray-400 rounded-xl text-sm font-bold opacity-50 cursor-not-allowed">
                                        Lectura
                                    </button>
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-sidebar w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                                <div>
                                    <h4 className="font-serif text-xl font-bold dark:text-white">Gestión de Ticket</h4>
                                    <p className="text-xs text-accent font-bold font-montserrat tracking-widest">#{selectedTicket.id.replace(/-/g, '')}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedTicket(null)}
                                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="p-8 max-h-[80vh] overflow-y-auto no-scrollbar">
                                <FollowUpForm
                                    ticket={selectedTicket}
                                    user={user}
                                    onDone={() => { setSelectedTicket(null); onUpdate(); }}
                                    onDelete={() => { handleDeleteTicket(selectedTicket.id); setSelectedTicket(null); }}
                                    onArchive={(state) => { handleArchiveTicket(selectedTicket.id, state); setSelectedTicket(null); }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


const FollowUpForm = ({ ticket, user, onDone, onDelete, onArchive }) => {
    const isSuperAdmin = user.role === 'SUPERADMIN' || user.role === 'ADMIN';
    const [form, setForm] = useState({ content: '', diagnosis: '', protocol: '', bonusInfo: '', status: ticket.status });
    const [photos, setPhotos] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const data = new FormData();
        Object.keys(form).forEach(key => data.append(key, form[key]));
        photos.forEach(file => data.append('photos', file));

        try {
            await fetch(`${API_URL}/api/tickets/${ticket.id}/follow-up`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: data
            });
            onDone();
        } catch (err) { alert('Error al actualizar'); }
        finally { setSubmitting(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Diagnóstico</label>
                    <input
                        className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white transition-all"
                        value={form.diagnosis}
                        onChange={e => setForm({ ...form, diagnosis: e.target.value })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Bonificación / Obsequio</label>
                    <input
                        className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white transition-all"
                        value={form.bonusInfo}
                        onChange={e => setForm({ ...form, bonusInfo: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Protocolo de Procedimiento</label>
                <textarea
                    className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white resize-none transition-all"
                    rows="3"
                    value={form.protocol}
                    onChange={e => setForm({ ...form, protocol: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Cambiar Estado</label>
                <div className="relative">
                    <select
                        className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm appearance-none text-gray-600 dark:text-gray-300 transition-all cursor-pointer"
                        value={form.status}
                        onChange={e => setForm({ ...form, status: e.target.value })}
                    >
                        <option value="INICIAL">Inicial</option>
                        <option value="EN_SEGUIMIENTO">En Seguimiento</option>
                        <option value="FINALIZADO">Finalizado</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-3 pointer-events-none text-gray-400">expand_more</span>
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-sm font-bold text-accent ml-1 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined">add_a_photo</span>
                    Fotos de Avance / Proceso
                </label>
                <div className="flex flex-wrap gap-3">
                    {photos.map((p, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                            <img src={URL.createObjectURL(p)} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                                className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    ))}
                    {photos.length < 3 && (
                        <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-all text-gray-400 hover:text-accent">
                            <span className="material-symbols-outlined">add</span>
                            <span className="text-[8px] font-bold">PROCESO</span>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={e => {
                                    const files = Array.from(e.target.files);
                                    if (photos.length + files.length > 3) return alert('Máximo 3 fotos');
                                    setPhotos([...photos, ...files]);
                                }}
                            />
                        </label>
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-4 bg-primary dark:bg-accent text-white dark:text-primary rounded-xl font-bold font-serif shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                    {submitting ? 'Guardando...' : 'Guardar Gestión'}
                </button>

                {isSuperAdmin && (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => onArchive(!ticket.isArchived)}
                            className="px-4 py-4 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-accent hover:text-primary transition-all flex items-center justify-center gap-2 shadow-sm"
                            title={ticket.isArchived ? "Restaurar Ticket" : "Archivar Ticket"}
                        >
                            <span className="material-symbols-outlined">{ticket.isArchived ? 'unarchive' : 'archive'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={onDelete}
                            className="px-6 py-4 bg-red-600/10 text-red-600 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-600/20"
                        >
                            <span className="material-symbols-outlined">delete_forever</span>
                            <span className="hidden sm:inline">Eliminar</span>
                        </button>
                    </div>
                )}
            </div>
        </form>
    );
};


const ReportsView = ({ tickets, user, users, isMobile }) => {
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedGestor, setSelectedGestor] = useState('all');
    const [filteredTickets, setFilteredTickets] = useState([]);

    useEffect(() => {
        if (!Array.isArray(tickets)) {
            setFilteredTickets([]);
            return;
        }
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
            const gName = Array.isArray(users) ? users.find(u => u.id === parseInt(selectedGestor))?.username : 'Gestor no encontrado';
            doc.text(`Gestor: ${gName || 'No asignado'}`, 20, 80);
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
        <div className="space-y-8 animate-fade-in">

            <div className="glass-panel p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-white/5 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase tracking-wider">Desde</label>
                        <input type="date" className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase tracking-wider">Hasta</label>
                        <input type="date" className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    {user.role === 'SUPERADMIN' && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase tracking-wider">Filtrar por Gestor</label>
                            <div className="relative">
                                <select className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm appearance-none text-gray-600 dark:text-gray-300 transition-all cursor-pointer" value={selectedGestor} onChange={e => setSelectedGestor(e.target.value)}>
                                    <option value="all">Todos los gestores</option>
                                    {Array.isArray(users) && users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-3 pointer-events-none text-gray-400">expand_more</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-primary/5 dark:bg-white/5 p-6 rounded-2xl border border-primary/10 dark:border-white/5 font-montserrat">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Casos en el periodo</p>
                        <p className="text-4xl font-bold text-primary dark:text-white">{filteredTickets.length}</p>
                    </div>
                    <div className="bg-accent/10 p-6 rounded-2xl border border-accent/20 font-montserrat">
                        <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Total Comisionado</p>
                        <p className="text-4xl font-bold text-primary dark:text-white">${totalCommission.toLocaleString()}</p>
                    </div>
                </div>

                <button
                    onClick={generatePDF}
                    className="w-full md:w-auto px-8 py-4 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold font-serif shadow-xl hover:shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                >
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                    Descargar Informe PDF
                </button>
            </div>
        </div>
    );
};


const UserManagement = ({ user, users, onUpdate, isMobile }) => {
    const [editingUser, setEditingUser] = useState(null);
    const [viewingProfile, setViewingProfile] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleUpdateUser = async (data) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: data,
                credentials: 'include'
            });
            if (response.ok) {
                setEditingUser(null);
                onUpdate();
            }
        } catch (err) { alert('Error al actualizar usuario'); }
        finally { setLoading(false); }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-end mb-8">
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-6 py-3 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold font-serif shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">person_add</span>
                    Nueva Entidad / Gestor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(users) && users.map(u => (
                    <motion.div
                        key={u.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setViewingProfile(u)}
                        className="glass-panel p-6 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4 group hover:border-accent/30 transition-all cursor-pointer"
                    >
                        <div className="shrink-0">
                            {u.avatar ? (
                                <img src={u.avatar} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-accent object-cover bg-white" />
                            ) : (
                                <div className="w-16 h-16 rounded-full border-2 border-primary bg-primary flex items-center justify-center text-white text-2xl font-serif">
                                    {u.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h4 className="font-bold text-primary dark:text-white truncate">{u.name || u.username}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{u.username}</p>
                            <span className="inline-block mt-2 px-2 py-0.5 rounded bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider border border-accent/10">
                                {u.role}
                            </span>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setEditingUser(u); }}
                            className="p-2 text-gray-400 hover:text-accent transition-colors"
                        >
                            <span className="material-symbols-outlined">edit</span>
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Modal Editar */}
            <AnimatePresence>
                {editingUser && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-sidebar w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                                <h4 className="font-serif text-xl font-bold dark:text-white">Editar Usuario</h4>
                                <button onClick={() => setEditingUser(null)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="p-8 max-h-[80vh] overflow-y-auto no-scrollbar">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const data = new FormData();
                                    Object.keys(editingUser).forEach(key => {
                                        if (editingUser[key] !== null && key !== 'avatar') data.append(key, editingUser[key]);
                                    });
                                    const fileInput = e.target.querySelector('#edit-avatar-upload');
                                    if (fileInput.files[0]) data.append('avatar', fileInput.files[0]);
                                    handleUpdateUser(data);
                                }} className="space-y-6">
                                    <div className="flex justify-center mb-4">
                                        <div className="relative">
                                            {editingUser.avatar ? (
                                                <img src={editingUser.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-accent object-cover bg-white" />
                                            ) : (
                                                <div className="w-24 h-24 rounded-full border-4 border-primary bg-primary flex items-center justify-center text-white text-3xl font-serif">{editingUser.username.charAt(0).toUpperCase()}</div>
                                            )}
                                            <label htmlFor="edit-avatar-upload" className="absolute bottom-0 right-0 w-8 h-8 bg-accent text-primary rounded-full flex items-center justify-center cursor-pointer border-2 border-white dark:border-sidebar shadow-lg">
                                                <span className="material-symbols-outlined text-sm">photo_camera</span>
                                            </label>
                                            <input id="edit-avatar-upload" type="file" accept="image/*" className="hidden" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Nombre Completo</label>
                                            <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" value={editingUser.name || ''} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Usuario</label>
                                            <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" value={editingUser.username} onChange={e => setEditingUser({ ...editingUser, username: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Dirección / Sede</label>
                                            <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" value={editingUser.address || ''} onChange={e => setEditingUser({ ...editingUser, address: e.target.value })} />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Rol</label>
                                            <select className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                                                <option value="GESTOR">Gestor</option>
                                                <option value="SUPERADMIN">Super Admin</option>
                                                <option value="ENTIDAD">Entidad / Empresa</option>
                                            </select>
                                        </div>

                                        {editingUser.role === 'GESTOR' && (
                                            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5 animate-fade-in">
                                                <h6 className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">Información Profesional (CV)</h6>
                                                <EditProfileArea label="Experiencia" value={editingUser.experience} onChange={v => setEditingUser({ ...editingUser, experience: v })} />
                                                <EditProfileArea label="Logros Profesionales" value={editingUser.achievements} onChange={v => setEditingUser({ ...editingUser, achievements: v })} />
                                                <EditProfileArea label="Titulación / Especialidad" value={editingUser.titles} onChange={v => setEditingUser({ ...editingUser, titles: v })} />
                                                <EditProfileArea label="Simposios / Capacitaciones" value={editingUser.training} onChange={v => setEditingUser({ ...editingUser, training: v })} />
                                            </div>
                                        )}

                                        {editingUser.role === 'ENTIDAD' && (
                                            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5 animate-fade-in">
                                                <h6 className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">Información Corporativa</h6>
                                                <EditProfileInput label="Razón Social" value={editingUser.businessName} onChange={v => setEditingUser({ ...editingUser, businessName: v })} />
                                                <EditProfileInput label="NIT / Registro" value={editingUser.nit} onChange={v => setEditingUser({ ...editingUser, nit: v })} />
                                                <EditProfileInput label="Responsable de Contacto" value={editingUser.contactPerson} onChange={v => setEditingUser({ ...editingUser, contactPerson: v })} />

                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-accent ml-1 uppercase tracking-widest">Código de Autorización</label>
                                                    <input
                                                        className="input-dashboard w-full px-4 py-3 rounded-xl bg-accent/5 border border-accent/20 outline-none text-sm text-primary dark:text-white font-mono tracking-widest"
                                                        value={editingUser.authCode || ''}
                                                        onChange={e => setEditingUser({ ...editingUser, authCode: e.target.value.toUpperCase() })}
                                                        placeholder="Ej: SKN0001"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full py-4 bg-primary dark:bg-accent text-white dark:text-primary rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Perfil Detalle */}
            <AnimatePresence>
                {viewingProfile && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-sidebar w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] no-scrollbar border border-gray-100 dark:border-white/10"
                        >
                            <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center sticky top-0 bg-white/90 dark:bg-sidebar/90 backdrop-blur-md z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center">
                                        <span className="material-symbols-outlined text-accent text-2xl">visibility</span>
                                    </div>
                                    <div>
                                        <h4 className="font-serif text-2xl font-bold dark:text-white">Perfil de Usuario</h4>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">Resumen de Información</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingProfile(null)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="p-8 space-y-10">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="shrink-0">
                                        {viewingProfile.avatar ? (
                                            <img src={viewingProfile.avatar} alt="Avatar" className="w-32 h-32 rounded-full border-4 border-accent object-cover bg-white shadow-xl" />
                                        ) : (
                                            <div className="w-32 h-32 rounded-full border-4 border-primary bg-primary flex items-center justify-center text-white text-5xl font-serif">
                                                {viewingProfile.username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center md:text-left space-y-3">
                                        <h5 className="text-3xl font-serif font-bold text-primary dark:text-white">{viewingProfile.name || viewingProfile.username}</h5>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                            <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">mail</span>{viewingProfile.email || 'N/A'}</div>
                                            <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">call</span>{viewingProfile.phone || 'N/A'}</div>
                                            <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">location_on</span>{viewingProfile.address || 'N/A'}</div>
                                        </div>
                                        <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-widest border border-accent/20">
                                            {viewingProfile.role}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-8">
                                    {viewingProfile.role === 'SUPERADMIN' && (
                                        <div className="space-y-4 bg-primary/5 p-6 rounded-2xl border border-primary/10">
                                            <h6 className="text-xs font-bold text-primary dark:text-accent uppercase tracking-widest flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                                                Atribuciones de Super Administrador
                                            </h6>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                                Como Gestor Principal, tiene control total sobre el sistema, incluyendo la gestión de usuarios,
                                                configuración global de la marca, supervisión de todos los casos de PQR y capacitaciones corporativas.
                                            </p>
                                        </div>
                                    )}

                                    {viewingProfile.role === 'GESTOR' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <ProfileDetailItem icon="work_history" label="Experiencia Profesional" content={viewingProfile.experience} />
                                            <ProfileDetailItem icon="military_tech" label="Logros y Reconocimientos" content={viewingProfile.achievements} />
                                            <ProfileDetailItem icon="school" label="Titulaciones" content={viewingProfile.titles} />
                                            <ProfileDetailItem icon="history_edu" label="Capacitaciones y Simposios" content={viewingProfile.training} />
                                        </div>
                                    )}

                                    {viewingProfile.role === 'ENTIDAD' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <ProfileDetailItem icon="apartment" label="Razón Social" content={viewingProfile.businessName} />
                                            <ProfileDetailItem icon="id_card" label="NIT" content={viewingProfile.nit} />
                                            <ProfileDetailItem icon="person_pin" label="Responsable de Contacto" content={viewingProfile.contactPerson} />
                                            <ProfileDetailItem icon="confirmation_number" label="Código de Autorización" content={viewingProfile.authCode} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
                                <button
                                    onClick={() => { setViewingProfile(null); setEditingUser(viewingProfile); }}
                                    className="px-6 py-3 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg"
                                >
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                    Editar Perfil
                                </button>
                                <button onClick={() => setViewingProfile(null)} className="px-6 py-3 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 rounded-xl font-bold text-sm">Cerrar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Crear */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-sidebar w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center">
                                        <span className="material-symbols-outlined text-accent text-2xl">person_add</span>
                                    </div>
                                    <div>
                                        <h4 className="font-serif text-2xl font-bold dark:text-white">Nuevo Registro</h4>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">Gestores y Entidades</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsCreating(false)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="p-8 max-h-[75vh] overflow-y-auto no-scrollbar">
                                <NewUserForm user={user} onDone={() => { setIsCreating(false); onUpdate(); }} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};


const NewUserForm = ({ user, onDone }) => {
    const [formData, setFormData] = useState({
        username: '', name: '', email: '', password: '', confirmPassword: '', role: 'GESTOR', phone: '', address: '', authCode: '',
        experience: '', achievements: '', training: '', titles: '',
        businessName: '', nit: '', contactPerson: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) return alert('Contraseñas no coinciden');
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                alert('Usuario creado con éxito');
                onDone();
            } else {
                const err = await response.json();
                alert(err.message || 'Error al crear usuario');
            }
        } catch (err) { alert('Error de conexión'); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Nombre Completo</label>
                    <input
                        className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Usuario / ID</label>
                    <input
                        className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Email</label>
                    <input
                        type="email"
                        className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Teléfono</label>
                    <input
                        className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Dirección / Sede</label>
                    <input
                        className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white"
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Rol de Acceso</label>
                    <div className="relative">
                        <select
                            className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm appearance-none text-gray-600 dark:text-gray-300 transition-all cursor-pointer"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="GESTOR">Gestor Administrativo</option>
                            <option value="SUPERADMIN">Super Administrador</option>
                            <option value="ENTIDAD">Entidad / Empresa</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-3 pointer-events-none text-gray-400">expand_more</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Contraseña</label>
                    <input
                        type="password"
                        className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Confirmar Contraseña</label>
                    <input
                        type="password"
                        className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white"
                        value={formData.confirmPassword}
                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                    />
                </div>

                {formData.role === 'GESTOR' && (
                    <div className="md:col-span-2 space-y-6 pt-6 border-t border-gray-100 dark:border-white/5 animate-fade-in">
                        <h6 className="text-xs font-bold text-accent uppercase tracking-widest">Información Profesional</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Experiencia</label>
                                <textarea className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" rows="3" value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Logros Profesionales</label>
                                <textarea className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" rows="3" value={formData.achievements} onChange={e => setFormData({ ...formData, achievements: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Titulaciones</label>
                                <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" value={formData.titles} onChange={e => setFormData({ ...formData, titles: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Simposios / Capacitaciones</label>
                                <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" value={formData.training} onChange={e => setFormData({ ...formData, training: e.target.value })} />
                            </div>
                        </div>
                    </div>
                )}

                {formData.role === 'ENTIDAD' && (
                    <div className="md:col-span-2 space-y-6 pt-6 border-t border-gray-100 dark:border-white/5 animate-fade-in">
                        <h6 className="text-xs font-bold text-accent uppercase tracking-widest">Información Corporativa</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Razón Social</label>
                                <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">NIT</label>
                                <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" value={formData.nit} onChange={e => setFormData({ ...formData, nit: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Responsable de Contacto</label>
                                <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-accent uppercase tracking-widest ml-1">Código Autorización</label>
                                <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-accent/5 border border-accent/20 outline-none text-sm text-primary dark:text-white font-mono" value={formData.authCode} onChange={e => setFormData({ ...formData, authCode: e.target.value.toUpperCase() })} required />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary dark:bg-accent text-white dark:text-primary rounded-xl font-bold font-serif shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
            >
                {loading ? 'Registrando...' : 'Finalizar Registro'}
            </button>
        </form>
    );
};

const StatsView = ({ stats, users, user, onRefresh, isMobile }) => {
    const [filters, setFilters] = useState({ city: '', gestorId: '', status: '' });

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        if (key === 'reset') {
            const resetFilters = { city: '', gestorId: '', status: '' };
            setFilters(resetFilters);
            onRefresh(resetFilters);
            return;
        }
        setFilters(newFilters);
        onRefresh(newFilters);
    };

    if (!stats) return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400 font-serif">Cargando estadísticas...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">

            {/* Filtros */}
            <div className="glass-panel p-6 rounded-2xl border border-gray-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Ciudad</label>
                    <div className="relative">
                        <select className="input-dashboard w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm appearance-none" value={filters.city} onChange={e => handleFilterChange('city', e.target.value)}>
                            <option value="">Todas</option>
                            {stats.cityStats?.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-2 pointer-events-none text-gray-400">expand_more</span>
                    </div>
                </div>
                {user.role === 'SUPERADMIN' && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Gestor</label>
                        <div className="relative">
                            <select className="input-dashboard w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm appearance-none" value={filters.gestorId} onChange={e => handleFilterChange('gestorId', e.target.value)}>
                                <option value="">Todos</option>
                                {Array.isArray(users) && users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-2 pointer-events-none text-gray-400">expand_more</span>
                        </div>
                    </div>
                )}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Estado</label>
                    <div className="relative">
                        <select className="input-dashboard w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm appearance-none" value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
                            <option value="">Todos</option>
                            <option value="PROCESO">En Proceso</option>
                            <option value="CERRADO">Cerrados</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-2 pointer-events-none text-gray-400">expand_more</span>
                    </div>
                </div>
                <button className="px-4 py-2.5 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all flex items-center justify-center" onClick={() => handleFilterChange('reset', '')}>
                    <span className="material-symbols-outlined text-lg">refresh</span>
                </button>
            </div>

            {/* Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Total PQRs" value={stats.totalTickets || 0} icon="all_inbox" color="primary" />
                <StatCard label="Finalizados" value={stats.resolvedTickets || 0} icon="task_alt" color="success" />
                <StatCard label="Ingresos" value={`$${(stats.totalRevenue || 0).toLocaleString()}`} icon="payments" color="accent" />
            </div>

            {/* Detalle por Ciudad */}
            <div className="glass-panel p-8 rounded-2xl border border-gray-100 dark:border-white/5">
                <h4 className="font-montserrat text-xl font-bold text-primary dark:text-white mb-6">Distribución Geográfica</h4>
                <div className="space-y-4">
                    {stats.cityStats?.map((c, idx) => (
                        <div key={c.city} className="flex items-center gap-4 group">
                            <span className="text-sm font-bold text-gray-400 w-8 font-montserrat">0{idx + 1}</span>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-primary dark:text-gray-200 uppercase tracking-wider">{c.city}</span>
                                    <span className="text-accent font-bold font-montserrat">{c._count?._all || 0} casos</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((c._count?._all || 0) / (stats.totalTickets || 1)) * 100}%` }}
                                        className="h-full bg-accent"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon, color }) => {
    const colors = {
        primary: 'text-primary bg-primary/10 border-primary/20',
        success: 'text-success bg-success/10 border-success/20',
        accent: 'text-accent bg-accent/10 border-accent/20'
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`glass-panel p-8 rounded-3xl border ${colors[color]} flex flex-col items-center text-center space-y-3 transition-all`}
        >
            <div className={`w-12 h-12 rounded-2xl ${colors[color]} border-0 flex items-center justify-center`}>
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-1">{label}</p>
                <p className="text-3xl font-montserrat font-bold">{value}</p>
            </div>
        </motion.div>
    );
};

const ProfileDetailItem = ({ icon, label, content }) => (
    <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/5 space-y-2">
        <div className="flex items-center gap-2 text-accent">
            <span className="material-symbols-outlined text-lg">{icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        </div>
        <p className="text-sm text-primary dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
            {content || <span className="italic opacity-50">Información no disponible</span>}
        </p>
    </div>
);

const EditProfileInput = ({ label, value, onChange }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        <input
            className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
        />
    </div>
);

const EditProfileArea = ({ label, value, onChange }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        <textarea
            className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white min-h-[100px]"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
        />
    </div>
);

const ProfileView = ({ user, onUpdate, isMobile }) => {
    const [formData, setFormData] = useState({
        username: user.username,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        experience: user.experience || '',
        achievements: user.achievements || '',
        training: user.training || '',
        titles: user.titles || '',
        specialties: user.specialties || '',
        businessName: user.businessName || '',
        nit: user.nit || '',
        contactPerson: user.contactPerson || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key]) data.append(key, formData[key]);
        });
        if (avatarFile) data.append('avatar', avatarFile);

        try {
            const response = await fetch(`${API_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: data
            });

            if (response.ok) {
                const updated = await response.json();
                onUpdate(updated);
                alert('Perfil actualizado con éxito');
            } else {
                const err = await response.json();
                alert(err.message || 'Error al actualizar');
            }
        } catch (err) { alert('Error de conexión'); }
        finally { setLoading(false); }
    };


    return (
        <div className="space-y-8 animate-fade-in">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna Izquierda: Avatar y Resumen */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-8 rounded-3xl border border-gray-100 dark:border-white/5 flex flex-col items-center text-center">
                        <div className="relative group">
                            {user.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-32 h-32 rounded-full border-4 border-accent object-cover bg-white shadow-xl" />
                            ) : (
                                <div className="w-32 h-32 rounded-full border-4 border-primary bg-primary flex items-center justify-center text-white text-5xl font-serif shadow-xl">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 w-10 h-10 bg-accent text-primary rounded-full flex items-center justify-center cursor-pointer border-4 border-white dark:border-sidebar shadow-lg hover:scale-110 transition-all">
                                <span className="material-symbols-outlined text-xl">photo_camera</span>
                            </label>
                            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={e => setAvatarFile(e.target.files[0])} />
                        </div>
                        <h2 className="mt-6 font-serif text-2xl font-bold text-primary dark:text-white">{user.name || user.username}</h2>
                        <span className="mt-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest border border-accent/20">
                            {user.role}
                        </span>
                        <div className="w-full mt-8 pt-6 border-t border-gray-100 dark:border-white/5 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID Gestor</p>
                                <p className="text-sm font-bold text-primary dark:text-gray-300">#{user.id}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</p>
                                <p className="text-sm font-bold text-green-500 flex items-center justify-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Activo
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Formulario */}
                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleSubmit} className="glass-panel p-8 md:p-10 rounded-3xl border border-gray-100 dark:border-white/5 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase tracking-wider">Nombre Completo</label>
                                <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase tracking-wider">Usuario / ID</label>
                                <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase tracking-wider">Email</label>
                                <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase tracking-wider">Teléfono</label>
                                <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase tracking-wider">Dirección</label>
                                <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                        </div>

                        {user.role === 'GESTOR' && (
                            <div className="pt-8 border-t border-gray-100 dark:border-white/5 space-y-6">
                                <h4 className="font-serif text-lg font-bold text-primary dark:text-white">Perfil Profesional (CV)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <EditProfileArea label="Experiencia" value={formData.experience} onChange={v => setFormData({ ...formData, experience: v })} />
                                    <EditProfileArea label="Logros Profesionales" value={formData.achievements} onChange={v => setFormData({ ...formData, achievements: v })} />
                                    <EditProfileInput label="Titulaciones" value={formData.titles} onChange={v => setFormData({ ...formData, titles: v })} />
                                    <EditProfileInput label="Simposios / Capacitaciones" value={formData.training} onChange={v => setFormData({ ...formData, training: v })} />
                                </div>
                            </div>
                        )}

                        {user.role === 'ENTIDAD' && (
                            <div className="pt-8 border-t border-gray-100 dark:border-white/5 space-y-6">
                                <h4 className="font-serif text-lg font-bold text-primary dark:text-white">Información Corporativa</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <EditProfileInput label="Razón Social" value={formData.businessName} onChange={v => setFormData({ ...formData, businessName: v })} />
                                    <EditProfileInput label="NIT" value={formData.nit} onChange={v => setFormData({ ...formData, nit: v })} />
                                    <EditProfileInput label="Responsable de Contacto" value={formData.contactPerson} onChange={v => setFormData({ ...formData, contactPerson: v })} />
                                </div>
                            </div>
                        )}

                        <div className="pt-8 border-t border-gray-100 dark:border-white/5 space-y-6">
                            <h4 className="font-serif text-lg font-bold text-primary dark:text-white">Seguridad y Acceso</h4>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase tracking-wider">Contraseña Actual</label>
                                <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" type="password" value={formData.currentPassword} onChange={e => setFormData({ ...formData, currentPassword: e.target.value })} placeholder="Requerido para cambios importantes" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase tracking-wider">Nueva Contraseña</label>
                                    <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" type="password" value={formData.newPassword} onChange={e => setFormData({ ...formData, newPassword: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase tracking-wider">Confirmar Nueva Contraseña</label>
                                    <input className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" type="password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold font-serif shadow-xl hover:shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-3"
                        >
                            <span className="material-symbols-outlined">save</span>
                            {loading ? 'Guardando cambios...' : 'Actualizar Perfil'}
                        </button>
                    </form>
                </div>
            </div>
            {user.role === 'SUPERADMIN' && <BrandManagement user={user} />}
        </div>
    );
};


const BrandManagement = ({ user }) => {
    const [uploadMode, setUploadMode] = useState('url');
    const [logoUrl, setLogoUrl] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [faviconUrl, setFaviconUrl] = useState('');
    const [faviconFile, setFaviconFile] = useState(null);
    const [horizontalLogoUrl, setHorizontalLogoUrl] = useState('');
    const [horizontalLogoFile, setHorizontalLogoFile] = useState(null);
    const [panelLogoUrl, setPanelLogoUrl] = useState('');
    const [panelLogoFile, setPanelLogoFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleUpdateLogo = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        if (uploadMode === 'file') {
            if (logoFile) formData.append('logo', logoFile);
            if (faviconFile) formData.append('favicon', faviconFile);
            if (horizontalLogoFile) formData.append('horizontalLogo', horizontalLogoFile);
            if (panelLogoFile) formData.append('panelLogo', panelLogoFile);
        } else {
            if (logoUrl) formData.append('logoUrl', logoUrl);
            if (faviconUrl) formData.append('faviconUrl', faviconUrl);
            if (horizontalLogoUrl) formData.append('horizontalLogoUrl', horizontalLogoUrl);
            if (panelLogoUrl) formData.append('panelLogoUrl', panelLogoUrl);
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/settings`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                alert('Identidad visual actualizada exitosamente.');
                if (data.logoUrl) setLogoUrl(data.logoUrl);
                if (data.faviconUrl) setFaviconUrl(data.faviconUrl);
                if (data.horizontalLogoUrl) setHorizontalLogoUrl(data.horizontalLogoUrl);
                if (data.panelLogoUrl) setPanelLogoUrl(data.panelLogoUrl);
                window.location.reload(); // Quick way to sync across components
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
        <div className="mt-4 space-y-6">

            <div className="glass-panel p-8 rounded-3xl border border-gray-100 dark:border-white/5 space-y-8">
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
                    <button
                        type="button"
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${uploadMode === 'url' ? 'bg-white dark:bg-sidebar text-primary dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white'}`}
                        onClick={() => setUploadMode('url')}
                    >
                        URL Externa
                    </button>
                    <button
                        type="button"
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${uploadMode === 'file' ? 'bg-white dark:bg-sidebar text-primary dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white'}`}
                        onClick={() => setUploadMode('file')}
                    >
                        Subir Archivo
                    </button>
                </div>

                <form onSubmit={handleUpdateLogo} className="space-y-6">
                    {uploadMode === 'url' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase">URL del Logotipo</label>
                                <input
                                    className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white"
                                    placeholder="https://ejemplo.com/logo.png"
                                    value={logoUrl}
                                    onChange={e => setLogoUrl(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase">URL del Favicon (Icono de Pestaña)</label>
                                <input
                                    className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white"
                                    placeholder="https://ejemplo.com/favicon.png"
                                    value={faviconUrl}
                                    onChange={e => setFaviconUrl(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase">URL del Logotipo Horizontal (Para Home)</label>
                                <input
                                    className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white"
                                    placeholder="https://ejemplo.com/logo-horizontal.png"
                                    value={horizontalLogoUrl}
                                    onChange={e => setHorizontalLogoUrl(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase">URL del Logo Panel (Cuadrado)</label>
                                <input
                                    className="input-dashboard w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white"
                                    placeholder="https://ejemplo.com/panel-logo.png"
                                    value={panelLogoUrl}
                                    onChange={e => setPanelLogoUrl(e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase">Archivo de Logotipo</label>
                                <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-dashed border-gray-300 dark:border-white/20 cursor-pointer hover:bg-white dark:hover:bg-white/5 transition-all group">
                                    <span className="material-symbols-outlined text-gray-400 group-hover:text-accent">upload_file</span>
                                    <span className="text-sm text-gray-500 group-hover:text-primary dark:text-gray-400 truncate">
                                        {logoFile ? logoFile.name : 'Cargar Logo...'}
                                    </span>
                                    <input type="file" className="hidden" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} />
                                </label>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase">Archivo de Favicon</label>
                                <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-dashed border-gray-300 dark:border-white/20 cursor-pointer hover:bg-white dark:hover:bg-white/5 transition-all group">
                                    <span className="material-symbols-outlined text-gray-400 group-hover:text-accent">settings_suggest</span>
                                    <span className="text-sm text-gray-500 group-hover:text-primary dark:text-gray-400 truncate">
                                        {faviconFile ? faviconFile.name : 'Cargar Favicon...'}
                                    </span>
                                    <input type="file" className="hidden" accept="image/*" onChange={e => setFaviconFile(e.target.files[0])} />
                                </label>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase">Archivo de Logotipo Horizontal</label>
                                <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-dashed border-gray-300 dark:border-white/20 cursor-pointer hover:bg-white dark:hover:bg-white/5 transition-all group">
                                    <span className="material-symbols-outlined text-gray-400 group-hover:text-accent">dock_to_bottom</span>
                                    <span className="text-sm text-gray-500 group-hover:text-primary dark:text-gray-400 truncate">
                                        {horizontalLogoFile ? horizontalLogoFile.name : 'Cargar Logo Horizontal...'}
                                    </span>
                                    <input type="file" className="hidden" accept="image/*" onChange={e => setHorizontalLogoFile(e.target.files[0])} />
                                </label>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-primary dark:text-gray-300 ml-1 uppercase">Archivo del Logo Panel (Cuadrado)</label>
                                <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-dashed border-gray-300 dark:border-white/20 cursor-pointer hover:bg-white dark:hover:bg-white/5 transition-all group">
                                    <span className="material-symbols-outlined text-gray-400 group-hover:text-accent">grid_view</span>
                                    <span className="text-sm text-gray-500 group-hover:text-primary dark:text-gray-400 truncate">
                                        {panelLogoFile ? panelLogoFile.name : 'Cargar Logo Panel...'}
                                    </span>
                                    <input type="file" className="hidden" accept="image/*" onChange={e => setPanelLogoFile(e.target.files[0])} />
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center gap-8 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full md:w-auto px-10 py-4 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold font-montserrat shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Sincronizando...' : 'Actualizar Marca'}
                        </button>

                        <div className="flex items-center gap-4 px-6 py-3 bg-primary/5 dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/5">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Previsualización</span>
                            <div className="h-10 w-px bg-gray-200 dark:bg-white/10"></div>
                            <img src={logoUrl || logoSkinHealth} alt="Preview" className="h-8 object-contain opacity-80" />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};


const TrainingsView = ({ user, isMobile }) => {
    const [trainings, setTrainings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [editData, setEditData] = useState({});
    const [showModal, setShowModal] = useState(false);

    const fetchTrainings = async () => {
        try {
            const response = await fetch(`${API_URL}/api/training`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            setTrainings(data);
        } catch (err) { console.error('Error fetching trainings:', err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchTrainings();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/training/progress/${selectedTraining.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(editData)
            });
            if (response.ok) {
                setShowModal(false);
                fetchTrainings();
            }
        } catch (err) { alert('Error al actualizar'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta reserva?')) return;
        try {
            const response = await fetch(`${API_URL}/api/training/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (response.ok) {
                alert('Reserva eliminada con éxito');
                fetchTrainings();
            }
        } catch (err) { alert('Error al eliminar'); }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-serif opacity-50">Cargando agenda de capacitaciones...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex justify-end gap-2 mb-4">
                <button onClick={fetchTrainings} className="p-3 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm">sync</span>
                    Sincronizar
                </button>
            </div>

            <div className="grid gap-6">
                {trainings.length > 0 ? trainings.map((t, idx) => {
                    const durationHours = Math.round((new Date(t.endTime) - new Date(t.startTime)) / 3600000);
                    return (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-panel p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex flex-col md:flex-row md:items-center gap-6 group hover:border-accent/30 transition-all"
                        >
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${t.status === 'COMPLETADA' ? 'bg-green-500/10 text-green-500 border-green-500/10' :
                                        t.status === 'CANCELADA' ? 'bg-red-500/10 text-red-500 border-red-500/10' :
                                            'bg-accent/10 text-accent border-accent/10'
                                        }`}>
                                        {t.status}
                                    </span>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Reserva #{t.id}</span>
                                </div>

                                <div>
                                    <h4 className="text-lg font-bold text-primary dark:text-white font-serif">{t.description || 'Sin descripción'}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Reservado por: {t.entity?.businessName || t.entity?.name || t.entity?.username}</p>
                                </div>

                                <div className="flex flex-wrap gap-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-accent">event</span> {new Date(t.startTime).toLocaleDateString()}</div>
                                    <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-accent">schedule</span> {new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({durationHours}H)</div>
                                    <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-accent">person</span> {t.manager?.name || t.manager?.username || 'Gestor no asignado'}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    onClick={() => { setSelectedTraining(t); setEditData(t); setShowModal(true); }}
                                    className="px-6 py-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-xs font-bold text-primary dark:text-white hover:bg-accent hover:text-primary transition-all shadow-lg hover:shadow-accent/40"
                                >
                                    Detalles / Editar
                                </button>
                                {user.role === 'SUPERADMIN' && (
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                }) : (
                    <div className="text-center py-20 bg-gray-50/50 dark:bg-black/10 rounded-3xl border border-dashed border-gray-200 dark:border-white/10 italic text-gray-400 flex flex-col items-center gap-4">
                        <span className="material-symbols-outlined text-5xl">event_busy</span>
                        <p>No hay reservas programadas aún.</p>
                    </div>
                )}
            </div>

            {/* Modal de Edición/Detalle */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-sidebar-dark w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl border border-white dark:border-white/10"
                        >
                            <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-serif font-bold text-primary dark:text-white">Seguimiento de Capacitación</h3>
                                    <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-1">ID Reserva: #{selectedTraining?.id}</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all"><span className="material-symbols-outlined">close</span></button>
                            </div>

                            <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                                <form onSubmit={handleUpdate} className="space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Asistencia (Personas)</label>
                                            <input type="number" className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border-none outline-none dark:text-white" value={editData.attendance || ''} onChange={e => setEditData({ ...editData, attendance: e.target.value })} placeholder="Ej: 15" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Volumen de Venta Proyectado</label>
                                            <input type="number" className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border-none outline-none dark:text-white" value={editData.salesVolume || ''} onChange={e => setEditData({ ...editData, salesVolume: e.target.value })} placeholder="Ej: 1200000" />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Estado de la Capacitación</label>
                                            <select className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border-none outline-none dark:text-white appearance-none" value={editData.status || 'CONFIRMADA'} onChange={e => setEditData({ ...editData, status: e.target.value })}>
                                                <option value="CONFIRMADA">CONFIRMADA</option>
                                                <option value="COMPLETADA">COMPLETADA</option>
                                                <option value="CANCELADA">CANCELADA</option>
                                                <option value="SIN_ASISTENCIA">SIN ASISTENCIA</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-accent uppercase tracking-widest ml-1">Fecha/Hora Inicio</label>
                                            <input
                                                type="datetime-local"
                                                className="input-dashboard w-full px-4 py-3 rounded-xl bg-accent/5 dark:bg-accent/10 border border-accent/20 outline-none dark:text-white"
                                                value={editData.startTime ? new Date(new Date(editData.startTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                                                onChange={e => setEditData({ ...editData, startTime: new Date(e.target.value).toISOString() })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-accent uppercase tracking-widest ml-1">Fecha/Hora Fin</label>
                                            <input
                                                type="datetime-local"
                                                className="input-dashboard w-full px-4 py-3 rounded-xl bg-accent/5 dark:bg-accent/10 border border-accent/20 outline-none dark:text-white"
                                                value={editData.endTime ? new Date(new Date(editData.endTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                                                onChange={e => setEditData({ ...editData, endTime: new Date(e.target.value).toISOString() })}
                                            />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Notas Pre-Capacitación</label>
                                            <textarea className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border-none outline-none dark:text-white min-h-[80px]" value={editData.notesPre || ''} onChange={e => setEditData({ ...editData, notesPre: e.target.value })} placeholder="Ej: Cliente solicita refuerzo en técnicas..." />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Notas Post-Capacitación</label>
                                            <textarea className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border-none outline-none dark:text-white min-h-[100px]" value={editData.notesPost || ''} onChange={e => setEditData({ ...editData, notesPost: e.target.value })} placeholder="Ej: Se logró buena receptividad, resolver dudas sobre X..." />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-primary dark:bg-accent text-white dark:text-primary rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">save</span>
                                        GUARDAR CAMBIOS
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};


export default Dashboard;
const ReportShareModal = ({ ticket, user, onClose }) => {
    const [loading, setLoading] = useState(false);

    const generatePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(41, 80, 38);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('REPORTE DE CASO PQR', 20, 25);
        doc.setFontSize(10);
        doc.text(`ID: ${ticket.id.toUpperCase()}`, pageWidth - 60, 25);

        // Body - Patient Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text('DATOS DEL PACIENTE', 20, 55);
        doc.line(20, 58, 190, 58);

        doc.setFontSize(10);
        doc.text(`Nombre: ${ticket.patientName}`, 25, 68);
        doc.text(`Teléfono: ${ticket.phone}`, 25, 75);
        doc.text(`Ciudad: ${ticket.city}`, 25, 82);
        doc.text(`Correo: ${ticket.email || 'N/A'}`, 110, 68);
        doc.text(`Creado el: ${new Date(ticket.createdAt).toLocaleDateString()}`, 110, 75);

        // Diagnosis
        doc.setFontSize(12);
        doc.text('MOTIVO / DIAGNÓSTICO INICIAL', 20, 95);
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const splitDesc = doc.splitTextToSize(ticket.description, 160);
        doc.text(splitDesc, 25, 102);

        // Evolution
        let y = 130;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text('EVOLUCIÓN Y SEGUIMIENTO', 20, y);
        doc.line(20, y + 3, 190, y + 3);
        y += 15;

        const followUps = [...(ticket.followUps || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        followUps.forEach((fu, i) => {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text(`${new Date(fu.createdAt).toLocaleDateString()} - ${fu.diagnosis || 'Seguimiento'}`, 25, y);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            const content = fu.content || fu.protocol || 'Sin observaciones detalladas.';
            const splitContent = doc.splitTextToSize(content, 150);
            doc.text(splitContent, 30, y + 7);
            y += (splitContent.length * 5) + 15;
        });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generado por ${user.username} - CriisApp`, 20, doc.internal.pageSize.getHeight() - 10);

        return doc;
    };

    const handleShare = async (method) => {
        const doc = generatePDF();

        if (method === 'download') {
            doc.save(`Reporte_${ticket.patientName.replace(/ /g, '_')}.pdf`);
            onClose();
        } else if (method === 'whatsapp') {
            const ticketIdClean = ticket.id.replace(/-/g, '');
            const msg = `Resumen de caso para: ${ticket.patientName}.\nPuede consultar el estado actualizado en: https://criisapp.nariionline.cloud\nID Caso: ${ticketIdClean}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
            onClose();
        } else if (method === 'email') {
            const destEmail = prompt("Ingrese el correo electrónico del destinatario:", ticket.email || "");
            if (!destEmail) return;

            setLoading(true);
            try {
                const pdfBase64 = doc.output('datauristring').split(',')[1];
                const res = await fetch(`${API_URL}/api/tickets/send-report`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                    body: JSON.stringify({
                        ticketId: ticket.id,
                        email: destEmail,
                        pdfBase64,
                        patientName: ticket.patientName
                    })
                });
                if (res.ok) alert('Reporte enviado correctamente por correo');
                else alert('Error al enviar el reporte');
            } catch (err) {
                alert('Error de conexión');
            } finally {
                setLoading(false);
                onClose();
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-sidebar w-full max-w-sm rounded-[32px] overflow-hidden p-8 shadow-2xl border border-gray-100 dark:border-white/5">
                <h4 className="text-xl font-serif font-bold dark:text-white text-center mb-6">Compartir Reporte</h4>
                <div className="grid grid-cols-1 gap-4">
                    <button onClick={() => handleShare('download')} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-accent hover:text-primary transition-all group border border-transparent hover:border-accent/30">
                        <span className="material-symbols-outlined text-2xl text-accent">download</span>
                        <div className="text-left">
                            <p className="font-bold text-sm dark:text-white">Guardar PDF</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-tighter">Descarga Local</p>
                        </div>
                    </button>
                    <button onClick={() => handleShare('whatsapp')} className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/10 text-green-600 hover:bg-green-600 hover:text-white transition-all border border-green-500/20">
                        <span className="material-symbols-outlined text-2xl">chat</span>
                        <div className="text-left">
                            <p className="font-bold text-sm">WhatsApp</p>
                            <p className="text-[10px] opacity-60 uppercase font-bold tracking-tighter">Enviar Invitación</p>
                        </div>
                    </button>
                    <button onClick={() => handleShare('email')} disabled={loading} className="flex items-center gap-4 p-4 rounded-2xl bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20 disabled:opacity-50">
                        <span className="material-symbols-outlined text-2xl">{loading ? 'hourglass_top' : 'mail'}</span>
                        <div className="text-left">
                            <p className="font-bold text-sm">{loading ? 'Enviando...' : 'Correo Electrónico'}</p>
                            <p className="text-[10px] opacity-60 uppercase font-bold tracking-tighter">Adjuntar PDF</p>
                        </div>
                    </button>
                </div>
                <button onClick={onClose} className="w-full mt-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors">Cancelar</button>
            </motion.div>
        </div>
    );
};
