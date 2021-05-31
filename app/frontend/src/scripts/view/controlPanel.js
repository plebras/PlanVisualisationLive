import {select as D3Select} from 'd3-selection';

import '../../styles/page/controlPanel.less';

export default function ControlPanel(domContainer, callbacks){
    
    let cpObj = {};

    cpObj.stage0 = ()=>{
        stage0.classed('disabled', false);
        stage1.classed('disabled', true);
        stage2.classed('disabled', true);
        return cpObj;
    };

    cpObj.stage1 = ()=>{
        stage0.classed('disabled', true);
        stage1.classed('disabled', false);
        stage2.classed('disabled', true);
        return cpObj;
    };

    cpObj.stage2 = ()=>{
        stage0.classed('disabled', true);
        stage1.classed('disabled', true);
        stage2.classed('disabled', false);
        return cpObj;
    };

    let sidebar = D3Select(domContainer).append('div')
        .classed('controlPanel', true);

    let newSection = ()=>{
        return sidebar.append('div').classed('section', true);
    };

    let nostage = newSection();
    let stage0 = newSection();
    let stage1 = newSection();
    let stage2 = newSection();

    nostage.append('div').classed('btn btn-err', true)
        .text('Close Application')
        .on('click', callbacks['close']);

    stage0.append('div').classed('btn', true)
        .text('Load Domain')
        .on('click', callbacks['ldDom']);

    stage1.append('div')
        .text('1. Define Problem');
    
    stage1.append('div').classed('btn', true)
        .text('Save Problem')
        .on('click', callbacks['savePb']);
    
    stage1.append('div').classed('btn btn-war', true)
        .text('Reset Problem')
        .on('click', callbacks['resetPb']);
    
    stage1.append('div').classed('btn', true)
        .text('Generate Plan')
        .on('click', callbacks['genPlan']);
    
    stage2.append('div').classed('btn', true)
        .text('Redefine Problem')
        .on('click', callbacks['redefPb']);

    stage2.append('div')
        .text('2. Review Plan');
    
    stage2.append('div').classed('btn', true)
        .text('Execute Plan')
        .on('click', callbacks['execPlan']);

    return cpObj;
}