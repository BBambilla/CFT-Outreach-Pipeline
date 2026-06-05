import React from 'react';

// ----------------------------------------------------------------------
// HOW TO UPDATE YOUR LOGO:
// 1. Upload your image to Cloudinary (or any image hosting service).
// 2. Copy the direct image URL (usually starting with https://res.cloudinary.com/...)
// 3. Paste the URL inside the quotes below:
// ----------------------------------------------------------------------
const LOGO_URL = "https://res.cloudinary.com/dtbejb9lk/image/upload/v1779797807/Eco-badge-2_q64lgr.png"; 

export function Logo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <img 
      src={LOGO_URL} 
      alt="Climate Friendly Travel Logo" 
      className={`object-contain ${className}`}
    />
  );
}

