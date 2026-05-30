<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Tree from 'primevue/tree';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Image from 'primevue/image';

// Reactive variables
const hdf5TreeData = ref([]);
const hdf5ImageData = ref([]);
const selectedNode = ref(null);
const activeNodeInfo = ref(null);

const tableName = ref('Loading...');
const tableRows = ref([]);   // Holds the rows array data [1, 2]
const tableColumns = ref([]); // Holds the dynamically calculated headers [1, 2]
const isTableLoading = ref(false);
const imageSrc = ref('');

const metaData = {
  width: 512,  // Set to your true HDF5 image dimensions
  height: 512,
  planes: 4    // 3 for RGB, 4 for RGBA
};

let currentTileMeta = null;
let masterCanvas = null;
let masterContext = null;

// 1. Fetch your backend JSON structure when the app loads
onMounted(async () => {
    try {
        const response = await axios.get('http://localhost:8888/api/tree');
        hdf5TreeData.value = response.data;
    } catch (error) {
        console.error('Failed to load HDF5 dataset structure:', error);
    }
});

const buildAbsolutePath = (targetKey, nodes, currentPath = '') => {
    for (const node of nodes) {
        // Construct the structural segment path
        // Skip adding the root file name (like 'newone.h5') to the internal directory string
        const isRootFile = node.text.endsWith('.h5');
        const nextPath = isRootFile ? currentPath : `${currentPath}/${node.text}`;

        // If this node matches our selected key, return the accumulated path
        if (node.key === targetKey || node.text === targetKey) {
            return nextPath || '/';
        }

        // If it has children, search deeper recursively
        if (node.children) {
            const foundPath = buildAbsolutePath(targetKey, node.children, nextPath);
            if (foundPath) return foundPath;
        }
    }
    return null;
};

