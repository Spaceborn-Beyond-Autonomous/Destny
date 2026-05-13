import { FileType, UploadCloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const uploadTypes = ["STL models", "OBJ models", "3MF files", "Project briefs"];

const FileUploads = ({ userId }: { userId: string }) => (
  <Card className="glass border-border/40">
    <CardHeader>
      <CardTitle>File Uploads</CardTitle>
      <CardDescription>Manage design files and project documents for {userId || "your Destny workspace"}.</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="rounded-2xl border border-dashed border-primary/40 p-8 text-center">
        <UploadCloud className="mx-auto h-10 w-10 text-primary" />
        <p className="font-display text-lg font-semibold mt-4">Upload project files</p>
        <p className="text-sm text-muted-foreground mt-2">Share models, references, briefs, and production details with the Destny team.</p>
      </div>
      <div className="grid sm:grid-cols-4 gap-3 mt-5">
        {uploadTypes.map((type) => (
          <div key={type} className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-sm">
            <FileType className="h-4 w-4 text-primary" />
            {type}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default FileUploads;
