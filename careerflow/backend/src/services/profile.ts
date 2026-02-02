import { UserProfile, ResumeProfile, RESUME_PROFILE_MAX_LENGTH, RESUME_PROFILE_MAX_COUNT, RESUME_PROFILE_NAME_REGEX } from '../types.js';
import Logger from './logger.js';
import supabase from './supabase.js';

export interface ProfileValidationError {
    field: string;
    message: string;
}

/**
 * Validates resume profile names and count
 */
export function validateResumeProfiles(profiles: ResumeProfile[]): ProfileValidationError[] {
    const errors: ProfileValidationError[] = [];
    
    // Check max count
    if (profiles.length > RESUME_PROFILE_MAX_COUNT) {
        errors.push({
            field: 'resumeProfiles',
            message: `Maximum of ${RESUME_PROFILE_MAX_COUNT} resume profiles allowed`,
        });
    }
    
    // Validate each profile
    const seenNames = new Set<string>();
    profiles.forEach((profile, index) => {
        // Check name format
        if (!profile.name) {
            errors.push({
                field: `resumeProfiles[${index}].name`,
                message: 'Profile name is required',
            });
        } else {
            // Check length
            if (profile.name.length > RESUME_PROFILE_MAX_LENGTH) {
                errors.push({
                    field: `resumeProfiles[${index}].name`,
                    message: `Profile name cannot exceed ${RESUME_PROFILE_MAX_LENGTH} characters`,
                });
            }
            
            // Check format
            if (!RESUME_PROFILE_NAME_REGEX.test(profile.name)) {
                errors.push({
                    field: `resumeProfiles[${index}].name`,
                    message: 'Profile name must be lowercase letters separated by dashes',
                });
            }
            
            // Check uniqueness
            if (seenNames.has(profile.name)) {
                errors.push({
                    field: `resumeProfiles[${index}].name`,
                    message: 'Profile name must be unique',
                });
            }
            seenNames.add(profile.name);
        }
        
        // Validate required fields
        if (!profile.id) {
            errors.push({
                field: `resumeProfiles[${index}].id`,
                message: 'Profile ID is required',
            });
        }
    });
    
    return errors;
}

class ProfileService {
    private getDefaultProfile(): UserProfile {
        return {
            contact: {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                linkedin: '',
                location: '',
                role: '',
                company: '',
                bio: ''
            },
            experience: [],
            education: [],
            preferences: {
                remoteOnly: false,
                excludedKeywords: [],
                maxSeniority: [],
                locations: []
            },
            skills: [],
            resumeProfiles: []
        };
    }

    /**
     * Get profile for a user from Supabase
     */
    async getProfileByUserId(userId: string): Promise<UserProfile> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No profile found, return default
                    Logger.warn(`No profile found for user ${userId}, returning default`);
                    return this.getDefaultProfile();
                }
                throw error;
            }

            // Transform Supabase data to UserProfile
            const profile: UserProfile = {
                contact: data.contact || this.getDefaultProfile().contact,
                experience: data.experience || [],
                education: data.education || [],
                skills: data.skills || [],
                preferences: data.preferences || this.getDefaultProfile().preferences,
                resumeProfiles: data.resume_profiles || [],
                lastEditedProfileId: data.last_edited_profile_id,
            };

            Logger.info(`Profile loaded for user ${userId}`);
            return profile;
        } catch (error) {
            Logger.error(`Failed to get profile for user ${userId}`, error);
            throw error;
        }
    }

    /**
     * Save/update profile for a user in Supabase
     */
    async saveProfileByUserId(userId: string, profile: UserProfile): Promise<void> {
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    user_id: userId,
                    contact: profile.contact,
                    experience: profile.experience,
                    education: profile.education,
                    skills: profile.skills,
                    preferences: profile.preferences,
                    resume_profiles: profile.resumeProfiles,
                    last_edited_profile_id: profile.lastEditedProfileId,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id',
                });

            if (error) {
                throw error;
            }

            Logger.info(`Profile saved for user ${userId}`);
        } catch (error) {
            Logger.error(`Failed to save profile for user ${userId}`, error);
            throw error;
        }
    }

    /**
     * Reset profile to empty state for a user
     */
    async resetProfileByUserId(userId: string): Promise<void> {
        const emptyProfile = this.getDefaultProfile();
        await this.saveProfileByUserId(userId, emptyProfile);
        Logger.info(`Profile reset for user ${userId}`);
    }
}

export default new ProfileService();
