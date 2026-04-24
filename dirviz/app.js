const zipInput = document.getElementById("zipInput");
const dropZone = document.querySelector(".drop-zone");
const graphSvg = d3.select("#graph");
const emptyState = document.getElementById("emptyState");
const inspector = document.getElementById("inspector");
const stats = document.getElementById("stats");
const resetBtn = document.getElementById("resetBtn");
const collapseBtn = document.getElementById("collapseBtn");

let fullGraph = { nodes: [], links: [] };
let currentGraph = { nodes: [], links: [] };
let collapsedFolders = new Set();
let simulation;

const typeColors = {
  folder: "#60a5fa",
  code: "#34d399",
  image: "#f97316",
  doc: "#a78bfa",
  other: "#d1d5db"
};

zipInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file) await loadZip(file);
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragover");

  const file = event.dataTransfer.files[0];
  if (file && file.name.toLowerCase().endsWith(".zip")) {
    await loadZip(file);
  } else {
    alert("Please drop a .zip file.");
  }
});

resetBtn.addEventListener("click", () => {
  collapsedFolders.clear();
  currentGraph = cloneVisibleGraph();
  renderGraph(currentGraph);
});

collapseBtn.addEventListener("click", () => {
  collapsedFolders = new Set(
    fullGraph.nodes
      .filter(node => node.type === "folder" && node.depth >= 1)
      .map(node => node.id)
  );
  currentGraph = cloneVisibleGraph();
  renderGraph(currentGraph);
});

async function loadZip(file) {
  emptyState.classList.add("hidden");
  inspector.innerHTML = `<p>Loading <strong>${file.name}</strong>...</p>`;

  try {
    const zip = await JSZip.loadAsync(file);
    fullGraph = buildGraphFromZip(zip, file.name.replace(/\.zip$/i, ""));
    collapsedFolders.clear();
    currentGraph = cloneVisibleGraph();

    updateStats(fullGraph);
    renderGraph(currentGraph);

    inspector.innerHTML = `
      <p><strong>${file.name}</strong> loaded.</p>
      <p>Click any node to inspect it. Double-click a folder node to collapse or expand it.</p>
    `;
  } catch (error) {
    console.error(error);
    inspector.innerHTML = `<p>Could not read that ZIP file.</p>`;
  }
}

function buildGraphFromZip(zip, rootName) {
  const nodeMap = new Map();
  const links = [];
  let totalSize = 0;

  addNode({
    id: rootName,
    name: rootName,
    path: rootName,
    type: "folder",
    extension: "",
    size: 0,
    depth: 0
  });

  Object.values(zip.files).forEach(entry => {
    const cleanPath = entry.name.replace(/^\/+|\/+$/g, "");
    if (!cleanPath) return;

    const parts = cleanPath.split("/");
    let parentId = rootName;
    let runningPath = rootName;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const isFolder = !isLast || entry.dir;
      runningPath += "/" + part;

      if (!nodeMap.has(runningPath)) {
        const extension = getExtension(part);
        const size = isFolder ? 0 : entry._data?.uncompressedSize || 0;

        addNode({
          id: runningPath,
          name: part,
          path: runningPath,
          type: isFolder ? "folder" : getFileType(extension),
          extension,
          size,
          depth: index + 1
        });

        links.push({
          source: parentId,
          target: runningPath
        });

        if (!isFolder) totalSize += size;
      }

      parentId = runningPath;
    });
  });

  const graph = {
    nodes: Array.from(nodeMap.values()),
    links
  };

  graph.nodes.forEach(node => {
    node.childCount = graph.links.filter(link => link.source === node.id).length;
    node.totalSize = totalSize;
  });

  return graph;

  function addNode(node) {
    nodeMap.set(node.id, node);
  }
}

function getExtension(fileName) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function getFileType(extension) {
  const code = ["html", "css", "js", "java", "py", "cpp", "c", "cs", "json", "xml", "md", "php", "rb", "ts"];
  const images = ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"];
  const docs = ["pdf", "doc", "docx", "txt", "rtf", "ppt", "pptx", "xls", "xlsx"];

  if (code.includes(extension)) return "code";
  if (images.includes(extension)) return "image";
  if (docs.includes(extension)) return "doc";
  return "other";
}

