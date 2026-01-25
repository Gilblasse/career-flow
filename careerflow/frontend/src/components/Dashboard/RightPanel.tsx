import React from 'react';
import { PenTool, Briefcase, Mail, Settings, Edit2 } from 'lucide-react';

const RightPanel: React.FC = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Complete Profile Card */}
            <div style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-card)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '16px' }}>Complete Profile</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--color-text-gray)' }}>
                        <span>Edit</span>
                        <Edit2 size={12} />
                    </div>
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>Add Portfolio and skills to attract more employer</h4>

                <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-gray)' }}>
                    70% profile completed
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#eef2ff', borderRadius: '3px' }}>
                    <div style={{ width: '70%', height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '3px' }}></div>
                </div>
            </div>

            {/* Calendar / Upcoming Interviews */}
            <div style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-card)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px' }}>Calendar</h3>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-gray)' }}>See all &gt;</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* TODAY Section */}
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-gray)', marginBottom: '15px' }}>TODAY</div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ width: '3px', height: '40px', backgroundColor: '#446bf2' }}></div>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '600' }}>Interview With Google</div>
                                <div style={{ fontSize: '12px', color: 'var(--color-text-gray)' }}>Description</div>
                            </div>
                            <div style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: '600' }}>01 Sept</div>
                        </div>
                    </div>

                    {/* UPCOMING Section */}
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-gray)', marginBottom: '15px', marginTop: '5px' }}>UPCOMING</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ width: '3px', height: '40px', backgroundColor: '#fec400' }}></div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '600' }}>Interview With Google</div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-gray)' }}>time</div>
                                </div>
                                <div style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: '600' }}>05 Sept</div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ width: '3px', height: '40px', backgroundColor: '#29cc97' }}></div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '600' }}>Interview With Google</div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-gray)' }}>time</div>
                                </div>
                                <div style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: '600' }}>07 Sept</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-card)',
                flex: 1
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px' }}>Recent Activity</h3>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-gray)' }}>See all &gt;</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                        <div style={{ padding: '8px', backgroundColor: '#eef2ff', borderRadius: '8px', color: 'var(--color-primary)' }}>
                            <Briefcase size={16} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500' }}>4 new applications for UI/UX designer Post</div>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-gray)' }}>2:03 PM</span>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                        <div style={{ padding: '8px', backgroundColor: '#f3e8ff', borderRadius: '8px', color: '#9b51e0' }}>
                            <PenTool size={16} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500' }}>You have an upcoming interview</div>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-gray)' }}>2:03 PM</span>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                        <div style={{ padding: '8px', backgroundColor: '#eafff5', borderRadius: '8px', color: '#29cc97' }}>
                            <Mail size={16} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500' }}>New Cover Letter has been created</div>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-gray)' }}>2:03 PM</span>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                        <div style={{ padding: '8px', backgroundColor: '#ffecec', borderRadius: '8px', color: '#f12b2c' }}>
                            <Settings size={16} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500' }}>You have changed the password</div>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-gray)' }}>2:03 PM</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RightPanel;
