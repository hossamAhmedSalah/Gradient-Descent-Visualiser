const themeToggle = document.getElementById('themeToggle');
let isDarkTheme = false;

themeToggle.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
    themeToggle.textContent = isDarkTheme ? '☀️' : '🌓';
    
    // Switch logos
    document.getElementById('ieeeLogo').style.display = isDarkTheme ? 'none' : 'block';
    document.getElementById('ieeeLogoDark').style.display = isDarkTheme ? 'block' : 'none';
    
    if (gradientSteps.length > 0) {
        drawVisualization();
    }
    
    if (renderer) {
        renderer.setClearColor(isDarkTheme ? 0x1a1a1a : 0xffffff, 1);
    }
});

function resizeCanvas() {
    const container = document.querySelector('.visualization-area');
    const containerWidth = container.clientWidth - 48; // Account for padding
    const containerHeight = Math.min(window.innerHeight * 0.7, containerWidth * 0.6);
    
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    if (gradientSteps.length > 0) {
        drawVisualization();
    }
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

const canvas = document.getElementById("plotCanvas");
const ctx = canvas.getContext("2d");

// Function to plot the user-defined function
function plotFunction(func) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.strokeStyle = isDarkTheme ? '#90CAF9' : '#2196F3';
  ctx.lineWidth = 2;

  for (let x = -10; x <= 10; x += 0.1) {
    const y = func(x);
    const plotX = (x + 10) * (canvas.width / 20); // Scale x to canvas width
    const plotY = canvas.height - (y + 100) * (canvas.height / 200); // Scale y to canvas height
    ctx.lineTo(plotX, plotY);
  }
  ctx.stroke();
}

let animationId = null;
let currentStep = 0;
let isPlaying = false;
let gradientSteps = [];
let currentFunc = null;  // Store current function
let currentGradient = null;  // Store current gradient

// Add new validation function
function validateInputs() {
    const learningRate = parseFloat(document.getElementById("learningRate").value);
    const iterations = parseInt(document.getElementById("iterations").value);
    
    if (isNaN(learningRate) || learningRate <= 0 || learningRate >= 1) {
        alert("Learning rate must be between 0 and 1");
        return false;
    }
    
    if (isNaN(iterations) || iterations < 1 || iterations > 100) {
        alert("Number of iterations must be between 1 and 100");
        return false;
    }
    
    return true;
}

function findValidStartingPoint(func) {
    // Try points across the visible range
    const points = [];
    for (let x = -10; x <= 10; x += 0.5) {
        try {
            const y = func(x);
            if (isFinite(y) && !isNaN(y) && Math.abs(y) < 100) {
                points.push({ x, y });
            }
        } catch (e) {
            continue;
        }
    }
    
    if (points.length === 0) {
        throw new Error('No valid starting points found');
    }
    
    // Pick a random point from valid points
    return points[Math.floor(Math.random() * points.length)].x;
}

// Add this new array to store all log entries
let logEntries = [];

function createLogEntry(step, x, y, gradient, learningRate) {
    return {
        step,
        x,
        y,
        html: `
            Step ${step + 1}: 
            x = ${x.toFixed(4)}, 
            f(x) = ${y.toFixed(4)}, 
            ∇f(x) = ${gradient.toFixed(4)}, 
            Δx = ${(-learningRate * gradient).toFixed(4)}
        `
    };
}

function updateLogs(step) {
    const logsContainer = document.getElementById('logsContainer');
    logsContainer.innerHTML = '';
    
    for (let i = 0; i <= step; i++) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.id = `log-${i}`;
        logEntry.innerHTML = logEntries[i].html;
        
        // Add click handler
        logEntry.addEventListener('click', () => {
            currentStep = i;
            drawVisualization();
        });
        
        logsContainer.appendChild(logEntry);
    }
    
    highlightCurrentLog(step);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

function highlightCurrentLog(step) {
    // Remove previous highlight
    document.querySelectorAll('.log-entry').forEach(entry => {
        entry.classList.remove('highlight');
    });
    
    // Add highlight to current step
    const currentLog = document.getElementById(`log-${step}`);
    if (currentLog) {
        currentLog.classList.add('highlight');
        currentLog.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function clearLogs() {
    const logsContainer = document.getElementById('logsContainer');
    logsContainer.innerHTML = '';
}

let is3DMode = false;
let scene, camera, renderer, controls;
let surface, gradientPath;
let currentFunc3D = null;

// Add these new variables for 3D animation
let currentGradientPath = null;
let gradientSpheres = [];
let lastVisibleSphereIndex = -1;

function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('plot3D'), 
        antialias: true,
        alpha: true 
    });
    renderer.setSize(canvas.width, canvas.height);
    renderer.setClearColor(isDarkTheme ? 0x1a1a1a : 0xffffff, 1);
    
    // Improved lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-5, -5, -5);
    scene.add(pointLight);
    
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;
    
    camera.position.set(15, 15, 15);
    controls.update();
    
    // Add coordinate axes
    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);
    
    // Add grid
    const gridHelper = new THREE.GridHelper(20, 20);
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);
}

