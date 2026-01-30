import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UserProfile, ResumeProfile, RESUME_PROFILE_MAX_LENGTH, RESUME_PROFILE_MAX_COUNT, RESUME_PROFILE_NAME_REGEX } from '../types.js';
import Logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    private profile: UserProfile | null = null;
    private configPath = path.resolve(__dirname, '../../profile.json');

    constructor() {
        this.loadProfile();
    }

    private loadProfile() {
        try {
            if (fs.existsSync(this.configPath)) {
                const rawData = fs.readFileSync(this.configPath, 'utf-8');
                this.profile = JSON.parse(rawData);
                Logger.info('UserProfile loaded successfully.');
            } else {
                Logger.warn(`Profile configuration not found at ${this.configPath}. Using defaults.`);
                this.profile = this.getDefaultProfile();
            }
        } catch (error) {
            Logger.error('Failed to load user profile', error);
            this.profile = this.getDefaultProfile();
        }
    }

    public getConfig(): UserProfile {
        if (!this.profile) {
            this.loadProfile();
        }
        return this.profile!;
    }

    public saveConfig(newProfile: UserProfile): void {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(newProfile, null, 4));
            this.profile = newProfile;
            Logger.info('UserProfile saving successfully.');
        } catch (error) {
            Logger.error('Failed to save user profile', error);
            throw error;
        }
    }

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
}

export default new ProfileService();
