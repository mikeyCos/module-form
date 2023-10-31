import zipcodes from './zipcodes';

export default () => ({
  resetForm() {
    this.inputs.forEach((input) => {
      input.value = '';
      input.classList.remove('input_error');
    });

    this.validityErrors.forEach((error) => {
      error.style.display = 'none';
    });
  },
  submitForm(e) {
    e.preventDefault();
    this.inputs.forEach((input) => this.validateInput(input));
    if ([...this.inputs].every((input) => this.validateInput(input))) {
      console.log('form can be submitted');
    } else {
      console.log('form CANNOT be submitted');
    }
    // this.resetForm();
  },
  validateInput(e) {
    const input = e.currentTarget ? e.currentTarget : e;
    const error = [...this.validityErrors].find((validityError) =>
      validityError.classList.contains(input.id),
    );

    if (input.id === 'password_confirm') {
      input.pattern = [...this.inputs].find((key) => key.type === input.type).value;
    } else if (input.id === 'zipcode') {
      const inputCountry = [...this.inputs].find((key) => key.id === 'country');
      const zipCountry = Object.values(zipcodes).find(
        (country) => country.iso === inputCountry.value,
      );

      if (zipCountry) {
        input.pattern = zipCountry.regex;
        error.textContent = zipCountry.error;
      }
    }

    const validity = input.checkValidity();
    const { type } = e;

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

    return validity;
  },
});
