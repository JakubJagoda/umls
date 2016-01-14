import * as d3 from 'd3';
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
    private force:d3.layout.Force<any, any>;
    private links:d3.selection.Update<Link<any>>;
    private nodes:d3.selection.Update<any>;
    private nodeClickedCallback:NodeClickedCallback;

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

        this.svg = d3.select(this.node).append("svg");

        this.svg.attr("width", width)
            .attr("height", height);

        this.svg.append("rect")
            .attr("class", "background")
            .attr("width", width)
            .attr("height", height);
    }

    setData(data:any) {
        this.data = data;
        this.renderGraph();
    }

    renderGraph() {
        const {width, height} = this.size;

        this.force = d3.layout.force()
            .on("tick", this.tickHandler.bind(this))
            .charge(function (d) {
                return (<any>d)._children ? -100 : -200;
            })
            .linkDistance(function (d) {
                return (<any>d.target)._children ? 150 : 100;
            })
            .size([width, height]);

        this.svg.attr({
            width,
            height
        });

        this.updateGraph();
    }

    private tickHandler() {
        this.links.attr({
            x1: d => d.source.x,
            y1: d => d.source.y,
            x2: d => d.target.x,
            y2: d => d.target.y,
        });

        this.nodes.selectAll('circle.node').attr({
            cx: d => d.x,
            cy: d => d.y,
            r: d => Graph.getNodeR(d)
        });

        this.nodes.selectAll('text.node-label').attr("x", function (d) {
                return d.x - $(this).width() / 2;
            })
            .attr("y", function (d) {
                return d.y;
            });
    }

    private dblClickHandler(d:UniversalNode) {
        if (!d.children && !d._children) {
            this.nodeClickedCallback(d).then(children => {
                d.children = children;
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

    private updateGraph() {
        const nodesPlainData = Graph.flattenTree(this.data);
        const linksPlainData = d3.layout.tree().links(nodesPlainData);

        this.force
            .nodes(nodesPlainData)
            .links(linksPlainData)
            .start();

        this.links = this.svg.selectAll('line.link')
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

        this.nodes = this.svg.selectAll("g")
            .data<any>(nodesPlainData, function (d) {
                return d.cui;
            });

        this.nodes.selectAll('circle.node')
            .style('fill', Graph.getNodeColor);

        this.nodes.enter()
            .append('g')
            .attr('class', 'group')
            .append('circle')
            .attr({
                'class': 'node',
                cx: d => d.x,
                cy: d => d.y,
                r: d => Graph.getNodeR(d)
            })
            .style('fill', Graph.getNodeColor)
            .on('dblclick', this.dblClickHandler.bind(this))
            .call(this.force.drag)
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
    }

    private static getNodeColor(d) {
        // Color leaf nodes orange, and packages white or blue.
        return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
    }

    private static getNodeR(d) {
        let baseSize = 8;

        if (d.children) {
            baseSize += d.children.length * 2.5;
        } else if (d._children) {
            baseSize += d._children.length * 2.5;
        }

        return baseSize;
    }

    setNodeClickedCallback(nodeClickedCallback:NodeClickedCallback) {
        this.nodeClickedCallback = nodeClickedCallback;
    }
}
