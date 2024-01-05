from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from neomodel import db
from .utils import serialize_res, add_nodes, add_links


@api_view(['POST'])
def api_save_graph(request):
    """API function to save graph to database.
    
    Returns:
        Django REST status response.
    """

    _, _ = db.cypher_query("MATCH (n) DETACH DELETE n")
    add_nodes(request.data["nodes"])
    add_links(request.data["links"])

    return Response()


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
    """View function for home page of site.

    Returns:
        Rendered HTML-page.
    """

    return render(request, 'index.html')


class GetSupplyNodes(APIView):
    def get(self, request):
        return Response('Temporary Data', status=status.HTTP_200_OK)