import React, { useState, useEffect, useRef } from 'react';
import type { UserProfile, ResumeProfile, Experience } from '../../types';
import {
    isDescriptionParagraph,
    normalizeBullets
} from '../../utils/text-processing';
import {
    UploadCloud, FileText, CheckCircle, AlertCircle, Save, Loader2, Plus, Trash2, X,
    Sparkles, ChevronRight, ChevronLeft, Download, Award, Lightbulb,
    Eye, Edit3, Target, Link2, GripVertical, FileUp, Zap, ArrowRight, ArrowLeft,
    Mail, Phone, MapPin, Calendar, Building2, Minus, AlertTriangle, Bookmark
} from 'lucide-react';

// Import shadcn/ui components
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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

    // Check if we should show the upload view (no profile OR no experiences)
    const hasExperiences = profile?.experiences && profile.experiences.length > 0;

    // --- Upload View ---
    if (!profile || !hasExperiences) {
        return (
            <div className="max-w-[800px] mx-auto py-14 px-6">
                {/* Back Button */}
                {onNavigate && (
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="mb-4 gap-1.5 text-muted-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm">Back</span>
                    </Button>
                )}

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-violet-500 mb-5 shadow-lg shadow-primary/30">
                        <FileText className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Resume Builder
                    </h1>
                    <p className="text-base text-muted-foreground max-w-[400px] mx-auto">
                        Upload your resume to extract and enhance your professional experience
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center gap-2 mb-10">
                    {[
                        { step: 1, label: 'Upload', icon: <FileUp className="h-4 w-4" />, key: 'idle' },
                        { step: 2, label: 'Parse', icon: <Zap className="h-4 w-4" />, key: 'parsing' },
                        { step: 3, label: 'Edit', icon: <Edit3 className="h-4 w-4" />, key: 'done' },
                    ].map((item, i) => {
                        const isActive = (uploadStep === 'idle' && item.key === 'idle') ||
                            (uploadStep === 'selected' && item.key === 'idle') ||
                            (uploadStep === 'parsing' && item.key === 'parsing') ||
                            (uploadStep === 'done' && item.key === 'done');
                        const isComplete = (item.key === 'idle' && ['selected', 'parsing', 'done'].includes(uploadStep)) ||
                            (item.key === 'parsing' && uploadStep === 'done');

                        return (
                            <React.Fragment key={item.step}>
                                <div className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all",
                                    isComplete && "bg-emerald-50 text-emerald-600",
                                    isActive && !isComplete && "bg-primary/10 text-primary",
                                    !isActive && !isComplete && "bg-muted text-muted-foreground"
                                )}>
                                    {isComplete ? <CheckCircle className="h-4 w-4" /> : item.icon}
                                    {item.label}
                                </div>
                                {i < 2 && (
                                    <div className={cn(
                                        "w-8 h-0.5 self-center rounded-sm transition-colors",
                                        isComplete ? "bg-emerald-500" : "bg-border"
                                    )} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Upload Card */}
                {!parsedData ? (
                    <Card
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={cn(
                            "p-12 text-center cursor-pointer relative transition-all border-2 border-dashed",
                            dragActive && "border-primary bg-primary/5",
                            file && !dragActive && "border-emerald-500 border-solid bg-emerald-50",
                            !dragActive && !file && "border-border bg-background"
                        )}
                    >
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />

                        <div className="flex flex-col items-center gap-4">
                            <div className={cn(
                                "w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all",
                                file ? "bg-emerald-100" : "bg-primary/10"
                            )}>
                                {file ? (
                                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                                ) : (
                                    <UploadCloud className="h-8 w-8 text-primary" />
                                )}
                            </div>

                            {file ? (
                                <>
                                    <div>
                                        <p className="text-base font-semibold text-foreground mb-1">
                                            {file.name}
                                        </p>
                                        <p className="text-[13px] text-muted-foreground">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <Button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleParse(); }}
                                        disabled={isUploading}
                                        className="relative z-10 gap-2"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Parsing...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4" />
                                                Extract Resume Data
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <p className="text-base font-semibold text-foreground mb-1">
                                            Drop your resume here
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            or <span className="text-primary font-medium">browse files</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-3 mt-2">
                                        {['PDF', 'DOC', 'DOCX'].map((type) => (
                                            <Badge key={type} variant="secondary" className="text-xs font-medium">
                                                {type}
                                            </Badge>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                ) : (
                    <Card className="text-center p-12">
                        <div className="w-[72px] h-[72px] rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                            <CheckCircle className="h-9 w-9 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Resume Parsed Successfully
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            We extracted {parsedData.experience?.length || 0} experiences and {parsedData.skills?.length || 0} skills
                        </p>
                        <Button
                            onClick={() => {
                                setProfile({ ...parsedData, experiences: parsedData.experience });
                                setHasUnsavedChanges(true);
                            }}
                            className="gap-2"
                        >
                            Continue to Editor
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Card>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-4 p-3 bg-destructive/10 rounded-lg flex items-center gap-2.5 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}
            </div>
        );
    }

    // --- Editor View ---
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 w-full p-4 lg:p-6 min-h-[calc(100vh-120px)] lg:h-[calc(100vh-80px)]">

            {/* LEFT: Editor Column */}
            <div className="overflow-y-auto lg:pr-2">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start gap-4">
                        {/* Back Button */}
                        {onNavigate && (
                            <Button
                                variant="ghost"
                                onClick={handleBack}
                                className="mt-0.5 gap-1.5 text-muted-foreground"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="text-sm">Back</span>
                            </Button>
                        )}
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-xl font-bold text-foreground">Resume Context</h1>
                                {hasUnsavedChanges && (
                                    <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                                        Unsaved
                                    </Badge>
                                )}
                            </div>
                            <p className="text-muted-foreground text-sm">Enrich your experiences to generate tailored resumes</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        {/* Current Profile Badge */}
                        {currentProfileId && resumeProfiles.find(p => p.id === currentProfileId) && (
                            <Badge variant="outline" className="gap-1.5 text-primary bg-primary/5 border-primary/20">
                                <Bookmark className="h-3.5 w-3.5" />
                                {resumeProfiles.find(p => p.id === currentProfileId)?.name}
                            </Badge>
                        )}
                        <Button
                            variant="outline"
                            onClick={handleSaveClick}
                            disabled={isSaving || !hasUnsavedChanges}
                            className={cn(
                                "gap-2",
                                hasUnsavedChanges && "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                            )}
                        >
                            {isSaving ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                            ) : (
                                <><Save className="h-4 w-4" /> Save</>
                            )}
                        </Button>
                        <Button onClick={() => setShowTailorModal(true)} className="gap-2">
                            <Target className="h-4 w-4" /> Tailor for Job
                        </Button>
                    </div>
                </div>

                {/* Experience Navigator */}
                <Card className="mb-5 p-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToPrev}
                            disabled={currentExpIndex === 0}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>

                        <div className="flex-1 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground font-medium">
                                    {currentExpIndex + 1} of {profile.experiences?.length || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <h3 className="text-base font-semibold text-foreground">
                                    {currentExp?.title || 'No Title'}
                                </h3>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowJobEditModal(true)}>
                                    <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <p className="text-[13px] text-muted-foreground mt-0.5">{currentExp?.company || 'No Company'}</p>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToNext}
                            disabled={!profile.experiences || currentExpIndex === profile.experiences.length - 1}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Progress dots */}
                    <div className="flex justify-center gap-1.5 mt-3">
                        {profile.experiences?.map((_: any, i: number) => (
                            <button
                                key={i}
                                onClick={() => setCurrentExpIndex(i)}
                                className={cn(
                                    "h-2 rounded-full border-0 cursor-pointer transition-all",
                                    i === currentExpIndex ? "w-5 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/30"
                                )}
                            />
                        ))}
                    </div>
                </Card>

                {/* Editor Tabs */}
                <div className="flex gap-2 mb-4 bg-muted p-1.5 rounded-xl">
                    {[
                        { id: 'bullets' as const, label: 'Bullets', icon: <FileText className="h-3.5 w-3.5" /> },
                        { id: 'achievements' as const, label: 'Achievements', icon: <Award className="h-3.5 w-3.5" /> },
                        { id: 'skills' as const, label: 'Skills', icon: <Zap className="h-3.5 w-3.5" /> },
                        // Only show Description tab if description is a paragraph (not bullet-formatted)
                        // and there are no explicit bullet points already
                        ...((currentExp?.description && isDescriptionParagraph(currentExp.description) && (!currentExp?.bullets || currentExp.bullets.length === 0))
                            ? [{ id: 'context' as const, label: 'Description', icon: <FileText className="h-3.5 w-3.5" /> }]
                            : []),
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveEditorTab(tab.id)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all",
                                activeEditorTab === tab.id
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <Card className="p-5">
                    {activeEditorTab === 'bullets' && (
                        <>
                            <div className="flex flex-col gap-2 mb-5">
                                <div className="flex gap-2.5">
                                    <Input
                                        value={newBullet}
                                        onChange={(e) => setNewBullet(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && (currentExp?.bullets || []).length < 13) {
                                                addBullet();
                                            }
                                        }}
                                        placeholder="Add a bullet point describing your work..."
                                        className="flex-1"
                                        disabled={(currentExp?.bullets || []).length >= 13}
                                    />
                                    <Button
                                        onClick={addBullet}
                                        disabled={(currentExp?.bullets || []).length >= 13}
                                        className="gap-1.5"
                                    >
                                        <Plus className="h-4 w-4" /> Add
                                    </Button>
                                </div>
                                {(currentExp?.bullets || []).length >= 13 && (
                                    <span className="text-xs text-muted-foreground">
                                        Maximum of 13 bullets reached
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                {(currentExp?.bullets || []).length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8 italic">
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
                                            className={cn(
                                                "flex gap-3 items-start p-3 rounded-lg transition-all cursor-grab",
                                                draggedBulletIndex === i && "bg-primary/20 opacity-50",
                                                dragOverBulletIndex === i && "bg-primary/10 border-2 border-dashed border-primary",
                                                draggedBulletIndex !== i && dragOverBulletIndex !== i && "bg-muted border border-border"
                                            )}
                                        >
                                            <div
                                                className="flex flex-col items-center gap-0.5 cursor-grab text-muted-foreground pt-1"
                                                title="Drag to reorder"
                                            >
                                                <GripVertical className="h-4 w-4" />
                                            </div>
                                            <Textarea
                                                value={bullet}
                                                onChange={(e) => updateBullet(i, e.target.value)}
                                                rows={2}
                                                className="flex-1 resize-y min-h-[60px] border-0 bg-transparent p-0 focus-visible:ring-0"
                                            />
                                            <div className="flex flex-col gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => enhanceBulletWithAI(i, bullet)}
                                                    title="Enhance with AI"
                                                    disabled={enhancingBulletIndex === i}
                                                    className="h-8 w-8 bg-violet-50 text-violet-600 hover:bg-violet-100"
                                                >
                                                    {enhancingBulletIndex === i ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Sparkles className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeBullet(i)}
                                                    className="h-8 w-8 bg-destructive/10 text-destructive hover:bg-destructive/20"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {activeEditorTab === 'achievements' && (
                        <>
                            <div className="flex gap-2.5 mb-5">
                                <Input
                                    value={newAchievement}
                                    onChange={(e) => setNewAchievement(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addAchievement()}
                                    placeholder="Add an achievement (promotions, awards, metrics)..."
                                    className="flex-1"
                                />
                                <Button onClick={addAchievement} className="gap-1.5 bg-amber-500 hover:bg-amber-600">
                                    <Plus className="h-4 w-4" /> Add
                                </Button>
                            </div>

                            {(currentExp?.achievements || []).length === 0 ? (
                                <p className="text-center text-muted-foreground py-8 italic">
                                    No achievements yet. Add promotions, awards, or quantifiable wins.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    {currentExp.achievements.map((ach: string, i: number) => (
                                        <div key={i} className="flex gap-3 items-center px-4 py-3 bg-amber-50 rounded-lg border border-amber-200">
                                            <Award className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                            <span className="flex-1 text-sm text-amber-800">{ach}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeAchievement(i)}
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeEditorTab === 'context' && (
                        <>
                            <div className="flex items-center gap-2 mb-3 p-2 bg-primary/10 rounded-lg">
                                <Lightbulb className="h-4 w-4 text-primary" />
                                <span className="text-[13px] text-primary font-medium">
                                    Standard description (shown if no bullet points) & AI Context
                                </span>
                            </div>
                            <Textarea
                                value={currentExp?.description || ''}
                                onChange={(e) => updateExperience('description', e.target.value)}
                                placeholder="E.g., Technically challenging project, strict deadline, used AWS and React, led a team of 5..."
                                rows={6}
                                className="resize-y"
                            />
                        </>
                    )}

                    {activeEditorTab === 'skills' && (
                        <>
                            <div className="flex gap-2.5 mb-5">
                                <Input
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
                                    className="flex-1"
                                />
                                <Button
                                    onClick={() => {
                                        if (!newSkill.trim()) return;
                                        const currentSkills = profile.skills || [];
                                        if (!currentSkills.includes(newSkill.trim())) {
                                            setProfile({ ...profile, skills: [...currentSkills, newSkill.trim()] });
                                            setHasUnsavedChanges(true);
                                        }
                                        setNewSkill('');
                                    }}
                                    className="gap-1.5 bg-emerald-500 hover:bg-emerald-600"
                                >
                                    <Plus className="h-4 w-4" /> Add
                                </Button>
                            </div>

                            {(!profile.skills || profile.skills.length === 0) ? (
                                <p className="text-center text-muted-foreground py-8 italic">
                                    No skills yet. Add skills that will appear on your resume.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((skill: string, i: number) => (
                                        <Badge
                                            key={i}
                                            variant="secondary"
                                            className="gap-2 py-1.5 px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                        >
                                            <span className="text-[13px] font-medium">{skill}</span>
                                            <button
                                                onClick={() => {
                                                    const newSkills = profile.skills.filter((_: string, idx: number) => idx !== i);
                                                    setProfile({ ...profile, skills: newSkills });
                                                    setHasUnsavedChanges(true);
                                                }}
                                                className="hover:text-destructive transition-colors"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </Card>

                {/* Job Edit Modal */}
                <Dialog open={showJobEditModal} onOpenChange={setShowJobEditModal}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Edit Job Details</DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-col gap-4">
                            <div>
                                <Label className="text-[13px] font-medium mb-1.5 block">Job Title</Label>
                                <Input value={currentExp?.title || ''} onChange={(e) => updateExperience('title', e.target.value)} />
                            </div>
                            <div>
                                <Label className="text-[13px] font-medium mb-1.5 block">Company</Label>
                                <Input value={currentExp?.company || ''} onChange={(e) => updateExperience('company', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-[13px] font-medium mb-1.5 block">Start Date</Label>
                                    <Input value={currentExp?.startDate || ''} onChange={(e) => updateExperience('startDate', e.target.value)} placeholder="Jan 2020" />
                                </div>
                                <div>
                                    <Label className="text-[13px] font-medium mb-1.5 block">End Date</Label>
                                    <Input value={currentExp?.endDate || ''} onChange={(e) => updateExperience('endDate', e.target.value)} placeholder="Present" />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-6 pt-4 border-t flex justify-between sm:justify-between">
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={addExperience} className="gap-1.5 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100">
                                    <Plus className="h-3.5 w-3.5" /> Add Job
                                </Button>
                                <Button variant="outline" onClick={removeExperience} disabled={profile.experiences?.length <= 1} className="gap-1.5 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
                                    <Trash2 className="h-3.5 w-3.5" /> Remove
                                </Button>
                            </div>
                            <Button onClick={() => setShowJobEditModal(false)}>
                                Done
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Tailor Modal */}
                <Dialog open={showTailorModal} onOpenChange={setShowTailorModal}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                                    <Target className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <DialogTitle>Tailor for Job</DialogTitle>
                                    <DialogDescription>Optimize your resume for a specific position</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <Textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the job description here..."
                            rows={10}
                            className="resize-y mb-5"
                        />

                        <DialogFooter className="gap-3">
                            <Button variant="outline" onClick={() => setShowTailorModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleTailorResume}
                                disabled={isTailoring || !jobDescription}
                                className="gap-2"
                            >
                                {isTailoring ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        Tailor My Resume
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* RIGHT: Live Preview */}
            <div className="bg-muted rounded-2xl p-8 overflow-y-auto flex flex-col">
                {/* Preview Header */}
                <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Live Preview</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Preview bullets</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setPreviewBulletCount(Math.max(2, previewBulletCount - 1))}
                                disabled={previewBulletCount <= 2}
                            >
                                <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="min-w-[24px] text-center text-[13px] font-medium text-muted-foreground bg-border px-2 py-0.5 rounded">
                                {previewBulletCount}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setPreviewBulletCount(Math.min(13, previewBulletCount + 1))}
                                disabled={previewBulletCount >= 13}
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleExportPDF} className="gap-2">
                        <Download className="h-3.5 w-3.5" /> Export PDF
                    </Button>
                </div>

                {/* Resume Preview - Scrollable with page sizing */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-6 pb-6">
                    {/* Resume Page(s) Container */}
                    <div ref={resumeRef} className="bg-white rounded shadow-lg p-12 min-h-[1056px] font-sans relative">
                        {/* Resume Header */}
                        <div className="mb-7 pb-5 border-b-2 border-foreground" style={{ breakInside: 'avoid' }}>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
                                {profile.contact?.firstName || 'Your'} {profile.contact?.lastName || 'Name'}
                            </h1>
                            <div className="flex flex-wrap gap-4 text-[13px] text-gray-600">
                                {profile.contact?.email && (
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="h-3 w-3" />
                                        {profile.contact.email}
                                    </span>
                                )}
                                {profile.contact?.phone && (
                                    <span className="flex items-center gap-1.5">
                                        <Phone className="h-3 w-3" />
                                        {profile.contact.phone}
                                    </span>
                                )}
                                {profile.contact?.location && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="h-3 w-3" />
                                        {profile.contact.location}
                                    </span>
                                )}
                                {profile.contact?.linkedin && (
                                    <span className="flex items-center gap-1.5">
                                        <Link2 className="h-3 w-3" />
                                        {profile.contact.linkedin}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Professional Experience */}
                        <div className="mb-6" style={{ breakInside: 'avoid-column' }}>
                            <h2 className="text-[13px] font-bold text-foreground uppercase tracking-widest border-b border-border pb-1.5 mb-4">
                                Professional Experience
                            </h2>
                            {profile.experiences?.map((exp: any, i: number) => (
                                <div key={i} className="mb-4" style={{ breakInside: 'avoid' }}>
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className="text-sm font-semibold text-foreground">{exp.title}</h3>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-2.5 w-2.5" />
                                            {exp.startDate} – {exp.endDate || 'Present'}
                                        </span>
                                    </div>
                                    <p className="text-[13px] text-gray-600 italic mb-2">{exp.company}</p>

                                    {exp.bullets && exp.bullets.length > 0 ? (
                                        <div className="mt-1.5">
                                            {exp.bullets.slice(0, previewBulletCount).map((bullet: string, j: number) => (
                                                <div key={j} className="text-xs text-gray-700 leading-relaxed mb-1 flex items-start gap-2">
                                                    <span className="text-muted-foreground">•</span>
                                                    <span>{bullet}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        exp.description && (
                                            <div className="mt-1.5">
                                                {exp.description.split('\n')
                                                    .map((line: string) => line.replace(/^[-–•]\s*/, '').trim())
                                                    .filter((line: string) => line.length > 0)
                                                    .slice(0, previewBulletCount)
                                                    .map((line: string, j: number) => (
                                                        <div key={j} className="text-xs text-gray-700 leading-relaxed mb-1 flex items-start gap-2">
                                                            <span className="text-muted-foreground">•</span>
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
                            <div className="mb-6" style={{ breakInside: 'avoid-column' }}>
                                <h2 className="text-[13px] font-bold text-foreground uppercase tracking-widest border-b border-border pb-1.5 mb-4">
                                    Education
                                </h2>
                                {profile.education.map((edu: any, i: number) => (
                                    <div key={i} className="mb-3" style={{ breakInside: 'avoid' }}>
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="text-[13px] text-foreground">
                                                <span className="font-bold">{edu.degree}</span>{edu.fieldOfStudy ? ` – ${edu.fieldOfStudy}` : ''}
                                            </h3>
                                            {(edu.startDate || edu.endDate) && (
                                                <span className="text-xs text-muted-foreground">
                                                    {edu.startDate}{edu.startDate && edu.endDate ? ' – ' : ''}{edu.endDate}
                                                </span>
                                            )}
                                        </div>
                                        {edu.institution && (
                                            <p className="text-xs text-gray-600 italic mt-0.5">{edu.institution}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Skills */}
                        {profile.skills && profile.skills.length > 0 && (
                            <div style={{ breakInside: 'avoid-column' }}>
                                <h2 className="text-[13px] font-bold text-foreground uppercase tracking-widest border-b border-border pb-1.5 mb-3">
                                    Skills
                                </h2>
                                <p className="text-xs text-gray-700 leading-relaxed">
                                    {profile.skills.join(' • ')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Unsaved Changes Confirmation Modal */}
            <Dialog open={showUnsavedModal} onOpenChange={setShowUnsavedModal}>
                <DialogContent className="sm:max-w-[420px] text-center">
                    {/* Warning Icon */}
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mx-auto mb-5">
                        <AlertTriangle className="h-7 w-7" />
                    </div>

                    <DialogHeader className="text-center">
                        <DialogTitle className="text-lg font-semibold text-center">Unsaved Changes</DialogTitle>
                        <DialogDescription className="text-sm text-center">
                            You have unsaved changes. Do you want to save them before leaving?
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex gap-3 justify-center sm:justify-center mt-6">
                        <Button
                            variant="ghost"
                            onClick={handleDiscardAndLeave}
                            className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                        >
                            Discard
                        </Button>
                        <Button variant="outline" onClick={() => setShowUnsavedModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveAndLeave}
                            disabled={isSaving}
                            className="gap-2"
                        >
                            {isSaving ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                            ) : (
                                'Save & Leave'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ResumePage;
