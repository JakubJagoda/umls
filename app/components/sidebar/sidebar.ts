const template = require('./sidebar.handlebars');
import $ from '../../jquery';
import SoapApi from '../soapApi/soapApi';

const soapApi = new SoapApi();

export default class Sidebar {
    private element:JQuery;

    render(where:HTMLElement|JQuery, data:any) {
        this.element = $(template(data));

        $(where)
            .empty()
            .append(this.element);

        this.element.find(`input[type='checkbox']:eq(0)`).on('change', e => {
            e.preventDefault();
            this.element.find(`input[type='checkbox']`).prop('checked', $(e.target).is(':checked'));
        });
    }

    getCheckedRelations():string[] {
        return this.element.find(`input[type='checkbox']:gt(0):checked`)
            .map((_, element) => {
                return $(element).attr('id');
            }).toArray();
    }
}
