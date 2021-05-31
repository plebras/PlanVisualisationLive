import {select as D3Select} from 'd3-selection';
import has from 'lodash-es/has';
import ControlPanel from './controlPanel';
import ProblemEditor from './views/problemEditor';
import PlanVisualisation from './views/planVisualisation';
import LoadingModal from './components/utils/loadingModal';
import MessageModal from './components/utils/messageModal';
import {loadDomain, saveProblem, sendProblem, queryPlan, closeApp, execPlan, getPlanData} from '../controllers/serverComm';
import Domain from '../models/domain';
import Plan from '../models/plan';

import '../../styles/page/page.less';

export default function Page(domContainer){

    D3Select(domContainer).append('div')
        .classed('appPage', true);

    let D, P;

    let PE = ProblemEditor('div.appPage');

    let PV = PlanVisualisation('div.appPage');

    let CP = ControlPanel('div.appPage',{
        close: ()=>{closeApp();},
        ldDom: ()=>{
            loadDomain().then(d=>{
                D = Domain(d);
                stage1();
            });
        },
        resetPb: ()=>{
            let pb = D.resetProblemData();
            saveProblem(pb);
            PE.remove().loadDomain(D).render();
        },
        savePb: ()=>{
            let pb = D.buildProblemData();
            saveProblem(pb);
        },
        genPlan: ()=>{
            let pb = D.buildProblemData();
            if(pb.goals.length > 0){
                sendProblem(pb).then(d=>{
                    if(d.type === 'info' && d.msg === 'planning in progress'){
                        let L = LoadingModal('Planning in progress...');
                        let interval = setInterval(() => {
                            queryPlan().then(d=>{
                                if(d.type === 'success' && d.msg === 'planning complete'){
                                    clearInterval(interval);
                                    L.updateMessage('Loading plan data...');
                                    getPlanData().then(d=>{
                                        L.destroy();
                                        if(has(d, 'type') && d.type === 'error'){
                                            let M = MessageModal(`Error while parsing plan<br>${d.msg}`, {
                                                name: 'Back to Editor',
                                                action: ()=>{
                                                    M.destroy();
                                                    stage1();
                                                }
                                            });
                                        } else {
                                            P = Plan(d);
                                            stage2();
                                        }
                                    });
                                } else if(d.type === 'error' && d.msg === 'planning failed'){
                                    clearInterval(interval);
                                    L.stopLoading('Planning Failed',{
                                        name: 'Back to Editor',
                                        action: ()=>{
                                            L.destroy();
                                            stage1();
                                        }
                                    });
                                }
                            });
                        }, 100);
                    }
                });
            }
            else {
                let M = MessageModal('Problem must have at least one goal.', {
                    name: 'OK',
                    action: ()=>{
                        M.destroy();
                    }
                });
            }
        },
        redefPb: ()=>{stage1();},
        execPlan: ()=>{
            execPlan().then(d=>{
                if(d.type === 'success'){
                    let M = MessageModal(`Plan Dispatched<br>${d.msg}`, {
                        name: 'OK',
                        action: ()=>{
                            M.destroy();
                        }
                    });
                } else if (d.type === 'error'){
                    let M = MessageModal(`Error when dispatching plan<br>${d.msg}`, {
                        name: 'Back to Editor',
                        action: ()=>{
                            M.destroy();
                        }
                    });
                }
                
            });
        },
    }).stage0();

    function stage1(){
        PV.remove();
        PE.remove().loadDomain(D).render();
        CP.stage1();
    }

    function stage2(){
        PE.remove();
        PV.loadPlan(P).loadDomain(D).render();
        CP.stage2();
    }

}