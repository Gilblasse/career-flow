import { User, Settings, LogOut, Bell, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar, IconButton } from '@/components/shared';
import { cn } from '@/lib/utils';

interface HeaderProps {
    onNavigate?: (view: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleNavigate = (view: string) => {
        if (onNavigate) {
            onNavigate(view);
            setIsMenuOpen(false);
        }
    };

    return (
        <header className="h-14 lg:h-16 flex items-center justify-between">
            {/* Search Bar - hidden on small mobile, visible from sm up */}
            <div className="relative hidden sm:block flex-1 max-w-[280px] md:max-w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search"
                    className="pl-11 h-10 lg:h-11 rounded-2xl border-0 bg-card shadow-sm"
                />
            </div>

            {/* Right Section: Notifications & Profile */}
            <div className="flex items-center gap-3 md:gap-6 ml-auto">
                {/* Notification Bell */}
                <div className="relative">
                    <IconButton
                        icon={<Bell className="h-5 w-5" />}
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                        label="Notifications"
                    />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full border border-background" />
                </div>

                {/* Profile */}
                <div
                    ref={menuRef}
                    className="flex items-center gap-2 md:gap-4 relative cursor-pointer"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <div className="text-right hidden sm:block">
                        <div className="font-semibold text-sm">H. Johnson</div>
                        <div className="text-xs text-muted-foreground">Admin</div>
                    </div>
                    <UserAvatar 
                        src="https://i.pravatar.cc/150?img=11" 
                        name="H. Johnson"
                        className={cn(isMenuOpen && "ring-2 ring-primary")}
                    />

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div 
                            className="absolute top-full right-0 mt-2 w-48 bg-card rounded-xl shadow-lg border border-border overflow-hidden z-50 animate-in fade-in-0 zoom-in-95"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-1.5">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-2.5 font-normal"
                                    onClick={() => handleNavigate('profile')}
                                >
                                    <User className="h-4 w-4" /> Profile
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-2.5 font-normal"
                                    onClick={() => handleNavigate('settings')}
                                >
                                    <Settings className="h-4 w-4" /> Settings
                                </Button>
                                <div className="h-px bg-border my-1" />
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-2.5 font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <LogOut className="h-4 w-4" /> Logout
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