function createSurface(func) {
    const geometry = new THREE.BufferGeometry();
    const resolution = 100; // Increased resolution
    const size = 20;
    
    const vertices = [];
    const colors = [];
    const indices = [];
    const uvs = []; // Add UV coordinates for better material mapping
    
    // Create vertices with smooth interpolation
    for (let i = 0; i <= resolution; i++) {
        const x = (i / resolution) * size - size/2;
        for (let j = 0; j <= resolution; j++) {
            const z = (j / resolution) * size - size/2;
            const y = func(x, z);
            
            vertices.push(x, y, z);
            
            // Enhanced color gradient
            const normalizedHeight = (y + 10) / 20;
            const color = new THREE.Color();
            color.setHSL(
                normalizedHeight * 0.3 + 0.6, // Hue
                0.7, // Saturation
                0.5 + normalizedHeight * 0.2 // Lightness varies with height
            );
            colors.push(color.r, color.g, color.b);
            
            // Add UV coordinates
            uvs.push(i / resolution, j / resolution);
        }
    }
    
    // Create triangles
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            const a = i * (resolution + 1) + j;
            const b = a + 1;
            const c = a + (resolution + 1);
            const d = c + 1;
            
            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    // Enhanced material with better visual effects
    const material = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        vertexColors: true,
        shininess: 50,
        specular: 0x444444,
        flatShading: false,
        transparent: true,
        opacity: 0.9
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add enhanced wireframe
    const wireframe = new THREE.LineSegments(
        new THREE.WireframeGeometry(geometry),
        new THREE.LineBasicMaterial({
            color: isDarkTheme ? 0x404040 : 0x000000,
            transparent: true,
            opacity: 0.1,
            linewidth: 1
        })
    );
    mesh.add(wireframe);
    
    return mesh;
}

function createGradientPath(steps) {
    // Remove existing path and spheres
    if (currentGradientPath) scene.remove(currentGradientPath);
    gradientSpheres.forEach(sphere => scene.remove(sphere));
    gradientSpheres = [];
    
    // Create the path line
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 3,
        transparent: true,
        opacity: 0.8
    });
    
    currentGradientPath = new THREE.Line(geometry, material);
    scene.add(currentGradientPath);
    
    // Create spheres for each step
    const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    
    steps.forEach((step, index) => {
        const sphereMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.0,
            shininess: 100
        });
        
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(step.x, step.z, step.y);
        sphere.visible = false;
        
        scene.add(sphere);
        gradientSpheres.push(sphere);
    });
    
    return currentGradientPath;
}

function animate3D() {
    if (!is3DMode) return;
    
    requestAnimationFrame(animate3D);
    controls.update();
    
    // Update gradient path visibility based on current step
    if (gradientSpheres.length > 0 && isPlaying) {
        updateGradientPathVisibility();
    }
    
    renderer.render(scene, camera);
}

function updateGradientPathVisibility() {
    if (lastVisibleSphereIndex === currentStep) return;
    
    // Show spheres up to current step
    gradientSpheres.forEach((sphere, index) => {
        sphere.visible = index <= currentStep;
        if (index < currentStep) {
            sphere.material.opacity = 1.0;
        } else if (index === currentStep) {
            sphere.material.opacity = 1.0;
            sphere.material.color.setHex(0xff0000);
        }
    });
    
    // Update path geometry
    if (currentGradientPath) {
        const visiblePoints = gradientSteps
            .slice(0, currentStep + 1)
            .map(step => new THREE.Vector3(step.x, step.z, step.y));
            
        currentGradientPath.geometry.setFromPoints(visiblePoints);
        currentGradientPath.geometry.verticesNeedUpdate = true;
    }
    
    lastVisibleSphereIndex = currentStep;
}

