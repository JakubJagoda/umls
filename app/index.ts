import $ from './jquery';
import ByteArraySerializer from './components/soapApi/byteArraySerializer';

import Graph from './components/graph/graph';
import miserables from 'json!./miserables.json';

const graph = new Graph('chart', {
    width: 960,
    height: 500
});

graph.setData(miserables);
