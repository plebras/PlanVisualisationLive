import has from 'lodash-es/has';

export default function Domain(data){

    let dmObj = {};

    dmObj.getRobots = ()=>{
        if(has(data.problem, 'robots')){
            for(let i in data.domain.robots.robots){
                let pr = data.problem.robots.filter(r2=>r2.id==data.domain.robots.robots[i].id);
                if(pr.length > 0){
                    let c = data.domain.robots.robots[i];
                    data.domain.robots.robots[i] = {...c,...pr[0]};
                }
            }
        } 
        return data.domain.robots.robots;
    };

    dmObj.getMapDimensions = ()=>{
        return data.domain.map.dimensions;
    };

    dmObj.getWaypoints = ()=>{
        return data.domain.map.waypoints;
    };

    dmObj.getRelatedWaypoints = ()=>{
        return data.domain.map.related_waypoints;
    };

    dmObj.getObjects = ()=>{
        return data.domain.map.objects;
    };

    dmObj.getGoals = ()=>{
        if(has(data.problem, 'goals')) return data.problem.goals;
        return [];
    };

    dmObj.getGoalTypes = ()=>{
        return data.domain.goals.goal_types;
    };

    dmObj.getPreferenceTypes = ()=>{
        return data.domain.goals.preference_types;
    };

    dmObj.getPreferencePredicates = ()=>{
        return data.domain.goals.preference_predicates;
    };

    dmObj.getPreferences = ()=>{
        if(has(data.problem, 'preferences')) return data.problem.preferences;
        return [];
    };

    dmObj.getFullData = ()=>{
        return data;
    };

    dmObj.buildProblemData = ()=>{
        data.problem.robots = data.domain.robots.robots.map(r=>{
            return {id: r.id, name: r.name, position: r.position, energy: r.energy, available: r.available};
        });
        return data.problem;
    };

    dmObj.resetProblemData = ()=>{
        data.problem.robots = [];
        data.problem.goals = [];
        data.problem.preferences = [];
        return data.problem;
    };

    return dmObj;
}