import{r as h,u as V,j as r,s as k}from"./index-DqFTS9ue.js";import{u as Y}from"./useAuth-DVAZNQHW.js";import{M as K}from"./MainLayout-DkukGPu1.js";let X={data:""},ee=e=>{if(typeof window=="object"){let a=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return a.nonce=window.__nonce__,a.parentNode||(e||document.head).appendChild(a),a.firstChild}return e||X},ae=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,re=/\/\*[^]*?\*\/|  +/g,O=/\n+/g,N=(e,a)=>{let t="",i="",c="";for(let o in e){let s=e[o];o[0]=="@"?o[1]=="i"?t=o+" "+s+";":i+=o[1]=="f"?N(s,o):o+"{"+N(s,o[1]=="k"?"":a)+"}":typeof s=="object"?i+=N(s,a?a.replace(/([^,])+/g,m=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,l=>/&/.test(l)?l.replace(/&/g,m):m?m+" "+l:l)):o):s!=null&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),c+=N.p?N.p(o,s):o+":"+s+";")}return t+(a&&c?a+"{"+c+"}":c)+i},y={},I=e=>{if(typeof e=="object"){let a="";for(let t in e)a+=t+I(e[t]);return a}return e},te=(e,a,t,i,c)=>{let o=I(e),s=y[o]||(y[o]=(l=>{let u=0,f=11;for(;u<l.length;)f=101*f+l.charCodeAt(u++)>>>0;return"go"+f})(o));if(!y[s]){let l=o!==e?e:(u=>{let f,b,v=[{}];for(;f=ae.exec(u.replace(re,""));)f[4]?v.shift():f[3]?(b=f[3].replace(O," ").trim(),v.unshift(v[0][b]=v[0][b]||{})):v[0][f[1]]=f[2].replace(O," ").trim();return v[0]})(e);y[s]=N(c?{["@keyframes "+s]:l}:l,t?"":"."+s)}let m=t&&y.g?y.g:null;return t&&(y.g=y[s]),((l,u,f,b)=>{b?u.data=u.data.replace(b,l):u.data.indexOf(l)===-1&&(u.data=f?l+u.data:u.data+l)})(y[s],a,i,m),s},se=(e,a,t)=>e.reduce((i,c,o)=>{let s=a[o];if(s&&s.call){let m=s(t),l=m&&m.props&&m.props.className||/^go/.test(m)&&m;s=l?"."+l:m&&typeof m=="object"?m.props?"":N(m,""):m===!1?"":m}return i+c+(s??"")},"");function C(e){let a=this||{},t=e.call?e(a.p):e;return te(t.unshift?t.raw?se(t,[].slice.call(arguments,1),a.p):t.reduce((i,c)=>Object.assign(i,c&&c.call?c(a.p):c),{}):t,ee(a.target),a.g,a.o,a.k)}let q,F,P;C.bind({g:1});let w=C.bind({k:1});function oe(e,a,t,i){N.p=a,q=e,F=t,P=i}function S(e,a){let t=this||{};return function(){let i=arguments;function c(o,s){let m=Object.assign({},o),l=m.className||c.className;t.p=Object.assign({theme:F&&F()},m),t.o=/ *go\d+/.test(l),m.className=C.apply(t,i)+(l?" "+l:"");let u=e;return e[0]&&(u=m.as||e,delete m.as),P&&u[0]&&P(m),q(u,m)}return c}}var ie=e=>typeof e=="function",L=(e,a)=>ie(e)?e(a):e,ne=(()=>{let e=0;return()=>(++e).toString()})(),le=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let a=matchMedia("(prefers-reduced-motion: reduce)");e=!a||a.matches}return e}})(),ce=20,U="default",M=(e,a)=>{let{toastLimit:t}=e.settings;switch(a.type){case 0:return{...e,toasts:[a.toast,...e.toasts].slice(0,t)};case 1:return{...e,toasts:e.toasts.map(s=>s.id===a.toast.id?{...s,...a.toast}:s)};case 2:let{toast:i}=a;return M(e,{type:e.toasts.find(s=>s.id===i.id)?1:0,toast:i});case 3:let{toastId:c}=a;return{...e,toasts:e.toasts.map(s=>s.id===c||c===void 0?{...s,dismissed:!0,visible:!1}:s)};case 4:return a.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(s=>s.id!==a.toastId)};case 5:return{...e,pausedAt:a.time};case 6:let o=a.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(s=>({...s,pauseDuration:s.pauseDuration+o}))}}},de=[],me={toasts:[],pausedAt:void 0,settings:{toastLimit:ce}},E={},R=(e,a=U)=>{E[a]=M(E[a]||me,e),de.forEach(([t,i])=>{t===a&&i(E[a])})},G=e=>Object.keys(E).forEach(a=>R(e,a)),ue=e=>Object.keys(E).find(a=>E[a].toasts.some(t=>t.id===e)),T=(e=U)=>a=>{R(a,e)},pe=(e,a="blank",t)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:a,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...t,id:t?.id||ne()}),$=e=>(a,t)=>{let i=pe(a,e,t);return T(i.toasterId||ue(i.id))({type:2,toast:i}),i.id},n=(e,a)=>$("blank")(e,a);n.error=$("error");n.success=$("success");n.loading=$("loading");n.custom=$("custom");n.dismiss=(e,a)=>{let t={type:3,toastId:e};a?T(a)(t):G(t)};n.dismissAll=e=>n.dismiss(void 0,e);n.remove=(e,a)=>{let t={type:4,toastId:e};a?T(a)(t):G(t)};n.removeAll=e=>n.remove(void 0,e);n.promise=(e,a,t)=>{let i=n.loading(a.loading,{...t,...t?.loading});return typeof e=="function"&&(e=e()),e.then(c=>{let o=a.success?L(a.success,c):void 0;return o?n.success(o,{id:i,...t,...t?.success}):n.dismiss(i),c}).catch(c=>{let o=a.error?L(a.error,c):void 0;o?n.error(o,{id:i,...t,...t?.error}):n.dismiss(i)}),e};var fe=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,he=w`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,xe=w`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,ge=S("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${fe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${he} 0.15s ease-out forwards;
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
    animation: ${xe} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,be=w`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,ve=S("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${be} 1s linear infinite;
`,ye=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,we=w`
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
}`,je=S("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ye} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${we} 0.2s ease-out forwards;
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
`,Ne=S("div")`
  position: absolute;
`,Se=S("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,ke=w`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Ee=S("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${ke} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,Ae=({toast:e})=>{let{icon:a,type:t,iconTheme:i}=e;return a!==void 0?typeof a=="string"?h.createElement(Ee,null,a):a:t==="blank"?null:h.createElement(Se,null,h.createElement(ve,{...i}),t!=="loading"&&h.createElement(Ne,null,t==="error"?h.createElement(ge,{...i}):h.createElement(je,{...i})))},$e=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,_e=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,Ce="0%{opacity:0;} 100%{opacity:1;}",De="0%{opacity:1;} 100%{opacity:0;}",Fe=S("div")`
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
`,Le=(e,a)=>{let t=e.includes("top")?1:-1,[i,c]=le()?[Ce,De]:[$e(t),_e(t)];return{animation:a?`${w(i)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${w(c)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};h.memo(({toast:e,position:a,style:t,children:i})=>{let c=e.height?Le(e.position||a||"top-center",e.visible):{opacity:0},o=h.createElement(Ae,{toast:e}),s=h.createElement(Pe,{...e.ariaProps},L(e.message,e));return h.createElement(Fe,{className:e.className,style:{...c,...t,...e.style}},typeof i=="function"?i({icon:o,message:s}):h.createElement(h.Fragment,null,o,s))});oe(h.createElement);C`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;function Ie(){const{user:e,userProfile:a,refreshProfile:t}=Y(),i=V(),[c,o]=h.useState(!1),[s,m]=h.useState(!1),[l,u]=h.useState({nome:"",telefone:"",avatar_url:""}),[f,b]=h.useState({senhaAtual:"",novaSenha:"",confirmarSenha:""});h.useEffect(()=>{a&&u({nome:a.nome||a.name||"",telefone:a.phone||"",avatar_url:a.avatar_url||""})},[a]);const v=d=>{const p=d.replace(/\D/g,"");return p.length<=11?p.replace(/(\d{2})(\d{5})(\d{4})/,"($1) $2-$3"):p.substring(0,11).replace(/(\d{2})(\d{5})(\d{4})/,"($1) $2-$3")},z=d=>{const{name:p,value:g}=d.target;u(p==="telefone"?x=>({...x,[p]:v(g)}):x=>({...x,[p]:g}))},D=d=>{const{name:p,value:g}=d.target;b(x=>({...x,[p]:g}))},H=async d=>{if(!e)return;if(!["image/jpeg","image/jpg","image/png","image/gif","image/webp"].includes(d.type)){n.error("Tipo de arquivo não suportado. Use apenas imagens (JPG, PNG, GIF, WebP).");return}if(d.size>5*1024*1024){n.error("Arquivo muito grande. O tamanho máximo é 5MB.");return}m(!0);try{const g=d.name.split(".").pop(),x=`avatar_${e.id}_${Date.now()}.${g}`;if(l.avatar_url){const _=l.avatar_url.split("/").pop();_&&await k.storage.from("avatars").remove([_])}const{error:A}=await k.storage.from("avatars").upload(x,d,{cacheControl:"3600",upsert:!1});if(A)throw A;const{data:j}=k.storage.from("avatars").getPublicUrl(x);u(_=>({..._,avatar_url:j.publicUrl})),n.success('Foto enviada! Clique em "Salvar Alterações" para confirmar.')}catch(g){n.error("Erro ao enviar foto: "+(g.message||"Erro desconhecido"))}finally{m(!1)}},W=()=>{u(d=>({...d,avatar_url:""})),n.success('Foto removida! Clique em "Salvar Alterações" para confirmar.')},Z=async()=>{if(!e)return;const d=l.nome.trim();if(!d){n.error("O nome não pode estar vazio.");return}const p=l.telefone.replace(/\D/g,"");if(p&&p.length<10){n.error("Telefone inválido. Digite um número com DDD (ex: 11 99999-9999).");return}const g=p||null;o(!0);try{const{data:x,error:A}=await k.from("profiles").update({nome:d,name:d,phone:g,avatar_url:l.avatar_url||null}).eq("id",e.id).select().single();if(A)throw A;x&&u(j=>({...j,nome:x.nome||x.name||j.nome,telefone:x.phone?v(x.phone):j.telefone,avatar_url:x.avatar_url||j.avatar_url})),await t(),await new Promise(j=>setTimeout(j,300)),n.success("Perfil atualizado com sucesso!"),i("/",{replace:!0})}catch(x){n.error("Erro ao salvar perfil: "+(x.message||"Erro desconhecido"))}finally{o(!1)}},B=async()=>{if(!f.novaSenha){n.error("Digite a nova senha.");return}if(f.novaSenha!==f.confirmarSenha){n.error("A nova senha e a confirmação não coincidem.");return}if(f.novaSenha.length<6){n.error("A nova senha deve ter pelo menos 6 caracteres.");return}o(!0);try{const{error:d}=await k.auth.updateUser({password:f.novaSenha});if(d){(d.message||"").toString().toLowerCase().includes("invalid")?n.error('Não foi possível alterar a senha. Use "Esqueci a senha" para criar uma senha por e-mail.'):n.error("Erro ao alterar senha: "+(d.message||"Erro desconhecido"));return}b({senhaAtual:"",novaSenha:"",confirmarSenha:""}),n.success("Senha alterada com sucesso! Agora você pode usar e-mail e senha para entrar.")}catch(d){n.error("Erro ao alterar senha: "+(d.message||"Erro desconhecido"))}finally{o(!1)}},J=async()=>{if(!e?.email){n.error("E-mail não disponível para envio.");return}o(!0);try{const d=`${window.location.origin}/login`,{error:p}=await k.auth.resetPasswordForEmail(e.email,{redirectTo:d});if(p)throw p;n.success("Link para criação de senha enviado ao seu e-mail. Verifique a caixa de entrada.")}catch(d){n.error("Erro ao enviar link: "+(d.message||"Erro desconhecido"))}finally{o(!1)}},Q=(()=>{const d=l.nome?.trim(),p=a?.nome||a?.name||"",g=d||p;return g?g.split(/\s+/)[0]:e?.email?.split("@")[0]||"Usuário"})();return r.jsx(K,{children:r.jsx("div",{className:"min-h-screen bg-gray-900 text-white",children:r.jsxs("div",{className:"max-w-3xl mx-auto px-4 py-6 sm:py-8",children:[r.jsx("div",{className:"bg-gray-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 sm:p-6 mb-6",children:r.jsxs("div",{className:"flex items-center gap-3 sm:gap-4",children:[r.jsx("div",{className:"relative flex-shrink-0",children:a?.avatar_url?r.jsx("img",{src:a.avatar_url,alt:"Avatar",className:"w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-emerald-400/20"}):r.jsx("div",{className:"w-14 h-14 sm:w-16 sm:h-16 bg-gray-700 rounded-full flex items-center justify-center border-4 border-emerald-400/20",children:r.jsx("i",{className:"ri-user-line text-2xl text-gray-400"})})}),r.jsxs("div",{className:"min-w-0",children:[r.jsx("h1",{className:"text-lg sm:text-2xl font-bold text-white truncate",children:Q}),r.jsx("p",{className:"text-sm text-gray-400 truncate",children:e?.email})]})]})}),r.jsxs("div",{className:"bg-gray-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 sm:p-6 mb-6",children:[r.jsxs("h3",{className:"text-base sm:text-lg font-semibold text-white mb-5 flex items-center gap-2",children:[r.jsx("div",{className:"w-5 h-5 flex items-center justify-center",children:r.jsx("i",{className:"ri-user-line text-emerald-400"})}),"Dados Pessoais"]}),r.jsxs("div",{className:"mb-5",children:[r.jsx("label",{className:"block text-sm font-medium text-gray-300 mb-3",children:"Foto do Perfil"}),r.jsxs("div",{className:"flex items-center gap-4",children:[r.jsxs("div",{className:"relative flex-shrink-0",children:[l.avatar_url?r.jsx("img",{src:l.avatar_url,alt:"Avatar",className:"w-16 h-16 rounded-full object-cover border-4 border-emerald-400/20"}):r.jsx("div",{className:"w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center border-4 border-emerald-400/20",children:r.jsx("i",{className:"ri-user-line text-2xl text-gray-400"})}),s&&r.jsx("div",{className:"absolute inset-0 bg-black/50 rounded-full flex items-center justify-center",children:r.jsx("div",{className:"w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"})})]}),r.jsxs("div",{className:"flex flex-col gap-2",children:[r.jsxs("label",{className:"bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors whitespace-nowrap",children:[s?"Enviando...":"Trocar foto",r.jsx("input",{type:"file",accept:"image/*",onChange:d=>{const p=d.target.files?.[0];p&&H(p)},className:"hidden",disabled:s})]}),l.avatar_url&&r.jsx("button",{type:"button",onClick:W,className:"text-red-400 hover:text-red-300 text-sm transition-colors cursor-pointer whitespace-nowrap",disabled:s,children:"Remover"})]})]})]}),r.jsx("div",{className:"mt-4",children:r.jsxs("button",{onClick:J,className:"inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 text-sm text-[#9CA3AF]",children:[r.jsx("i",{className:"ri-mail-line"}),"Enviar link para criar/recuperar senha"]})}),r.jsxs("div",{className:"space-y-4",children:[r.jsxs("div",{children:[r.jsx("label",{className:"block text-sm font-medium text-gray-300 mb-2",children:"Email"}),r.jsx("input",{type:"email",value:e?.email||"",disabled:!0,className:"w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed text-sm"})]}),r.jsxs("div",{children:[r.jsx("label",{className:"block text-sm font-medium text-gray-300 mb-2",children:"Nome Completo"}),r.jsx("input",{type:"text",name:"nome",value:l.nome,onChange:z,placeholder:"Seu nome completo",className:"w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm"})]}),r.jsxs("div",{children:[r.jsx("label",{className:"block text-sm font-medium text-gray-300 mb-2",children:"Telefone"}),r.jsx("input",{type:"text",name:"telefone",value:l.telefone,onChange:z,placeholder:"(00) 00000-0000",maxLength:15,className:"w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm"})]})]}),r.jsx("div",{className:"mt-6 flex justify-end",children:r.jsx("button",{onClick:Z,disabled:c,className:"bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer text-sm",children:c?r.jsxs(r.Fragment,{children:[r.jsx("div",{className:"w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"}),"Salvando..."]}):r.jsxs(r.Fragment,{children:[r.jsx("div",{className:"w-4 h-4 flex items-center justify-center",children:r.jsx("i",{className:"ri-save-line"})}),"Salvar Alterações"]})})})]}),r.jsxs("div",{className:"bg-gray-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 sm:p-6",children:[r.jsxs("h3",{className:"text-base sm:text-lg font-semibold text-white mb-5 flex items-center gap-2",children:[r.jsx("div",{className:"w-5 h-5 flex items-center justify-center",children:r.jsx("i",{className:"ri-lock-line text-yellow-400"})}),"Alterar Senha"]}),r.jsxs("div",{className:"space-y-4",children:[r.jsxs("div",{children:[r.jsx("label",{className:"block text-sm font-medium text-gray-300 mb-2",children:"Senha Atual"}),r.jsx("input",{type:"password",name:"senhaAtual",value:f.senhaAtual,onChange:D,placeholder:"Digite sua senha atual",className:"w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm"})]}),r.jsxs("div",{children:[r.jsx("label",{className:"block text-sm font-medium text-gray-300 mb-2",children:"Nova Senha"}),r.jsx("input",{type:"password",name:"novaSenha",value:f.novaSenha,onChange:D,placeholder:"Digite a nova senha",className:"w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm"})]}),r.jsxs("div",{children:[r.jsx("label",{className:"block text-sm font-medium text-gray-300 mb-2",children:"Confirmar Nova Senha"}),r.jsx("input",{type:"password",name:"confirmarSenha",value:f.confirmarSenha,onChange:D,placeholder:"Confirme a nova senha",className:"w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm"})]})]}),r.jsx("div",{className:"mt-6 flex justify-end",children:r.jsx("button",{onClick:B,disabled:c,className:"bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer text-sm",children:c?r.jsxs(r.Fragment,{children:[r.jsx("div",{className:"w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"}),"Alterando..."]}):r.jsxs(r.Fragment,{children:[r.jsx("div",{className:"w-4 h-4 flex items-center justify-center",children:r.jsx("i",{className:"ri-key-line"})}),"Alterar Senha"]})})})]})]})})})}export{Ie as default};
//# sourceMappingURL=page-Ha0npl0a.js.map
