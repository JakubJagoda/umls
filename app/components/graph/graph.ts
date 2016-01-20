import d3 from 'd3';
import $ from '../../jquery';

import d3Force = d3.layout.Force;
import Link = d3.layout.tree.Link;
import Node = d3.layout.tree.Node;

type UniversalNode = Node&IChildlessNode&INode;
type NodeClickedCallback = (node:any) => Promise<any[]>

interface IGraphSize {
    width: number;
    height: number;
}

export default class Graph {
    private node:HTMLElement;
    private data:IPlainData;
    private svg:d3.Selection<SVGElement>;
    private g: d3.Selection<SVGElement>;

    private force:d3.layout.Force<any, any>;
    private zoom:d3.behavior.Zoom<any>;

    private links:d3.selection.Update<Link<any>>;
    private nodes:d3.selection.Update<any>;
    private nodeClickedCallback:NodeClickedCallback;

    private static ZOOM_MIN_FACTOR = 0.5;
    private static ZOOM_MAX_FACTOR = 3;

    constructor(element:HTMLElement|string, private size:IGraphSize) {
        if (typeof element === 'string') {
            this.node = document.getElementById(<string>element);

            if (!element) {
                throw new Error('Invalid ID selector');
            }
        } else {
            this.node = element;
        }

        this.createGraphInNode();
    }

    private createGraphInNode() {
        const {width, height} = this.size;

        this.svg = d3.select(this.node).append('svg');
        this.g = this.svg.append('g');

        this.svg.attr('width', width)
            .attr('height', height);
    }

    setData(data:any) {
        this.data = data;
        this.renderGraph();
        this.resetZoomAndPanning();
    }

    renderGraph() {
        const {width, height} = this.size;

        this.force = d3.layout.force()
            .on('tick', this.tickHandler.bind(this))
            .linkDistance(function (d:any) {
                if (!d.children) {
                    return 0;
                }

                const MAX_DIST = 200;
                return Math.min(d.children.length * 25, MAX_DIST);
            })
            .charge(function(d){
                var charge = -1000;
                if ((<any>d)._root || (<any>d).children) charge = 10 * charge;
                return charge;
            })
            .size([width, height]);

        this.svg.attr({
            width,
            height
        });

        this.zoom = d3.behavior.zoom()
            .scaleExtent([Graph.ZOOM_MIN_FACTOR, Graph.ZOOM_MAX_FACTOR])
            .on('zoom', this.zoomHandler.bind(this));

        this.svg.call(this.zoom)
            .on('dblclick.zoom', null); // disables zoom on double click

        this.updateGraph(/*initial*/ true);
    }

    private tickHandler() {
        this.links.attr({
            x1: d => d.source.x + Graph.getNodeWidth(d.source)/2,
            y1: d => d.source.y + 15,
            x2: d => d.target.x + Graph.getNodeWidth(d.target)/2,
            y2: d => d.target.y + 15,
        });

        this.nodes.selectAll('.node').attr({
            x: d => d.x,
            y: d => d.y,
            width: d => Graph.getNodeWidth(d),
            height: 30
        });

        this.nodes.selectAll('text.node-label').attr('x', function (d) {
                return d.x - $(this).width() / 2 + Graph.getNodeWidth(d) / 2;
            })
            .attr('y', function (d) {
                return d.y + 15;
            });
    }

    private dblClickHandler(d:UniversalNode) {
        (<any>d3.event).stopPropagation();

        if (!d.children && !d._children) {
            this.nodeClickedCallback(d).then(children => {
                // children now can contain duplicated cuis! Need to remove them
                const nodesPlainData = Graph.flattenTree(this.data);

                d.children = children.filter(child => {
                    return !(nodesPlainData.find(node => (<any>node).cui === (<any>child).cui));
                });
                this.updateGraph();
            });

            return;
        } else {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
        }

        this.updateGraph();
    }

