import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Briefcase, 
  Tag, 
  IndianRupee, 
  Calendar, 
  FileText, 
  Users, 
  CheckCircle,
  Plus,
  XCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface PostJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (jobData: any) => Promise<unknown>;
}

const categories = [
  '3D Printing',
  'AI Automation', 
  'MVP Dev',
  'Drone Software',
  'Design',
  'Other'
];

const jobTypes = ['Fixed', 'Hourly', 'Milestone'];

const PostJobDialog: React.FC<PostJobDialogProps> = ({ isOpen, onClose, onPost }) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    budgetMin: '',
    budgetMax: '',
    budgetType: 'Fixed',
    skills: [] as string[],
    currentSkill: '',
    dueDate: '',
    experience: 'Any',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.budgetMin) newErrors.budgetMin = 'Minimum budget is required';
    if (!formData.budgetMax) newErrors.budgetMax = 'Maximum budget is required';
    if (parseInt(formData.budgetMin) > parseInt(formData.budgetMax)) {
      newErrors.budgetMax = 'Max budget must be greater than min budget';
    }
    if (formData.skills.length === 0) newErrors.skills = 'At least one skill is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSkill = () => {
    if (formData.currentSkill.trim() && !formData.skills.includes(formData.currentSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, formData.currentSkill.trim()],
        currentSkill: ''
      });
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1()) return;

    setLoading(true);
    try {
      const jobData = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        budget: {
          min: parseInt(formData.budgetMin),
          max: parseInt(formData.budgetMax),
          type: formData.budgetType,
        },
        skills: formData.skills,
        dueDate: new Date(formData.dueDate).toISOString(),
        experience: formData.experience,
        status: 'open',
      };

      await onPost(jobData);
      toast({
        title: "Job posted! 🎉",
        description: "Your job has been posted successfully. Freelancers will start applying soon.",
      });
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post job. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      description: '',
      budgetMin: '',
      budgetMax: '',
      budgetType: 'Fixed',
      skills: [],
      currentSkill: '',
      dueDate: '',
      experience: 'Any',
    });
    setErrors({});
    setStep(1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-strong rounded-2xl border border-border shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 glass-strong border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Post a Job</h2>
                    <p className="text-xs text-muted-foreground">Fill in the details to find the perfect freelancer</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-muted/20 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Progress Steps */}
                <div className="flex items-center gap-2 mb-6">
                  {[1, 2].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                          step === s
                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                            : step > s
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted/30 text-muted-foreground'
                        }`}
                      >
                        {step > s ? <CheckCircle className="h-4 w-4" /> : s}
                      </div>
                      {s < 2 && (
                        <div className={`w-12 h-0.5 rounded-full transition-all ${
                          step > s ? 'bg-primary' : 'bg-muted/30'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step 1: Job Details */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Title */}
                    <div>
                      <Label className="text-foreground font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        Job Title
                      </Label>
                      <Input
                        placeholder="e.g. Custom Drone Frame Design & 3D Print"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className={`mt-1.5 ${errors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {errors.title && (
                        <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                      )}
                    </div>

                    {/* Category */}
                    <div>
                      <Label className="text-foreground font-medium flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        Category
                      </Label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className={`w-full mt-1.5 px-3 py-2.5 bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                          errors.category ? 'border-red-500 focus:ring-red-500' : 'border-border'
                        }`}
                      >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="text-xs text-red-500 mt-1">{errors.category}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <Label className="text-foreground font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Description
                      </Label>
                      <Textarea
                        placeholder="Describe your project in detail..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={`mt-1.5 min-h-[100px] ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {errors.description && (
                        <p className="text-xs text-red-500 mt-1">{errors.description}</p>
                      )}
                    </div>

                    {/* Budget */}
                    <div>
                      <Label className="text-foreground font-medium flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-primary" />
                        Budget
                      </Label>
                      <div className="flex gap-3 mt-1.5">
                        <div className="flex-1">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={formData.budgetMin}
                            onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                            className={errors.budgetMin ? 'border-red-500 focus:ring-red-500' : ''}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            type="number"
                            placeholder="Max"
                            value={formData.budgetMax}
                            onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                            className={errors.budgetMax ? 'border-red-500 focus:ring-red-500' : ''}
                          />
                        </div>
                        <select
                          value={formData.budgetType}
                          onChange={(e) => setFormData({ ...formData, budgetType: e.target.value })}
                          className="px-3 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                          {jobTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      {errors.budgetMin && (
                        <p className="text-xs text-red-500 mt-1">{errors.budgetMin}</p>
                      )}
                      {errors.budgetMax && (
                        <p className="text-xs text-red-500 mt-1">{errors.budgetMax}</p>
                      )}
                    </div>

                    {/* Skills */}
                    <div>
                      <Label className="text-foreground font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Skills Required
                      </Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          placeholder="Add a skill (e.g. React)"
                          value={formData.currentSkill}
                          onChange={(e) => setFormData({ ...formData, currentSkill: e.target.value })}
                          onKeyDown={handleKeyDown}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddSkill}
                          className="gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                      {errors.skills && (
                        <p className="text-xs text-red-500 mt-1">{errors.skills}</p>
                      )}
                      {formData.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {formData.skills.map((skill) => (
                            <span
                              key={skill}
                              className="bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5"
                            >
                              {skill}
                              <button
                                onClick={() => handleRemoveSkill(skill)}
                                className="hover:text-red-500 transition-colors"
                              >
                                <XCircle className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Due Date */}
                    <div>
                      <Label className="text-foreground font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Due Date
                      </Label>
                      <Input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className={`mt-1.5 ${errors.dueDate ? 'border-red-500 focus:ring-red-500' : ''}`}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.dueDate && (
                        <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>
                      )}
                    </div>

                    <Button
                      type="button"
                      className="w-full glow-primary gap-2"
                      onClick={() => setStep(2)}
                    >
                      Next Step →
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: Review & Post */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="bg-muted/20 rounded-xl p-4 space-y-3">
                      <h3 className="font-semibold text-foreground">Review Your Job Post</h3>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Title</p>
                          <p className="font-medium text-foreground">{formData.title}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Category</p>
                          <p className="font-medium text-foreground">{formData.category}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Description</p>
                          <p className="font-medium text-foreground line-clamp-2">{formData.description}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Budget</p>
                          <p className="font-medium text-foreground">
                            ₹{parseInt(formData.budgetMin).toLocaleString()} - ₹{parseInt(formData.budgetMax).toLocaleString()} ({formData.budgetType})
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Due Date</p>
                          <p className="font-medium text-foreground">
                            {new Date(formData.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Skills</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {formData.skills.map((skill) => (
                              <span key={skill} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-border"
                        onClick={() => setStep(1)}
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        className="flex-1 glow-primary gap-2"
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Post Job
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PostJobDialog;
