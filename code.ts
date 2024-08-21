figma.showUI(__html__, { width: 300, height: 550 });

// Function to update the UI with the current selection
async function updateSelection() {
  const selectedNodes = figma.currentPage.selection;

  if (
    selectedNodes.length === 0 ||
    selectedNodes.some((node) => node.type !== "INSTANCE")
  ) {
    figma.ui.postMessage({
      type: "update-selection",
      componentName: null,
      properties: [],
      selectionCount: selectedNodes.length,
    });
    return;
  }

  const instance = selectedNodes[0] as InstanceNode;

  if (instance.type !== "INSTANCE") {
    figma.ui.postMessage({
      type: "update-selection",
      componentName: null,
      properties: [],
      selectionCount: selectedNodes.length,
    });
    return;
  }

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
    selectionCount: selectedNodes.length,
  });
}

// Listen for selection changes and update the UI accordingly
figma.on("selectionchange", updateSelection);

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  console.log("Received message:", msg);
  if (msg.type === "generate-instances") {
    handleGenerateInstances(msg.textList, msg.textProperty);
  } else if (msg.type === "replace-text-instances") {
    handleReplaceTextInstances(msg.textList, msg.textProperty);
  }
};

// Function to handle generating instances based on the text list
async function handleGenerateInstances(textList: string, textProperty: string) {
  console.log("Handling generate instances:", { textList, textProperty });
  const lines: string[] = textList
    .split("\n")
    .filter((line: string) => line.trim() !== "");
  const selectedNodes = figma.currentPage.selection;

  console.log("Selected nodes:", selectedNodes);

  if (selectedNodes.length !== 1 || selectedNodes[0].type !== "INSTANCE") {
    figma.notify("Please select a single component instance.");
    return;
  }

  const instance = selectedNodes[0] as InstanceNode;
  const instanceHeight = instance.height;
  const spacing = instanceHeight * 0.5;

  if (!textProperty) {
    figma.notify("Please select a text property.");
    return;
  }

  const newInstances: InstanceNode[] = [];

  // Check if the instance is inside a frame
  const parent = instance.parent;
  if (
    (parent && parent.type === "FRAME") ||
    (parent && parent.type === "SECTION")
  ) {
    for (let i = 0; i < lines.length; i++) {
      const newInstance = instance.clone();
      newInstance.y = instance.y + (instanceHeight + spacing) * (i + 1);
      newInstance.setProperties({ [textProperty]: lines[i] });
      parent.appendChild(newInstance);
      newInstances.push(newInstance);
    }
  } else {
    for (let i = 0; i < lines.length; i++) {
      const newInstance = instance.clone();
      newInstance.y = instance.y + (instanceHeight + spacing) * (i + 1);
      newInstance.setProperties({ [textProperty]: lines[i] });
      figma.currentPage.appendChild(newInstance);
      newInstances.push(newInstance);
    }
  }

  figma.currentPage.selection = newInstances;
  figma.viewport.scrollAndZoomIntoView(newInstances);
  figma.notify(`Created ${newInstances.length} new instances.`);
}

// Function to handle replacing text within selected instances based on the text list
async function handleReplaceTextInstances(
  textList: string,
  textProperty: string
) {
  console.log("Handling replace text instances:", { textList, textProperty });
  const lines: string[] = textList
    .split("\n")
    .filter((line: string) => line.trim() !== "");
  const selectedNodes = figma.currentPage.selection;

  console.log("Selected nodes:", selectedNodes);

  if (
    selectedNodes.length === 0 ||
    selectedNodes.some((node) => node.type !== "INSTANCE")
  ) {
    figma.notify("Please select one or more component instances.");
    return;
  }

  if (lines.length !== selectedNodes.length) {
    figma.notify(
      "The number of lines in the text list does not match the number of selected instances."
    );
    return;
  }

  if (!textProperty) {
    figma.notify("Please select a text property.");
    return;
  }

  selectedNodes.forEach((node, index) => {
    if (node.type === "INSTANCE") {
      (node as InstanceNode).setProperties({ [textProperty]: lines[index] });
    }
  });

  figma.notify(`Text replaced in ${selectedNodes.length} selected instances.`);
}

// Initial call to update the selection when the plugin is first loaded
updateSelection();
