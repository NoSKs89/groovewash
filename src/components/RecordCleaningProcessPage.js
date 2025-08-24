import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import './ContentPage.css'; // We will create this generic CSS file next

const RecordCleaningProcessPage = () => {
  return (
    <>
      <Helmet>
        <title>Our Record Cleaning Process in Minnesota - GrooveWash</title>
        <meta name="description" content="Learn about GrooveWash's detailed ultrasonic record cleaning process for vinyl enthusiasts in Minnesota. Get the best care for your collection." />
        <link rel="canonical" href="https://groovewash.com/record-cleaning-process" />
        <meta property="og:title" content="Our Record Cleaning Process in Minnesota - GrooveWash" />
        <meta property="og:description" content="Discover the steps GrooveWash takes to ensure your vinyl records are perfectly cleaned using ultrasonic technology in Minnesota." />
        {/* Add other OG/Twitter tags as needed */}
      </Helmet>
      <div className="content-page-container">
        <nav className="content-page-nav">
          <Link to="/">Home</Link> | <Link to="/services">Services</Link> | <Link to="/faq">FAQ</Link>
        </nav>
        <header className="content-page-header">
          <h1>Our Ultrasonic Record Cleaning Process in Minnesota</h1>
        </header>
        <section className="content-page-section">
          <h2>Initial Inspection and Preparation</h2>
          <p>
            Every record entrusted to us by Minnesota collectors begins its journey with a careful visual inspection. We look for any pre-existing conditions such as deep scratches, warps, or significant visible damage that cleaning alone cannot rectify. For records with heavy surface dust or grime, a gentle manual pre-cleaning may be performed to remove loose debris. This preparation ensures the ultrasonic bath can focus on the deeply embedded contaminants. 
          </p>
          
          <h2>The Ultrasonic Cleaning Bath</h2>
          <p>
            At the heart of our Minnesota record cleaning service is the advanced HumminGuru ultrasonic cleaner. Your record is carefully placed in the machine, where it rotates through a bath of distilled water, optimally warmed and treated with a specialized, record-safe cleaning agent. The HumminGuru employs a 40kHz ultrasonic system to generate millions of microscopic cavitation bubbles. These bubbles gently implode against the groove walls, dislodging even the most stubborn dirt, dust, mold release agents, and residues without any physical contact that could harm the delicate vinyl surface. This deep groove cleaning action is key to restoring your record's audio fidelity. The record label is kept safe and dry throughout this process.
          </p>

          <h2>Rinsing and Drying</h2>
          <p>
            Following the ultrasonic bath, the HumminGuru features an automated draining system, ensuring all contaminated water is removed from the cleaning basin. The record then undergoes a thorough drying cycle using a duo fan system that circulates filtered air across both sides of the vinyl. This ensures your record is dried efficiently and safely, without leaving behind any residue or introducing new contaminants, a crucial step for professional record cleaning in Minnesota. 
          </p>

          <h2>Final Inspection and Sleeving</h2>
          <p>
            Once dry, each record receives a final visual inspection under bright light to ensure a successful clean. We look for a clean, lustrous surface, free of residues and visible contaminants. To protect your newly cleaned Minnesota record, it is then placed into a brand new, archival-quality, anti-static inner sleeve. This prevents static build-up and protects the record from dust and scuffs, preserving its pristine condition. Keywords: Minnesota record care, vinyl preservation services, anti-static sleeves, final record inspection.
          </p>
        </section>
        <section className="content-page-section">
          <h2>Why Choose Our Process for Your Minnesota Collection?</h2>
          <p>
            GrooveWash combines state-of-the-art HumminGuru ultrasonic technology with meticulous attention to detail, tailored for the discerning Minnesota vinyl enthusiast. Our process is designed to be both incredibly effective and exceptionally gentle, ensuring the best possible care for your cherished records. From initial assessment to final sleeving, we prioritize the sonic improvement and long-term preservation of your collection. 
            Learn more about our <Link to="/services">full range of services</Link> or <Link to="/faq">check our FAQ</Link> for more information.
          </p>
        </section>
      </div>
    </>
  );
};

export default RecordCleaningProcessPage; 