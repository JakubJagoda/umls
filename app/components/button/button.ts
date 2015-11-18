import './button.scss';
import $ from '../../jquery';

const template : HandlebarsTemplateDelegate = require('./button.handlebars');

export default class Button {
    constructor(private link:String) {
    }

    onClick(event:Event) {
        event.preventDefault();
        alert(this.link);
    }

    render(node) {
        $('body').html(template({
            link: this.link,
            text: node
        }));
    }
}