document.getElementById('toggleDimension').addEventListener('click', function() {
    stopAnimation(); // Stop any ongoing animation
    is3DMode = !is3DMode;
    
    const plot2D = document.getElementById('plotCanvas');
    const plot3D = document.getElementById('plot3D');
    this.querySelector('span').textContent = is3DMode ? 'Switch to 2D' : 'Switch to 3D';
    
    if (is3DMode) {
        plot2D.style.display = 'none';
        plot3D.style.display = 'block';
        if (!scene) init3D();
        animate3D();
    } else {
        plot2D.style.display = 'block';
        plot3D.style.display = 'none';
        drawVisualization();
    }
    
    if (currentFunc || currentFunc3D) {
        initializeGradientDescent();
    }
});

function initializeGradientDescent() {
    if (!validateInputs()) return;
    
    clearLogs();
    currentStep = 0;
    logEntries = [];
    
    const functionInput = document.getElementById("functionInput").value;
    const learningRate = parseFloat(document.getElementById("learningRate").value);
    const iterations = parseInt(document.getElementById("iterations").value);
    
    try {
        if (is3DMode) {
            // Parse 3D function
            if (functionInput.includes('=>')) {
                currentFunc3D = eval(functionInput);
            } else {
                currentFunc3D = new Function('x', 'y', `return ${functionInput};`);
            }
            
            // Create numerical gradient for 3D
            const h = 0.0001;
            currentGradient = (x, y) => ({
                x: (currentFunc3D(x + h, y) - currentFunc3D(x, y)) / h,
                y: (currentFunc3D(x, y + h) - currentFunc3D(x, y)) / h
            });
            
            // Find valid starting point for 3D
            const startPoint = findValidStartingPoint3D(currentFunc3D);
            let x = startPoint.x;
            let y = startPoint.y;
            gradientSteps = [];
            
            for (let i = 0; i < iterations; i++) {
                const z = currentFunc3D(x, y);
                const grad = currentGradient(x, y);
                
                gradientSteps.push({ x, y, z, step: i });
                logEntries.push(createLogEntry3D(i, x, y, z, grad, learningRate));
                
                x = x - learningRate * grad.x;
                y = y - learningRate * grad.y;
                
                if (Math.abs(x) > 10 || Math.abs(y) > 10 || Math.abs(z) > 100) {
                    break;
                }
            }
            
            // Update 3D visualization
            if (surface) scene.remove(surface);
            if (gradientPath) scene.remove(gradientPath);
            
            surface = createSurface(currentFunc3D);
            gradientPath = createGradientPath(gradientSteps);
            
            scene.add(surface);
            scene.add(gradientPath);
            
        } else {
            // 2D initialization
            currentFunc = new Function("x", `return ${functionInput};`);
            
            // Find valid starting point for 2D
            const startX = findValidStartingPoint(currentFunc);
            let x = startX;
            gradientSteps = [];
            
            // Create gradient function
            const h = 0.0001;
            currentGradient = x => {
                try {
                    return (currentFunc(x + h) - currentFunc(x)) / h;
                } catch {
                    return 0;
                }
            };
            
            for (let i = 0; i < iterations; i++) {
                const y = currentFunc(x);
                const grad = currentGradient(x);
                
                if (!isFinite(y) || !isFinite(grad)) {
                    break;
                }
                
                gradientSteps.push({ x, y, step: i });
                logEntries.push(createLogEntry(i, x, y, grad, learningRate));
                x = x - learningRate * grad;
                
                if (Math.abs(x) > 10 || Math.abs(y) > 100) {
                    break;
                }
            }
        }
        
        // Reset state and update visualization
        currentStep = 0;
        isPlaying = false;
        stopAnimation();
        
        if (is3DMode) {
            animate3D();
        } else {
            drawVisualization();
        }
        
        updateLogs(0);
        
    } catch (e) {
        console.error(e);
        alert("Could not initialize gradient descent. Try a different function or starting point.");
    }
}

function createLogEntry3D(step, x, y, z, gradient, learningRate) {
    return {
        step,
        x,
        y,
        z,
        html: `
            Step ${step + 1}: 
            x = ${x.toFixed(4)}, 
            y = ${y.toFixed(4)}, 
            f(x,y) = ${z.toFixed(4)}, 
            ∇f = (${gradient.x.toFixed(4)}, ${gradient.y.toFixed(4)})
        `
    };
}

