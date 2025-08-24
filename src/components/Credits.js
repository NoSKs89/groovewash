import React from 'react';
import { useTransition, animated, config, useSpringRef } from '@react-spring/web';
import { SocialIcon } from 'react-social-icons';
import './Credits.css'; // We'll create this CSS file next

const Credits = ({ isCreditsOpen, onClose, creditsTransRef }) => {
  const localTransRef = useSpringRef();
  const transitionRef = creditsTransRef || localTransRef;

  const creditsContent = [
    { id: 'credits-title', content: <h2 className="credits-title">Credits</h2> },
    // --- Song Credits Section ---
    { 
      id: 'song-credits-header', 
      content: <h3 className="credits-sub-header">Song Credits</h3> 
    },
    {
      id: 'song-credits-blurb',
      content: (
        <p className="credits-paragraph small-text"> 
          All rights to the original musical compositions and recordings belong to their respective artists, labels, and copyright holders. The samples used on this website are for demonstrative purposes only. 
        </p>
      ),
    },
    {
      id: 'song-credits-list',
      content: (
        <ul className="credits-list">
          <li><strong>Artist:</strong> Ahmad Jamal | <strong>Album:</strong> Digital Works | <strong>Song:</strong> Poinciana</li>
          <li><strong>Artist:</strong> Band Of Skulls | <strong>Album:</strong> Himalayan | <strong>Song:</strong> Asleep At The Wheel</li>
          <li><strong>Artist:</strong> Ludwig van Beethoven (Cond: Bruno Walter) | <strong>Album:</strong> Symphony No. 6 "Pastorale" | <strong>Song:</strong> I. Allegro ma non troppo</li>
        </ul>
      ),
    },
    // --- Website Credits Section ---
    { 
      id: 'website-credits-header', 
      content: <h3 className="credits-sub-header">Website Credits</h3> 
    },
    {
      id: 'website-credits-lorem',
      content: (
        <p className="credits-paragraph small-text">
          Website created by Minnesota based developer and artist Stephen Erickson. Special thanks for SVG logo and design input from Brooke.Graphics
        </p>
      ),
    },
    {
      id: 'website-credits-links',
      content: (
        // Wrap both lists in a flex container
        <div className="website-links-container">
          {/* Social Icon Links Column */}
          <ul className="credits-list links social-icons">
            <li><SocialIcon url="https://x.com/smerickson89" target="_blank" rel="noopener noreferrer" fgColor="#FFFFFF" bgColor="transparent" style={{ height: 35, width: 35 }} /></li>
            <li><SocialIcon url="https://www.linkedin.com/in/stephenmerickson/" target="_blank" rel="noopener noreferrer" fgColor="#FFFFFF" bgColor="transparent" style={{ height: 35, width: 35 }} /></li>
            <li><SocialIcon url="https://github.com/NoSKs89" target="_blank" rel="noopener noreferrer" fgColor="#FFFFFF" bgColor="transparent" style={{ height: 35, width: 35 }} /></li>
            <li><SocialIcon url="https://www.instagram.com/stephenerickson1989/#" target="_blank" rel="noopener noreferrer" fgColor="#FFFFFF" bgColor="transparent" style={{ height: 35, width: 35 }} /></li>
          </ul>
          {/* Standard links Column */}
          <div>
            <h4 className="credits-link-subtitle">Other Work By The Ericksons:</h4>
            <ul className="credits-list links">
              <li><a href="https://warmandsoftware.com" target="_blank" rel="noopener noreferrer" className="credits-link">Warm & Software</a></li>
              <li><a href="https://wwjd2025.com" target="_blank" rel="noopener noreferrer" className="credits-link">WWJD2025</a></li>
              <li><a href="https://brooke.graphics" target="_blank" rel="noopener noreferrer" className="credits-link">Design By Brooke</a></li>
              {/* Add more links as needed */}
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const transitions = useTransition(isCreditsOpen ? creditsContent : [], {
    ref: transitionRef,
    keys: item => item.id,
    from: { opacity: 0, transform: 'translateY(15px)' },
    enter: { opacity: 1, transform: 'translateY(0px)' },
    leave: { opacity: 0, transform: 'translateY(-15px)' },
    trail: 80,
    config: config.stiff,
  });

  if (!isCreditsOpen) {
    return null;
  }

  return (
    <div
      className="credits-container"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <button onClick={(e) => {
        e.stopPropagation();
        onClose();
      }} className="credits-close-button" aria-label="Close Credits">
        &times;
      </button>
      <div className="credits-content">
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

export default Credits; 