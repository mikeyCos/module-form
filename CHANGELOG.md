# Changelog
---
### 31 OCT 2023
- Added `@iconfu/svg-inject` to `devDependencies`, implemented `togglePassword(e)` method that can show/hide password when button is clicked, inputs involving password now have a sibiling property in `form.config.js` module, and applied a variety of CSS properties.  
---
### 30 OCT 2023
- Zipcodes object type changed from object to an array object with the following properties: (`country`, `iso`, `regex`, `error`), the country corresponding to the `<select id= "country" ...attributes></select>` value is retrieved from zipcodes, if `zipCountry` exists then the appropriate pattern attribute and text content is set corresponding to the selected country, if `zipCountry` does not exist then the zipcode's 'fallback' error message is displayed, and wrapped the inputs and images with a `div` container.   
---
### 27 OCT 2023
- Created `.prettierignore` and `.prettierrc.json` files, ESLint and Prettier should now work with this module, and removed `.vscode/` directory.  
---
### 26 OCT 2023
- Regular expression for password now works and will require at least one of each of the following: 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character, password confirmation input will use the password's value as it's pattern attribute, and selecting a country option will set the zip codes pattern attribute.   
---
### 25 OCT 2023
- Created `validateInput()` inside `form_validation_controller.js` module, `validateInput()` validates one input at a time, an input's validity is checked first on blur and an event listener for input is added if `checkValidity()` returns false, `submitForm()` and `resetForm()` methods added to `form_validation_controller.js` module, and removed outer object in `form.config.js`, `form.config.js` now exports two object literals.  
---
### 24 OCT 2023
- Created a `form_controller.js` module to control and initialize forms based on a state, created a `form.config.js` module that holds objects to be rendered in the `form.js` module, and initialized `form_validation_controller.js` module.  
---
### 23 OCT 2023
- Initialized module-form, created utility module `createElement.js` that creates an element and assigns `setAttributes()` method to the element, initialized `form.js` and renders a basic form.   
---
### 11 OCT 2023
- Initial module_webpack_starter package created.  
---
### 12 OCT 2023
- Added instructions section to README.md.
---