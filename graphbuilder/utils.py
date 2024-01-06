from .models import SupplyNode, InputNode, OutputNode
import json
from time import time


def optimize_graph(nodes):
    pass


def estimate_graph(nodes, links):
    """Analyze graph for leaks and excess, find optimal nodes.

    Returns:
        Graph analysis info.
    """
    estimation = {"optimals": []}

    for node in nodes:
        node_leak, node_excess = dict(), dict()

        # Calculating excess
        if "exitPoint" not in node:
            node_output_links = list(filter(lambda link: True if link["source"] == node["id"] else False, links))
            node_excess = {res["name"]: res["quantity"] for res in node["giveRes"]}

            for link in node_output_links:
                transfered_res = link["transferedRes"]

                for res in transfered_res:
                    node_excess[res["name"]] -= res["quantity"]
                    if not node_excess[res["name"]]:
                        node_excess.pop(res["name"])
        
        # Calculating leak
        if "entryPoint" not in node:
            node_input_links = list(filter(lambda link: True if link["target"] == node["id"] else False, links))
            node_leak = {res["name"]: res["quantity"] for res in node["neededRes"]}

            for link in node_input_links:
                transfered_res = link["transferedRes"]

                for res in transfered_res:
                    node_leak[res["name"]] -= res["quantity"]
                    if not node_leak[res["name"]]:
                        node_leak.pop(res["name"])
        
        estimation[node["id"]] = {"leak": node_leak, "excess": node_excess}
        if not node_leak and not node_excess:
            estimation[node["id"]]["optimal"] = True
            estimation["optimals"] += [node["id"]]

    return estimation
            

def validate_graph(nodes, links):
    """Validate graph to be correct.
    Graph is incorrect if there're no left resources for parent node to give.
    Graph is incorrect if there're no free space for child node to accept.
    Graph layer structure also should be kept.
    (All types of errors should be considered at the frontend too to minimize server load).
    Returns:
        Boolean.
    """
    for node in nodes:
        node_output_links = list(filter(lambda link: True if link["source"] == node["id"] else False, links))
        give_res = {res["name"]: res["quantity"] for res in node["giveRes"]}
        for link in node_output_links:
            transfered_res = link["transferedRes"]

            for res in transfered_res:
                # Giving resource node can't give
                if res["name"] not in give_res.keys():
                    return False
                
                # Giving more than node can give
                if res["quantity"] > give_res[res["name"]]:
                    # print(res, link, node)
                    print(res, node, link)
                    return False
                
                if res["quantity"] == give_res[res["name"]]:
                    give_res.pop(res["name"])
                
                else:
                    give_res[res["name"]] -= res["quantity"]

        # node_output_links = list(filter(lambda link: True if link["source"] == node["id"] else False, links))
        # if len(node_output_links) > sum([res["quantity"] for res in node["giveRes"]]):
        #     return False
        
        # Graph is incorrect if child node doesn't need any of transfered resources.
        # (This type of error should be considered at the frontend graph validation).
        # node_input_links = list(filter(lambda link: True if link["target"] == node["id"] else False, links))
        # needed_res = set(map(lambda res: res["name"], node["neededRes"]))
        # for link in node_input_links:
        #     transfered_res = set(map(lambda res: res["name"], link["transferedRes"]))
            
        #     if not len(transfered_res.intersection(needed_res)):
        #         return False

        node_input_links = list(filter(lambda link: True if link["target"] == node["id"] else False, links))
        needed_res = {res["name"]: res["quantity"] for res in node["neededRes"]}
        for link in node_input_links:
            transfered_res = link["transferedRes"]

            for res in transfered_res:
                # Giving resource node can't accept
                if res["name"] not in needed_res.keys():
                    return False
                
                # Giving more than node can accept
                if res["quantity"] > needed_res[res["name"]]:
                    # print(res, link, node)
                    return False
                
                if res["quantity"] == needed_res[res["name"]]:
                    needed_res.pop(res["name"])
                
                else:
                    needed_res[res["name"]] -= res["quantity"]
        
        # Check for satisfying layer structure
        for link in node_output_links:
            if list(filter(lambda node: True if node["id"] == link["target"] else False, nodes))[0]["layerNum"] - node["layerNum"] != 1:
                print(link)
                return False

    return True


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
        if "entryPoint" in node:
            InputNode(title=f'Input ({node["id"]})',
                    node_id=node["id"],
                    entry_point=node["entryPoint"],
                    needed_res=list(map(str, node["neededRes"])),
                    give_res=list(map(str, node["giveRes"])),
                    layer_num=node["layerNum"]).save()
        elif "exitPoint" in node:
            OutputNode(title=f'Output ({node["id"]})',
                    node_id=node["id"],
                    exit_point=node["exitPoint"],
                    needed_res=list(map(str, node["neededRes"])),
                    give_res=list(map(str, node["giveRes"])),
                    layer_num=node["layerNum"]).save()
        else:
            SupplyNode(title=f'Node {node["id"]}',
                    node_id=node["id"],
                    needed_res=list(map(str, node["neededRes"])),
                    give_res=list(map(str, node["giveRes"])),
                    layer_num=node["layerNum"]).save()


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