import { MapPin, Calendar, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { UserAvatar } from '@/components/shared';

const ProfileBanner: React.FC = () => {
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
                    src="https://i.pravatar.cc/300?img=11"
                    name="Herman Johnson"
                    size="lg"
                    className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-background sm:mr-6 z-10"
                />

                {/* User Info */}
                <div className="flex-1 pb-0 sm:pb-2 flex flex-col sm:flex-row sm:items-end justify-between gap-3 md:gap-5">
                    {/* Name & Role */}
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">Herman Johnson</h1>
                        <p className="text-muted-foreground text-sm md:text-[15px]">UI Designer</p>
                    </div>

                    {/* Details - Right Aligned on desktop, stacked on mobile */}
                    <div className="flex flex-wrap gap-3 md:gap-6 text-xs md:text-sm text-muted-foreground mb-1">
                        <div className="flex items-center gap-1.5">
                            <Briefcase className="h-3.5 md:h-4 w-3.5 md:w-4" />
                            <span>Cityscaper</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 md:h-4 w-3.5 md:w-4" />
                            <span>Berlin, Germany</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 md:h-4 w-3.5 md:w-4" />
                            <span>09 Sep 2023</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ProfileBanner;
