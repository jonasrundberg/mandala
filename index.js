// https://github.com/jonasrundberg/mandala


const canvas = document.getElementById('mandala');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const tempCanvas = document.getElementById('temp-mandala');
tempCanvas.width = canvas.width;
tempCanvas.height = canvas.height;
const tempCtx = tempCanvas.getContext('2d');
ctx.globalCompositeOperation = 'source-over';
// tempCtx.globalCompositeOperation = 'copy';
const background = document.getElementById('background');
let  dpi = window.devicePixelRatio;

const cx = Math.round(canvas.width / 2);
const cy = Math.round(canvas.height / 2);
let isPainting = false;
const lineWidth = 1;
const sectors = 16; // should be even number for symmetry to work
const angle = 360 * Math.PI / 180 / sectors; // angle of one sector
let start = {x:null, y:null};
let r = Math.min(cx, cy) -40; 
let mandalaBoundary, pieSliceBoundary, inversePieSliceBoundary;
const backgroundColor = '#eee';
/**
- the mandala is devided into sectors that are each of angle arc width
- one specific sector is defined by "pieSliceBoundary", with its inverse inversePieSliceBoundary
- when drawing, the stroke is copied to each sector, and also mirrored mirrored inside the sector
- after drawing a flood fill is performed inside pieSliceBoundary
- this filled sector is theh copied to all other sectors, and horisontally flipped every second copy to achieve symmetry
*/




function reset(){
    mandalaBoundary = new Path2D();
    mandalaBoundary.arc(cx, cy, r, 0, 2 * Math.PI);

    pieSliceBoundary = new Path2D();
    pieSliceBoundary.arc(cx, cy, r, 0, 2 * Math.PI/sectors);
    pieSliceBoundary.lineTo(cx, cy);
    pieSliceBoundary.closePath();

    inversePieSliceBoundary = new Path2D();
    inversePieSliceBoundary.arc(cx, cy, r, 2 * Math.PI/sectors, 2 * Math.PI);
    inversePieSliceBoundary.lineTo(cx, cy);
    inversePieSliceBoundary.closePath();


    // reset page background color
    background.style.backgroundColor = backgroundColor;

    // reset mandala background color
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fill(mandalaBoundary);
    
    ctx.resetTransform();
    tempCtx.resetTransform();


    // draws the sector guide lines
    // for(var i=0; i<2 * Math.PI; i+=angle) {
    //     ctx.beginPath();
    //     ctx.strokeStyle = 'rgba(230, 230, 230, .75)';
    //     ctx.moveTo(cx, cy);
    //     ctx.arc(cx, cy, r, i, i + angle);
    //     ctx.lineTo(cx, cy);
    //     ctx.stroke();
    // }   

}


const startDraw = (event) => {
    if(event.button != 0) {
        return;
    }

    reset();
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(50, 50, 50, 1.0)';
    isPainting = true;
}


const endDraw = (event) => {
    isPainting = false;
    start.x = start.y = null;
    let startTime = performance.now()
    fillWhites();
    let endTime = performance.now()
    console.log(`Fill took ${Math.round(endTime - startTime)} ms`)
}


const draw = (e) => {
    if(!isPainting) {
        return;
    }

    let x = e.clientX;
    let y = e.clientY;

    if (!ctx.isPointInPath(mandalaBoundary, x, y)) {
        return;
    }

    if (start.x !== null) {

        for(let i = 0; i < sectors; i++) {
            // draw the mouse move from last point
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(x, y);

            // draw the mirror
            ctx.moveTo((cx-start.x)+cx, start.y);
            ctx.lineTo((cx-x)+cx, y);          

            ctx.translate(cx, cy);
            ctx.rotate(angle);
            ctx.translate(-cx, -cy);

        }
        ctx.stroke();
    }
    ctx.rotate(0);
    ctx.resetTransform();
    start.x = x;
    start.y = y; 
}

