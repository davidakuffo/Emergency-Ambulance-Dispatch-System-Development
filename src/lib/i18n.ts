// Internationalization system for Ghana Emergency Medical Services
// Supports English, Twi (Akan), and Ga languages

export type Language = 'en' | 'tw' | 'ga';

export interface Translation {
  // Header and Navigation
  appName: string;
  emergencyHotline: string;
  availability: string;
  staffLogin: string;
  adminPortal: string;
  analytics: string;

  // Emergency Request Interface
  needHelp: string;
  helpDescription: string;
  requestAmbulance: string;
  clickForHelp: string;
  locationServices: string;
  gettingLocation: string;
  locationDetected: string;
  locationHelp: string;

  // Emergency Types
  commonEmergencies: string;
  heartAttack: string;
  breathing: string;
  accident: string;
  injury: string;

  // What to Expect
  whatToExpect: string;
  expectStep1: string;
  expectStep2: string;
  expectStep3: string;
  expectStep4: string;

  // Emergency Form
  emergencyRequest: string;
  step: string;
  emergencyType: string;
  location: string;
  contactInfo: string;
  selectEmergencyType: string;
  cardiacEmergency: string;
  breathingProblems: string;
  accidentTrauma: string;
  injuryWound: string;
  stroke: string;
  otherEmergency: string;

  // Severity Levels
  severityLevel: string;
  critical: string;
  urgent: string;
  standard: string;
  nonUrgent: string;
  priority: string;

  // Location Step
  yourLocation: string;
  locationDetectedAuto: string;
  locationNotDetected: string;
  addressLandmark: string;
  enterAddress: string;
  back: string;
  continue: string;

  // Contact Step
  yourName: string;
  enterName: string;
  phoneNumber: string;
  enterPhone: string;
  additionalInfo: string;
  describeEmergency: string;
  requesting: string;

  // Success Screen
  requestSubmitted: string;
  requestReceived: string;
  whatHappensNext: string;
  nearestAmbulance: string;
  receiveUpdates: string;
  stayCalm: string;
  returnHome: string;

  // Footer
  copyright: string;
  availableAlways: string;

  // Common Actions
  continueToLocation: string;
  goBack: string;
  required: string;
}

