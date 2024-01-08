from django.urls import path, re_path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    re_path(r'^api/getnodes[/]?$', views.api_get_nodes, name='api_get_nodes'),
    re_path(r'^api/getlinks[/]?$', views.api_get_links, name='api_get_links'),
    re_path(r'^api/savegraph[/]?$', views.api_save_graph, name='api_save_graph'),
    re_path(r'^api/estimategraph[/]?$', views.api_estimate_graph, name='api_estimate_graph'),
    re_path(r'^api/optimizegraph[/]?$', views.api_optimize_graph, name='api_optimize_graph'),
    # re_path(r'^nodes[/]?$', views.GetSupplyNodes.as_view(), name='get_supply_nodes'),
]
