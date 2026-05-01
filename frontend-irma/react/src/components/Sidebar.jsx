function Sidebar({ currentPage, onNavigate }) {
    const menu = [
        { id: 'index', label: 'Analisis Lengkap', icon: 'fas fa-layer-group' },
        { id: 'bi-analytics', label: 'Analitik Bisnis', icon: 'fas fa-chart-bar' },
        { id: 'smart-predict', label: 'Fitur Pintar', icon: 'fas fa-robot' },
    ];

    return (
        <aside className="sidebar">
            <div className="logo px-2">
                <i className="fas fa-layer-group"/><span>Prospera</span>
            </div>
            <ul className="nav flex-column">
                {menu.map((item) => (
                    <li className="nav-item" key={item.id}>
                        <button className={`nav-link nav-button ${currentPage === item.id ? 'active' : ''}`} type="button" onClick={() => onNavigate(item.id)}>
                            <i className={item.icon} />
                            <span className="nav-text">{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </aside>
    );
}

export default Sidebar;
