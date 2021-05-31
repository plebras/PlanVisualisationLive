import Modal from './modal.js';

export default function MessageModal(msg,action){

    let modalObj = Modal('body')
        .disableBackClick();
    
    let message = modalObj.getModalBody()
        .append('div')
        .classed('message', true)
        .html(msg);
    
    modalObj.setActions([action]);

    modalObj.toggleModal(true);

    return {
        destroy: function(){
            modalObj.destroy();
        },
        updateMessage: function(msg){
            message.html(msg);
        }
    };
}