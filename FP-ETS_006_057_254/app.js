var camera = undefined,
  scene = undefined,
  renderer = undefined,
  light = undefined,
  mouseX = undefined,
  mouseY = undefined,
  maze = undefined,
  mazeMesh = undefined,
  mazeDimension = 11,
  planeMesh = undefined,
  ballMesh = undefined,
  ballRadius = 0.25,
  keyAxis = [0, 0],
  ironTexture = THREE.ImageUtils.loadTexture(
    "/assets/texture/50718b9eb5268411b02e0a8167088ef9.jpg"
  ),
  planeTexture = THREE.ImageUtils.loadTexture(
    "/assets/texture/4c712fb1f820b43b1b8eac593302af6c.jpg"
  ),
  brickTexture = THREE.ImageUtils.loadTexture(
    "/assets/texture/b8b3f5ba52e906e914c5435449bf448b.jpg"
  ),
  holeTexture = THREE.ImageUtils.loadTexture(
    "/assets/texture/aykwbbm246jaokllnak.png"
  ),
  gameState = undefined,
  retry = false,
  // Box2D shortcuts
  b2World = Box2D.Dynamics.b2World,
  b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
  b2BodyDef = Box2D.Dynamics.b2BodyDef,
  b2Body = Box2D.Dynamics.b2Body,
  b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
  b2Settings = Box2D.Common.b2Settings,
  b2Vec2 = Box2D.Common.Math.b2Vec2,
  // Box2D world variables
  wWorld = undefined,
  wBall = undefined;

function createPhysicsWorld() {
  // Create the world object.
  wWorld = new b2World(new b2Vec2(0, 0), true);

  // Create the ball.
  var bodyDef = new b2BodyDef();
  bodyDef.type = b2Body.b2_dynamicBody;
  bodyDef.position.Set(1, 1);
  wBall = wWorld.CreateBody(bodyDef);
  var fixDef = new b2FixtureDef();
  fixDef.density = 1.0;
  fixDef.friction = 0.0;
  fixDef.restitution = 0.25;
  fixDef.shape = new b2CircleShape(ballRadius);
  wBall.CreateFixture(fixDef);

  // Create the maze.
  bodyDef.type = b2Body.b2_staticBody;
  fixDef.shape = new b2PolygonShape();
  fixDef.shape.SetAsBox(0.5, 0.5);
  for (var i = 0; i < maze.dimension; i++) {
    for (var j = 0; j < maze.dimension; j++) {
      if (maze[i][j]) {
        bodyDef.position.x = i;
        bodyDef.position.y = j;
        wWorld.CreateBody(bodyDef).CreateFixture(fixDef);
      }
    }
  }
}

function toggleBackgroundMusic() {
  var backgroundMusic = document.getElementById("backgroundMusic");
  if (backgroundMusic.paused) {
    backgroundMusic.play();
  } else {
    backgroundMusic.pause();
  }
}

function generate_maze_mesh(field) {
  var dummy = new THREE.Geometry();
  for (var i = 0; i < field.dimension; i++) {
    for (var j = 0; j < field.dimension; j++) {
      if (field[i][j]) {
        var geometry = new THREE.CubeGeometry(1, 1, 1, 1, 1, 1);
        var mesh_ij = new THREE.Mesh(geometry);
        mesh_ij.position.x = i;
        mesh_ij.position.y = j;
        mesh_ij.position.z = 0.5;
        THREE.GeometryUtils.merge(dummy, mesh_ij);
      }
    }
  }
  var material = new THREE.MeshPhongMaterial({ map: brickTexture });
  var mesh = new THREE.Mesh(dummy, material);
  return mesh;
}

