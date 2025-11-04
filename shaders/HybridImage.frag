// Author: CMH
// Title: Hybrid Image Shader

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform sampler2D u_tex0; // 低通（模糊）
uniform sampler2D u_tex1; // 高通（細節）
uniform vec2 u_mouse; // 由 GlslCanvas 傳入，畫面上的滑鼠座標 (px)

const float blurSize = 5.0;

void main()
{
    // 依據畫布比例修正 uv，確保原始照片比例
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float imgAspect = 2368.0 / 1728.0;
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
    // 混合：使用滑鼠水平位置控制 alpha
    // u_mouse.x 在畫布座標系中（像素），將其正規化到 [0,1]
    float mouseNorm = clamp(u_mouse.x / u_resolution.x, 0.0, 1.0);
    // 這裡不使用線性對應，改用冪次(non-linear)映射，使畫面中間時 alpha 約為 0.2
    // 若 mouseNorm = 0.5 時要得到 alpha ~= 0.2，可使用 gamma ≈ 2.322
    float gamma = 2.322;
    float alpha = pow(mouseNorm, gamma);
    // 若要反向映射（滑鼠中間為 0.8），可用: alpha = 1.0 - pow(1.0 - mouseNorm, gamma);
    gl_FragColor = mix(lowpass, highpass, alpha);
}