import { Home, FileUser, FileText, KanbanSquare, LifeBuoy, Zap, User, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
import { NavButton } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { ReactNode } from 'react';

interface SidebarProps {
    currentView: string;
    onNavigate: (view: string) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

interface MenuItem {
    name: string;
    icon: ReactNode;
    id: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isCollapsed, onToggleCollapse }) => {

    const menuItems: MenuItem[] = [
        { name: 'Dashboard', icon: <Home className="h-5 w-5" />, id: 'dashboard' },
        { name: 'Job Board', icon: <Briefcase className="h-5 w-5" />, id: 'job-board' },
        { name: 'Profile', icon: <User className="h-5 w-5" />, id: 'profile' },
        { name: 'Resume', icon: <FileUser className="h-5 w-5" />, id: 'resume' },
        { name: 'Cover letter', icon: <FileText className="h-5 w-5" />, id: 'cover-letter' },
        { name: 'Application Process', icon: <KanbanSquare className="h-5 w-5" />, id: 'kanban' },
        { name: 'Help Center', icon: <LifeBuoy className="h-5 w-5" />, id: 'help' },
        { name: 'Auto Apply', icon: <Zap className="h-5 w-5" />, id: 'auto-apply' },
    ];

    return (
        <TooltipProvider delayDuration={0}>
            <aside className={`
                bg-background flex flex-col lg:sticky h-full lg:h-screen lg:top-0 border-r border-border
                transition-all duration-300 ease-in-out
                ${isCollapsed ? 'w-[72px] p-3' : 'w-full lg:w-64 p-6'}
            `}>
                {/* Brand & Toggle */}
                <div className={`flex items-center mb-10 ${isCollapsed ? 'justify-center' : 'gap-2.5 pl-2.5'}`}>
                    {isCollapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={onToggleCollapse}
                                    className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl hover:opacity-90 transition-opacity"
                                >
                                    T
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                Expand sidebar
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <>
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
                                T
                            </div>
                            <span className="text-xl font-bold text-foreground flex-1">Talt.AI</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggleCollapse}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </>
                    )}
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
                                    collapsed={isCollapsed}
                                />
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Upgrade Box */}
                {isCollapsed ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                className="w-full h-12 mt-auto shadow-md"
                            >
                                <span className="text-lg">✨</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            Upgrade to PRO
                        </TooltipContent>
                    </Tooltip>
                ) : (
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
                )}
            </aside>
        </TooltipProvider>
    );
};

export default Sidebar;
