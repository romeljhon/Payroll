'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Calculator,
  FileText,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface OnboardingDialogProps {
  isOpen: boolean;
  onFinish: () => void;
}

const onboardingSteps = [
  {
    icon: LayoutDashboard,
    title: 'Welcome to KazuPay Solutions!',
    description:
      'This guide will walk you through the essential steps to get your payroll system up and running.',
  },
  {
    icon: Users,
    title: 'Step 1: Configure Role-Based Access',
    description:
      'Define roles for your team members (e.g., Admin, HR, Employee) to control access to sensitive information and features. This is crucial for security and efficient management.',
    image: 'https://placehold.co/400x200.png?text=Role-Based+Access',
  },
  {
    icon: CalendarCheck,
    title: 'Step 2: Set Up Attendance Tracking',
    description:
      'Configure your attendance policies, including work hours, overtime rules, and leave policies. Accurate attendance data is the foundation of a reliable payroll.',
    image: 'https://placehold.co/400x200.png?text=Attendance+Setup',
  },
  {
    icon: Calculator,
    title: 'Step 3: Define Payroll Computation',
    description:
      'Set up payroll components such as earnings (basic, allowances), deductions (taxes, loans), and contributions (provident fund). This ensures payroll is calculated correctly.',
    image: 'https://placehold.co/400x200.png?text=Payroll+Computation',
  },
  {
    icon: FileText,
    title: 'Step 4: Generate and Distribute Payslips',
    description:
      'After processing payroll, you can generate detailed payslips for your employees. KazuPay makes it easy to review, approve, and distribute them securely.',
    image: 'https://placehold.co/400x200.png?text=Payslip+Generation',
  },
  {
    icon: CheckCircle,
    title: 'Setup Complete!',
    description:
      'You have successfully configured the core features of your payroll system. You can now manage your employees, run payroll, and generate reports with confidence.',
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
