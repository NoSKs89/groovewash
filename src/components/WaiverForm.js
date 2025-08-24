import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import secrets from '../secrets';
// Remove useTransition, animated, useSpringRef, config if ONLY used for item transitions
// Keep them if needed elsewhere or if you plan to re-introduce animations later
import { useSpringRef } from '@react-spring/web';
import './WaiverForm.css';

// Receive name, date, setName, setDate, onClose, and optional onSubmit from props
// Removed formTransRef as we are removing the internal transitions for now
const WaiverForm = ({ name, setName, date, setDate, onClose, onSubmit, isWaiverOpen, waiverText }) => {
  const sigCanvasRef = useRef(null);
  const [error, setError] = useState('');
  const [hasSigned, setHasSigned] = useState(false); // Keep track if signature exists
  const [renderSignatureCanvas, setRenderSignatureCanvas] = useState(false);

  // Maintain useEffect for signature state consistency if needed, although drawing is lost on re-render/close
  useEffect(() => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      setHasSigned(true);
    }
  }, [sigCanvasRef]);

  // Effect to delay rendering the signature canvas
  useEffect(() => {
    let timerId;
    if (isWaiverOpen) {
      // Delay rendering to avoid potential layout shifts or performance hits during modal open animation
      timerId = setTimeout(() => {
        setRenderSignatureCanvas(true);
      }, 350); // Adjust timing if needed, based on parent animation
    } else {
      setRenderSignatureCanvas(false); // Hide immediately on close
      setError(''); // Clear errors on close
      // Note: Name, Date, and Signature drawing are NOT cleared here automatically
      // because they are controlled by the parent or useRef.
      // Consider clearing them in the parent component's onClose logic if desired.
    }
    return () => clearTimeout(timerId);
  }, [isWaiverOpen]);

  const clearSignature = () => {
    sigCanvasRef.current.clear();
    setError('');
    setHasSigned(false);
  };

  const handleSign = () => {
    if (!sigCanvasRef.current.isEmpty()) {
      setHasSigned(true);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!date) {
      setError('Please enter the date.');
      return;
    }
    // Check renderSignatureCanvas AND if the ref exists and is empty
    if (!renderSignatureCanvas || !sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      setError('Please provide your signature.');
      return;
    }

    const signatureDataUrl = sigCanvasRef.current.toDataURL('image/png');
    const formData = {
      name: name.trim(),
      date: date,
      signature: signatureDataUrl,
      waiverText: waiverText
    };

    try {
      // ** CHANGE THIS URL to where your PHP script is hosted **
      const response = await fetch(secrets.waiverApiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (response.ok && result.status === 'success') {
        console.log("Server Response:", result);
        alert('Waiver submitted successfully!');
        if (onSubmit) onSubmit(formData);
        if (onClose) onClose();
      } else {
        console.error("Server Error:", result);
        setError(result.message || 'Submission failed. Please try again.');
      }
    } catch (fetchError) {
      console.error("Submission Fetch Error:", fetchError);
      setError('An error occurred while submitting. Check network connection.');
    }
  };

  // Conditional rendering based on isWaiverOpen (already handled by parent's animation logic)
  // We render the structure directly if isWaiverOpen is true.
  if (!isWaiverOpen) {
    return null; // Don't render anything if the modal isn't open
  }

  // Conditionally render signature canvas content
  const signatureContent = renderSignatureCanvas ? (
    <div className="form-group signature-group">
      <label htmlFor="signature" style={{ textAlign: 'center', marginBottom: '8px' }}>Signature:</label>
      <SignatureCanvas
        ref={sigCanvasRef}
        penColor="black"
        canvasProps={{ id: 'signature', className: 'signature-canvas', style: { backgroundColor: 'white' } }}
        onEnd={handleSign}
      />
      <button type="button" onClick={clearSignature} className="clear-button">Clear Signature</button>
    </div>
  ) : (
    // Placeholder while signature canvas is loading/delayed
    <div className="form-group signature-group" style={{ height: '175px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Optional: Add a loading indicator */}
      <p>Loading Signature Pad...</p>
    </div>
  );


  return (
    // This container receives the click-blocking and general positioning WITHIN the animated modal
    <div
      className="waiver-form-container"
      onClick={(e) => e.stopPropagation()} // Prevent clicks bubbling to backdrop
    >
      {/* Close button remains positioned relative to this container */}
      <button onClick={(e) => {
        e.stopPropagation();
        onClose();
      }} className="waiver-close-button" aria-label="Close Waiver">
        &times;
      </button>

      {/* New wrapper for the two columns */}
      <div className="form-content-wrapper">

        {/* Left Column: Title and Description */}
        <div className="left-column">
          {/* Removed inline styles for centering/width, handled by CSS */}
          <h2>Liability Waiver</h2>
          <p>
             Please read and sign the waiver below. By signing, the customer acknowledges and agrees to the following terms regarding the cleaning and digitization of their vinyl records. While every effort is made to handle your records with the utmost care and we do not anticipate any damage occurring during our cleaning and digitization process, GrooveWash shall not be held liable for any damage whatsoever to the customer's vinyl records. This includes, but is not limited to, any damage that may exist prior to the service being performed (such as scratches, warps, or wear from prior use) or any damage that may occur during or after the service, regardless of cause. The customer assumes all risk inherent in the handling and processing of their records and agrees not to hold GrooveWash responsible for any loss or damage.
          </p>
        </div>

        {/* Right Column: Form Inputs and Actions */}
        {/* The <form> element now wraps only the inputs/submit */}
        <form onSubmit={handleSubmit} className="right-column">
           {/* Name Input */}
           <div className="form-group">
             <label htmlFor="name">Name:</label>
             <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
           </div>

           {/* Date Input */}
           <div className="form-group">
             <label htmlFor="date">Date:</label>
             <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required />
           </div>

           {/* Signature Area (conditionally rendered) */}
           {signatureContent}

           {/* Error Message */}
           {error && <p className="error-message">{error}</p>}

           {/* Submit Button */}
           <button type="submit" className="submit-button">Submit Waiver</button>
        </form>

      </div> {/* End form-content-wrapper */}
    </div> // End waiver-form-container
  );
};

export default WaiverForm;