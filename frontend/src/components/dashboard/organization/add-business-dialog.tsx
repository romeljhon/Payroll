
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
import { AddBusiness } from "@/lib/api";

interface Business {
    id: string;
    name: string;
    tax_id: string;
    address: string;
}

const addBusinessSchema = z.object({
    name: z.string().min(2, { message: "Business name must be at least 2 characters." }),
    tax_id: z.string().min(2, { message: "Registration number is required." }),
    address: z.string().min(5, { message: "Address must be at least 5 characters." }),
});

type AddBusinessFormValues = z.infer<typeof addBusinessSchema>;

interface AddBusinessDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onBusinessAdded: any;
}

export default function AddBusinessDialog({ isOpen, onOpenChange, onBusinessAdded }: AddBusinessDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<AddBusinessFormValues>({
        resolver: zodResolver(addBusinessSchema),
        defaultValues: {
            name: "",
            tax_id: "",
            address: "",
        },
    });

    async function onSubmit(values: AddBusinessFormValues) {
        setIsSubmitting(true);
        try {
            const newBusiness = await AddBusiness(values); // ✅ real API call

            onBusinessAdded(newBusiness); // ✅ append to list in parent
            toast({
                title: "Business Added",
                description: `${newBusiness.name} has been successfully added.`,
            });

            form.reset();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to add business.",
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
                    <DialogTitle className="text-primary">Add New Business</DialogTitle>
                    <DialogDescription>
                        Enter the details for the new business entity. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Business Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., KazuPay Solutions  Corp" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tax_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Registration Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., PE123456789" {...field} />
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
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 123 Fintech Ave, Metropolis" {...field} />
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
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Business"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