function drawVisualization() {
    if (!currentFunc) return;
    
    try {
        // Clear and draw function
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        plotFunction(currentFunc);
        
        // Draw gradient steps
        if (gradientSteps.length > 0) {
            for (let i = 0; i <= currentStep; i++) {
                drawStep(i);
            }
            
            // Update info panel
            if (currentStep < gradientSteps.length) {
                const current = gradientSteps[currentStep];
                document.getElementById("currentX").textContent = current.x.toFixed(4);
                document.getElementById("currentY").textContent = current.y.toFixed(4);
                document.getElementById("currentStep").textContent = currentStep + 1;
            }
        }
        
        // Update logs to match current step
        updateLogs(currentStep);
    } catch (e) {
        console.error(e);
    }
}

function drawStep(stepIndex) {
    if (stepIndex >= gradientSteps.length) return;
    
    const current = gradientSteps[stepIndex];
    const next = gradientSteps[stepIndex + 1];
    
    const plotX = (current.x + 10) * (canvas.width / 20);
    const plotY = canvas.height - (current.y + 100) * (canvas.height / 200);
    
    // Draw point
    ctx.beginPath();
    ctx.arc(plotX, plotY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = stepIndex === currentStep 
        ? (isDarkTheme ? '#81C784' : '#4CAF50')
        : (isDarkTheme ? 'rgba(129, 199, 132, 0.3)' : 'rgba(76, 175, 80, 0.3)');
    ctx.fill();
    
    // Draw arrow to next point if available
    if (next) {
        const nextPlotX = (next.x + 10) * (canvas.width / 20);
        const nextPlotY = canvas.height - (next.y + 100) * (canvas.height / 200);
        
        ctx.beginPath();
        ctx.moveTo(plotX, plotY);
        ctx.lineTo(nextPlotX, nextPlotY);
        ctx.strokeStyle = "green";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Event Listeners
document.getElementById("playPauseBtn").addEventListener("click", () => {
    if (!gradientSteps.length) {
        initializeGradientDescent();
        return;
    }
    
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        // Reset if at end
        if (currentStep >= gradientSteps.length - 1) {
            currentStep = 0;
        }
        document.getElementById("playPauseBtn").innerHTML = '<i class="fas fa-pause"></i>';
        lastAnimationTime = 0;
        animate(performance.now());
    } else {
        stopAnimation();
    }
});

document.getElementById("resetBtn").addEventListener("click", () => {
    stopAnimation();
    
    // Reinitialize with new random starting point
    if (currentFunc || currentFunc3D) {
        initializeGradientDescent();
    } else {
        clearLogs();
        currentStep = 0;
        lastAnimationTime = 0;
        drawVisualization();
    }
});

document.getElementById("stepBtn").addEventListener("click", () => {
    if (!gradientSteps.length) {
        initializeGradientDescent();
        return;
    }
    
    stopAnimation(); // Ensure animation is stopped
    
    if (currentStep < gradientSteps.length - 1) {
        currentStep++;
        updateVisualization();
    }
});

window.addEventListener('load', () => {
    resizeCanvas();
    initializeGradientDescent();
});

// Add input handler for live preview
document.getElementById("functionInput").addEventListener("input", (e) => {
    try {
        if (is3DMode) {
            // Try to parse 3D function
            let func;
            if (e.target.value.includes('=>')) {
                func = eval(e.target.value);
            } else {
                func = new Function('x', 'y', `return ${e.target.value};`);
            }
            
            // Test the function
            if (isFinite(func(0, 0))) {
                if (surface) scene.remove(surface);
                surface = createSurface(func);
                scene.add(surface);
            }
        } else {
            // Existing 2D preview code
            const func = new Function("x", `return ${e.target.value};`);
            plotFunction(func);
        }
        
        // Clear current state
        currentFunc = null;
        currentFunc3D = null;
        currentGradient = null;
        gradientSteps = [];
        currentStep = 0;
        clearLogs();
        stopAnimation();
    } catch (e) {
        console.error(e);
    }
});

// Also add an event listener for iterations input
document.getElementById("iterations").addEventListener("change", () => {
    if (currentFunc) {
        initializeGradientDescent(); // Restart with new iteration count
    }
});

// Add these animation control variables at the top
let animationFrameId = null;
let lastAnimationTime = 0;
const ANIMATION_INTERVAL = 300; // Animation speed in milliseconds

// Replace the animate function with this unified version
function animate(timestamp) {
    if (!isPlaying) {
        cancelAnimationFrame(animationFrameId);
        return;
    }

    animationFrameId = requestAnimationFrame(animate);

    // Control animation timing
    if (!lastAnimationTime || timestamp - lastAnimationTime >= ANIMATION_INTERVAL) {
        lastAnimationTime = timestamp;
        
        if (currentStep < gradientSteps.length - 1) {
            currentStep++;
            updateVisualization();
        } else {
            stopAnimation();
        }
    }
}

// Add this helper function to update visualizations
function updateVisualization() {
    if (is3DMode) {
        updateGradientPathVisibility();
    } else {
        drawVisualization();
    }
    
    // Update info panel
    if (currentStep < gradientSteps.length) {
        const current = gradientSteps[currentStep];
        document.getElementById("currentX").textContent = current.x.toFixed(4);
        document.getElementById("currentY").textContent = is3DMode ? current.y.toFixed(4) : current.y.toFixed(4);
        document.getElementById("currentStep").textContent = currentStep + 1;
    }
    
    updateLogs(currentStep);
}

// Update the stopAnimation function
function stopAnimation() {
    isPlaying = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    lastAnimationTime = 0;
    document.getElementById("playPauseBtn").innerHTML = '<i class="fas fa-play"></i>';
}

// Add PDF export function
function exportLogsToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header with logo and title (unchanged)
    try {
        const logoImg = document.getElementById('ieeeLogo');
        const logoAspectRatio = logoImg.naturalWidth / logoImg.naturalHeight;
        const logoHeight = 7;
        const logoWidth = logoHeight * logoAspectRatio;
        
        // Always use light theme logo for PDF
        doc.addImage('./logo ieee (1).png', 'PNG', 
            doc.internal.pageSize.width - logoWidth - 10,
            5,
            logoWidth, 
            logoHeight
        );
    } catch (e) {
        console.error('Error loading logo:', e);
    }
    
    // Header section
    doc.setFillColor(33, 150, 243);
    doc.rect(0, 0, doc.internal.pageSize.width, 3, 'F');
    
    doc.setFontSize(20);
    doc.setTextColor(33, 150, 243);
    doc.text('Gradient Descent Analysis', 15, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('IEEE FCIH Student Branch', 15, 20);
    
    let currentY = 30;
    
    // Function section first
    doc.setDrawColor(33, 150, 243);
    doc.roundedRect(15, currentY, doc.internal.pageSize.width - 30, 40, 3, 3);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 118, 210);
    doc.setFontSize(12);
    doc.text('Optimization Problem', 20, currentY + 10);
    
    doc.setFont('courier', 'normal');
    doc.text(`Function: f(x) = ${document.getElementById("functionInput").value}`, 25, currentY + 20);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Update Rule:', 25, currentY + 30);
    doc.setFont('courier', 'normal');
    doc.text('x_next = x_current - (learning_rate * gradient)', 25, currentY + 35);
    
    // Parameters section
    currentY += 50;
    doc.roundedRect(15, currentY, doc.internal.pageSize.width - 30, 35, 3, 3);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 118, 210);
    doc.text('Parameters', 20, currentY + 10);
    
    // Parameter values
    const params = [
        ['Learning Rate:', document.getElementById("learningRate").value],
        ['Total Iterations:', document.getElementById("iterations").value],
        ['Generated on:', new Date().toLocaleString()]
    ];
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    params.forEach((param, i) => {
        doc.setTextColor(60);
        doc.text(param[0], 25, currentY + 20 + (i * 7));
        doc.setTextColor(0);
        doc.text(param[1], 80, currentY + 20 + (i * 7));
    });
    
    currentY += 45;
    
    // Add visualization plot - now handles both 2D and 3D
    try {
        let plotImage;
        if (is3DMode) {
            // Capture WebGL canvas
            const canvas = document.getElementById('plot3D');
            // Force a render to ensure latest state
            renderer.render(scene, camera);
            plotImage = canvas.toDataURL('image/png');
        } else {
            const canvas = document.getElementById('plotCanvas');
            plotImage = canvas.toDataURL('image/png');
        }
        
        const margin = 15;
        const plotWidth = doc.internal.pageSize.width - (2 * margin);
        const plotHeight = 60;
        
        doc.addImage(plotImage, 'PNG', margin, currentY, plotWidth, plotHeight);
        doc.setDrawColor(33, 150, 243);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin, currentY, plotWidth, plotHeight, 3, 3);
        
        currentY += plotHeight + 10;
    } catch (e) {
        console.error('Error adding plot:', e);
    }
    
    // Modify table headers and data for 3D
    const headers = is3DMode ? 
        ['Step', 'x', 'y', 'f(x,y)', 'gradient'] :
        ['Step', 'x', 'f(x)', 'gradient', 'change'];
    
    // Results table with header
    doc.setFontSize(12);
    doc.setTextColor(25, 118, 210);
    doc.setFont('helvetica', 'bold');
    doc.text('Optimization Progress', 20, currentY);
    
    // Table headers
    currentY += 10;
    
    // Header background
    doc.setFillColor(33, 150, 243);
    doc.rect(15, currentY - 6, 180, 8, 'F');
    
    // Header text
    doc.setTextColor(255); // White text for header
    doc.setFontSize(10);
    headers.forEach((header, i) => {
        doc.text(header, 20 + (i * 36), currentY);
    });
    
    currentY += 7; // Add space after header
    
    // Table data rows
    doc.setFontSize(9);
    logEntries.forEach((entry, i) => {
        currentY += 7;
        
        if (currentY > 280) {
            doc.addPage();
            currentY = 30;
            // Repeat header on new page
            doc.setFillColor(33, 150, 243);
            doc.rect(15, currentY - 6, 180, 8, 'F');
            doc.setTextColor(255);
            headers.forEach((header, j) => {
                doc.text(header, 20 + (j * 36), currentY);
            });
            currentY += 7;
        }
        
        if (i % 2 === 0) {
            doc.setFillColor(240, 247, 255);
            doc.rect(15, currentY - 5, 180, 7, 'F');
        }
        
        const step = gradientSteps[i];
        let rowData;
        
        if (is3DMode) {
            const nextStep = gradientSteps[i + 1];
            const gradientX = nextStep ? 
                ((step.x - nextStep.x) / parseFloat(document.getElementById("learningRate").value)).toFixed(4) : '0.0000';
            const gradientY = nextStep ? 
                ((step.y - nextStep.y) / parseFloat(document.getElementById("learningRate").value)).toFixed(4) : '0.0000';
            
            rowData = [
                (i + 1).toString(),
                step.x.toFixed(4),
                step.y.toFixed(4),
                step.z.toFixed(4),
                `(${gradientX}, ${gradientY})`
            ];
        } else {
            const gradient = ((step.x - (gradientSteps[i + 1]?.x || step.x)) / 
                            parseFloat(document.getElementById("learningRate").value));
            const change = -gradient * parseFloat(document.getElementById("learningRate").value);
            
            rowData = [
                (i + 1).toString(),
                step.x.toFixed(4),
                step.y.toFixed(4),
                gradient.toFixed(4),
                change.toFixed(4)
            ];
        }
        
        doc.setTextColor(0);
        doc.setFont('courier', 'normal');
        rowData.forEach((text, j) => {
            doc.text(text, 20 + (j * 36), currentY);
        });
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Generated by IEEE FCIH Gradient Descent Visualizer', 15, doc.internal.pageSize.height - 10);
    doc.text('github.com/IEEE-FCIH-SB', doc.internal.pageSize.width - 70, doc.internal.pageSize.height - 10);
    
    // Save PDF
    const filename = `gradient_descent_analysis_${Date.now()}.pdf`;
    doc.save(filename);
}

// Ensure we render the scene before export in 3D mode
document.getElementById("exportBtn").addEventListener("click", () => {
    if (is3DMode) {
        // Force a render to ensure the latest state
        renderer.render(scene, camera);
        // Small delay to ensure render is complete
        setTimeout(exportLogsToPDF, 100);
    } else {
        exportLogsToPDF();
    }
});

// Remove parser-related event listeners and keep only the basic ones
document.getElementById("functionInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        initializeGradientDescent();
    }
});

// Add window resize handler for 3D
window.addEventListener('resize', () => {
    if (is3DMode && renderer) {
        const container = document.querySelector('.visualization-area');
        const width = container.clientWidth - 48;
        const height = Math.min(window.innerHeight * 0.7, width * 0.6);
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
});

// Add new function for 3D starting point
function findValidStartingPoint3D(func) {
    const points = [];
    for (let x = -5; x <= 5; x += 0.5) {
        for (let y = -5; y <= 5; y += 0.5) {
            try {
                const z = func(x, y);
                if (isFinite(z) && !isNaN(z) && Math.abs(z) < 100) {
                    points.push({ x, y, z });
                }
            } catch (e) {
                continue;
            }
        }
    }
    
    if (points.length === 0) {
        throw new Error('No valid starting points found');
    }
    
    return points[Math.floor(Math.random() * points.length)];
}