from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from neomodel import db
from .utils import serialize_res, add_nodes, \
    add_links, validate_graph, estimate_graph, \
    optimize_graph


@api_view(['POST'])
def api_optimize_graph(request):
    """API function to make graph optimization.
    
    Returns:
        Optimized graph.
    """
    nodes, links = request.data["nodes"], request.data["links"]
    if not validate_graph(nodes, links):
        return Response("incorrect")
    
    return Response(optimize_graph(nodes, links))


@api_view(['POST'])
def api_estimate_graph(request):
    """API function to calculate leak and excess, find optimal nodes.
    
    Returns:
        Graph analysis info or "incorrect" string.
    """
    nodes, links = request.data["nodes"], request.data["links"]
    if not validate_graph(nodes, links):
        return Response("incorrect")
    
    return Response(estimate_graph(nodes, links)["front"])


@api_view(['POST'])
def api_save_graph(request):
    """API function to save graph to database.
    
    Returns:
        Django REST status response.
    """
    nodes, links = request.data["nodes"], request.data["links"]
    if not validate_graph(nodes, links):
        return Response("incorrect")

    _, _ = db.cypher_query("MATCH (n) DETACH DELETE n")
    add_nodes(nodes)
    add_links(links)

    return Response("correct")


@api_view(['GET'])
def api_get_nodes(request):
    """API function to get nodes.
    
    Returns:
        Django REST response containing nodes data.
    """
    nodes, _ = db.cypher_query("MATCH (n) RETURN n", resolve_objects=True)
    serialized_nodes = list(map(lambda node: serialize_res(node[0].serialize, mode="node"), nodes))

    return Response(serialized_nodes)


@api_view(['GET'])
def api_get_links(request):
    """API function to get links between nodes.
    
    Returns:
        Django REST response containing links data.
    """
    links, _ = db.cypher_query("MATCH (a)-[r]-(b) RETURN DISTINCT r", resolve_objects=True)
    serialized_links = list(map(lambda link: serialize_res(link[0].serialize, mode="link"), links))

    return Response(serialized_links)


def index(request):
    """Home page.

    Returns:
        Rendered HTML-page.
    """

    return render(request, 'index.html')


class GetSupplyNodes(APIView):
    def get(self, request):
        return Response('Temporary Data', status=status.HTTP_200_OK)