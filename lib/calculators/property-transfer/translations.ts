// ============================================
// PROPERTY TRANSFER CALCULATOR TRANSLATIONS
// Supported: EN, NL, IT, DE, RU, FR, ZH
// ============================================

export type Language = 'en' | 'nl' | 'it' | 'de' | 'ru' | 'fr' | 'zh';

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  nl: 'Nederlands',
  it: 'Italiano',
  de: 'Deutsch',
  ru: 'Русский',
  fr: 'Français',
  zh: '中文',
};

export const LANGUAGE_FLAGS: Record<Language, string> = {
  en: '🇬🇧',
  nl: '🇳🇱',
  it: '🇮🇹',
  de: '🇩🇪',
  ru: '🇷🇺',
  fr: '🇫🇷',
  zh: '🇨🇳',
};

export interface TranslationStrings {
  // Header
  freeCalculatorTool: string;
  title: string;
  subtitle: string;
  
  // Currency
  baseCurrency: string;
  liveRate: string;
  offlineRate: string;
  ratesUpdated: string;
  refresh: string;
  loadingRate: string;
  rateUnavailable: string;
  selected: string;
  
  // Property Details
  propertyDetails: string;
  purchasePrice: string;
  purchasePriceHelp: string;
  registeredValue: string;
  registeredValueHelp: string;
  yearsOwned: string;
  yearsOwnedHelp: string;
  years: string;
  
  // Property Type
  propertyType: string;
  propertyTypeHelp: string;
  condo: string;
  houseLand: string;
  landOnly: string;
  
  // Buyer/Seller Type
  buyerNationality: string;
  buyerNationalityHelp: string;
  thai: string;
  foreigner: string;
  sellerType: string;
  sellerTypeHelp: string;
  individual: string;
  company: string;
  developer: string;
  
  // Fee Split
  feeSplit: string;
  feeSplitHelp: string;
  standardSplit: string;
  buyerPaysAll: string;
  sellerPaysAll: string;
  developerStandard: string;
  customSplit: string;
  customizeFeeSplit: string;
  buyerPercentage: string;
  sellerPercentage: string;
  
  // Mortgage
  mortgageAmount: string;
  mortgageAmountHelp: string;
  mortgageExceedsPrice: string;
  
  // Incentive
  applyIncentive: string;
  incentiveDescription: string;
  incentiveRequirement: string;
  incentiveExplanation: string;
  governmentIncentive: string;
  daysRemaining: string;
  incentiveExpired: string;
  saved: string;
  youSave: string;
  onTransferFee: string;
  validUntil: string;
  
  // Results
  whatYouPay: string;
  ofPurchasePrice: string;
  totalTransferCosts: string;
  buyerPays: string;
  sellerPays: string;
  costBreakdown: string;
  
  // Tax Types
  transferFee: string;
  transferFeeDesc: string;
  specificBusinessTax: string;
  specificBusinessTaxDesc: string;
  stampDuty: string;
  stampDutyDesc: string;
  withholdingTax: string;
  withholdingTaxDesc: string;
  mortgageRegistration: string;
  mortgageRegistrationDesc: string;
  
  // Status
  applicable: string;
  notApplicable: string;
  paidBy: string;
  buyer: string;
  seller: string;
  split: string;
  
  // Exchange Rates
  liveExchangeRates: string;
  loading: string;
  offlineRatesWarning: string;
  
  // Actions
  shareResults: string;
  print: string;
  generateReport: string;
  embedCalculator: string;
  copyLink: string;
  copied: string;
  shareOn: string;
  
  // Disclaimer
  disclaimer: string;
  disclaimerText: string;
  
  // Embed
  embedTitle: string;
  embedDescription: string;
  width: string;
  height: string;
  preview: string;
  embedCode: string;
  copyCode: string;
  codeCopied: string;
  poweredBy: string;
  fullVersion: string;
  
  // Foreigner Guide
  foreignerGuide: string;
  importantForForeigners: string;
  fetRequired: string;
  fetRequiredDesc: string;
  ownershipRestrictions: string;
  condoFreehold: string;
  condoFreeholdDesc: string;
  houseLandLeasehold: string;
  houseLandLeaseholdDesc: string;
  landNotAllowed: string;
  landNotAllowedDesc: string;
  quotaWarning: string;
  buyersGuide: string;
  stepByStep: string;
  phase: string;
  preparation: string;
  dueDiligence: string;
  reservation: string;
  transfer: string;
  registration: string;
  importantStep: string;
  requiredDocuments: string;
  
  // Step Details
  steps: {
    budgetPlanning: string;
    budgetPlanningDesc: string;
    financingArrangement: string;
    financingArrangementDesc: string;
    lawyerSelection: string;
    lawyerSelectionDesc: string;
    ownershipStructure: string;
    ownershipStructureDesc: string;
    propertySearch: string;
    propertySearchDesc: string;
    titleDeedCheck: string;
    titleDeedCheckDesc: string;
    dueDiligenceProcess: string;
    dueDiligenceProcessDesc: string;
    buildingManagement: string;
    buildingManagementDesc: string;
    developerBackground: string;
    developerBackgroundDesc: string;
    reservationPayment: string;
    reservationPaymentDesc: string;
    contractReview: string;
    contractReviewDesc: string;
    depositPayment: string;
    depositPaymentDesc: string;
    bankAccount: string;
    bankAccountDesc: string;
    fetForm: string;
    fetFormDesc: string;
    currencyExchange: string;
    currencyExchangeDesc: string;
    landOffice: string;
    landOfficeDesc: string;
    documentsSubmit: string;
    documentsSubmitDesc: string;
    taxPayment: string;
    taxPaymentDesc: string;
    titleTransfer: string;
    titleTransferDesc: string;
  };
  
  // Title Deed Types
  titleDeedTypes: string;
  chanote: string;
  chanoteDesc: string;
  norSor3Gor: string;
  norSor3GorDesc: string;
  norSor3: string;
  norSor3Desc: string;
  recommended: string;
  caution: string;
  avoid: string;
  
  // Source References (NEW)
  verifiedByOfficialSources: string;
  lastVerified: string;
  viewOfficialSource: string;
  viewFullDocumentation: string;
  officialSources: string;
  ratesBasedOn: string;
  transferFeeSource: string;
  sbtSource: string;
  stampDutySource: string;
  withholdingTaxSource: string;
  mortgageSource: string;
  incentiveSource: string;
}

