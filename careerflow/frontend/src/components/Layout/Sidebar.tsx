import { Home, FileUser, FileText, KanbanSquare, LifeBuoy, Settings, User } from 'lucide-react';
import { NavButton } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ReactNode } from 'react';

interface SidebarProps {
    currentView: string;
    onNavigate: (view: string) => void;
}

interface MenuItem {
    name: string;
    icon: ReactNode;
    id: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
    const menuItems: MenuItem[] = [
        { name: 'Dashboard', icon: <Home className="h-5 w-5" />, id: 'dashboard' },
        { name: 'Profile', icon: <User className="h-5 w-5" />, id: 'profile' },
        { name: 'Resume', icon: <FileUser className="h-5 w-5" />, id: 'resume' },
        { name: 'Cover letter', icon: <FileText className="h-5 w-5" />, id: 'cover-letter' },
        { name: 'Application Process', icon: <KanbanSquare className="h-5 w-5" />, id: 'kanban' },
        { name: 'Help Center', icon: <LifeBuoy className="h-5 w-5" />, id: 'help' },
        { name: 'Settings', icon: <Settings className="h-5 w-5" />, id: 'settings' },
    ];

    return (
        <aside className="w-64 bg-background flex flex-col p-6 sticky h-screen top-0 border-r border-border">
            {/* Brand */}
            <div className="flex items-center gap-2.5 mb-10 pl-2.5">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
                    T
                </div>
                <span className="text-xl font-bold text-foreground">Talt.AI</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1">
                <ul className="flex flex-col gap-1">
                    {menuItems.map((item) => (
                        <li key={item.id}>
                            <NavButton
                                icon={item.icon}
                                label={item.name}
                                isActive={currentView === item.id}
                                onClick={() => onNavigate(item.id)}
                            />
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Upgrade Box */}
            <Card className="mt-auto bg-muted/50 border-0">
                <CardContent className="p-5 text-center">
                    {/* Rocket Icon */}
                    <div className="mb-2.5 text-3xl">🚀</div>

                    <p className="text-muted-foreground text-sm mb-4">
                        Upgrade to <strong className="text-foreground">PRO</strong> for<br /> more services
                    </p>

                    <Button className="w-full shadow-md">
                        <span>✨</span> Upgrade
                    </Button>
                </CardContent>
            </Card>
        </aside>
    );
};

export default Sidebar;
