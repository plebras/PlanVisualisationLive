from .plan_config import action_parse, composite_actions
from .parser_exception import ParserError, check_parsing_rule
from .utils import round_number

class ActionParser:

    ## Constructor
    # takes a roadmap object as parameter
    # initialise list of actions and sets of action types and actors
    def __init__(self, roadmap):
        self.actions = []
        # self.plan = []
        self.action_types = set()
        self.actors = set()
        self.current_id = -1
        # self.max_depth = 0
        self.roadmap = roadmap

    ## Action id getter
    # increment a global integer and returns it as new id
    def get_id(self):
        self.current_id += 1
        return self.current_id

    ## Check the parsing rule for actions
    # return the rule filled with optional default values
    # raise exception if mandatory rule field is not present
    def check_action_parsing_rule(self, action_name):
        rule = action_parse[action_name]
        mandatory = ['actor']
        optional = [('parameters', []),('waypoints',None),('description',None)]
        try:
            return check_parsing_rule(rule, action_name, mandatory, optional)
        except ParserError as e:
            raise e

    ## Process action
    # adds the action + any potential children action (movements) to the action list
    # raise exception if parsing rule not found for the action name
    # return the action id
    def process_action(self, action):
        try:
            # getting action name, check if existing in parsing rules, and add it to set of actions
            name = action[0][0]
            if not name in action_parse:
                raise ParserError('No parsing rules for action %s'%(name))
            self.action_types.add(name)
            # checking and getting parsing rule for action
            rule = self.check_action_parsing_rule(name)
            # getting actor and add it to set of actors
            actor = action[0][rule['actor']]
            self.actors.add(actor)
            # getting action parameters, description and time data
            parameters = [self.roadmap.transform_waypoint(action[0][x]) for x in rule['parameters']]
            description = ' '.join(
                [actor]+list(
                    map(
                        lambda x:str(self.roadmap.transform_waypoint(action[0][x])) if isinstance(x,int) else str(x), 
                        rule['description']
                    )
                ) if not rule['description'] is None else action[0])
            start = action[1]
            duration = action[2]
            end = action[3]
            # getting action id
            action_id = self.get_id()
            # check movements
            children = []
            if not rule['waypoints'] is None:
                # if it's a movement actions, get the path from roadmap
                waypoints = [self.roadmap.transform_waypoint(action[0][x]) for x in rule['waypoints']]
                path = self.roadmap.get_waypoints_path(waypoints[0],waypoints[1])
                if len(path['path']) > 1:
                    # if the path has multiple step create the children actions
                    children = []
                    s = start
                    for _, p in enumerate(path['path']):
                        a_id = self.get_id()
                        d = round_number(duration * p[2] / path['distance']) if path['distance'] > 0 else 0
                        e = min(end,round_number(s + d))
                        # add the child action with parent id
                        self.actions.append({
                            'id': a_id, 'name': 'pathMove', 'actor': actor, 'parameters': [p[0],p[1]],
                            'description': '%s moving from %s to %s'%(actor, p[0], p[1]),
                            'depth': 1, 'start': s, 'duration': d, 'end': e, 'parent': action_id
                        })
                        s = e
                        children.append(a_id)
                    # add the action with children ids
                    self.actions.append({
                        'id': action_id, 'name': name, 'actor': actor, 'parameters': parameters,
                        'description': description, 'depth': 0, 'start': start, 'duration': duration,
                        'end': end, 'children': children
                    })
                else:
                    # if the path is direct, just add the action with no children
                    self.actions.append({
                        'id': action_id, 'name': name, 'actor': actor, 'parameters': parameters,
                        'description': description, 'depth': 0, 'start': start, 'duration': duration,
                        'end': end
                    })
            else:
                # if it's not a movement add the action with no children
                self.actions.append({
                    'id': action_id, 'name': name, 'actor': actor, 'parameters': parameters,
                    'description': description, 'depth': 0, 'start': start, 'duration': duration,
                    'end': end
                })
            # returning action id in case it is part of composite action
            return action_id
        except (ParserError,Exception) as e:
            raise e  

    ## Adds connections to children of composite actions
    def link_actions(self, comp_action_ids):
        for c in comp_action_ids:
            for i in c:
                # get action with id i, and add property connected with list of connected action ids
                [a for a in self.actions if a['id'] == i][0]['connected'] = [j for j in c if j != i]

    ## Processing the plan
    # separate composite actions before processing single actions individually
    # then calls for linkage between composite actions
    # raises exceptions from other functions
    def process_plan(self, plan):
        try:
            comp_action_ids = []
            for action in plan:
                name = action[0][0]
                if name in composite_actions:
                    action_ids = []
                    for sub in composite_actions[name]:
                        sub_action = [s for s in list(map(lambda x: str(action[0][x]) if isinstance(x, int) else str(x), sub[0]))]
                        sub_start = round_number(action[1] + action[1]*sub[1])
                        sub_duration = round_number(action[2]*sub[2])
                        sub_end = round_number(min(action[3], sub_start+sub_duration))
                        action_ids.append(self.process_action([sub_action, sub_start, sub_duration, sub_end]))
                    comp_action_ids.append(action_ids)
                else:
                    self.process_action(action)
            self.link_actions(comp_action_ids)
        except (ParserError,Exception) as e:
            raise e

    ## Main functions
    # gets plan to process
    # returns list of actions
    # raises exceptions from process
    def parse_actions(self, plan):
        try:
            self.process_plan(plan)
            return self.actions
        except (ParserError,Exception) as e:
            raise e