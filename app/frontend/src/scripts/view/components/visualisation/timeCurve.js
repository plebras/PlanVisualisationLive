import Canvas from './canvas';
import {colorArray, colors} from './colors';
import {getTextHeight} from './svgText';

import {select as D3Select} from 'd3-selection';
import {scaleLinear as D3ScaleLinear,
    scaleOrdinal as D3ScaleOrdinal,
    scalePoint as D3ScalePoint} from 'd3-scale';
import {extent as D3Extent,
    group as D3Group} from 'd3-array';
import {line as D3Line,
    curveCardinal as D3CurveCardinal} from 'd3-shape'; 
import {zoom as D3Zoom,
    zoomIdentity as D3ZoomIdentity} from 'd3-zoom';
import tippy from 'tippy.js';

import '../../../../styles/components/visualisation/timeCurve.less';

// export default function TimeCurve(domContainer, incWeights=false){
export default function TimeCurve(domContainer, states){

    let tcObj = {};

    tcObj.setSize = (w,h,p) => {
        width = w;
        height = h;
        padding = p;
        resetDimensions();
        update();
        return tcObj;
    };

    tcObj.loadData = d => {
        states = d;
        update();
        return tcObj;
    };

    tcObj.focusStates = function(ids){
        focusStates(ids);
        return tcObj;
    };

    tcObj.updateStates = (statesDataset, currentActions) => {
        focusStates(statesDataset.filter(s=>{return s.id != 'computed';}).map(s=>s.id));
        estimateStates(statesDataset.filter(s=>{return s.id == 'computed';}), currentActions);
        return tcObj;
    };

    tcObj.clickCallback = f => {
        clickCallback = f;
        update();
        return tcObj;
    };

    tcObj.mouseoverCallback = f => {
        mouseoverCallback = f;
        update();
        return tcObj;
    };

    tcObj.mouseoutCallback = f => {
        mouseoutCallback = f;
        update();
        return tcObj;
    };

    tcObj.highlightCurves = a => {
        highlightCurves(a);
        return tcObj;
    };

    tcObj.createActorScale = a => {
        actorColorScale.domain(a)
            .range(colorArray);
        update();
        return tcObj;
    };

    tcObj.setActorScale = s => {
        actorColorScale = s;
        update();
        return tcObj;
    };

    tcObj.getActorScale = () => {
        return actorColorScale;
    };

    let width = 1000,
        height = 500,
        padding = [10,10,10,10];
    let cvs = Canvas(width,height,padding);

    let maxStateSize = 6;
    let legendWidth = 0;

    // let states = [],
    // weightsData = [],
    let focusedStates = [];

    let svgTop = D3Select(domContainer).append('svg').classed('timeCurveSvg', true);
    let timeCurves = svgTop.append('g').classed('timeCurves', true);
    let legend = svgTop.append('g').classed('legend', true)
        .attr('transform', `translate(${cvs.l},${cvs.t})`);
    let curves = timeCurves.selectAll('path.timeCurve');
    let points = timeCurves.selectAll('g.state');
    let estimates = timeCurves.selectAll('g.estimate');

    let zoomLevel = 1;
    let zoom = D3Zoom()
        .scaleExtent([1,4])
        .on('zoom', ({transform})=>{
            let tx = transform.x + xDiff,
                ty = transform.y + yDiff,
                ra = angle,
                rx = cvs.c+legendWidth-xDiff,
                ry = cvs.m-yDiff,
                sk = transform.k;
            timeCurves.attr('transform', `translate(${tx},${ty})rotate(${ra} ${rx} ${ry})scale(${sk})`);
            zoomLevel = sk;
            resizeTimeCurves();
        });

    svgTop.call(zoom);

    let xScale = D3ScaleLinear(),
        yScale = D3ScaleLinear();
    let xDiff = 0, yDiff = 0;
    let xFlipped = false,yFlipped = false;
    let angle = 0;

    let actorColorScale = D3ScaleOrdinal();

    let lineGen = D3Line()
        .x(d=>{return xScale(d.projection.x);})
        .y(d=>{return yScale(d.projection.y);})
        .curve(D3CurveCardinal.tension(0.6));

    let stateTooltips = [];
    let estimateTooltips = [];

    let clickCallback = ()=>{};
    let mouseoverCallback = ()=>{};
    let mouseoutCallback = ()=>{};

    function update(){
        centerCurves([0,0]);
        svgTop.call(zoom.transform, D3ZoomIdentity);
        updateLegend();
        updateCurves();
        svgTop.call(zoom.transform, D3ZoomIdentity);
    }

    function updateCurves(){
        svgTop.call(zoom.transform, D3ZoomIdentity);
        updateScales();
        updateTimeCurves();
        updatePoints();
        centerCurves();
        svgTop.call(zoom.transform, D3ZoomIdentity);
    }

    function updateScales(){
        let xRange = D3Extent(states, d=>d.projection.x).reduce((a,b)=>Math.abs(a-b)),
            yRange = D3Extent(states, d=>d.projection.y).reduce((a,b)=>Math.abs(a-b));
        let scale = D3ScaleLinear();
        if(xRange/(cvs.iW-legendWidth) < yRange/cvs.iH){ // needs to fit in height
            scale.domain(D3Extent(states, d=>d.projection.y))
                .range([cvs.t, cvs.b]);
            
            xScale = scale.copy();
            yScale = scale.copy();
        } else { // needs to fit in width
            scale.domain(D3Extent(states, d=>d.projection.x))
                .range([cvs.l+legendWidth, cvs.r]);
            
            xScale = scale.copy();
            yScale = scale.copy();
        }
        if(xFlipped){
            let domain = xScale.domain();
            xScale.domain([domain[1],domain[0]]);
        }
        if(yFlipped){
            let domain = yScale.domain();
            yScale.domain([domain[1],domain[0]]);
        }
    }

    function updateTimeCurves(){
        let groupedData = D3Group(states, d=>d.actor);

        curves = timeCurves.selectAll('path.timeCurve')
            .data(groupedData, d=>d[0]);

        curves.enter().append('path')
            .classed('timeCurve', true);
        
        curves.exit().remove();

        curves = timeCurves.selectAll('path.timeCurve');

        curves.attr('d', d=>lineGen(d[1]))
            .style('stroke-width', `${2/zoomLevel}px`);
    }

    function stateSize(depth){
        let s = (6-depth*2)/zoomLevel;
        maxStateSize = Math.max(maxStateSize, s);
        return s;
    }

    function updatePoints(){
        stateTooltips.forEach(t=>t.destroy());

        points = timeCurves.selectAll('g.state');

        points = points.data(states, d=>d.id);

        let pointsEnter = points.enter().append('g')
            .classed('state', true);
        pointsEnter.append('circle');
        // pointsEnter.each(function(){Icon(D3Select(this),icon_object,'empty')});

        points.exit().remove();

        points = timeCurves.selectAll('g.state')
            .sort((a,b)=>a.depth-b.depth);

        points.on('mouseover', mouseoverCallback)
            .on('mouseout', mouseoutCallback)
            .on('click', clickCallback)
            .attr('transform',d=>`translate(${xScale(d.projection.x)},${yScale(d.projection.y)})`)
            .attr('data-tippy-content', d => d.description);

        points.select('circle')
            .attr('cx', 0).attr('cy', 0)
            .attr('r', d=>stateSize(d.depth))
            .style('fill', d=>actorColorScale(d.actor));

        stateTooltips = tippy(points.nodes(),{
            theme:'dark',
            duration: [500, 0]
        });

        // points.select('path')
        //     .attr('transform', d=>{
        //         let iconSize = stateSize(d.depth)*0.95;
        //         return `translate(${-iconSize/2},${-iconSize/2})`
        //     })
        //     .style('fill', colors.white)
        //     .attr('d',d=>{
        //         let iconSize = stateSize(d.depth)*0.95;
        //         // if(d.name == 'taken_valve_image'){
        //         //     return icon_object('camera')(iconSize,iconSize)
        //         // } else if (d.name == 'operated'){
        //         //     return icon_object('gear')(iconSize,iconSize)
        //         // }
        //         return icon_object('empty')(iconSize,iconSize)
        //     });
    }

    function updateLegend(){
        let legendScale = D3ScalePoint()
            .padding(2)
            .domain(actorColorScale.domain())
            .range([cvs.t,cvs.b]);
        
        let legendEl = legend.selectAll('g')
            .data(actorColorScale.domain().map(a=>{return {actor:a};}));

        let elEnter = legendEl.enter().append('g');
        elEnter.append('line');
        elEnter.append('circle');
        elEnter.append('text');

        legendEl.exit().remove();

        legendEl = legend.selectAll('g')
            .attr('transform', d=>`translate(0,${legendScale(d.actor)})`)
            .on('mouseover', mouseoverCallback)
            .on('mouseout', mouseoutCallback);

        legendEl.select('line')
            .attr('x1',0).attr('y1',0).attr('x2',40).attr('y2',0);
        
        legendEl.select('circle')
            .attr('cx',20).attr('cy',0).attr('r', 9)
            .style('fill',d=>actorColorScale(d.actor));

        legendEl.select('text')
            .text(d=>d.actor)
            .attr('transform', function(){
                return `translate(50,${getTextHeight(D3Select(this))/4})`;
            });

        legendWidth = legend.node().getBBox().width+30;
    }

    function focusStates(ids){
        focusedStates = ids;

        points.select('circle')
            .attr('r', d => ids.indexOf(d.id) > -1 ? (maxStateSize+d.depth)/zoomLevel : stateSize(d.depth))
            .classed('highlight', d => ids.indexOf(d.id) > -1)
            .style('stroke', d => ids.indexOf(d.id) > -1 ? actorColorScale(d.actor) : 'none')
            .style('stroke-width', d=> ids.indexOf(d.id) > -1 ? 3/zoomLevel : 0)
            .style('fill', d => ids.indexOf(d.id) > -1 ? colors.white : actorColorScale(d.actor));

        // points.select('path')
        //     .attr('transform', d=>{
        //         let iconSize = ids.indexOf(d.stateID) > -1 ? (maxStateSize+d.depth)*0.95 : stateSize(d.depth)*0.95;
        //         return `translate(${-iconSize/2},${-iconSize/2})`
        //     })
        //     .style('fill', d => ids.indexOf(d.stateID) > -1 ? actorColorScale(d.actor) : colors.white)
        //     .attr('d',d=>{
        //         let iconSize = ids.indexOf(d.stateID) > -1 ? (maxStateSize+d.depth)*0.95/zoomLevel : stateSize(d.depth)*0.95;
        //         if(d.name == 'inspected'){
        //             return icon_object('camera')(iconSize,iconSize)
        //         } else if (d.name == 'operated'){
        //             return icon_object('gear')(iconSize,iconSize)
        //         }
        //         return icon_object('empty')(iconSize,iconSize)
        //     });
    }

    function estimateStates(estimateStates, currentActions){
        
        estimateTooltips.forEach(t=>t.destroy());

        estimates = timeCurves.selectAll('g.estimate').data(estimateStates, d=>d.actor);
        let enter = estimates.enter().append('g')
            .classed('estimate', true)
            .attr('transform',d=>`translate(${xScale(d.projection.x)},${yScale(d.projection.y)})`);
        enter.append('polygon')
            .attr('points', `0,${-maxStateSize/zoomLevel} ${maxStateSize/zoomLevel},0 0,${maxStateSize/zoomLevel} ${-maxStateSize/zoomLevel},0`)
            .style('fill', d=>actorColorScale(d.actor));
        estimates.exit().remove();
        estimates.attr('transform',d=>`translate(${xScale(d.projection.x)},${yScale(d.projection.y)})`)
            .on('mouseover', mouseoverCallback)
            .on('mouseout', mouseoutCallback)
            .attr('data-tippy-content', d => {
                let a = currentActions.filter(act=>act.actor === d.actor);
                if(a.length > 0) return a[0].description;
                else return d.description;
            });

        estimateTooltips = tippy(estimates.nodes(),{
            theme:'dark',
            duration: [500, 0]
        });
    }

    function resizeTimeCurves(){
        curves.style('stroke-width', ()=>{return `${2/zoomLevel}px`;});
        points.select('circle')
            .attr('r', d=>focusedStates.indexOf(d.id) > -1 ? (maxStateSize+d.depth)/zoomLevel : stateSize(d.depth))
            .style('stroke-width', d=>focusedStates.indexOf(d.id) > -1 ? 3/zoomLevel : 0);
        estimates.select('polygon').attr('points', `0,${-maxStateSize/zoomLevel} ${maxStateSize/zoomLevel},0 0,${maxStateSize/zoomLevel} ${-maxStateSize/zoomLevel},0`);
    }

    function highlightCurves(actors){
        if(actors.length > 0){
            curves.filter(([key,])=>{return actors.indexOf(key)<0;})
                .classed('faded', true);
            points.filter(d=>{return actors.indexOf(d.actor)<0;})
                .classed('faded', true);
            estimates.filter(d=>{return actors.indexOf(d.actor)<0;})
                .classed('faded', true);
        } else {
            curves.classed('faded', false);
            points.classed('faded', false);
            estimates.classed('faded', false);
        }
    }

    function centerCurves(values){
        if(typeof values == 'undefined'){
            let curvesBBox = timeCurves.node().getBBox();
            xDiff = cvs.c+legendWidth-curvesBBox.x-curvesBBox.width/2;
            yDiff = cvs.m-curvesBBox.y-curvesBBox.height/2;
        } else{
            xDiff = values[0];
            yDiff = values[1];
        }
    }

    function resetDimensions(){
        cvs = Canvas(width, height, padding);
        svgTop.attr('width', width)
            .attr('height', height);
        legend.attr('transform', `translate(${cvs.l},${cvs.t})`);
    }

    update();

    return tcObj;
}