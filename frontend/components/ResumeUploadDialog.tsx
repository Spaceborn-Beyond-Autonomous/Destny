import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, Loader2, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:9000";
const allowedExtensions = [".pdf", ".doc", ".docx"];

interface ResumeUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ResumeUploadDialog({ open, onOpenChange }: ResumeUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setFile(null);
    setStatus("idle");
  }, []);

  const handleFile = (f: File) => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (!allowedExtensions.includes(ext)) {
      toast({
        title: "Invalid file type",
        description: `Allowed formats: ${allowedExtensions.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Max file size is 10 MB.",
        variant: "destructive",
      });
      return;
    }
    setFile(f);
    setStatus("idle");
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setStatus("uploading");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      await axios.post(`${backendUrl}/api/v1/resume`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStatus("done");
      toast({
        title: "Resume uploaded successfully! 🎉",
        description: "Thank you for sharing your resume with us.",
      });

      setTimeout(() => {
        resetForm();
        onOpenChange(false);
      }, 2000);
    } catch (err: any) {
      setStatus("error");
      toast({
        title: "Upload failed",
        description: err.response?.data?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (status !== "uploading") {
        onOpenChange(val);
        if (!val) resetForm();
      }
    }}>
      <DialogContent className="bg-card border-border/60 max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-display text-center">
            Share Your <span className="text-gradient-primary">Resume</span>
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground mt-2">
            Upload your resume (PDF, DOC, or DOCX) to get matched with the right opportunity.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div
            className={`relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer p-8 text-center ${
              dragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : file
                ? "border-primary/40 bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-primary/5"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => {
              if (status !== "uploading" && status !== "done") {
                inputRef.current?.click();
              }
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              disabled={status === "uploading" || status === "done"}
            />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-primary shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {status !== "uploading" && status !== "done" && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); setStatus("idle"); }}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">
                  Click or drag to upload your resume
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  PDF, DOC, or DOCX (Max 10MB)
                </p>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={status === "uploading"}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="glow-primary gap-2 min-w-[120px]"
              disabled={!file || status === "uploading" || status === "done"}
            >
              {status === "uploading" && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "done" && <CheckCircle className="h-4 w-4" />}
              {status === "uploading"
                ? "Uploading..."
                : status === "done"
                ? "Submitted!"
                : "Submit Resume"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
