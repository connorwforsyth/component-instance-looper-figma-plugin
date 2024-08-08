figma.showUI(__html__, { width: 300, height: 600 });

// Function to update the UI with the current selection
async function updateSelection() {
  const selectedNodes = figma.currentPage.selection;

  if (selectedNodes.length !== 1 || selectedNodes[0].type !== "INSTANCE") {
    figma.ui.postMessage({
      type: "update-selection",
      componentName: null,
      properties: [],
    });
    return;
  }

  const instance = selectedNodes[0];
  
  const properties = Object.keys(instance.componentProperties)
    .filter((key) => instance.componentProperties[key].type === "TEXT")
    .map((key) => ({
      originalKey: key,
      cleanName: key.split("#")[0], // Clean the property name by removing the metadata
    }));

  figma.ui.postMessage({
    type: "update-selection",
    componentName: instance.name,
    properties,
  });
}

// Listen for selection changes and update the UI accordingly
figma.on("selectionchange", updateSelection);

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === "generate-instances") {
    handleGenerateInstances(msg.textList, msg.textProperty);
  }
};

// Function to handle generating instances based on the text list
async function handleGenerateInstances(textList: string, textProperty: string) {
  const lines: string[] = textList
    .split("\n")
    .filter((line: string) => line.trim() !== "");
  const selectedNodes = figma.currentPage.selection;

  if (selectedNodes.length !== 1 || selectedNodes[0].type !== "INSTANCE") {
    figma.notify("Please select a single component instance.");
    return;
  }

  const instance = selectedNodes[0];
  const instanceHeight = instance.height;
  const spacing = instanceHeight * 0.5;

  if (!textProperty) {
    figma.notify("Please select a text property.");
    return;
  }

  const newInstances: InstanceNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const newInstance = instance.clone();
    newInstance.y = instance.y + (instanceHeight + spacing) * (i + 1);
    newInstance.setProperties({ [textProperty]: lines[i] });
    figma.currentPage.appendChild(newInstance);
    newInstances.push(newInstance);
  }

  figma.currentPage.selection = newInstances;
  figma.viewport.scrollAndZoomIntoView(newInstances);
}

// Initial call to update the selection when the plugin is first loaded
updateSelection();
