import $ from './jquery';
import ByteArraySerializer from './components/soapApi/byteArraySerializer';

import Graph from './components/graph/graph';
import data from 'json!./data.json';

const graph = new Graph('chart', {
    width: 960,
    height: 500
});


graph.setData(data);
