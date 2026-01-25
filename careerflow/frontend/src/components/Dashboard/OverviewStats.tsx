import React from 'react';
import { Send, CheckCircle, Monitor, Star } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    trendUp?: boolean; // Default true handling manually for now
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color, bgColor }) => {
    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)',
            minWidth: '0' // Flex fix
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: bgColor,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {icon}
                </div>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>{title}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '28px', fontWeight: '700', color: color }}>{value}</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-gray)' }}>{change}</span>
            </div>
        </div>
    );
};

const OverviewStats: React.FC = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '5px' }}>Overview</h3>
            <p style={{ color: 'var(--color-text-gray)', fontSize: '14px', marginBottom: '15px' }}>Job application of this month</p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px'
            }}>
                <StatCard
                    title="Total Apply"
                    value="24"
                    change="+10% form last week"
                    icon={<Send size={20} />}
                    color="#446bf2"
                    bgColor="#eef2ff"
                />
                <StatCard
                    title="In Review"
                    value="24"
                    change="+10% form last week"
                    icon={<CheckCircle size={20} />}
                    color="#9b51e0"
                    bgColor="#f3e8ff"
                />
                <StatCard
                    title="Interview"
                    value="24"
                    change="+10% form last week"
                    icon={<Monitor size={20} />}
                    color="#29cc97"
                    bgColor="#eafff5"
                />
                <StatCard
                    title="Offers"
                    value="0"
                    change="-90% form last week"
                    icon={<Star size={20} />}
                    color="#fec400"
                    bgColor="#fff9e5"
                />
            </div>
        </div>
    );
};

export default OverviewStats;