// 2. Trigger an event handler whenever a user clicks a node in the tree
const onNodeSelect = async (node) => {
    activeNodeInfo.value = node;
    console.log(`User clicked on node: ${node.text} (Type: ${node.type})`);
    
    const absoluteH5Path = buildAbsolutePath(node.text, hdf5TreeData.value);
    
    console.log(`Frontend calculated absolute path: ${absoluteH5Path}`);

    // 2. Fire the tracking event straight to your backend Koa API
    try {
        const response = await axios.post('http://localhost:8888/api/node-clicked', {
            absolutePath: absoluteH5Path,
            nodeType: node.type,
            name: node.text
        });
        hdf5ImageData.value = response.data; // Store the response for potential image rendering
        console.log('Backend response for node click:', response.data);
    } catch (error) {
        console.error('Failed to send tree click event to backend:', error);
    }
    if (node.type === 'table') {
        isTableLoading.value = true;
        tableName.value = 'Loading...';
        tableRows.value = [];   // Clear out previous table cache [1, 2]
        tableColumns.value = [];
        
        // 2. Open a dynamic WebSocket straight to your Koa table upgrade hook
        // Matches the same upgrade interceptor pattern as your image streaming module!
        const socketUrl = `ws://localhost:9001/read-table`;
        console.log(`Connecting spreadsheet pipeline to: ${socketUrl}`);
        
        const ws = new WebSocket(socketUrl);

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data);
          
          if (response.type === 'STREAM_COMPLETE') {
            console.log("🎉 Frontend successfully captured entire table structure!");
            currentTileMeta = null;
            ws = null; // Reset pointer cleanly
            return;
          }
          if (response.type === 'TABLE_DATA') {
            tableName.value = response.tableName;
            tableColumns.value = response.columns;
            tableRows.value = response.records; // Populate the row array here!
          }
        };

        ws.onclose = () => {
            console.log('Table data streaming completed.');
            isTableLoading.value = false;
        };

        ws.onerror = (error) => {
            console.error('Spreadsheet stream error:', error);
            isTableLoading.value = false;
        };
    }
    else if (node.type === 'image') {
  masterCanvas = null;
  masterContext = null;
  imageSrc.value = '';
         // Similar WebSocket logic for image streaming can be implemented here!
        console.log('Image node selected - implement image streaming logic here!');
        const socketUrl = `ws://localhost:9001/read-image-mosaic`;
        const ws = new WebSocket(socketUrl);
        ws.binaryType = 'arraybuffer';
        ws.onopen = () => {
          console.log(`Connected to image stream at: ${socketUrl}`);
            var j = 0;
        var tileXSize=hdf5ImageData.value.width;//Math.floor(hdf5ImageData.value.height/3);
        var tileYSize=hdf5ImageData.value.height;//Math.floor(hdf5ImageData.value.width/3);
        var offsetX=0;//Math.floor((hdf5ImageData.value.width-1)/2);
        var offsetY=0;//Math.floor((hdf5ImageData.value.height-1)/2);
        //ws.send(absoluteH5Path); // Send the absolute path to the backend to trigger the image stream
            const metaData = {start: [offsetY, offsetX, parseInt(0)], stride: [parseInt(1), parseInt(1), parseInt(1)], count: [tileYSize, tileXSize, parseInt(4)], boundary: [parseInt(5), parseInt(5)], imageWidth: parseInt(hdf5ImageData.value.width), imageHeight: parseInt(hdf5ImageData.value.height)};
            
            ws.send(JSON.stringify(metaData)); // Send metadata if needed for image assembly
        };
        ws.onmessage = async (event) => {
          // Handle incoming binary image data and convert to a displayable format
          console.log('Received image data chunk - implement image assembly logic here!');
          if(typeof event.data === 'string'){
            const msg = JSON.parse(event.data);
            if (msg.type === 'STREAM_COMPLETE') {
              console.log("🎉 Frontend successfully captured entire image plate mosaic structure!");
              currentTileMeta = null;
              ws = null; // Reset pointer cleanly
              return;
            }
            try {
              // Capture which tile/region this is (e.g., { x: 0, y: 0, width: 256, height: 256 })
              currentTileMeta = JSON.parse(event.data);
              //console.log('📌 Captured incoming tile context framework:', currentTileMeta);
            } catch (e) {
              console.error('Failed to parse tile text packet:', e);
            }
            return;
          }
          let rawBytes = null;

          if (event.data instanceof ArrayBuffer) {
            rawBytes = event.data;
          } 
          else if (event.data instanceof Blob) {
            // Convert the incoming browser Blob back into a standard raw ArrayBuffer block
          rawBytes = await event.data.arrayBuffer(); // Access the underlying ArrayBuffer from the Uint8Array
            //console.log(`🔄 Extracted ArrayBuffer from Blob frame carrier (${rawBytes.byteLength} bytes)`);
          }
          if (rawBytes && currentTileMeta) {
            if (!currentTileMeta) {
              //console.warn('⚠️ Received binary pixels without tile structural headers!');
              return;
            }
              if (!masterCanvas) {
                masterCanvas = document.createElement('canvas');
                masterCanvas.width = hdf5ImageData.value.width;   // e.g., 550
                masterCanvas.height = hdf5ImageData.value.height; // e.g., 381
                masterContext = masterCanvas.getContext('2d');
                console.log(`🖌️ Initialized master canvas for full image assembly: ${masterCanvas.width}x${masterCanvas.height}`);
            imageSrc.value = masterCanvas.toDataURL('image/png');
              }
            // 1. Create an offscreen canvas in memory (no DOM element required)
            const canvas = document.createElement('canvas');
            canvas.width = currentTileMeta.width;
            canvas.height = currentTileMeta.height;
            const context = canvas.getContext('2d');
            
            // 2. Initialize a blank image pixel buffer array
            const tileImageData = context.createImageData(currentTileMeta.width, currentTileMeta.height);
            const dv = new DataView(rawBytes);
            let pos = 0;
            const h5Planes = currentTileMeta.planes || 4; // Default to 4 if not specified
            
            console.log("vent.data.byteLength: ", rawBytes.byteLength);
            console.log("currentTileMeta.planes: ", currentTileMeta.planes);
            // 3. Your legacy C++ pixel assignment loop (optimized)
            for (let i = 0; i < rawBytes.byteLength; i += h5Planes) {
              const rVal = dv.getUint8(i);
              const gVal = dv.getUint8(i + 1);
              const bVal = dv.getUint8(i + 2);
              // Fetch native Alpha channel if available; fallback to 255 (completely opaque) if missing
              // const aVal = h5Planes > 3 ? dv.getUint8(i + 3) : 255;

              // 2. Assign values sequentially to HTML5 Canvas context array slots
              tileImageData.data[pos++] = rVal; // Channel 0: Red
              tileImageData.data[pos++] = gVal; // Channel 1: Green
              tileImageData.data[pos++] = bVal; // Channel 2: Blue
              // tileImageData.data[pos++] = aVal; // Channel 3: Alpha (CRITICAL: Do not skip this slot!)
              tileImageData.data[pos++] = 255; 

              // if (i < 5 * h5Planes) { // Log the first few pixels for verification
              //   const currentPixelIndex = (pos / 4) - 1; // Gives clean whole numbers: 0, 1, 2...
              //   console.log(`🎨 Pixel [${currentPixelIndex}]: R=${tileImageData.data[pos-4]}, G=${tileImageData.data[pos-3]}, B=${tileImageData.data[pos-2]}, A=${tileImageData.data[pos-1]}`);
              // }
            }
            
            // 4. Paint the pixel buffer to the memory surface
            context.putImageData(tileImageData, 0, 0);
            
            masterContext.drawImage(canvas, currentTileMeta.startX, currentTileMeta.startY);
            // 5. Convert the canvas surface to a clean Base64 source string
            imageSrc.value = masterCanvas.toDataURL('image/png');
            currentTileMeta = null; // Clear the tile meta after processing
          }
          else {
            const dataType = event.data instanceof ArrayBuffer 
              ? 'ArrayBuffer' 
              : event.data instanceof Blob 
                ? 'Blob' 
                : typeof event.data;

            console.warn(`Received non-binary message on image stream: ${dataType}`);
          }
        };
        ws.onclose = () => {
            console.log('Image data streaming completed.');
        };
        ws.onerror = (error) => {
            console.error('Image stream error:', error);
        };
        
    }
};

