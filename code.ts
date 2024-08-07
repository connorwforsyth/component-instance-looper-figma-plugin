figma.showUI(__html__, { width: 300, height: 500 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'refresh-selection') {
    const selectedNodes = figma.currentPage.selection;

    if (selectedNodes.length !== 1 || selectedNodes[0].type !== 'INSTANCE') {
      figma.notify('Please select a single component instance.');
      figma.ui.postMessage({ type: 'update-properties', properties: [] });
      return;
    }

    const instance = selectedNodes[0];
    const properties = Object.keys(instance.componentProperties).filter(key => instance.componentProperties[key].type === 'TEXT');
    figma.ui.postMessage({ type: 'update-properties', properties });
  }

  if (msg.type === 'generate-instances') {
    const textList: string[] = msg.textList.split('\n').filter((line: string) => line.trim() !== '');
    const selectedNodes = figma.currentPage.selection;

    if (selectedNodes.length !== 1 || selectedNodes[0].type !== 'INSTANCE') {
      figma.notify('Please select a single component instance.');
      return;
    }

    const instance = selectedNodes[0];
    const instanceHeight = instance.height;
    const spacing = instanceHeight * 0.3;
    const textProperty = msg.textProperty;

    if (!textProperty) {
      figma.notify('Please select a text property.');
      return;
    }

    const newInstances: InstanceNode[] = [];

    for (let i = 0; i < textList.length; i++) {
      const newInstance = instance.clone();
      newInstance.y = instance.y + (instanceHeight + spacing) * (i + 1);
      newInstance.setProperties({ [textProperty]: textList[i] });
      figma.currentPage.appendChild(newInstance);
      newInstances.push(newInstance);
    }

    figma.currentPage.selection = newInstances;
    figma.viewport.scrollAndZoomIntoView(newInstances);
  }
};