function cloneVisibleGraph() {
  const hiddenIds = new Set();

  collapsedFolders.forEach(folderId => {
    collectDescendants(folderId).forEach(id => hiddenIds.add(id));
  });

  const nodes = fullGraph.nodes
    .filter(node => !hiddenIds.has(node.id))
    .map(node => ({ ...node }));

  const nodeIds = new Set(nodes.map(node => node.id));

  const links = fullGraph.links
    .filter(link => nodeIds.has(link.source) && nodeIds.has(link.target))
    .map(link => ({ ...link }));

  return { nodes, links };
}

function collectDescendants(folderId) {
  const descendants = [];
  const children = fullGraph.links
    .filter(link => link.source === folderId)
    .map(link => link.target);

  children.forEach(childId => {
    descendants.push(childId);
    descendants.push(...collectDescendants(childId));
  });

  return descendants;
}

function renderGraph(graph) {
  graphSvg.selectAll("*").remove();

  const svgNode = graphSvg.node();
  const width = svgNode.clientWidth || 900;
  const height = svgNode.clientHeight || 650;

  graphSvg
    .attr("viewBox", [0, 0, width, height])
    .call(
      d3.zoom().on("zoom", (event) => {
        container.attr("transform", event.transform);
      })
    );

  const container = graphSvg.append("g");

  simulation = d3.forceSimulation(graph.nodes)
    .force("link", d3.forceLink(graph.links).id(d => d.id).distance(d => {
      const targetDepth = d.target.depth || 1;
      return Math.max(55, 120 - targetDepth * 8);
    }))
    .force("charge", d3.forceManyBody().strength(-260))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => getRadius(d) + 10));

  const link = container.append("g")
    .selectAll("line")
    .data(graph.links)
    .join("line")
    .attr("class", "link");

  const node = container.append("g")
    .selectAll("g")
    .data(graph.nodes)
    .join("g")
    .attr("class", "node")
    .call(drag(simulation));

  node.append("circle")
    .attr("r", getRadius)
    .attr("fill", d => typeColors[d.type] || typeColors.other)
    .on("click", (event, d) => showInspector(d))
    .on("dblclick", (event, d) => {
      if (d.type !== "folder") return;

      if (collapsedFolders.has(d.id)) {
        collapsedFolders.delete(d.id);
      } else {
        collapsedFolders.add(d.id);
      }

      currentGraph = cloneVisibleGraph();
      renderGraph(currentGraph);
    });

  node.append("text")
    .attr("x", d => getRadius(d) + 6)
    .attr("y", 4)
    .text(d => shortenName(d.name, 24));

  node.append("title")
    .text(d => d.path);

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });
}

function getRadius(node) {
  if (node.type === "folder") {
    return Math.min(22, 10 + node.childCount * 1.2);
  }

  if (node.size > 5000000) return 11;
  if (node.size > 1000000) return 9;
  return 7;
}

function shortenName(name, maxLength) {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 1) + "…";
}

function showInspector(node) {
  inspector.innerHTML = `
    <p><strong>Name:</strong> ${escapeHtml(node.name)}</p>
    <p><strong>Type:</strong> ${node.type}</p>
    <p><strong>Extension:</strong> ${node.extension || "none"}</p>
    <p><strong>Size:</strong> ${formatBytes(node.size)}</p>
    <p><strong>Children:</strong> ${node.childCount || 0}</p>
    <p><strong>Depth:</strong> ${node.depth}</p>
    <p><strong>Path:</strong></p>
    <code>${escapeHtml(node.path)}</code>
  `;
}

function updateStats(graph) {
  const fileCount = graph.nodes.filter(node => node.type !== "folder").length;
  const folderCount = graph.nodes.filter(node => node.type === "folder").length;
  const totalSize = graph.nodes.reduce((sum, node) => sum + (node.size || 0), 0);

  stats.innerHTML = `
    <p><strong>Files:</strong> ${fileCount}</p>
    <p><strong>Folders:</strong> ${folderCount}</p>
    <p><strong>Total Size:</strong> ${formatBytes(totalSize)}</p>
  `;
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function drag(simulation) {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}