function createRenderWorld() {
  // Create the scene object.
  scene = new THREE.Scene();

  // Add the light.
  light = new THREE.PointLight(0xffffff, 1);
  light.position.set(1, 1, 1.3);
  scene.add(light);

  //ambeien
  //   var ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
  //   scene.add(ambientLight);

  // Add the ball.
  g = new THREE.SphereGeometry(ballRadius, 32, 16);
  m = new THREE.MeshPhongMaterial({ map: ironTexture });
  ballMesh = new THREE.Mesh(g, m);
  ballMesh.position.set(1, 1, ballRadius);
  scene.add(ballMesh);

  // Add the camera.
  var aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(60, aspect, 1, 1000);
  camera.position.set(1, 1, 5);
  scene.add(camera);

  // Add the maze.
  mazeMesh = generate_maze_mesh(maze);
  scene.add(mazeMesh);

  // Add the ground.
  g = new THREE.PlaneGeometry(
    mazeDimension * 10,
    mazeDimension * 10,
    mazeDimension,
    mazeDimension
  );
  planeTexture.wrapS = planeTexture.wrapT = THREE.RepeatWrapping;
  planeTexture.repeat.set(mazeDimension * 5, mazeDimension * 5);
  m = new THREE.MeshPhongMaterial({ map: planeTexture });
  planeMesh = new THREE.Mesh(g, m);
  planeMesh.position.set((mazeDimension - 1) / 2, (mazeDimension - 1) / 2, 0);
  planeMesh.rotation.set(Math.PI / 2, 0, 0);
  scene.add(planeMesh);

  // Add a hole
  g = new THREE.PlaneGeometry (0.5, 0.5);
  m = m = new THREE.MeshPhongMaterial({ map: holeTexture });
  hole = new THREE.Mesh(g,m);
  hole.position.set(mazeDimension-2, mazeDimension-1.8, 0.1);
  hole.rotation.set(Math.PI / 2, 0, 0);
  scene.add(hole);

}

function updatePhysicsWorld() {
  // Apply "friction".
  var lv = wBall.GetLinearVelocity();
  lv.Multiply(0.95);
  wBall.SetLinearVelocity(lv);

  // Apply user-directed force.
  var f = new b2Vec2(
    keyAxis[0] * wBall.GetMass() * 0.25,
    keyAxis[1] * wBall.GetMass() * 0.25
  );
  wBall.ApplyImpulse(f, wBall.GetPosition());
  keyAxis = [0, 0];

  // Take a time step.
  wWorld.Step(1 / 60, 8, 3);
}

function updatePhysicsWorld() {
  // Apply "friction".
  var lv = wBall.GetLinearVelocity();
  lv.Multiply(0.95);
  wBall.SetLinearVelocity(lv);

  // Apply user-directed force.
  var f = new b2Vec2(
    keyAxis[0] * wBall.GetMass() * 0.25,
    keyAxis[1] * wBall.GetMass() * 0.25
  );
  wBall.ApplyImpulse(f, wBall.GetPosition());
  keyAxis = [0, 0];

  // Check if the ball is in contact with the ground (or any other object).
  var inContact = false;
  var contactEdge = wBall.GetContactList();
  while (contactEdge) {
    var contact = contactEdge.contact;
    if (contact.IsTouching()) {
      inContact = true;
      break;
    }
    contactEdge = contactEdge.next;
  }

  // Take a time step.
  wWorld.Step(1 / 60, 8, 3);

  // If the ball is in contact and its vertical velocity is negative, apply a bouncing effect.
  if (inContact && lv.y < 0) {
    // Adjust the vertical velocity to create a bouncing effect.
    lv.y = -lv.y * 0.5; // You can adjust the bouncing strength (0.5 in this example).

    // Apply the modified velocity to the ball.
    wBall.SetLinearVelocity(lv);
  }
}

function updateRenderWorld() {
  // Update ball position.
  var stepX = wBall.GetPosition().x - ballMesh.position.x;
  var stepY = wBall.GetPosition().y - ballMesh.position.y;
  ballMesh.position.x += stepX;
  ballMesh.position.y += stepY;

  // Update ball rotation.
  var tempMat = new THREE.Matrix4();
  tempMat.makeRotationAxis(new THREE.Vector3(0, 1, 0), stepX / ballRadius);
  tempMat.multiplySelf(ballMesh.matrix);
  ballMesh.matrix = tempMat;
  tempMat = new THREE.Matrix4();
  tempMat.makeRotationAxis(new THREE.Vector3(1, 0, 0), -stepY / ballRadius);
  tempMat.multiplySelf(ballMesh.matrix);
  ballMesh.matrix = tempMat;
  ballMesh.rotation.getRotationFromMatrix(ballMesh.matrix);

  // Update camera and light positions.
  camera.position.x += (ballMesh.position.x - camera.position.x) * 0.1;
  camera.position.y += (ballMesh.position.y - camera.position.y) * 0.1;
  camera.position.z += (5 - camera.position.z) * 0.1;
  light.position.x = camera.position.x;
  light.position.y = camera.position.y;
  light.position.z = camera.position.z - 3.7;
}

