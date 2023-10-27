import zipcodes from './zipcodes';

export default () => ({
  resetForm() {
    this.form.reset();
  },
  submitForm(e) {
    e.preventDefault();
    this.inputs.forEach(input => this.validateInput(input))
    
    this.resetForm();
  },
  validateInput(e) {
    const input = e.currentTarget ? e.currentTarget : e;
    if (input.id === 'password_confirm') {
      input.pattern = [...this.inputs].find(key => key.type === input.type).value;
    } else if (input.id === 'zipcode') {
      const inputCountry = [...this.inputs].find(key => key.id === 'country');
      const iso = Object.keys(zipcodes).find(value => value === inputCountry.value);
      console.log(iso)
      console.log(zipcodes[iso]);
      // input.pattern = zipcodes[iso];
      // [...this.validityErrors].find(key => key.classList.contains(input.id)).textContent = 'test'
    }

    const error = [...this.validityErrors].find(validityError => validityError.classList.contains(input.id));
    const validity = input.checkValidity();
    const { type } = e;
    console.log(validity);

    if (!validity) {
      if (type === 'blur' && !input.classList.contains('input_error')) {
        // validity check is aggressive
        console.log('validity is false AND type is blur');
        this.bindInput(input, 'input');
      } else if (type === 'input') {
        console.log('validity is false AND type is input');
      } else {
        console.log('validity is false and else running');
      }
      // error.style.visibility = 'visible';
      error.style.display = 'block';
      input.classList.add('input_error');
    } else {
      // error.style.visibility = 'hidden';
      error.style.display = 'none';
      input.classList.remove('input_error');
      input.removeEventListener('input', this.validateInput);
    }
  },
});