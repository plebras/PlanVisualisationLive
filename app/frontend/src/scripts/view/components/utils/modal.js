import {select as D3Select} from 'd3-selection';
import '../../../../styles/components/modal.less';

export default function Modal(container, act){
    let modalObj = {};

    modalObj.toggleModal = function(open){
        modalOpened = typeof open !== 'boolean' ? !modalOpened : open;
        modalBack.classed('opened', modalOpened);
        return modalObj;
    };
    modalObj.setTitle = function(t){
        title.html(t);
        return modalObj;
    };
    modalObj.enableBackClick = function(){
        modalBack.on('click', ()=>{modalObj.toggleModal(false);});
        return modalObj;
    };
    modalObj.disableBackClick = function(){
        modalBack.on('click', ()=>{});
        return modalObj;
    };
    modalObj.setActions = function(d){
        actionsDetails = d;
        updateActions();
        return modalObj;
    };
    modalObj.toggleAction = function(actionName, value){
        let a = actionsDetails.find(d=>d.name === actionName);
        if(typeof a !== 'undefined'){
            a.disabled = (typeof value !== 'boolean') ? !a.disabled : value;
        }
        updateActions();
        return modalObj;
    };
    modalObj.enableAction = function(actionName){
        modalObj.toggleAction(actionName, false);
        return modalObj;
    };
    modalObj.disableAction = function(actionName){
        modalObj.toggleAction(actionName, true);
        return modalObj;
    };
    modalObj.getModalTitle = function(){
        return title;
    };
    modalObj.getModalBody = function(){
        return modalBody;
    };
    modalObj.getModal = function(){
        return modal;
    };
    modalObj.destroy = function(){
        modalBack.remove();
    };

    let modalOpened = false;

    let actionsDetails = (typeof act === 'undefined') ? [] : act;

    let modalBack = D3Select(container).append('div')
        .classed('modalBack', true)
        .on('click', ()=>{modalObj.toggleModal(false);});
    let modal = modalBack.append('div')
        .classed('modal', true)
        .on('click', e=>{e.stopPropagation();});
    let modalHeader = modal.append('div')
        .classed('modalHeader', true);
    let title = modalHeader.append('h1')
        .classed('modalTitle', true);
    let modalBody = modal.append('div')
        .classed('modalBody', true);
    let modalFooter = modal.append('div')
        .classed('modalFooter', true);
    let actionButtons = modalFooter.selectAll('button.modalAction');

    function updateActions(){
        actionButtons = modalFooter.selectAll('button.modalAction')
            .data(actionsDetails, d=>d.name);
        actionButtons.exit().remove();
        actionButtons.enter().append('button')
            .classed('modalAction', true);
        actionButtons = modalFooter.selectAll('button.modalAction');
        actionButtons.text(d=>d.name)
            .on('click', (e,d)=>{
                d.action();
            })
            .classed('btn', true)
            .attr('disabled', d=>{
                if (d.disabled) return true;
                else null;
            }).each(function(d){
                D3Select(this).classed(d.class, true);
            });
    }
    updateActions();

    return modalObj;
}