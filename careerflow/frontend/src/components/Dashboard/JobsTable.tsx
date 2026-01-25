import React, { useState } from 'react';
import { ArrowDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const JobsTable: React.FC = () => {
    const tabs = ['Total Apply', 'Review Phase', 'Interview', 'Total Reject'];
    const [activeTab, setActiveTab] = useState('Total Apply');

    const jobs = [
        { position: 'Product Designer', level: 'Senior Level', company: 'Google', type: 'On-Site', location: 'Berlin', date: '02 Sep 23' },
        { position: 'User Interface Designer', level: 'Senior Level', company: 'Apple', type: 'Remote', location: 'Frankfurt', date: '15 Aug 23' },
        { position: 'UX/UI designer', level: 'Mid Level', company: 'Microsoft', type: 'Flexible', location: 'Hamburg', date: '01 Sep 23' },
        { position: 'UX/UI designer', level: 'Senior Level', company: 'Tesla', type: 'On-Site', location: 'Munich', date: '01 Aug 23' },
    ];

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '30px',
            boxShadow: 'var(--shadow-card)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>My Jobs</h3>
                <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#52575C',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: 'none'
                }}>
                    <Plus size={16} /> Apply New Job
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '30px', marginBottom: '25px', paddingBottom: '0' }}>
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0 0 8px 0',
                            color: activeTab === tab ? '#1a1c23' : '#9fa2b4', // Active text dark/black, inactive gray
                            borderBottom: activeTab === tab ? '2px solid #446bf2' : '2px solid transparent',
                            fontWeight: activeTab === tab ? '700' : '500',
                            fontSize: '13px',
                            transition: 'all 0.2s',
                            background: 'transparent',
                            cursor: 'pointer'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', fontSize: '14px' }}>
                <thead>
                    <tr style={{ textAlign: 'left', color: '#1a1c23', backgroundColor: '#F8F9FC' }}>
                        <th style={{ padding: '15px 20px', fontWeight: '600', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px', width: '25%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                Job Position <ArrowDown size={14} color="#9fa2b4" />
                            </div>
                        </th>
                        <th style={{ padding: '15px 10px', fontWeight: '600' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                Experience Level <ArrowDown size={14} color="#9fa2b4" />
                            </div>
                        </th>
                        <th style={{ padding: '15px 10px', fontWeight: '600' }}>Company Name</th>
                        <th style={{ padding: '15px 10px', fontWeight: '600' }}>Onsite/Remote</th>
                        <th style={{ padding: '15px 10px', fontWeight: '600' }}>Location</th>
                        <th style={{ padding: '15px 20px', fontWeight: '600', borderTopRightRadius: '10px', borderBottomRightRadius: '10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                                Apply Date <ArrowDown size={14} color="#9fa2b4" />
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {/* Spacer row for visual separation */}
                    <tr><td colSpan={6} style={{ height: '10px' }}></td></tr>

                    {jobs.map((job, index) => (
                        <tr key={index}>
                            <td style={{ padding: '18px 20px', fontWeight: '500', color: '#1a1c23', borderBottom: '1px solid #f9f9f9' }}>{job.position}</td>
                            <td style={{ padding: '18px 10px', color: '#52575C', borderBottom: '1px solid #f9f9f9' }}>{job.level}</td>
                            <td style={{ padding: '18px 10px', color: '#52575C', borderBottom: '1px solid #f9f9f9' }}>{job.company}</td>
                            <td style={{ padding: '18px 10px', color: '#52575C', borderBottom: '1px solid #f9f9f9' }}>{job.type}</td>
                            <td style={{ padding: '18px 10px', color: '#52575C', borderBottom: '1px solid #f9f9f9' }}>{job.location}</td>
                            <td style={{ padding: '18px 20px', color: '#52575C', borderBottom: '1px solid #f9f9f9', textAlign: 'right' }}>{job.date}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 'auto', paddingTop: '30px', color: '#9fa2b4', fontSize: '13px' }}>
                Total 03 page &nbsp;&nbsp;
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ChevronLeft size={16} />
                    <span style={{
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #446bf2',
                        borderRadius: '4px',
                        color: '#446bf2',
                        fontWeight: '600'
                    }}>1</span>
                    <span>2</span>
                    <span>...</span>
                    <span>3</span>
                    <ChevronRight size={16} />
                </div>
            </div>
        </div>
    );
};

export default JobsTable;
