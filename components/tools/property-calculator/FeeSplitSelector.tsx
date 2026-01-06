"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { 
  TranslationStrings,
  FeeSplitPreset,
  FeeSplitConfig,
  FEE_SPLIT_PRESETS,
  FeeDistribution,
} from "@/lib/calculators/property-transfer";

// ============================================
// PRESET CONFIGURATIONS
// ============================================

interface PresetInfo {
  id: FeeSplitPreset;
  icon: string;
  color: string;
}

const PRESET_INFO: Record<Exclude<FeeSplitPreset, 'custom'>, PresetInfo> = {
  standard: {
    id: 'standard',
    icon: 'solar:scale-bold',
    color: 'text-blue-500',
  },
  buyer_pays_all: {
    id: 'buyer_pays_all',
    icon: 'solar:user-rounded-bold',
    color: 'text-green-500',
  },
  seller_pays_all: {
    id: 'seller_pays_all',
    icon: 'solar:home-bold',
    color: 'text-purple-500',
  },
  developer_standard: {
    id: 'developer_standard',
    icon: 'solar:buildings-2-bold',
    color: 'text-orange-500',
  },
};

// ============================================
// COMPONENT: Distribution Slider
// ============================================

interface DistributionSliderProps {
  label: string;
  distribution: FeeDistribution;
  onChange: (distribution: FeeDistribution) => void;
  disabled?: boolean;
  t: TranslationStrings;
}

