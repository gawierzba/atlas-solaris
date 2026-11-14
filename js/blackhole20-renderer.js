/**
 * ATLAS SOLARIS 20.0 — per-pixel WebGL2 Schwarzschild ray tracing.
 * Exact null orbital equation d²u/dφ² + u = 3u², RK4 integration per pixel.
 * Captured photons fall through r=2M; escaped rays sample a J2000 sky.
 * Accretion disk RGB / stripes are an ARTISTIC toy emissivity model.
 * There is no Kerr spin, radiative transfer, MHD, or accurate EHT photometry.
 */
(function(root){'use strict';
const VERT="#version 300 es\nprecision highp float;\nvoid main(){\n vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));\n gl_Position=vec4(p*2.0-1.0,0.0,1.0);\n}";
const FRAG="#version 300 es\nprecision highp float;\nuniform vec2 uResolution;\nuniform float uDistance;\nuniform float uInclination;\nuniform float uFov;\nuniform float uTime;\nuniform float uLensing;\nuniform float uDisk;\nuniform float uDoppler;\nuniform float uBrightness;\nuniform sampler2D uSky;\nout vec4 outColor;\nconst float PI=3.141592653589793;\nfloat hash21(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}\nvec2 deriv(vec2 x){return vec2(x.y,(uLensing>.5?3.0*x.x*x.x:0.0)-x.x);}\nvec2 rk4(vec2 x,float h){\n vec2 a=deriv(x),b=deriv(x+a*h*.5);\n vec2 c=deriv(x+b*h*.5),d=deriv(x+c*h);\n return x+h*(a+2.0*b+2.0*c+d)/6.0;\n}\nvec3 diskLight(vec3 pos,float r,float uu,float up,float phi,vec3 er,vec3 et,float f0){\n float f=max(.01,1.0-2.0/r);\n vec3 erp=cos(phi)*er+sin(phi)*et;\n vec3 etp=-sin(phi)*er+cos(phi)*et;\n vec3 orbital=normalize(vec3(-pos.y,pos.x,0.0));\n vec3 traceDir=normalize(erp*(-up/(max(uu,.00001)*sqrt(f)))+etp);\n float v=sqrt(1.0/max(3.001,r-2.0));\n float longitudinal=dot(orbital,-traceDir);\n float g=sqrt(f/f0)*sqrt(max(.001,1.0-v*v))/max(.08,1.0-v*longitudinal);\n if(uLensing<.5||uDoppler<.5)g=1.0;\n float temp=pow(6.0/r,.82);\n float az=atan(pos.y,pos.x);\n float feature=sin(az*42.0+r*5.6-uTime*(.24+2.1*temp));\n float feature2=sin(az*87.0-r*12.0+uTime*.37);\n float grain=hash21(floor(vec2(az*190.0,r*12.0)));\n float structure=.81+.11*feature+.055*feature2+.07*grain;\n float flare=pow(clamp(temp,0.0,1.0),.72);\n vec3 base=mix(vec3(.88,.22,.13),vec3(1.0,.88,.48),smoothstep(.28,.93,temp));\n float innerGlow=pow(temp,2.9)*.55;\n float energy=structure*(.20+1.9*flare+innerGlow);\n if(uDoppler>.5&&uLensing>.5)energy*=clamp(pow(g,3.5),.14,5.1);\n return base*energy*uBrightness;\n}\nvec3 sky(vec3 dir){\n dir=normalize(dir);\n vec2 uv=vec2(fract(atan(dir.y,dir.x)/(2.0*PI)+.5),\n  clamp(asin(clamp(dir.z,-1.0,1.0))/PI+.5,.001,.999));\n vec3 catalog=texture(uSky,uv).rgb;\n float haze=.006+.013*pow(max(0.0,1.0-abs(dir.z)),3.0);\n return catalog+vec3(.4,.55,1.0)*haze;\n}\nvoid main(){\n float f0=max(.01,1.0-2.0/uDistance);\n float inc=radians(uInclination);\n vec3 er=vec3(sin(inc),0.0,cos(inc));\n vec3 right=vec3(0.0,1.0,0.0);\n vec3 up=normalize(cross(er,right));\n vec2 screen=(gl_FragCoord.xy-.5*uResolution)/uResolution.y;\n vec2 xy=2.0*screen*tan(radians(uFov)*.5);\n vec3 n=normalize(-er+xy.x*right+xy.y*up);\n float nr=dot(n,er);\n vec3 tang=n-er*nr;\n float sinA=length(tang);\n if(sinA<.000001){outColor=vec4(.004,.008,.018,1.0);return;}\n vec3 et=tang/sinA;\n float factor=uLensing>.5?sqrt(f0):1.0;\n float b=uDistance*sinA/factor;\n vec2 state=vec2(1.0/uDistance,-nr/b);\n float phi=0.0;\n float h=clamp(b/uDistance*.65,.009,.048);\n vec3 prev=er*uDistance;\n float prevU=state.x;\n float result=0.0;\n vec3 rgb=vec3(.0);\n vec3 dirOut=er;\n for(int i=0;i<330;i++){\n  vec2 next=rk4(state,h);\n  float nextPhi=phi+h,nextU=next.x;\n  if(nextU>=.5){result=1.0;break;}\n  if(nextU<=.00065&&next.y<0.0){\n   dirOut=normalize(cos(nextPhi)*er+sin(nextPhi)*et);\n   result=3.0;break;\n  }\n  if(nextU<=.0000001||nextU>1.0){result=1.0;break;}\n  vec3 pos=(cos(nextPhi)*er+sin(nextPhi)*et)/nextU;\n  if(uDisk>.5&&prev.z*pos.z<=0.0){\n   float frac=clamp(prev.z/(prev.z-pos.z+1e-17),0.0,1.0);\n   float interU=mix(prevU,nextU,frac),interP=mix(phi,nextPhi,frac);\n   float r=1.0/max(interU,.000001);\n   if(r>=6.0&&r<=32.0){\n    vec3 hit=(cos(interP)*er+sin(interP)*et)*r;\n    float interV=mix(state.y,next.y,frac);\n    rgb=diskLight(hit,r,interU,interV,interP,er,et,f0);\n    result=2.0;break;\n   }\n  }\n  prev=pos;prevU=nextU;state=next;phi=nextPhi;\n }\n if(result==3.0)rgb=sky(dirOut);\n if(result==0.0)rgb=vec3(.005,.009,.019);\n if(result==1.0)rgb=vec3(.002,.004,.009);\n rgb=vec3(1.0)-exp(-max(rgb,vec3(0.0))*1.25);\n rgb=pow(rgb,vec3(.86));\n vec2 uv=gl_FragCoord.xy/uResolution;\n float vig=1.0-.22*pow(length((uv-.5)*1.4),2.0);\n rgb*=max(.55,vig);\n outColor=vec4(rgb,1.0);\n}";
function shader(gl,type,source){
 const obj=gl.createShader(type);gl.shaderSource(obj,source);gl.compileShader(obj);
 if(!gl.getShaderParameter(obj,gl.COMPILE_STATUS)){
  const error=gl.getShaderInfoLog(obj)||'Shader compile failed';
  gl.deleteShader(obj);throw new Error(error);
 }return obj;
}
function create(canvas,skyCanvas){
 if(!canvas||!skyCanvas)throw new TypeError('Brak płótna WebGL albo mapy nieba.');
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,
  depth:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});
 if(!gl)throw new Error('WebGL2 jest niedostępny w tej przeglądarce.');
 const v=shader(gl,gl.VERTEX_SHADER,VERT),f=shader(gl,gl.FRAGMENT_SHADER,FRAG);
 const program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);
 gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))
  throw new Error(gl.getProgramInfoLog(program)||'Błąd programu GLSL.');
 gl.useProgram(program);
 const vao=gl.createVertexArray();gl.bindVertexArray(vao);
 const uniforms={};
 for(const name of ['uResolution','uDistance','uInclination','uFov','uTime',
  'uLensing','uDisk','uDoppler','uBrightness','uSky']){
  uniforms[name]=gl.getUniformLocation(program,name);
  if(uniforms[name]===null)throw new Error('Brak uniformu GLSL: '+name);
 }
 const texture=gl.createTexture();
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,skyCanvas);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.uniform1i(uniforms.uSky,0);
 let lost=false,lastW=0,lastH=0;
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;});
 function render(o){
  if(lost)return false;
  const rect=canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return false;
  const quality=o.quality??.65;
  const w=Math.max(160,Math.min(1200,Math.round(rect.width*quality)));
  const h=Math.max(100,Math.min(800,Math.round(rect.height*quality)));
  if(w!==lastW||h!==lastH){
   canvas.width=w;canvas.height=h;lastW=w;lastH=h;gl.viewport(0,0,w,h);
  }
  gl.useProgram(program);gl.bindVertexArray(vao);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.uniform2f(uniforms.uResolution,w,h);
  gl.uniform1f(uniforms.uDistance,o.distance);
  gl.uniform1f(uniforms.uInclination,o.inclination);
  gl.uniform1f(uniforms.uFov,o.fov??50);
  gl.uniform1f(uniforms.uTime,o.time??0);
  gl.uniform1f(uniforms.uLensing,o.lensing?1:0);
  gl.uniform1f(uniforms.uDisk,o.disk?1:0);
  gl.uniform1f(uniforms.uDoppler,o.doppler?1:0);
  gl.uniform1f(uniforms.uBrightness,o.brightness??1);
  gl.drawArrays(gl.TRIANGLES,0,3);
  return true;
 }
 return {render,gl,source:FRAG,dispose(){
  lost=true;gl.deleteTexture(texture);gl.deleteVertexArray(vao);gl.deleteProgram(program);
 }};
}
root.ATLAS_BLACKHOLE20_RENDERER=Object.freeze({create,VERT,FRAG});
if(typeof module!=='undefined'&&module.exports)module.exports={create,VERT,FRAG};
})(typeof window!=='undefined'?window:globalThis);
