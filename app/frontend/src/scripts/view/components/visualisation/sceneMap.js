import Canvas from './canvas';

import {select as D3Select} from 'd3-selection';
import {scaleLinear as D3ScaleLinear,
    scaleOrdinal as D3ScaleOrdinal} from 'd3-scale';
import {axisLeft as D3AxisLeft,
    axisRight as D3AxisRight,
    axisTop as D3AxisTop} from 'd3-axis';
// import {transition as D3Transition} from 'd3-transition';
// import {Icon, icon_object} from './utils/icons';
// import {colorArray, colors} from './utils/colors'
// import D3Tip from 'd3-tip';
import has from 'lodash-es/has';
import tippy from 'tippy.js';

import '../../../../styles/components/visualisation/sceneMap.less';

export default function SceneMap(domContainer, sceneDimensions, sceneImageUrl){

    let smObj = {};

    smObj.setSize = function(w,h,p){
        width = w;
        height = h;
        padding = p;
        resetDimensions();
        draw();
        return smObj;
    };

    smObj.setActorColorScale = function(s){
        actorColorScale = s;
        drawActors();
        return smObj;
    };

    // smObj.loadSceneDimensions = function(dimensions){
    //     sceneDimensions = dimensions;
    //     draw();
    //     return smObj;
    // }

    // smObj.loadSceneData = function(env){
    //     useImage = false;
    //     makeEnvironmentData(env);
    //     // sceneDimensions = dm.getDimensions();
    //     // voidsData = dm.getVoids();
    //     // blocksData = dm.getBlocks();
    //     // machinesData = dm.getMachines();
    //     // wallsData = dm.getWalls();
    //     draw();
    //     return smObj;
    // }

    // smObj.loadSceneImage = function(url){
    //     useImage = true;
    //     sceneImageUrl = url;
    //     draw();
    //     return smObj;
    // }

    // smObj.drawActors = function(states){
    //     actorStates = states;
    //     drawActors();
    //     return smObj;
    // }

    // smObj.setCurrentActions = function(d){
    //     currentActions = d;
    //     drawActors();
    //     return smObj;
    // }

    smObj.updateActors = function(states, actions){
        actorStates = states;
        currentActions = actions;
        drawActors();
        return smObj;
    };

    smObj.mouseoverCallback = function(f){
        mouseoverCallback = f;
        drawActors();
        return smObj;
    };

    smObj.mouseoutCallback = function(f){
        mouseoutCallback = f;
        drawActors();
        return smObj;
    };

    smObj.highlightActors = function(a){
        highlightActors(a);
        return smObj;
    };

    // smObj.init = function(){
    //     D3Select(domContainer).append('h2').html('Scene Map');
    //     svgTop = D3Select(domContainer).append('svg').classed('sceneMap', true);
    //     map = svgTop.append('g').classed('map', true);
    //     altitude = svgTop.append('g').classed('altitude', true);
    //     mapLegend = map.append('text').classed('legend', true)
    //         .attr('transform', `translate(${mapGroupWidth/2}, ${textHeight-5})`)
    //         .attr('text-anchor', 'middle');
    //     altitudeLegend = altitude.append('text').classed('legend', true)
    //     .attr('transform', `translate(${altitudeGroupWidth/2}, ${textHeight-5})`)
    //     .attr('text-anchor', 'middle');
    //     mapActors = map.selectAll('g.actor');
    //     altitudeActors = altitude.selectAll('g.actor');
    //     mapBackground = map.append('g').classed('back', true);
    //     mapBackground.append('rect');
    //     mapBackground.append('image');
    //     mapXAxisG = map.append('g')
    //         .classed('mapXAxis', true)
    //         .attr('transform', `translate(0,${textHeight+axesWidth})`);
    //     mapYAxisG = map.append('g')
    //         .classed('mapYAxis', true)
    //         .attr('transform', `translate(${mapGroupWidth-axesWidth},0)`);
    //     altitudeAxisG = altitude.append('g')
    //         .classed('altitudeAxis', true)
    //         .attr('transform', `translate(${axesWidth},0)`);
    //     INIT = true;
    //     resetDimensions();
    //     return smObj;
    // }

    // smObj.delete = function(){
    //     if(INIT){
    //         D3Select(domContainer).select('h2').remove();
    //         svgTop.remove();
    //         INIT = false;
    //     }
    //     return smObj;
    // }

    // viz dimensions
    let width = 1000,
        height = 800,
        padding = [10,10,10,10],
        canvas = Canvas(width, height, padding);
    let altitudeGroupWidth = 100;
    let mapGroupWidth = canvas.innerWidth-altitudeGroupWidth;
    let axesWidth = 30;
    let textHeight = 20;
    let actorRadius = 5;
    let altActorSpace = 10;

    let useImage = true;
    let envData = {};
    // scene image url
    // let sceneImageUrl = '';

    // plan data
    let actorStates = [],
        currentActions = [];

    let svgTop = D3Select(domContainer).append('svg').classed('sceneMap', true);
    let map = svgTop.append('g').classed('map', true);
    let altitude = svgTop.append('g').classed('altitude', true);
    let mapLegend = map.append('text').classed('legend', true)
        .attr('transform', `translate(${mapGroupWidth/2}, ${textHeight-5})`)
        .text('Map')
        .attr('text-anchor', 'middle');
    let altitudeLegend = altitude.append('text').classed('legend', true)
        .attr('transform', `translate(${altitudeGroupWidth/2}, ${textHeight-5})`)
        .text('Alt.')
        .attr('text-anchor', 'middle');
    let mapActors = map.selectAll('g.actor');
    let altitudeActors = altitude.selectAll('g.actor');

    let mapBackground = map.append('g').classed('back', true);
    mapBackground.append('rect');
    mapBackground.append('image');
    let mapXAxisG = map.append('g')
        .classed('mapXAxis', true)
        .attr('transform', `translate(0,${textHeight+axesWidth})`);
    let mapYAxisG = map.append('g')
        .classed('mapYAxis', true)
        .attr('transform', `translate(${mapGroupWidth-axesWidth},0)`);
    let altitudeAxisG = altitude.append('g')
        .classed('altitudeAxis', true)
        .attr('transform', `translate(${axesWidth},0)`);

    // let svgTop,  map, altitude, mapLegend, altitudeLegend, mapActors, altitudeActors, mapBackground;

    let mapXScale = D3ScaleLinear(),
        mapYScale = D3ScaleLinear();
    let altitudeScale = D3ScaleLinear();
    let mapXAxis = D3AxisTop(mapXScale),
        mapYAxis = D3AxisRight(mapYScale);
    let altitudeAxis = D3AxisLeft(altitudeScale);
    // let mapXAxisG, mapYAxisG, altitudeAxisG;
    let actorColorScale = D3ScaleOrdinal();

    let mouseoverCallback = ()=>{},
        mouseoutCallback = ()=>{};

    let actorTooltips = [];

    function makeEnvironmentData(input){
        if(has(input, 'x')){
            envData.XMin = input.x[0];
            envData.XMax = input.x[1];
        } else {
            envData.XMin = -1;
            envData.XMax = 1;
        }
        envData.W = envData.XMax-envData.XMin;
        if(has(input, 'y')){
            envData.YMin = input.y[0];
            envData.YMax = input.y[1];
        } else {
            envData.YMin = -1;
            envData.YMax = 1;
        }
        envData.H = envData.YMax-envData.YMin;
        if(has(input, 'z')){
            envData.hasA = true;
            envData.ZMin = input.z[0];
            envData.ZMax = input.z[1];
            envData.A = envData.ZMax-envData.ZMin;
        } else {
            envData.hasA = false;
        }
    }

    function draw(){
        updateScale();
        if(useImage){
            drawImage(sceneImageUrl);
        } else {
            drawMap();
        }
        drawActors();
    }

    function updateScale(){
        let mapHeight = canvas.innerHeight-textHeight-axesWidth,
            mapWidth = mapGroupWidth-axesWidth;

        mapYScale.domain([envData.YMin, envData.YMax]);
        mapXScale.domain([envData.XMin, envData.XMax]);
        // let ratio = envData.W/envData.H;
        if(mapHeight < mapWidth){ // needs to fit in height
            mapYScale.range([canvas.innerHeight, textHeight+axesWidth]);
            mapXScale.range([(mapWidth-mapHeight)/2, (mapWidth-mapHeight)/2+mapYScale(-envData.XMax)-mapYScale(-envData.XMin)]);
        } else { // needs to fit in width
            mapXScale.range([0, mapWidth]);
            mapYScale.range([mapWidth+textHeight+axesWidth, textHeight+axesWidth]);
        }
        mapXAxis.scale(mapXScale);
        mapXAxisG.call(mapXAxis);
        mapYAxis.scale(mapYScale);
        mapYAxisG.call(mapYAxis);
        mapLegend.text('Map');

        if(envData.hasA){
            altitudeScale.domain([envData.ZMin, envData.ZMax])
                .range([canvas.innerHeight, textHeight+axesWidth]);
            altitudeAxis.scale(altitudeScale);
            altitudeAxisG.call(altitudeAxis);
            altitudeLegend.text('Alt.');
            altitudeAxisG.style('visibility', 'visible');
        } else {
            altitudeLegend.text('');
            altitudeAxisG.style('visibility', 'hidden');
        }
        reposition();
    }

    function actorShape(size,shape){
        let oX = -size/2, // to shift centre of shape to actual coordinates
            oY = -size/2;
        switch(shape){
        default:
            return `${size*0.1+oX}, ${size*0.1+oY} ${size*0.1+oX}, ${size*0.9+oY} ${size*0.9+oX}, ${size*0.9+oY} ${size*0.9+oX}, ${size*0.1+oY}`;
        }
    }

    function drawActors(){

        actorTooltips.forEach(t=>t.destroy());

        mapActors = map.selectAll('g.actor').data(actorStates);
        let enter = mapActors.enter().append('g')
            .classed('actor', true);
        
        enter.append('polygon');

        mapActors.exit().remove();
        mapActors = map.selectAll('g.actor');

        mapActors.attr('transform', d=>`translate(${mapXScale(d.features.x)},${mapYScale(d.features.y)})`)
            .on('mouseover', mouseoverCallback)
            .on('mouseout', mouseoutCallback)
            .attr('data-tippy-content', d=>{
                let a = currentActions.filter(act=>act.actor === d.actor);
                if(a.length > 0) return a[0].description;
                else return d.description;
            });

        mapActors.select('polygon')
            .attr('points', actorShape(actorRadius*2,''))
            .style('fill', d=>actorColorScale(d.actor));

        altitudeActors = altitude.selectAll('g.actor').data(actorStates);
        if(envData.hasA){
            enter = altitudeActors.enter().append('g')
                .classed('actor', true);

            enter.append('polygon');

            altitudeActors.exit().remove();
            altitudeActors = altitude.selectAll('g.actor');

            altitudeActors.attr('transform', (d,i)=>{
                return `translate(${axesWidth+actorRadius+(i*altActorSpace)},${altitudeScale(d.features.z)})`;
            })
                .on('mouseover', mouseoverCallback)
                .on('mouseout', mouseoutCallback)
                .attr('data-tippy-content', d=>{
                    let a = currentActions.filter(act=>act.actor === d.actor);
                    if(a.length > 0) return a[0].description;
                    else return d.description;
                });

            altitudeActors.select('polygon')
                .attr('points', actorShape(actorRadius*2,''))
                .style('fill', d=>actorColorScale(d.actor));
        } else{
            altitudeActors.exit().remove();
            altitudeActors.remove();
        }

        actorTooltips = tippy([...mapActors.nodes(), ...altitudeActors.nodes()],{
            theme:'dark',
            duration: [500, 0]
        });
    }

    function highlightActors(a){
        if(a.length > 0){
            mapActors.filter(d=>{return a.indexOf(d.actor) < 0;})
                .classed('faded', true);
            altitudeActors.filter(d=>{return a.indexOf(d.actor) < 0;})
                .classed('faded', true);
        } else {
            mapActors.classed('faded', false);
            altitudeActors.classed('faded', false);
        }
    }

    function drawMap(){
        let X = envData.XMin,
            Y = envData.YMin,
            W = envData.W,
            H = envData.H;

        mapBackground.select('rect')
            .attr('width', mapXScale(X+W)-mapXScale(X))
            .attr('height', -mapYScale(Y+H)+mapYScale(Y))
            .attr('x', mapXScale(X))
            .attr('y', mapYScale(-Y));
    }

    function drawImage(sceneImageUrl){
        let X = envData.XMin,
            Y = envData.YMin,
            W = envData.W,
            H = envData.H;
        mapBackground.select('image')
            .attr('width', Math.abs(mapXScale(X+W)-mapXScale(X)))
            .attr('height', Math.abs(mapYScale(Y+H)-mapYScale(Y)))
            .attr('x', mapXScale(X))
            .attr('y', mapYScale(-Y))
            .attr('href', sceneImageUrl);
    }

    function resetDimensions(){
        canvas = Canvas(width, height, padding);

        mapGroupWidth = canvas.innerWidth-altitudeGroupWidth;
        updateScale();

        svgTop.attr('width',width)
            .attr('height',height)
            .style('width',width)
            .style('height',height);
        
        reposition();
    }

    function reposition(){
        map.attr('transform', `translate(${canvas.left+altitudeGroupWidth},${canvas.top})`);
        mapLegend.attr('transform', `translate(${mapGroupWidth/2}, ${textHeight-5})`);
        mapXAxisG.attr('transform', `translate(0,${textHeight+axesWidth})`);
        mapYAxisG.attr('transform', `translate(${mapXScale(envData.XMax)},0)`);
        if(envData.hasA){
            altitude.attr('transform', `translate(${mapXScale(envData.XMin)},${canvas.top})`);
            altitudeAxisG.attr('transform', `translate(${axesWidth},0)`);
            altitudeLegend.attr('transform', `translate(${altitudeGroupWidth/2}, ${textHeight-5})`);
        }
    }

    // resetDimensions();
    makeEnvironmentData(sceneDimensions);
    drawImage(sceneImageUrl);

    return smObj;
}