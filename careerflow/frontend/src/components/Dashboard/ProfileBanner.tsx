import { MapPin, Calendar, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { UserAvatar } from '@/components/shared';
import type { UserProfile } from '@/types';

interface ProfileBannerProps {
    profile?: UserProfile | null;
}

const ProfileBanner: React.FC<ProfileBannerProps> = ({ profile }) => {
    // Extract profile data with fallbacks
    const firstName = profile?.contact?.firstName || 'User';
    const lastName = profile?.contact?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Welcome';
    const location = profile?.contact?.location || 'Not set';
    const currentRole = profile?.experience?.[0]?.title || 'Job Seeker';
    const currentCompany = profile?.experience?.[0]?.company || '';
    
    // Format join date or use current date
    const joinDate = new Date().toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    });

    return (
        <Card className="border-0 shadow-sm overflow-hidden min-h-[180px] md:min-h-[220px] flex flex-col">
            {/* Top Graphic Banner */}
            <div className="h-24 md:h-36 bg-sky-100 relative overflow-hidden">
                {/* Abstract blobs matching the design */}
                <div className="absolute -top-5 -left-5 w-24 md:w-36 h-24 md:h-36 bg-sky-200/60 rounded-full" />
                <div className="absolute top-5 right-[10%] w-32 md:w-48 h-32 md:h-48 bg-sky-50/80 rounded-full" />
                <div className="absolute -bottom-10 -right-5 w-28 md:w-44 h-28 md:h-44 bg-sky-200/50 rounded-full" />
            </div>

            {/* Bottom Content Section */}
            <div className="px-4 md:px-8 pb-4 md:pb-6 flex flex-col sm:flex-row sm:items-end -mt-8 md:-mt-12 relative gap-3 sm:gap-0">
                {/* Profile Image - Overlapping */}
                <UserAvatar 
                    name={fullName}
                    size="lg"
                    className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-background sm:mr-6 z-10"
                />

                {/* User Info */}
                <div className="flex-1 pb-0 sm:pb-2 flex flex-col sm:flex-row sm:items-end justify-between gap-3 md:gap-5">
                    {/* Name & Role */}
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">{fullName}</h1>
                        <p className="text-muted-foreground text-sm md:text-[15px]">{currentRole}</p>
                    </div>

                    {/* Details - Right Aligned on desktop, stacked on mobile */}
                    <div className="flex flex-wrap gap-3 md:gap-6 text-xs md:text-sm text-muted-foreground mb-1">
                        {currentCompany && (
                            <div className="flex items-center gap-1.5">
                                <Briefcase className="h-3.5 md:h-4 w-3.5 md:w-4" />
                                <span>{currentCompany}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 md:h-4 w-3.5 md:w-4" />
                            <span>{location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 md:h-4 w-3.5 md:w-4" />
                            <span>{joinDate}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ProfileBanner;
