function getMaxTextWidth(texts, svg, padding){

    padding = (typeof padding === 'undefined') ? 10 : padding;

    let dummyText = svg.append('text'),
        maxWidth = 0;
    texts.forEach(t=>{
        dummyText.text(t);
        maxWidth = Math.max(maxWidth,getTextWidth(dummyText));
    });
    dummyText.remove();
    return maxWidth+padding;
}

function getTextHeight(text){
    return text.node().getBoundingClientRect().height;
}

function getTextWidth(text){
    return text.node().getBoundingClientRect().width;
}

export {getMaxTextWidth,getTextHeight};