    private static flattenTree(tree:IPlainData):IChildlessNode[] {
        var nodes = [], i = 0;

        function recurse(node):number {
            if (node.children) node.size = node.children.reduce(function (p, v) {
                return p + recurse(v);
            }, 0);

            //if (!node.id) node.id = ++i;
            nodes.push(node);
            return node.size;
        }

        tree.size = recurse(tree);
        return nodes;
    }

    private updateGraph(initial: boolean = false) {
        const nodesPlainData = Graph.flattenTree(this.data);
        const linksPlainData = d3.layout.tree().links(nodesPlainData);

        var node_drag = d3.behavior.drag()
            .on('dragstart', this.dragstartHandler.bind(this))
            .on('drag', this.dragmoveHandler.bind(this))
            .on('dragend', this.dragendHandler.bind(this));

        this.force
            .nodes(nodesPlainData)
            .links(linksPlainData);

        this.links = this.g.selectAll('line.link')
            .data(linksPlainData, d => {
                return `${(<any>d.source).cui}-${(<any>d.target).cui}`
            });

        this.links.enter()
            .append('line')
            .attr({
                'class': 'link',
                x1: d => d.source.x,
                y1: d => d.source.y,
                x2: d => d.target.x,
                y2: d => d.target.y,
            });

        this.links.exit().remove();

        this.nodes = this.g.selectAll('g')
            .data<any>(nodesPlainData, function (d) {
                return d.cui;
            });

        this.nodes.selectAll('.node')
            .style('fill', Graph.getNodeColor);

        this.nodes.enter()
            .append('g')
            .attr('class', 'group')
            .append('rect')
            .attr({
                'class': 'node',
                x: d => d.x,
                y: d => d.y,
                width: d => Graph.getNodeWidth(d),
                height: 30
            })
            .style('fill', Graph.getNodeColor)
            .on('dblclick', this.dblClickHandler.bind(this))
            .call(this.force.drag)
            .call(node_drag)
            .select(function () {
                return this.parentNode;
            }) // reset to <g>
            .append('text')
            .attr({
                'class': 'node-label',
                x: d => d.x,
                y: d => d.y
            })
            .text(d => (<any>d).nstr);

        this.nodes.each(function () {
                this.parentNode.appendChild(this); // moves circles to front
            });

        this.nodes.exit().remove();

        if (initial) {
            this.force.start();
            for (let i = 0; i < 10000; ++i) {
                (<any>this.force).tick();
            }
            this.force.stop();
        } else {
            this.force.start();
        }
    }

    private static getNodeColor(d) {
        // Color leaf nodes orange, and packages white or blue.
        return d._children ? '#3182bd' : d.children ? '#c6dbef' : '#fd8d3c';
    }

    private static getNodeWidth(d) {
        //let baseSize = 8;
        //
        //if (d.children) {
        //    baseSize += d.children.length * 2.5;
        //} else if (d._children) {
        //    baseSize += d._children.length * 2.5;
        //}
        //
        //return baseSize;

        return Math.max(d.nstr.length * 7 * 1.3, 50);
    }

    setNodeClickedCallback(nodeClickedCallback:NodeClickedCallback) {
        this.nodeClickedCallback = nodeClickedCallback;
    }

    private zoomHandler() {
        const event: d3.ZoomEvent = <d3.ZoomEvent>d3.event;
        this.g.attr('transform', `translate(${event.translate})scale(${event.scale})`);
    }

    private dragstartHandler() {
        ((<MouseEvent>(<any>d3.event).sourceEvent)).stopPropagation();
        this.force.stop();
    }

    private dragmoveHandler(d) {
        ((<MouseEvent>(<any>d3.event).sourceEvent)).stopPropagation();
        const event: d3.DragEvent = <d3.DragEvent>d3.event;
        d.px += event.dx;
        d.py += event.dy;
        d.x += event.dx;
        d.y += event.dy;
        this.tickHandler();
    }

    private dragendHandler(d) {
        ((<MouseEvent>(<any>d3.event).sourceEvent)).stopPropagation();
        d.fixed = true;
        this.tickHandler();
        this.force.resume();
    }

    private resetZoomAndPanning() {
        this.g.attr('transform', `translate(0)scale(1)`);
    }
}
