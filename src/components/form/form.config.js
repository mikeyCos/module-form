
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
    error: 'Use a valid email address (e.g., your_email@xyz.com).'
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
    error: 'Select a country.'
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
    error: 'Enter a valid zip code corresponding to the selected country.'
  },
  password: {
    element: 'input',
    textContent: 'password',
    attributes: {
      id: 'password',
      class: 'form_input',
      name: 'password',
      type: 'password',
      placeholder: 'Enter password',
      required: true,
      pattern: '(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\\W)(?!.* ).{8,30}'
    },
    error: 'Password must be at least 8 characters long, can be up to 30 characters long, and must contain 1 of each of the following: uppercase letter, lowercase letter, number, and special character. No spaces allowed.'
  },
  passwordConfirmation: {
    element: 'input',
    textContent: 'confirm password',
    attributes: {
      id: 'password_confirm',
      class: 'form_input',
      name: 'password_confirm',
      type: 'password',
      placeholder: 'Reenter password',
      required: true
    },
    error: 'Passwords do not match.'
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