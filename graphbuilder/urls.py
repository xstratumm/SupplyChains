from django.urls import path, re_path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    re_path(r'^api/getnodes[/]?$', views.api_get_nodes, name='api_get_nodes'),
    re_path(r'^nodes[/]?$', views.GetSupplyNodes.as_view(), name='get_supply_nodes'),
]
