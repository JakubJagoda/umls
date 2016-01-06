interface IData {
    nodes: IExpandedDataNode[],
    links: IDataLink[]
}

interface IDataNode {
    name: string;
    group: number;
}

interface IExpandedDataNode extends IDataNode {
    x: number;
    y: number;
    fisheye?: IPos;
}

interface IDataLink {
    source: number&IPos;
    target: number&IPos;
    value: number;
}

interface IPos {
    x: number;
    y: number;
    z: number;
    fisheye?: IPos;
}

declare module 'json!./miserables.json' {
    let m: IData;
    export default m;
}
