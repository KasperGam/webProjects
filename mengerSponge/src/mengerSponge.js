import * as THREE from 'three';
import { BufferGeometryUtils } from './geometryUtils';
import { TrackballControls } from './TrackballControls';

// init
const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
camera.position.z = 1;

const scene = new THREE.Scene();

const maxSize = 0.5

const cubeGeometries = generateCubeForLevel(4, 0, 0, 0, maxSize);

const geometry = BufferGeometryUtils.mergeBufferGeometries(cubeGeometries);
const material = new THREE.MeshNormalMaterial();

const mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );
mesh.rotation.x = Math.PI / 4;

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animation );
document.body.appendChild( renderer.domElement );

const controls = new TrackballControls( camera, document.body);


function generateCubeForLevel(level, tx, ty, tz, size) {
	const cubeGeometries = [];
	if (level === 0) {
		const cube = new THREE.BoxGeometry(size, size, size);
		cube.translate(tx, ty, tz);
		return [cube];
	}

	for(let x = -1; x <= 1; x++) {
		for(let y = -1; y <= 1; y++) {
			for(let z = -1; z <= 1; z++) {
				if ((Math.abs(x) + Math.abs(y) + Math.abs(z)) > 1) {
					const newSize = size / 3;
					const subCubes = generateCubeForLevel(level - 1, tx + x * newSize, ty + y * newSize, tz + z * newSize, newSize);
					cubeGeometries.push(...subCubes);
				}
			}
		}
	}

	return cubeGeometries;
}

// animation
function animation(time) {
	// mesh.rotation.x = time / 2000;
	// mesh.rotation.y = time / 2000;
	controls.update();
	renderer.render( scene, camera );
}