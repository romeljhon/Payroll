
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Branch {
    id: string;
    name: string;
    location: string;
    manager: string;
}

const addBranchSchema = z.object({
    name: z.string().min(2, { message: "Branch name must be at least 2 characters." }),
    location: z.string().min(2, { message: "Location is required." }),
    manager: z.string().min(2, { message: "Manager name is required." }),
});

type AddBranchFormValues = z.infer<typeof addBranchSchema>;

interface AddBranchDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onBranchAdded: (branch: Branch) => void;
}

export default function AddBranchDialog({ isOpen, onOpenChange, onBranchAdded }: AddBranchDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<AddBranchFormValues>({
        resolver: zodResolver(addBranchSchema),
        defaultValues: {
        name: "",
        location: "",
        manager: "",
        },
    });

    async function onSubmit(values: AddBranchFormValues) {
        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newBranch: Branch = {
            id: String(Date.now()),
            ...values,
        };
        
        onBranchAdded(newBranch);
        toast({
            title: "Branch Added",
            description: `${newBranch.name} has been successfully added.`,
        });
        form.reset();
        setIsSubmitting(false);
        onOpenChange(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
            <DialogTitle className="text-primary">Add New Branch</DialogTitle>
            <DialogDescription>
                Enter the details for the new branch. Click save when you're done.
            </DialogDescription>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Branch Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Main Office" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Metropolis" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Manager</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Clark Kent" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => { form.reset(); onOpenChange(false); }}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Branch"}
                </Button>
                </DialogFooter>
            </form>
            </Form>
        </DialogContent>
        </Dialog>
    );
}
