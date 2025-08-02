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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddBranches, getBusiness } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

// ✅ Schema updated to reflect business as an ID (string)
const addBranchSchema = z.object({
    name: z.string().min(2, { message: "Branch name must be at least 2 characters." }),
    address: z.string().min(2, { message: "Address is required." }), // changed from location
    business: z.string().min(1, { message: "Business selection is required." }),
});

type AddBranchFormValues = z.infer<typeof addBranchSchema>;

interface AddBranchDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onBranchAdded: (branch: any) => void;
}

export default function AddBranchDialog({
    isOpen,
    onOpenChange,
    onBranchAdded,
}: AddBranchDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<AddBranchFormValues>({
        resolver: zodResolver(addBranchSchema),
        defaultValues: {
            name: "",
            address: "",
            business: "",
        },
    });

    // ✅ Fetch businesses from API
    const { data: businesses = [], isLoading: loadingBusinesses } = useQuery({
        queryKey: ["businesses"],
        queryFn: getBusiness,
    });

    async function onSubmit(values: AddBranchFormValues) {
        setIsSubmitting(true);
        try {
            const payload = {
                ...values,
                business: Number(values.business), // convert business ID to number
            };
            const newBranch = await AddBranches(payload);

            onBranchAdded(newBranch);
            toast({
                title: "Branch Added",
                description: `${newBranch.name} has been successfully added.`,
            });
            form.reset();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Something went wrong.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
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
                            name="address"
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

                        {/* ✅ Dropdown for Business */}
                        <FormField
                            control={form.control}
                            name="business"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Business</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a business" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {loadingBusinesses ? (
                                                <SelectItem value="" disabled>Loading...</SelectItem>
                                            ) : (
                                                businesses.map((biz: any) => (
                                                    <SelectItem key={biz.id} value={biz.id.toString()}>
                                                        {biz.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    form.reset();
                                    onOpenChange(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-primary hover:bg-primary/90"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    "Save Branch"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
