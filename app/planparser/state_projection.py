from .utils import round_number
import sklearn
from sklearn.manifold import MDS, Isomap, TSNE
from itertools import groupby
from math import atan2,cos,sin,copysign

class StateProjection:

    def __init__(self):
        self.states = []
        self.feature_weights = {}

    def get_states_distances(self):
        matrix = []
        max_distances = {}
        for s in self.states:
            row = []
            for t in self.states:
                cell = {}
                for feat, val in s['features'].items():
                    distance = round_number(abs(val-t['features'][feat]))
                    cell[feat] = distance
                    max_distances[feat] = max(max_distances[feat],distance) if feat in max_distances else distance
                for feat, val in s['ctg_features'].items():
                    distance = 0 if val == t['ctg_features'][feat] else 1
                    cell[feat] = distance
                    if feat not in max_distances:
                        max_distances[feat] = 1
                row.append(cell)
            matrix.append(row)
        weights_sum = round_number(sum([v for _, v in self.feature_weights.items()]))
        distance_matrix = [[round_number(sum([val/max_distances[feat]*self.feature_weights[feat] for feat, val in c.items()])/weights_sum) for c in r] for r in matrix]
        return distance_matrix

    def do_projection(self, distances):
        project = MDS(n_components=2,dissimilarity='precomputed',random_state=1)
        # project = TSNE(n_components=2,perplexity=20.0,metric='precomputed')
        # project = Isomap(n_neighbors=2,n_components=2)
        projection = project.fit_transform(distances)
        i = 0
        for p in projection:
            self.states[i]['projection'] = {'x':round_number(p[0]*1000), 'y':round_number(p[1]*1000)}
            i += 1

    def correct_slope(self):
        projection_extents = []
        self.states.sort(key=lambda x: x['actor'])
        for _, v in groupby(self.states, key=lambda x:x['actor']):
            actor_states = list(v)
            actor_states.sort(key=lambda x: x['time'])
            projection_extents.append([j['projection'] for j in [actor_states[i] for i in (0,-1)]])
        slopes = [atan2(e[1]['y']-e[0]['y'], e[1]['x']-e[0]['x']) for e in projection_extents]
        avg_slope = atan2(sum([sin(s) for s in slopes])/len(slopes), sum([cos(s) for s in slopes])/len(slopes))
        rotation_angle = avg_slope
        self.rotate(rotation_angle)
        signs = [copysign(1, e[1]['x']-e[0]['x']) for e in projection_extents]
        overall_sign = sum(signs)
        if overall_sign < 0:
            self.flip('x')

    def get_center(self, axis):
        ma = max([s['projection'][axis] for s in self.states])
        mi = min([s['projection'][axis] for s in self.states])
        return mi+(ma-mi)/2

    def rotate(self, angle):
        for s in self.states:
            x = s['projection']['x']
            y = s['projection']['y']
            x_prime = x * cos(angle) + y * sin(angle)
            y_prime = x * sin(angle) - y * cos(angle)
            s['projection']['x'] = round_number(x_prime)
            s['projection']['y'] = round_number(y_prime)

    def flip(self, axis):
        pivot = self.get_center(axis)
        for s in self.states:
            s['projection'][axis] = pivot+(pivot-s['projection'][axis])
    
    def center(self, axis):
        ce = self.get_center(axis)
        for s in self.states:
            s['projection'][axis] = s['projection'][axis]-ce

    def project_states(self, state_parser, feature_weights = None):
        # make default weights if none is passed
        if feature_weights == None:
            feature_weights = {}
            for f in state_parser.features:
                feature_weights[f] = 1
        # get the features weight
        self.feature_weights = feature_weights
        # get the states
        self.states = state_parser.states
        # make sure states are ordered by time before 
        # the projection as MDS uses indices
        self.states.sort(key=lambda x: x['time'])
        # compute the distance matrix between states
        distances = self.get_states_distances()
        # do the projection
        self.do_projection(distances)
        # correct the curves slope to get 'flat' timelines
        self.correct_slope()
        # recenter curves
        self.center('x')
        self.center('y')
        return self.states