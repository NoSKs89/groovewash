import React, { useState } from 'react';
import secrets from '../secrets';
import './ContactUsModal.css'; // We'll create this CSS file next

const ContactUsForm = ({
  name,
  setName,
  email,
  setEmail,
  message,
  setMessage,
  phoneNumber,
  setPhoneNumber,
  onClose,
  onSubmitSuccess, // Callback for successful submission
  isContactFormOpen, // To control visibility/animations if needed from parent
}) => {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!message.trim()) {
      setError('Please enter your message.');
      return;
    }

    setIsSubmitting(true);
    const formData = {
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      phoneNumber: phoneNumber.trim(),
    };

    try {
      const response = await fetch(secrets.contactApiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (response.ok && result.status === 'success') {
        console.log("Contact Form Server Response:", result);
        alert('Message sent successfully!');
        if (onSubmitSuccess) onSubmitSuccess(); // Trigger parent to close/reset
        // Clear form fields from parent via callbacks if desired, or parent handles it
      } else {
        console.error("Contact Form Server Error:", result);
        setError(result.message || 'Submission failed. Please try again.');
      }
    } catch (fetchError) {
      console.error("Contact Form Submission Fetch Error:", fetchError);
      setError('An error occurred. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isContactFormOpen) {
    return null; // Don't render if modal isn't open (parent controls visibility)
  }

  return (
    <div
      className="contact-form-inner-container"
      onClick={(e) => e.stopPropagation()} // Prevent clicks bubbling to backdrop/container
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onClose) onClose();
        }}
        className="contact-form-close-button"
        aria-label="Close Contact Form"
      >
        &times;
      </button>
      <h2>Contact Us</h2>
      <form onSubmit={handleSubmit} className="contact-form-fields">
        <div className="contact-form-group">
          <label htmlFor="contact-name">Name:</label>
          <input
            type="text"
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
            maxLength={100}
          />
        </div>
        <div className="contact-form-group">
          <label htmlFor="contact-email">Email:</label>
          <input
            type="email"
            id="contact-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            maxLength={100}
          />
        </div>
        <div className="contact-form-group">
          <label htmlFor="contact-phone">Phone Number (Optional):</label>
          <input
            type="tel"
            id="contact-phone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isSubmitting}
            maxLength={20}
          />
        </div>
        <div className="contact-form-group">
          <label htmlFor="contact-message">Message:</label>
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="4"
            required
            disabled={isSubmitting}
            maxLength={1000}
          />
        </div>
        {error && <p className="contact-error-message">{error}</p>}
        <button type="submit" className="contact-submit-button" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
};

export default ContactUsForm; 