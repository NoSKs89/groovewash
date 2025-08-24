// sitemap-generator.js
// This script manually generates a sitemap.xml.

const { writeFileSync } = require('fs');
const { resolve } = require('path');

// Your website's base URL
const hostname = "https://groovewash.com";

// Manually list your application's paths
const paths = ['/', '/waiver', '/services', '/faq', '/why-choose-us-minnesota', '/vinyl-care-faq-minnesota', '/benefits-record-cleaning-minnesota', '/record-cleaning-process', '/contact'];

// Get today's date in YYYY-MM-DD format for the <lastmod> tag
const today = new Date().toISOString().split('T')[0];

// Construct the sitemap XML string
const sitemapXml = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${paths.map(path => `
    <url>
      <loc>${hostname}${path}</loc>
      <lastmod>${today}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>${path === '/' ? '1.0' : '0.8'}</priority>
    </url>
  `).join('')}
</urlset>
`;

try {
  // Write the sitemap to the public folder
  writeFileSync(resolve(__dirname, 'public', 'sitemap.xml'), sitemapXml.trim());
  console.log('Sitemap generated successfully at ./public/sitemap.xml (manual method)!');
} catch (error) {
  console.error('Error generating sitemap (manual method):', error);
} 