import React from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import ProfileBanner from './components/Dashboard/ProfileBanner';
import OverviewStats from './components/Dashboard/OverviewStats';
import JobsTable from './components/Dashboard/JobsTable';
import RightPanel from './components/Dashboard/RightPanel';
import KanbanBoard from './components/Kanban/KanbanBoard';
import ProfilePage from './components/Profile/ProfilePage';
import ResumePage from './components/Resume/ResumePage';
import ResumeContextPage from './components/Resume/ResumeContextPage';
import type { ResumeProfile, Experience, UserProfile } from './types';

// Styles for the layout
const layoutStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'var(--sidebar-width) 1fr',
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg-base)',
};

const mainContainerStyles: React.CSSProperties = {
    padding: '30px 40px',
    display: 'flex',
    flexDirection: 'column',
};

const dashboardGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 340px', // Main content + Right Panel
    gap: '30px',
    alignItems: 'start'
};

const contentColumnStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
};

// Resume Context data type for navigation
interface ResumeContextData {
    originalSnapshot: { experience: Experience[]; education: any[]; skills: string[] };
    updatedSnapshot: { experience: Experience[]; education: any[]; skills: string[] };
    profiles: ResumeProfile[];
    currentProfileId: string | null;
    contact: any;
}

const App: React.FC = () => {
    const [currentView, setCurrentView] = React.useState('dashboard');
    const [resumeContextData, setResumeContextData] = React.useState<ResumeContextData | null>(null);
    const [profileData, setProfileData] = React.useState<UserProfile | null>(null);
    const [isProfileLoading, setIsProfileLoading] = React.useState(false);

    const fetchProfileData = React.useCallback(async () => {
        setIsProfileLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/profile');
            if (res.ok) {
                const data = await res.json();
                setProfileData(data);
            }
        } catch (err) {
            console.error('Failed to load profile:', err);
        } finally {
            setIsProfileLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    // Enhanced navigation handler that can receive data
    const handleNavigate = (view: string, data?: any) => {
        if (view === 'resume-context' && data) {
            setResumeContextData(data);
        }
        setCurrentView(view);
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
        <div style={layoutStyles}>
            <Sidebar currentView={currentView} onNavigate={handleNavigate} />

            <div style={mainContainerStyles}>
                <Header onNavigate={handleNavigate} />

                <main style={dashboardGridStyles}>
                    {currentView === 'dashboard' ? (
                        <>
                            <div style={contentColumnStyles}>
                                {/* Left/Main Column */}
                                <ProfileBanner />
                                <OverviewStats />
                                <JobsTable />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                {/* Right Column */}
                                <RightPanel />
                            </div>
                        </>
                    ) : currentView === 'kanban' ? (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <KanbanBoard />
                        </div>
                    ) : currentView === 'profile' ? (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <ProfilePage
                                profileData={profileData}
                                isProfileLoading={isProfileLoading}
                                onRefreshProfile={fetchProfileData}
                            />
                        </div>
                    ) : currentView === 'resume' ? (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <ResumePage
                                onNavigate={handleNavigate}
                                profileData={profileData}
                                onRefreshProfile={fetchProfileData}
                            />
                        </div>
                    ) : currentView === 'resume-context' && resumeContextData ? (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <ResumeContextPage
                                originalSnapshot={resumeContextData.originalSnapshot}
                                updatedSnapshot={resumeContextData.updatedSnapshot}
                                profiles={resumeContextData.profiles}
                                currentProfileId={resumeContextData.currentProfileId}
                                contact={resumeContextData.contact}
                                onCancel={handleResumeContextCancel}
                                onSave={handleResumeContextSave}
                            />
                        </div>
                    ) : (
                        <div style={{ gridColumn: '1 / -1', padding: '20px', backgroundColor: 'white', borderRadius: '12px' }}>
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
