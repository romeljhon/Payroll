"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Business {
  id: string;
  name: string;
  tax_id: string;
  address: string;
}

interface EditBusinessDialogProps {
  isOpen: boolean;
  business: Business;
  onClose: () => void;
  onSave: (updatedData: Partial<Business>) => void;
}

export default function EditBusinessDialog({
  isOpen,
  business,
  onClose,
  onSave,
}: EditBusinessDialogProps) {
  const [form, setForm] = useState({
    name: "",
    tax_id: "",
    address: "",
  });

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name,
        tax_id: business.tax_id,
        address: business.address,
      });
    }
  }, [business]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Business</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            name="name"
            placeholder="Business Name"
            value={form.name}
            onChange={handleChange}
          />
          <Input
            name="tax_id"
            placeholder="Tax ID"
            value={form.tax_id}
            onChange={handleChange}
          />
          <Input
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
          />
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