const onCellEditComplete = async (event) => {
    const { data, newValue, field } = event;
    data[field] = newValue; // Update local state [1, 2]
    
    // Optional: Fire a fast HTTP POST or WS message back to Koa to edit the .h5 binary file on disk!
    console.log(`Cell edited! Field: ${field}, New Value: ${newValue}`);
};

</script>

<template>
  <div class="app-workspace">
    <!-- LEFT PANEL: Interactive Tree Navigation -->
    <aside class="sidebar-panel">
      <div class="sidebar-header">
        <h3>HDF5 File Hierarchy</h3>
      </div>
      
      <!-- PrimeVue Tree natively reads your exact JSON structure layout! -->
      <Tree 
        :value="hdf5TreeData" 
        v-model:selectionKeys="selectedNode"
        selectionMode="single"
        @node-select="onNodeSelect"
        class="interactive-tree"
      >
        <!-- Customizing icons dynamically based on node.type -->
        <template #default="slotProps">
          <span class="tree-node">
            <span v-if="slotProps.node.type === 'group'">📁</span>
            <span v-else-if="slotProps.node.type === 'image'">🖼️</span>
            <span v-else-if="slotProps.node.type === 'table'">📊</span>
            <span v-else>📄</span>
            <span class="node-text">{{ slotProps.node.text }}</span>
          </span>
        </template>
      </Tree>
    </aside>

    <!-- RIGHT PANEL: Main Document View Display Space -->
    <main class="main-display-panel">
      <div v-if="activeNodeInfo?.type === 'table'" class="spreadsheet-view">
        <p v-if="isTableLoading && tableRows.length === 0" class="loading-prompt">
          Connecting to HDF5 binary stream...
        </p>
        
        <div class="viewer-window p-3 flex-1 overflow-auto">
        <template v-if="activeNodeInfo.type === 'table'">
        <!-- PrimeVue Data Grid - Fully Interactive and Sortable [1, 2] -->
        <DataTable 
          :value="tableRows" 
          stripedRows 
          paginator 
          :rows="10" 
          :rowsPerPageOptions="[10, 20, 50]"
          showGridlines
          resizableColumns
          columnResizeMode="fit"
          responsiveLayout="scroll"
          class="p-datatable-sm w-full font-mono text-sm"
        >
          <template #header>
            <div class="flex justify-between items-center p-2">
              <span class="text-xl font-bold font-sans">Dataset View: {{ tableName }}</span>
              <span class="text-sm bg-blue-50 text-blue-600 px-2 py-1 rounded font-sans">
                Total Records: {{ tableRows.length }}
              </span>
            </div>
          </template>
          
          <Column 
            v-for="col in tableColumns" 
            :key="col" 
            :field="col" 
            :header="col" 
            :sortable="true"
            class="min-w-[100px]"
          />
        </DataTable>
      </template>
      <!-- Native Image Array Component Placeholder -->
      <template v-else-if="activeNodeInfo.type === 'image'">
        <div class="p-4 bg-slate-100 text-center rounded border border-dashed">
          📷 Constructing binary image container component for HDF5 extraction...
        </div>
      </template>

      <!-- Neutral Empty State -->
      <template v-else>
        <div class="p-8 text-center text-slate-400">Select a dataset node to visualize raw matrix properties.</div>
      </template>
      </div>
      </div>
      <div v-if="activeNodeInfo?.type === 'image'" class="image-viewer mt-6">
        <Image 
          :src="imageSrc" 
          alt="HDF5 Extracted Matrix Plate" 
          preview 
          imageClass="rounded-lg shadow-md border max-w-full h-auto max-h-[500px]"
        >
          <!-- Fallback loader if image string is building -->
          <template #indicator v-if="!imageSrc">
            <i class="pi pi-spin pi-spinner text-2xl"></i>
          </template>
        </Image>
      </div>
      </main>
  </div>
</template>

<style scoped>
/* Full screen grid framework layout */
.app-workspace {
  display: grid;
  grid-template-columns: 320px 1fr;
  width: 100vw;
  height: 100vh;
  font-family: system-ui, sans-serif;
  color: #333;
}

/* Left sidebar panel layout styles */
.sidebar-panel {
  background-color: #f8f9fa;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: flex-direction;
  overflow-y: auto;
}
.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}
.sidebar-header h3 {
  margin: 0;
  font-size: 1.1rem;
}
.interactive-tree {
  border: none !important;
  background: transparent !important;
  padding: 0.5rem;
}
.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.node-text {
  font-size: 0.95rem;
}

/* Right display panel workspace styles */
.main-display-panel {
  padding: 2rem;
  background-color: #ffffff;
  overflow-y: auto;
}
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #868e96;
}
.viewer-window {
  margin-top: 2rem;
  border: 2px dashed #dee2e6;
  border-radius: 6px;
  padding: 3rem;
  text-align: center;
  color: #495057;
  background-color: #fcfcfc;
}
.meta-tag {
  color: #6c757d;
}
</style>
