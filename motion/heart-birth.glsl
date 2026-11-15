// Heartbeat: animate the existing Pencil heart artwork, preserving its silhouette.
precision highp float;
/** @resolution */
uniform vec2 u_resolution;
/** @time */
uniform float u_time;
/** @label Перламутровое сердце */
uniform sampler2D u_heart;
/** @label Первый импульс */
uniform sampler2D u_pulse;
/**
 * @label Воспроизведение
 * @default 1
 * @range 0, 1
 */
uniform float u_play;
/**
 * @label Уменьшенное движение
 * @default 0
 * @range 0, 1
 */
uniform float u_reduced;
/**
 * @label Момент, секунды
 * @default 0
 * @range 0, 7.8
 */
uniform float u_phase;
/**
 * @label Скорость
 * @default 1
 * @range 0.25, 2
 */
uniform float u_speed;

float ease(float a,float b,float t){return smoothstep(a,b,t);}
vec4 heart(vec2 p){
  if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0)return vec4(0.0);
  return texture2D(u_heart,p);
}
float silhouette(vec2 direction){
  float lo=0.0;float hi=0.74;
  for(int j=0;j<11;j++){
    float m=(lo+hi)*0.5;
    if(heart(vec2(0.5)+direction*m).a>0.5)lo=m;else hi=m;
  }
  return (lo+hi)*0.5;
}
vec3 nacre(vec2 p){
  vec3 c=vec3(0.93,0.92,0.95);
  c=mix(c,vec3(0.96,0.86,0.91),0.48*exp(-7.0*dot(p-vec2(-0.30,0.10),p-vec2(-0.30,0.10))));
  c=mix(c,vec3(0.84,0.92,0.96),0.55*exp(-8.0*dot(p-vec2(0.28,-0.22),p-vec2(0.28,-0.22))));
  c=mix(c,vec3(0.89,0.94,0.80),0.36*exp(-10.0*dot(p-vec2(0.27,0.27),p-vec2(0.27,0.27))));
  c=mix(c,vec3(1.0,0.99,1.0),0.65*exp(-6.0*dot(p-vec2(-0.18,0.25),p-vec2(-0.18,0.25))));
  return c;
}
void main(){
  float t=u_reduced>0.5?6.2:(u_play>0.5?mod(u_time*u_speed,7.8):u_phase);
  vec2 dimensions=vec2(min(u_resolution.x*0.43,u_resolution.y*0.66));
  dimensions.y*=0.890338;
  vec2 q=(gl_FragCoord.xy-u_resolution*0.5)/dimensions;
  float r=length(q);
  vec2 dir=q/max(r,0.00001);
  float px=1.4/dimensions.x;
  float morph=ease(2.05,3.55,t);
  float boundary=mix(0.46,silhouette(dir),morph);
  float growth=mix(0.035,1.0,ease(1.45,4.95,t));
  float edge=boundary*growth;
  float mask=1.0-smoothstep(edge-px,edge+px,r);
  float born=ease(1.25,1.65,t);
  vec3 color=nacre(q/max(growth,0.06));
  float density=clamp(r/max(edge,0.001),0.0,1.0);
  color-=vec3(0.11,0.10,0.08)*pow(density,5.0);
  color+=vec3(0.035)*exp(-pow((density-0.91)*36.0,2.0));
  float layers=0.0;
  for(int i=0;i<5;i++){
    float start=1.5+float(i)*0.61;
    float age=t-start;
    float layerGrowth=mix(0.035,0.24+float(i)*0.15,ease(0.0,1.20,age));
    float radius=boundary*layerGrowth;
    float active=ease(0.03,0.28,age)*(1.0-ease(1.3,2.25,age));
    float d=(r-radius)/max(px*2.0,0.009);
    layers+=active*(0.075*exp(-d*d)-0.045*exp(-pow(d-1.1,2.0)));
  }
  color+=vec3(layers);
  vec4 finalHeart=heart(q+vec2(0.5));
  float finish=ease(4.75,5.50,t);
  vec4 result=vec4(color*mask*born,mask*born);
  result=mix(result,finalHeart,finish);
  float coreFade=ease(0.75,1.20,t)*(1.0-ease(3.0,4.1,t));
  float coreSize=mix(0.023,0.012,ease(1.8,3.6,t));
  float core=(1.0-smoothstep(coreSize-px,coreSize+px,r))*coreFade;
  vec3 coreColor=mix(vec3(0.46,0.37,0.57),vec3(0.94,0.89,0.99),clamp(0.55+q.y/coreSize*0.4,0.0,1.0));
  result=vec4(coreColor*core+result.rgb*(1.0-core),core+result.a*(1.0-core));
  float shrink=1.0-ease(0.58,1.10,t);
  float pulseSize=0.29*max(shrink,0.012);
  vec2 puv=q/pulseSize+0.5;
  if(puv.x>=0.0&&puv.x<=1.0&&puv.y>=0.0&&puv.y<=1.0){
    vec4 pulse=texture2D(u_pulse,puv);
    float draw=1.0-ease(ease(0.0,0.48,t),ease(0.0,0.48,t)+0.04,puv.x);
    pulse*=draw*(1.0-ease(0.86,1.10,t));
    result=pulse+result*(1.0-pulse.a);
  }
  float fade=1.0-ease(7.05,7.55,t);
  gl_FragColor=result*fade;
}
