import React, { useState, useEffect, useCallback } from 'react';

const BrowserSupportCheck = ({ children, isMobile }) => {
  const [isBrowserSupported, setIsBrowserSupported] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({ name: 'Unknown', device: 'Unknown', os: 'Unknown' });

  const getBrowserAndDevice = useCallback(() => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform; // Can be helpful for iOS device distinction
    const maxTouchPoints = navigator.maxTouchPoints || 0;

    let name = 'Unknown';
    let device = 'Unknown';
    let os = 'Unknown';

    // OS Detection
    if (/android/i.test(userAgent)) {
      os = 'Android';
    } else if (/iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)) {
      os = 'iOS'; // platform === 'MacIntel' && maxTouchPoints > 1 is a common check for modern iPads
    } else if (/windows phone/i.test(userAgent)) {
      os = 'Windows Phone';
    } else if (/windows/i.test(userAgent)) {
      os = 'Windows';
    } else if (/macintosh|mac os x/i.test(userAgent)) {
      os = 'macOS';
    } else if (/linux/i.test(userAgent)) {
      os = 'Linux';
    }

    // Device Detection (primarily for iOS)
    if (os === 'iOS') {
      if (/iPhone/i.test(userAgent)) {
        device = 'iPhone';
      } else if (/iPad/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1 && !/iPhone/i.test(userAgent))) {
        // Added !/iPhone/ to avoid misidentifying iPod Touches reported as MacIntel if that ever happens
        device = 'iPad';
      } else if (/iPod/i.test(userAgent)) {
        device = 'iPod';
      } else {
        device = 'iOS Device'; // Generic iOS if specific model isn't clear
      }
    } else if (os === 'Android') {
        // More granular Android device type detection could be added here if needed
        device = 'Android Device';
    }


    // Browser Detection
    if (userAgent.includes('CriOS')) { // Chrome on iOS
      name = `Chrome for iOS`;
    } else if (userAgent.includes('FxiOS')) { // Firefox on iOS
      name = `Firefox for iOS`;
    } else if (userAgent.includes('Safari') && os === 'iOS' && !userAgent.includes('CriOS') && !userAgent.includes('FxiOS')) {
      name = `Safari on iOS`; // This will be further specified by 'device'
    } else if (userAgent.includes("Chrome") && !userAgent.includes("Edg") && !userAgent.includes("OPR")) { // Edg for Edge, OPR for Opera
      name = userAgent.includes("Android") ? "Chrome for Android" : "Chrome";
    } else if (userAgent.includes("Firefox")) {
      name = userAgent.includes("Android") ? "Firefox for Android" : "Firefox";
    } else if (userAgent.includes("SamsungBrowser")) {
      name = "Samsung Internet";
    } else if (userAgent.includes("Opera Mini")) {
      name = "Opera Mini";
    } else if (userAgent.includes("OPR/") || userAgent.includes("Opera")) {
      name = userAgent.includes("Mobi") ? "Opera Mobile" : "Opera";
    } else if (userAgent.includes("UCBrowser")) {
      name = "UC Browser"; // Typically Android
    } else if (userAgent.includes("MSIE") || userAgent.includes("Trident/")) {
      name = "Internet Explorer";
    } else if (userAgent.includes("Edge") || userAgent.includes("Edg")) {
      name = "Edge";
    } else if (userAgent.includes("Safari") && os === 'macOS') {
      name = "Safari on macOS";
    } else if (os === 'Android' && userAgent.includes('wv')) { // Android WebView
        name = "Android WebView";
    } else if (os === 'Android' && !userAgent.includes("Chrome")) { // Generic Android Browser
        name = "Android Browser";
    }
     else if (userAgent.includes("QQBrowser")) {
      name = "QQ Browser";
    } else if (userAgent.includes("Baidu")) {
      name = "Baidu Browser";
    } else if (userAgent.includes("KaiOS")) {
      name = "KaiOS Browser";
    }


    // Refine name based on device for iOS
    if (os === 'iOS') {
        if (name === 'Chrome for iOS') {
            name = device === 'iPhone' ? 'Chrome on iPhone' : (device === 'iPad' ? 'Chrome on iPad' : 'Chrome for iOS');
        } else if (name === 'Firefox for iOS') {
            name = device === 'iPhone' ? 'Firefox on iPhone' : (device === 'iPad' ? 'Firefox on iPad' : 'Firefox for iOS');
        } else if (name === 'Safari on iOS') {
             name = device === 'iPhone' ? 'Safari on iPhone' : (device === 'iPad' ? 'Safari on iPad' : 'Safari on iOS');
        }
    }


    return { name, device, os, userAgent };
  }, []);

  useEffect(() => {
    const info = getBrowserAndDevice();
    setBrowserInfo(info);
    console.log("Detected browser/device:", info);

    if (!isMobile) {
      // For non-mobile, you might still want to check fullscreen support
      // or assume it's generally better supported on desktop.
      // For this example, we'll check universally.
      // setIsBrowserSupported(false); // Original logic
      // return;
    }

    // Feature detection for Fullscreen API
    const isFsEnabled = 
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled;

    setIsBrowserSupported(!!isFsEnabled);

    // Specific nuance for iPhone Safari if you want to be very cautious
    // due to historical lack of support for general elements or specific UX issues.
    if (info.name === 'Safari on iPhone' && isFsEnabled) {
      // You could add further logic here if needed, e.g., based on Safari version
      // if you could parse that from the userAgent, or simply note its known behavior.
      console.log("Fullscreen API is enabled on Safari on iPhone, but be mindful of UX and element support.");
    }
    if (info.name === 'Safari on iPad' && isFsEnabled) {
      console.log("Fullscreen API is enabled on Safari on iPad; note potential overlay button and swipe behavior.");
    }

  }, [isMobile, getBrowserAndDevice]);

  // Render children only if isMobile AND browser supports fullscreen API
  // Or, if you want to enable for desktop too, adjust the condition.
  if (isMobile && isBrowserSupported) {
    return <>{children}</>;
  }
  
  // Fallback: if not mobile but supported, or if you change the condition above
  if (!isMobile && isBrowserSupported) {
     // return <>{children}</>; // Uncomment if you want to support non-mobile too
  }

  return null; // Don't render anything if conditions aren't met
};

export default BrowserSupportCheck;