export const translations: Record<Language, Translation> = {
  en: {
    // Header and Navigation
    appName: "Ghana Emergency Medical Services",
    emergencyHotline: "Emergency Hotline",
    availability: "24/7 Ambulance Response",
    staffLogin: "Staff Login",
    adminPortal: "Admin Portal",
    analytics: "Analytics",

    // Emergency Request Interface
    needHelp: "Need Emergency Medical Help?",
    helpDescription: "Request an ambulance quickly and safely. Help is on the way.",
    requestAmbulance: "🚨 REQUEST AMBULANCE NOW",
    clickForHelp: "Click here for immediate emergency medical assistance",
    locationServices: "Location Services",
    gettingLocation: "📍 Getting your location for faster response...",
    locationDetected: "✅ Location detected - ambulances can find you quickly",
    locationHelp: "📍 Location access will help ambulances reach you faster",

    // Emergency Types
    commonEmergencies: "Common Emergency Types",
    heartAttack: "Heart Attack",
    breathing: "Breathing",
    accident: "Accident",
    injury: "Injury",

    // What to Expect
    whatToExpect: "What to Expect",
    expectStep1: "• We'll ask for your location and emergency details",
    expectStep2: "• The nearest available ambulance will be dispatched",
    expectStep3: "• You'll receive updates on ambulance arrival time",
    expectStep4: "• Stay calm and follow any instructions given",

    // Emergency Form
    emergencyRequest: "Emergency Request",
    step: "Step",
    emergencyType: "Emergency Type",
    location: "Location",
    contactInfo: "Contact Info",
    selectEmergencyType: "Select emergency type",
    cardiacEmergency: "Heart Attack / Cardiac Emergency",
    breathingProblems: "Breathing Problems",
    accidentTrauma: "Accident / Trauma",
    injuryWound: "Injury / Wound",
    stroke: "Stroke",
    otherEmergency: "Other Medical Emergency",

    // Severity Levels
    severityLevel: "Severity Level",
    critical: "Critical",
    urgent: "Urgent",
    standard: "Standard",
    nonUrgent: "Non-urgent",
    priority: "Priority",

    // Location Step
    yourLocation: "Your Location",
    locationDetectedAuto: "Location detected automatically",
    locationNotDetected: "Location not detected. Please enter your address below.",
    addressLandmark: "Address or Landmark",
    enterAddress: "Enter your address, nearby landmarks, or describe your location...",
    back: "Back",
    continue: "Continue",

    // Contact Step
    yourName: "Your Name",
    enterName: "Enter your full name",
    phoneNumber: "Phone Number",
    enterPhone: "Enter your phone number",
    additionalInfo: "Additional Information",
    describeEmergency: "Describe the emergency, symptoms, or any other important details...",
    requesting: "Requesting...",

    // Success Screen
    requestSubmitted: "Emergency Request Submitted",
    requestReceived: "Your emergency request has been received. An ambulance is being dispatched to your location.",
    whatHappensNext: "What happens next:",
    nearestAmbulance: "• Nearest ambulance will be dispatched",
    receiveUpdates: "• You'll receive updates on arrival time",
    stayCalm: "• Stay calm and prepare for medical assistance",
    returnHome: "Return to Home",

    // Footer
    copyright: "© 2024 Ghana Emergency Medical Services. Available 24/7 for medical emergencies.",
    availableAlways: "Available 24/7 for medical emergencies",

    // Common Actions
    continueToLocation: "Continue to Location",
    goBack: "Go back to emergency request options",
    required: "*"
  },

  tw: {
    // Header and Navigation (Twi/Akan)
    appName: "Ghana Aduruyɛ Ntɛmntɛm Dwumadi",
    emergencyHotline: "Ntɛmntɛm Telefon",
    availability: "Nnɔnhwerew 24/7 Ambulance",
    staffLogin: "Adwumayɛfoɔ Kwan",
    adminPortal: "Sohwɛfoɔ Kwan",
    analytics: "Nhwehwɛmu",

    // Emergency Request Interface
    needHelp: "Wohia Aduruyɛ Ntɛmntɛm Mmoa?",
    helpDescription: "Bisa ambulance ntɛm na dwoodwoo. Mmoa reba.",
    requestAmbulance: "🚨 BISA AMBULANCE SɛSɛɛ YI",
    clickForHelp: "Mia ha ma aduruyɛ ntɛmntɛm mmoa ntɛm ara",
    locationServices: "Baabi a Wowɔ Dwumadi",
    gettingLocation: "📍 Yɛrenya wo baabi ma ntɛm mmuae...",
    locationDetected: "✅ Yɛahu wo baabi - ambulance bɛtumi ahu wo ntɛm",
    locationHelp: "📍 Wo baabi ho kwan bɛboa ambulance adu wo nkyɛn ntɛm",

    // Emergency Types
    commonEmergencies: "Ntɛmntɛm Nsɛm a Ɛtaa Ba",
    heartAttack: "Akoma Yadeɛ",
    breathing: "Ahome",
    accident: "Akwanhyia",
    injury: "Apirakuru",

    // What to Expect
    whatToExpected: "Deɛ Ɛbɛba",
    expectStep1: "• Yɛbɛbisa wo baabi ne wo haw no ho nsɛm",
    expectStep2: "• Ambulance a ɛbɛn wo no bɛkɔ",
    expectStep3: "• Wobɛnya nsɛm fa ambulance no duba ho",
    expectStep4: "• Twe wo bo ase na di akwankyerɛ biara so",

    // Emergency Form
    emergencyRequest: "Ntɛmntɛm Abisadeɛ",
    step: "Anammɔn",
    emergencyType: "Ntɛmntɛm Suhyɛ",
    location: "Baabi",
    contactInfo: "Nkitahodi Nsɛm",
    selectEmergencyType: "Yi ntɛmntɛm suhyɛ",
    cardiacEmergency: "Akoma Yadeɛ / Akoma Ntɛmntɛm Haw",
    breathingProblems: "Ahome Haw",
    accidentTrauma: "Akwanhyia / Apirakuru",
    injuryWound: "Apirakuru / Ekuro",
    stroke: "Stroke",
    otherEmergency: "Aduruyɛ Ntɛmntɛm Foforɔ",

    // Severity Levels
    severityLevel: "Haw Kɛseɛ",
    critical: "Ɛyɛ Hu",
    urgent: "Ɛho Hia",
    standard: "Ɛyɛ Dɛ",
    nonUrgent: "Ɛnho Nhia",
    priority: "Ɛdi Kan",

    // Location Step
    yourLocation: "Wo Baabi",
    locationDetectedAuto: "Yɛahu wo baabi ankasa",
    locationNotDetected: "Yɛnhuu wo baabi. Kyerɛw wo fie kwan wɔ ase ha.",
    addressLandmark: "Fie Kwan anaa Nsɛnkyerɛnne",
    enterAddress: "Kyerɛw wo fie kwan, nsɛnkyerɛnne a ɛbɛn wo, anaa kyerɛ wo baabi...",
    back: "San Kɔ Akyiri",
    continue: "Kɔ So",

    // Contact Step
    yourName: "Wo Din",
    enterName: "Kyerɛw wo din nyinaa",
    phoneNumber: "Telefon Nɔma",
    enterPhone: "Kyerɛw wo telefon nɔma",
    additionalInfo: "Nsɛm Foforɔ",
    describeEmergency: "Ka ntɛmntɛm haw no, sɛnea wo te nka, anaa nsɛm foforɔ a ɛho hia...",
    requesting: "Ɛrebisa...",

    // Success Screen
    requestSubmitted: "Ntɛmntɛm Abisadeɛ Akɔ",
    requestReceived: "Yɛanya wo ntɛmntɛm abisadeɛ. Ambulance rekɔ wo baabi.",
    whatHappensNext: "Deɛ ɛbɛdi so:",
    nearestAmbulance: "• Ambulance a ɛbɛn wo bɛkɔ",
    receiveUpdates: "• Wobɛnya nsɛm fa duba berɛ ho",
    stayCalm: "• Twe wo bo ase na siesie wo ho ma aduruyɛ mmoa",
    returnHome: "San Kɔ Fie",

    // Footer
    copyright: "© 2024 Ghana Aduruyɛ Ntɛmntɛm Dwumadi. Ɛwɔ hɔ nnɔnhwerew 24/7 ma aduruyɛ ntɛmntɛm.",
    availableAlways: "Ɛwɔ hɔ nnɔnhwerew 24/7 ma aduruyɛ ntɛmntɛm",

    // Common Actions
    continueToLocation: "Kɔ So Kɔ Baabi",
    goBack: "San kɔ ntɛmntɛm abisadeɛ nhyehyɛeɛ",
    required: "*"
  },

  ga: {
    // Header and Navigation (Ga)
    appName: "Ghana Ayɔɔlɛ Kɛkɛ Shidaami",
    emergencyHotline: "Kɛkɛ Telefon",
    availability: "Nnɔɔlɛ 24/7 Ambulance",
    staffLogin: "Shidaamɛi Kwan",
    adminPortal: "Bɔɔlɔɔ Kwan",
    analytics: "Kɛkɛlɛ",

    // Emergency Request Interface
    needHelp: "Ohia Ayɔɔlɛ Kɛkɛ Lɛ?",
    helpDescription: "Bisa ambulance kɛkɛ ni lɛ. Lɛ baa.",
    requestAmbulance: "🚨 BISA AMBULANCE JOƆNI",
    clickForHelp: "Mi afii ma ayɔɔlɛ kɛkɛ lɛ kɛkɛ",
    locationServices: "Baafoɔ Shidaami",
    gettingLocation: "📍 Yɛ nya o baafoɔ ma kɛkɛ ayɔɔba...",
    locationDetected: "✅ Yɛ kɛ o baafoɔ - ambulance bɛ kɛ o kɛkɛ",
    locationHelp: "📍 O baafoɔ kwan bɛ boa ambulance ba o gbɛɛ kɛkɛ",

    // Emergency Types
    commonEmergencies: "Kɛkɛ Nshɔnaa Lɛ Taa Ba",
    heartAttack: "Suman Yɛlɛ",
    breathing: "Nyɔɔmɔ",
    accident: "Akwɛɛ",
    injury: "Gbɛɛ",

    // What to Expect
    whatToExpect: "Lɛ Bɛ Ba",
    expectStep1: "• Yɛ bɛ bisa o baafoɔ ni o yɛlɛ nsɛm",
    expectStep2: "• Ambulance lɛ bɛn o bɛ kɔ",
    expectStep3: "• O bɛ nya nsɛm ambulance duba berɛ",
    expectStep4: "• Tɔɔ o bo ase ni di akwankyerɛ so",

    // Emergency Form
    emergencyRequest: "Kɛkɛ Bisaa",
    step: "Kwan",
    emergencyType: "Kɛkɛ Sɔɔlɛ",
    location: "Baafoɔ",
    contactInfo: "Nkitaa Nsɛm",
    selectEmergencyType: "Yi kɛkɛ sɔɔlɛ",
    cardiacEmergency: "Suman Yɛlɛ / Suman Kɛkɛ Yɛlɛ",
    breathingProblems: "Nyɔɔmɔ Yɛlɛ",
    accidentTrauma: "Akwɛɛ / Gbɛɛ",
    injuryWound: "Gbɛɛ / Kpakpa",
    stroke: "Stroke",
    otherEmergency: "Ayɔɔlɛ Kɛkɛ Foforɔ",

    // Severity Levels
    severityLevel: "Yɛlɛ Kɛseɛ",
    critical: "Ɛ Yɛ Hu",
    urgent: "Ɛ Hia",
    standard: "Ɛ Yɛ Dɛ",
    nonUrgent: "Ɛ Hia Kɛkɛ",
    priority: "Ɛ Di Kan",

    // Location Step
    yourLocation: "O Baafoɔ",
    locationDetectedAuto: "Yɛ kɛ o baafoɔ ankasa",
    locationNotDetected: "Yɛ kɛ o baafoɔ kɛkɛ. Kyerɛw o fie kwan ase afii.",
    addressLandmark: "Fie Kwan Kɛ Nsɛnkyerɛnne",
    enterAddress: "Kyerɛw o fie kwan, nsɛnkyerɛnne lɛ bɛn o, kɛ kyerɛ o baafoɔ...",
    back: "San Kɔ Akyiri",
    continue: "Kɔ So",

    // Contact Step
    yourName: "O Yɔɔ",
    enterName: "Kyerɛw o yɔɔ nyinaa",
    phoneNumber: "Telefon Nɔmba",
    enterPhone: "Kyerɛw o telefon nɔmba",
    additionalInfo: "Nsɛm Foforɔ",
    describeEmergency: "Ka kɛkɛ yɛlɛ, sɛnea o te nka, kɛ nsɛm foforɔ lɛ hia...",
    requesting: "Ɛ bisa...",

    // Success Screen
    requestSubmitted: "Kɛkɛ Bisaa Akɔ",
    requestReceived: "Yɛ nya o kɛkɛ bisaa. Ambulance kɔ o baafoɔ.",
    whatHappensNext: "Lɛ bɛ di so:",
    nearestAmbulance: "• Ambulance lɛ bɛn o bɛ kɔ",
    receiveUpdates: "• O bɛ nya nsɛm duba berɛ",
    stayCalm: "• Tɔɔ o bo ase ni siesie o ho ma ayɔɔlɛ lɛ",
    returnHome: "San Kɔ Fie",

    // Footer
    copyright: "© 2024 Ghana Ayɔɔlɛ Kɛkɛ Shidaami. Ɛ wɔ afii nnɔɔlɛ 24/7 ma ayɔɔlɛ kɛkɛ.",
    availableAlways: "Ɛ wɔ afii nnɔɔlɛ 24/7 ma ayɔɔlɛ kɛkɛ",

    // Common Actions
    continueToLocation: "Kɔ So Kɔ Baafoɔ",
    goBack: "San kɔ kɛkɛ bisaa nhyehyɛeɛ",
    required: "*"
  }
};

// Language context and hooks
export const getTranslation = (language: Language): Translation => {
  return translations[language] || translations.en;
};

export const getLanguageName = (language: Language): string => {
  const names = {
    en: "English",
    tw: "Twi",
    ga: "Ga"
  };
  return names[language];
};

export const getLanguageFlag = (language: Language): string => {
  const flags = {
    en: "🇬🇧",
    tw: "🇬🇭",
    ga: "🇬🇭"
  };
  return flags[language];
};

// Browser language detection
export const detectBrowserLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language.toLowerCase();
  
  // Check for Twi/Akan language codes
  if (browserLang.includes('ak') || browserLang.includes('tw')) {
    return 'tw';
  }
  
  // Check for Ga language codes
  if (browserLang.includes('ga')) {
    return 'ga';
  }
  
  // Default to English
  return 'en';
};

// Local storage helpers
export const saveLanguagePreference = (language: Language): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ghana-ems-language', language);
  }
};

export const getLanguagePreference = (): Language => {
  if (typeof window === 'undefined') return 'en';
  
  const saved = localStorage.getItem('ghana-ems-language') as Language;
  return saved || detectBrowserLanguage();
};
