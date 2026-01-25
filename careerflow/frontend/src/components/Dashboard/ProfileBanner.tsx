import React from 'react';
import { MapPin, Calendar, Briefcase } from 'lucide-react';

const ProfileBanner: React.FC = () => {
    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
            position: 'relative',
            minHeight: '220px',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Top Graphic Banner */}
            <div style={{
                height: '140px',
                backgroundColor: '#dcebf7', // Light blue base
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Abstract blobs matching the design */}
                <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '-20px',
                    width: '150px',
                    height: '150px',
                    backgroundColor: '#cfe2f3',
                    borderRadius: '50%',
                    opacity: 0.6
                }}></div>
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '10%',
                    width: '200px',
                    height: '200px',
                    backgroundColor: '#e3f0fa',
                    borderRadius: '50%',
                    opacity: 0.8
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '-40px',
                    right: '-20px',
                    width: '180px',
                    height: '180px',
                    backgroundColor: '#bfd7ed',
                    borderRadius: '50%',
                    opacity: 0.5
                }}></div>
            </div>

            {/* Bottom Content Section */}
            <div style={{
                padding: '0 30px 25px 30px',
                display: 'flex',
                alignItems: 'flex-end',
                marginTop: '-45px', // Pull content up to overlap
                position: 'relative' // Ensure z-index works
            }}>

                {/* Profile Image - Overlapping */}
                <div style={{
                    width: '130px',
                    height: '130px',
                    borderRadius: '50%',
                    backgroundColor: '#1E2142',
                    border: '5px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    marginRight: '25px',
                    zIndex: 10
                }}>
                    <img src="https://i.pravatar.cc/300?img=11" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* User Info */}
                <div style={{ flex: 1, paddingBottom: '10px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>

                    {/* Name & Role */}
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text-dark)', marginBottom: '4px' }}>Herman Johnson</h1>
                        <p style={{ color: 'var(--color-text-gray)', fontSize: '15px' }}>UI Designer</p>
                    </div>

                    {/* Details - Right Aligned */}
                    <div style={{ display: 'flex', gap: '25px', fontSize: '13px', color: '#52575C', marginBottom: '5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Briefcase size={16} color="#8c91a3" />
                            <span>Cityscaper</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={16} color="#8c91a3" />
                            <span>Berlin, Germany</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={16} color="#8c91a3" />
                            <span>09 Sep 2023</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProfileBanner;
