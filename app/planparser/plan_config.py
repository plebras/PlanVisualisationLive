
# in plan file, how to split lines and strings
# plan_file_start = ('; Plan found ', ';;;; Solution Found')
# plan_file_end = ('\n')
plan_file_comment = (';')
plan_action_splits = [': (', ' ', ')  [', ']']

# composite actions, i.e. how to split action
# 0: action string constructor: action name + params
# 1: percentage of start time,
#   e.g. 0.0 start at begining of composite action,
#       0.5 start at half the composite action time
# 2: percentage of duration,
#   e.g. 1.0 lasts whole of composite action duration,
#       0.5 lasts half of composite action duration
composite_actions = {
    'manipulate_record_valve':[
        [['manipulate_valve', 1, 3], 0.0, 1.0],
        [['record_valve_manip', 2, 4], 0.0, 1.0]
    ]
}

# action parsing rules:
# actor: index of actor in string
# waypoints: if movement, index of start/end waypoints
# parameters: index of parameters to keep
# description: list to build description of action
action_parse = {
    'navigate':{
        'actor': 1,
        'waypoints': [2, 3],
        'parameters': [2, 3],
        'description': ['moving from', 2, 'to', 3]
    },
    'recharge_battery':{
        'actor': 1,
        'parameters': [2],
        'description': ['recharging at', 2]
    },
    'comm_data':{
        'actor': 1,
        'parameters': [2],
        'description': ['sending data from', 2]
    },
    'take_image':{
        'actor': 1,
        'parameters': [2],
        'description': ['taking image of', 2]
    },
    'check_temperature':{
        'actor': 1,
        'parameters': [2],
        'description': ['checking temperature at', 2]
    },
    'check_pressure':{
        'actor': 1,
        'parameters': [2],
        'description': ['checking pressure at', 2]
    },
    'inspect_valve':{
        'actor': 1,
        'parameters': [2],
        'description': ['inspecting valve at', 2]
    },
    'manipulate_valve':{
        'actor': 1,
        'parameters': [2],
        'description': ['turning valve at', 2]
    },
    'record_valve_manip':{
        'actor': 1,
        'parameters': [2],
        'description': ['recording valve manipulation at', 2]
    }
}

# action to state rules:
# effect: state to results from action
# initial: state pre-action if first action for actor
#   name: state name
#   parameters: parameter indices to transfer from action to state
action_to_state = {
    'navigate':{
        'effect': {'name':'at', 'parameters': [1]},
        'initial': {'name':'at', 'parameters': [0]}
    },
    'recharge_battery':{
        'effect': {'name':'recharged', 'parameters': [0]},
        'initial': {'name':'at', 'parameters': [0]}
    },
    'comm_data':{
        'effect': {'name':'data_sent', 'parameters': [0]},
        'initial': {'name':'at', 'parameters': [0]}
    },
    'take_image':{
        'effect': {'name':'image_taken', 'parameters': [0]},
        'initial': {'name':'at', 'parameters': [0]}
    },
    'check_temperature':{
        'effect': {'name':'temperature_checked', 'parameters': [0]},
        'initial': {'name':'at', 'parameters': [0]}
    },
    'check_pressure':{
        'effect': {'name':'pressure_checked', 'parameters': [0]},
        'initial': {'name':'at', 'parameters': [0]}
    },
    'inspect_valve':{
        'effect': {'name':'valve_inspected', 'parameters': [0]},
        'initial': {'name':'at', 'parameters': [0]}
    },
    'manipulate_valve':{
        'effect': {'name':'valve_turned', 'parameters': [0]},
        'initial': {'name':'at', 'parameters': [0]}
    },
    'record_valve_manip':{
        'effect': {'name':'valve_manip_recorded', 'parameters': [0]},
        'initial': {'name':'at', 'parameters': [0]}
    }
}

# state parsing rules:
# description: list to build description of state
# features: map of feature name and parameter index for feature value
#   every states must have the same list of features
#       if feature not avaible for a state, use index -1: c -> '', o/n -> 0
#   default: numerical feature
#   c -> categorical, o -> ordinal, n -> numerical features
#   reserved feature names:
#       position -> will lookup x, y, and z in roadmap
#       actor -> will use actor name as categorical feature
state_parse = {
    'at':{
        'description': ['is at', 0],
        'features':{'position': 0}
    },
    'recharged':{
        'description': ['has recharged at', 0],
        'features':{'position': 0}
    },
    'data_sent':{
        'description': ['sent data from', 0],
        'features':{'position': 0}
    },
    'image_taken':{
        'description': ['has taken the image of valve at', 0],
        'features':{'position': 0}
    },
    'temperature_checked':{
        'description': ['has checked temperature at', 0],
        'features':{'position': 0}
    },
    'pressure_checked':{
        'description': ['has checked pressure at', 0],
        'features':{'position': 0}
    },
    'valve_inspected':{
        'description': ['has inspected valve at', 0],
        'features':{'position': 0}
    },
    'valve_turned':{
        'description': ['has turned valve at', 0],
        'features':{'position': 0}
    },
    'valve_manip_recorded':{
        'description': ['has recorded valve manipulation at', 0],
        'features':{'position': 0}
    }
}

# ordinal features rules:
# feature name
#   feature value -> numerical value associated with
ordinal_feature = {
    # 'ordinal_feature_name':{
    #     'feature_value_1': 0,
    #     'feature_value_2': 1,
    #     'feature_value_3': 2
    # }
}