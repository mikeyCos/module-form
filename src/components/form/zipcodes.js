export default [
  {
    // fallback error message when no country is selected
    iso: '',
    regex: '',
    error: 'Select a country and enter a valid zip code corresponding to the selected country.',
  },
  {
    country: 'swizterland',
    iso: 'ch',
    regex: '(CH-)?\\d{4}',
    error: 'Switzerland zip codes must be between 4-7 characters long (e.g., "CH-1950" or "1950").',
  },
  {
    country: 'united kingdom',
    iso: 'gb',
    regex: '[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}',
    error:
      'United Kingdom zip codes must be between 6-8 characters long (e.g., "SW1W 0NY" or "L1 8JQ").',
  },
  {
    country: 'united states',
    iso: 'us',
    regex: '\\b(\\d){5}(([ \\-])?\\d{4})?',
    error:
      'United States zip codes must be between 5-10 characters long made up with only digits and a single space/hyphen (e.g., "12345" or "12345-6789").',
  },
  {
    country: 'canada',
    iso: 'ca',
    regex: '([A-Z]\\d[A-Z]) (\\d[A-Z]\\d)',
    error: 'Canada zip codes must be 7 characters long (e.g., "C0A 1A0").',
  },
];
