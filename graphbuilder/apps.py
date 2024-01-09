from django.apps import AppConfig
from .models import SupplyNode
from .utils import add_nodes, add_links, res_dict


class GraphbuilderConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'graphbuilder'

    # run project with --noreload option for ready() not to execute twice
    def ready(self):
        if not SupplyNode.nodes.all():
            # init_nodes = [{ "id": "0", "entryPoint": True, "exitPoint": False, "neededRes": [], "giveRes": [{ "name": "iron ore", "quantity": 1 }, { "name": "coal", "quantity": 1 }] }, { "id": "1", "entryPoint": False, "exitPoint": False, "neededRes": [{ "name": "iron ore", "quantity": 1 }, { "name": "coal", "quantity": 1 }], "giveRes": [{ "name": "iron plate", "quantity": 1 }] }, { "id": "2", "entryPoint": False, "exitPoint": False, "neededRes": [{ "name": "iron plate", "quantity": 1 }], "giveRes": [{ "name": "shit made of iron", "quantity": 1 }] }, { "id": "3", "entryPoint": False, "exitPoint": True, "neededRes": [{ "name": "shit made of iron", "quantity": 1 }], "giveRes": [] }]
            # init_links = [{ "source": "1", "target": "2", "transferedRes": [{ "name": "iron plate", "quantity": 1 }] }, { "source": "0", "target": "1", "transferedRes": [{ "name": "iron ore", "quantity": 1 }, { "name": "coal", "quantity": 1 }] }, { "source": "2", "target": "3", "transferedRes": [{ "name": "shit made of iron", "quantity": 1 }] }]
            init_nodes = [
                            { "id": "0", "neededRes": [], "giveRes": [res_dict(1,9),res_dict(2,3),res_dict(5,4),res_dict(3,8),], "entryPoint": True,},
                            { "id": "1", "neededRes": [res_dict(1,2),res_dict(2,1),], "giveRes": [res_dict(6,2),res_dict(3,1),],},
                            { "id": "2", "neededRes": [res_dict(5,3),res_dict(3,4),], "giveRes": [res_dict(4,2),res_dict(2,3),res_dict(1,6),],},
                            { "id": "3", "neededRes": [res_dict(3,1),], "giveRes": [res_dict(6,5),],},
                            { "id": "4", "neededRes": [res_dict(6,3),], "giveRes": [res_dict(5,2),],},
                            { "id": "5", "neededRes": [res_dict(2,2),res_dict(4,1),], "giveRes": [res_dict(1,1),res_dict(4,10),],},
                            { "id": "6", "neededRes": [res_dict(4,3),res_dict(1,2),], "giveRes": [res_dict(3,7),],},
                            { "id": "7", "neededRes": [res_dict(3,1),res_dict(6,5),res_dict(4,2),], "giveRes": [res_dict(3,3),],},
                            { "id": "8", "neededRes": [res_dict(5,5),], "giveRes": [res_dict(4,4),res_dict(3,6),],},
                            { "id": "9", "neededRes": [res_dict(4,9),res_dict(1,5),], "giveRes": [res_dict(6,3),],},
                            { "id": "10", "neededRes": [res_dict(3,4),res_dict(4,2),res_dict(6,1),], "giveRes": [], "exitPoint": True,},
                            # { "id": "11", "neededRes": [], "giveRes": [],}
                        ]
            init_links = [
                            { "source": "0", "target": "1", "transferedRes": [res_dict(1,2),res_dict(2,1),] },
                            { "source": "0", "target": "2", "transferedRes": [res_dict(5,3),res_dict(3,4),] },
                            { "source": "1", "target": "3", "transferedRes": [res_dict(3,1),] },
                            { "source": "1", "target": "4", "transferedRes": [res_dict(6,1),] },
                            { "source": "2", "target": "5", "transferedRes": [res_dict(4,1),res_dict(2,2),] },
                            { "source": "2", "target": "6", "transferedRes": [res_dict(1,1),] },
                            { "source": "3", "target": "7", "transferedRes": [res_dict(6,5),] },
                            { "source": "6", "target": "7", "transferedRes": [res_dict(3,1),] },
                            { "source": "5", "target": "7", "transferedRes": [res_dict(4,2),] },
                            { "source": "4", "target": "8", "transferedRes": [res_dict(5,1),] },
                            { "source": "5", "target": "9", "transferedRes": [res_dict(4,8),res_dict(1,1),] },
                            { "source": "7", "target": "10", "transferedRes": [res_dict(3,3),] },
                            { "source": "8", "target": "10", "transferedRes": [res_dict(4,2),res_dict(3,1),] },
                            { "source": "9", "target": "10", "transferedRes": [res_dict(6,1),] },
                        ]

            add_nodes(init_nodes)
            add_links(init_links)
        # pass.,