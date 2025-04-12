/**
 * Configuration file that centralizes access to environment variables
 */

// Firebase Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDQWyewzgYZODxuZgRQ30Q6zcHKxFxRFiA",
  authDomain: "accelerate-trials-cf6f4.firebaseapp.com",
  projectId: "accelerate-trials-cf6f4",
  storageBucket: "accelerate-trials-cf6f4.appspot.com",
  messagingSenderId: "180818175374",
  appId: "1:180818175374:web:9da41ee980a2309eb3b0df",
  measurementId: "G-QLTFK58Q4V"
};

// Admin accounts configuration
export const adminConfig = {
  // Parse comma-separated admin emails from environment variable
  adminEmails: import.meta.env.VITE_ADMIN_EMAILS?.split(',') || [],
};

// OpenAI configuration
export const openAIConfig = {
  apiKey: import.meta.env.VITE_OPENAI_API_KEY
};

// Security configuration
export const securityConfig = {
  // Check if an email is an admin email
  isAdminEmail: (email: string | null | undefined): boolean => {
    if (!email) return false;
    return adminConfig.adminEmails.includes(email);
  }
};