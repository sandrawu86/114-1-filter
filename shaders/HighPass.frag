// Author: CMH
// Title: High-pass Filter Shader

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform sampler2D u_tex1;

void main()
{
    // 依據畫布比例修正 uv，確保原始照片比例
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float imgAspect = 2368.0 / 1278.0; // 根據原始照片比例調整
    float canvasAspect = u_resolution.x / u_resolution.y;
    if (canvasAspect > imgAspect) {
        uv.x = (uv.x - 0.5) * (canvasAspect / imgAspect) + 0.5;
    } else {
        uv.y = (uv.y - 0.5) * (imgAspect / canvasAspect) + 0.5;
    }
    vec2 texel = 1.0 / u_resolution.xy;
    vec4 color = vec4(0.0);
    // 3x3 高通濾波 kernel
    color += texture2D(u_tex1, uv + texel * vec2( 0.0, -1.0)) * -1.0;
    color += texture2D(u_tex1, uv + texel * vec2(-1.0,  0.0)) * -1.0;
    color += texture2D(u_tex1, uv + texel * vec2( 0.0,  0.0)) *  4.0;
    color += texture2D(u_tex1, uv + texel * vec2( 1.0,  0.0)) * -1.0;
    color += texture2D(u_tex1, uv + texel * vec2( 0.0,  1.0)) * -1.0;
    gl_FragColor = clamp(color + 0.5, 0.0, 1.0);
}
