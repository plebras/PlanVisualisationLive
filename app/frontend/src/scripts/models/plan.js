import groupBy from 'lodash-es/groupBy';
import sortBy from 'lodash-es/sortBy';
import size from 'lodash-es/size';
import each from 'lodash-es/each';
import ceil from 'lodash-es/ceil';
import maxBy from 'lodash-es/maxBy';
import mapValues from 'lodash-es/mapValues';
import round from 'lodash-es/round';

export default function Plan(data){

    let dmObj = {};

    let actions = {},
        actors = new Set(),
        states = {},
        features = new Set(),
        featuresWeights = [],
        actorOrder = null;

    for(let a of data.actions){
        actors.add(a['actor']);
        actions[String(a['id'])] = a;
        a['show'] = a.depth === 0;
    }

    function loadStates(d){
        states = {};
        for(let s of d){
            actors.add(s['actor']);
            states[String(s['id'])] = s;
            each(Object.keys(s.features), f=>{features.add(f);});
            each(Object.keys(s.ctg_features), f=>{features.add(f);});
        }
    }
    loadStates(data.states);

    dmObj.loadStates = d => {
        loadStates(d.states);
    };

    for(let [k,v] of Object.entries(data.featureWeights)){
        featuresWeights.push({ name: k, value: v, lower: 0, upper: 20, step: 1 });
    }

    let actionsArray = () => Object.values(actions);
    let actionsByActor = () => groupBy(actions, a=>a.actor);
    let showActions = actionIDsArray => {
        actionIDsArray.forEach(id=>{
            actions[id].show = true;
        });
    };
    let hideActions = actionIDsArray => {
        actionIDsArray.forEach(id=>{
            actions[id].show = false;
        });
    };

    let statesArray = () => sortBy(Object.values(states), ['time']);
    let statesByActor = () => groupBy(states, s=>s.actor);
    let latestStates = time => {
        return Object.values(statesByActor()).map(l=>{
            return sortBy(l.filter(s=>{
                return s.time <= time;
            }), ['time']).pop();
        });
    };
    let nextStates = time => {
        return Object.values(statesByActor()).map(l=>{
            return sortBy(l.filter(s=>{
                return s.time > time;
            }), ['time'])[0];
        }).filter(s=>{
            return typeof s !== 'undefined';
        });
    };
    let intermediateStates = (time, precision) => {
        let prior = latestStates(time), next = nextStates(time), intermediate = [];
        actors.forEach(a=>{
            let p = prior.filter(s=>{
                if(typeof s === 'undefined'){return false;}
                else{return s.actor === a;}
            });
            let n = next.filter(s=>{
                if(typeof s === 'undefined'){return false;}
                else{return s.actor === a;}
            });
            let pS = p[0];
            let nS = n[0];
            if(p.length == 0){
                intermediate.push(nS);
            }else if(time < pS.time+precision || n.length == 0){
                intermediate.push(pS);
            } else if(nS.time-precision < time){
                intermediate.push(nS);
            } else {
                let ratio = (time-pS.time)/(nS.time-pS.time);
                let features = mapValues(pS.features, (f,k)=>{
                    return round(f + ratio * (nS.features[k] - f), 3);
                });
                let projection = mapValues(pS.projection, (p,k)=>{
                    return round(p + ratio * (nS.projection[k] - p), 3);
                });
                intermediate.push({'actor': a,projection,features,time,'description': '','id': 'computed'});
            }
        });
        return intermediate;
    };

    dmObj.getActionsCount = () => size(actions);

    dmObj.getAction = id => actions[id];

    dmObj.getActions = () => actions;

    dmObj.getActionsArray = () => actionsArray();

    dmObj.getActionsByActor = () => actionsByActor();

    dmObj.getActorsArray = () => sortBy(Array.from(actors));

    dmObj.getVisibleActionsArray = () => sortBy(actionsArray().filter(a=>a.show), ['time','actor']);

    dmObj.toggleHierarchy = (id, fold) => {
        let action = actions[id];
        if(typeof fold === 'undefined'){
            fold = action.unfolded;
        }
        if(fold){
            if(typeof action.children !== 'undefined'){
                action.children.forEach(a=>dmObj.toggleHierarchy(a,true));
                hideActions(action.children);
            }
            action.unfolded = false;
        } else {
            if(typeof action.children !== 'undefined'){
                showActions(action.children);
            }
            action.unfolded = true;
        }
    };

    dmObj.getCurrentActions = function(time){
        let res = [];
        for(let acts of Object.values(actionsByActor())){
            let candidates = acts.filter(a=>a.start<=time)
                .filter(a=>a.end>time)
                .sort((a,b)=>b.depth-a.depth);
            if(candidates.length > 0){
                res.push(candidates[0]);
            }
        }
        return res;
    };

    dmObj.getConnectedActions = () => {
        let done = new Set();
        let connectedActions = Object.values(actions).filter(a=>{return typeof a.connected !== 'undefined';});
        let connections = [];
        for(let a of connectedActions){
            for(let b of a.connected){
                if(!done.has(b)){
                    connections.push([a.id,b]);
                }
            }
            done.add(a.id);
        }
        return connections;
    };

    dmObj.getStateCount = () => size(states);

    dmObj.getState = id => states[id];

    dmObj.getStates = () => states;

    dmObj.getStatesArray = () => statesArray();

    dmObj.getStatesByActor = () => statesByActor();

    dmObj.getStateFeatures = () => features;

    dmObj.getActorOrder = () => actorOrder;

    dmObj.getTimeRange = () => [0.0, ceil(maxBy(statesArray(), s=>s.time).time)];

    dmObj.getLatestStates = time => latestStates(time);

    dmObj.getLatestStateIDs = time => latestStates(time).map(s=>s.stateID);

    dmObj.getNextStates = time => nextStates(time);

    dmObj.getNextStateIDs = time => nextStates(time).map(s=>s.stateID);

    let defaultPrecision = 2;

    dmObj.setDefaultTimePrecision = precision => {
        defaultPrecision = precision;
    };

    dmObj.getIntermediateStates = (time, precision) => {
        let p = (typeof precision === 'undefined') ? defaultPrecision : precision;
        return intermediateStates(time, p);
    };

    dmObj.getFeatureWeights = () => featuresWeights;

    return dmObj;
}