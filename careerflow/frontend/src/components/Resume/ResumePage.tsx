import React, { useState } from 'react';
import type { UserProfile } from '../../types';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Save, Loader2 } from 'lucide-react';

const ResumePage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [parsedData, setParsedData] = useState<Partial<UserProfile> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file.');
            return;
        }
        setFile(file);
        setError(null);
    };

    const handleParse = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);
        const formData = new FormData();
        formData.append('resume', file);

        try {
            const response = await fetch('http://localhost:3001/api/resume/parse', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to parse resume');
            }

            const data = await response.json();
            setParsedData(data);
        } catch (err: any) {
            setError(err.message || 'An error occurred during parsing.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!parsedData) return;

        try {
            const currentProfileRes = await fetch('http://localhost:3001/api/profile');
            const currentProfile = await currentProfileRes.json();

            const mergedProfile = {
                ...currentProfile,
                contact: { ...currentProfile.contact, ...parsedData.contact },
                skills: parsedData.skills ? [...new Set([...(currentProfile.skills || []), ...parsedData.skills])] : currentProfile.skills,
                experience: parsedData.experience,
                education: parsedData.education
            };

            const saveRes = await fetch('http://localhost:3001/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mergedProfile)
            });

            if (!saveRes.ok) throw new Error('Failed to save profile');
            alert('Profile updated successfully!');

        } catch (err: any) {
            setError(err.message || 'Failed to save profile');
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>

            {/* Header Section */}
            <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Resume Parser</h1>
                <p style={{ color: '#6B7280' }}>Upload your resume to automatically populate your profile fields.</p>
            </div>

            {/* Upload Area */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${dragActive ? '#2563EB' : '#E5E7EB'}`,
                    backgroundColor: dragActive ? '#EFF6FF' : 'white',
                    borderRadius: '16px',
                    padding: '40px',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    position: 'relative'
                }}
            >
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />

                <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#DBEAFE',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB'
                    }}>
                        {file ? <FileText size={24} /> : <UploadCloud size={24} />}
                    </div>

                    <div>
                        <p style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                            {file ? file.name : 'Click to upload or drag and drop'}
                        </p>
                        <p style={{ fontSize: '14px', color: '#6B7280' }}>
                            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF files only (max 5MB)'}
                        </p>
                    </div>

                    {file && !isUploading && !parsedData && (
                        <button
                            onClick={(e) => {
                                e.preventDefault(); // Prevent input click bubble
                                handleParse();
                            }}
                            style={{
                                marginTop: '12px',
                                pointerEvents: 'auto',
                                backgroundColor: '#2563EB',
                                color: 'white',
                                padding: '10px 24px',
                                borderRadius: '8px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            Start Parsing
                        </button>
                    )}
                </div>

                {isUploading && (
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563EB', fontWeight: '600' }}>
                            <Loader2 className="animate-spin" size={20} /> Parsing Resume...
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div style={{ padding: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#991B1B', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Results Section */}
            {parsedData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={20} color="#059669" /> Parsed Results
                        </h2>
                        <button
                            onClick={handleSaveProfile}
                            style={{
                                backgroundColor: '#059669',
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                        >
                            <Save size={16} /> Save to Profile
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
                        {/* Left Col: Contact Info */}
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Contact Details</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <FieldDisplay label="First Name" value={parsedData.contact?.firstName} />
                                <FieldDisplay label="Last Name" value={parsedData.contact?.lastName} />
                                <FieldDisplay label="Email" value={parsedData.contact?.email} />
                                <FieldDisplay label="Phone" value={parsedData.contact?.phone} />
                            </div>
                        </div>

                        {/* Right Col: Detailed Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            {/* Experience */}
                            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Experience Included</h3>
                                {parsedData.experience && parsedData.experience.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {parsedData.experience.map((exp: any, i: number) => (
                                            <div key={i} style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #F3F4F6' }}>
                                                <div style={{ fontWeight: '600', color: '#111827' }}>{exp.title}</div>
                                                <div style={{ fontSize: '14px', color: '#4B5563' }}>{exp.company}</div>
                                                <p style={{ marginTop: '4px', fontSize: '13px', color: '#6B7280', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {exp.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#9CA3AF', fontStyle: 'italic' }}>No experience sections detected.</p>
                                )}
                            </div>

                            {/* Skills */}
                            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Detail Skills Extraction</h3>
                                {parsedData.skills && parsedData.skills.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {parsedData.skills.map((skill: string, i: number) => (
                                            <span key={i} style={{
                                                backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '4px 12px',
                                                borderRadius: '20px', fontSize: '13px', fontWeight: '500'
                                            }}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#9CA3AF', fontStyle: 'italic' }}>No skills detected.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const FieldDisplay = ({ label, value }: { label: string, value?: string }) => (
    <div>
        <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
        <div style={{ marginTop: '4px', color: '#111827', fontWeight: '500' }}>{value || <span style={{ color: '#D1D5DB' }}>Not found</span>}</div>
    </div>
);

export default ResumePage;
