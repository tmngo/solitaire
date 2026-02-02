#version 300 es

in vec2 vTextureCoord; // [0.0, 1.0]
in vec4 vColor;

uniform sampler2D uTexture;
uniform float uTime;

out vec4 fragColor;

vec4 texture2DAA(sampler2D tex, vec2 uv) {
    vec2 texsize = vec2(textureSize(tex, 0)) * 1.0;
    vec2 uv_texspace = uv * texsize;
    vec2 seam = floor(uv_texspace + 0.5);
    uv_texspace = (uv_texspace - seam) / fwidth(uv_texspace) + seam;
    uv_texspace = clamp(uv_texspace, seam - 0.5, seam + 0.5);
    return texture(tex, uv_texspace / texsize);
}

vec4 textureAA(sampler2D tex, vec2 uv) {
    vec2 texsize = vec2(textureSize(tex, 0)) * 1.0;
    vec2 uv_texspace = uv * texsize;
    uv_texspace = floor(uv_texspace) + min(fract(uv_texspace) / fwidth(uv_texspace), 1.0) - 0.5;;
    return texture(tex, uv_texspace / texsize);
}


vec4 textureAASharp(sampler2D tex, vec2 uv) {
    vec2 texsize = vec2(textureSize(tex, 0)) * 1.0;
    vec2 pix = uv * texsize;
    pix = floor(pix) + smoothstep(0.0, 1.0, fract(pix) / fwidth(pix)) - 0.5;
    return texture(tex, pix / texsize);
}

vec4 textureDenovo(sampler2D tex, vec2 uv) {
    vec2 texsize = vec2(textureSize(tex, 0)) * 1.0;
    vec2 box_size = clamp(fwidth(uv) * texsize, 1.0e-5, 1.0);
    vec2 tx = uv * texsize - 0.5 * box_size;
    vec2 tx_offset = smoothstep(vec2(1) - box_size, vec2(1), fract(tx));
    vec2 uv2 = (floor(tx) + 0.5 + tx_offset) / texsize;
    return textureGrad(tex, uv2, dFdx(uv), dFdy(uv));
}

void main() {
    if (vTextureCoord.x > 0.45) {
        fragColor = 1.0 - texture2DAA(uTexture, vTextureCoord) * vec4(1.0, 1.0, 1.0, 0.0);
        // fragColor = textureAASharp(uTexture, vTextureCoord);
        // fragColor = vec4(vTextureCoord.x, vTextureCoord.y, 0.0, 1.0);
        fragColor = 1.0 - textureDenovo(uTexture, vTextureCoord) * vec4(1.0, 1.0, 1.0, 0.0);
    } else {
       fragColor = texture(uTexture, vTextureCoord);
       // fragColor = vec4(vTextureCoord.x, vTextureCoord.y, 0.0, 1.0);
    }
}