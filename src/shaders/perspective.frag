#version 300 es

in vec2 vTextureCoord;
in vec4 vColor;

in vec2 o;
in vec3 p;

uniform sampler2D uTexture;
uniform float uTime;
uniform bool cull_back;

out vec4 fragColor;

void main(void) {
    if (cull_back && p.z <= 0.0) discard;
    vec2 uv = (p.xy / p.z).xy - o;
    fragColor = texture(uTexture, uv + 0.5);
    fragColor.a *= step(max(abs(uv.x), abs(uv.y)), 0.5);
}