class Color {
    // accepts RGBA or css hexcode eg "ddbea9"
    constructor(r, g, b, a) {
        if (typeof r == 'string') {
            this.r = Number(`0x${r[0]}${r[1]}`);
            this.g = Number(`0x${r[2]}${r[3]}`);
            this.b = Number(`0x${r[4]}${r[5]}`);
            this.a = 255;            

        } else {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;            
        }
    }

    equals(other){
        return this.r == other.r && this.g == other.g && this.b == other.b && this.a == other.a;
    }  

    isWhite() {
        return this.r == 255 && this.g == 255 && this.b == 255 && this.a == 255;
    }


}

function getColorIndicesForCoord(x, y, width) {
  var red = y * (width * 4) + x * 4;
  return [red, red + 1, red + 2, red + 3];
}

const getColorFromCoord = (x, y, image, width) => {

    const [redIndex, greenIndex, blueIndex, alphaIndex] = getColorIndicesForCoord(x, y, width);;
    const red = image.data[redIndex];
    const green = image.data[greenIndex];
    const blue = image.data[blueIndex];
    const alpha = image.data[alphaIndex];
    return new Color(red, green, blue, alpha);
}


const floodFill = (image, x, y, fillColor, width, height) => {

    const thisPixelColor = getColorFromCoord(x, y, image, width);
    
    // If the fillColor is same as the existing -return
    if( thisPixelColor.equals(fillColor) ) {
        return;
    }
    
    //Otherwise call the fill function which will fill in the existing image.
    fill(image, x, y, fillColor, thisPixelColor, width, height);
    
    // return image;
};


// recursive part of flood fill
const fill = (image, x, y, fillColor, previousColor, width, height) => {

    if(x < 0 || y < 0 || x > width || y > height){
        return;
    }

    const [redIndex, greenIndex, blueIndex, alphaIndex] = getColorIndicesForCoord(x, y, width);
    const red = image.data[redIndex];
    const green = image.data[greenIndex];
    const blue = image.data[blueIndex];
    const alpha = image.data[alphaIndex];
    const thisPixel = new Color(red, green, blue, alpha);

    if( !thisPixel.equals(previousColor) ){
        return;
    }
    
    //Update the new color
    image.data[redIndex] = fillColor.r;
    image.data[greenIndex] = fillColor.g;
    image.data[blueIndex] = fillColor.b;
    image.data[alphaIndex] = fillColor.a;

    try {
        //Fill in all four directions
        fill(image, x - 1, y, fillColor, previousColor, width, height);
        fill(image, x + 1, y, fillColor, previousColor, width, height);
        fill(image, x, y - 1, fillColor, previousColor, width, height);
        fill(image, x, y + 1, fillColor, previousColor, width, height);
    } catch (e)
    {
        // TODO when area is too large recursion causes stack overflow -visible as iregular color fills
        // console.log('Area too large. Skipping');
    }   
}


const duplicateFillToOtherSectors = (image, width) => {

    for (let y = 0; y < canvas.height; y++){
        for (let x = 0; x < canvas.width; x++){
            
            // clear all other pixels than the filled sector
            if (!ctx.isPointInPath(pieSliceBoundary, x, y)) {
                const [redIndex, greenIndex, blueIndex, alphaIndex] = getColorIndicesForCoord(x, y, width);
                image.data[redIndex] = 0;
                image.data[greenIndex] = 0;
                image.data[blueIndex] = 0;
                image.data[alphaIndex] = 0;
            }

        }
    }
    ctx.putImageData(image, 0, 0);


    // TODO won't work. hence above solution
    // // clear original ctx
    // ctx.globalCompositeOperation = 'copy';
    // ctx.fillStyle = 'rgba(0, 0, 0, 0.0)';
    // ctx.fill(inversePieSliceBoundary);
    // ctx.globalCompositeOperation = 'source-over';


    // copy the filled section to a temp canvas and use that to duplicate to the full circle
    tempCtx.drawImage(ctx.canvas, 0, 0);

    // create a v-flipped copy to get symmetry at the edges
    tempCtx.globalCompositeOperation = 'source-over'; // needed when vertically flipping tempCtx
    tempCtx.translate(cx, cy);
    tempCtx.scale(1, -1);
    tempCtx.translate(-cx, -cy);
    tempCtx.drawImage(tempCtx.canvas, 0, 0);
    tempCtx.globalCompositeOperation = 'copy'; // needed for copying to ctx

    // clear the background to white for better visibility on the finalized manadala
    background.style.backgroundColor = '#fff';

    // copy the temp canvas to each section
    for (let i = 0; i < sectors; i++) {

        ctx.translate(cx, cy);
        ctx.rotate( 2 * angle); // *2 since the tempCtx consists of 2 sectors (the normal + the v-flipper)
        ctx.translate(-cx, -cy);
        ctx.drawImage(tempCtx.canvas, 0, 0);
    }
}



