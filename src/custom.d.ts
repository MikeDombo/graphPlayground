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
declare module "worker-loader!*" {
    class WebpackWorker extends Worker {
        constructor();
    }

    export = WebpackWorker;
}
