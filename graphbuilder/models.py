from django.db import models
from neomodel import StructuredRel, StructuredNode, IntegerProperty, \
    ArrayProperty, StringProperty, BooleanProperty, RelationshipTo


"""Relationship between two SupplyNodes.

Attributes:
    parent: An integer id of source node.
    child: An integer id of target node.
    transfered_res: A list of transfered resources (list of strings of dicts).
"""
class SupplyNodesRel(StructuredRel):
    parent = IntegerProperty()
    child = IntegerProperty()
    transfered_res = ArrayProperty()


"""Primary SupplyChain element.

Attributes:
    node_id: An integer id.
    entry_point: A boolean of whether it's entry point.
    exit_point: A boolean of whether it's exit point.
    needed_res: A list of required resources (list of strings of dicts).
    give_res: A list of produced resources (list of strings of dicts).
    connectedTo: A relationship with another SupplyNode.
"""
class SupplyNode(StructuredNode):
    title = StringProperty()
    node_id = IntegerProperty()
    entry_point = BooleanProperty()
    exit_point = BooleanProperty()
    needed_res = ArrayProperty()
    give_res = ArrayProperty()

    connectedTo = RelationshipTo("SupplyNode", "TRANSFER", model=SupplyNodesRel)

    @property
    def serialize(self):
        return {
            'id': str(self.node_id),
            'entryPoint': self.entry_point,
            'exitPoint': self.exit_point,
            'neededRes': self.needed_res,
            'giveRes': self.give_res,
        }