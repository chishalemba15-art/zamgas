'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/Layout/DashboardLayout'
import { zamgasTheme } from '@/lib/zamgas-theme'
import { MessageCircle, Phone, Mail, HelpCircle, ChevronDown, ChevronUp, Headphones, Zap, Shield, Clock } from 'lucide-react'

interface FAQ {
  question: string
  answer: string
}

export default function CustomerSupport() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const faqs: FAQ[] = [
    {
      question: 'How do I place an order?',
      answer: 'Go to the Home page, select your cylinder type and quantity, enter your delivery address, and click "Place Order". You\'ll receive confirmation once your order is processed.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept Cash on Delivery and Mobile Money (MTN, Airtel, Zamtel). You can select your preferred payment method during checkout.',
    },
    {
      question: 'How long does delivery take?',
      answer: 'Most deliveries are completed within 2-4 hours. You can track your order status in real-time on the Orders page.',
    },
    {
      question: 'Can I track my delivery?',
      answer: 'Yes! Go to the Orders page and tap on your active order to see live tracking information and current delivery location.',
    },
    {
      question: 'What if I need to cancel my order?',
      answer: 'Contact your provider immediately through the support button. Orders can be cancelled before they are dispatched.',
    },
    {
      question: 'How do I know my LPG is authentic?',
      answer: 'All our providers are verified and ZEMA-certified. Every cylinder has a unique serial number and safety seal. Report any concerns immediately.',
    },
    {
      question: 'What are the environmental benefits of LPG?',
      answer: 'LPG produces 50% less CO₂ than charcoal, reduces deforestation by 80%, and keeps indoor air 95% cleaner. Check your environmental impact on the Home page!',
    },
  ]

  const contactOptions = [
    {
      icon: Phone,
      title: 'Call Us',
      description: '+260 97 900 0000',
      action: () => window.location.href = 'tel:+260979000000',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      description: 'Chat with us',
      action: () => window.open('https://wa.me/260979000000', '_blank'),
    },
    {
      icon: Mail,
      title: 'Email',
      description: 'support@zamgas.com',
      action: () => window.location.href = 'mailto:support@zamgas.com',
    },
  ]

  return (
    <DashboardLayout title="Support">
      <div className="space-y-6">
        {/* Quick Help Header */}
        <div
          className="p-6 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.burgundy} 0%, ${zamgasTheme.colors.premium.burgundyDark} 100%)`,
            border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ 
                background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
                boxShadow: `0 4px 12px ${zamgasTheme.colors.premium.red}40`,
              }}
            >
              <Headphones className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2
                className="text-xl font-bold mb-2"
                style={{ 
                  color: zamgasTheme.colors.premium.gold,
                  fontFamily: zamgasTheme.typography.fontFamily.display,
                }}
              >
                How can we help?
              </h2>
              <p className="text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>
                Browse our FAQs below or contact us directly. We're here 24/7 to assist you!
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { icon: Zap, label: '< 2min', desc: 'Response' },
              { icon: Shield, label: '24/7', desc: 'Support' },
              { icon: Clock, label: '99%', desc: 'Resolved' },
            ].map((stat, i) => (
              <div 
                key={i}
                className="p-3 rounded-xl text-center"
                style={{ background: zamgasTheme.colors.premium.burgundyLight }}
              >
                <stat.icon className="h-4 w-4 mx-auto mb-1" style={{ color: zamgasTheme.colors.premium.gold }} />
                <p className="font-bold text-sm" style={{ color: '#FFFFFF' }}>{stat.label}</p>
                <p className="text-xs" style={{ color: zamgasTheme.colors.premium.gray }}>{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {contactOptions.map((option, index) => {
            const Icon = option.icon
            return (
              <button
                key={index}
                onClick={option.action}
                className="p-5 rounded-2xl transition-all hover:scale-105 active:scale-95 text-left"
                style={{
                  background: zamgasTheme.colors.premium.burgundy,
                  border: `1px solid ${zamgasTheme.colors.premium.burgundyLight}`,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                }}
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${zamgasTheme.colors.premium.gold}20` }}
                >
                  <Icon className="h-5 w-5" style={{ color: zamgasTheme.colors.premium.gold }} />
                </div>
                <p
                  className="font-bold mb-1"
                  style={{ 
                    color: '#FFFFFF',
                    fontFamily: zamgasTheme.typography.fontFamily.display,
                  }}
                >
                  {option.title}
                </p>
                <p className="text-sm" style={{ color: zamgasTheme.colors.premium.gray }}>{option.description}</p>
              </button>
            )
          })}
        </div>

        {/* FAQs Section */}
        <div>
          <h3
            className="text-lg font-bold mb-4"
            style={{
              color: zamgasTheme.colors.premium.gold,
              fontFamily: zamgasTheme.typography.fontFamily.display,
            }}
          >
            Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isExpanded = expandedFAQ === index
              return (
                <div
                  key={index}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{
                    background: zamgasTheme.colors.premium.burgundy,
                    border: `1px solid ${isExpanded ? zamgasTheme.colors.premium.gold + '50' : zamgasTheme.colors.premium.burgundyLight}`,
                    boxShadow: isExpanded ? `0 4px 16px ${zamgasTheme.colors.premium.gold}20` : 'none',
                  }}
                >
                  <button
                    onClick={() => setExpandedFAQ(isExpanded ? null : index)}
                    className="w-full p-4 flex items-start justify-between gap-3 text-left transition-colors"
                  >
                    <p
                      className="font-semibold flex-1"
                      style={{ color: isExpanded ? zamgasTheme.colors.premium.gold : '#FFFFFF' }}
                    >
                      {faq.question}
                    </p>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 flex-shrink-0" style={{ color: zamgasTheme.colors.premium.gold }} />
                    ) : (
                      <ChevronDown className="h-5 w-5 flex-shrink-0" style={{ color: zamgasTheme.colors.premium.gray }} />
                    )}
                  </button>
                  {isExpanded && (
                    <div
                      className="px-4 pb-4 pt-2 border-t"
                      style={{ borderColor: `${zamgasTheme.colors.premium.gray}20` }}
                    >
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: zamgasTheme.colors.premium.gray }}
                      >
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Still Need Help Card */}
        <div
          className="p-6 rounded-2xl text-center"
          style={{
            background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red}20 0%, ${zamgasTheme.colors.premium.burgundy} 100%)`,
            border: `2px solid ${zamgasTheme.colors.premium.red}40`,
          }}
        >
          <p
            className="font-bold text-lg mb-2"
            style={{ color: zamgasTheme.colors.premium.gold }}
          >
            Still need help? 🤝
          </p>
          <p
            className="text-sm mb-4"
            style={{ color: zamgasTheme.colors.premium.gray }}
          >
            Our support team is ready to assist you with any questions or concerns.
          </p>
          <button
            onClick={() => window.open('https://wa.me/260979000000', '_blank')}
            className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${zamgasTheme.colors.premium.red} 0%, ${zamgasTheme.colors.premium.redDark} 100%)`,
              color: 'white',
              boxShadow: `0 4px 16px ${zamgasTheme.colors.premium.red}40`,
            }}
          >
            💬 Contact Support
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
