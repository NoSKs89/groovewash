import React from 'react';
import { Helmet } from 'react-helmet-async';
import secrets from '../secrets';

const StructuredData = () => {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': secrets.businessName,
    'image': secrets.logoSvgUrl,
    '@id': secrets.baseUrl + '/',
    'url': secrets.baseUrl + '/',
    'telephone': secrets.phoneNumber,
    'priceRange': '$$', // TODO: Example, adjust as needed (e.g., $, $$, $$$)
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': secrets.address.streetAddress,
      'addressLocality': secrets.address.addressLocality,
      'addressRegion': secrets.address.addressRegion,
      'postalCode': secrets.address.postalCode,
      'addressCountry': secrets.address.addressCountry
    },
    'geo': { // Optional, good for service area businesses too
      '@type': 'GeoCoordinates',
      'latitude': 'YOUR_LATITUDE', // TODO: Replace with your latitude
      'longitude': 'YOUR_LONGITUDE' // TODO: Replace with your longitude
    },
    'openingHoursSpecification': [ // TODO: Adjust to your actual hours
      {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday'
        ],
        'opens': '09:00',
        'closes': '17:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': 'Saturday',
        'opens': '10:00',
        'closes': '15:00'
      }
    ],
    'department': [
      {
        '@type': 'Service',
        'name': 'Ultrasonic Vinyl Record Cleaning',
        'description': 'Professional ultrasonic cleaning for vinyl records to restore audio fidelity and preserve your collection.',
        'areaServed': {
          '@type': 'AdministrativeArea',
          'name': 'Minnesota'
        },
        'serviceType': 'Record Cleaning',
        'provider': {
          '@type': 'LocalBusiness',
          'name': secrets.businessName
        },
        // Optional: add offers for specific services
        // 'offers': {
        //   '@type': 'Offer',
        //   'price': '10', // Example price
        //   'priceCurrency': 'USD'
        // }
      },
      {
        '@type': 'Service',
        'name': 'Vinyl Record Digitization',
        'description': 'High-quality digitization of vinyl records to preserve your music in digital formats.',
         'areaServed': {
          '@type': 'AdministrativeArea',
          'name': 'Minnesota'
        },
        'serviceType': 'Record Digitization',
        'provider': {
          '@type': 'LocalBusiness',
          'name': secrets.businessName
        },
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </script>
    </Helmet>
  );
};

export default StructuredData; 