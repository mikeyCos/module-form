// Delete or rename as needed
import './index.css';
import printMe from './components/print';

function component() {
  const element = document.createElement('p');
  element.textContent = 'Hello world';

  const btn = document.createElement('button');
  btn.innerHTML = 'Click me and check the console!';
  btn.onclick = printMe;

  element.appendChild(btn);

  return element;
}

document.body.appendChild(component());
