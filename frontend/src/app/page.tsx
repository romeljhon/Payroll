
import { redirect } from 'next/navigation';
// import Link from 'next/link';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { CheckCircle, TrendingUp, Users, ChevronDown } from 'lucide-react';
// import KazuPay Solutions Logo from '@/components/icons/KazuPay Solutions -logo';

export default function HomePage() {
  redirect('/login');

  // return (
  //   <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/30">
  //     <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  //       <div className="container flex h-14 items-center mx-auto">
  //         <Link href="/" className="flex items-center space-x-2">
  //           <KazuPay Solutions Logo className="h-8 w-auto text-primary" />
  //         </Link>
  //         <nav className="ml-auto flex items-center space-x-2">
  //           <Button variant="ghost" asChild>
  //             <Link href="/login">Login</Link>
  //           </Button>
  //           <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
  //             <Link href="/login">Get Started</Link>
  //           </Button>
  //         </nav>
  //       </div>
  //     </header>

  //     <main className="flex-1">
  //       <section className="container mx-auto py-16 md:py-24 text-center">
  //         <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight text-primary">
  //           Simplify Your Payroll with KazuPay Solutions 
  //         </h1>
  //         <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
  //           KazuPay Solutions  offers a seamless, intuitive, and powerful solution for managing your company's payroll.
  //           Focus on your business, we'll handle the numbers.
  //         </p>
  //         <div className="mt-10">
  //           <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
  //             <Link href="/login">Access Your Dashboard</Link>
  //           </Button>
  //         </div>
  //       </section>

  //       <section className="container mx-auto py-16 md:py-24 bg-card border-t border-b p-4" >
  //         <h2 className="font-headline text-3xl md:text-4xl font-semibold text-center text-primary mb-12">
  //           Why Choose KazuPay Solutions ?
  //         </h2>
  //         <div className="grid md:grid-cols-3 gap-8">
  //           <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
  //             <CardHeader>
  //               <div className="flex items-center justify-center w-12 h-12 bg-accent/20 text-accent rounded-full mb-4">
  //                 <CheckCircle className="w-6 h-6" />
  //               </div>
  //               <CardTitle className="text-primary">Effortless Management</CardTitle>
  //             </CardHeader>
  //             <CardContent>
  //               <CardDescription>
  //                 Streamline attendance input, payroll calculations, and payslip distribution with our user-friendly interface.
  //               </CardDescription>
  //             </CardContent>
  //           </Card>
  //           <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
  //             <CardHeader>
  //               <div className="flex items-center justify-center w-12 h-12 bg-accent/20 text-accent rounded-full mb-4">
  //                 <TrendingUp className="w-6 h-6" />
  //               </div>
  //               <CardTitle className="text-primary">Accurate & Consistent</CardTitle>
  //             </CardHeader>
  //             <CardContent>
  //               <CardDescription>
  //                 Automate complex calculations for salaries, overtime, and deductions, ensuring data consistency and reducing errors.
  //               </CardDescription>
  //             </CardContent>
  //           </Card>
  //           <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
  //             <CardHeader>
  //               <div className="flex items-center justify-center w-12 h-12 bg-accent/20 text-accent rounded-full mb-4">
  //                 <Users className="w-6 h-6" />
  //               </div>
  //               <CardTitle className="text-primary">Employee Self-Service</CardTitle>
  //             </CardHeader>
  //             <CardContent>
  //               <CardDescription>
  //                 Empower your employees with secure access to their payslips and personal information anytime, anywhere.
  //               </CardDescription>
  //             </CardContent>
  //           </Card>
  //         </div>
  //       </section>
  //     </main>

  //     <footer className="py-8 border-t bg-background">
  //       <div className="container mx-auto text-center text-muted-foreground text-sm">
  //         &copy; {new Date().getFullYear()} KazuPay Solutions . All rights reserved.
  //       </div>
  //     </footer>
  //   </div>
  // );
}
