import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import secrets from '../secrets';
import './ServicesPage.css'; // For page layout
import './Services.css';   // For styling the services content itself

const ServicesPage = () => {
  const navigate = useNavigate();

  // Content mirrored from Services.js (servicesItems array)
  const servicesItems = [
    { id: 'services-title', content: (
      <div>
        <h2 className="services-title">Our Services</h2>
        <h5 className="services-subtitle">~ <b>Text </b> 612-418-9329 to book ~</h5>
      </div>
    )},
    {
      id: 'cleaning-section',
      content: (
        <div className="services-section">
          <h3 className="services-section-title">
            Record Cleaning
            <span className="service-subtitle">
              - <span className="service-price">10$ ea or 5 for 40$</span>
            </span>
          </h3>
          <p className="services-paragraph">
            Record(s) will be cleaned with a touchless ultrasonic record cleaner, specifically the HumminGuru.
          </p>
          <ul className="services-list">
            <li>Average cleaning and drying time is 7-10 minutes per record.</li>
            <li>Extremely filthy records will be cleaned with a brush and cleaning liquid prior to the ultrasonic treatment.</li>
            <li>Customers can request to wait for their records to be cleaned or pick up at a later date/time.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'digitization-section',
      content: (
        <div className="services-section" style={{ paddingBottom: '50px !important' }}>
          <h3 className="services-section-title">
            Record Digitization
            <span className="service-subtitle">
             - <span className="service-price">50$ per LP</span>
            </span>
          </h3>
          <p className="services-paragraph">
            Digitization will occur with a Sanyo Plus Q-40 turntable using a Technics Moving Coil EPC-310MCT4P Boron Cantilever cartridge. If in rare cases your records' material is too difficult to capture without clipping (has only happened on one song thus far) we will attempt using a Sony PS-3300 with a Moving Magnet Ortofon 2M Blue cartridge.
          </p>
          <p className="services-paragraph">
          Files will be split into individual songs and given in two formats:
          </p>
          <ul className="services-list">
            <li>96k/24bit High Quality WAVs</li>
            <li>44.1k/16bit Standard Quality WAVs</li>  
          </ul>
          <p className="services-paragraph">
          The following enhancements can be requested, but are not necessarily recommended:
          </p>
          <ul className="services-list">
            <li>Noise Reduction via iZotope RX</li>
            <li>Mastering Limiter via ML4000</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Services - GrooveWash | Ultrasonic Vinyl Cleaning & Digitization</title>
        <meta name="description" content="Explore GrooveWash's ultrasonic vinyl record cleaning and high-quality digitization services. Get pricing and details for restoring your record collection in Minnesota." />
        <meta name="keywords" content="Vinyl Cleaning Services, Record Digitization, Ultrasonic Record Cleaner, GrooveWash Services, Minnesota, LP Cleaning, Music Preservation" />
        <link rel="canonical" href={`${secrets.baseUrl}/services`} />
        <meta property="og:title" content={`${secrets.businessName} - Vinyl Record Services`} />
        <meta property="og:description" content="Discover our professional ultrasonic cleaning and digitization services for vinyl records." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${secrets.baseUrl}/services`} />
        <meta property="og:image" content={secrets.ogImageServices} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${secrets.businessName} - Vinyl Record Services`} />
        <meta name="twitter:description" content="Professional ultrasonic cleaning and digitization for your vinyl records." />
        <meta name="twitter:image" content={secrets.twitterImageServices} />
      </Helmet>
      <div className="services-page-container">
        {/* Visually hidden H1 for SEO */}
        <h1 className="visually-hidden">GrooveWash Services | Ultrasonic Vinyl Cleaning & Digitization Minnesota</h1>
        <button onClick={() => navigate('/')} className="home-button-services">
          Home
        </button>
        <div className="services-page-content">
          {/* Render the services items statically */}
          {servicesItems.map(item => (
            <div key={item.id} className="services-page-item">
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ServicesPage; 