/**
 * Static SVG Icons - Pre-bundled for critical path rendering
 * 
 * These icons are inlined to eliminate Iconify API calls that block LCP.
 * Only includes icons used in the header and other critical above-the-fold components.
 */

import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
  className?: string;
};

// Phosphor Icons (ph:*)
export const EnvelopeIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" className={className} {...props}>
    <path fill="currentColor" d="M224 48H32a8 8 0 0 0-8 8v136a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V56a8 8 0 0 0-8-8m-96 85.15L52.57 64h150.86ZM98.71 128L40 181.81V74.19Zm11.84 10.85l12 11.05a8 8 0 0 0 10.82 0l12-11.05l58 53.15H52.57ZM157.29 128L216 74.18v107.64Z"/>
  </svg>
);

export const PhoneIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" className={className} {...props}>
    <path fill="currentColor" d="m222.37 158.46l-47.11-21.11l-.13-.06a16 16 0 0 0-15.17 1.4a8 8 0 0 0-.75.56L134.87 160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16 16 0 0 0 1.32-15.06v-.12L97.54 33.64a16 16 0 0 0-16.62-9.52A56.26 56.26 0 0 0 32 80c0 79.4 64.6 144 144 144a56.26 56.26 0 0 0 55.88-48.92a16 16 0 0 0-9.51-16.62M176 208A128.14 128.14 0 0 1 48 80a40.2 40.2 0 0 1 34.87-40a.6.6 0 0 0 0 .12l21 47l-20.67 24.74a6.1 6.1 0 0 0-.57.77a16 16 0 0 0-1 15.7c9.06 18.53 27.73 37.06 46.46 46.11a16 16 0 0 0 15.75-1.14a8 8 0 0 0 .74-.56L168.89 152l47 21.05h.11A40.21 40.21 0 0 1 176 208"/>
  </svg>
);

export const PhoneBoldIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" className={className} {...props}>
    <path fill="currentColor" d="m224.4 154.8l-47.1-21.1a20 20 0 0 0-19 1.7l-22.6 15.1a72 72 0 0 1-29-29l15.1-22.6a20 20 0 0 0 1.7-19l-21.1-47.1a20 20 0 0 0-20.8-11.9A60.26 60.26 0 0 0 28 80c0 83.1 67.9 152 152 152a60.3 60.3 0 0 0 56.1-52.6a20 20 0 0 0-11.7-24.6M176 208c-70.6 0-128-57.4-128-128a36.2 36.2 0 0 1 31.2-36h.4l18.8 42l-15 22.5a20 20 0 0 0-1.2 19.6c11.3 23.3 32.3 44.3 55.6 55.6a20 20 0 0 0 19.6-1.2l22.5-15l42 18.8V176a36.2 36.2 0 0 1-36 32"/>
  </svg>
);

export const CaretDownBoldIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" className={className} {...props}>
    <path fill="currentColor" d="m216.49 104.49l-80 80a12 12 0 0 1-17 0l-80-80a12 12 0 0 1 17-17L128 159l71.51-71.52a12 12 0 0 1 17 17Z"/>
  </svg>
);

export const ArrowRightBoldIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" className={className} {...props}>
    <path fill="currentColor" d="m224.49 136.49l-72 72a12 12 0 0 1-17-17L187 140H40a12 12 0 0 1 0-24h147l-51.49-51.52a12 12 0 0 1 17-17l72 72a12 12 0 0 1-.02 17.01"/>
  </svg>
);

export const ArrowRightIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" className={className} {...props}>
    <path fill="currentColor" d="m221.66 133.66l-72 72a8 8 0 0 1-11.32-11.32L196.69 136H40a8 8 0 0 1 0-16h156.69l-58.35-58.34a8 8 0 0 1 11.32-11.32l72 72a8 8 0 0 1 0 11.32"/>
  </svg>
);

export const TagBoldIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" className={className} {...props}>
    <path fill="currentColor" d="M246.15 133.18L146.83 33.86A19.85 19.85 0 0 0 132.69 28H40a12 12 0 0 0-12 12v92.69a19.85 19.85 0 0 0 5.86 14.14l99.32 99.32a20 20 0 0 0 28.28 0l84.69-84.69a20 20 0 0 0 0-28.28M147 224.11L52 129.14V52h77.14l95 95ZM100 84a16 16 0 1 1-16-16a16 16 0 0 1 16 16"/>
  </svg>
);

