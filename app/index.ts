import $ from './jquery';
import ByteArraySerializer from './components/soapApi/byteArraySerializer';

import Button from './components/button/button';

const button = new Button('http://google.com');
button.render('a');
