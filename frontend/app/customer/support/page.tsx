'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/Layout/DashboardLayout'
import { zamgasTheme } from '@/lib/zamgas-theme'
import { MessageCircle, Phone, Mail, HelpCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

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
      answer: 'We accept Cash on Delivery and Mobile Money (MTN, Airtel). You can select your preferred payment method during checkout.',
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
      answer: 'All our providers are verified and certified. Every cylinder has a unique serial number and safety seal. Report any concerns immediately.',
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
      description: '+260 XXX XXX XXX',
      action: () => window.location.href = 'tel:+260XXXXXXXXX',
      gradient: zamgasTheme.gradients.primary,
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      description: 'Chat with us',
      action: () => window.open('https://wa.me/260XXXXXXXXX', '_blank'),
      gradient: zamgasTheme.gradients.eco,
    },
    {
      icon: Mail,
      title: 'Email',
      description: 'support@zamgas.com',
      action: () => window.location.href = 'mailto:support@zamgas.com',
      gradient: zamgasTheme.gradients.accent,
    },
  ]

  return (
    <DashboardLayout title="Support">
      <div className="space-y-6">
        {/* Quick Help Header */}
        <div
          className="p-6 rounded-2xl text-white"
          style={{
            background: zamgasTheme.gradients.primary,
            boxShadow: zamgasTheme.shadows.medium,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255, 255, 255, 0.2)' }}
            >
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h2
                className="text-xl font-bold mb-2"
                style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}
              >
                How can we help you?
              </h2>
              <p className="text-sm opacity-90">
                Browse our FAQs below or contact us directly. We're here 24/7 to assist you!
              </p>
            </div>
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
                  background: option.gradient,
                  boxShadow: zamgasTheme.shadows.small,
                }}
              >
                <Icon className="h-6 w-6 text-white mb-3" />
                <p
                  className="font-bold text-white mb-1"
                  style={{ fontFamily: zamgasTheme.typography.fontFamily.display }}
                >
                  {option.title}
                </p>
                <p className="text-sm text-white/90">{option.description}</p>
                <ExternalLink className="h-4 w-4 text-white/70 mt-2" />
              </button>
            )
          })}
        </div>

        {/* FAQs Section */}
        <div>
          <h3
            className="text-lg font-bold mb-4"
            style={{
              color: zamgasTheme.colors.semantic.textPrimary,
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
                    background: zamgasTheme.colors.semantic.cardBg,
                    border: `1px solid ${zamgasTheme.colors.neutral[200]}`,
                    boxShadow: isExpanded ? zamgasTheme.shadows.medium : zamgasTheme.shadows.small,
                  }}
                >
                  <button
                    onClick={() => setExpandedFAQ(isExpanded ? null : index)}
                    className="w-full p-4 flex items-start justify-between gap-3 text-left transition-colors hover:bg-opacity-50"
                  >
                    <p
                      className="font-semibold flex-1"
                      style={{
                        color: zamgasTheme.colors.semantic.textPrimary,
                        fontFamily: zamgasTheme.typography.fontFamily.body,
                      }}
                    >
                      {faq.question}
                    </p>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 flex-shrink-0" style={{ color: zamgasTheme.colors.primary.forest }} />
                    ) : (
                      <ChevronDown className="h-5 w-5 flex-shrink-0" style={{ color: zamgasTheme.colors.semantic.textSecondary }} />
                    )}
                  </button>
                  {isExpanded && (
                    <div
                      className="px-4 pb-4 pt-2 border-t"
                      style={{ borderColor: zamgasTheme.colors.neutral[200] }}
                    >
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: zamgasTheme.colors.semantic.textSecondary }}
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
            background: zamgasTheme.colors.primary.mintLight,
            border: `2px solid ${zamgasTheme.colors.primary.mint}`,
          }}
        >
          <p
            className="font-semibold mb-2"
            style={{ color: zamgasTheme.colors.primary.forestDark }}
          >
            Still need help?
          </p>
          <p
            className="text-sm mb-4"
            style={{ color: zamgasTheme.colors.semantic.textSecondary }}
          >
            Our support team is ready to assist you with any questions or concerns.
          </p>
          <button
            onClick={() => window.open('https://wa.me/260XXXXXXXXX', '_blank')}
            className="px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              background: zamgasTheme.gradients.primary,
              color: 'white',
              boxShadow: zamgasTheme.shadows.medium,
              fontFamily: zamgasTheme.typography.fontFamily.body,
            }}
          >
            Contact Support
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
