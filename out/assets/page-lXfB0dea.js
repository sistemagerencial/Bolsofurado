import{r as h,u as Q,j as t,s as $}from"./index-cByELuOo.js";import{u as Y}from"./useAuth-BAGP-SwM.js";import{M as K}from"./MainLayout-Dmh4yTuC.js";let V={data:""},X=e=>{if(typeof window=="object"){let a=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return a.nonce=window.__nonce__,a.parentNode||(e||document.head).appendChild(a),a.firstChild}return e||V},ee=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,ae=/\/\*[^]*?\*\/|  +/g,O=/\n+/g,N=(e,a)=>{let r="",n="",l="";for(let o in e){let s=e[o];o[0]=="@"?o[1]=="i"?r=o+" "+s+";":n+=o[1]=="f"?N(s,o):o+"{"+N(s,o[1]=="k"?"":a)+"}":typeof s=="object"?n+=N(s,a?a.replace(/([^,])+/g,c=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,i=>/&/.test(i)?i.replace(/&/g,c):c?c+" "+i:i)):o):s!=null&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),l+=N.p?N.p(o,s):o+":"+s+";")}return r+(a&&l?a+"{"+l+"}":l)+n},y={},I=e=>{if(typeof e=="object"){let a="";for(let r in e)a+=r+I(e[r]);return a}return e},te=(e,a,r,n,l)=>{let o=I(e),s=y[o]||(y[o]=(i=>{let u=0,p=11;for(;u<i.length;)p=101*p+i.charCodeAt(u++)>>>0;return"go"+p})(o));if(!y[s]){let i=o!==e?e:(u=>{let p,b,v=[{}];for(;p=ee.exec(u.replace(ae,""));)p[4]?v.shift():p[3]?(b=p[3].replace(O," ").trim(),v.unshift(v[0][b]=v[0][b]||{})):v[0][p[1]]=p[2].replace(O," ").trim();return v[0]})(e);y[s]=N(l?{["@keyframes "+s]:i}:i,r?"":"."+s)}let c=r&&y.g?y.g:null;return r&&(y.g=y[s]),((i,u,p,b)=>{b?u.data=u.data.replace(b,i):u.data.indexOf(i)===-1&&(u.data=p?i+u.data:u.data+i)})(y[s],a,n,c),s},re=(e,a,r)=>e.reduce((n,l,o)=>{let s=a[o];if(s&&s.call){let c=s(r),i=c&&c.props&&c.props.className||/^go/.test(c)&&c;s=i?"."+i:c&&typeof c=="object"?c.props?"":N(c,""):c===!1?"":c}return n+l+(s??"")},"");function C(e){let a=this||{},r=e.call?e(a.p):e;return te(r.unshift?r.raw?re(r,[].slice.call(arguments,1),a.p):r.reduce((n,l)=>Object.assign(n,l&&l.call?l(a.p):l),{}):r,X(a.target),a.g,a.o,a.k)}let U,P,F;C.bind({g:1});let w=C.bind({k:1});function se(e,a,r,n){N.p=a,U=e,P=r,F=n}function S(e,a){let r=this||{};return function(){let n=arguments;function l(o,s){let c=Object.assign({},o),i=c.className||l.className;r.p=Object.assign({theme:P&&P()},c),r.o=/ *go\d+/.test(i),c.className=C.apply(r,n)+(i?" "+i:"");let u=e;return e[0]&&(u=c.as||e,delete c.as),F&&u[0]&&F(c),U(u,c)}return l}}var oe=e=>typeof e=="function",z=(e,a)=>oe(e)?e(a):e,ne=(()=>{let e=0;return()=>(++e).toString()})(),ie=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let a=matchMedia("(prefers-reduced-motion: reduce)");e=!a||a.matches}return e}})(),le=20,q="default",M=(e,a)=>{let{toastLimit:r}=e.settings;switch(a.type){case 0:return{...e,toasts:[a.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(s=>s.id===a.toast.id?{...s,...a.toast}:s)};case 2:let{toast:n}=a;return M(e,{type:e.toasts.find(s=>s.id===n.id)?1:0,toast:n});case 3:let{toastId:l}=a;return{...e,toasts:e.toasts.map(s=>s.id===l||l===void 0?{...s,dismissed:!0,visible:!1}:s)};case 4:return a.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(s=>s.id!==a.toastId)};case 5:return{...e,pausedAt:a.time};case 6:let o=a.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(s=>({...s,pauseDuration:s.pauseDuration+o}))}}},de=[],ce={toasts:[],pausedAt:void 0,settings:{toastLimit:le}},k={},R=(e,a=q)=>{k[a]=M(k[a]||ce,e),de.forEach(([r,n])=>{r===a&&n(k[a])})},G=e=>Object.keys(k).forEach(a=>R(e,a)),me=e=>Object.keys(k).find(a=>k[a].toasts.some(r=>r.id===e)),T=(e=q)=>a=>{R(a,e)},ue=(e,a="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:a,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:r?.id||ne()}),E=e=>(a,r)=>{let n=ue(a,e,r);return T(n.toasterId||me(n.id))({type:2,toast:n}),n.id},d=(e,a)=>E("blank")(e,a);d.error=E("error");d.success=E("success");d.loading=E("loading");d.custom=E("custom");d.dismiss=(e,a)=>{let r={type:3,toastId:e};a?T(a)(r):G(r)};d.dismissAll=e=>d.dismiss(void 0,e);d.remove=(e,a)=>{let r={type:4,toastId:e};a?T(a)(r):G(r)};d.removeAll=e=>d.remove(void 0,e);d.promise=(e,a,r)=>{let n=d.loading(a.loading,{...r,...r?.loading});return typeof e=="function"&&(e=e()),e.then(l=>{let o=a.success?z(a.success,l):void 0;return o?d.success(o,{id:n,...r,...r?.success}):d.dismiss(n),l}).catch(l=>{let o=a.error?z(a.error,l):void 0;o?d.error(o,{id:n,...r,...r?.error}):d.dismiss(n)}),e};var pe=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,fe=w`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,he=w`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,xe=S("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${pe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${fe} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${he} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,ge=w`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,be=S("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${ge} 1s linear infinite;
`,ve=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,ye=w`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,we=S("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ve} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${ye} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,je=S("div")`
  position: absolute;
`,Ne=S("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,Se=w`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ke=S("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${Se} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,Ae=({toast:e})=>{let{icon:a,type:r,iconTheme:n}=e;return a!==void 0?typeof a=="string"?h.createElement(ke,null,a):a:r==="blank"?null:h.createElement(Ne,null,h.createElement(be,{...n}),r!=="loading"&&h.createElement(je,null,r==="error"?h.createElement(xe,{...n}):h.createElement(we,{...n})))},$e=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Ee=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,_e="0%{opacity:0;} 100%{opacity:1;}",Ce="0%{opacity:1;} 100%{opacity:0;}",De=S("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,Pe=S("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Fe=(e,a)=>{let r=e.includes("top")?1:-1,[n,l]=ie()?[_e,Ce]:[$e(r),Ee(r)];return{animation:a?`${w(n)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${w(l)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};h.memo(({toast:e,position:a,style:r,children:n})=>{let l=e.height?Fe(e.position||a||"top-center",e.visible):{opacity:0},o=h.createElement(Ae,{toast:e}),s=h.createElement(Pe,{...e.ariaProps},z(e.message,e));return h.createElement(De,{className:e.className,style:{...l,...r,...e.style}},typeof n=="function"?n({icon:o,message:s}):h.createElement(h.Fragment,null,o,s))});se(h.createElement);C`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;function Oe(){const{user:e,userProfile:a,refreshProfile:r}=Y(),n=Q(),[l,o]=h.useState(!1),[s,c]=h.useState(!1),[i,u]=h.useState({nome:"",telefone:"",avatar_url:""}),[p,b]=h.useState({senhaAtual:"",novaSenha:"",confirmarSenha:""});h.useEffect(()=>{a&&u({nome:a.nome||a.name||"",telefone:a.phone||"",avatar_url:a.avatar_url||""})},[a]);const v=m=>{const f=m.replace(/\D/g,"");return f.length<=11?f.replace(/(\d{2})(\d{5})(\d{4})/,"($1) $2-$3"):f.substring(0,11).replace(/(\d{2})(\d{5})(\d{4})/,"($1) $2-$3")},L=m=>{const{name:f,value:g}=m.target;u(f==="telefone"?x=>({...x,[f]:v(g)}):x=>({...x,[f]:g}))},D=m=>{const{name:f,value:g}=m.target;b(x=>({...x,[f]:g}))},H=async m=>{if(!e)return;if(!["image/jpeg","image/jpg","image/png","image/gif","image/webp"].includes(m.type)){d.error("Tipo de arquivo não suportado. Use apenas imagens (JPG, PNG, GIF, WebP).");return}if(m.size>5*1024*1024){d.error("Arquivo muito grande. O tamanho máximo é 5MB.");return}c(!0);try{const g=m.name.split(".").pop(),x=`avatar_${e.id}_${Date.now()}.${g}`;if(i.avatar_url){const _=i.avatar_url.split("/").pop();_&&await $.storage.from("avatars").remove([_])}const{error:A}=await $.storage.from("avatars").upload(x,m,{cacheControl:"3600",upsert:!1});if(A)throw A;const{data:j}=$.storage.from("avatars").getPublicUrl(x);u(_=>({..._,avatar_url:j.publicUrl})),d.success('Foto enviada! Clique em "Salvar Alterações" para confirmar.')}catch(g){d.error("Erro ao enviar foto: "+(g.message||"Erro desconhecido"))}finally{c(!1)}},W=()=>{u(m=>({...m,avatar_url:""})),d.success('Foto removida! Clique em "Salvar Alterações" para confirmar.')},Z=async()=>{if(!e)return;const m=i.nome.trim();if(!m){d.error("O nome não pode estar vazio.");return}const f=i.telefone.replace(/\D/g,"");if(f&&f.length<10){d.error("Telefone inválido. Digite um número com DDD (ex: 11 99999-9999).");return}const g=f||null;o(!0);try{const{data:x,error:A}=await $.from("profiles").update({nome:m,name:m,phone:g,avatar_url:i.avatar_url||null}).eq("id",e.id).select().single();if(A)throw A;x&&u(j=>({...j,nome:x.nome||x.name||j.nome,telefone:x.phone?v(x.phone):j.telefone,avatar_url:x.avatar_url||j.avatar_url})),await r(),await new Promise(j=>setTimeout(j,300)),d.success("Perfil atualizado com sucesso!"),n("/",{replace:!0})}catch(x){d.error("Erro ao salvar perfil: "+(x.message||"Erro desconhecido"))}finally{o(!1)}},B=async()=>{if(!p.senhaAtual||!p.novaSenha){d.error("Preencha todos os campos de senha.");return}if(p.novaSenha!==p.confirmarSenha){d.error("A nova senha e a confirmação não coincidem.");return}if(p.novaSenha.length<6){d.error("A nova senha deve ter pelo menos 6 caracteres.");return}o(!0);try{const{error:m}=await $.auth.updateUser({password:p.novaSenha});if(m)throw m;b({senhaAtual:"",novaSenha:"",confirmarSenha:""}),d.success("Senha alterada com sucesso!")}catch(m){d.error("Erro ao alterar senha: "+(m.message||"Erro desconhecido"))}finally{o(!1)}},J=(()=>{const m=i.nome?.trim(),f=a?.nome||a?.name||"",g=m||f;return g?g.split(/\s+/)[0]:e?.email?.split("@")[0]||"Usuário"})();return t.jsx(K,{children:t.jsx("div",{className:"min-h-screen bg-gray-900 text-white",children:t.jsxs("div",{className:"max-w-3xl mx-auto px-4 py-6 sm:py-8",children:[t.jsx("div",{className:"bg-gray-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 sm:p-6 mb-6",children:t.jsxs("div",{className:"flex items-center gap-3 sm:gap-4",children:[t.jsx("div",{className:"relative flex-shrink-0",children:a?.avatar_url?t.jsx("img",{src:a.avatar_url,alt:"Avatar",className:"w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-emerald-400/20"}):t.jsx("div",{className:"w-14 h-14 sm:w-16 sm:h-16 bg-gray-700 rounded-full flex items-center justify-center border-4 border-emerald-400/20",children:t.jsx("i",{className:"ri-user-line text-2xl text-gray-400"})})}),t.jsxs("div",{className:"min-w-0",children:[t.jsx("h1",{className:"text-lg sm:text-2xl font-bold text-white truncate",children:J}),t.jsx("p",{className:"text-sm text-gray-400 truncate",children:e?.email})]})]})}),t.jsxs("div",{className:"bg-gray-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 sm:p-6 mb-6",children:[t.jsxs("h3",{className:"text-base sm:text-lg font-semibold text-white mb-5 flex items-center gap-2",children:[t.jsx("div",{className:"w-5 h-5 flex items-center justify-center",children:t.jsx("i",{className:"ri-user-line text-emerald-400"})}),"Dados Pessoais"]}),t.jsxs("div",{className:"mb-5",children:[t.jsx("label",{className:"block text-sm font-medium text-gray-300 mb-3",children:"Foto do Perfil"}),t.jsxs("div",{className:"flex items-center gap-4",children:[t.jsxs("div",{className:"relative flex-shrink-0",children:[i.avatar_url?t.jsx("img",{src:i.avatar_url,alt:"Avatar",className:"w-16 h-16 rounded-full object-cover border-4 border-emerald-400/20"}):t.jsx("div",{className:"w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center border-4 border-emerald-400/20",children:t.jsx("i",{className:"ri-user-line text-2xl text-gray-400"})}),s&&t.jsx("div",{className:"absolute inset-0 bg-black/50 rounded-full flex items-center justify-center",children:t.jsx("div",{className:"w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"})})]}),t.jsxs("div",{className:"flex flex-col gap-2",children:[t.jsxs("label",{className:"bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors whitespace-nowrap",children:[s?"Enviando...":"Trocar foto",t.jsx("input",{type:"file",accept:"image/*",onChange:m=>{const f=m.target.files?.[0];f&&H(f)},className:"hidden",disabled:s})]}),i.avatar_url&&t.jsx("button",{type:"button",onClick:W,className:"text-red-400 hover:text-red-300 text-sm transition-colors cursor-pointer whitespace-nowrap",disabled:s,children:"Remover"})]})]})]}),t.jsxs("div",{className:"space-y-4",children:[t.jsxs("div",{children:[t.jsx("label",{className:"block text-sm font-medium text-gray-300 mb-2",children:"Email"}),t.jsx("input",{type:"email",value:e?.email||"",disabled:!0,className:"w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed text-sm"})]}),t.jsxs("div",{children:[t.jsx("label",{className:"block text-sm font-medium text-gray-300 mb-2",children:"Nome Completo"}),t.jsx("input",{type:"text",name:"nome",value:i.nome,onChange:L,placeholder:"Seu nome completo",className:"w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm"})]}),t.jsxs("div",{children:[t.jsx("label",{className:"block text-sm font-medium text-gray-300 mb-2",children:"Telefone"}),t.jsx("input",{type:"text",name:"telefone",value:i.telefone,onChange:L,placeholder:"(00) 00000-0000",maxLength:15,className:"w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm"})]})]}),t.jsx("div",{className:"mt-6 flex justify-end",children:t.jsx("button",{onClick:Z,disabled:l,className:"bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer text-sm",children:l?t.jsxs(t.Fragment,{children:[t.jsx("div",{className:"w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"}),"Salvando..."]}):t.jsxs(t.Fragment,{children:[t.jsx("div",{className:"w-4 h-4 flex items-center justify-center",children:t.jsx("i",{className:"ri-save-line"})}),"Salvar Alterações"]})})})]}),t.jsxs("div",{className:"bg-gray-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 sm:p-6",children:[t.jsxs("h3",{className:"text-base sm:text-lg font-semibold text-white mb-5 flex items-center gap-2",children:[t.jsx("div",{className:"w-5 h-5 flex items-center justify-center",children:t.jsx("i",{className:"ri-lock-line text-yellow-400"})}),"Alterar Senha"]}),t.jsxs("div",{className:"space-y-4",children:[t.jsxs("div",{children:[t.jsx("label",{className:"block text-sm font-medium text-gray-300 mb-2",children:"Senha Atual"}),t.jsx("input",{type:"password",name:"senhaAtual",value:p.senhaAtual,onChange:D,placeholder:"Digite sua senha atual",className:"w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm"})]}),t.jsxs("div",{children:[t.jsx("label",{className:"block text-sm font-medium text-gray-300 mb-2",children:"Nova Senha"}),t.jsx("input",{type:"password",name:"novaSenha",value:p.novaSenha,onChange:D,placeholder:"Digite a nova senha",className:"w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm"})]}),t.jsxs("div",{children:[t.jsx("label",{className:"block text-sm font-medium text-gray-300 mb-2",children:"Confirmar Nova Senha"}),t.jsx("input",{type:"password",name:"confirmarSenha",value:p.confirmarSenha,onChange:D,placeholder:"Confirme a nova senha",className:"w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm"})]})]}),t.jsx("div",{className:"mt-6 flex justify-end",children:t.jsx("button",{onClick:B,disabled:l,className:"bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer text-sm",children:l?t.jsxs(t.Fragment,{children:[t.jsx("div",{className:"w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"}),"Alterando..."]}):t.jsxs(t.Fragment,{children:[t.jsx("div",{className:"w-4 h-4 flex items-center justify-center",children:t.jsx("i",{className:"ri-key-line"})}),"Alterar Senha"]})})})]})]})})})}export{Oe as default};
//# sourceMappingURL=page-lXfB0dea.js.map
