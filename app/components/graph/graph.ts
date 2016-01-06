import fisheyeFilter from '../fisheyeFilter/fisheyeFilter';
import * as d3 from 'd3';

interface IGraphSize {
    width: number;
    height: number;
}

d3.fisheye = fisheyeFilter;

export default class Graph {
    private node:HTMLElement;
    private data:IData;
    private svg:d3.Selection<SVGElement>;

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

    setData(data:IData) {
        this.data = data;
        this.renderGraph();
    }

    renderGraph() {
        const n = this.data.nodes.length;

        const force = d3.layout.force()
            .charge(-240)
            .linkDistance(40)
            .size([this.size.width, this.size.height]);

        force.nodes(this.data.nodes).links(this.data.links);

        // Initialize the positions deterministically, for better results.
        this.data.nodes.forEach((d, i) => {
            d.x = d.y = this.size.width / n * i;
        });

        // Run the layout a fixed number of times.
        // The ideal number of times scales with graph complexity.
        // Of course, don't run too long—you'll hang the page!
        force.start();
        for (let i = n; i > 0; --i) {
            (<any>force).tick(); //hack, but typings for d3 don't include that
        }
        force.stop();

        // Center the nodes in the middle.
        let ox = 0, oy = 0;
        this.data.nodes.forEach(d => {
            ox += d.x;
            oy += d.y;
        });
        ox = ox / n - this.size.width / 2;
        oy = oy / n - this.size.height / 2;
        this.data.nodes.forEach(d => {
            d.x -= ox;
            d.y -= oy;
        });

        const link = this.svg.selectAll(".link")
            .data(this.data.links)
            .enter().append('g').append("line")
            .attr("class", "link")
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y)
            .style("stroke-width", d => Math.sqrt(d.value));

        const labels = d3.select(this.node).selectAll('.link').select(function () {
                return this.parentNode;
            })
            .append('text').text(d => d.value)
            .attr("class", "edge-label")
            .style("fill", "#555").style("font-family", "Arial").style("font-size", 12)
            .attr("x", function (d) {
                return (d.source.x + d.target.x) / 2;
            })
            .attr("y", function (d) {
                return (d.source.y + d.target.y) / 2;
            });

        const color = d3.scale.category20<number>();

        const node = this.svg.selectAll(".node")
            .data(this.data.nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 4.5)
            .style("fill", d => color(<any>d.group)) //Webstorm, y u underline dis? It is correct without this explicit typecast!
            .call(force.drag);

        const fisheye: any = d3.fisheye.circular()
            .radius(120);

        this.svg.on("mousemove", function() {
            fisheye.focus(d3.mouse(this));

            node.each(function(d) { d.fisheye = fisheye(d); })
                .attr("cx", d => d.fisheye.x)
                .attr("cy", d => d.fisheye.y)
                .attr("r", d => d.fisheye.z * 4.5);

            link.attr("x1", d => d.source.fisheye.x)
                .attr("y1", d => d.source.fisheye.y)
                .attr("x2", d => d.target.fisheye.x)
                .attr("y2", d => d.target.fisheye.y);

            labels.attr("x", d => (d.source.fisheye.x + d.target.fisheye.x) / 2)
                .attr("y", d => (d.source.fisheye.y + d.target.fisheye.y) / 2)
        });
    }
}