export const translations: Record<Language, TranslationStrings> = {
  // ============================================
  // ENGLISH
  // ============================================
  en: {
    freeCalculatorTool: 'Free Calculator Tool',
    title: 'Thailand Property Transfer Fee Calculator',
    subtitle: 'Calculate exact costs when buying or selling property in Thailand. Includes the latest 0.01% government incentive (valid until June 2026).',
    
    baseCurrency: 'Base currency',
    liveRate: 'live rate',
    offlineRate: 'Offline rate',
    ratesUpdated: 'Rates updated',
    refresh: 'Refresh',
    loadingRate: 'Loading rate...',
    rateUnavailable: 'Rate unavailable',
    selected: 'Selected',
    
    propertyDetails: 'Property Details',
    purchasePrice: 'Purchase Price',
    purchasePriceHelp: 'The agreed sale price',
    registeredValue: 'Registered Value',
    registeredValueHelp: 'Government appraised value (usually lower than purchase price)',
    yearsOwned: 'Years Owned by Seller',
    yearsOwnedHelp: 'Affects Specific Business Tax (SBT) - applies if < 5 years',
    years: 'years',
    
    propertyType: 'Property Type',
    propertyTypeHelp: 'Affects ownership options for foreign buyers',
    condo: 'Condominium',
    houseLand: 'House with Land',
    landOnly: 'Land Only',
    
    buyerNationality: 'Buyer Nationality',
    buyerNationalityHelp: 'Affects ownership type and requirements',
    thai: 'Thai National',
    foreigner: 'Foreigner',
    sellerType: 'Seller Type',
    sellerTypeHelp: 'Affects withholding tax calculation',
    individual: 'Individual',
    company: 'Company',
    developer: 'Developer (New Build)',
    
    feeSplit: 'Fee Distribution',
    feeSplitHelp: 'How fees are split between buyer and seller',
    standardSplit: 'Standard Thailand (All 50/50)',
    buyerPaysAll: 'Buyer Pays All',
    sellerPaysAll: 'Seller Pays All',
    developerStandard: 'Developer Standard',
    customSplit: 'Custom Split',
    customizeFeeSplit: 'Customize Fee Split',
    buyerPercentage: 'Buyer %',
    sellerPercentage: 'Seller %',
    
    mortgageAmount: 'Mortgage Amount (Optional)',
    mortgageAmountHelp: 'Leave at 0 if paying cash',
    mortgageExceedsPrice: 'Mortgage cannot exceed purchase price',
    
    applyIncentive: 'Apply Government Incentive',
    incentiveDescription: '0.01% fees for properties ≤ ฿7M (until June 2026)',
    incentiveRequirement: 'Only for properties valued at ฿7 million or less',
    incentiveExplanation: 'Transfer fee reduced from 2% to 0.01% for properties valued at ฿7 million or less.',
    governmentIncentive: 'Government Incentive Active',
    daysRemaining: 'days remaining',
    incentiveExpired: 'Incentive has expired',
    saved: 'saved',
    youSave: 'You save',
    onTransferFee: 'on transfer fee',
    validUntil: 'Valid until',
    
    whatYouPay: 'What You Pay (Buyer)',
    ofPurchasePrice: 'of purchase price',
    totalTransferCosts: 'Total Transfer Costs',
    buyerPays: 'Buyer Pays',
    sellerPays: 'Seller Pays',
    costBreakdown: 'Cost Breakdown',
    
    transferFee: 'Transfer Fee',
    transferFeeDesc: 'Standard 2% of registered value, paid at Land Office',
    specificBusinessTax: 'Specific Business Tax (SBT)',
    specificBusinessTaxDesc: '3.3% if property owned < 5 years',
    stampDuty: 'Stamp Duty',
    stampDutyDesc: '0.5% of registered value (only if SBT not applicable)',
    withholdingTax: 'Withholding Tax',
    withholdingTaxDesc: 'Based on seller type and ownership period',
    mortgageRegistration: 'Mortgage Registration',
    mortgageRegistrationDesc: '1% of loan amount for mortgage registration',
    
    applicable: 'Applicable',
    notApplicable: 'Not applicable',
    paidBy: 'Paid by',
    buyer: 'Buyer',
    seller: 'Seller',
    split: 'Split 50/50',
    
    liveExchangeRates: 'Live Exchange Rates',
    loading: 'Loading...',
    offlineRatesWarning: 'Using offline rates. Live rates temporarily unavailable.',
    
    shareResults: 'Share Results',
    print: 'Print',
    generateReport: 'Generate Report',
    embedCalculator: 'Embed This Calculator on Your Website',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    shareOn: 'Share on',
    
    disclaimer: 'Disclaimer',
    disclaimerText: 'This calculator provides estimates based on standard Thai property transfer fees and taxes. Actual costs may vary. The buyer/seller split shown is typical but negotiable. For accurate calculations specific to your transaction, please consult with a qualified legal professional.',
    
    embedTitle: 'Embed This Calculator',
    embedDescription: 'Add this calculator to your website to provide value to your visitors.',
    width: 'Width',
    height: 'Height',
    preview: 'Preview',
    embedCode: 'Embed Code',
    copyCode: 'Copy Code',
    codeCopied: 'Code Copied!',
    poweredBy: 'Powered by',
    fullVersion: 'Full Version',
    
    // Foreigner Guide
    foreignerGuide: 'Foreigner Buying Guide',
    importantForForeigners: 'Important for Foreign Buyers',
    fetRequired: 'FET Form Required',
    fetRequiredDesc: 'You must transfer funds from abroad and obtain a Foreign Exchange Transaction (FET) form from your Thai bank as proof.',
    ownershipRestrictions: 'Ownership Restrictions',
    condoFreehold: 'Freehold Ownership',
    condoFreeholdDesc: 'Foreigners can own condos in freehold, up to 49% of total building units.',
    houseLandLeasehold: 'Leasehold Only',
    houseLandLeaseholdDesc: 'Foreigners cannot own land. You can lease land for 30+30+30 years or use a Thai company structure.',
    landNotAllowed: 'Not Allowed',
    landNotAllowedDesc: 'Foreigners cannot directly own land in Thailand.',
    quotaWarning: 'Foreign Ownership Quota',
    buyersGuide: "Buyer's Step-by-Step Guide",
    stepByStep: 'Complete Guide to Buying Property in Thailand',
    phase: 'Phase',
    preparation: 'Preparation',
    dueDiligence: 'Due Diligence',
    reservation: 'Reservation & Contract',
    transfer: 'Fund Transfer',
    registration: 'Registration',
    importantStep: 'Important',
    requiredDocuments: 'Required Documents',
    
    steps: {
      budgetPlanning: 'Budget Planning',
      budgetPlanningDesc: 'Calculate total costs including 7-10% additional fees (transfer fees, taxes, legal fees).',
      financingArrangement: 'Financing Arrangement',
      financingArrangementDesc: 'For foreigners: Funds MUST come from a foreign bank account. Thai mortgages are very difficult for non-residents.',
      lawyerSelection: 'Choose a Lawyer',
      lawyerSelectionDesc: 'Hire an independent Thai lawyer (not recommended to use the seller\'s or agent\'s lawyer).',
      ownershipStructure: 'Choose Ownership Structure',
      ownershipStructureDesc: 'Decide between freehold condo, leasehold villa, or Thai company structure.',
      propertySearch: 'Property Search',
      propertySearchDesc: 'For condos: Verify the foreign ownership quota (49%) has not been exceeded.',
      titleDeedCheck: 'Title Deed Verification',
      titleDeedCheckDesc: 'Only "Chanote" (Nor Sor 4 Jor) provides full ownership rights. Avoid lesser title types.',
      dueDiligenceProcess: 'Due Diligence',
      dueDiligenceProcessDesc: 'Your lawyer checks for: debts, mortgages, legal disputes, building permits, EIA approval.',
      buildingManagement: 'Building Management Check',
      buildingManagementDesc: 'Review condo financials, sinking fund status, and common area maintenance.',
      developerBackground: 'Developer Background',
      developerBackgroundDesc: 'For new builds: Check developer track record, EIA permits, and completion history.',
      reservationPayment: 'Reservation Payment',
      reservationPaymentDesc: 'Typically ฿50,000 - ฿200,000. Often non-refundable if you withdraw.',
      contractReview: 'Contract Review',
      contractReviewDesc: 'Have your lawyer review the Sale Agreement before signing. Negotiate fee distribution.',
      depositPayment: 'Deposit Payment',
      depositPaymentDesc: 'Usually 10-30% of purchase price. Held in escrow until transfer.',
      bankAccount: 'Open Thai Bank Account',
      bankAccountDesc: 'Required for receiving FET form. Must be in your own name.',
      fetForm: 'Obtain FET Form',
      fetFormDesc: 'Transfer funds from abroad via SWIFT/TT. Bank issues Foreign Exchange Transaction form as proof.',
      currencyExchange: 'Currency Exchange',
      currencyExchangeDesc: 'Convert foreign currency to Thai Baht at the same bank that issued the FET form.',
      landOffice: 'Land Office Appointment',
      landOfficeDesc: 'Schedule transfer at the Land Office in the district where property is located.',
      documentsSubmit: 'Submit Documents',
      documentsSubmitDesc: 'Bring: passport, FET form, contract, power of attorney (if representative attends).',
      taxPayment: 'Pay Taxes & Fees',
      taxPaymentDesc: 'Pay all applicable fees at Land Office. Cash or cashier\'s cheque accepted.',
      titleTransfer: 'Title Deed Transfer',
      titleTransferDesc: 'Ownership transferred. You receive the new title deed with your name, usually same day.',
    },
    
    titleDeedTypes: 'Title Deed Types',
    chanote: 'Chanote (Nor Sor 4 Jor)',
    chanoteDesc: 'Full ownership, GPS surveyed boundaries. Only type recommended for foreigners.',
    norSor3Gor: 'Nor Sor 3 Gor',
    norSor3GorDesc: 'Confirmed possession, can be sold after 30-day public notice. Limited financing options.',
    norSor3: 'Nor Sor 3',
    norSor3Desc: 'Possession rights only, boundaries less precise. Not recommended.',
    recommended: 'Recommended',
    caution: 'Caution',
    avoid: 'Avoid',
    
    // Source References
    verifiedByOfficialSources: 'Verified by Official Thai Government Sources',
    lastVerified: 'Last verified',
    viewOfficialSource: 'View official source',
    viewFullDocumentation: 'View Full Documentation',
    officialSources: 'Official Sources',
    ratesBasedOn: 'All rates based on official Thai government regulations',
    transferFeeSource: 'Department of Lands - Standard 2% transfer fee for property registration',
    sbtSource: 'Revenue Department - 3.3% SBT applies when selling within 5 years of acquisition',
    stampDutySource: 'Revenue Department - 0.5% stamp duty when SBT is not applicable',
    withholdingTaxSource: 'Revenue Code Section 50 - Progressive rates for individuals, 1% for companies',
    mortgageSource: 'Department of Lands - 1% mortgage registration fee',
    incentiveSource: 'Cabinet Resolution - 0.01% reduced rate for properties ≤ ฿7M until June 2026',
  },
  
  // ============================================
  // DUTCH (Nederlands)
  // ============================================
  nl: {
    freeCalculatorTool: 'Gratis Calculator',
    title: 'Thailand Overdrachtskosten Calculator',
    subtitle: 'Bereken de exacte kosten bij het kopen of verkopen van vastgoed in Thailand. Inclusief de nieuwste 0,01% overheidsstimulans (geldig tot juni 2026).',
    
    baseCurrency: 'Basisvaluta',
    liveRate: 'live koers',
    offlineRate: 'Offline koers',
    ratesUpdated: 'Koersen bijgewerkt',
    refresh: 'Vernieuwen',
    loadingRate: 'Koers laden...',
    rateUnavailable: 'Koers niet beschikbaar',
    selected: 'Geselecteerd',
    
    propertyDetails: 'Vastgoed Details',
    purchasePrice: 'Aankoopprijs',
    purchasePriceHelp: 'De overeengekomen verkoopprijs',
    registeredValue: 'Kadastrale Waarde',
    registeredValueHelp: 'Overheidsgetaxeerde waarde (meestal lager dan aankoopprijs)',
    yearsOwned: 'Jaren in Bezit Verkoper',
    yearsOwnedHelp: 'Beïnvloedt Specifieke Bedrijfsbelasting (SBT) - van toepassing als < 5 jaar',
    years: 'jaar',
    
    propertyType: 'Type Vastgoed',
    propertyTypeHelp: 'Beïnvloedt eigendomsopties voor buitenlandse kopers',
    condo: 'Appartement (Condo)',
    houseLand: 'Huis met Grond',
    landOnly: 'Alleen Grond',
    
    buyerNationality: 'Nationaliteit Koper',
    buyerNationalityHelp: 'Beïnvloedt eigendomstype en vereisten',
    thai: 'Thaise Nationaliteit',
    foreigner: 'Buitenlander',
    sellerType: 'Type Verkoper',
    sellerTypeHelp: 'Beïnvloedt bronbelastingberekening',
    individual: 'Particulier',
    company: 'Bedrijf',
    developer: 'Ontwikkelaar (Nieuwbouw)',
    
    feeSplit: 'Kostenverdeling',
    feeSplitHelp: 'Hoe kosten worden verdeeld tussen koper en verkoper',
    standardSplit: 'Standaard Thailand (Alles 50/50)',
    buyerPaysAll: 'Koper Betaalt Alles',
    sellerPaysAll: 'Verkoper Betaalt Alles',
    developerStandard: 'Ontwikkelaar Standaard',
    customSplit: 'Aangepaste Verdeling',
    customizeFeeSplit: 'Kostenverdeling Aanpassen',
    buyerPercentage: 'Koper %',
    sellerPercentage: 'Verkoper %',
    
    mortgageAmount: 'Hypotheekbedrag (Optioneel)',
    mortgageAmountHelp: 'Laat op 0 bij contante betaling',
    mortgageExceedsPrice: 'Hypotheek kan niet hoger zijn dan aankoopprijs',
    
    applyIncentive: 'Overheidsstimulans Toepassen',
    incentiveDescription: '0,01% kosten voor vastgoed ≤ ฿7M (tot juni 2026)',
    incentiveRequirement: 'Alleen voor vastgoed met een waarde van ฿7 miljoen of minder',
    incentiveExplanation: 'Overdrachtsbelasting verlaagd van 2% naar 0,01% voor vastgoed met een waarde van ฿7 miljoen of minder.',
    governmentIncentive: 'Overheidsstimulans Actief',
    daysRemaining: 'dagen resterend',
    incentiveExpired: 'Stimulans is verlopen',
    saved: 'bespaard',
    youSave: 'U bespaart',
    onTransferFee: 'op overdrachtsbelasting',
    validUntil: 'Geldig tot',
    
    whatYouPay: 'Wat U Betaalt (Koper)',
    ofPurchasePrice: 'van aankoopprijs',
    totalTransferCosts: 'Totale Overdrachtskosten',
    buyerPays: 'Koper Betaalt',
    sellerPays: 'Verkoper Betaalt',
    costBreakdown: 'Kostenspecificatie',
    
    transferFee: 'Overdrachtsbelasting',
    transferFeeDesc: 'Standaard 2% van kadastrale waarde, betaald bij Kadaster',
    specificBusinessTax: 'Specifieke Bedrijfsbelasting (SBT)',
    specificBusinessTaxDesc: '3,3% als vastgoed < 5 jaar in bezit',
    stampDuty: 'Zegelrecht',
    stampDutyDesc: '0,5% van kadastrale waarde (alleen als SBT niet van toepassing)',
    withholdingTax: 'Bronbelasting',
    withholdingTaxDesc: 'Gebaseerd op type verkoper en bezitsperiode',
    mortgageRegistration: 'Hypotheekregistratie',
    mortgageRegistrationDesc: '1% van leningbedrag voor hypotheekregistratie',
    
    applicable: 'Van toepassing',
    notApplicable: 'Niet van toepassing',
    paidBy: 'Betaald door',
    buyer: 'Koper',
    seller: 'Verkoper',
    split: '50/50 gedeeld',
    
    liveExchangeRates: 'Live Wisselkoersen',
    loading: 'Laden...',
    offlineRatesWarning: 'Offline koersen gebruikt. Live koersen tijdelijk niet beschikbaar.',
    
    shareResults: 'Resultaten Delen',
    print: 'Afdrukken',
    generateReport: 'Rapport Genereren',
    embedCalculator: 'Embed Deze Calculator op Uw Website',
    copyLink: 'Link Kopiëren',
    copied: 'Gekopieerd!',
    shareOn: 'Delen op',
    
    disclaimer: 'Disclaimer',
    disclaimerText: 'Deze calculator geeft schattingen op basis van standaard Thaise vastgoed overdrachtskosten en belastingen. Werkelijke kosten kunnen variëren. De getoonde koper/verkoper verdeling is gebruikelijk maar onderhandelbaar.',
    
    embedTitle: 'Embed Deze Calculator',
    embedDescription: 'Voeg deze calculator toe aan uw website om waarde te bieden aan uw bezoekers.',
    width: 'Breedte',
    height: 'Hoogte',
    preview: 'Voorbeeld',
    embedCode: 'Embed Code',
    copyCode: 'Code Kopiëren',
    codeCopied: 'Code Gekopieerd!',
    poweredBy: 'Mogelijk gemaakt door',
    fullVersion: 'Volledige Versie',
    
    // Foreigner Guide
    foreignerGuide: 'Gids voor Buitenlandse Kopers',
    importantForForeigners: 'Belangrijk voor Buitenlandse Kopers',
    fetRequired: 'FET Formulier Vereist',
    fetRequiredDesc: 'U moet geld vanuit het buitenland overmaken en een Foreign Exchange Transaction (FET) formulier verkrijgen van uw Thaise bank als bewijs.',
    ownershipRestrictions: 'Eigendomsbeperkingen',
    condoFreehold: 'Vol Eigendom',
    condoFreeholdDesc: 'Buitenlanders kunnen appartementen in vol eigendom bezitten, tot 49% van de totale units in het gebouw.',
    houseLandLeasehold: 'Alleen Erfpacht',
    houseLandLeaseholdDesc: 'Buitenlanders kunnen geen grond bezitten. U kunt grond leasen voor 30+30+30 jaar of een Thaise bedrijfsstructuur gebruiken.',
    landNotAllowed: 'Niet Toegestaan',
    landNotAllowedDesc: 'Buitenlanders kunnen geen grond direct bezitten in Thailand.',
    quotaWarning: 'Buitenlands Eigendomsquotum',
    buyersGuide: 'Stap-voor-Stap Koopgids',
    stepByStep: 'Complete Gids voor het Kopen van Vastgoed in Thailand',
    phase: 'Fase',
    preparation: 'Voorbereiding',
    dueDiligence: 'Due Diligence',
    reservation: 'Reservering & Contract',
    transfer: 'Geldoverdracht',
    registration: 'Registratie',
    importantStep: 'Belangrijk',
    requiredDocuments: 'Benodigde Documenten',
    
    steps: {
      budgetPlanning: 'Budget Planning',
      budgetPlanningDesc: 'Bereken totale kosten inclusief 7-10% extra kosten (overdrachtskosten, belastingen, juridische kosten).',
      financingArrangement: 'Financiering Regelen',
      financingArrangementDesc: 'Voor buitenlanders: Geld MOET van een buitenlandse bankrekening komen. Thaise hypotheken zijn zeer moeilijk voor niet-ingezetenen.',
      lawyerSelection: 'Kies een Advocaat',
      lawyerSelectionDesc: 'Neem een onafhankelijke Thaise advocaat (niet aanbevolen om de advocaat van de verkoper of makelaar te gebruiken).',
      ownershipStructure: 'Kies Eigendomsstructuur',
      ownershipStructureDesc: 'Kies tussen vol eigendom condo, erfpacht villa, of Thaise bedrijfsstructuur.',
      propertySearch: 'Vastgoed Zoeken',
      propertySearchDesc: 'Voor condos: Controleer of het buitenlands eigendomsquotum (49%) niet is overschreden.',
      titleDeedCheck: 'Eigendomsakte Verificatie',
      titleDeedCheckDesc: 'Alleen "Chanote" (Nor Sor 4 Jor) geeft volledige eigendomsrechten. Vermijd lagere titeltypen.',
      dueDiligenceProcess: 'Due Diligence',
      dueDiligenceProcessDesc: 'Uw advocaat controleert op: schulden, hypotheken, juridische geschillen, bouwvergunningen, EIA-goedkeuring.',
      buildingManagement: 'Beheer Controle',
      buildingManagementDesc: 'Bekijk condo financiën, reservefonds status, en gemeenschappelijk onderhoud.',
      developerBackground: 'Ontwikkelaar Achtergrond',
      developerBackgroundDesc: 'Voor nieuwbouw: Controleer track record ontwikkelaar, EIA-vergunningen, en opleveringsgeschiedenis.',
      reservationPayment: 'Reserveringsbetaling',
      reservationPaymentDesc: 'Meestal ฿50.000 - ฿200.000. Vaak niet terugbetaalbaar als u zich terugtrekt.',
      contractReview: 'Contract Review',
      contractReviewDesc: 'Laat uw advocaat de Koopovereenkomst controleren voordat u tekent. Onderhandel over kostenverdeling.',
      depositPayment: 'Aanbetaling',
      depositPaymentDesc: 'Meestal 10-30% van de aankoopprijs. In escrow tot overdracht.',
      bankAccount: 'Open Thaise Bankrekening',
      bankAccountDesc: 'Vereist voor het verkrijgen van FET formulier. Moet op uw eigen naam staan.',
      fetForm: 'Verkrijg FET Formulier',
      fetFormDesc: 'Maak geld over vanuit het buitenland via SWIFT/TT. Bank geeft Foreign Exchange Transaction formulier als bewijs.',
      currencyExchange: 'Valutawissel',
      currencyExchangeDesc: 'Wissel vreemde valuta naar Thaise Baht bij dezelfde bank die het FET formulier heeft uitgegeven.',
      landOffice: 'Kadaster Afspraak',
      landOfficeDesc: 'Plan overdracht bij het Kadaster in het district waar het vastgoed ligt.',
      documentsSubmit: 'Documenten Indienen',
      documentsSubmitDesc: 'Meenemen: paspoort, FET formulier, contract, volmacht (als vertegenwoordiger aanwezig is).',
      taxPayment: 'Belastingen & Kosten Betalen',
      taxPaymentDesc: 'Betaal alle van toepassing zijnde kosten bij Kadaster. Contant of bankcheck geaccepteerd.',
      titleTransfer: 'Eigendomsoverdracht',
      titleTransferDesc: 'Eigendom wordt overgedragen. U ontvangt de nieuwe eigendomsakte met uw naam, meestal dezelfde dag.',
    },
    
    titleDeedTypes: 'Eigendomsakte Typen',
    chanote: 'Chanote (Nor Sor 4 Jor)',
    chanoteDesc: 'Vol eigendom, GPS-gemeten grenzen. Enige type aanbevolen voor buitenlanders.',
    norSor3Gor: 'Nor Sor 3 Gor',
    norSor3GorDesc: 'Bevestigd bezit, kan worden verkocht na 30 dagen openbare kennisgeving. Beperkte financieringsopties.',
    norSor3: 'Nor Sor 3',
    norSor3Desc: 'Alleen bezitsrechten, grenzen minder nauwkeurig. Niet aanbevolen.',
    recommended: 'Aanbevolen',
    caution: 'Voorzichtigheid',
    avoid: 'Vermijden',
    
    // Source References
    verifiedByOfficialSources: 'Geverifieerd door Officiële Thaise Overheidsbronnen',
    lastVerified: 'Laatst geverifieerd',
    viewOfficialSource: 'Bekijk officiële bron',
    viewFullDocumentation: 'Bekijk Volledige Documentatie',
    officialSources: 'Officiële Bronnen',
    ratesBasedOn: 'Alle tarieven gebaseerd op officiële Thaise overheidsregelgeving',
    transferFeeSource: 'Department of Lands - Standaard 2% overdrachtsbelasting voor vastgoedregistratie',
    sbtSource: 'Revenue Department - 3,3% SBT bij verkoop binnen 5 jaar na aankoop',
    stampDutySource: 'Revenue Department - 0,5% zegelrecht wanneer SBT niet van toepassing is',
    withholdingTaxSource: 'Revenue Code Sectie 50 - Progressieve tarieven voor particulieren, 1% voor bedrijven',
    mortgageSource: 'Department of Lands - 1% hypotheekregistratiekosten',
    incentiveSource: 'Kabinetsbesluit - 0,01% gereduceerd tarief voor vastgoed ≤ ฿7M tot juni 2026',
  },
  
  // ============================================
  // ITALIAN (Italiano)
  // ============================================
  it: {
    freeCalculatorTool: 'Calcolatore Gratuito',
    title: 'Calcolatore Tasse Trasferimento Immobili Thailandia',
    subtitle: 'Calcola i costi esatti per acquistare o vendere immobili in Thailandia. Include l\'ultimo incentivo governativo dello 0,01% (valido fino a giugno 2026).',
    
    baseCurrency: 'Valuta base',
    liveRate: 'tasso live',
    offlineRate: 'Tasso offline',
    ratesUpdated: 'Tassi aggiornati',
    refresh: 'Aggiorna',
    loadingRate: 'Caricamento tasso...',
    rateUnavailable: 'Tasso non disponibile',
    selected: 'Selezionato',
    
    propertyDetails: 'Dettagli Immobile',
    purchasePrice: 'Prezzo di Acquisto',
    purchasePriceHelp: 'Il prezzo di vendita concordato',
    registeredValue: 'Valore Catastale',
    registeredValueHelp: 'Valore stimato dal governo (di solito inferiore al prezzo d\'acquisto)',
    yearsOwned: 'Anni di Proprietà del Venditore',
    yearsOwnedHelp: 'Influisce sulla Tassa Specifica sugli Affari (SBT) - si applica se < 5 anni',
    years: 'anni',
    
    sellerType: 'Tipo di Venditore',
    sellerTypeHelp: 'Influisce sul calcolo della ritenuta d\'acconto',
    individual: 'Privato',
    company: 'Azienda',
    
    mortgageAmount: 'Importo Mutuo (Opzionale)',
    mortgageAmountHelp: 'Lascia a 0 se paghi in contanti',
    mortgageExceedsPrice: 'Il mutuo non può superare il prezzo di acquisto',
    
    applyIncentive: 'Applica Incentivo Governativo',
    incentiveDescription: '0,01% di tasse per immobili ≤ ฿7M (fino a giugno 2026)',
    incentiveRequirement: 'Solo per immobili con valore ≤ ฿7 milioni',
    incentiveExplanation: 'Tassa di trasferimento ridotta dal 2% allo 0,01% per immobili con valore ≤ ฿7 milioni.',
    governmentIncentive: 'Incentivo Governativo Attivo',
    daysRemaining: 'giorni rimanenti',
    incentiveExpired: 'Incentivo scaduto',
    saved: 'risparmiato',
    youSave: 'Risparmi',
    onTransferFee: 'sulla tassa di trasferimento',
    validUntil: 'Valido fino al',
    
    whatYouPay: 'Cosa Paghi (Acquirente)',
    ofPurchasePrice: 'del prezzo d\'acquisto',
    totalTransferCosts: 'Costi Totali Trasferimento',
    buyerPays: 'Paga l\'Acquirente',
    sellerPays: 'Paga il Venditore',
    costBreakdown: 'Dettaglio Costi',
    
    transferFee: 'Tassa di Trasferimento',
    transferFeeDesc: '2% standard del valore catastale, pagato all\'Ufficio del Territorio',
    specificBusinessTax: 'Tassa Specifica sugli Affari (SBT)',
    specificBusinessTaxDesc: '3,3% se immobile posseduto < 5 anni',
    stampDuty: 'Imposta di Bollo',
    stampDutyDesc: '0,5% del valore catastale (solo se SBT non applicabile)',
    withholdingTax: 'Ritenuta d\'Acconto',
    withholdingTaxDesc: 'Basata sul tipo di venditore e periodo di proprietà',
    mortgageRegistration: 'Registrazione Mutuo',
    mortgageRegistrationDesc: '1% dell\'importo del prestito per registrazione mutuo',
    
    applicable: 'Applicabile',
    notApplicable: 'Non applicabile',
    paidBy: 'Pagato da',
    buyer: 'Acquirente',
    seller: 'Venditore',
    split: 'Diviso 50/50',
    
    liveExchangeRates: 'Tassi di Cambio Live',
    loading: 'Caricamento...',
    offlineRatesWarning: 'Usando tassi offline. Tassi live temporaneamente non disponibili.',
    
    shareResults: 'Condividi Risultati',
    print: 'Stampa',
    generateReport: 'Genera Rapporto',
    embedCalculator: 'Incorpora Questo Calcolatore nel Tuo Sito',
    copyLink: 'Copia Link',
    copied: 'Copiato!',
    shareOn: 'Condividi su',
    
    disclaimer: 'Disclaimer',
    disclaimerText: 'Questo calcolatore fornisce stime basate su tasse e imposte standard thailandesi per il trasferimento di immobili. I costi effettivi possono variare. La divisione acquirente/venditore mostrata è tipica ma negoziabile. Per calcoli accurati specifici per la tua transazione, consulta un professionista legale qualificato o contatta PSM Phuket.',
    
    embedTitle: 'Incorpora Questo Calcolatore',
    embedDescription: 'Aggiungi questo calcolatore al tuo sito per offrire valore ai tuoi visitatori.',
    width: 'Larghezza',
    height: 'Altezza',
    preview: 'Anteprima',
    embedCode: 'Codice Embed',
    copyCode: 'Copia Codice',
    codeCopied: 'Codice Copiato!',
    poweredBy: 'Powered by',
    fullVersion: 'Versione Completa',
  },
  
  // ============================================
  // GERMAN (Deutsch)
  // ============================================
  de: {
    freeCalculatorTool: 'Kostenloser Rechner',
    title: 'Thailand Immobilien-Übertragungsgebühren Rechner',
    subtitle: 'Berechnen Sie die genauen Kosten beim Kauf oder Verkauf von Immobilien in Thailand. Inklusive des neuesten 0,01% Regierungsanreizes (gültig bis Juni 2026).',
    
    baseCurrency: 'Basiswährung',
    liveRate: 'Live-Kurs',
    offlineRate: 'Offline-Kurs',
    ratesUpdated: 'Kurse aktualisiert',
    refresh: 'Aktualisieren',
    loadingRate: 'Kurs wird geladen...',
    rateUnavailable: 'Kurs nicht verfügbar',
    selected: 'Ausgewählt',
    
    propertyDetails: 'Immobiliendetails',
    purchasePrice: 'Kaufpreis',
    purchasePriceHelp: 'Der vereinbarte Verkaufspreis',
    registeredValue: 'Katasterwert',
    registeredValueHelp: 'Staatlich geschätzter Wert (normalerweise niedriger als Kaufpreis)',
    yearsOwned: 'Besitzdauer des Verkäufers',
    yearsOwnedHelp: 'Beeinflusst Spezifische Geschäftssteuer (SBT) - gilt bei < 5 Jahren',
    years: 'Jahre',
    
    sellerType: 'Verkäufertyp',
    sellerTypeHelp: 'Beeinflusst Quellensteuerberechnung',
    individual: 'Privatperson',
    company: 'Unternehmen',
    
    mortgageAmount: 'Hypothekenbetrag (Optional)',
    mortgageAmountHelp: 'Bei Barzahlung auf 0 lassen',
    mortgageExceedsPrice: 'Hypothek kann den Kaufpreis nicht überschreiten',
    
    applyIncentive: 'Regierungsanreiz anwenden',
    incentiveDescription: '0,01% Gebühren für Immobilien ≤ ฿7M (bis Juni 2026)',
    incentiveRequirement: 'Nur für Immobilien mit einem Wert von ฿7 Millionen oder weniger',
    incentiveExplanation: 'Übertragungsgebühr von 2% auf 0,01% für Immobilien mit einem Wert von ฿7 Millionen oder weniger reduziert.',
    governmentIncentive: 'Regierungsanreiz Aktiv',
    daysRemaining: 'Tage verbleibend',
    incentiveExpired: 'Anreiz abgelaufen',
    saved: 'gespart',
    youSave: 'Sie sparen',
    onTransferFee: 'bei der Übertragungsgebühr',
    validUntil: 'Gültig bis',
    
    whatYouPay: 'Was Sie Zahlen (Käufer)',
    ofPurchasePrice: 'vom Kaufpreis',
    totalTransferCosts: 'Gesamte Übertragungskosten',
    buyerPays: 'Käufer zahlt',
    sellerPays: 'Verkäufer zahlt',
    costBreakdown: 'Kostenaufschlüsselung',
    
    transferFee: 'Übertragungsgebühr',
    transferFeeDesc: 'Standard 2% des Katasterwertes, beim Grundbuchamt zu zahlen',
    specificBusinessTax: 'Spezifische Geschäftssteuer (SBT)',
    specificBusinessTaxDesc: '3,3% wenn Immobilie < 5 Jahre im Besitz',
    stampDuty: 'Stempelsteuer',
    stampDutyDesc: '0,5% des Katasterwertes (nur wenn SBT nicht anwendbar)',
    withholdingTax: 'Quellensteuer',
    withholdingTaxDesc: 'Basierend auf Verkäufertyp und Besitzdauer',
    mortgageRegistration: 'Hypothekenregistrierung',
    mortgageRegistrationDesc: '1% des Darlehensbetrags für Hypothekenregistrierung',
    
    applicable: 'Anwendbar',
    notApplicable: 'Nicht anwendbar',
    paidBy: 'Bezahlt von',
    buyer: 'Käufer',
    seller: 'Verkäufer',
    split: '50/50 geteilt',
    
    liveExchangeRates: 'Live-Wechselkurse',
    loading: 'Wird geladen...',
    offlineRatesWarning: 'Offline-Kurse werden verwendet. Live-Kurse vorübergehend nicht verfügbar.',
    
    shareResults: 'Ergebnisse teilen',
    print: 'Drucken',
    generateReport: 'Bericht Erstellen',
    embedCalculator: 'Diesen Rechner auf Ihrer Website einbetten',
    copyLink: 'Link kopieren',
    copied: 'Kopiert!',
    shareOn: 'Teilen auf',
    
    disclaimer: 'Haftungsausschluss',
    disclaimerText: 'Dieser Rechner liefert Schätzungen basierend auf Standard-Übertragungsgebühren und Steuern für thailändische Immobilien. Die tatsächlichen Kosten können variieren. Die gezeigte Käufer/Verkäufer-Aufteilung ist üblich, aber verhandelbar. Für genaue Berechnungen spezifisch für Ihre Transaktion konsultieren Sie bitte einen qualifizierten Rechtsexperten oder kontaktieren Sie PSM Phuket.',
    
    embedTitle: 'Diesen Rechner einbetten',
    embedDescription: 'Fügen Sie diesen Rechner zu Ihrer Website hinzu, um Ihren Besuchern Mehrwert zu bieten.',
    width: 'Breite',
    height: 'Höhe',
    preview: 'Vorschau',
    embedCode: 'Einbettungscode',
    copyCode: 'Code kopieren',
    codeCopied: 'Code kopiert!',
    poweredBy: 'Bereitgestellt von',
    fullVersion: 'Vollversion',
  },
  
  // ============================================
  // RUSSIAN (Русский)
  // ============================================
  ru: {
    freeCalculatorTool: 'Бесплатный Калькулятор',
    title: 'Калькулятор Сборов за Передачу Недвижимости в Таиланде',
    subtitle: 'Рассчитайте точные расходы при покупке или продаже недвижимости в Таиланде. Включает последнюю государственную льготу 0,01% (действует до июня 2026).',
    
    baseCurrency: 'Базовая валюта',
    liveRate: 'текущий курс',
    offlineRate: 'Оффлайн курс',
    ratesUpdated: 'Курсы обновлены',
    refresh: 'Обновить',
    loadingRate: 'Загрузка курса...',
    rateUnavailable: 'Курс недоступен',
    selected: 'Выбрано',
    
    propertyDetails: 'Детали Недвижимости',
    purchasePrice: 'Цена Покупки',
    purchasePriceHelp: 'Согласованная цена продажи',
    registeredValue: 'Кадастровая Стоимость',
    registeredValueHelp: 'Государственная оценочная стоимость (обычно ниже цены покупки)',
    yearsOwned: 'Лет во Владении Продавца',
    yearsOwnedHelp: 'Влияет на Специальный Налог на Бизнес (SBT) - применяется если < 5 лет',
    years: 'лет',
    
    sellerType: 'Тип Продавца',
    sellerTypeHelp: 'Влияет на расчет удерживаемого налога',
    individual: 'Физическое лицо',
    company: 'Компания',
    
    mortgageAmount: 'Сумма Ипотеки (Опционально)',
    mortgageAmountHelp: 'Оставьте 0 при оплате наличными',
    mortgageExceedsPrice: 'Ипотека не может превышать цену покупки',
    
    applyIncentive: 'Применить Государственную Льготу',
    incentiveDescription: '0,01% сборы для недвижимости ≤ ฿7M (до июня 2026)',
    incentiveRequirement: 'Только для недвижимости стоимостью ≤ ฿7 миллионов',
    incentiveExplanation: 'Плата за передачу снижена с 2% до 0,01% для недвижимости стоимостью ≤ ฿7 миллионов.',
    governmentIncentive: 'Государственная Льгота Активна',
    daysRemaining: 'дней осталось',
    incentiveExpired: 'Льгота истекла',
    saved: 'сэкономлено',
    youSave: 'Вы экономите',
    onTransferFee: 'на плате за передачу',
    validUntil: 'Действует до',
    
    whatYouPay: 'Что Вы Платите (Покупатель)',
    ofPurchasePrice: 'от стоимости покупки',
    totalTransferCosts: 'Общие Расходы на Передачу',
    buyerPays: 'Покупатель Платит',
    sellerPays: 'Продавец Платит',
    costBreakdown: 'Разбивка Расходов',
    
    transferFee: 'Сбор за Передачу',
    transferFeeDesc: 'Стандартные 2% от кадастровой стоимости, оплачивается в Земельном Управлении',
    specificBusinessTax: 'Специальный Налог на Бизнес (SBT)',
    specificBusinessTaxDesc: '3,3% если недвижимость во владении < 5 лет',
    stampDuty: 'Гербовый Сбор',
    stampDutyDesc: '0,5% от кадастровой стоимости (только если SBT не применяется)',
    withholdingTax: 'Удерживаемый Налог',
    withholdingTaxDesc: 'Зависит от типа продавца и периода владения',
    mortgageRegistration: 'Регистрация Ипотеки',
    mortgageRegistrationDesc: '1% от суммы кредита за регистрацию ипотеки',
    
    applicable: 'Применимо',
    notApplicable: 'Не применимо',
    paidBy: 'Оплачивает',
    buyer: 'Покупатель',
    seller: 'Продавец',
    split: 'Поровну 50/50',
    
    liveExchangeRates: 'Текущие Курсы Валют',
    loading: 'Загрузка...',
    offlineRatesWarning: 'Используются оффлайн курсы. Текущие курсы временно недоступны.',
    
    shareResults: 'Поделиться Результатами',
    print: 'Печать',
    generateReport: 'Создать Отчет',
    embedCalculator: 'Встроить Калькулятор на Ваш Сайт',
    copyLink: 'Копировать Ссылку',
    copied: 'Скопировано!',
    shareOn: 'Поделиться в',
    
    disclaimer: 'Отказ от Ответственности',
    disclaimerText: 'Этот калькулятор предоставляет оценки на основе стандартных сборов и налогов на передачу недвижимости в Таиланде. Фактические расходы могут отличаться. Показанное разделение между покупателем и продавцом типично, но может быть предметом переговоров. Для точных расчетов по вашей сделке проконсультируйтесь с квалифицированным юристом или свяжитесь с PSM Phuket.',
    
    embedTitle: 'Встроить Этот Калькулятор',
    embedDescription: 'Добавьте этот калькулятор на свой сайт, чтобы предоставить ценность вашим посетителям.',
    width: 'Ширина',
    height: 'Высота',
    preview: 'Предпросмотр',
    embedCode: 'Код для Встраивания',
    copyCode: 'Копировать Код',
    codeCopied: 'Код Скопирован!',
    poweredBy: 'При поддержке',
    fullVersion: 'Полная Версия',
  },
  
  // ============================================
  // FRENCH (Français)
  // ============================================
  fr: {
    freeCalculatorTool: 'Calculateur Gratuit',
    title: 'Calculateur des Frais de Transfert Immobilier en Thaïlande',
    subtitle: 'Calculez les coûts exacts lors de l\'achat ou de la vente d\'un bien immobilier en Thaïlande. Inclut la dernière incitation gouvernementale de 0,01% (valable jusqu\'en juin 2026).',
    
    baseCurrency: 'Devise de base',
    liveRate: 'taux en direct',
    offlineRate: 'Taux hors ligne',
    ratesUpdated: 'Taux mis à jour',
    refresh: 'Actualiser',
    loadingRate: 'Chargement du taux...',
    rateUnavailable: 'Taux non disponible',
    selected: 'Sélectionné',
    
    propertyDetails: 'Détails du Bien',
    purchasePrice: 'Prix d\'Achat',
    purchasePriceHelp: 'Le prix de vente convenu',
    registeredValue: 'Valeur Cadastrale',
    registeredValueHelp: 'Valeur estimée par l\'État (généralement inférieure au prix d\'achat)',
    yearsOwned: 'Années de Propriété du Vendeur',
    yearsOwnedHelp: 'Affecte la Taxe Spécifique sur les Affaires (SBT) - s\'applique si < 5 ans',
    years: 'ans',
    
    sellerType: 'Type de Vendeur',
    sellerTypeHelp: 'Affecte le calcul de la retenue à la source',
    individual: 'Particulier',
    company: 'Société',
    
    mortgageAmount: 'Montant du Prêt (Optionnel)',
    mortgageAmountHelp: 'Laissez à 0 si paiement comptant',
    mortgageExceedsPrice: 'L\'hypothèque ne peut pas dépasser le prix d\'achat',
    
    applyIncentive: 'Appliquer l\'Incitation Gouvernementale',
    incentiveDescription: '0,01% de frais pour les biens ≤ ฿7M (jusqu\'en juin 2026)',
    incentiveRequirement: 'Uniquement pour les biens d\'une valeur ≤ ฿7 millions',
    incentiveExplanation: 'Frais de transfert réduits de 2% à 0,01% pour les biens d\'une valeur ≤ ฿7 millions.',
    governmentIncentive: 'Incitation Gouvernementale Active',
    daysRemaining: 'jours restants',
    incentiveExpired: 'L\'incitation a expiré',
    saved: 'économisé',
    youSave: 'Vous économisez',
    onTransferFee: 'sur les frais de transfert',
    validUntil: 'Valable jusqu\'au',
    
    whatYouPay: 'Ce Que Vous Payez (Acheteur)',
    ofPurchasePrice: 'du prix d\'achat',
    totalTransferCosts: 'Coûts Totaux de Transfert',
    buyerPays: 'L\'Acheteur Paie',
    sellerPays: 'Le Vendeur Paie',
    costBreakdown: 'Détail des Coûts',
    
    transferFee: 'Frais de Transfert',
    transferFeeDesc: '2% standard de la valeur cadastrale, payé au Bureau des Terres',
    specificBusinessTax: 'Taxe Spécifique sur les Affaires (SBT)',
    specificBusinessTaxDesc: '3,3% si le bien est détenu < 5 ans',
    stampDuty: 'Droits de Timbre',
    stampDutyDesc: '0,5% de la valeur cadastrale (seulement si SBT non applicable)',
    withholdingTax: 'Retenue à la Source',
    withholdingTaxDesc: 'Basée sur le type de vendeur et la période de propriété',
    mortgageRegistration: 'Enregistrement de l\'Hypothèque',
    mortgageRegistrationDesc: '1% du montant du prêt pour l\'enregistrement de l\'hypothèque',
    
    applicable: 'Applicable',
    notApplicable: 'Non applicable',
    paidBy: 'Payé par',
    buyer: 'Acheteur',
    seller: 'Vendeur',
    split: 'Partagé 50/50',
    
    liveExchangeRates: 'Taux de Change en Direct',
    loading: 'Chargement...',
    offlineRatesWarning: 'Utilisation des taux hors ligne. Taux en direct temporairement indisponibles.',
    
    shareResults: 'Partager les Résultats',
    print: 'Imprimer',
    generateReport: 'Générer le Rapport',
    embedCalculator: 'Intégrer ce Calculateur sur Votre Site',
    copyLink: 'Copier le Lien',
    copied: 'Copié !',
    shareOn: 'Partager sur',
    
    disclaimer: 'Avertissement',
    disclaimerText: 'Ce calculateur fournit des estimations basées sur les frais et taxes standard de transfert immobilier thaïlandais. Les coûts réels peuvent varier. La répartition acheteur/vendeur affichée est typique mais négociable. Pour des calculs précis spécifiques à votre transaction, veuillez consulter un professionnel juridique qualifié ou contacter PSM Phuket.',
    
    embedTitle: 'Intégrer ce Calculateur',
    embedDescription: 'Ajoutez ce calculateur à votre site pour apporter de la valeur à vos visiteurs.',
    width: 'Largeur',
    height: 'Hauteur',
    preview: 'Aperçu',
    embedCode: 'Code d\'Intégration',
    copyCode: 'Copier le Code',
    codeCopied: 'Code Copié !',
    poweredBy: 'Propulsé par',
    fullVersion: 'Version Complète',
  },
  
  // ============================================
  // CHINESE (中文)
  // ============================================
  zh: {
    freeCalculatorTool: '免费计算器',
    title: '泰国房产过户费用计算器',
    subtitle: '计算在泰国买卖房产的精确费用。包含最新的0.01%政府优惠政策（有效期至2026年6月）。',
    
    baseCurrency: '基础货币',
    liveRate: '实时汇率',
    offlineRate: '离线汇率',
    ratesUpdated: '汇率已更新',
    refresh: '刷新',
    loadingRate: '加载汇率中...',
    rateUnavailable: '汇率不可用',
    selected: '已选择',
    
    propertyDetails: '房产详情',
    purchasePrice: '购买价格',
    purchasePriceHelp: '协议售价',
    registeredValue: '登记价值',
    registeredValueHelp: '政府评估价值（通常低于购买价格）',
    yearsOwned: '卖方持有年限',
    yearsOwnedHelp: '影响特别营业税(SBT) - 适用于持有少于5年的情况',
    years: '年',
    
    sellerType: '卖方类型',
    sellerTypeHelp: '影响预扣税计算',
    individual: '个人',
    company: '公司',
    
    mortgageAmount: '贷款金额（可选）',
    mortgageAmountHelp: '现金支付请留0',
    mortgageExceedsPrice: '抵押贷款不能超过购买价格',
    
    applyIncentive: '应用政府优惠',
    incentiveDescription: '价值≤700万泰铢的房产可享受0.01%费率（至2026年6月）',
    incentiveRequirement: '仅适用于价值≤700万泰铢的房产',
    incentiveExplanation: '价值≤700万泰铢的房产过户费从2%降至0.01%。',
    governmentIncentive: '政府优惠已激活',
    daysRemaining: '天剩余',
    incentiveExpired: '优惠已过期',
    saved: '已节省',
    youSave: '您节省',
    onTransferFee: '过户费',
    validUntil: '有效期至',
    
    whatYouPay: '您支付的金额（买方）',
    ofPurchasePrice: '购买价格的',
    totalTransferCosts: '总过户费用',
    buyerPays: '买方支付',
    sellerPays: '卖方支付',
    costBreakdown: '费用明细',
    
    transferFee: '过户费',
    transferFeeDesc: '标准为登记价值的2%，在土地局支付',
    specificBusinessTax: '特别营业税(SBT)',
    specificBusinessTaxDesc: '持有少于5年需缴纳3.3%',
    stampDuty: '印花税',
    stampDutyDesc: '登记价值的0.5%（仅在SBT不适用时）',
    withholdingTax: '预扣税',
    withholdingTaxDesc: '根据卖方类型和持有期限确定',
    mortgageRegistration: '抵押登记',
    mortgageRegistrationDesc: '贷款金额的1%用于抵押登记',
    
    applicable: '适用',
    notApplicable: '不适用',
    paidBy: '支付方',
    buyer: '买方',
    seller: '卖方',
    split: '各付50%',
    
    liveExchangeRates: '实时汇率',
    loading: '加载中...',
    offlineRatesWarning: '使用离线汇率。实时汇率暂时不可用。',
    
    shareResults: '分享结果',
    print: '打印',
    generateReport: '生成报告',
    embedCalculator: '将此计算器嵌入您的网站',
    copyLink: '复制链接',
    copied: '已复制！',
    shareOn: '分享到',
    
    disclaimer: '免责声明',
    disclaimerText: '此计算器根据泰国标准房产过户费用和税收提供估算。实际费用可能有所不同。显示的买卖双方分担比例是惯例但可协商。如需针对您交易的精确计算，请咨询合格的法律专业人士或联系PSM Phuket。',
    
    embedTitle: '嵌入此计算器',
    embedDescription: '将此计算器添加到您的网站，为访客提供价值。',
    width: '宽度',
    height: '高度',
    preview: '预览',
    embedCode: '嵌入代码',
    copyCode: '复制代码',
    codeCopied: '代码已复制！',
    poweredBy: '技术支持',
    fullVersion: '完整版',
  },
};

