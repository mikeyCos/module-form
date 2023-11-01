// Delete or rename as needed
import './index.css';
import initForm from './components/form/init_form';
import SVGInject from '@iconfu/svg-inject';

// const staticForm = buildForm.add('static');
// document.body.appendChild(staticForm.render());
document.body.appendChild(initForm.add('static').render());
