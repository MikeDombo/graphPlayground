# Contents

## No-Input Algorithms
- [Eulericity](#Eulericity)
- [Cyclicity](#Cyclicity)
- [Connected Components](#Connected-Components)
- [Strongly Connected Components](#Strongly-Connected-Components)
- [Topological Sort](#Topological-Sort)
- [Graph Coloring](#Graph-Coloring)
- [Kruskal Minimum Spanning Tree](#Kruskal-Minimum-Spanning-Tree)

## Input Algorithms
- [Breadth-First Shortest Path](#Breadth-First-Shortest-Path)
- [Dijkstra Shortest Path](#Dijkstra-Shortest-Path)
- [Bellman-Ford Shortest Path](#Bellman-Ford-Shortest-Path)
- [Ford-Fulkerson MinCut-MaxFlow](#Ford-Fulkerson-MinCut-MaxFlow)


# Algorithms


## Eulericity
In graph theory, an Eulerian circuit is a path in a finite graph which visits every edge exactly once, starting and ending at the same vertex (Paraphrased from [Wikipedia](https://en.wikipedia.org/wiki/Eulerian_path)).

For a graph to be Eulerian, it must have vertices with even degree (excluding zero) belonging to the same [connected component](#Connected-Components). Similarly in directed graphs, it must have vertices with equal in and out degrees and vertices with non-zero in degree must be in the same [strongly conncted component](#Strongly-Connected-Components).

### Usage in Graph Algorithm Playground
For undirected graphs the Eulericity is automatically calculated with every change you make to the graph. Simply see the "Graph Properties" pane for the current state.

For directed graphs either click on "Eulerian" in the Algorithms pane, or click "calculate All Properties" in the toolbar.


## Cyclicity
A graph has a cycle when there exists a path from vertex x to vertex x through one or more vertices y without repeating edges.

### Usage in Graph Algorithm Playground
For directed graphs either click on "Cyclic" in the Algorithms pane, or click "calculate All Properties" in the toolbar.


## Connected Components
For undirected graphs, a conncted component is a subgraph containing some number of vertices conncted to each other by paths and disconnected from all other connected components.

### Usage in Graph Algorithm Playground
For undirected graphs click on "Connected Components" in the Algorithms pane, or click "calculate All Properties" in the toolbar.

For directed graphs see [Strongly Connected Components](#Strongly-Connected-Components)


## Strongly Connected Components

## Topological Sort

## Graph Coloring

## Kruskal Minimum Spanning Tree

## Breadth-First Shortest Path

## Dijkstra Shortest Path

## Bellman-Ford Shortest Path

## Ford-Fulkerson MinCut-MaxFlow