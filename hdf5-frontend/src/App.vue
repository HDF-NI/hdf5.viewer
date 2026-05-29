<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Tree from 'primevue/tree';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

// Reactive variables
const hdf5TreeData = ref([]);
const selectedNode = ref(null);
const activeNodeInfo = ref(null);

const tableName = ref('Loading...');
const tableRows = ref([]);   // Holds the rows array data [1, 2]
const tableColumns = ref([]); // Holds the dynamically calculated headers [1, 2]
const isTableLoading = ref(false);

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
        await axios.post('http://localhost:8888/api/node-clicked', {
            absolutePath: absoluteH5Path,
            nodeType: node.type,
            name: node.text
        });
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
