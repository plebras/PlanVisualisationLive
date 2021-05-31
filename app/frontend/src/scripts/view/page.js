import {select as D3Select} from 'd3-selection';
import ControlPanel from './controlPanel';
import ProblemEditor from './views/problemEditor';
import PlanVisualisation from './views/planVisualisation';
import LoadingModal from './components/utils/loadingModal';
import {loadDomain, saveProblem, sendProblem, queryPlan, closeApp, getPlanData} from '../controllers/serverComm';
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
                                if(d.type === 'info' && d.msg === 'planning complete'){
                                    clearInterval(interval);
                                    L.updateMessage('Loading plan data...');
                                    getPlanData().then(d=>{
                                        L.destroy();
                                        P = Plan(d);
                                        stage2();
                                    });
                                } else if(d.type === 'info' && d.msg === 'planning failed'){
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
                alert('Problem must have at least one goal.');
            }
        },
        redefPb: ()=>{stage1();},
        execPlan: ()=>{console.log('click execPlan');},
    }).stage0();

    function stage1(){
        PV.remove();
        PE.loadDomain(D).render();
        CP.stage1();
    }

    function stage2(){
        PE.remove();
        PV.loadPlan(P).loadDomain(D).render();
        CP.stage2();
    }

}