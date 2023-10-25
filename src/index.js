// Delete or rename as needed
import './index.css';
import buildForm from './components/form/form_controller';

// const staticForm = buildForm.add('static');
// document.body.appendChild(staticForm.render());
document.body.appendChild(buildForm.add('static').render());
