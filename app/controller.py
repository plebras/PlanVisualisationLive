from flask import request
from app import planparser, domain
import json
import subprocess

plan_started = False
plan_failed = False
plan_completed = False
details = ''

def ui_send_domain_data():
    return json.dumps(domain.get_domain_data())

def ui_save_problem(data):
    domain.save_problem_data(data)
    return json.dumps({'type':'info', 'msg':'problem saved'})

def ui_set_problem(data):
    domain.save_problem_data(data)
    domain.write_problem_files()
    planner_start()
    return json.dumps({'type':'info', 'msg':'planning in progress'})

def planner_start():
    global plan_started, plan_completed, plan_failed, details
    # launch planner
    # os.system('cd app/planner/ && ./tap')
    plan_started = True
    planner = subprocess.Popen('cd app/planner/ && ./tap', shell=True, stdout=subprocess.PIPE).stdout
    res = planner.read().decode()
    if ';;;; Solution Found' in res:
        plan_completed = True
        plan_started = False
    else:
        plan_failed = True
        plan_started = False
        details = res
    

# count = 0
def ui_query_plan():
    global plan_started, plan_completed, plan_failed, details
    # if count < 1:
    #     count += 1
    # else:
    #     plan_completed = True
    #     plan_started = False
    if plan_started and (not plan_completed or not plan_failed):
        return json.dumps({'type':'info', 'msg':'planning in progress'})
    elif plan_failed:
        return json.dumps({'type':'info', 'msg':'planning failed', 'details': details})
    elif plan_completed:
        return json.dumps({'type':'info', 'msg':'planning complete'})

def ui_send_roadmap_data():
    return json.dumps(planparser.roadmap.get_roadmap_data())

def ui_send_plan_data():
    if not planparser.has_plan():
        try:
            planparser.load_parse_plan()
        except planparser.ParserError as e:
            msg = e.args
            return json.dumps({'type': 'error', 'msg':msg})
    # return json.dumps(planparser.get_plan_data())
    return json.dumps(planparser.get_plan_data())

def ui_set_feature_weights(weights):
    if planparser.has_plan():
        planparser.project_plan_states(weights)
        return json.dumps(planparser.get_plan_states())

def close_application():
    shutdown = request.environ.get('werkzeug.server.shutdown')
    if shutdown is None:
        raise RuntimeError('Nope')
    else:
        shutdown()
        return 'shutting down'