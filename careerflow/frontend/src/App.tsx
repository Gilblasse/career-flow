import React from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import ProfileBanner from './components/Dashboard/ProfileBanner';
import OverviewStats, { type JobFilterType } from './components/Dashboard/OverviewStats';
import JobsTable from './components/Dashboard/JobsTable';
import ApplicationActivityChart from './components/Dashboard/ApplicationActivityChart';
import RightPanel from './components/Dashboard/RightPanel';
import KanbanBoard from './components/Kanban/KanbanBoard';
import ProfilePage from './components/Profile/ProfilePage';
import ResumePage from './components/Resume/ResumePage';
import ResumeContextPage from './components/Resume/ResumeContextPage';
import JobBoardPage from './components/JobBoard/JobBoardPage';
import AutoApplyPage from './components/AutoApply/AutoApplyPage';
import { AuthPage, useAuth } from './components/Auth';
import type { ResumeProfile, Experience, UserProfile } from './types';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';

// Resume Context data type for navigation
interface ResumeContextData {
    originalSnapshot: { experience: Experience[]; education: any[]; skills: string[] };
    updatedSnapshot: { experience: Experience[]; education: any[]; skills: string[] };
    profiles: ResumeProfile[];
    currentProfileId: string | null;
    contact: any;
}

const App: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const [currentView, setCurrentView] = React.useState('dashboard');
    const [resumeContextData, setResumeContextData] = React.useState<ResumeContextData | null>(null);
    const [profileData, setProfileData] = React.useState<UserProfile | null>(null);
    const [isProfileLoading, setIsProfileLoading] = React.useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
    const [jobFilter, setJobFilter] = React.useState<JobFilterType>('Total Applied');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });

    // Persist sidebar collapsed state to localStorage
    React.useEffect(() => {
        localStorage.setItem('sidebarCollapsed', String(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    const handleToggleSidebar = React.useCallback(() => {
        setIsSidebarCollapsed(prev => !prev);
    }, []);

    // Fetch profile from Supabase when user is authenticated
    const fetchProfileData = React.useCallback(async () => {
        if (!user) return;
        
        setIsProfileLoading(true);
        try {
            // Fetch profile from Supabase
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                console.error('[App] Error fetching profile:', error);
                return;
            }

            if (data) {
                // Transform Supabase profile to UserProfile format
                const profile: UserProfile = {
                    contact: data.contact || {},
                    experience: data.experience || [],
                    education: data.education || [],
                    skills: data.skills || [],
                    preferences: data.preferences || {
                        remoteOnly: false,
                        excludedKeywords: [],
                        maxSeniority: [],
                        locations: [],
                    },
                    resumeProfiles: data.resume_profiles || [],
                    lastEditedProfileId: data.last_edited_profile_id,
                };
                setProfileData(profile);
                console.log('%c[App] Loaded profile from Supabase', 'color: #10B981;');
            }
        } catch (err) {
            console.error('Failed to load profile:', err);
        } finally {
            setIsProfileLoading(false);
        }
    }, [user]);

    React.useEffect(() => {
        if (user) {
            fetchProfileData();
        } else {
            setProfileData(null);
        }
    }, [user, fetchProfileData]);

    // Show auth page if not authenticated
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!user) {
        return <AuthPage />;
    }

    // Enhanced navigation handler that can receive data
    const handleNavigate = (view: string, data?: any) => {
        if (view === 'resume-context' && data) {
            setResumeContextData(data);
        }
        setCurrentView(view);
        setIsMobileSidebarOpen(false); // Close mobile sidebar on navigation
    };

    // Handle save from ResumeContextPage
    const handleResumeContextSave = async (profileId: string | null, newProfileName?: string) => {
        if (!resumeContextData) return;
        
        const isNewProfile = !profileId && newProfileName;
        const newId = isNewProfile ? crypto.randomUUID() : profileId;
        const now = new Date().toISOString();
        
        // Build updated profiles array
        let updatedProfiles: ResumeProfile[];
        
        if (isNewProfile && newProfileName) {
            // Create new profile
            const newProfile: ResumeProfile = {
                id: newId!,
                name: newProfileName,
                resumeSnapshot: resumeContextData.updatedSnapshot,
                createdAt: now,
                updatedAt: now,
            };
            updatedProfiles = [...resumeContextData.profiles, newProfile];
        } else {
            // Update existing profile
            updatedProfiles = resumeContextData.profiles.map(p => 
                p.id === profileId 
                    ? { 
                        ...p, 
                        resumeSnapshot: resumeContextData.updatedSnapshot,
                        updatedAt: now,
                    }
                    : p
            );
        }
        
        // Save to backend
        const res = await fetch('http://localhost:3001/api/profile?skipContactValidation=true', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contact: resumeContextData.contact,
                experience: resumeContextData.updatedSnapshot.experience,
                education: resumeContextData.updatedSnapshot.education,
                skills: resumeContextData.updatedSnapshot.skills,
                resumeProfiles: updatedProfiles,
                lastEditedProfileId: newId,
            }),
        });
        
        if (!res.ok) {
            throw new Error('Failed to save profile');
        }

        await fetchProfileData();
        
        // Navigate to profile page
        setResumeContextData(null);
        setCurrentView('profile');
    };

    // Handle cancel from ResumeContextPage (go back to resume editor)
    const handleResumeContextCancel = () => {
        setCurrentView('resume');
    };

    return (
        <div className={`min-h-screen bg-background lg:grid transition-all duration-300 ease-in-out ${
            isSidebarCollapsed 
                ? 'lg:grid-cols-[var(--sidebar-collapsed-width)_1fr]' 
                : 'lg:grid-cols-[var(--sidebar-width)_1fr]'
        }`}>
            {/* Desktop Sidebar - hidden on mobile */}
            <div className="hidden lg:block">
                <Sidebar 
                    currentView={currentView} 
                    onNavigate={handleNavigate}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={handleToggleSidebar}
                />
            </div>

            {/* Mobile Sidebar Drawer */}
            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                <SheetContent side="left" className="p-0 w-[280px]">
                    <Sidebar 
                        currentView={currentView} 
                        onNavigate={handleNavigate}
                        isCollapsed={false}
                        onToggleCollapse={() => {}}
                    />
                </SheetContent>
            </Sheet>

            <div className="flex flex-col min-h-screen p-4 md:p-6 lg:p-[30px_40px]">
                {/* Header with mobile hamburger */}
                <div className="flex items-center gap-4 mb-6 lg:mb-8">
                    {/* Mobile hamburger button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden shrink-0"
                        onClick={() => setIsMobileSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                    <div className="flex-1">
                        <Header onNavigate={handleNavigate} />
                    </div>
                </div>

                <main className="flex-1">
                    {currentView === 'dashboard' ? (
                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 lg:gap-[30px]">
                            <div className="flex flex-col gap-6 lg:gap-[30px]">
                                {/* Left/Main Column */}
                                <ProfileBanner profile={profileData} />
                                <OverviewStats selectedFilter={jobFilter} onFilterChange={setJobFilter} />
                                <ApplicationActivityChart />
                                <JobsTable activeFilter={jobFilter} onFilterChange={setJobFilter} />
                            </div>

                            {/* Right Column - hidden on mobile/tablet */}
                            <div className="hidden xl:flex flex-col gap-[30px]">
                                <RightPanel />
                            </div>
                        </div>
                    ) : currentView === 'job-board' ? (
                        <JobBoardPage onNavigate={handleNavigate} />
                    ) : currentView === 'kanban' ? (
                        <KanbanBoard />
                    ) : currentView === 'profile' ? (
                        <ProfilePage
                            profileData={profileData}
                            isProfileLoading={isProfileLoading}
                            onRefreshProfile={fetchProfileData}
                        />
                    ) : currentView === 'resume' ? (
                        <ResumePage
                            onNavigate={handleNavigate}
                            profileData={profileData}
                            onRefreshProfile={fetchProfileData}
                        />
                    ) : currentView === 'resume-context' && resumeContextData ? (
                        <ResumeContextPage
                            originalSnapshot={resumeContextData.originalSnapshot}
                            updatedSnapshot={resumeContextData.updatedSnapshot}
                            profiles={resumeContextData.profiles}
                            currentProfileId={resumeContextData.currentProfileId}
                            contact={resumeContextData.contact}
                            onCancel={handleResumeContextCancel}
                            onSave={handleResumeContextSave}
                        />
                    ) : currentView === 'auto-apply' ? (
                        <AutoApplyPage />
                    ) : (
                        <div className="p-5 bg-card rounded-xl">
                            <h2>{currentView.charAt(0).toUpperCase() + currentView.slice(1)}</h2>
                            <p>This page is under construction.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;
