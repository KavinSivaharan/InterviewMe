import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface ResumeUploadProps {
  onResumeProcessed: (resumeText: string) => void;
  resumeText: string;
}

export const ResumeUpload = ({ onResumeProcessed, resumeText }: ResumeUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const { toast } = useToast();

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, DOCX, or TXT file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    try {
      if (file.type === 'text/plain') {
        const text = await file.text();
        onResumeProcessed(text);
        toast({
          title: "Resume uploaded!",
          description: "Your resume has been processed successfully.",
        });
      } else if (file.type === 'application/pdf') {
        const text = await extractTextFromPDF(file);
        onResumeProcessed(text);
        toast({
          title: "PDF parsed successfully!",
          description: `Extracted ${text.length} characters from your resume.`,
        });
      } else {
        // For DOC/DOCX files, inform user to paste text
        toast({
          title: "File uploaded",
          description: "For DOC/DOCX files, please copy and paste the text content into the text area.",
        });
        onResumeProcessed(`Resume file: ${file.name}\n\nPlease paste the text content of your resume in the text area above for AI analysis.`);
      }
    } catch (error: any) {
      console.error("Error uploading resume:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Please try again or paste the text manually.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setFileName("");
    onResumeProcessed("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          className="relative"
          onClick={() => document.getElementById('resume-upload')?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? "Processing..." : "Upload PDF"}
        </Button>
        <input
          id="resume-upload"
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        {fileName && (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">{fileName}</span>
            <button
              onClick={handleClear}
              className="text-destructive hover:text-destructive/80 transition-colors"
              aria-label="Clear file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
