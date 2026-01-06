"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { TranslationStrings, getTranslations } from "@/lib/calculators/property-transfer";

// ============================================
// TYPES
// ============================================

interface EmbedOptions {
  width: string;
  height: string;
  theme: "light" | "dark" | "auto";
  showBorder: boolean;
}

// ============================================
// COMPONENT
// ============================================

interface EmbedCodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  t?: TranslationStrings;
}

export function EmbedCodeGenerator({ isOpen, onClose, t: externalT }: EmbedCodeGeneratorProps) {
  // Fallback to English if no translations provided
  const t = externalT || getTranslations('en');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [options, setOptions] = useState<EmbedOptions>({
    width: "100%",
    height: "600",
    theme: "light",
    showBorder: true,
  });
  
  // Generate embed code
  const embedCode = useMemo(() => {
    const baseUrl = "https://www.psmphuket.com/embed/property-transfer-calculator";
    const params = new URLSearchParams();
    
    if (options.theme !== "light") {
      params.set("theme", options.theme);
    }
    
    const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    
    const borderStyle = options.showBorder ? 'border: 1px solid #e5e7eb; border-radius: 12px;' : '';
    
    return `<iframe
  src="${url}"
  width="${options.width}"
  height="${options.height}"
  frameborder="0"
  style="${borderStyle} overflow: hidden;"
  title="Thailand Property Transfer Fee Calculator"
  loading="lazy"
></iframe>`;
  }, [options]);
  
  // Copy to clipboard
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Icon icon="solar:code-bold" className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t.embedTitle}
                </h2>
                <p className="text-xs text-gray-500">
                  {t.embedDescription}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Icon icon="solar:close-circle-linear" className="w-5 h-5" />
            </button>
          </div>
          
          {/* Options */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {/* Width */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t.width}
              </label>
              <select
                value={options.width}
                onChange={(e) => setOptions({ ...options, width: e.target.value })}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-0 text-sm"
              >
                <option value="100%">100% (Responsive)</option>
                <option value="600px">600px</option>
                <option value="800px">800px</option>
                <option value="1000px">1000px</option>
              </select>
            </div>
            
            {/* Height */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t.height}
              </label>
              <select
                value={options.height}
                onChange={(e) => setOptions({ ...options, height: e.target.value })}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-0 text-sm"
              >
                <option value="500">500px (Compact)</option>
                <option value="600">600px (Recommended)</option>
                <option value="700">700px</option>
                <option value="800">800px</option>
              </select>
            </div>
            
            {/* Theme */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Theme
              </label>
              <div className="flex gap-2">
                {(['light', 'dark', 'auto'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setOptions({ ...options, theme })}
                    className={cn(
                      "flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all capitalize",
                      options.theme === theme
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                    )}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Border */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Border
              </label>
              <button
                onClick={() => setOptions({ ...options, showBorder: !options.showBorder })}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all",
                  options.showBorder
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                )}
              >
                <span className="text-sm">Show border</span>
                <Icon
                  icon={options.showBorder ? "solar:check-circle-bold" : "solar:close-circle-linear"}
                  className="w-5 h-5"
                />
              </button>
            </div>
          </div>
          
          {/* Code block */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.embedCode}
              </label>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Icon icon="solar:eye-linear" className="w-4 h-4" />
                {t.preview}
              </button>
            </div>
            
            <div className="relative">
              <pre className="p-4 bg-gray-900 rounded-xl text-sm text-green-400 overflow-x-auto">
                <code>{embedCode}</code>
              </pre>
              
              <button
                onClick={copyToClipboard}
                className={cn(
                  "absolute top-2 right-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {copied ? (
                  <span className="flex items-center gap-1">
                    <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                    {t.codeCopied}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Icon icon="solar:copy-linear" className="w-4 h-4" />
                    {t.copyCode}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Preview */}
          {showPreview && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t.preview}
              </label>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
                <iframe
                  src={`https://www.psmphuket.com/embed/property-transfer-calculator${options.theme !== 'light' ? `?theme=${options.theme}` : ''}`}
                  width="100%"
                  height="400"
                  frameBorder="0"
                  title="Calculator Preview"
                  className="rounded-lg"
                />
              </div>
            </div>
          )}
          
          {/* Terms */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
              <Icon icon="solar:info-circle-bold" className="w-4 h-4" />
              Embedding Guidelines
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <li className="flex items-start gap-2">
                <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                <span>100% free to use on any website</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                <span>No branding or attribution required</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Calculator is updated automatically with latest tax rates</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Responsive design - works on all devices</span>
              </li>
            </ul>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={copyToClipboard}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Icon icon="solar:copy-bold" className="w-5 h-5" />
              {copied ? t.codeCopied : t.copyCode}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default EmbedCodeGenerator;