function makeColorIterator() {
    let iterationCount = 0;
    // eg https://coolors.co/palettes/
    const palettes = [ //[new Color('ef476f'), new Color('ffd166'), new Color('06d6a0'), new Color('118ab2') ], // clear colors -good for debug.
                       [new Color('cb997e'), new Color('ddbea9'), new Color('ffe8d6'), new Color('b7b7a4'), new Color('a5a58d'), new Color('6b705c') ], 
                       [new Color('005f73'), new Color('0a9396'), new Color('94d2bd'), new Color('e9d8a6'), new Color('ee9b00'), new Color('ca6702') , new Color('bb3e03'), new Color('ae2012')], 
                       [new Color('fbf8cc'), new Color('fde4cf'), new Color('ffcfd2'), new Color('f1c0e8'), new Color('cfbaf0'), new Color('a3c4f3') , new Color('90dbf4'), new Color('98f5e1')], 
                       [new Color('03045e'), new Color('023e8a'), new Color('0077b6'), new Color('0096c7'), new Color('00b4d8'), new Color('48cae4') , new Color('90e0ef'), new Color('ade8f4')], 
                       [new Color('d8f3dc'), new Color('b7e4c7'), new Color('95d5b2'), new Color('74c69d'), new Color('52b788'), new Color('40916c') , new Color('2d6a4f'), new Color('1b4332')], 
                    ] ;

    const colors = palettes[Math.floor(Math.random()*palettes.length)];

    const rangeIterator = {
       next: function() {
           iterationCount++;
           return colors[iterationCount % colors.length];
       }
    };
    return rangeIterator;
}


const fillWhites = async () => {
    console.log('Filling...');
    const colorIterator = makeColorIterator();
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (let y = cy; y <= canvas.height; y++){
        for (let x = cx; x <= canvas.width; x++){

            // only flood fill one sector. To get same color in same locations around the mandala
            if (ctx.isPointInPath(pieSliceBoundary, x, y)) {

                const thisPixelColor = getColorFromCoord(x, y, imageData, canvas.width);
                if ( thisPixelColor.isWhite() ){
                    floodFill(imageData, x, y, colorIterator.next(), canvas.width, canvas.height);
                    // ctx.putImageData(imageData, 0, 0);
                }

            }

        }
    }
    ctx.putImageData(imageData, 0, 0);
    duplicateFillToOtherSectors(imageData, canvas.width);
}


const addText = () => {
    ctx.font = "60px Verdana";
    ctx.fillStyle = backgroundColor;
    ctx.textAlign = "center";
    ctx.fillText("Draw", cx, cy-70);
    ctx.fillText("Wait", cx, cy);
    ctx.fillText("Watch", cx, cy+70);
}



canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mouseup', endDraw);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener("touchstart", startDraw, false);
canvas.addEventListener("touchend", endDraw, false);
canvas.addEventListener("touchcancel", endDraw, false);
canvas.addEventListener("touchmove", draw, false);


reset();
addText();



