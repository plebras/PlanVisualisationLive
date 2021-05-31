import {select as D3Select} from 'd3-selection';

import '../../../../styles/components/visualisation/timeCurveWeights.less';

export default function TimeCurveWeights(domContainer){

    let tcwObj = {};

    tcwObj.loadData = d=>{
        weightsData = d;
        renderWeights();
        updateCallback();
        return tcwObj;
    };

    tcwObj.setCallback = f=>{
        weightsCallback = f;
        updateCallback();
        return tcwObj;
    };

    let weightsData = [];

    let weightsInputDiv = D3Select(domContainer)
        .append('div').attr('id', 'tcWeightsSliders');
    weightsInputDiv.append('h4').html('Dimensions\' Weights');

    let weightsCallback = ()=>{};

    function renderWeights(){
        let inputSpans = weightsInputDiv.selectAll('span.weightInput')
            .data(weightsData);
        let enterSpans = inputSpans.enter().append('span')
            .classed('weightInput', true);
        enterSpans.append('span').classed('label', true);
        enterSpans.append('input');
        enterSpans.append('span').classed('value', true);
        inputSpans.exit().remove();
        inputSpans = inputSpans.merge(enterSpans); // = weightsInputDiv.selectAll('span.weightInput')
        inputSpans.select('span.label')
            .html(d=>{return d.name[0].toUpperCase()+d.name.slice(1);});
        inputSpans.select('input')
            .attr('type', 'range')
            .attr('min', d=>d.lower)
            .attr('max', d=>d.upper)
            .attr('step', d=>d.step)
            .attr('value', d=>d.value)
            .each(function(d){
                D3Select(this).node().value = d.value;
            });
        inputSpans.select('span.value')
            .html(d=>d.value);
    }

    function valueUpdate(e, d){
        let v = parseFloat(this.value);
        d.value = v;
        weightsInputDiv.selectAll('span.weightInput').select('span.value').html(d=>d.value);
        let returnWeightsData = {};
        for(let entry of weightsData){
            returnWeightsData[entry.name] = entry.value;
        }
        weightsCallback(returnWeightsData);
    }

    function updateCallback(){
        weightsInputDiv.selectAll('span.weightInput')
            .select('input')
            .on('change', valueUpdate);
    }

    return tcwObj;
}