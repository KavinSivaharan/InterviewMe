import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InterviewCardProps {
  type: string;
  description: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}

export const InterviewCard = ({ type, description, icon, isActive, onClick }: InterviewCardProps) => {
  return (
    <Card 
      className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 hover:-translate-y-1 border relative overflow-hidden group ${
        isActive 
          ? 'ring-2 ring-primary bg-gradient-to-br from-primary/20 to-purple-900/20 border-primary shadow-2xl shadow-primary/50' 
          : 'hover:bg-gradient-to-br hover:from-card/90 hover:to-primary/10 border-primary/30 bg-card/60 backdrop-blur-xl'
      }`}
      onClick={onClick}
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isActive ? 'opacity-100' : ''}`}></div>
      
      <div className="flex flex-col items-center text-center gap-3 relative z-10">
        <div className={`text-5xl transition-transform duration-300 ${isActive ? 'animate-pulse' : 'group-hover:scale-110'}`}>{icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">{type}</h3>
          <p className="text-sm text-muted-foreground/90 leading-relaxed">{description}</p>
          {isActive && (
            <Badge className="mt-3 bg-primary/30 text-primary-foreground border-primary animate-pulse shadow-lg shadow-primary/30" variant="outline">✦ Active</Badge>
          )}
        </div>
      </div>
    </Card>
  );
};
