import React, { useState, useMemo } from 'react';
import type { ResumeProfile } from '../../types';
import { RESUME_PROFILE_MAX_LENGTH, RESUME_PROFILE_MAX_COUNT, RESUME_PROFILE_NAME_REGEX } from '../../types';
import { Check, ChevronsUpDown, Plus, AlertCircle, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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

    return (
        <div className="w-full space-y-3">
            {/* Active Profile Badge */}
            {showBadge && selectedProfile && !isOpen && (
                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="gap-2">
                        <Bookmark className="h-3.5 w-3.5" />
                        {selectedProfile.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                        {profiles.length}/{RESUME_PROFILE_MAX_COUNT} profiles
                    </span>
                </div>
            )}

            {/* Combobox */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isOpen}
                        disabled={disabled}
                        className={cn(
                            "w-full justify-between font-mono",
                            !selectedProfile && "text-muted-foreground"
                        )}
                    >
                        {selectedProfile?.name || placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Type profile name..."
                            value={inputValue}
                            onValueChange={(value: string) => {
                                const normalized = normalizeForTyping(value);
                                setInputValue(normalized);
                                setError(null);
                            }}
                            onKeyDown={handleKeyDown}
                        />
                        <CommandList>
                            {filteredProfiles.length === 0 && !isNewProfile && inputValue && (
                                <CommandEmpty>No profiles match "{inputValue}"</CommandEmpty>
                            )}
                            {filteredProfiles.length === 0 && !inputValue && (
                                <CommandEmpty>No profiles yet. Type a name to create one.</CommandEmpty>
                            )}
                            
                            {filteredProfiles.length > 0 && (
                                <CommandGroup heading="Profiles">
                                    {filteredProfiles.map((profile) => (
                                        <CommandItem
                                            key={profile.id}
                                            value={profile.name}
                                            onSelect={() => handleSelectProfile(profile)}
                                            className="justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Check
                                                    className={cn(
                                                        "h-4 w-4",
                                                        profile.id === selectedProfileId
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                    )}
                                                />
                                                <span className="font-mono font-medium">{profile.name}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                Updated {new Date(profile.updatedAt).toLocaleDateString()}
                                            </span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Create New Option */}
                            {isNewProfile && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup>
                                        <CommandItem
                                            onSelect={canAddMore ? handleCreateNew : undefined}
                                            disabled={!canAddMore}
                                            className={cn(
                                                "gap-2",
                                                canAddMore 
                                                    ? "text-primary" 
                                                    : "text-muted-foreground cursor-not-allowed"
                                            )}
                                        >
                                            <Plus className="h-4 w-4" />
                                            {canAddMore ? (
                                                <>
                                                    Create new profile:{" "}
                                                    <code className="font-mono bg-muted px-1 rounded">
                                                        {normalizeProfileName(inputValue)}
                                                    </code>
                                                </>
                                            ) : (
                                                <>Maximum {RESUME_PROFILE_MAX_COUNT} profiles reached</>
                                            )}
                                        </CommandItem>
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}
        </div>
    );
};

export default ProfileSelector;
