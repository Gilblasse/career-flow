import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UserProfile } from '../types.js';
import Logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
                firstName: 'Candidate',
                lastName: 'User',
                email: 'candidate@example.com',
                phone: '000-000-0000',
                linkedin: '',
                location: 'Remote'
            },
            preferences: {
                remoteOnly: false,
                excludedKeywords: [],
                maxSeniority: [],
                locations: []
            },
            skills: []
        };
    }
}

export default new ProfileService();
