import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import './ContentPage.css';

const WhyChooseUsPage = () => {
  return (
    <>
      <Helmet>
        <title>Why Choose GrooveWash for Vinyl Cleaning in Minnesota - GrooveWash</title>
        <meta name="description" content="Discover the GrooveWash difference for record cleaning in Minneapolis, St. Paul, and across Minnesota. Quality, care, and expertise for your vinyl collection." />
        <link rel="canonical" href="https://groovewash.com/why-choose-us-minnesota" />
        {/* Add other OG/Twitter tags as needed */}
      </Helmet>
      <div className="content-page-container">
        <nav className="content-page-nav">
          <Link to="/">Home</Link> | <Link to="/services">Services</Link> | <Link to="/faq">FAQ</Link>
        </nav>
        <header className="content-page-header">
          <h1>Why Choose GrooveWash for Vinyl Record Cleaning in Minnesota?</h1>
        </header>
        <section className="content-page-section">
          <h2>Expert Care for Your Cherished Collection</h2>
          <p>
            At GrooveWash, we're not just technicians; we're passionate vinyl enthusiasts ourselves, serving fellow collectors throughout Minneapolis, St. Paul, and the wider Minnesota community. We understand the sentimental and monetary value of your records. Each LP, whether a common classic or a rare find, is treated with the utmost respect and meticulous care, ensuring it returns to you in the best possible condition. Keywords: Best record cleaning Minnesota, vinyl experts MN, Twin Cities record care, trusted vinyl services.
          </p>
          
          <h2>State-of-the-Art Ultrasonic Technology</h2>
          <p>
            We utilize the acclaimed HumminGuru ultrasonic cleaning system, a benchmark in modern record care. This technology provides a contact-free, deep-groove clean that traditional methods simply cannot match. By harnessing the power of cavitation, we safely and effectively remove years of accumulated dust, grime, and microscopic contaminants, restoring your vinyl's sonic brilliance without any risk of surface wear. Experience the ultrasonic difference in Minnesota. Keywords: Ultrasonic vinyl cleaning Minnesota, advanced record care, HumminGuru service MN, gentle record cleaning.
          </p>

          <h2>Local Minnesota Service, Focused on You</h2>
          <p>
            As a local Minnesota business, we're dedicated to providing personalized and accessible service to our vibrant community of record collectors. We understand the unique needs of vinyl lovers in the Minneapolis-St. Paul area and beyond. Our commitment is to offer a friendly, approachable service, ensuring you feel confident and informed throughout the cleaning process. We're your neighbors, dedicated to preserving Minnesota's music heritage, one record at a time. Keywords: Minnesota local record cleaning, vinyl services Minneapolis, St. Paul record collectors, customer-focused vinyl care.
          </p>

          <h2>Transparent Process & Fair Pricing</h2>
          <p>
            We believe in clarity and honesty. Our cleaning process is detailed and open – you can learn all about it on our <Link to="/record-cleaning-process">Record Cleaning Process page</Link>. We offer competitive and fair pricing for our meticulous services, ensuring exceptional value for the level of care and technology we provide. Visit our <Link to="/services">Services Page</Link> for detailed pricing information. No hidden fees, just sparkling clean records. Keywords: Affordable record cleaning Minnesota, transparent vinyl service, fair price record cleaning MN.
          </p>

          <div className="why-choose-us-item">
            <strong>Affordable Pricing:</strong>
            <p>
              We offer competitive pricing for our meticulous cleaning and high-quality digitization services.
              Our ultrasonic record cleaning is available for $10 per record for in-person service, or just $5 per record if you schedule a drop-off.
              Get premium care for your vinyl without breaking the bank.
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default WhyChooseUsPage; 