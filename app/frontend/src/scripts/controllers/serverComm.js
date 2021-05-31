const baseUrl = 'http://127.0.0.1:2000/';

const LOG_DATA = true;

function getRoadmapData(){
    console.log('Fetching roadmap data');
    return fetch(baseUrl+'getRoadmap')
        .then(d=>d.json())
        .then(r=>{
            console.log('Roadmap Data:', r);
            return r;
        });
}
// document.getElementById('roadmapData').onclick = getRoadmapData

function getPlanData(){
    // console.log('Fetching plan data')
    return fetch(baseUrl+'getPlan')
        .then(d=>d.json())
        .then(r=>{
            console.log('Plan Data:', r);
            return r;
        });
}

function updateFeatureWeights(data){
    return fetch(baseUrl+'setFeatWeights',
        {
            method:'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(d=>d.json())
        .then(r=>{
            console.log('Update States:', r);
            return r;
        });
}

function loadDomain(){
    return fetch(baseUrl+'getDomain',{method:'GET'})
        .then(d=>d.json())
        .then(r=>{
            if(LOG_DATA)console.log('Domain: ', r);
            return r;
        });
}

function saveProblem(data){
    return fetch(baseUrl+'saveProblem',
        {
            method:'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
}

function sendProblem(data){
    return fetch(baseUrl+'setProblem',
        {
            method:'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(d=>d.json())
        .then(r=>{
            if(LOG_DATA)console.log('res:', r);
            return r;
        });
}

function queryPlan(){
    return fetch(baseUrl+'checkPlan',{method:'GET'})
        .then(d=>d.json())
        .then(r=>{
            if(LOG_DATA)console.log('res: ', r);
            return r;
        });
}

function closeApp(){
    fetch(baseUrl+'close',{method:'POST'})
        .then(d=>d.text())
        .then(r=>{
            if(r == 'shutting down')
                window.close();
        });
}
// document.getElementById('close').onclick = closeApp;

export {loadDomain, saveProblem, sendProblem, queryPlan, getPlanData, updateFeatureWeights, getRoadmapData, closeApp};