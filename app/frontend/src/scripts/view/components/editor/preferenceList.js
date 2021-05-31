import {select as D3Select} from 'd3-selection';

import '../../../../styles/components/editor/preferenceList.less';

function addOptionsToSelect(select, data, valueAccessor, textAccessor=null){
    if(textAccessor === null){
        textAccessor = valueAccessor;
    }
    select.selectAll('option')
        .data(data)
        .enter().append('option')
        .attr('value', valueAccessor)
        .text(textAccessor)
        .property('selected', (d,i)=>i==0);
}

export default function PreferenceList(domContainer, preferenceData, preferenceTypeData, preferencePredicateData, goalTypeData, robotData, waypointData, objectData){

    let plObj = {};

    D3Select(domContainer).append('h3')
        .text('List of Preferences');
    
    let list = D3Select(domContainer).append('div')
        .classed('list preferenceList', true);
    
    let createPreference = list.append('div')
        .classed('createPreference', true);

    let preferenceType = createPreference.append('span')
        .classed('type', true);
    preferenceType.append('label')
        .text('Preference: ');
    let preferenceTypeSelect = preferenceType.append('select');
    addOptionsToSelect(preferenceTypeSelect, preferenceTypeData, d=>d.name);
    preferenceTypeSelect.on('change', function(){
        let d = preferenceTypeData.filter(p=>p.name == this.value)[0];
        makePreferenceGoals(d);
    });
    let preferenceParams = createPreference.append('div')
        .classed('goals', true);
    let preferenceGoals;
    makePreferenceGoals(preferenceTypeData[0]);
    let preferenceWeight = createPreference.append('span')
        .classed('weight', true);
    preferenceWeight.append('label').text('Weight: ');
    preferenceWeight.append('input').attr('type', 'number')
        .attr('min', 0).attr('max', 100).attr('value', 50);

    function makePreferenceGoals(d){
        preferenceParams.selectAll('div.goal').remove();

        preferenceGoals = preferenceParams.selectAll('div.goal')
            .data(d.goals)
            .enter().append('div')
            .classed('goal', true);

        preferenceGoals.append('span')
            .classed('goalType', true);
        preferenceGoals.select('span.goalType').append('label')
            .text((d,i)=>`${d} ${i+1}: `);
        preferenceGoals.each(function(p){
            let goal = D3Select(this);
            if(p === 'predicate'){
                let select = goal.select('span.goalType').append('select');
                addOptionsToSelect(select, preferencePredicateData, d=>d.name);
                select.on('change', function(){
                    let d = preferencePredicateData.filter(p=>p.name == this.value)[0];
                    makeGoalPredicateParameters(goal, d);
                });
                makeGoalPredicateParameters(goal, preferencePredicateData[0]);
            } else if(p === 'number'){
                goal.select('span.goalType').append('input')
                    .attr('type', 'number').attr('min', 0).attr('max', 10000).attr('value', 10);
            }
        });
    }

    function makeGoalPredicateParameters(goal, predicateData){
        goal.selectAll('span.param').remove();

        let predicateParameters = goal.selectAll('span.param')
            .data(()=>{
                let res = predicateData.parameters.map(p=>p);
                if(predicateData.type == 'function'){
                    res.push('operator');
                    res.push('number');
                }
                return res;
            })
            .enter().append('span')
            .classed('param', true);
        predicateParameters.append('label')
            .text((d,i)=>`Parameter ${i+1}: `);
        predicateParameters.each(function(p){
            let param = D3Select(this);
            if(p === 'waypoint'){
                let select = param.append('select');
                addOptionsToSelect(select, waypointData, w=>w.name, w=>`${w.name} (${w.alias})`);
            } else if(p === 'robot'){
                let select = param.append('select');
                addOptionsToSelect(select, robotData, r=>r.name);
            } else if(p === 'number'){
                param.append('input').attr('type', 'number').attr('min', 0).attr('max', 100).attr('value', 50);
            } else if(p === 'operator'){
                let select = param.append('select');
                addOptionsToSelect(select, ['=', '>', '<', '>=', '<='], o=>o);
            } else {
                let select = param.append('select');
                addOptionsToSelect(select, objectData.filter(o=>o.type==p)
                    .map(o=>{
                        let wp = o.position,
                            wpD = waypointData.filter(d=>d.name==wp)[0];
                        return {v: wpD.name, t:`${wpD.name} (${wpD.alias})`};
                    }), o=>o.v, o=>o.t);
            }
        });
    }

    createPreference.append('span')
        .classed('btn btn-suc add', true)
        .text('+')
        .on('click', addPreference);

    let prefId = Math.max(-1,...preferenceData.map(d=>d.id));
    
    function newPrefId(){
        return ++prefId;
    }

    function goalString(g){
        return g.map(d=>{
            if(typeof d === 'string') return d;
            else {
                return d.name+': '+d.params.join(', ');
            }
        }).join(' ');
    }

    function addPreference(){

        let type = preferenceTypeSelect.node().value;
        let weight = parseInt(preferenceWeight.select('input').node().value);
        let goals = [];
        preferenceGoals.each(function(p){
            if(p === 'number'){
                goals.push(D3Select(this).select('span.goalType').select('input').node().value);
            } else if(p === 'predicate') {
                let gName = D3Select(this).select('span.goalType').select('select').node().value;
                let gData = preferencePredicateData.filter(p=>p.name == gName)[0];
                let gParams = [];
                D3Select(this).selectAll('span.param').each(function(paramType){
                    if(paramType === 'number'){
                        gParams.push(D3Select(this).select('input').node().value);
                    }
                    else {
                        gParams.push(D3Select(this).select('select').node().value);
                    }
                });
                goals.push({name: gName, type: gData.type, params: gParams});
            }
        });

        if(preferenceData.map(d=>d.type+goalString(d.goals)).filter(d=>d==type+goalString(goals)).length == 0){
            let id = newPrefId();
            preferenceData.push({id, type, weight, goals});
            renderPreferences();
        }
    }

    function removePreference(id){
        for(let i=0; i<preferenceData.length; i++){
            if(preferenceData[i].id === id){
                preferenceData.splice(i,1);
            }
        }
        renderPreferences();
    }

    function renderPreferences(){

        let preferences = list.selectAll('div.preference')
            .data(preferenceData, d=>d.id);

        preferences.exit().remove();
        
        let enter = preferences.enter().append('div')
            .classed('preference', true);

        enter.append('span').classed('type', true)
            .html(d=>`${d.type} <span>(${d.weight} %)</span>`);
        enter.append('span').classed('goals', true)
            .selectAll('span.goal')
            .data(d=>d.goals)
            .enter().append('span').classed('goal', true)
            .text(d=>goalString([d]));
        enter.append('span').classed('rm btn btn-err', true)
            .text('-')
            .on('click', function(e,d){
                removePreference(d.id);
            });
    }

    renderPreferences();

    return plObj;
}