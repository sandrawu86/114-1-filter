// Author: CMH
// Title: Hybrid Image Shader

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform sampler2D u_tex0; // 低通（模糊）
uniform sampler2D u_tex1; // 高通（細節）

const float blurSize = 5.0;

void main()
{
    // 依據畫布比例修正 uv，確保原始照片比例
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float imgAspect = 532.0 / 800.0;
    float canvasAspect = u_resolution.x / u_resolution.y;
    if (canvasAspect > imgAspect) {
        uv.x = (uv.x - 0.5) * (canvasAspect / imgAspect) + 0.5;
    } else {
        uv.y = (uv.y - 0.5) * (imgAspect / canvasAspect) + 0.5;
    }
    // 低通濾波（模糊）
    vec2 texel = blurSize * (1.0 / u_resolution.xy);
    float kernel[7];
    kernel[0] = 0.5;
    kernel[1] = 2.0;
    kernel[2] = 6.0;
    kernel[3] = 12.0;
    kernel[4] = 6.0;
    kernel[5] = 2.0;
    kernel[6] = 0.5;
    float total = 0.0;
    vec4 lowpass = vec4(0.0);
    for(int i = -3; i <= 3; i++) {
        for(int j = -3; j <= 3; j++) {
            float weight = kernel[i+3] * kernel[j+3];
            lowpass += texture2D(u_tex0, uv + texel * vec2(float(i), float(j))) * weight;
            total += weight;
        }
    }
    lowpass /= total;
    // 高通濾波（細節）
    vec4 highpass = vec4(0.0);
    highpass += texture2D(u_tex1, uv + texel * vec2( 0.0, -1.0)) * -1.0;
    highpass += texture2D(u_tex1, uv + texel * vec2(-1.0,  0.0)) * -1.0;
    highpass += texture2D(u_tex1, uv + texel * vec2( 0.0,  0.0)) *  4.0;
    highpass += texture2D(u_tex1, uv + texel * vec2( 1.0,  0.0)) * -1.0;
    highpass += texture2D(u_tex1, uv + texel * vec2( 0.0,  1.0)) * -1.0;
    highpass = clamp(highpass + 0.5, 0.0, 1.0);
    // 混合
    float alpha = 0.1; // 可調整混合比例
    gl_FragColor = mix(lowpass, highpass, alpha);
}