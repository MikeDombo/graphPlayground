# Contents

## No-Input Algorithms
- [Eulericity](#eulericity)
- [Cyclicity](#cyclicity)
- [Connected Components](#connected-components)
- [Strongly Connected Components](#strongly-connected-components)
- [Topological Sort](#topological-sort)
- [Graph Coloring](#graph-coloring)
- [Kruskal Minimum Spanning Tree](#kruskal-minimum-spanning-tree)

## Input Algorithms
- [Breadth-First Shortest Path](#breadth-first-shortest-path)
- [Dijkstra Shortest Path](#dijkstra-shortest-path)
- [Bellman-Ford Shortest Path](#bellman-ford-shortest-path)
- [Ford-Fulkerson MinCut-MaxFlow](#ford-fulkerson-mincut-maxflow)


# Algorithms


## Eulericity
In graph theory, an Eulerian circuit is a path in a finite graph which visits every edge exactly once, starting and ending at the same vertex (Paraphrased from [Wikipedia](https://en.wikipedia.org/wiki/Eulerian_path)).

For a graph to be Eulerian, it must have vertices with even degree (excluding zero) belonging to the same [connected component](#connected-components). Similarly in directed graphs, it must have vertices with equal in and out degrees and vertices with non-zero in degree must be in the same [strongly conncted component](#strongly-connected-components).

### Usage in Graph Algorithm Playground
For undirected graphs the Eulericity is automatically calculated with every change you make to the graph. Simply see the "Graph Properties" pane for the current state.

For directed graphs either click on "Eulerian" in the Algorithms pane, or click "calculate All Properties" in the toolbar.


## Cyclicity
A graph has a cycle when there exists a path from vertex x to vertex x through one or more vertices y without repeating edges.

To find cycles in directed graphs I use a topological sort. [See more about that here.](#topological-sort)

### Usage in Graph Algorithm Playground
For directed graphs either click on "Cyclic" in the Algorithms pane, or click "calculate All Properties" in the toolbar.


## Connected Components
For undirected graphs, a conncted component is a subgraph containing some number of vertices conncted to each other by paths and disconnected from all other connected components.

### Usage in Graph Algorithm Playground
For undirected graphs, click on "Connected Components" in the Algorithms pane, or click "calculate All Properties" in the toolbar.

For directed graphs, see [Strongly Connected Components](#strongly-connected-components)


## Strongly Connected Components
For directed graphs, a strongly conncted component (scc) is a subgraph containing some number of vertices for which each pair is connected by an edge so that every vertex can reach every other vertex in that scc. The algorithm implemented is Tarjan's strongly connected components algorithm, [see Wikipedia here for more.](https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm)

### Usage in Graph Algorithm Playground
For directed graphs, click on "Strongly Connected Components" in the Algorithms pane, or click "calculate All Properties" in the toolbar.

For undirected graphs, see [Connected Components](#connected-components)


## Topological Sort
 Topological sort of a directed graph is an ordering of its vertices such that for every directed edge uv from vertex u to vertex v, u comes before v in the ordering (paraphrased from [Wikipedia](https://en.wikipedia.org/wiki/Topological_sorting)). Topological sortings are only possible in directed acyclic graphs (DAG).

 The algorithm implemented is [Kahn's algorithm](https://en.wikipedia.org/wiki/Topological_sorting#Kahn.27s_algorithm) which has a runtime of O(|V| + |E|). The sorting will be *a* correct ordering since multiple orders are possible.

 I also use the topological sort functionality to check for cycles in a directed graph because the sort will fail if the input graph is not a DAG.

### Usage in Graph Algorithm Playground
For directed graphs, click on "Topological Sort" in the Algorithms pane.


## Graph Coloring
The graph coloring implemented is a vertex coloring. The graph coloring applies to undirected graphs. A vertex coloring means that every vertex gets assigned a color where no two adjacent vertices can have the same color. [Read more about graph coloring on Wikipedia.](https://en.wikipedia.org/wiki/Graph_coloring)

The algorithm used is a greedy coloring, so it is guaranteed to find *a* coloring which may or may not be optimal. The specific algorithm is the Welsh-Powell algorithm. [Read more about it on Wikipedia.](https://en.wikipedia.org/wiki/Graph_coloring#Greedy_coloring)

### Usage in Graph Algorithm Playground
For undirected graphs, click on "Graph Coloring" in the Algorithms pane.

## Kruskal Minimum Spanning Tree
A minimum spanning tree (MST) is a connected subset of the edges of a weighted graph connecting all vertices with minimum edge weight. Kruskal's algorithm is greedy and you can [read more about it on Wikipedia.](https://en.wikipedia.org/wiki/Kruskal%27s_algorithm) The algorithm has a runtime of O(|E| log(|E|)).

### Usage in Graph Algorithm Playground
For undirected, weighted graphs, click on "Kruskal Minimum Spanning Tree" in the Algorithms pane.


## Breadth-First Shortest Path
Breadth-First search is not a true shortest path algorithm in most cases, however it is sometimes helpful to know how a BFS would find specific vertices. [Read more about BFS on Wikipedia.](https://en.wikipedia.org/wiki/Breadth-first_search)

### Usage in Graph Algorithm Playground
Click on "Breadth-First Shortest Path" in the Algorithms pane and then enter a beginning (source) and end (target) vertex ID. The vertex ID can be seen by double clicking the vertex or selecting the vertex and then clicking "Edit Node".


## Dijkstra Shortest Path
[Dijkstra's algorithm](https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm) finds the shortest path between any two given vertices. When used on unweighted graphs I set the edge weight to 1 such that it finds the path with the fewest hops. When the graph is undirected I make a new directed graph with doubled forward and back edges wherever a single edge existed before.

### Usage in Graph Algorithm Playground
For all graph types, click on "Dijkstra Shortest Path" in the Algorithms pane and then enter a beginning (source) and end (target) vertex ID. The vertex ID can be seen by double clicking the vertex or selecting the vertex and then clicking "Edit Node".


## Bellman-Ford Shortest Path
[Bellman-Ford shortest path](https://en.wikipedia.org/wiki/Bellman%E2%80%93Ford_algorithm) is a common replacement for [Dijkstra's algorithm](#dijkstra-shortest-path) that allows negative edge weights.

### Usage in Graph Algorithm Playground
For directed, weighted graphs, click on "Bellman-Ford Shortest Path" in the Algorithms pane and then enter a beginning (source) and end (target) vertex ID. The vertex ID can be seen by double clicking the vertex or selecting the vertex and then clicking "Edit Node".

## Ford-Fulkerson MinCut-MaxFlow
[The Ford-Fukerson algorithm](https://en.wikipedia.org/wiki/Ford%E2%80%93Fulkerson_algorithm) solves the [maximum flow problem](https://en.wikipedia.org/wiki/Maximum_flow_problem) greedily, but the solution will be optimal.

### Usage in Graph Algorithm Playground
For directed, weighted graphs, click on "Ford-Fulkerson" in the Algorithms pane and then enter a source and sink (target) vertex ID. The vertex ID can be seen by double clicking the vertex or selecting the vertex and then clicking "Edit Node".
