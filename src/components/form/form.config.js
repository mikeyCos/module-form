
export const inputs = {
  email: {
    element: 'input',
    textContent: 'email',
    attributes: {
      id: 'email',
      class: 'form_input',
      name: 'email',
      type: 'email',
      placeholder: 'email@address.com',
      required: true
    },
    error: 'error placeholder email'
  },
  country: {
    element: 'select',
    textContent: 'country',
    attributes: {
      id: 'country',
      class: 'form_input',
      name: 'country',
      required: true
    },
    children: {
      element: 'option',
      countries: [
        { '': ' '},
        { ch: 'Switzerland' },
        { gb: 'United Kingdom'},
        { us: 'United States'},
        { ca: 'Canada'},
      ]
    },
    error: 'error placeholder country'
  },
  zipcode: {
    element: 'input',
    textContent: 'zip code',
    attributes: {
      id: 'zipcode',
      class: 'form_input',
      name: 'zipcode',
      type: 'text',
      required: true
    },
    error: 'error placeholder zip code'
  },
  password: {
    element: 'input',
    textContent: 'password',
    attributes: {
      id: 'password',
      class: 'form_input',
      name: 'password',
      type: 'text',
      placeholder: 'Enter password',
      required: true,
      // pattern: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
    },
    error: 'error placeholder password'
  },
  passwordConfirmation: {
    element: 'input',
    textContent: 'confirm password',
    attributes: {
      id: 'password_confirm',
      class: 'form_input',
      name: 'password_confirm',
      type: 'text',
      placeholder: 'Reenter password',
      required: true
    },
    error: 'error placeholder pasword confirmation'
  }
}

export const formButtons = {
  cancel: {
    element: 'button',
    attributes: {
      class: 'btn_cancel',
    }
  },
  submit: {
    element: 'button',
    attributes: {
      class: 'btn_submit',
    }
  }
}