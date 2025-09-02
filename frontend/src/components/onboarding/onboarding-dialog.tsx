"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Briefcase,
  Users,
  CalendarCheck,
  Calendar,
  Clock,
  Settings,
  Calculator,
  FileText,
  Send,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OnboardingDialogProps {
  isOpen: boolean;
  onFinish: () => void;
}

const onboardingSteps = [
  {
    icon: LayoutDashboard,
    title: "Welcome to KazuPay Solutions!",
    description:
      "Let's take a quick tour to help you set up your payroll system step by step.",
  },
  {
    icon: Building2,
    title: "Set Up Your Business",
    description:
      "Start by creating your business profile with company details and preferences.",
    image: "https://placehold.co/400x200.png?text=Business+Setup",
  },
  {
    icon: MapPin,
    title: "Add Branches",
    description:
      "Easily manage multiple business locations by adding different branches.",
    image: "https://placehold.co/400x200.png?text=Branch+Setup",
  },
  {
    icon: Briefcase,
    title: "Define Positions",
    description:
      "Create job positions to organize employee roles within your business.",
    image: "https://placehold.co/400x200.png?text=Position+Setup",
  },
  {
    icon: Users,
    title: "Manage Employees",
    description:
      "Add employee details, assign them to branches and positions, and manage profiles.",
    image: "https://placehold.co/400x200.png?text=Employee+List",
  },
  {
    icon: CalendarCheck,
    title: "Track Attendance",
    description:
      "Record employee attendance, leaves, and overtime to ensure accurate payroll.",
    image: "https://placehold.co/400x200.png?text=Attendance+Tracking",
  },
  {
    icon: Settings,
    title: "Payroll Configuration",
    description:
      "Set up payroll essentials including cycles, policies, components, structures, and holidays.",
    image: "https://placehold.co/400x200.png?text=Payroll+Configuration",
  },
  {
    icon: FileText,
    title: "Payroll Records",
    description:
      "Maintain detailed payroll records for compliance and financial tracking.",
    image: "https://placehold.co/400x200.png?text=Payroll+Records",
  },
  {
    icon: Send,
    title: "Generate & Send Payslips",
    description:
      "Easily generate payslips and send them digitally to employees.",
    image: "https://placehold.co/400x200.png?text=Payslip+Preview",
  },
  {
    icon: CheckCircle,
    title: "You're All Set!",
    description:
      "Your payroll system is ready. Explore KazuPay Solutions and simplify your payroll journey!",
  },
];

export default function OnboardingDialog({
  isOpen,
  onFinish,
}: OnboardingDialogProps) {
  const [step, setStep] = useState(0);
  const currentStep = onboardingSteps[step];
  const totalSteps = onboardingSteps.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onFinish();
      }}
    >
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader className="items-center text-center">
          <div className="bg-primary/10 rounded-full p-3 mb-4">
            <currentStep.icon className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl text-primary font-bold">
            {currentStep.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground px-4">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        {currentStep.image && (
          <div className="my-4 flex justify-center">
            <img
              src={currentStep.image}
              alt={currentStep.title}
              className="rounded-lg shadow-md border max-h-48 object-contain"
              data-ai-hint="app screenshot"
            />
          </div>
        )}

        <div className="px-6 pb-4 space-y-4">
          <Progress value={progress} className="w-full h-2" />
          <DialogFooter className="flex justify-between w-full sm:justify-between pt-4">
            {step > 0 && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            )}
            {step < totalSteps - 1 ? (
              <Button
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90 ml-auto"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={onFinish}
                className="bg-green-600 hover:bg-green-700 ml-auto"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Finish
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
