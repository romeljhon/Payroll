"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Network,
  Briefcase,
  Users,
  CalendarCheck,
  Calculator,
  FileText,
  Send,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const onboardingSteps = [
  {
    icon: LayoutDashboard,
    title: "Welcome to KazuPay Solutions!",
    description:
      "Let's take a quick guided tour of the Payroll System Setup Flow so you can manage your payroll efficiently.",
    image: "https://placehold.co/600x300?text=Welcome+Dashboard",
  },
  {
    icon: Building2,
    title: "1. Business Setup",
    description: `Register the Business/Company information.
- Define legal name, address, registration details, and contact info.`,
    image: "https://placehold.co/600x300?text=Business+Setup",
  },
  {
    icon: Network,
    title: "2. Branch Setup",
    description: `Add one or more branches/offices under the business.
- Each branch can have separate employees, payroll cycles, and policies.`,
    image: "https://placehold.co/600x300?text=Branch+Setup",
  },
  {
    icon: Briefcase,
    title: "3. Position Setup",
    description: `Define organizational roles/positions (e.g., Manager, Developer, Accountant).
- Positions help structure employee hierarchy and salary mapping.`,
    image: "https://placehold.co/600x300?text=Position+Setup",
  },
  {
    icon: Users,
    title: "4. Employee Setup",
    description: `Add employees with personal info, contact, job position, and assigned branch.
- Upload documents if needed (contracts, IDs, etc.).`,
    image: "https://placehold.co/600x300?text=Employee+Setup",
  },
  {
    icon: CalendarCheck,
    title: "5. Attendance Tracking",
    description: `Configure attendance rules (working hours, shifts, overtime).
- Employees can log time, or HR can upload records.`,
    image: "https://placehold.co/600x300?text=Attendance+Tracking",
  },
  {
    icon: Calculator,
    title: "6. Payroll Configuration",
    description: `Payroll Cycle → Define how often payroll is run (weekly, bi-weekly, monthly).
Payroll Policy → Set up rules (deductions, benefits, overtime, leave handling).
Salary Component → Define earnings (basic, HRA, bonus) and deductions (tax, insurance).
Salary Structure → Assign salary components to positions or employees.
Holidays → Manage official holidays that affect payroll and attendance.`,
    image: "https://placehold.co/600x300?text=Payroll+Configuration",
  },
  {
    icon: FileText,
    title: "7. Payroll Records",
    description: `Generate and manage payroll runs.
- View calculations, adjustments, and ensure accuracy before payslips.`,
    image: "https://placehold.co/600x300?text=Payroll+Records",
  },
  {
    icon: Send,
    title: "8. Generate Payslips",
    description: `Finalize payroll.
- Automatically generate payslips for each employee.
- Export/Download (PDF, Excel) or send via email.`,
    image: "https://placehold.co/600x300?text=Generate+Payslips",
  },
  {
    icon: CheckCircle,
    title: "You're All Set!",
    description:
      "You’re ready to start using KazuPay Solutions. If you need help, look for the support option anytime. 🚀",
    image: "https://placehold.co/600x300?text=All+Set",
  },
];

export default function Page() {
  const [step, setStep] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);

  const currentStep = onboardingSteps[step];
  const totalSteps = onboardingSteps.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
      setImageLoading(true);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setImageLoading(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 px-4 transition-colors">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 flex flex-col transition-colors">
        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            Step {step + 1} of {totalSteps}
          </p>
        </div>

        {/* Animated Step Content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.4 }}
              className="text-center px-4 w-full"
            >
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 rounded-full p-4 dark:bg-primary/20">
                  <currentStep.icon className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3 whitespace-pre-line">
                {currentStep.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-line text-left">
                {currentStep.description}
              </p>

              {/* Image with loader */}
              <div className="relative w-full flex justify-center">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                )}
                <img
                  src={currentStep.image}
                  alt={currentStep.title}
                  className={`rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mx-auto transition-opacity duration-300 ${
                    imageLoading ? "opacity-0" : "opacity-100"
                  }`}
                  onLoad={() => setImageLoading(false)}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          {step > 0 ? (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < totalSteps - 1 ? (
            <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-white">
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="mr-2 h-4 w-4" /> Finish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
