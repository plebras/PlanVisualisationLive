import json
from math import sqrt
import heapq
from .utils import round_number

##
#   Priority Queue data structure
##
class PriorityQueue:
    def __init__(self):
        self.elements = []

    def empty(self):
        return len(self.elements) == 0

    def put(self, item, priority):
        heapq.heappush(self.elements, (priority, item))

    def get(self):
        return heapq.heappop(self.elements)[1]

##
#   Bi-Directional dictionnary
##
class bidict(dict):
    def __init__(self, *args, **kwargs):
        super(bidict, self).__init__(*args, **kwargs)
        self.inverse = {}
        for key, value in self.items():
            self.inverse.setdefault(value,[]).append(key) 

    def __setitem__(self, key, value):
        if key in self:
            self.inverse[self[key]].remove(key) 
        super(bidict, self).__setitem__(key, value)
        self.inverse.setdefault(value,[]).append(key)        

    def __delitem__(self, key):
        self.inverse.setdefault(self[key],[]).remove(key)
        if self[key] in self.inverse and not self.inverse[self[key]]: 
            del self.inverse[self[key]]
        super(bidict, self).__delitem__(key)

##
#   Roadmap class
#   - loads waypoints data from Gazebo and Planner
#   - creates unified structure for waypoints
#   - provides accessor functions
#   - implements A* path planner to find shortest path between points
##
class Roadmap:

    # Constructor
    def __init__(self, map_data_file):
        self.waypoints = {}
        self.waypoint_point_map = {}
        self.environment = {}
        self.load_roadmap_data(map_data_file)
        # self.load_roadmap_data(roadmap_file)
        # self.load_waypoint_data(dataDirectory=dataDirectory)

    # Loading data: Gazebo coordinates + planner names
    def load_roadmap_data(self, map_data_file):
        with open(map_data_file, 'r') as in_file:
            data = json.load(in_file)
            self.load_environment_data(data['dimensions'])
            self.load_point_data(data['points'], data['waypoints'])

    # Loading environemnt data, x, y, z ranges
    # use following conditions to parse further if needed
    def load_environment_data(self, env_data):
        if 'x' in env_data:
            self.environment['x'] = env_data['x']
        if 'y' in env_data:
            self.environment['y'] = env_data['y']
        if 'z' in env_data:
            self.environment['z'] = env_data['z']

    def get_waypoint_point_map(self, waypoint_data):
        self.waypoint_point_map = bidict({p['name']:p['alias'] for p in waypoint_data})

    # Loading point data, list with name, coordinate and neighbors
    # use following conditions to parse further if needed
    def load_point_data(self, point_data, waypoint_data):
        axes = ['x', 'y', 'z']
        self.get_waypoint_point_map(waypoint_data)
        for p in point_data:
            point = {}
            point['name'] = p['name']
            point['neighbors'] = p['neighbors']
            for i, c in enumerate(p['coordinates']):
                point[axes[i]] = c
            if p['name'] in self.waypoint_point_map.inverse:
                point['aliases'] = self.waypoint_point_map.inverse[p['name']]
            else:
                point['aliases'] = []
            self.waypoints[p['name']] = point

    # Building and returning the roadmap data
    def get_roadmap_data(self):
        return {'points': self.waypoints, 'environment': self.environment}

    # check if argument is part of waypoint_point_map, and return corresponding point
    # returns argument unchanged otherwise
    def transform_waypoint(self, waypoint):
        return self.waypoint_point_map[waypoint] if waypoint in self.waypoint_point_map else waypoint
    

    ##### ------- CHECK WITH YANIEL IF STILL USEFUL -----------
    # Loading waypoint data used by planner, and calling parser
    # def load_waypoint_data(self, dataDirectory='../data/roadmap/'):
    #     with open(dataDirectory+'waypoints_air.txt', 'r') as inFile:
    #         self.parse_waypoint_data(inFile)
    #     with open(dataDirectory+'waypoints_ground.txt', 'r') as inFile:
    #         self.parse_waypoint_data(inFile)

    # # Parsing waypoint data used by planner, feeds waypoint aliases data
    # def parse_waypoint_data(self, inFile):
    #     for l in [l for l in inFile.readlines() if not l.startswith(';')]:
    #         [key, details] = l.split('[')
    #         [details, _] = details.split(']')
    #         [x,y,z,alias] = details.split(',')
    #         self.waypointAlias[key] = alias

    # # Given a planner waypoint (e.g. wpg32), returns a Gazebo waypoint (e.g. NE_out_3)
    # def get_waypoint_name(self, alias):
    #     return self.waypointAlias[alias]
    ##### ------------------------------------------------------

    # Given a waypoint name (e.g. NE_out_3), returns an array with coordinates [x,y,z]
    def get_waypoint_coordinates(self, wp):
        return [self.waypoints[wp]['x'],self.waypoints[wp]['y'],self.waypoints[wp]['z']]

    # Given two waypoints name (e.g. NE_out_3), returns the euclidean distance between them
    def get_waypoints_eucl_distance(self, wp1, wp2):
        c1 = self.get_waypoint_coordinates(wp1)
        c2 = self.get_waypoint_coordinates(wp2)
        return round_number(sqrt((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2 + (c1[2]-c2[2])**2))

    # Given a waypoint name (e.g. NE_out_3), returns the list of its neigbours
    def get_waypoint_neighbours(self, wp):
        return self.waypoints[wp]['neighbors']

    # Given two waypoints name (e.g. NE_out_3), executes A* search through waypoints graph
    # and returns array of waypoints in path between the two given waypoints 
    def a_star_path(self, start_wp, goal_wp):
        open_nodes = PriorityQueue()
        open_nodes.put(start_wp, 0)
        came_from = {}
        cost_so_far = {}
        came_from[start_wp] = None
        cost_so_far[start_wp] = 0
        while not open_nodes.empty():
            current = open_nodes.get()
            if current == goal_wp:
                break
            for n in self.get_waypoint_neighbours(current):
                new_cost = cost_so_far[current] + self.get_waypoints_eucl_distance(current, n)
                if n not in cost_so_far or new_cost < cost_so_far[n]:
                    cost_so_far[n] = new_cost
                    priority  = new_cost + self.get_waypoints_eucl_distance(n, goal_wp)
                    open_nodes.put(n, priority)
                    came_from[n] = current
        path = [goal_wp]
        current_point = goal_wp
        while current_point != start_wp:
            path.append(came_from[current_point])
            current_point = came_from[current_point]
        return path[::-1]

    # Given two waypoints name (e.g. NE_out_3), gets path between them and returns dict with format:
    # {
    #   path: [
    #       [wp1, wp2, dist],
    #       [wp2, wp3, dist],
    #       ...
    #   ],
    #   distance: total distance of path
    # }
    def get_waypoints_path(self, start_wp, goal_wp):
        waypoint_path = self.a_star_path(start_wp, goal_wp)
        path = []
        total_distance = 0
        for i, p in enumerate(waypoint_path):
            if i == 0:
                continue
            prev = waypoint_path[i-1]
            d = self.get_waypoints_eucl_distance(p, prev)
            path.append([prev, p, d])
            total_distance += d
        return {
            'path': path,
            'distance': round_number(total_distance)
        }