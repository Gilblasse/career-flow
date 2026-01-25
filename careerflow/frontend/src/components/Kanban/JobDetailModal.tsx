import React, { useState } from 'react';
import { X, FileText, Image, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Duplicate definition to avoid circular deps or complex refactoring for now
import type { Task } from './types';

interface JobDetailModalProps {
    task: Task;
    onClose: () => void;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({ task, onClose }) => {
    const [activeTab, setActiveTab] = useState<'description' | 'application'>('description');

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{
                        backgroundColor: 'white', borderRadius: '16px', width: '800px', maxWidth: '95%',
                        height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div style={{ padding: '24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <div style={{ width: '40px', height: '40px', backgroundColor: '#F3F4F6', borderRadius: '8px' }}></div>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#111827' }}>{task.role}</h2>
                                    <div style={{ fontSize: '16px', color: '#6B7280' }}>at <span style={{ fontWeight: '500', color: '#374151' }}>{task.company}</span></div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                                <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Applied on {task.date}</div>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ padding: '8px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '50%' }} className="hover:bg-gray-100">
                            <X size={24} color="#6B7280" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', padding: '0 24px' }}>
                        <button
                            onClick={() => setActiveTab('description')}
                            style={{
                                padding: '16px 24px', background: 'transparent', border: 'none', cursor: 'pointer',
                                borderBottom: activeTab === 'description' ? '2px solid #3B82F6' : '2px solid transparent',
                                color: activeTab === 'description' ? '#3B82F6' : '#6B7280', fontWeight: '600', fontSize: '14px'
                            }}
                        >
                            Job Description
                        </button>
                        <button
                            onClick={() => setActiveTab('application')}
                            style={{
                                padding: '16px 24px', background: 'transparent', border: 'none', cursor: 'pointer',
                                borderBottom: activeTab === 'application' ? '2px solid #3B82F6' : '2px solid transparent',
                                color: activeTab === 'application' ? '#3B82F6' : '#6B7280', fontWeight: '600', fontSize: '14px'
                            }}
                        >
                            Application Data
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#F9FAFB' }}>
                        {activeTab === 'description' ? (
                            <div style={{ lineHeight: '1.6', color: '#374151', whiteSpace: 'pre-wrap' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>About the Job</h3>
                                {task.jobDescription || "No description available."}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                {/* Application Screenshot */}
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Image size={20} /> Application Screenshot
                                    </h3>
                                    <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
                                        {task.screenshotUrl ? (
                                            <img src={task.screenshotUrl} alt="Application" style={{ width: '100%', height: 'auto', display: 'block' }} />
                                        ) : (
                                            <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', backgroundColor: '#F3F4F6' }}>No screenshot available</div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    {/* Resume */}
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FileText size={20} /> Resume
                                        </h3>
                                        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', backgroundColor: '#EFF6FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                                                <FileText size={24} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>{task.resumeUrl || "Resume.pdf"}</div>
                                                <div style={{ fontSize: '12px', color: '#6B7280' }}>PDF Document</div>
                                            </div>
                                            <button style={{ padding: '8px 16px', fontSize: '13px', color: '#3B82F6', fontWeight: '600', background: 'transparent', border: 'none', cursor: 'pointer' }}>View</button>
                                        </div>
                                    </div>

                                    {/* Cover Letter */}
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <File size={20} /> Cover Letter
                                        </h3>
                                        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', backgroundColor: '#EFF6FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                                                <File size={24} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>{task.coverLetterUrl || "CoverLetter.pdf"}</div>
                                                <div style={{ fontSize: '12px', color: '#6B7280' }}>PDF Document</div>
                                            </div>
                                            <button style={{ padding: '8px 16px', fontSize: '13px', color: '#3B82F6', fontWeight: '600', background: 'transparent', border: 'none', cursor: 'pointer' }}>View</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default JobDetailModal;
