from .models import SupplyNode, InputNode, OutputNode
from neomodel import db
import json
from time import time
import re


def estimate_graph(nodes, links):
    """Analyze graph for lack and excess, find optimal nodes.

    Returns:
        Graph analysis info.
    """
    estimation = {"front": {"optimals": []}, "back": {"optimals": []}}

    for node in nodes:
        node_leak_front, node_excess_front = [], []
        node_leak_back, node_excess_back = dict(), dict()

        # Calculating excess
        if "exitPoint" not in node:
            node_output_links = list(filter(lambda link: True if link["source"] == node["id"] else False, links))
            node_excess_back = {res["name"]: res["quantity"] for res in node["giveRes"]}
            node_excess_front = [{"name": res["name"], "quantity": res["quantity"]} for res in node["giveRes"]]

            for link in node_output_links:
                transfered_res = link["transferedRes"]

                for res in transfered_res:
                    for res_id, node_excess_res in enumerate(node_excess_front):
                        if node_excess_res["name"] == res["name"]:
                            node_excess_front[res_id]["quantity"] -= res["quantity"]
                            node_excess_back[res["name"]] -= res["quantity"]
                            if not node_excess_front[res_id]["quantity"]:
                                node_excess_front.pop(res_id)
                                node_excess_back.pop(res["name"])
                            
        
        # Calculating lack
        if "entryPoint" not in node:
            node_input_links = list(filter(lambda link: True if link["target"] == node["id"] else False, links))
            node_leak_back = {res["name"]: res["quantity"] for res in node["neededRes"]}
            node_leak_front = [{"name": res["name"], "quantity": res["quantity"]} for res in node["neededRes"]]

            for link in node_input_links:
                transfered_res = link["transferedRes"]

                for res in transfered_res:
                    for res_id, node_leak_res in enumerate(node_leak_front):
                        if node_leak_res["name"] == res["name"]:
                            node_leak_front[res_id]["quantity"] -= res["quantity"]
                            node_leak_back[res["name"]] -= res["quantity"]
                            if not node_leak_front[res_id]["quantity"]:
                                node_leak_front.pop(res_id)
                                node_leak_back.pop(res["name"])
        
        estimation["front"][node["id"]] = {"leak": node_leak_front, "excess": node_excess_front}
        estimation["back"][node["id"]] = {"leak": node_leak_back, "excess": node_excess_back}
        if not node_leak_front and not node_excess_front:
            for type_str in ("front", "back"):
                estimation[type_str][node["id"]]["optimal"] = True
                estimation[type_str]["optimals"] += [node["id"]]

    return estimation


def optimize_graph(nodes, links):
    estimation = estimate_graph(nodes, links)["back"]
    optimized_links, new_links = [], []

    # Optimizing existing links
    for link_index, link in enumerate(links):
        transfered_res = link["transferedRes"]

        source_excess_res = set(estimation[link["source"]]["excess"].keys())
        target_leak_res = set(estimation[link["target"]]["leak"].keys())
        for res in source_excess_res.intersection(target_leak_res):
            if estimation[link["source"]]["excess"][res] <= estimation[link["target"]]["leak"][res]:
                diff = estimation[link["source"]]["excess"][res]
            else:
                diff = estimation[link["target"]]["leak"][res]
            if res in list(map(lambda link_res: link_res["name"], link["transferedRes"])):
                link["transferedRes"] = list(map(lambda link_res: link_res if link_res["name"] != res \
                    else {"name": link_res["name"], "quantity": link_res["quantity"] + diff}, link["transferedRes"]))
            else:
                link["transferedRes"] += [{"name": res, "quantity": diff}]
            
            links[link_index] = link
            optimized_links += [link]
            # print(link)
            estimation = estimate_graph(nodes, links)["back"]

    # Creating new links
    for node in nodes:
        if node["id"] in estimation["optimals"]:
            continue
        
        if estimation[node["id"]]["leak"]:
            nodes_with_excess = list(filter(lambda node_excess: True if estimation[node_excess["id"]]["excess"] \
                and node_excess != node else False, nodes))
            # Make sure they're not connected
            for link in links:
                if node["id"] in (link["source"], link["target"]):
                    if link["source"] in nodes_with_excess:
                        nodes_with_excess.remove(link["source"])
                    if link["target"] in nodes_with_excess:
                        nodes_with_excess.remove(link["target"])

            for node_excess in nodes_with_excess:
                node_res = set(estimation[node["id"]]["leak"].keys())
                node_excess_res = set(estimation[node_excess["id"]]["excess"].keys())

                res_to_add = []
                for res in node_res.intersection(node_excess_res):
                    if estimation[node_excess["id"]]["excess"][res] <= estimation[node["id"]]["leak"][res]:
                        diff = estimation[node_excess["id"]]["excess"][res]
                    else:
                        diff = estimation[node["id"]]["leak"][res]
                    
                    res_to_add += [{"name": res, "quantity": diff}]
                
                if not res_to_add:
                    continue

                new_link = {"source": node_excess["id"], "target": node["id"], "transferedRes": res_to_add}
                links += [new_link]
                new_links += [new_link]
                # print(new_link)
                estimation = estimate_graph(nodes, links)["back"]
    
    return {"graph": {"nodes": nodes, "links": links}, "optimizedLinks": optimized_links, "newLinks": new_links}


