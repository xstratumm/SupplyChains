from .models import SupplyNode
import json


def decode_res(res_code):
    return {
            1: "water",
            2: "stone",
            3: "iron",
            4: "shit",
            5: "fire",
            6: "buttplug",
            }[res_code]


def res_dict(res_code, quantity):
    return {"name": decode_res(res_code), "quantity": quantity}


def serialize_res(obj, mode):
    """Convert node or link resources from strings to dicts.
    
    Args:
        obj: SupplyNode or SupplyNodesRel.
        mode: String "node" or "link".

    Returns:
        Modified node or link.
    """
    if mode == "node":
        for res_type in ("neededRes", "giveRes"):
            obj[res_type] = list(map(json.loads, 
                                    map(lambda res: res.replace("'", '"'),
                                        obj[res_type])))
    else:
        obj["transferedRes"] = list(map(json.loads, 
                                        map(lambda res: res.replace("'", '"'),
                                            obj["transferedRes"])))
    return obj

def get_new_id():
    """Generate new SupplyNode id.
    
    Returns:
        New generated id for adding node to database.
    """
    nodes = SupplyNode.nodes.all()
    if nodes:
        return max([node.node_id for node in nodes]) + 1
    return 0


def add_nodes(nodes):
    """Add nodes to database.

    Args:
        nodes: List of nodes.
    """
    for node in nodes:
        SupplyNode(title=f'Unit {node["id"]}',
                   node_id=node["id"],
                   entry_point=node["entryPoint"],
                   exit_point=node["exitPoint"],
                   needed_res=list(map(str, node["neededRes"])),
                   give_res=list(map(str, node["giveRes"]))).save()


def add_links(links):
    """Add links between nodes.

    Args:
        links: List of links.
    """
    for link in links:
        source_node = SupplyNode.nodes.get(node_id=link["source"])
        target_node = SupplyNode.nodes.get(node_id=link["target"])
        source_node.connectedTo.connect(target_node,
                                        {
                                            "parent": link["source"],
                                            "child": link["target"],
                                            "transfered_res": list(map(str, link["transferedRes"])),
                                        })


def fetch_nodes():
    """Fetch all SupplyNodes and serialize them.
    
    Returns:
        List of serialized SupplyNodes.
    """
    return [node.serialize for node in SupplyNode.nodes.all()]