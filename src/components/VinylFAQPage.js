import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import secrets from '../secrets';
import './ContentPage.css'; // Assuming a shared CSS for content pages

const VinylFAQPage = () => {
  const faqs = [
    {
      q: 'How often should I get my vinyl records professionally cleaned in Minnesota?',
      a:`For optimal playback and to preserve your vinyl collection in Minnesota's climate, we recommend a light anti-static brush cleaning before each play. A professional, deep ultrasonic cleaning is highly beneficial for newly acquired used records, records that haven't been played in a while, or any vinyl exhibiting noticeable surface noise or appearing dirty. Minnesota's varying humidity levels throughout the year can contribute to dust and static attraction, so periodic deep cleaning by a professional service like GrooveWash helps maintain your collection's integrity. Listen to your records – if they sound noisy, it's probably time for a thorough clean! We suggest a professional ultrasonic clean every few months to a year for regularly played LPs to ensure the best audio fidelity. <a href="/services">Learn more about our expert vinyl record cleaning services in Minnesota.</a>`
    },
    {
      q: 'Is ultrasonic cleaning safe for all my vinyl records?',
      a: `When performed correctly with professional-grade equipment like our HumminGuru ultrasonic machine and record-safe cleaning solutions, ultrasonic cleaning is one of the safest and most effective methods available for vinyl LPs and 45s. The process uses cavitation in a specialized liquid bath, meaning there is no harsh physical contact with the delicate record grooves. It is meticulously designed to be gentle yet exceptionally thorough. However, we do not recommend ultrasonic cleaning for records with significant pre-existing physical damage (e.g., deep cracks, severe warping), or for fragile 78rpm shellac records, as the vibrations could potentially exacerbate existing issues. For standard vinyl LPs (33rpm) and 45rpm singles in reasonable condition, it's exceptionally safe. Read about <a href="/record-cleaning-process">our detailed ultrasonic record cleaning process.</a> Keywords: safe record cleaning, ultrasonic vinyl safety, Minnesota record care.`
    },
    {
      q: `What makes GrooveWash's ultrasonic cleaning different from DIY methods?`,
      a: `While DIY methods like brushes and cleaning cloths are suitable for light surface dust removal, GrooveWash's professional ultrasonic cleaning in Minnesota offers a significantly deeper and more comprehensive clean. Our ultrasonic waves create microscopic cavitation bubbles that penetrate into the very bottom of the record grooves, dislodging stubborn embedded dirt, grime, oils, and residues that manual methods simply cannot reach. This meticulous process results in a demonstrably lower noise floor, enhanced audio clarity, and a richer listening experience. Additionally, our professional service includes controlled drying and the use of new anti-static inner sleeves, minimizing the risk of re-introducing contaminants or causing micro-scratches that can sometimes occur with improper DIY techniques. Keywords: professional vs DIY record cleaning Minnesota, ultrasonic vs manual cleaning, best record cleaning MN.`
    },
    {
      q: 'Does GrooveWash clean 78rpm shellac records?',
      a: 'Due to the more fragile and porous nature of shellac material compared to vinyl, GrooveWash does NOT recommend or perform ultrasonic cleaning on 78rpm records. Shellac can be sensitive to certain cleaning solutions (especially those containing alcohol, which we never use for any records) and the vibrations of an ultrasonic bath could potentially worsen any existing hairline cracks or delamination. Our expertise lies in safely cleaning standard vinyl (LP/33rpm and 45rpm) records. If you have valuable shellac records, we advise researching cleaning methods specifically designed for shellac preservation from archival specialists.'
    },
    {
      q: 'What is the typical turnaround time for record cleaning at your Minnesota service?',
      a: 'Our typical turnaround time for professional record cleaning at GrooveWash is generally 2-4 business days, depending on the number of records in your batch and our current service queue. For larger collections (50+ records), we will provide a more specific estimated timeframe upon consultation. We are committed to returning your sparkling clean vinyl records to you as quickly as possible without compromising the quality of our service! <a href="/contact">Contact us today for current turnaround times or to schedule your record drop-off in Minnesota.</a>'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Vinyl Record Cleaning & Care FAQ - Minnesota | GrooveWash</title>
        <meta name="description" content="Answers to frequently asked questions about professional vinyl record cleaning, ultrasonic record care, and our specialized services in Minnesota. Get your vinyl care questions answered by GrooveWash." />
        <meta name="keywords" content="Vinyl Record Cleaning FAQ Minnesota, Ultrasonic Record Cleaning MN, Record Care Minnesota, GrooveWash FAQ, Vinyl Preservation, Professional Record Cleaning Questions" />
        <link rel="canonical" href={`${secrets.baseUrl}/vinyl-care-faq-minnesota`} />
        <meta property="og:title" content={`${secrets.businessName} - Vinyl Record Cleaning & Care FAQ (Minnesota)`} />
        <meta property="og:description" content="Detailed answers to common questions about ultrasonic vinyl cleaning, record maintenance, and GrooveWash services in Minnesota." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${secrets.baseUrl}/vinyl-care-faq-minnesota`} />
        <meta property="og:image" content={secrets.ogImageVinylFaq} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${secrets.businessName} - Vinyl Record Care FAQ (MN)`} />
        <meta name="twitter:description" content="Your questions about professional vinyl record cleaning and care in Minnesota, answered by the experts at GrooveWash." />
        <meta name="twitter:image" content={secrets.twitterImageVinylFaq} />
      </Helmet>
      <div className="content-page-container">
        <nav className="content-page-nav">
          <Link to="/">Home</Link> | <Link to="/services">Our Services</Link> | <Link to="/faq">General FAQ</Link> | <Link to="/contact">Contact Us</Link>
        </nav>
        <header className="content-page-header">
          <h1>Vinyl Record Cleaning &amp; Care FAQ (Minnesota Focus)</h1>
          <p className="page-intro">Your top questions about professional ultrasonic vinyl record cleaning and preservation in Minnesota, answered by the team at GrooveWash.</p>
        </header>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item-content">
              <h3>{faq.q}</h3>
              {/* Use dangerouslySetInnerHTML for answers with HTML links */}
              <p dangerouslySetInnerHTML={{ __html: faq.a }} />
            </div>
          ))}
        </div>
        <section className="content-page-section">
          <h2>Still Have Questions About Vinyl Care in Minnesota?</h2>
          <p>
            We're passionate about helping you get the best sound from your vinyl collection. If you have more questions about our record cleaning services, digitization, or general vinyl care tips for the Minnesota climate, please don't hesitate to <Link to="/contact">contact GrooveWash</Link>. You can also find more information on our <Link to="/services">main services page</Link> or our <Link to="/record-cleaning-process">detailed cleaning process page</Link>.
          </p>
        </section>
      </div>
    </>
  );
};

export default VinylFAQPage; 