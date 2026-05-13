import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const projects = [
  { title: "MVP Build Request", status: "In review", detail: "Product goals, screens, and delivery timeline are being confirmed." },
  { title: "3D Quote Request", status: "Upload pending", detail: "Files and material preferences are waiting for production review." },
  { title: "Launch Support", status: "In progress", detail: "Content, presentation assets, and launch steps are being organized." },
];

const ProjectTracking = ({ userId }: { userId: string }) => (
  <Card className="glass border-border/40">
    <CardHeader>
      <CardTitle>Project Tracking</CardTitle>
      <CardDescription>Client workspace: {userId || "Destny project account"}</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-4 md:grid-cols-3">
      {projects.map((project) => (
        <div key={project.title} className="rounded-xl border border-border/50 p-4">
          <Badge variant="secondary" className="mb-3">{project.status}</Badge>
          <h3 className="font-display font-semibold">{project.title}</h3>
          <p className="text-sm text-muted-foreground mt-2">{project.detail}</p>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default ProjectTracking;
