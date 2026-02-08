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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth >= 1024) setIsSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        fetchTickets();
        fetchStats();
        if (user.role === 'SUPERADMIN') fetchUsers();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchTickets = async () => {
        try {
            const response = await fetch(`${API_URL}/api/tickets`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            setTickets(data);
        } catch (err) { console.error('Error fetching tickets:', err); }
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
            setUsers(data);
        } catch (err) { console.error('Error fetching users:', err); }
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

    if (user.role === 'SUPERADMIN') {
        navItems.push({ id: 'users', label: 'Gestión Usuarios', icon: 'group' });
        navItems.push({ id: 'settings', label: 'Configuración', icon: 'settings' });
    }

    const renderContent = () => {
        switch (view) {
            case 'new': return <NewTicketForm user={user} onSuccess={() => { setView('list'); fetchTickets(); }} isMobile={isMobile} />;
            case 'list': return <TicketList tickets={tickets} user={user} users={users} onUpdate={fetchTickets} isMobile={isMobile} />;
            case 'reports': return <ReportsView tickets={tickets} user={user} users={users} isMobile={isMobile} />;
            case 'stats': return <StatsView stats={stats} users={users} user={user} onRefresh={fetchStats} isMobile={isMobile} />;
            case 'users': return <UserManagement user={user} users={users} onUpdate={fetchUsers} isMobile={isMobile} />;
            case 'profile': return <ProfileView user={user} onUpdate={handleProfileUpdate} isMobile={isMobile} />;
            case 'settings': return <BrandManagement user={user} onLogoUpdate={(url) => setLogoUrl(url)} />;
            default: return <NewTicketForm user={user} onSuccess={() => { setView('list'); fetchTickets(); }} isMobile={isMobile} />;
        }
    };

    return (
        <div className="flex bg-light dark:bg-darkbg text-primary dark:text-gray-200 h-screen overflow-hidden transition-colors duration-500 w-full">
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-sidebar text-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none h-full`}>
                <div className="p-8 flex flex-col items-center border-b border-white/10">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-3 border border-white/10 shadow-inner overflow-hidden">
                        <img src={logoUrl || logoSkinHealth} alt="Logo" className="w-12 h-12 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span class="material-symbols-outlined text-4xl text-accent">spa</span>'; }} />
                    </div>
                    <h2 className="font-serif text-2xl font-bold tracking-tight text-white">CriisApp</h2>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Panel Administrativo</p>
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
                        <button key={item.id} onClick={() => { setView(item.id); if (isMobile) setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-4 py-3.5 w-full transition-all group rounded-xl font-medium ${view === item.id ? 'bg-white text-primary shadow-lg shadow-black/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'} ${item.mt || ''}`}>
                            <span className={`material-symbols-outlined ${view === item.id ? 'text-accent' : 'group-hover:text-accent transition-colors'}`}>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10 space-y-2">
                    <button
                        onClick={() => document.documentElement.classList.toggle('dark')}
                        className="flex items-center justify-center gap-2 w-full py-3 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/5 transition-all group"
                    >
                        <span className="material-symbols-outlined text-lg group-hover:rotate-45 transition-transform dark:hidden block">dark_mode</span>
                        <span className="material-symbols-outlined text-lg group-hover:rotate-45 transition-transform hidden dark:block">light_mode</span>
                        Cambiar Tema
                    </button>
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
                <header className="h-16 flex items-center justify-between px-4 lg:hidden bg-white/80 dark:bg-sidebar/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 z-30 sticky top-0">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary dark:text-accent text-2xl">spa</span>
                        <span className="font-serif font-bold text-lg dark:text-white">CriisApp</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => document.documentElement.classList.toggle('dark')}
                            className="p-2 rounded-lg text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                            <span className="material-symbols-outlined text-2xl dark:hidden block">dark_mode</span>
                            <span className="material-symbols-outlined text-2xl hidden dark:block">light_mode</span>
                        </button>
                        <button onClick={toggleSidebar} className="p-2 rounded-lg text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-white/10">
                            <span className="material-symbols-outlined text-2xl">menu</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 relative no-scrollbar scroll-smooth">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl -z-10 pointer-events-none transition-colors duration-500" />
                    <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-5xl mx-auto w-full">
                        {renderContent()}
                    </motion.div>
                    <footer className="mt-12 text-center text-[10px] text-gray-400 pb-6 space-y-1">
                        <p>© 2026 CriisApp - Panel de Gestión v2.0</p>
                        <p>Desarrollado por <a href="https://maeva.studio" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors font-semibold">Maeva Studio</a></p>
                    </footer>
                </div>
            </main>
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
        mediaFiles.forEach(file => data.append('media', file));

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
        finally { setLoading(true); }
    };

    return (
        <div className="fade-in-up">
            <div className="mb-8">
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary dark:text-white mb-2">Registrar Nuevo Caso</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Ingresa los detalles del paciente para generar un número de radicado PQR.</p>
            </div>

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
                        className="w-full md:w-auto px-8 py-4 bg-primary dark:bg-accent text-white dark:text-primary rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-primary/90 dark:hover:bg-accent/90 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <span>{loading ? 'Generando...' : 'Generar Ticket'}</span>
                        <span className="material-symbols-outlined">confirmation_number</span>
                    </button>
                </div>
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
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-2xl font-bold text-primary dark:text-white">Gestión de Casos <span className="font-montserrat">({tickets.length})</span></h3>
            </div>

            <div className="grid gap-4">
                {tickets.map((t, idx) => {
                    const isOwner = t.assignedToId === user.id || user.role === 'SUPERADMIN';
                    return (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-panel p-5 md:p-6 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-accent/30 transition-all flex flex-col md:flex-row md:items-center gap-6 group"
                        >
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <span
                                        className="font-montserrat font-bold text-accent cursor-pointer flex items-center gap-1 hover:underline tracking-wider"
                                        title="Click para compartir en WhatsApp"
                                        onClick={() => {
                                            const ticketIdClean = t.id.replace(/-/g, '');
                                            const message = `Hola ${t.patientName}, su número de caso es el ${ticketIdClean}. Puede consultar el estado en: pqr.nariionline.cloud`;
                                            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                                        }}
                                    >
                                        #{t.id.replace(/-/g, '')}
                                        <span className="material-symbols-outlined text-sm">share</span>
                                    </span>
                                    <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
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

                                {user.role === 'SUPERADMIN' && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setReassigning(reassigning === t.id ? null : t.id)}
                                            className="p-2 text-gray-400 hover:text-accent transition-colors"
                                            title="Reasignar"
                                        >
                                            <span className="material-symbols-outlined">person_pin_circle</span>
                                        </button>
                                        <AnimatePresence>
                                            {reassigning === t.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="absolute bottom-full right-0 mb-2 w-56 glass-panel p-3 rounded-xl border border-white/10 shadow-2xl z-20"
                                                >
                                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 px-1">Asignar a:</p>
                                                    <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                                                        {users.map(u => (
                                                            <button
                                                                key={u.id}
                                                                onClick={() => handleReassign(t.id, u.id)}
                                                                className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-accent/10 hover:text-accent transition-all flex items-center gap-2"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">person</span>
                                                                {u.username}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {isOwner ? (
                                    <button
                                        onClick={() => setSelectedTicket(t)}
                                        className="px-6 py-2 bg-primary dark:bg-white text-white dark:text-primary rounded-xl text-sm font-bold shadow-lg hover:shadow-primary/20 dark:hover:shadow-white/10 transition-all hover:scale-105"
                                    >
                                        Gestionar
                                    </button>
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
                                <FollowUpForm ticket={selectedTicket} user={user} onDone={() => { setSelectedTicket(null); onUpdate(); }} />
                            </div>
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

            <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-primary dark:bg-accent text-white dark:text-primary rounded-xl font-bold font-serif shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
            >
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
        <div className="space-y-8 animate-fade-in">
            <div className="mb-6">
                <h1 className="font-montserrat text-3xl font-bold text-primary dark:text-white mb-2">Informes de Gestión</h1>
                <p className="text-gray-500 text-sm">Genera reportes detallados y descarga en formato PDF.</p>
            </div>

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
                                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-3 pointer-events-none text-gray-400">expand_more</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-primary/5 dark:bg-white/5 p-6 rounded-2xl border border-primary/10 dark:border-white/5 font-montserrat">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Casos en el periodo</p>
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-primary dark:text-white mb-2">Gestión de Usuarios</h1>
                    <p className="text-gray-500 text-sm">Administra los accesos y roles de los gestores del sistema.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-6 py-3 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold font-serif shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">person_add</span>
                    Nuevo Gestor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(u => (
                    <motion.div
                        key={u.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-panel p-6 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4 group hover:border-accent/30 transition-all"
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
                            <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                            <span className="inline-block mt-2 px-2 py-0.5 rounded bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider border border-accent/10">
                                {u.role}
                            </span>
                        </div>
                        <button
                            onClick={() => setEditingUser(u)}
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
                            className="bg-white dark:bg-sidebar w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                                <h4 className="font-serif text-xl font-bold dark:text-white">Editar Usuario</h4>
                                <button onClick={() => setEditingUser(null)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="p-8">
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
                                            <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Rol</label>
                                            <select className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                                                <option value="GESTOR">Gestor</option>
                                                <option value="SUPERADMIN">Super Admin</option>
                                            </select>
                                        </div>
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

            {/* Modal Crear */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-sidebar w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                                <h4 className="font-serif text-xl font-bold dark:text-white">Nuevo Gestor</h4>
                                <button onClick={() => setIsCreating(false)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="p-8 max-h-[80vh] overflow-y-auto no-scrollbar">
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
    const [formData, setFormData] = useState({ username: '', name: '', email: '', password: '', confirmPassword: '', role: 'GESTOR', phone: '' });
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
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-3 pointer-events-none text-gray-400">expand_more</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-primary dark:text-gray-300 ml-1">Teléfono</label>
                    <input
                        className="input-dashboard w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm text-primary dark:text-white"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
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
            <p className="text-gray-500 font-serif">Cargando estadísticas...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="mb-6">
                <h1 className="font-montserrat text-3xl font-bold text-primary dark:text-white mb-2">Análisis de Gestión</h1>
                <p className="text-gray-500 text-sm">Monitoreo en tiempo real del rendimiento y distribución de PQRs.</p>
            </div>

            {/* Filtros */}
            <div className="glass-panel p-6 rounded-2xl border border-gray-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Ciudad</label>
                    <div className="relative">
                        <select className="input-dashboard w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm appearance-none" value={filters.city} onChange={e => handleFilterChange('city', e.target.value)}>
                            <option value="">Todas</option>
                            {stats.cityStats.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-2 pointer-events-none text-gray-400">expand_more</span>
                    </div>
                </div>
                {user.role === 'SUPERADMIN' && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Gestor</label>
                        <div className="relative">
                            <select className="input-dashboard w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm appearance-none" value={filters.gestorId} onChange={e => handleFilterChange('gestorId', e.target.value)}>
                                <option value="">Todos</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-2 pointer-events-none text-gray-400">expand_more</span>
                        </div>
                    </div>
                )}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Estado</label>
                    <div className="relative">
                        <select className="input-dashboard w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none text-sm appearance-none" value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
                            <option value="">Todos</option>
                            <option value="PROCESO">En Proceso</option>
                            <option value="CERRADO">Cerrados</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-2 pointer-events-none text-gray-400">expand_more</span>
                    </div>
                </div>
                <button className="px-4 py-2.5 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all flex items-center justify-center" onClick={() => handleFilterChange('reset', '')}>
                    <span className="material-symbols-outlined text-lg">refresh</span>
                </button>
            </div>

            {/* Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Total PQRs" value={stats.totalTickets} icon="all_inbox" color="primary" />
                <StatCard label="Finalizados" value={stats.resolvedTickets} icon="task_alt" color="success" />
                <StatCard label="Ingresos" value={`$${stats.totalRevenue.toLocaleString()}`} icon="payments" color="accent" />
            </div>

            {/* Detalle por Ciudad */}
            <div className="glass-panel p-8 rounded-2xl border border-gray-100 dark:border-white/5">
                <h4 className="font-montserrat text-xl font-bold text-primary dark:text-white mb-6">Distribución Geográfica</h4>
                <div className="space-y-4">
                    {stats.cityStats.map((c, idx) => (
                        <div key={c.city} className="flex items-center gap-4 group">
                            <span className="text-sm font-bold text-gray-400 w-8 font-montserrat">0{idx + 1}</span>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-primary dark:text-gray-200 uppercase tracking-wider">{c.city}</span>
                                    <span className="text-accent font-bold font-montserrat">{c._count._all} casos</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(c._count._all / stats.totalTickets) * 100}%` }}
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

const ProfileView = ({ user, onUpdate, isMobile }) => {
    const [formData, setFormData] = useState({
        username: user.username,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
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
            <div className="mb-6">
                <h1 className="font-serif text-3xl font-bold text-primary dark:text-white mb-2">Mi Perfil</h1>
                <p className="text-gray-500 text-sm">Gestiona tu información personal y credenciales de acceso.</p>
            </div>

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
                <div className="lg:col-span-2">
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
                        </div>

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
    const [loading, setLoading] = useState(false);

    const handleUpdateLogo = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        if (uploadMode === 'file') {
            if (logoFile) formData.append('logo', logoFile);
            if (faviconFile) formData.append('favicon', faviconFile);
            if (horizontalLogoFile) formData.append('horizontalLogo', horizontalLogoFile);
        } else {
            if (logoUrl) formData.append('logoUrl', logoUrl);
            if (faviconUrl) formData.append('faviconUrl', faviconUrl);
            if (horizontalLogoUrl) formData.append('horizontalLogoUrl', horizontalLogoUrl);
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
        <div className="mt-12 space-y-6">
            <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-accent">palette</span>
                <h3 className="font-montserrat text-2xl font-bold dark:text-white">Identidad Visual</h3>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-gray-100 dark:border-white/5 space-y-8">
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
                    <button
                        type="button"
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${uploadMode === 'url' ? 'bg-white dark:bg-sidebar text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}
                        onClick={() => setUploadMode('url')}
                    >
                        URL Externa
                    </button>
                    <button
                        type="button"
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${uploadMode === 'file' ? 'bg-white dark:bg-sidebar text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}
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


export default Dashboard;
