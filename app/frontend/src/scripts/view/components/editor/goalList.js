import {select as D3Select} from 'd3-selection';

import '../../../../styles/components/editor/goalList.less';

export default function GoalList(domContainer, goalTypeData, goalData, waypointData, objectData, rel_waypoints, robotData){

    let glObj = {};

    D3Select(domContainer).append('h3')
        .text('List of Goals');
    
    let list = D3Select(domContainer).append('div')
        .classed('list goalList', true);

    let createGoal = list.append('div')
        .classed('createGoal', true);
    
    let goalType = createGoal.append('span')
        .classed('type', true);
    goalType.append('label')
        // .attr('for', 'goalType')
        .text('Goal: ');
    let goalTypeSelect = goalType.append('select');
    // .attr('name', 'goalType');
    goalTypeSelect.selectAll('option')
        .data(goalTypeData)
        .enter().append('option')
        .attr('value', t=>t.name)
        .text(t=>t.name)
        .property('selected', (d,i)=>i==0);
    goalTypeSelect.on('change', function(){
        let d = goalTypeData.filter(g=>g.name == this.value)[0];
        makeGoalParams(d);
    });
    let goalParams = createGoal.append('div')
        .classed('params', true);
    let goalParameters;
    makeGoalParams(goalTypeData[0]);

    function makeGoalParams(d){
        goalParams.selectAll('span.param').remove();

        goalParameters = goalParams.selectAll('span.param')
            .data(d.parameters)
            .enter().append('span')
            .classed('param', true);

        goalParameters.append('label')
            // .attr('for', (d,i)=>`goalParam${i}`)
            .text((d,i)=>`Parameter ${i+1}: `);
        let select = goalParameters.append('select');
        // .attr('name', (d,i)=>`goalParam${i}`);
        select.selectAll('option')
            .data(d=>{
                if(d == 'waypoint'){
                    return waypointData.map(w=>{
                        return {v: w.name, t:`${w.name} (${w.alias})`};
                    });
                } else if(d == 'robot'){
                    return robotData.map(r=>{
                        return {v: r.name, t:r.name};
                    });
                } else {
                    let objWp = objectData.filter(o=>o.type==d)
                        .map(o=>{
                            let wp = o.position,
                                wpD = waypointData.filter(d=>d.name==wp)[0];
                            return {v: wpD.name, t:`${wpD.name} (${wpD.alias})`};
                        });
                    let relWp = [];
                    for(const wp of objWp){
                        for(const rWp of rel_waypoints){
                            const i = rWp.indexOf(wp.v);
                            if(i === 0){
                                const wpD = waypointData.filter(d=>d.name==rWp[1])[0];
                                relWp.push({v: rWp[1], t:`${wpD.name} (${wpD.alias})`});
                            }
                            if(i === 1){
                                const wpD = waypointData.filter(d=>d.name==rWp[0])[0];
                                relWp.push({v: rWp[0], t:`${wpD.name} (${wpD.alias})`});
                            }
                        }
                    }
                    return objWp.concat(relWp);
                }
            })
            .enter().append('option')
            .attr('value', d=>d.v)
            .text(d=>d.t)
            .property('selected', (d,i)=>i==0);
    }

    createGoal.append('span')
        .classed('btn btn-suc add', true)
        .text('+')
        .on('click', addGoal);

    let goalId = Math.max(-1,...goalData.map(d=>d.id));

    function newGoalId(){
        return goalId++;
    }

    function addGoal(){
        let name = goalTypeSelect.node().value;
        let parameters = [];
        goalParameters.select('select').each(function(){
            parameters.push(this.value);
        });
        if(goalData.map(d=>d.name+d.parameters.join('')).filter(d=>d==name+parameters.join('')).length == 0){
            let id = newGoalId();
            goalData.push({id, name, parameters});
            renderGoals();
        }
    }

    function removeGoal(id){
        for(let i=0; i<goalData.length; i++){
            if(goalData[i].id === id){
                goalData.splice(i,1);
            }
        }
        renderGoals();
    }

    function renderGoals(){

        let goals = list.selectAll('div.goal')
            .data(goalData, d=>d.id);

        goals.exit().remove();
        
        let enter = goals.enter().append('div')
            .classed('goal', true);

        enter.append('span').classed('type', true)
            .text(d=>d.name);
        enter.append('span').classed('params', true)
            .text(d=>d.parameters.join(', '));
        enter.append('span').classed('rm btn btn-err', true)
            .text('-')
            .on('click', function(e,d){
                removeGoal(d.id);
            });
    }

    renderGoals();

    return glObj;

}