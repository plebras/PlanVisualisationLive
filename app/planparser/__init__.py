from .roadmap import Roadmap
from .plan_reader import PlanReader
from .action_parser import ActionParser
from .state_parser import StateParser
from .state_projection import StateProjection
from .parser_exception import ParserError


map_data_file = 'app/domain/data/map.json'
default_plan_file = 'app/planner/plan.pddl'

roadmap = Roadmap(map_data_file)
reader = PlanReader()
parser_a = ActionParser(roadmap)
parser_s = StateParser(roadmap)
project_s = StateProjection()

# state vars
plan_loaded = False

def load_parse_plan():
    global plan_loaded
    try:
        print('Reading plan')
        reader.read_plan(default_plan_file)
        plan_loaded = True
        print('Parsing actions')
        parser_a.parse_actions(reader.plan)
        print('Parsing states')
        parser_s.parse_states(parser_a.actions)
        project_plan_states()
    except ParserError as e:
        print('Parsing error')
        raise e 

def project_plan_states(feature_weights = None):
    try:
        print('Projecting states')
        project_s.project_states(parser_s, feature_weights)
    except ParserError as e:
        print('Parsing error')
        raise e 

def has_plan():
    return plan_loaded

def get_plan_data():
    return {'actions': parser_a.actions, 'actors': list(parser_a.actors), 'states': project_s.states, 'featureWeights': project_s.feature_weights}

def get_plan_states():
    return {'states': project_s.states}