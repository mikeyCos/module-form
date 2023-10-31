// creates an element
// return element with setAttributes method
const setElementState = () => ({
  setAttributes(attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      this.setAttribute(key, value);
    });
  },
});

const BuildElement = (element) => {
  const state = {
    element,
  };

  return {
    ...setElementState(state),
  };
};

export default function createElement(element) {
  const htmlElement = document.createElement(element);
  Object.assign(htmlElement, BuildElement(htmlElement));

  return htmlElement;
}
