import { MapPin, Calendar, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { UserAvatar } from '@/components/shared';

const ProfileBanner: React.FC = () => {
    return (
        <Card className="border-0 shadow-sm overflow-hidden min-h-[220px] flex flex-col">
            {/* Top Graphic Banner */}
            <div className="h-36 bg-sky-100 relative overflow-hidden">
                {/* Abstract blobs matching the design */}
                <div className="absolute -top-5 -left-5 w-36 h-36 bg-sky-200/60 rounded-full" />
                <div className="absolute top-5 right-[10%] w-48 h-48 bg-sky-50/80 rounded-full" />
                <div className="absolute -bottom-10 -right-5 w-44 h-44 bg-sky-200/50 rounded-full" />
            </div>

            {/* Bottom Content Section */}
            <div className="px-8 pb-6 flex items-end -mt-12 relative">
                {/* Profile Image - Overlapping */}
                <UserAvatar 
                    src="https://i.pravatar.cc/300?img=11"
                    name="Herman Johnson"
                    size="lg"
                    className="w-32 h-32 rounded-full border-4 border-background mr-6 z-10"
                />

                {/* User Info */}
                <div className="flex-1 pb-2 flex items-end justify-between flex-wrap gap-5">
                    {/* Name & Role */}
                    <div>
                        <h1 className="text-2xl font-bold text-foreground mb-1">Herman Johnson</h1>
                        <p className="text-muted-foreground text-[15px]">UI Designer</p>
                    </div>

                    {/* Details - Right Aligned */}
                    <div className="flex gap-6 text-sm text-muted-foreground mb-1">
                        <div className="flex items-center gap-1.5">
                            <Briefcase className="h-4 w-4" />
                            <span>Cityscaper</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            <span>Berlin, Germany</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>09 Sep 2023</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ProfileBanner;
