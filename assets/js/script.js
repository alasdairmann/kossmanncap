/* ============================================
   THREE.JS INTERACTIVE DOT PATTERN
   ============================================ */

// ============================================
// CONFIGURATION CONSTANTS
// ============================================
const CONFIG = {
  // Animation settings
  ANIMATION_SPEED: 0.05,

  // Dot pattern settings
  GRID_SIZE: 60,
  SPACING: 0.4,
  SPHERE_RADIUS: 0.02,
  SPHERE_DETAIL: { width: 32, height: 24 },

  // Mouse interaction settings
  MAX_DISTANCE: 8,
  MAX_Z: 3,
  MIN_Z: -3,
  MOUSE_WORLD_SCALE: 10,

  // Opacity settings
  MIN_OPACITY: 0.1,
  MAX_OPACITY: 0.9,

  // Scale settings
  MIN_SCALE: 0.8,
  MAX_SCALE: 1.2,

  // Camera settings
  CAMERA_FOV: 60,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 1000,
  CAMERA_Z: 10,

  // Renderer settings
  MAX_PIXEL_RATIO: 2,
  TONE_MAPPING_EXPOSURE: 1.2,

  // Lighting settings
  AMBIENT_LIGHT: { color: 0x404040, intensity: 0.4 },
  DIRECTIONAL_LIGHT: {
    color: 0xffffff,
    intensity: 0.8,
    position: [5, 5, 5],
  },
  POINT_LIGHT: {
    color: 0xceeefc,
    intensity: 0.6,
    distance: 100,
    position: [0, 0, 10],
  },

  // Material settings
  DOT_COLOR: 0x89bed5,
  DOT_OPACITY: 0.7,
  DOT_SHININESS: 100,
  DOT_SPECULAR: 0x222222,
}

// ============================================
// GLOBAL VARIABLES
// ============================================
let scene, camera, renderer, dots, mouse, raycaster
let mouseX = 0,
  mouseY = 0
let targetMouseX = 0,
  targetMouseY = 0
let isTouching = false

// ============================================
// INITIALIZATION
// ============================================
function init() {
  console.log('Initializing Three.js scene...')

  createScene()
  createCamera()
  createLights()
  createRenderer()
  createDots()
  setupEventListeners()
  startAnimation()

  console.log('Three.js scene initialized successfully')
}

function createScene() {
  scene = new THREE.Scene()
}

function createCamera() {
  camera = new THREE.PerspectiveCamera(
    CONFIG.CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    CONFIG.CAMERA_NEAR,
    CONFIG.CAMERA_FAR
  )
  camera.position.z = CONFIG.CAMERA_Z
}

function createLights() {
  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(
    CONFIG.AMBIENT_LIGHT.color,
    CONFIG.AMBIENT_LIGHT.intensity
  )
  scene.add(ambientLight)

  // Directional light for shadows and depth
  const directionalLight = new THREE.DirectionalLight(
    CONFIG.DIRECTIONAL_LIGHT.color,
    CONFIG.DIRECTIONAL_LIGHT.intensity
  )
  directionalLight.position.set(...CONFIG.DIRECTIONAL_LIGHT.position)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  // Point light for additional illumination
  const pointLight = new THREE.PointLight(
    CONFIG.POINT_LIGHT.color,
    CONFIG.POINT_LIGHT.intensity,
    CONFIG.POINT_LIGHT.distance
  )
  pointLight.position.set(...CONFIG.POINT_LIGHT.position)
  scene.add(pointLight)
}

function createRenderer() {
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, CONFIG.MAX_PIXEL_RATIO)
  )
  renderer.setClearColor(0x000000, 0)
  renderer.outputEncoding = THREE.sRGBEncoding
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = CONFIG.TONE_MAPPING_EXPOSURE

  const container = document.getElementById('three-container')
  container.appendChild(renderer.domElement)

  // Enable pointer events on the canvas for touch interaction
  container.style.pointerEvents = 'auto'

  // Ensure canvas can receive touch events
  const canvas = renderer.domElement
  canvas.style.touchAction = 'none'
  canvas.style.userSelect = 'none'
  canvas.style.webkitUserSelect = 'none'

  console.log('Renderer created, canvas added to DOM')
}

// ============================================
// DOT CREATION
// ============================================
function createDots() {
  console.log('Creating 3D spheres...')

  dots = new THREE.Group()

  // Create spheres in a grid pattern
  for (
    let x = -CONFIG.GRID_SIZE / 2;
    x < CONFIG.GRID_SIZE / 2;
    x += CONFIG.SPACING
  ) {
    for (
      let y = -CONFIG.GRID_SIZE / 2;
      y < CONFIG.GRID_SIZE / 2;
      y += CONFIG.SPACING
    ) {
      const sphere = createSphere(x, y)
      dots.add(sphere)
    }
  }

  scene.add(dots)
  console.log(
    `3D spheres created and added to scene: ${dots.children.length} spheres`
  )
}

function createSphere(x, y) {
  // Create sphere geometry with high detail
  const geometry = new THREE.SphereGeometry(
    CONFIG.SPHERE_RADIUS,
    CONFIG.SPHERE_DETAIL.width,
    CONFIG.SPHERE_DETAIL.height
  )

  // Create realistic material with lighting
  const material = new THREE.MeshPhongMaterial({
    color: CONFIG.DOT_COLOR,
    transparent: true,
    opacity: CONFIG.DOT_OPACITY,
    shininess: CONFIG.DOT_SHININESS,
    specular: CONFIG.DOT_SPECULAR,
  })

  // Create sphere mesh
  const sphere = new THREE.Mesh(geometry, material)
  sphere.position.set(x, y, 0)

  // Store original position and animation data
  sphere.userData = {
    originalZ: 0,
    targetZ: 0,
    rotationSpeed: Math.random() * 0.02 + 0.01,
  }

  return sphere
}

