function multiplyMatrices(matrixA, matrixB) {
    var result = [];

    for (var i = 0; i < 4; i++) {
        result[i] = [];
        for (var j = 0; j < 4; j++) {
            var sum = 0;
            for (var k = 0; k < 4; k++) {
                sum += matrixA[i * 4 + k] * matrixB[k * 4 + j];
            }
            result[i][j] = sum;
        }
    }

    // Flatten the result array
    return result.reduce((a, b) => a.concat(b), []);
}
function createIdentityMatrix() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}
function createScaleMatrix(scale_x, scale_y, scale_z) {
    return new Float32Array([
        scale_x, 0, 0, 0,
        0, scale_y, 0, 0,
        0, 0, scale_z, 0,
        0, 0, 0, 1
    ]);
}

function createTranslationMatrix(x_amount, y_amount, z_amount) {
    return new Float32Array([
        1, 0, 0, x_amount,
        0, 1, 0, y_amount,
        0, 0, 1, z_amount,
        0, 0, 0, 1
    ]);
}

function createRotationMatrix_Z(radian) {
    return new Float32Array([
        Math.cos(radian), -Math.sin(radian), 0, 0,
        Math.sin(radian), Math.cos(radian), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_X(radian) {
    return new Float32Array([
        1, 0, 0, 0,
        0, Math.cos(radian), -Math.sin(radian), 0,
        0, Math.sin(radian), Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_Y(radian) {
    return new Float32Array([
        Math.cos(radian), 0, Math.sin(radian), 0,
        0, 1, 0, 0,
        -Math.sin(radian), 0, Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function getTransposeMatrix(matrix) {
    return new Float32Array([
        matrix[0], matrix[4], matrix[8], matrix[12],
        matrix[1], matrix[5], matrix[9], matrix[13],
        matrix[2], matrix[6], matrix[10], matrix[14],
        matrix[3], matrix[7], matrix[11], matrix[15]
    ]);
}

const vertexShaderSource = `
attribute vec3 position;
attribute vec3 normal; // Normal vector for lighting

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

uniform vec3 lightDirection;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vNormal = vec3(normalMatrix * vec4(normal, 0.0));
    vLightDirection = lightDirection;

    gl_Position = vec4(position, 1.0) * projectionMatrix * modelViewMatrix; 
}

`

const fragmentShaderSource = `
precision mediump float;

uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vLightDirection);
    
    // Ambient component
    vec3 ambient = ambientColor;

    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // Specular component (view-dependent)
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Assuming the view direction is along the z-axis
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = spec * specularColor;

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}

`

/**
 * @WARNING DO NOT CHANGE ANYTHING ABOVE THIS LINE
 */



/**
 * 
 * @TASK1 Calculate the model view matrix by using the chatGPT
 */

function getChatGPTModelViewMatrix() {
    const transformationMatrix = new Float32Array([
        0.17677669, -0.3061862, 0.35355338, 0.3,
        0.43301272, 0.25, -0.17677669, -0.25,
        -0.25, 0.43301272, 0.3061862, 0,
        0, 0, 0, 1
      ]);  
    return getTransposeMatrix(transformationMatrix);
}


/**
 * 
 * @TASK2 Calculate the model view matrix by using the given 
 * transformation methods and required transformation parameters
 * stated in transformation-prompt.txt
 */
function getModelViewMatrix() {
    // It converts degrees to radians
    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    // It creates identity matrix
    let modelViewMatrix = createIdentityMatrix();
    // It scaling the matrix
    let scaleMatrix = createScaleMatrix(0.5, 0.5, 1.0);
    // It translate the matrix
    let translationMatrix = createTranslationMatrix(0.3, -0.25, 0);
    // These are rotate the matrix
    let rotationXMatrix = createRotationMatrix_X(degToRad(30));
    let rotationYMatrix = createRotationMatrix_Y(degToRad(45));
    let rotationZMatrix = createRotationMatrix_Z(degToRad(60));

    // I multiply matrixes in order of firstly scaling, then translation and finally rotational matrix which are ordered as z,y and x
    const MatrixNeeded = multiplyMatrices(
        multiplyMatrices(multiplyMatrices(multiplyMatrices(multiplyMatrices(modelViewMatrix, scaleMatrix),translationMatrix),rotationZMatrix), rotationYMatrix), rotationXMatrix);
    // Finally I return the matrix that needed for our model view
    return new Float32Array(MatrixNeeded);
}


/**
 * 
 * @TASK3 Ask CHAT-GPT to animate the transformation calculated in 
 * task2 infinitely with a period of 10 seconds. 
 * First 5 seconds, the cube should transform from its initial 
 * position to the target position.
 * The next 5 seconds, the cube should return to its initial position.
 */
function getPeriodicMovement(startTime) {

    // Helper function to interpolate between two matrices
    function interpolateMatrix(matA, matB, t) {
        return matA.map((value, index) => (1 - t) * value + t * matB[index]);
    }

    // Create identity matrix (initial position)
    let identityMatrix = createIdentityMatrix();

    // The target transformation matrix (calculated in Task 2)
    let targetMatrix = getModelViewMatrix();

    // Calculate the current time in the 10-second cycle
    let currentTime = (Date.now() - startTime) / 1000;
    let cycleTime = currentTime % 10; // Cycle resets every 10 seconds

    let t;
    if (cycleTime <= 5) {
        // First 5 seconds: interpolate from identity to target (forward animation)
        t = cycleTime / 5;  // Normalize time between 0 and 1
    } else {
        // Next 5 seconds: interpolate from target back to identity (backward animation)
        t = (10 - cycleTime) / 5;  // Normalize time between 1 and 0
    }

    // Interpolate between the identity and target matrices
    let interpolatedMatrix = interpolateMatrix(identityMatrix, targetMatrix, t);

    // Return the interpolated matrix in Float32Array format
    return new Float32Array(interpolatedMatrix);
}




