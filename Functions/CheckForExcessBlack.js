const Canvas = require('canvas');
const GetFMRoot = require('./GetFMRoot');
const Image = Canvas.Image;
module.exports = async (mapId) => {
    if (mapId == null){
        return "Placeholder"
    }
    else {
        var image = new Image();
        let validSubmission = false;
        let topRowGood = false;
        let leftSideGood = false;
        let rightSideGood = false;
        let bottomRowGood = false;
        const png = `${GetFMRoot()}png/${mapId}.png`

        image.src = `${png}`;
        let helperString = "";

        return new Promise((resolve, reject) => {
            image.onload = () => {
                var canvas = Canvas.createCanvas();
                canvas.width = image.width;
                canvas.height = image.height;
    
                var context = canvas.getContext('2d');
                context.drawImage(image,0,0);
                var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                
                for (var i = 0; i < canvas.width * 4; i += 4){
                    var rgbString = `r${imageData.data[i]}g${imageData.data[i+1]}b${imageData.data[i+2]}`
                    if (rgbString != 'r0g0b0' && rgbString != 'r212g212b212'){
                        topRowGood = true;                    
                    }
                }

                for (var i = 0; i < canvas.height * canvas.width * 4; i += canvas.width * 4){
                    var rgbString = `r${imageData.data[i]}g${imageData.data[i+1]}b${imageData.data[i+2]}`
                    if (rgbString != 'r0g0b0' && rgbString != 'r212g212b212'){
                        leftSideGood = true;
                    }
                }
    
                for (var i = (canvas.width - 1) * 4; i < canvas.height * canvas.width * 4; i += canvas.width * 4){
                    var rgbString = `r${imageData.data[i]}g${imageData.data[i+1]}b${imageData.data[i+2]}`
                    if (rgbString != 'r0g0b0' && rgbString != 'r212g212b212'){
                        rightSideGood = true;
                    }
                }
    
                for (var i = (canvas.height - 1) * canvas.width * 4; i < canvas.height * canvas.width * 4; i += 4) {
                    var rgbString = `r${imageData.data[i]}g${imageData.data[i+1]}b${imageData.data[i+2]}`
                    if (rgbString != 'r0g0b0' && rgbString != 'r212g212b212'){
                        bottomRowGood = true;
                    }
                }
    
                if (topRowGood && rightSideGood && bottomRowGood && leftSideGood){
                    validSubmission = true;
                } else {
                    !topRowGood ? helperString += "↖️❌❌❌❌❌↗️\n" : helperString += "↖️✅✅✅✅✅↗️\n";
                    for (var i = 0; i < 5; i++){
                        if (i == 1){
                            !leftSideGood ? helperString += "❌⬛:regional_indicator_t::regional_indicator_h::regional_indicator_e:" : helperString += "✅⬛:regional_indicator_t::regional_indicator_h::regional_indicator_e:";
                            !rightSideGood ? helperString += "⬛❌\n" : helperString += "⬛✅\n";
                        }
                        else if (i == 3){
                            !leftSideGood ? helperString += "❌⬛:regional_indicator_m::regional_indicator_a::regional_indicator_p:" : helperString += "✅⬛:regional_indicator_m::regional_indicator_a::regional_indicator_p:";
                            !rightSideGood ? helperString += "⬛❌\n" : helperString += "⬛✅\n";
                        }
                        else if (i == 2){
                            !leftSideGood ? helperString += "❌⬛⬛🤖⬛" : helperString += "✅⬛⬛🤖⬛";
                            !rightSideGood ? helperString += "⬛❌\n" : helperString += "⬛✅\n";
                        }
                        else {
                            !leftSideGood ? helperString += "❌⬛⬛⬛⬛⬛" : helperString += "✅⬛⬛⬛⬛⬛";
                            !rightSideGood ? helperString += "❌\n" : helperString += "✅\n";
                        }
                    }
                    !bottomRowGood ? helperString += "↙️❌❌❌❌❌↘️\n" : helperString += "↙️✅✅✅✅✅↘️\n";
                }
                if(validSubmission){
                    //return "Valid Submission"
                    resolve("Valid Submission");
                }
                else {
                    resolve(`Uh oh, looks like one or more of your map's edges is all black and/or white tiles. \nPlease crop the edges denoted with ❌, then resubmit.\n\n${helperString}`)
                }
            }
        })
    }
}