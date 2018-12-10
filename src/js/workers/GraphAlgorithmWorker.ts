import GraphAlgorithms from "../GraphAlgorithms";
const ctx: Worker = self as any;

let myID: number;

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

ctx.addEventListener("message", async e => {
    if (e.data.type === "id") {
        myID = e.data.id;
        return;
    }
    const args: any[] = e.data.args;
    if (e.data.type === "test") {
        await sleep(e.data.waitTime);
        ctx.postMessage({ id: myID, data: "DONE" });
        return;
    }
    if ("convertToGraphImmut" in e.data && e.data.convertToGraphImmut) {
        args.push(GraphAlgorithms.graphPlainToGraphImmut(e.data.graph));
        ctx.postMessage({ id: myID, data: (GraphAlgorithms as any)[e.data.type].apply(null, args) });
    } else {
        ctx.postMessage({ id: myID, data: (GraphAlgorithms as any)[e.data.type].apply(null, args) });
    }
});
