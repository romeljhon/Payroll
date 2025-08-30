"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Calculator,
  Send,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const onboardingSteps = [
  {
    icon: LayoutDashboard,
    title: "Welcome to PayEase!",
    description:
      "Let's take a quick tour to get you started with managing your payroll efficiently.",
  },
  {
    icon: Users,
    title: "Manage Your Employees",
    description:
      "The 'Employees' section is where you can add, view, and manage all your team members' information in one central place.",
    image: "https://placehold.co/500x250.png?text=Employee+List",
  },
  {
    icon: Calculator,
    title: "Automate Payroll Computation",
    description:
      "Use the 'Payroll Computation' tool to automatically calculate salaries, deductions, and overtime. It works like a smart spreadsheet!",
    image: "https://placehold.co/500x250.png?text=Payroll+Table",
  },
  {
    icon: Send,
    title: "Generate & Send Payslips",
    description:
      "Easily generate and distribute digital payslips to your employees via email with just a few clicks from the 'Payslips' section.",
    image: "https://placehold.co/500x250.png?text=Payslip+Preview",
  },
  {
    icon: CheckCircle,
    title: "You're All Set!",
    description:
      "You're ready to explore PayEase. If you need help, look for the support option. Enjoy streamlined payroll management!",
  },
];

export default function Page() {
  const [step, setStep] = useState(0);
  const currentStep = onboardingSteps[step];
  const totalSteps = onboardingSteps.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 px-4 transition-colors">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 flex flex-col transition-colors">
        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            Step {step + 1} of {totalSteps}
          </p>
        </div>

        {/* Animated Step Content */}
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.4 }}
              className="text-center px-4"
            >
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 rounded-full p-4 dark:bg-primary/20">
                  <currentStep.icon className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                {currentStep.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {currentStep.description}
              </p>

              {currentStep.image && (
                <img
                  src={currentStep.image}
                  alt={currentStep.title}
                  className="rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mx-auto"
                />
              )}
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