/**
 * Get translation strings for a language
 * Falls back to English for any missing keys
 */
export function getTranslations(lang: Language): TranslationStrings {
  const langTranslations = translations[lang];
  if (!langTranslations) {
    return translations.en;
  }
  
  // Deep merge with English fallback for missing keys
  return {
    ...translations.en,
    ...langTranslations,
    steps: {
      ...translations.en.steps,
      ...(langTranslations.steps || {}),
    },
  };
}

/**
 * Get translated "Paid by" label
 */
export function getPayerLabel(paidBy: string, t: TranslationStrings): string {
  switch (paidBy.toLowerCase()) {
    case 'buyer':
      return t.buyer;
    case 'seller':
      return t.seller;
    case 'split':
    case 'split 50/50':
      return t.split;
    default:
      return paidBy;
  }
}

/**
 * Translate tax type names from English to selected language
 */
export function getTaxTypeName(englishName: string, t: TranslationStrings): string {
  const nameMap: Record<string, keyof TranslationStrings> = {
    'Transfer Fee': 'transferFee',
    'Specific Business Tax (SBT)': 'specificBusinessTax',
    'Specific Business Tax': 'specificBusinessTax',
    'Stamp Duty': 'stampDuty',
    'Withholding Tax': 'withholdingTax',
    'Mortgage Registration': 'mortgageRegistration',
    'Mortgage Registration Fee': 'mortgageRegistration',
  };
  
  const key = nameMap[englishName];
  if (key && t[key]) {
    return t[key] as string;
  }
  return englishName;
}

/**
 * Translate tax type descriptions from English to selected language
 */
export function getTaxTypeDescription(englishName: string, t: TranslationStrings): string {
  const descMap: Record<string, keyof TranslationStrings> = {
    'Transfer Fee': 'transferFeeDesc',
    'Specific Business Tax (SBT)': 'specificBusinessTaxDesc',
    'Specific Business Tax': 'specificBusinessTaxDesc',
    'Stamp Duty': 'stampDutyDesc',
    'Withholding Tax': 'withholdingTaxDesc',
    'Mortgage Registration': 'mortgageRegistrationDesc',
    'Mortgage Registration Fee': 'mortgageRegistrationDesc',
  };
  
  const key = descMap[englishName];
  if (key && t[key]) {
    return t[key] as string;
  }
  return '';
}