// ============================================
// EVENT HANDLERS
// ============================================
function setupEventListeners() {
  mouse = new THREE.Vector2()
  raycaster = new THREE.Raycaster()

  const container = document.getElementById('three-container')
  const canvas = renderer.domElement

  // Desktop mouse events - attach to both container and canvas
  container.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mousemove', onMouseMove)

  // Mobile touch events - attach to both container and canvas for better coverage
  container.addEventListener('touchstart', onTouchStart, { passive: false })
  container.addEventListener('touchmove', onTouchMove, { passive: false })
  container.addEventListener('touchend', onTouchEnd, { passive: false })

  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })
  canvas.addEventListener('touchend', onTouchEnd, { passive: false })

  // Window resize still needs to be on window
  window.addEventListener('resize', onWindowResize)
}

function onMouseMove(event) {
  targetMouseX = (event.clientX / window.innerWidth) * 2 - 1
  targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1
}

function onTouchStart(event) {
  // Aggressively prevent all default touch behavior
  event.preventDefault()
  event.stopPropagation()

  isTouching = true

  if (event.touches.length > 0) {
    const touch = event.touches[0]
    targetMouseX = (touch.clientX / window.innerWidth) * 2 - 1
    targetMouseY = -(touch.clientY / window.innerHeight) * 2 + 1
  }
}

function onTouchMove(event) {
  // Only process if we're actively touching
  if (!isTouching) return

  // Aggressively prevent all default touch behavior including scrolling
  event.preventDefault()
  event.stopPropagation()

  if (event.touches.length > 0) {
    const touch = event.touches[0]
    targetMouseX = (touch.clientX / window.innerWidth) * 2 - 1
    targetMouseY = -(touch.clientY / window.innerHeight) * 2 + 1
  }
}

function onTouchEnd(event) {
  // Prevent default touch behavior
  event.preventDefault()
  event.stopPropagation()

  isTouching = false

  // Optionally reset to center when touch ends
  // targetMouseX = 0
  // targetMouseY = 0
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, CONFIG.MAX_PIXEL_RATIO)
  )
}

// ============================================
// ANIMATION
// ============================================
function startAnimation() {
  animate()
}

function animate() {
  requestAnimationFrame(animate)

  updateMousePosition()
  updateDots()
  renderer.render(scene, camera)
}

function updateMousePosition() {
  // Smooth mouse movement interpolation
  mouseX += (targetMouseX - mouseX) * CONFIG.ANIMATION_SPEED
  mouseY += (targetMouseY - mouseY) * CONFIG.ANIMATION_SPEED
}

function updateDots() {
  if (!dots || !dots.children) return

  const mouseWorldX = mouseX * CONFIG.MOUSE_WORLD_SCALE
  const mouseWorldY = mouseY * CONFIG.MOUSE_WORLD_SCALE

  dots.children.forEach((sphere) => {
    updateSpherePosition(sphere, mouseWorldX, mouseWorldY)
    updateSphereOpacity(sphere, mouseWorldX, mouseWorldY)
    updateSphereRotation(sphere)
    updateSphereScale(sphere, mouseWorldX, mouseWorldY)
  })
}

function updateSpherePosition(sphere, mouseWorldX, mouseWorldY) {
  const distance = calculateDistance(sphere, mouseWorldX, mouseWorldY)
  const targetZ = calculateTargetZ(distance)

  sphere.userData.targetZ = targetZ
  sphere.position.z += (sphere.userData.targetZ - sphere.position.z) * 0.1
}

function updateSphereOpacity(sphere, mouseWorldX, mouseWorldY) {
  const distance = calculateDistance(sphere, mouseWorldX, mouseWorldY)
  const normalizedDistance = Math.min(distance / CONFIG.MAX_DISTANCE, 1)
  const opacityFalloff = Math.pow(1 - normalizedDistance, 1.5)
  const opacity =
    CONFIG.MIN_OPACITY +
    (CONFIG.MAX_OPACITY - CONFIG.MIN_OPACITY) * opacityFalloff

  sphere.material.opacity = Math.max(0.0, Math.min(1.0, opacity))
}

function updateSphereRotation(sphere) {
  sphere.rotation.x += sphere.userData.rotationSpeed
  sphere.rotation.y += sphere.userData.rotationSpeed * 0.7
}

function updateSphereScale(sphere, mouseWorldX, mouseWorldY) {
  const distance = calculateDistance(sphere, mouseWorldX, mouseWorldY)
  const normalizedDistance = Math.min(distance / CONFIG.MAX_DISTANCE, 1)
  const falloff = Math.pow(1 - normalizedDistance, 2)
  const scaleEffect =
    CONFIG.MIN_SCALE + (CONFIG.MAX_SCALE - CONFIG.MIN_SCALE) * falloff

  sphere.scale.setScalar(scaleEffect)
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function calculateDistance(sphere, mouseWorldX, mouseWorldY) {
  return Math.sqrt(
    (sphere.position.x - mouseWorldX) ** 2 +
      (sphere.position.y - mouseWorldY) ** 2
  )
}

function calculateTargetZ(distance) {
  const normalizedDistance = Math.min(distance / CONFIG.MAX_DISTANCE, 1)
  const falloff = Math.pow(1 - normalizedDistance, 2)
  return CONFIG.MIN_Z + (CONFIG.MAX_Z - CONFIG.MIN_Z) * falloff
}

// ============================================
// INITIALIZATION
// ============================================
window.addEventListener('load', init)
