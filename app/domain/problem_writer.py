import json

robots_data_file = 'app/domain/data/robots.json'
map_data_file = 'app/domain/data/map.json'
goals_data_file = 'app/domain/data/goals.json'
problem_data_file = 'app/domain/data/problem.json'
distance_time_data_file = 'app/domain/data/distance_time.json'

goals_file = 'app/planner/inputs/goals.txt'
map_file = 'app/planner/inputs/map.txt'
robots_file = 'app/planner/inputs/robots.txt'
objects_file = 'app/planner/problem_definition/objects.txt'
preference_file = 'app/planner/problem_definition/preferences.txt'
metric_file = 'app/planner/problem_definition/metric.txt'
initial_state_file = 'app/planner/problem_definition/initial_state.txt'

class ProblemWriter():

    def __init__(self):
        with open(robots_data_file, 'r') as in_file:
            self.robots_data = json.load(in_file)
        with open(map_data_file, 'r') as in_file:
            self.map_data = json.load(in_file)
        with open(goals_data_file, 'r') as in_file:
            self.goals_data = json.load(in_file)
        with open(problem_data_file, 'r') as in_file:
            self.problem_data = json.load(in_file)
        
    def write_goals(self):
        goals = self.problem_data['goals']
        with open(goals_file, 'w') as out_file:
            for g in goals:
                out_file.write('(%s %s)\n' %(g['name'],' '.join([str(p) for p in g['parameters']])))

    def write_map(self):
        robots = self.problem_data['robots']
        waypoints = self.map_data['waypoints']
        points = self.map_data['points']
        with open(map_file, 'w') as out_file:
            for w in waypoints:
                p = list(filter(lambda x: x['name']==w['alias'], points))[0]
                r = list(filter(lambda x: x['position']==w['name'], robots))
                c = ', '.join([str(x) for x in p['coordinates']])
                t = 'goal' if len(r)==0 else 'robot_initial'
                r = '' if len(r)==0 else '{%s}'%r[0]['name']
                out_file.write('%s[%s,%s,%s,%s]%s\n'%(w['name'],c,p['name'],w['type'],t,r))

    def write_robots(self):
        robots_pb = list(filter(lambda x: x['available'] ,self.problem_data['robots']))
        robots_d = self.robots_data['robots']
        with open(robots_file, 'w') as out_file:
            for r_pb in robots_pb:
                r = list(filter(lambda x: x['name'] == r_pb['name'], robots_d))[0]
                c = ', '.join(r['capabilities'])
                out_file.write('%s[%s]{%s}\n'%(r['name'],c,r['waypoints']))
    
    def write_objects(self):
        robots_pb = list(filter(lambda x: x['available'] ,self.problem_data['robots']))
        waypoints = self.map_data['waypoints']
        with open(objects_file, 'w') as out_file:
            out_file.write('%s - robot\n'%' '.join([r['name'] for r in robots_pb]))
            out_file.write('%s - poi\n'%' '.join([w['name'] for w in waypoints]))

    def write_preferences_metric(self):
        preferences = self.problem_data['preferences']
        pref = []
        for p in preferences:
            goals = []
            for g in p['goals']:
                if isinstance(g, str):
                    goals.append(g)
                elif isinstance(g, dict):
                    if g['type'] == 'state':
                        goals.append('(%s %s)'%(g['name'],' '.join(g['params'])))
                    elif g['type'] == 'function':
                        goals.append('(%s (%s %s) %s)'%(g['params'][1],g['name'],g['params'][0],g['params'][2]))
            pref.append(['(%s %s)'%(p['type'],' '.join(goals)), p['weight']])
        with open(preference_file, 'w') as out_file_p, open(metric_file, 'w') as out_file_m:
            for i, p in enumerate(pref):
                out_file_p.write('(preference p%s %s)\n'%(str(i), p[0]))
            if len(pref) > 1:
                out_file_m.write('minimize\n(+ %s\n)'%'\n   '.join(['(* (is-violated p%s) %s)'%(i,str(p[1])) for i, p in enumerate(pref)]))
            elif len(pref) > 0:
                out_file_m.write('minimize\n (* (is-violated p0) %s)'%(pref[0][1]))

    def write_initial_map(self, out_file):
        for o in self.map_data['objects']:
            out_file.write('(%s_at %s)\n'%(o['type'], o['position']))
        out_file.write('\n')
        for wp in self.map_data['related_waypoints']:
            out_file.write('(related %s)\n'%(' '.join(wp)))
        out_file.write('\n')
        with open(distance_time_data_file, 'r') as in_file:
            for d in json.load(in_file):
                out_file.write('(= (distance_intime %s %s) %s)\n'%(d[0],d[1],d[2]))
        out_file.write('\n')

    def write_initial_robots(self, out_file):
        robots = []
        for r in self.problem_data['robots']:
            if r['available']:
                out_file.write('(at %s %s)\n'%(r['name'],r['position']))
                out_file.write('(= (energy %s) %s)\n'%(r['name'],str(r['energy'])))
                out_file.write('(available %s)\n'%(r['name']))
                robots.append(r['name'])
        out_file.write('\n')
        for r in self.robots_data['robots']:
            if r['name'] in robots:
                for p in r['recharge_points']:
                    out_file.write('(recharge_point %s %s)\n'%(r['name'],p))
                for c in r['capabilities']:
                    out_file.write('(%s %s)\n'%(c,r['name']))
                for f,v in r['advanced'].items():
                    out_file.write('(= (%s %s) %s)\n'%(f,r['name'],str(v)))
        out_file.write('\n')

    def write_initial_state(self):
        with open(initial_state_file, 'w') as out_file:
            self.write_initial_map(out_file)
            self.write_initial_robots(out_file)

    def write_problem(self):
        self.write_goals()
        self.write_map()
        self.write_robots()
        self.write_objects()
        self.write_preferences_metric()
        self.write_initial_state()