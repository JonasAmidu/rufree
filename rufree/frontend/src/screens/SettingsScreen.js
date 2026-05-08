import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import SettingsInfoCard from '../components/profile/SettingsInfoCard';
import SettingsRow from '../components/profile/SettingsRow';
import SettingsSection from '../components/profile/SettingsSection';

const DEFAULT_HELP_COPY =
  'Need a hand? We are shaping RuFree around real-life social confidence, so support should feel as human as the product.';
const DEFAULT_CONTACT_COPY =
  'Reach out if something feels off, confusing, or unexpectedly empty. Fast feedback is how this prototype gets better.';
const DEFAULT_ABOUT_COPY =
  'RuFree is a real-time social app for spontaneous meetups nearby, built to help people move from “I am free” to “let’s actually do something.”';
const DEFAULT_RESET_COPY =
  'Reset password is ready to wire into Firebase auth. For now this control is designed to hand off to that flow cleanly.';
const COMING_SOON_COPY =
  'This surface is planned, but the content is still being shaped. The button is here so we can test the full settings structure early.';

const buildDetailCard = (key) => {
  switch (key) {
    case 'help':
      return {
        icon: 'help-circle',
        title: 'Help is close by',
        body: DEFAULT_HELP_COPY,
        tone: 'neutral'
      };
    case 'contact':
      return {
        icon: 'mail-open',
        title: 'Talk to the team',
        body: DEFAULT_CONTACT_COPY,
        tone: 'neutral'
      };
    case 'terms':
      return {
        icon: 'document-text',
        title: 'Terms & Conditions',
        body: COMING_SOON_COPY,
        tone: 'warm'
      };
    case 'privacy':
      return {
        icon: 'shield-checkmark',
        title: 'Privacy Policy',
        body: COMING_SOON_COPY,
        tone: 'warm'
      };
    case 'reset':
      return {
        icon: 'key',
        title: 'Reset password',
        body: DEFAULT_RESET_COPY,
        tone: 'warm'
      };
    case 'about':
    default:
      return {
        icon: 'sparkles',
        title: 'About RuFree',
        body: DEFAULT_ABOUT_COPY,
        tone: 'neutral'
      };
  }
};

const SettingsScreen = ({
  onHelp,
  onContactUs,
  onTerms,
  onPrivacyPolicy,
  onResetPassword,
  onLogout,
  onAbout
}) => {
  const [activeDetail, setActiveDetail] = useState('about');
  const detailCard = useMemo(() => buildDetailCard(activeDetail), [activeDetail]);

  const handleSelect = (key, callback) => {
    setActiveDetail(key);
    if (typeof callback === 'function') {
      callback();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Settings</Text>
        <Text style={styles.title}>Keep the account controls simple and human.</Text>
        <Text style={styles.subtitle}>
          This prototype should feel reassuring: support is easy to find, account actions are clear,
          and legal surfaces have a visible home even before they are fully written.
        </Text>
      </View>

      <SettingsInfoCard
        body={detailCard.body}
        icon={detailCard.icon}
        testID="settings-detail-card"
        title={detailCard.title}
        tone={detailCard.tone}
      />

      <SettingsSection
        description="Make it obvious how someone gets help or reaches the team while they are trying to use the app in real time."
        eyebrow="Support"
        title="People-first support"
      >
        <SettingsRow
          description="Troubleshooting, guidance, and product help."
          icon="help-circle"
          onPress={() => handleSelect('help', onHelp)}
          testID="settings-help"
          title="Help"
        />
        <SettingsRow
          description="Reach the RuFree team directly."
          icon="mail"
          onPress={() => handleSelect('contact', onContactUs)}
          testID="settings-contact"
          title="Contact Us"
        />
      </SettingsSection>

      <SettingsSection
        description="These are the practical account controls we will keep tightening as the prototype grows."
        eyebrow="Account"
        title="Security and access"
      >
        <SettingsRow
          description="Send a reset flow for your password."
          icon="key"
          onPress={() => handleSelect('reset', onResetPassword)}
          testID="settings-reset-password"
          title="Reset Password"
        />
        <SettingsRow
          description="Sign out of RuFree on this device."
          destructive
          icon="log-out-outline"
          onPress={onLogout}
          testID="settings-logout"
          title="Logout"
        />
      </SettingsSection>

      <SettingsSection
        description="Keep the structure in place now so the prototype already feels complete when test users explore the profile area."
        eyebrow="Legal"
        title="Policies and trust"
      >
        <SettingsRow
          description="What the product asks of people using it."
          icon="document-text"
          onPress={() => handleSelect('terms', onTerms)}
          status="Coming soon"
          testID="settings-terms"
          title="Terms & Conditions"
        />
        <SettingsRow
          description="How personal data and location signals are handled."
          icon="shield-checkmark"
          onPress={() => handleSelect('privacy', onPrivacyPolicy)}
          status="Coming soon"
          testID="settings-privacy"
          title="Privacy Policy"
        />
      </SettingsSection>

      <SettingsSection
        description="A short reminder of the product idea helps the prototype stay coherent for test users."
        eyebrow="About"
        title="Why RuFree exists"
      >
        <SettingsRow
          description="A quick summary of the product vision."
          icon="information-circle"
          onPress={() => handleSelect('about', onAbout)}
          testID="settings-about"
          title="About"
        />
      </SettingsSection>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F3F7F6',
    flex: 1
  },
  content: {
    gap: 22,
    padding: 20,
    paddingTop: 54,
    paddingBottom: 40
  },
  header: {
    gap: 10
  },
  eyebrow: {
    color: '#0F9F90',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  title: {
    color: '#0B1E24',
    fontSize: 33,
    fontWeight: '900',
    lineHeight: 38
  },
  subtitle: {
    color: '#4A636B',
    fontSize: 15,
    lineHeight: 22
  }
});

export default SettingsScreen;
