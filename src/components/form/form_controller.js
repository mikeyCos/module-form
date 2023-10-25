import form from './form';
import formValidationController from './form_validation_controller';

const initForm = (type) => {
  const state = {
    type,
  };

  return {
    ...form(state),
    ...formValidationController(state)
  }
}

export default {
  sections: [],
  add(type) {
    this.sections = [
      ...this.sections,
      initForm(type)
    ];
    return this.find(type);
  },
  remove(type) {
    this.sections.splice(this.sections.indexOf(this.find(type)), 1);
  },
  find(type) {
    return this.sections.find(section => section.type === type);
  }
}