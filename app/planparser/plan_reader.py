# from .plan_config import plan_file_start, plan_file_end, plan_file_comment, plan_action_splits
from .plan_config import plan_file_comment, plan_action_splits
from .utils import round_number

class PlanReader:

    def __init__(self):
        self.plan = []

    # def get_action_strings(self, plan_input):
    #     start_index = 0
    #     end_index = len(plan_input)
    #     plan_lines = []
    #     for i, l in enumerate(plan_input):
    #         if l.startswith(plan_file_start):
    #             start_index = i
    #     for i in range(start_index, len(plan_input)):
    #         for s in plan_file_end:
    #             if plan_input[i] == s:
    #                 end_index = i
    #                 plan_lines = plan_input[start_index:end_index:]
    #     return [x for x in plan_lines if not x.startswith(plan_file_comment)]

    ## Parse the action line and add it to the plan
    def parse_action_strings(self, action_strings):
        for a in action_strings:
            [start, rest] = a.split(plan_action_splits[0])
            [full, rest] = rest.split(plan_action_splits[2])
            [duration, _] = rest.split(plan_action_splits[3])
            start = round_number(float(start))
            duration = round_number(float(duration))
            end = round_number(start+duration)
            action = full.split(plan_action_splits[1])
            self.plan.append([action, start, duration, end])

    ## Main function
    # read lines from the plan file and parse them
    def read_plan(self, plan_file):
        # plan_input = open(plan_file, 'r').readlines()
        # action_strings = self.get_action_strings(plan_input)
        # self.parse_action_strings(action_strings)
        self.parse_action_strings([x for x in open(plan_file, 'r').readlines() if not x.startswith(plan_file_comment)])
        return self.plan
