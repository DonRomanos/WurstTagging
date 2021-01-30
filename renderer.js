// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
document.getElementById('openFolderButton').addEventListener('click', ()=> {openFolderDialog()});
image_grid = document.getElementById("imageGrid");
open_folders_label = document.getElementById("openFoldersLabel");
preview_tile_template = document.getElementById("imagTileTemplate");

const path = require('path');
const fs = require('fs');
const dcraw = require('dcraw')

const electron = require('electron');
const dialog = electron.remote.dialog;

var openFolders = []
var folderImageIndices = []
var currentFilters = []
var currentImages = []
var currentPreviewTiles = []
var imageTags = []

function addToGlobalTags(tag)
{
    if(imageTags.includes(tag))
    {
        return;
    }
    imageTags.push(tag);
}

function addNewTagToImage(pressedKey)
{
    if(pressedKey.key === 'Enter' &&  this.value !== "")
    {
        if(!this.tags.includes(this.value))
        {
            this.tags.push(this.value);
            addToGlobalTags(this.value);
        }
        this.value = "";
        this.parentElement.children.item('imageTileLabels').textContent = this.tags.join();

        console.log("Pressed enter Key")
    }
}

function createPreviewTile(imageUrl)
{
    console.time('Creating <img>');

    // Create a new node:
    var previewTile = preview_tile_template.content.cloneNode(true);

    var image = previewTile.getElementById("imageTile")
    image.setAttribute("src", imageUrl);
    
    var inputTag = previewTile.getElementById("inputNewTag")
    inputTag.tags = [];
    inputTag.addEventListener('keydown', addNewTagToImage);
    console.timeEnd('Creating <img>');

    return previewTile;
}

function addImageToGrid(pathToImage)
{
    console.time('Image processing')
    console.time('reading Image file')
    const buf = fs.readFileSync(pathToImage);
    console.timeEnd('reading Image file')
    //console.log(dcraw(buf, {verbose: true, identify: true}));
    console.time('dcraw')
    const thumbnail = dcraw(buf, { extractThumbnail: true });
    console.timeEnd('dcraw')
    console.time('Blob')
    let blob = new Blob([thumbnail], { type: "image/jpeg" });
    imageUrl = URL.createObjectURL(blob);
    console.timeEnd('Blob')
    console.timeEnd('Image processing')

    var previewTile = createPreviewTile(imageUrl);
    image_grid.appendChild(previewTile);

    currentImages.push(pathToImage);
    currentPreviewTiles.push(previewTile);
}

function updateOpenFolders()
{
    open_folders_label.textContent = openFolders.join();
}

function openFolderDialog() 
{
    selectedFolder = dialog.showOpenDialogSync(electron.remote.getCurrentWindow(), {
        properties: ['openDirectory']
    })

    if( openFolders.includes(selectedFolder[0]))
    {
        return;
    }

    openFolders.push(selectedFolder[0]);
    fs.readdir(selectedFolder[0], (err, files) => {
        files
        .filter(file => file.endsWith(".ARW"))
        .map(jpg_file => addImageToGrid(path.join(selectedFolder[0], jpg_file)))

        folderImageIndices.push([currentImages.length, currentImages.length + files.length])
      });
    
      updateOpenFolders();
}