export const ListIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" className={className} {...props}>
    <path fill="currentColor" d="M224 128a8 8 0 0 1-8 8H40a8 8 0 0 1 0-16h176a8 8 0 0 1 8 8M40 72h176a8 8 0 0 0 0-16H40a8 8 0 0 0 0 16m176 112H40a8 8 0 0 0 0 16h176a8 8 0 0 0 0-16"/>
  </svg>
);

export const XIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" className={className} {...props}>
    <path fill="currentColor" d="M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128L50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z"/>
  </svg>
);

export const MapPinIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" className={className} {...props}>
    <path fill="currentColor" d="M128 64a40 40 0 1 0 40 40a40 40 0 0 0-40-40m0 64a24 24 0 1 1 24-24a24 24 0 0 1-24 24m0-112a88.1 88.1 0 0 0-88 88c0 31.4 14.51 64.68 42 96.25a254.2 254.2 0 0 0 41.45 38.3a8 8 0 0 0 9.18 0a254.2 254.2 0 0 0 41.37-38.3c27.45-31.57 42-64.85 42-96.25a88.1 88.1 0 0 0-88-88m0 206c-16.53-13-72-60.75-72-118a72 72 0 0 1 144 0c0 57.23-55.47 105-72 118"/>
  </svg>
);

export const HouseSimpleFillIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" className={className} {...props}>
    <path fill="currentColor" d="m218.83 103.77l-80-75.48a1.14 1.14 0 0 1-.11-.11a16 16 0 0 0-21.53 0l-.11.11l-79.91 75.48A16 16 0 0 0 32 115.55V208a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16v-92.45a16 16 0 0 0-5.17-11.78"/>
  </svg>
);

// Remix Icons (ri:*)
export const FacebookFillIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className={className} {...props}>
    <path fill="currentColor" d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z"/>
  </svg>
);

export const InstagramLineIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className={className} {...props}>
    <path fill="currentColor" d="M12 2c2.717 0 3.056.01 4.122.06c1.065.05 1.79.217 2.428.465c.66.254 1.216.598 1.772 1.153a4.9 4.9 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428c.047 1.066.06 1.405.06 4.122s-.01 3.056-.06 4.122c-.05 1.065-.218 1.79-.465 2.428a4.9 4.9 0 0 1-1.153 1.772a4.9 4.9 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465c-1.066.047-1.405.06-4.122.06s-3.056-.01-4.122-.06c-1.065-.05-1.79-.218-2.428-.465a4.9 4.9 0 0 1-1.772-1.153a4.9 4.9 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12s.01-3.056.06-4.122c.05-1.066.217-1.79.465-2.428a4.9 4.9 0 0 1 1.153-1.772A4.9 4.9 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2m0 1.802c-2.67 0-2.986.01-4.04.058c-.976.045-1.505.207-1.858.344c-.466.182-.8.398-1.15.748s-.566.684-.748 1.15c-.137.353-.3.882-.344 1.857c-.048 1.055-.058 1.37-.058 4.041s.01 2.986.058 4.04c.045.976.207 1.505.344 1.858c.182.466.399.8.748 1.15s.684.566 1.15.748c.353.137.882.3 1.857.344c1.054.048 1.37.058 4.041.058s2.986-.01 4.04-.058c.976-.045 1.505-.207 1.858-.344c.466-.182.8-.398 1.15-.748s.566-.684.748-1.15c.137-.353.3-.882.344-1.857c.048-1.055.058-1.37.058-4.041s-.01-2.986-.058-4.04c-.045-.976-.207-1.505-.344-1.858a3.1 3.1 0 0 0-.748-1.15a3.1 3.1 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344c-1.055-.048-1.37-.058-4.041-.058m0 3.063a5.135 5.135 0 1 1 0 10.27a5.135 5.135 0 0 1 0-10.27m0 8.468a3.333 3.333 0 1 0 0-6.666a3.333 3.333 0 0 0 0 6.666m6.538-8.671a1.2 1.2 0 1 1-2.4 0a1.2 1.2 0 0 1 2.4 0"/>
  </svg>
);

