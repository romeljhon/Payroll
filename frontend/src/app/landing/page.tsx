'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, Star, DollarSign, Zap } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { useSubscription } from '@/hooks/use-subscription';
import { cn } from '@/lib/utils';
import Aurora from '@/components/auth/Aurora';
import LandingHeader from '@/components/layout/landing-header';

const plans = [
  {
    name: 'Basic',
    price: '₱500',
    pricePeriod: '/month',
    description: 'Ideal for small teams and startups starting out.',
    features: [
      'Employee Portal',
      'Payslip Generation',
      'Payslip Distribution',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    price: '₱1250',
    pricePeriod: '/month',
    description: 'Perfect for growing businesses that need more power.',
    features: [
      'All Basic features',
      'Role-Based Access',
      'Attendance Input',
      'Payroll Computation',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    pricePeriod: '',
    description: 'For large organizations with complex needs.',
    features: [
      'All Pro features',
      'Dedicated Support',
      'Custom Integrations',
      'Advanced Reporting',
    ],
    popular: false,
  },
];

const LandingPage = () => {
  const router = useRouter();
  const { plan, setSubscriptionPlan } = useSubscription();

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Aurora />
      <LandingHeader />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 sm:py-32 md:py-48 flex items-center justify-center text-center">
          <div className="relative z-10 px-4 container mx-auto">
            <motion.h1
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Modern Payroll for Modern Businesses
            </motion.h1>
            <motion.p
              className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              KazuPay offers a smart, intuitive, and powerful payroll solution designed to save you time and reduce errors. 
            </motion.p>
            <motion.div
              className="mt-10 flex justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button size="lg" onClick={() => router.push('/register')} className="text-base sm:text-lg py-5 px-6 sm:py-7 sm:px-8">
                Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <motion.section
          id="features"
          className="py-20 md:py-28 bg-white/5"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Why KazuPay?
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Discover the features that make KazuPay the ultimate payroll solution.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[{
                icon: Zap,
                title: 'Automated Payroll',
                description: 'Effortlessly automate payroll with precision and reliability.',
              }, {
                icon: DollarSign,
                title: 'Employee Self-Service',
                description: 'Empower employees with access to their payroll information.',
              }, {
                icon: Star,
                title: 'Guaranteed Compliance',
                description: 'Stay compliant with ever-changing tax laws and regulations.',
              }].map(feature => (
                <div key={feature.title} className="bg-background/40 p-6 sm:p-8 rounded-lg text-center">
                  <feature.icon className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-4 sm:mb-6" />
                  <h3 className="text-xl sm:text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Pricing Section */}
        <motion.section
          id="pricing"
          className="py-20 md:py-28"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Choose Your Plan
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Simple, transparent pricing for businesses of all sizes.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
              {plans.map((p) => (
                <div
                  key={p.name}
                  className={cn(
                    'border rounded-xl flex flex-col h-full',
                    p.popular ? 'border-primary shadow-2xl shadow-primary/20' : 'border-white/10',
                    plan === p.name ? 'ring-2 ring-primary' : ''
                  )}
                >
                  <div className="p-6 sm:p-8">
                    {p.popular && <div className="text-sm font-bold text-primary mb-2">MOST POPULAR</div>}
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">{p.name}</h3>
                    <p className="text-muted-foreground mb-6 h-12">{p.description}</p>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-4xl sm:text-5xl font-extrabold">{p.price}</span>
                      {p.pricePeriod && <span className="text-muted-foreground">{p.pricePeriod}</span>}
                    </div>
                    <Button 
                      size="lg" 
                      className={cn('w-full', !p.popular && 'bg-secondary')} 
                      onClick={() => p.name !== 'Enterprise' && setSubscriptionPlan(p.name as any)}
                      disabled={plan === p.name}
                    >
                       {plan === p.name ? 'Current Plan' : 'Choose Plan'}
                    </Button>
                  </div>
                  <div className="border-t border-white/10 p-6 sm:p-8 flex-grow">
                    <h4 className="font-semibold mb-4">Features include:</h4>
                    <ul className="space-y-3">
                      {p.features.map(feature => (
                        <li key={feature} className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          className="py-20 md:py-28 bg-white/5"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Ready to Simplify Your Payroll?
            </h2>
            <p className="mt-6 text-muted-foreground max-w-2xl mx-auto">
              Join KazuPay today and experience a payroll system that works for you, not against you.
            </p>
            <div className="mt-10">
              <Button size="lg" onClick={() => router.push('/register')} className="text-base sm:text-lg py-5 px-6 sm:py-7 sm:px-8">
                Sign Up Now
              </Button>
            </div>
          </div>
        </motion.section>
      </main>

      <footer className="py-10 border-t border-white/10">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} KazuPay. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
