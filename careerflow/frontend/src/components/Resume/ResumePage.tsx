import React, { useState, useEffect, useRef } from 'react';
import type { UserProfile, ResumeProfile, Experience } from '../../types';
import {
    analyzeDescriptionPattern,
    extractBulletsFromDescription,
    isDescriptionParagraph,
    normalizeBullets
} from '../../utils/text-processing';
import {
    UploadCloud, FileText, CheckCircle, AlertCircle, Save, Loader2, Plus, Trash2, X,
    Sparkles, ChevronRight, ChevronLeft, Download, Award, Lightbulb,
    Eye, Edit3, Target, Link2, GripVertical, FileUp, Zap, ArrowRight, ArrowLeft,
    Mail, Phone, MapPin, Calendar, Building2, Minus, AlertTriangle, Bookmark
} from 'lucide-react';

// Import design system
import {
    colors,
    radius,
    card,
    button,
    input,
    modal,
    tab,
} from '../../styles';

interface ResumePageProps {
    onNavigate?: (view: string, data?: any) => void;
    profileData?: UserProfile | null;
    onRefreshProfile?: () => Promise<void>;
}

const ResumePage: React.FC<ResumePageProps> = ({ onNavigate, profileData, onRefreshProfile }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [parsedData, setParsedData] = useState<Partial<UserProfile> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Resume Profile States
    const [resumeProfiles, setResumeProfiles] = useState<ResumeProfile[]>([]);
    const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
    const [originalSnapshot, setOriginalSnapshot] = useState<{
        experience: Experience[];
        education: any[];
        skills: string[];
    } | null>(null);

    // UI States
    const [currentExpIndex, setCurrentExpIndex] = useState(0);
    const [activeEditorTab, setActiveEditorTab] = useState<'bullets' | 'achievements' | 'context' | 'skills'>('bullets');

    // AI enhancement loading states
    const [enhancingBulletIndex, setEnhancingBulletIndex] = useState<number | null>(null);

    // Tailor for Job modal state
    const [showTailorModal, setShowTailorModal] = useState(false);
    const [jobDescription, setJobDescription] = useState('');
    const [isTailoring, setIsTailoring] = useState(false);

    // Job details inline edit modal
    const [showJobEditModal, setShowJobEditModal] = useState(false);

    // Unsaved changes confirmation modal
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);

    // Bullet / Achievement / Skill Input State
    const [newBullet, setNewBullet] = useState('');
    const [newAchievement, setNewAchievement] = useState('');
    const [newSkill, setNewSkill] = useState('');

    // Preview bullet count (clamped min 2, max 13)
    const [previewBulletCount, setPreviewBulletCount] = useState(5);

    // Upload step tracking
    const [uploadStep, setUploadStep] = useState<'idle' | 'selected' | 'parsing' | 'done'>('idle');

    // Drag and drop state for bullet reordering
    const [draggedBulletIndex, setDraggedBulletIndex] = useState<number | null>(null);
    const [dragOverBulletIndex, setDragOverBulletIndex] = useState<number | null>(null);

    // Ref for PDF export
    const resumeRef = useRef<HTMLDivElement>(null);

    // --- Export PDF Function ---
    const handleExportPDF = async () => {
        if (!resumeRef.current) return;
        
        // Dynamically import html2canvas and jspdf
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');
        
        const element = resumeRef.current;
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: 'letter',
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;
        
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        
        const fileName = profile?.contact?.firstName && profile?.contact?.lastName
            ? `${profile.contact.firstName}_${profile.contact.lastName}_Resume.pdf`
            : 'Resume.pdf';
        
        pdf.save(fileName);
    };

    // --- Load Initial Profile Data ---
    useEffect(() => {
        if (profileData) {
            applyProfileData(profileData);
            return;
        }
        if (onRefreshProfile) {
            onRefreshProfile();
            return;
        }
        fetchProfile();
    }, [profileData, onRefreshProfile]);

    const applyProfileData = (data: any) => {
        // Analyze pattern across all experiences for backward compat
        const dominantPattern = analyzeDescriptionPattern(data.experience || []);

        // Map backend field names and normalize bullets for main profile
        const mainExperiences = (data.experience || []).map((exp: any) => {
            return {
                ...exp,
                bullets: normalizeBullets(exp.bullets, exp.description),
            };
        });

        // Load resume profiles
        const profiles = data.resumeProfiles || [];
        setResumeProfiles(profiles);

        // Determine which profile to load
        const lastEditedId = data.lastEditedProfileId;
        let selectedProfile: ResumeProfile | null = null;
        let experiencesToUse = mainExperiences;
        let educationToUse = data.education || [];
        let skillsToUse = data.skills || [];

        if (lastEditedId && profiles.find((p: ResumeProfile) => p.id === lastEditedId)) {
            setCurrentProfileId(lastEditedId);
            selectedProfile = profiles.find((p: ResumeProfile) => p.id === lastEditedId) || null;
        } else if (profiles.length > 0) {
            setCurrentProfileId(profiles[0].id);
            selectedProfile = profiles[0];
        } else {
            setCurrentProfileId(null);
        }

        // If we have a selected profile with a snapshot, use its data
        if (selectedProfile?.resumeSnapshot) {
            const snapshot = selectedProfile.resumeSnapshot;

            // Normalize bullets in snapshot experiences
            experiencesToUse = (snapshot.experience || []).map((exp: any) => ({
                ...exp,
                bullets: normalizeBullets(exp.bullets, exp.description),
            }));
            educationToUse = snapshot.education || data.education || [];
            skillsToUse = snapshot.skills || data.skills || [];

            setOriginalSnapshot({
                experience: snapshot.experience || [],
                education: snapshot.education || [],
                skills: snapshot.skills || [],
            });
        } else {
            // No selected profile, use main profile data
            setOriginalSnapshot({
                experience: mainExperiences,
                education: data.education || [],
                skills: data.skills || [],
            });
        }

        const mappedProfile = {
            ...data,
            // Use the selected profile's experiences, or main profile if none
            experiences: experiencesToUse,
            education: educationToUse,
            skills: skillsToUse,
        };
        setProfile(mappedProfile);

        if (mappedProfile.experiences && mappedProfile.experiences.length > 0) {
            setCurrentExpIndex(0);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/profile');
            if (res.ok) {
                const data = await res.json();
                applyProfileData(data);
            }
        } catch (err) {
            console.error("Failed to load profile", err);
        }
    };

    // Navigate to context page for save flow
    const handleSaveClick = () => {
        if (!profile || !hasUnsavedChanges) return;
        
        const updatedSnapshot = {
            experience: profile.experiences || [],
            education: profile.education || [],
            skills: profile.skills || [],
        };
        
        onNavigate?.('resume-context', {
            originalSnapshot: originalSnapshot || updatedSnapshot,
            updatedSnapshot,
            profiles: resumeProfiles,
            currentProfileId,
            contact: profile.contact,
        });
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) validateAndSetFile(e.dataTransfer.files[0]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) validateAndSetFile(e.target.files[0]);
    };

    const validateAndSetFile = (file: File) => {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            setError('Please upload a PDF, DOC, or DOCX file.');
            return;
        }
        setFile(file);
        setError(null);
        setUploadStep('selected');
    };

    const handleParse = async () => {
        if (!file) return;
        setIsUploading(true);
        setUploadStep('parsing');
        setError(null);
        const formData = new FormData();
        formData.append('resume', file);

        try {
            const response = await fetch('http://localhost:3001/api/resume/parse', { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Failed to parse resume');
            const data = await response.json();
            setParsedData(data);
            setUploadStep('done');
            // Data is parsed but not saved - user must click Save to persist
        } catch (err: any) {
            setError(err.message || 'An error occurred during parsing.');
            setUploadStep('selected');
        } finally {
            setIsUploading(false);
        }
    };

    // --- AI Features ---

    const enhanceBulletWithAI = async (index: number, bullet: string) => {
        if (!bullet || enhancingBulletIndex !== null) return;
        setEnhancingBulletIndex(index);
        try {
            const currentExp = profile.experiences[currentExpIndex];
            const context = `Role: ${currentExp.title} at ${currentExp.company}. Description: ${currentExp.description || ''}`;

            const res = await fetch('http://localhost:3001/api/resume/enhance-bullet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bullet, context })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to enhance bullet');
            }

            const data = await res.json();

            if (profile && profile.experiences) {
                const newExps = [...profile.experiences];
                const newBullets = [...(newExps[currentExpIndex].bullets || [])];
                newBullets[index] = data.enhanced;
                newExps[currentExpIndex] = { ...newExps[currentExpIndex], bullets: newBullets };
                setProfile({ ...profile, experiences: newExps });
                setHasUnsavedChanges(true);
            }

        } catch (err: any) {
            console.error('AI enhancement failed:', err);
            setError(`AI Error: ${err.message}`);
        } finally {
            setEnhancingBulletIndex(null);
        }
    };

    const handleTailorResume = async () => {
        if (!jobDescription.trim()) return;
        setIsTailoring(true);
        try {
            const allBullets: string[] = [];
            profile.experiences.forEach((exp: any) => {
                if (exp.bullets) allBullets.push(...exp.bullets);
            });

            const res = await fetch('http://localhost:3001/api/resume/tailor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobDescription,
                    bullets: allBullets,
                    skills: profile.skills
                })
            });

            if (!res.ok) throw new Error('Tailoring failed');

            await res.json();
            window.alert("Resume tailored! (This determines which bullets to show)");
            setShowTailorModal(false);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsTailoring(false);
        }
    };

    // --- Experience Helper Methods ---

    const currentExp = profile?.experiences?.[currentExpIndex];

    const updateExperience = (field: string, value: any) => {
        if (!profile || !currentExp) return;
        const newExps = [...profile.experiences];
        newExps[currentExpIndex] = { ...newExps[currentExpIndex], [field]: value };
        setProfile({ ...profile, experiences: newExps });
        setHasUnsavedChanges(true);
    };

    const addBullet = () => {
        if (!newBullet.trim() || !currentExp) return;
        const bullets = currentExp.bullets || [];
        if (bullets.length >= 13) return; // Max limit
        updateExperience('bullets', [...bullets, newBullet.trim()]);
        setNewBullet('');
    };

    const removeBullet = (idx: number) => {
        if (!currentExp?.bullets) return;
        const bullets = currentExp.bullets.filter((_: any, i: number) => i !== idx);
        updateExperience('bullets', bullets);
    };

    const updateBullet = (idx: number, val: string) => {
        if (!currentExp?.bullets) return;
        const bullets = [...currentExp.bullets];
        bullets[idx] = val;
        updateExperience('bullets', bullets);
    };

    const reorderBullets = (fromIndex: number, toIndex: number) => {
        if (!currentExp?.bullets) return;
        const bullets = [...currentExp.bullets];
        const [movedBullet] = bullets.splice(fromIndex, 1);
        bullets.splice(toIndex, 0, movedBullet);
        updateExperience('bullets', bullets);
    };

    const handleBulletDragStart = (e: React.DragEvent, index: number) => {
        setDraggedBulletIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleBulletDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedBulletIndex !== null && draggedBulletIndex !== index) {
            setDragOverBulletIndex(index);
        }
    };

    const handleBulletDragLeave = () => {
        setDragOverBulletIndex(null);
    };

    const handleBulletDrop = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        if (draggedBulletIndex !== null && draggedBulletIndex !== toIndex) {
            reorderBullets(draggedBulletIndex, toIndex);
        }
        setDraggedBulletIndex(null);
        setDragOverBulletIndex(null);
    };

    const handleBulletDragEnd = () => {
        setDraggedBulletIndex(null);
        setDragOverBulletIndex(null);
    };

    const addAchievement = () => {
        if (!newAchievement.trim() || !currentExp) return;
        const achievements = currentExp.achievements || [];
        updateExperience('achievements', [...achievements, newAchievement.trim()]);
        setNewAchievement('');
    };

    const removeAchievement = (idx: number) => {
        if (!currentExp?.achievements) return;
        const achievements = currentExp.achievements.filter((_: any, i: number) => i !== idx);
        updateExperience('achievements', achievements);
    };

    const addExperience = () => {
        const newExp = { title: "New Role", company: "Company", startDate: "", endDate: "", description: "", bullets: [] };
        const newExps = [...(profile.experiences || []), newExp];
        setProfile({ ...profile, experiences: newExps });
        setCurrentExpIndex(newExps.length - 1);
        setHasUnsavedChanges(true);
    };

    const removeExperience = () => {
        if (profile.experiences.length <= 1) return;
        const newExps = profile.experiences.filter((_: any, i: number) => i !== currentExpIndex);
        setProfile({ ...profile, experiences: newExps });
        setCurrentExpIndex(Math.max(0, currentExpIndex - 1));
        setHasUnsavedChanges(true);
    };

    const goToPrev = () => setCurrentExpIndex(Math.max(0, currentExpIndex - 1));
    const goToNext = () => setCurrentExpIndex(Math.min((profile?.experiences?.length || 1) - 1, currentExpIndex + 1));

    // --- Back Navigation Handler ---
    const handleBack = () => {
        if (hasUnsavedChanges) {
            setShowUnsavedModal(true);
        } else {
            onNavigate?.('dashboard');
        }
    };

    const handleSaveAndLeave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('http://localhost:3001/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile)
            });
            if (!res.ok) throw new Error('Failed to save profile');
            setHasUnsavedChanges(false);
            setShowUnsavedModal(false);
            onNavigate?.('dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscardAndLeave = () => {
        setShowUnsavedModal(false);
        setHasUnsavedChanges(false);
        onNavigate?.('dashboard');
    };

    // --- Styles (using design system) ---
    const styles = {
        card: card.base,
        input: input.base,
        primaryButton: button.primary,
        secondaryButton: button.secondary,
        ghostButton: button.ghost,
        tab: tab.item,
    };

    // Check if we should show the upload view (no profile OR no experiences)
    const hasExperiences = profile?.experiences && profile.experiences.length > 0;

    // --- Upload View ---
    if (!profile || !hasExperiences) {
        return (
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
                {/* Back Button */}
                {onNavigate && (
                    <button
                        onClick={handleBack}
                        style={{
                            ...styles.ghostButton,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: colors.text.muted,
                            padding: '8px 12px',
                            borderRadius: radius.lg,
                            marginBottom: '16px',
                        }}
                    >
                        <ArrowLeft size={18} />
                        <span style={{ fontSize: '14px' }}>Back</span>
                    </button>
                )}

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                        marginBottom: '20px',
                        boxShadow: '0 10px 40px -10px rgba(79, 70, 229, 0.5)',
                    }}>
                        <FileText size={28} color="white" />
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                        Resume Builder
                    </h1>
                    <p style={{ fontSize: '16px', color: '#6B7280', maxWidth: '400px', margin: '0 auto' }}>
                        Upload your resume to extract and enhance your professional experience
                    </p>
                </div>

                {/* Progress Steps */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '40px' }}>
                    {[
                        { step: 1, label: 'Upload', icon: <FileUp size={16} />, key: 'idle' },
                        { step: 2, label: 'Parse', icon: <Zap size={16} />, key: 'parsing' },
                        { step: 3, label: 'Edit', icon: <Edit3 size={16} />, key: 'done' },
                    ].map((item, i) => {
                        const isActive = (uploadStep === 'idle' && item.key === 'idle') ||
                            (uploadStep === 'selected' && item.key === 'idle') ||
                            (uploadStep === 'parsing' && item.key === 'parsing') ||
                            (uploadStep === 'done' && item.key === 'done');
                        const isComplete = (item.key === 'idle' && ['selected', 'parsing', 'done'].includes(uploadStep)) ||
                            (item.key === 'parsing' && uploadStep === 'done');

                        return (
                            <React.Fragment key={item.step}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    borderRadius: '100px',
                                    backgroundColor: isComplete ? '#ECFDF5' : isActive ? '#EEF2FF' : '#F9FAFB',
                                    color: isComplete ? '#059669' : isActive ? '#4F46E5' : '#9CA3AF',
                                    fontWeight: '500',
                                    fontSize: '13px',
                                    transition: 'all 0.3s ease',
                                }}>
                                    {isComplete ? <CheckCircle size={16} /> : item.icon}
                                    {item.label}
                                </div>
                                {i < 2 && (
                                    <div style={{
                                        width: '32px',
                                        height: '2px',
                                        backgroundColor: isComplete ? '#10B981' : '#E5E7EB',
                                        alignSelf: 'center',
                                        borderRadius: '1px',
                                        transition: 'background-color 0.3s ease',
                                    }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Upload Card */}
                {!parsedData ? (
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        style={{
                            ...styles.card,
                            padding: '48px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                            border: dragActive ? '2px dashed #4F46E5' : file ? '2px solid #10B981' : '2px dashed #E5E7EB',
                            backgroundColor: dragActive ? '#F5F3FF' : file ? '#F0FDF4' : 'white',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx"
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        />

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '16px',
                        }}>
                            <div style={{
                                width: '72px',
                                height: '72px',
                                borderRadius: '50%',
                                backgroundColor: file ? '#ECFDF5' : '#EEF2FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                            }}>
                                {file ? (
                                    <CheckCircle size={32} color="#10B981" />
                                ) : (
                                    <UploadCloud size={32} color="#4F46E5" />
                                )}
                            </div>

                            {file ? (
                                <>
                                    <div>
                                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                                            {file.name}
                                        </p>
                                        <p style={{ fontSize: '13px', color: '#6B7280' }}>
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleParse(); }}
                                        disabled={isUploading}
                                        style={{
                                            ...styles.primaryButton,
                                            opacity: isUploading ? 0.7 : 1,
                                            pointerEvents: isUploading ? 'none' : 'auto',
                                            position: 'relative',
                                            zIndex: 10,
                                        }}
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                                Parsing...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={18} />
                                                Extract Resume Data
                                                <ArrowRight size={16} />
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                                            Drop your resume here
                                        </p>
                                        <p style={{ fontSize: '14px', color: '#6B7280' }}>
                                            or <span style={{ color: '#4F46E5', fontWeight: '500' }}>browse files</span>
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                        {['PDF', 'DOC', 'DOCX'].map((type) => (
                                            <span key={type} style={{
                                                padding: '4px 12px',
                                                backgroundColor: '#F3F4F6',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                color: '#6B7280',
                                            }}>
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
                        <div style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '50%',
                            backgroundColor: '#ECFDF5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                        }}>
                            <CheckCircle size={36} color="#10B981" />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                            Resume Parsed Successfully
                        </h3>
                        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                            We extracted {parsedData.experience?.length || 0} experiences and {parsedData.skills?.length || 0} skills
                        </p>
                        <button
                            onClick={() => {
                                setProfile({ ...parsedData, experiences: parsedData.experience });
                                setHasUnsavedChanges(true);
                            }}
                            style={styles.primaryButton}
                        >
                            Continue to Editor
                            <ArrowRight size={16} />
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div style={{
                        marginTop: '16px',
                        padding: '12px 16px',
                        backgroundColor: '#FEF2F2',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#DC2626',
                        fontSize: '14px',
                    }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}
            </div>
        );
    }

    // --- Editor View ---
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', maxWidth: '1400px', margin: '0 auto', padding: '24px', height: 'calc(100vh - 80px)' }}>

            {/* LEFT: Editor Column */}
            <div style={{ overflowY: 'auto', paddingRight: '8px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        {/* Back Button */}
                        {onNavigate && (
                            <button
                                onClick={handleBack}
                                style={{
                                    ...styles.ghostButton,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: colors.text.muted,
                                    padding: '8px 12px',
                                    borderRadius: radius.lg,
                                    marginTop: '2px',
                                }}
                            >
                                <ArrowLeft size={18} />
                                <span style={{ fontSize: '14px' }}>Back</span>
                            </button>
                        )}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>Resume Context</h1>
                            {hasUnsavedChanges && (
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    color: '#F59E0B',
                                    backgroundColor: '#FFFBEB',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid #FEF3C7',
                                }}>Unsaved</span>
                            )}
                        </div>
                            <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Enrich your experiences to generate tailored resumes</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Current Profile Badge */}
                        {currentProfileId && resumeProfiles.find(p => p.id === currentProfileId) && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                backgroundColor: colors.primary[50],
                                border: `1px solid ${colors.primary[200]}`,
                                borderRadius: radius.full,
                                fontSize: '13px',
                                fontWeight: '500',
                                color: colors.primary[700],
                            }}>
                                <Bookmark size={14} />
                                {resumeProfiles.find(p => p.id === currentProfileId)?.name}
                            </div>
                        )}
                        <button
                            onClick={handleSaveClick}
                            disabled={isSaving || !hasUnsavedChanges}
                            style={{
                                ...styles.secondaryButton,
                                backgroundColor: hasUnsavedChanges ? '#ECFDF5' : '#F9FAFB',
                                color: hasUnsavedChanges ? '#059669' : '#9CA3AF',
                                opacity: (!hasUnsavedChanges || isSaving) ? 0.7 : 1,
                                cursor: (!hasUnsavedChanges || isSaving) ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {isSaving ? (
                                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                            ) : (
                                <><Save size={16} /> Save</>)}
                        </button>
                        <button onClick={() => setShowTailorModal(true)} style={styles.primaryButton}>
                            <Target size={16} /> Tailor for Job
                        </button>
                    </div>
                </div>

                {/* Experience Navigator */}
                <div style={{ ...styles.card, marginBottom: '20px', padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button
                            onClick={goToPrev}
                            disabled={currentExpIndex === 0}
                            style={{
                                ...styles.ghostButton,
                                opacity: currentExpIndex === 0 ? 0.4 : 1,
                                cursor: currentExpIndex === 0 ? 'not-allowed' : 'pointer',
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                                <Building2 size={16} color="#6B7280" />
                                <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>
                                    {currentExpIndex + 1} of {profile.experiences?.length || 0}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                                    {currentExp?.title || 'No Title'}
                                </h3>
                                <button onClick={() => setShowJobEditModal(true)} style={{ ...styles.ghostButton, padding: '4px' }}>
                                    <Edit3 size={14} />
                                </button>
                            </div>
                            <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0' }}>{currentExp?.company || 'No Company'}</p>
                        </div>

                        <button
                            onClick={goToNext}
                            disabled={!profile.experiences || currentExpIndex === profile.experiences.length - 1}
                            style={{
                                ...styles.ghostButton,
                                opacity: (!profile.experiences || currentExpIndex === profile.experiences.length - 1) ? 0.4 : 1,
                            }}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Progress dots */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
                        {profile.experiences?.map((_: any, i: number) => (
                            <button
                                key={i}
                                onClick={() => setCurrentExpIndex(i)}
                                style={{
                                    width: i === currentExpIndex ? '20px' : '8px',
                                    height: '8px',
                                    borderRadius: '4px',
                                    backgroundColor: i === currentExpIndex ? '#4F46E5' : '#E5E7EB',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Editor Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', backgroundColor: '#F9FAFB', padding: '6px', borderRadius: '12px' }}>
                    {[
                        { id: 'bullets' as const, label: 'Bullets', icon: <FileText size={14} /> },
                        { id: 'achievements' as const, label: 'Achievements', icon: <Award size={14} /> },
                        { id: 'skills' as const, label: 'Skills', icon: <Zap size={14} /> },
                        // Only show Description tab if description is a paragraph (not bullet-formatted)
                        // and there are no explicit bullet points already
                        ...((currentExp?.description && isDescriptionParagraph(currentExp.description) && (!currentExp?.bullets || currentExp.bullets.length === 0))
                            ? [{ id: 'context' as const, label: 'Description', icon: <FileText size={14} /> }]
                            : []),
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveEditorTab(tab.id)}
                            style={{
                                ...styles.tab(activeEditorTab === tab.id),
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div style={styles.card}>
                    {activeEditorTab === 'bullets' && (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        value={newBullet}
                                        onChange={(e) => setNewBullet(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && (currentExp?.bullets || []).length < 13) {
                                                addBullet();
                                            }
                                        }}
                                        placeholder="Add a bullet point describing your work..."
                                        style={{ ...styles.input, flex: 1 }}
                                        disabled={(currentExp?.bullets || []).length >= 13}
                                    />
                                    <button
                                        onClick={addBullet}
                                        disabled={(currentExp?.bullets || []).length >= 13}
                                        style={{
                                            ...styles.primaryButton,
                                            opacity: (currentExp?.bullets || []).length >= 13 ? 0.5 : 1,
                                            cursor: (currentExp?.bullets || []).length >= 13 ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        <Plus size={16} /> Add
                                    </button>
                                </div>
                                {(currentExp?.bullets || []).length >= 13 && (
                                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                                        Maximum of 13 bullets reached
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {(currentExp?.bullets || []).length === 0 ? (
                                    <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0', fontStyle: 'italic' }}>
                                        No bullet points yet. Add your responsibilities and achievements.
                                    </p>
                                ) : (
                                    currentExp.bullets.map((bullet: string, i: number) => (
                                        <div
                                            key={i}
                                            draggable
                                            onDragStart={(e) => handleBulletDragStart(e, i)}
                                            onDragOver={(e) => handleBulletDragOver(e, i)}
                                            onDragLeave={handleBulletDragLeave}
                                            onDrop={(e) => handleBulletDrop(e, i)}
                                            onDragEnd={handleBulletDragEnd}
                                            style={{
                                                display: 'flex',
                                                gap: '12px',
                                                alignItems: 'flex-start',
                                                padding: '12px',
                                                backgroundColor: draggedBulletIndex === i ? '#E0E7FF' : dragOverBulletIndex === i ? '#EEF2FF' : '#F9FAFB',
                                                borderRadius: '10px',
                                                border: dragOverBulletIndex === i ? '2px dashed #4F46E5' : '1px solid #F3F4F6',
                                                opacity: draggedBulletIndex === i ? 0.5 : 1,
                                                cursor: 'grab',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '2px',
                                                    cursor: 'grab',
                                                    color: '#9CA3AF',
                                                    paddingTop: '4px',
                                                }}
                                                title="Drag to reorder"
                                            >
                                                <GripVertical size={16} />
                                            </div>
                                            <textarea
                                                value={bullet}
                                                onChange={(e) => updateBullet(i, e.target.value)}
                                                rows={2}
                                                style={{ ...styles.input, flex: 1, resize: 'vertical', minHeight: '60px', border: 'none', backgroundColor: 'transparent', padding: '0' }}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <button
                                                    onClick={() => enhanceBulletWithAI(i, bullet)}
                                                    title="Enhance with AI"
                                                    disabled={enhancingBulletIndex === i}
                                                    style={{
                                                        ...styles.ghostButton,
                                                        backgroundColor: '#F5F3FF',
                                                        color: '#7C3AED',
                                                    }}
                                                >
                                                    {enhancingBulletIndex === i ? (
                                                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                                    ) : (
                                                        <Sparkles size={16} />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => removeBullet(i)}
                                                    style={{ ...styles.ghostButton, backgroundColor: '#FEF2F2', color: '#EF4444' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {activeEditorTab === 'achievements' && (
                        <>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <input
                                    value={newAchievement}
                                    onChange={(e) => setNewAchievement(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addAchievement()}
                                    placeholder="Add an achievement (promotions, awards, metrics)..."
                                    style={{ ...styles.input, flex: 1 }}
                                />
                                <button onClick={addAchievement} style={{ ...styles.primaryButton, backgroundColor: '#F59E0B' }}>
                                    <Plus size={16} /> Add
                                </button>
                            </div>

                            {(currentExp?.achievements || []).length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0', fontStyle: 'italic' }}>
                                    No achievements yet. Add promotions, awards, or quantifiable wins.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {currentExp.achievements.map((ach: string, i: number) => (
                                        <div key={i} style={{
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'center',
                                            padding: '12px 16px',
                                            backgroundColor: '#FFFBEB',
                                            borderRadius: '10px',
                                            border: '1px solid #FEF3C7',
                                        }}>
                                            <Award size={18} color="#F59E0B" />
                                            <span style={{ flex: 1, fontSize: '14px', color: '#92400E' }}>{ach}</span>
                                            <button
                                                onClick={() => removeAchievement(i)}
                                                style={{ ...styles.ghostButton, color: '#9CA3AF' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeEditorTab === 'context' && (
                        <>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '12px',
                                padding: '8px 12px',
                                backgroundColor: '#EEF2FF',
                                borderRadius: '8px',
                            }}>
                                <Lightbulb size={16} color="#4F46E5" />
                                <span style={{ fontSize: '13px', color: '#4F46E5', fontWeight: '500' }}>
                                    Standard description (shown if no bullet points) & AI Context
                                </span>
                            </div>
                            <textarea
                                value={currentExp?.description || ''}
                                onChange={(e) => updateExperience('description', e.target.value)}
                                placeholder="E.g., Technically challenging project, strict deadline, used AWS and React, led a team of 5..."
                                rows={6}
                                style={{ ...styles.input, resize: 'vertical' }}
                            />
                        </>
                    )}

                    {activeEditorTab === 'skills' && (
                        <>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <input
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newSkill.trim()) {
                                            const currentSkills = profile.skills || [];
                                            if (!currentSkills.includes(newSkill.trim())) {
                                                setProfile({ ...profile, skills: [...currentSkills, newSkill.trim()] });
                                                setHasUnsavedChanges(true);
                                            }
                                            setNewSkill('');
                                        }
                                    }}
                                    placeholder="Add a skill (e.g., React, Python, Project Management)..."
                                    style={{ ...styles.input, flex: 1 }}
                                />
                                <button
                                    onClick={() => {
                                        if (!newSkill.trim()) return;
                                        const currentSkills = profile.skills || [];
                                        if (!currentSkills.includes(newSkill.trim())) {
                                            setProfile({ ...profile, skills: [...currentSkills, newSkill.trim()] });
                                            setHasUnsavedChanges(true);
                                        }
                                        setNewSkill('');
                                    }}
                                    style={{ ...styles.primaryButton, backgroundColor: '#10B981' }}
                                >
                                    <Plus size={16} /> Add
                                </button>
                            </div>

                            {(!profile.skills || profile.skills.length === 0) ? (
                                <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0', fontStyle: 'italic' }}>
                                    No skills yet. Add skills that will appear on your resume.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {profile.skills.map((skill: string, i: number) => (
                                        <div key={i} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 12px',
                                            backgroundColor: '#ECFDF5',
                                            borderRadius: '20px',
                                            border: '1px solid #D1FAE5',
                                        }}>
                                            <span style={{ fontSize: '13px', fontWeight: '500', color: '#065F46' }}>{skill}</span>
                                            <button
                                                onClick={() => {
                                                    const newSkills = profile.skills.filter((_: string, idx: number) => idx !== i);
                                                    setProfile({ ...profile, skills: newSkills });
                                                    setHasUnsavedChanges(true);
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    padding: '2px',
                                                    cursor: 'pointer',
                                                    color: '#059669',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Job Edit Modal */}
                {showJobEditModal && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ ...styles.card, width: '90%', maxWidth: '500px', padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>Edit Job Details</h3>
                                <button onClick={() => setShowJobEditModal(false)} style={styles.ghostButton}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>Job Title</label>
                                    <input value={currentExp?.title || ''} onChange={(e) => updateExperience('title', e.target.value)} style={styles.input} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>Company</label>
                                    <input value={currentExp?.company || ''} onChange={(e) => updateExperience('company', e.target.value)} style={styles.input} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>Start Date</label>
                                        <input value={currentExp?.startDate || ''} onChange={(e) => updateExperience('startDate', e.target.value)} style={styles.input} placeholder="Jan 2020" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>End Date</label>
                                        <input value={currentExp?.endDate || ''} onChange={(e) => updateExperience('endDate', e.target.value)} style={styles.input} placeholder="Present" />
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={addExperience} style={{ ...styles.secondaryButton, backgroundColor: '#ECFDF5', color: '#059669' }}>
                                        <Plus size={14} /> Add Job
                                    </button>
                                    <button onClick={removeExperience} disabled={profile.experiences?.length <= 1} style={{ ...styles.secondaryButton, backgroundColor: '#FEF2F2', color: '#DC2626', opacity: profile.experiences?.length <= 1 ? 0.5 : 1 }}>
                                        <Trash2 size={14} /> Remove
                                    </button>
                                </div>
                                <button onClick={() => setShowJobEditModal(false)} style={styles.primaryButton}>
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tailor Modal */}
                {showTailorModal && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ ...styles.card, width: '90%', maxWidth: '600px', padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Target size={20} color="white" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>Tailor for Job</h3>
                                        <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Optimize your resume for a specific position</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowTailorModal(false)} style={styles.ghostButton}>
                                    <X size={20} />
                                </button>
                            </div>

                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the job description here..."
                                rows={10}
                                style={{ ...styles.input, resize: 'vertical', marginBottom: '20px' }}
                            />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button onClick={() => setShowTailorModal(false)} style={styles.secondaryButton}>
                                    Cancel
                                </button>
                                <button
                                    onClick={handleTailorResume}
                                    disabled={isTailoring || !jobDescription}
                                    style={{ ...styles.primaryButton, opacity: (isTailoring || !jobDescription) ? 0.6 : 1 }}
                                >
                                    {isTailoring ? (
                                        <>
                                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            Tailor My Resume
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: Live Preview */}
            <div style={{
                backgroundColor: '#F3F4F6',
                borderRadius: '16px',
                padding: '32px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Preview Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Eye size={18} color="#6B7280" />
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#6B7280' }}>Live Preview</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Preview bullets</span>
                            <button
                                onClick={() => setPreviewBulletCount(Math.max(2, previewBulletCount - 1))}
                                disabled={previewBulletCount <= 2}
                                style={{
                                    ...styles.ghostButton,
                                    padding: '4px',
                                    opacity: previewBulletCount <= 2 ? 0.4 : 1,
                                    cursor: previewBulletCount <= 2 ? 'not-allowed' : 'pointer',
                                }}
                            >
                                <Minus size={14} />
                            </button>
                            <span style={{
                                minWidth: '24px',
                                textAlign: 'center',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#6B7280',
                                backgroundColor: '#E5E7EB',
                                padding: '2px 8px',
                                borderRadius: '4px',
                            }}>
                                {previewBulletCount}
                            </span>
                            <button
                                onClick={() => setPreviewBulletCount(Math.min(13, previewBulletCount + 1))}
                                disabled={previewBulletCount >= 13}
                                style={{
                                    ...styles.ghostButton,
                                    padding: '4px',
                                    opacity: previewBulletCount >= 13 ? 0.4 : 1,
                                    cursor: previewBulletCount >= 13 ? 'not-allowed' : 'pointer',
                                }}
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                    <button style={styles.secondaryButton} onClick={handleExportPDF}>
                        <Download size={14} /> Export PDF
                    </button>
                </div>

                {/* Resume Preview - Scrollable with page sizing */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    paddingBottom: '24px',
                }}>
                    {/* Resume Page(s) Container */}
                    <div ref={resumeRef} style={{
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
                        padding: '48px',
                        minHeight: '1056px', /* Letter size height at 96dpi */
                        fontFamily: "'Inter', sans-serif",
                        position: 'relative',
                    }}>
                        {/* Resume Header */}
                        <div style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: '2px solid #111827', breakInside: 'avoid' }}>
                            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                                {profile.contact?.firstName || 'Your'} {profile.contact?.lastName || 'Name'}
                            </h1>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: '#4B5563' }}>
                                {profile.contact?.email && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Mail size={12} />
                                        {profile.contact.email}
                                    </span>
                                )}
                                {profile.contact?.phone && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Phone size={12} />
                                        {profile.contact.phone}
                                    </span>
                                )}
                                {profile.contact?.location && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={12} />
                                        {profile.contact.location}
                                    </span>
                                )}
                                {profile.contact?.linkedin && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Link2 size={12} />
                                        {profile.contact.linkedin}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Professional Experience */}
                        <div style={{ marginBottom: '24px', breakInside: 'avoid-column' }}>
                        <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #E5E7EB', paddingBottom: '6px', marginBottom: '16px' }}>
                            Professional Experience
                        </h2>
                        {profile.experiences?.map((exp: any, i: number) => (
                            <div key={i} style={{ marginBottom: '18px', breakInside: 'avoid' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>{exp.title}</h3>
                                    <span style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={10} />
                                        {exp.startDate} – {exp.endDate || 'Present'}
                                    </span>
                                </div>
                                <p style={{ fontSize: '13px', color: '#4B5563', fontStyle: 'italic', margin: '0 0 8px' }}>{exp.company}</p>

                                {exp.bullets && exp.bullets.length > 0 ? (
                                    <div style={{ marginTop: '6px' }}>
                                        {exp.bullets.slice(0, previewBulletCount).map((bullet: string, j: number) => (
                                            <div key={j} style={{
                                                fontSize: '12px',
                                                color: '#374151',
                                                lineHeight: '1.7',
                                                marginBottom: '4px',
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '8px',
                                            }}>
                                                <span style={{ color: '#6B7280' }}>•</span>
                                                <span>{bullet}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    exp.description && (
                                        <div style={{ marginTop: '6px' }}>
                                            {exp.description.split('\n')
                                                .map((line: string) => line.replace(/^[-–•]\s*/, '').trim())
                                                .filter((line: string) => line.length > 0)
                                                .slice(0, previewBulletCount)
                                                .map((line: string, j: number) => (
                                                    <div key={j} style={{
                                                        fontSize: '12px',
                                                        color: '#374151',
                                                        lineHeight: '1.7',
                                                        marginBottom: '4px',
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '8px',
                                                    }}>
                                                        <span style={{ color: '#6B7280' }}>•</span>
                                                        <span>{line}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    )
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Education */}
                    {profile.education && profile.education.length > 0 && (
                        <div style={{ marginBottom: '24px', breakInside: 'avoid-column' }}>
                            <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #E5E7EB', paddingBottom: '6px', marginBottom: '16px' }}>
                                Education
                            </h2>
                            {profile.education.map((edu: any, i: number) => (
                                <div key={i} style={{ marginBottom: '12px', breakInside: 'avoid' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                        <h3 style={{ fontSize: '13px', fontWeight: '400', color: '#111827', margin: 0 }}>
                                            <span style={{ fontWeight: '700' }}>{edu.degree}</span>{edu.fieldOfStudy ? ` – ${edu.fieldOfStudy}` : ''}
                                        </h3>
                                        {(edu.startDate || edu.endDate) && (
                                            <span style={{ fontSize: '12px', color: '#6B7280' }}>
                                                {edu.startDate}{edu.startDate && edu.endDate ? ' – ' : ''}{edu.endDate}
                                            </span>
                                        )}
                                    </div>
                                    {edu.institution && (
                                        <p style={{ fontSize: '12px', color: '#4B5563', fontStyle: 'italic', margin: '2px 0 0' }}>{edu.institution}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Skills */}
                    {profile.skills && profile.skills.length > 0 && (
                        <div style={{ breakInside: 'avoid-column' }}>
                            <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #E5E7EB', paddingBottom: '6px', marginBottom: '12px' }}>
                                Skills
                            </h2>
                            <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.7' }}>
                                {profile.skills.join(' • ')}
                            </p>
                        </div>
                    )}
                    </div>
                </div>
            </div>

            {/* CSS Animation for spinner */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {/* Unsaved Changes Confirmation Modal */}
            {showUnsavedModal && (
                <div
                    style={modal.overlay}
                    onClick={() => setShowUnsavedModal(false)}
                >
                    <div
                        style={{
                            ...modal.content,
                            maxWidth: '420px',
                            textAlign: 'center',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Warning Icon */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            backgroundColor: '#FEF3C7',
                            color: '#D97706',
                            margin: '0 auto 20px',
                        }}>
                            <AlertTriangle size={28} />
                        </div>

                        {/* Title */}
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: '8px',
                        }}>
                            Unsaved Changes
                        </h3>

                        {/* Description */}
                        <p style={{
                            color: '#6B7280',
                            fontSize: '14px',
                            margin: '0 0 24px 0',
                            lineHeight: 1.6,
                        }}>
                            You have unsaved changes. Do you want to save them before leaving?
                        </p>

                        {/* Actions */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'center',
                        }}>
                            <button
                                onClick={handleDiscardAndLeave}
                                style={{
                                    ...styles.ghostButton,
                                    backgroundColor: '#FEE2E2',
                                    color: '#DC2626',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                }}
                            >
                                Discard
                            </button>
                            <button
                                onClick={() => setShowUnsavedModal(false)}
                                style={{
                                    ...styles.secondaryButton,
                                    padding: '10px 20px',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAndLeave}
                                disabled={isSaving}
                                style={{
                                    ...styles.primaryButton,
                                    padding: '10px 20px',
                                    opacity: isSaving ? 0.7 : 1,
                                    cursor: isSaving ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {isSaving ? (
                                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                                ) : (
                                    'Save & Leave'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumePage;
