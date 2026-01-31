
import { FileText, Image, File } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import type { Task } from './types';

interface JobDetailModalProps {
    task: Task;
    onClose: () => void;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({ task, onClose }) => {
    return (
        <Dialog open={true} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
                {/* Header */}
                <DialogHeader className="p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-lg" />
                        <div>
                            <DialogTitle className="text-2xl">{task.role}</DialogTitle>
                            <p className="text-muted-foreground">
                                at <span className="font-medium text-foreground">{task.company}</span>
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">Applied on {task.date}</p>
                </DialogHeader>

                {/* Tabs Content */}
                <Tabs defaultValue="description" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 px-6">
                        <TabsTrigger 
                            value="description" 
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-4"
                        >
                            Job Description
                        </TabsTrigger>
                        <TabsTrigger 
                            value="application"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-4"
                        >
                            Application Data
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto bg-muted/30">
                        <TabsContent value="description" className="m-0 p-6">
                            <h3 className="text-lg font-bold mb-4">About the Job</h3>
                            <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                                {task.jobDescription || "No description available."}
                            </div>
                        </TabsContent>

                        <TabsContent value="application" className="m-0 p-6 space-y-8">
                            {/* Application Screenshot */}
                            <div>
                                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                                    <Image className="h-5 w-5" /> Application Screenshot
                                </h3>
                                <Card>
                                    {task.screenshotUrl ? (
                                        <img src={task.screenshotUrl} alt="Application" className="w-full h-auto" />
                                    ) : (
                                        <CardContent className="py-10 text-center text-muted-foreground bg-muted/50">
                                            No screenshot available
                                        </CardContent>
                                    )}
                                </Card>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Resume */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                                        <FileText className="h-5 w-5" /> Resume
                                    </h3>
                                    <Card>
                                        <CardContent className="p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium">{task.resumeUrl || "Resume.pdf"}</div>
                                                <div className="text-xs text-muted-foreground">PDF Document</div>
                                            </div>
                                            <Button variant="link" className="text-primary">View</Button>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Cover Letter */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                                        <File className="h-5 w-5" /> Cover Letter
                                    </h3>
                                    <Card>
                                        <CardContent className="p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                                                <File className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium">{task.coverLetterUrl || "CoverLetter.pdf"}</div>
                                                <div className="text-xs text-muted-foreground">PDF Document</div>
                                            </div>
                                            <Button variant="link" className="text-primary">View</Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default JobDetailModal;
