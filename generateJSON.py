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

print(json.dumps(init_nodes))
print(json.dumps(init_links))

# file_nodes = open("init_nodes.json", "w")
# file_links = open("init_links.json", "w")
# file_nodes.writelines(json.dumps(init_nodes, indent=2))
# file_links.writelines(json.dumps(init_links, indent=2))