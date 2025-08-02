"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getBusiness } from "@/lib/api";

interface Branch {
  id: number;
  name: string;
  address: string;
  business_name: string;
  business?: number; // optional, in case backend sends business ID
}

interface Business {
  id: number;
  name: string;
  tax_id: string;
  address: string;
}

interface EditBranchDialogProps {
  isOpen: boolean;
  branch: Branch;
  onClose: () => void;
  onSave: (updatedData: Partial<Branch>) => void;
}

export default function EditBranchDialog({
  isOpen,
  branch,
  onClose,
  onSave,
}: EditBranchDialogProps) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    business: 0,
  });

  // Fetch all businesses for selection
  const { data: businesses = [], isLoading: loadingBusinesses } = useQuery<Business[]>({
    queryKey: ["businesses"],
    queryFn: getBusiness,
  });

  useEffect(() => {
    if (branch) {
      setForm({
        name: branch.name,
        address: branch.address,
        business: branch.business || businesses.find(b => b.name === branch.business_name)?.id || 0,
      });
    }
  }, [branch, businesses]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "business" ? Number(value) : value,
    }));
  };

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Branch</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            name="name"
            placeholder="Branch Name"
            value={form.name}
            onChange={handleChange}
          />
          <Input
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
          />
          <select
            name="business"
            value={form.business}
            onChange={handleChange}
            className="w-full border border-input bg-background p-2 rounded-md"
          >
            <option value={0} disabled>
              {loadingBusinesses ? "Loading businesses..." : "Select a business"}
            </option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
