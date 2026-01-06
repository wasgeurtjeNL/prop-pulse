"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { 
  TranslationStrings, 
  PropertyType, 
  BuyerNationality,
  ForeignerStep 
} from "@/lib/calculators/property-transfer";

// ============================================
// FOREIGNER BUYING STEPS DATA
// ============================================

export function getForeignerSteps(t: TranslationStrings): ForeignerStep[] {
  return [
    // Phase 1: Preparation
    {
      phase: 'preparation',
      step: 1,
      title: t.steps.budgetPlanning,
      description: t.steps.budgetPlanningDesc,
      important: true,
    },
    {
      phase: 'preparation',
      step: 2,
      title: t.steps.financingArrangement,
      description: t.steps.financingArrangementDesc,
      important: true,
    },
    {
      phase: 'preparation',
      step: 3,
      title: t.steps.lawyerSelection,
      description: t.steps.lawyerSelectionDesc,
      important: true,
    },
    {
      phase: 'preparation',
      step: 4,
      title: t.steps.ownershipStructure,
      description: t.steps.ownershipStructureDesc,
      important: false,
    },
    // Phase 2: Due Diligence
    {
      phase: 'due_diligence',
      step: 5,
      title: t.steps.propertySearch,
      description: t.steps.propertySearchDesc,
      important: false,
    },
    {
      phase: 'due_diligence',
      step: 6,
      title: t.steps.titleDeedCheck,
      description: t.steps.titleDeedCheckDesc,
      important: true,
    },
    {
      phase: 'due_diligence',
      step: 7,
      title: t.steps.dueDiligenceProcess,
      description: t.steps.dueDiligenceProcessDesc,
      important: true,
    },
    {
      phase: 'due_diligence',
      step: 8,
      title: t.steps.buildingManagement,
      description: t.steps.buildingManagementDesc,
      important: false,
    },
    {
      phase: 'due_diligence',
      step: 9,
      title: t.steps.developerBackground,
      description: t.steps.developerBackgroundDesc,
      important: false,
    },
    // Phase 3: Reservation
    {
      phase: 'reservation',
      step: 10,
      title: t.steps.reservationPayment,
      description: t.steps.reservationPaymentDesc,
      important: true,
    },
    {
      phase: 'reservation',
      step: 11,
      title: t.steps.contractReview,
      description: t.steps.contractReviewDesc,
      important: true,
    },
    {
      phase: 'reservation',
      step: 12,
      title: t.steps.depositPayment,
      description: t.steps.depositPaymentDesc,
      important: false,
    },
    // Phase 4: Transfer
    {
      phase: 'transfer',
      step: 13,
      title: t.steps.bankAccount,
      description: t.steps.bankAccountDesc,
      important: true,
    },
    {
      phase: 'transfer',
      step: 14,
      title: t.steps.fetForm,
      description: t.steps.fetFormDesc,
      important: true,
    },
    {
      phase: 'transfer',
      step: 15,
      title: t.steps.currencyExchange,
      description: t.steps.currencyExchangeDesc,
      important: false,
    },
    // Phase 5: Registration
    {
      phase: 'registration',
      step: 16,
      title: t.steps.landOffice,
      description: t.steps.landOfficeDesc,
      important: false,
    },
    {
      phase: 'registration',
      step: 17,
      title: t.steps.documentsSubmit,
      description: t.steps.documentsSubmitDesc,
      important: true,
      documents: ['Passport', 'FET Form', 'Sale Agreement', 'Power of Attorney (if applicable)'],
    },
    {
      phase: 'registration',
      step: 18,
      title: t.steps.taxPayment,
      description: t.steps.taxPaymentDesc,
      important: false,
    },
    {
      phase: 'registration',
      step: 19,
      title: t.steps.titleTransfer,
      description: t.steps.titleTransferDesc,
      important: true,
    },
  ];
}

// ============================================
// PHASE ICONS & COLORS
// ============================================

