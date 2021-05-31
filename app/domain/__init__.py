import json
from .problem_writer import ProblemWriter

robots_file = 'app/domain/data/robots.json'
map_file = 'app/domain/data/map.json'
goals_file = 'app/domain/data/goals.json'

problem_file = 'app/domain/data/problem.json'

def load_domain_files():
    ret = {}
    with open(robots_file, 'r') as in_file:
        ret['robots'] = json.load(in_file)
    with open(map_file, 'r') as in_file:
        ret['map'] = json.load(in_file)
    with open(goals_file, 'r') as in_file:
        ret['goals'] = json.load(in_file)
    return ret

def load_problem_file():
    with open(problem_file, 'r') as in_file:
        return json.load(in_file)

def get_domain_data():
    return {'domain': load_domain_files(), 'problem': load_problem_file()}

def save_problem_data(data):
    with open(problem_file, 'w') as out_file:
        json.dump(data, out_file)

def write_problem_files():
    ProblemWriter().write_problem()