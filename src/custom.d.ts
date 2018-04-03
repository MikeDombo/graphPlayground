import {EdgeImmutPlain} from "./js/GraphImmut/EdgeImmut";
import {NodeImmutPlain} from "./js/GraphImmut/NodeImmut";

declare global {
    interface GraphPlain {
        edges: EdgeImmutPlain[];
        nodes: NodeImmutPlain[];
        directed?: boolean;
        weighted?: boolean
    }
}
