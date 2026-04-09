# Design System

## Colors
bgPrimary:#0A0F1E bgCard:#0F1629 bgCardElevated:#152035 bgInput:#1A2640
borderSubtle:#1E2A45 brandBlue:#3B82F6 brandGold:#F59E0B
positive:#10B981 positiveSubtle:#064E3B negative:#EF4444 negativeSubtle:#450A0A
textPrimary:#F8FAFC textSecondary:#94A3B8 textTertiary:#475569 textGold:#FCD34D
gradientBlue:['#1D4ED8','#3B82F6'] gradientGold:['#D97706','#F59E0B']

## Typography (fontSize/weight)
numberXL:48/700 numberLG:32/700 numberMD:24/600 numberSM:18/600
headingXL:28/700 headingLG:22/700 headingMD:18/600
bodyLG:16/400/lh24 bodyMD:14/400/lh20 bodySM:12/400
label:11/600/uppercase/ls0.8

## Spacing & Radius
spacing: xs:4 sm:8 md:12 lg:16 xl:20 xxl:24 xxxl:32
radius: sm:8 md:12 lg:16 xl:20 full:999

## Shadows
card: color:#000 offset:0,4 opacity:0.3 radius:12 elevation:8
blueGlow: color:#3B82F6 offset:0,0 opacity:0.4 radius:20 elevation:12
goldGlow: color:#F59E0B offset:0,0 opacity:0.35 radius:16 elevation:10

## Hard Rules — enforce on every screen
- ALL backgrounds: bgPrimary. Zero white or light gray screens ever.
- ALL cards: Card component only. No raw styled Views.
- ALL primary CTAs: GradientButton only.
- ALL colors: Colors constants only. No hex strings inside components.
- ALL financial numbers: Typography number scale. No raw fontSize.
- ALL loading states: LoadingSkeleton shimmer.
- ALL errors: ErrorState component.
- Dark mode locked permanently in App.tsx.

## UI Components to build (mobile/src/components/ui/)
Card.tsx — bgCard, borderSubtle 1px, Radius.lg, Shadow.card, optional glow prop
GradientButton.tsx — h:56 Radius.xl, blue/gold variant, Animated press scale:0.97, loading spinner. Install: npx expo install expo-linear-gradient
StatBadge.tsx — pill, subtle bg+text, props: value/label/color(positive|negative|gold|blue|neutral)
BottomNav.tsx — custom 5-tab bar, active=brandBlue+2px top line, inactive=textTertiary, h:60+safeArea
EmptyState.tsx — centered icon/title/subtitle/optional CTA
LoadingSkeleton.tsx — shimmer animation, variants: card/row/chart
SectionHeader.tsx — label style left, optional action link right

## Animations (mobile/src/utils/animations.ts)
pressScale / fadeIn / slideUp / numberRoll / pulse / staggerChildren

## Screen Rules
WelcomeScreen: "MY FRONTIER" wordmark gold small-caps top, time-aware greeting headingXL, MarketPulse card, portfolio horizontal scroll w/goldGlow cards, sticky blue CTA bottom
CategorySelector: flexWrap chip grid, selected=brandBlue+blueGlow+scale pulse, floating gold count badge, sticky bottom bar
ResultsScreen: grade 72px/900w/textGold hero, 8px gradient ring blue→gold, DNA pill, leaderboard line, 3 StatBadges, ETF rows w/3px weight bars
LoadingScreen: pulsing gold wordmark, 5 sequential animated steps, cinematic dark
OnboardingScreen: 3 slides dark, float animation, gold progress dots, gold CTA slide 3
PremiumScreen: gold shimmer top bar, side-by-side price cards yearly=goldGlow, gold checkmark feature list
AdvisorScreen: Gemini badge in header, message counter progress bar, portfolio context banner, styled chat bubbles
App.tsx: replace default tab bar with BottomNav, force dark mode permanently, StatusBar light-content all screens
