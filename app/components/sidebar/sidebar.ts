const template = require('./sidebar.handlebars');
import $ from '../../jquery';

export default class Sidebar {
    private element: JQuery;

    render(where: HTMLElement|JQuery, data: any) {
        this.element = $(template(data));

        $(where)
            .empty()
            .append(this.element);
    }

    getChecked():string[] {
        return this.element.find(`input[type='checkbox']:checked`)
            .map((_, element) => {
                return $(element).attr('id');
            }).toArray();
    }
}
