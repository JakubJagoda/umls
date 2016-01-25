//noinspection TypeScriptCheckImport
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
    private g:d3.Selection<SVGElement>;

    private force:d3.layout.Force<any, any>;
    private zoom:d3.behavior.Zoom<any>;
    private drag:d3.behavior.Drag<any>;

    private links:d3.selection.Update<Link<any>>;
    private nodes:d3.selection.Update<any>;
    private nodeClickedCallback:NodeClickedCallback;

    private static ZOOM_MIN_FACTOR = 0.5;
    private static ZOOM_MAX_FACTOR = 3;
    private static NODE_TITLE_MARGIN = 7.5;
    private static NODE_MIN_WIDTH = 50;
    private static NODE_HEIGHT = 30;
    private static MAX_LINK_DISTANCE = 200;
    private static LINK_DISTANCE_PER_CHILD = 25;
    private static CHARGE_VALUE = -1000;
    private static CHARGE_MULTIPLIER_FOR_NODES_WITH_CHILDREN = 10;
    private static NODE_COLOR = '#c6dbef';
    private static COLLAPSED_NODE_COLOR = '#3182bd';
    private static CHILDLESS_NODE_COLOR = '#fd8d3c';

    private textWidthHelper:d3.Selection<SVGElement>;

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

        this.textWidthHelper = this.g
            .append('g')
            .append('text')
            .attr({
                'class': 'node-label',
                x: -9999,
                y: -9999,
                visibility: 'hidden',
                'pointer-events': 'none'
            });
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

                return Math.min(d.children.length * Graph.LINK_DISTANCE_PER_CHILD, Graph.MAX_LINK_DISTANCE);
            })
            .charge(function (d) {
                let charge = Graph.CHARGE_VALUE;

                if ((<any>d)._root || (<any>d).children) {
                    charge = Graph.CHARGE_MULTIPLIER_FOR_NODES_WITH_CHILDREN * charge;
                }

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
            x1: d => d.source.x + this.getNodeWidth(d.source) / 2,
            y1: d => d.source.y + Graph.NODE_HEIGHT / 2,
            x2: d => d.target.x + this.getNodeWidth(d.target) / 2,
            y2: d => d.target.y + Graph.NODE_HEIGHT / 2,
        });

        this.nodes.selectAll('.node').attr({
            x: d => d.x,
            y: d => d.y,
            width: d => this.getNodeWidth(d),
            height: Graph.NODE_HEIGHT
        });

        const that = this; // hello ES5 my old friend, I've come to talk with you again...
        this.nodes.selectAll('.node-label').attr('x', function (d) {
                return d.x - $(this).width() / 2 + that.getNodeWidth(d) / 2;
            })
            .attr('y', function (d) {
                return d.y + Graph.NODE_HEIGHT / 2;
            });
    }

    private dblClickHandler(d:UniversalNode) {
        (<any>d3.event).stopPropagation();

        if (!d.children && !d._children) {
            this.nodeClickedCallback(d).then(children => {
                // children now can contain duplicated cuis! Need to remove them
                // @todo this will prevent bugs with empty links, but will also remove double links, which are desired
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
        var nodes = [];

        function recurse(node):number {
            if (node.children) node.size = node.children.reduce(function (p, v) {
                return p + recurse(v);
            }, 0);

            nodes.push(node);
            return node.size;
        }

        tree.size = recurse(tree);
        return nodes;
    }

    private updateGraph(initial:boolean = false) {
        const nodesPlainData = Graph.flattenTree(this.data);
        const linksPlainData = d3.layout.tree().links(nodesPlainData);

        const rootNode = nodesPlainData.find(node => (<any>node)._root);
        (<any>rootNode).fixed = true;
        (<any>rootNode).x = Number(this.svg.attr('width')) / 2;
        (<any>rootNode).y = Number(this.svg.attr('height')) / 2;


        this.drag = d3.behavior.drag()
            .on('dragstart', this.dragStartHandler.bind(this))
            .on('drag', this.dragMoveHandler.bind(this))
            .on('dragend', this.dragEndHandler.bind(this));

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

        this.nodes = this.g.selectAll('.group')
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
                width: d => this.getNodeWidth(d),
                height: Graph.NODE_HEIGHT
            })
            .style('fill', Graph.getNodeColor)
            .on('dblclick', this.dblClickHandler.bind(this))
            .call(this.force.drag)
            .call(this.drag)
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
            this.preventInitialNodeShaking();
            this.force.stop();
        } else {
            this.force.start();
        }
    }

    private preventInitialNodeShaking() {
        for (let i = 0; i < 10000; ++i) {
            (<any>this.force).tick();
        }
    }

    private static getNodeColor(d) {
        return d._children ? Graph.COLLAPSED_NODE_COLOR : d.children ? Graph.NODE_COLOR : Graph.CHILDLESS_NODE_COLOR;
    }

    private getNodeWidth(d) {
        this.textWidthHelper.text(d.nstr);
        return Math.max($(this.textWidthHelper[0]).width() + Graph.NODE_TITLE_MARGIN * 2, Graph.NODE_MIN_WIDTH);
    }

    setNodeClickedCallback(nodeClickedCallback:NodeClickedCallback) {
        this.nodeClickedCallback = nodeClickedCallback;
    }

    private zoomHandler() {
        const event:d3.ZoomEvent = <d3.ZoomEvent>d3.event;
        this.g.attr('transform', `translate(${event.translate})scale(${event.scale})`);
    }

    private dragStartHandler() {
        ((<MouseEvent>(<any>d3.event).sourceEvent)).stopPropagation();
        this.force.stop();
    }

    private dragMoveHandler(d) {
        ((<MouseEvent>(<any>d3.event).sourceEvent)).stopPropagation();
        const event:d3.DragEvent = <d3.DragEvent>d3.event;
        d.px += event.dx;
        d.py += event.dy;
        d.x += event.dx;
        d.y += event.dy;
        this.tickHandler();
    }

    private dragEndHandler(d) {
        ((<MouseEvent>(<any>d3.event).sourceEvent)).stopPropagation();
        d.fixed = true;
        this.tickHandler();
        this.force.resume();
    }

    private resetZoomAndPanning() {
        this.g.attr('transform', `translate(0)scale(1)`);
    }
}
