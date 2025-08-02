
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, PlusCircle, Briefcase } from "lucide-react";
import React, { useState } from "react";
import AddBusinessDialog from "@/components/dashboard/organization/add-business-dialog";

interface Business {
  id: string;
  name: string;
  registrationNumber: string;
  address: string;
}

const initialBusinesses: Business[] = [
  { id: "1", name: "PayEase Corp", registrationNumber: "PE123456789", address: "123 Fintech Ave, Metropolis" },
  { id: "2", name: "Wayne Enterprises", registrationNumber: "WE987654321", address: "1007 Mountain Drive, Gotham City" },
];

export default function BusinessPage() {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [isAddBusinessDialogOpen, setIsAddBusinessDialogOpen] = useState(false);

  const handleBusinessAdded = (newBusiness: Business) => {
    setBusinesses(prevBusinesses => [newBusiness, ...prevBusinesses]);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-primary flex items-center"><Briefcase className="mr-2 h-6 w-6"/> Businesses</CardTitle>
            <CardDescription>Manage your business entities.</CardDescription>
          </div>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsAddBusinessDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Business
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Registration Number</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell className="font-medium">{business.name}</TableCell>
                  <TableCell>{business.registrationNumber}</TableCell>
                  <TableCell>{business.address}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-accent mr-2">
                      <Edit className="h-4 w-4" />
                       <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                       <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddBusinessDialog
        isOpen={isAddBusinessDialogOpen}
        onOpenChange={setIsAddBusinessDialogOpen}
        onBusinessAdded={handleBusinessAdded}
      />
    </div>
  );
}
