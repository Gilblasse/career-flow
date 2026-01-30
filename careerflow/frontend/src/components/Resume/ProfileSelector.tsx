import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { ResumeProfile } from '../../types';
import { RESUME_PROFILE_MAX_LENGTH, RESUME_PROFILE_MAX_COUNT, RESUME_PROFILE_NAME_REGEX } from '../../types';
import { colors, typography, spacing, radius } from '../../styles/tokens';

interface ProfileSelectorProps {
    profiles: ResumeProfile[];
    selectedProfileId: string | null;
    onSelect: (profileId: string | null, newProfileName?: string) => void;
    disabled?: boolean;
    showBadge?: boolean;
    placeholder?: string;
    allowCreate?: boolean;
}

/**
 * Transforms user input into valid profile name format:
 * - Converts to lowercase
 * - Replaces spaces with dashes
 * - Removes invalid characters
 * - Collapses multiple dashes
 */
export function normalizeProfileName(input: string): string {
    return input
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // spaces to dashes
        .replace(/[^a-z-]/g, '')        // remove invalid chars
        .replace(/-+/g, '-')            // collapse multiple dashes
        .replace(/^-|-$/g, '');         // trim leading/trailing dashes
}

/**
 * Normalizes input during typing - preserves trailing dash so user can
 * type spaces that convert to dashes without them being stripped.
 */
function normalizeForTyping(input: string): string {
    return input
        .toLowerCase()
        .replace(/\s+/g, '-')           // spaces to dashes
        .replace(/[^a-z-]/g, '')        // remove invalid chars
        .replace(/-+/g, '-')            // collapse multiple dashes
        .replace(/^-/, '');             // trim leading dash only
}

/**
 * Validates a profile name and returns error message if invalid
 */
