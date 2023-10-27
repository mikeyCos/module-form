export default {
  // swizterland, ch
  // united kingdom, gb
  // united states, us
  // canada, ca
  ch: [
    '(CH-)?\\d{4}',
    'test'
  ],
  gb: [
    '[A-Z]{1,2}[0-9R][0-9A-Z]?\\s*[0-9][A-Z-[CIKMOV]]{2}'
  ],
  us: [
    '^\\b\\d{5}\\b(?:[- ]{1}\\d{4})?'
  ],
  ca: [
    '(?=[^DdFfIiOoQqUu\\d\\s])[A-Za-z]\\d(?=[^DdFfIiOoQqUu\\d\\s])[A-Za-z]\\s{0,1}\\d(?=[^DdFfIiOoQqUu\\d\\s])[A-Za-z]\\d'
  ]
}