function gameLoop() {
  switch (gameState) {
    case "initialize":
      maze = generateSquareMaze(mazeDimension);
      maze[mazeDimension - 1][mazeDimension - 2] = false;
      createPhysicsWorld();
      createRenderWorld();
      camera.position.set(1, 1, 5);
      light.position.set(1, 1, 1.3);
      light.intensity = 2;

      // Start playing the background music when the game initializes.
      var backgroundMusic = document.getElementById("backgroundMusic");
      // backgroundMusic.currentTime = 0;
      backgroundMusic.play();

      var level = Math.floor((mazeDimension - 1) / 2 - 4);
      $("#level").html("Level " + level);

      // Show the overlay
      $("#overlay").show();

      // Change the game state to "waiting for space key" to let the player start
      gameState = "waiting for space key";
      break;

    case "waiting for space key":
      // Check for the space key press to start the game
      $(document).on("keydown", function (e) {
        if (e.keyCode === 32) {
          // Start the game
          gameState = "fade in";
          $("#overlay").hide();
          $("#level").show(); // Show the "Level" text
          $(document).off("keydown"); // Stop listening for key presses
        }
      });
      break;

    case "fade in":
      light.intensity += 0.1 * (1.0 - light.intensity);
      renderer.render(scene, camera);
      if (Math.abs(light.intensity - 1.0) < 0.05) {
        light.intensity = 1.0;

        // Sembunyikan overlay
        $("#overlay").hide();

        gameState = "play";
      }
      break;

    case "play":
      updatePhysicsWorld();
      updateRenderWorld();
      renderer.render(scene, camera);

      // Start playing the background music when the game initializes.
      var backgroundMusic = document.getElementById("backgroundMusic");
      // backgroundMusic.currentTime = 0;
      backgroundMusic.play();

      // Check for victory.
      var mazeX = Math.floor(ballMesh.position.x + 0.5);
      var mazeY = Math.floor(ballMesh.position.y + 0.5);
      if (mazeX == mazeDimension && mazeY == mazeDimension - 2) {
        mazeDimension += 2;
        gameState = "fade out";
      }
      if ((hole.position.x - 0.25) < ballMesh.position.x && ballMesh.position.x < (hole.position.x + 0.25) && (hole.position.y - 0.25) < ballMesh.position.y && ballMesh.position.y < (hole.position.y + 0.25)){
        scene.remove(ballMesh);
        retry = true;
        gameState = "fade out";
      }
      break;

    case "fade out":
      updatePhysicsWorld();
      updateRenderWorld();
      light.intensity += 0.1 * (0.0 - light.intensity);
      renderer.render(scene, camera);
      if (Math.abs(light.intensity - 0.0) < 0.1) {
        light.intensity = 0.0;
        renderer.render(scene, camera);
        if(retry == true){
          // Show the overlay
          $("#overlay-retry").show();
          setTimeout(function() {
            $("#overlay-retry").hide();
            retry = false;
            // Setel gameState kembali ke "initialize" setelah overlay disembunyikan
            gameState = "initialize";
          }, 4000); // 4000 milidetik (4 detik)
        }

        else {gameState = "initialize"};
      }
      break;
  }

  requestAnimationFrame(gameLoop);
}

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function onMoveKey(axis) {
  keyAxis = axis.slice(0);
}

jQuery.fn.centerv = function () {
  wh = window.innerHeight;
  h = this.outerHeight();
  this.css("position", "absolute");
  this.css("top", Math.max(0, (wh - h) / 2) + "px");
  return this;
};

jQuery.fn.centerh = function () {
  ww = window.innerWidth;
  w = this.outerWidth();
  this.css("position", "absolute");
  this.css("left", Math.max(0, (ww - w) / 2) + "px");
  return this;
};

jQuery.fn.center = function () {
  this.centerv();
  this.centerh();
  return this;
};

$(document).ready(function () {
  // Prepare the instructions.
  $("#instructions").center();
  $("#instructions").hide();
  KeyboardJS.bind.key(
    "i",
    function () {
      $("#instructions").show();
    },
    function () {
      $("#instructions").hide();
    }
  );

  // Create the renderer.
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Bind keyboard and resize events.
  KeyboardJS.bind.axis("left", "right", "down", "up", onMoveKey);
  $(window).resize(onResize);

  // Set the initial game state.
  gameState = "initialize";

  // Start the game loop.
  requestAnimationFrame(gameLoop);
});
