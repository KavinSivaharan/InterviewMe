import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface FeedbackDisplayProps {
  feedback: string;
  isLoading: boolean;
}

export const FeedbackDisplay = ({ feedback, isLoading }: FeedbackDisplayProps) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-muted-foreground">Analyzing your answer...</p>
        </div>
      </Card>
    );
  }

  if (!feedback) {
    return null;
  }

  return (
    <Card className="p-8 bg-card/80 backdrop-blur border border-primary/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-1 bg-primary rounded-full"></div>
        <h3 className="font-semibold text-xl">Agent Feedback</h3>
      </div>
      <div className="prose prose-base max-w-none dark:prose-invert 
        prose-headings:font-semibold prose-headings:text-foreground prose-headings:mb-3
        prose-p:leading-relaxed prose-p:text-foreground/90 prose-p:mb-4
        prose-strong:text-foreground prose-strong:font-semibold
        prose-ul:my-3 prose-li:text-foreground/90 prose-li:my-1
        prose-li:marker:text-primary">
        <ReactMarkdown>{feedback}</ReactMarkdown>
      </div>
    </Card>
  );
};
