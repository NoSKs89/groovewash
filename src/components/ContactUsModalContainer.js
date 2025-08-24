import React, { useState, useEffect } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import ContactUsForm from './ContactUsForm';
import './ContactUsModal.css'; // Shared CSS file

const ContactUsModalContainer = ({ isMobile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isContactButtonHovered, setIsContactButtonHovered] = useState(false); // New state for hover

  // Reset form fields when modal closes and on successful submission
  const resetFormAndClose = () => {
    setName('');
    setEmail('');
    setMessage('');
    setPhoneNumber('');
    setIsOpen(false);
  };

  const backdropStyle = useSpring({
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? 'auto' : 'none', // Only allow clicks when visible
    config: config.stiff,
  });

  const modalStyle = useSpring({
    config: isOpen ? config.stiff : { ...config.gentle, tension: 350, friction: 35 },
    opacity: 1, // Ensure container is always opaque, content fades separately
    width: isOpen ? (isMobile ? '90vw' : '450px') : (isMobile ? '150px' : '180px'),
    height: isOpen ? (isMobile ? '70vh' : '550px') : (isMobile ? '50px' : '55px'),
    borderRadius: isOpen ? '12px' : '28px',
    position: 'fixed',
    // Revised positioning to avoid 'auto' and set mobile to bottom-right
    ...(isOpen
      ? { // Modal Open State (Centered)
          right: '50%', 
          bottom: '50%', 
          transform: 'translate(50%, 50%)',
        }
      : { // Button Closed State (Bottom-Right for both Desktop and Mobile)
          right: '2%',
          bottom: '5%',
          transform: 'translate(0%, 0%)',
        }),
    background: isOpen 
        ? 'rgba(40, 40, 40, 0.97)' 
        : (isContactButtonHovered ? '#FFD700' : 'rgba(0, 0, 0, 0.2)'), // Updated background for hover
    boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
    color: isOpen ? 'white' : (isContactButtonHovered ? '#333' : 'white'), // Change text color on hover
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isOpen ? 'default' : 'pointer',
    zIndex: 10500,
    overflow: 'hidden',
    padding: isOpen ? (isMobile ? '15px' : '20px') : '0px',
  });

  const contentOpacity = useSpring({
    opacity: isOpen ? 1 : 0,
    delay: isOpen ? 200 : 0,
    config: config.stiff,
  });

  const buttonTextOpacity = useSpring({
    opacity: isOpen ? 0 : 1,
    delay: isOpen ? 0 : 200,
    config: config.stiff,
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
        setIsOpen(true);
    } 
    // Closing is handled by the form's onClose or onSubmitSuccess or backdrop click
  };

  return (
    <>
      {/* Backdrop for closing modal on outside click */}
      <animated.div
        style={{
          ...backdropStyle,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)', // Semi-transparent backdrop
          zIndex: 10499, // Below modal content but above other page content
        }}
        onClick={resetFormAndClose} // Close when backdrop is clicked
      />
      <animated.div
        style={modalStyle}
        onClick={handleToggle} // This will only trigger setIsOpen(true) if !isOpen
        onMouseEnter={() => {
          if (!isOpen) {
            setIsContactButtonHovered(true);
          }
        }}
        onMouseLeave={() => {
          if (!isOpen) {
            setIsContactButtonHovered(false);
          }
        }}
        className="contact-us-container"
      >
        {!isOpen && (
          <animated.span style={buttonTextOpacity} className="contact-us-button-text">
            Contact Us
          </animated.span>
        )}
        {isOpen && (
          <animated.div style={{ ...contentOpacity, width: '100%', height: '100%' }}>
            <ContactUsForm
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              message={message}
              setMessage={setMessage}
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              onClose={resetFormAndClose} // Use reset for manual close
              onSubmitSuccess={resetFormAndClose} // Use reset for successful submission
              isContactFormOpen={isOpen}
            />
          </animated.div>
        )}
      </animated.div>
    </>
  );
};

export default ContactUsModalContainer; 