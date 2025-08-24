// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async'; // Import HelmetProvider
import MainExperience from './MainExperience'; // Import the component we just created
import WaiverPage from './components/WaiverPage'; // Your waiver page
import ServicesPage from './components/ServicesPage'; // Import the new ServicesPage
import FaqPage from './components/FaqPage'; // Import the new FaqPage
import StructuredData from './components/StructuredData'; // Import StructuredData
// Import new content pages
import RecordCleaningProcessPage from './components/RecordCleaningProcessPage';
import WhyChooseUsPage from './components/WhyChooseUsPage';
import BenefitsPage from './components/BenefitsPage';
import VinylFAQPage from './components/VinylFAQPage';
import ContactPage from './components/ContactPage'; // <<< IMPORT NEW PAGE
import Footer from './components/Footer'; // <<< IMPORT FOOTER
import './App.css'; // Your existing App.css for global styles if any

// Optional: A simple component for a "Not Found" page
const NotFound = () => (
  <div style={{ textAlign: 'center', marginTop: '50px' }}>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <Link to="/">Go to Homepage</Link>
  </div>
);

// MODIFIED: Extracted Routes into a new component to use useLocation
const AppRoutes = () => {
  const location = useLocation();
  const showFooter = location.pathname !== '/';

  useEffect(() => {
    const scrollablePages = [
      '/waiver',
      '/services',
      '/faq',
      '/why-choose-us-minnesota',
      '/vinyl-care-faq-minnesota',
      '/benefits-record-cleaning-minnesota',
      '/record-cleaning-process',
      '/contact'
    ];

    if (scrollablePages.includes(location.pathname)) {
      document.body.style.overflow = 'auto';
    } else {
      document.body.style.overflow = 'hidden'; // Default for '/' and any other non-scrollable pages
    }
    // Cleanup function to reset overflow when component unmounts or path changes significantly
    // This ensures that if AppRoutes is ever unmounted, the body style doesn't linger.
    return () => {
      document.body.style.overflow = 'hidden'; // Or whatever the true default should be if not simply hidden
    };
  }, [location.pathname]);

  return (
    <>
      <Routes>
        {/* Route for your main interactive experience */}
        <Route path="/" element={<MainExperience />} />

        {/* Route for the Waiver Form page */}
        <Route path="/waiver" element={<WaiverPage />} />

        {/* Route for the Services page */}
        <Route path="/services" element={<ServicesPage />} />

        {/* Route for the Faq page */}
        <Route path="/faq" element={<FaqPage />} />

        {/* Routes for new content pages */}
        <Route path="/record-cleaning-process" element={<RecordCleaningProcessPage />} />
        <Route path="/why-choose-us-minnesota" element={<WhyChooseUsPage />} />
        <Route path="/benefits-record-cleaning-minnesota" element={<BenefitsPage />} />
        <Route path="/vinyl-care-faq-minnesota" element={<VinylFAQPage />} />
        <Route path="/contact" element={<ContactPage />} /> {/* <<< ADD NEW ROUTE */}

        {/* Optional: A catch-all route for 404 Not Found pages */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showFooter && <Footer />}
    </>
  );
};

function App() {
  return (
    <HelmetProvider> {/* Wrap your app with HelmetProvider */}
      <StructuredData /> {/* Add StructuredData component here */}
      <Router>
        {/* MODIFIED: Use AppRoutes component */}
        <AppRoutes />
      </Router>
    </HelmetProvider>
  );
}

export default App;