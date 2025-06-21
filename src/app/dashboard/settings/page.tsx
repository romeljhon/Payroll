
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bell, CreditCard, ShieldCheck, Save } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('userEmail');
      if (storedEmail) {
        setEmail(storedEmail);
        setFullName(storedEmail.split('@')[0] || "User"); 
      }
    }
  }, []);

  const handleProfileSave = () => {
    // In a real app, you'd save this to a backend.
    // Here, we could update localStorage if desired, but for now, just a toast.
    console.log("Profile saved:", { fullName, email, phone });
    // Example: toast({ title: "Profile Updated" });
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage your profile, preferences, and application settings.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 bg-muted/50 p-1 h-auto">
          <TabsTrigger value="profile" className="py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md"><User className="inline-block mr-2 h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md"><Bell className="inline-block mr-2 h-4 w-4" />Notifications</TabsTrigger>
          <TabsTrigger value="billing" className="py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md"><CreditCard className="inline-block mr-2 h-4 w-4" />Billing</TabsTrigger>
          <TabsTrigger value="security" className="py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md"><ShieldCheck className="inline-block mr-2 h-4 w-4" />Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">Personal Information</CardTitle>
              <CardDescription>Update your personal details and profile picture.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={`https://placehold.co/80x80.png?text=${fullName ? fullName.substring(0,2).toUpperCase() : 'UN'}`} alt={fullName || "User avatar"} data-ai-hint="person avatar" />
                  <AvatarFallback>{fullName ? fullName.substring(0,2).toUpperCase() : 'UN'}</AvatarFallback>
                </Avatar>
                <Button variant="outline">Change Picture</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={email} disabled />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleProfileSave}><Save className="mr-2 h-4 w-4" />Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">Notification Settings</CardTitle>
              <CardDescription>Manage how you receive notifications from PayEase.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Notification settings are not yet available. Check back later!</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">Billing Information</CardTitle>
              <CardDescription>View your subscription details and payment history.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Billing features are not yet implemented.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">Security Settings</CardTitle>
              <CardDescription>Manage your password and account security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button className="bg-primary hover:bg-primary/90"><Save className="mr-2 h-4 w-4" />Update Password</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
