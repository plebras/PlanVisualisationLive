// import Domain from '../../models/domain';
import RobotList from '../components/editor/robotList';
import GoalList from '../components/editor/goalList';
import PreferenceList from '../components/editor/preferenceList';
import {select as D3Select} from 'd3-selection';

import '../../../styles/page/problemEditor.less';

export default function ProblemEditor(domContainer){

    let pbObj = {};

    pbObj.loadDomain = (d)=>{
        domain = d;
        return pbObj;
    };

    pbObj.render = ()=>{
        renderView();
        renderRobots();
        renderGoals();
        renderPreferences();
        return pbObj;
    };

    pbObj.remove = ()=>{
        if(typeof view !== 'undefined'){
            view.remove();
        }
        return pbObj;
    };

    let domain;

    let view;

    function renderView(){
        view = D3Select(domContainer).append('div')
            .classed('problemEditor', true);
        view.append('h2')
            .text('Problem Editor');
    }

    function renderRobots(){
        let robots = domain.getRobots();
        let waypoints = domain.getWaypoints();
        view.append('div').classed('section sec1', true);
        RobotList('div.sec1', robots, waypoints);
    }

    function renderGoals(){
        let goals = domain.getGoals();
        let goalTypes = domain.getGoalTypes();
        let waypoints = domain.getWaypoints();
        let rel_waypoints = domain.getRelatedWaypoints();
        let objects = domain.getObjects();
        let robots = domain.getRobots();
        view.append('div').classed('section sec2', true);
        GoalList('div.sec2', goalTypes, goals, waypoints, objects, rel_waypoints, robots);
    }

    function renderPreferences(){
        let preferences = domain.getPreferences();
        let preferenceTypes = domain.getPreferenceTypes();
        let preferencePredicates = domain.getPreferencePredicates();
        let goalTypes = domain.getGoalTypes();
        let waypoints = domain.getWaypoints();
        let objects = domain.getObjects();
        let robots = domain.getRobots();
        view.append('div').classed('section sec3', true);
        PreferenceList('div.sec3', preferences, preferenceTypes, preferencePredicates, goalTypes, robots, waypoints, objects);
    }
    
    return pbObj;
}