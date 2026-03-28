import { Link } from 'react-router-dom';
import { FaCheck } from 'react-icons/fa';
import Navbar from '@/components/layout/Navbar';

const pricing = [
  { name: 'Free', price: '$0', period: '/month', features: ['3 Skills Assessment', '5 Goals', 'Basic Analytics', 'Community Access'], cta: 'Get Started', popular: false },
  { name: 'Pro', price: '$19', period: '/month', features: ['Unlimited Skills', 'Unlimited Goals', 'AI Dev Plans', '21-Day Habits', 'Advanced Analytics', 'Priority Support'], cta: 'Start Free Trial', popular: true },
  { name: 'Team', price: '$49', period: '/month', features: ['Everything in Pro', 'Team Dashboard', 'Admin Controls', 'Custom Integrations', 'Dedicated Support'], cta: 'Contact Sales', popular: false },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-center mb-4">Simple, Transparent Pricing</h1>
          <p className="text-center text-foreground-muted mb-12 max-w-xl mx-auto">Start free and upgrade when you're ready to unlock your full potential</p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {pricing.map((plan, i) => (
              <div key={i} className={`rounded-2xl p-8 ${plan.popular ? 'gradient-hero text-primary-foreground ring-4 ring-secondary scale-105' : 'bg-card border border-border'}`}>
                {plan.popular && <div className="text-xs font-bold uppercase tracking-wider text-secondary mb-4">Most Popular</div>}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.popular ? 'text-primary-foreground/70' : 'text-foreground-muted'}`}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <FaCheck className={plan.popular ? 'text-secondary' : 'text-success'} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`block text-center py-3 rounded-lg font-semibold transition-all ${plan.popular ? 'bg-secondary text-secondary-foreground hover:opacity-90' : 'btn-outline'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
