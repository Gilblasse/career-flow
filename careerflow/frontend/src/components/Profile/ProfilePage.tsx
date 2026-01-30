import React, { useState, useEffect } from 'react';
import {
    User, Briefcase, GraduationCap, Award, FolderOpen,
    BadgeCheck, Trophy, ChevronRight,
    MapPin, Mail, Phone, Globe, Save,
    UploadCloud, Loader2, CheckCircle, Sparkles,
    Plus, Trash2, X, AlertCircle, RotateCcw, Bookmark, FileText
} from 'lucide-react';
import {
    analyzeDescriptionPattern,
    extractBulletsFromDescription
} from '../../utils/text-processing';
import type { ResumeProfile } from '../../types';
import { RESUME_PROFILE_MAX_COUNT } from '../../types';
import { ProfileSelector } from '../Resume/ProfileSelector';

// Define section types
type SectionType = 'profile' | 'resume-profiles' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'accomplishments';

interface NavItem {
    id: SectionType;
    label: string;
    icon: React.ReactNode;
    description: string;
}

const navItems: NavItem[] = [
    { id: 'profile', label: 'Profile', icon: <User size={18} />, description: 'Personal information' },
    { id: 'resume-profiles', label: 'Resume Profiles', icon: <Bookmark size={18} />, description: 'Manage resume variants' },
    { id: 'experience', label: 'Work Experience', icon: <Briefcase size={18} />, description: 'Jobs & resume import' },
    { id: 'education', label: 'Education', icon: <GraduationCap size={18} />, description: 'Degrees & courses' },
    { id: 'skills', label: 'Skills', icon: <Award size={18} />, description: 'Technical & soft skills' },
    { id: 'projects', label: 'Projects', icon: <FolderOpen size={18} />, description: 'Portfolio & side projects' },
    { id: 'certifications', label: 'Certifications', icon: <BadgeCheck size={18} />, description: 'Professional credentials' },
    { id: 'accomplishments', label: 'Accomplishments', icon: <Trophy size={18} />, description: 'Awards & achievements' },
];

