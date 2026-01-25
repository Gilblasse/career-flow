import React from 'react';

const Header: React.FC = () => {
    return (
        <header style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '30px',
        }}>
            {/* Search Bar */}
            <div style={{
                position: 'relative',
                width: '400px',
            }}>
                <div style={{
                    position: 'absolute',
                    left: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#B0B7C3'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <input
                    type="text"
                    placeholder="Search"
                    style={{
                        width: '100%',
                        padding: '12px 20px 12px 50px',
                        borderRadius: '15px',
                        border: 'none',
                        backgroundColor: 'white',
                        color: 'var(--color-text-dark)',
                        fontSize: 'var(--font-size-base)',
                        outline: 'none',
                        boxShadow: '0px 2px 5px rgba(0,0,0,0.02)'
                    }}
                />
            </div>

            {/* Right Section: Notifications & Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                {/* Notification Bell */}
                <div style={{ position: 'relative', cursor: 'pointer', color: '#B0B7C3' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        width: '8px',
                        height: '8px',
                        backgroundColor: 'var(--color-danger)',
                        borderRadius: '50%',
                        border: '1px solid #fff'
                    }}></span>
                </div>

                {/* Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>H. Johnson</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-gray)' }}>Admin</div>
                    </div>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        backgroundColor: '#e0e0e0',
                        backgroundImage: 'url("https://i.pravatar.cc/150?img=11")', // Placeholder avatar
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}></div>
                </div>
            </div>
        </header>
    );
};

export default Header;
