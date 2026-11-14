/**
 * ATLAS SOLARIS 20.1 — Kerr WebGL2 shader, true Carter-separated null rays.
 * RK4 integrates u=1/r, theta, phi in rescaled Mino time from local ZAMO.
 * Horizon/ergosphere/ISCO computed from Kerr parameters. Disk emission is
 * deliberately illustrative, not an EHT simulation or MHD/radiative transfer.
 * Coordinates of distant background stars are a J2000 scenic reference.
 */
(function(root){'use strict';
const VERT="#version 300 es\nprecision highp float;\nvoid main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.0-1.0,0.0,1.0);}";
const FRAG="#version 300 es\nprecision highp float;\nuniform vec2 uResolution;\nuniform float uSpin,uDistance,uInclination,uFov,uRoll,uTime;\nuniform float uInner,uDisk,uDoppler,uBrightness;\nuniform sampler2D uSky;\nout vec4 outColor;\nconst float PI=3.141592653589793;\n\nfloat hash21(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}\nvec4 kDer(vec4 s,float a,float l,float K,float c2,float c4,float b){\n float u=s.x,th=s.z,si=sin(th),co=cos(th);\n float sin2=max(0.00008,si*si),bb=max(.0001,b*b);\n return vec4(s.y,(c2*u+3.0*K*u*u+2.0*c4*u*u*u)/bb,\n  s.w,(-a*a*si*co+l*l*co/(si*sin2))/bb);\n}\nfloat kPhi(vec4 s,float a,float l,float b){\n float u=s.x,den=max(.0000001,1.0-2.0*u+a*a*u*u);\n float si=sin(s.z);\n return (a*(1.0+(a*a-a*l)*u*u)/den+l/max(.00008,si*si)-a)/max(.0001,b);\n}\nvec3 point(float u,float th,float ph){\n float r=1.0/max(.0000001,u);\n return r*vec3(sin(th)*cos(ph),sin(th)*sin(ph),cos(th));\n}\nvec3 sky(vec3 d){\n d=normalize(d);\n vec2 uv=vec2(fract(atan(d.y,d.x)/(2.0*PI)+.5),\n  clamp(asin(clamp(d.z,-1.0,1.0))/PI+.5,.001,.999));\n vec3 stars=texture(uSky,uv).rgb;\n return stars+vec3(.004,.007,.014);\n}\nvec3 diskLight(float r,float az,float l,float alpha,float omega){\n float temp=pow(uInner/r,.77);\n float pattern=sin(az*43.0+r*5.7-uTime*(.15+1.7*temp));\n float filaments=sin(az*91.0-r*12.5+uTime*.43);\n float noise=hash21(floor(vec2(az*170.0,r*17.0)));\n float structure=.78+.13*pattern+.07*filaments+.09*noise;\n float energy=(.2+1.5*pow(temp,.9)+.35*pow(temp,3.0))*structure*uBrightness;\n float p=pow(r,1.5),sr=sqrt(r);\n float den=sqrt(max(.0001,p-3.0*sr+2.0*uSpin));\n float ut=(p+uSpin)/(pow(r,.75)*den);\n float Omega=1.0/(p+uSpin);\n float g=(1.0-omega*l)/(max(.0001,alpha)*ut*max(.03,1.0-Omega*l));\n if(uDoppler>.5)energy*=clamp(pow(max(.01,g),3.0),.12,5.5);\n vec3 rgb=mix(vec3(.87,.18,.13),vec3(1.0,.86,.49),smoothstep(.25,.95,temp));\n return max(rgb*energy,vec3(0.0));\n}\nvoid main(){\n float a=uSpin,r0=uDistance,theta0=radians(uInclination);\n float st=sin(theta0),ct=cos(theta0),aa=a*a,rsq=r0*r0;\n float sigma=rsq+aa*ct*ct,delta=rsq-2.0*r0+aa;\n float bigA=(rsq+aa)*(rsq+aa)-aa*delta*st*st;\n float alpha=sqrt(max(.000001,delta*sigma/bigA));\n float omega=2.0*a*r0/bigA;\n float gpp=bigA*st*st/sigma;\n\n vec2 xy=2.0*(gl_FragCoord.xy-.5*uResolution)/uResolution.y*tan(radians(uFov)*.5);\n float angle=radians(uRoll);\n xy=mat2(cos(angle),sin(angle),-sin(angle),cos(angle))*xy;\n // Local ZAMO frame: inward radial, theta toward south, phi toward east.\n vec3 n=normalize(vec3(-1.0,-xy.y,xy.x));\n float E=alpha+omega*sqrt(gpp)*n.z;\n float l=sqrt(gpp)*n.z/E;\n float pth=sqrt(sigma)*n.y/E;\n float eta=pth*pth+ct*ct*(l*l/max(.00001,st*st)-aa);\n float b=sqrt(max(.0,l*l+eta));\n if(b<.05){outColor=vec4(.002,.004,.009,1.0);return;}\n float K=eta+(l-a)*(l-a);\n float c2=2.0*(aa-a*l)-K;\n float c4=(aa-a*l)*(aa-a*l)-aa*K;\n float pu=-sqrt(sigma*delta)*n.x/(E*rsq*b);\n vec4 state=vec4(1.0/r0,pu,theta0,pth/b);\n float phi=0.0,limit=1.0/(1.0+sqrt(1.0-aa));\n vec3 prev=point(state.x,state.z,phi);\n float prevU=state.x;\n int outcome=0;\n vec3 radiance=vec3(0.0),outDir=vec3(1.0,0.0,0.0);\n const float h=.028;\n for(int i=0;i<400;i++){\n  vec4 k1=kDer(state,a,l,K,c2,c4,b);\n  vec4 s2=state+.5*h*k1;\n  vec4 k2=kDer(s2,a,l,K,c2,c4,b);\n  vec4 s3=state+.5*h*k2;\n  vec4 k3=kDer(s3,a,l,K,c2,c4,b);\n  vec4 s4=state+h*k3;\n  vec4 k4=kDer(s4,a,l,K,c2,c4,b);\n  vec4 next=state+h*(k1+2.0*k2+2.0*k3+k4)/6.0;\n  float ph2=phi+h*(kPhi(state,a,l,b)+2.0*kPhi(s2,a,l,b)+\n   2.0*kPhi(s3,a,l,b)+kPhi(s4,a,l,b))/6.0;\n  float u=next.x;\n  if(u>=limit){outcome=1;break;}\n  if(u<=.0008&&next.y<0.0){\n   outDir=normalize(point(max(u,.0008),next.z,ph2));outcome=3;break;\n  }\n  if(u<=.000001||u>1.2||next.z<.01||next.z>PI-.01)break;\n  vec3 pos=point(u,next.z,ph2);\n  if(uDisk>.5&&(state.z-PI/2.0)*(next.z-PI/2.0)<=0.0){\n   float frac=clamp((PI/2.0-state.z)/(next.z-state.z+1e-12),0.0,1.0);\n   float uHit=mix(prevU,u,frac);\n   float rad=1.0/max(uHit,.000001);\n   if(rad>=uInner&&rad<=32.0){\n    float phHit=mix(phi,ph2,frac);\n    radiance=diskLight(rad,phHit,l,alpha,omega);\n    outcome=2;break;\n   }\n  }\n  state=next;phi=ph2;prev=pos;prevU=u;\n }\n if(outcome==3)radiance=sky(outDir);\n if(outcome==0)radiance=vec3(.005,.007,.014); // finite step limit\n if(outcome==1)radiance=vec3(.002,.003,.006); // horizon\n radiance=vec3(1.0)-exp(-max(radiance,vec3(0.0))*1.2);\n radiance=pow(radiance,vec3(.88));\n vec2 uv=gl_FragCoord.xy/uResolution;\n radiance*=max(.60,1.0-.22*dot((uv-.5)*1.35,(uv-.5)*1.35));\n outColor=vec4(radiance,1.0);\n}";
function compile(gl,type,source){
 const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);
 if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){
  const error=gl.getShaderInfoLog(sh)||'Błąd GLSL';gl.deleteShader(sh);throw new Error(error);
 }return sh;
}
function create(canvas,skyCanvas){
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,
  preserveDrawingBuffer:false,powerPreference:'high-performance'});
 if(!gl)throw new Error('Kerr 20.1 wymaga WebGL2');
 const v=compile(gl,gl.VERTEX_SHADER,VERT),f=compile(gl,gl.FRAGMENT_SHADER,FRAG);
 const program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);
 gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))
  throw new Error(gl.getProgramInfoLog(program)||'Błąd łączenia programu Kerr');
 gl.useProgram(program);const vao=gl.createVertexArray();gl.bindVertexArray(vao);
 const uniforms={};
 for(const name of ['uResolution','uSpin','uDistance','uInclination','uFov',
 'uRoll','uTime','uInner','uDisk','uDoppler','uBrightness','uSky']){
  uniforms[name]=gl.getUniformLocation(program,name);
  if(uniforms[name]===null)throw new Error('Brak uniformu Kerr: '+name);
 }
 const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,skyCanvas);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.uniform1i(uniforms.uSky,0);
 let lastW=0,lastH=0,lost=false;
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;});
 function render(o){
  if(lost)return false;
  const rect=canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return false;
  const quality=o.quality??.47;
  const w=Math.min(1080,Math.max(180,Math.round(rect.width*quality))),
   h=Math.min(700,Math.max(100,Math.round(rect.height*quality)));
  if(w!==lastW||h!==lastH||canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;lastW=w;lastH=h;gl.viewport(0,0,w,h);}
  gl.useProgram(program);gl.bindVertexArray(vao);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.uniform2f(uniforms.uResolution,w,h);
  for(const [name,val] of Object.entries({
   uSpin:o.spin,uDistance:o.distance,uInclination:o.inclination,
   uFov:o.fov??50,uRoll:o.roll??0,uTime:o.time??0,
   uInner:o.inner??6,uDisk:o.disk?1:0,
   uDoppler:o.doppler?1:0,uBrightness:o.brightness??1.1
  }))gl.uniform1f(uniforms[name],val);
  gl.drawArrays(gl.TRIANGLES,0,3);
  return true;
 }
 return {render,gl,dispose(){
  lost=true;gl.deleteTexture(tex);gl.deleteVertexArray(vao);gl.deleteProgram(program);
 }};
}
root.ATLAS_KERR201_RENDERER=Object.freeze({create,VERT,FRAG});
if(typeof module!=='undefined'&&module.exports)module.exports={create,VERT,FRAG};
})(typeof window!=='undefined'?window:globalThis);