export function validateProfileName(
    name: string,
    existingProfiles: ResumeProfile[],
    currentProfileId?: string | null
): string | null {
    if (!name) {
        return 'Profile name is required';
    }

    if (name.length > RESUME_PROFILE_MAX_LENGTH) {
        return `Profile name cannot exceed ${RESUME_PROFILE_MAX_LENGTH} characters`;
    }

    if (!RESUME_PROFILE_NAME_REGEX.test(name)) {
        return 'Profile name must be lowercase letters separated by dashes (e.g., software-engineering)';
    }

    const duplicate = existingProfiles.find(
        p => p.name === name && p.id !== currentProfileId
    );
    if (duplicate) {
        return 'Profile name already exists';
    }

    return null;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
    profiles,
    selectedProfileId,
    onSelect,
    disabled = false,
    showBadge = true,
    placeholder = 'Select or create profile...',
    allowCreate = true
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get selected profile
    const selectedProfile = useMemo(() => 
        profiles.find(p => p.id === selectedProfileId) || null,
        [profiles, selectedProfileId]
    );

    // Filter profiles based on input
    const filteredProfiles = useMemo(() => {
        if (!inputValue) return profiles;
        const normalized = normalizeProfileName(inputValue);
        return profiles.filter(p => p.name.includes(normalized));
    }, [profiles, inputValue]);

    // Check if input matches an existing profile exactly
    const exactMatch = useMemo(() => {
        const normalized = normalizeProfileName(inputValue);
        return profiles.find(p => p.name === normalized);
    }, [profiles, inputValue]);

    // Check if this would be a new profile
    const isNewProfile = useMemo(() => {
        if (!allowCreate) return false;
        if (!inputValue) return false;
        const normalized = normalizeProfileName(inputValue);
        return normalized.length > 0 && !exactMatch;
    }, [inputValue, exactMatch, allowCreate]);

    // Can we add more profiles?
    const canAddMore = profiles.length < RESUME_PROFILE_MAX_COUNT;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update input when selection changes externally
    useEffect(() => {
        if (selectedProfile && !isOpen) {
            setInputValue(selectedProfile.name);
        }
    }, [selectedProfile, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Use normalizeForTyping to preserve trailing dash during typing
        const normalized = normalizeForTyping(raw);
        
        // Show normalized value for user feedback
        setInputValue(normalized);
        setError(null);
        
        if (!isOpen) setIsOpen(true);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
        // Select all text for easy replacement
        inputRef.current?.select();
    };

    const handleSelectProfile = (profile: ResumeProfile) => {
        setInputValue(profile.name);
        setError(null);
        setIsOpen(false);
        onSelect(profile.id);
    };

    const handleCreateNew = () => {
        const normalized = normalizeProfileName(inputValue);
        
        // Validate
        const validationError = validateProfileName(normalized, profiles);
        if (validationError) {
            setError(validationError);
            return;
        }

        if (!canAddMore) {
            setError(`Maximum of ${RESUME_PROFILE_MAX_COUNT} profiles allowed`);
            return;
        }

        setError(null);
        setIsOpen(false);
        onSelect(null, normalized); // Pass null for ID, new name
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Convert space to dash during typing
        if (e.key === ' ') {
            e.preventDefault();
            const newValue = inputValue + '-';
            setInputValue(normalizeForTyping(newValue));
            return;
        }
        
        if (e.key === 'Enter') {
            e.preventDefault();
            if (exactMatch) {
                handleSelectProfile(exactMatch);
            } else if (isNewProfile && canAddMore) {
                handleCreateNew();
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            if (selectedProfile) {
                setInputValue(selectedProfile.name);
            }
        }
    };

    const styles = {
        container: {
            position: 'relative' as const,
            width: '100%',
        },
        badgeContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
            marginBottom: spacing[3],
        },
        badge: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing[2],
            padding: `${spacing[1]} ${spacing[4]}`,
            backgroundColor: colors.primary[50],
            border: `1px solid ${colors.primary[200]}`,
            borderRadius: radius.full,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.primary[700],
        },
        badgeIcon: {
            width: '14px',
            height: '14px',
        },
        inputWrapper: {
            position: 'relative' as const,
        },
        input: {
            width: '100%',
            padding: `${spacing[4]} ${spacing[5]}`,
            paddingRight: '36px',
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.mono,
            border: `1px solid ${error ? colors.error[300] : colors.border.default}`,
            borderRadius: radius.lg,
            backgroundColor: disabled ? colors.gray[100] : colors.background.card,
            color: colors.text.primary,
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxSizing: 'border-box' as const,
        },
        inputFocused: {
            borderColor: error ? colors.error[500] : colors.primary[500],
            boxShadow: `0 0 0 3px ${error ? colors.error[100] : colors.primary[100]}`,
        },
        chevron: {
            position: 'absolute' as const,
            right: spacing[4],
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none' as const,
            color: colors.text.muted,
        },
        dropdown: {
            position: 'absolute' as const,
            top: '100%',
            left: 0,
            right: 0,
            marginTop: spacing[1],
            backgroundColor: colors.background.card,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radius.lg,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 50,
            maxHeight: '280px',
            overflowY: 'auto' as const,
        },
        option: {
            padding: `${spacing[4]} ${spacing[5]}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: typography.fontSize.base,
            color: colors.text.primary,
            transition: 'background-color 0.1s',
        },
        optionHover: {
            backgroundColor: colors.background.hover,
        },
        optionSelected: {
            backgroundColor: colors.primary[50],
        },
        optionName: {
            fontFamily: typography.fontFamily.mono,
            fontWeight: typography.fontWeight.medium,
        },
        optionMeta: {
            fontSize: typography.fontSize.xs,
            color: colors.text.muted,
        },
        createOption: {
            padding: `${spacing[4]} ${spacing[5]}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
            fontSize: typography.fontSize.base,
            color: colors.primary[600],
            fontWeight: typography.fontWeight.medium,
            borderTop: `1px solid ${colors.border.light}`,
            transition: 'background-color 0.1s',
        },
        createDisabled: {
            color: colors.text.muted,
            cursor: 'not-allowed',
        },
        error: {
            marginTop: spacing[2],
            fontSize: typography.fontSize.sm,
            color: colors.error[600],
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
        },
        hint: {
            marginTop: spacing[2],
            fontSize: typography.fontSize.xs,
            color: colors.text.muted,
        },
        counter: {
            fontSize: typography.fontSize.xs,
            color: colors.text.muted,
            marginLeft: 'auto',
        },
        emptyState: {
            padding: `${spacing[6]} ${spacing[5]}`,
            textAlign: 'center' as const,
            color: colors.text.muted,
            fontSize: typography.fontSize.sm,
        },
    };

    const [isFocused, setIsFocused] = useState(false);

    return (
        <div ref={containerRef} style={styles.container}>
            {/* Active Profile Badge */}
            {showBadge && selectedProfile && !isOpen && (
                <div style={styles.badgeContainer}>
                    <span style={styles.badge}>
                        <svg style={styles.badgeIcon} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.581.814L10 14.229l-4.419 2.585A1 1 0 014 16V4z" clipRule="evenodd" />
                        </svg>
                        {selectedProfile.name}
                    </span>
                    <span style={styles.counter}>
                        {profiles.length}/{RESUME_PROFILE_MAX_COUNT} profiles
                    </span>
                </div>
            )}

            {/* Input */}
            <div style={styles.inputWrapper}>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => { handleInputFocus(); setIsFocused(true); }}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    style={{
                        ...styles.input,
                        ...(isFocused ? styles.inputFocused : {}),
                    }}
                    aria-label="Resume Profile Name"
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                />
                <span style={styles.chevron}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </span>
            </div>

            {/* Error Message */}
            {error && (
                <div style={styles.error}>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}



            {/* Dropdown */}
            {isOpen && (
                <div style={styles.dropdown} role="listbox">
                    {filteredProfiles.length > 0 ? (
                        filteredProfiles.map(profile => (
                            <div
                                key={profile.id}
                                onClick={() => handleSelectProfile(profile)}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.background.hover;
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 
                                        profile.id === selectedProfileId ? colors.primary[50] : 'transparent';
                                }}
                                style={{
                                    ...styles.option,
                                    ...(profile.id === selectedProfileId ? styles.optionSelected : {}),
                                }}
                                role="option"
                                aria-selected={profile.id === selectedProfileId}
                            >
                                <span style={styles.optionName}>{profile.name}</span>
                                <span style={styles.optionMeta}>
                                    Updated {new Date(profile.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))
                    ) : inputValue && !isNewProfile ? (
                        <div style={styles.emptyState}>
                            No profiles match "{inputValue}"
                        </div>
                    ) : null}

                    {/* Create New Option */}
                    {isNewProfile && (
                        <div
                            onClick={canAddMore ? handleCreateNew : undefined}
                            onMouseEnter={(e) => {
                                if (canAddMore) {
                                    (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.primary[50];
                                }
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                            }}
                            style={{
                                ...styles.createOption,
                                ...(!canAddMore ? styles.createDisabled : {}),
                            }}
                            role="option"
                        >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            {canAddMore ? (
                                <>Create new profile: <code style={{ fontFamily: typography.fontFamily.mono }}>{normalizeProfileName(inputValue)}</code></>
                            ) : (
                                <>Maximum {RESUME_PROFILE_MAX_COUNT} profiles reached</>
                            )}
                        </div>
                    )}

                    {/* Empty State */}
                    {!inputValue && filteredProfiles.length === 0 && (
                        <div style={styles.emptyState}>
                            No profiles yet. Type a name to create one.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProfileSelector;