export const LinkedinFillIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className={className} {...props}>
    <path fill="currentColor" d="M6.94 5a2 2 0 1 1-4-.002a2 2 0 0 1 4 .002M7 8.48H3V21h4zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91z"/>
  </svg>
);

export const YoutubeFillIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className={className} {...props}>
    <path fill="currentColor" d="m10 15l5.19-3L10 9zm11.56-7.83c.13.47.22 1.1.28 1.9c.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83c-.25.9-.83 1.48-1.73 1.73c-.47.13-1.33.22-2.65.28c-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44c-.9-.25-1.48-.83-1.73-1.73c-.13-.47-.22-1.1-.28-1.9c-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83c.25-.9.83-1.48 1.73-1.73c.47-.13 1.33-.22 2.65-.28c1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44c.9.25 1.48.83 1.73 1.73"/>
  </svg>
);

export const LineFillIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className={className} {...props}>
    <path fill="currentColor" d="M22 10.69c0-1.31-.24-2.56-.68-3.71a9 9 0 0 0-1.88-3.05a9.5 9.5 0 0 0-2.93-2.12A10 10 0 0 0 12.8 1a10.5 10.5 0 0 0-3.71.68a9.5 9.5 0 0 0-3.05 1.88a9 9 0 0 0-2.12 2.93A9.8 9.8 0 0 0 3.24 10a9 9 0 0 0 .46 2.79a11.2 11.2 0 0 0 1.37 2.76a18 18 0 0 0 2.16 2.7c.85.87 1.81 1.77 2.89 2.7a29 29 0 0 0 2.08 1.69l.14.09c.17.11.34.17.52.17a.9.9 0 0 0 .69-.28c.17-.19.26-.43.26-.72v-2.07c3.18-.35 5.8-1.53 7.61-3.48c1.51-1.64 2.58-3.9 2.58-5.66M7.87 12.39a.55.55 0 0 1-.54.54H5.5a.55.55 0 0 1-.54-.54V8.45c0-.3.24-.54.54-.54s.54.24.54.54v3.4h1.29c.3 0 .54.24.54.54m1.51 0a.55.55 0 0 1-.54.54a.55.55 0 0 1-.54-.54V8.45c0-.3.24-.54.54-.54s.54.24.54.54zm4.28 0a.55.55 0 0 1-.54.54a.54.54 0 0 1-.43-.22l-1.83-2.48v2.16a.55.55 0 0 1-.54.54a.55.55 0 0 1-.54-.54V8.45a.55.55 0 0 1 .54-.54c.16 0 .32.08.43.22l1.83 2.48V8.45c0-.3.24-.54.54-.54s.54.24.54.54zm3.13-2.87c.3 0 .54.24.54.54s-.24.54-.54.54h-1.29v.72h1.29c.3 0 .54.24.54.54a.55.55 0 0 1-.54.54h-1.83a.55.55 0 0 1-.54-.54V8.45c0-.3.24-.54.54-.54h1.83c.3 0 .54.24.54.54s-.24.54-.54.54h-1.29v.53z"/>
  </svg>
);

export const WhatsappFillIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className={className} {...props}>
    <path fill="currentColor" d="M7.253 18.494l.724.423A7.95 7.95 0 0 0 12 20a8 8 0 1 0-8-8a7.95 7.95 0 0 0 1.084 4.024l.422.724l-.653 2.401zM2.004 22l1.352-4.968A9.95 9.95 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10a9.95 9.95 0 0 1-5.03-1.355zM8.391 7.308c.134-.01.269-.01.403-.004c.054.004.108.01.162.016c.159.018.334.115.393.249c.298.676.588 1.357.868 2.04c.062.152.025.347-.093.537a4 4 0 0 1-.263.372c-.113.145-.356.411-.356.411s-.099.118-.061.265c.014.056.06.137.102.205l.059.095c.256.427.6.86 1.02 1.268c.12.116.237.235.363.346c.468.413.998.75 1.57 1l.005.002c.085.037.128.057.252.11c.062.026.126.049.191.066a.35.35 0 0 0 .367-.13c.724-.877.79-.934.796-.934v.002a.48.48 0 0 1 .378-.127c.06.004.121.015.177.04c.531.243 1.4.622 1.4.622l.582.261c.098.047.187.158.19.265c.004.067.01.175-.013.373c-.032.259-.11.57-.188.733a1.16 1.16 0 0 1-.21.302a2.4 2.4 0 0 1-.33.288a3.5 3.5 0 0 1-.125.09a5 5 0 0 1-.383.22a2 2 0 0 1-.833.23c-.185.01-.37.024-.556.014c-.008 0-.568-.087-.568-.087a9.4 9.4 0 0 1-3.84-2.046c-.226-.199-.435-.413-.649-.626c-.89-.885-1.562-1.84-1.97-2.742A3.5 3.5 0 0 1 6.9 9.62a2.7 2.7 0 0 1 .564-1.68c.073-.094.142-.192.261-.305c.127-.12.207-.184.294-.228a.96.96 0 0 1 .371-.1"/>
  </svg>
);

