import React, { useState, useMemo } from 'react';
import type { ResumeProfile, Experience, Education } from '../../types';
import { RESUME_PROFILE_MAX_COUNT } from '../../types';
import { ProfileSelector, validateProfileName } from './ProfileSelector';
import { 
    colors, 
    typography, 
    spacing, 
    radius, 
    shadows 
} from '../../styles/tokens';
import { 
    ArrowLeft, 
    Save, 
    FileText, 
    ChevronRight,
    AlertTriangle,
    CheckCircle,
    Loader2
} from 'lucide-react';

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
                    let style: React.CSSProperties = {};
                    if (w.type === 'removed') {
                        style = {
                            backgroundColor: colors.error[100],
                            color: colors.error[800],
                            textDecoration: 'line-through',
                            padding: '1px 3px',
                            borderRadius: '3px',
                        };
                    } else if (w.type === 'added') {
                        style = {
                            backgroundColor: colors.success[100],
                            color: colors.success[800],
                            padding: '1px 3px',
                            borderRadius: '3px',
                        };
                    }
                    return (
                        <span key={i} style={style}>
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
                <div key={i} style={styles.comparisonRow}>
                    {/* Original */}
                    <div style={{
                        ...styles.comparisonCell,
                        backgroundColor: hasChanges ? colors.error[50] : colors.gray[50],
                    }}>
                        {orig ? (
                            <>
                                <div style={styles.expTitle}>{orig.title}</div>
                                <div style={styles.expCompany}>{orig.company}</div>
                                <div style={styles.expDate}>
                                    {orig.startDate} - {orig.endDate || 'Present'}
                                </div>
                                {origBullets.slice(0, 5).map((b: string, bi: number) => {
                                    const updBullet = updBullets[bi] || '';
                                    const bulletChanged = b !== updBullet;
                                    if (bulletChanged && updBullet) {
                                        const { origDiff } = computeWordDiff(b, updBullet);
                                        return (
                                            <div key={bi} style={styles.bullet}>
                                                • {renderDiffText(origDiff, 'original')}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={bi} style={{
                                            ...styles.bullet,
                                            ...(bi >= updBullets.length ? {
                                                backgroundColor: colors.error[100],
                                                borderRadius: '4px',
                                                textDecoration: 'line-through',
                                                color: colors.error[700],
                                            } : {}),
                                        }}>• {b}</div>
                                    );
                                })}
                                {origBullets.length > 5 && (
                                    <div style={styles.moreItems}>
                                        +{origBullets.length - 5} more bullets
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={styles.emptyCell}>No experience</div>
                        )}
                    </div>
                    
                    {/* Arrow */}
                    <div style={styles.arrowCell}>
                        <ChevronRight size={20} color={colors.gray[400]} />
                    </div>
                    
                    {/* Updated */}
                    <div style={{
                        ...styles.comparisonCell,
                        backgroundColor: hasChanges ? colors.success[50] : colors.gray[50],
                    }}>
                        {upd ? (
                            <>
                                <div style={styles.expTitle}>{upd.title}</div>
                                <div style={styles.expCompany}>{upd.company}</div>
                                <div style={styles.expDate}>
                                    {upd.startDate} - {upd.endDate || 'Present'}
                                </div>
                                {updBullets.slice(0, 5).map((b: string, bi: number) => {
                                    const origBullet = origBullets[bi] || '';
                                    const bulletChanged = b !== origBullet;
                                    if (bulletChanged && origBullet) {
                                        const { updDiff } = computeWordDiff(origBullet, b);
                                        return (
                                            <div key={bi} style={styles.bullet}>
                                                • {renderDiffText(updDiff, 'updated')}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={bi} style={{
                                            ...styles.bullet,
                                            ...(bi >= origBullets.length ? {
                                                backgroundColor: colors.success[100],
                                                borderRadius: '4px',
                                                color: colors.success[700],
                                            } : {}),
                                        }}>• {b}</div>
                                    );
                                })}
                                {updBullets.length > 5 && (
                                    <div style={styles.moreItems}>
                                        +{updBullets.length - 5} more bullets
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={styles.emptyCell}>Removed</div>
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
            <div style={styles.comparisonRow}>
                <div style={{
                    ...styles.comparisonCell,
                    backgroundColor: removed.length > 0 ? colors.error[50] : colors.gray[50],
                }}>
                    <div style={styles.skillsGrid}>
                        {original.map((skill, i) => (
                            <span 
                                key={i} 
                                style={{
                                    ...styles.skillTag,
                                    backgroundColor: removed.includes(skill) ? colors.error[100] : colors.gray[200],
                                    color: removed.includes(skill) ? colors.error[700] : colors.gray[700],
                                    textDecoration: removed.includes(skill) ? 'line-through' : 'none',
                                }}
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
                
                <div style={styles.arrowCell}>
                    <ChevronRight size={20} color={colors.gray[400]} />
                </div>
                
                <div style={{
                    ...styles.comparisonCell,
                    backgroundColor: added.length > 0 ? colors.success[50] : colors.gray[50],
                }}>
                    <div style={styles.skillsGrid}>
                        {updated.map((skill, i) => (
                            <span 
                                key={i} 
                                style={{
                                    ...styles.skillTag,
                                    backgroundColor: added.includes(skill) ? colors.success[100] : colors.gray[200],
                                    color: added.includes(skill) ? colors.success[700] : colors.gray[700],
                                }}
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const styles: Record<string, React.CSSProperties> = {
        container: {
            maxWidth: '1600px',
            margin: '0 auto',
            padding: spacing[8],
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing[9],
            paddingBottom: spacing[7],
            borderBottom: `1px solid ${colors.border.default}`,
        },
        headerLeft: {
            display: 'flex',
            alignItems: 'center',
            gap: spacing[5],
        },
        backButton: {
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            padding: `${spacing[3]} ${spacing[5]}`,
            backgroundColor: 'transparent',
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.lg,
            color: colors.text.secondary,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            cursor: 'pointer',
            transition: 'all 0.15s',
        },
        title: {
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            margin: 0,
        },
        subtitle: {
            fontSize: typography.fontSize.base,
            color: colors.text.muted,
            margin: `${spacing[2]} 0 0`,
        },
        mainContent: {
            display: 'grid',
            gridTemplateColumns: '1fr 360px',
            gap: spacing[9],
        },
        comparisonSection: {
            backgroundColor: colors.background.card,
            borderRadius: radius['2xl'],
            border: `1px solid ${colors.border.light}`,
            boxShadow: shadows.sm,
            overflow: 'hidden',
        },
        sectionHeader: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing[7],
            borderBottom: `1px solid ${colors.border.light}`,
            backgroundColor: colors.gray[50],
        },
        sectionTitle: {
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            margin: 0,
        },
        columnHeaders: {
            display: 'grid',
            gridTemplateColumns: '1fr 40px 1fr',
            gap: spacing[4],
            padding: `${spacing[4]} ${spacing[7]}`,
            backgroundColor: colors.gray[100],
            borderBottom: `1px solid ${colors.border.light}`,
        },
        columnLabel: {
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.muted,
            textTransform: 'uppercase' as const,
            letterSpacing: typography.letterSpacing.wide,
        },
        comparisonContent: {
            padding: spacing[7],
        },
        comparisonRow: {
            display: 'grid',
            gridTemplateColumns: '1fr 40px 1fr',
            gap: spacing[4],
            marginBottom: spacing[5],
        },
        comparisonCell: {
            padding: spacing[5],
            borderRadius: radius.lg,
            border: `1px solid ${colors.border.light}`,
        },
        arrowCell: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        expTitle: {
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            marginBottom: spacing[1],
        },
        expCompany: {
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: spacing[1],
        },
        expDate: {
            fontSize: typography.fontSize.xs,
            color: colors.text.muted,
            marginBottom: spacing[3],
        },
        bullet: {
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: spacing[2],
            paddingLeft: spacing[3],
            lineHeight: typography.lineHeight.relaxed,
        },
        moreItems: {
            fontSize: typography.fontSize.xs,
            color: colors.text.muted,
            fontStyle: 'italic',
            marginTop: spacing[2],
        },
        emptyCell: {
            fontSize: typography.fontSize.sm,
            color: colors.text.muted,
            fontStyle: 'italic',
        },
        skillsGrid: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: spacing[2],
        },
        skillTag: {
            padding: `${spacing[1]} ${spacing[3]}`,
            borderRadius: radius.full,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
        },
        savePanel: {
            backgroundColor: colors.background.card,
            borderRadius: radius['2xl'],
            border: `1px solid ${colors.border.light}`,
            boxShadow: shadows.sm,
            padding: spacing[7],
            position: 'sticky' as const,
            top: spacing[8],
        },
        savePanelTitle: {
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            margin: `0 0 ${spacing[2]}`,
        },
        savePanelSubtitle: {
            fontSize: typography.fontSize.sm,
            color: colors.text.muted,
            margin: `0 0 ${spacing[7]}`,
        },
        profileSelectorLabel: {
            display: 'block',
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.secondary,
            marginBottom: spacing[3],
        },
        selectedProfileBadge: {
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
            padding: spacing[5],
            backgroundColor: colors.primary[50],
            border: `1px solid ${colors.primary[200]}`,
            borderRadius: radius.lg,
            marginBottom: spacing[5],
        },
        selectedProfileName: {
            fontFamily: typography.fontFamily.mono,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.primary[700],
        },
        selectedProfileMeta: {
            fontSize: typography.fontSize.xs,
            color: colors.primary[600],
        },
        newProfileBadge: {
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
            padding: spacing[5],
            backgroundColor: colors.success[50],
            border: `1px solid ${colors.success[200]}`,
            borderRadius: radius.lg,
            marginBottom: spacing[5],
        },
        newProfileLabel: {
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: colors.success[600],
            textTransform: 'uppercase' as const,
        },
        newProfileName: {
            fontFamily: typography.fontFamily.mono,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.success[700],
        },
        errorBox: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: spacing[3],
            padding: spacing[5],
            backgroundColor: colors.error[50],
            border: `1px solid ${colors.error[200]}`,
            borderRadius: radius.lg,
            marginBottom: spacing[5],
        },
        errorText: {
            fontSize: typography.fontSize.sm,
            color: colors.error[700],
        },
        saveButton: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[2],
            width: '100%',
            padding: `${spacing[5]} ${spacing[7]}`,
            backgroundColor: colors.primary[600],
            border: 'none',
            borderRadius: radius.lg,
            color: colors.text.inverse,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            cursor: 'pointer',
            transition: 'all 0.15s',
        },
        saveButtonDisabled: {
            backgroundColor: colors.gray[300],
            cursor: 'not-allowed',
        },
        divider: {
            borderTop: `1px solid ${colors.border.light}`,
            margin: `${spacing[7]} 0`,
        },
        infoBox: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: spacing[3],
            padding: spacing[5],
            backgroundColor: colors.primary[50],
            borderRadius: radius.lg,
        },
        infoText: {
            fontSize: typography.fontSize.sm,
            color: colors.primary[700],
            lineHeight: typography.lineHeight.relaxed,
        },
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <button 
                        onClick={onCancel}
                        style={styles.backButton}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.gray[100];
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                        }}
                    >
                        <ArrowLeft size={16} />
                        Back to Editor
                    </button>
                    <div>
                        <h1 style={styles.title}>Review Changes</h1>
                        <p style={styles.subtitle}>
                            Compare your changes before saving to a Resume Profile
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={styles.mainContent}>
                {/* Comparison Panel */}
                <div>
                    {/* Experience Comparison */}
                    <div style={{ ...styles.comparisonSection, marginBottom: spacing[7] }}>
                        <div style={styles.sectionHeader}>
                            <h2 style={styles.sectionTitle}>
                                <FileText size={20} color={colors.primary[600]} />
                                Work Experience
                            </h2>
                        </div>
                        <div style={styles.columnHeaders}>
                            <span style={styles.columnLabel}>Current Version</span>
                            <span></span>
                            <span style={styles.columnLabel}>Updated Version</span>
                        </div>
                        <div style={styles.comparisonContent}>
                            {renderExperienceComparison(
                                originalSnapshot.experience,
                                updatedSnapshot.experience
                            )}
                        </div>
                    </div>

                    {/* Skills Comparison */}
                    <div style={styles.comparisonSection}>
                        <div style={styles.sectionHeader}>
                            <h2 style={styles.sectionTitle}>
                                <FileText size={20} color={colors.primary[600]} />
                                Skills
                            </h2>
                        </div>
                        <div style={styles.columnHeaders}>
                            <span style={styles.columnLabel}>Current</span>
                            <span></span>
                            <span style={styles.columnLabel}>Updated</span>
                        </div>
                        <div style={styles.comparisonContent}>
                            {renderSkillsComparison(
                                originalSnapshot.skills,
                                updatedSnapshot.skills
                            )}
                        </div>
                    </div>
                </div>

                {/* Save Panel */}
                <div style={styles.savePanel}>
                    <h3 style={styles.savePanelTitle}>Save to Profile</h3>
                    <p style={styles.savePanelSubtitle}>
                        Choose an existing profile to update or create a new one.
                    </p>

                    {/* Profile Selector */}
                    <label style={styles.profileSelectorLabel}>
                        Resume Profile Name
                    </label>
                    <ProfileSelector
                        profiles={profiles}
                        selectedProfileId={selectedProfileId}
                        onSelect={handleProfileSelect}
                        showBadge={false}
                        placeholder="Type or select a profile..."
                    />

                    {/* Selected Profile Display */}
                    {selectedProfile && !isCreatingNew && (
                        <div style={{ ...styles.selectedProfileBadge, marginTop: spacing[5] }}>
                            <CheckCircle size={18} color={colors.primary[600]} />
                            <div>
                                <div style={styles.selectedProfileName}>{selectedProfile.name}</div>
                                <div style={styles.selectedProfileMeta}>
                                    Last updated: {new Date(selectedProfile.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* New Profile Display */}
                    {isCreatingNew && newProfileName && (
                        <div style={{ ...styles.newProfileBadge, marginTop: spacing[5] }}>
                            <div>
                                <div style={styles.newProfileLabel}>New Profile</div>
                                <div style={styles.newProfileName}>{newProfileName}</div>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div style={styles.errorBox}>
                            <AlertTriangle size={18} color={colors.error[600]} />
                            <span style={styles.errorText}>{error}</span>
                        </div>
                    )}

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={!canSave}
                        style={{
                            ...styles.saveButton,
                            ...(!canSave ? styles.saveButtonDisabled : {}),
                        }}
                        onMouseEnter={(e) => {
                            if (canSave) {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.primary[700];
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (canSave) {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.primary[600];
                            }
                        }}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                {isCreatingNew ? 'Create Profile & Save' : 'Save Changes'}
                            </>
                        )}
                    </button>

                    <div style={styles.divider} />

                    {/* Info Box */}
                    <div style={styles.infoBox}>
                        <FileText size={16} color={colors.primary[600]} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={styles.infoText}>
                            Each Resume Profile stores a complete snapshot of your experience, education, and skills.
                            You can have up to {RESUME_PROFILE_MAX_COUNT} profiles.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResumeContextPage;
