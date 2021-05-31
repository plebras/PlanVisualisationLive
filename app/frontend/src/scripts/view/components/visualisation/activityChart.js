import Canvas from './canvas';
// import {colors} from './colors';
import {getMaxTextWidth,getTextHeight} from './svgText';

import {select as D3Select} from 'd3-selection';
import {scaleLinear as D3ScaleLinear,
    scaleBand as D3ScaleBand,
    scaleOrdinal as D3ScaleOrdinal} from 'd3-scale';
import {transition as D3Transition} from 'd3-transition';
import {min as D3Min,
    max as D3Max,
    range as D3Range} from 'd3-array';
import {zoom as D3Zoom} from 'd3-zoom';
import {line as D3Line,
    curveStep as D3CurveStep} from 'd3-shape';
import {format as D3Format} from 'd3-format';
import tippy from 'tippy.js';

import '../../../../styles/components/visualisation/activityChart.less';

export default function ActivityChart(domContainer, actions, actors, dependencies){

    let acObj = {};

    acObj.setSize = function(w,h,p){
        width = w;
        height = h;
        padding = [p[0]+15,p[1]+15,p[2],p[3]];
        resetDimensions(true);
        updateActivityChart();
        return acObj;
    };

    acObj.displayTexts = function(s){ // 'all | 'active' | 'none'
        displayTexts = s;
        resetDimensions(true);
        updateActivityChart();
        return acObj;
    };

    acObj.updateActionsDataset = function(data){
        actions = data;
        resetDimensions(false);
        updateActivityChart();
        return acObj;
    };

    acObj.clickCallback = function(f){
        activitybarsClick = f;
        updateActivityChart();
        return acObj;
    };

    acObj.mouseoverCallback = function(f){
        activitybarsMouseover = f;
        updateActivityChart();
        return acObj;
    };

    acObj.mouseoutCallback = function(f){
        activitybarsMouseout = f;
        updateActivityChart();
        return acObj;
    };

    acObj.highlightBars = function(a){
        highlightBars(a);
        return acObj;
    };

    acObj.panCallback = function(f){
        panCallback = f;
        resetPan();
        return acObj;
    };

    acObj.setCurrentActions = function(a){
        currentActions = a;
        renderTexts();
        return acObj;
    };

    acObj.setTime = function(t){
        activityPan.translateBy(svgEl, xScale(currentTimeValue-t), canvas.top);
        // timeLegend.text(`Time: ${timeFormat(t)}`)
        return acObj;
    };

    acObj.getTime = function(){
        return currentTimeValue;
    };

    acObj.setActorColorScale = function(s){
        actorColorScale = s;
        updateActivityChart();
        return acObj;
    };

    acObj.setActorColorScaleDomain = function(d){
        actorColorScale.domain(d);
        updateActivityChart();
        return acObj;
    };

    acObj.getActorColorScale = function(){
        return actorColorScale;
    };

    // dimensions
    let width = 1000,
        height = 500,
        padding = [35,15,10,10];
    let canvas = Canvas(width, height, padding);
    let actionUnitSpan = 2;
    let maxTextWidth = 0;
    let activityLength = 0;
    let totalLength = 0;
    let maxActorWidth = 0;
    let timeMarkerDistance = 300;
    let timeFormat = D3Format('.3f');

    // data
    // let actions = [];
    // let actors = [];
    // let dependencies = [];
    let currentActions = [];

    // controls
    let displayTexts = 'active';
    // let hasData = false;
    let currentTimeValue = 0;

    // interactivity
    let panLeft = canvas.left+timeMarkerDistance;
    let panRight = activityLength+canvas.innerWidth;
    let activityPan = D3Zoom()
        .scaleExtent([1,1])
        .translateExtent([[-canvas.left,0],[totalLength+padding[3],canvas.innerHeight]])
        .on('start', ()=>{svg.style('cursor', 'all-scroll');})
        .on('zoom', ({transform})=>{
            svg.attr('transform', `translate(${transform.x},${canvas.top})`);})
        .on('end', ()=>{svg.style('cursor', 'initial');});

    let actionTooltips = [];

    const tDuration = 500;
    const tActivity = ()=>D3Transition().duration(tDuration);

    let activitybarsClick = ()=>{};
    let activitybarsMouseover = ()=>{};
    let activitybarsMouseout = ()=>{};
    let panCallback = ()=>{};

    // elements
    // D3Select(domContainer).append('h3').html('Activity Chart');
    let svgEl = D3Select(domContainer).append('svg').classed('activitychart',true);
    svgEl.call(activityPan);

    let svg = svgEl.append('g').classed('activity',true);

    let activityBackgd = svg.append('rect').classed('background',true);
    let activityBackgdLines = svg.append('g').classed('backgroundLines',true);
    let bars = svg.selectAll('g.activitybars');

    let actorsColumn = svgEl.append('g').classed('actorsColumn', true);
    let actorsColumnBackgd = actorsColumn.append('rect').classed('background', true);

    let timeMarker = svgEl.append('g').classed('timeMark', true);
    timeMarker.append('line');
    timeMarker.append('polygon').classed('upperMark',true);
    timeMarker.append('polygon').classed('lowerMark',true);
    let timeLegend = timeMarker.append('text').classed('timeLegend', true).text(`Time: ${timeFormat(0)}`);

    let xScale = D3ScaleLinear(),
        yScale = D3ScaleBand();
    let actorColorScale = D3ScaleOrdinal();

    let updateActivityChart = function(){
        updateScales();
        gupActorsColumn();
        gupTimeLines();
        gupActorLines();
        gupActivityBars();
        gupDependencies();
        updateCurrentActions();
    };

    let updateScales = function(){
        xScale.domain([D3Min(actions,d=>d.start),D3Max(actions,d=>d.end)])
            .range([0, Math.max(actionUnitSpan*D3Max(actions,d=>d.end), canvas.innerWidth)]);
        yScale.domain(D3Range(actions.length))
            .range([0, canvas.innerHeight]);
    };

    let gupActorsColumn = function(){

        let actorTexts = actorsColumn.selectAll('text').data(actors);

        actorTexts.enter().append('text');
        actorTexts.exit().remove();

        actorTexts = actorsColumn.selectAll('text');

        let actorsIndices = [0].concat(actors.map(a=>actions.map(d=>d.actor).lastIndexOf(a)).sort((a,b)=>a-b));
        let actorsVertical = [];
        for(let i=0; i<actors.length; i++){
            let t = yScale(actorsIndices[i]),
                b = yScale(actorsIndices[i+1])+yScale.bandwidth();
            actorsVertical.push(t+(b-t)/2);
        }

        actorTexts.text(d=>d)
            .style('text-anchor', 'end')
            .attr('transform', (d,i)=>`translate(${maxActorWidth-5},${actorsVertical[i]})`)
            .attr('dy', function(){
                return getTextHeight(D3Select(this))/2;
            });

        let actorLines = actorsColumn.selectAll('line').data(actorsIndices);
        
        actorLines.enter().append('line');
        actorLines.exit().remove();

        actorLines = actorsColumn.selectAll('line');

        actorLines.attr('x1', 0)
            .attr('x2', maxActorWidth)
            .attr('y1', (d,i) => i > 0 ? yScale(d)+yScale.bandwidth() : yScale(d))
            .attr('y2', (d,i) => i > 0 ? yScale(d)+yScale.bandwidth() : yScale(d));
    };

    let gupActivityBars = function(){

        actionTooltips.forEach(t=>t.destroy());

        bars = svg.selectAll('g.activitybars').data(actions,d=>d.id);

        let barsEnter = bars.enter().append('g')
            .classed('activitybars', true)
            .attr('transform', (d,i)=>{return `translate(${xScale(d.start)},${yScale(i)})`;})
            .style('opacity', 0);

        barsEnter.append('rect');
        barsEnter.append('text');
        // barsEnter.each(function(){Icon(D3Select(this),icon_object,'empty')});
        
        bars.exit()
            .classed('activitybars',false)
            .transition(tActivity())
            .style('opacity',0)
            .remove();

        bars = svg.selectAll('g.activitybars');

        bars.on('click',activitybarsClick)
            .on('mouseover', activitybarsMouseover)
            .on('mouseout', activitybarsMouseout)
            .attr('data-tippy-content', d => d.description)
            .transition(tActivity())
            .attr('transform', (d,i)=>{return `translate(${xScale(d.start)},${yScale(i)})`;})
            .style('opacity', 1);

        actionTooltips = tippy(bars.nodes(),{
            theme:'dark',
            duration: [500, 0]
        });

        bars.select('rect')
            .attr('width', d=>xScale(d.duration))
            .attr('height', yScale.bandwidth())
            .style('fill', d=>actorColorScale(d.actor))
            .attr('rx', 2)
            .attr('ry', 2);

        bars.select('rect')
            .classed('hasChildren',d=>{
                return typeof d.children !== 'undefined' && d.children.length > 0;
            })
            .classed('unfolded',d=>d.unfolded);

        bars.select('text')
            .text(d=>d.description)
            .attr('dx', d=>xScale(d.duration)+5)
            .attr('dy', yScale.bandwidth()/2);

        // let iconSize = yScale.bandwidth()*0.95;
        // bars.select('path')
        //     .attr('transform', d=>`translate(${(xScale(d.duration)-iconSize)/2},${(yScale.bandwidth()-iconSize)/2})`)
        //     .style('fill', colors.white)
        //     .attr('d',d=>{
        //         if(d.name == 'inspect'){
        //             return icon_object('camera')(iconSize,iconSize)
        //         } else if (d.name == 'operate'){
        //             return icon_object('gear')(iconSize,iconSize)
        //         }
        //         return icon_object('empty')(iconSize,iconSize)
        //     });

        renderTexts();
    };

    let renderTexts = function(){
        if(displayTexts == 'none'){
            bars.select('text').classed('hidden', true);
        } else if(displayTexts == 'all'){
            bars.select('text').classed('hidden', false);
        } else {
            showCurrentActionsText();
        }
    };

    let showCurrentActionsText = function(){
        bars.select('text').classed('hidden', true);
        let actions = bars.filter(d => currentActions.indexOf(d.id) > -1);
        actions.select('text').classed('hidden', false);
    };

    let highlightBars = function(a){
        if(a.length > 0){
            bars.filter(d=>{return a.indexOf(d.actor) < 0;})
                .classed('faded', true);
        } else {
            bars.classed('faded', false);
        }
        
    };

    let gupDependencies = function(){

        let dependencyData = dependencies.map(d=>{
            let s_t, s_i, e_t, e_i;
            actions.forEach((a,i)=>{
                if(a.id == d[0]){
                    // s = a;
                    s_t = a.start + a.duration/2;
                    s_i = i;
                }else if(a.id == d[1]){
                    // e = a;
                    e_t = a.start + a.duration/2;
                    e_i = i;
                }
            });
            return [[s_t,s_i],[e_t,e_i]];
        });

        let lineGen = D3Line()
            .x(d=>{return xScale(d[0]);})
            .y(d=>{return yScale(d[1])+yScale.bandwidth()/2;})
            .curve(D3CurveStep);

        let dependenciesLines = svg.selectAll('g.dependenciesLine').data(dependencyData);

        let dependenciesLinesEnter = dependenciesLines.enter().append('g')
            .classed('dependenciesLine', true);

        dependenciesLinesEnter.append('path');
        dependenciesLinesEnter.append('circle').classed('startPoint', true);
        dependenciesLinesEnter.append('circle').classed('endPoint', true);
        
        dependenciesLines.exit().remove();

        dependenciesLines = svg.selectAll('g.dependenciesLine');

        dependenciesLines.select('path').transition(tActivity())
            .attr('d',lineGen);
        dependenciesLines.select('circle.startPoint').transition(tActivity())
            .attr('cx',d=>xScale(d[0][0]))
            .attr('cy', d=>yScale(d[0][1])+yScale.bandwidth()/2)
            .attr('r', 6);
        dependenciesLines.select('circle.endPoint').transition(tActivity())
            .attr('cx',d=>xScale(d[1][0]))
            .attr('cy', d=>yScale(d[1][1])+yScale.bandwidth()/2)
            .attr('r', 6);
    };

    let gupTimeLines = function(){
        // let linesData = D3Range(-timeMarkerDistance, Math.floor((D3Max(actions,d=>d.end)+1)+maxTextWidth/actionUnitSpan+1));

        let linesData = D3Range(0, xScale.invert(totalLength-timeMarkerDistance));

        let timeLines = activityBackgdLines.selectAll('line.timelines').data(linesData.filter((d,i)=>{return i%10 == 0;}));

        timeLines.enter().append('line')
            .classed('timelines', true);
        
        timeLines.exit().remove();

        timeLines = activityBackgdLines.selectAll('line.timelines');

        timeLines.attr('x1', d=>xScale(d))
            .attr('x2', d=>xScale(d))
            .attr('y1', 0)
            .attr('y2', canvas.innerHeight)
            .classed('mark', (d,i)=>{return i%5 == 0;});

    };

    let gupActorLines = function(){
        
        let actorsLastIndices = actors.map(a=>actions.map(d=>d.actor).lastIndexOf(a)).sort((a,b)=>a-b);
        actorsLastIndices.unshift(0);

        let actorLines = activityBackgdLines.selectAll('line.actorlines').data(actorsLastIndices);

        actorLines.enter().append('line')
            .classed('actorlines', true);

        actorLines.exit()
            .classed('actorlines', false)
            .remove();

        actorLines = activityBackgdLines.selectAll('line.actorlines');

        actorLines.attr('x1', -timeMarkerDistance)
            .attr('x2', totalLength-timeMarkerDistance)
            .attr('y1', (d,i) => i > 0 ? yScale(d)+yScale(1) : yScale(d))
            .attr('y2', (d,i) => i > 0 ? yScale(d)+yScale(1) : yScale(d));
    };

    let resetDimensions = function(pan){
        canvas = Canvas(width, height, padding);

        svgEl.attr('width', width)
            .attr('height', height);

        // leftArrow.translate(left-40, (height-leftArrow.getHeight())/2);
        // rightArrow.translate(right-rightArrow.getWidth()+40, (height-leftArrow.getHeight())/2);

        // if(hasData){
        maxTextWidth = getMaxTextWidth(actions.map(d=>d.description), svg);
        activityLength = Math.max(actionUnitSpan*(D3Max(actions,d=>d.end)+1), canvas.innerWidth);
        maxActorWidth = getMaxTextWidth(actors, svg)+canvas.left;
        timeMarkerDistance = Math.max(timeMarkerDistance, maxActorWidth);

        totalLength = displayTexts == 'none' ? activityLength+timeMarkerDistance : activityLength+maxTextWidth+timeMarkerDistance;
        // }

        actorsColumn.attr('transform',`translate(${0},${canvas.top})`);
        actorsColumnBackgd.attr('width', maxActorWidth).attr('height',canvas.innerHeight);

        panLeft = canvas.left+timeMarkerDistance;
        panRight = activityLength+canvas.innerWidth;

        if(pan) resetPan();

    };

    let updateCurrentActions = function(time){
        currentActions = actions.filter(a=>a.start<=time)
            .filter(a=>a.end>time)
            .map(a=>a.id);
        renderTexts();
    };

    let resetPan = function(){
        svg.attr('transform',`translate(${panLeft},${canvas.top})`);
        activityBackgd.attr('width', totalLength).attr('height',canvas.innerHeight);
        activityPan.translateExtent([[0,0],[panRight,canvas.innerHeight]])
            .on('zoom', ({transform,sourceEvent})=>{
                svg.attr('transform', `translate(${panLeft+transform.x},${canvas.top})`);
                currentTimeValue = xScale.invert(-transform.x);
                updateCurrentActions(currentTimeValue);
                timeLegend.text(`Time: ${timeFormat(currentTimeValue)}`);
                if (currentTimeValue >= 0 && sourceEvent){
                    panCallback(currentTimeValue);
                } else if(currentTimeValue < 0) {
                    acObj.setCurrentActions([]);
                }
            });

        timeMarker.attr('transform',`translate(${panLeft},${canvas.top})`);
        timeMarker.select('line')
            .attr('x1', 0).attr('x2', 0).attr('y1', 0)
            .attr('y2', canvas.innerHeight);
        timeMarker.select('polygon.upperMark')
            .attr('points', '-12,-15 12,-15 0,0');
        timeMarker.select('polygon.lowerMark')
            .attr('points', `-12,${canvas.innerHeight+15} 12,${canvas.innerHeight+15} 0,${canvas.innerHeight}`);
        timeLegend.attr('dy','-20px');
    };

    resetDimensions(true);
    updateActivityChart();

    return acObj;
}