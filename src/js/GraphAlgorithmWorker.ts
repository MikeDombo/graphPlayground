import GraphAlgorithms from './GraphAlgorithms';
const ctx: Worker = self as any;

ctx.addEventListener('message', (e) => {
    const args = e.data.args;
    if("convertToGraphImmut" in e.data && e.data.convertToGraphImmut){
        args.push(GraphAlgorithms.graphPlainToGraphImmut(e.data.graph));
        ctx.postMessage((GraphAlgorithms as any)[e.data.type].apply(null, args));
    }
    else {
        ctx.postMessage((GraphAlgorithms as any)[e.data.type].apply(null, args));
    }
});
