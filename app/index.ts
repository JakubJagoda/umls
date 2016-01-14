import $ from './jquery';

import Graph from './components/graph/graph';

const graph = new Graph('chart', {
    width: 960,
    height: 500
});

import Sidebar from './components/sidebar/sidebar';
const sidebar = new Sidebar();

import SearchForm from './components/searchForm/searchForm';
const searchForm = new SearchForm();

import SoapApi from './components/soapApi/soapApi';
const soapApi = new SoapApi();

require('./style.scss');

soapApi.getHierarchyRoots().then(hierarchyRoots => {
    sidebar.render($('.sidebar'), hierarchyRoots);
});

searchForm.render($('.search-form'));
searchForm.setSearchCallback(searchTerm => {
    soapApi.getMainConcepts(searchTerm).then(data => {
        const properData = {
            nstr: searchTerm,
            cui: searchTerm,
            size: data.length,
            children: data.map(datum => {
                datum['size'] = 1;
                return datum;
            })
        };

        graph.setData(properData);
    });
});

graph.setNodeClickedCallback(node => {
    return soapApi.getRelatedConcepts(node.cui, sidebar.getCheckedRelations()).then(res => {
        node.size = res.length;
        return res.map(datum => {
            datum['size'] = 1;
            return datum;
        });
    })
});


