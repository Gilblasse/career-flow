import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../../types';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Save, Loader2, Plus, Trash2, X } from 'lucide-react';

const ResumePage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [parsedData, setParsedData] = useState<Partial<UserProfile> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    // Skills Input State
    const [newSkill, setNewSkill] = useState("");

    // Auto-scroll Refs
    const experienceEndRef = React.useRef<HTMLDivElement>(null);
    const educationEndRef = React.useRef<HTMLDivElement>(null);
    const [justAdded, setJustAdded] = useState<'exp' | 'edu' | null>(null);

    // Auto-scroll effect
    useEffect(() => {
        if (justAdded === 'exp' && experienceEndRef.current) {
            experienceEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setJustAdded(null);
        }
        if (justAdded === 'edu' && educationEndRef.current) {
            educationEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setJustAdded(null);
        }
    }, [parsedData, justAdded]);

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
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (!allowedTypes.includes(file.type)) {
            setError('Please upload a PDF, DOC, or DOCX file.');
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

    // --- Edit Handlers ---

    const updateContact = (field: string, value: string) => {
        if (!parsedData) return;
        setParsedData({
            ...parsedData,
            contact: { ...parsedData.contact, [field]: value } as any
        });
    };

    const updateExperience = (index: number, field: string, value: string) => {
        if (!parsedData || !parsedData.experience) return;
        const newExp = [...parsedData.experience];
        newExp[index] = { ...newExp[index], [field]: value };
        setParsedData({ ...parsedData, experience: newExp });
    };

    const addExperience = () => {
        if (!parsedData) return;
        const newExp = [...(parsedData.experience || []), { title: "New Role", company: "Company", description: "" }];
        setParsedData({ ...parsedData, experience: newExp });
        setJustAdded('exp');
    };

    const removeExperience = (index: number) => {
        if (!parsedData || !parsedData.experience) return;
        const newExp = parsedData.experience.filter((_, i) => i !== index);
        setParsedData({ ...parsedData, experience: newExp });
    };

    // Education Handlers
    const updateEducation = (index: number, field: string, value: string) => {
        if (!parsedData || !parsedData.education) return;
        const newEdu = [...parsedData.education];
        newEdu[index] = { ...newEdu[index], [field]: value };
        setParsedData({ ...parsedData, education: newEdu });
    };

    const addEducation = () => {
        if (!parsedData) return;
        const newEdu = [...(parsedData.education || []), { institution: "University", degree: "Degree", description: "" }];
        setParsedData({ ...parsedData, education: newEdu });
        setJustAdded('edu');
    };

    const removeEducation = (index: number) => {
        if (!parsedData || !parsedData.education) return;
        const newEdu = parsedData.education.filter((_, i) => i !== index);
        setParsedData({ ...parsedData, education: newEdu });
    };

    // Skills Handlers
    const removeSkill = (skillToRemove: string) => {
        if (!parsedData || !parsedData.skills) return;
        const newSkills = parsedData.skills.filter(s => s !== skillToRemove);
        setParsedData({ ...parsedData, skills: newSkills });
    };

    const addSkill = () => {
        if (!parsedData || !newSkill.trim()) return;
        const currentSkills = parsedData.skills || [];
        if (!currentSkills.includes(newSkill.trim())) {
            setParsedData({ ...parsedData, skills: [...currentSkills, newSkill.trim()] });
        }
        setNewSkill("");
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '50px' }}>

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
                    accept=".pdf,.doc,.docx"
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
                            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, DOC, DOCX files only (max 5MB)'}
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
                            <CheckCircle size={20} color="#059669" /> Parsed Results (Editable)
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
                        {/* Left Col: Contact Info (Editable) */}
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Contact Details</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <FieldInput label="First Name" value={parsedData.contact?.firstName} onChange={(v) => updateContact('firstName', v)} />
                                <FieldInput label="Last Name" value={parsedData.contact?.lastName} onChange={(v) => updateContact('lastName', v)} />
                                <FieldInput label="Email" value={parsedData.contact?.email} onChange={(v) => updateContact('email', v)} />
                                <FieldInput label="Phone" value={parsedData.contact?.phone} onChange={(v) => updateContact('phone', v)} />
                            </div>
                        </div>

                        {/* Right Col: Detailed Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            {/* Experience (Editable) */}
                            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>Experience</h3>
                                    <button onClick={addExperience} style={{ color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: '500' }}>
                                        <Plus size={16} /> Add Role
                                    </button>
                                </div>

                                {parsedData.experience && parsedData.experience.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {parsedData.experience.map((exp: any, i: number) => (
                                            <div key={i} style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #F3F4F6', position: 'relative' }}>
                                                <button
                                                    onClick={() => removeExperience(i)}
                                                    style={{ position: 'absolute', top: '12px', right: '12px', color: '#9CA3AF', cursor: 'pointer', background: 'none', border: 'none' }}
                                                    title="Remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                                    <input
                                                        type="text"
                                                        value={exp.title || ""}
                                                        onChange={(e) => updateExperience(i, 'title', e.target.value)}
                                                        placeholder="Job Title"
                                                        style={inputStyle}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={exp.company || ""}
                                                        onChange={(e) => updateExperience(i, 'company', e.target.value)}
                                                        placeholder="Company"
                                                        style={inputStyle}
                                                    />
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                                    <input
                                                        type="text"
                                                        value={exp.startDate || ""}
                                                        onChange={(e) => updateExperience(i, 'startDate', e.target.value)}
                                                        placeholder="Start Date"
                                                        style={inputStyle}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={exp.endDate || ""}
                                                        onChange={(e) => updateExperience(i, 'endDate', e.target.value)}
                                                        placeholder="End Date"
                                                        style={inputStyle}
                                                    />
                                                </div>

                                                <textarea
                                                    value={exp.description || ""}
                                                    onChange={(e) => updateExperience(i, 'description', e.target.value)}
                                                    placeholder="Description..."
                                                    rows={4}
                                                    style={{ ...inputStyle, width: '100%', minHeight: '80px', resize: 'vertical' }}
                                                />
                                            </div>
                                        ))}
                                        <div ref={experienceEndRef} />
                                    </div>
                                ) : (
                                    <p style={{ color: '#9CA3AF', fontStyle: 'italic' }}>No experience sections detected.</p>
                                )}
                            </div>

                            {/* Education (Editable) */}
                            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>Education</h3>
                                    <button onClick={addEducation} style={{ color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: '500' }}>
                                        <Plus size={16} /> Add Education
                                    </button>
                                </div>

                                {parsedData.education && parsedData.education.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {parsedData.education.map((edu: any, i: number) => (
                                            <div key={i} style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #F3F4F6', position: 'relative' }}>
                                                <button
                                                    onClick={() => removeEducation(i)}
                                                    style={{ position: 'absolute', top: '12px', right: '12px', color: '#9CA3AF', cursor: 'pointer', background: 'none', border: 'none' }}
                                                    title="Remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '12px' }}>
                                                    <input
                                                        type="text"
                                                        value={edu.institution || ""}
                                                        onChange={(e) => updateEducation(i, 'institution', e.target.value)}
                                                        placeholder="Institution / University"
                                                        style={inputStyle}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={edu.degree || ""}
                                                        onChange={(e) => updateEducation(i, 'degree', e.target.value)}
                                                        placeholder="Degree / Certificate"
                                                        style={inputStyle}
                                                    />
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                    <input
                                                        type="text"
                                                        value={edu.startDate || ""}
                                                        onChange={(e) => updateEducation(i, 'startDate', e.target.value)}
                                                        placeholder="Start Date (e.g., Aug 2011)"
                                                        style={inputStyle}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={edu.endDate || ""}
                                                        onChange={(e) => updateEducation(i, 'endDate', e.target.value)}
                                                        placeholder="End Date (e.g., May 2015)"
                                                        style={inputStyle}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={educationEndRef} />
                                    </div>
                                ) : (
                                    <p style={{ color: '#9CA3AF', fontStyle: 'italic' }}>No education detected.</p>
                                )}
                            </div>

                            {/* Projects (Editable) */}
                            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>Projects</h3>
                                    <button onClick={() => {
                                        const newProjects = [...(parsedData.projects || []), { name: '', description: '', technologies: [] }];
                                        setParsedData({ ...parsedData, projects: newProjects });
                                    }} style={{ color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: '500' }}>
                                        <Plus size={16} /> Add Project
                                    </button>
                                </div>

                                {parsedData.projects && parsedData.projects.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {parsedData.projects.map((proj: any, i: number) => (
                                            <div key={i} style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #F3F4F6', position: 'relative' }}>
                                                <button
                                                    onClick={() => {
                                                        const newProjects = parsedData.projects?.filter((_: any, idx: number) => idx !== i);
                                                        setParsedData({ ...parsedData, projects: newProjects });
                                                    }}
                                                    style={{ position: 'absolute', top: '12px', right: '12px', color: '#9CA3AF', cursor: 'pointer', background: 'none', border: 'none' }}
                                                    title="Remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                                    <input
                                                        type="text"
                                                        value={proj.name || ""}
                                                        onChange={(e) => {
                                                            const newProjects = [...(parsedData.projects || [])];
                                                            newProjects[i] = { ...newProjects[i], name: e.target.value };
                                                            setParsedData({ ...parsedData, projects: newProjects });
                                                        }}
                                                        placeholder="Project Name"
                                                        style={inputStyle}
                                                    />
                                                    <textarea
                                                        value={proj.description || ""}
                                                        onChange={(e) => {
                                                            const newProjects = [...(parsedData.projects || [])];
                                                            newProjects[i] = { ...newProjects[i], description: e.target.value };
                                                            setParsedData({ ...parsedData, projects: newProjects });
                                                        }}
                                                        placeholder="Project Description..."
                                                        rows={3}
                                                        style={{ ...inputStyle, width: '100%', minHeight: '60px', resize: 'vertical' }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#9CA3AF', fontStyle: 'italic' }}>No projects detected.</p>
                                )}
                            </div>

                            {/* Skills (Editable) */}
                            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Detail Skills Extraction</h3>

                                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                    <input
                                        type="text"
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                                        placeholder="Add a skill..."
                                        style={inputStyle}
                                    />
                                    <button onClick={addSkill} style={{ backgroundColor: '#2563EB', color: 'white', padding: '8px 16px', borderRadius: '6px', fontWeight: '500' }}>Add</button>
                                </div>

                                {parsedData.skills && parsedData.skills.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {parsedData.skills.map((skill: string, i: number) => (
                                            <span key={i} style={{
                                                backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '4px 8px 4px 12px',
                                                borderRadius: '20px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px'
                                            }}>
                                                {skill}
                                                <button onClick={() => removeSkill(skill)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#1D4ED8', padding: 0, display: 'flex' }}>
                                                    <X size={14} />
                                                </button>
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

// Styles
const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    transition: 'border-color 0.2s'
};

const FieldInput = ({ label, value, onChange }: { label: string, value?: string, onChange: (v: string) => void }) => (
    <div>
        <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>{label}</label>
        <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyle}
            placeholder={label}
        />
    </div>
);

export default ResumePage;
