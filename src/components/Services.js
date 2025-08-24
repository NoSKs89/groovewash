import React from 'react';
import { useTransition, animated, config, useSpringRef } from '@react-spring/web';
import './Services.css'; // We'll create this CSS file next

const Services = ({ isServicesOpen, onClose, servicesTransRef }) => {
  const localTransRef = useSpringRef();
  const transitionRef = servicesTransRef || localTransRef;

  // Prepare Services content
  const servicesItems = [
    { id: 'services-title', content: (
    <div>
    <h2 className="services-title">Our Services</h2>
    <h5 className="services-subtitle">- <b>Text </b> 612-418-9329 Or Use Our Contact Form -</h5>
    </div>
    ) 
    },
    // Section 1: Record Cleaning
    {
      id: 'cleaning-section',
      content: (
        <div className="services-section">
          <h3 className="services-section-title">
            Record Cleaning
            <span className="service-subtitle">
              - <span className="service-price">$10/ea In-Person, $5/ea Scheduled Drop-off</span>
            </span>
          </h3>
          <p className="services-paragraph">
            Record(s) will be cleaned with a touchless ultrasonic record cleaner, specifically the HumminGuru.
          </p>
          <ul className="services-list">
            <li>Average cleaning and drying time is 7-10 minutes per record.</li>
            <li>Extremely filthy records will be cleaned with a brush and cleaning liquid prior to the ultrasonic treatment.</li>
            <li><b>In-Person Service:</b> $10 per record.</li>
            <li><b>Scheduled Drop-off:</b> $5 per record (requires appointment). Bulk discounts may apply for large collections, please inquire.</li>
          </ul>
        </div>
      ),
    },
    // Section 2: Record Digitization
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

  // Use the provided ref for transitions
  const transitions = useTransition(isServicesOpen ? servicesItems : [], {
    ref: transitionRef,
    keys: (item) => item.id,
    from: { opacity: 0, transform: 'translateY(20px)' },
    enter: { opacity: 1, transform: 'translateY(0px)' },
    leave: { opacity: 0, transform: 'translateY(-20px)' },
    trail: 90, // Adjust trail if desired
    config: config.gentle, // Different config?
  });

  // If the Services modal is not open, don't render anything
  if (!isServicesOpen) {
    return null;
  }

  return (
    <div
      className="services-container"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="services-close-button"
        aria-label="Close Services"
      >
        &times;
      </button>

      <div className="services-content">
        {transitions((style, item) =>
          item ? (
            <animated.div
              style={{ ...style, width: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              {item.content}
            </animated.div>
          ) : null
        )}
      </div>
    </div>
  );
};

export default Services; 