export const parseCVATXML = (xmlString, startFrame = null, endFrame = null) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const parseError = xmlDoc.getElementsByTagName("parsererror");
  if (parseError.length > 0) {
    throw new Error("Invalid XML file structure. Could not parse.");
  }

  // Check if it's a valid CVAT format (usually root is <annotations>)
  const annotationsNode = xmlDoc.getElementsByTagName("annotations")[0];
  if (!annotationsNode) {
    throw new Error("Invalid CVAT XML: Missing <annotations> root element.");
  }

  const images = xmlDoc.getElementsByTagName("image");
  let totalImages = 0; // Will count based on range
  let annotatedImages = 0;

  const labelCounts = {};
  const faceAngles = {};
  const faceOcclusions = {};

  const shapeTypes = ['box', 'polygon', 'polyline', 'points', 'cuboid', 'ellipse'];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    // Extract frame number
    let frameNumber = parseInt(image.getAttribute('id'), 10);
    const nameAttr = image.getAttribute('name');
    if (nameAttr) {
      const match = nameAttr.match(/\d+/);
      if (match) {
        frameNumber = parseInt(match[0], 10);
      }
    }

    // Filter by frame range
    if (startFrame !== null && frameNumber < startFrame) continue;
    if (endFrame !== null && frameNumber > endFrame) continue;

    totalImages++;
    let hasAnnotations = false;

    shapeTypes.forEach(type => {
      const shapes = image.getElementsByTagName(type);
      for (let j = 0; j < shapes.length; j++) {
        hasAnnotations = true;
        const label = shapes[j].getAttribute('label');
        if (label) {
          labelCounts[label] = (labelCounts[label] || 0) + 1;
          
          if (label.toUpperCase() === 'FACE') {
            const attributes = shapes[j].getElementsByTagName('attribute');
            for (let k = 0; k < attributes.length; k++) {
              const attrName = attributes[k].getAttribute('name');
              const attrVal = attributes[k].textContent;
              if (attrName === 'Face Angle') {
                faceAngles[attrVal] = (faceAngles[attrVal] || 0) + 1;
              } else if (attrName === 'Occlusion') {
                faceOcclusions[attrVal] = (faceOcclusions[attrVal] || 0) + 1;
              }
            }
          }
        }
      }
    });

    if (hasAnnotations) {
      annotatedImages++;
    }
  }

  // Calculate grouped face metrics for known variations
  const groupedMetrics = {
    faces: 0,
    eyesLeft: 0,
    eyesRight: 0,
    noses: 0,
    mouthsLeft: 0,
    mouthsRight: 0,
    mouthsTotal: 0,
    eyesTotal: 0,
  };

  Object.entries(labelCounts).forEach(([label, count]) => {
    const lowerLabel = label.toLowerCase();
    
    // Face
    if (lowerLabel.includes('face')) {
      groupedMetrics.faces += count;
    }
    
    // Eyes
    if (lowerLabel.includes('eye')) {
      groupedMetrics.eyesTotal += count;
      if (lowerLabel.includes('left') || lowerLabel.endsWith('_l') || lowerLabel.endsWith(' l')) {
        groupedMetrics.eyesLeft += count;
      } else if (lowerLabel.includes('right') || lowerLabel.endsWith('_r') || lowerLabel.endsWith(' r')) {
        groupedMetrics.eyesRight += count;
      }
    }

    // Nose
    if (lowerLabel.includes('nose')) {
      groupedMetrics.noses += count;
    }

    // Mouth
    if (lowerLabel.includes('mouth')) {
      groupedMetrics.mouthsTotal += count;
      if (lowerLabel.includes('left') || lowerLabel.endsWith('_l') || lowerLabel.endsWith(' l') || lowerLabel.includes('corner_left')) {
        groupedMetrics.mouthsLeft += count;
      } else if (lowerLabel.includes('right') || lowerLabel.endsWith('_r') || lowerLabel.endsWith(' r') || lowerLabel.includes('corner_right')) {
        groupedMetrics.mouthsRight += count;
      }
    }
  });

  return {
    totalImages,
    annotatedImages,
    labelCounts,
    groupedMetrics,
    faceAngles,
    faceOcclusions
  };
};
