import Modal from './modal.js';

export default function LoadingModal(msg){

    let modalObj = Modal('body')
        .disableBackClick();
    
    let message = modalObj.getModalBody()
        .append('div')
        .classed('message', true)
        .classed('blinking', true)
        .html(msg);

    modalObj.toggleModal(true);

    return {
        destroy: function(){
            modalObj.destroy();
        },
        updateMessage: function(msg){
            message.html(msg);
        },
        stopLoading: function(msg, action){
            message.html(msg).classed('blinking', false);
            modalObj.setActions([action]);
        }
    };
}