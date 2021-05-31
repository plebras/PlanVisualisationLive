#!/usr/bin/env python
# All rights reserved.
# =============================================================================================================================================
# Author: Yaniel Carreno & Dr. Ron Petrick
# More Info Please Check:
# Carreno, Y.; Pairet, E.; Petillot, Y.; and Petrick, R. P. 2020. Task Allocation Strategy for Heterogeneous Robot Teams in Offshore Missions.
# In Proceedings of the International Conference on Autonomous Agents and Multiagent Systems (AAMAS).
# ==============================================================================================================================================

from __future__ import print_function
import sys
from sys import argv
import numpy as np
# import cv2
import time
import re
import yaml
import csv
from linecache import getline
import os


class capability_analyser(object):

    def __init__(self):
        # ======================================================================
        # constructor
        # ======================================================================
        self.initialCall()

        # ======================================================================
        # Has the goal been loaded?
        # ======================================================================
        self.capabilities_recognised = False
        self.goals_indx_allocated = False

    def initialCall(self):
        self.goals_file = argv[1]
        self.robot_file = argv[2]
        self.ontology_file = argv[3]
        self.load_goals_cap_ontology()
        self.load_capabilities()
        if (self.capabilities_recognised):
            self.goals_indx_dist = open('goals_indx_distribution.txt', 'w+')
            self.goals_redundancy = open('goals_redundancy.txt', 'w+')
            for capability_robot_indx in range(0, len(self.robot_set)):
                self.final_array = []
                self.final_redundancy = []
                for capability_data_indx in range(0, len(self.data)):
                    for capability_goal_indx in range(0, len(self.goal_set)):
                        if self.robot_set[capability_robot_indx] in self.data[capability_data_indx] and  self.goal_set[capability_goal_indx] in self.data[capability_data_indx]:
                            self.final_array.append("g"+str(capability_goal_indx)+".-")
                            redundacy_element = str(self.redundancy_set[capability_data_indx])
                            curr = redundacy_element.find(",")
                            next = redundacy_element.find("]")
                            self.redundancy_result = redundacy_element[curr+1:next]
                            self.final_redundancy.append(["g"+str(capability_goal_indx)+".-",self.redundancy_result])

                self.solution_goal = str(self.robot_set[capability_robot_indx])+str(self.final_array)
                self.solution_redundancy = str(self.robot_set[capability_robot_indx])+str(self.final_redundancy)
                self.goals_indx_dist.write(str(self.solution_goal)+ '\n')
                self.goals_redundancy.write(str(self.solution_redundancy)+ '\n')
            self.goals_indx_dist.close()
            self.goals_redundancy.close()
            self.goals_indx_allocated = True
            self.results = open('capALLOC_results.txt', 'w+')
            self.results.write(str(self.goals_indx_allocated)+ '\n')
            self.results.write(str(len(self.robot_set))+ '\n')
            self.results.close()

    def load_capabilities(self):
        # ======================================================================
        # load_capabilities loads the goal and robot capabilities from the file
        # to find the sets of robots that can do a particular task.
        # input: robot_file and goals_file
        # output: index of the possible tasks to be implemented for the robot
        # ======================================================================
        try:
            goals_ifile = open(self.goals_file, "rw+")
            self.goal_file_lines = 0
            for goals_line in open(self.goals_file):
                self.goal_file_lines += 1
            self.data = []
            self.robot_set = []
            self.goal_set = []
            self.redundancy_set = []
            for self.goals_line_no in range(0, self.goal_file_lines):
                actual_line = getline(self.goals_file, self.goals_line_no)
                reader = goals_ifile.readline()
                curr = reader.find("(")
                next = reader.find(" ")
                self.goals_name = reader[curr+1:next]
                step = reader.find(")")
                self.goal_coord_id = reader[next+1:step]
                self.goals_capability_name = self.ontology_list['capability'][str(self.goals_name)]
                if not self.goals_line_no in self.goal_set:
                    self.goal_set.append(self.goals_line_no)
                robot_ifile = open(self.robot_file, "rw+")
                self.robot_file_lines = 0
                for robot_line in open(self.robot_file):
                    self.robot_file_lines += 1
                for self.robot_line_no in range(0, self.robot_file_lines):
                    actual_line = getline(self.robot_file, self.robot_line_no)
                    reader = robot_ifile.readline()
                    curr = reader.find("[")
                    next = reader.find("]")
                    self.robot_capability_set = reader[curr:next+1]
                    curr = reader.find("[")
                    self.robot_name = reader[:curr]
                    curr = reader.find("{")
                    next = reader.find("}")
                    self.wp_type = reader[curr+1:next]
                    if not self.robot_name in self.robot_set:
                        self.robot_set.append(self.robot_name)
                    if  self.goals_capability_name in self.robot_capability_set:
                        if self.wp_type in self.goal_coord_id:
                            self.data.append([self.robot_name, self.goals_line_no])
                            no_sensors = 1
                            for len_redundancy in range(0,len(self.ontology_list['redundancy'][str(self.goals_name)])):
                                if self.ontology_list['redundancy'][str(self.goals_name)][len_redundancy] in self.robot_capability_set:
                                    no_sensors = no_sensors + 1
                            self.redundancy_set.append([self.robot_name, no_sensors])

            self.capabilities_recognised = True
        except:
            print('Unable to read the indicated file')
    def load_goals_cap_ontology(self):
        with open(self.ontology_file, "rw+") as stream:
            self.ontology_list = yaml.safe_load(stream)

if __name__ == '__main__':

    capability_analyser = capability_analyser()
