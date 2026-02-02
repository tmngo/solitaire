struct Uniforms {
    resolution: vec2f,
    translation: vec2f,
    projectionMatrix: mat3x3f,
}

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var ourSampler: sampler;
@group(0) @binding(2)
var ourTexture: texture_2d<f32>;

// @group(0) @binding(0)
// var<uniform> resolution: vec2f;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
}

@vertex
fn vertex(
    @location(0) pos: vec2f, // xy
    @location(1) uv: vec2f,  // uv
) ->  VertexOutput {
    var output: VertexOutput;
    // output.uv = pos / vec2f(59, 78);
    let posClipSpace = (2 * (pos + uniforms.translation) / uniforms.resolution - 1) * vec2f(1, -1);
    // let posClipSpace = (uniforms.projectionMatrix * vec3f(pos, 1)).xy;
    output.position = vec4f(posClipSpace, 0, 1);
    output.uv = uv;
    return output;
}

@fragment
fn fragment(input: VertexOutput) -> @location(0) vec4f {
    // return vec4f(1, 0, 0, 1);
    return textureSample(ourTexture, ourSampler, input.uv);
}