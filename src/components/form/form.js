import { inputs, formButtons } from './form.config';
import createElement from '../../utilities/createElement';
import './form.css';

export default (state) => ({
  type: state.type,
  cacheDOM(container) {
    this.form = container;
    this.inputs = container.querySelectorAll('.form_item input, .form_item select');
    this.btnCancel = container.querySelector('.btn_cancel');
    this.validityErrors = container.querySelectorAll('.validity_error');
    this.btnSubmit = container.querySelector('.btn_submit');
  },
  bindEvents() {
    this.submitForm = this.submitForm.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.form.addEventListener('submit', this.submitForm)
    this.btnCancel.addEventListener('click', this.resetForm);

    // in form_validation_controller.js
    this.validateInput = this.validateInput.bind(this);
    this.inputs.forEach(input => this.bindInput(input, 'blur'));
  },
  bindInput(input, eventType) {
    input.addEventListener(eventType, this.validateInput);
  },
  render() {
    const formElement = createElement('form');
    const container = document.createElement('div');
    formElement.setAttributes({ id: 'form', novalidate: true });
    container.classList.add('container');
    
    Object.keys(inputs).forEach(input => {
      const formItem = createElement('div');
      const formLabel = createElement('label');
      const formError = createElement('span');
      const formInput = createElement(inputs[input].element);
      formItem.setAttributes({ class: 'form_item' })
      formInput.setAttributes(inputs[input].attributes);
      formLabel.setAttributes({for: inputs[input].attributes.id});
      formLabel.textContent = inputs[input].textContent;
      formError.setAttributes({ class: `validity_error ${inputs[input].attributes.id}`, 'aria-live': 'polite'});
      formError.textContent = inputs[input].error;

      if (inputs[input].children) {
        // need to set option value AND textContent
        // for example, value='ch' and textContent will be Switzerland
        const { children: options } = inputs[input]
        for (let i = 0; i < options.countries.length; i += 1) {
          const option = createElement(options.element);

          Object.entries(options.countries[i]).forEach(([key, value]) => {
            option.value = key.toLocaleUpperCase();
            option.textContent = value;
          });
          formInput.appendChild(option);
        }
      }

      formItem.appendChild(formLabel);
      formItem.appendChild(formInput);
      formItem.appendChild(formError);
      container.appendChild(formItem);
    });

    const formButtonsContainer = createElement('div');
    formButtonsContainer.setAttributes({ class: 'form_buttons' });

    Object.keys(formButtons).forEach(btn => {
      const formButton = createElement(formButtons[btn].element);
      formButton.setAttributes(formButtons[btn].attributes);
      formButton.textContent = btn;
      formButtonsContainer.appendChild(formButton);
    });

    container.appendChild(formButtonsContainer);
    formElement.appendChild(container);

    this.cacheDOM(formElement);
    this.bindEvents();
    // validateForm(formElement);
    return formElement;
  },
  // resetForm(e) {
  //   e.preventDefault();
  //   console.log(`this.resetForm() is running from the form.js module`);
  // },
  // submitForm(e) {
  //   e.preventDefault();
  //   console.log(`this.submitForm() is running from the form.js module`);
  // }
});
