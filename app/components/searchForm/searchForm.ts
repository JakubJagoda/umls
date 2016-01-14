const template = require('./searchForm.handlebars');
import $ from '../../jquery';

type searchCallback = (searchTerm:string) => any;

export default class SearchForm {
    private element:JQuery;
    private searchCallback:searchCallback;

    render(where:HTMLElement|JQuery) {
        this.element = $(template({}));

        $(where)
            .empty()
            .append(this.element);

        this.element.find(`input[type='text']`).on('keydown', e => {
            if (e.which === 13) {
                this.searchData(this.element.find(`input[type='text']`).val());
            }
        });

        this.element.find('button').on('click', () => {
            this.searchData(this.element.find(`input[type='text']`).val());
        })
    }

    searchData(searchTerm:string) {
        this.searchCallback(searchTerm);
    }

    setSearchCallback(searchCallback:searchCallback) {
        this.searchCallback = searchCallback;
    }
}
