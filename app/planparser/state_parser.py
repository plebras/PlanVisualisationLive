from .plan_config import action_to_state, state_parse, ordinal_feature
from .parser_exception import ParserError, check_parsing_rule
from .utils import round_number
import collections
from pprint import pprint

class StateParser:

    def __init__(self, roadmap):
        self.states = []
        self.state_types = set()
        self.actors = set()
        self.features = set()
        self.current_id = -1
        self.roadmap = roadmap
        self.max_depth = 0

    ## State id getter
    # increment a global integer and returns it as new id
    def get_id(self):
        self.current_id += 1
        return self.current_id

    def check_state_parsing_rule(self, state):
        rule = state_parse[state]
        mandatory = []
        optional = [('description', None), ('features', {'actor': -1})]
        try:
            return check_parsing_rule(rule, state, mandatory, optional)
        except ParserError as e:
            raise e            

    def get_feature_index_type(self, rule_value):
        t = 'n'
        i = -1
        if isinstance(rule_value, int):
            i = rule_value
        elif isinstance(rule_value, list):
            i = rule_value[0]
            if len(rule_value) > 1:
                t = rule_value[1]
        return (i, t)

    def parse_add_state(self, name, actor, time, depth, parameters):
        if not name in state_parse:
            raise ParserError('No parsing rules for state %s'%(name))
        try:
            rule = self.check_state_parsing_rule(name)
            description = ' '.join([actor]+list(map(lambda x:parameters[x] if isinstance(x,int) else x, rule['description'])) if not rule['description'] is None else parameters)
            state_id = self.get_id()
            features = {'time': time}
            self.features.add('time')
            ctg_features = {}
            for f_name in rule['features']:
                (p_index,f_type) = self.get_feature_index_type(rule['features'][f_name])
                if f_name == 'actor':
                    ctg_features['actor'] = actor
                elif f_type == 'c':
                    if p_index == -1:
                        ctg_features[f_name] = ''
                    else:
                        ctg_features[f_name] = parameters[p_index]
                elif f_type == 'n':
                    if p_index == -1:
                        raise ParserError('Numerical feature %s for state %s needs a positive index value'%(f_name, name))
                    if f_name == 'position':
                        coords = self.roadmap.get_waypoint_coordinates(parameters[p_index])
                        features['x'] = coords[0]
                        self.features.add('x')
                        if len(coords) > 1:
                            features['y'] = coords[1]
                            self.features.add('y')
                            if len(coords) > 2:
                                features['z'] = coords[2]
                                self.features.add('z')
                    else:
                        features[f_name] = float(parameters[p_index])
                elif f_type == 'o':
                    if not f_name in ordinal_feature:
                        raise ParserError('Could not find rules for ordinal feature %s - state %s'%(f_name, name))
                    ord_feat_rule = ordinal_feature[f_name]
                    if p_index == -1:
                        raise ParserError('Ordinal feature %s for state %s needs a positive index value'%(f_name, name))
                    f_value = parameters[p_index]
                    if not f_value in ord_feat_rule:
                        raise ParserError('Ordinal feature %s for state %s needs a match for value %s'%(f_name, name, f_value))
                    features[f_name] = ord_feat_rule[f_value]
                else:
                    raise ParserError('Incorrect type for feature %s (state %s), must be n (numerical), c (categorical), or o (ordinal)'%(f_name, name))
                if f_name != 'position':
                    self.features.add(f_name)
            self.actors.add(actor)
            self.state_types.add(name)
            self.max_depth = max(self.max_depth, depth)
            self.states.append({'id': state_id, 'name': name, 'actor': actor, 'time': time, 'depth': depth,
                            'parameters': parameters, 'description': description,
                            'features': features, 'ctg_features': ctg_features})
        except (ParserError,Exception) as e:
            raise e

    def add_path_move_state(self, action, order):
        actor = action['actor']
        time = action['start'] if order == 'initial' else action['end']
        depth = action['depth']
        name = 'at'
        parameters = [action['parameters'][0]] if order == 'initial' else [action['parameters'][1]]
        try:
            self.parse_add_state(name, actor, time, depth, parameters)
        except (ParserError,Exception) as e:
            raise e

    def add_state(self, action, order):
        if not action['name'] in action_to_state:
            raise ParserError('No state inference rules for action %s'%(action['name']))
        creation_rule = action_to_state[action['name']]
        if not order in creation_rule:
            raise ParserError('No %s state inference rule for action %s'%(order,action['name']))
        creation_rule = creation_rule[order]
        if not 'name' in creation_rule:
            raise ParserError('No name in %s state inference rule for action %s'%(order,action['name']))
        if not 'parameters' in creation_rule:
            raise ParserError('No parameters in %s state inference rule for action %s'%(order,action['name']))
        actor = action['actor']
        time = action['start'] if order == 'initial' else action['end']
        depth = action['depth']
        name = creation_rule['name']
        parameters = list(map(lambda x: action['parameters'][x], creation_rule['parameters']))
        try:
            self.parse_add_state(name, actor, time, depth, parameters)
        except (ParserError,Exception) as e:
            raise e

    def process_actions(self, actions):
        try:
            for actor in actions:
                self.actors.add(actor)
                concurrent_time = -1
                for i, a in enumerate(actions[actor]):
                    if i == 0:
                        if a['name'] == 'pathMove':
                            self.add_path_move_state(a, 'initial')
                        else:
                            self.add_state(a, 'initial')
                    if a['name'] == 'pathMove':
                        if concurrent_time != a['end']:
                            self.add_path_move_state(a, 'effect')
                    else:
                        self.add_state(a, 'effect')
                        if 'children' in a:
                            concurrent_time = a['end']
        except (ParserError,Exception) as e:
            raise e

    def make_intermediate_state(self, current_s, next_s, ratio, half):
        def ctg_feat_f(key):
            if half:
                return next_s['ctg_features'][key]
            else:
                return current_s['ctg_features'][key]
        def feat_f(key):
            return round_number(current_s['features'][key] + (next_s['features'][key]-current_s['features'][key])*ratio)
        actor = current_s['actor']
        state_id = self.get_id()
        name = '_'+next_s['name']
        time = round_number(current_s['time'] + (next_s['time']-current_s['time'])*ratio)
        depth = self.max_depth + 1
        parameters = next_s['parameters']
        description = 'towards '+next_s['description']
        ctg_features = {k: ctg_feat_f(k) for k in list(current_s['ctg_features'].keys())}
        features = {k: feat_f(k) for k in list(current_s['features'].keys())}
        return {'id': state_id, 'name': name, 'actor': actor, 'time': time, 'depth': depth,
                            'parameters': parameters, 'description': description,
                            'features': features, 'ctg_features': ctg_features}

    def add_intermediate_states(self):
        interval = 20.0
        try:
            for actor in self.actors:
                states_a = [s for s in self.states if s['actor']==actor]
                states_a.sort(key=lambda x:x['time'])
                new_states_a = []
                for i in range(len(states_a)-1):
                    state = states_a[i]
                    time_s = state['time']
                    next_state = states_a[i+1]
                    time_n = next_state['time']
                    diff = time_n - time_s
                    i_diff = diff
                    while diff > interval:
                        ratio = interval/diff
                        half = diff<i_diff/2
                        state = self.make_intermediate_state(state, next_state, ratio, half)
                        new_states_a.append(state)
                        time_s = state['time']
                        diff = time_n - time_s
                self.states.extend(new_states_a)
        except (ParserError,Exception) as e:
            raise e

    def parse_states(self, actions):
        actions.sort(key=lambda x: x['depth'])
        actions.sort(key=lambda x: x['start'])
        g_actions = collections.defaultdict(list)
        for a in actions:
            g_actions[a['actor']].append(a)
        try:
            self.process_actions(g_actions)
            self.add_intermediate_states()
            return self.states
        except (ParserError,Exception) as e:
            raise e