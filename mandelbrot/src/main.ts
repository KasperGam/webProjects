import './style.css';
import * as THREE from 'three';
import { Vector2 } from 'three';

const appSection = document.getElementById("app") as HTMLDivElement;

const MY_VERTEX_SHADER = `
precision mediump float;
void main(){
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0);
}
`;

const MY_FRAGMENT_SHADER = `
precision mediump float;

const float maxSteps = 200.0;

uniform vec2 u_resolution;

uniform vec2 u_zoomCenter;

uniform float u_zoomSize;

vec2 f(vec2 z, vec2 c) {
	return (mat2(z.x, z.y, -z.y, z.x) * z) + c;
}

void main(){
  vec2 uv = gl_FragCoord.xy/u_resolution.xy;
  vec2 c = u_zoomCenter + (uv * 4.0 - vec2(2.0)) * (u_zoomSize / 4.0);

  vec2 z = vec2(0.0);

  float steps = 0.0;

  if ( length(z) > 2.0 ) {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    return;
  } else {
    for ( float i = 0.0; i < maxSteps; i++ ) {
      steps += 1.0;
      if (steps >= 10.0) {
        steps = 1.0;
      }
      z = f(z, c);
      if ( length(z) > 2.0 ) {
        gl_FragColor = vec4((10.0 - steps) / 10.0, 0.0, 0.0, 1.0);
        return;
      }
    }
  }
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1);
}
`

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

let ZOOM = 4.0;

const G_HEIGHT = 4;
const G_WIDTH = WIDTH/HEIGHT * G_HEIGHT;

const START_X = -(G_WIDTH - G_HEIGHT) / 2.0;

const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader: MY_VERTEX_SHADER,
  fragmentShader: MY_FRAGMENT_SHADER,
  uniforms: {
    u_resolution: {value: new Vector2(window.innerHeight, window.innerHeight)},
    u_zoomCenter: {value: new Vector2(START_X, 0.0)},
    u_zoomSize: {value: ZOOM},
  }
})

const scene = new THREE.Scene();
//const camera = new THREE.OrthographicCamera(-G_WIDTH / 2, G_WIDTH / 2, G_HEIGHT / 2, -G_HEIGHT / 2, 0.1, 5);
const camera = new THREE.PerspectiveCamera(80, window.innerHeight / window.innerWidth, 0.01, 50);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
appSection.appendChild( renderer.domElement );


const geometry = new THREE.PlaneBufferGeometry(G_WIDTH, G_HEIGHT, 1, 1);

//const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
const plane = new THREE.Mesh( geometry, shaderMaterial );
scene.add( plane );

camera.position.z = 2;

renderer.render( scene, camera );

let mouseDragOrigin: null | Vector2 = null;
let translationOrigin = new Vector2(START_X, 0.0);
let translation = new Vector2(START_X, 0.0);

let zoomingIn = false;
let zoomingOut = false;
let mouseZoomPoint = new Vector2(START_X, 0.0);

renderer.domElement.onmousedown = (event) => {
  // Left click only
  if (event.button === 0) {
    if (event.shiftKey) {
      zoomingOut = true;
    } else {
      zoomingIn = true;
    }
    const mult = ZOOM / HEIGHT;
    mouseZoomPoint.set(event.offsetX * mult - 2 + translation.x, event.offsetY * mult - 2 + translation.y);
  }
}

renderer.domElement.oncontextmenu = (event) => {
  event.preventDefault();
  mouseDragOrigin = new Vector2(event.offsetX, event.offsetY);
}

renderer.domElement.onmousemove = (event) => {
  if (mouseDragOrigin !== null) {
    const diffX = mouseDragOrigin.x - event.offsetX;
    const diffY = -(mouseDragOrigin.y - event.offsetY);

    const mult = ZOOM / HEIGHT;

    translation.set(translationOrigin.x + diffX * mult, translationOrigin.y + diffY * mult);
  }
}

renderer.domElement.onmouseup = () => {
  if (mouseDragOrigin !== null) {
    mouseDragOrigin = null;
    translationOrigin.set(translation.x, translation.y);
  }
  zoomingIn = false;
  zoomingOut = false;
}

renderer.domElement.onmouseleave = () => {
  if (mouseDragOrigin !== null) {
    mouseDragOrigin = null;
    translationOrigin.set(translation.x, translation.y);
  }
  zoomingIn = false;
  zoomingOut = false;
}

function animate() {
	requestAnimationFrame( animate );
  if (zoomingIn || zoomingOut) {
    const changeZoom = ZOOM * 0.01;
    ZOOM += zoomingIn ? -changeZoom : changeZoom;
    // TODO: Figure out how to set zoom position to zoom into where you clicked
    //translation.set(START_X - mouseZoomPoint.x, - mouseZoomPoint.y);
  }
  shaderMaterial.uniforms.u_zoomCenter.value = translation;
  shaderMaterial.uniforms.u_zoomSize.value = ZOOM;
	renderer.render( scene, camera );
}
animate();