// Solar Icons
export const SunBoldIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className={className} {...props}>
    <path fill="currentColor" d="M12 17a5 5 0 1 0 0-10a5 5 0 0 0 0 10m0-13.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 .75-.75m0 15.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75m7.5-7.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75m-15.5 0a.75.75 0 0 1-.75.75H2.5a.75.75 0 0 1 0-1.5h.75a.75.75 0 0 1 .75.75M17.303 5.64l1.06 1.061a.75.75 0 0 1-1.06 1.06l-1.061-1.06a.75.75 0 0 1 1.06-1.061m-11.667 11.66l1.061 1.061a.75.75 0 1 1-1.06 1.06l-1.061-1.06a.75.75 0 0 1 1.06-1.06M5.636 5.64a.75.75 0 0 1 1.06 0l1.061 1.061a.75.75 0 1 1-1.06 1.06L5.636 6.7a.75.75 0 0 1 0-1.06m11.667 11.66a.75.75 0 0 1 1.06 0l1.061 1.061a.75.75 0 1 1-1.06 1.06l-1.061-1.06a.75.75 0 0 1 0-1.06"/>
  </svg>
);

export const MoonBoldIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className={className} {...props}>
    <path fill="currentColor" d="M20.958 15.325c.204-.486-.379-.9-.868-.684a7.7 7.7 0 0 1-3.101.648c-4.185 0-7.577-3.324-7.577-7.425a7.3 7.3 0 0 1 1.134-3.91c.284-.448-.057-1.068-.577-.936C5.96 4.041 3 7.613 3 11.862C3 16.909 7.175 21 12.326 21c3.9 0 7.24-2.345 8.632-5.675"/>
  </svg>
);

/**
 * Icon component that maps icon names to static SVGs
 * Use this as a drop-in replacement for Iconify Icon in critical components
 */
const iconMap: Record<string, React.FC<IconProps>> = {
  'ph:envelope': EnvelopeIcon,
  'ph:phone': PhoneIcon,
  'ph:phone-bold': PhoneBoldIcon,
  'ph:caret-down-bold': CaretDownBoldIcon,
  'ph:arrow-right': ArrowRightIcon,
  'ph:arrow-right-bold': ArrowRightBoldIcon,
  'ph:tag-bold': TagBoldIcon,
  'ph:list': ListIcon,
  'ph:x': XIcon,
  'ph:map-pin': MapPinIcon,
  'ph:house-simple-fill': HouseSimpleFillIcon,
  'ri:facebook-fill': FacebookFillIcon,
  'ri:instagram-line': InstagramLineIcon,
  'ri:linkedin-fill': LinkedinFillIcon,
  'ri:youtube-fill': YoutubeFillIcon,
  'ri:line-fill': LineFillIcon,
  'ri:whatsapp-fill': WhatsappFillIcon,
  'solar:sun-bold': SunBoldIcon,
  'solar:moon-bold': MoonBoldIcon,
};

interface StaticIconProps extends IconProps {
  icon: string;
}

/**
 * StaticIcon - Drop-in replacement for Iconify Icon
 * Falls back to empty span for unmapped icons (will be hydrated by Iconify later)
 */
export const StaticIcon: React.FC<StaticIconProps> = ({ icon, className, ...props }) => {
  const IconComponent = iconMap[icon];
  
  if (IconComponent) {
    return <IconComponent className={className} {...props} />;
  }
  
  // Return placeholder that Iconify can hydrate later
  return <span className={`iconify ${className || ''}`} data-icon={icon} {...props} />;
};

export default StaticIcon;

