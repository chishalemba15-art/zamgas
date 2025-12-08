import { useState } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MessageCircle, Phone, Mail, Headphones, ChevronDown, ChevronUp, Zap, Shield, Clock } from 'lucide-react-native'
import { zamgasTheme } from '@/lib/theme'

interface FAQ {
  question: string
  answer: string
}

const FAQS: FAQ[] = [
  {
    question: 'How do I place an order?',
    answer: 'Go to the Order tab, select your cylinder size and quantity, enter your delivery address, and tap "Place Order". You\'ll receive confirmation once your order is processed.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept Cash on Delivery and Mobile Money (MTN, Airtel, Zamtel). You can select your preferred payment method during checkout.',
  },
  {
    question: 'How long does delivery take?',
    answer: 'Most deliveries are completed within 2-4 hours. You can track your order status in real-time on the Orders tab.',
  },
  {
    question: 'Can I track my delivery?',
    answer: 'Yes! Go to the My Orders tab and tap on your active order to see the current status and delivery progress.',
  },
  {
    question: 'What if I need to cancel my order?',
    answer: 'Contact your provider immediately through the support channels below. Orders can be cancelled before they are dispatched.',
  },
  {
    question: 'How do I know my LPG is authentic?',
    answer: 'All our providers are verified and ZEMA-certified. Every cylinder has a unique serial number and safety seal.',
  },
]

const CONTACT_OPTIONS = [
  {
    icon: Phone,
    title: 'Call Us',
    description: '+260 97 900 0000',
    action: () => Linking.openURL('tel:+260979000000'),
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    description: 'Chat with us',
    action: () => Linking.openURL('https://wa.me/260979000000'),
  },
  {
    icon: Mail,
    title: 'Email',
    description: 'support@zamgas.com',
    action: () => Linking.openURL('mailto:support@zamgas.com'),
  },
]

export default function SupportScreen() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Headphones size={28} color={zamgasTheme.colors.neutral.white} />
          </View>
          <Text style={styles.headerTitle}>How can we help?</Text>
          <Text style={styles.headerSubtitle}>
            Browse our FAQs below or contact us directly. We're here 24/7!
          </Text>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            {[
              { icon: Zap, label: '< 2min', desc: 'Response' },
              { icon: Shield, label: '24/7', desc: 'Support' },
              { icon: Clock, label: '99%', desc: 'Resolved' },
            ].map((stat, i) => (
              <View key={i} style={styles.statItem}>
                <stat.icon size={16} color={zamgasTheme.colors.premium.gold} />
                <Text style={styles.statValue}>{stat.label}</Text>
                <Text style={styles.statLabel}>{stat.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact Options */}
        <View style={styles.contactGrid}>
          {CONTACT_OPTIONS.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactCard}
              onPress={option.action}
            >
              <View style={styles.contactIcon}>
                <option.icon size={22} color={zamgasTheme.colors.premium.gold} />
              </View>
              <Text style={styles.contactTitle}>{option.title}</Text>
              <Text style={styles.contactDesc}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqList}>
            {FAQS.map((faq, index) => {
              const isExpanded = expandedFAQ === index
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}
                  onPress={() => setExpandedFAQ(isExpanded ? null : index)}
                  activeOpacity={0.8}
                >
                  <View style={styles.faqHeader}>
                    <Text style={[styles.faqQuestion, isExpanded && styles.faqQuestionExpanded]}>
                      {faq.question}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={20} color={zamgasTheme.colors.premium.gold} />
                    ) : (
                      <ChevronDown size={20} color={zamgasTheme.colors.premium.gray} />
                    )}
                  </View>
                  {isExpanded && (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* CTA Card */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Still need help? 🤝</Text>
          <Text style={styles.ctaSubtitle}>
            Our support team is ready to assist you with any questions.
          </Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => Linking.openURL('https://wa.me/260979000000')}
          >
            <MessageCircle size={18} color={zamgasTheme.colors.neutral.white} />
            <Text style={styles.ctaButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: zamgasTheme.colors.premium.burgundyDark,
  },
  scrollView: {
    flex: 1,
    padding: zamgasTheme.spacing.base,
  },
  headerCard: {
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: zamgasTheme.borderRadius['2xl'],
    padding: zamgasTheme.spacing.lg,
    marginBottom: zamgasTheme.spacing.lg,
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: zamgasTheme.colors.premium.red,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  headerSubtitle: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  quickStats: {
    flexDirection: 'row',
    marginTop: zamgasTheme.spacing.lg,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: zamgasTheme.colors.premium.burgundyLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    color: zamgasTheme.colors.neutral.white,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 11,
    marginTop: 2,
  },
  contactGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: zamgasTheme.spacing.lg,
  },
  contactCard: {
    flex: 1,
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: zamgasTheme.borderRadius.xl,
    padding: zamgasTheme.spacing.base,
    alignItems: 'center',
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${zamgasTheme.colors.premium.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactTitle: {
    color: zamgasTheme.colors.neutral.white,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  contactDesc: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 11,
    textAlign: 'center',
  },
  section: {
    marginBottom: zamgasTheme.spacing.lg,
  },
  sectionTitle: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: zamgasTheme.colors.premium.burgundy,
    borderRadius: zamgasTheme.borderRadius.xl,
    padding: zamgasTheme.spacing.base,
    borderWidth: 1,
    borderColor: zamgasTheme.colors.premium.burgundyLight,
  },
  faqCardExpanded: {
    borderColor: `${zamgasTheme.colors.premium.gold}50`,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    color: zamgasTheme.colors.neutral.white,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  faqQuestionExpanded: {
    color: zamgasTheme.colors.premium.gold,
  },
  faqAnswer: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: zamgasTheme.colors.premium.burgundyLight,
  },
  ctaCard: {
    backgroundColor: `${zamgasTheme.colors.premium.red}20`,
    borderRadius: zamgasTheme.borderRadius['2xl'],
    padding: zamgasTheme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${zamgasTheme.colors.premium.red}40`,
  },
  ctaTitle: {
    color: zamgasTheme.colors.premium.gold,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  ctaSubtitle: {
    color: zamgasTheme.colors.premium.gray,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: zamgasTheme.colors.premium.red,
    borderRadius: zamgasTheme.borderRadius.xl,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  ctaButtonText: {
    color: zamgasTheme.colors.neutral.white,
    fontSize: 15,
    fontWeight: '700',
  },
})
