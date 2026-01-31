import { useState, useEffect } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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

    // Render Resume Profiles Section
    const renderResumeProfilesSection = () => (
        <div className="flex flex-col gap-5">
            {/* Header with Profile Selector */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Resume Profiles</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage your tailored resume variations ({resumeProfiles.length}/{RESUME_PROFILE_MAX_COUNT} profiles)
                        </p>
                    </div>
                </div>

                {resumeProfiles.length === 0 ? (
                    <div className="py-10 px-5 text-center bg-muted/50 rounded-xl border border-dashed">
                        <Bookmark className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground mb-2">
                            No Resume Profiles Yet
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">
                            Create your first resume profile by going to the Resume page and saving your changes.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {resumeProfiles.map((profile) => (
                            <div
                                key={profile.id}
                                onClick={() => handleResumeProfileSelect(profile.id)}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all",
                                    activeResumeProfileId === profile.id 
                                        ? "bg-primary/5 border-2 border-primary" 
                                        : "bg-muted/50 border border-border hover:bg-muted hover:border-muted-foreground/20"
                                )}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        activeResumeProfileId === profile.id ? "bg-primary/20" : "bg-primary/10"
                                    )}>
                                        <Bookmark className="h-4.5 w-4.5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold font-mono">
                                            {profile.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {profile.resumeSnapshot?.experience?.length || 0} experiences • {profile.resumeSnapshot?.skills?.length || 0} skills
                                        </div>
                                        <div className="text-[11px] text-muted-foreground/60 mt-0.5">
                                            Updated {new Date(profile.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); setProfileToDelete(profile); }}
                                    className="gap-1.5"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Delete Confirmation Modal */}
            <Dialog open={!!profileToDelete} onOpenChange={(open) => !open && setProfileToDelete(null)}>
                <DialogContent className="max-w-[400px]">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                                <DialogTitle>Delete Profile</DialogTitle>
                                <DialogDescription>This action cannot be undone</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <p className="text-sm text-foreground leading-relaxed">
                        Are you sure you want to delete the profile <strong className="font-mono">"{profileToDelete?.name}"</strong>? 
                        All saved resume data for this profile will be permanently removed.
                    </p>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setProfileToDelete(null)} disabled={isDeletingProfile}>
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => profileToDelete && handleDeleteProfile(profileToDelete)}
                            disabled={isDeletingProfile}
                        >
                            {isDeletingProfile ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-1.5" />
                                    Delete Profile
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );

    // Render Sections
    const renderProfileSection = () => (
        <div className="flex flex-col gap-5">
            {/* Resume Upload Card */}
            <Card className={cn(
                "p-5 flex items-center gap-5",
                resumeParsed && "border-green-500"
            )}>
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-white",
                    resumeParsed ? "bg-gradient-to-br from-green-500 to-green-600"
                        : isParsingResume ? "bg-gradient-to-br from-blue-500 to-blue-600"
                            : "bg-gradient-to-br from-indigo-500 to-indigo-600"
                )}>
                    {isParsingResume ? <Loader2 className="h-5 w-5 animate-spin" />
                        : resumeParsed ? <CheckCircle className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                        {resumeParsed ? 'Resume Imported Successfully' : isParsingResume ? 'Parsing Resume...' : 'Quick Import from Resume'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {resumeFile ? resumeFile.name : 'Upload to auto-fill Experience, Education, Skills & Projects'}
                    </p>
                    {resumeError && <p className="text-xs text-destructive mt-1">{resumeError}</p>}
                </div>
                <label className={cn(
                    "px-4 py-2.5 rounded-lg font-medium text-sm cursor-pointer flex items-center gap-1.5",
                    resumeParsed ? "bg-green-50 text-green-600" : "bg-indigo-50 text-indigo-600"
                )}>
                    {resumeParsed ? <CheckCircle className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
                    {resumeParsed ? 'Imported' : 'Upload Resume'}
                    <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])} className="hidden" />
                </label>
            </Card>

            {/* Save Message */}
            {saveMessage && (
                <div className={cn(
                    "flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium",
                    saveMessage.type === 'success' ? "bg-green-50 text-green-600" : "bg-red-50 text-destructive"
                )}>
                    {saveMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {saveMessage.text}
                </div>
            )}

            {/* Personal Information Form */}
            <Card className="p-6">
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-lg font-bold text-foreground">Personal Information</h2>
                        <div className="flex gap-2.5 items-center">
                            {isDevMode && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleResetProfile}
                                    disabled={isResetting}
                                >
                                    {isResetting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Resetting...
                                        </>
                                    ) : (
                                        <>
                                            <RotateCcw className="h-4 w-4 mr-2" /> Reset
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" /> Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <InputField label="First Name" name="firstName" value={user.firstName} onChange={handleChange} required error={validationErrors.firstName} />
                        <InputField label="Last Name" name="lastName" value={user.lastName} onChange={handleChange} required error={validationErrors.lastName} />
                        <InputField label="Role / Job Title" name="role" value={user.role} onChange={handleChange} icon={<Briefcase className="h-4 w-4" />} />
                        <InputField label="Company" name="company" value={user.company} onChange={handleChange} />
                        <InputField label="Email" name="email" value={user.email} onChange={handleChange} icon={<Mail className="h-4 w-4" />} required error={validationErrors.email} />
                        <InputField label="Phone" name="phone" value={user.phone} onChange={handleChange} icon={<Phone className="h-4 w-4" />} error={validationErrors.phone} />
                        <InputField label="Location" name="location" value={user.location} onChange={handleChange} icon={<MapPin className="h-4 w-4" />} />
                        <InputField label="Website" name="website" value={user.website} onChange={handleChange} icon={<Globe className="h-4 w-4" />} />
                    </div>

                    <div className="mt-5">
                        <Label className="mb-2 block">Bio / Summary</Label>
                        <Textarea
                            name="bio"
                            value={user.bio}
                            onChange={handleChange}
                            rows={4}
                            placeholder="A brief summary about yourself that will be used for cover letters..."
                        />
                    </div>

                    {/* Divider */}
                    <div className="my-7 h-px bg-border" />

                    {/* Voluntary Self-Identification */}
                    <h3 className="text-base font-semibold text-foreground mb-5">
                        Voluntary Self-Identification
                    </h3>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="flex flex-col gap-2">
                            <Label>Gender</Label>
                            <Select value={user.gender} onValueChange={(value) => setUser(prev => ({ ...prev, gender: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                                    <SelectItem value="Decline">Decline to Self-Identify</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Veteran Status</Label>
                            <Select value={user.veteranStatus} onValueChange={(value) => setUser(prev => ({ ...prev, veteranStatus: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="I am a veteran">I am a veteran</SelectItem>
                                    <SelectItem value="I am not a veteran">I am not a veteran</SelectItem>
                                    <SelectItem value="Decline">Decline to Self-Identify</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Disability Status</Label>
                            <Select value={user.disabilityStatus} onValueChange={(value) => setUser(prev => ({ ...prev, disabilityStatus: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yes, I have a disability">Yes, I have a disability</SelectItem>
                                    <SelectItem value="No, I do not have a disability">No, I do not have a disability</SelectItem>
                                    <SelectItem value="Decline">Decline to Self-Identify</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="my-7 h-px bg-border" />

                    {/* Race & Ethnicity */}
                    <h3 className="text-base font-semibold text-foreground mb-5">
                        Race & Ethnicity
                    </h3>
                    <div className="flex flex-col gap-2 max-w-[400px]">
                        <Label>Race / Ethnicity</Label>
                        <Select value={user.ethnicity} onValueChange={(value) => setUser(prev => ({ ...prev, ethnicity: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Ethnicity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Hispanic or Latino">Hispanic or Latino</SelectItem>
                                <SelectItem value="White">White (Not Hispanic or Latino)</SelectItem>
                                <SelectItem value="Black or African American">Black or African American (Not Hispanic or Latino)</SelectItem>
                                <SelectItem value="Native Hawaiian or Other Pacific Islander">Native Hawaiian or Other Pacific Islander</SelectItem>
                                <SelectItem value="Asian">Asian (Not Hispanic or Latino)</SelectItem>
                                <SelectItem value="American Indian or Alaska Native">American Indian or Alaska Native</SelectItem>
                                <SelectItem value="Two or More Races">Two or More Races (Not Hispanic or Latino)</SelectItem>
                                <SelectItem value="Decline">Decline to Self-Identify</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </form>
            </Card>
        </div>
    );

    const renderExperienceSection = () => (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-foreground">Work Experience</h2>
                <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => setExperiences([...experiences, { title: '', company: '', startDate: '', endDate: '', description: '' }])}
                >
                    <Plus className="h-4 w-4 mr-1.5" /> Add Experience
                </Button>
            </div>

            {experiences.length === 0 ? (
                <p className="text-muted-foreground italic text-center py-10">
                    No work experience added. Upload a resume from the Profile tab or add manually.
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    {experiences.map((exp, i) => (
                        <div key={i} className="p-4 bg-muted/50 rounded-xl relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setExperiences(experiences.filter((_, idx) => idx !== i))}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <Input placeholder="Job Title" value={exp.title || ''} onChange={(e) => { const n = [...experiences]; n[i].title = e.target.value; setExperiences(n); }} />
                                <Input placeholder="Company" value={exp.company || ''} onChange={(e) => { const n = [...experiences]; n[i].company = e.target.value; setExperiences(n); }} />
                                <Input placeholder="Start Date" value={exp.startDate || ''} onChange={(e) => { const n = [...experiences]; n[i].startDate = e.target.value; setExperiences(n); }} />
                                <Input placeholder="End Date" value={exp.endDate || ''} onChange={(e) => { const n = [...experiences]; n[i].endDate = e.target.value; setExperiences(n); }} />
                            </div>
                            <Textarea placeholder="Description, achievements, responsibilities..." value={exp.description || ''} onChange={(e) => { const n = [...experiences]; n[i].description = e.target.value; setExperiences(n); }} rows={3} />
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );

    const renderEducationSection = () => (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-foreground">Education</h2>
                <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => setEducations([...educations, { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '' }])}
                >
                    <Plus className="h-4 w-4 mr-1.5" /> Add Education
                </Button>
            </div>

            {educations.length === 0 ? (
                <p className="text-muted-foreground italic text-center py-10">
                    No education added yet. Add your degrees, courses, and certifications.
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    {educations.map((edu, i) => (
                        <div key={i} className="p-4 bg-muted/50 rounded-xl relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setEducations(educations.filter((_, idx) => idx !== i))}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="grid grid-cols-2 gap-3">
                                <Input placeholder="Institution" value={edu.institution || ''} onChange={(e) => { const n = [...educations]; n[i].institution = e.target.value; setEducations(n); }} />
                                <Input placeholder="Degree" value={edu.degree || ''} onChange={(e) => { const n = [...educations]; n[i].degree = e.target.value; setEducations(n); }} />
                                <Input placeholder="Field of Study" value={edu.fieldOfStudy || ''} onChange={(e) => { const n = [...educations]; n[i].fieldOfStudy = e.target.value; setEducations(n); }} />
                                <Input placeholder="GPA (optional)" value={edu.gpa || ''} onChange={(e) => { const n = [...educations]; n[i].gpa = e.target.value; setEducations(n); }} />
                                <Input placeholder="Start Date" value={edu.startDate || ''} onChange={(e) => { const n = [...educations]; n[i].startDate = e.target.value; setEducations(n); }} />
                                <Input placeholder="End Date" value={edu.endDate || ''} onChange={(e) => { const n = [...educations]; n[i].endDate = e.target.value; setEducations(n); }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );

    const renderSkillsSection = () => (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-foreground">Skills</h2>
            </div>

            <div className="flex gap-2 mb-5">
                <Input
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
                    className="flex-1"
                />
                <Button onClick={() => {
                    if (newSkill.trim()) {
                        setSkills([...skills, newSkill.trim()]);
                        setNewSkill('');
                    }
                }}>
                    Add
                </Button>
            </div>

            {skills.length === 0 ? (
                <p className="text-muted-foreground italic text-center py-5">
                    No skills added. Add your technical and soft skills.
                </p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {skills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="py-1.5 px-3 gap-1.5">
                            {skill}
                            <button 
                                onClick={() => setSkills(skills.filter((_, idx) => idx !== i))}
                                className="hover:text-destructive"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </Card>
    );

    const renderProjectsSection = () => (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-foreground">Projects</h2>
                <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => setProjects([...projects, { name: '', description: '', url: '', technologies: [] }])}
                >
                    <Plus className="h-4 w-4 mr-1.5" /> Add Project
                </Button>
            </div>

            {projects.length === 0 ? (
                <p className="text-muted-foreground italic text-center py-10">
                    No projects added. Showcase your side projects, open source contributions, or portfolio pieces.
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    {projects.map((proj, i) => (
                        <div key={i} className="p-4 bg-muted/50 rounded-xl relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setProjects(projects.filter((_, idx) => idx !== i))}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <Input placeholder="Project Name" value={proj.name || ''} onChange={(e) => { const n = [...projects]; n[i].name = e.target.value; setProjects(n); }} />
                                <Input placeholder="URL (optional)" value={proj.url || ''} onChange={(e) => { const n = [...projects]; n[i].url = e.target.value; setProjects(n); }} />
                            </div>
                            <Textarea placeholder="Describe what you built, the problem you solved, and the impact..." value={proj.description || ''} onChange={(e) => { const n = [...projects]; n[i].description = e.target.value; setProjects(n); }} rows={3} />
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );

    const renderCertificationsSection = () => (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-foreground">Certifications</h2>
                <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => setCertifications([...certifications, { name: '', issuer: '', issueDate: '', expirationDate: '', credentialId: '' }])}
                >
                    <Plus className="h-4 w-4 mr-1.5" /> Add Certification
                </Button>
            </div>

            {certifications.length === 0 ? (
                <p className="text-muted-foreground italic text-center py-10">
                    No certifications added. Add AWS, Google, Microsoft, or other professional credentials.
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    {certifications.map((cert, i) => (
                        <div key={i} className="p-4 bg-muted/50 rounded-xl relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setCertifications(certifications.filter((_, idx) => idx !== i))}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="grid grid-cols-2 gap-3">
                                <Input placeholder="Certification Name" value={cert.name || ''} onChange={(e) => { const n = [...certifications]; n[i].name = e.target.value; setCertifications(n); }} />
                                <Input placeholder="Issuing Organization" value={cert.issuer || ''} onChange={(e) => { const n = [...certifications]; n[i].issuer = e.target.value; setCertifications(n); }} />
                                <Input placeholder="Issue Date" value={cert.issueDate || ''} onChange={(e) => { const n = [...certifications]; n[i].issueDate = e.target.value; setCertifications(n); }} />
                                <Input placeholder="Expiration Date (optional)" value={cert.expirationDate || ''} onChange={(e) => { const n = [...certifications]; n[i].expirationDate = e.target.value; setCertifications(n); }} />
                                <Input placeholder="Credential ID (optional)" value={cert.credentialId || ''} onChange={(e) => { const n = [...certifications]; n[i].credentialId = e.target.value; setCertifications(n); }} className="col-span-2" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );

    const renderAccomplishmentsSection = () => (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-foreground">Accomplishments</h2>
                <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => setAccomplishments([...accomplishments, { title: '', description: '', date: '', metric: '' }])}
                >
                    <Plus className="h-4 w-4 mr-1.5" /> Add Accomplishment
                </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-5">
                💡 <strong>Pro tip:</strong> Include quantifiable achievements like "Increased sales by 30%" or "Reduced load time by 2 seconds" - these make your resume stand out!
            </p>

            {accomplishments.length === 0 ? (
                <p className="text-muted-foreground italic text-center py-10">
                    No accomplishments added. Add awards, recognition, or measurable achievements.
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    {accomplishments.map((acc, i) => (
                        <div key={i} className="p-4 bg-muted/50 rounded-xl relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setAccomplishments(accomplishments.filter((_, idx) => idx !== i))}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <Input placeholder="Title (e.g., Employee of the Month)" value={acc.title || ''} onChange={(e) => { const n = [...accomplishments]; n[i].title = e.target.value; setAccomplishments(n); }} />
                                <Input placeholder="Date" value={acc.date || ''} onChange={(e) => { const n = [...accomplishments]; n[i].date = e.target.value; setAccomplishments(n); }} />
                            </div>
                            <Input placeholder="Key Metric (e.g., Increased revenue by 25%)" value={acc.metric || ''} onChange={(e) => { const n = [...accomplishments]; n[i].metric = e.target.value; setAccomplishments(n); }} className="mb-3" />
                            <Textarea placeholder="Description of the achievement..." value={acc.description || ''} onChange={(e) => { const n = [...accomplishments]; n[i].description = e.target.value; setAccomplishments(n); }} rows={2} />
                        </div>
                    ))}
                </div>
            )}
        </Card>
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
            <div className="flex items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading profile...</span>
            </div>
        );
    }

    return (
        <div className="flex gap-8 max-w-[1200px] mx-auto">

            {/* Side Navigation */}
            <div className="w-[260px] flex-shrink-0">
                <Card className="p-3 sticky top-5">
                    <div className="px-4 py-3 mb-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            My Profile
                        </h3>
                    </div>

                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all text-left",
                                activeSection === item.id 
                                    ? "bg-primary/5 text-primary" 
                                    : "text-foreground hover:bg-muted"
                            )}
                        >
                            <div className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center",
                                activeSection === item.id 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-muted text-muted-foreground"
                            )}>
                                {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">{item.label}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                            </div>
                            {activeSection === item.id && <ChevronRight className="h-4 w-4 text-primary" />}
                        </button>
                    ))}
                </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="relative mb-8">
                    <div className="h-[120px] bg-gradient-to-r from-blue-100 to-blue-50 rounded-2xl relative overflow-hidden">
                        <div className="absolute -top-5 -left-5 w-[150px] h-[150px] bg-blue-200 rounded-full opacity-60" />
                        <div className="absolute top-5 right-[10%] w-[200px] h-[200px] bg-blue-100 rounded-full opacity-80" />
                    </div>

                    <div className="absolute -bottom-9 left-6 w-20 h-20 rounded-full bg-background p-[3px] shadow-md">
                        <div className="w-full h-full rounded-full overflow-hidden">
                            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    <div className="ml-[120px] mt-2 flex items-start justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-foreground">{user.firstName} {user.lastName}</h1>
                            {(user.role || user.company) && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {user.role}{user.role && user.company ? ' at ' : ''}{user.company}
                                </p>
                            )}
                        </div>
                        
                        {/* Resume Profile Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                Profile:
                            </span>
                            <div className="w-40">
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
                <div className="mt-5">
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
    <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="relative">
            {icon && (
                <div className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2",
                    error ? "text-destructive" : "text-muted-foreground"
                )}>
                    {icon}
                </div>
            )}
            <Input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                className={cn(
                    icon && "pl-9",
                    error && "border-destructive bg-destructive/10"
                )}
            />
        </div>
        {error && (
            <span className="text-xs text-destructive -mt-1">{error}</span>
        )}
    </div>
);

export default ProfilePage;
