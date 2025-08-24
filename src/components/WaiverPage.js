// src/components/WaiverPage/WaiverPage.js
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async'; // Import Helmet
import { useNavigate } from 'react-router-dom'; // For the home button
import WaiverForm from './WaiverForm'; // Assuming WaiverForm.js is in the same directory
import './WaiverPage.css'; // We'll create this for styling the page

const WaiverPage = () => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const navigate = useNavigate();

  // The waiver text can be defined here or fetched from a source
  const waiverTextContent = `Please read and sign the waiver below. By signing, the customer acknowledges and agrees to the following terms regarding the cleaning and digitization of their vinyl records. While every effort is made to handle your records with the utmost care and we do not anticipate any damage occurring during our cleaning and digitization process, GrooveWash shall not be held liable for any damage whatsoever to the customer's vinyl records. This includes, but is not limited to, any damage that may exist prior to the service being performed (such as scratches, warps, or wear from prior use) or any damage that may occur during or after the service, regardless of cause. The customer assumes all risk inherent in the handling and processing of their records and agrees not to hold GrooveWash responsible for any loss or damage.`;

  const handleWaiverSubmit = (formData) => {
    console.log('WaiverPage: Form submitted', formData);
    // Potentially redirect or show a success message on this page
    // For now, we'll just log it. The alert is in WaiverForm.
    // If you want to navigate away after successful submission from WaiverForm:
    // navigate('/');
  };

  const handleCloseWaiver = () => {
    // On a dedicated page, "closing" the waiver might mean navigating away
    // or simply resetting the form if it's part of a larger flow on this page.
    // For this example, let's assume "close" is like cancelling and going home.
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>Waiver - GrooveWash | Vinyl Record Cleaning & Digitization Services</title>
        <meta name="description" content="Review and sign the GrooveWash waiver for ultrasonic vinyl record cleaning and digitization services. Ensure your collection is handled with care." />
        <meta name="keywords" content="Waiver, Vinyl Cleaning Waiver, Record Digitization Agreement, GrooveWash, Minnesota, Terms of Service" />
        <link rel="canonical" href="https://groovewash.com/waiver" />
        <meta property="og:title" content="Waiver - GrooveWash Services" />
        <meta property="og:description" content="Waiver form for GrooveWash ultrasonic vinyl record cleaning and digitization." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://groovewash.com/waiver" />
        {/* You might want a specific OG image for the waiver page or use a general one */}
        <meta property="og:image" content="https://groovewash.com/og-image-waiver.png" /> 
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Waiver - GrooveWash Services" />
        <meta name="twitter:description" content="Review and sign the waiver for GrooveWash record cleaning and digitization." />
      </Helmet>
      <div className="waiver-page-container">
        {/* Visually hidden H1 for SEO */}
        <h1 className="visually-hidden">GrooveWash - Service Waiver | Vinyl Record Cleaning & Digitization Agreement</h1>
        <button onClick={() => navigate('/')} className="home-button">
          Home
        </button>
        <div className="waiver-page-content">
          {/*
            isWaiverOpen is true because this is a dedicated page for the waiver.
            The WaiverForm itself will handle the rendering based on this prop.
          */}
          <WaiverForm
            name={name}
            setName={setName}
            date={date}
            setDate={setDate}
            onClose={handleCloseWaiver} // Or a different handler if "close" means something else
            onSubmit={handleWaiverSubmit}
            isWaiverOpen={true} // Always open on this dedicated page
            waiverText={waiverTextContent}
          />
        </div>
      </div>
    </>
  );
};

export default WaiverPage;