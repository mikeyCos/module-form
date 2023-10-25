import formConfig from './form.config';
import createElement from '../../utilities/createElement';
import './form.css';

export default (state) => ({
  type: state.type,
  cacheDOM(container) {
    this.form = container;
    this.inputs = container.querySelectorAll('.form_item');
    this.btnCancel = container.querySelector('.btn_cancel');
    this.validityErrors = container.querySelectorAll('.validity_error');
    this.btnSubmit = container.querySelector('.btn_submit');
  },
  bindEvents() {
    this.submit = this.submitForm.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.form.addEventListener('submit', this.submitForm)
    this.btnCancel.addEventListener('click', this.resetForm);
  },
  render() {
    const formElement = document.createElement('form');
    const container = document.createElement('div');
    formElement.id = 'form';
    container.classList.add('container');
    
    Object.keys(formConfig.formChildren).forEach(formChild => {
      const formItem = createElement('div');
      const formLabel = createElement('label');
      const formError = createElement('span');
      const formInput = createElement(formConfig.formChildren[formChild].element);
      formItem.setAttributes({ class: 'form_item' })
      formInput.setAttributes(formConfig.formChildren[formChild].attributes);
      formLabel.setAttributes({for: formConfig.formChildren[formChild].attributes.id});
      formLabel.textContent = formConfig.formChildren[formChild].textContent;
      formError.setAttributes({ class: `validity_error ${formConfig.formChildren[formChild].attributes.id}`});

      if (formConfig.formChildren[formChild].children) {
        // need to set option value AND textContent
        // for example, value='ch' and textContent will be Switzerland
        const { children: options } = formConfig.formChildren[formChild]
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

    const formButtons = createElement('div');
    formButtons.setAttributes({ class: 'form_buttons' });

    Object.keys(formConfig.formButtons).forEach(btn => {
      const formButton = createElement(formConfig.formButtons[btn].element);
      formButton.setAttributes(formConfig.formButtons[btn].attributes);
      formButton.textContent = btn;
      formButtons.appendChild(formButton);
    });

    container.appendChild(formButtons);
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
