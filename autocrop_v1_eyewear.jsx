﻿var startDisplayDialogs = app.displayDialogs;
app.displayDialogs = DialogModes.NO;

//defines input folder full of jpegs and output file destination
var inputFolder = Folder.selectDialog ("Select folder of processed, uncropped JPEGS");
var outputFolder = Folder.selectDialog ("Select final output folder for cropped images");
var cropGuide = [];


//------------------------------Functions-------------------------------------------------------

//function counting total number of red chanel pixels within active selection brighter than first parameter in Channel.slice
function readHistogram(){
    //[0] = red channel, [1] = green channel, [2] = blue channel
    var channel = activeDocument.channels[1].histogram
    
    //splits the array starting at the minimumBrightness and discards everything darker
    var brightness = channel.slice(minimumBrightness, 256)

        //finds the sum of all pixels within the active selection that fall between minimumBrightness and 255 assigns that value to varriable total
        for(var i = 0; i < brightness.length; i++) {
            total += brightness[i];
        }
    }

//draws horizontal line with parameter d (displacement distance of the scan linein px)
function drawHorizontal(d){
    
    var selectionBounds = [
        [0, (h/2-1)-d],
        [w, (h/2-1)-d],
        [w, (h/2+1)-d],
        [0, (h/2+1)-d]
        ];
    
    app. activeDocument.selection.select(selectionBounds, SelectionType.REPLACE,0,false);
    }

//draws vertical selection with parameters d (displacement distance of the scan line in px), previously determined max height of product, previously determined min height of product
function drawVertical(d, max, min){
    var selectionBounds = [
        [(w/2-1)-d,max],
        [(w/2+1)-d,max],
        [(w/2+1)-d,min],
        [(w/2-1)-d,min]
        ];

app.activeDocument.selection.select(selectionBounds,SelectionType.REPLACE,0,false);
}

//reset varriables t, total, and counter between while loops
function resetBetweenCycles(){
    t = 1
    total = 0
    counter = 0
    }
//------------------------------Operation-------------------------------------------------------

