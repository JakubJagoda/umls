import $ from './jquery';

import Graph from './components/graph/graph';
import data from 'json!./data.json';

import Sidebar from './components/sidebar/sidebar';
const sidebar = new Sidebar();

//import Button from './components/button/button';
//const button = new Button('http://localhost');
//button.render('acb')

sidebar.render($('.sidebar'), [
    {
        name: 'abc',
        text: 'def'
    },
    {
        name: 'xyz',
        text: 'pqr'
    }
]);

const graph = new Graph('chart', {
    width: 960,
    height: 500
});


graph.setData(data);