interface ProfilePageProps {
    profileData?: any;
    isProfileLoading?: boolean;
    onRefreshProfile?: () => Promise<void>;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profileData, isProfileLoading, onRefreshProfile }) => {
    const [activeSection, setActiveSection] = useState<SectionType>('profile');

    // Loading & Saving States
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isResetting, setIsResetting] = useState(false);

    // Dev Mode - determined by environment variable
    const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

    // Resume Profiles State
    const [resumeProfiles, setResumeProfiles] = useState<ResumeProfile[]>([]);
    const [profileToDelete, setProfileToDelete] = useState<ResumeProfile | null>(null);
    const [isDeletingProfile, setIsDeletingProfile] = useState(false);
    const [activeResumeProfileId, setActiveResumeProfileId] = useState<string | null>(null);

    // Get active profile name (defaults to "main")
    const activeProfileName = resumeProfiles.find(p => p.id === activeResumeProfileId)?.name || 'main';

    // Profile State
    const [user, setUser] = useState({
        firstName: '',
        lastName: '',
        role: '',
        company: '',
        location: '',
        email: '',
        phone: '',
        website: '',
        bio: '',
        avatar: 'https://i.pravatar.cc/300?img=11',
        gender: '',
        veteranStatus: '',
        disabilityStatus: '',
        ethnicity: ''
    });

    // Experience State
    const [experiences, setExperiences] = useState<any[]>([]);

    // Education State
    const [educations, setEducations] = useState<any[]>([]);

    // Skills State
    const [skills, setSkills] = useState<string[]>([]);
    const [newSkill, setNewSkill] = useState('');

    // Projects State
    const [projects, setProjects] = useState<any[]>([]);

    // Certifications State
    const [certifications, setCertifications] = useState<any[]>([]);

    // Accomplishments State
    const [accomplishments, setAccomplishments] = useState<any[]>([]);

    // Preferences State (loaded from backend, preserved on save)
    const [preferences, setPreferences] = useState({
        remoteOnly: false,
        excludedKeywords: [] as string[],
        maxSeniority: [] as string[],
        locations: [] as string[],
        minSalary: undefined as number | undefined,
    });

    // Resume Upload State
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [isParsingResume, setIsParsingResume] = useState(false);
    const [resumeParsed, setResumeParsed] = useState(false);
    const [resumeError, setResumeError] = useState<string | null>(null);

    // Validation State
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // ============ Validation Helpers ============
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /**
     * Formats a phone number to (XXX) XXX-XXXX USA format as user types
     */
    const formatPhoneNumber = (phone: string): string => {
        if (!phone) return '';
        
        // Strip all non-digit characters
        let digits = phone.replace(/\D/g, '');
        
        // Remove leading 1 if present (country code)
        if (digits.length === 11 && digits.startsWith('1')) {
            digits = digits.slice(1);
        }
        
        // Build formatted string progressively
        if (digits.length === 0) return '';
        if (digits.length <= 3) return `(${digits}`;
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        
        // Limit to 10 digits
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    };

    /**
     * Validates the profile fields and returns errors object
     */
    const validateFields = (): Record<string, string> => {
        const errors: Record<string, string> = {};
        
        if (!user.firstName.trim()) {
            errors.firstName = 'First name is required';
        }
        if (!user.lastName.trim()) {
            errors.lastName = 'Last name is required';
        }
        if (!user.email.trim()) {
            errors.email = 'Email is required';
        } else if (!EMAIL_REGEX.test(user.email)) {
            errors.email = 'Invalid email format';
        }
        
        // Phone validation (if provided)
        if (user.phone.trim()) {
            const digits = user.phone.replace(/\D/g, '');
            if (digits.length !== 10) {
                errors.phone = 'Phone must be 10 digits';
            }
        }

        // Profile selection is required if profiles exist
        if (resumeProfiles.length > 0 && !activeResumeProfileId) {
            errors.resumeProfile = 'Please select a resume profile';
        }
        
        return errors;
    };

    const normalizeExperienceDescriptions = (items: any[] = []) => {
        return items.map((exp) => {
            const bullets = Array.isArray(exp?.bullets) ? exp.bullets : [];
            const normalizedBullets = bullets
                .map((b: any) => (typeof b === 'string' ? b.replace(/^•\s*/, '').trim() : ''))
                .filter(Boolean);

            const descriptionFromBullets = normalizedBullets.length > 0
                ? normalizedBullets.map((b: string) => `• ${b}`).join('\n')
                : (exp?.description || '');

            return {
                ...exp,
                description: descriptionFromBullets,
            };
        });
    };

    const applyProfileData = (data: any) => {
        // Map backend data to local state
        if (data.contact) {
            setUser(prev => ({
                ...prev,
                firstName: data.contact.firstName || '',
                lastName: data.contact.lastName || '',
                email: data.contact.email || '',
                phone: data.contact.phone || '',
                location: data.contact.location || '',
                website: data.contact.portfolio || data.contact.linkedin || '',
                role: data.contact.role || '',
                company: data.contact.company || '',
                bio: data.contact.bio || '',
            }));
        }
        if (data.preferences) {
            setPreferences(data.preferences);
        }
        // Load self-identification fields
        if (data.selfIdentification) {
            setUser(prev => ({
                ...prev,
                gender: data.selfIdentification.gender || '',
                veteranStatus: data.selfIdentification.veteranStatus || '',
                disabilityStatus: data.selfIdentification.disabilityStatus || '',
                ethnicity: data.selfIdentification.ethnicity || '',
            }));
        }
        // Load resume profiles + restore active selection
        const nextProfiles: ResumeProfile[] = data.resumeProfiles || [];
        setResumeProfiles(nextProfiles);
        const lastEditedId = data.lastEditedProfileId;
        let nextActiveId: string | null = null;
        if (lastEditedId && nextProfiles.find((p: ResumeProfile) => p.id === lastEditedId)) {
            nextActiveId = lastEditedId;
        } else if (nextProfiles.length > 0) {
            nextActiveId = nextProfiles[0].id;
        }
        setActiveResumeProfileId(nextActiveId || null);
        
        // Load experience/education/skills from active resume profile snapshot if available,
        // otherwise fall back to main profile data
        const activeProfile = nextActiveId ? nextProfiles.find((p: ResumeProfile) => p.id === nextActiveId) : null;
        if (activeProfile?.resumeSnapshot) {
            const snapshot = activeProfile.resumeSnapshot;
            setExperiences(normalizeExperienceDescriptions(snapshot.experience || []));
            setEducations(snapshot.education || []);
            setSkills(snapshot.skills || []);
        } else {
            // Fallback to main profile data when no resume profile is active
            if (data.experience) {
                setExperiences(normalizeExperienceDescriptions(data.experience));
            }
            if (data.education) {
                setEducations(data.education);
            }
            if (data.skills) {
                setSkills(data.skills);
            }
        }
    };

    // Load profile from backend on mount or when centralized data updates
    useEffect(() => {
        if (profileData) {
            applyProfileData(profileData);
            setIsLoading(false);
            return;
        }
        if (onRefreshProfile) {
            onRefreshProfile();
            return;
        }
        const fetchProfile = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/profile');
                if (res.ok) {
                    const data = await res.json();
                    applyProfileData(data);
                }
            } catch (err) {
                console.error('Failed to load profile:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [profileData, onRefreshProfile]);

    useEffect(() => {
        if (isProfileLoading !== undefined) {
            setIsLoading(isProfileLoading && !profileData);
        }
    }, [isProfileLoading, profileData]);

    // Delete resume profile handler
    const handleDeleteProfile = async (profile: ResumeProfile) => {
        setIsDeletingProfile(true);
        try {
            const updatedProfiles = resumeProfiles.filter(p => p.id !== profile.id);
            const nextActiveId = activeResumeProfileId === profile.id
                ? (updatedProfiles[0]?.id || null)
                : activeResumeProfileId;
            
            // Save to backend
            const res = await fetch('http://localhost:3001/api/profile?skipContactValidation=true', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resumeProfiles: updatedProfiles,
                    lastEditedProfileId: nextActiveId,
                }),
            });
            
            if (!res.ok) throw new Error('Failed to delete profile');
            
            setResumeProfiles(updatedProfiles);
            setActiveResumeProfileId(nextActiveId);
            if (nextActiveId) {
                const nextProfile = updatedProfiles.find(p => p.id === nextActiveId);
                if (nextProfile) {
                    loadResumeProfileData(nextProfile, { silent: true });
                }
            }
            if (onRefreshProfile) {
                onRefreshProfile();
            }
            setProfileToDelete(null);
            setSaveMessage({ type: 'success', text: `Profile "${profile.name}" deleted successfully` });
        } catch (err) {
            console.error('Failed to delete profile:', err);
            setSaveMessage({ type: 'error', text: 'Failed to delete profile' });
        } finally {
            setIsDeletingProfile(false);
        }
    };

    // Load resume profile data into the form
    const loadResumeProfileData = (profile: ResumeProfile, options?: { silent?: boolean }) => {
        if (!profile.resumeSnapshot) return;
        
        const snapshot = profile.resumeSnapshot;
        
        // Load experience
        if (snapshot.experience) {
            setExperiences(normalizeExperienceDescriptions(snapshot.experience));
        }
        
        // Load education  
        if (snapshot.education) {
            setEducations(snapshot.education);
        }
        
        // Load skills
        if (snapshot.skills) {
            setSkills(snapshot.skills);
        }
        
        if (!options?.silent) {
            setSaveMessage({ type: 'success', text: `Loaded profile "${profile.name}"` });
            setTimeout(() => setSaveMessage(null), 3000);
        }
    };

    // Handle resume profile selection from dropdown
    const handleResumeProfileSelect = async (profileId: string | null) => {
        if (!profileId) return;
        
        setActiveResumeProfileId(profileId);
        const profile = resumeProfiles.find(p => p.id === profileId);
        if (profile) {
            loadResumeProfileData(profile);
            
            // Persist the selected profile ID to the backend
            try {
                await fetch('http://localhost:3001/api/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lastEditedProfileId: profileId }),
                });
            } catch (err) {
                console.error('Failed to save lastEditedProfileId:', err);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        // Auto-format phone number on input
        if (name === 'phone') {
            const formattedPhone = formatPhoneNumber(value);
            setUser(prev => ({ ...prev, phone: formattedPhone }));
        } else {
            setUser(prev => ({ ...prev, [name]: value }));
        }
        
        // Clear validation error for this field when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate before submitting
        const errors = validateFields();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setSaveMessage({ type: 'error', text: 'Please fix the errors below before saving' });
            return;
        }
        
        setIsSaving(true);
        setSaveMessage(null);
        setValidationErrors({});

        try {
            // Build the current snapshot from form data
            const currentSnapshot = {
                experience: experiences.map(exp => ({
                    title: exp.title || '',
                    company: exp.company || '',
                    location: exp.location || '',
                    startDate: exp.startDate || '',
                    endDate: exp.endDate || '',
                    current: !exp.endDate,
                    description: exp.description || '',
                    bullets: exp.bullets || [],
                })),
                education: educations.map(edu => ({
                    institution: edu.institution || '',
                    degree: edu.degree || '',
                    fieldOfStudy: edu.fieldOfStudy || '',
                    startDate: edu.startDate || '',
                    endDate: edu.endDate || '',
                    description: edu.description || '',
                })),
                skills: skills,
            };

            // Determine the resume profiles to save
            let updatedResumeProfiles = [...resumeProfiles];
            let profileIdToSave = activeResumeProfileId;

            // Auto-create "default" profile if none exist
            if (resumeProfiles.length === 0) {
                const now = new Date().toISOString();
                const newProfile: ResumeProfile = {
                    id: crypto.randomUUID(),
                    name: 'default',
                    resumeSnapshot: currentSnapshot,
                    createdAt: now,
                    updatedAt: now,
                };
                updatedResumeProfiles = [newProfile];
                profileIdToSave = newProfile.id;
                setResumeProfiles(updatedResumeProfiles);
                setActiveResumeProfileId(profileIdToSave);
            } else if (activeResumeProfileId) {
                // Update the active profile's snapshot
                const now = new Date().toISOString();
                updatedResumeProfiles = resumeProfiles.map(p =>
                    p.id === activeResumeProfileId
                        ? { ...p, resumeSnapshot: currentSnapshot, updatedAt: now }
                        : p
                );
                setResumeProfiles(updatedResumeProfiles);
            }

            // Build the profile object matching backend UserProfile type
            const profileData = {
                contact: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    linkedin: user.website.includes('linkedin') ? user.website : '',
                    portfolio: !user.website.includes('linkedin') ? user.website : '',
                    location: user.location,
                    role: user.role || '',
                    company: user.company || '',
                    bio: user.bio || '',
                },
                experience: currentSnapshot.experience,
                education: currentSnapshot.education,
                preferences: preferences,
                skills: skills,
                // Self-Identification fields
                selfIdentification: {
                    gender: user.gender,
                    veteranStatus: user.veteranStatus,
                    disabilityStatus: user.disabilityStatus,
                    ethnicity: user.ethnicity,
                },
                // Extended fields (not in backend type but useful to store)
                projects: projects,
                certifications: certifications,
                accomplishments: accomplishments,
                // Include resume profiles to sync the snapshot
                resumeProfiles: updatedResumeProfiles,
                lastEditedProfileId: profileIdToSave,
            };

            const res = await fetch('http://localhost:3001/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                // Handle backend validation errors
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    const backendErrors: Record<string, string> = {};
                    errorData.errors.forEach((err: { field: string; message: string }) => {
                        backendErrors[err.field] = err.message;
                    });
                    setValidationErrors(backendErrors);
                }
                throw new Error(errorData.error || 'Failed to save profile');
            }

            // Refresh profile data from App.tsx to sync state
            if (onRefreshProfile) {
                await onRefreshProfile();
            }

            setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });

            // Clear message after 3 seconds
            setTimeout(() => setSaveMessage(null), 3000);

        } catch (err: any) {
            console.error('Save error:', err);
            setSaveMessage({ type: 'error', text: err.message || 'Failed to save profile' });
        } finally {
            setIsSaving(false);
        }
    };

    // Reset Profile Handler (Dev Mode only)
    const handleResetProfile = async () => {
        if (!isDevMode) return;
        
        const confirmed = window.confirm(
            'Are you sure you want to reset the profile? This will clear all data and cannot be undone.'
        );
        if (!confirmed) return;

        setIsResetting(true);
        try {
            const res = await fetch('http://localhost:3001/api/profile/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                throw new Error('Failed to reset profile');
            }

            // Reset all local state
            setUser({
                firstName: '',
                lastName: '',
                role: '',
                company: '',
                location: '',
                email: '',
                phone: '',
                website: '',
                bio: '',
                avatar: 'https://i.pravatar.cc/300?img=11',
                gender: '',
                veteranStatus: '',
                disabilityStatus: '',
                ethnicity: ''
            });
            setExperiences([]);
            setEducations([]);
            setSkills([]);
            setProjects([]);
            setCertifications([]);
            setAccomplishments([]);
            setPreferences({
                remoteOnly: false,
                excludedKeywords: [],
                maxSeniority: [],
                locations: [],
                minSalary: undefined,
            });
            setResumeFile(null);
            setResumeParsed(false);

            setSaveMessage({ type: 'success', text: 'Profile reset successfully!' });
            setTimeout(() => setSaveMessage(null), 3000);

        } catch (err: any) {
            console.error('Reset error:', err);
            setSaveMessage({ type: 'error', text: err.message || 'Failed to reset profile' });
        } finally {
            setIsResetting(false);
        }
    };

    // Validate parsed resume data structure
    const validateParsedData = (data: any): { valid: boolean; warnings: string[] } => {
        const warnings: string[] = [];
        if (!data?.contact) warnings.push('Missing contact object');
        if (!data?.contact?.firstName && !data?.contact?.lastName) warnings.push('Missing name');
        if (!Array.isArray(data?.experience)) warnings.push('Experience not an array');
        if (!Array.isArray(data?.education)) warnings.push('Education not an array');
        if (!Array.isArray(data?.skills)) warnings.push('Skills not an array');
        return { valid: warnings.length === 0, warnings };
    };

    // Resume Upload Handler
    const handleResumeUpload = async (file: File) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (!allowedTypes.includes(file.type)) {
            setResumeError('Please upload a PDF, DOC, or DOCX file.');
            return;
        }

        setResumeFile(file);
        setResumeError(null);
        setIsParsingResume(true);
        setResumeParsed(false);

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

            // Debug logging - trace parsed data
            console.log('[Resume Parse] Full response:', data);
            console.log('[Resume Parse] Contact:', data.contact);
            console.log('[Resume Parse] Summary:', data.summary);
            console.log('[Resume Parse] Experience:', data.experience?.length, 'items');
            console.log('[Resume Parse] Education:', data.education?.length, 'items');
            console.log('[Resume Parse] Skills:', data.skills?.length, 'items');
            console.log('[Resume Parse] Projects:', data.projects?.length, 'items');

            // Validate parsed data structure
            const validation = validateParsedData(data);
            if (!validation.valid) {
                console.warn('[Resume Parse] Validation warnings:', validation.warnings);
            }

            // Pre-populate ALL contact fields from parsed resume
            // Use nullish coalescing and trim to handle empty strings properly
            setUser(prev => {
                const newUserData = {
                    ...prev,
                    // Contact info from resume - trim and check for non-empty
                    firstName: (data.contact?.firstName ?? '').trim() || prev.firstName,
                    lastName: (data.contact?.lastName ?? '').trim() || prev.lastName,
                    email: (data.contact?.email ?? '').trim() || prev.email,
                    phone: data.contact?.phone ? formatPhoneNumber(data.contact.phone) : prev.phone,
                    location: (data.contact?.location ?? '').trim() || prev.location,
                    // Bio gets updated from any summary/objective in the resume
                    bio: (data.summary ?? '').trim() || prev.bio,
                    // Website/portfolio can be updated - check both fields
                    website: (data.contact?.portfolio || data.contact?.linkedin || '').trim() || prev.website,
                    // Role and company from most recent experience
                    role: data.experience?.[0]?.title?.trim() || prev.role,
                    company: data.experience?.[0]?.company?.trim() || prev.company,
                };
                console.log('[Resume Parse] Setting user data:', newUserData);
                return newUserData;
            });

            // Populate experiences with bullets
            if (Array.isArray(data.experience) && data.experience.length > 0) {
                // Backend should now include bullets, but fallback for safety
                const dominantPattern = analyzeDescriptionPattern(data.experience);
                const processedExperiences = data.experience.map((exp: any) => {
                    if (!exp.bullets || exp.bullets.length === 0) {
                        return {
                            ...exp,
                            bullets: extractBulletsFromDescription(exp.description || '', dominantPattern),
                        };
                    }
                    return exp;
                });
                console.log('[Resume Parse] Setting experiences:', processedExperiences.length, 'items');
                setExperiences(processedExperiences);
            } else {
                console.log('[Resume Parse] No experiences to set');
            }

            // Populate education
            if (Array.isArray(data.education) && data.education.length > 0) {
                console.log('[Resume Parse] Setting education:', data.education.length, 'items');
                setEducations(data.education);
            } else {
                console.log('[Resume Parse] No education to set');
            }

            // Populate skills
            if (Array.isArray(data.skills) && data.skills.length > 0) {
                console.log('[Resume Parse] Setting skills:', data.skills.length, 'items');
                setSkills(data.skills);
            } else {
                console.log('[Resume Parse] No skills to set');
            }

            // Populate projects
            if (Array.isArray(data.projects) && data.projects.length > 0) {
                console.log('[Resume Parse] Setting projects:', data.projects.length, 'items');
                setProjects(data.projects);
            } else {
                console.log('[Resume Parse] No projects to set');
            }

            // Success feedback - log what was populated
            const fieldsPopulated = [
                data.contact?.firstName && 'Name',
                data.contact?.email && 'Email',
                data.contact?.phone && 'Phone',
                data.contact?.location && 'Location',
                data.summary && 'Bio',
                data.experience?.length && `${data.experience.length} experience(s)`,
                data.education?.length && `${data.education.length} education entry(ies)`,
                data.skills?.length && `${data.skills.length} skill(s)`,
                data.projects?.length && `${data.projects.length} project(s)`,
            ].filter(Boolean);
            console.log('[Resume Parse] Successfully populated:', fieldsPopulated.join(', '));

            setResumeParsed(true);
        } catch (err: any) {
            setResumeError(err.message || 'An error occurred during parsing.');
        } finally {
            setIsParsingResume(false);
        }
    };

    // Shared Styles
    const cardStyle = {
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        fontSize: '14px',
        outline: 'none'
    };

    const sectionHeaderStyle = {
        fontSize: '18px',
        fontWeight: 'bold' as const,
        color: '#111827',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    };

    // Render Resume Profiles Section
    const renderResumeProfilesSection = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header with Profile Selector */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>Resume Profiles</h2>
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>
                            Manage your tailored resume variations ({resumeProfiles.length}/{RESUME_PROFILE_MAX_COUNT} profiles)
                        </p>
                    </div>
                </div>

                {resumeProfiles.length === 0 ? (
                    <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '12px',
                        border: '1px dashed #E5E7EB',
                    }}>
                        <Bookmark size={32} style={{ color: '#9CA3AF', marginBottom: '12px' }} />
                        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>
                            No Resume Profiles Yet
                        </h3>
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
                            Create your first resume profile by going to the Resume page and saving your changes.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {resumeProfiles.map((profile) => (
                            <div
                                key={profile.id}
                                onClick={() => handleResumeProfileSelect(profile.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px 20px',
                                    backgroundColor: activeResumeProfileId === profile.id ? '#EEF2FF' : '#F9FAFB',
                                    borderRadius: '12px',
                                    border: activeResumeProfileId === profile.id ? '2px solid #4F46E5' : '1px solid #E5E7EB',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (activeResumeProfileId !== profile.id) {
                                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                                        e.currentTarget.style.borderColor = '#D1D5DB';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeResumeProfileId !== profile.id) {
                                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                                        e.currentTarget.style.borderColor = '#E5E7EB';
                                    }
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        backgroundColor: activeResumeProfileId === profile.id ? '#C7D2FE' : '#EEF2FF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Bookmark size={18} style={{ color: '#4F46E5' }} />
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#111827',
                                            fontFamily: "'JetBrains Mono', monospace",
                                        }}>
                                            {profile.name}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                                            {profile.resumeSnapshot?.experience?.length || 0} experiences • {profile.resumeSnapshot?.skills?.length || 0} skills
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                                            Updated {new Date(profile.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setProfileToDelete(profile)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 14px',
                                        backgroundColor: '#FEF2F2',
                                        color: '#DC2626',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {profileToDelete && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        padding: '24px',
                        maxWidth: '400px',
                        width: '90%',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                backgroundColor: '#FEF2F2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <AlertCircle size={20} style={{ color: '#DC2626' }} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                                    Delete Profile
                                </h3>
                                <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0' }}>
                                    This action cannot be undone
                                </p>
                            </div>
                        </div>

                        <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 20px', lineHeight: '1.5' }}>
                            Are you sure you want to delete the profile <strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>"{profileToDelete.name}"</strong>? 
                            All saved resume data for this profile will be permanently removed.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setProfileToDelete(null)}
                                disabled={isDeletingProfile}
                                style={{
                                    padding: '10px 18px',
                                    backgroundColor: '#F3F4F6',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteProfile(profileToDelete)}
                                disabled={isDeletingProfile}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '10px 18px',
                                    backgroundColor: '#DC2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: isDeletingProfile ? 'not-allowed' : 'pointer',
                                    opacity: isDeletingProfile ? 0.7 : 1,
                                }}
                            >
                                {isDeletingProfile ? (
                                    <>
                                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={14} />
                                        Delete Profile
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Render Sections
    const renderProfileSection = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Resume Upload Card - Now on Profile page */}
            <div style={{
                ...cardStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                border: resumeParsed ? '1px solid #10B981' : '1px solid transparent',
            }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: resumeParsed ? 'linear-gradient(135deg, #10B981, #059669)'
                        : isParsingResume ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                            : 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                }}>
                    {isParsingResume ? <Loader2 size={22} className="animate-spin" />
                        : resumeParsed ? <CheckCircle size={22} /> : <Sparkles size={22} />}
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '4px' }}>
                        {resumeParsed ? 'Resume Imported Successfully' : isParsingResume ? 'Parsing Resume...' : 'Quick Import from Resume'}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                        {resumeFile ? resumeFile.name : 'Upload to auto-fill Experience, Education, Skills & Projects'}
                    </p>
                    {resumeError && <p style={{ fontSize: '12px', color: '#DC2626', margin: '4px 0 0 0' }}>{resumeError}</p>}
                </div>
                <label style={{
                    backgroundColor: resumeParsed ? '#ECFDF5' : '#EEF2FF',
                    color: resumeParsed ? '#059669' : '#4F46E5',
                    padding: '10px 18px', borderRadius: '8px', fontWeight: '500', fontSize: '14px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                    {resumeParsed ? <CheckCircle size={16} /> : <UploadCloud size={16} />}
                    {resumeParsed ? 'Imported' : 'Upload Resume'}
                    <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])} style={{ display: 'none' }} />
                </label>
            </div>

            {/* Save Message */}
            {saveMessage && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    backgroundColor: saveMessage.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    color: saveMessage.type === 'success' ? '#059669' : '#DC2626',
                    fontSize: '14px',
                    fontWeight: '500',
                }}>
                    {saveMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {saveMessage.text}
                </div>
            )}

            {/* Personal Information Form */}
            <form onSubmit={handleSubmit} style={cardStyle}>
                <div style={sectionHeaderStyle}>
                    <h2 style={{ margin: 0 }}>Personal Information</h2>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {isDevMode && (
                            <button
                                type="button"
                                onClick={handleResetProfile}
                                disabled={isResetting}
                                style={{
                                    backgroundColor: isResetting ? '#FCA5A5' : '#EF4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: isResetting ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'background-color 0.2s ease',
                                }}
                                title="Dev Mode: Reset Profile"
                            >
                                {isResetting ? (
                                    <>
                                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                        Resetting...
                                    </>
                                ) : (
                                    <>
                                        <RotateCcw size={16} /> Reset
                                    </>
                                )}
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSaving}
                            style={{
                                backgroundColor: isSaving ? '#93C5FD' : '#2563EB',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background-color 0.2s ease',
                            }}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} /> Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <InputField label="First Name" name="firstName" value={user.firstName} onChange={handleChange} required error={validationErrors.firstName} />
                    <InputField label="Last Name" name="lastName" value={user.lastName} onChange={handleChange} required error={validationErrors.lastName} />
                    <InputField label="Role / Job Title" name="role" value={user.role} onChange={handleChange} icon={<Briefcase size={16} />} />
                    <InputField label="Company" name="company" value={user.company} onChange={handleChange} />
                    <InputField label="Email" name="email" value={user.email} onChange={handleChange} icon={<Mail size={16} />} required error={validationErrors.email} />
                    <InputField label="Phone" name="phone" value={user.phone} onChange={handleChange} icon={<Phone size={16} />} error={validationErrors.phone} />
                    <InputField label="Location" name="location" value={user.location} onChange={handleChange} icon={<MapPin size={16} />} />
                    <InputField label="Website" name="website" value={user.website} onChange={handleChange} icon={<Globe size={16} />} />
                </div>

                <div style={{ marginTop: '20px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '8px' }}>Bio / Summary</label>
                    <textarea
                        name="bio"
                        value={user.bio}
                        onChange={handleChange}
                        rows={4}
                        style={{ ...inputStyle, resize: 'vertical' }}
                        placeholder="A brief summary about yourself that will be used for cover letters..."
                    />
                </div>

                {/* Divider */}
                <div style={{ margin: '28px 0 24px 0', height: '1px', backgroundColor: '#E5E7EB' }} />

                {/* Voluntary Self-Identification */}
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
                    Voluntary Self-Identification
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Gender */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                            Gender
                        </label>
                        <select
                            name="gender"
                            value={user.gender}
                            onChange={(e) => handleChange(e as any)}
                            style={{ 
                                ...inputStyle, 
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Decline">Decline to Self-Identify</option>
                        </select>
                    </div>

                    {/* Veteran Status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                            Veteran Status
                        </label>
                        <select
                            name="veteranStatus"
                            value={user.veteranStatus}
                            onChange={(e) => handleChange(e as any)}
                            style={{ 
                                ...inputStyle, 
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="">Select Status</option>
                            <option value="I am a veteran">I am a veteran</option>
                            <option value="I am not a veteran">I am not a veteran</option>
                            <option value="Decline">Decline to Self-Identify</option>
                        </select>
                    </div>

                    {/* Disability Status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                            Disability Status
                        </label>
                        <select
                            name="disabilityStatus"
                            value={user.disabilityStatus}
                            onChange={(e) => handleChange(e as any)}
                            style={{ 
                                ...inputStyle, 
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="">Select Status</option>
                            <option value="Yes, I have a disability">Yes, I have a disability</option>
                            <option value="No, I do not have a disability">No, I do not have a disability</option>
                            <option value="Decline">Decline to Self-Identify</option>
                        </select>
                    </div>
                </div>

                {/* Divider */}
                <div style={{ margin: '28px 0 24px 0', height: '1px', backgroundColor: '#E5E7EB' }} />

                {/* Race & Ethnicity */}
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
                    Race & Ethnicity
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                        Race / Ethnicity
                    </label>
                    <select
                        name="ethnicity"
                        value={user.ethnicity}
                        onChange={(e) => handleChange(e as any)}
                        style={{ 
                            ...inputStyle, 
                            backgroundColor: 'white', 
                            maxWidth: '400px'
                        }}
                    >
                        <option value="">Select Ethnicity</option>
                        <option value="Hispanic or Latino">Hispanic or Latino</option>
                        <option value="White">White (Not Hispanic or Latino)</option>
                        <option value="Black or African American">Black or African American (Not Hispanic or Latino)</option>
                        <option value="Native Hawaiian or Other Pacific Islander">Native Hawaiian or Other Pacific Islander (Not Hispanic or Latino)</option>
                        <option value="Asian">Asian (Not Hispanic or Latino)</option>
                        <option value="American Indian or Alaska Native">American Indian or Alaska Native (Not Hispanic or Latino)</option>
                        <option value="Two or More Races">Two or More Races (Not Hispanic or Latino)</option>
                        <option value="Decline">Decline to Self-Identify</option>
                    </select>
                </div>
            </form>
        </div>
    );

    const renderExperienceSection = () => (
        <div style={cardStyle}>
            <div style={sectionHeaderStyle}>
                <h2 style={{ margin: 0 }}>Work Experience</h2>
                <button onClick={() => setExperiences([...experiences, { title: '', company: '', startDate: '', endDate: '', description: '' }])}
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> Add Experience
                </button>
            </div>

            {experiences.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                    No work experience added. Upload a resume from the Profile tab or add manually.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {experiences.map((exp, i) => (
                        <div key={i} style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px', position: 'relative' }}>
                            <button onClick={() => setExperiences(experiences.filter((_, idx) => idx !== i))}
                                style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                                <Trash2 size={16} />
                            </button>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                <input placeholder="Job Title" value={exp.title || ''} onChange={(e) => { const n = [...experiences]; n[i].title = e.target.value; setExperiences(n); }} style={inputStyle} />
                                <input placeholder="Company" value={exp.company || ''} onChange={(e) => { const n = [...experiences]; n[i].company = e.target.value; setExperiences(n); }} style={inputStyle} />
                                <input placeholder="Start Date" value={exp.startDate || ''} onChange={(e) => { const n = [...experiences]; n[i].startDate = e.target.value; setExperiences(n); }} style={inputStyle} />
                                <input placeholder="End Date" value={exp.endDate || ''} onChange={(e) => { const n = [...experiences]; n[i].endDate = e.target.value; setExperiences(n); }} style={inputStyle} />
                            </div>
                            <textarea placeholder="Description, achievements, responsibilities..." value={exp.description || ''} onChange={(e) => { const n = [...experiences]; n[i].description = e.target.value; setExperiences(n); }} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderEducationSection = () => (
        <div style={cardStyle}>
            <div style={sectionHeaderStyle}>
                <h2 style={{ margin: 0 }}>Education</h2>
                <button onClick={() => setEducations([...educations, { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '' }])}
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> Add Education
                </button>
            </div>

            {educations.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                    No education added yet. Add your degrees, courses, and certifications.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {educations.map((edu, i) => (
                        <div key={i} style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px', position: 'relative' }}>
                            <button onClick={() => setEducations(educations.filter((_, idx) => idx !== i))}
                                style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                                <Trash2 size={16} />
                            </button>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <input placeholder="Institution" value={edu.institution || ''} onChange={(e) => { const n = [...educations]; n[i].institution = e.target.value; setEducations(n); }} style={inputStyle} />
                                <input placeholder="Degree" value={edu.degree || ''} onChange={(e) => { const n = [...educations]; n[i].degree = e.target.value; setEducations(n); }} style={inputStyle} />
                                <input placeholder="Field of Study" value={edu.fieldOfStudy || ''} onChange={(e) => { const n = [...educations]; n[i].fieldOfStudy = e.target.value; setEducations(n); }} style={inputStyle} />
                                <input placeholder="GPA (optional)" value={edu.gpa || ''} onChange={(e) => { const n = [...educations]; n[i].gpa = e.target.value; setEducations(n); }} style={inputStyle} />
                                <input placeholder="Start Date" value={edu.startDate || ''} onChange={(e) => { const n = [...educations]; n[i].startDate = e.target.value; setEducations(n); }} style={inputStyle} />
                                <input placeholder="End Date" value={edu.endDate || ''} onChange={(e) => { const n = [...educations]; n[i].endDate = e.target.value; setEducations(n); }} style={inputStyle} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderSkillsSection = () => (
        <div style={cardStyle}>
            <div style={sectionHeaderStyle}>
                <h2 style={{ margin: 0 }}>Skills</h2>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Add a skill (e.g., React, Python, Project Management)"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && newSkill.trim()) {
                            setSkills([...skills, newSkill.trim()]);
                            setNewSkill('');
                        }
                    }}
                    style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={() => {
                    if (newSkill.trim()) {
                        setSkills([...skills, newSkill.trim()]);
                        setNewSkill('');
                    }
                }} style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}>
                    Add
                </button>
            </div>

            {skills.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                    No skills added. Add your technical and soft skills.
                </p>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {skills.map((skill, i) => (
                        <span key={i} style={{
                            backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '6px 12px',
                            borderRadius: '20px', fontSize: '14px', fontWeight: '500',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            {skill}
                            <button onClick={() => setSkills(skills.filter((_, idx) => idx !== i))}
                                style={{ background: 'none', border: 'none', color: '#4F46E5', cursor: 'pointer', padding: 0, display: 'flex' }}>
                                <X size={14} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );

    const renderProjectsSection = () => (
        <div style={cardStyle}>
            <div style={sectionHeaderStyle}>
                <h2 style={{ margin: 0 }}>Projects</h2>
                <button onClick={() => setProjects([...projects, { name: '', description: '', url: '', technologies: [] }])}
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> Add Project
                </button>
            </div>

            {projects.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                    No projects added. Showcase your side projects, open source contributions, or portfolio pieces.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {projects.map((proj, i) => (
                        <div key={i} style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px', position: 'relative' }}>
                            <button onClick={() => setProjects(projects.filter((_, idx) => idx !== i))}
                                style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                                <Trash2 size={16} />
                            </button>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                <input placeholder="Project Name" value={proj.name || ''} onChange={(e) => { const n = [...projects]; n[i].name = e.target.value; setProjects(n); }} style={inputStyle} />
                                <input placeholder="URL (optional)" value={proj.url || ''} onChange={(e) => { const n = [...projects]; n[i].url = e.target.value; setProjects(n); }} style={inputStyle} />
                            </div>
                            <textarea placeholder="Describe what you built, the problem you solved, and the impact..." value={proj.description || ''} onChange={(e) => { const n = [...projects]; n[i].description = e.target.value; setProjects(n); }} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderCertificationsSection = () => (
        <div style={cardStyle}>
            <div style={sectionHeaderStyle}>
                <h2 style={{ margin: 0 }}>Certifications</h2>
                <button onClick={() => setCertifications([...certifications, { name: '', issuer: '', issueDate: '', expirationDate: '', credentialId: '' }])}
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> Add Certification
                </button>
            </div>

            {certifications.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                    No certifications added. Add AWS, Google, Microsoft, or other professional credentials.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {certifications.map((cert, i) => (
                        <div key={i} style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px', position: 'relative' }}>
                            <button onClick={() => setCertifications(certifications.filter((_, idx) => idx !== i))}
                                style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                                <Trash2 size={16} />
                            </button>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <input placeholder="Certification Name" value={cert.name || ''} onChange={(e) => { const n = [...certifications]; n[i].name = e.target.value; setCertifications(n); }} style={inputStyle} />
                                <input placeholder="Issuing Organization" value={cert.issuer || ''} onChange={(e) => { const n = [...certifications]; n[i].issuer = e.target.value; setCertifications(n); }} style={inputStyle} />
                                <input placeholder="Issue Date" value={cert.issueDate || ''} onChange={(e) => { const n = [...certifications]; n[i].issueDate = e.target.value; setCertifications(n); }} style={inputStyle} />
                                <input placeholder="Expiration Date (optional)" value={cert.expirationDate || ''} onChange={(e) => { const n = [...certifications]; n[i].expirationDate = e.target.value; setCertifications(n); }} style={inputStyle} />
                                <input placeholder="Credential ID (optional)" value={cert.credentialId || ''} onChange={(e) => { const n = [...certifications]; n[i].credentialId = e.target.value; setCertifications(n); }} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderAccomplishmentsSection = () => (
        <div style={cardStyle}>
            <div style={sectionHeaderStyle}>
                <h2 style={{ margin: 0 }}>Accomplishments</h2>
                <button onClick={() => setAccomplishments([...accomplishments, { title: '', description: '', date: '', metric: '' }])}
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> Add Accomplishment
                </button>
            </div>

            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px' }}>
                💡 <strong>Pro tip:</strong> Include quantifiable achievements like "Increased sales by 30%" or "Reduced load time by 2 seconds" - these make your resume stand out!
            </p>

            {accomplishments.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                    No accomplishments added. Add awards, recognition, or measurable achievements.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {accomplishments.map((acc, i) => (
                        <div key={i} style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px', position: 'relative' }}>
                            <button onClick={() => setAccomplishments(accomplishments.filter((_, idx) => idx !== i))}
                                style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                                <Trash2 size={16} />
                            </button>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                <input placeholder="Title (e.g., Employee of the Month)" value={acc.title || ''} onChange={(e) => { const n = [...accomplishments]; n[i].title = e.target.value; setAccomplishments(n); }} style={inputStyle} />
                                <input placeholder="Date" value={acc.date || ''} onChange={(e) => { const n = [...accomplishments]; n[i].date = e.target.value; setAccomplishments(n); }} style={inputStyle} />
                            </div>
                            <input placeholder="Key Metric (e.g., Increased revenue by 25%)" value={acc.metric || ''} onChange={(e) => { const n = [...accomplishments]; n[i].metric = e.target.value; setAccomplishments(n); }} style={{ ...inputStyle, marginBottom: '12px' }} />
                            <textarea placeholder="Description of the achievement..." value={acc.description || ''} onChange={(e) => { const n = [...accomplishments]; n[i].description = e.target.value; setAccomplishments(n); }} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderActiveSection = () => {
        switch (activeSection) {
            case 'profile': return renderProfileSection();
            case 'resume-profiles': return renderResumeProfilesSection();
            case 'experience': return renderExperienceSection();
            case 'education': return renderEducationSection();
            case 'skills': return renderSkillsSection();
            case 'projects': return renderProjectsSection();
            case 'certifications': return renderCertificationsSection();
            case 'accomplishments': return renderAccomplishmentsSection();
            default: return renderProfileSection();
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                gap: '12px',
                color: '#6B7280',
            }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Loading profile...</span>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Side Navigation */}
            <div style={{ width: '260px', flexShrink: 0 }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '12px',
                    position: 'sticky',
                    top: '20px'
                }}>
                    <div style={{ padding: '12px 16px', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                            My Profile
                        </h3>
                    </div>

                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                backgroundColor: activeSection === item.id ? '#EEF2FF' : 'transparent',
                                color: activeSection === item.id ? '#4F46E5' : '#374151',
                                textAlign: 'left'
                            }}
                        >
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                backgroundColor: activeSection === item.id ? '#4F46E5' : '#F3F4F6',
                                color: activeSection === item.id ? 'white' : '#6B7280',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {item.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</div>
                                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{item.description}</div>
                            </div>
                            {activeSection === item.id && <ChevronRight size={16} style={{ color: '#4F46E5' }} />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Header */}
                <div style={{ position: 'relative', marginBottom: '30px' }}>
                    <div style={{
                        height: '120px',
                        backgroundColor: '#dcebf7',
                        borderRadius: '16px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: -20, left: -20, width: 150, height: 150, background: '#cfe2f3', borderRadius: '50%', opacity: 0.6 }} />
                        <div style={{ position: 'absolute', top: 20, right: '10%', width: 200, height: 200, background: '#e3f0fa', borderRadius: '50%', opacity: 0.8 }} />
                    </div>

                    <div style={{
                        position: 'absolute',
                        bottom: '-35px',
                        left: '24px',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        padding: '3px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                            <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>

                    <div style={{ marginLeft: '120px', marginTop: '8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{user.firstName} {user.lastName}</h1>
                            {(user.role || user.company) && (
                                <p style={{ color: '#6B7280', margin: '2px 0 0 0', fontSize: '14px' }}>
                                    {user.role}{user.role && user.company ? ' at ' : ''}{user.company}
                                </p>
                            )}
                        </div>
                        
                        {/* Resume Profile Selector - Subtle */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                                fontSize: '12px', 
                                color: '#9CA3AF',
                                whiteSpace: 'nowrap'
                            }}>
                                Profile:
                            </span>
                            <div style={{ width: '160px' }}>
                                <ProfileSelector
                                    profiles={resumeProfiles}
                                    selectedProfileId={activeResumeProfileId}
                                    onSelect={(profileId) => handleResumeProfileSelect(profileId)}
                                    showBadge={false}
                                    placeholder={activeProfileName}
                                    allowCreate={false}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Section Content */}
                <div style={{ marginTop: '20px' }}>
                    {renderActiveSection()}
                </div>
            </div>
        </div>
    );
};

// Helper Component
const InputField = ({ label, name, value, onChange, icon, error, required }: { 
    label: string; 
    name: string; 
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    icon?: React.ReactNode;
    error?: string;
    required?: boolean;
}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            {label}
            {required && <span style={{ color: '#DC2626', marginLeft: '4px' }}>*</span>}
        </label>
        <div style={{ position: 'relative' }}>
            {icon && <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: error ? '#DC2626' : '#9CA3AF' }}>{icon}</div>}
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                style={{ 
                    width: '100%', 
                    padding: icon ? '10px 10px 10px 36px' : '10px 12px', 
                    borderRadius: '8px', 
                    border: error ? '1px solid #DC2626' : '1px solid #E5E7EB', 
                    outline: 'none', 
                    fontSize: '14px',
                    backgroundColor: error ? '#FEF2F2' : 'white'
                }}
            />
        </div>
        {error && (
            <span style={{ fontSize: '12px', color: '#DC2626', marginTop: '-4px' }}>{error}</span>
        )}
    </div>
);

export default ProfilePage;
