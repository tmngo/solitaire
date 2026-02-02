#version 300 es

in vec2 vTextureCoord;
in vec4 vColor;

uniform sampler2D uTexture;
uniform float uTime;

out vec4 fragColor;

void main(void) {
    fragColor = 1.0 * texture(uTexture, vTextureCoord);
}