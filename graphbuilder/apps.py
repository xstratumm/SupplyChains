from django.apps import AppConfig
from .models import SupplyNode
from .utils import add_nodes, add_links


class GraphbuilderConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'graphbuilder'

    # run project with --noreload option for ready() not to execute twice
    def ready(self):
        if not SupplyNode.nodes.all():
            init_nodes = [{ "id": "0", "entryPoint": True, "exitPoint": False, "neededRes": [], "giveRes": [{ "name": "iron ore", "quantity": 1 }, { "name": "coal", "quantity": 1 }] }, { "id": "1", "entryPoint": False, "exitPoint": False, "neededRes": [{ "name": "iron ore", "quantity": 1 }, { "name": "coal", "quantity": 1 }], "giveRes": [{ "name": "iron plate", "quantity": 1 }] }, { "id": "2", "entryPoint": False, "exitPoint": False, "neededRes": [{ "name": "iron plate", "quantity": 1 }], "giveRes": [{ "name": "shit made of iron", "quantity": 1 }] }, { "id": "3", "entryPoint": False, "exitPoint": True, "neededRes": [{ "name": "shit made of iron", "quantity": 1 }], "giveRes": [] }]
            init_links = [{ "source": "1", "target": "2", "transferedRes": [{ "name": "iron plate", "quantity": 1 }] }, { "source": "0", "target": "1", "transferedRes": [{ "name": "iron ore", "quantity": 1 }, { "name": "coal", "quantity": 1 }] }, { "source": "2", "target": "3", "transferedRes": [{ "name": "shit made of iron", "quantity": 1 }] }]

            add_nodes(init_nodes)
            add_links(init_links)
        # pass