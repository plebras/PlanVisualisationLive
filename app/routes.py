from flask import render_template, request
from app import app, controller
import json

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/getDomain', methods = ['GET'])
def get_domain():
    return controller.ui_send_domain_data()

@app.route('/saveProblem', methods = ['POST'])
def save_problem():
    req = request.get_json()
    return controller.ui_save_problem(req)

@app.route('/setProblem', methods = ['POST'])
def set_problem():
    req = request.get_json()
    return controller.ui_set_problem(req)

@app.route('/checkPlan', methods = ['GET'])
def check_plan():
    return controller.ui_query_plan()

@app.route('/getPlan', methods = ['GET'])
def get_plan():
    return controller.ui_send_plan_data()

@app.route('/setFeatWeights', methods = ['POST'])
def set_feature_weights():
    req = request.get_json()
    return controller.ui_set_feature_weights(req)
    # print(w)
    # weights = json.loads(w)
    # print(weights)
    # return ''

@app.route('/getRoadmap', methods = ['GET'])
def get_roadmap():
    return controller.ui_send_roadmap_data()

@app.route('/close', methods = ['POST'])
def close_app():
    return controller.close_application()