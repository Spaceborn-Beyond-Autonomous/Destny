import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileType, CheckCircle, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import type { GDriveFile } from "@/pages/Printing3D";

interface UploadedFile {
  name: string;
  size: number;
  status: "uploading" | "done" | "error";
  errorMessage?: string;
}

interface Props {
  onFileUploaded: (file: GDriveFile | null) => void;
}

const FileUploadSection = ({ onFileUploaded }: Props) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const file = fileList[0];
      if (!file) return;

      const newFile: UploadedFile = {
        name: file.name,
        size: file.size,
        status: "uploading",
      };
      setFiles([newFile]);
      onFileUploaded(null); 

      const formData = new FormData();
      formData.append("file", file);

      axios
        .post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        })
        .then((res) => {
          const gdriveData: GDriveFile = res.data.data;
          setFiles([{ name: file.name, size: file.size, status: "done" }]);
          onFileUploaded(gdriveData);
        })
        .catch((err) => {
          const unauthorizedMessage = err.response?.status === 401
            ? "Please log in to upload files."
            : null;
          const message =
            unauthorizedMessage || err.response?.data?.message || "Upload failed. Please try again.";
          setFiles([
            { name: file.name, size: file.size, status: "error", errorMessage: message },
          ]);
          onFileUploaded(null);
        });
    },
    [onFileUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    onFileUploaded(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <section id="upload" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Upload Your <span className="text-gradient-primary">STL File</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Drag and drop your 3D model files. We support STL, OBJ, and 3MF formats up to 100MB.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-all duration-300 ${
              dragOver
                ? "border-primary bg-primary/5 glow-primary"
                : "border-border hover:border-primary/50 bg-card"
            }`}
          >
            <input
              type="file"
              accept=".stl,.obj,.3mf"
              className="sr-only"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">
              Drop your file here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <div className="flex gap-2">
              {["STL", "OBJ", "3MF"].map((ext) => (
                <span
                  key={ext}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  .{ext}
                </span>
              ))}
            </div>
          </label>

          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              {files.map((file) => (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl glass"
                >
                  <FileType className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(file.size)}
                      {file.status === "error" && file.errorMessage && (
                        <span className="text-red-400 ml-2">— {file.errorMessage}</span>
                      )}
                    </p>
                  </div>
                  {file.status === "uploading" && (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                  {file.status === "done" && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {file.status === "error" && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <button
                    onClick={() => removeFile(file.name)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default FileUploadSection;