def validate_graph(nodes, links):
    """Validate graph to be correct.
    Graph is incorrect if there're no left resources for parent node to give.
    Graph is incorrect if there're no free space for child node to accept.
    Graph is incorrect if there're no vertices connected to themselves.
    Graph is incorrect if there're incoming links to InputNode or there're outcoming links from OutputNode.
    Graph is incorrect if count of InputNodes not equals one (same for OutputNodes).
    Graph is incorrect if resource quantities are not integers.
    Graph is incorrect if not all nodes have minimum one input link and one output link.
    Graph is incorrect if there're several links between two nodes.
    (All types of errors should be considered at the frontend first to minimize server load).
    Returns:
        True if graph is correct else False.
    """
    # Check if there're several links between two nodes
    if len([{link["source"], link["target"]} for link in links]) != len(set([frozenset((link["source"], link["target"])) for link in links])):
        return False

    # nodes_set = set([node["id"] for node in nodes])
    # input_node, _ = db.cypher_query("MATCH (n) WHERE n.entry_point = true RETURN n", resolve_objects=True)
    # output_node, _ = db.cypher_query("MATCH (n) WHERE n.exit_point = true RETURN n", resolve_objects=True)
    # nodes_set.remove(input_node[0][0].get_id())
    # nodes_set.remove(output_node[0][0].get_id())

    # Check if all nodes have minimum one input link and one output link
    for node in nodes:
        # Input and Output nodes are checked separately
        if "entryPoint" in node:
            if not list(filter(lambda link: True if link["source"] == node["id"] else False, links)):
                return False
            continue
        
        elif "exitPoint" in node:
            if not list(filter(lambda link: True if link["target"] == node["id"] else False, links)):
                return False
            continue

        # node_links, _ = db.cypher_query(f"MATCH (a)-[r]-(b) WHERE a.node_id={node['id']} RETURN r")
        node_links = list(filter(lambda link: True if node["id"] in (link["source"], link["target"]) else False, links))
        check_source = False
        check_target = False
        
        for link in node_links:
            if node["id"] == link["source"]:
                check_source = True
            if node["id"] == link["target"]:
                check_target = True
            if check_source and check_target:
                break
        if not check_source or not check_target:
            return False
        
    # Check if there're only one entry_point and only one exit_point
    count_entries, _ = db.cypher_query("MATCH (n) WHERE n.entry_point = true RETURN count(*)")
    count_exits, _ = db.cypher_query("MATCH (n) WHERE n.exit_point = true RETURN count(*)")
    if count_entries[0][0] != 1 or count_exits[0][0] != 1:
        # print("entries: " + str(count_entries[0][0]))
        # print("exits: " + str(count_exits[0][0]))
        return False

    # No vertices connected to themselves
    for link in links:
        if link["source"] == link["target"]:
            return False
        # Check for incoming links to InputNode or outcoming links from OutputNode
        entry_point, _ = db.cypher_query("MATCH(n) WHERE n.entry_point = true RETURN n", resolve_objects=True)
        exit_point, _ = db.cypher_query("MATCH(n) WHERE n.exit_point = true RETURN n", resolve_objects=True)
        if link["target"] == str(entry_point[0][0].get_id()) \
            or link["source"] == str(exit_point[0][0].get_id()):
            return False
        # Check resource quantities are all integers (link check)
        for res in link["transferedRes"]:
            if re.match(r"\d*", str(res["quantity"])).group(0) != str(res["quantity"]):
                print(res)
                return False

    for node in nodes:
        # Check resource quantities are all integers (node check)
        for res in node["neededRes"] + node["giveRes"]:
            if re.match(r"\d*", str(res["quantity"])).group(0) != str(res["quantity"]):
                print(res)
                return False

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
        
        # # Check for satisfying layer structure
        # for link in node_output_links:
        #     if list(filter(lambda node: True if node["id"] == link["target"] else False, nodes))[0]["layerNum"] - node["layerNum"] != 1:
        #         print(link)
        #         return False

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
                    # layer_num=node["layerNum"],
                    give_res=list(map(str, node["giveRes"])),).save()
        elif "exitPoint" in node:
            OutputNode(title=f'Output ({node["id"]})',
                    node_id=node["id"],
                    exit_point=node["exitPoint"],
                    needed_res=list(map(str, node["neededRes"])),
                    # layer_num=node["layerNum"],
                    give_res=list(map(str, node["giveRes"])),).save()
        else:
            SupplyNode(title=f'Node {node["id"]}',
                    node_id=node["id"],
                    needed_res=list(map(str, node["neededRes"])),
                    # layer_num=node["layerNum"],
                    give_res=list(map(str, node["giveRes"])),).save()


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