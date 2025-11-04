// Author: CMH
// Title: Hybrid Image Shader

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform sampler2D u_tex0; // 低通（模糊）
uniform sampler2D u_tex1; // 高通（細節）
uniform vec2 u_mouse; // 由 GlslCanvas 傳入，畫面上的滑鼠座標 (px)

// 可從外部調整的模糊參數
uniform float u_blurSize; // 取樣距離倍數（像素倍數），若未傳入可在 JS 設定
uniform float u_sigma;     // Gaussian sigma

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
    // 若未由外部傳入，使用此預設值（可改大以增加模糊效果）
    vec2 texel = (u_blurSize > 0.0 ? u_blurSize : 1.5) * (1.0 / u_resolution.xy);

    // Gaussian function: 預設 sigma（若未傳入）
    float sigma = (u_sigma > 0.0 ? u_sigma : 2.5);
    float twoSigmaSq = 2.0 * sigma * sigma;
    vec4 lowpass = vec4(0.0);
    float total = 0.0;
    // use a fixed radius of 3 (7x7 kernel). You can increase radius but loop bounds must be constant.
    for (int i = -3; i <= 3; i++) {
        for (int j = -3; j <= 3; j++) {
            float fi = float(i);
            float fj = float(j);
            float w = exp(-(fi*fi + fj*fj) / twoSigmaSq);
            lowpass += texture2D(u_tex0, uv + texel * vec2(fi, fj)) * w;
            total += w;
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
    // 非線性映射：將畫面中間 (mouseNorm=0.5) 映射到 alpha 約為 0.3
    float centerTarget = 0.3; // 想要 mouseNorm=0.5 時得到的 alpha
    float gamma = log(centerTarget) / log(0.5);
    float alpha = pow(mouseNorm, gamma);
    gl_FragColor = mix(lowpass, highpass, alpha);
}