const PHASE_CONFIG = {
  preparation: {
    icon: 'solar:document-text-linear',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  due_diligence: {
    icon: 'solar:magnifer-linear',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  reservation: {
    icon: 'solar:pen-new-square-linear',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  transfer: {
    icon: 'solar:card-transfer-linear',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  registration: {
    icon: 'solar:key-linear',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
};

// ============================================
// COMPONENT: Foreigner Alert Banner
// ============================================

interface ForeignerAlertProps {
  propertyType: PropertyType;
  t: TranslationStrings;
}

export function ForeignerAlert({ propertyType, t }: ForeignerAlertProps) {
  const getOwnershipInfo = () => {
    switch (propertyType) {
      case 'condo':
        return {
          type: 'freehold',
          title: t.condoFreehold,
          description: t.condoFreeholdDesc,
          icon: 'solar:verified-check-bold',
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-700',
        };
      case 'house_land':
        return {
          type: 'leasehold',
          title: t.houseLandLeasehold,
          description: t.houseLandLeaseholdDesc,
          icon: 'solar:shield-warning-bold',
          color: 'text-amber-600',
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
          borderColor: 'border-amber-200 dark:border-amber-700',
        };
      case 'land_only':
        return {
          type: 'not_allowed',
          title: t.landNotAllowed,
          description: t.landNotAllowedDesc,
          icon: 'solar:close-circle-bold',
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-700',
        };
    }
  };

  const info = getOwnershipInfo();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border p-4",
        info.bgColor,
        info.borderColor
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", info.bgColor)}>
          <Icon icon={info.icon} className={cn("w-6 h-6", info.color)} />
        </div>
        <div className="flex-1">
          <h4 className={cn("font-semibold", info.color)}>{info.title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {info.description}
          </p>
        </div>
      </div>

      {/* FET Requirement */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <Icon icon="solar:document-add-bold" className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-medium text-gray-900 dark:text-white">{t.fetRequired}</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t.fetRequiredDesc}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// COMPONENT: Title Deed Types Info
// ============================================

interface TitleDeedTypesProps {
  t: TranslationStrings;
}

export function TitleDeedTypes({ t }: TitleDeedTypesProps) {
  const deedTypes = [
    {
      name: t.chanote,
      description: t.chanoteDesc,
      status: 'recommended',
      statusLabel: t.recommended,
      icon: 'solar:verified-check-bold',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      name: t.norSor3Gor,
      description: t.norSor3GorDesc,
      status: 'caution',
      statusLabel: t.caution,
      icon: 'solar:shield-warning-bold',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      name: t.norSor3,
      description: t.norSor3Desc,
      status: 'avoid',
      statusLabel: t.avoid,
      icon: 'solar:close-circle-bold',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Icon icon="solar:document-text-bold" className="w-5 h-5 text-primary" />
        {t.titleDeedTypes}
      </h4>
      <div className="grid gap-3">
        {deedTypes.map((deed) => (
          <div
            key={deed.name}
            className={cn(
              "p-3 rounded-lg border",
              deed.bgColor,
              "border-gray-200 dark:border-gray-700"
            )}
          >
            <div className="flex items-start gap-3">
              <Icon icon={deed.icon} className={cn("w-5 h-5 flex-shrink-0 mt-0.5", deed.color)} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">{deed.name}</span>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    deed.status === 'recommended' && "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200",
                    deed.status === 'caution' && "bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200",
                    deed.status === 'avoid' && "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200"
                  )}>
                    {deed.statusLabel}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {deed.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// COMPONENT: Step Card
// ============================================

interface StepCardProps {
  step: ForeignerStep;
  t: TranslationStrings;
  isExpanded: boolean;
  onToggle: () => void;
}

function StepCard({ step, t, isExpanded, onToggle }: StepCardProps) {
  const phaseConfig = PHASE_CONFIG[step.phase];
  
  return (
    <div 
      className={cn(
        "border rounded-lg overflow-hidden transition-all",
        phaseConfig.borderColor,
        step.important && "ring-2 ring-primary/20"
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 p-4 text-left",
          phaseConfig.bgColor,
          "hover:opacity-90 transition-opacity"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
          "bg-white dark:bg-gray-800",
          phaseConfig.color
        )}>
          {step.step}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white truncate">
              {step.title}
            </span>
            {step.important && (
              <span className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {t.importantStep}
              </span>
            )}
          </div>
        </div>
        <Icon 
          icon={isExpanded ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"} 
          className="w-5 h-5 text-gray-400 flex-shrink-0" 
        />
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {step.description}
              </p>
              {step.documents && step.documents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {t.requiredDocuments}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {step.documents.map((doc) => (
                      <span 
                        key={doc}
                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MAIN COMPONENT: BuyersGuide
// ============================================

interface BuyersGuideProps {
  buyerNationality: BuyerNationality;
  propertyType: PropertyType;
  t: TranslationStrings;
}

export function BuyersGuide({ buyerNationality, propertyType, t }: BuyersGuideProps) {
  const [expandedSteps, setExpandedSteps] = useState<number[]>([1, 6, 14]); // Start with important steps expanded
  const [activePhase, setActivePhase] = useState<ForeignerStep['phase'] | 'all'>('all');
  
  const steps = getForeignerSteps(t);
  const phases: (ForeignerStep['phase'] | 'all')[] = ['all', 'preparation', 'due_diligence', 'reservation', 'transfer', 'registration'];
  
  const filteredSteps = activePhase === 'all' 
    ? steps 
    : steps.filter(s => s.phase === activePhase);
  
  const toggleStep = (stepNum: number) => {
    setExpandedSteps(prev => 
      prev.includes(stepNum) 
        ? prev.filter(s => s !== stepNum)
        : [...prev, stepNum]
    );
  };
  
  const getPhaseLabel = (phase: ForeignerStep['phase'] | 'all') => {
    switch (phase) {
      case 'all': return 'All Steps';
      case 'preparation': return t.preparation;
      case 'due_diligence': return t.dueDiligence;
      case 'reservation': return t.reservation;
      case 'transfer': return t.transfer;
      case 'registration': return t.registration;
    }
  };

  return (
    <div className="space-y-6 pt-4">
      {/* FET Requirement Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
        <div className="flex items-start gap-3">
          <Icon icon="solar:document-add-bold" className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-200">{t.fetRequired}</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {t.fetRequiredDesc}
            </p>
          </div>
        </div>
      </div>
      
      {/* Title Deed Types */}
      <TitleDeedTypes t={t} />
      
      {/* Step-by-Step Guide */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon icon="solar:checklist-minimalistic-bold" className="w-5 h-5 text-primary" />
          {t.buyersGuide}
        </h4>
        
        {/* Phase Filter */}
        <div className="flex flex-wrap gap-2">
          {phases.map((phase) => (
            <button
              key={phase}
              onClick={() => setActivePhase(phase)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full transition-all",
                activePhase === phase
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {getPhaseLabel(phase)}
            </button>
          ))}
        </div>
        
        {/* Steps List */}
        <div className="space-y-2">
          {filteredSteps.map((step) => (
            <StepCard
              key={step.step}
              step={step}
              t={t}
              isExpanded={expandedSteps.includes(step.step)}
              onToggle={() => toggleStep(step.step)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default BuyersGuide;
