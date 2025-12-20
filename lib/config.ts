/**
 * Application Configuration
 * 
 * Developer: Jack Wullems
 * Contact: jackwullems18@gmail.com
 */

export const APP_CONFIG = {
  name: "PSM Phuket",
  version: "0.1.0",
  
  developer: {
    name: "Jack Wullems",
    email: "jackwullems18@gmail.com",
  },
  
  meta: {
    description: "Real Estate Platform - PSM Phuket",
    createdAt: "2024",
  },
} as const;

export const DEVELOPER_INFO = {
  name: "Jack Wullems",
  email: "jackwullems18@gmail.com",
} as const;

export type AppConfig = typeof APP_CONFIG;
export type DeveloperInfo = typeof DEVELOPER_INFO;





