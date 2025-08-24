import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/services">Services</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/waiver">Waiver</Link>
        </div>
        <div className="footer-links">
          <Link to="/record-cleaning-process">Cleaning Process</Link>
          <Link to="/why-choose-us-minnesota">Why Us?</Link>
          <Link to="/benefits-record-cleaning-minnesota">Benefits</Link>
          <Link to="/vinyl-care-faq-minnesota">Vinyl Care FAQ</Link>
        </div>
        <div className="footer-info">
          <p>&copy; {new Date().getFullYear()} GrooveWash. All rights reserved.</p>
          <p>Minneapolis, MN</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 