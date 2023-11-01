import { inputs, formButtons } from './form.config';
import createElement from '../../utilities/createElement';
import './form.css';
import visibility_on from '../../assets/icons/visibility_on.svg';
import visibility_off from '../../assets/icons/visibility_off.svg';

export default (state) => ({
  type: state.type,
  cacheDOM(container) {
    this.form = container;
    this.inputs = container.querySelectorAll('.form_item input, .form_item select');
    this.btnCancel = container.querySelector('.btn_cancel');
    this.validityErrors = container.querySelectorAll('.validity_error');
    this.btnSubmit = container.querySelector('.btn_submit');
    this.btnsVisibility = container.querySelectorAll('.btn_visibility');
  },
  bindEvents() {
    this.submitForm = this.submitForm.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.togglePassword = this.togglePassword.bind(this);
    this.form.addEventListener('submit', this.submitForm);
    this.btnCancel.addEventListener('click', this.resetForm);
    this.btnsVisibility.forEach((btn) => btn.addEventListener('click', this.togglePassword));

    // in form_validation_controller.js
    this.validateInput = this.validateInput.bind(this);
    this.inputs.forEach((input) => this.bindInput(input, 'blur'));
  },
  bindInput(input, eventType) {
    input.addEventListener(eventType, this.validateInput);
  },
  render() {
    const formElement = createElement('form');
    const container = document.createElement('div');
    formElement.setAttributes({ id: 'form', novalidate: true });
    container.classList.add('container');

    Object.keys(inputs).forEach((input) => {
      const formItem = createElement('div');
      const formLabel = createElement('label');
      const formError = createElement('span');
      const inputWrapper = createElement('div');
      const formInput = createElement(inputs[input].element);

      formItem.setAttributes({ class: 'form_item' });
      formInput.setAttributes(inputs[input].attributes);
      inputWrapper.setAttributes({ class: 'input_wrapper' });
      formLabel.setAttributes({ for: inputs[input].attributes.id });
      formLabel.textContent = inputs[input].textContent;
      formError.setAttributes({
        class: `validity_error ${inputs[input].attributes.id}`,
        'aria-live': 'polite',
      });
      formError.textContent = inputs[input].error;

      inputWrapper.appendChild(formInput);

      if (inputs[input].children) {
        // need to set option value AND textContent
        // for example, value='ch' and textContent will be Switzerland
        const { children: options } = inputs[input];
        for (let i = 0; i < options.countries.length; i += 1) {
          const option = createElement(options.element);

          Object.entries(options.countries[i]).forEach(([key, value]) => {
            option.value = key;
            option.textContent = value;
          });
          formInput.appendChild(option);
        }
      } else if (inputs[input].sibling) {
        const btnVisibility = createElement(inputs[input].sibling.element);
        const visibilityIcon = createElement(inputs[input].sibling.child.element);
        btnVisibility.setAttributes(inputs[input].sibling.attributes);
        visibilityIcon.setAttributes(inputs[input].sibling.child.attributes);

        btnVisibility.appendChild(visibilityIcon);
        inputWrapper.appendChild(btnVisibility);
      }

      formItem.appendChild(formLabel);
      formItem.appendChild(inputWrapper);
      formItem.appendChild(formError);
      container.appendChild(formItem);
    });

    const formButtonsContainer = createElement('div');
    formButtonsContainer.setAttributes({ class: 'form_buttons' });

    Object.keys(formButtons).forEach((btn) => {
      const formButton = createElement(formButtons[btn].element);
      formButton.setAttributes(formButtons[btn].attributes);
      formButton.textContent = btn;
      formButtonsContainer.appendChild(formButton);
    });

    container.appendChild(formButtonsContainer);
    formElement.appendChild(container);

    this.cacheDOM(formElement);
    this.bindEvents();
    return formElement;
  },
  togglePassword(e) {
    const input = e.currentTarget.previousSibling;
    const icon = e.currentTarget.firstChild;
    const newIcon = createElement('img');
    newIcon.setAttributes({
      class: icon.classList,
      src: icon.dataset.injectUrl === visibility_on ? visibility_off : visibility_on,
      onload: 'SVGInject(this)',
    });

    input.type !== 'text' ? (input.type = 'text') : (input.type = 'password');
    icon.replaceWith(newIcon);
  },
});
