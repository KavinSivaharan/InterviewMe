import { useState } from "react";
import { InterviewCard } from "@/components/InterviewCard";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { FeedbackDisplay } from "@/components/FeedbackDisplay";
import { ResumeUpload } from "@/components/ResumeUpload";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { INTERVIEW_TYPES } from "@/data/questions";


const Index = () => {
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customContext, setCustomContext] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [hasProvidedContext, setHasProvidedContext] = useState(false);
  const [relevantCategories, setRelevantCategories] = useState<string[]>([]);
  
  const { toast } = useToast();
  const {
    isListening,
    transcript,
    isSupported: micSupported,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  } = useSpeechRecognition();
  
  const { speak, stop: stopSpeaking, isSpeaking, isSupported: ttsSupported } = useSpeechSynthesis();

  const currentInterviewType = selectedType !== null ? INTERVIEW_TYPES[selectedType] : null;
  
  // Shared analyze function for both voice and typed answers
  const analyzeAnswer = async (answerText: string) => {
    if (!answerText || answerText.length < 10) {
      toast({
        title: "Answer too short",
        description: "Please provide a longer answer (at least 10 characters).",
        variant: "destructive",
      });
      return;
    }
    
    if (!currentInterviewType) {
      toast({
        title: "No interview type selected",
        description: "Please select an interview type first.",
        variant: "destructive",
      });
      return;
    }

    console.log("Analyzing answer...");
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-interview", {
        body: {
          answer: answerText,
          interviewType: currentInterviewType.type,
          question,
          customContext,
          jobDescription,
        },
      });

      if (error) throw error;

      setFeedback(data.feedback);
      
      if (ttsSupported) {
        speak(data.feedback);
      }
      
      toast({
        title: "Analysis complete!",
        description: "Review your feedback below.",
      });
    } catch (error: any) {
      console.error("Error analyzing answer:", error);
      toast({
        title: "Analysis failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const analyzeJobContext = () => {
    if (!customContext && !jobDescription) return;
    
    const context = `${customContext} ${jobDescription}`.toLowerCase();
    const categories: string[] = [];
    
    // Always include Behavioral for any role
    categories.push("Behavioral");
    
    // Technical/Engineering roles
    const isTechnical = context.includes("engineer") || context.includes("developer") || 
                       context.includes("software") || context.includes("swe") ||
                       context.includes("programming") || context.includes("frontend") || 
                       context.includes("backend") || context.includes("full stack") ||
                       context.includes("devops") || context.includes("data engineer");
    
    if (isTechnical) {
      categories.push("Technical");
      categories.push("Coding");
    }
    
    // Consulting/Business Strategy roles - REMOVED, user doesn't want Case Study
    
    // Product Management roles
    const isProduct = context.includes("product manager") || context.includes("product owner") ||
                     context.includes("pm ") || context.includes("product management");
    
    if (isProduct) {
      categories.push("Technical");
    }
    
    // Data Science/Analytics roles
    const isData = context.includes("data scientist") || context.includes("data analyst") ||
                  context.includes("machine learning") || context.includes("ai ") ||
                  context.includes("analytics");
    
    if (isData) {
      categories.push("Technical");
      categories.push("Coding");
    }
    
    setRelevantCategories(categories);
    setHasProvidedContext(true);
  };
  
  // Get random question for endless practice
  const getRandomQuestion = () => {
    if (!currentInterviewType) return "";
    const randomIndex = Math.floor(Math.random() * currentInterviewType.questions.length);
    return currentInterviewType.questions[randomIndex];
  };
  
  const [question, setQuestion] = useState("");
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  const generateCustomQuestion = async () => {
    if (!customContext && !jobDescription) return "";
    
    console.log("Generating custom question with context:", customContext.substring(0, 50), "...");
    setIsGeneratingQuestion(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-interview", {
        body: {
          answer: "GENERATE_QUESTION_ONLY",
          interviewType: "Custom",
          question: "",
          customContext,
          jobDescription,
        },
      });

      if (error) {
        console.error("Error from edge function:", error);
        throw error;
      }
      
      console.log("Received response:", data);
      
      // Extract just the question from the response
      const questionMatch = data.feedback.match(/\*\*Question\*\*:\s*(.+?)(?:\n|$)/);
      const generatedQuestion = questionMatch ? questionMatch[1].trim() : data.feedback.trim();
      
      console.log("Generated question:", generatedQuestion);
      return generatedQuestion;
    } catch (error) {
      console.error("Error generating custom question:", error);
      toast({
        title: "Failed to generate question",
        description: "Using a generic question instead.",
        variant: "destructive",
      });
      return "Tell me about your most significant project or achievement.";
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handleStartRecording = () => {
    resetTranscript();
    setFeedback("");
    startListening();
  };

  const handleStopRecording = async () => {
    stopListening();
    
    // Longer delay to ensure final transcript is fully captured
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Use a fresh reference to the transcript
    const currentTranscript = transcript.trim();
    
    console.log("Transcript after delay:", currentTranscript, "Length:", currentTranscript.length);
    
    await analyzeAnswer(currentTranscript);
  };

  const handleNextQuestion = async () => {
    if (currentInterviewType?.type === "Custom") {
      const customQ = await generateCustomQuestion();
      setQuestion(customQ);
    } else {
      setQuestion(getRandomQuestion());
    }
    resetTranscript();
    setFeedback("");
    stopSpeaking();
  };

  if (!micSupported || !ttsSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your browser doesn't support voice features. Please use Chrome, Edge, or Safari for the best experience.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-black via-50% to-primary/20 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-40 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent"></div>
      
      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent animate-pulse drop-shadow-2xl">
            InterviewMe
          </h1>
          <p className="text-muted-foreground/90 text-lg">
            Your AI interview coach with real-time feedback
          </p>
        </div>

        {/* Step 1: Context Collection */}
        {!hasProvidedContext && (
          <div className="max-w-3xl mx-auto space-y-6 mb-8">
            <div className="bg-card/80 border border-primary/30 rounded-2xl p-8 shadow-2xl shadow-primary/20 backdrop-blur-xl relative overflow-hidden">
              {/* Card glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-transparent"></div>
              <h2 className="text-2xl font-semibold mb-6 text-center relative z-10 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Tell us about your interview</h2>
              
              <div className="space-y-4 relative z-10">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/90">
                    Resume / Background (Optional)
                  </label>
                  <textarea
                    value={customContext}
                    onChange={(e) => setCustomContext(e.target.value)}
                    placeholder="Paste your resume or background here, or upload a PDF below..."
                    className="w-full min-h-[200px] max-h-[400px] p-4 rounded-lg border border-primary/30 bg-background/60 backdrop-blur-xl resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono text-sm leading-relaxed hover:border-primary/50"
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <ResumeUpload onResumeProcessed={setCustomContext} resumeText={customContext} />
                    {customContext && (
                      <span className="text-xs text-muted-foreground">
                        ✓ {customContext.length.toLocaleString()} characters loaded
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="jobDescription" className="block text-sm font-medium mb-2 text-foreground/90">
                    Job Description / Role Details
                  </label>
                  <textarea
                    id="jobDescription"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description or describe the role you're interviewing for..."
                    className="w-full min-h-[200px] max-h-[400px] p-4 rounded-lg border border-primary/30 bg-background/60 backdrop-blur-xl resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono text-sm leading-relaxed hover:border-primary/50"
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                  />
                  {jobDescription && (
                    <span className="text-xs text-muted-foreground mt-2 block">
                      {jobDescription.length.toLocaleString()} characters
                    </span>
                  )}
                </div>
                
                <button
                  onClick={analyzeJobContext}
                  disabled={!customContext && !jobDescription}
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 text-primary-foreground font-semibold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start Practicing →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Interview Categories */}
        {hasProvidedContext && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {INTERVIEW_TYPES.filter(type => 
                type.type === "Custom" || relevantCategories.includes(type.type)
              ).map((type, index) => {
                const actualIndex = INTERVIEW_TYPES.indexOf(type);
                return (
                  <InterviewCard
                    key={type.type}
                    {...type}
                    isActive={selectedType === actualIndex}
                    onClick={async () => {
                      setSelectedType(actualIndex);
                      resetTranscript();
                      setFeedback("");
                      stopSpeaking();
                      
                      // Generate question after setting type
                      if (type.type === "Custom") {
                        const customQ = await generateCustomQuestion();
                        setQuestion(customQ);
                      } else if (type.questions.length > 0) {
                        setQuestion(type.questions[Math.floor(Math.random() * type.questions.length)]);
                      }
                    }}
                  />
                );
              })}
            </div>

            {/* Current Question */}
            {selectedType !== null && currentInterviewType && question && (
              <div className="mb-8">
                <div className="bg-card/80 backdrop-blur-xl border border-primary/30 rounded-2xl p-8 shadow-2xl shadow-primary/30 relative overflow-hidden">
                  {/* Card glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent"></div>
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className="text-4xl">{currentInterviewType.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{currentInterviewType.type}</h3>
                        {currentInterviewType.type === "Custom" && (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                            ✨ Personalized
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{currentInterviewType.description}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-primary/20 pt-6 mt-4">
                    <h2 className="text-2xl font-semibold mb-4 leading-relaxed">{question}</h2>
                    <button
                      onClick={handleNextQuestion}
                      disabled={isGeneratingQuestion}
                      className="text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50 font-medium"
                    >
                      {isGeneratingQuestion ? "⏳ Generating..." : "🔄 Get another question"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Voice Recorder */}
            {selectedType !== null && (
              <div className="mb-8">
                <VoiceRecorder
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  transcript={transcript}
                  onStartRecording={handleStartRecording}
                  onStopRecording={handleStopRecording}
                  onStopSpeaking={stopSpeaking}
                  onTranscriptChange={setTranscript}
                  onSubmitAnswer={() => analyzeAnswer(transcript)}
                />
              </div>
            )}

            {/* Feedback */}
            <FeedbackDisplay feedback={feedback} isLoading={isAnalyzing} />
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
