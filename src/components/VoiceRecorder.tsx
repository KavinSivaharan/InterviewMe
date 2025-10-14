import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square, Volume2, VolumeX, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface VoiceRecorderProps {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onStopSpeaking: () => void;
  onTranscriptChange: (text: string) => void;
  onSubmitAnswer: () => void;
}

export const VoiceRecorder = ({
  isListening,
  isSpeaking,
  transcript,
  onStartRecording,
  onStopRecording,
  onStopSpeaking,
  onTranscriptChange,
  onSubmitAnswer,
}: VoiceRecorderProps) => {
  return (
    <Card className="p-6 space-y-4 bg-card/80 backdrop-blur-xl border-primary/30 shadow-2xl shadow-primary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-transparent"></div>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Your Answer</h3>
          {isSpeaking && (
            <Button
              variant="outline"
              size="sm"
              onClick={onStopSpeaking}
              className="gap-2"
            >
              <VolumeX className="h-4 w-4" />
              Stop Audio
            </Button>
          )}
        </div>

        {isListening && (
          <div className="min-h-[120px] flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <p className="text-sm text-muted-foreground">Listening...</p>
            </div>
          </div>
        )}

        {!isListening && (
          <>
            <Textarea
              value={transcript}
              onChange={(e) => onTranscriptChange(e.target.value)}
              placeholder="Type your answer here or use voice recording below..."
              className="min-h-[150px] p-4 bg-background/60 backdrop-blur-xl border-primary/30 focus:border-primary resize-none"
            />
            <div className="flex gap-3 justify-center">
              <Button
                size="lg"
                onClick={onStartRecording}
                variant="outline"
                className="gap-2 h-12 px-6 border-primary/30 hover:bg-primary/10"
              >
                <Mic className="h-5 w-5" />
                Voice Record
              </Button>
              <Button
                size="lg"
                onClick={onSubmitAnswer}
                disabled={!transcript || transcript.length < 10}
                className="gap-2 h-12 px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 shadow-lg shadow-primary/30"
              >
                <Send className="h-5 w-5" />
                Analyze Answer
              </Button>
            </div>
          </>
        )}

        {isListening && (
          <div className="flex justify-center">
            <Button
              size="lg"
              variant="destructive"
              onClick={onStopRecording}
              className="gap-2 h-12 px-8"
            >
              <Square className="h-5 w-5" />
              Stop & Analyze
            </Button>
          </div>
        )}

        {isSpeaking && (
          <div className="flex items-center justify-center gap-3 text-primary">
            <Volume2 className="h-5 w-5 animate-pulse" />
            <p className="text-sm font-medium">Playing feedback...</p>
          </div>
        )}
      </div>
    </Card>
  );
};
