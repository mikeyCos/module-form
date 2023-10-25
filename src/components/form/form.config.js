export default {
  formChildren: {
    email: {
      element: 'input',
      textContent: 'email',
      attributes: {
        id: 'email',
        name: 'email',
        type: 'email',
        placeholder: 'email@address.com',
      },
    },
    country: {
      element: 'select',
      textContent: 'country',
      attributes: {
        id: 'country',
        name: 'country',
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
      }
    },
    zipcode: {
      element: 'input',
      textContent: 'zip code',
      attributes: {
        id: 'zipcode',
        name: 'zipcode',
        type: 'text',
      },
    },
    password: {
      element: 'input',
      textContent: 'password',
      attributes: {
        id: 'password',
        name: 'password',
        type: 'text',
        placeholder: 'Enter password',
      },
    },
    passwordConfirmation: {
      element: 'input',
      textContent: 'confirm password',
      attributes: {
        id: 'password_confirm',
        name: 'password_confirm',
        type: 'text',
        placeholder: 'Reenter password',
      }
    }
  },
  formButtons: {
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
}