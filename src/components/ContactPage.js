import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import secrets from '../secrets';
import ContactUsForm from './ContactUsForm'; // The actual form component
import './ContactPage.css'; // Styles for the page layout
// import Footer from './Footer'; // <<< REMOVE FOOTER IMPORT

const ContactPage = () => {
  const navigate = useNavigate();

  // State for the form fields will be managed within ContactUsForm itself
  // or passed down if ContactUsForm is designed to be controlled externally.
  // For a static page, it's often simpler if ContactUsForm manages its own state.

  // If ContactUsForm needs onSubmit, define it here:
  const handleFormSubmit = (formData) => {
    console.log('Contact form submitted on ContactPage:', formData);
    // After successful submission, you might want to show a message on this page
    // or redirect. The actual submission logic is within ContactUsForm.
  };

  return (
    <>
      <Helmet>
        <title>Contact Us - GrooveWash</title>
        <meta name="description" content="Get in touch with GrooveWash for ultrasonic vinyl record cleaning and digitization services in Minnesota. Ask questions or schedule your service." />
        <meta name="keywords" content="Contact GrooveWash, Vinyl Cleaning Minnesota, Record Digitization Contact, Minneapolis, St. Paul" />
        <link rel="canonical" href="https://groovewash.com/contact" />
        <meta property="og:title" content="Contact GrooveWash - Vinyl Services" />
        <meta property="og:description" content="Contact us for expert vinyl record cleaning and digitization in Minnesota." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://groovewash.com/contact" />
        {/* Add OG image specific to contact page if available */}
      </Helmet>
      <div className="contact-page-container">
        {/* Visually hidden H1 for SEO */}
        <h1 className="visually-hidden">Contact GrooveWash | Vinyl Record Cleaning & Digitization Services Minnesota</h1>
        <button onClick={() => navigate('/')} className="home-button-contact">
          Home
        </button>
        <div className="contact-form-wrapper">
          <h2 className="contact-page-title">Send Us a Message</h2>
          {/* Render the ContactUsForm. It will handle its own fields and submission. */}
          {/* Pass the onSubmit if ContactUsForm expects it and you want to do something on this page after submit */}
          <ContactUsForm onSubmit={handleFormSubmit} /> 
        </div>
        {/* <<< REMOVE FOOTER >>> */}
      </div>
      {/* <Footer /> */}
    </>
  );
};

export default ContactPage; 