function DistributionSlider({ label, distribution, onChange, disabled, t }: DistributionSliderProps) {
  const handleChange = (buyerPercent: number) => {
    onChange({
      buyerPercent,
      sellerPercent: 100 - buyerPercent,
    });
  };

  return (
    <div className={cn("space-y-2", disabled && "opacity-50 pointer-events-none")}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-green-600 dark:text-green-400 font-medium">
            {t.buyerPercentage}: {distribution.buyerPercent}%
          </span>
          <span className="text-gray-400">/</span>
          <span className="text-purple-600 dark:text-purple-400 font-medium">
            {t.sellerPercentage}: {distribution.sellerPercent}%
          </span>
        </div>
      </div>
      
      <div className="relative">
        {/* Background bar */}
        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          {/* Buyer portion (green) */}
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-200"
            style={{ width: `${distribution.buyerPercent}%` }}
          />
        </div>
        
        {/* Slider input */}
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={distribution.buyerPercent}
          onChange={(e) => handleChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled}
        />
        
        {/* Tick marks */}
        <div className="flex justify-between mt-1 px-0.5">
          {[0, 25, 50, 75, 100].map((tick) => (
            <div key={tick} className="flex flex-col items-center">
              <div className="w-0.5 h-1.5 bg-gray-300 dark:bg-gray-600" />
              <span className="text-[10px] text-gray-400 mt-0.5">{tick}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT: FeeSplitSelector
// ============================================

interface FeeSplitSelectorProps {
  preset: FeeSplitPreset;
  customConfig?: FeeSplitConfig;
  onPresetChange: (preset: FeeSplitPreset) => void;
  onCustomConfigChange: (config: FeeSplitConfig) => void;
  isDeveloper?: boolean;
  t: TranslationStrings;
}

export function FeeSplitSelector({
  preset,
  customConfig,
  onPresetChange,
  onCustomConfigChange,
  isDeveloper = false,
  t,
}: FeeSplitSelectorProps) {
  const [showCustom, setShowCustom] = useState(preset === 'custom');
  
  // Get current config based on preset or custom
  const currentConfig = preset === 'custom' && customConfig 
    ? customConfig 
    : FEE_SPLIT_PRESETS[preset === 'custom' ? 'standard' : preset];
  
  const getPresetLabel = (presetId: FeeSplitPreset): string => {
    switch (presetId) {
      case 'standard': return t.standardSplit;
      case 'buyer_pays_all': return t.buyerPaysAll;
      case 'seller_pays_all': return t.sellerPaysAll;
      case 'developer_standard': return t.developerStandard;
      case 'custom': return t.customSplit;
    }
  };
  
  const handlePresetSelect = (newPreset: FeeSplitPreset) => {
    onPresetChange(newPreset);
    setShowCustom(newPreset === 'custom');
    
    // If switching to custom, initialize with current preset values
    if (newPreset === 'custom' && !customConfig) {
      onCustomConfigChange(FEE_SPLIT_PRESETS.standard);
    }
  };
  
  const updateCustomConfig = (key: keyof FeeSplitConfig, distribution: FeeDistribution) => {
    const newConfig = {
      ...currentConfig,
      [key]: distribution,
    };
    onCustomConfigChange(newConfig);
  };
  
  // Available presets based on context
  const availablePresets: FeeSplitPreset[] = isDeveloper
    ? ['developer_standard', 'standard', 'custom']
    : ['standard', 'buyer_pays_all', 'seller_pays_all', 'custom'];

  return (
    <div className="space-y-4">
      {/* Preset Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.feeSplit}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {t.feeSplitHelp}
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {availablePresets.map((presetId) => {
            const info = presetId !== 'custom' ? PRESET_INFO[presetId] : null;
            const isSelected = preset === presetId;
            
            return (
              <button
                key={presetId}
                onClick={() => handlePresetSelect(presetId)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <Icon 
                  icon={info?.icon || 'solar:settings-bold'} 
                  className={cn(
                    "w-6 h-6",
                    isSelected ? "text-primary" : (info?.color || "text-gray-400")
                  )}
                />
                <span className={cn(
                  "text-xs font-medium text-center",
                  isSelected ? "text-primary" : "text-gray-600 dark:text-gray-400"
                )}>
                  {getPresetLabel(presetId)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Custom Configuration Panel */}
      <AnimatePresence>
        {showCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="solar:settings-bold" className="w-5 h-5 text-primary" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {t.customizeFeeSplit}
                </span>
              </div>
              
              <DistributionSlider
                label={t.transferFee}
                distribution={currentConfig.transferFee}
                onChange={(d) => updateCustomConfig('transferFee', d)}
                t={t}
              />
              
              <DistributionSlider
                label={t.specificBusinessTax}
                distribution={currentConfig.specificBusinessTax}
                onChange={(d) => updateCustomConfig('specificBusinessTax', d)}
                t={t}
              />
              
              <DistributionSlider
                label={t.stampDuty}
                distribution={currentConfig.stampDuty}
                onChange={(d) => updateCustomConfig('stampDuty', d)}
                t={t}
              />
              
              <DistributionSlider
                label={t.withholdingTax}
                distribution={currentConfig.withholdingTax}
                onChange={(d) => updateCustomConfig('withholdingTax', d)}
                t={t}
              />
              
              <DistributionSlider
                label={t.mortgageRegistration}
                distribution={currentConfig.mortgageRegistration}
                onChange={(d) => updateCustomConfig('mortgageRegistration', d)}
                t={t}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Current Split Summary */}
      {preset !== 'custom' && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-xs text-gray-600 dark:text-gray-400">
          {/* Check if all fees have the same split */}
          {currentConfig.transferFee.buyerPercent === currentConfig.specificBusinessTax.buyerPercent &&
           currentConfig.transferFee.buyerPercent === currentConfig.stampDuty.buyerPercent &&
           currentConfig.transferFee.buyerPercent === currentConfig.withholdingTax.buyerPercent ? (
            // Unified split display
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-purple-500" />
                <span className="font-medium">
                  {currentConfig.transferFee.buyerPercent === 50 
                    ? `All Costs: 50% ${t.buyer} / 50% ${t.seller}`
                    : currentConfig.transferFee.buyerPercent === 100 
                      ? `All Costs: ${t.buyer} pays 100%`
                      : `All Costs: ${t.seller} pays 100%`
                  }
                </span>
              </div>
              {currentConfig.mortgageRegistration.buyerPercent === 100 && (
                <span className="text-gray-400">
                  ({t.mortgageRegistration}: {t.buyer})
                </span>
              )}
            </div>
          ) : (
            // Individual fee display (for developer_standard or mixed splits)
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Transfer: {currentConfig.transferFee.buyerPercent}/{currentConfig.transferFee.sellerPercent}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>SBT: {currentConfig.specificBusinessTax.buyerPercent}/{currentConfig.specificBusinessTax.sellerPercent}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Stamp: {currentConfig.stampDuty.buyerPercent}/{currentConfig.stampDuty.sellerPercent}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>WHT: {currentConfig.withholdingTax.buyerPercent}/{currentConfig.withholdingTax.sellerPercent}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FeeSplitSelector;
