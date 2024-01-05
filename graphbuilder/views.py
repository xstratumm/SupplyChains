from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from neomodel import db
from .utils import serialize_res 


@api_view(['GET'])
def api_get_nodes(request):
    """API function to get nodes.
    
    Returns:
        Django REST response containing nodes data.
    """
    nodes, _ = db.cypher_query("MATCH(n) RETURN n", resolve_objects=True)
    serialized_nodes = list(map(lambda node: serialize_res(node[0].serialize), nodes))

    return Response(serialized_nodes)


def index(request):
    """View function for home page of site.

    Returns:
        Rendered HTML-page.
    """

    return render(request, 'index.html')


class GetSupplyNodes(APIView):
    def get(self, request):
        return Response('Temporary Data', status=status.HTTP_200_OK)