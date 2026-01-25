import React from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import ProfileBanner from './components/Dashboard/ProfileBanner';
import OverviewStats from './components/Dashboard/OverviewStats';
import JobsTable from './components/Dashboard/JobsTable';
import RightPanel from './components/Dashboard/RightPanel';

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

const App: React.FC = () => {
    return (
        <div style={layoutStyles}>
            <Sidebar />

            <div style={mainContainerStyles}>
                <Header />

                <main style={dashboardGridStyles}>
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
                </main>
            </div>
        </div>
    );
};

export default App;