//master function to cycle through files based on inputFolder fileList
if (inputFolder != null && outputFolder != null){
    var fileList = inputFolder.getFiles();
    var workingArray = [];
    //alert(fileList);
    //ADD JPEG SAVING OPTIONS DEFINITIONS HERE
    while (fileList.length > 0){
        //deletes the hidden file and folders from the array as they come up
        if (fileList[0] instanceof Folder || fileList[0].hidden == true){
            fileList.splice(0,1);
            }
        
        while(fileList.length > 0 && fileList[0].name.substr(0,2)=="._"){
                        fileList.splice(0,1);
                        };
        
        if(fileList.length > 0){
             //isolates just the Look ID for batching the looks
            var fileName = fileList[0].name;
            var lookId = fileName.substr(0,7);
            //alert(fileList[0].name.substr(0,7));
            //alert(lookId.toString());
            while (fileList.length > 0 && fileList[0].name.substr(0,7) == lookId){
                
                var nextFile = fileList.shift();
                workingArray.push(nextFile);
                
            //var docRef = open(fileList[i]);
            //alert(fileList[i].name);
                } 
            
            var primaryWidth = 0;
            var primaryHeight = 0;
            
            //alert(workingArray[0]);
            for (var i = 0; i < workingArray.length; i++){
                //var workingFile = new File(workingArray[i]);
                var docRef = open(workingArray[i]);
                
                                //set document rulers to pixels
                app.preferences.rulerUnits = Units.PIXELS;

                //get active document's width and height in pixels
                var w = app.activeDocument.width;
                var h = app.activeDocument.height;


                //initialize loop counter at zero
                var counter = 0;

                //sets t to default of 1, t = numnber of times the scan line has been repositioned. Used to modifie the parameter scanDistance for drawVertical/drawHorizontal
                var t = 1;

                //distance in pixels between scan line measurements
                var scanDistance = 40;

                //defines the minimum brightnes level to be included in the histogram reading when finding edge of product
                var minimumBrightness = 210;

                //tolerance defines how many pixels need to be between the minimumBrightness and 255 white before scan lines find the edge (MAX=2)
                var tolerance =2.0;

                var total = 0

                //find top of product
                while(total < w*tolerance){
                    
                    total = 0
                    counter += 1
                    
                    drawHorizontal(scanDistance*t)
                    
                    readHistogram();
                    
                    t++;

                     //ForRedraw();
                }


                //defines top edge of product
                var top = h/2 - counter*scanDistance;

                resetBetweenCycles();


                //find bottom border
                while(total < w*tolerance){
                    
                    total = 0
                    counter += 1
                    
                    drawHorizontal(-(scanDistance*t));
                    readHistogram();

                    t++; 
                    
                    //ForRedraw();
                }


                //defines bottom edge of product
                var bottom = h/2 + counter*scanDistance;


                resetBetweenCycles();


                //find left border
                while(total < (bottom-top)*tolerance){
                    
                    total = 0
                    counter += 1
                    
                    drawVertical(scanDistance*t, top, bottom);
                    readHistogram();

                    t++;
                    
                     //ForRedraw();
                }

                //defines left edge of product
                var left = w/2 - counter*scanDistance;

                resetBetweenCycles();

                //find right border
                while(total < (bottom-top)*tolerance){
                    
                    total = 0
                    counter += 1
                    
                    drawVertical(-scanDistance*t, top, bottom);
                    readHistogram();
                    
                    
                    t++; 
                    
                     //ForRedraw();
                }

                //defines right edge of product
                var right = w/2 + counter*scanDistance;

                //defines bound of product selection box
                var selectionFinal = [[left, top], [right, top], [right, bottom], [left, bottom]];

                var newWidth = right-left;
                var newHeight = bottom-top;

                //activates final product selection
                app.activeDocument.selection.select(selectionFinal,SelectionType.REPLACE,0,false);
                //begin final CROP stage
                
                 app.activeDocument.selection.resizeBoundary(112,100,AnchorPosition.MIDDLECENTER);

var selectionWidth;
var selectionHeight;
var bounds = app.activeDocument.selection.bounds;

getSelectionWidth(bounds);

var bottomPaddingPercent = (1+((selectionWidth/3375)*1350)/selectionHeight)*100;

//alert(bottomPaddingPercent);

app.activeDocument.selection.resizeBoundary(100,bottomPaddingPercent,AnchorPosition.TOPCENTER);

bounds = app.activeDocument.selection.bounds;

getSelectionWidth(bounds);

var topPaddingPercent = (Math.abs(((selectionWidth/3375)*(4500))/selectionHeight))*100; 

app.activeDocument.selection.resizeBoundary(100,topPaddingPercent,AnchorPosition.BOTTOMCENTER);

function getSelectionWidth(arr){
    selectionWidth = arr[2]-arr[0];
    selectionHeight = arr[3]-arr[1];
    };

app.activeDocument.crop(app.activeDocument.selection.bounds);
/*                    
                 if(app.activeDocument.name.substr (8, 1) == "A" || app.activeDocument.name.substr (8, 1) == "B" || app.activeDocument.name.substr (8, 1) == "C"){
                     
                     
                app.activeDocument.selection.resizeBoundary(125,100,AnchorPosition.MIDDLECENTER);
                cropGuide = app.activeDocument.selection.bounds;
                var newBottom = cropGuide[3]+((newWidth*1.25)*(720/3375)) ;
                var newTop = cropGuide[3] - ((newWidth*1.25)*720/3375)*5.25 ;
                var finalCrop = [cropGuide[0], newTop, cropGuide[2], newBottom];
                app.activeDocument.crop(finalCrop); 
                
                    if (app.activeDocument.name.substr (8, 1) == "A"){
                            primaryWidth = app.activeDocument.width;
                            primaryHeight = app.activeDocument.height ;
                        };
                
                    } else{
                        var currentBounds = app.activeDocument.selection.bounds;
                        var currentWidth = currentBounds[2]-currentBounds[0];
                        var currentHeight = currentBounds[3]-currentBounds[1];

                        var widthAdjust = primaryWidth/currentWidth*100;
                        var heightAdjust = primaryHeight/currentHeight*100;

                        app.activeDocument.selection.resizeBoundary(widthAdjust,heightAdjust,AnchorPosition.MIDDLECENTER)
                        
                        app.activeDocument.crop(app.activeDocument.selection.bounds);
                       
                        };
                        
*/                        
                    
                    app.activeDocument.resizeImage(3375, 4500, 72, ResampleMethod.BICUBICSMOOTHER);
                    
                    saveFile = new File(outputFolder + "/" + app.activeDocument.name)

                    saveOptions = new JPEGSaveOptions();
                    saveOptions.embedColorProfile = true;
                    saveOptions.formatOptions = FormatOptions.STANDARDBASELINE;
                    saveOptions.matte = MatteType.NONE;
                    saveOptions.quality = 10;

                    app.activeDocument.saveAs(saveFile, saveOptions, true,Extension.LOWERCASE);
                    app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);

                
                } //break;
                workingArray=[];
            } 
        } 
    }