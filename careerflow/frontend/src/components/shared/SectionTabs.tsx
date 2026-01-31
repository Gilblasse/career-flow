import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  count?: number;
}

interface SectionTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function SectionTabs({ 
  tabs, 
  defaultTab, 
  value, 
  onValueChange,
  className 
}: SectionTabsProps) {
  return (
    <Tabs 
      defaultValue={defaultTab || tabs[0]?.id} 
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      <TabsList className="bg-muted/50 p-1">
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.id} 
            value={tab.id}
            className="data-[state=active]:bg-background"
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "ml-2 px-1.5 py-0.5 text-xs rounded-md",
                "bg-muted text-muted-foreground"
              )}>
                {tab.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
