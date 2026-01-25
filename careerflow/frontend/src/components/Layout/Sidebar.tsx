import { Home, FileUser, FileText, KanbanSquare, Presentation, LifeBuoy, Settings } from 'lucide-react';

const Sidebar: React.FC = () => {
    const menuItems = [
        { name: 'Dashboard', icon: <Home size={20} />, active: true },
        { name: 'Resume', icon: <FileUser size={20} />, active: false },
        { name: 'Cover letter', icon: <FileText size={20} />, active: false },
        { name: 'Kanban Board', icon: <KanbanSquare size={20} />, active: false },
        { name: 'Mock Test', icon: <Presentation size={20} />, active: false },
        { name: 'Help Center', icon: <LifeBuoy size={20} />, active: false },
        { name: 'Settings', icon: <Settings size={20} />, active: false },
    ];

    return (
        <aside style={{
            width: 'var(--sidebar-width)',
            backgroundColor: 'var(--color-bg-sidebar)',
            display: 'flex',
            flexDirection: 'column',
            padding: '30px 20px',
            position: 'sticky',
            height: '100vh',
            top: 0,
            borderRight: '1px solid #f0f0f0', // Subtle border
        }}>
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', paddingLeft: '10px' }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'var(--color-primary)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '20px'
                }}>T</div>
                <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text-dark)' }}>Talt.AI</span>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1 }}>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {menuItems.map((item) => (
                        <li key={item.name}>
                            <a href="#" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                padding: '12px 20px',
                                borderRadius: '12px', // Slightly rounder
                                color: item.active ? 'var(--color-primary)' : '#52575C', // Specific gray
                                backgroundColor: item.active ? '#F2F6FF' : 'transparent', // Light blue bg
                                fontWeight: item.active ? '700' : '500', // Bolder active state
                                fontSize: '15px',
                                transition: 'all 0.2s ease',
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {item.icon}
                                </span>
                                {item.name}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Upgrade Box */}
            <div style={{
                marginTop: 'auto',
                backgroundColor: '#F5F5F9',
                padding: '20px',
                borderRadius: '20px',
                textAlign: 'center',
                position: 'relative'
            }}>
                {/* Rocket Icon Placeholder */}
                <div style={{ marginBottom: '10px', fontSize: '30px' }}>🚀</div>

                <p style={{ color: 'var(--color-text-gray)', fontSize: '13px', marginBottom: '15px' }}>
                    Upgrade to <strong style={{ color: 'var(--color-text-dark)' }}>PRO</strong> for<br /> more services
                </p>

                <button style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px rgba(68, 107, 242, 0.2)'
                }}>
                    <span>✨</span> Upgrade
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
