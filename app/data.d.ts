interface IPlainData {
    id?: number;
    name: string,
    children?: IPlainData[];
    size?: number;
}

interface IBasicNode {
    id: number;
    name: string;
}

interface INode extends IBasicNode {
    children: (INode|IChildlessNode)[];
    _children?: (INode|IChildlessNode)[];
}

interface IChildlessNode extends IBasicNode {
    size: number;
}

interface IPos {
    x: number;
    y: number;
    z: number;
}

declare module 'json!./data.json' {
    let m: IPlainData;
    export default m;
}
