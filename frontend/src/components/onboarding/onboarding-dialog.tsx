
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Calculator, Send, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OnboardingDialogProps {
  isOpen: boolean;
  onFinish: () => void;
}

const onboardingSteps = [
  {
    icon: LayoutDashboard,
    title: "Welcome to PayEase!",
    description: "Let's take a quick tour to get you started with managing your payroll efficiently.",
  },
  {
    icon: Users,
    title: "Manage Your Employees",
    description: "The 'Employees' section is where you can add, view, and manage all your team members' information in one central place.",
    image: "https://placehold.co/400x200.png?text=Employee+List",
  },
  {
    icon: Calculator,
    title: "Automate Payroll Computation",
    description: "Use the 'Payroll Computation' tool to automatically calculate salaries, deductions, and overtime. It works like a smart spreadsheet!",
    image: "https://placehold.co/400x200.png?text=Payroll+Table",
  },
  {
    icon: Send,
    title: "Generate & Send Payslips",
    description: "Easily generate and distribute digital payslips to your employees via email with just a few clicks from the 'Payslips' section.",
    image: "https://placehold.co/400x200.png?text=Payslip+Preview",

  },
  {
    icon: CheckCircle,
    title: "You're All Set!",
    description: "You're ready to explore PayEase. If you need help, look for the support option. Enjoy streamlined payroll management!",
  },
];

export default function OnboardingDialog({ isOpen, onFinish }: OnboardingDialogProps) {
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
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) onFinish();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="bg-primary/10 rounded-full p-3 mb-4">
              <currentStep.icon className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl text-primary font-bold">{currentStep.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground px-4">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>
        
        {currentStep.image && (
          <div className="my-4 flex justify-center">
            <img src={currentStep.image} alt={currentStep.title} className="rounded-lg shadow-md border" data-ai-hint="app screenshot" />
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
                <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 ml-auto">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            ) : (
                <Button onClick={onFinish} className="bg-green-600 hover:bg-green-700 ml-auto">
                    <CheckCircle className="mr-2 h-4 w-4" /> Finish
                </Button>
            )}
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
