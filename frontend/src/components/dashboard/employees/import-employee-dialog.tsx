"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { importEmployees } from "@/lib/api";

interface ImportEmployeeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEmployeesImported: () => void;
}

export default function ImportEmployeeDialog({
  isOpen,
  onOpenChange,
  onEmployeesImported,
}: ImportEmployeeDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No File Selected",
        description: "Please select a CSV file to import.",
      });
      return;
    }

    setIsUploading(true);
    try {
      await importEmployees(file);
      toast({
        title: "Import Successful",
        description: "Employees have been imported successfully.",
      });
      onEmployeesImported();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message || "Could not import employees.",
      });
    } finally {
      setIsUploading(false);
      setFile(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Employees</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input type="file" accept=".csv" onChange={handleFileChange} />
          <p className="text-sm text-muted-foreground mt-2">
            Please select a CSV file with the following columns: First Name, Last Name, Email
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isUploading}>
            {isUploading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}