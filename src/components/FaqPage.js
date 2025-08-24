import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import secrets from '../secrets';
import './FaqPage.css'; // For page layout
import './FAQ.css';     // For styling the FAQ content itself

const FaqPage = () => {
  const navigate = useNavigate();

  // Mirrored from FAQ.js, structured for static rendering
  const faqContent = [
    { id: 'faq-title', type: 'title', text: 'FAQ' },
    {
      id: 'faq-q1',
      type: 'item',
      question: 'Why sign a waiver?',
      answer: "We don't expect any issues. The waiver is to ensure so we are covered in the event that a customer claims we damaged their record that was already in that condition."
    },
    {
      id: 'faq-q2',
      type: 'item',
      question: 'My digital files are not as loud as other media?',
      answer: "This is because the process of recording the output of the record leaves the dynamic range intact. Look up the 'loudness wars' and what compression is. Upon request, I can add a mastering limiter to bring the overall level up but doing so reduces the dynamic range."
    },
    {
      id: 'faq-q3',
      type: 'item',
      question: 'Why so expensive?',
      answer: "This is our side hustle, and operates after our regular careers. Digitizing a record takes time to record, then splice, organize the files and export differing versions."
    },
    {
      id: 'faq-q4',
      type: 'item',
      question: 'My record still has pops or clicks?',
      answer: "Dirt and dust are just one of the many things that can cause pops or clicks. We can clean the record for you, but it won't fix scratches or other irritants."
    },
  ];

  return (
    <>
      <Helmet>
        <title>FAQ - GrooveWash | Vinyl Record Cleaning & Digitization</title>
        <meta name="description" content="Find answers to frequently asked questions about GrooveWash's ultrasonic vinyl record cleaning, digitization services, waivers, and pricing in Minnesota." />
        <meta name="keywords" content="FAQ, GrooveWash FAQ, Vinyl Cleaning Questions, Record Digitization FAQ, Minnesota, Ultrasonic Cleaning, Waiver Questions" />
        <link rel="canonical" href={`${secrets.baseUrl}/faq`} />
        <meta property="og:title" content={`${secrets.businessName} - Frequently Asked Questions`} />
        <meta property="og:description" content="Get answers to common questions about our vinyl record cleaning and digitization services." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${secrets.baseUrl}/faq`} />
        <meta property="og:image" content={secrets.ogImageFaq} />
        <meta name="twitter:card" content="summary" /> {/* Or summary_large_image if you have a compelling image */}
        <meta name="twitter:title" content={`${secrets.businessName} - FAQ`} />
        <meta name="twitter:description" content="Frequently asked questions about GrooveWash services." />
        <meta name="twitter:image" content={secrets.twitterImageFaq} />
      </Helmet>
      <div className="faq-page-container">
        {/* Visually hidden H1 for SEO */}
        <h1 className="visually-hidden">GrooveWash - Frequently Asked Questions | Vinyl Cleaning & Digitization</h1>
        <button onClick={() => navigate('/')} className="home-button-faq">
          Home
        </button>
        <div className="faq-page-content">
          {faqContent.map(item => {
            if (item.type === 'title') {
              return <h2 key={item.id} className="faq-title">{item.text}</h2>;
            }
            if (item.type === 'item') {
              return (
                <div key={item.id} className="faq-item">
                  <strong>{item.question}</strong>
                  <p>{item.answer}</p>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </>
  );
};

export default FaqPage; 