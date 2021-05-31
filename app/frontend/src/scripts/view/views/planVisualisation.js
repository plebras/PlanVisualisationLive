import {select as D3Select} from 'd3-selection';

import ActivityChart from '../components/visualisation/activityChart';
import TimeCurve from '../components/visualisation/timeCurve';
import TimeCurveWeights from '../components/visualisation/timeCurveWeights';
import SceneMap from '../components/visualisation/sceneMap';

import {updateFeatureWeights} from '../../controllers/serverComm';

import '../../../styles/page/planVisualisation.less';


export default function PlanVisualisation(domContainer){

    let plObj = {};

    plObj.loadPlan = (d)=>{
        plan = d;
        return plObj;
    };

    plObj.loadDomain = (d)=>{
        domain = d;
        return plObj;
    };

    plObj.render = ()=>{
        renderView();
        renderTimeCurve();
        renderTimeCurveWeights();
        renderActivityChart();
        renderSceneMap();
        resize();
        window.addEventListener('resize', resize);
        setTimeTCSM();
        return plObj;
    };

    plObj.remove = ()=>{
        if(typeof view !== 'undefined'){
            view.remove();
        }
        return plObj;
    };

    let plan, domain;

    let view, TC, AC, SM;

    function activityChartClick(e,d){ // click on activity bar
        plan.toggleHierarchy(d.id);
        AC.updateActionsDataset(plan.getVisibleActionsArray());
    }
    function activityChartPan(time){ // slide activity chart
        TC.updateStates(plan.getIntermediateStates(time), plan.getCurrentActions(time));
        SM.updateActors(plan.getIntermediateStates(time), plan.getCurrentActions(time));
    }
    function timeCurveClick(e,d){ // click on dot on time curve
        AC.setTime(d.time);
        TC.updateStates(plan.getIntermediateStates(d.time), plan.getCurrentActions(d.time));
        SM.updateActors(plan.getIntermediateStates(d.time), plan.getCurrentActions(d.time));
    }

    function mouseoverActor(e,d){
        TC.highlightCurves([d.actor]);
        AC.highlightBars([d.actor]);
        SM.highlightActors([d.actor]);
    }
    function mouseoutActor(){
        TC.highlightCurves([]);
        AC.highlightBars([]);
        SM.highlightActors([]);
    }

    function setTimeTCSM(){
        let t = AC.getTime();
        activityChartPan(t);
    }

    function renderView(){
        view = D3Select(domContainer).append('div')
            .classed('planVisualisation', true);
        view.append('h2')
            .text('Plan Visualisation');
    }

    function renderTimeCurve(){
        let actors = plan.getActorsArray();
        let states = plan.getStatesArray();
        view.append('div').classed('section sec1', true);
        TC = TimeCurve('div.sec1', states)
            .createActorScale(actors)
            .clickCallback(timeCurveClick)
            .mouseoverCallback(mouseoverActor)
            .mouseoutCallback(mouseoutActor);
        // initial states rendered with setTimeTCSM
    }

    function renderTimeCurveWeights(){
        let featureWeights = plan.getFeatureWeights();
        view.append('div').classed('section sec2', true);
        TimeCurveWeights('div.sec2')
            .loadData(featureWeights)
            .setCallback(d=>{
                // call server
                updateFeatureWeights(d)
                    .then(data=>{
                        plan.loadStates(data);
                        TC.loadData(plan.getStatesArray());
                    });
            });
    }

    function renderActivityChart(){
        let actors = plan.getActorsArray();
        let actions = plan.getVisibleActionsArray();
        let connected = plan.getConnectedActions();
        view.append('div').classed('section sec3', true);
        AC = ActivityChart('div.sec3', actions, actors, connected)
            .setActorColorScale(TC.getActorScale())
            .panCallback(activityChartPan)
            .clickCallback(activityChartClick)
            .mouseoverCallback(mouseoverActor)
            .mouseoutCallback(mouseoutActor);
    }

    function renderSceneMap(){
        let sceneImageUrl = 'app/resources/gazebo_screenshot_topdown.png';
        let sceneDimensions = domain.getMapDimensions();
        view.append('div').classed('section sec4', true);
        SM = SceneMap('div.sec4', sceneDimensions, sceneImageUrl)
            .setActorColorScale(TC.getActorScale())
            .mouseoverCallback(mouseoverActor)
            .mouseoutCallback(mouseoutActor);
        // initial states rendered with setTimeTCSM
    }

    function resize(){
        let tcW = document.querySelector('div.sec1').clientWidth,
            tcH = document.querySelector('div.sec1').clientHeight;
        TC.setSize(tcW, tcH, [10, 10, 10, 10]);
        let acW = document.querySelector('div.sec3').clientWidth-10,
            acH = document.querySelector('div.sec3').clientHeight;
        AC.setSize(acW, acH, [35, 15, 10, 10]);
        let smW = document.querySelector('div.sec4').clientWidth,
            smH = document.querySelector('div.sec4').clientHeight;
        SM.setSize(smW, smH, [10, 10, 10, 10]);
    }

    return plObj;
}