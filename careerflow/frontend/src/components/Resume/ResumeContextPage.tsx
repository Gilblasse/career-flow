import React, { useState, useMemo } from 'react';
import type { ResumeProfile, Experience, Education } from '../../types';
import { RESUME_VARIANT_MAX_COUNT } from '../../types';
import { ProfileSelector, validateProfileName } from './ProfileSelector';
import { 
    ArrowLeft, 
    Save, 
    FileText, 
    ChevronRight,
    AlertTriangle,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ResumeSnapshot {
    experience: Experience[];
    education: Education[];
    skills: string[];
}

interface ResumeContextPageProps {
    originalSnapshot: ResumeSnapshot;
    updatedSnapshot: ResumeSnapshot;
    profiles: ResumeProfile[];
    currentProfileId: string | null;
    contact: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        linkedin: string;
        location: string;
    };
    onCancel: () => void;
    onSave: (profileId: string | null, newProfileName?: string) => Promise<void>;
}

const ResumeContextPage: React.FC<ResumeContextPageProps> = ({
    originalSnapshot,
    updatedSnapshot,
    profiles,
    currentProfileId,
    onCancel,
    onSave,
}) => {
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(currentProfileId);
    const [newProfileName, setNewProfileName] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get the selected profile
    const selectedProfile = useMemo(() => 
        profiles.find(p => p.id === selectedProfileId) || null,
        [profiles, selectedProfileId]
    );

    // Check if creating new profile
    const isCreatingNew = newProfileName !== null && selectedProfileId === null;

    // Validate before save
    const canSave = useMemo(() => {
        if (isSaving) return false;
        if (isCreatingNew) {
            if (!newProfileName) return false;
            const validationError = validateProfileName(newProfileName, profiles);
            if (validationError) return false;
            if (profiles.length >= RESUME_PROFILE_MAX_COUNT) return false;
        }
        return selectedProfileId !== null || isCreatingNew;
    }, [selectedProfileId, newProfileName, isCreatingNew, profiles, isSaving]);

    const handleProfileSelect = (profileId: string | null, newName?: string) => {
        if (newName) {
            // Creating new profile
            setSelectedProfileId(null);
            setNewProfileName(newName);
        } else if (profileId) {
            // Selecting existing profile
            setSelectedProfileId(profileId);
            setNewProfileName(null);
        }
        setError(null);
    };

    // Compute LCS (Longest Common Subsequence) for word-level diff
    const computeLCS = (a: string[], b: string[]): string[] => {
        const m = a.length;
        const n = b.length;
        const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (a[i - 1] === b[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        
        // Backtrack to find LCS
        const lcs: string[] = [];
        let i = m, j = n;
        while (i > 0 && j > 0) {
            if (a[i - 1] === b[j - 1]) {
                lcs.unshift(a[i - 1]);
                i--;
                j--;
            } else if (dp[i - 1][j] > dp[i][j - 1]) {
                i--;
            } else {
                j--;
            }
        }
        return lcs;
    };

    // Compute word-level diff between two strings
    type DiffWord = { text: string; type: 'unchanged' | 'removed' | 'added' };
    
    const computeWordDiff = (original: string, updated: string): { origDiff: DiffWord[]; updDiff: DiffWord[] } => {
        const origWords = original.split(/\s+/).filter(w => w);
        const updWords = updated.split(/\s+/).filter(w => w);
        const lcs = computeLCS(origWords, updWords);
        
        // Build original side diff
        const origDiff: DiffWord[] = [];
        let lcsIdx = 0;
        for (const word of origWords) {
            if (lcsIdx < lcs.length && word === lcs[lcsIdx]) {
                origDiff.push({ text: word, type: 'unchanged' });
                lcsIdx++;
            } else {
                origDiff.push({ text: word, type: 'removed' });
            }
        }
        
        // Build updated side diff
        const updDiff: DiffWord[] = [];
        lcsIdx = 0;
        for (const word of updWords) {
            if (lcsIdx < lcs.length && word === lcs[lcsIdx]) {
                updDiff.push({ text: word, type: 'unchanged' });
                lcsIdx++;
            } else {
                updDiff.push({ text: word, type: 'added' });
            }
        }
        
        return { origDiff, updDiff };
    };

    // Render diff text with highlighted words
    const renderDiffText = (words: DiffWord[], _side: 'original' | 'updated') => {
        return (
            <span>
                {words.map((w, i) => {
                    let className = '';
                    if (w.type === 'removed') {
                        className = 'bg-red-100 text-red-800 line-through px-1 rounded';
                    } else if (w.type === 'added') {
                        className = 'bg-green-100 text-green-800 px-1 rounded';
                    }
                    return (
                        <span key={i} className={className}>
                            {w.text}{' '}
                        </span>
                    );
                })}
            </span>
        );
    };

    const handleSave = async () => {
        if (!canSave) return;
        
        setIsSaving(true);
        setError(null);
        
        try {
            await onSave(selectedProfileId, newProfileName || undefined);
        } catch (err: any) {
            setError(err.message || 'Failed to save profile');
            setIsSaving(false);
        }
    };

    // Render experience comparison with word-level diff
    const renderExperienceComparison = (original: Experience[], updated: Experience[]) => {
        const maxLen = Math.max(original.length, updated.length);
        const items = [];
        
        for (let i = 0; i < maxLen; i++) {
            const orig = original[i];
            const upd = updated[i];
            const hasChanges = JSON.stringify(orig) !== JSON.stringify(upd);
            
            // Get bullets for comparison
            const origBullets: string[] = (orig as any)?.bullets || [];
            const updBullets: string[] = (upd as any)?.bullets || [];
            
            items.push(
                <div key={i} className="flex flex-col md:grid md:grid-cols-[1fr_40px_1fr] gap-4 mb-5">
                    {/* Mobile label for Original */}
                    <div className="md:hidden text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Current Version</div>
                    {/* Original */}
                    <div className={cn(
                        "p-5 rounded-lg border border-border",
                        hasChanges ? "bg-red-50" : "bg-muted/50"
                    )}>
                        {orig ? (
                            <>
                                <div className="text-base font-semibold text-foreground mb-1">{orig.title}</div>
                                <div className="text-sm text-muted-foreground mb-1">{orig.company}</div>
                                <div className="text-xs text-muted-foreground mb-3">
                                    {orig.startDate} - {orig.endDate || 'Present'}
                                </div>
                                {origBullets.slice(0, 5).map((b: string, bi: number) => {
                                    const updBullet = updBullets[bi] || '';
                                    const bulletChanged = b !== updBullet;
                                    if (bulletChanged && updBullet) {
                                        const { origDiff } = computeWordDiff(b, updBullet);
                                        return (
                                            <div key={bi} className="text-sm text-muted-foreground mb-2 pl-3 leading-relaxed">
                                                • {renderDiffText(origDiff, 'original')}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={bi} className={cn(
                                            "text-sm text-muted-foreground mb-2 pl-3 leading-relaxed",
                                            bi >= updBullets.length && "bg-red-100 rounded line-through text-red-700"
                                        )}>• {b}</div>
                                    );
                                })}
                                {origBullets.length > 5 && (
                                    <div className="text-xs text-muted-foreground italic mt-2">
                                        +{origBullets.length - 5} more bullets
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-sm text-muted-foreground italic">No experience</div>
                        )}
                    </div>
                    
                    {/* Arrow - hidden on mobile */}
                    <div className="hidden md:flex items-center justify-center">
                        <ChevronRight size={20} className="text-muted-foreground" />
                    </div>
                    
                    {/* Mobile label for Updated */}
                    <div className="md:hidden text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 mt-2">Updated Version</div>
                    {/* Updated */}
                    <div className={cn(
                        "p-5 rounded-lg border border-border",
                        hasChanges ? "bg-green-50" : "bg-muted/50"
                    )}>
                        {upd ? (
                            <>
                                <div className="text-base font-semibold text-foreground mb-1">{upd.title}</div>
                                <div className="text-sm text-muted-foreground mb-1">{upd.company}</div>
                                <div className="text-xs text-muted-foreground mb-3">
                                    {upd.startDate} - {upd.endDate || 'Present'}
                                </div>
                                {updBullets.slice(0, 5).map((b: string, bi: number) => {
                                    const origBullet = origBullets[bi] || '';
                                    const bulletChanged = b !== origBullet;
                                    if (bulletChanged && origBullet) {
                                        const { updDiff } = computeWordDiff(origBullet, b);
                                        return (
                                            <div key={bi} className="text-sm text-muted-foreground mb-2 pl-3 leading-relaxed">
                                                • {renderDiffText(updDiff, 'updated')}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={bi} className={cn(
                                            "text-sm text-muted-foreground mb-2 pl-3 leading-relaxed",
                                            bi >= origBullets.length && "bg-green-100 rounded text-green-700"
                                        )}>• {b}</div>
                                    );
                                })}
                                {updBullets.length > 5 && (
                                    <div className="text-xs text-muted-foreground italic mt-2">
                                        +{updBullets.length - 5} more bullets
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-sm text-muted-foreground italic">Removed</div>
                        )}
                    </div>
                </div>
            );
        }
        
        return items;
    };

    // Render skills comparison
    const renderSkillsComparison = (original: string[], updated: string[]) => {
        const removed = original.filter(s => !updated.includes(s));
        const added = updated.filter(s => !original.includes(s));
        
        return (
            <div className="flex flex-col md:grid md:grid-cols-[1fr_40px_1fr] gap-4 mb-5">
                {/* Mobile label for Original */}
                <div className="md:hidden text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Current</div>
                <div className={cn(
                    "p-4 lg:p-5 rounded-lg border border-border",
                    removed.length > 0 ? "bg-red-50" : "bg-muted/50"
                )}>
                    <div className="flex flex-wrap gap-2">
                        {original.map((skill, i) => (
                            <Badge 
                                key={i}
                                variant={removed.includes(skill) ? "destructive" : "secondary"}
                                className={cn(
                                    removed.includes(skill) && "line-through"
                                )}
                            >
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </div>
                
                {/* Arrow - hidden on mobile */}
                <div className="hidden md:flex items-center justify-center">
                    <ChevronRight size={20} className="text-muted-foreground" />
                </div>
                
                {/* Mobile label for Updated */}
                <div className="md:hidden text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 mt-2">Updated</div>
                <div className={cn(
                    "p-4 lg:p-5 rounded-lg border border-border",
                    added.length > 0 ? "bg-green-50" : "bg-muted/50"
                )}>
                    <div className="flex flex-wrap gap-2">
                        {updated.map((skill, i) => (
                            <Badge 
                                key={i}
                                variant={added.includes(skill) ? "default" : "secondary"}
                                className={cn(
                                    added.includes(skill) && "bg-green-100 text-green-700 hover:bg-green-100"
                                )}
                            >
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-9 pb-7 border-b">
                <div className="flex items-center gap-5">
                    <Button variant="outline" onClick={onCancel} className="gap-2">
                        <ArrowLeft size={16} />
                        Back to Editor
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground m-0">Review Changes</h1>
                        <p className="text-base text-muted-foreground mt-2">
                            Compare your changes before saving to a Resume Variant
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-9">
                {/* Comparison Panel */}
                <div>
                    {/* Experience Comparison */}
                    <Card className="mb-7 overflow-hidden">
                        <div className="flex items-center justify-between p-4 lg:p-7 border-b bg-muted/50">
                            <h2 className="flex items-center gap-3 text-lg font-semibold text-foreground m-0">
                                <FileText size={20} className="text-primary" />
                                Work Experience
                            </h2>
                        </div>
                        <div className="hidden md:grid grid-cols-[1fr_40px_1fr] gap-4 px-4 lg:px-7 py-4 bg-muted border-b">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Current Version</span>
                            <span></span>
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Updated Version</span>
                        </div>
                        <div className="p-4 lg:p-7">
                            {renderExperienceComparison(
                                originalSnapshot.experience,
                                updatedSnapshot.experience
                            )}
                        </div>
                    </Card>

                    {/* Skills Comparison */}
                    <Card className="overflow-hidden">
                        <div className="flex items-center justify-between p-4 lg:p-7 border-b bg-muted/50">
                            <h2 className="flex items-center gap-3 text-lg font-semibold text-foreground m-0">
                                <FileText size={20} className="text-primary" />
                                Skills
                            </h2>
                        </div>
                        <div className="hidden md:grid grid-cols-[1fr_40px_1fr] gap-4 px-4 lg:px-7 py-4 bg-muted border-b">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Current</span>
                            <span></span>
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Updated</span>
                        </div>
                        <div className="p-4 lg:p-7">
                            {renderSkillsComparison(
                                originalSnapshot.skills,
                                updatedSnapshot.skills
                            )}
                        </div>
                    </Card>
                </div>

                {/* Save Panel */}
                <Card className="p-4 lg:p-7 lg:sticky lg:top-8 h-fit">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Save to Profile</h3>
                    <p className="text-sm text-muted-foreground mb-7">
                        Choose an existing profile to update or create a new one.
                    </p>

                    {/* Profile Selector */}
                    <Label className="mb-3">Resume Variant Name</Label>
                    <ProfileSelector
                        profiles={profiles}
                        selectedProfileId={selectedProfileId}
                        onSelect={handleProfileSelect}
                        showBadge={false}
                        placeholder="Type or select a variant..."
                    />

                    {/* Selected Profile Display */}
                    {selectedProfile && !isCreatingNew && (
                        <div className="flex items-center gap-3 p-5 bg-primary/10 border border-primary/20 rounded-lg mt-5">
                            <CheckCircle size={18} className="text-primary" />
                            <div>
                                <div className="font-mono text-base font-semibold text-primary">{selectedProfile.name}</div>
                                <div className="text-xs text-primary/80">
                                    Last updated: {new Date(selectedProfile.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* New Profile Display */}
                    {isCreatingNew && newProfileName && (
                        <div className="flex items-center gap-3 p-5 bg-green-50 border border-green-200 rounded-lg mt-5">
                            <div>
                                <div className="text-xs font-medium text-green-600 uppercase">New Variant</div>
                                <div className="font-mono text-base font-semibold text-green-700">{newProfileName}</div>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="flex items-start gap-3 p-5 bg-destructive/10 border border-destructive/20 rounded-lg mb-5">
                            <AlertTriangle size={18} className="text-destructive shrink-0" />
                            <span className="text-sm text-destructive">{error}</span>
                        </div>
                    )}

                    {/* Save Button */}
                    <Button
                        onClick={handleSave}
                        disabled={!canSave}
                        className="w-full mt-5"
                        size="lg"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                {isCreatingNew ? 'Create Variant & Save' : 'Save Changes'}
                            </>
                        )}
                    </Button>

                    <div className="border-t my-7" />

                    {/* Info Box */}
                    <div className="flex items-start gap-3 p-5 bg-primary/10 rounded-lg">
                        <FileText size={16} className="text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-primary leading-relaxed">
                            Each Resume Variant stores a complete snapshot of your experience, education, and skills.
                            You can have up to {RESUME_VARIANT_MAX_COUNT} variants.
                        </span>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ResumeContextPage;
