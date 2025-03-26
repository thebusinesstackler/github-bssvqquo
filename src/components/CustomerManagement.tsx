import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Target, 
  Globe, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  BarChart3,
  MessageSquare,
  Clock,
  Shield
} from 'lucide-react';

export function CustomerManagement() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Target,
      title: "Targeted Patient Recruitment",
      description: "Access a pool of pre-screened patients who match your study criteria, reducing screening failures and accelerating enrollment."
    },
    {
      icon: Globe,
      title: "Geographic Targeting",
      description: "Reach potential participants within your specified radius, ensuring they're within easy reach of your research site."
    },
    {
      icon: TrendingUp,
      title: "Real-time Analytics",
      description: "Track recruitment progress, conversion rates, and patient engagement metrics through an intuitive dashboard."
    },
    {
      icon: MessageSquare,
      title: "Automated Communication",
      description: "Engage with potential participants through automated messaging and reminders, maintaining consistent communication."
    }
  ];

  const features = [
    "Pre-screened patient database",
    "Geographic radius targeting",
    "Real-time recruitment analytics",
    "Automated patient communication",
    "Custom screening forms",
    "HIPAA-compliant messaging",
    "Integration with major EDC systems",
    "24/7 technical support"
  ];

  const stats = [
    {
      value: "85%",
      label: "Reduction in screening failures"
    },
    {
      value: "3x",
      label: "Faster recruitment rate"
    },
    {
      value: "60%",
      label: "Lower cost per enrollment"
    },
    {
      value: "95%",
      label: "Patient satisfaction rate"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Accelerate Your Clinical Trial Recruitment
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Connect with pre-screened, engaged patients and streamline your recruitment process
        </p>
        <button
          onClick={() => navigate('/pricing')}
          className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Get Started Today
          <ArrowRight className="ml-2 w-5 h-5" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {benefits.map((benefit, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Features List */}
      <div className="bg-gray-50 rounded-lg p-8 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Everything You Need for Successful Recruitment
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center">
              <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Ready to Transform Your Patient Recruitment?
        </h2>
        <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
          Join leading research sites using our platform to streamline their recruitment process and connect with qualified patients.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/pricing')}
            className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            View Pricing Plans
          </button>
          <button
            onClick={() => navigate('/support')}
            className="px-6 py-3 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
          >
            Schedule a Demo
          </button>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="mt-16 text-center">
        <div className="flex items-center justify-center space-x-3 text-gray-500 mb-4">
          <Shield className="w-5 h-5" />
          <span>HIPAA Compliant</span>
          <span>•</span>
          <Clock className="w-5 h-5" />
          <span>24/7 Support</span>
          <span>•</span>
          <BarChart3 className="w-5 h-5" />
          <span>Real-time Analytics</span>
        </div>
        <p className="text-sm text-gray-500">
          Trusted by leading research institutions and CROs nationwide
        </p>
      </div>
    </div>
  );
}