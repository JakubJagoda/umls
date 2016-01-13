import * as d3 from 'd3';
import d3Force = d3.layout.Force;
import Link = d3.layout.tree.Link;
import Node = d3.layout.tree.Node;

type UniversalNode = Node&IChildlessNode&INode;

interface IGraphSize {
    width: number;
    height: number;
}

export default class Graph {
    private node:HTMLElement;
    private data:IPlainData;
    private svg:d3.Selection<SVGElement>;
    private force:d3.layout.Force<any, any>;
    private links:d3.selection.Update<Link<Node>>;
    private nodes:d3.selection.Update<UniversalNode>;

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

    setData(data:IPlainData) {
        this.data = data;
        this.renderGraph();
    }

    renderGraph() {
        const {width, height} = this.size;

        this.force = d3.layout.force()
            .on("tick", this.tickHandler.bind(this))
            .charge(function (d) {
                return (<any>d)._children ? -(<any>d).size / 100 : -30;
            })
            .linkDistance(function (d) {
                return (<any>d.target)._children ? 80 : 30;
            })
            .size([width, height]);

        this.svg.attr({
            width,
            height
        });

        this.updateGraph();
    }

    private tickHandler() {
        this.links.attr("x1", function (d) {
                return d.source.x;
            })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            });

        this.nodes.attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            });
    }

    private dblClickHandler(d: UniversalNode) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }

        this.updateGraph();
    }

    private static flattenTree(tree:IPlainData):IChildlessNode[] {
        var nodes = [], i = 0;

        function recurse(node):number {
            if (node.children) node.size = node.children.reduce(function (p, v) {
                return p + recurse(v);
            }, 0);

            if (!node.id) node.id = ++i;
            nodes.push(node);
            return node.size;
        }

        tree.size = recurse(tree);
        return nodes;
    }

    private updateGraph() {
        var nodesPlainData = Graph.flattenTree(this.data),
            linksPlainData = d3.layout.tree().links(nodesPlainData);

        // Restart the force layout.
        this.force
            .nodes(nodesPlainData)
            .links(linksPlainData)
            .start();

        // Update the links…
        this.links = this.svg.selectAll<UniversalNode>("line.link")
            .data(linksPlainData, function (d) {
                return (<any>d.target).id;
            });

        // Enter any new links.
        this.links.enter().insert("svg:line", ".node")
            .attr("class", "link")
            .attr("x1", function (d) {
                return d.source.x;
            })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            });

        // Exit any old links.
        this.links.exit().remove();

        // Update the nodes…
        this.nodes = this.svg.selectAll("circle.node")
            .data<any>(nodesPlainData, function (d) {
                return d.id;
            })
            .style("fill", Graph.getNodeColor);

        this.nodes.transition()
            .attr("r", function (d) {
                return d.children ? 4.5 : Math.sqrt(d.size) / 10;
            });

        var zoom = d3.behavior.zoom()
            .scaleExtent([1, 10])
            .on("zoom", (...args) => {
                if(!d3.event) {
                    return;
                }
                const event: d3.ZoomEvent = <d3.ZoomEvent>d3.event;
                this.svg.attr("transform", "translate(" + event.translate + ")scale(" + event.scale + ")");
            });

        // Enter any new nodes.
        this.nodes.enter().append("svg:circle")
            .attr("class", "node")
            .attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            })
            .attr("r", function (d) {
                return d.children ? 4.5 : Math.sqrt(d.size) / 10;
            })
            .style("fill", Graph.getNodeColor)
            .on("dblclick", this.dblClickHandler.bind(this))
            .call(this.force.drag)
            .call(zoom);

        // Exit any old nodes.
        this.nodes.exit().remove();
    }

    private static getNodeColor(d) {
        // Color leaf nodes orange, and packages white or blue.
        return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
    }
}
