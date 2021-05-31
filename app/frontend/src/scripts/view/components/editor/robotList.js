import {select as D3Select} from 'd3-selection';

import '../../../../styles/components/editor/robotList.less';

export default function RobotList(domContainer, robotData, waypointData){

    let rlObj = {};

    D3Select(domContainer).append('h3')
        .text('List of Robots');
    
    let list = D3Select(domContainer).append('div')
        .classed('list robotList', true);

    let robots = list.selectAll('div.robot')
        .data(robotData, d=>d.id);

    function createRobot(r){
        let rob = D3Select(this);
        
        rob.classed('disabled', !r.available);

        rob.append('span')
            .classed('name', true)
            .text(r.name);

        rob.append('span')
            .classed('type', true)
            .text(`(${r.type})`);

        let use = rob.append('span')
            .classed('use', true);
        use.append('label')
            .attr('for', 'use')
            .text('Use in plan: ');
        use.append('input')
            .attr('type', 'checkbox')
            .attr('name', 'use')
            .property('checked', r.available)
            .on('change', ()=>{
                r.available = !r.available;
                rob.classed('disabled', !r.available);
            });

        let start = rob.append('span')
            .classed('start', true);
        start.append('label')
            .attr('for', 'start')
            .text('Start from: ');
        let startSelect = start.append('select')
            .attr('name', 'start');
        startSelect.selectAll('option')
            .data(waypointData.filter(w=>w.type==r.type))
            .enter().append('option')
            .attr('value', w=>w.name)
            .text(w=>`${w.name} (${w.alias})`)
            .property('selected', w=>w.name==r.position);
        startSelect.on('change', function(){
            r.position = this.value;
        });

        let fuel = rob.append('span')
            .classed('fuel', true);
        fuel.append('label')
            .attr('for', 'fuel')
            .text('Energy: ');
        fuel.append('input')
            .attr('type', 'number')
            .attr('min', '0')
            .attr('max', '100')
            .attr('value', r.energy)
            .on('change', function(){
                r.energy = parseInt(this.value);
            });
        // ... 
    }

    robots.enter().append('div')
        .classed('robot', true)
        .each(createRobot);

    // robots = list.selectAll('div.robot');

    // robots.each(renderRobot);

    return rlObj;

}