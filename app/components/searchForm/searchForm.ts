const template = require('./searchForm.handlebars');
import $ from '../../jquery';

type searchCallback = (searchTerm:string) => any;

export default class SearchForm {
    private element:JQuery;
    private searchCallback:searchCallback;
    private previouslySearchedTerm: string;

    render(where:HTMLElement|JQuery) {
        this.element = $(template({}));
        this.previouslySearchedTerm = '';

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
        if (searchTerm === this.previouslySearchedTerm) {
            // @todo there's a bug in graph rendering if the user searches for the same data again
            // so until it's resolve, we're just going to block that
            return;
        }

        this.previouslySearchedTerm = searchTerm;
        this.searchCallback(searchTerm);
    }

    setSearchCallback(searchCallback:searchCallback) {
        this.searchCallback = searchCallback;
    }
}
