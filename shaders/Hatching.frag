// Author: CMH
// Title: Learning Shaders

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_tex0;
uniform sampler2D u_tex1;
uniform sampler2D u_tex2;
uniform sampler2D u_tex3;
uniform sampler2D u_tex4;
uniform sampler2D u_tex5;
uniform sampler2D u_tex6;

// 可調整模糊強度，建議設為 1.0 避免疊影
const float blurSize = 5.0;

void main()
{
    // 依據畫布比例修正 uv，確保原始照片比例
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float imgAspect = 1.0; // 預設 1:1
    #ifdef GL_ES
    // 若已知原始圖片寬高比，可直接填入
    imgAspect = 800.0 / 600.0;
    #endif
    float canvasAspect = u_resolution.x / u_resolution.y;
    if (canvasAspect > imgAspect) {
        uv.x = (uv.x - 0.5) * (canvasAspect / imgAspect) + 0.5;
    } else {
        uv.y = (uv.y - 0.5) * (imgAspect / canvasAspect) + 0.5;
    }
    vec2 texel = blurSize * (1.0 / u_resolution.xy);
    vec4 sum = vec4(0.0);
    float kernel[7];
    kernel[0] = 0.5;
    kernel[1] = 2.0;
    kernel[2] = 6.0;
    kernel[3] = 12.0;
    kernel[4] = 6.0;
    kernel[5] = 2.0;
    kernel[6] = 0.5;
    float total = 0.0;
    for(int i = -3; i <= 3; i++) {
        for(int j = -3; j <= 3; j++) {
            float weight = kernel[i+3] * kernel[j+3];
            sum += texture2D(u_tex0, uv + texel * vec2(float(i), float(j))) * weight;
            total += weight;
        }
    }
    gl_FragColor = sum / total;
    
}
