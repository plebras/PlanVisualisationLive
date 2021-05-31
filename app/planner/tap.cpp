/*
* Solve the ORCA-TAP planning problem "problem.pddl" in "domain.pddl"
*/
#include "libTAP.h"
#include <stdio.h>

main()
{
  //planning files
   std::string p = "plan.pddl";
   std::string prob = "problem.pddl";
   std::string dom = "domain.pddl";
   std::string planner = "optic-cplex";

   // files to add information related to the task allocation
   std::string goal_filename = "inputs/goals.txt";
   std::string robot_filename = "inputs/robots.txt";
   std::string ontology_filename = "inputs/ontology.yaml";
   std::string map_filename = "inputs/map.txt";


   // files to add information related to the problem
   std::string problem_objects = "problem_definition/objects.txt";
   std::string problem_initial_state = "problem_definition/initial_state.txt";
   std::string problem_preferences = "problem_definition/preferences.txt";
   std::string problem_metric = "problem_definition/metric.txt";



   // load the original problem and file

   std::string problem = loadProblem(prob);
   std::string domain = loadDomain(dom);

   // clear actual information in the problem file


   clearTAInstances(problem, "robot_can_act");

   clearObjects(problem);

   clearInitialState(problem);

   clearGoals(problem);

   clearPreferences(problem);

   clearCostFunction(problem);

   clearProblem(problem);

   // adding information to the problem file



   loadObjects(problem, problem_objects);

   loadInitialState(problem, problem_initial_state);

   loadGoals(problem, goal_filename);

   loadPreferences(problem, problem_preferences);

   loadCostFunction(problem, problem_metric);




   bool allocation = callTA(goal_filename, robot_filename, ontology_filename, map_filename);


  if (allocation){


     loadTAInstances(problem);

     clearPlan(p);
     bool plan_output = buildPlan(domain, problem, p, planner);

     if (plan_output){
       std::cout << "TAP found plan:"<< '\n';
       bool plan = loadPlan(p);
     }
     else
        std::cout << "No plan found." << '\n';

   }
   else
      std::cout << "Task allocation is not completed" << '\n';
}
