import {
    AmbientLight,
    AxesHelper,
    DirectionalLight,
    GridHelper,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { IFCBUILDINGSTOREY } from "web-ifc";
import { IFCLoader } from "web-ifc-three";

//Creates the Three.js scene
const scene = new Scene();

//Object to store the size of the viewport
const size = {
    width: window.innerWidth,
    height: window.innerHeight,
};

//Creates the camera (point of view of the user)
const camera = new PerspectiveCamera(75, size.width / size.height);
camera.position.z = 15;
camera.position.y = 13;
camera.position.x = 8;

//Creates the lights of the scene
const lightColor = 0xffffff;

const ambientLight = new AmbientLight(lightColor, 0.5);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(lightColor, 2);
directionalLight.position.set(0, 10, 0);
scene.add(directionalLight);

//Sets up the renderer, fetching the canvas of the HTML
const threeCanvas = document.getElementById("three-canvas");
const renderer = new WebGLRenderer({ canvas: threeCanvas, alpha: true });
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Creates grids and axes in the scene
const grid = new GridHelper(50, 30);
scene.add(grid);

const axes = new AxesHelper();
axes.material.depthTest = false;
axes.renderOrder = 1;
scene.add(axes);

//Creates the orbit controls (to navigate the scene)
const controls = new OrbitControls(camera, threeCanvas);
controls.enableDamping = true;
controls.target.set(-2, 0, 0);

//Animation loop
const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};

animate();

//Adjust the viewport to the size of the browser
window.addEventListener("resize", () => {
    (size.width = window.innerWidth), (size.height = window.innerHeight);
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
});

// IFC loading
let model;
const loader = new IFCLoader();
const input = document.getElementById('file-input');
input.addEventListener('change', async () => {
    const file = input.files[0];
    const url = URL.createObjectURL(file);
    model = await loader.loadAsync(url);
    scene.add(model);
    await editFloorName();
})

async function editFloorName() {
    const storeysIDs = await loader.ifcManager.getAllItemsOfType(model.modelID, IFCBUILDINGSTOREY, false);
    const firstStoreyID = storeysIDs[0];
    const storey = await loader.ifcManager.getItemProperties(model.modelID, firstStoreyID);
    console.log("STOREY:");
    console.log(storey);

    const result = prompt("Enter new name for first storey");
    storey.LongName.value = result;
    storey.Name.value = result;
    loader.ifcManager.ifcAPI.WriteLine(model.modelID, storey);

    const data = loader.ifcManager.ifcAPI.ExportFileAsIFC(model.modelID);
    const blob = new Blob([data]);
    const file = new File([blob], "revised.ifc");
    
    const link = document.createElement('a');
    link.download = 'revised.ifc';
    link.href = URL.createObjectURL(file);
    document.body.appendChild(link);
    link.click();
    link.remove();
}