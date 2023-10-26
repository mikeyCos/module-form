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
    const error = [...this.validityErrors].find(validityError => validityError.classList.contains(input.id));
    const validity = input.checkValidity();
    const { type } = e;
    console.log(validity);
    if (!validity) {
      if (type === 'blur' && !input.classList.contains('input_error')) {
        console.log('validity is false AND type is blur');
        this.bindInput(input, 'input');
        // if inut does not pass the onblur event check
      } else if (type === 'input') {
        console.log('validity is false AND type is input');
      } else {
        console.log('validity is false and else running')
      }
      error.style.visibility = 'visible';
      input.classList.add('input_error');
      // input.setCustomValidity('Test');
      // input.reportValidity();
    } else {
      error.style.visibility = 'hidden';
      input.classList.remove('input_error');
      input.removeEventListener('input', this.validateInput);
    }
  }
});

// first
// validate input [onblur]
// second
// validate input on [input] when input is [focus]
// validate ALL inputs when form is submitted