(function(){"use strict";function Ld(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var Hd={exports:{}},Fi={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Oy=Symbol.for("react.transitional.element"),Dy=Symbol.for("react.fragment");function Bd(e,t,n){var a=null;if(n!==void 0&&(a=""+n),t.key!==void 0&&(a=""+t.key),"key"in t){n={};for(var l in t)l!=="key"&&(n[l]=t[l])}else n=t;return t=n.ref,{$$typeof:Oy,type:e,key:a,ref:t!==void 0?t:null,props:n}}Fi.Fragment=Dy,Fi.jsx=Bd,Fi.jsxs=Bd,Hd.exports=Fi;var s=Hd.exports,Yd={exports:{}},Z={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var tc=Symbol.for("react.transitional.element"),zy=Symbol.for("react.portal"),My=Symbol.for("react.fragment"),Ry=Symbol.for("react.strict_mode"),Uy=Symbol.for("react.profiler"),ky=Symbol.for("react.consumer"),Ly=Symbol.for("react.context"),Hy=Symbol.for("react.forward_ref"),By=Symbol.for("react.suspense"),Yy=Symbol.for("react.memo"),$d=Symbol.for("react.lazy"),$y=Symbol.for("react.activity"),Gd=Symbol.iterator;function Gy(e){return e===null||typeof e!="object"?null:(e=Gd&&e[Gd]||e["@@iterator"],typeof e=="function"?e:null)}var qd={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},Vd=Object.assign,Xd={};function Da(e,t,n){this.props=e,this.context=t,this.refs=Xd,this.updater=n||qd}Da.prototype.isReactComponent={},Da.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")},Da.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function Qd(){}Qd.prototype=Da.prototype;function nc(e,t,n){this.props=e,this.context=t,this.refs=Xd,this.updater=n||qd}var ac=nc.prototype=new Qd;ac.constructor=nc,Vd(ac,Da.prototype),ac.isPureReactComponent=!0;var Zd=Array.isArray;function lc(){}var fe={H:null,A:null,T:null,S:null},Kd=Object.prototype.hasOwnProperty;function ic(e,t,n){var a=n.ref;return{$$typeof:tc,type:e,key:t,ref:a!==void 0?a:null,props:n}}function qy(e,t){return ic(e.type,t,e.props)}function rc(e){return typeof e=="object"&&e!==null&&e.$$typeof===tc}function Vy(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(n){return t[n]})}var Fd=/\/+/g;function sc(e,t){return typeof e=="object"&&e!==null&&e.key!=null?Vy(""+e.key):t.toString(36)}function Xy(e){switch(e.status){case"fulfilled":return e.value;case"rejected":throw e.reason;default:switch(typeof e.status=="string"?e.then(lc,lc):(e.status="pending",e.then(function(t){e.status==="pending"&&(e.status="fulfilled",e.value=t)},function(t){e.status==="pending"&&(e.status="rejected",e.reason=t)})),e.status){case"fulfilled":return e.value;case"rejected":throw e.reason}}throw e}function za(e,t,n,a,l){var i=typeof e;(i==="undefined"||i==="boolean")&&(e=null);var r=!1;if(e===null)r=!0;else switch(i){case"bigint":case"string":case"number":r=!0;break;case"object":switch(e.$$typeof){case tc:case zy:r=!0;break;case $d:return r=e._init,za(r(e._payload),t,n,a,l)}}if(r)return l=l(e),r=a===""?"."+sc(e,0):a,Zd(l)?(n="",r!=null&&(n=r.replace(Fd,"$&/")+"/"),za(l,t,n,"",function(u){return u})):l!=null&&(rc(l)&&(l=qy(l,n+(l.key==null||e&&e.key===l.key?"":(""+l.key).replace(Fd,"$&/")+"/")+r)),t.push(l)),1;r=0;var c=a===""?".":a+":";if(Zd(e))for(var o=0;o<e.length;o++)a=e[o],i=c+sc(a,o),r+=za(a,t,n,i,l);else if(o=Gy(e),typeof o=="function")for(e=o.call(e),o=0;!(a=e.next()).done;)a=a.value,i=c+sc(a,o++),r+=za(a,t,n,i,l);else if(i==="object"){if(typeof e.then=="function")return za(Xy(e),t,n,a,l);throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.")}return r}function Ji(e,t,n){if(e==null)return e;var a=[],l=0;return za(e,a,"","",function(i){return t.call(n,i,l++)}),a}function Qy(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(n){(e._status===0||e._status===-1)&&(e._status=1,e._result=n)},function(n){(e._status===0||e._status===-1)&&(e._status=2,e._result=n)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var Jd=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)},Zy={map:Ji,forEach:function(e,t,n){Ji(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return Ji(e,function(){t++}),t},toArray:function(e){return Ji(e,function(t){return t})||[]},only:function(e){if(!rc(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};Z.Activity=$y,Z.Children=Zy,Z.Component=Da,Z.Fragment=My,Z.Profiler=Uy,Z.PureComponent=nc,Z.StrictMode=Ry,Z.Suspense=By,Z.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=fe,Z.__COMPILER_RUNTIME={__proto__:null,c:function(e){return fe.H.useMemoCache(e)}},Z.cache=function(e){return function(){return e.apply(null,arguments)}},Z.cacheSignal=function(){return null},Z.cloneElement=function(e,t,n){if(e==null)throw Error("The argument must be a React element, but you passed "+e+".");var a=Vd({},e.props),l=e.key;if(t!=null)for(i in t.key!==void 0&&(l=""+t.key),t)!Kd.call(t,i)||i==="key"||i==="__self"||i==="__source"||i==="ref"&&t.ref===void 0||(a[i]=t[i]);var i=arguments.length-2;if(i===1)a.children=n;else if(1<i){for(var r=Array(i),c=0;c<i;c++)r[c]=arguments[c+2];a.children=r}return ic(e.type,l,a)},Z.createContext=function(e){return e={$$typeof:Ly,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null},e.Provider=e,e.Consumer={$$typeof:ky,_context:e},e},Z.createElement=function(e,t,n){var a,l={},i=null;if(t!=null)for(a in t.key!==void 0&&(i=""+t.key),t)Kd.call(t,a)&&a!=="key"&&a!=="__self"&&a!=="__source"&&(l[a]=t[a]);var r=arguments.length-2;if(r===1)l.children=n;else if(1<r){for(var c=Array(r),o=0;o<r;o++)c[o]=arguments[o+2];l.children=c}if(e&&e.defaultProps)for(a in r=e.defaultProps,r)l[a]===void 0&&(l[a]=r[a]);return ic(e,i,l)},Z.createRef=function(){return{current:null}},Z.forwardRef=function(e){return{$$typeof:Hy,render:e}},Z.isValidElement=rc,Z.lazy=function(e){return{$$typeof:$d,_payload:{_status:-1,_result:e},_init:Qy}},Z.memo=function(e,t){return{$$typeof:Yy,type:e,compare:t===void 0?null:t}},Z.startTransition=function(e){var t=fe.T,n={};fe.T=n;try{var a=e(),l=fe.S;l!==null&&l(n,a),typeof a=="object"&&a!==null&&typeof a.then=="function"&&a.then(lc,Jd)}catch(i){Jd(i)}finally{t!==null&&n.types!==null&&(t.types=n.types),fe.T=t}},Z.unstable_useCacheRefresh=function(){return fe.H.useCacheRefresh()},Z.use=function(e){return fe.H.use(e)},Z.useActionState=function(e,t,n){return fe.H.useActionState(e,t,n)},Z.useCallback=function(e,t){return fe.H.useCallback(e,t)},Z.useContext=function(e){return fe.H.useContext(e)},Z.useDebugValue=function(){},Z.useDeferredValue=function(e,t){return fe.H.useDeferredValue(e,t)},Z.useEffect=function(e,t){return fe.H.useEffect(e,t)},Z.useEffectEvent=function(e){return fe.H.useEffectEvent(e)},Z.useId=function(){return fe.H.useId()},Z.useImperativeHandle=function(e,t,n){return fe.H.useImperativeHandle(e,t,n)},Z.useInsertionEffect=function(e,t){return fe.H.useInsertionEffect(e,t)},Z.useLayoutEffect=function(e,t){return fe.H.useLayoutEffect(e,t)},Z.useMemo=function(e,t){return fe.H.useMemo(e,t)},Z.useOptimistic=function(e,t){return fe.H.useOptimistic(e,t)},Z.useReducer=function(e,t,n){return fe.H.useReducer(e,t,n)},Z.useRef=function(e){return fe.H.useRef(e)},Z.useState=function(e){return fe.H.useState(e)},Z.useSyncExternalStore=function(e,t,n){return fe.H.useSyncExternalStore(e,t,n)},Z.useTransition=function(){return fe.H.useTransition()},Z.version="19.2.4",Yd.exports=Z;var x=Yd.exports;const Ky=Ld(x);var Pd={exports:{}},Pi={},Wd={exports:{}},Id={};/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */(function(e){function t(E,M){var D=E.length;E.push(M);e:for(;0<D;){var Y=D-1>>>1,G=E[Y];if(0<l(G,M))E[Y]=M,E[D]=G,D=Y;else break e}}function n(E){return E.length===0?null:E[0]}function a(E){if(E.length===0)return null;var M=E[0],D=E.pop();if(D!==M){E[0]=D;e:for(var Y=0,G=E.length,Ke=G>>>1;Y<Ke;){var it=2*(Y+1)-1,xt=E[it],Ye=it+1,C=E[Ye];if(0>l(xt,D))Ye<G&&0>l(C,xt)?(E[Y]=C,E[Ye]=D,Y=Ye):(E[Y]=xt,E[it]=D,Y=it);else if(Ye<G&&0>l(C,D))E[Y]=C,E[Ye]=D,Y=Ye;else break e}}return M}function l(E,M){var D=E.sortIndex-M.sortIndex;return D!==0?D:E.id-M.id}if(e.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var i=performance;e.unstable_now=function(){return i.now()}}else{var r=Date,c=r.now();e.unstable_now=function(){return r.now()-c}}var o=[],u=[],f=1,p=null,d=3,m=!1,v=!1,S=!1,j=!1,y=typeof setTimeout=="function"?setTimeout:null,g=typeof clearTimeout=="function"?clearTimeout:null,b=typeof setImmediate<"u"?setImmediate:null;function _(E){for(var M=n(u);M!==null;){if(M.callback===null)a(u);else if(M.startTime<=E)a(u),M.sortIndex=M.expirationTime,t(o,M);else break;M=n(u)}}function T(E){if(S=!1,_(E),!v)if(n(o)!==null)v=!0,O||(O=!0,B());else{var M=n(u);M!==null&&k(T,M.startTime-E)}}var O=!1,w=-1,z=5,R=-1;function L(){return j?!0:!(e.unstable_now()-R<z)}function ee(){if(j=!1,O){var E=e.unstable_now();R=E;var M=!0;try{e:{v=!1,S&&(S=!1,g(w),w=-1),m=!0;var D=d;try{t:{for(_(E),p=n(o);p!==null&&!(p.expirationTime>E&&L());){var Y=p.callback;if(typeof Y=="function"){p.callback=null,d=p.priorityLevel;var G=Y(p.expirationTime<=E);if(E=e.unstable_now(),typeof G=="function"){p.callback=G,_(E),M=!0;break t}p===n(o)&&a(o),_(E)}else a(o);p=n(o)}if(p!==null)M=!0;else{var Ke=n(u);Ke!==null&&k(T,Ke.startTime-E),M=!1}}break e}finally{p=null,d=D,m=!1}M=void 0}}finally{M?B():O=!1}}}var B;if(typeof b=="function")B=function(){b(ee)};else if(typeof MessageChannel<"u"){var X=new MessageChannel,Q=X.port2;X.port1.onmessage=ee,B=function(){Q.postMessage(null)}}else B=function(){y(ee,0)};function k(E,M){w=y(function(){E(e.unstable_now())},M)}e.unstable_IdlePriority=5,e.unstable_ImmediatePriority=1,e.unstable_LowPriority=4,e.unstable_NormalPriority=3,e.unstable_Profiling=null,e.unstable_UserBlockingPriority=2,e.unstable_cancelCallback=function(E){E.callback=null},e.unstable_forceFrameRate=function(E){0>E||125<E?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):z=0<E?Math.floor(1e3/E):5},e.unstable_getCurrentPriorityLevel=function(){return d},e.unstable_next=function(E){switch(d){case 1:case 2:case 3:var M=3;break;default:M=d}var D=d;d=M;try{return E()}finally{d=D}},e.unstable_requestPaint=function(){j=!0},e.unstable_runWithPriority=function(E,M){switch(E){case 1:case 2:case 3:case 4:case 5:break;default:E=3}var D=d;d=E;try{return M()}finally{d=D}},e.unstable_scheduleCallback=function(E,M,D){var Y=e.unstable_now();switch(typeof D=="object"&&D!==null?(D=D.delay,D=typeof D=="number"&&0<D?Y+D:Y):D=Y,E){case 1:var G=-1;break;case 2:G=250;break;case 5:G=1073741823;break;case 4:G=1e4;break;default:G=5e3}return G=D+G,E={id:f++,callback:M,priorityLevel:E,startTime:D,expirationTime:G,sortIndex:-1},D>Y?(E.sortIndex=D,t(u,E),n(o)===null&&E===n(u)&&(S?(g(w),w=-1):S=!0,k(T,D-Y))):(E.sortIndex=G,t(o,E),v||m||(v=!0,O||(O=!0,B()))),E},e.unstable_shouldYield=L,e.unstable_wrapCallback=function(E){var M=d;return function(){var D=d;d=M;try{return E.apply(this,arguments)}finally{d=D}}}})(Id),Wd.exports=Id;var Fy=Wd.exports,ep={exports:{}},Xe={};/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Jy=x;function tp(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function jn(){}var Qe={d:{f:jn,r:function(){throw Error(tp(522))},D:jn,C:jn,L:jn,m:jn,X:jn,S:jn,M:jn},p:0,findDOMNode:null},Py=Symbol.for("react.portal");function Wy(e,t,n){var a=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:Py,key:a==null?null:""+a,children:e,containerInfo:t,implementation:n}}var Ul=Jy.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function Wi(e,t){if(e==="font")return"";if(typeof t=="string")return t==="use-credentials"?t:""}Xe.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=Qe,Xe.createPortal=function(e,t){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)throw Error(tp(299));return Wy(e,t,null,n)},Xe.flushSync=function(e){var t=Ul.T,n=Qe.p;try{if(Ul.T=null,Qe.p=2,e)return e()}finally{Ul.T=t,Qe.p=n,Qe.d.f()}},Xe.preconnect=function(e,t){typeof e=="string"&&(t?(t=t.crossOrigin,t=typeof t=="string"?t==="use-credentials"?t:"":void 0):t=null,Qe.d.C(e,t))},Xe.prefetchDNS=function(e){typeof e=="string"&&Qe.d.D(e)},Xe.preinit=function(e,t){if(typeof e=="string"&&t&&typeof t.as=="string"){var n=t.as,a=Wi(n,t.crossOrigin),l=typeof t.integrity=="string"?t.integrity:void 0,i=typeof t.fetchPriority=="string"?t.fetchPriority:void 0;n==="style"?Qe.d.S(e,typeof t.precedence=="string"?t.precedence:void 0,{crossOrigin:a,integrity:l,fetchPriority:i}):n==="script"&&Qe.d.X(e,{crossOrigin:a,integrity:l,fetchPriority:i,nonce:typeof t.nonce=="string"?t.nonce:void 0})}},Xe.preinitModule=function(e,t){if(typeof e=="string")if(typeof t=="object"&&t!==null){if(t.as==null||t.as==="script"){var n=Wi(t.as,t.crossOrigin);Qe.d.M(e,{crossOrigin:n,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0})}}else t==null&&Qe.d.M(e)},Xe.preload=function(e,t){if(typeof e=="string"&&typeof t=="object"&&t!==null&&typeof t.as=="string"){var n=t.as,a=Wi(n,t.crossOrigin);Qe.d.L(e,n,{crossOrigin:a,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0,type:typeof t.type=="string"?t.type:void 0,fetchPriority:typeof t.fetchPriority=="string"?t.fetchPriority:void 0,referrerPolicy:typeof t.referrerPolicy=="string"?t.referrerPolicy:void 0,imageSrcSet:typeof t.imageSrcSet=="string"?t.imageSrcSet:void 0,imageSizes:typeof t.imageSizes=="string"?t.imageSizes:void 0,media:typeof t.media=="string"?t.media:void 0})}},Xe.preloadModule=function(e,t){if(typeof e=="string")if(t){var n=Wi(t.as,t.crossOrigin);Qe.d.m(e,{as:typeof t.as=="string"&&t.as!=="script"?t.as:void 0,crossOrigin:n,integrity:typeof t.integrity=="string"?t.integrity:void 0})}else Qe.d.m(e)},Xe.requestFormReset=function(e){Qe.d.r(e)},Xe.unstable_batchedUpdates=function(e,t){return e(t)},Xe.useFormState=function(e,t,n){return Ul.H.useFormState(e,t,n)},Xe.useFormStatus=function(){return Ul.H.useHostTransitionStatus()},Xe.version="19.2.4";function np(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(np)}catch(e){console.error(e)}}np(),ep.exports=Xe;var cc=ep.exports;/**
 * @license React
 * react-dom-client.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Ce=Fy,ap=x,Iy=cc;function A(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function lp(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function kl(e){var t=e,n=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,t.flags&4098&&(n=t.return),e=t.return;while(e)}return t.tag===3?n:null}function ip(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function rp(e){if(e.tag===31){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function sp(e){if(kl(e)!==e)throw Error(A(188))}function ev(e){var t=e.alternate;if(!t){if(t=kl(e),t===null)throw Error(A(188));return t!==e?null:e}for(var n=e,a=t;;){var l=n.return;if(l===null)break;var i=l.alternate;if(i===null){if(a=l.return,a!==null){n=a;continue}break}if(l.child===i.child){for(i=l.child;i;){if(i===n)return sp(l),e;if(i===a)return sp(l),t;i=i.sibling}throw Error(A(188))}if(n.return!==a.return)n=l,a=i;else{for(var r=!1,c=l.child;c;){if(c===n){r=!0,n=l,a=i;break}if(c===a){r=!0,a=l,n=i;break}c=c.sibling}if(!r){for(c=i.child;c;){if(c===n){r=!0,n=i,a=l;break}if(c===a){r=!0,a=i,n=l;break}c=c.sibling}if(!r)throw Error(A(189))}}if(n.alternate!==a)throw Error(A(190))}if(n.tag!==3)throw Error(A(188));return n.stateNode.current===n?e:t}function cp(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=cp(e),t!==null)return t;e=e.sibling}return null}var me=Object.assign,tv=Symbol.for("react.element"),Ii=Symbol.for("react.transitional.element"),Ll=Symbol.for("react.portal"),Ma=Symbol.for("react.fragment"),op=Symbol.for("react.strict_mode"),oc=Symbol.for("react.profiler"),up=Symbol.for("react.consumer"),Jt=Symbol.for("react.context"),uc=Symbol.for("react.forward_ref"),dc=Symbol.for("react.suspense"),pc=Symbol.for("react.suspense_list"),fc=Symbol.for("react.memo"),wn=Symbol.for("react.lazy"),mc=Symbol.for("react.activity"),nv=Symbol.for("react.memo_cache_sentinel"),dp=Symbol.iterator;function Hl(e){return e===null||typeof e!="object"?null:(e=dp&&e[dp]||e["@@iterator"],typeof e=="function"?e:null)}var av=Symbol.for("react.client.reference");function hc(e){if(e==null)return null;if(typeof e=="function")return e.$$typeof===av?null:e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case Ma:return"Fragment";case oc:return"Profiler";case op:return"StrictMode";case dc:return"Suspense";case pc:return"SuspenseList";case mc:return"Activity"}if(typeof e=="object")switch(e.$$typeof){case Ll:return"Portal";case Jt:return e.displayName||"Context";case up:return(e._context.displayName||"Context")+".Consumer";case uc:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case fc:return t=e.displayName||null,t!==null?t:hc(e.type)||"Memo";case wn:t=e._payload,e=e._init;try{return hc(e(t))}catch{}}return null}var Bl=Array.isArray,V=ap.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,le=Iy.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,la={pending:!1,data:null,method:null,action:null},gc=[],Ra=-1;function Bt(e){return{current:e}}function De(e){0>Ra||(e.current=gc[Ra],gc[Ra]=null,Ra--)}function pe(e,t){Ra++,gc[Ra]=e.current,e.current=t}var Yt=Bt(null),Yl=Bt(null),En=Bt(null),er=Bt(null);function tr(e,t){switch(pe(En,t),pe(Yl,e),pe(Yt,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?Lh(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=Lh(t),e=Hh(t,e);else switch(e){case"svg":e=1;break;case"math":e=2;break;default:e=0}}De(Yt),pe(Yt,e)}function Ua(){De(Yt),De(Yl),De(En)}function yc(e){e.memoizedState!==null&&pe(er,e);var t=Yt.current,n=Hh(t,e.type);t!==n&&(pe(Yl,e),pe(Yt,n))}function nr(e){Yl.current===e&&(De(Yt),De(Yl)),er.current===e&&(De(er),Ci._currentValue=la)}var vc,pp;function ia(e){if(vc===void 0)try{throw Error()}catch(n){var t=n.stack.trim().match(/\n( *(at )?)/);vc=t&&t[1]||"",pp=-1<n.stack.indexOf(`
    at`)?" (<anonymous>)":-1<n.stack.indexOf("@")?"@unknown:0:0":""}return`
`+vc+e+pp}var bc=!1;function xc(e,t){if(!e||bc)return"";bc=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var a={DetermineComponentFrameRoot:function(){try{if(t){var p=function(){throw Error()};if(Object.defineProperty(p.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(p,[])}catch(m){var d=m}Reflect.construct(e,[],p)}else{try{p.call()}catch(m){d=m}e.call(p.prototype)}}else{try{throw Error()}catch(m){d=m}(p=e())&&typeof p.catch=="function"&&p.catch(function(){})}}catch(m){if(m&&d&&typeof m.stack=="string")return[m.stack,d.stack]}return[null,null]}};a.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var l=Object.getOwnPropertyDescriptor(a.DetermineComponentFrameRoot,"name");l&&l.configurable&&Object.defineProperty(a.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var i=a.DetermineComponentFrameRoot(),r=i[0],c=i[1];if(r&&c){var o=r.split(`
`),u=c.split(`
`);for(l=a=0;a<o.length&&!o[a].includes("DetermineComponentFrameRoot");)a++;for(;l<u.length&&!u[l].includes("DetermineComponentFrameRoot");)l++;if(a===o.length||l===u.length)for(a=o.length-1,l=u.length-1;1<=a&&0<=l&&o[a]!==u[l];)l--;for(;1<=a&&0<=l;a--,l--)if(o[a]!==u[l]){if(a!==1||l!==1)do if(a--,l--,0>l||o[a]!==u[l]){var f=`
`+o[a].replace(" at new "," at ");return e.displayName&&f.includes("<anonymous>")&&(f=f.replace("<anonymous>",e.displayName)),f}while(1<=a&&0<=l);break}}}finally{bc=!1,Error.prepareStackTrace=n}return(n=e?e.displayName||e.name:"")?ia(n):""}function lv(e,t){switch(e.tag){case 26:case 27:case 5:return ia(e.type);case 16:return ia("Lazy");case 13:return e.child!==t&&t!==null?ia("Suspense Fallback"):ia("Suspense");case 19:return ia("SuspenseList");case 0:case 15:return xc(e.type,!1);case 11:return xc(e.type.render,!1);case 1:return xc(e.type,!0);case 31:return ia("Activity");default:return""}}function fp(e){try{var t="",n=null;do t+=lv(e,n),n=e,e=e.return;while(e);return t}catch(a){return`
Error generating stack: `+a.message+`
`+a.stack}}var Sc=Object.prototype.hasOwnProperty,_c=Ce.unstable_scheduleCallback,Nc=Ce.unstable_cancelCallback,iv=Ce.unstable_shouldYield,rv=Ce.unstable_requestPaint,ct=Ce.unstable_now,sv=Ce.unstable_getCurrentPriorityLevel,mp=Ce.unstable_ImmediatePriority,hp=Ce.unstable_UserBlockingPriority,ar=Ce.unstable_NormalPriority,cv=Ce.unstable_LowPriority,gp=Ce.unstable_IdlePriority,ov=Ce.log,uv=Ce.unstable_setDisableYieldValue,$l=null,ot=null;function An(e){if(typeof ov=="function"&&uv(e),ot&&typeof ot.setStrictMode=="function")try{ot.setStrictMode($l,e)}catch{}}var ut=Math.clz32?Math.clz32:fv,dv=Math.log,pv=Math.LN2;function fv(e){return e>>>=0,e===0?32:31-(dv(e)/pv|0)|0}var lr=256,ir=262144,rr=4194304;function ra(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&261888;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function sr(e,t,n){var a=e.pendingLanes;if(a===0)return 0;var l=0,i=e.suspendedLanes,r=e.pingedLanes;e=e.warmLanes;var c=a&134217727;return c!==0?(a=c&~i,a!==0?l=ra(a):(r&=c,r!==0?l=ra(r):n||(n=c&~e,n!==0&&(l=ra(n))))):(c=a&~i,c!==0?l=ra(c):r!==0?l=ra(r):n||(n=a&~e,n!==0&&(l=ra(n)))),l===0?0:t!==0&&t!==l&&!(t&i)&&(i=l&-l,n=t&-t,i>=n||i===32&&(n&4194048)!==0)?t:l}function Gl(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function mv(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function yp(){var e=rr;return rr<<=1,!(rr&62914560)&&(rr=4194304),e}function jc(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function ql(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function hv(e,t,n,a,l,i){var r=e.pendingLanes;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=n,e.entangledLanes&=n,e.errorRecoveryDisabledLanes&=n,e.shellSuspendCounter=0;var c=e.entanglements,o=e.expirationTimes,u=e.hiddenUpdates;for(n=r&~n;0<n;){var f=31-ut(n),p=1<<f;c[f]=0,o[f]=-1;var d=u[f];if(d!==null)for(u[f]=null,f=0;f<d.length;f++){var m=d[f];m!==null&&(m.lane&=-536870913)}n&=~p}a!==0&&vp(e,a,0),i!==0&&l===0&&e.tag!==0&&(e.suspendedLanes|=i&~(r&~t))}function vp(e,t,n){e.pendingLanes|=t,e.suspendedLanes&=~t;var a=31-ut(t);e.entangledLanes|=t,e.entanglements[a]=e.entanglements[a]|1073741824|n&261930}function bp(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var a=31-ut(n),l=1<<a;l&t|e[a]&t&&(e[a]|=t),n&=~l}}function xp(e,t){var n=t&-t;return n=n&42?1:wc(n),n&(e.suspendedLanes|t)?0:n}function wc(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function Ec(e){return e&=-e,2<e?8<e?e&134217727?32:268435456:8:2}function Sp(){var e=le.p;return e!==0?e:(e=window.event,e===void 0?32:sg(e.type))}function _p(e,t){var n=le.p;try{return le.p=e,t()}finally{le.p=n}}var Tn=Math.random().toString(36).slice(2),Ue="__reactFiber$"+Tn,Je="__reactProps$"+Tn,ka="__reactContainer$"+Tn,Ac="__reactEvents$"+Tn,gv="__reactListeners$"+Tn,yv="__reactHandles$"+Tn,Np="__reactResources$"+Tn,Vl="__reactMarker$"+Tn;function Tc(e){delete e[Ue],delete e[Je],delete e[Ac],delete e[gv],delete e[yv]}function La(e){var t=e[Ue];if(t)return t;for(var n=e.parentNode;n;){if(t=n[ka]||n[Ue]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=Xh(e);e!==null;){if(n=e[Ue])return n;e=Xh(e)}return t}e=n,n=e.parentNode}return null}function Ha(e){if(e=e[Ue]||e[ka]){var t=e.tag;if(t===5||t===6||t===13||t===31||t===26||t===27||t===3)return e}return null}function Xl(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(A(33))}function Ba(e){var t=e[Np];return t||(t=e[Np]={hoistableStyles:new Map,hoistableScripts:new Map}),t}function ze(e){e[Vl]=!0}var jp=new Set,wp={};function sa(e,t){Ya(e,t),Ya(e+"Capture",t)}function Ya(e,t){for(wp[e]=t,e=0;e<t.length;e++)jp.add(t[e])}var vv=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),Ep={},Ap={};function bv(e){return Sc.call(Ap,e)?!0:Sc.call(Ep,e)?!1:vv.test(e)?Ap[e]=!0:(Ep[e]=!0,!1)}function cr(e,t,n){if(bv(t))if(n===null)e.removeAttribute(t);else{switch(typeof n){case"undefined":case"function":case"symbol":e.removeAttribute(t);return;case"boolean":var a=t.toLowerCase().slice(0,5);if(a!=="data-"&&a!=="aria-"){e.removeAttribute(t);return}}e.setAttribute(t,""+n)}}function or(e,t,n){if(n===null)e.removeAttribute(t);else{switch(typeof n){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(t);return}e.setAttribute(t,""+n)}}function Pt(e,t,n,a){if(a===null)e.removeAttribute(n);else{switch(typeof a){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(n);return}e.setAttributeNS(t,n,""+a)}}function St(e){switch(typeof e){case"bigint":case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function Tp(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function xv(e,t,n){var a=Object.getOwnPropertyDescriptor(e.constructor.prototype,t);if(!e.hasOwnProperty(t)&&typeof a<"u"&&typeof a.get=="function"&&typeof a.set=="function"){var l=a.get,i=a.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return l.call(this)},set:function(r){n=""+r,i.call(this,r)}}),Object.defineProperty(e,t,{enumerable:a.enumerable}),{getValue:function(){return n},setValue:function(r){n=""+r},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function Cc(e){if(!e._valueTracker){var t=Tp(e)?"checked":"value";e._valueTracker=xv(e,t,""+e[t])}}function Cp(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),a="";return e&&(a=Tp(e)?e.checked?"true":"false":e.value),e=a,e!==n?(t.setValue(e),!0):!1}function ur(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}var Sv=/[\n"\\]/g;function _t(e){return e.replace(Sv,function(t){return"\\"+t.charCodeAt(0).toString(16)+" "})}function Oc(e,t,n,a,l,i,r,c){e.name="",r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"?e.type=r:e.removeAttribute("type"),t!=null?r==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+St(t)):e.value!==""+St(t)&&(e.value=""+St(t)):r!=="submit"&&r!=="reset"||e.removeAttribute("value"),t!=null?Dc(e,r,St(t)):n!=null?Dc(e,r,St(n)):a!=null&&e.removeAttribute("value"),l==null&&i!=null&&(e.defaultChecked=!!i),l!=null&&(e.checked=l&&typeof l!="function"&&typeof l!="symbol"),c!=null&&typeof c!="function"&&typeof c!="symbol"&&typeof c!="boolean"?e.name=""+St(c):e.removeAttribute("name")}function Op(e,t,n,a,l,i,r,c){if(i!=null&&typeof i!="function"&&typeof i!="symbol"&&typeof i!="boolean"&&(e.type=i),t!=null||n!=null){if(!(i!=="submit"&&i!=="reset"||t!=null)){Cc(e);return}n=n!=null?""+St(n):"",t=t!=null?""+St(t):n,c||t===e.value||(e.value=t),e.defaultValue=t}a=a??l,a=typeof a!="function"&&typeof a!="symbol"&&!!a,e.checked=c?e.checked:!!a,e.defaultChecked=!!a,r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"&&(e.name=r),Cc(e)}function Dc(e,t,n){t==="number"&&ur(e.ownerDocument)===e||e.defaultValue===""+n||(e.defaultValue=""+n)}function $a(e,t,n,a){if(e=e.options,t){t={};for(var l=0;l<n.length;l++)t["$"+n[l]]=!0;for(n=0;n<e.length;n++)l=t.hasOwnProperty("$"+e[n].value),e[n].selected!==l&&(e[n].selected=l),l&&a&&(e[n].defaultSelected=!0)}else{for(n=""+St(n),t=null,l=0;l<e.length;l++){if(e[l].value===n){e[l].selected=!0,a&&(e[l].defaultSelected=!0);return}t!==null||e[l].disabled||(t=e[l])}t!==null&&(t.selected=!0)}}function Dp(e,t,n){if(t!=null&&(t=""+St(t),t!==e.value&&(e.value=t),n==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=n!=null?""+St(n):""}function zp(e,t,n,a){if(t==null){if(a!=null){if(n!=null)throw Error(A(92));if(Bl(a)){if(1<a.length)throw Error(A(93));a=a[0]}n=a}n==null&&(n=""),t=n}n=St(t),e.defaultValue=n,a=e.textContent,a===n&&a!==""&&a!==null&&(e.value=a),Cc(e)}function Ga(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var _v=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function Mp(e,t,n){var a=t.indexOf("--")===0;n==null||typeof n=="boolean"||n===""?a?e.setProperty(t,""):t==="float"?e.cssFloat="":e[t]="":a?e.setProperty(t,n):typeof n!="number"||n===0||_v.has(t)?t==="float"?e.cssFloat=n:e[t]=(""+n).trim():e[t]=n+"px"}function Rp(e,t,n){if(t!=null&&typeof t!="object")throw Error(A(62));if(e=e.style,n!=null){for(var a in n)!n.hasOwnProperty(a)||t!=null&&t.hasOwnProperty(a)||(a.indexOf("--")===0?e.setProperty(a,""):a==="float"?e.cssFloat="":e[a]="");for(var l in t)a=t[l],t.hasOwnProperty(l)&&n[l]!==a&&Mp(e,l,a)}else for(var i in t)t.hasOwnProperty(i)&&Mp(e,i,t[i])}function zc(e){if(e.indexOf("-")===-1)return!1;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var Nv=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),jv=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function dr(e){return jv.test(""+e)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":e}function Wt(){}var Mc=null;function Rc(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var qa=null,Va=null;function Up(e){var t=Ha(e);if(t&&(e=t.stateNode)){var n=e[Je]||null;e:switch(e=t.stateNode,t.type){case"input":if(Oc(e,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name),t=n.name,n.type==="radio"&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll('input[name="'+_t(""+t)+'"][type="radio"]'),t=0;t<n.length;t++){var a=n[t];if(a!==e&&a.form===e.form){var l=a[Je]||null;if(!l)throw Error(A(90));Oc(a,l.value,l.defaultValue,l.defaultValue,l.checked,l.defaultChecked,l.type,l.name)}}for(t=0;t<n.length;t++)a=n[t],a.form===e.form&&Cp(a)}break e;case"textarea":Dp(e,n.value,n.defaultValue);break e;case"select":t=n.value,t!=null&&$a(e,!!n.multiple,t,!1)}}}var Uc=!1;function kp(e,t,n){if(Uc)return e(t,n);Uc=!0;try{var a=e(t);return a}finally{if(Uc=!1,(qa!==null||Va!==null)&&(Wr(),qa&&(t=qa,e=Va,Va=qa=null,Up(t),e)))for(t=0;t<e.length;t++)Up(e[t])}}function Ql(e,t){var n=e.stateNode;if(n===null)return null;var a=n[Je]||null;if(a===null)return null;n=a[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(a=!a.disabled)||(e=e.type,a=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!a;break e;default:e=!1}if(e)return null;if(n&&typeof n!="function")throw Error(A(231,t,typeof n));return n}var It=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),kc=!1;if(It)try{var Zl={};Object.defineProperty(Zl,"passive",{get:function(){kc=!0}}),window.addEventListener("test",Zl,Zl),window.removeEventListener("test",Zl,Zl)}catch{kc=!1}var Cn=null,Lc=null,pr=null;function Lp(){if(pr)return pr;var e,t=Lc,n=t.length,a,l="value"in Cn?Cn.value:Cn.textContent,i=l.length;for(e=0;e<n&&t[e]===l[e];e++);var r=n-e;for(a=1;a<=r&&t[n-a]===l[i-a];a++);return pr=l.slice(e,1<a?1-a:void 0)}function fr(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function mr(){return!0}function Hp(){return!1}function Pe(e){function t(n,a,l,i,r){this._reactName=n,this._targetInst=l,this.type=a,this.nativeEvent=i,this.target=r,this.currentTarget=null;for(var c in e)e.hasOwnProperty(c)&&(n=e[c],this[c]=n?n(i):i[c]);return this.isDefaultPrevented=(i.defaultPrevented!=null?i.defaultPrevented:i.returnValue===!1)?mr:Hp,this.isPropagationStopped=Hp,this}return me(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=mr)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=mr)},persist:function(){},isPersistent:mr}),t}var ca={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},hr=Pe(ca),Kl=me({},ca,{view:0,detail:0}),wv=Pe(Kl),Hc,Bc,Fl,gr=me({},Kl,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:$c,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==Fl&&(Fl&&e.type==="mousemove"?(Hc=e.screenX-Fl.screenX,Bc=e.screenY-Fl.screenY):Bc=Hc=0,Fl=e),Hc)},movementY:function(e){return"movementY"in e?e.movementY:Bc}}),Bp=Pe(gr),Ev=me({},gr,{dataTransfer:0}),Av=Pe(Ev),Tv=me({},Kl,{relatedTarget:0}),Yc=Pe(Tv),Cv=me({},ca,{animationName:0,elapsedTime:0,pseudoElement:0}),Ov=Pe(Cv),Dv=me({},ca,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),zv=Pe(Dv),Mv=me({},ca,{data:0}),Yp=Pe(Mv),Rv={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},Uv={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},kv={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function Lv(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=kv[e])?!!t[e]:!1}function $c(){return Lv}var Hv=me({},Kl,{key:function(e){if(e.key){var t=Rv[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=fr(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?Uv[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:$c,charCode:function(e){return e.type==="keypress"?fr(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?fr(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),Bv=Pe(Hv),Yv=me({},gr,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),$p=Pe(Yv),$v=me({},Kl,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:$c}),Gv=Pe($v),qv=me({},ca,{propertyName:0,elapsedTime:0,pseudoElement:0}),Vv=Pe(qv),Xv=me({},gr,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),Qv=Pe(Xv),Zv=me({},ca,{newState:0,oldState:0}),Kv=Pe(Zv),Fv=[9,13,27,32],Gc=It&&"CompositionEvent"in window,Jl=null;It&&"documentMode"in document&&(Jl=document.documentMode);var Jv=It&&"TextEvent"in window&&!Jl,Gp=It&&(!Gc||Jl&&8<Jl&&11>=Jl),qp=String.fromCharCode(32),Vp=!1;function Xp(e,t){switch(e){case"keyup":return Fv.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function Qp(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Xa=!1;function Pv(e,t){switch(e){case"compositionend":return Qp(t);case"keypress":return t.which!==32?null:(Vp=!0,qp);case"textInput":return e=t.data,e===qp&&Vp?null:e;default:return null}}function Wv(e,t){if(Xa)return e==="compositionend"||!Gc&&Xp(e,t)?(e=Lp(),pr=Lc=Cn=null,Xa=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return Gp&&t.locale!=="ko"?null:t.data;default:return null}}var Iv={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Zp(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!Iv[e.type]:t==="textarea"}function Kp(e,t,n,a){qa?Va?Va.push(a):Va=[a]:qa=a,t=is(t,"onChange"),0<t.length&&(n=new hr("onChange","change",null,n,a),e.push({event:n,listeners:t}))}var Pl=null,Wl=null;function eb(e){Dh(e,0)}function yr(e){var t=Xl(e);if(Cp(t))return e}function Fp(e,t){if(e==="change")return t}var Jp=!1;if(It){var qc;if(It){var Vc="oninput"in document;if(!Vc){var Pp=document.createElement("div");Pp.setAttribute("oninput","return;"),Vc=typeof Pp.oninput=="function"}qc=Vc}else qc=!1;Jp=qc&&(!document.documentMode||9<document.documentMode)}function Wp(){Pl&&(Pl.detachEvent("onpropertychange",Ip),Wl=Pl=null)}function Ip(e){if(e.propertyName==="value"&&yr(Wl)){var t=[];Kp(t,Wl,e,Rc(e)),kp(eb,t)}}function tb(e,t,n){e==="focusin"?(Wp(),Pl=t,Wl=n,Pl.attachEvent("onpropertychange",Ip)):e==="focusout"&&Wp()}function nb(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return yr(Wl)}function ab(e,t){if(e==="click")return yr(t)}function lb(e,t){if(e==="input"||e==="change")return yr(t)}function ib(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var dt=typeof Object.is=="function"?Object.is:ib;function Il(e,t){if(dt(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var n=Object.keys(e),a=Object.keys(t);if(n.length!==a.length)return!1;for(a=0;a<n.length;a++){var l=n[a];if(!Sc.call(t,l)||!dt(e[l],t[l]))return!1}return!0}function ef(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function tf(e,t){var n=ef(e);e=0;for(var a;n;){if(n.nodeType===3){if(a=e+n.textContent.length,e<=t&&a>=t)return{node:n,offset:t-e};e=a}e:{for(;n;){if(n.nextSibling){n=n.nextSibling;break e}n=n.parentNode}n=void 0}n=ef(n)}}function nf(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?nf(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function af(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=ur(e.document);t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href=="string"}catch{n=!1}if(n)e=t.contentWindow;else break;t=ur(e.document)}return t}function Xc(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}var rb=It&&"documentMode"in document&&11>=document.documentMode,Qa=null,Qc=null,ei=null,Zc=!1;function lf(e,t,n){var a=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;Zc||Qa==null||Qa!==ur(a)||(a=Qa,"selectionStart"in a&&Xc(a)?a={start:a.selectionStart,end:a.selectionEnd}:(a=(a.ownerDocument&&a.ownerDocument.defaultView||window).getSelection(),a={anchorNode:a.anchorNode,anchorOffset:a.anchorOffset,focusNode:a.focusNode,focusOffset:a.focusOffset}),ei&&Il(ei,a)||(ei=a,a=is(Qc,"onSelect"),0<a.length&&(t=new hr("onSelect","select",null,t,n),e.push({event:t,listeners:a}),t.target=Qa)))}function oa(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n["Webkit"+e]="webkit"+t,n["Moz"+e]="moz"+t,n}var Za={animationend:oa("Animation","AnimationEnd"),animationiteration:oa("Animation","AnimationIteration"),animationstart:oa("Animation","AnimationStart"),transitionrun:oa("Transition","TransitionRun"),transitionstart:oa("Transition","TransitionStart"),transitioncancel:oa("Transition","TransitionCancel"),transitionend:oa("Transition","TransitionEnd")},Kc={},rf={};It&&(rf=document.createElement("div").style,"AnimationEvent"in window||(delete Za.animationend.animation,delete Za.animationiteration.animation,delete Za.animationstart.animation),"TransitionEvent"in window||delete Za.transitionend.transition);function ua(e){if(Kc[e])return Kc[e];if(!Za[e])return e;var t=Za[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in rf)return Kc[e]=t[n];return e}var sf=ua("animationend"),cf=ua("animationiteration"),of=ua("animationstart"),sb=ua("transitionrun"),cb=ua("transitionstart"),ob=ua("transitioncancel"),uf=ua("transitionend"),df=new Map,Fc="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");Fc.push("scrollEnd");function zt(e,t){df.set(e,t),sa(t,[e])}var vr=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)},Nt=[],Ka=0,Jc=0;function br(){for(var e=Ka,t=Jc=Ka=0;t<e;){var n=Nt[t];Nt[t++]=null;var a=Nt[t];Nt[t++]=null;var l=Nt[t];Nt[t++]=null;var i=Nt[t];if(Nt[t++]=null,a!==null&&l!==null){var r=a.pending;r===null?l.next=l:(l.next=r.next,r.next=l),a.pending=l}i!==0&&pf(n,l,i)}}function xr(e,t,n,a){Nt[Ka++]=e,Nt[Ka++]=t,Nt[Ka++]=n,Nt[Ka++]=a,Jc|=a,e.lanes|=a,e=e.alternate,e!==null&&(e.lanes|=a)}function Pc(e,t,n,a){return xr(e,t,n,a),Sr(e)}function da(e,t){return xr(e,null,null,t),Sr(e)}function pf(e,t,n){e.lanes|=n;var a=e.alternate;a!==null&&(a.lanes|=n);for(var l=!1,i=e.return;i!==null;)i.childLanes|=n,a=i.alternate,a!==null&&(a.childLanes|=n),i.tag===22&&(e=i.stateNode,e===null||e._visibility&1||(l=!0)),e=i,i=i.return;return e.tag===3?(i=e.stateNode,l&&t!==null&&(l=31-ut(n),e=i.hiddenUpdates,a=e[l],a===null?e[l]=[t]:a.push(t),t.lane=n|536870912),i):null}function Sr(e){if(50<_i)throw _i=0,su=null,Error(A(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var Fa={};function ub(e,t,n,a){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=a,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function pt(e,t,n,a){return new ub(e,t,n,a)}function Wc(e){return e=e.prototype,!(!e||!e.isReactComponent)}function en(e,t){var n=e.alternate;return n===null?(n=pt(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&65011712,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n.refCleanup=e.refCleanup,n}function ff(e,t){e.flags&=65011714;var n=e.alternate;return n===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=n.childLanes,e.lanes=n.lanes,e.child=n.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=n.memoizedProps,e.memoizedState=n.memoizedState,e.updateQueue=n.updateQueue,e.type=n.type,t=n.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function _r(e,t,n,a,l,i){var r=0;if(a=e,typeof e=="function")Wc(e)&&(r=1);else if(typeof e=="string")r=hx(e,n,Yt.current)?26:e==="html"||e==="head"||e==="body"?27:5;else e:switch(e){case mc:return e=pt(31,n,t,l),e.elementType=mc,e.lanes=i,e;case Ma:return pa(n.children,l,i,t);case op:r=8,l|=24;break;case oc:return e=pt(12,n,t,l|2),e.elementType=oc,e.lanes=i,e;case dc:return e=pt(13,n,t,l),e.elementType=dc,e.lanes=i,e;case pc:return e=pt(19,n,t,l),e.elementType=pc,e.lanes=i,e;default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case Jt:r=10;break e;case up:r=9;break e;case uc:r=11;break e;case fc:r=14;break e;case wn:r=16,a=null;break e}r=29,n=Error(A(130,e===null?"null":typeof e,"")),a=null}return t=pt(r,n,t,l),t.elementType=e,t.type=a,t.lanes=i,t}function pa(e,t,n,a){return e=pt(7,e,a,t),e.lanes=n,e}function Ic(e,t,n){return e=pt(6,e,null,t),e.lanes=n,e}function mf(e){var t=pt(18,null,null,0);return t.stateNode=e,t}function eo(e,t,n){return t=pt(4,e.children!==null?e.children:[],e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var hf=new WeakMap;function jt(e,t){if(typeof e=="object"&&e!==null){var n=hf.get(e);return n!==void 0?n:(t={value:e,source:t,stack:fp(t)},hf.set(e,t),t)}return{value:e,source:t,stack:fp(t)}}var Ja=[],Pa=0,Nr=null,ti=0,wt=[],Et=0,On=null,$t=1,Gt="";function tn(e,t){Ja[Pa++]=ti,Ja[Pa++]=Nr,Nr=e,ti=t}function gf(e,t,n){wt[Et++]=$t,wt[Et++]=Gt,wt[Et++]=On,On=e;var a=$t;e=Gt;var l=32-ut(a)-1;a&=~(1<<l),n+=1;var i=32-ut(t)+l;if(30<i){var r=l-l%5;i=(a&(1<<r)-1).toString(32),a>>=r,l-=r,$t=1<<32-ut(t)+l|n<<l|a,Gt=i+e}else $t=1<<i|n<<l|a,Gt=e}function to(e){e.return!==null&&(tn(e,1),gf(e,1,0))}function no(e){for(;e===Nr;)Nr=Ja[--Pa],Ja[Pa]=null,ti=Ja[--Pa],Ja[Pa]=null;for(;e===On;)On=wt[--Et],wt[Et]=null,Gt=wt[--Et],wt[Et]=null,$t=wt[--Et],wt[Et]=null}function yf(e,t){wt[Et++]=$t,wt[Et++]=Gt,wt[Et++]=On,$t=t.id,Gt=t.overflow,On=e}var ke=null,he=null,I=!1,Dn=null,At=!1,ao=Error(A(519));function zn(e){var t=Error(A(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw ni(jt(t,e)),ao}function vf(e){var t=e.stateNode,n=e.type,a=e.memoizedProps;switch(t[Ue]=e,t[Je]=a,n){case"dialog":P("cancel",t),P("close",t);break;case"iframe":case"object":case"embed":P("load",t);break;case"video":case"audio":for(n=0;n<ji.length;n++)P(ji[n],t);break;case"source":P("error",t);break;case"img":case"image":case"link":P("error",t),P("load",t);break;case"details":P("toggle",t);break;case"input":P("invalid",t),Op(t,a.value,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name,!0);break;case"select":P("invalid",t);break;case"textarea":P("invalid",t),zp(t,a.value,a.defaultValue,a.children)}n=a.children,typeof n!="string"&&typeof n!="number"&&typeof n!="bigint"||t.textContent===""+n||a.suppressHydrationWarning===!0||Uh(t.textContent,n)?(a.popover!=null&&(P("beforetoggle",t),P("toggle",t)),a.onScroll!=null&&P("scroll",t),a.onScrollEnd!=null&&P("scrollend",t),a.onClick!=null&&(t.onclick=Wt),t=!0):t=!1,t||zn(e,!0)}function bf(e){for(ke=e.return;ke;)switch(ke.tag){case 5:case 31:case 13:At=!1;return;case 27:case 3:At=!0;return;default:ke=ke.return}}function Wa(e){if(e!==ke)return!1;if(!I)return bf(e),I=!0,!1;var t=e.tag,n;if((n=t!==3&&t!==27)&&((n=t===5)&&(n=e.type,n=!(n!=="form"&&n!=="button")||_u(e.type,e.memoizedProps)),n=!n),n&&he&&zn(e),bf(e),t===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(A(317));he=Vh(e)}else if(t===31){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(A(317));he=Vh(e)}else t===27?(t=he,Qn(e.type)?(e=Au,Au=null,he=e):he=t):he=ke?Ct(e.stateNode.nextSibling):null;return!0}function fa(){he=ke=null,I=!1}function lo(){var e=Dn;return e!==null&&(tt===null?tt=e:tt.push.apply(tt,e),Dn=null),e}function ni(e){Dn===null?Dn=[e]:Dn.push(e)}var io=Bt(null),ma=null,nn=null;function Mn(e,t,n){pe(io,t._currentValue),t._currentValue=n}function an(e){e._currentValue=io.current,De(io)}function ro(e,t,n){for(;e!==null;){var a=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,a!==null&&(a.childLanes|=t)):a!==null&&(a.childLanes&t)!==t&&(a.childLanes|=t),e===n)break;e=e.return}}function so(e,t,n,a){var l=e.child;for(l!==null&&(l.return=e);l!==null;){var i=l.dependencies;if(i!==null){var r=l.child;i=i.firstContext;e:for(;i!==null;){var c=i;i=l;for(var o=0;o<t.length;o++)if(c.context===t[o]){i.lanes|=n,c=i.alternate,c!==null&&(c.lanes|=n),ro(i.return,n,e),a||(r=null);break e}i=c.next}}else if(l.tag===18){if(r=l.return,r===null)throw Error(A(341));r.lanes|=n,i=r.alternate,i!==null&&(i.lanes|=n),ro(r,n,e),r=null}else r=l.child;if(r!==null)r.return=l;else for(r=l;r!==null;){if(r===e){r=null;break}if(l=r.sibling,l!==null){l.return=r.return,r=l;break}r=r.return}l=r}}function Ia(e,t,n,a){e=null;for(var l=t,i=!1;l!==null;){if(!i){if(l.flags&524288)i=!0;else if(l.flags&262144)break}if(l.tag===10){var r=l.alternate;if(r===null)throw Error(A(387));if(r=r.memoizedProps,r!==null){var c=l.type;dt(l.pendingProps.value,r.value)||(e!==null?e.push(c):e=[c])}}else if(l===er.current){if(r=l.alternate,r===null)throw Error(A(387));r.memoizedState.memoizedState!==l.memoizedState.memoizedState&&(e!==null?e.push(Ci):e=[Ci])}l=l.return}e!==null&&so(t,e,n,a),t.flags|=262144}function jr(e){for(e=e.firstContext;e!==null;){if(!dt(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function ha(e){ma=e,nn=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function Le(e){return xf(ma,e)}function wr(e,t){return ma===null&&ha(e),xf(e,t)}function xf(e,t){var n=t._currentValue;if(t={context:t,memoizedValue:n,next:null},nn===null){if(e===null)throw Error(A(308));nn=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else nn=nn.next=t;return n}var db=typeof AbortController<"u"?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(n,a){e.push(a)}};this.abort=function(){t.aborted=!0,e.forEach(function(n){return n()})}},pb=Ce.unstable_scheduleCallback,fb=Ce.unstable_NormalPriority,je={$$typeof:Jt,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function co(){return{controller:new db,data:new Map,refCount:0}}function ai(e){e.refCount--,e.refCount===0&&pb(fb,function(){e.controller.abort()})}var li=null,oo=0,el=0,tl=null;function mb(e,t){if(li===null){var n=li=[];oo=0,el=fu(),tl={status:"pending",value:void 0,then:function(a){n.push(a)}}}return oo++,t.then(Sf,Sf),t}function Sf(){if(--oo===0&&li!==null){tl!==null&&(tl.status="fulfilled");var e=li;li=null,el=0,tl=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function hb(e,t){var n=[],a={status:"pending",value:null,reason:null,then:function(l){n.push(l)}};return e.then(function(){a.status="fulfilled",a.value=t;for(var l=0;l<n.length;l++)(0,n[l])(t)},function(l){for(a.status="rejected",a.reason=l,l=0;l<n.length;l++)(0,n[l])(void 0)}),a}var _f=V.S;V.S=function(e,t){ih=ct(),typeof t=="object"&&t!==null&&typeof t.then=="function"&&mb(e,t),_f!==null&&_f(e,t)};var ga=Bt(null);function uo(){var e=ga.current;return e!==null?e:de.pooledCache}function Er(e,t){t===null?pe(ga,ga.current):pe(ga,t.pool)}function Nf(){var e=uo();return e===null?null:{parent:je._currentValue,pool:e}}var nl=Error(A(460)),po=Error(A(474)),Ar=Error(A(542)),Tr={then:function(){}};function jf(e){return e=e.status,e==="fulfilled"||e==="rejected"}function wf(e,t,n){switch(n=e[n],n===void 0?e.push(t):n!==t&&(t.then(Wt,Wt),t=n),t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,Af(e),e;default:if(typeof t.status=="string")t.then(Wt,Wt);else{if(e=de,e!==null&&100<e.shellSuspendCounter)throw Error(A(482));e=t,e.status="pending",e.then(function(a){if(t.status==="pending"){var l=t;l.status="fulfilled",l.value=a}},function(a){if(t.status==="pending"){var l=t;l.status="rejected",l.reason=a}})}switch(t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,Af(e),e}throw va=t,nl}}function ya(e){try{var t=e._init;return t(e._payload)}catch(n){throw n!==null&&typeof n=="object"&&typeof n.then=="function"?(va=n,nl):n}}var va=null;function Ef(){if(va===null)throw Error(A(459));var e=va;return va=null,e}function Af(e){if(e===nl||e===Ar)throw Error(A(483))}var al=null,ii=0;function Cr(e){var t=ii;return ii+=1,al===null&&(al=[]),wf(al,e,t)}function ri(e,t){t=t.props.ref,e.ref=t!==void 0?t:null}function Or(e,t){throw t.$$typeof===tv?Error(A(525)):(e=Object.prototype.toString.call(t),Error(A(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)))}function Tf(e){function t(y,g){if(e){var b=y.deletions;b===null?(y.deletions=[g],y.flags|=16):b.push(g)}}function n(y,g){if(!e)return null;for(;g!==null;)t(y,g),g=g.sibling;return null}function a(y){for(var g=new Map;y!==null;)y.key!==null?g.set(y.key,y):g.set(y.index,y),y=y.sibling;return g}function l(y,g){return y=en(y,g),y.index=0,y.sibling=null,y}function i(y,g,b){return y.index=b,e?(b=y.alternate,b!==null?(b=b.index,b<g?(y.flags|=67108866,g):b):(y.flags|=67108866,g)):(y.flags|=1048576,g)}function r(y){return e&&y.alternate===null&&(y.flags|=67108866),y}function c(y,g,b,_){return g===null||g.tag!==6?(g=Ic(b,y.mode,_),g.return=y,g):(g=l(g,b),g.return=y,g)}function o(y,g,b,_){var T=b.type;return T===Ma?f(y,g,b.props.children,_,b.key):g!==null&&(g.elementType===T||typeof T=="object"&&T!==null&&T.$$typeof===wn&&ya(T)===g.type)?(g=l(g,b.props),ri(g,b),g.return=y,g):(g=_r(b.type,b.key,b.props,null,y.mode,_),ri(g,b),g.return=y,g)}function u(y,g,b,_){return g===null||g.tag!==4||g.stateNode.containerInfo!==b.containerInfo||g.stateNode.implementation!==b.implementation?(g=eo(b,y.mode,_),g.return=y,g):(g=l(g,b.children||[]),g.return=y,g)}function f(y,g,b,_,T){return g===null||g.tag!==7?(g=pa(b,y.mode,_,T),g.return=y,g):(g=l(g,b),g.return=y,g)}function p(y,g,b){if(typeof g=="string"&&g!==""||typeof g=="number"||typeof g=="bigint")return g=Ic(""+g,y.mode,b),g.return=y,g;if(typeof g=="object"&&g!==null){switch(g.$$typeof){case Ii:return b=_r(g.type,g.key,g.props,null,y.mode,b),ri(b,g),b.return=y,b;case Ll:return g=eo(g,y.mode,b),g.return=y,g;case wn:return g=ya(g),p(y,g,b)}if(Bl(g)||Hl(g))return g=pa(g,y.mode,b,null),g.return=y,g;if(typeof g.then=="function")return p(y,Cr(g),b);if(g.$$typeof===Jt)return p(y,wr(y,g),b);Or(y,g)}return null}function d(y,g,b,_){var T=g!==null?g.key:null;if(typeof b=="string"&&b!==""||typeof b=="number"||typeof b=="bigint")return T!==null?null:c(y,g,""+b,_);if(typeof b=="object"&&b!==null){switch(b.$$typeof){case Ii:return b.key===T?o(y,g,b,_):null;case Ll:return b.key===T?u(y,g,b,_):null;case wn:return b=ya(b),d(y,g,b,_)}if(Bl(b)||Hl(b))return T!==null?null:f(y,g,b,_,null);if(typeof b.then=="function")return d(y,g,Cr(b),_);if(b.$$typeof===Jt)return d(y,g,wr(y,b),_);Or(y,b)}return null}function m(y,g,b,_,T){if(typeof _=="string"&&_!==""||typeof _=="number"||typeof _=="bigint")return y=y.get(b)||null,c(g,y,""+_,T);if(typeof _=="object"&&_!==null){switch(_.$$typeof){case Ii:return y=y.get(_.key===null?b:_.key)||null,o(g,y,_,T);case Ll:return y=y.get(_.key===null?b:_.key)||null,u(g,y,_,T);case wn:return _=ya(_),m(y,g,b,_,T)}if(Bl(_)||Hl(_))return y=y.get(b)||null,f(g,y,_,T,null);if(typeof _.then=="function")return m(y,g,b,Cr(_),T);if(_.$$typeof===Jt)return m(y,g,b,wr(g,_),T);Or(g,_)}return null}function v(y,g,b,_){for(var T=null,O=null,w=g,z=g=0,R=null;w!==null&&z<b.length;z++){w.index>z?(R=w,w=null):R=w.sibling;var L=d(y,w,b[z],_);if(L===null){w===null&&(w=R);break}e&&w&&L.alternate===null&&t(y,w),g=i(L,g,z),O===null?T=L:O.sibling=L,O=L,w=R}if(z===b.length)return n(y,w),I&&tn(y,z),T;if(w===null){for(;z<b.length;z++)w=p(y,b[z],_),w!==null&&(g=i(w,g,z),O===null?T=w:O.sibling=w,O=w);return I&&tn(y,z),T}for(w=a(w);z<b.length;z++)R=m(w,y,z,b[z],_),R!==null&&(e&&R.alternate!==null&&w.delete(R.key===null?z:R.key),g=i(R,g,z),O===null?T=R:O.sibling=R,O=R);return e&&w.forEach(function(ee){return t(y,ee)}),I&&tn(y,z),T}function S(y,g,b,_){if(b==null)throw Error(A(151));for(var T=null,O=null,w=g,z=g=0,R=null,L=b.next();w!==null&&!L.done;z++,L=b.next()){w.index>z?(R=w,w=null):R=w.sibling;var ee=d(y,w,L.value,_);if(ee===null){w===null&&(w=R);break}e&&w&&ee.alternate===null&&t(y,w),g=i(ee,g,z),O===null?T=ee:O.sibling=ee,O=ee,w=R}if(L.done)return n(y,w),I&&tn(y,z),T;if(w===null){for(;!L.done;z++,L=b.next())L=p(y,L.value,_),L!==null&&(g=i(L,g,z),O===null?T=L:O.sibling=L,O=L);return I&&tn(y,z),T}for(w=a(w);!L.done;z++,L=b.next())L=m(w,y,z,L.value,_),L!==null&&(e&&L.alternate!==null&&w.delete(L.key===null?z:L.key),g=i(L,g,z),O===null?T=L:O.sibling=L,O=L);return e&&w.forEach(function(B){return t(y,B)}),I&&tn(y,z),T}function j(y,g,b,_){if(typeof b=="object"&&b!==null&&b.type===Ma&&b.key===null&&(b=b.props.children),typeof b=="object"&&b!==null){switch(b.$$typeof){case Ii:e:{for(var T=b.key;g!==null;){if(g.key===T){if(T=b.type,T===Ma){if(g.tag===7){n(y,g.sibling),_=l(g,b.props.children),_.return=y,y=_;break e}}else if(g.elementType===T||typeof T=="object"&&T!==null&&T.$$typeof===wn&&ya(T)===g.type){n(y,g.sibling),_=l(g,b.props),ri(_,b),_.return=y,y=_;break e}n(y,g);break}else t(y,g);g=g.sibling}b.type===Ma?(_=pa(b.props.children,y.mode,_,b.key),_.return=y,y=_):(_=_r(b.type,b.key,b.props,null,y.mode,_),ri(_,b),_.return=y,y=_)}return r(y);case Ll:e:{for(T=b.key;g!==null;){if(g.key===T)if(g.tag===4&&g.stateNode.containerInfo===b.containerInfo&&g.stateNode.implementation===b.implementation){n(y,g.sibling),_=l(g,b.children||[]),_.return=y,y=_;break e}else{n(y,g);break}else t(y,g);g=g.sibling}_=eo(b,y.mode,_),_.return=y,y=_}return r(y);case wn:return b=ya(b),j(y,g,b,_)}if(Bl(b))return v(y,g,b,_);if(Hl(b)){if(T=Hl(b),typeof T!="function")throw Error(A(150));return b=T.call(b),S(y,g,b,_)}if(typeof b.then=="function")return j(y,g,Cr(b),_);if(b.$$typeof===Jt)return j(y,g,wr(y,b),_);Or(y,b)}return typeof b=="string"&&b!==""||typeof b=="number"||typeof b=="bigint"?(b=""+b,g!==null&&g.tag===6?(n(y,g.sibling),_=l(g,b),_.return=y,y=_):(n(y,g),_=Ic(b,y.mode,_),_.return=y,y=_),r(y)):n(y,g)}return function(y,g,b,_){try{ii=0;var T=j(y,g,b,_);return al=null,T}catch(w){if(w===nl||w===Ar)throw w;var O=pt(29,w,null,y.mode);return O.lanes=_,O.return=y,O}finally{}}}var ba=Tf(!0),Cf=Tf(!1),Rn=!1;function fo(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function mo(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function Un(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function kn(e,t,n){var a=e.updateQueue;if(a===null)return null;if(a=a.shared,ie&2){var l=a.pending;return l===null?t.next=t:(t.next=l.next,l.next=t),a.pending=t,t=Sr(e),pf(e,null,n),t}return xr(e,a,t,n),Sr(e)}function si(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,(n&4194048)!==0)){var a=t.lanes;a&=e.pendingLanes,n|=a,t.lanes=n,bp(e,n)}}function ho(e,t){var n=e.updateQueue,a=e.alternate;if(a!==null&&(a=a.updateQueue,n===a)){var l=null,i=null;if(n=n.firstBaseUpdate,n!==null){do{var r={lane:n.lane,tag:n.tag,payload:n.payload,callback:null,next:null};i===null?l=i=r:i=i.next=r,n=n.next}while(n!==null);i===null?l=i=t:i=i.next=t}else l=i=t;n={baseState:a.baseState,firstBaseUpdate:l,lastBaseUpdate:i,shared:a.shared,callbacks:a.callbacks},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}var go=!1;function ci(){if(go){var e=tl;if(e!==null)throw e}}function oi(e,t,n,a){go=!1;var l=e.updateQueue;Rn=!1;var i=l.firstBaseUpdate,r=l.lastBaseUpdate,c=l.shared.pending;if(c!==null){l.shared.pending=null;var o=c,u=o.next;o.next=null,r===null?i=u:r.next=u,r=o;var f=e.alternate;f!==null&&(f=f.updateQueue,c=f.lastBaseUpdate,c!==r&&(c===null?f.firstBaseUpdate=u:c.next=u,f.lastBaseUpdate=o))}if(i!==null){var p=l.baseState;r=0,f=u=o=null,c=i;do{var d=c.lane&-536870913,m=d!==c.lane;if(m?(W&d)===d:(a&d)===d){d!==0&&d===el&&(go=!0),f!==null&&(f=f.next={lane:0,tag:c.tag,payload:c.payload,callback:null,next:null});e:{var v=e,S=c;d=t;var j=n;switch(S.tag){case 1:if(v=S.payload,typeof v=="function"){p=v.call(j,p,d);break e}p=v;break e;case 3:v.flags=v.flags&-65537|128;case 0:if(v=S.payload,d=typeof v=="function"?v.call(j,p,d):v,d==null)break e;p=me({},p,d);break e;case 2:Rn=!0}}d=c.callback,d!==null&&(e.flags|=64,m&&(e.flags|=8192),m=l.callbacks,m===null?l.callbacks=[d]:m.push(d))}else m={lane:d,tag:c.tag,payload:c.payload,callback:c.callback,next:null},f===null?(u=f=m,o=p):f=f.next=m,r|=d;if(c=c.next,c===null){if(c=l.shared.pending,c===null)break;m=c,c=m.next,m.next=null,l.lastBaseUpdate=m,l.shared.pending=null}}while(1);f===null&&(o=p),l.baseState=o,l.firstBaseUpdate=u,l.lastBaseUpdate=f,i===null&&(l.shared.lanes=0),$n|=r,e.lanes=r,e.memoizedState=p}}function Of(e,t){if(typeof e!="function")throw Error(A(191,e));e.call(t)}function Df(e,t){var n=e.callbacks;if(n!==null)for(e.callbacks=null,e=0;e<n.length;e++)Of(n[e],t)}var ll=Bt(null),Dr=Bt(0);function zf(e,t){e=fn,pe(Dr,e),pe(ll,t),fn=e|t.baseLanes}function yo(){pe(Dr,fn),pe(ll,ll.current)}function vo(){fn=Dr.current,De(ll),De(Dr)}var ft=Bt(null),Tt=null;function Ln(e){var t=e.alternate;pe(xe,xe.current&1),pe(ft,e),Tt===null&&(t===null||ll.current!==null||t.memoizedState!==null)&&(Tt=e)}function bo(e){pe(xe,xe.current),pe(ft,e),Tt===null&&(Tt=e)}function Mf(e){e.tag===22?(pe(xe,xe.current),pe(ft,e),Tt===null&&(Tt=e)):Hn()}function Hn(){pe(xe,xe.current),pe(ft,ft.current)}function mt(e){De(ft),Tt===e&&(Tt=null),De(xe)}var xe=Bt(0);function zr(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||wu(n)||Eu(n)))return t}else if(t.tag===19&&(t.memoizedProps.revealOrder==="forwards"||t.memoizedProps.revealOrder==="backwards"||t.memoizedProps.revealOrder==="unstable_legacy-backwards"||t.memoizedProps.revealOrder==="together")){if(t.flags&128)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var ln=0,K=null,oe=null,we=null,Mr=!1,il=!1,xa=!1,Rr=0,ui=0,rl=null,gb=0;function ve(){throw Error(A(321))}function xo(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!dt(e[n],t[n]))return!1;return!0}function So(e,t,n,a,l,i){return ln=i,K=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,V.H=e===null||e.memoizedState===null?gm:ko,xa=!1,i=n(a,l),xa=!1,il&&(i=Uf(t,n,a,l)),Rf(e),i}function Rf(e){V.H=fi;var t=oe!==null&&oe.next!==null;if(ln=0,we=oe=K=null,Mr=!1,ui=0,rl=null,t)throw Error(A(300));e===null||Ee||(e=e.dependencies,e!==null&&jr(e)&&(Ee=!0))}function Uf(e,t,n,a){K=e;var l=0;do{if(il&&(rl=null),ui=0,il=!1,25<=l)throw Error(A(301));if(l+=1,we=oe=null,e.updateQueue!=null){var i=e.updateQueue;i.lastEffect=null,i.events=null,i.stores=null,i.memoCache!=null&&(i.memoCache.index=0)}V.H=ym,i=t(n,a)}while(il);return i}function yb(){var e=V.H,t=e.useState()[0];return t=typeof t.then=="function"?di(t):t,e=e.useState()[0],(oe!==null?oe.memoizedState:null)!==e&&(K.flags|=1024),t}function _o(){var e=Rr!==0;return Rr=0,e}function No(e,t,n){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~n}function jo(e){if(Mr){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}Mr=!1}ln=0,we=oe=K=null,il=!1,ui=Rr=0,rl=null}function Ze(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return we===null?K.memoizedState=we=e:we=we.next=e,we}function Se(){if(oe===null){var e=K.alternate;e=e!==null?e.memoizedState:null}else e=oe.next;var t=we===null?K.memoizedState:we.next;if(t!==null)we=t,oe=e;else{if(e===null)throw K.alternate===null?Error(A(467)):Error(A(310));oe=e,e={memoizedState:oe.memoizedState,baseState:oe.baseState,baseQueue:oe.baseQueue,queue:oe.queue,next:null},we===null?K.memoizedState=we=e:we=we.next=e}return we}function Ur(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function di(e){var t=ui;return ui+=1,rl===null&&(rl=[]),e=wf(rl,e,t),t=K,(we===null?t.memoizedState:we.next)===null&&(t=t.alternate,V.H=t===null||t.memoizedState===null?gm:ko),e}function kr(e){if(e!==null&&typeof e=="object"){if(typeof e.then=="function")return di(e);if(e.$$typeof===Jt)return Le(e)}throw Error(A(438,String(e)))}function wo(e){var t=null,n=K.updateQueue;if(n!==null&&(t=n.memoCache),t==null){var a=K.alternate;a!==null&&(a=a.updateQueue,a!==null&&(a=a.memoCache,a!=null&&(t={data:a.data.map(function(l){return l.slice()}),index:0})))}if(t==null&&(t={data:[],index:0}),n===null&&(n=Ur(),K.updateQueue=n),n.memoCache=t,n=t.data[t.index],n===void 0)for(n=t.data[t.index]=Array(e),a=0;a<e;a++)n[a]=nv;return t.index++,n}function rn(e,t){return typeof t=="function"?t(e):t}function Lr(e){var t=Se();return Eo(t,oe,e)}function Eo(e,t,n){var a=e.queue;if(a===null)throw Error(A(311));a.lastRenderedReducer=n;var l=e.baseQueue,i=a.pending;if(i!==null){if(l!==null){var r=l.next;l.next=i.next,i.next=r}t.baseQueue=l=i,a.pending=null}if(i=e.baseState,l===null)e.memoizedState=i;else{t=l.next;var c=r=null,o=null,u=t,f=!1;do{var p=u.lane&-536870913;if(p!==u.lane?(W&p)===p:(ln&p)===p){var d=u.revertLane;if(d===0)o!==null&&(o=o.next={lane:0,revertLane:0,gesture:null,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null}),p===el&&(f=!0);else if((ln&d)===d){u=u.next,d===el&&(f=!0);continue}else p={lane:0,revertLane:u.revertLane,gesture:null,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null},o===null?(c=o=p,r=i):o=o.next=p,K.lanes|=d,$n|=d;p=u.action,xa&&n(i,p),i=u.hasEagerState?u.eagerState:n(i,p)}else d={lane:p,revertLane:u.revertLane,gesture:u.gesture,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null},o===null?(c=o=d,r=i):o=o.next=d,K.lanes|=p,$n|=p;u=u.next}while(u!==null&&u!==t);if(o===null?r=i:o.next=c,!dt(i,e.memoizedState)&&(Ee=!0,f&&(n=tl,n!==null)))throw n;e.memoizedState=i,e.baseState=r,e.baseQueue=o,a.lastRenderedState=i}return l===null&&(a.lanes=0),[e.memoizedState,a.dispatch]}function Ao(e){var t=Se(),n=t.queue;if(n===null)throw Error(A(311));n.lastRenderedReducer=e;var a=n.dispatch,l=n.pending,i=t.memoizedState;if(l!==null){n.pending=null;var r=l=l.next;do i=e(i,r.action),r=r.next;while(r!==l);dt(i,t.memoizedState)||(Ee=!0),t.memoizedState=i,t.baseQueue===null&&(t.baseState=i),n.lastRenderedState=i}return[i,a]}function kf(e,t,n){var a=K,l=Se(),i=I;if(i){if(n===void 0)throw Error(A(407));n=n()}else n=t();var r=!dt((oe||l).memoizedState,n);if(r&&(l.memoizedState=n,Ee=!0),l=l.queue,Oo(Bf.bind(null,a,l,e),[e]),l.getSnapshot!==t||r||we!==null&&we.memoizedState.tag&1){if(a.flags|=2048,sl(9,{destroy:void 0},Hf.bind(null,a,l,n,t),null),de===null)throw Error(A(349));i||ln&127||Lf(a,t,n)}return n}function Lf(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=K.updateQueue,t===null?(t=Ur(),K.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function Hf(e,t,n,a){t.value=n,t.getSnapshot=a,Yf(t)&&$f(e)}function Bf(e,t,n){return n(function(){Yf(t)&&$f(e)})}function Yf(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!dt(e,n)}catch{return!0}}function $f(e){var t=da(e,2);t!==null&&nt(t,e,2)}function To(e){var t=Ze();if(typeof e=="function"){var n=e;if(e=n(),xa){An(!0);try{n()}finally{An(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:rn,lastRenderedState:e},t}function Gf(e,t,n,a){return e.baseState=n,Eo(e,oe,typeof a=="function"?a:rn)}function vb(e,t,n,a,l){if(Yr(e))throw Error(A(485));if(e=t.action,e!==null){var i={payload:l,action:e,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(r){i.listeners.push(r)}};V.T!==null?n(!0):i.isTransition=!1,a(i),n=t.pending,n===null?(i.next=t.pending=i,qf(t,i)):(i.next=n.next,t.pending=n.next=i)}}function qf(e,t){var n=t.action,a=t.payload,l=e.state;if(t.isTransition){var i=V.T,r={};V.T=r;try{var c=n(l,a),o=V.S;o!==null&&o(r,c),Vf(e,t,c)}catch(u){Co(e,t,u)}finally{i!==null&&r.types!==null&&(i.types=r.types),V.T=i}}else try{i=n(l,a),Vf(e,t,i)}catch(u){Co(e,t,u)}}function Vf(e,t,n){n!==null&&typeof n=="object"&&typeof n.then=="function"?n.then(function(a){Xf(e,t,a)},function(a){return Co(e,t,a)}):Xf(e,t,n)}function Xf(e,t,n){t.status="fulfilled",t.value=n,Qf(t),e.state=n,t=e.pending,t!==null&&(n=t.next,n===t?e.pending=null:(n=n.next,t.next=n,qf(e,n)))}function Co(e,t,n){var a=e.pending;if(e.pending=null,a!==null){a=a.next;do t.status="rejected",t.reason=n,Qf(t),t=t.next;while(t!==a)}e.action=null}function Qf(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function Zf(e,t){return t}function Kf(e,t){if(I){var n=de.formState;if(n!==null){e:{var a=K;if(I){if(he){t:{for(var l=he,i=At;l.nodeType!==8;){if(!i){l=null;break t}if(l=Ct(l.nextSibling),l===null){l=null;break t}}i=l.data,l=i==="F!"||i==="F"?l:null}if(l){he=Ct(l.nextSibling),a=l.data==="F!";break e}}zn(a)}a=!1}a&&(t=n[0])}}return n=Ze(),n.memoizedState=n.baseState=t,a={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Zf,lastRenderedState:t},n.queue=a,n=fm.bind(null,K,a),a.dispatch=n,a=To(!1),i=Uo.bind(null,K,!1,a.queue),a=Ze(),l={state:t,dispatch:null,action:e,pending:null},a.queue=l,n=vb.bind(null,K,l,i,n),l.dispatch=n,a.memoizedState=e,[t,n,!1]}function Ff(e){var t=Se();return Jf(t,oe,e)}function Jf(e,t,n){if(t=Eo(e,t,Zf)[0],e=Lr(rn)[0],typeof t=="object"&&t!==null&&typeof t.then=="function")try{var a=di(t)}catch(r){throw r===nl?Ar:r}else a=t;t=Se();var l=t.queue,i=l.dispatch;return n!==t.memoizedState&&(K.flags|=2048,sl(9,{destroy:void 0},bb.bind(null,l,n),null)),[a,i,e]}function bb(e,t){e.action=t}function Pf(e){var t=Se(),n=oe;if(n!==null)return Jf(t,n,e);Se(),t=t.memoizedState,n=Se();var a=n.queue.dispatch;return n.memoizedState=e,[t,a,!1]}function sl(e,t,n,a){return e={tag:e,create:n,deps:a,inst:t,next:null},t=K.updateQueue,t===null&&(t=Ur(),K.updateQueue=t),n=t.lastEffect,n===null?t.lastEffect=e.next=e:(a=n.next,n.next=e,e.next=a,t.lastEffect=e),e}function Wf(){return Se().memoizedState}function Hr(e,t,n,a){var l=Ze();K.flags|=e,l.memoizedState=sl(1|t,{destroy:void 0},n,a===void 0?null:a)}function Br(e,t,n,a){var l=Se();a=a===void 0?null:a;var i=l.memoizedState.inst;oe!==null&&a!==null&&xo(a,oe.memoizedState.deps)?l.memoizedState=sl(t,i,n,a):(K.flags|=e,l.memoizedState=sl(1|t,i,n,a))}function If(e,t){Hr(8390656,8,e,t)}function Oo(e,t){Br(2048,8,e,t)}function xb(e){K.flags|=4;var t=K.updateQueue;if(t===null)t=Ur(),K.updateQueue=t,t.events=[e];else{var n=t.events;n===null?t.events=[e]:n.push(e)}}function em(e){var t=Se().memoizedState;return xb({ref:t,nextImpl:e}),function(){if(ie&2)throw Error(A(440));return t.impl.apply(void 0,arguments)}}function tm(e,t){return Br(4,2,e,t)}function nm(e,t){return Br(4,4,e,t)}function am(e,t){if(typeof t=="function"){e=e();var n=t(e);return function(){typeof n=="function"?n():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function lm(e,t,n){n=n!=null?n.concat([e]):null,Br(4,4,am.bind(null,t,e),n)}function Do(){}function im(e,t){var n=Se();t=t===void 0?null:t;var a=n.memoizedState;return t!==null&&xo(t,a[1])?a[0]:(n.memoizedState=[e,t],e)}function rm(e,t){var n=Se();t=t===void 0?null:t;var a=n.memoizedState;if(t!==null&&xo(t,a[1]))return a[0];if(a=e(),xa){An(!0);try{e()}finally{An(!1)}}return n.memoizedState=[a,t],a}function zo(e,t,n){return n===void 0||ln&1073741824&&!(W&261930)?e.memoizedState=t:(e.memoizedState=n,e=sh(),K.lanes|=e,$n|=e,n)}function sm(e,t,n,a){return dt(n,t)?n:ll.current!==null?(e=zo(e,n,a),dt(e,t)||(Ee=!0),e):!(ln&42)||ln&1073741824&&!(W&261930)?(Ee=!0,e.memoizedState=n):(e=sh(),K.lanes|=e,$n|=e,t)}function cm(e,t,n,a,l){var i=le.p;le.p=i!==0&&8>i?i:8;var r=V.T,c={};V.T=c,Uo(e,!1,t,n);try{var o=l(),u=V.S;if(u!==null&&u(c,o),o!==null&&typeof o=="object"&&typeof o.then=="function"){var f=hb(o,a);pi(e,t,f,yt(e))}else pi(e,t,a,yt(e))}catch(p){pi(e,t,{then:function(){},status:"rejected",reason:p},yt())}finally{le.p=i,r!==null&&c.types!==null&&(r.types=c.types),V.T=r}}function Sb(){}function Mo(e,t,n,a){if(e.tag!==5)throw Error(A(476));var l=om(e).queue;cm(e,l,t,la,n===null?Sb:function(){return um(e),n(a)})}function om(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:la,baseState:la,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:rn,lastRenderedState:la},next:null};var n={};return t.next={memoizedState:n,baseState:n,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:rn,lastRenderedState:n},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function um(e){var t=om(e);t.next===null&&(t=e.alternate.memoizedState),pi(e,t.next.queue,{},yt())}function Ro(){return Le(Ci)}function dm(){return Se().memoizedState}function pm(){return Se().memoizedState}function _b(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var n=yt();e=Un(n);var a=kn(t,e,n);a!==null&&(nt(a,t,n),si(a,t,n)),t={cache:co()},e.payload=t;return}t=t.return}}function Nb(e,t,n){var a=yt();n={lane:a,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null},Yr(e)?mm(t,n):(n=Pc(e,t,n,a),n!==null&&(nt(n,e,a),hm(n,t,a)))}function fm(e,t,n){var a=yt();pi(e,t,n,a)}function pi(e,t,n,a){var l={lane:a,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null};if(Yr(e))mm(t,l);else{var i=e.alternate;if(e.lanes===0&&(i===null||i.lanes===0)&&(i=t.lastRenderedReducer,i!==null))try{var r=t.lastRenderedState,c=i(r,n);if(l.hasEagerState=!0,l.eagerState=c,dt(c,r))return xr(e,t,l,0),de===null&&br(),!1}catch{}finally{}if(n=Pc(e,t,l,a),n!==null)return nt(n,e,a),hm(n,t,a),!0}return!1}function Uo(e,t,n,a){if(a={lane:2,revertLane:fu(),gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null},Yr(e)){if(t)throw Error(A(479))}else t=Pc(e,n,a,2),t!==null&&nt(t,e,2)}function Yr(e){var t=e.alternate;return e===K||t!==null&&t===K}function mm(e,t){il=Mr=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function hm(e,t,n){if(n&4194048){var a=t.lanes;a&=e.pendingLanes,n|=a,t.lanes=n,bp(e,n)}}var fi={readContext:Le,use:kr,useCallback:ve,useContext:ve,useEffect:ve,useImperativeHandle:ve,useLayoutEffect:ve,useInsertionEffect:ve,useMemo:ve,useReducer:ve,useRef:ve,useState:ve,useDebugValue:ve,useDeferredValue:ve,useTransition:ve,useSyncExternalStore:ve,useId:ve,useHostTransitionStatus:ve,useFormState:ve,useActionState:ve,useOptimistic:ve,useMemoCache:ve,useCacheRefresh:ve};fi.useEffectEvent=ve;var gm={readContext:Le,use:kr,useCallback:function(e,t){return Ze().memoizedState=[e,t===void 0?null:t],e},useContext:Le,useEffect:If,useImperativeHandle:function(e,t,n){n=n!=null?n.concat([e]):null,Hr(4194308,4,am.bind(null,t,e),n)},useLayoutEffect:function(e,t){return Hr(4194308,4,e,t)},useInsertionEffect:function(e,t){Hr(4,2,e,t)},useMemo:function(e,t){var n=Ze();t=t===void 0?null:t;var a=e();if(xa){An(!0);try{e()}finally{An(!1)}}return n.memoizedState=[a,t],a},useReducer:function(e,t,n){var a=Ze();if(n!==void 0){var l=n(t);if(xa){An(!0);try{n(t)}finally{An(!1)}}}else l=t;return a.memoizedState=a.baseState=l,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:l},a.queue=e,e=e.dispatch=Nb.bind(null,K,e),[a.memoizedState,e]},useRef:function(e){var t=Ze();return e={current:e},t.memoizedState=e},useState:function(e){e=To(e);var t=e.queue,n=fm.bind(null,K,t);return t.dispatch=n,[e.memoizedState,n]},useDebugValue:Do,useDeferredValue:function(e,t){var n=Ze();return zo(n,e,t)},useTransition:function(){var e=To(!1);return e=cm.bind(null,K,e.queue,!0,!1),Ze().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,n){var a=K,l=Ze();if(I){if(n===void 0)throw Error(A(407));n=n()}else{if(n=t(),de===null)throw Error(A(349));W&127||Lf(a,t,n)}l.memoizedState=n;var i={value:n,getSnapshot:t};return l.queue=i,If(Bf.bind(null,a,i,e),[e]),a.flags|=2048,sl(9,{destroy:void 0},Hf.bind(null,a,i,n,t),null),n},useId:function(){var e=Ze(),t=de.identifierPrefix;if(I){var n=Gt,a=$t;n=(a&~(1<<32-ut(a)-1)).toString(32)+n,t="_"+t+"R_"+n,n=Rr++,0<n&&(t+="H"+n.toString(32)),t+="_"}else n=gb++,t="_"+t+"r_"+n.toString(32)+"_";return e.memoizedState=t},useHostTransitionStatus:Ro,useFormState:Kf,useActionState:Kf,useOptimistic:function(e){var t=Ze();t.memoizedState=t.baseState=e;var n={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=n,t=Uo.bind(null,K,!0,n),n.dispatch=t,[e,t]},useMemoCache:wo,useCacheRefresh:function(){return Ze().memoizedState=_b.bind(null,K)},useEffectEvent:function(e){var t=Ze(),n={impl:e};return t.memoizedState=n,function(){if(ie&2)throw Error(A(440));return n.impl.apply(void 0,arguments)}}},ko={readContext:Le,use:kr,useCallback:im,useContext:Le,useEffect:Oo,useImperativeHandle:lm,useInsertionEffect:tm,useLayoutEffect:nm,useMemo:rm,useReducer:Lr,useRef:Wf,useState:function(){return Lr(rn)},useDebugValue:Do,useDeferredValue:function(e,t){var n=Se();return sm(n,oe.memoizedState,e,t)},useTransition:function(){var e=Lr(rn)[0],t=Se().memoizedState;return[typeof e=="boolean"?e:di(e),t]},useSyncExternalStore:kf,useId:dm,useHostTransitionStatus:Ro,useFormState:Ff,useActionState:Ff,useOptimistic:function(e,t){var n=Se();return Gf(n,oe,e,t)},useMemoCache:wo,useCacheRefresh:pm};ko.useEffectEvent=em;var ym={readContext:Le,use:kr,useCallback:im,useContext:Le,useEffect:Oo,useImperativeHandle:lm,useInsertionEffect:tm,useLayoutEffect:nm,useMemo:rm,useReducer:Ao,useRef:Wf,useState:function(){return Ao(rn)},useDebugValue:Do,useDeferredValue:function(e,t){var n=Se();return oe===null?zo(n,e,t):sm(n,oe.memoizedState,e,t)},useTransition:function(){var e=Ao(rn)[0],t=Se().memoizedState;return[typeof e=="boolean"?e:di(e),t]},useSyncExternalStore:kf,useId:dm,useHostTransitionStatus:Ro,useFormState:Pf,useActionState:Pf,useOptimistic:function(e,t){var n=Se();return oe!==null?Gf(n,oe,e,t):(n.baseState=e,[e,n.queue.dispatch])},useMemoCache:wo,useCacheRefresh:pm};ym.useEffectEvent=em;function Lo(e,t,n,a){t=e.memoizedState,n=n(a,t),n=n==null?t:me({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var Ho={enqueueSetState:function(e,t,n){e=e._reactInternals;var a=yt(),l=Un(a);l.payload=t,n!=null&&(l.callback=n),t=kn(e,l,a),t!==null&&(nt(t,e,a),si(t,e,a))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var a=yt(),l=Un(a);l.tag=1,l.payload=t,n!=null&&(l.callback=n),t=kn(e,l,a),t!==null&&(nt(t,e,a),si(t,e,a))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=yt(),a=Un(n);a.tag=2,t!=null&&(a.callback=t),t=kn(e,a,n),t!==null&&(nt(t,e,n),si(t,e,n))}};function vm(e,t,n,a,l,i,r){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(a,i,r):t.prototype&&t.prototype.isPureReactComponent?!Il(n,a)||!Il(l,i):!0}function bm(e,t,n,a){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(n,a),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(n,a),t.state!==e&&Ho.enqueueReplaceState(t,t.state,null)}function Sa(e,t){var n=t;if("ref"in t){n={};for(var a in t)a!=="ref"&&(n[a]=t[a])}if(e=e.defaultProps){n===t&&(n=me({},n));for(var l in e)n[l]===void 0&&(n[l]=e[l])}return n}function xm(e){vr(e)}function Sm(e){console.error(e)}function _m(e){vr(e)}function $r(e,t){try{var n=e.onUncaughtError;n(t.value,{componentStack:t.stack})}catch(a){setTimeout(function(){throw a})}}function Nm(e,t,n){try{var a=e.onCaughtError;a(n.value,{componentStack:n.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(l){setTimeout(function(){throw l})}}function Bo(e,t,n){return n=Un(n),n.tag=3,n.payload={element:null},n.callback=function(){$r(e,t)},n}function jm(e){return e=Un(e),e.tag=3,e}function wm(e,t,n,a){var l=n.type.getDerivedStateFromError;if(typeof l=="function"){var i=a.value;e.payload=function(){return l(i)},e.callback=function(){Nm(t,n,a)}}var r=n.stateNode;r!==null&&typeof r.componentDidCatch=="function"&&(e.callback=function(){Nm(t,n,a),typeof l!="function"&&(Gn===null?Gn=new Set([this]):Gn.add(this));var c=a.stack;this.componentDidCatch(a.value,{componentStack:c!==null?c:""})})}function jb(e,t,n,a,l){if(n.flags|=32768,a!==null&&typeof a=="object"&&typeof a.then=="function"){if(t=n.alternate,t!==null&&Ia(t,n,l,!0),n=ft.current,n!==null){switch(n.tag){case 31:case 13:return Tt===null?Ir():n.alternate===null&&be===0&&(be=3),n.flags&=-257,n.flags|=65536,n.lanes=l,a===Tr?n.flags|=16384:(t=n.updateQueue,t===null?n.updateQueue=new Set([a]):t.add(a),uu(e,a,l)),!1;case 22:return n.flags|=65536,a===Tr?n.flags|=16384:(t=n.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([a])},n.updateQueue=t):(n=t.retryQueue,n===null?t.retryQueue=new Set([a]):n.add(a)),uu(e,a,l)),!1}throw Error(A(435,n.tag))}return uu(e,a,l),Ir(),!1}if(I)return t=ft.current,t!==null?(!(t.flags&65536)&&(t.flags|=256),t.flags|=65536,t.lanes=l,a!==ao&&(e=Error(A(422),{cause:a}),ni(jt(e,n)))):(a!==ao&&(t=Error(A(423),{cause:a}),ni(jt(t,n))),e=e.current.alternate,e.flags|=65536,l&=-l,e.lanes|=l,a=jt(a,n),l=Bo(e.stateNode,a,l),ho(e,l),be!==4&&(be=2)),!1;var i=Error(A(520),{cause:a});if(i=jt(i,n),Si===null?Si=[i]:Si.push(i),be!==4&&(be=2),t===null)return!0;a=jt(a,n),n=t;do{switch(n.tag){case 3:return n.flags|=65536,e=l&-l,n.lanes|=e,e=Bo(n.stateNode,a,e),ho(n,e),!1;case 1:if(t=n.type,i=n.stateNode,(n.flags&128)===0&&(typeof t.getDerivedStateFromError=="function"||i!==null&&typeof i.componentDidCatch=="function"&&(Gn===null||!Gn.has(i))))return n.flags|=65536,l&=-l,n.lanes|=l,l=jm(l),wm(l,e,n,a),ho(n,l),!1}n=n.return}while(n!==null);return!1}var Yo=Error(A(461)),Ee=!1;function He(e,t,n,a){t.child=e===null?Cf(t,null,n,a):ba(t,e.child,n,a)}function Em(e,t,n,a,l){n=n.render;var i=t.ref;if("ref"in a){var r={};for(var c in a)c!=="ref"&&(r[c]=a[c])}else r=a;return ha(t),a=So(e,t,n,r,i,l),c=_o(),e!==null&&!Ee?(No(e,t,l),sn(e,t,l)):(I&&c&&to(t),t.flags|=1,He(e,t,a,l),t.child)}function Am(e,t,n,a,l){if(e===null){var i=n.type;return typeof i=="function"&&!Wc(i)&&i.defaultProps===void 0&&n.compare===null?(t.tag=15,t.type=i,Tm(e,t,i,a,l)):(e=_r(n.type,null,a,t,t.mode,l),e.ref=t.ref,e.return=t,t.child=e)}if(i=e.child,!Ko(e,l)){var r=i.memoizedProps;if(n=n.compare,n=n!==null?n:Il,n(r,a)&&e.ref===t.ref)return sn(e,t,l)}return t.flags|=1,e=en(i,a),e.ref=t.ref,e.return=t,t.child=e}function Tm(e,t,n,a,l){if(e!==null){var i=e.memoizedProps;if(Il(i,a)&&e.ref===t.ref)if(Ee=!1,t.pendingProps=a=i,Ko(e,l))e.flags&131072&&(Ee=!0);else return t.lanes=e.lanes,sn(e,t,l)}return $o(e,t,n,a,l)}function Cm(e,t,n,a){var l=a.children,i=e!==null?e.memoizedState:null;if(e===null&&t.stateNode===null&&(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),a.mode==="hidden"){if(t.flags&128){if(i=i!==null?i.baseLanes|n:n,e!==null){for(a=t.child=e.child,l=0;a!==null;)l=l|a.lanes|a.childLanes,a=a.sibling;a=l&~i}else a=0,t.child=null;return Om(e,t,i,n,a)}if(n&536870912)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&Er(t,i!==null?i.cachePool:null),i!==null?zf(t,i):yo(),Mf(t);else return a=t.lanes=536870912,Om(e,t,i!==null?i.baseLanes|n:n,n,a)}else i!==null?(Er(t,i.cachePool),zf(t,i),Hn(),t.memoizedState=null):(e!==null&&Er(t,null),yo(),Hn());return He(e,t,l,n),t.child}function mi(e,t){return e!==null&&e.tag===22||t.stateNode!==null||(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),t.sibling}function Om(e,t,n,a,l){var i=uo();return i=i===null?null:{parent:je._currentValue,pool:i},t.memoizedState={baseLanes:n,cachePool:i},e!==null&&Er(t,null),yo(),Mf(t),e!==null&&Ia(e,t,a,!0),t.childLanes=l,null}function Gr(e,t){return t=Vr({mode:t.mode,children:t.children},e.mode),t.ref=e.ref,e.child=t,t.return=e,t}function Dm(e,t,n){return ba(t,e.child,null,n),e=Gr(t,t.pendingProps),e.flags|=2,mt(t),t.memoizedState=null,e}function wb(e,t,n){var a=t.pendingProps,l=(t.flags&128)!==0;if(t.flags&=-129,e===null){if(I){if(a.mode==="hidden")return e=Gr(t,a),t.lanes=536870912,mi(null,e);if(bo(t),(e=he)?(e=qh(e,At),e=e!==null&&e.data==="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:On!==null?{id:$t,overflow:Gt}:null,retryLane:536870912,hydrationErrors:null},n=mf(e),n.return=t,t.child=n,ke=t,he=null)):e=null,e===null)throw zn(t);return t.lanes=536870912,null}return Gr(t,a)}var i=e.memoizedState;if(i!==null){var r=i.dehydrated;if(bo(t),l)if(t.flags&256)t.flags&=-257,t=Dm(e,t,n);else if(t.memoizedState!==null)t.child=e.child,t.flags|=128,t=null;else throw Error(A(558));else if(Ee||Ia(e,t,n,!1),l=(n&e.childLanes)!==0,Ee||l){if(a=de,a!==null&&(r=xp(a,n),r!==0&&r!==i.retryLane))throw i.retryLane=r,da(e,r),nt(a,e,r),Yo;Ir(),t=Dm(e,t,n)}else e=i.treeContext,he=Ct(r.nextSibling),ke=t,I=!0,Dn=null,At=!1,e!==null&&yf(t,e),t=Gr(t,a),t.flags|=4096;return t}return e=en(e.child,{mode:a.mode,children:a.children}),e.ref=t.ref,t.child=e,e.return=t,e}function qr(e,t){var n=t.ref;if(n===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof n!="function"&&typeof n!="object")throw Error(A(284));(e===null||e.ref!==n)&&(t.flags|=4194816)}}function $o(e,t,n,a,l){return ha(t),n=So(e,t,n,a,void 0,l),a=_o(),e!==null&&!Ee?(No(e,t,l),sn(e,t,l)):(I&&a&&to(t),t.flags|=1,He(e,t,n,l),t.child)}function zm(e,t,n,a,l,i){return ha(t),t.updateQueue=null,n=Uf(t,a,n,l),Rf(e),a=_o(),e!==null&&!Ee?(No(e,t,i),sn(e,t,i)):(I&&a&&to(t),t.flags|=1,He(e,t,n,i),t.child)}function Mm(e,t,n,a,l){if(ha(t),t.stateNode===null){var i=Fa,r=n.contextType;typeof r=="object"&&r!==null&&(i=Le(r)),i=new n(a,i),t.memoizedState=i.state!==null&&i.state!==void 0?i.state:null,i.updater=Ho,t.stateNode=i,i._reactInternals=t,i=t.stateNode,i.props=a,i.state=t.memoizedState,i.refs={},fo(t),r=n.contextType,i.context=typeof r=="object"&&r!==null?Le(r):Fa,i.state=t.memoizedState,r=n.getDerivedStateFromProps,typeof r=="function"&&(Lo(t,n,r,a),i.state=t.memoizedState),typeof n.getDerivedStateFromProps=="function"||typeof i.getSnapshotBeforeUpdate=="function"||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(r=i.state,typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount(),r!==i.state&&Ho.enqueueReplaceState(i,i.state,null),oi(t,a,i,l),ci(),i.state=t.memoizedState),typeof i.componentDidMount=="function"&&(t.flags|=4194308),a=!0}else if(e===null){i=t.stateNode;var c=t.memoizedProps,o=Sa(n,c);i.props=o;var u=i.context,f=n.contextType;r=Fa,typeof f=="object"&&f!==null&&(r=Le(f));var p=n.getDerivedStateFromProps;f=typeof p=="function"||typeof i.getSnapshotBeforeUpdate=="function",c=t.pendingProps!==c,f||typeof i.UNSAFE_componentWillReceiveProps!="function"&&typeof i.componentWillReceiveProps!="function"||(c||u!==r)&&bm(t,i,a,r),Rn=!1;var d=t.memoizedState;i.state=d,oi(t,a,i,l),ci(),u=t.memoizedState,c||d!==u||Rn?(typeof p=="function"&&(Lo(t,n,p,a),u=t.memoizedState),(o=Rn||vm(t,n,o,a,d,u,r))?(f||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount()),typeof i.componentDidMount=="function"&&(t.flags|=4194308)):(typeof i.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=a,t.memoizedState=u),i.props=a,i.state=u,i.context=r,a=o):(typeof i.componentDidMount=="function"&&(t.flags|=4194308),a=!1)}else{i=t.stateNode,mo(e,t),r=t.memoizedProps,f=Sa(n,r),i.props=f,p=t.pendingProps,d=i.context,u=n.contextType,o=Fa,typeof u=="object"&&u!==null&&(o=Le(u)),c=n.getDerivedStateFromProps,(u=typeof c=="function"||typeof i.getSnapshotBeforeUpdate=="function")||typeof i.UNSAFE_componentWillReceiveProps!="function"&&typeof i.componentWillReceiveProps!="function"||(r!==p||d!==o)&&bm(t,i,a,o),Rn=!1,d=t.memoizedState,i.state=d,oi(t,a,i,l),ci();var m=t.memoizedState;r!==p||d!==m||Rn||e!==null&&e.dependencies!==null&&jr(e.dependencies)?(typeof c=="function"&&(Lo(t,n,c,a),m=t.memoizedState),(f=Rn||vm(t,n,f,a,d,m,o)||e!==null&&e.dependencies!==null&&jr(e.dependencies))?(u||typeof i.UNSAFE_componentWillUpdate!="function"&&typeof i.componentWillUpdate!="function"||(typeof i.componentWillUpdate=="function"&&i.componentWillUpdate(a,m,o),typeof i.UNSAFE_componentWillUpdate=="function"&&i.UNSAFE_componentWillUpdate(a,m,o)),typeof i.componentDidUpdate=="function"&&(t.flags|=4),typeof i.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof i.componentDidUpdate!="function"||r===e.memoizedProps&&d===e.memoizedState||(t.flags|=4),typeof i.getSnapshotBeforeUpdate!="function"||r===e.memoizedProps&&d===e.memoizedState||(t.flags|=1024),t.memoizedProps=a,t.memoizedState=m),i.props=a,i.state=m,i.context=o,a=f):(typeof i.componentDidUpdate!="function"||r===e.memoizedProps&&d===e.memoizedState||(t.flags|=4),typeof i.getSnapshotBeforeUpdate!="function"||r===e.memoizedProps&&d===e.memoizedState||(t.flags|=1024),a=!1)}return i=a,qr(e,t),a=(t.flags&128)!==0,i||a?(i=t.stateNode,n=a&&typeof n.getDerivedStateFromError!="function"?null:i.render(),t.flags|=1,e!==null&&a?(t.child=ba(t,e.child,null,l),t.child=ba(t,null,n,l)):He(e,t,n,l),t.memoizedState=i.state,e=t.child):e=sn(e,t,l),e}function Rm(e,t,n,a){return fa(),t.flags|=256,He(e,t,n,a),t.child}var Go={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function qo(e){return{baseLanes:e,cachePool:Nf()}}function Vo(e,t,n){return e=e!==null?e.childLanes&~n:0,t&&(e|=gt),e}function Um(e,t,n){var a=t.pendingProps,l=!1,i=(t.flags&128)!==0,r;if((r=i)||(r=e!==null&&e.memoizedState===null?!1:(xe.current&2)!==0),r&&(l=!0,t.flags&=-129),r=(t.flags&32)!==0,t.flags&=-33,e===null){if(I){if(l?Ln(t):Hn(),(e=he)?(e=qh(e,At),e=e!==null&&e.data!=="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:On!==null?{id:$t,overflow:Gt}:null,retryLane:536870912,hydrationErrors:null},n=mf(e),n.return=t,t.child=n,ke=t,he=null)):e=null,e===null)throw zn(t);return Eu(e)?t.lanes=32:t.lanes=536870912,null}var c=a.children;return a=a.fallback,l?(Hn(),l=t.mode,c=Vr({mode:"hidden",children:c},l),a=pa(a,l,n,null),c.return=t,a.return=t,c.sibling=a,t.child=c,a=t.child,a.memoizedState=qo(n),a.childLanes=Vo(e,r,n),t.memoizedState=Go,mi(null,a)):(Ln(t),Xo(t,c))}var o=e.memoizedState;if(o!==null&&(c=o.dehydrated,c!==null)){if(i)t.flags&256?(Ln(t),t.flags&=-257,t=Qo(e,t,n)):t.memoizedState!==null?(Hn(),t.child=e.child,t.flags|=128,t=null):(Hn(),c=a.fallback,l=t.mode,a=Vr({mode:"visible",children:a.children},l),c=pa(c,l,n,null),c.flags|=2,a.return=t,c.return=t,a.sibling=c,t.child=a,ba(t,e.child,null,n),a=t.child,a.memoizedState=qo(n),a.childLanes=Vo(e,r,n),t.memoizedState=Go,t=mi(null,a));else if(Ln(t),Eu(c)){if(r=c.nextSibling&&c.nextSibling.dataset,r)var u=r.dgst;r=u,a=Error(A(419)),a.stack="",a.digest=r,ni({value:a,source:null,stack:null}),t=Qo(e,t,n)}else if(Ee||Ia(e,t,n,!1),r=(n&e.childLanes)!==0,Ee||r){if(r=de,r!==null&&(a=xp(r,n),a!==0&&a!==o.retryLane))throw o.retryLane=a,da(e,a),nt(r,e,a),Yo;wu(c)||Ir(),t=Qo(e,t,n)}else wu(c)?(t.flags|=192,t.child=e.child,t=null):(e=o.treeContext,he=Ct(c.nextSibling),ke=t,I=!0,Dn=null,At=!1,e!==null&&yf(t,e),t=Xo(t,a.children),t.flags|=4096);return t}return l?(Hn(),c=a.fallback,l=t.mode,o=e.child,u=o.sibling,a=en(o,{mode:"hidden",children:a.children}),a.subtreeFlags=o.subtreeFlags&65011712,u!==null?c=en(u,c):(c=pa(c,l,n,null),c.flags|=2),c.return=t,a.return=t,a.sibling=c,t.child=a,mi(null,a),a=t.child,c=e.child.memoizedState,c===null?c=qo(n):(l=c.cachePool,l!==null?(o=je._currentValue,l=l.parent!==o?{parent:o,pool:o}:l):l=Nf(),c={baseLanes:c.baseLanes|n,cachePool:l}),a.memoizedState=c,a.childLanes=Vo(e,r,n),t.memoizedState=Go,mi(e.child,a)):(Ln(t),n=e.child,e=n.sibling,n=en(n,{mode:"visible",children:a.children}),n.return=t,n.sibling=null,e!==null&&(r=t.deletions,r===null?(t.deletions=[e],t.flags|=16):r.push(e)),t.child=n,t.memoizedState=null,n)}function Xo(e,t){return t=Vr({mode:"visible",children:t},e.mode),t.return=e,e.child=t}function Vr(e,t){return e=pt(22,e,null,t),e.lanes=0,e}function Qo(e,t,n){return ba(t,e.child,null,n),e=Xo(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function km(e,t,n){e.lanes|=t;var a=e.alternate;a!==null&&(a.lanes|=t),ro(e.return,t,n)}function Zo(e,t,n,a,l,i){var r=e.memoizedState;r===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:a,tail:n,tailMode:l,treeForkCount:i}:(r.isBackwards=t,r.rendering=null,r.renderingStartTime=0,r.last=a,r.tail=n,r.tailMode=l,r.treeForkCount=i)}function Lm(e,t,n){var a=t.pendingProps,l=a.revealOrder,i=a.tail;a=a.children;var r=xe.current,c=(r&2)!==0;if(c?(r=r&1|2,t.flags|=128):r&=1,pe(xe,r),He(e,t,a,n),a=I?ti:0,!c&&e!==null&&e.flags&128)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&km(e,n,t);else if(e.tag===19)km(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(l){case"forwards":for(n=t.child,l=null;n!==null;)e=n.alternate,e!==null&&zr(e)===null&&(l=n),n=n.sibling;n=l,n===null?(l=t.child,t.child=null):(l=n.sibling,n.sibling=null),Zo(t,!1,l,n,i,a);break;case"backwards":case"unstable_legacy-backwards":for(n=null,l=t.child,t.child=null;l!==null;){if(e=l.alternate,e!==null&&zr(e)===null){t.child=l;break}e=l.sibling,l.sibling=n,n=l,l=e}Zo(t,!0,n,null,i,a);break;case"together":Zo(t,!1,null,null,void 0,a);break;default:t.memoizedState=null}return t.child}function sn(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),$n|=t.lanes,!(n&t.childLanes))if(e!==null){if(Ia(e,t,n,!1),(n&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error(A(153));if(t.child!==null){for(e=t.child,n=en(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=en(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function Ko(e,t){return e.lanes&t?!0:(e=e.dependencies,!!(e!==null&&jr(e)))}function Eb(e,t,n){switch(t.tag){case 3:tr(t,t.stateNode.containerInfo),Mn(t,je,e.memoizedState.cache),fa();break;case 27:case 5:yc(t);break;case 4:tr(t,t.stateNode.containerInfo);break;case 10:Mn(t,t.type,t.memoizedProps.value);break;case 31:if(t.memoizedState!==null)return t.flags|=128,bo(t),null;break;case 13:var a=t.memoizedState;if(a!==null)return a.dehydrated!==null?(Ln(t),t.flags|=128,null):n&t.child.childLanes?Um(e,t,n):(Ln(t),e=sn(e,t,n),e!==null?e.sibling:null);Ln(t);break;case 19:var l=(e.flags&128)!==0;if(a=(n&t.childLanes)!==0,a||(Ia(e,t,n,!1),a=(n&t.childLanes)!==0),l){if(a)return Lm(e,t,n);t.flags|=128}if(l=t.memoizedState,l!==null&&(l.rendering=null,l.tail=null,l.lastEffect=null),pe(xe,xe.current),a)break;return null;case 22:return t.lanes=0,Cm(e,t,n,t.pendingProps);case 24:Mn(t,je,e.memoizedState.cache)}return sn(e,t,n)}function Hm(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps)Ee=!0;else{if(!Ko(e,n)&&!(t.flags&128))return Ee=!1,Eb(e,t,n);Ee=!!(e.flags&131072)}else Ee=!1,I&&t.flags&1048576&&gf(t,ti,t.index);switch(t.lanes=0,t.tag){case 16:e:{var a=t.pendingProps;if(e=ya(t.elementType),t.type=e,typeof e=="function")Wc(e)?(a=Sa(e,a),t.tag=1,t=Mm(null,t,e,a,n)):(t.tag=0,t=$o(null,t,e,a,n));else{if(e!=null){var l=e.$$typeof;if(l===uc){t.tag=11,t=Em(null,t,e,a,n);break e}else if(l===fc){t.tag=14,t=Am(null,t,e,a,n);break e}}throw t=hc(e)||e,Error(A(306,t,""))}}return t;case 0:return $o(e,t,t.type,t.pendingProps,n);case 1:return a=t.type,l=Sa(a,t.pendingProps),Mm(e,t,a,l,n);case 3:e:{if(tr(t,t.stateNode.containerInfo),e===null)throw Error(A(387));a=t.pendingProps;var i=t.memoizedState;l=i.element,mo(e,t),oi(t,a,null,n);var r=t.memoizedState;if(a=r.cache,Mn(t,je,a),a!==i.cache&&so(t,[je],n,!0),ci(),a=r.element,i.isDehydrated)if(i={element:a,isDehydrated:!1,cache:r.cache},t.updateQueue.baseState=i,t.memoizedState=i,t.flags&256){t=Rm(e,t,a,n);break e}else if(a!==l){l=jt(Error(A(424)),t),ni(l),t=Rm(e,t,a,n);break e}else{switch(e=t.stateNode.containerInfo,e.nodeType){case 9:e=e.body;break;default:e=e.nodeName==="HTML"?e.ownerDocument.body:e}for(he=Ct(e.firstChild),ke=t,I=!0,Dn=null,At=!0,n=Cf(t,null,a,n),t.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling}else{if(fa(),a===l){t=sn(e,t,n);break e}He(e,t,a,n)}t=t.child}return t;case 26:return qr(e,t),e===null?(n=Fh(t.type,null,t.pendingProps,null))?t.memoizedState=n:I||(n=t.type,e=t.pendingProps,a=rs(En.current).createElement(n),a[Ue]=t,a[Je]=e,Be(a,n,e),ze(a),t.stateNode=a):t.memoizedState=Fh(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return yc(t),e===null&&I&&(a=t.stateNode=Qh(t.type,t.pendingProps,En.current),ke=t,At=!0,l=he,Qn(t.type)?(Au=l,he=Ct(a.firstChild)):he=l),He(e,t,t.pendingProps.children,n),qr(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&I&&((l=a=he)&&(a=nx(a,t.type,t.pendingProps,At),a!==null?(t.stateNode=a,ke=t,he=Ct(a.firstChild),At=!1,l=!0):l=!1),l||zn(t)),yc(t),l=t.type,i=t.pendingProps,r=e!==null?e.memoizedProps:null,a=i.children,_u(l,i)?a=null:r!==null&&_u(l,r)&&(t.flags|=32),t.memoizedState!==null&&(l=So(e,t,yb,null,null,n),Ci._currentValue=l),qr(e,t),He(e,t,a,n),t.child;case 6:return e===null&&I&&((e=n=he)&&(n=ax(n,t.pendingProps,At),n!==null?(t.stateNode=n,ke=t,he=null,e=!0):e=!1),e||zn(t)),null;case 13:return Um(e,t,n);case 4:return tr(t,t.stateNode.containerInfo),a=t.pendingProps,e===null?t.child=ba(t,null,a,n):He(e,t,a,n),t.child;case 11:return Em(e,t,t.type,t.pendingProps,n);case 7:return He(e,t,t.pendingProps,n),t.child;case 8:return He(e,t,t.pendingProps.children,n),t.child;case 12:return He(e,t,t.pendingProps.children,n),t.child;case 10:return a=t.pendingProps,Mn(t,t.type,a.value),He(e,t,a.children,n),t.child;case 9:return l=t.type._context,a=t.pendingProps.children,ha(t),l=Le(l),a=a(l),t.flags|=1,He(e,t,a,n),t.child;case 14:return Am(e,t,t.type,t.pendingProps,n);case 15:return Tm(e,t,t.type,t.pendingProps,n);case 19:return Lm(e,t,n);case 31:return wb(e,t,n);case 22:return Cm(e,t,n,t.pendingProps);case 24:return ha(t),a=Le(je),e===null?(l=uo(),l===null&&(l=de,i=co(),l.pooledCache=i,i.refCount++,i!==null&&(l.pooledCacheLanes|=n),l=i),t.memoizedState={parent:a,cache:l},fo(t),Mn(t,je,l)):(e.lanes&n&&(mo(e,t),oi(t,null,null,n),ci()),l=e.memoizedState,i=t.memoizedState,l.parent!==a?(l={parent:a,cache:a},t.memoizedState=l,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=l),Mn(t,je,a)):(a=i.cache,Mn(t,je,a),a!==l.cache&&so(t,[je],n,!0))),He(e,t,t.pendingProps.children,n),t.child;case 29:throw t.pendingProps}throw Error(A(156,t.tag))}function cn(e){e.flags|=4}function Fo(e,t,n,a,l){if((t=(e.mode&32)!==0)&&(t=!1),t){if(e.flags|=16777216,(l&335544128)===l)if(e.stateNode.complete)e.flags|=8192;else if(dh())e.flags|=8192;else throw va=Tr,po}else e.flags&=-16777217}function Bm(e,t){if(t.type!=="stylesheet"||t.state.loading&4)e.flags&=-16777217;else if(e.flags|=16777216,!eg(t))if(dh())e.flags|=8192;else throw va=Tr,po}function Xr(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag!==22?yp():536870912,e.lanes|=t,dl|=t)}function hi(e,t){if(!I)switch(e.tailMode){case"hidden":t=e.tail;for(var n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null;break;case"collapsed":n=e.tail;for(var a=null;n!==null;)n.alternate!==null&&(a=n),n=n.sibling;a===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:a.sibling=null}}function ge(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,a=0;if(t)for(var l=e.child;l!==null;)n|=l.lanes|l.childLanes,a|=l.subtreeFlags&65011712,a|=l.flags&65011712,l.return=e,l=l.sibling;else for(l=e.child;l!==null;)n|=l.lanes|l.childLanes,a|=l.subtreeFlags,a|=l.flags,l.return=e,l=l.sibling;return e.subtreeFlags|=a,e.childLanes=n,t}function Ab(e,t,n){var a=t.pendingProps;switch(no(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return ge(t),null;case 1:return ge(t),null;case 3:return n=t.stateNode,a=null,e!==null&&(a=e.memoizedState.cache),t.memoizedState.cache!==a&&(t.flags|=2048),an(je),Ua(),n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),(e===null||e.child===null)&&(Wa(t)?cn(t):e===null||e.memoizedState.isDehydrated&&!(t.flags&256)||(t.flags|=1024,lo())),ge(t),null;case 26:var l=t.type,i=t.memoizedState;return e===null?(cn(t),i!==null?(ge(t),Bm(t,i)):(ge(t),Fo(t,l,null,a,n))):i?i!==e.memoizedState?(cn(t),ge(t),Bm(t,i)):(ge(t),t.flags&=-16777217):(e=e.memoizedProps,e!==a&&cn(t),ge(t),Fo(t,l,e,a,n)),null;case 27:if(nr(t),n=En.current,l=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==a&&cn(t);else{if(!a){if(t.stateNode===null)throw Error(A(166));return ge(t),null}e=Yt.current,Wa(t)?vf(t):(e=Qh(l,a,n),t.stateNode=e,cn(t))}return ge(t),null;case 5:if(nr(t),l=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==a&&cn(t);else{if(!a){if(t.stateNode===null)throw Error(A(166));return ge(t),null}if(i=Yt.current,Wa(t))vf(t);else{var r=rs(En.current);switch(i){case 1:i=r.createElementNS("http://www.w3.org/2000/svg",l);break;case 2:i=r.createElementNS("http://www.w3.org/1998/Math/MathML",l);break;default:switch(l){case"svg":i=r.createElementNS("http://www.w3.org/2000/svg",l);break;case"math":i=r.createElementNS("http://www.w3.org/1998/Math/MathML",l);break;case"script":i=r.createElement("div"),i.innerHTML="<script><\/script>",i=i.removeChild(i.firstChild);break;case"select":i=typeof a.is=="string"?r.createElement("select",{is:a.is}):r.createElement("select"),a.multiple?i.multiple=!0:a.size&&(i.size=a.size);break;default:i=typeof a.is=="string"?r.createElement(l,{is:a.is}):r.createElement(l)}}i[Ue]=t,i[Je]=a;e:for(r=t.child;r!==null;){if(r.tag===5||r.tag===6)i.appendChild(r.stateNode);else if(r.tag!==4&&r.tag!==27&&r.child!==null){r.child.return=r,r=r.child;continue}if(r===t)break e;for(;r.sibling===null;){if(r.return===null||r.return===t)break e;r=r.return}r.sibling.return=r.return,r=r.sibling}t.stateNode=i;e:switch(Be(i,l,a),l){case"button":case"input":case"select":case"textarea":a=!!a.autoFocus;break e;case"img":a=!0;break e;default:a=!1}a&&cn(t)}}return ge(t),Fo(t,t.type,e===null?null:e.memoizedProps,t.pendingProps,n),null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==a&&cn(t);else{if(typeof a!="string"&&t.stateNode===null)throw Error(A(166));if(e=En.current,Wa(t)){if(e=t.stateNode,n=t.memoizedProps,a=null,l=ke,l!==null)switch(l.tag){case 27:case 5:a=l.memoizedProps}e[Ue]=t,e=!!(e.nodeValue===n||a!==null&&a.suppressHydrationWarning===!0||Uh(e.nodeValue,n)),e||zn(t,!0)}else e=rs(e).createTextNode(a),e[Ue]=t,t.stateNode=e}return ge(t),null;case 31:if(n=t.memoizedState,e===null||e.memoizedState!==null){if(a=Wa(t),n!==null){if(e===null){if(!a)throw Error(A(318));if(e=t.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(A(557));e[Ue]=t}else fa(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;ge(t),e=!1}else n=lo(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=n),e=!0;if(!e)return t.flags&256?(mt(t),t):(mt(t),null);if(t.flags&128)throw Error(A(558))}return ge(t),null;case 13:if(a=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(l=Wa(t),a!==null&&a.dehydrated!==null){if(e===null){if(!l)throw Error(A(318));if(l=t.memoizedState,l=l!==null?l.dehydrated:null,!l)throw Error(A(317));l[Ue]=t}else fa(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;ge(t),l=!1}else l=lo(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=l),l=!0;if(!l)return t.flags&256?(mt(t),t):(mt(t),null)}return mt(t),t.flags&128?(t.lanes=n,t):(n=a!==null,e=e!==null&&e.memoizedState!==null,n&&(a=t.child,l=null,a.alternate!==null&&a.alternate.memoizedState!==null&&a.alternate.memoizedState.cachePool!==null&&(l=a.alternate.memoizedState.cachePool.pool),i=null,a.memoizedState!==null&&a.memoizedState.cachePool!==null&&(i=a.memoizedState.cachePool.pool),i!==l&&(a.flags|=2048)),n!==e&&n&&(t.child.flags|=8192),Xr(t,t.updateQueue),ge(t),null);case 4:return Ua(),e===null&&yu(t.stateNode.containerInfo),ge(t),null;case 10:return an(t.type),ge(t),null;case 19:if(De(xe),a=t.memoizedState,a===null)return ge(t),null;if(l=(t.flags&128)!==0,i=a.rendering,i===null)if(l)hi(a,!1);else{if(be!==0||e!==null&&e.flags&128)for(e=t.child;e!==null;){if(i=zr(e),i!==null){for(t.flags|=128,hi(a,!1),e=i.updateQueue,t.updateQueue=e,Xr(t,e),t.subtreeFlags=0,e=n,n=t.child;n!==null;)ff(n,e),n=n.sibling;return pe(xe,xe.current&1|2),I&&tn(t,a.treeForkCount),t.child}e=e.sibling}a.tail!==null&&ct()>Jr&&(t.flags|=128,l=!0,hi(a,!1),t.lanes=4194304)}else{if(!l)if(e=zr(i),e!==null){if(t.flags|=128,l=!0,e=e.updateQueue,t.updateQueue=e,Xr(t,e),hi(a,!0),a.tail===null&&a.tailMode==="hidden"&&!i.alternate&&!I)return ge(t),null}else 2*ct()-a.renderingStartTime>Jr&&n!==536870912&&(t.flags|=128,l=!0,hi(a,!1),t.lanes=4194304);a.isBackwards?(i.sibling=t.child,t.child=i):(e=a.last,e!==null?e.sibling=i:t.child=i,a.last=i)}return a.tail!==null?(e=a.tail,a.rendering=e,a.tail=e.sibling,a.renderingStartTime=ct(),e.sibling=null,n=xe.current,pe(xe,l?n&1|2:n&1),I&&tn(t,a.treeForkCount),e):(ge(t),null);case 22:case 23:return mt(t),vo(),a=t.memoizedState!==null,e!==null?e.memoizedState!==null!==a&&(t.flags|=8192):a&&(t.flags|=8192),a?n&536870912&&!(t.flags&128)&&(ge(t),t.subtreeFlags&6&&(t.flags|=8192)):ge(t),n=t.updateQueue,n!==null&&Xr(t,n.retryQueue),n=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),a=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(a=t.memoizedState.cachePool.pool),a!==n&&(t.flags|=2048),e!==null&&De(ga),null;case 24:return n=null,e!==null&&(n=e.memoizedState.cache),t.memoizedState.cache!==n&&(t.flags|=2048),an(je),ge(t),null;case 25:return null;case 30:return null}throw Error(A(156,t.tag))}function Tb(e,t){switch(no(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return an(je),Ua(),e=t.flags,e&65536&&!(e&128)?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return nr(t),null;case 31:if(t.memoizedState!==null){if(mt(t),t.alternate===null)throw Error(A(340));fa()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 13:if(mt(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(A(340));fa()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return De(xe),null;case 4:return Ua(),null;case 10:return an(t.type),null;case 22:case 23:return mt(t),vo(),e!==null&&De(ga),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return an(je),null;case 25:return null;default:return null}}function Ym(e,t){switch(no(t),t.tag){case 3:an(je),Ua();break;case 26:case 27:case 5:nr(t);break;case 4:Ua();break;case 31:t.memoizedState!==null&&mt(t);break;case 13:mt(t);break;case 19:De(xe);break;case 10:an(t.type);break;case 22:case 23:mt(t),vo(),e!==null&&De(ga);break;case 24:an(je)}}function gi(e,t){try{var n=t.updateQueue,a=n!==null?n.lastEffect:null;if(a!==null){var l=a.next;n=l;do{if((n.tag&e)===e){a=void 0;var i=n.create,r=n.inst;a=i(),r.destroy=a}n=n.next}while(n!==l)}}catch(c){se(t,t.return,c)}}function Bn(e,t,n){try{var a=t.updateQueue,l=a!==null?a.lastEffect:null;if(l!==null){var i=l.next;a=i;do{if((a.tag&e)===e){var r=a.inst,c=r.destroy;if(c!==void 0){r.destroy=void 0,l=t;var o=n,u=c;try{u()}catch(f){se(l,o,f)}}}a=a.next}while(a!==i)}}catch(f){se(t,t.return,f)}}function $m(e){var t=e.updateQueue;if(t!==null){var n=e.stateNode;try{Df(t,n)}catch(a){se(e,e.return,a)}}}function Gm(e,t,n){n.props=Sa(e.type,e.memoizedProps),n.state=e.memoizedState;try{n.componentWillUnmount()}catch(a){se(e,t,a)}}function yi(e,t){try{var n=e.ref;if(n!==null){switch(e.tag){case 26:case 27:case 5:var a=e.stateNode;break;case 30:a=e.stateNode;break;default:a=e.stateNode}typeof n=="function"?e.refCleanup=n(a):n.current=a}}catch(l){se(e,t,l)}}function qt(e,t){var n=e.ref,a=e.refCleanup;if(n!==null)if(typeof a=="function")try{a()}catch(l){se(e,t,l)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof n=="function")try{n(null)}catch(l){se(e,t,l)}else n.current=null}function qm(e){var t=e.type,n=e.memoizedProps,a=e.stateNode;try{e:switch(t){case"button":case"input":case"select":case"textarea":n.autoFocus&&a.focus();break e;case"img":n.src?a.src=n.src:n.srcSet&&(a.srcset=n.srcSet)}}catch(l){se(e,e.return,l)}}function Jo(e,t,n){try{var a=e.stateNode;Jb(a,e.type,n,t),a[Je]=t}catch(l){se(e,e.return,l)}}function Vm(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&Qn(e.type)||e.tag===4}function Po(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||Vm(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&Qn(e.type)||e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Wo(e,t,n){var a=e.tag;if(a===5||a===6)e=e.stateNode,t?(n.nodeType===9?n.body:n.nodeName==="HTML"?n.ownerDocument.body:n).insertBefore(e,t):(t=n.nodeType===9?n.body:n.nodeName==="HTML"?n.ownerDocument.body:n,t.appendChild(e),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=Wt));else if(a!==4&&(a===27&&Qn(e.type)&&(n=e.stateNode,t=null),e=e.child,e!==null))for(Wo(e,t,n),e=e.sibling;e!==null;)Wo(e,t,n),e=e.sibling}function Qr(e,t,n){var a=e.tag;if(a===5||a===6)e=e.stateNode,t?n.insertBefore(e,t):n.appendChild(e);else if(a!==4&&(a===27&&Qn(e.type)&&(n=e.stateNode),e=e.child,e!==null))for(Qr(e,t,n),e=e.sibling;e!==null;)Qr(e,t,n),e=e.sibling}function Xm(e){var t=e.stateNode,n=e.memoizedProps;try{for(var a=e.type,l=t.attributes;l.length;)t.removeAttributeNode(l[0]);Be(t,a,n),t[Ue]=e,t[Je]=n}catch(i){se(e,e.return,i)}}var on=!1,Ae=!1,Io=!1,Qm=typeof WeakSet=="function"?WeakSet:Set,Me=null;function Cb(e,t){if(e=e.containerInfo,xu=fs,e=af(e),Xc(e)){if("selectionStart"in e)var n={start:e.selectionStart,end:e.selectionEnd};else e:{n=(n=e.ownerDocument)&&n.defaultView||window;var a=n.getSelection&&n.getSelection();if(a&&a.rangeCount!==0){n=a.anchorNode;var l=a.anchorOffset,i=a.focusNode;a=a.focusOffset;try{n.nodeType,i.nodeType}catch{n=null;break e}var r=0,c=-1,o=-1,u=0,f=0,p=e,d=null;t:for(;;){for(var m;p!==n||l!==0&&p.nodeType!==3||(c=r+l),p!==i||a!==0&&p.nodeType!==3||(o=r+a),p.nodeType===3&&(r+=p.nodeValue.length),(m=p.firstChild)!==null;)d=p,p=m;for(;;){if(p===e)break t;if(d===n&&++u===l&&(c=r),d===i&&++f===a&&(o=r),(m=p.nextSibling)!==null)break;p=d,d=p.parentNode}p=m}n=c===-1||o===-1?null:{start:c,end:o}}else n=null}n=n||{start:0,end:0}}else n=null;for(Su={focusedElem:e,selectionRange:n},fs=!1,Me=t;Me!==null;)if(t=Me,e=t.child,(t.subtreeFlags&1028)!==0&&e!==null)e.return=t,Me=e;else for(;Me!==null;){switch(t=Me,i=t.alternate,e=t.flags,t.tag){case 0:if(e&4&&(e=t.updateQueue,e=e!==null?e.events:null,e!==null))for(n=0;n<e.length;n++)l=e[n],l.ref.impl=l.nextImpl;break;case 11:case 15:break;case 1:if(e&1024&&i!==null){e=void 0,n=t,l=i.memoizedProps,i=i.memoizedState,a=n.stateNode;try{var v=Sa(n.type,l);e=a.getSnapshotBeforeUpdate(v,i),a.__reactInternalSnapshotBeforeUpdate=e}catch(S){se(n,n.return,S)}}break;case 3:if(e&1024){if(e=t.stateNode.containerInfo,n=e.nodeType,n===9)ju(e);else if(n===1)switch(e.nodeName){case"HEAD":case"HTML":case"BODY":ju(e);break;default:e.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;default:if(e&1024)throw Error(A(163))}if(e=t.sibling,e!==null){e.return=t.return,Me=e;break}Me=t.return}}function Zm(e,t,n){var a=n.flags;switch(n.tag){case 0:case 11:case 15:dn(e,n),a&4&&gi(5,n);break;case 1:if(dn(e,n),a&4)if(e=n.stateNode,t===null)try{e.componentDidMount()}catch(r){se(n,n.return,r)}else{var l=Sa(n.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(l,t,e.__reactInternalSnapshotBeforeUpdate)}catch(r){se(n,n.return,r)}}a&64&&$m(n),a&512&&yi(n,n.return);break;case 3:if(dn(e,n),a&64&&(e=n.updateQueue,e!==null)){if(t=null,n.child!==null)switch(n.child.tag){case 27:case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}try{Df(e,t)}catch(r){se(n,n.return,r)}}break;case 27:t===null&&a&4&&Xm(n);case 26:case 5:dn(e,n),t===null&&a&4&&qm(n),a&512&&yi(n,n.return);break;case 12:dn(e,n);break;case 31:dn(e,n),a&4&&Jm(e,n);break;case 13:dn(e,n),a&4&&Pm(e,n),a&64&&(e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(n=Hb.bind(null,n),lx(e,n))));break;case 22:if(a=n.memoizedState!==null||on,!a){t=t!==null&&t.memoizedState!==null||Ae,l=on;var i=Ae;on=a,(Ae=t)&&!i?pn(e,n,(n.subtreeFlags&8772)!==0):dn(e,n),on=l,Ae=i}break;case 30:break;default:dn(e,n)}}function Km(e){var t=e.alternate;t!==null&&(e.alternate=null,Km(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&Tc(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var ye=null,We=!1;function un(e,t,n){for(n=n.child;n!==null;)Fm(e,t,n),n=n.sibling}function Fm(e,t,n){if(ot&&typeof ot.onCommitFiberUnmount=="function")try{ot.onCommitFiberUnmount($l,n)}catch{}switch(n.tag){case 26:Ae||qt(n,t),un(e,t,n),n.memoizedState?n.memoizedState.count--:n.stateNode&&(n=n.stateNode,n.parentNode.removeChild(n));break;case 27:Ae||qt(n,t);var a=ye,l=We;Qn(n.type)&&(ye=n.stateNode,We=!1),un(e,t,n),Ei(n.stateNode),ye=a,We=l;break;case 5:Ae||qt(n,t);case 6:if(a=ye,l=We,ye=null,un(e,t,n),ye=a,We=l,ye!==null)if(We)try{(ye.nodeType===9?ye.body:ye.nodeName==="HTML"?ye.ownerDocument.body:ye).removeChild(n.stateNode)}catch(i){se(n,t,i)}else try{ye.removeChild(n.stateNode)}catch(i){se(n,t,i)}break;case 18:ye!==null&&(We?(e=ye,$h(e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,n.stateNode),bl(e)):$h(ye,n.stateNode));break;case 4:a=ye,l=We,ye=n.stateNode.containerInfo,We=!0,un(e,t,n),ye=a,We=l;break;case 0:case 11:case 14:case 15:Bn(2,n,t),Ae||Bn(4,n,t),un(e,t,n);break;case 1:Ae||(qt(n,t),a=n.stateNode,typeof a.componentWillUnmount=="function"&&Gm(n,t,a)),un(e,t,n);break;case 21:un(e,t,n);break;case 22:Ae=(a=Ae)||n.memoizedState!==null,un(e,t,n),Ae=a;break;default:un(e,t,n)}}function Jm(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{bl(e)}catch(n){se(t,t.return,n)}}}function Pm(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{bl(e)}catch(n){se(t,t.return,n)}}function Ob(e){switch(e.tag){case 31:case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new Qm),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new Qm),t;default:throw Error(A(435,e.tag))}}function Zr(e,t){var n=Ob(e);t.forEach(function(a){if(!n.has(a)){n.add(a);var l=Bb.bind(null,e,a);a.then(l,l)}})}function Ie(e,t){var n=t.deletions;if(n!==null)for(var a=0;a<n.length;a++){var l=n[a],i=e,r=t,c=r;e:for(;c!==null;){switch(c.tag){case 27:if(Qn(c.type)){ye=c.stateNode,We=!1;break e}break;case 5:ye=c.stateNode,We=!1;break e;case 3:case 4:ye=c.stateNode.containerInfo,We=!0;break e}c=c.return}if(ye===null)throw Error(A(160));Fm(i,r,l),ye=null,We=!1,i=l.alternate,i!==null&&(i.return=null),l.return=null}if(t.subtreeFlags&13886)for(t=t.child;t!==null;)Wm(t,e),t=t.sibling}var Mt=null;function Wm(e,t){var n=e.alternate,a=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:Ie(t,e),et(e),a&4&&(Bn(3,e,e.return),gi(3,e),Bn(5,e,e.return));break;case 1:Ie(t,e),et(e),a&512&&(Ae||n===null||qt(n,n.return)),a&64&&on&&(e=e.updateQueue,e!==null&&(a=e.callbacks,a!==null&&(n=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=n===null?a:n.concat(a))));break;case 26:var l=Mt;if(Ie(t,e),et(e),a&512&&(Ae||n===null||qt(n,n.return)),a&4){var i=n!==null?n.memoizedState:null;if(a=e.memoizedState,n===null)if(a===null)if(e.stateNode===null){e:{a=e.type,n=e.memoizedProps,l=l.ownerDocument||l;t:switch(a){case"title":i=l.getElementsByTagName("title")[0],(!i||i[Vl]||i[Ue]||i.namespaceURI==="http://www.w3.org/2000/svg"||i.hasAttribute("itemprop"))&&(i=l.createElement(a),l.head.insertBefore(i,l.querySelector("head > title"))),Be(i,a,n),i[Ue]=e,ze(i),a=i;break e;case"link":var r=Wh("link","href",l).get(a+(n.href||""));if(r){for(var c=0;c<r.length;c++)if(i=r[c],i.getAttribute("href")===(n.href==null||n.href===""?null:n.href)&&i.getAttribute("rel")===(n.rel==null?null:n.rel)&&i.getAttribute("title")===(n.title==null?null:n.title)&&i.getAttribute("crossorigin")===(n.crossOrigin==null?null:n.crossOrigin)){r.splice(c,1);break t}}i=l.createElement(a),Be(i,a,n),l.head.appendChild(i);break;case"meta":if(r=Wh("meta","content",l).get(a+(n.content||""))){for(c=0;c<r.length;c++)if(i=r[c],i.getAttribute("content")===(n.content==null?null:""+n.content)&&i.getAttribute("name")===(n.name==null?null:n.name)&&i.getAttribute("property")===(n.property==null?null:n.property)&&i.getAttribute("http-equiv")===(n.httpEquiv==null?null:n.httpEquiv)&&i.getAttribute("charset")===(n.charSet==null?null:n.charSet)){r.splice(c,1);break t}}i=l.createElement(a),Be(i,a,n),l.head.appendChild(i);break;default:throw Error(A(468,a))}i[Ue]=e,ze(i),a=i}e.stateNode=a}else Ih(l,e.type,e.stateNode);else e.stateNode=Ph(l,a,e.memoizedProps);else i!==a?(i===null?n.stateNode!==null&&(n=n.stateNode,n.parentNode.removeChild(n)):i.count--,a===null?Ih(l,e.type,e.stateNode):Ph(l,a,e.memoizedProps)):a===null&&e.stateNode!==null&&Jo(e,e.memoizedProps,n.memoizedProps)}break;case 27:Ie(t,e),et(e),a&512&&(Ae||n===null||qt(n,n.return)),n!==null&&a&4&&Jo(e,e.memoizedProps,n.memoizedProps);break;case 5:if(Ie(t,e),et(e),a&512&&(Ae||n===null||qt(n,n.return)),e.flags&32){l=e.stateNode;try{Ga(l,"")}catch(v){se(e,e.return,v)}}a&4&&e.stateNode!=null&&(l=e.memoizedProps,Jo(e,l,n!==null?n.memoizedProps:l)),a&1024&&(Io=!0);break;case 6:if(Ie(t,e),et(e),a&4){if(e.stateNode===null)throw Error(A(162));a=e.memoizedProps,n=e.stateNode;try{n.nodeValue=a}catch(v){se(e,e.return,v)}}break;case 3:if(os=null,l=Mt,Mt=ss(t.containerInfo),Ie(t,e),Mt=l,et(e),a&4&&n!==null&&n.memoizedState.isDehydrated)try{bl(t.containerInfo)}catch(v){se(e,e.return,v)}Io&&(Io=!1,Im(e));break;case 4:a=Mt,Mt=ss(e.stateNode.containerInfo),Ie(t,e),et(e),Mt=a;break;case 12:Ie(t,e),et(e);break;case 31:Ie(t,e),et(e),a&4&&(a=e.updateQueue,a!==null&&(e.updateQueue=null,Zr(e,a)));break;case 13:Ie(t,e),et(e),e.child.flags&8192&&e.memoizedState!==null!=(n!==null&&n.memoizedState!==null)&&(Fr=ct()),a&4&&(a=e.updateQueue,a!==null&&(e.updateQueue=null,Zr(e,a)));break;case 22:l=e.memoizedState!==null;var o=n!==null&&n.memoizedState!==null,u=on,f=Ae;if(on=u||l,Ae=f||o,Ie(t,e),Ae=f,on=u,et(e),a&8192)e:for(t=e.stateNode,t._visibility=l?t._visibility&-2:t._visibility|1,l&&(n===null||o||on||Ae||_a(e)),n=null,t=e;;){if(t.tag===5||t.tag===26){if(n===null){o=n=t;try{if(i=o.stateNode,l)r=i.style,typeof r.setProperty=="function"?r.setProperty("display","none","important"):r.display="none";else{c=o.stateNode;var p=o.memoizedProps.style,d=p!=null&&p.hasOwnProperty("display")?p.display:null;c.style.display=d==null||typeof d=="boolean"?"":(""+d).trim()}}catch(v){se(o,o.return,v)}}}else if(t.tag===6){if(n===null){o=t;try{o.stateNode.nodeValue=l?"":o.memoizedProps}catch(v){se(o,o.return,v)}}}else if(t.tag===18){if(n===null){o=t;try{var m=o.stateNode;l?Gh(m,!0):Gh(o.stateNode,!1)}catch(v){se(o,o.return,v)}}}else if((t.tag!==22&&t.tag!==23||t.memoizedState===null||t===e)&&t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break e;for(;t.sibling===null;){if(t.return===null||t.return===e)break e;n===t&&(n=null),t=t.return}n===t&&(n=null),t.sibling.return=t.return,t=t.sibling}a&4&&(a=e.updateQueue,a!==null&&(n=a.retryQueue,n!==null&&(a.retryQueue=null,Zr(e,n))));break;case 19:Ie(t,e),et(e),a&4&&(a=e.updateQueue,a!==null&&(e.updateQueue=null,Zr(e,a)));break;case 30:break;case 21:break;default:Ie(t,e),et(e)}}function et(e){var t=e.flags;if(t&2){try{for(var n,a=e.return;a!==null;){if(Vm(a)){n=a;break}a=a.return}if(n==null)throw Error(A(160));switch(n.tag){case 27:var l=n.stateNode,i=Po(e);Qr(e,i,l);break;case 5:var r=n.stateNode;n.flags&32&&(Ga(r,""),n.flags&=-33);var c=Po(e);Qr(e,c,r);break;case 3:case 4:var o=n.stateNode.containerInfo,u=Po(e);Wo(e,u,o);break;default:throw Error(A(161))}}catch(f){se(e,e.return,f)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Im(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;Im(t),t.tag===5&&t.flags&1024&&t.stateNode.reset(),e=e.sibling}}function dn(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)Zm(e,t.alternate,t),t=t.sibling}function _a(e){for(e=e.child;e!==null;){var t=e;switch(t.tag){case 0:case 11:case 14:case 15:Bn(4,t,t.return),_a(t);break;case 1:qt(t,t.return);var n=t.stateNode;typeof n.componentWillUnmount=="function"&&Gm(t,t.return,n),_a(t);break;case 27:Ei(t.stateNode);case 26:case 5:qt(t,t.return),_a(t);break;case 22:t.memoizedState===null&&_a(t);break;case 30:_a(t);break;default:_a(t)}e=e.sibling}}function pn(e,t,n){for(n=n&&(t.subtreeFlags&8772)!==0,t=t.child;t!==null;){var a=t.alternate,l=e,i=t,r=i.flags;switch(i.tag){case 0:case 11:case 15:pn(l,i,n),gi(4,i);break;case 1:if(pn(l,i,n),a=i,l=a.stateNode,typeof l.componentDidMount=="function")try{l.componentDidMount()}catch(u){se(a,a.return,u)}if(a=i,l=a.updateQueue,l!==null){var c=a.stateNode;try{var o=l.shared.hiddenCallbacks;if(o!==null)for(l.shared.hiddenCallbacks=null,l=0;l<o.length;l++)Of(o[l],c)}catch(u){se(a,a.return,u)}}n&&r&64&&$m(i),yi(i,i.return);break;case 27:Xm(i);case 26:case 5:pn(l,i,n),n&&a===null&&r&4&&qm(i),yi(i,i.return);break;case 12:pn(l,i,n);break;case 31:pn(l,i,n),n&&r&4&&Jm(l,i);break;case 13:pn(l,i,n),n&&r&4&&Pm(l,i);break;case 22:i.memoizedState===null&&pn(l,i,n),yi(i,i.return);break;case 30:break;default:pn(l,i,n)}t=t.sibling}}function eu(e,t){var n=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==n&&(e!=null&&e.refCount++,n!=null&&ai(n))}function tu(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&ai(e))}function Rt(e,t,n,a){if(t.subtreeFlags&10256)for(t=t.child;t!==null;)eh(e,t,n,a),t=t.sibling}function eh(e,t,n,a){var l=t.flags;switch(t.tag){case 0:case 11:case 15:Rt(e,t,n,a),l&2048&&gi(9,t);break;case 1:Rt(e,t,n,a);break;case 3:Rt(e,t,n,a),l&2048&&(e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&ai(e)));break;case 12:if(l&2048){Rt(e,t,n,a),e=t.stateNode;try{var i=t.memoizedProps,r=i.id,c=i.onPostCommit;typeof c=="function"&&c(r,t.alternate===null?"mount":"update",e.passiveEffectDuration,-0)}catch(o){se(t,t.return,o)}}else Rt(e,t,n,a);break;case 31:Rt(e,t,n,a);break;case 13:Rt(e,t,n,a);break;case 23:break;case 22:i=t.stateNode,r=t.alternate,t.memoizedState!==null?i._visibility&2?Rt(e,t,n,a):vi(e,t):i._visibility&2?Rt(e,t,n,a):(i._visibility|=2,cl(e,t,n,a,(t.subtreeFlags&10256)!==0||!1)),l&2048&&eu(r,t);break;case 24:Rt(e,t,n,a),l&2048&&tu(t.alternate,t);break;default:Rt(e,t,n,a)}}function cl(e,t,n,a,l){for(l=l&&((t.subtreeFlags&10256)!==0||!1),t=t.child;t!==null;){var i=e,r=t,c=n,o=a,u=r.flags;switch(r.tag){case 0:case 11:case 15:cl(i,r,c,o,l),gi(8,r);break;case 23:break;case 22:var f=r.stateNode;r.memoizedState!==null?f._visibility&2?cl(i,r,c,o,l):vi(i,r):(f._visibility|=2,cl(i,r,c,o,l)),l&&u&2048&&eu(r.alternate,r);break;case 24:cl(i,r,c,o,l),l&&u&2048&&tu(r.alternate,r);break;default:cl(i,r,c,o,l)}t=t.sibling}}function vi(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var n=e,a=t,l=a.flags;switch(a.tag){case 22:vi(n,a),l&2048&&eu(a.alternate,a);break;case 24:vi(n,a),l&2048&&tu(a.alternate,a);break;default:vi(n,a)}t=t.sibling}}var bi=8192;function ol(e,t,n){if(e.subtreeFlags&bi)for(e=e.child;e!==null;)th(e,t,n),e=e.sibling}function th(e,t,n){switch(e.tag){case 26:ol(e,t,n),e.flags&bi&&e.memoizedState!==null&&gx(n,Mt,e.memoizedState,e.memoizedProps);break;case 5:ol(e,t,n);break;case 3:case 4:var a=Mt;Mt=ss(e.stateNode.containerInfo),ol(e,t,n),Mt=a;break;case 22:e.memoizedState===null&&(a=e.alternate,a!==null&&a.memoizedState!==null?(a=bi,bi=16777216,ol(e,t,n),bi=a):ol(e,t,n));break;default:ol(e,t,n)}}function nh(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function xi(e){var t=e.deletions;if(e.flags&16){if(t!==null)for(var n=0;n<t.length;n++){var a=t[n];Me=a,lh(a,e)}nh(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)ah(e),e=e.sibling}function ah(e){switch(e.tag){case 0:case 11:case 15:xi(e),e.flags&2048&&Bn(9,e,e.return);break;case 3:xi(e);break;case 12:xi(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,Kr(e)):xi(e);break;default:xi(e)}}function Kr(e){var t=e.deletions;if(e.flags&16){if(t!==null)for(var n=0;n<t.length;n++){var a=t[n];Me=a,lh(a,e)}nh(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:Bn(8,t,t.return),Kr(t);break;case 22:n=t.stateNode,n._visibility&2&&(n._visibility&=-3,Kr(t));break;default:Kr(t)}e=e.sibling}}function lh(e,t){for(;Me!==null;){var n=Me;switch(n.tag){case 0:case 11:case 15:Bn(8,n,t);break;case 23:case 22:if(n.memoizedState!==null&&n.memoizedState.cachePool!==null){var a=n.memoizedState.cachePool.pool;a!=null&&a.refCount++}break;case 24:ai(n.memoizedState.cache)}if(a=n.child,a!==null)a.return=n,Me=a;else e:for(n=e;Me!==null;){a=Me;var l=a.sibling,i=a.return;if(Km(a),a===n){Me=null;break e}if(l!==null){l.return=i,Me=l;break e}Me=i}}}var Db={getCacheForType:function(e){var t=Le(je),n=t.data.get(e);return n===void 0&&(n=e(),t.data.set(e,n)),n},cacheSignal:function(){return Le(je).controller.signal}},zb=typeof WeakMap=="function"?WeakMap:Map,ie=0,de=null,J=null,W=0,re=0,ht=null,Yn=!1,ul=!1,nu=!1,fn=0,be=0,$n=0,Na=0,au=0,gt=0,dl=0,Si=null,tt=null,lu=!1,Fr=0,ih=0,Jr=1/0,Pr=null,Gn=null,Oe=0,qn=null,pl=null,mn=0,iu=0,ru=null,rh=null,_i=0,su=null;function yt(){return ie&2&&W!==0?W&-W:V.T!==null?fu():Sp()}function sh(){if(gt===0)if(!(W&536870912)||I){var e=ir;ir<<=1,!(ir&3932160)&&(ir=262144),gt=e}else gt=536870912;return e=ft.current,e!==null&&(e.flags|=32),gt}function nt(e,t,n){(e===de&&(re===2||re===9)||e.cancelPendingCommit!==null)&&(fl(e,0),Vn(e,W,gt,!1)),ql(e,n),(!(ie&2)||e!==de)&&(e===de&&(!(ie&2)&&(Na|=n),be===4&&Vn(e,W,gt,!1)),Vt(e))}function ch(e,t,n){if(ie&6)throw Error(A(327));var a=!n&&(t&127)===0&&(t&e.expiredLanes)===0||Gl(e,t),l=a?Ub(e,t):ou(e,t,!0),i=a;do{if(l===0){ul&&!a&&Vn(e,t,0,!1);break}else{if(n=e.current.alternate,i&&!Mb(n)){l=ou(e,t,!1),i=!1;continue}if(l===2){if(i=t,e.errorRecoveryDisabledLanes&i)var r=0;else r=e.pendingLanes&-536870913,r=r!==0?r:r&536870912?536870912:0;if(r!==0){t=r;e:{var c=e;l=Si;var o=c.current.memoizedState.isDehydrated;if(o&&(fl(c,r).flags|=256),r=ou(c,r,!1),r!==2){if(nu&&!o){c.errorRecoveryDisabledLanes|=i,Na|=i,l=4;break e}i=tt,tt=l,i!==null&&(tt===null?tt=i:tt.push.apply(tt,i))}l=r}if(i=!1,l!==2)continue}}if(l===1){fl(e,0),Vn(e,t,0,!0);break}e:{switch(a=e,i=l,i){case 0:case 1:throw Error(A(345));case 4:if((t&4194048)!==t)break;case 6:Vn(a,t,gt,!Yn);break e;case 2:tt=null;break;case 3:case 5:break;default:throw Error(A(329))}if((t&62914560)===t&&(l=Fr+300-ct(),10<l)){if(Vn(a,t,gt,!Yn),sr(a,0,!0)!==0)break e;mn=t,a.timeoutHandle=Bh(oh.bind(null,a,n,tt,Pr,lu,t,gt,Na,dl,Yn,i,"Throttled",-0,0),l);break e}oh(a,n,tt,Pr,lu,t,gt,Na,dl,Yn,i,null,-0,0)}}break}while(1);Vt(e)}function oh(e,t,n,a,l,i,r,c,o,u,f,p,d,m){if(e.timeoutHandle=-1,p=t.subtreeFlags,p&8192||(p&16785408)===16785408){p={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:Wt},th(t,i,p);var v=(i&62914560)===i?Fr-ct():(i&4194048)===i?ih-ct():0;if(v=yx(p,v),v!==null){mn=i,e.cancelPendingCommit=v(yh.bind(null,e,t,i,n,a,l,r,c,o,f,p,null,d,m)),Vn(e,i,r,!u);return}}yh(e,t,i,n,a,l,r,c,o)}function Mb(e){for(var t=e;;){var n=t.tag;if((n===0||n===11||n===15)&&t.flags&16384&&(n=t.updateQueue,n!==null&&(n=n.stores,n!==null)))for(var a=0;a<n.length;a++){var l=n[a],i=l.getSnapshot;l=l.value;try{if(!dt(i(),l))return!1}catch{return!1}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function Vn(e,t,n,a){t&=~au,t&=~Na,e.suspendedLanes|=t,e.pingedLanes&=~t,a&&(e.warmLanes|=t),a=e.expirationTimes;for(var l=t;0<l;){var i=31-ut(l),r=1<<i;a[i]=-1,l&=~r}n!==0&&vp(e,n,t)}function Wr(){return ie&6?!0:(Ni(0,!1),!1)}function cu(){if(J!==null){if(re===0)var e=J.return;else e=J,nn=ma=null,jo(e),al=null,ii=0,e=J;for(;e!==null;)Ym(e.alternate,e),e=e.return;J=null}}function fl(e,t){var n=e.timeoutHandle;n!==-1&&(e.timeoutHandle=-1,Ib(n)),n=e.cancelPendingCommit,n!==null&&(e.cancelPendingCommit=null,n()),mn=0,cu(),de=e,J=n=en(e.current,null),W=t,re=0,ht=null,Yn=!1,ul=Gl(e,t),nu=!1,dl=gt=au=Na=$n=be=0,tt=Si=null,lu=!1,t&8&&(t|=t&32);var a=e.entangledLanes;if(a!==0)for(e=e.entanglements,a&=t;0<a;){var l=31-ut(a),i=1<<l;t|=e[l],a&=~i}return fn=t,br(),n}function uh(e,t){K=null,V.H=fi,t===nl||t===Ar?(t=Ef(),re=3):t===po?(t=Ef(),re=4):re=t===Yo?8:t!==null&&typeof t=="object"&&typeof t.then=="function"?6:1,ht=t,J===null&&(be=1,$r(e,jt(t,e.current)))}function dh(){var e=ft.current;return e===null?!0:(W&4194048)===W?Tt===null:(W&62914560)===W||W&536870912?e===Tt:!1}function ph(){var e=V.H;return V.H=fi,e===null?fi:e}function fh(){var e=V.A;return V.A=Db,e}function Ir(){be=4,Yn||(W&4194048)!==W&&ft.current!==null||(ul=!0),!($n&134217727)&&!(Na&134217727)||de===null||Vn(de,W,gt,!1)}function ou(e,t,n){var a=ie;ie|=2;var l=ph(),i=fh();(de!==e||W!==t)&&(Pr=null,fl(e,t)),t=!1;var r=be;e:do try{if(re!==0&&J!==null){var c=J,o=ht;switch(re){case 8:cu(),r=6;break e;case 3:case 2:case 9:case 6:ft.current===null&&(t=!0);var u=re;if(re=0,ht=null,ml(e,c,o,u),n&&ul){r=0;break e}break;default:u=re,re=0,ht=null,ml(e,c,o,u)}}Rb(),r=be;break}catch(f){uh(e,f)}while(1);return t&&e.shellSuspendCounter++,nn=ma=null,ie=a,V.H=l,V.A=i,J===null&&(de=null,W=0,br()),r}function Rb(){for(;J!==null;)mh(J)}function Ub(e,t){var n=ie;ie|=2;var a=ph(),l=fh();de!==e||W!==t?(Pr=null,Jr=ct()+500,fl(e,t)):ul=Gl(e,t);e:do try{if(re!==0&&J!==null){t=J;var i=ht;t:switch(re){case 1:re=0,ht=null,ml(e,t,i,1);break;case 2:case 9:if(jf(i)){re=0,ht=null,hh(t);break}t=function(){re!==2&&re!==9||de!==e||(re=7),Vt(e)},i.then(t,t);break e;case 3:re=7;break e;case 4:re=5;break e;case 7:jf(i)?(re=0,ht=null,hh(t)):(re=0,ht=null,ml(e,t,i,7));break;case 5:var r=null;switch(J.tag){case 26:r=J.memoizedState;case 5:case 27:var c=J;if(r?eg(r):c.stateNode.complete){re=0,ht=null;var o=c.sibling;if(o!==null)J=o;else{var u=c.return;u!==null?(J=u,es(u)):J=null}break t}}re=0,ht=null,ml(e,t,i,5);break;case 6:re=0,ht=null,ml(e,t,i,6);break;case 8:cu(),be=6;break e;default:throw Error(A(462))}}kb();break}catch(f){uh(e,f)}while(1);return nn=ma=null,V.H=a,V.A=l,ie=n,J!==null?0:(de=null,W=0,br(),be)}function kb(){for(;J!==null&&!iv();)mh(J)}function mh(e){var t=Hm(e.alternate,e,fn);e.memoizedProps=e.pendingProps,t===null?es(e):J=t}function hh(e){var t=e,n=t.alternate;switch(t.tag){case 15:case 0:t=zm(n,t,t.pendingProps,t.type,void 0,W);break;case 11:t=zm(n,t,t.pendingProps,t.type.render,t.ref,W);break;case 5:jo(t);default:Ym(n,t),t=J=ff(t,fn),t=Hm(n,t,fn)}e.memoizedProps=e.pendingProps,t===null?es(e):J=t}function ml(e,t,n,a){nn=ma=null,jo(t),al=null,ii=0;var l=t.return;try{if(jb(e,l,t,n,W)){be=1,$r(e,jt(n,e.current)),J=null;return}}catch(i){if(l!==null)throw J=l,i;be=1,$r(e,jt(n,e.current)),J=null;return}t.flags&32768?(I||a===1?e=!0:ul||W&536870912?e=!1:(Yn=e=!0,(a===2||a===9||a===3||a===6)&&(a=ft.current,a!==null&&a.tag===13&&(a.flags|=16384))),gh(t,e)):es(t)}function es(e){var t=e;do{if(t.flags&32768){gh(t,Yn);return}e=t.return;var n=Ab(t.alternate,t,fn);if(n!==null){J=n;return}if(t=t.sibling,t!==null){J=t;return}J=t=e}while(t!==null);be===0&&(be=5)}function gh(e,t){do{var n=Tb(e.alternate,e);if(n!==null){n.flags&=32767,J=n;return}if(n=e.return,n!==null&&(n.flags|=32768,n.subtreeFlags=0,n.deletions=null),!t&&(e=e.sibling,e!==null)){J=e;return}J=e=n}while(e!==null);be=6,J=null}function yh(e,t,n,a,l,i,r,c,o){e.cancelPendingCommit=null;do ts();while(Oe!==0);if(ie&6)throw Error(A(327));if(t!==null){if(t===e.current)throw Error(A(177));if(i=t.lanes|t.childLanes,i|=Jc,hv(e,n,i,r,c,o),e===de&&(J=de=null,W=0),pl=t,qn=e,mn=n,iu=i,ru=l,rh=a,t.subtreeFlags&10256||t.flags&10256?(e.callbackNode=null,e.callbackPriority=0,Yb(ar,function(){return _h(),null})):(e.callbackNode=null,e.callbackPriority=0),a=(t.flags&13878)!==0,t.subtreeFlags&13878||a){a=V.T,V.T=null,l=le.p,le.p=2,r=ie,ie|=4;try{Cb(e,t,n)}finally{ie=r,le.p=l,V.T=a}}Oe=1,vh(),bh(),xh()}}function vh(){if(Oe===1){Oe=0;var e=qn,t=pl,n=(t.flags&13878)!==0;if(t.subtreeFlags&13878||n){n=V.T,V.T=null;var a=le.p;le.p=2;var l=ie;ie|=4;try{Wm(t,e);var i=Su,r=af(e.containerInfo),c=i.focusedElem,o=i.selectionRange;if(r!==c&&c&&c.ownerDocument&&nf(c.ownerDocument.documentElement,c)){if(o!==null&&Xc(c)){var u=o.start,f=o.end;if(f===void 0&&(f=u),"selectionStart"in c)c.selectionStart=u,c.selectionEnd=Math.min(f,c.value.length);else{var p=c.ownerDocument||document,d=p&&p.defaultView||window;if(d.getSelection){var m=d.getSelection(),v=c.textContent.length,S=Math.min(o.start,v),j=o.end===void 0?S:Math.min(o.end,v);!m.extend&&S>j&&(r=j,j=S,S=r);var y=tf(c,S),g=tf(c,j);if(y&&g&&(m.rangeCount!==1||m.anchorNode!==y.node||m.anchorOffset!==y.offset||m.focusNode!==g.node||m.focusOffset!==g.offset)){var b=p.createRange();b.setStart(y.node,y.offset),m.removeAllRanges(),S>j?(m.addRange(b),m.extend(g.node,g.offset)):(b.setEnd(g.node,g.offset),m.addRange(b))}}}}for(p=[],m=c;m=m.parentNode;)m.nodeType===1&&p.push({element:m,left:m.scrollLeft,top:m.scrollTop});for(typeof c.focus=="function"&&c.focus(),c=0;c<p.length;c++){var _=p[c];_.element.scrollLeft=_.left,_.element.scrollTop=_.top}}fs=!!xu,Su=xu=null}finally{ie=l,le.p=a,V.T=n}}e.current=t,Oe=2}}function bh(){if(Oe===2){Oe=0;var e=qn,t=pl,n=(t.flags&8772)!==0;if(t.subtreeFlags&8772||n){n=V.T,V.T=null;var a=le.p;le.p=2;var l=ie;ie|=4;try{Zm(e,t.alternate,t)}finally{ie=l,le.p=a,V.T=n}}Oe=3}}function xh(){if(Oe===4||Oe===3){Oe=0,rv();var e=qn,t=pl,n=mn,a=rh;t.subtreeFlags&10256||t.flags&10256?Oe=5:(Oe=0,pl=qn=null,Sh(e,e.pendingLanes));var l=e.pendingLanes;if(l===0&&(Gn=null),Ec(n),t=t.stateNode,ot&&typeof ot.onCommitFiberRoot=="function")try{ot.onCommitFiberRoot($l,t,void 0,(t.current.flags&128)===128)}catch{}if(a!==null){t=V.T,l=le.p,le.p=2,V.T=null;try{for(var i=e.onRecoverableError,r=0;r<a.length;r++){var c=a[r];i(c.value,{componentStack:c.stack})}}finally{V.T=t,le.p=l}}mn&3&&ts(),Vt(e),l=e.pendingLanes,n&261930&&l&42?e===su?_i++:(_i=0,su=e):_i=0,Ni(0,!1)}}function Sh(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,ai(t)))}function ts(){return vh(),bh(),xh(),_h()}function _h(){if(Oe!==5)return!1;var e=qn,t=iu;iu=0;var n=Ec(mn),a=V.T,l=le.p;try{le.p=32>n?32:n,V.T=null,n=ru,ru=null;var i=qn,r=mn;if(Oe=0,pl=qn=null,mn=0,ie&6)throw Error(A(331));var c=ie;if(ie|=4,ah(i.current),eh(i,i.current,r,n),ie=c,Ni(0,!1),ot&&typeof ot.onPostCommitFiberRoot=="function")try{ot.onPostCommitFiberRoot($l,i)}catch{}return!0}finally{le.p=l,V.T=a,Sh(e,t)}}function Nh(e,t,n){t=jt(n,t),t=Bo(e.stateNode,t,2),e=kn(e,t,2),e!==null&&(ql(e,2),Vt(e))}function se(e,t,n){if(e.tag===3)Nh(e,e,n);else for(;t!==null;){if(t.tag===3){Nh(t,e,n);break}else if(t.tag===1){var a=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof a.componentDidCatch=="function"&&(Gn===null||!Gn.has(a))){e=jt(n,e),n=jm(2),a=kn(t,n,2),a!==null&&(wm(n,a,t,e),ql(a,2),Vt(a));break}}t=t.return}}function uu(e,t,n){var a=e.pingCache;if(a===null){a=e.pingCache=new zb;var l=new Set;a.set(t,l)}else l=a.get(t),l===void 0&&(l=new Set,a.set(t,l));l.has(n)||(nu=!0,l.add(n),e=Lb.bind(null,e,t,n),t.then(e,e))}function Lb(e,t,n){var a=e.pingCache;a!==null&&a.delete(t),e.pingedLanes|=e.suspendedLanes&n,e.warmLanes&=~n,de===e&&(W&n)===n&&(be===4||be===3&&(W&62914560)===W&&300>ct()-Fr?!(ie&2)&&fl(e,0):au|=n,dl===W&&(dl=0)),Vt(e)}function jh(e,t){t===0&&(t=yp()),e=da(e,t),e!==null&&(ql(e,t),Vt(e))}function Hb(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),jh(e,n)}function Bb(e,t){var n=0;switch(e.tag){case 31:case 13:var a=e.stateNode,l=e.memoizedState;l!==null&&(n=l.retryLane);break;case 19:a=e.stateNode;break;case 22:a=e.stateNode._retryCache;break;default:throw Error(A(314))}a!==null&&a.delete(t),jh(e,n)}function Yb(e,t){return _c(e,t)}var ns=null,hl=null,du=!1,as=!1,pu=!1,Xn=0;function Vt(e){e!==hl&&e.next===null&&(hl===null?ns=hl=e:hl=hl.next=e),as=!0,du||(du=!0,Gb())}function Ni(e,t){if(!pu&&as){pu=!0;do for(var n=!1,a=ns;a!==null;){if(!t)if(e!==0){var l=a.pendingLanes;if(l===0)var i=0;else{var r=a.suspendedLanes,c=a.pingedLanes;i=(1<<31-ut(42|e)+1)-1,i&=l&~(r&~c),i=i&201326741?i&201326741|1:i?i|2:0}i!==0&&(n=!0,Th(a,i))}else i=W,i=sr(a,a===de?i:0,a.cancelPendingCommit!==null||a.timeoutHandle!==-1),!(i&3)||Gl(a,i)||(n=!0,Th(a,i));a=a.next}while(n);pu=!1}}function $b(){wh()}function wh(){as=du=!1;var e=0;Xn!==0&&Wb()&&(e=Xn);for(var t=ct(),n=null,a=ns;a!==null;){var l=a.next,i=Eh(a,t);i===0?(a.next=null,n===null?ns=l:n.next=l,l===null&&(hl=n)):(n=a,(e!==0||i&3)&&(as=!0)),a=l}Oe!==0&&Oe!==5||Ni(e,!1),Xn!==0&&(Xn=0)}function Eh(e,t){for(var n=e.suspendedLanes,a=e.pingedLanes,l=e.expirationTimes,i=e.pendingLanes&-62914561;0<i;){var r=31-ut(i),c=1<<r,o=l[r];o===-1?(!(c&n)||c&a)&&(l[r]=mv(c,t)):o<=t&&(e.expiredLanes|=c),i&=~c}if(t=de,n=W,n=sr(e,e===t?n:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),a=e.callbackNode,n===0||e===t&&(re===2||re===9)||e.cancelPendingCommit!==null)return a!==null&&a!==null&&Nc(a),e.callbackNode=null,e.callbackPriority=0;if(!(n&3)||Gl(e,n)){if(t=n&-n,t===e.callbackPriority)return t;switch(a!==null&&Nc(a),Ec(n)){case 2:case 8:n=hp;break;case 32:n=ar;break;case 268435456:n=gp;break;default:n=ar}return a=Ah.bind(null,e),n=_c(n,a),e.callbackPriority=t,e.callbackNode=n,t}return a!==null&&a!==null&&Nc(a),e.callbackPriority=2,e.callbackNode=null,2}function Ah(e,t){if(Oe!==0&&Oe!==5)return e.callbackNode=null,e.callbackPriority=0,null;var n=e.callbackNode;if(ts()&&e.callbackNode!==n)return null;var a=W;return a=sr(e,e===de?a:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),a===0?null:(ch(e,a,t),Eh(e,ct()),e.callbackNode!=null&&e.callbackNode===n?Ah.bind(null,e):null)}function Th(e,t){if(ts())return null;ch(e,t,!0)}function Gb(){ex(function(){ie&6?_c(mp,$b):wh()})}function fu(){if(Xn===0){var e=el;e===0&&(e=lr,lr<<=1,!(lr&261888)&&(lr=256)),Xn=e}return Xn}function Ch(e){return e==null||typeof e=="symbol"||typeof e=="boolean"?null:typeof e=="function"?e:dr(""+e)}function Oh(e,t){var n=t.ownerDocument.createElement("input");return n.name=t.name,n.value=t.value,e.id&&n.setAttribute("form",e.id),t.parentNode.insertBefore(n,t),e=new FormData(e),n.parentNode.removeChild(n),e}function qb(e,t,n,a,l){if(t==="submit"&&n&&n.stateNode===l){var i=Ch((l[Je]||null).action),r=a.submitter;r&&(t=(t=r[Je]||null)?Ch(t.formAction):r.getAttribute("formAction"),t!==null&&(i=t,r=null));var c=new hr("action","action",null,a,l);e.push({event:c,listeners:[{instance:null,listener:function(){if(a.defaultPrevented){if(Xn!==0){var o=r?Oh(l,r):new FormData(l);Mo(n,{pending:!0,data:o,method:l.method,action:i},null,o)}}else typeof i=="function"&&(c.preventDefault(),o=r?Oh(l,r):new FormData(l),Mo(n,{pending:!0,data:o,method:l.method,action:i},i,o))},currentTarget:l}]})}}for(var mu=0;mu<Fc.length;mu++){var hu=Fc[mu],Vb=hu.toLowerCase(),Xb=hu[0].toUpperCase()+hu.slice(1);zt(Vb,"on"+Xb)}zt(sf,"onAnimationEnd"),zt(cf,"onAnimationIteration"),zt(of,"onAnimationStart"),zt("dblclick","onDoubleClick"),zt("focusin","onFocus"),zt("focusout","onBlur"),zt(sb,"onTransitionRun"),zt(cb,"onTransitionStart"),zt(ob,"onTransitionCancel"),zt(uf,"onTransitionEnd"),Ya("onMouseEnter",["mouseout","mouseover"]),Ya("onMouseLeave",["mouseout","mouseover"]),Ya("onPointerEnter",["pointerout","pointerover"]),Ya("onPointerLeave",["pointerout","pointerover"]),sa("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),sa("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),sa("onBeforeInput",["compositionend","keypress","textInput","paste"]),sa("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),sa("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),sa("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var ji="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Qb=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(ji));function Dh(e,t){t=(t&4)!==0;for(var n=0;n<e.length;n++){var a=e[n],l=a.event;a=a.listeners;e:{var i=void 0;if(t)for(var r=a.length-1;0<=r;r--){var c=a[r],o=c.instance,u=c.currentTarget;if(c=c.listener,o!==i&&l.isPropagationStopped())break e;i=c,l.currentTarget=u;try{i(l)}catch(f){vr(f)}l.currentTarget=null,i=o}else for(r=0;r<a.length;r++){if(c=a[r],o=c.instance,u=c.currentTarget,c=c.listener,o!==i&&l.isPropagationStopped())break e;i=c,l.currentTarget=u;try{i(l)}catch(f){vr(f)}l.currentTarget=null,i=o}}}}function P(e,t){var n=t[Ac];n===void 0&&(n=t[Ac]=new Set);var a=e+"__bubble";n.has(a)||(zh(t,e,2,!1),n.add(a))}function gu(e,t,n){var a=0;t&&(a|=4),zh(n,e,a,t)}var ls="_reactListening"+Math.random().toString(36).slice(2);function yu(e){if(!e[ls]){e[ls]=!0,jp.forEach(function(n){n!=="selectionchange"&&(Qb.has(n)||gu(n,!1,e),gu(n,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[ls]||(t[ls]=!0,gu("selectionchange",!1,t))}}function zh(e,t,n,a){switch(sg(t)){case 2:var l=xx;break;case 8:l=Sx;break;default:l=zu}n=l.bind(null,t,n,e),l=void 0,!kc||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(l=!0),a?l!==void 0?e.addEventListener(t,n,{capture:!0,passive:l}):e.addEventListener(t,n,!0):l!==void 0?e.addEventListener(t,n,{passive:l}):e.addEventListener(t,n,!1)}function vu(e,t,n,a,l){var i=a;if(!(t&1)&&!(t&2)&&a!==null)e:for(;;){if(a===null)return;var r=a.tag;if(r===3||r===4){var c=a.stateNode.containerInfo;if(c===l)break;if(r===4)for(r=a.return;r!==null;){var o=r.tag;if((o===3||o===4)&&r.stateNode.containerInfo===l)return;r=r.return}for(;c!==null;){if(r=La(c),r===null)return;if(o=r.tag,o===5||o===6||o===26||o===27){a=i=r;continue e}c=c.parentNode}}a=a.return}kp(function(){var u=i,f=Rc(n),p=[];e:{var d=df.get(e);if(d!==void 0){var m=hr,v=e;switch(e){case"keypress":if(fr(n)===0)break e;case"keydown":case"keyup":m=Bv;break;case"focusin":v="focus",m=Yc;break;case"focusout":v="blur",m=Yc;break;case"beforeblur":case"afterblur":m=Yc;break;case"click":if(n.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":m=Bp;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":m=Av;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":m=Gv;break;case sf:case cf:case of:m=Ov;break;case uf:m=Vv;break;case"scroll":case"scrollend":m=wv;break;case"wheel":m=Qv;break;case"copy":case"cut":case"paste":m=zv;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":m=$p;break;case"toggle":case"beforetoggle":m=Kv}var S=(t&4)!==0,j=!S&&(e==="scroll"||e==="scrollend"),y=S?d!==null?d+"Capture":null:d;S=[];for(var g=u,b;g!==null;){var _=g;if(b=_.stateNode,_=_.tag,_!==5&&_!==26&&_!==27||b===null||y===null||(_=Ql(g,y),_!=null&&S.push(wi(g,_,b))),j)break;g=g.return}0<S.length&&(d=new m(d,v,null,n,f),p.push({event:d,listeners:S}))}}if(!(t&7)){e:{if(d=e==="mouseover"||e==="pointerover",m=e==="mouseout"||e==="pointerout",d&&n!==Mc&&(v=n.relatedTarget||n.fromElement)&&(La(v)||v[ka]))break e;if((m||d)&&(d=f.window===f?f:(d=f.ownerDocument)?d.defaultView||d.parentWindow:window,m?(v=n.relatedTarget||n.toElement,m=u,v=v?La(v):null,v!==null&&(j=kl(v),S=v.tag,v!==j||S!==5&&S!==27&&S!==6)&&(v=null)):(m=null,v=u),m!==v)){if(S=Bp,_="onMouseLeave",y="onMouseEnter",g="mouse",(e==="pointerout"||e==="pointerover")&&(S=$p,_="onPointerLeave",y="onPointerEnter",g="pointer"),j=m==null?d:Xl(m),b=v==null?d:Xl(v),d=new S(_,g+"leave",m,n,f),d.target=j,d.relatedTarget=b,_=null,La(f)===u&&(S=new S(y,g+"enter",v,n,f),S.target=b,S.relatedTarget=j,_=S),j=_,m&&v)t:{for(S=Zb,y=m,g=v,b=0,_=y;_;_=S(_))b++;_=0;for(var T=g;T;T=S(T))_++;for(;0<b-_;)y=S(y),b--;for(;0<_-b;)g=S(g),_--;for(;b--;){if(y===g||g!==null&&y===g.alternate){S=y;break t}y=S(y),g=S(g)}S=null}else S=null;m!==null&&Mh(p,d,m,S,!1),v!==null&&j!==null&&Mh(p,j,v,S,!0)}}e:{if(d=u?Xl(u):window,m=d.nodeName&&d.nodeName.toLowerCase(),m==="select"||m==="input"&&d.type==="file")var O=Fp;else if(Zp(d))if(Jp)O=lb;else{O=nb;var w=tb}else m=d.nodeName,!m||m.toLowerCase()!=="input"||d.type!=="checkbox"&&d.type!=="radio"?u&&zc(u.elementType)&&(O=Fp):O=ab;if(O&&(O=O(e,u))){Kp(p,O,n,f);break e}w&&w(e,d,u),e==="focusout"&&u&&d.type==="number"&&u.memoizedProps.value!=null&&Dc(d,"number",d.value)}switch(w=u?Xl(u):window,e){case"focusin":(Zp(w)||w.contentEditable==="true")&&(Qa=w,Qc=u,ei=null);break;case"focusout":ei=Qc=Qa=null;break;case"mousedown":Zc=!0;break;case"contextmenu":case"mouseup":case"dragend":Zc=!1,lf(p,n,f);break;case"selectionchange":if(rb)break;case"keydown":case"keyup":lf(p,n,f)}var z;if(Gc)e:{switch(e){case"compositionstart":var R="onCompositionStart";break e;case"compositionend":R="onCompositionEnd";break e;case"compositionupdate":R="onCompositionUpdate";break e}R=void 0}else Xa?Xp(e,n)&&(R="onCompositionEnd"):e==="keydown"&&n.keyCode===229&&(R="onCompositionStart");R&&(Gp&&n.locale!=="ko"&&(Xa||R!=="onCompositionStart"?R==="onCompositionEnd"&&Xa&&(z=Lp()):(Cn=f,Lc="value"in Cn?Cn.value:Cn.textContent,Xa=!0)),w=is(u,R),0<w.length&&(R=new Yp(R,e,null,n,f),p.push({event:R,listeners:w}),z?R.data=z:(z=Qp(n),z!==null&&(R.data=z)))),(z=Jv?Pv(e,n):Wv(e,n))&&(R=is(u,"onBeforeInput"),0<R.length&&(w=new Yp("onBeforeInput","beforeinput",null,n,f),p.push({event:w,listeners:R}),w.data=z)),qb(p,e,u,n,f)}Dh(p,t)})}function wi(e,t,n){return{instance:e,listener:t,currentTarget:n}}function is(e,t){for(var n=t+"Capture",a=[];e!==null;){var l=e,i=l.stateNode;if(l=l.tag,l!==5&&l!==26&&l!==27||i===null||(l=Ql(e,n),l!=null&&a.unshift(wi(e,l,i)),l=Ql(e,t),l!=null&&a.push(wi(e,l,i))),e.tag===3)return a;e=e.return}return[]}function Zb(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function Mh(e,t,n,a,l){for(var i=t._reactName,r=[];n!==null&&n!==a;){var c=n,o=c.alternate,u=c.stateNode;if(c=c.tag,o!==null&&o===a)break;c!==5&&c!==26&&c!==27||u===null||(o=u,l?(u=Ql(n,i),u!=null&&r.unshift(wi(n,u,o))):l||(u=Ql(n,i),u!=null&&r.push(wi(n,u,o)))),n=n.return}r.length!==0&&e.push({event:t,listeners:r})}var Kb=/\r\n?/g,Fb=/\u0000|\uFFFD/g;function Rh(e){return(typeof e=="string"?e:""+e).replace(Kb,`
`).replace(Fb,"")}function Uh(e,t){return t=Rh(t),Rh(e)===t}function ue(e,t,n,a,l,i){switch(n){case"children":typeof a=="string"?t==="body"||t==="textarea"&&a===""||Ga(e,a):(typeof a=="number"||typeof a=="bigint")&&t!=="body"&&Ga(e,""+a);break;case"className":or(e,"class",a);break;case"tabIndex":or(e,"tabindex",a);break;case"dir":case"role":case"viewBox":case"width":case"height":or(e,n,a);break;case"style":Rp(e,a,i);break;case"data":if(t!=="object"){or(e,"data",a);break}case"src":case"href":if(a===""&&(t!=="a"||n!=="href")){e.removeAttribute(n);break}if(a==null||typeof a=="function"||typeof a=="symbol"||typeof a=="boolean"){e.removeAttribute(n);break}a=dr(""+a),e.setAttribute(n,a);break;case"action":case"formAction":if(typeof a=="function"){e.setAttribute(n,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof i=="function"&&(n==="formAction"?(t!=="input"&&ue(e,t,"name",l.name,l,null),ue(e,t,"formEncType",l.formEncType,l,null),ue(e,t,"formMethod",l.formMethod,l,null),ue(e,t,"formTarget",l.formTarget,l,null)):(ue(e,t,"encType",l.encType,l,null),ue(e,t,"method",l.method,l,null),ue(e,t,"target",l.target,l,null)));if(a==null||typeof a=="symbol"||typeof a=="boolean"){e.removeAttribute(n);break}a=dr(""+a),e.setAttribute(n,a);break;case"onClick":a!=null&&(e.onclick=Wt);break;case"onScroll":a!=null&&P("scroll",e);break;case"onScrollEnd":a!=null&&P("scrollend",e);break;case"dangerouslySetInnerHTML":if(a!=null){if(typeof a!="object"||!("__html"in a))throw Error(A(61));if(n=a.__html,n!=null){if(l.children!=null)throw Error(A(60));e.innerHTML=n}}break;case"multiple":e.multiple=a&&typeof a!="function"&&typeof a!="symbol";break;case"muted":e.muted=a&&typeof a!="function"&&typeof a!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(a==null||typeof a=="function"||typeof a=="boolean"||typeof a=="symbol"){e.removeAttribute("xlink:href");break}n=dr(""+a),e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",n);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":a!=null&&typeof a!="function"&&typeof a!="symbol"?e.setAttribute(n,""+a):e.removeAttribute(n);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":a&&typeof a!="function"&&typeof a!="symbol"?e.setAttribute(n,""):e.removeAttribute(n);break;case"capture":case"download":a===!0?e.setAttribute(n,""):a!==!1&&a!=null&&typeof a!="function"&&typeof a!="symbol"?e.setAttribute(n,a):e.removeAttribute(n);break;case"cols":case"rows":case"size":case"span":a!=null&&typeof a!="function"&&typeof a!="symbol"&&!isNaN(a)&&1<=a?e.setAttribute(n,a):e.removeAttribute(n);break;case"rowSpan":case"start":a==null||typeof a=="function"||typeof a=="symbol"||isNaN(a)?e.removeAttribute(n):e.setAttribute(n,a);break;case"popover":P("beforetoggle",e),P("toggle",e),cr(e,"popover",a);break;case"xlinkActuate":Pt(e,"http://www.w3.org/1999/xlink","xlink:actuate",a);break;case"xlinkArcrole":Pt(e,"http://www.w3.org/1999/xlink","xlink:arcrole",a);break;case"xlinkRole":Pt(e,"http://www.w3.org/1999/xlink","xlink:role",a);break;case"xlinkShow":Pt(e,"http://www.w3.org/1999/xlink","xlink:show",a);break;case"xlinkTitle":Pt(e,"http://www.w3.org/1999/xlink","xlink:title",a);break;case"xlinkType":Pt(e,"http://www.w3.org/1999/xlink","xlink:type",a);break;case"xmlBase":Pt(e,"http://www.w3.org/XML/1998/namespace","xml:base",a);break;case"xmlLang":Pt(e,"http://www.w3.org/XML/1998/namespace","xml:lang",a);break;case"xmlSpace":Pt(e,"http://www.w3.org/XML/1998/namespace","xml:space",a);break;case"is":cr(e,"is",a);break;case"innerText":case"textContent":break;default:(!(2<n.length)||n[0]!=="o"&&n[0]!=="O"||n[1]!=="n"&&n[1]!=="N")&&(n=Nv.get(n)||n,cr(e,n,a))}}function bu(e,t,n,a,l,i){switch(n){case"style":Rp(e,a,i);break;case"dangerouslySetInnerHTML":if(a!=null){if(typeof a!="object"||!("__html"in a))throw Error(A(61));if(n=a.__html,n!=null){if(l.children!=null)throw Error(A(60));e.innerHTML=n}}break;case"children":typeof a=="string"?Ga(e,a):(typeof a=="number"||typeof a=="bigint")&&Ga(e,""+a);break;case"onScroll":a!=null&&P("scroll",e);break;case"onScrollEnd":a!=null&&P("scrollend",e);break;case"onClick":a!=null&&(e.onclick=Wt);break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":break;case"innerText":case"textContent":break;default:if(!wp.hasOwnProperty(n))e:{if(n[0]==="o"&&n[1]==="n"&&(l=n.endsWith("Capture"),t=n.slice(2,l?n.length-7:void 0),i=e[Je]||null,i=i!=null?i[n]:null,typeof i=="function"&&e.removeEventListener(t,i,l),typeof a=="function")){typeof i!="function"&&i!==null&&(n in e?e[n]=null:e.hasAttribute(n)&&e.removeAttribute(n)),e.addEventListener(t,a,l);break e}n in e?e[n]=a:a===!0?e.setAttribute(n,""):cr(e,n,a)}}}function Be(e,t,n){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":P("error",e),P("load",e);var a=!1,l=!1,i;for(i in n)if(n.hasOwnProperty(i)){var r=n[i];if(r!=null)switch(i){case"src":a=!0;break;case"srcSet":l=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(A(137,t));default:ue(e,t,i,r,n,null)}}l&&ue(e,t,"srcSet",n.srcSet,n,null),a&&ue(e,t,"src",n.src,n,null);return;case"input":P("invalid",e);var c=i=r=l=null,o=null,u=null;for(a in n)if(n.hasOwnProperty(a)){var f=n[a];if(f!=null)switch(a){case"name":l=f;break;case"type":r=f;break;case"checked":o=f;break;case"defaultChecked":u=f;break;case"value":i=f;break;case"defaultValue":c=f;break;case"children":case"dangerouslySetInnerHTML":if(f!=null)throw Error(A(137,t));break;default:ue(e,t,a,f,n,null)}}Op(e,i,c,o,u,r,l,!1);return;case"select":P("invalid",e),a=r=i=null;for(l in n)if(n.hasOwnProperty(l)&&(c=n[l],c!=null))switch(l){case"value":i=c;break;case"defaultValue":r=c;break;case"multiple":a=c;default:ue(e,t,l,c,n,null)}t=i,n=r,e.multiple=!!a,t!=null?$a(e,!!a,t,!1):n!=null&&$a(e,!!a,n,!0);return;case"textarea":P("invalid",e),i=l=a=null;for(r in n)if(n.hasOwnProperty(r)&&(c=n[r],c!=null))switch(r){case"value":a=c;break;case"defaultValue":l=c;break;case"children":i=c;break;case"dangerouslySetInnerHTML":if(c!=null)throw Error(A(91));break;default:ue(e,t,r,c,n,null)}zp(e,a,l,i);return;case"option":for(o in n)if(n.hasOwnProperty(o)&&(a=n[o],a!=null))switch(o){case"selected":e.selected=a&&typeof a!="function"&&typeof a!="symbol";break;default:ue(e,t,o,a,n,null)}return;case"dialog":P("beforetoggle",e),P("toggle",e),P("cancel",e),P("close",e);break;case"iframe":case"object":P("load",e);break;case"video":case"audio":for(a=0;a<ji.length;a++)P(ji[a],e);break;case"image":P("error",e),P("load",e);break;case"details":P("toggle",e);break;case"embed":case"source":case"link":P("error",e),P("load",e);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(u in n)if(n.hasOwnProperty(u)&&(a=n[u],a!=null))switch(u){case"children":case"dangerouslySetInnerHTML":throw Error(A(137,t));default:ue(e,t,u,a,n,null)}return;default:if(zc(t)){for(f in n)n.hasOwnProperty(f)&&(a=n[f],a!==void 0&&bu(e,t,f,a,n,void 0));return}}for(c in n)n.hasOwnProperty(c)&&(a=n[c],a!=null&&ue(e,t,c,a,n,null))}function Jb(e,t,n,a){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var l=null,i=null,r=null,c=null,o=null,u=null,f=null;for(m in n){var p=n[m];if(n.hasOwnProperty(m)&&p!=null)switch(m){case"checked":break;case"value":break;case"defaultValue":o=p;default:a.hasOwnProperty(m)||ue(e,t,m,null,a,p)}}for(var d in a){var m=a[d];if(p=n[d],a.hasOwnProperty(d)&&(m!=null||p!=null))switch(d){case"type":i=m;break;case"name":l=m;break;case"checked":u=m;break;case"defaultChecked":f=m;break;case"value":r=m;break;case"defaultValue":c=m;break;case"children":case"dangerouslySetInnerHTML":if(m!=null)throw Error(A(137,t));break;default:m!==p&&ue(e,t,d,m,a,p)}}Oc(e,r,c,o,u,f,i,l);return;case"select":m=r=c=d=null;for(i in n)if(o=n[i],n.hasOwnProperty(i)&&o!=null)switch(i){case"value":break;case"multiple":m=o;default:a.hasOwnProperty(i)||ue(e,t,i,null,a,o)}for(l in a)if(i=a[l],o=n[l],a.hasOwnProperty(l)&&(i!=null||o!=null))switch(l){case"value":d=i;break;case"defaultValue":c=i;break;case"multiple":r=i;default:i!==o&&ue(e,t,l,i,a,o)}t=c,n=r,a=m,d!=null?$a(e,!!n,d,!1):!!a!=!!n&&(t!=null?$a(e,!!n,t,!0):$a(e,!!n,n?[]:"",!1));return;case"textarea":m=d=null;for(c in n)if(l=n[c],n.hasOwnProperty(c)&&l!=null&&!a.hasOwnProperty(c))switch(c){case"value":break;case"children":break;default:ue(e,t,c,null,a,l)}for(r in a)if(l=a[r],i=n[r],a.hasOwnProperty(r)&&(l!=null||i!=null))switch(r){case"value":d=l;break;case"defaultValue":m=l;break;case"children":break;case"dangerouslySetInnerHTML":if(l!=null)throw Error(A(91));break;default:l!==i&&ue(e,t,r,l,a,i)}Dp(e,d,m);return;case"option":for(var v in n)if(d=n[v],n.hasOwnProperty(v)&&d!=null&&!a.hasOwnProperty(v))switch(v){case"selected":e.selected=!1;break;default:ue(e,t,v,null,a,d)}for(o in a)if(d=a[o],m=n[o],a.hasOwnProperty(o)&&d!==m&&(d!=null||m!=null))switch(o){case"selected":e.selected=d&&typeof d!="function"&&typeof d!="symbol";break;default:ue(e,t,o,d,a,m)}return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var S in n)d=n[S],n.hasOwnProperty(S)&&d!=null&&!a.hasOwnProperty(S)&&ue(e,t,S,null,a,d);for(u in a)if(d=a[u],m=n[u],a.hasOwnProperty(u)&&d!==m&&(d!=null||m!=null))switch(u){case"children":case"dangerouslySetInnerHTML":if(d!=null)throw Error(A(137,t));break;default:ue(e,t,u,d,a,m)}return;default:if(zc(t)){for(var j in n)d=n[j],n.hasOwnProperty(j)&&d!==void 0&&!a.hasOwnProperty(j)&&bu(e,t,j,void 0,a,d);for(f in a)d=a[f],m=n[f],!a.hasOwnProperty(f)||d===m||d===void 0&&m===void 0||bu(e,t,f,d,a,m);return}}for(var y in n)d=n[y],n.hasOwnProperty(y)&&d!=null&&!a.hasOwnProperty(y)&&ue(e,t,y,null,a,d);for(p in a)d=a[p],m=n[p],!a.hasOwnProperty(p)||d===m||d==null&&m==null||ue(e,t,p,d,a,m)}function kh(e){switch(e){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function Pb(){if(typeof performance.getEntriesByType=="function"){for(var e=0,t=0,n=performance.getEntriesByType("resource"),a=0;a<n.length;a++){var l=n[a],i=l.transferSize,r=l.initiatorType,c=l.duration;if(i&&c&&kh(r)){for(r=0,c=l.responseEnd,a+=1;a<n.length;a++){var o=n[a],u=o.startTime;if(u>c)break;var f=o.transferSize,p=o.initiatorType;f&&kh(p)&&(o=o.responseEnd,r+=f*(o<c?1:(c-u)/(o-u)))}if(--a,t+=8*(i+r)/(l.duration/1e3),e++,10<e)break}}if(0<e)return t/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e=="number")?e:5}var xu=null,Su=null;function rs(e){return e.nodeType===9?e:e.ownerDocument}function Lh(e){switch(e){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function Hh(e,t){if(e===0)switch(t){case"svg":return 1;case"math":return 2;default:return 0}return e===1&&t==="foreignObject"?0:e}function _u(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.children=="bigint"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Nu=null;function Wb(){var e=window.event;return e&&e.type==="popstate"?e===Nu?!1:(Nu=e,!0):(Nu=null,!1)}var Bh=typeof setTimeout=="function"?setTimeout:void 0,Ib=typeof clearTimeout=="function"?clearTimeout:void 0,Yh=typeof Promise=="function"?Promise:void 0,ex=typeof queueMicrotask=="function"?queueMicrotask:typeof Yh<"u"?function(e){return Yh.resolve(null).then(e).catch(tx)}:Bh;function tx(e){setTimeout(function(){throw e})}function Qn(e){return e==="head"}function $h(e,t){var n=t,a=0;do{var l=n.nextSibling;if(e.removeChild(n),l&&l.nodeType===8)if(n=l.data,n==="/$"||n==="/&"){if(a===0){e.removeChild(l),bl(t);return}a--}else if(n==="$"||n==="$?"||n==="$~"||n==="$!"||n==="&")a++;else if(n==="html")Ei(e.ownerDocument.documentElement);else if(n==="head"){n=e.ownerDocument.head,Ei(n);for(var i=n.firstChild;i;){var r=i.nextSibling,c=i.nodeName;i[Vl]||c==="SCRIPT"||c==="STYLE"||c==="LINK"&&i.rel.toLowerCase()==="stylesheet"||n.removeChild(i),i=r}}else n==="body"&&Ei(e.ownerDocument.body);n=l}while(n);bl(t)}function Gh(e,t){var n=e;e=0;do{var a=n.nextSibling;if(n.nodeType===1?t?(n._stashedDisplay=n.style.display,n.style.display="none"):(n.style.display=n._stashedDisplay||"",n.getAttribute("style")===""&&n.removeAttribute("style")):n.nodeType===3&&(t?(n._stashedText=n.nodeValue,n.nodeValue=""):n.nodeValue=n._stashedText||""),a&&a.nodeType===8)if(n=a.data,n==="/$"){if(e===0)break;e--}else n!=="$"&&n!=="$?"&&n!=="$~"&&n!=="$!"||e++;n=a}while(n)}function ju(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var n=t;switch(t=t.nextSibling,n.nodeName){case"HTML":case"HEAD":case"BODY":ju(n),Tc(n);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(n.rel.toLowerCase()==="stylesheet")continue}e.removeChild(n)}}function nx(e,t,n,a){for(;e.nodeType===1;){var l=n;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!a&&(e.nodeName!=="INPUT"||e.type!=="hidden"))break}else if(a){if(!e[Vl])switch(t){case"meta":if(!e.hasAttribute("itemprop"))break;return e;case"link":if(i=e.getAttribute("rel"),i==="stylesheet"&&e.hasAttribute("data-precedence"))break;if(i!==l.rel||e.getAttribute("href")!==(l.href==null||l.href===""?null:l.href)||e.getAttribute("crossorigin")!==(l.crossOrigin==null?null:l.crossOrigin)||e.getAttribute("title")!==(l.title==null?null:l.title))break;return e;case"style":if(e.hasAttribute("data-precedence"))break;return e;case"script":if(i=e.getAttribute("src"),(i!==(l.src==null?null:l.src)||e.getAttribute("type")!==(l.type==null?null:l.type)||e.getAttribute("crossorigin")!==(l.crossOrigin==null?null:l.crossOrigin))&&i&&e.hasAttribute("async")&&!e.hasAttribute("itemprop"))break;return e;default:return e}}else if(t==="input"&&e.type==="hidden"){var i=l.name==null?null:""+l.name;if(l.type==="hidden"&&e.getAttribute("name")===i)return e}else return e;if(e=Ct(e.nextSibling),e===null)break}return null}function ax(e,t,n){if(t==="")return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!n||(e=Ct(e.nextSibling),e===null))return null;return e}function qh(e,t){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!t||(e=Ct(e.nextSibling),e===null))return null;return e}function wu(e){return e.data==="$?"||e.data==="$~"}function Eu(e){return e.data==="$!"||e.data==="$?"&&e.ownerDocument.readyState!=="loading"}function lx(e,t){var n=e.ownerDocument;if(e.data==="$~")e._reactRetry=t;else if(e.data!=="$?"||n.readyState!=="loading")t();else{var a=function(){t(),n.removeEventListener("DOMContentLoaded",a)};n.addEventListener("DOMContentLoaded",a),e._reactRetry=a}}function Ct(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?"||t==="$~"||t==="&"||t==="F!"||t==="F")break;if(t==="/$"||t==="/&")return null}}return e}var Au=null;function Vh(e){e=e.nextSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="/$"||n==="/&"){if(t===0)return Ct(e.nextSibling);t--}else n!=="$"&&n!=="$!"&&n!=="$?"&&n!=="$~"&&n!=="&"||t++}e=e.nextSibling}return null}function Xh(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="$"||n==="$!"||n==="$?"||n==="$~"||n==="&"){if(t===0)return e;t--}else n!=="/$"&&n!=="/&"||t++}e=e.previousSibling}return null}function Qh(e,t,n){switch(t=rs(n),e){case"html":if(e=t.documentElement,!e)throw Error(A(452));return e;case"head":if(e=t.head,!e)throw Error(A(453));return e;case"body":if(e=t.body,!e)throw Error(A(454));return e;default:throw Error(A(451))}}function Ei(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);Tc(e)}var Ot=new Map,Zh=new Set;function ss(e){return typeof e.getRootNode=="function"?e.getRootNode():e.nodeType===9?e:e.ownerDocument}var hn=le.d;le.d={f:ix,r:rx,D:sx,C:cx,L:ox,m:ux,X:px,S:dx,M:fx};function ix(){var e=hn.f(),t=Wr();return e||t}function rx(e){var t=Ha(e);t!==null&&t.tag===5&&t.type==="form"?um(t):hn.r(e)}var gl=typeof document>"u"?null:document;function Kh(e,t,n){var a=gl;if(a&&typeof t=="string"&&t){var l=_t(t);l='link[rel="'+e+'"][href="'+l+'"]',typeof n=="string"&&(l+='[crossorigin="'+n+'"]'),Zh.has(l)||(Zh.add(l),e={rel:e,crossOrigin:n,href:t},a.querySelector(l)===null&&(t=a.createElement("link"),Be(t,"link",e),ze(t),a.head.appendChild(t)))}}function sx(e){hn.D(e),Kh("dns-prefetch",e,null)}function cx(e,t){hn.C(e,t),Kh("preconnect",e,t)}function ox(e,t,n){hn.L(e,t,n);var a=gl;if(a&&e&&t){var l='link[rel="preload"][as="'+_t(t)+'"]';t==="image"&&n&&n.imageSrcSet?(l+='[imagesrcset="'+_t(n.imageSrcSet)+'"]',typeof n.imageSizes=="string"&&(l+='[imagesizes="'+_t(n.imageSizes)+'"]')):l+='[href="'+_t(e)+'"]';var i=l;switch(t){case"style":i=yl(e);break;case"script":i=vl(e)}Ot.has(i)||(e=me({rel:"preload",href:t==="image"&&n&&n.imageSrcSet?void 0:e,as:t},n),Ot.set(i,e),a.querySelector(l)!==null||t==="style"&&a.querySelector(Ai(i))||t==="script"&&a.querySelector(Ti(i))||(t=a.createElement("link"),Be(t,"link",e),ze(t),a.head.appendChild(t)))}}function ux(e,t){hn.m(e,t);var n=gl;if(n&&e){var a=t&&typeof t.as=="string"?t.as:"script",l='link[rel="modulepreload"][as="'+_t(a)+'"][href="'+_t(e)+'"]',i=l;switch(a){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":i=vl(e)}if(!Ot.has(i)&&(e=me({rel:"modulepreload",href:e},t),Ot.set(i,e),n.querySelector(l)===null)){switch(a){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(n.querySelector(Ti(i)))return}a=n.createElement("link"),Be(a,"link",e),ze(a),n.head.appendChild(a)}}}function dx(e,t,n){hn.S(e,t,n);var a=gl;if(a&&e){var l=Ba(a).hoistableStyles,i=yl(e);t=t||"default";var r=l.get(i);if(!r){var c={loading:0,preload:null};if(r=a.querySelector(Ai(i)))c.loading=5;else{e=me({rel:"stylesheet",href:e,"data-precedence":t},n),(n=Ot.get(i))&&Tu(e,n);var o=r=a.createElement("link");ze(o),Be(o,"link",e),o._p=new Promise(function(u,f){o.onload=u,o.onerror=f}),o.addEventListener("load",function(){c.loading|=1}),o.addEventListener("error",function(){c.loading|=2}),c.loading|=4,cs(r,t,a)}r={type:"stylesheet",instance:r,count:1,state:c},l.set(i,r)}}}function px(e,t){hn.X(e,t);var n=gl;if(n&&e){var a=Ba(n).hoistableScripts,l=vl(e),i=a.get(l);i||(i=n.querySelector(Ti(l)),i||(e=me({src:e,async:!0},t),(t=Ot.get(l))&&Cu(e,t),i=n.createElement("script"),ze(i),Be(i,"link",e),n.head.appendChild(i)),i={type:"script",instance:i,count:1,state:null},a.set(l,i))}}function fx(e,t){hn.M(e,t);var n=gl;if(n&&e){var a=Ba(n).hoistableScripts,l=vl(e),i=a.get(l);i||(i=n.querySelector(Ti(l)),i||(e=me({src:e,async:!0,type:"module"},t),(t=Ot.get(l))&&Cu(e,t),i=n.createElement("script"),ze(i),Be(i,"link",e),n.head.appendChild(i)),i={type:"script",instance:i,count:1,state:null},a.set(l,i))}}function Fh(e,t,n,a){var l=(l=En.current)?ss(l):null;if(!l)throw Error(A(446));switch(e){case"meta":case"title":return null;case"style":return typeof n.precedence=="string"&&typeof n.href=="string"?(t=yl(n.href),n=Ba(l).hoistableStyles,a=n.get(t),a||(a={type:"style",instance:null,count:0,state:null},n.set(t,a)),a):{type:"void",instance:null,count:0,state:null};case"link":if(n.rel==="stylesheet"&&typeof n.href=="string"&&typeof n.precedence=="string"){e=yl(n.href);var i=Ba(l).hoistableStyles,r=i.get(e);if(r||(l=l.ownerDocument||l,r={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},i.set(e,r),(i=l.querySelector(Ai(e)))&&!i._p&&(r.instance=i,r.state.loading=5),Ot.has(e)||(n={rel:"preload",as:"style",href:n.href,crossOrigin:n.crossOrigin,integrity:n.integrity,media:n.media,hrefLang:n.hrefLang,referrerPolicy:n.referrerPolicy},Ot.set(e,n),i||mx(l,e,n,r.state))),t&&a===null)throw Error(A(528,""));return r}if(t&&a!==null)throw Error(A(529,""));return null;case"script":return t=n.async,n=n.src,typeof n=="string"&&t&&typeof t!="function"&&typeof t!="symbol"?(t=vl(n),n=Ba(l).hoistableScripts,a=n.get(t),a||(a={type:"script",instance:null,count:0,state:null},n.set(t,a)),a):{type:"void",instance:null,count:0,state:null};default:throw Error(A(444,e))}}function yl(e){return'href="'+_t(e)+'"'}function Ai(e){return'link[rel="stylesheet"]['+e+"]"}function Jh(e){return me({},e,{"data-precedence":e.precedence,precedence:null})}function mx(e,t,n,a){e.querySelector('link[rel="preload"][as="style"]['+t+"]")?a.loading=1:(t=e.createElement("link"),a.preload=t,t.addEventListener("load",function(){return a.loading|=1}),t.addEventListener("error",function(){return a.loading|=2}),Be(t,"link",n),ze(t),e.head.appendChild(t))}function vl(e){return'[src="'+_t(e)+'"]'}function Ti(e){return"script[async]"+e}function Ph(e,t,n){if(t.count++,t.instance===null)switch(t.type){case"style":var a=e.querySelector('style[data-href~="'+_t(n.href)+'"]');if(a)return t.instance=a,ze(a),a;var l=me({},n,{"data-href":n.href,"data-precedence":n.precedence,href:null,precedence:null});return a=(e.ownerDocument||e).createElement("style"),ze(a),Be(a,"style",l),cs(a,n.precedence,e),t.instance=a;case"stylesheet":l=yl(n.href);var i=e.querySelector(Ai(l));if(i)return t.state.loading|=4,t.instance=i,ze(i),i;a=Jh(n),(l=Ot.get(l))&&Tu(a,l),i=(e.ownerDocument||e).createElement("link"),ze(i);var r=i;return r._p=new Promise(function(c,o){r.onload=c,r.onerror=o}),Be(i,"link",a),t.state.loading|=4,cs(i,n.precedence,e),t.instance=i;case"script":return i=vl(n.src),(l=e.querySelector(Ti(i)))?(t.instance=l,ze(l),l):(a=n,(l=Ot.get(i))&&(a=me({},n),Cu(a,l)),e=e.ownerDocument||e,l=e.createElement("script"),ze(l),Be(l,"link",a),e.head.appendChild(l),t.instance=l);case"void":return null;default:throw Error(A(443,t.type))}else t.type==="stylesheet"&&!(t.state.loading&4)&&(a=t.instance,t.state.loading|=4,cs(a,n.precedence,e));return t.instance}function cs(e,t,n){for(var a=n.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),l=a.length?a[a.length-1]:null,i=l,r=0;r<a.length;r++){var c=a[r];if(c.dataset.precedence===t)i=c;else if(i!==l)break}i?i.parentNode.insertBefore(e,i.nextSibling):(t=n.nodeType===9?n.head:n,t.insertBefore(e,t.firstChild))}function Tu(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.title==null&&(e.title=t.title)}function Cu(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.integrity==null&&(e.integrity=t.integrity)}var os=null;function Wh(e,t,n){if(os===null){var a=new Map,l=os=new Map;l.set(n,a)}else l=os,a=l.get(n),a||(a=new Map,l.set(n,a));if(a.has(e))return a;for(a.set(e,null),n=n.getElementsByTagName(e),l=0;l<n.length;l++){var i=n[l];if(!(i[Vl]||i[Ue]||e==="link"&&i.getAttribute("rel")==="stylesheet")&&i.namespaceURI!=="http://www.w3.org/2000/svg"){var r=i.getAttribute(t)||"";r=e+r;var c=a.get(r);c?c.push(i):a.set(r,[i])}}return a}function Ih(e,t,n){e=e.ownerDocument||e,e.head.insertBefore(n,t==="title"?e.querySelector("head > title"):null)}function hx(e,t,n){if(n===1||t.itemProp!=null)return!1;switch(e){case"meta":case"title":return!0;case"style":if(typeof t.precedence!="string"||typeof t.href!="string"||t.href==="")break;return!0;case"link":if(typeof t.rel!="string"||typeof t.href!="string"||t.href===""||t.onLoad||t.onError)break;switch(t.rel){case"stylesheet":return e=t.disabled,typeof t.precedence=="string"&&e==null;default:return!0}case"script":if(t.async&&typeof t.async!="function"&&typeof t.async!="symbol"&&!t.onLoad&&!t.onError&&t.src&&typeof t.src=="string")return!0}return!1}function eg(e){return!(e.type==="stylesheet"&&!(e.state.loading&3))}function gx(e,t,n,a){if(n.type==="stylesheet"&&(typeof a.media!="string"||matchMedia(a.media).matches!==!1)&&!(n.state.loading&4)){if(n.instance===null){var l=yl(a.href),i=t.querySelector(Ai(l));if(i){t=i._p,t!==null&&typeof t=="object"&&typeof t.then=="function"&&(e.count++,e=us.bind(e),t.then(e,e)),n.state.loading|=4,n.instance=i,ze(i);return}i=t.ownerDocument||t,a=Jh(a),(l=Ot.get(l))&&Tu(a,l),i=i.createElement("link"),ze(i);var r=i;r._p=new Promise(function(c,o){r.onload=c,r.onerror=o}),Be(i,"link",a),n.instance=i}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(n,t),(t=n.state.preload)&&!(n.state.loading&3)&&(e.count++,n=us.bind(e),t.addEventListener("load",n),t.addEventListener("error",n))}}var Ou=0;function yx(e,t){return e.stylesheets&&e.count===0&&ps(e,e.stylesheets),0<e.count||0<e.imgCount?function(n){var a=setTimeout(function(){if(e.stylesheets&&ps(e,e.stylesheets),e.unsuspend){var i=e.unsuspend;e.unsuspend=null,i()}},6e4+t);0<e.imgBytes&&Ou===0&&(Ou=62500*Pb());var l=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&ps(e,e.stylesheets),e.unsuspend)){var i=e.unsuspend;e.unsuspend=null,i()}},(e.imgBytes>Ou?50:800)+t);return e.unsuspend=n,function(){e.unsuspend=null,clearTimeout(a),clearTimeout(l)}}:null}function us(){if(this.count--,this.count===0&&(this.imgCount===0||!this.waitingForImages)){if(this.stylesheets)ps(this,this.stylesheets);else if(this.unsuspend){var e=this.unsuspend;this.unsuspend=null,e()}}}var ds=null;function ps(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,ds=new Map,t.forEach(vx,e),ds=null,us.call(e))}function vx(e,t){if(!(t.state.loading&4)){var n=ds.get(e);if(n)var a=n.get(null);else{n=new Map,ds.set(e,n);for(var l=e.querySelectorAll("link[data-precedence],style[data-precedence]"),i=0;i<l.length;i++){var r=l[i];(r.nodeName==="LINK"||r.getAttribute("media")!=="not all")&&(n.set(r.dataset.precedence,r),a=r)}a&&n.set(null,a)}l=t.instance,r=l.getAttribute("data-precedence"),i=n.get(r)||a,i===a&&n.set(null,l),n.set(r,l),this.count++,a=us.bind(this),l.addEventListener("load",a),l.addEventListener("error",a),i?i.parentNode.insertBefore(l,i.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(l,e.firstChild)),t.state.loading|=4}}var Ci={$$typeof:Jt,Provider:null,Consumer:null,_currentValue:la,_currentValue2:la,_threadCount:0};function bx(e,t,n,a,l,i,r,c,o){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=jc(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=jc(0),this.hiddenUpdates=jc(null),this.identifierPrefix=a,this.onUncaughtError=l,this.onCaughtError=i,this.onRecoverableError=r,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=o,this.incompleteTransitions=new Map}function tg(e,t,n,a,l,i,r,c,o,u,f,p){return e=new bx(e,t,n,r,o,u,f,p,c),t=1,i===!0&&(t|=24),i=pt(3,null,null,t),e.current=i,i.stateNode=e,t=co(),t.refCount++,e.pooledCache=t,t.refCount++,i.memoizedState={element:a,isDehydrated:n,cache:t},fo(i),e}function ng(e){return e?(e=Fa,e):Fa}function ag(e,t,n,a,l,i){l=ng(l),a.context===null?a.context=l:a.pendingContext=l,a=Un(t),a.payload={element:n},i=i===void 0?null:i,i!==null&&(a.callback=i),n=kn(e,a,t),n!==null&&(nt(n,e,t),si(n,e,t))}function lg(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function Du(e,t){lg(e,t),(e=e.alternate)&&lg(e,t)}function ig(e){if(e.tag===13||e.tag===31){var t=da(e,67108864);t!==null&&nt(t,e,67108864),Du(e,67108864)}}function rg(e){if(e.tag===13||e.tag===31){var t=yt();t=wc(t);var n=da(e,t);n!==null&&nt(n,e,t),Du(e,t)}}var fs=!0;function xx(e,t,n,a){var l=V.T;V.T=null;var i=le.p;try{le.p=2,zu(e,t,n,a)}finally{le.p=i,V.T=l}}function Sx(e,t,n,a){var l=V.T;V.T=null;var i=le.p;try{le.p=8,zu(e,t,n,a)}finally{le.p=i,V.T=l}}function zu(e,t,n,a){if(fs){var l=Mu(a);if(l===null)vu(e,t,a,ms,n),cg(e,a);else if(Nx(l,e,t,n,a))a.stopPropagation();else if(cg(e,a),t&4&&-1<_x.indexOf(e)){for(;l!==null;){var i=Ha(l);if(i!==null)switch(i.tag){case 3:if(i=i.stateNode,i.current.memoizedState.isDehydrated){var r=ra(i.pendingLanes);if(r!==0){var c=i;for(c.pendingLanes|=2,c.entangledLanes|=2;r;){var o=1<<31-ut(r);c.entanglements[1]|=o,r&=~o}Vt(i),!(ie&6)&&(Jr=ct()+500,Ni(0,!1))}}break;case 31:case 13:c=da(i,2),c!==null&&nt(c,i,2),Wr(),Du(i,2)}if(i=Mu(a),i===null&&vu(e,t,a,ms,n),i===l)break;l=i}l!==null&&a.stopPropagation()}else vu(e,t,a,null,n)}}function Mu(e){return e=Rc(e),Ru(e)}var ms=null;function Ru(e){if(ms=null,e=La(e),e!==null){var t=kl(e);if(t===null)e=null;else{var n=t.tag;if(n===13){if(e=ip(t),e!==null)return e;e=null}else if(n===31){if(e=rp(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return ms=e,null}function sg(e){switch(e){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(sv()){case mp:return 2;case hp:return 8;case ar:case cv:return 32;case gp:return 268435456;default:return 32}default:return 32}}var Uu=!1,Zn=null,Kn=null,Fn=null,Oi=new Map,Di=new Map,Jn=[],_x="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function cg(e,t){switch(e){case"focusin":case"focusout":Zn=null;break;case"dragenter":case"dragleave":Kn=null;break;case"mouseover":case"mouseout":Fn=null;break;case"pointerover":case"pointerout":Oi.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":Di.delete(t.pointerId)}}function zi(e,t,n,a,l,i){return e===null||e.nativeEvent!==i?(e={blockedOn:t,domEventName:n,eventSystemFlags:a,nativeEvent:i,targetContainers:[l]},t!==null&&(t=Ha(t),t!==null&&ig(t)),e):(e.eventSystemFlags|=a,t=e.targetContainers,l!==null&&t.indexOf(l)===-1&&t.push(l),e)}function Nx(e,t,n,a,l){switch(t){case"focusin":return Zn=zi(Zn,e,t,n,a,l),!0;case"dragenter":return Kn=zi(Kn,e,t,n,a,l),!0;case"mouseover":return Fn=zi(Fn,e,t,n,a,l),!0;case"pointerover":var i=l.pointerId;return Oi.set(i,zi(Oi.get(i)||null,e,t,n,a,l)),!0;case"gotpointercapture":return i=l.pointerId,Di.set(i,zi(Di.get(i)||null,e,t,n,a,l)),!0}return!1}function og(e){var t=La(e.target);if(t!==null){var n=kl(t);if(n!==null){if(t=n.tag,t===13){if(t=ip(n),t!==null){e.blockedOn=t,_p(e.priority,function(){rg(n)});return}}else if(t===31){if(t=rp(n),t!==null){e.blockedOn=t,_p(e.priority,function(){rg(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function hs(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=Mu(e.nativeEvent);if(n===null){n=e.nativeEvent;var a=new n.constructor(n.type,n);Mc=a,n.target.dispatchEvent(a),Mc=null}else return t=Ha(n),t!==null&&ig(t),e.blockedOn=n,!1;t.shift()}return!0}function ug(e,t,n){hs(e)&&n.delete(t)}function jx(){Uu=!1,Zn!==null&&hs(Zn)&&(Zn=null),Kn!==null&&hs(Kn)&&(Kn=null),Fn!==null&&hs(Fn)&&(Fn=null),Oi.forEach(ug),Di.forEach(ug)}function gs(e,t){e.blockedOn===t&&(e.blockedOn=null,Uu||(Uu=!0,Ce.unstable_scheduleCallback(Ce.unstable_NormalPriority,jx)))}var ys=null;function dg(e){ys!==e&&(ys=e,Ce.unstable_scheduleCallback(Ce.unstable_NormalPriority,function(){ys===e&&(ys=null);for(var t=0;t<e.length;t+=3){var n=e[t],a=e[t+1],l=e[t+2];if(typeof a!="function"){if(Ru(a||n)===null)continue;break}var i=Ha(n);i!==null&&(e.splice(t,3),t-=3,Mo(i,{pending:!0,data:l,method:n.method,action:a},a,l))}}))}function bl(e){function t(o){return gs(o,e)}Zn!==null&&gs(Zn,e),Kn!==null&&gs(Kn,e),Fn!==null&&gs(Fn,e),Oi.forEach(t),Di.forEach(t);for(var n=0;n<Jn.length;n++){var a=Jn[n];a.blockedOn===e&&(a.blockedOn=null)}for(;0<Jn.length&&(n=Jn[0],n.blockedOn===null);)og(n),n.blockedOn===null&&Jn.shift();if(n=(e.ownerDocument||e).$$reactFormReplay,n!=null)for(a=0;a<n.length;a+=3){var l=n[a],i=n[a+1],r=l[Je]||null;if(typeof i=="function")r||dg(n);else if(r){var c=null;if(i&&i.hasAttribute("formAction")){if(l=i,r=i[Je]||null)c=r.formAction;else if(Ru(l)!==null)continue}else c=r.action;typeof c=="function"?n[a+1]=c:(n.splice(a,3),a-=3),dg(n)}}}function pg(){function e(i){i.canIntercept&&i.info==="react-transition"&&i.intercept({handler:function(){return new Promise(function(r){return l=r})},focusReset:"manual",scroll:"manual"})}function t(){l!==null&&(l(),l=null),a||setTimeout(n,20)}function n(){if(!a&&!navigation.transition){var i=navigation.currentEntry;i&&i.url!=null&&navigation.navigate(i.url,{state:i.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var a=!1,l=null;return navigation.addEventListener("navigate",e),navigation.addEventListener("navigatesuccess",t),navigation.addEventListener("navigateerror",t),setTimeout(n,100),function(){a=!0,navigation.removeEventListener("navigate",e),navigation.removeEventListener("navigatesuccess",t),navigation.removeEventListener("navigateerror",t),l!==null&&(l(),l=null)}}}function ku(e){this._internalRoot=e}vs.prototype.render=ku.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(A(409));var n=t.current,a=yt();ag(n,a,e,t,null,null)},vs.prototype.unmount=ku.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;ag(e.current,2,null,e,null,null),Wr(),t[ka]=null}};function vs(e){this._internalRoot=e}vs.prototype.unstable_scheduleHydration=function(e){if(e){var t=Sp();e={blockedOn:null,target:e,priority:t};for(var n=0;n<Jn.length&&t!==0&&t<Jn[n].priority;n++);Jn.splice(n,0,e),n===0&&og(e)}};var fg=ap.version;if(fg!=="19.2.4")throw Error(A(527,fg,"19.2.4"));le.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(A(188)):(e=Object.keys(e).join(","),Error(A(268,e)));return e=ev(t),e=e!==null?cp(e):null,e=e===null?null:e.stateNode,e};var wx={bundleType:0,version:"19.2.4",rendererPackageName:"react-dom",currentDispatcherRef:V,reconcilerVersion:"19.2.4"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var bs=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!bs.isDisabled&&bs.supportsFiber)try{$l=bs.inject(wx),ot=bs}catch{}}Pi.createRoot=function(e,t){if(!lp(e))throw Error(A(299));var n=!1,a="",l=xm,i=Sm,r=_m;return t!=null&&(t.unstable_strictMode===!0&&(n=!0),t.identifierPrefix!==void 0&&(a=t.identifierPrefix),t.onUncaughtError!==void 0&&(l=t.onUncaughtError),t.onCaughtError!==void 0&&(i=t.onCaughtError),t.onRecoverableError!==void 0&&(r=t.onRecoverableError)),t=tg(e,1,!1,null,null,n,a,null,l,i,r,pg),e[ka]=t.current,yu(e),new ku(t)},Pi.hydrateRoot=function(e,t,n){if(!lp(e))throw Error(A(299));var a=!1,l="",i=xm,r=Sm,c=_m,o=null;return n!=null&&(n.unstable_strictMode===!0&&(a=!0),n.identifierPrefix!==void 0&&(l=n.identifierPrefix),n.onUncaughtError!==void 0&&(i=n.onUncaughtError),n.onCaughtError!==void 0&&(r=n.onCaughtError),n.onRecoverableError!==void 0&&(c=n.onRecoverableError),n.formState!==void 0&&(o=n.formState)),t=tg(e,1,!0,t,n??null,a,l,o,i,r,c,pg),t.context=ng(null),n=t.current,a=yt(),a=wc(a),l=Un(a),l.callback=null,kn(n,l,a),n=a,t.current.lanes=n,ql(t,n),Vt(t),e[ka]=t.current,yu(e),new vs(t)},Pi.version="19.2.4";function mg(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(mg)}catch(e){console.error(e)}}mg(),Pd.exports=Pi;var Ex=Pd.exports;const Ax=Ld(Ex);function xl(e,t,{checkForDefaultPrevented:n=!0}={}){return function(l){if(e==null||e(l),n===!1||!l.defaultPrevented)return t==null?void 0:t(l)}}function hg(e,t){if(typeof e=="function")return e(t);e!=null&&(e.current=t)}function gg(...e){return t=>{let n=!1;const a=e.map(l=>{const i=hg(l,t);return!n&&typeof i=="function"&&(n=!0),i});if(n)return()=>{for(let l=0;l<a.length;l++){const i=a[l];typeof i=="function"?i():hg(e[l],null)}}}}function ja(...e){return x.useCallback(gg(...e),e)}function yg(e,t=[]){let n=[];function a(i,r){const c=x.createContext(r),o=n.length;n=[...n,r];const u=p=>{var y;const{scope:d,children:m,...v}=p,S=((y=d==null?void 0:d[e])==null?void 0:y[o])||c,j=x.useMemo(()=>v,Object.values(v));return s.jsx(S.Provider,{value:j,children:m})};u.displayName=i+"Provider";function f(p,d){var S;const m=((S=d==null?void 0:d[e])==null?void 0:S[o])||c,v=x.useContext(m);if(v)return v;if(r!==void 0)return r;throw new Error(`\`${p}\` must be used within \`${i}\``)}return[u,f]}const l=()=>{const i=n.map(r=>x.createContext(r));return function(c){const o=(c==null?void 0:c[e])||i;return x.useMemo(()=>({[`__scope${e}`]:{...c,[e]:o}}),[c,o])}};return l.scopeName=e,[a,Tx(l,...t)]}function Tx(...e){const t=e[0];if(e.length===1)return t;const n=()=>{const a=e.map(l=>({useScope:l(),scopeName:l.scopeName}));return function(i){const r=a.reduce((c,{useScope:o,scopeName:u})=>{const p=o(i)[`__scope${u}`];return{...c,...p}},{});return x.useMemo(()=>({[`__scope${t.scopeName}`]:r}),[r])}};return n.scopeName=t.scopeName,n}function Lu(e,t,{checkForDefaultPrevented:n=!0}={}){return function(l){if(e==null||e(l),n===!1||!l.defaultPrevented)return t==null?void 0:t(l)}}function Cx(e){const t=Ox(e),n=x.forwardRef((a,l)=>{const{children:i,...r}=a,c=x.Children.toArray(i),o=c.find(zx);if(o){const u=o.props.children,f=c.map(p=>p===o?x.Children.count(u)>1?x.Children.only(null):x.isValidElement(u)?u.props.children:null:p);return s.jsx(t,{...r,ref:l,children:x.isValidElement(u)?x.cloneElement(u,void 0,f):null})}return s.jsx(t,{...r,ref:l,children:i})});return n.displayName=`${e}.Slot`,n}function Ox(e){const t=x.forwardRef((n,a)=>{const{children:l,...i}=n;if(x.isValidElement(l)){const r=Rx(l),c=Mx(i,l.props);return l.type!==x.Fragment&&(c.ref=a?gg(a,r):r),x.cloneElement(l,c)}return x.Children.count(l)>1?x.Children.only(null):null});return t.displayName=`${e}.SlotClone`,t}var Dx=Symbol("radix.slottable");function zx(e){return x.isValidElement(e)&&typeof e.type=="function"&&"__radixId"in e.type&&e.type.__radixId===Dx}function Mx(e,t){const n={...t};for(const a in t){const l=e[a],i=t[a];/^on[A-Z]/.test(a)?l&&i?n[a]=(...c)=>{const o=i(...c);return l(...c),o}:l&&(n[a]=l):a==="style"?n[a]={...l,...i}:a==="className"&&(n[a]=[l,i].filter(Boolean).join(" "))}return{...e,...n}}function Rx(e){var a,l;let t=(a=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:a.get,n=t&&"isReactWarning"in t&&t.isReactWarning;return n?e.ref:(t=(l=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:l.get,n=t&&"isReactWarning"in t&&t.isReactWarning,n?e.props.ref:e.props.ref||e.ref)}var Ux=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],wa=Ux.reduce((e,t)=>{const n=Cx(`Primitive.${t}`),a=x.forwardRef((l,i)=>{const{asChild:r,...c}=l,o=r?n:t;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),s.jsx(o,{...c,ref:i})});return a.displayName=`Primitive.${t}`,{...e,[t]:a}},{});function kx(e,t){e&&cc.flushSync(()=>e.dispatchEvent(t))}function xs(e){const t=x.useRef(e);return x.useEffect(()=>{t.current=e}),x.useMemo(()=>(...n)=>{var a;return(a=t.current)==null?void 0:a.call(t,...n)},[])}function Lx(e,t=globalThis==null?void 0:globalThis.document){const n=xs(e);x.useEffect(()=>{const a=l=>{l.key==="Escape"&&n(l)};return t.addEventListener("keydown",a,{capture:!0}),()=>t.removeEventListener("keydown",a,{capture:!0})},[n,t])}var Hx="DismissableLayer",Hu="dismissableLayer.update",Bx="dismissableLayer.pointerDownOutside",Yx="dismissableLayer.focusOutside",vg,bg=x.createContext({layers:new Set,layersWithOutsidePointerEventsDisabled:new Set,branches:new Set}),xg=x.forwardRef((e,t)=>{const{disableOutsidePointerEvents:n=!1,onEscapeKeyDown:a,onPointerDownOutside:l,onFocusOutside:i,onInteractOutside:r,onDismiss:c,...o}=e,u=x.useContext(bg),[f,p]=x.useState(null),d=(f==null?void 0:f.ownerDocument)??(globalThis==null?void 0:globalThis.document),[,m]=x.useState({}),v=ja(t,w=>p(w)),S=Array.from(u.layers),[j]=[...u.layersWithOutsidePointerEventsDisabled].slice(-1),y=S.indexOf(j),g=f?S.indexOf(f):-1,b=u.layersWithOutsidePointerEventsDisabled.size>0,_=g>=y,T=qx(w=>{const z=w.target,R=[...u.branches].some(L=>L.contains(z));!_||R||(l==null||l(w),r==null||r(w),w.defaultPrevented||c==null||c())},d),O=Vx(w=>{const z=w.target;[...u.branches].some(L=>L.contains(z))||(i==null||i(w),r==null||r(w),w.defaultPrevented||c==null||c())},d);return Lx(w=>{g===u.layers.size-1&&(a==null||a(w),!w.defaultPrevented&&c&&(w.preventDefault(),c()))},d),x.useEffect(()=>{if(f)return n&&(u.layersWithOutsidePointerEventsDisabled.size===0&&(vg=d.body.style.pointerEvents,d.body.style.pointerEvents="none"),u.layersWithOutsidePointerEventsDisabled.add(f)),u.layers.add(f),Sg(),()=>{n&&u.layersWithOutsidePointerEventsDisabled.size===1&&(d.body.style.pointerEvents=vg)}},[f,d,n,u]),x.useEffect(()=>()=>{f&&(u.layers.delete(f),u.layersWithOutsidePointerEventsDisabled.delete(f),Sg())},[f,u]),x.useEffect(()=>{const w=()=>m({});return document.addEventListener(Hu,w),()=>document.removeEventListener(Hu,w)},[]),s.jsx(wa.div,{...o,ref:v,style:{pointerEvents:b?_?"auto":"none":void 0,...e.style},onFocusCapture:Lu(e.onFocusCapture,O.onFocusCapture),onBlurCapture:Lu(e.onBlurCapture,O.onBlurCapture),onPointerDownCapture:Lu(e.onPointerDownCapture,T.onPointerDownCapture)})});xg.displayName=Hx;var $x="DismissableLayerBranch",Gx=x.forwardRef((e,t)=>{const n=x.useContext(bg),a=x.useRef(null),l=ja(t,a);return x.useEffect(()=>{const i=a.current;if(i)return n.branches.add(i),()=>{n.branches.delete(i)}},[n.branches]),s.jsx(wa.div,{...e,ref:l})});Gx.displayName=$x;function qx(e,t=globalThis==null?void 0:globalThis.document){const n=xs(e),a=x.useRef(!1),l=x.useRef(()=>{});return x.useEffect(()=>{const i=c=>{if(c.target&&!a.current){let o=function(){_g(Bx,n,u,{discrete:!0})};const u={originalEvent:c};c.pointerType==="touch"?(t.removeEventListener("click",l.current),l.current=o,t.addEventListener("click",l.current,{once:!0})):o()}else t.removeEventListener("click",l.current);a.current=!1},r=window.setTimeout(()=>{t.addEventListener("pointerdown",i)},0);return()=>{window.clearTimeout(r),t.removeEventListener("pointerdown",i),t.removeEventListener("click",l.current)}},[t,n]),{onPointerDownCapture:()=>a.current=!0}}function Vx(e,t=globalThis==null?void 0:globalThis.document){const n=xs(e),a=x.useRef(!1);return x.useEffect(()=>{const l=i=>{i.target&&!a.current&&_g(Yx,n,{originalEvent:i},{discrete:!1})};return t.addEventListener("focusin",l),()=>t.removeEventListener("focusin",l)},[t,n]),{onFocusCapture:()=>a.current=!0,onBlurCapture:()=>a.current=!1}}function Sg(){const e=new CustomEvent(Hu);document.dispatchEvent(e)}function _g(e,t,n,{discrete:a}){const l=n.originalEvent.target,i=new CustomEvent(e,{bubbles:!1,cancelable:!0,detail:n});t&&l.addEventListener(e,t,{once:!0}),a?kx(l,i):l.dispatchEvent(i)}var Mi=globalThis!=null&&globalThis.document?x.useLayoutEffect:()=>{};const Xx=["top","right","bottom","left"],Pn=Math.min,vt=Math.max,Ss=Math.round,_s=Math.floor,Xt=e=>({x:e,y:e}),Qx={left:"right",right:"left",bottom:"top",top:"bottom"},Zx={start:"end",end:"start"};function Bu(e,t,n){return vt(e,Pn(t,n))}function gn(e,t){return typeof e=="function"?e(t):e}function yn(e){return e.split("-")[0]}function Sl(e){return e.split("-")[1]}function Yu(e){return e==="x"?"y":"x"}function $u(e){return e==="y"?"height":"width"}const Kx=new Set(["top","bottom"]);function Qt(e){return Kx.has(yn(e))?"y":"x"}function Gu(e){return Yu(Qt(e))}function Fx(e,t,n){n===void 0&&(n=!1);const a=Sl(e),l=Gu(e),i=$u(l);let r=l==="x"?a===(n?"end":"start")?"right":"left":a==="start"?"bottom":"top";return t.reference[i]>t.floating[i]&&(r=Ns(r)),[r,Ns(r)]}function Jx(e){const t=Ns(e);return[qu(e),t,qu(t)]}function qu(e){return e.replace(/start|end/g,t=>Zx[t])}const Ng=["left","right"],jg=["right","left"],Px=["top","bottom"],Wx=["bottom","top"];function Ix(e,t,n){switch(e){case"top":case"bottom":return n?t?jg:Ng:t?Ng:jg;case"left":case"right":return t?Px:Wx;default:return[]}}function e1(e,t,n,a){const l=Sl(e);let i=Ix(yn(e),n==="start",a);return l&&(i=i.map(r=>r+"-"+l),t&&(i=i.concat(i.map(qu)))),i}function Ns(e){return e.replace(/left|right|bottom|top/g,t=>Qx[t])}function t1(e){return{top:0,right:0,bottom:0,left:0,...e}}function wg(e){return typeof e!="number"?t1(e):{top:e,right:e,bottom:e,left:e}}function js(e){const{x:t,y:n,width:a,height:l}=e;return{width:a,height:l,top:n,left:t,right:t+a,bottom:n+l,x:t,y:n}}function Eg(e,t,n){let{reference:a,floating:l}=e;const i=Qt(t),r=Gu(t),c=$u(r),o=yn(t),u=i==="y",f=a.x+a.width/2-l.width/2,p=a.y+a.height/2-l.height/2,d=a[c]/2-l[c]/2;let m;switch(o){case"top":m={x:f,y:a.y-l.height};break;case"bottom":m={x:f,y:a.y+a.height};break;case"right":m={x:a.x+a.width,y:p};break;case"left":m={x:a.x-l.width,y:p};break;default:m={x:a.x,y:a.y}}switch(Sl(t)){case"start":m[r]-=d*(n&&u?-1:1);break;case"end":m[r]+=d*(n&&u?-1:1);break}return m}async function n1(e,t){var n;t===void 0&&(t={});const{x:a,y:l,platform:i,rects:r,elements:c,strategy:o}=e,{boundary:u="clippingAncestors",rootBoundary:f="viewport",elementContext:p="floating",altBoundary:d=!1,padding:m=0}=gn(t,e),v=wg(m),j=c[d?p==="floating"?"reference":"floating":p],y=js(await i.getClippingRect({element:(n=await(i.isElement==null?void 0:i.isElement(j)))==null||n?j:j.contextElement||await(i.getDocumentElement==null?void 0:i.getDocumentElement(c.floating)),boundary:u,rootBoundary:f,strategy:o})),g=p==="floating"?{x:a,y:l,width:r.floating.width,height:r.floating.height}:r.reference,b=await(i.getOffsetParent==null?void 0:i.getOffsetParent(c.floating)),_=await(i.isElement==null?void 0:i.isElement(b))?await(i.getScale==null?void 0:i.getScale(b))||{x:1,y:1}:{x:1,y:1},T=js(i.convertOffsetParentRelativeRectToViewportRelativeRect?await i.convertOffsetParentRelativeRectToViewportRelativeRect({elements:c,rect:g,offsetParent:b,strategy:o}):g);return{top:(y.top-T.top+v.top)/_.y,bottom:(T.bottom-y.bottom+v.bottom)/_.y,left:(y.left-T.left+v.left)/_.x,right:(T.right-y.right+v.right)/_.x}}const a1=async(e,t,n)=>{const{placement:a="bottom",strategy:l="absolute",middleware:i=[],platform:r}=n,c=i.filter(Boolean),o=await(r.isRTL==null?void 0:r.isRTL(t));let u=await r.getElementRects({reference:e,floating:t,strategy:l}),{x:f,y:p}=Eg(u,a,o),d=a,m={},v=0;for(let j=0;j<c.length;j++){var S;const{name:y,fn:g}=c[j],{x:b,y:_,data:T,reset:O}=await g({x:f,y:p,initialPlacement:a,placement:d,strategy:l,middlewareData:m,rects:u,platform:{...r,detectOverflow:(S=r.detectOverflow)!=null?S:n1},elements:{reference:e,floating:t}});f=b??f,p=_??p,m={...m,[y]:{...m[y],...T}},O&&v<=50&&(v++,typeof O=="object"&&(O.placement&&(d=O.placement),O.rects&&(u=O.rects===!0?await r.getElementRects({reference:e,floating:t,strategy:l}):O.rects),{x:f,y:p}=Eg(u,d,o)),j=-1)}return{x:f,y:p,placement:d,strategy:l,middlewareData:m}},l1=e=>({name:"arrow",options:e,async fn(t){const{x:n,y:a,placement:l,rects:i,platform:r,elements:c,middlewareData:o}=t,{element:u,padding:f=0}=gn(e,t)||{};if(u==null)return{};const p=wg(f),d={x:n,y:a},m=Gu(l),v=$u(m),S=await r.getDimensions(u),j=m==="y",y=j?"top":"left",g=j?"bottom":"right",b=j?"clientHeight":"clientWidth",_=i.reference[v]+i.reference[m]-d[m]-i.floating[v],T=d[m]-i.reference[m],O=await(r.getOffsetParent==null?void 0:r.getOffsetParent(u));let w=O?O[b]:0;(!w||!await(r.isElement==null?void 0:r.isElement(O)))&&(w=c.floating[b]||i.floating[v]);const z=_/2-T/2,R=w/2-S[v]/2-1,L=Pn(p[y],R),ee=Pn(p[g],R),B=L,X=w-S[v]-ee,Q=w/2-S[v]/2+z,k=Bu(B,Q,X),E=!o.arrow&&Sl(l)!=null&&Q!==k&&i.reference[v]/2-(Q<B?L:ee)-S[v]/2<0,M=E?Q<B?Q-B:Q-X:0;return{[m]:d[m]+M,data:{[m]:k,centerOffset:Q-k-M,...E&&{alignmentOffset:M}},reset:E}}}),i1=function(e){return e===void 0&&(e={}),{name:"flip",options:e,async fn(t){var n,a;const{placement:l,middlewareData:i,rects:r,initialPlacement:c,platform:o,elements:u}=t,{mainAxis:f=!0,crossAxis:p=!0,fallbackPlacements:d,fallbackStrategy:m="bestFit",fallbackAxisSideDirection:v="none",flipAlignment:S=!0,...j}=gn(e,t);if((n=i.arrow)!=null&&n.alignmentOffset)return{};const y=yn(l),g=Qt(c),b=yn(c)===c,_=await(o.isRTL==null?void 0:o.isRTL(u.floating)),T=d||(b||!S?[Ns(c)]:Jx(c)),O=v!=="none";!d&&O&&T.push(...e1(c,S,v,_));const w=[c,...T],z=await o.detectOverflow(t,j),R=[];let L=((a=i.flip)==null?void 0:a.overflows)||[];if(f&&R.push(z[y]),p){const Q=Fx(l,r,_);R.push(z[Q[0]],z[Q[1]])}if(L=[...L,{placement:l,overflows:R}],!R.every(Q=>Q<=0)){var ee,B;const Q=(((ee=i.flip)==null?void 0:ee.index)||0)+1,k=w[Q];if(k&&(!(p==="alignment"?g!==Qt(k):!1)||L.every(D=>Qt(D.placement)===g?D.overflows[0]>0:!0)))return{data:{index:Q,overflows:L},reset:{placement:k}};let E=(B=L.filter(M=>M.overflows[0]<=0).sort((M,D)=>M.overflows[1]-D.overflows[1])[0])==null?void 0:B.placement;if(!E)switch(m){case"bestFit":{var X;const M=(X=L.filter(D=>{if(O){const Y=Qt(D.placement);return Y===g||Y==="y"}return!0}).map(D=>[D.placement,D.overflows.filter(Y=>Y>0).reduce((Y,G)=>Y+G,0)]).sort((D,Y)=>D[1]-Y[1])[0])==null?void 0:X[0];M&&(E=M);break}case"initialPlacement":E=c;break}if(l!==E)return{reset:{placement:E}}}return{}}}};function Ag(e,t){return{top:e.top-t.height,right:e.right-t.width,bottom:e.bottom-t.height,left:e.left-t.width}}function Tg(e){return Xx.some(t=>e[t]>=0)}const r1=function(e){return e===void 0&&(e={}),{name:"hide",options:e,async fn(t){const{rects:n,platform:a}=t,{strategy:l="referenceHidden",...i}=gn(e,t);switch(l){case"referenceHidden":{const r=await a.detectOverflow(t,{...i,elementContext:"reference"}),c=Ag(r,n.reference);return{data:{referenceHiddenOffsets:c,referenceHidden:Tg(c)}}}case"escaped":{const r=await a.detectOverflow(t,{...i,altBoundary:!0}),c=Ag(r,n.floating);return{data:{escapedOffsets:c,escaped:Tg(c)}}}default:return{}}}}},Cg=new Set(["left","top"]);async function s1(e,t){const{placement:n,platform:a,elements:l}=e,i=await(a.isRTL==null?void 0:a.isRTL(l.floating)),r=yn(n),c=Sl(n),o=Qt(n)==="y",u=Cg.has(r)?-1:1,f=i&&o?-1:1,p=gn(t,e);let{mainAxis:d,crossAxis:m,alignmentAxis:v}=typeof p=="number"?{mainAxis:p,crossAxis:0,alignmentAxis:null}:{mainAxis:p.mainAxis||0,crossAxis:p.crossAxis||0,alignmentAxis:p.alignmentAxis};return c&&typeof v=="number"&&(m=c==="end"?v*-1:v),o?{x:m*f,y:d*u}:{x:d*u,y:m*f}}const c1=function(e){return e===void 0&&(e=0),{name:"offset",options:e,async fn(t){var n,a;const{x:l,y:i,placement:r,middlewareData:c}=t,o=await s1(t,e);return r===((n=c.offset)==null?void 0:n.placement)&&(a=c.arrow)!=null&&a.alignmentOffset?{}:{x:l+o.x,y:i+o.y,data:{...o,placement:r}}}}},o1=function(e){return e===void 0&&(e={}),{name:"shift",options:e,async fn(t){const{x:n,y:a,placement:l,platform:i}=t,{mainAxis:r=!0,crossAxis:c=!1,limiter:o={fn:y=>{let{x:g,y:b}=y;return{x:g,y:b}}},...u}=gn(e,t),f={x:n,y:a},p=await i.detectOverflow(t,u),d=Qt(yn(l)),m=Yu(d);let v=f[m],S=f[d];if(r){const y=m==="y"?"top":"left",g=m==="y"?"bottom":"right",b=v+p[y],_=v-p[g];v=Bu(b,v,_)}if(c){const y=d==="y"?"top":"left",g=d==="y"?"bottom":"right",b=S+p[y],_=S-p[g];S=Bu(b,S,_)}const j=o.fn({...t,[m]:v,[d]:S});return{...j,data:{x:j.x-n,y:j.y-a,enabled:{[m]:r,[d]:c}}}}}},u1=function(e){return e===void 0&&(e={}),{options:e,fn(t){const{x:n,y:a,placement:l,rects:i,middlewareData:r}=t,{offset:c=0,mainAxis:o=!0,crossAxis:u=!0}=gn(e,t),f={x:n,y:a},p=Qt(l),d=Yu(p);let m=f[d],v=f[p];const S=gn(c,t),j=typeof S=="number"?{mainAxis:S,crossAxis:0}:{mainAxis:0,crossAxis:0,...S};if(o){const b=d==="y"?"height":"width",_=i.reference[d]-i.floating[b]+j.mainAxis,T=i.reference[d]+i.reference[b]-j.mainAxis;m<_?m=_:m>T&&(m=T)}if(u){var y,g;const b=d==="y"?"width":"height",_=Cg.has(yn(l)),T=i.reference[p]-i.floating[b]+(_&&((y=r.offset)==null?void 0:y[p])||0)+(_?0:j.crossAxis),O=i.reference[p]+i.reference[b]+(_?0:((g=r.offset)==null?void 0:g[p])||0)-(_?j.crossAxis:0);v<T?v=T:v>O&&(v=O)}return{[d]:m,[p]:v}}}},d1=function(e){return e===void 0&&(e={}),{name:"size",options:e,async fn(t){var n,a;const{placement:l,rects:i,platform:r,elements:c}=t,{apply:o=()=>{},...u}=gn(e,t),f=await r.detectOverflow(t,u),p=yn(l),d=Sl(l),m=Qt(l)==="y",{width:v,height:S}=i.floating;let j,y;p==="top"||p==="bottom"?(j=p,y=d===(await(r.isRTL==null?void 0:r.isRTL(c.floating))?"start":"end")?"left":"right"):(y=p,j=d==="end"?"top":"bottom");const g=S-f.top-f.bottom,b=v-f.left-f.right,_=Pn(S-f[j],g),T=Pn(v-f[y],b),O=!t.middlewareData.shift;let w=_,z=T;if((n=t.middlewareData.shift)!=null&&n.enabled.x&&(z=b),(a=t.middlewareData.shift)!=null&&a.enabled.y&&(w=g),O&&!d){const L=vt(f.left,0),ee=vt(f.right,0),B=vt(f.top,0),X=vt(f.bottom,0);m?z=v-2*(L!==0||ee!==0?L+ee:vt(f.left,f.right)):w=S-2*(B!==0||X!==0?B+X:vt(f.top,f.bottom))}await o({...t,availableWidth:z,availableHeight:w});const R=await r.getDimensions(c.floating);return v!==R.width||S!==R.height?{reset:{rects:!0}}:{}}}};function ws(){return typeof window<"u"}function _l(e){return Og(e)?(e.nodeName||"").toLowerCase():"#document"}function bt(e){var t;return(e==null||(t=e.ownerDocument)==null?void 0:t.defaultView)||window}function Zt(e){var t;return(t=(Og(e)?e.ownerDocument:e.document)||window.document)==null?void 0:t.documentElement}function Og(e){return ws()?e instanceof Node||e instanceof bt(e).Node:!1}function Ut(e){return ws()?e instanceof Element||e instanceof bt(e).Element:!1}function Kt(e){return ws()?e instanceof HTMLElement||e instanceof bt(e).HTMLElement:!1}function Dg(e){return!ws()||typeof ShadowRoot>"u"?!1:e instanceof ShadowRoot||e instanceof bt(e).ShadowRoot}const p1=new Set(["inline","contents"]);function Ri(e){const{overflow:t,overflowX:n,overflowY:a,display:l}=kt(e);return/auto|scroll|overlay|hidden|clip/.test(t+a+n)&&!p1.has(l)}const f1=new Set(["table","td","th"]);function m1(e){return f1.has(_l(e))}const h1=[":popover-open",":modal"];function Es(e){return h1.some(t=>{try{return e.matches(t)}catch{return!1}})}const g1=["transform","translate","scale","rotate","perspective"],y1=["transform","translate","scale","rotate","perspective","filter"],v1=["paint","layout","strict","content"];function Vu(e){const t=Xu(),n=Ut(e)?kt(e):e;return g1.some(a=>n[a]?n[a]!=="none":!1)||(n.containerType?n.containerType!=="normal":!1)||!t&&(n.backdropFilter?n.backdropFilter!=="none":!1)||!t&&(n.filter?n.filter!=="none":!1)||y1.some(a=>(n.willChange||"").includes(a))||v1.some(a=>(n.contain||"").includes(a))}function b1(e){let t=Wn(e);for(;Kt(t)&&!Nl(t);){if(Vu(t))return t;if(Es(t))return null;t=Wn(t)}return null}function Xu(){return typeof CSS>"u"||!CSS.supports?!1:CSS.supports("-webkit-backdrop-filter","none")}const x1=new Set(["html","body","#document"]);function Nl(e){return x1.has(_l(e))}function kt(e){return bt(e).getComputedStyle(e)}function As(e){return Ut(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function Wn(e){if(_l(e)==="html")return e;const t=e.assignedSlot||e.parentNode||Dg(e)&&e.host||Zt(e);return Dg(t)?t.host:t}function zg(e){const t=Wn(e);return Nl(t)?e.ownerDocument?e.ownerDocument.body:e.body:Kt(t)&&Ri(t)?t:zg(t)}function Ui(e,t,n){var a;t===void 0&&(t=[]),n===void 0&&(n=!0);const l=zg(e),i=l===((a=e.ownerDocument)==null?void 0:a.body),r=bt(l);if(i){const c=Qu(r);return t.concat(r,r.visualViewport||[],Ri(l)?l:[],c&&n?Ui(c):[])}return t.concat(l,Ui(l,[],n))}function Qu(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function Mg(e){const t=kt(e);let n=parseFloat(t.width)||0,a=parseFloat(t.height)||0;const l=Kt(e),i=l?e.offsetWidth:n,r=l?e.offsetHeight:a,c=Ss(n)!==i||Ss(a)!==r;return c&&(n=i,a=r),{width:n,height:a,$:c}}function Zu(e){return Ut(e)?e:e.contextElement}function jl(e){const t=Zu(e);if(!Kt(t))return Xt(1);const n=t.getBoundingClientRect(),{width:a,height:l,$:i}=Mg(t);let r=(i?Ss(n.width):n.width)/a,c=(i?Ss(n.height):n.height)/l;return(!r||!Number.isFinite(r))&&(r=1),(!c||!Number.isFinite(c))&&(c=1),{x:r,y:c}}const S1=Xt(0);function Rg(e){const t=bt(e);return!Xu()||!t.visualViewport?S1:{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}}function _1(e,t,n){return t===void 0&&(t=!1),!n||t&&n!==bt(e)?!1:t}function Ea(e,t,n,a){t===void 0&&(t=!1),n===void 0&&(n=!1);const l=e.getBoundingClientRect(),i=Zu(e);let r=Xt(1);t&&(a?Ut(a)&&(r=jl(a)):r=jl(e));const c=_1(i,n,a)?Rg(i):Xt(0);let o=(l.left+c.x)/r.x,u=(l.top+c.y)/r.y,f=l.width/r.x,p=l.height/r.y;if(i){const d=bt(i),m=a&&Ut(a)?bt(a):a;let v=d,S=Qu(v);for(;S&&a&&m!==v;){const j=jl(S),y=S.getBoundingClientRect(),g=kt(S),b=y.left+(S.clientLeft+parseFloat(g.paddingLeft))*j.x,_=y.top+(S.clientTop+parseFloat(g.paddingTop))*j.y;o*=j.x,u*=j.y,f*=j.x,p*=j.y,o+=b,u+=_,v=bt(S),S=Qu(v)}}return js({width:f,height:p,x:o,y:u})}function Ts(e,t){const n=As(e).scrollLeft;return t?t.left+n:Ea(Zt(e)).left+n}function Ug(e,t){const n=e.getBoundingClientRect(),a=n.left+t.scrollLeft-Ts(e,n),l=n.top+t.scrollTop;return{x:a,y:l}}function N1(e){let{elements:t,rect:n,offsetParent:a,strategy:l}=e;const i=l==="fixed",r=Zt(a),c=t?Es(t.floating):!1;if(a===r||c&&i)return n;let o={scrollLeft:0,scrollTop:0},u=Xt(1);const f=Xt(0),p=Kt(a);if((p||!p&&!i)&&((_l(a)!=="body"||Ri(r))&&(o=As(a)),Kt(a))){const m=Ea(a);u=jl(a),f.x=m.x+a.clientLeft,f.y=m.y+a.clientTop}const d=r&&!p&&!i?Ug(r,o):Xt(0);return{width:n.width*u.x,height:n.height*u.y,x:n.x*u.x-o.scrollLeft*u.x+f.x+d.x,y:n.y*u.y-o.scrollTop*u.y+f.y+d.y}}function j1(e){return Array.from(e.getClientRects())}function w1(e){const t=Zt(e),n=As(e),a=e.ownerDocument.body,l=vt(t.scrollWidth,t.clientWidth,a.scrollWidth,a.clientWidth),i=vt(t.scrollHeight,t.clientHeight,a.scrollHeight,a.clientHeight);let r=-n.scrollLeft+Ts(e);const c=-n.scrollTop;return kt(a).direction==="rtl"&&(r+=vt(t.clientWidth,a.clientWidth)-l),{width:l,height:i,x:r,y:c}}const kg=25;function E1(e,t){const n=bt(e),a=Zt(e),l=n.visualViewport;let i=a.clientWidth,r=a.clientHeight,c=0,o=0;if(l){i=l.width,r=l.height;const f=Xu();(!f||f&&t==="fixed")&&(c=l.offsetLeft,o=l.offsetTop)}const u=Ts(a);if(u<=0){const f=a.ownerDocument,p=f.body,d=getComputedStyle(p),m=f.compatMode==="CSS1Compat"&&parseFloat(d.marginLeft)+parseFloat(d.marginRight)||0,v=Math.abs(a.clientWidth-p.clientWidth-m);v<=kg&&(i-=v)}else u<=kg&&(i+=u);return{width:i,height:r,x:c,y:o}}const A1=new Set(["absolute","fixed"]);function T1(e,t){const n=Ea(e,!0,t==="fixed"),a=n.top+e.clientTop,l=n.left+e.clientLeft,i=Kt(e)?jl(e):Xt(1),r=e.clientWidth*i.x,c=e.clientHeight*i.y,o=l*i.x,u=a*i.y;return{width:r,height:c,x:o,y:u}}function Lg(e,t,n){let a;if(t==="viewport")a=E1(e,n);else if(t==="document")a=w1(Zt(e));else if(Ut(t))a=T1(t,n);else{const l=Rg(e);a={x:t.x-l.x,y:t.y-l.y,width:t.width,height:t.height}}return js(a)}function Hg(e,t){const n=Wn(e);return n===t||!Ut(n)||Nl(n)?!1:kt(n).position==="fixed"||Hg(n,t)}function C1(e,t){const n=t.get(e);if(n)return n;let a=Ui(e,[],!1).filter(c=>Ut(c)&&_l(c)!=="body"),l=null;const i=kt(e).position==="fixed";let r=i?Wn(e):e;for(;Ut(r)&&!Nl(r);){const c=kt(r),o=Vu(r);!o&&c.position==="fixed"&&(l=null),(i?!o&&!l:!o&&c.position==="static"&&!!l&&A1.has(l.position)||Ri(r)&&!o&&Hg(e,r))?a=a.filter(f=>f!==r):l=c,r=Wn(r)}return t.set(e,a),a}function O1(e){let{element:t,boundary:n,rootBoundary:a,strategy:l}=e;const r=[...n==="clippingAncestors"?Es(t)?[]:C1(t,this._c):[].concat(n),a],c=r[0],o=r.reduce((u,f)=>{const p=Lg(t,f,l);return u.top=vt(p.top,u.top),u.right=Pn(p.right,u.right),u.bottom=Pn(p.bottom,u.bottom),u.left=vt(p.left,u.left),u},Lg(t,c,l));return{width:o.right-o.left,height:o.bottom-o.top,x:o.left,y:o.top}}function D1(e){const{width:t,height:n}=Mg(e);return{width:t,height:n}}function z1(e,t,n){const a=Kt(t),l=Zt(t),i=n==="fixed",r=Ea(e,!0,i,t);let c={scrollLeft:0,scrollTop:0};const o=Xt(0);function u(){o.x=Ts(l)}if(a||!a&&!i)if((_l(t)!=="body"||Ri(l))&&(c=As(t)),a){const m=Ea(t,!0,i,t);o.x=m.x+t.clientLeft,o.y=m.y+t.clientTop}else l&&u();i&&!a&&l&&u();const f=l&&!a&&!i?Ug(l,c):Xt(0),p=r.left+c.scrollLeft-o.x-f.x,d=r.top+c.scrollTop-o.y-f.y;return{x:p,y:d,width:r.width,height:r.height}}function Ku(e){return kt(e).position==="static"}function Bg(e,t){if(!Kt(e)||kt(e).position==="fixed")return null;if(t)return t(e);let n=e.offsetParent;return Zt(e)===n&&(n=n.ownerDocument.body),n}function Yg(e,t){const n=bt(e);if(Es(e))return n;if(!Kt(e)){let l=Wn(e);for(;l&&!Nl(l);){if(Ut(l)&&!Ku(l))return l;l=Wn(l)}return n}let a=Bg(e,t);for(;a&&m1(a)&&Ku(a);)a=Bg(a,t);return a&&Nl(a)&&Ku(a)&&!Vu(a)?n:a||b1(e)||n}const M1=async function(e){const t=this.getOffsetParent||Yg,n=this.getDimensions,a=await n(e.floating);return{reference:z1(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:a.width,height:a.height}}};function R1(e){return kt(e).direction==="rtl"}const U1={convertOffsetParentRelativeRectToViewportRelativeRect:N1,getDocumentElement:Zt,getClippingRect:O1,getOffsetParent:Yg,getElementRects:M1,getClientRects:j1,getDimensions:D1,getScale:jl,isElement:Ut,isRTL:R1};function $g(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}function k1(e,t){let n=null,a;const l=Zt(e);function i(){var c;clearTimeout(a),(c=n)==null||c.disconnect(),n=null}function r(c,o){c===void 0&&(c=!1),o===void 0&&(o=1),i();const u=e.getBoundingClientRect(),{left:f,top:p,width:d,height:m}=u;if(c||t(),!d||!m)return;const v=_s(p),S=_s(l.clientWidth-(f+d)),j=_s(l.clientHeight-(p+m)),y=_s(f),b={rootMargin:-v+"px "+-S+"px "+-j+"px "+-y+"px",threshold:vt(0,Pn(1,o))||1};let _=!0;function T(O){const w=O[0].intersectionRatio;if(w!==o){if(!_)return r();w?r(!1,w):a=setTimeout(()=>{r(!1,1e-7)},1e3)}w===1&&!$g(u,e.getBoundingClientRect())&&r(),_=!1}try{n=new IntersectionObserver(T,{...b,root:l.ownerDocument})}catch{n=new IntersectionObserver(T,b)}n.observe(e)}return r(!0),i}function L1(e,t,n,a){a===void 0&&(a={});const{ancestorScroll:l=!0,ancestorResize:i=!0,elementResize:r=typeof ResizeObserver=="function",layoutShift:c=typeof IntersectionObserver=="function",animationFrame:o=!1}=a,u=Zu(e),f=l||i?[...u?Ui(u):[],...Ui(t)]:[];f.forEach(y=>{l&&y.addEventListener("scroll",n,{passive:!0}),i&&y.addEventListener("resize",n)});const p=u&&c?k1(u,n):null;let d=-1,m=null;r&&(m=new ResizeObserver(y=>{let[g]=y;g&&g.target===u&&m&&(m.unobserve(t),cancelAnimationFrame(d),d=requestAnimationFrame(()=>{var b;(b=m)==null||b.observe(t)})),n()}),u&&!o&&m.observe(u),m.observe(t));let v,S=o?Ea(e):null;o&&j();function j(){const y=Ea(e);S&&!$g(S,y)&&n(),S=y,v=requestAnimationFrame(j)}return n(),()=>{var y;f.forEach(g=>{l&&g.removeEventListener("scroll",n),i&&g.removeEventListener("resize",n)}),p==null||p(),(y=m)==null||y.disconnect(),m=null,o&&cancelAnimationFrame(v)}}const H1=c1,B1=o1,Y1=i1,$1=d1,G1=r1,Gg=l1,q1=u1,V1=(e,t,n)=>{const a=new Map,l={platform:U1,...n},i={...l.platform,_c:a};return a1(e,t,{...l,platform:i})};var X1=typeof document<"u",Q1=function(){},Cs=X1?x.useLayoutEffect:Q1;function Os(e,t){if(e===t)return!0;if(typeof e!=typeof t)return!1;if(typeof e=="function"&&e.toString()===t.toString())return!0;let n,a,l;if(e&&t&&typeof e=="object"){if(Array.isArray(e)){if(n=e.length,n!==t.length)return!1;for(a=n;a--!==0;)if(!Os(e[a],t[a]))return!1;return!0}if(l=Object.keys(e),n=l.length,n!==Object.keys(t).length)return!1;for(a=n;a--!==0;)if(!{}.hasOwnProperty.call(t,l[a]))return!1;for(a=n;a--!==0;){const i=l[a];if(!(i==="_owner"&&e.$$typeof)&&!Os(e[i],t[i]))return!1}return!0}return e!==e&&t!==t}function qg(e){return typeof window>"u"?1:(e.ownerDocument.defaultView||window).devicePixelRatio||1}function Vg(e,t){const n=qg(e);return Math.round(t*n)/n}function Fu(e){const t=x.useRef(e);return Cs(()=>{t.current=e}),t}function Z1(e){e===void 0&&(e={});const{placement:t="bottom",strategy:n="absolute",middleware:a=[],platform:l,elements:{reference:i,floating:r}={},transform:c=!0,whileElementsMounted:o,open:u}=e,[f,p]=x.useState({x:0,y:0,strategy:n,placement:t,middlewareData:{},isPositioned:!1}),[d,m]=x.useState(a);Os(d,a)||m(a);const[v,S]=x.useState(null),[j,y]=x.useState(null),g=x.useCallback(D=>{D!==O.current&&(O.current=D,S(D))},[]),b=x.useCallback(D=>{D!==w.current&&(w.current=D,y(D))},[]),_=i||v,T=r||j,O=x.useRef(null),w=x.useRef(null),z=x.useRef(f),R=o!=null,L=Fu(o),ee=Fu(l),B=Fu(u),X=x.useCallback(()=>{if(!O.current||!w.current)return;const D={placement:t,strategy:n,middleware:d};ee.current&&(D.platform=ee.current),V1(O.current,w.current,D).then(Y=>{const G={...Y,isPositioned:B.current!==!1};Q.current&&!Os(z.current,G)&&(z.current=G,cc.flushSync(()=>{p(G)}))})},[d,t,n,ee,B]);Cs(()=>{u===!1&&z.current.isPositioned&&(z.current.isPositioned=!1,p(D=>({...D,isPositioned:!1})))},[u]);const Q=x.useRef(!1);Cs(()=>(Q.current=!0,()=>{Q.current=!1}),[]),Cs(()=>{if(_&&(O.current=_),T&&(w.current=T),_&&T){if(L.current)return L.current(_,T,X);X()}},[_,T,X,L,R]);const k=x.useMemo(()=>({reference:O,floating:w,setReference:g,setFloating:b}),[g,b]),E=x.useMemo(()=>({reference:_,floating:T}),[_,T]),M=x.useMemo(()=>{const D={position:n,left:0,top:0};if(!E.floating)return D;const Y=Vg(E.floating,f.x),G=Vg(E.floating,f.y);return c?{...D,transform:"translate("+Y+"px, "+G+"px)",...qg(E.floating)>=1.5&&{willChange:"transform"}}:{position:n,left:Y,top:G}},[n,c,E.floating,f.x,f.y]);return x.useMemo(()=>({...f,update:X,refs:k,elements:E,floatingStyles:M}),[f,X,k,E,M])}const K1=e=>{function t(n){return{}.hasOwnProperty.call(n,"current")}return{name:"arrow",options:e,fn(n){const{element:a,padding:l}=typeof e=="function"?e(n):e;return a&&t(a)?a.current!=null?Gg({element:a.current,padding:l}).fn(n):{}:a?Gg({element:a,padding:l}).fn(n):{}}}},F1=(e,t)=>({...H1(e),options:[e,t]}),J1=(e,t)=>({...B1(e),options:[e,t]}),P1=(e,t)=>({...q1(e),options:[e,t]}),W1=(e,t)=>({...Y1(e),options:[e,t]}),I1=(e,t)=>({...$1(e),options:[e,t]}),e2=(e,t)=>({...G1(e),options:[e,t]}),t2=(e,t)=>({...K1(e),options:[e,t]});var n2="Arrow",Xg=x.forwardRef((e,t)=>{const{children:n,width:a=10,height:l=5,...i}=e;return s.jsx(wa.svg,{...i,ref:t,width:a,height:l,viewBox:"0 0 30 10",preserveAspectRatio:"none",children:e.asChild?n:s.jsx("polygon",{points:"0,0 30,0 15,10"})})});Xg.displayName=n2;var a2=Xg;function l2(e){const[t,n]=x.useState(void 0);return Mi(()=>{if(e){n({width:e.offsetWidth,height:e.offsetHeight});const a=new ResizeObserver(l=>{if(!Array.isArray(l)||!l.length)return;const i=l[0];let r,c;if("borderBoxSize"in i){const o=i.borderBoxSize,u=Array.isArray(o)?o[0]:o;r=u.inlineSize,c=u.blockSize}else r=e.offsetWidth,c=e.offsetHeight;n({width:r,height:c})});return a.observe(e,{box:"border-box"}),()=>a.unobserve(e)}else n(void 0)},[e]),t}var Qg="Popper",[Zg,Kg]=yg(Qg),[jN,Fg]=Zg(Qg),Jg="PopperAnchor",Pg=x.forwardRef((e,t)=>{const{__scopePopper:n,virtualRef:a,...l}=e,i=Fg(Jg,n),r=x.useRef(null),c=ja(t,r),o=x.useRef(null);return x.useEffect(()=>{const u=o.current;o.current=(a==null?void 0:a.current)||r.current,u!==o.current&&i.onAnchorChange(o.current)}),a?null:s.jsx(wa.div,{...l,ref:c})});Pg.displayName=Jg;var Ju="PopperContent",[i2,r2]=Zg(Ju),Wg=x.forwardRef((e,t)=>{var U,ae,$,ne,ce,$e;const{__scopePopper:n,side:a="bottom",sideOffset:l=0,align:i="center",alignOffset:r=0,arrowPadding:c=0,avoidCollisions:o=!0,collisionBoundary:u=[],collisionPadding:f=0,sticky:p="partial",hideWhenDetached:d=!1,updatePositionStrategy:m="optimized",onPlaced:v,...S}=e,j=Fg(Ju,n),[y,g]=x.useState(null),b=ja(t,Ge=>g(Ge)),[_,T]=x.useState(null),O=l2(_),w=(O==null?void 0:O.width)??0,z=(O==null?void 0:O.height)??0,R=a+(i!=="center"?"-"+i:""),L=typeof f=="number"?f:{top:0,right:0,bottom:0,left:0,...f},ee=Array.isArray(u)?u:[u],B=ee.length>0,X={padding:L,boundary:ee.filter(c2),altBoundary:B},{refs:Q,floatingStyles:k,placement:E,isPositioned:M,middlewareData:D}=Z1({strategy:"fixed",placement:R,whileElementsMounted:(...Ge)=>L1(...Ge,{animationFrame:m==="always"}),elements:{reference:j.anchor},middleware:[F1({mainAxis:l+z,alignmentAxis:r}),o&&J1({mainAxis:!0,crossAxis:!1,limiter:p==="partial"?P1():void 0,...X}),o&&W1({...X}),I1({...X,apply:({elements:Ge,rects:Ne,availableWidth:rt,availableHeight:Fe})=>{const{width:na,height:aa}=Ne.reference,st=Ge.floating.style;st.setProperty("--radix-popper-available-width",`${rt}px`),st.setProperty("--radix-popper-available-height",`${Fe}px`),st.setProperty("--radix-popper-anchor-width",`${na}px`),st.setProperty("--radix-popper-anchor-height",`${aa}px`)}}),_&&t2({element:_,padding:c}),o2({arrowWidth:w,arrowHeight:z}),d&&e2({strategy:"referenceHidden",...X})]}),[Y,G]=t0(E),Ke=xs(v);Mi(()=>{M&&(Ke==null||Ke())},[M,Ke]);const it=(U=D.arrow)==null?void 0:U.x,xt=(ae=D.arrow)==null?void 0:ae.y,Ye=(($=D.arrow)==null?void 0:$.centerOffset)!==0,[C,q]=x.useState();return Mi(()=>{y&&q(window.getComputedStyle(y).zIndex)},[y]),s.jsx("div",{ref:Q.setFloating,"data-radix-popper-content-wrapper":"",style:{...k,transform:M?k.transform:"translate(0, -200%)",minWidth:"max-content",zIndex:C,"--radix-popper-transform-origin":[(ne=D.transformOrigin)==null?void 0:ne.x,(ce=D.transformOrigin)==null?void 0:ce.y].join(" "),...(($e=D.hide)==null?void 0:$e.referenceHidden)&&{visibility:"hidden",pointerEvents:"none"}},dir:e.dir,children:s.jsx(i2,{scope:n,placedSide:Y,onArrowChange:T,arrowX:it,arrowY:xt,shouldHideArrow:Ye,children:s.jsx(wa.div,{"data-side":Y,"data-align":G,...S,ref:b,style:{...S.style,animation:M?void 0:"none"}})})})});Wg.displayName=Ju;var Ig="PopperArrow",s2={top:"bottom",right:"left",bottom:"top",left:"right"},e0=x.forwardRef(function(t,n){const{__scopePopper:a,...l}=t,i=r2(Ig,a),r=s2[i.placedSide];return s.jsx("span",{ref:i.onArrowChange,style:{position:"absolute",left:i.arrowX,top:i.arrowY,[r]:0,transformOrigin:{top:"",right:"0 0",bottom:"center 0",left:"100% 0"}[i.placedSide],transform:{top:"translateY(100%)",right:"translateY(50%) rotate(90deg) translateX(-50%)",bottom:"rotate(180deg)",left:"translateY(50%) rotate(-90deg) translateX(50%)"}[i.placedSide],visibility:i.shouldHideArrow?"hidden":void 0},children:s.jsx(a2,{...l,ref:n,style:{...l.style,display:"block"}})})});e0.displayName=Ig;function c2(e){return e!==null}var o2=e=>({name:"transformOrigin",options:e,fn(t){var j,y,g;const{placement:n,rects:a,middlewareData:l}=t,r=((j=l.arrow)==null?void 0:j.centerOffset)!==0,c=r?0:e.arrowWidth,o=r?0:e.arrowHeight,[u,f]=t0(n),p={start:"0%",center:"50%",end:"100%"}[f],d=(((y=l.arrow)==null?void 0:y.x)??0)+c/2,m=(((g=l.arrow)==null?void 0:g.y)??0)+o/2;let v="",S="";return u==="bottom"?(v=r?p:`${d}px`,S=`${-o}px`):u==="top"?(v=r?p:`${d}px`,S=`${a.floating.height+o}px`):u==="right"?(v=`${-o}px`,S=r?p:`${m}px`):u==="left"&&(v=`${a.floating.width+o}px`,S=r?p:`${m}px`),{data:{x:v,y:S}}}});function t0(e){const[t,n="center"]=e.split("-");return[t,n]}var u2=Pg,d2=Wg,p2=e0;function f2(e,t){return x.useReducer((n,a)=>t[n][a]??n,e)}var n0=e=>{const{present:t,children:n}=e,a=m2(t),l=typeof n=="function"?n({present:a.isPresent}):x.Children.only(n),i=ja(a.ref,h2(l));return typeof n=="function"||a.isPresent?x.cloneElement(l,{ref:i}):null};n0.displayName="Presence";function m2(e){const[t,n]=x.useState(),a=x.useRef(null),l=x.useRef(e),i=x.useRef("none"),r=e?"mounted":"unmounted",[c,o]=f2(r,{mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}});return x.useEffect(()=>{const u=Ds(a.current);i.current=c==="mounted"?u:"none"},[c]),Mi(()=>{const u=a.current,f=l.current;if(f!==e){const d=i.current,m=Ds(u);e?o("MOUNT"):m==="none"||(u==null?void 0:u.display)==="none"?o("UNMOUNT"):o(f&&d!==m?"ANIMATION_OUT":"UNMOUNT"),l.current=e}},[e,o]),Mi(()=>{if(t){let u;const f=t.ownerDocument.defaultView??window,p=m=>{const S=Ds(a.current).includes(CSS.escape(m.animationName));if(m.target===t&&S&&(o("ANIMATION_END"),!l.current)){const j=t.style.animationFillMode;t.style.animationFillMode="forwards",u=f.setTimeout(()=>{t.style.animationFillMode==="forwards"&&(t.style.animationFillMode=j)})}},d=m=>{m.target===t&&(i.current=Ds(a.current))};return t.addEventListener("animationstart",d),t.addEventListener("animationcancel",p),t.addEventListener("animationend",p),()=>{f.clearTimeout(u),t.removeEventListener("animationstart",d),t.removeEventListener("animationcancel",p),t.removeEventListener("animationend",p)}}else o("ANIMATION_END")},[t,o]),{isPresent:["mounted","unmountSuspended"].includes(c),ref:x.useCallback(u=>{a.current=u?getComputedStyle(u):null,n(u)},[])}}function Ds(e){return(e==null?void 0:e.animationName)||"none"}function h2(e){var a,l;let t=(a=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:a.get,n=t&&"isReactWarning"in t&&t.isReactWarning;return n?e.ref:(t=(l=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:l.get,n=t&&"isReactWarning"in t&&t.isReactWarning,n?e.props.ref:e.props.ref||e.ref)}var g2=Symbol("radix.slottable");function y2(e){const t=({children:n})=>s.jsx(s.Fragment,{children:n});return t.displayName=`${e}.Slottable`,t.__radixId=g2,t}var v2=Object.freeze({position:"absolute",border:0,width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0, 0, 0, 0)",whiteSpace:"nowrap",wordWrap:"normal"}),b2="VisuallyHidden",a0=x.forwardRef((e,t)=>s.jsx(wa.span,{...e,ref:t,style:{...v2,...e.style}}));a0.displayName=b2;var x2=a0,[zs,wN]=yg("Tooltip",[Kg]),Pu=Kg(),l0="TooltipProvider",S2=700,i0="tooltip.open",[_2,r0]=zs(l0),s0=e=>{const{__scopeTooltip:t,delayDuration:n=S2,skipDelayDuration:a=300,disableHoverableContent:l=!1,children:i}=e,r=x.useRef(!0),c=x.useRef(!1),o=x.useRef(0);return x.useEffect(()=>{const u=o.current;return()=>window.clearTimeout(u)},[]),s.jsx(_2,{scope:t,isOpenDelayedRef:r,delayDuration:n,onOpen:x.useCallback(()=>{window.clearTimeout(o.current),r.current=!1},[]),onClose:x.useCallback(()=>{window.clearTimeout(o.current),o.current=window.setTimeout(()=>r.current=!0,a)},[a]),isPointerInTransitRef:c,onPointerInTransitChange:x.useCallback(u=>{c.current=u},[]),disableHoverableContent:l,children:i})};s0.displayName=l0;var c0="Tooltip",[EN,Ms]=zs(c0),Wu="TooltipTrigger",N2=x.forwardRef((e,t)=>{const{__scopeTooltip:n,...a}=e,l=Ms(Wu,n),i=r0(Wu,n),r=Pu(n),c=x.useRef(null),o=ja(t,c,l.onTriggerChange),u=x.useRef(!1),f=x.useRef(!1),p=x.useCallback(()=>u.current=!1,[]);return x.useEffect(()=>()=>document.removeEventListener("pointerup",p),[p]),s.jsx(u2,{asChild:!0,...r,children:s.jsx(wa.button,{"aria-describedby":l.open?l.contentId:void 0,"data-state":l.stateAttribute,...a,ref:o,onPointerMove:xl(e.onPointerMove,d=>{d.pointerType!=="touch"&&!f.current&&!i.isPointerInTransitRef.current&&(l.onTriggerEnter(),f.current=!0)}),onPointerLeave:xl(e.onPointerLeave,()=>{l.onTriggerLeave(),f.current=!1}),onPointerDown:xl(e.onPointerDown,()=>{l.open&&l.onClose(),u.current=!0,document.addEventListener("pointerup",p,{once:!0})}),onFocus:xl(e.onFocus,()=>{u.current||l.onOpen()}),onBlur:xl(e.onBlur,l.onClose),onClick:xl(e.onClick,l.onClose)})})});N2.displayName=Wu;var j2="TooltipPortal",[AN,w2]=zs(j2,{forceMount:void 0}),wl="TooltipContent",E2=x.forwardRef((e,t)=>{const n=w2(wl,e.__scopeTooltip),{forceMount:a=n.forceMount,side:l="top",...i}=e,r=Ms(wl,e.__scopeTooltip);return s.jsx(n0,{present:a||r.open,children:r.disableHoverableContent?s.jsx(o0,{side:l,...i,ref:t}):s.jsx(A2,{side:l,...i,ref:t})})}),A2=x.forwardRef((e,t)=>{const n=Ms(wl,e.__scopeTooltip),a=r0(wl,e.__scopeTooltip),l=x.useRef(null),i=ja(t,l),[r,c]=x.useState(null),{trigger:o,onClose:u}=n,f=l.current,{onPointerInTransitChange:p}=a,d=x.useCallback(()=>{c(null),p(!1)},[p]),m=x.useCallback((v,S)=>{const j=v.currentTarget,y={x:v.clientX,y:v.clientY},g=z2(y,j.getBoundingClientRect()),b=M2(y,g),_=R2(S.getBoundingClientRect()),T=k2([...b,..._]);c(T),p(!0)},[p]);return x.useEffect(()=>()=>d(),[d]),x.useEffect(()=>{if(o&&f){const v=j=>m(j,f),S=j=>m(j,o);return o.addEventListener("pointerleave",v),f.addEventListener("pointerleave",S),()=>{o.removeEventListener("pointerleave",v),f.removeEventListener("pointerleave",S)}}},[o,f,m,d]),x.useEffect(()=>{if(r){const v=S=>{const j=S.target,y={x:S.clientX,y:S.clientY},g=(o==null?void 0:o.contains(j))||(f==null?void 0:f.contains(j)),b=!U2(y,r);g?d():b&&(d(),u())};return document.addEventListener("pointermove",v),()=>document.removeEventListener("pointermove",v)}},[o,f,r,u,d]),s.jsx(o0,{...e,ref:i})}),[T2,C2]=zs(c0,{isInside:!1}),O2=y2("TooltipContent"),o0=x.forwardRef((e,t)=>{const{__scopeTooltip:n,children:a,"aria-label":l,onEscapeKeyDown:i,onPointerDownOutside:r,...c}=e,o=Ms(wl,n),u=Pu(n),{onClose:f}=o;return x.useEffect(()=>(document.addEventListener(i0,f),()=>document.removeEventListener(i0,f)),[f]),x.useEffect(()=>{if(o.trigger){const p=d=>{const m=d.target;m!=null&&m.contains(o.trigger)&&f()};return window.addEventListener("scroll",p,{capture:!0}),()=>window.removeEventListener("scroll",p,{capture:!0})}},[o.trigger,f]),s.jsx(xg,{asChild:!0,disableOutsidePointerEvents:!1,onEscapeKeyDown:i,onPointerDownOutside:r,onFocusOutside:p=>p.preventDefault(),onDismiss:f,children:s.jsxs(d2,{"data-state":o.stateAttribute,...u,...c,ref:t,style:{...c.style,"--radix-tooltip-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-tooltip-content-available-width":"var(--radix-popper-available-width)","--radix-tooltip-content-available-height":"var(--radix-popper-available-height)","--radix-tooltip-trigger-width":"var(--radix-popper-anchor-width)","--radix-tooltip-trigger-height":"var(--radix-popper-anchor-height)"},children:[s.jsx(O2,{children:a}),s.jsx(T2,{scope:n,isInside:!0,children:s.jsx(x2,{id:o.contentId,role:"tooltip",children:l||a})})]})})});E2.displayName=wl;var u0="TooltipArrow",D2=x.forwardRef((e,t)=>{const{__scopeTooltip:n,...a}=e,l=Pu(n);return C2(u0,n).isInside?null:s.jsx(p2,{...l,...a,ref:t})});D2.displayName=u0;function z2(e,t){const n=Math.abs(t.top-e.y),a=Math.abs(t.bottom-e.y),l=Math.abs(t.right-e.x),i=Math.abs(t.left-e.x);switch(Math.min(n,a,l,i)){case i:return"left";case l:return"right";case n:return"top";case a:return"bottom";default:throw new Error("unreachable")}}function M2(e,t,n=5){const a=[];switch(t){case"top":a.push({x:e.x-n,y:e.y+n},{x:e.x+n,y:e.y+n});break;case"bottom":a.push({x:e.x-n,y:e.y-n},{x:e.x+n,y:e.y-n});break;case"left":a.push({x:e.x+n,y:e.y-n},{x:e.x+n,y:e.y+n});break;case"right":a.push({x:e.x-n,y:e.y-n},{x:e.x-n,y:e.y+n});break}return a}function R2(e){const{top:t,right:n,bottom:a,left:l}=e;return[{x:l,y:t},{x:n,y:t},{x:n,y:a},{x:l,y:a}]}function U2(e,t){const{x:n,y:a}=e;let l=!1;for(let i=0,r=t.length-1;i<t.length;r=i++){const c=t[i],o=t[r],u=c.x,f=c.y,p=o.x,d=o.y;f>a!=d>a&&n<(p-u)*(a-f)/(d-f)+u&&(l=!l)}return l}function k2(e){const t=e.slice();return t.sort((n,a)=>n.x<a.x?-1:n.x>a.x?1:n.y<a.y?-1:n.y>a.y?1:0),L2(t)}function L2(e){if(e.length<=1)return e.slice();const t=[];for(let a=0;a<e.length;a++){const l=e[a];for(;t.length>=2;){const i=t[t.length-1],r=t[t.length-2];if((i.x-r.x)*(l.y-r.y)>=(i.y-r.y)*(l.x-r.x))t.pop();else break}t.push(l)}t.pop();const n=[];for(let a=e.length-1;a>=0;a--){const l=e[a];for(;n.length>=2;){const i=n[n.length-1],r=n[n.length-2];if((i.x-r.x)*(l.y-r.y)>=(i.y-r.y)*(l.x-r.x))n.pop();else break}n.push(l)}return n.pop(),t.length===1&&n.length===1&&t[0].x===n[0].x&&t[0].y===n[0].y?t:t.concat(n)}function H2(){if(typeof window>"u")return;const e=window.$v;if(typeof e=="function")try{return e("APP_USER")||void 0}catch{return}}function B2(){if(typeof window>"u")return{};const e=window,t={...e.__SPC_PD_PIR_CONFIG__??{}};for(const[n,a]of Object.entries(e.__APP_CONFIG__??{}))a!=null&&a!==""&&(t[n]=a);return t}function _e(){const e=B2();return{proposal_id:e.proposal_id??0,app_user:e.app_user??"",api_endpoint:(e.api_endpoint??"").toString().replace(/\/+$/,""),ajaxId:e.ajaxId,flowId:e.flowId,stepId:e.stepId,instance:e.instance,viaAiBrain:e.viaAiBrain,dev_token:e.dev_token,spc_type_id:e.spc_type_id,spc_type_template_id:e.spc_type_template_id??e.template_type_id,created_by:e.created_by,role:e.role,user_email:e.user_email||e.app_user||H2()}}function In(e=_e()){return{role:e.role||void 0,user_email:e.user_email||e.app_user||void 0}}function Iu(e=_e()){const t=In(e);return["role","user_email"].filter(n=>!t[n])}function Y2(e=_e()){const{role:t,user_email:n}=In(e),a=(t??"").split(",").map(l=>l.trim()).filter(Boolean);return{role:t,role_header_present:!!t,role_grant_count:a.length,grants:a,rls_grants:a.filter(l=>l.toUpperCase().includes("_RLS_")),user_email:n}}function ki(e){const t=Number(e.proposal_id);return Number.isFinite(t)&&t>0}function $2(e){return e.spc_type_id!=null&&e.spc_type_id!==""&&e.spc_type_template_id!=null&&e.spc_type_template_id!==""}async function at(e){{if(!e.ajaxId||!e.flowId||!e.stepId||!e.instance)throw new Error("Missing APEX context (ajaxId, flowId, stepId, instance) in window.__APP_CONFIG__");const t=new FormData;t.append("p_request","PLUGIN="+e.ajaxId),t.append("p_flow_id",e.flowId),t.append("p_flow_step_id",e.stepId),t.append("p_instance",e.instance),t.append("p_debug","");const n=window.location.href.includes("/r/")?window.location.href.split("/r/")[0]+"/wwv_flow.ajax":window.location.origin+"/ords/wwv_flow.ajax",a=await fetch(n,{method:"POST",body:t,credentials:"include"});if(!a.ok)throw new Error(`Auth token call failed: ${a.status} ${a.statusText}`);const l=JSON.parse(await a.text());return{accessToken:l.accessToken,token_type:l.token_type,expiration_time:l.expiration_time,app_user:l.app_user}}}function lt(e){return"accessToken"in e?e.accessToken:e.token}const Li=3e5,G2=Li;function El(e){if(e.trim())try{const t=JSON.parse(e),n=t.apiMessage??t.api_message??t.message??t.error_message;return typeof n=="string"&&n.trim()?n:void 0}catch{return}}let d0=!1;function q2(e){d0||e.length===0||(d0=!0,console.error(`[http] window.__APP_CONFIG__ is missing ${e.join(" and ")} — these are sent as request headers and the ORDS endpoints reject the call (403 "not authorised") without them. The APEX plugin must populate them from the signed-in user; see index.html for the shape.`))}async function ea(e,t,n=G2,a,l){const i=new AbortController,r=Math.round(n/1e3),c=setTimeout(()=>i.abort(new DOMException(`Request timed out after ${r}s`,"TimeoutError")),n),o=In(l),u=Iu(l);q2(u);const f={Accept:"application/json",Authorization:`Bearer ${t}`};for(const[m,v]of Object.entries({...o,...a}))v!=null&&(f[m]=String(v));let p;try{p=await fetch(e,{headers:f,signal:i.signal})}catch(m){if(i.signal.aborted){const v=i.signal.reason,S=v instanceof Error||v instanceof DOMException?v.message:`Request timed out after ${r}s`;throw new Error(S)}throw m instanceof Error?m:new Error(String(m))}finally{clearTimeout(c)}const d=await p.text();if(!p.ok){const m=p.status===403&&u.length>0?` — sent without ${u.join(" and ")}; set ${u.join(" / ")} in window.__APP_CONFIG__`:"",v=El(d);throw new Error(`${v||`HTTP ${p.status}: ${p.statusText}${d?` — ${d.slice(0,300)}`:""}`}${m}`)}if(!d.trim())return{};try{return JSON.parse(d)}catch{throw new Error(`Expected JSON from ${e} but received a non-JSON response: ${d.slice(0,200)}`)}}const V2=150,ed=new Set;let Rs=0;const td=new Map;let Us=!1,ks=new Set,nd;const X2=()=>{if(nd=void 0,Us)Rs+=1,console.log(`[Refresh] re-reading all APIs (v${Rs})`);else{for(const e of ks)td.set(e,(td.get(e)??0)+1);console.log(`[Refresh] re-reading scoped APIs: ${[...ks].join(", ")}`)}Us=!1,ks=new Set;for(const e of[...ed])e()};function Hi(e,t){if(e&&console.log(`[Refresh] data changed by ${e}${t?` (scope: ${t.join(", ")})`:""}`),!t||t.length===0)Us=!0;else if(!Us)for(const n of t)ks.add(n);clearTimeout(nd),nd=setTimeout(X2,V2)}function Q2(e){return ed.add(e),()=>{ed.delete(e)}}function Z2(e){return e?Rs+(td.get(e)??0):Rs}function Aa(e){const t=()=>Z2(e);return x.useSyncExternalStore(Q2,t,t)}const K2=e=>{const t=e;for(const n of["fin_eval_section_id","FIN_EVAL_SECTION_ID","section_id","SECTION_ID"]){const a=t[n];if(a!=null&&a!==""&&Number.isFinite(Number(a)))return Number(a)}return null},F2=()=>{const e=new Date;return e.getMonth()+1>=4?e.getFullYear()+1:e.getFullYear()},J2=e=>{const t=e.match(/^fy(\d{2})$/i);return t!=null&&2e3+Number(t[1])>F2()},p0=["purple","blue","green","pink","orange"],Ls=e=>{if(e==null)return"-";if(e===0)return"0";const t=Math.round(Math.abs(e)).toLocaleString("en-US");return e<0?`(${t})`:t},f0=e=>{if(e==null)return{text:"-",tone:"none"};if(e===0)return{text:"0",tone:"none"};const t=Math.round(Math.abs(e)).toLocaleString("en-US");return e<0?{text:`(${t})`,tone:"red"}:{text:t,tone:"green"}},P2=()=>({spc:"",ytd:"",ytdLinked:!1,ytdTone:"none",variance:"",varianceTone:"none",spcNum:null,ytdNum:null,varianceNum:null}),W2=e=>Array.from({length:e},()=>P2()),m0=e=>{const t=e??{spc_projected:null,ytd_actuals_forecast:null,variance:null},n=f0(t.variance),a=Ls(t.ytd_actuals_forecast),l=t.ytd_actuals_forecast,i=l==null||l===0?"none":l<0?"red":"green";return{spc:Ls(t.spc_projected),ytd:a,ytdLinked:a!=="-"&&a!=="0",ytdTone:i,variance:n.text,varianceTone:n.tone,spcNum:t.spc_projected,ytdNum:t.ytd_actuals_forecast,varianceNum:t.variance}},ad=(e,t)=>e==null?t:t==null?e:e+t,I2=(e,t)=>{const n=ad(e.spcNum,t.spcNum),a=ad(e.ytdNum,t.ytdNum),l=ad(e.varianceNum,t.varianceNum),i=f0(l);return{spc:Ls(n),ytd:Ls(a),ytdLinked:e.ytdLinked||t.ytdLinked,ytdTone:a==null||a===0?"none":a<0?"red":"green",variance:i.text,varianceTone:i.tone,spcNum:n,ytdNum:a,varianceNum:l}},eS=e=>{const t=[],n=new Map;for(const a of e){if(!a.isAdjustment){t.push(a);continue}const l=a.label.trim().toLowerCase(),i=n.get(l);if(!i){const r={...a};n.set(l,r),t.push(r);continue}i.cells=i.cells.map((r,c)=>I2(r,a.cells[c]))}return t};function tS(e){var c,o;const t=((c=e==null?void 0:e.data)==null?void 0:c.fiscal_years)??[],n=((o=e==null?void 0:e.data)==null?void 0:o.sections)??[],l=n.some(u=>{var f,p;return((p=(f=u.subtotal)==null?void 0:f.fy_data)==null?void 0:p.total)!=null||(u.lines??[]).some(d=>{var m;return((m=d.fy_data)==null?void 0:m.total)!=null})})?[...t,"total"]:t,i=l.map((u,f)=>{const p=u==="total";return{key:u,label:p?"TOTAL":u.toUpperCase(),tone:p?"total":p0[f%p0.length],isTotal:p}}),r=[...n].sort((u,f)=>(u.display_order??0)-(f.display_order??0)).map(u=>{var m;const f=eS([...u.lines??[]].sort((v,S)=>(v.display_order??0)-(S.display_order??0)).map((v,S)=>{const j=String(v.is_section_adj??"").toUpperCase()==="Y";return{id:v.fin_eval_line_id!=null&&v.fin_eval_line_id!==""?`line-${v.fin_eval_line_id}`:`line-${u.section_type}-${u.display_order}-${S}`,label:v.item_description||v.account||"Line Item",type:"line",account:v.account,finEvalLineId:v.fin_eval_line_id??null,isAdjustment:j,cells:l.map(g=>{var b;return m0((b=v.fy_data)==null?void 0:b[g])})}})),p={id:`new-${u.section_type}-${u.display_order}`,label:"+ Add New Line",type:"new",cells:W2(l.length)},d={id:`subtotal-${u.section_type}-${u.display_order}`,label:((m=u.subtotal)==null?void 0:m.label)??`Subtotal ${u.section_name}`,type:"subtotal",cells:l.map(v=>{var S,j;return m0((j=(S=u.subtotal)==null?void 0:S.fy_data)==null?void 0:j[v])})};return{finEvalSectionId:K2(u),title:u.section_name,rows:[...f,p,d]}});return{years:i,sections:r}}const nS="/GIS/PIR/forecastsActualsComparision";function aS(e){if(!e.api_endpoint)throw new Error("Missing api_endpoint in window.__APP_CONFIG__");return`${e.api_endpoint}${nS}`}function lS(e,t){const n=t??e.proposal_id;return{proposal_id:Number.isFinite(Number(n))&&Number(n)>0?n:"",spc_type_id:e.spc_type_id,spc_type_template_id:e.spc_type_template_id}}function ld(){var n;const e=typeof window<"u"?(n=window.__APP_CONFIG__)==null?void 0:n.dev_token:void 0,t={BASE_URL:"/",MODE:"production",DEV:!1,PROD:!0,SSR:!1}.VITE_PIR_TOKEN;return e||t}const h0=e=>e.trim().toLowerCase();function iS(e){var a,l;const t=e==null?void 0:e.data;if(t==null)return[];const n=[(a=t==null?void 0:t.items)==null?void 0:a.sections,Array.isArray(t)?(l=t[0])==null?void 0:l.sections:void 0,t==null?void 0:t.sections];for(const i of n)if(Array.isArray(i))return i;return[]}async function g0(e){const t=new Map,n=e.proposal_id;if(!Number.isFinite(Number(n))||Number(n)<=0)return t;const a="/GIS/proposalAuthoring/financialEvaluation";if(!e.api_endpoint)throw new Error("Missing api_endpoint in window.__APP_CONFIG__");const l=`${e.api_endpoint}${a}`,i=new URLSearchParams({proposal_id:String(n)});e.spc_type_id!=null&&e.spc_type_id!==""&&i.set("spc_type_id",String(e.spc_type_id)),e.spc_type_template_id!=null&&e.spc_type_template_id!==""&&i.set("template_type_id",String(e.spc_type_template_id));const r=`${l}?${i.toString()}`;try{const o=ld()||lt(await at(e)),u=await ea(r,o,void 0,void 0,e);for(const f of iS(u)){const p=Number(f==null?void 0:f.fin_eval_section_id),d=f==null?void 0:f.section_name;d&&Number.isFinite(p)&&p>0&&t.set(h0(d),p)}}catch(c){const o=Iu(e);console.warn("[SectionIds] financialEvaluation lookup failed — sections load without fin_eval_section_id, so posting adjustments will fail."+(o.length>0?` Cause: ${o.join(" and ")} missing from window.__APP_CONFIG__.`:""),c)}return console.log("[SectionIds] section_name → fin_eval_section_id",Object.fromEntries(t)),t}function y0(e,t){return t.size===0?e:{...e,sections:e.sections.map(n=>n.finEvalSectionId!=null?n:{...n,finEvalSectionId:t.get(h0(n.title))??null})}}async function v0(e,t){const a=ld()||lt(await at(e)),l=aS(e),i=lS(e,t),r=await ea(l,a,void 0,i,e);return console.log("[ForecastActuals] request",{url:l,headers:i}),console.log("[ForecastActuals] response",r),tS(r)}async function rS(e,t,n){if(n.length===0)return;const a=Number(e.proposal_id);if(!Number.isFinite(a)||a<=0)throw new Error("A valid proposal_id is required to save forecast values");const l=new Map(n.map(v=>[`${v.rowId}::${v.fiscalYear}`,v.value])),i=t.sections.filter(v=>v.finEvalSectionId!=null).map(v=>({fin_eval_section_id:v.finEvalSectionId,lines:v.rows.filter(S=>S.type==="line"&&!S.isAdjustment&&S.finEvalLineId!=null).map(S=>({fin_eval_line_id:S.finEvalLineId,account:S.account??null,year_values:Object.fromEntries(t.years.map((j,y)=>{const g=S.cells[y],b=`${S.id}::${j.key}`,_k1000=v=>v==null?null:Number((v/1e3).toFixed(6)),_={spc_projected_amount:_k1000(g.spcNum),variance:_k1000(g.varianceNum)};return l.has(b)?_.ytd_actuals=l.get(b)??null:_.ytd_actuals=_k1000(g.ytdNum),[j.key,_]}))}))})),r=`${e.api_endpoint}/GIS/proposalAuthoring/${a}/financialEvaluation`,u={"Content-Type":"application/json",Authorization:`Bearer ${ld()||lt(await at(e))}`,language:"EN"};for(const[v,S]of Object.entries(In(e)))S!=null&&(u[v]=String(S));const f=JSON.stringify({sections:i});console.log("[ForecastActuals] PUT",r),console.log("[ForecastActuals] PUT headers",u),console.log(`[ForecastActuals] PUT body
`+JSON.stringify({sections:i},null,2));const p=await fetch(r,{method:"PUT",headers:u,body:f}),d=await p.text().catch(()=>"");if(console.log("[ForecastActuals] PUT response",p.status,d),!p.ok)throw new Error(El(d)||`HTTP ${p.status}: ${p.statusText}${d?` — ${d.slice(0,300)}`:""}`);let m;try{const v=d.trim()?JSON.parse(d):{};if(v.apiStatus&&v.apiStatus.toUpperCase()!=="S")throw new Error(v.apiMessage||`Save rejected (apiStatus "${v.apiStatus}")`);m=v.apiMessage}catch(v){if(!(v instanceof SyntaxError))throw v}return Hi("PUT financialEvaluation (future forecasts)"),m}function sS(e){return e.adjustment_level==="SECTION"?["kpi","snapshots","forecastActuals"]:["drilldown","unmapped","forecastActuals"]}const cS={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12},oS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function uS(e){const t=Number(e);if(!Number.isFinite(t)||t<190001)return"";const n=Math.floor(t/100),a=t%100;return a<1||a>12?"":`${oS[a-1]} ${n}`}function id(e){const t=(e||"").trim();if(!t)return null;const n=t.match(/^(\d{4})[-/]?(\d{2})$/);if(n)return+`${n[1]}${n[2]}`;const a=t.toLowerCase().match(/[a-z]{3,}/),l=t.match(/\d{2,4}/);if(!a||!l)return null;const i=cS[a[0].slice(0,3)];if(!i)return null;let r=Number(l[0]);return r<100&&(r+=2e3),r*100+i}const dS="/GIS/PIR/adjustments";function b0(e){if(!e.api_endpoint)throw new Error("Missing api_endpoint in window.__APP_CONFIG__");return`${e.api_endpoint}${dS}`}function x0(){var n;const e=typeof window<"u"?(n=window.__APP_CONFIG__)==null?void 0:n.dev_token:void 0,t={BASE_URL:"/",MODE:"production",DEV:!1,PROD:!0,SSR:!1}.VITE_PIR_TOKEN;return e||t}const vn=e=>e==null?"":String(e),pS=e=>{const t=Number(e);return Number.isFinite(t)?t:0},Lt=(e,...t)=>{for(const n of t)if(e[n]!=null)return e[n]};function fS(e){const t=(e==null?void 0:e.items)??(e==null?void 0:e.out_cursor)??[];return Array.isArray(t)?t.map((n,a)=>{const l=vn(Lt(n,"adjustment_type","scenario","ADJUSTMENT_TYPE","SCENARIO")).toUpperCase(),i=/FORECAST|BUDGET/.test(l)?"FORECAST":"ACTUALS",r=vn(Lt(n,"dr_cr","drcr","DR_CR")).toUpperCase(),c=Lt(n,"yearperiod","year_period","period","YEARPERIOD"),o=vn(Lt(n,"month","month_label","period_label","MONTH"))||uS(c);return{id:vn(Lt(n,"adjustment_id","id","ADJUSTMENT_ID"))||`adj-api-${a}`,scenario:i,month:o,drCr:r==="CR"?"Cr":"Dr",gl:vn(Lt(n,"gl_string","account_code","gl","GL_STRING","ACCOUNT_CODE"))||"—",desc:vn(Lt(n,"description","desc","DESCRIPTION"))||"Manual adjustment",amount:Math.abs(pS(Lt(n,"amount","AMOUNT"))),account:vn(Lt(n,"account_code","account","ACCOUNT_CODE"))||void 0}}):[]}async function mS(e,t,n){const l=x0()||lt(await at(e)),i=b0(e),r={fy:t,proposal_id:n},c=await ea(i,l,void 0,r,e);return console.log("[Adjustments] request",{url:i,headers:r}),console.log("[Adjustments] response",c),fS(c)}async function S0(e,t){const l={"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${x0()||lt(await at(e))}`};for(const[d,m]of Object.entries(In(e)))m!=null&&(l[d]=String(m));const i=b0(e),r=JSON.stringify(t);console.log("[Adjustments] POST",i),console.log(`[Adjustments] POST body
`+JSON.stringify(t,null,2)),console.log(`[Adjustments] curl:
curl --location '${i}' \\
  --header 'Content-Type: application/json' \\
`+Object.entries(l).filter(([d])=>d!=="Content-Type"&&d!=="Accept").map(([d,m])=>`  --header '${d}: ${m}' \\
`).join("")+`  --data '${r}'`);const c=new AbortController,o=setTimeout(()=>c.abort(new DOMException("Request timed out after 5 minutes","TimeoutError")),Li);let u;try{u=await fetch(i,{method:"POST",headers:l,body:r,signal:c.signal})}catch(d){if(c.signal.aborted){const m=c.signal.reason;throw new Error(m instanceof Error||m instanceof DOMException?m.message:"Request timed out after 5 minutes")}throw d instanceof Error?d:new Error(String(d))}finally{clearTimeout(o)}if(!u.ok){const d=await u.text().catch(()=>"");throw console.error("[Adjustments] POST failed",u.status,d),new Error(El(d)||`HTTP ${u.status}: ${u.statusText}${d?` — ${d}`:""}`)}const f=await u.text().catch(()=>"");let p;try{const d=f.trim()?JSON.parse(f):{},m=vn(Lt(d,"apiStatus","api_status","status")).toUpperCase();if(p=vn(Lt(d,"apiMessage","api_message","message"))||void 0,m&&m!=="S"&&m!=="SUCCESS")throw new Error(p||"Adjustment rejected by server.")}catch(d){if(!(d instanceof SyntaxError))throw d}return console.log("[Adjustments] POST ok",u.status,f),Hi("POST adjustments",sS(t)),p}function Hs({kind:e,messages:t,onClose:n,autoDismissMs:a}){if(x.useEffect(()=>{if(t.length===0||!a)return;const i=window.setTimeout(n,a);return()=>window.clearTimeout(i)},[t,a]),t.length===0)return null;const l=e==="error";return s.jsxs("div",{className:`pir-pd-status-banner pir-pd-status-banner-${e}`,role:l?"alert":"status",children:[s.jsxs("div",{className:"pir-pd-status-banner-header",children:[s.jsx("span",{className:"pir-pd-status-banner-icon","aria-hidden":"true",children:l?"⚠":"✓"}),s.jsx("span",{className:"pir-pd-status-banner-title",children:l?`${t.length} error${t.length===1?"":"s"} has occurred`:t[0]}),s.jsx("button",{type:"button",className:"pir-pd-status-banner-close",onClick:n,"aria-label":"Close",children:"×"})]}),l&&s.jsx("ul",{className:"pir-pd-status-banner-list",children:t.map((i,r)=>s.jsx("li",{children:i},r))}),s.jsx("style",{children:`
        .pir-pd-status-banner {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 600;
          min-width: 320px;
          max-width: 440px;
          border-radius: 8px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16);
          padding: 14px 16px;
        }
        .pir-pd-status-banner-error {
          background: #fdf6e3;
          border: 1px solid #f2d492;
        }
        .pir-pd-status-banner-success {
          background: #eafbea;
          border: 1px solid #a7e3ab;
        }
        .pir-pd-status-banner-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pir-pd-status-banner-icon {
          font-size: 16px;
          line-height: 1;
        }
        .pir-pd-status-banner-error .pir-pd-status-banner-icon,
        .pir-pd-status-banner-error .pir-pd-status-banner-title,
        .pir-pd-status-banner-error .pir-pd-status-banner-close {
          color: #92400e;
        }
        .pir-pd-status-banner-success .pir-pd-status-banner-icon,
        .pir-pd-status-banner-success .pir-pd-status-banner-title,
        .pir-pd-status-banner-success .pir-pd-status-banner-close {
          color: #166534;
        }
        .pir-pd-status-banner-title {
          flex: 1;
          font-weight: 700;
          font-size: 14px;
        }
        .pir-pd-status-banner-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          padding: 0;
        }
        .pir-pd-status-banner-list {
          margin: 8px 0 0;
          padding-left: 18px;
          font-size: 13px;
          color: #78350f;
        }
        .pir-pd-status-banner-list li {
          margin-bottom: 2px;
        }
      `})]})}const bn=[{key:"K",divisor:1e3,name:"Thousands"},{key:"M",divisor:1e6,name:"Millions"},{key:"B",divisor:1e9,name:"Billions"}],Bs=[{key:"us",sample:"1,234,567.89",group:",",decimal:"."},{key:"eu",sample:"1.234.567,89",group:".",decimal:","},{key:"fr",sample:"1 234 567,89",group:" ",decimal:","},{key:"in",sample:"12,34,567.89",group:",",decimal:".",lakh:!0},{key:"ch",sample:"1'234'567.89",group:"'",decimal:"."}],_0=[{key:"dd-mm-yyyy",sample:"dd-mm-yyyy"},{key:"dd/mm/yyyy",sample:"dd/mm/yyyy"},{key:"mm/dd/yyyy",sample:"mm/dd/yyyy"},{key:"dd-Mon-yyyy",sample:"dd-Mon-yyyy"},{key:"yyyy-mm-dd",sample:"yyyy-mm-dd"}],hS={symbol:"$",code:"USD"},gS={USD:"$",EUR:"€",GBP:"£",INR:"₹",JPY:"¥",AUD:"$",CAD:"$",CHF:"CHF",CNY:"¥",SGD:"$"},yS=e=>gS[e.toUpperCase()]??e,Al={scale:"M",number:"us",date:"dd-mm-yyyy"},N0="pir.formatSettings.v2",vS=e=>bn.some(t=>t.key===e),bS=e=>Bs.some(t=>t.key===e),xS=e=>_0.some(t=>t.key===e);function SS(){try{const e=window.localStorage.getItem(N0);if(!e)return Al;const t=JSON.parse(e);return{scale:vS(t.scale)?t.scale:Al.scale,number:bS(t.number)?t.number:Al.number,date:xS(t.date)?t.date:Al.date}}catch{return Al}}const rd=new Set;let Ta=typeof window>"u"?Al:SS();function sd(e){const t={...Ta,...e};if(!(t.scale===Ta.scale&&t.number===Ta.number&&t.date===Ta.date)){Ta=t;try{window.localStorage.setItem(N0,JSON.stringify(Ta))}catch{}for(const n of[...rd])n()}}const _S=e=>sd({scale:e}),NS=e=>sd({number:e}),jS=e=>sd({date:e});function wS(e){return rd.add(e),()=>{rd.delete(e)}}const j0=()=>Ta;function Ys(){return x.useSyncExternalStore(wS,j0,j0)}const cd=new Set;let $s=hS;function ES(e){if(!e||!e.trim())return;const t={symbol:yS(e),code:e.toUpperCase()};if(!(t.symbol===$s.symbol&&t.code===$s.code)){$s=t;for(const n of[...cd])n()}}function AS(e){return cd.add(e),()=>{cd.delete(e)}}const od=()=>$s;function TS(){return x.useSyncExternalStore(AS,od,od)}const ud=e=>bn.find(t=>t.key===e)??bn[0],CS=e=>Bs.find(t=>t.key===e)??Bs[0],dd=e=>({K:0,M:1,B:2})[e],OS=(e,t)=>e.replace(/\B(?=(\d{3})+(?!\d))/g,t),DS=(e,t)=>e.length<=3?e:`${e.slice(0,-3).replace(/\B(?=(\d{2})+(?!\d))/g,t)}${t}${e.slice(-3)}`;function Tl(e,t,n=2){const a=CS(t.number),[l,i]=Math.abs(e).toFixed(n).split("."),r=a.lakh?DS(l,a.group):OS(l,a.group);return i?`${r}${a.decimal}${i}`:r}function zS(e,t,n=dd(t.scale)){if(e==null||!Number.isFinite(e))return"—";const a=ud(t.scale),l=`${Tl(e/a.divisor,t,n)}${a.key}`;return e<0?`(${l})`:l}function pd(e,t,n=dd(t.scale)){if(e==null||!Number.isFinite(e))return"—";const a=ud(t.scale),l=`${od().symbol}${Tl(e/a.divisor,t,n)}${a.key}`;return e<0?`(${l})`:l}function fd(e,t,n=dd(t.scale)){if(e==null||!Number.isFinite(e))return"—";const a=ud(t.scale),l=Tl(e/a.divisor,t,n);return e<0?`(${l})`:l}function w0(e,t,n=1){if(e==null||!Number.isFinite(e))return"—";const a=Tl(e,t,n);return e<0?`(${a})`:a}const MS=(e,t)=>e.replace(/\(\$[KMB]\)/g,`($${t.scale})`),RS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function US(e,t){if(!e)return"";if(!/^\d{4}-\d{2}-\d{2}/.test(e))return e;const n=new Date(e);if(Number.isNaN(n.getTime()))return e;const a=String(n.getUTCDate()).padStart(2,"0"),l=String(n.getUTCMonth()+1).padStart(2,"0"),i=String(n.getUTCFullYear()),r=RS[n.getUTCMonth()];switch(t.date){case"dd/mm/yyyy":return`${a}/${l}/${i}`;case"mm/dd/yyyy":return`${l}/${a}/${i}`;case"dd-Mon-yyyy":return`${a}-${r}-${i}`;case"yyyy-mm-dd":return`${i}-${l}-${a}`;case"dd-mm-yyyy":default:return`${a}-${l}-${i}`}}const kS=e=>{const t=parseInt(e.replace(/\D/g,""),10);return Number.isFinite(t)?2e3+t:null},E0=e=>e.replace(/[^A-Za-z0-9 _-]/g,"").replace(/^\d+/,""),Bi=e=>{let t=e.replace(/[^\d.,-]/g,"");const n=t.startsWith("-");t=t.replace(/-/g,"");const a=t.indexOf(".");return a!==-1&&(t=`${t.slice(0,a+1)}${t.slice(a+1).replace(/\./g,"")}`),n?`-${t}`:t},A0=e=>{const t=e.replace(/[,\s$]/g,"").replace(/^\((.*)\)$/,"-$1");if(!t)return null;const n=Number(t);return Number.isFinite(n)?n:null},LS=()=>{const e=new Date;return e.getMonth()+1>=4?e.getFullYear()+1:e.getFullYear()},md=e=>{const t=e.match(/^fy(\d{2})$/i);return t!=null&&2e3+Number(t[1])>LS()},T0=e=>/%|\brate\b|\bmargin\b|\bpercent\b/i.test(e),hd=(e,t)=>{if(e==null)return"-";const n=e/1e6;return`${Tl(n,t,Number.isInteger(n)?0:1)}%`},HS=(e,t)=>{const n=bn.find(l=>l.key===t.scale)??bn[0],a=t.scale==="K"?0:t.scale==="M"?1:2;return(e/n.divisor).toFixed(a)},BS=(e,t)=>{const n=A0(e),a=bn.find(l=>l.key===t.scale)??bn[0];return n==null?null:n*a.divisor},gd=(e,t,n)=>e==null?t:e===0?"0":zS(e,n),YS={purple:"pir-pd-fy-purple",blue:"pir-pd-fy-blue",green:"pir-pd-fy-green",pink:"pir-pd-fy-pink",orange:"pir-pd-fy-orange",total:"pir-pd-fy-total"};function $S({onActualClick:e}={}){const t=Aa("forecastActuals"),n=Ys(),[a,l]=x.useState(null),[i,r]=x.useState(!0),[c,o]=x.useState(null),[u,f]=x.useState({}),[p,d]=x.useState(!1),[m,v]=x.useState(new Set),[S,j]=x.useState(null),[y,g]=x.useState(null),[b,_]=x.useState([]),[T,O]=x.useState([]),w=x.useRef(null),z=x.useRef(void 0),R=C=>{g(C),window.clearTimeout(z.current),z.current=window.setTimeout(()=>g(null),2800)};x.useEffect(()=>()=>window.clearTimeout(z.current),[]);const L=(C,q)=>{j({sectionIndex:C,label:"",values:Array.from({length:q},()=>"")})},ee=()=>{j(null)},B=(C,q)=>{j(U=>{if(!U)return U;const ae=[...U.values];return ae[C]=q,{...U,values:ae}})},X=(()=>{if(!S||!a)return[];const C=S.label.trim();if(!C)return[];const q=a.sections[S.sectionIndex],U=Number(_e().proposal_id);if(!Number.isFinite(U)||U<=0)return[];const ae=Number(_e().created_by),$=[];return a.years.forEach((ne,ce)=>{if(ne.isTotal)return;const $e=A0(S.values[ce]??""),Ge=kS(ne.key);if($e==null||Ge==null)return;const Ne=md(ne.key);if(Ne&&$e===0)return;const rt=Ne?"FORECAST":"ACTUALS";$.push({proposal_id:U,adjustment_type:rt,adjustment_level:"SECTION",fin_eval_section_id:(q==null?void 0:q.finEvalSectionId)??null,fiscal_year:Ge,description:C,amount:Math.abs($e),...Number.isFinite(ae)&&ae>0?{created_by:ae}:{}})}),$})(),Q=C=>{v(q=>{const U=new Set(q);return U.has(C)?U.delete(C):U.add(C),U})},k=()=>{let C=!1;r(!0),o(null);const q=_e();return Promise.all([v0(q),g0(q)]).then(([U,ae])=>{C||l(y0(U,ae))}).catch(U=>{C||o(U instanceof Error?U.message:"Failed to load report")}).finally(()=>{C||r(!1)}),()=>{C=!0}};x.useEffect(k,[t]);const E=()=>{j(null),f({}),k(),R("↺ Actuals reset to the last saved values")},M=(C,q)=>`${C}::${q}`,D=Object.entries(u).map(([C,q])=>{const[U,ae]=C.split("::");return{rowId:U,fiscalYear:ae,value:(v=>v==null?null:Number((v/1e3).toFixed(6)))(BS(q.t,{scale:q.s}))}}),Y=X.length+D.length,G=async()=>{if(Y===0||!a)return;d(!0);const C=_e();try{const q=[];if(D.length>0){const U=await rS(C,a,D);q.push(U||"Forecast values saved"),f({})}for(const U of X){const ae=await S0(C,U);q.push(ae||"Adjustment created successfully")}j(null),O(q)}catch(q){const U=q instanceof Error?q.message:"Failed to save adjustments";_([U])}finally{d(!1)}},Ke=(C,q)=>{l(U=>U&&{...U,sections:U.sections.map((ae,$)=>$===C?{...ae,title:q}:ae)})},it=(C,q,U)=>{l(ae=>ae&&{...ae,sections:ae.sections.map(($,ne)=>ne!==C?$:{...$,rows:$.rows.map((ce,$e)=>$e===q?{...ce,label:U}:ce)})})},xt=(C,q,U,ae,$)=>{l(ne=>ne&&{...ne,sections:ne.sections.map((ce,$e)=>$e!==C?ce:{...ce,rows:ce.rows.map((Ge,Ne)=>Ne!==q?Ge:{...Ge,cells:Ge.cells.map((rt,Fe)=>Fe===U?{...rt,[ae]:$}:rt)})})})};if(i&&!a)return s.jsx("div",{className:"pir-pd-report-state",children:"Loading Forecast vs Actuals…"});if(c&&!a)return s.jsxs("div",{className:"pir-pd-report-state pir-pd-report-error",children:["Couldn’t load report: ",c]});if(!a)return s.jsx("div",{className:"pir-pd-report-state",children:"No report data available."});const Ye=1+a.years.length*3;return s.jsxs("div",{className:"pir-pd-report-wrap",children:[s.jsx("div",{className:"pir-pd-report-scroll",children:s.jsxs("table",{className:"pir-pd-report-table","aria-label":"Forecast vs Actuals comparison",children:[s.jsxs("thead",{children:[s.jsxs("tr",{children:[s.jsx("th",{className:"pir-pd-item-header",rowSpan:2,children:"ITEM DESCRIPTION"}),a.years.map(C=>s.jsx("th",{className:`pir-pd-year-header ${YS[C.tone]}`,colSpan:3,children:C.label},C.key))]}),s.jsx("tr",{children:a.years.map(C=>s.jsxs(x.Fragment,{children:[s.jsx("th",{className:"pir-pd-metric-header",children:"SPC PROJECTED"}),s.jsx("th",{className:"pir-pd-metric-header",children:"PIR REFORECAST"}),s.jsx("th",{className:"pir-pd-metric-header",children:"VARIANCE"})]},`${C.key}-metrics`))})]}),s.jsx("tbody",{children:a.sections.map((C,q)=>s.jsxs(x.Fragment,{children:[s.jsx("tr",{className:"pir-pd-section-row",children:s.jsx("td",{colSpan:Ye,children:s.jsxs("div",{className:"pir-pd-section-head",children:[s.jsx("button",{type:"button",className:"pir-pd-section-toggle",onClick:()=>Q(q),"aria-expanded":!m.has(q),"aria-label":m.has(q)?"Expand section":"Collapse section",children:s.jsx("span",{className:`pir-pd-section-caret ${m.has(q)?"pir-pd-caret-collapsed":""}`,"aria-hidden":"true",children:"▾"})}),C.editable?s.jsx("input",{className:"pir-pd-section-title-input",value:C.title,onChange:U=>Ke(q,U.target.value),placeholder:"Enter new section name","aria-label":"Section title"}):s.jsx("span",{className:"pir-pd-section-title-text",children:C.title})]})})}),!m.has(q)&&C.rows.map((U,ae)=>U.type==="new"?s.jsxs(x.Fragment,{children:[S&&S.sectionIndex===q&&s.jsxs("tr",{className:"pir-pd-draft-row",onKeyDown:$=>{$.key==="Enter"&&($.preventDefault(),G()),$.key==="Escape"&&($.preventDefault(),ee())},children:[s.jsx("td",{className:"pir-pd-item-cell",children:s.jsx("input",{ref:w,className:"pir-pd-editable-cell-input pir-pd-item-input",value:S.label,onChange:$=>j({...S,label:E0($.target.value)}),placeholder:"Enter line name…",title:"Letters and spaces only","aria-label":"New line name",autoFocus:!0})}),a.years.map(($,ne)=>s.jsxs(x.Fragment,{children:[s.jsx("td",{className:"pir-pd-value-cell pir-pd-draft-muted",children:"–"}),s.jsx("td",{className:"pir-pd-value-cell pir-pd-editable-value-cell",children:$.isTotal?s.jsx("span",{className:"pir-pd-draft-auto",children:"Auto"}):md($.key)?s.jsx("input",{className:"pir-pd-editable-cell-input pir-pd-amount-input",value:"",disabled:!0,readOnly:!0,title:"You cannot add adjustments for future years","aria-label":`${$.label} YTD actuals and forecast`}):s.jsx("input",{className:"pir-pd-editable-cell-input pir-pd-amount-input",value:S.values[ne]??"",onChange:ce=>B(ne,Bi(ce.target.value)),disabled:!S.label.trim(),placeholder:S.label.trim()?"0":"",title:S.label.trim()?"Numbers only":"Enter a line item name to enable this field",inputMode:"decimal","aria-label":`${$.label} YTD actuals and forecast`})}),s.jsx("td",{className:"pir-pd-value-cell pir-pd-draft-muted",children:ne===a.years.length-1?s.jsx("div",{className:"pir-pd-draft-actions",children:s.jsx("button",{type:"button",className:"pir-pd-draft-cancel",onClick:ee,"aria-label":"Cancel new line",title:"Cancel",children:"✕"})}):"–"})]},`draft-${$.key}`))]}),s.jsxs("tr",{className:"pir-pd-new-row",children:[s.jsx("td",{className:"pir-pd-item-cell",children:s.jsx("button",{type:"button",className:"pir-pd-new-line-button",onClick:()=>L(q,a.years.length),children:"+ New Line"})}),s.jsx("td",{className:"pir-pd-value-cell pir-pd-new-row-filler",colSpan:Ye-1})]})]},U.id):s.jsx(x.Fragment,{children:s.jsxs("tr",{className:U.type==="subtotal"?"pir-pd-subtotal-row":U.isAdjustment?"pir-pd-adjustment-row":"",children:[s.jsx("td",{className:"pir-pd-item-cell",children:U.editable?s.jsx("input",{className:"pir-pd-editable-cell-input pir-pd-item-input",value:U.label,onChange:$=>it(q,ae,E0($.target.value)),disabled:!C.title.trim(),placeholder:C.title.trim()?"Enter New Line Item...":"Enter a section name to continue",title:C.title.trim()?"Letters and spaces only":"Enter a section name to enable this field","aria-label":"Line item"}):U.label}),U.cells.map(($,ne)=>U.editable?s.jsxs(x.Fragment,{children:[s.jsx("td",{className:"pir-pd-value-cell pir-pd-editable-value-cell",children:s.jsx("input",{className:"pir-pd-editable-cell-input pir-pd-amount-input",value:$.spc,onChange:ce=>xt(q,ae,ne,"spc",Bi(ce.target.value)),disabled:!U.label.trim(),title:U.label.trim()?"Numbers only":"Enter an item description to enable this field","aria-label":"SPC projected"})}),s.jsx("td",{className:"pir-pd-value-cell pir-pd-editable-value-cell",children:s.jsx("input",{className:"pir-pd-editable-cell-input pir-pd-amount-input",value:$.ytd,onChange:ce=>xt(q,ae,ne,"ytd",Bi(ce.target.value)),disabled:!U.label.trim(),title:U.label.trim()?"Numbers only":"Enter an item description to enable this field","aria-label":"YTD actuals and forecast"})}),s.jsx("td",{className:"pir-pd-value-cell pir-pd-editable-value-cell",children:s.jsx("input",{className:"pir-pd-editable-cell-input pir-pd-amount-input",value:$.variance,onChange:ce=>xt(q,ae,ne,"variance",Bi(ce.target.value)),disabled:!U.label.trim(),title:U.label.trim()?"Numbers only":"Enter an item description to enable this field","aria-label":"Variance"})})]},`${U.id}-${ne}`):(()=>{const ce=a.years[ne].isTotal===!0,$e=ce?" pir-pd-total-cell":"",Ge=C.rows.filter(st=>st.type==="line"),Ne=U.type==="subtotal"?Ge.length>0&&Ge.every(st=>T0(st.label)):T0(U.label),rt=!ce&&!Ne&&U.type==="line"&&!U.isAdjustment&&U.finEvalLineId!=null&&U.finEvalLineId!==""&&md(a.years[ne].key),Fe=M(U.id,a.years[ne].key),na=u[Fe],aa=!ce&&e&&U.finEvalLineId!=null&&U.finEvalLineId!==""&&$.ytd!=="-"&&$.ytd!=="";return s.jsxs(x.Fragment,{children:[s.jsx("td",{className:`pir-pd-value-cell${$e}`,children:Ne?hd($.spcNum,n):gd($.spcNum,$.spc,n)}),s.jsx("td",{className:`pir-pd-value-cell${$e} ${aa&&!rt?"pir-pd-actuals-link-cell":""}`,children:rt?s.jsxs("span",{className:"pir-pd-scaled-input",children:[s.jsx("input",{className:"pir-pd-editable-cell-input pir-pd-amount-input",value:na?(na.s===n.scale||BS(na.t,{scale:na.s})==null?na.t:HS(BS(na.t,{scale:na.s}),n)):($.ytdNum==null?"":HS($.ytdNum,n)),onChange:st=>f(Oa=>({...Oa,[Fe]:{t:Bi(st.target.value),s:n.scale}})),inputMode:"decimal","aria-label":`${a.years[ne].label} YTD actuals and forecast in ${n.scale}`}),s.jsx("span",{className:"pir-pd-scaled-input-unit","aria-hidden":"true",children:n.scale})]}):s.jsx("span",{className:`pir-pd-ytd-${$.ytdTone} ${$.ytdLinked&&!ce?"pir-pd-linked-value":""}`,onClick:aa&&!rt?()=>e==null?void 0:e({id:U.id,finEvalLineId:U.finEvalLineId??null,finEvalSectionId:C.finEvalSectionId??null,account:U.account??"",fy:a.years[ne].key,label:U.label,section:C.title,spc:$.spc,ytd:$.ytd,spcNum:$.spcNum,ytdNum:$.ytdNum}):void 0,title:aa&&!rt?"View actuals drilldown":void 0,children:Ne?hd($.ytdNum,n):gd($.ytdNum,$.ytd,n)})}),s.jsx("td",{className:`pir-pd-value-cell${$e} pir-pd-variance pir-pd-variance-${$.varianceTone}`,children:Ne?hd($.varianceNum,n):gd($.varianceNum,$.variance,n)})]},`${U.id}-${ne}`)})())]})},U.id))]},`${C.title}-${q}`))})]})}),s.jsxs("div",{className:"pir-pd-report-actions",children:[Y>0&&s.jsxs("span",{className:"pir-pd-report-pending",children:[Y," change",Y===1?"":"s"," ready to save"]}),s.jsxs("button",{type:"button",className:"pir-pd-report-reset",onClick:E,disabled:i||p,children:[s.jsx("span",{"aria-hidden":"true",children:"↺"})," Reset Actuals"]}),s.jsxs("button",{type:"button",className:"pir-pd-report-save",onClick:()=>{G()},disabled:i||p||Y===0,title:Y===0?"Edit a future forecast value or add a line to enable saving":void 0,children:[s.jsxs("svg",{width:"15",height:"15",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",children:[s.jsx("path",{d:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"}),s.jsx("polyline",{points:"17 21 17 13 7 13 7 21"}),s.jsx("polyline",{points:"7 3 7 8 15 8"})]}),p?"Saving…":"Save All"]})]}),y&&s.jsx("div",{className:"pir-pd-toast",role:"status",children:y}),s.jsx(Hs,{kind:"error",messages:b,onClose:()=>_([])}),s.jsx(Hs,{kind:"success",messages:T,onClose:()=>O([]),autoDismissMs:5e3}),s.jsx("style",{children:`
        /* ── "+ New Line" row ───────────────────────────────── */
        .pir-pd-new-row .pir-pd-item-cell,
        .pir-pd-new-row .pir-pd-value-cell {
          height: 36px;
          color: #9aa3b2;
          font-weight: 500;
        }

        .pir-pd-new-row:hover .pir-pd-item-cell,
        .pir-pd-new-row:hover .pir-pd-new-row-filler {
          background: #fbfcfe;
        }

        .pir-pd-new-line-button {
          margin: 0;
          padding: 2px 8px;
          border: 1px dashed #c4cbd8;
          border-radius: 4px;
          background: transparent;
          color: #687386;
          font: inherit;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-new-line-button:hover {
          border-color: #1D2C4D;
          color: #1D2C4D;
          background: #dde2ec69;
        }

        /* ── Inline draft row ───────────────────────────────── */
        .pir-pd-draft-row .pir-pd-item-cell,
        .pir-pd-draft-row .pir-pd-value-cell {
          background: #dde2ec69;
          color: #1D2C4D;
        }

        .pir-pd-draft-row .pir-pd-editable-cell-input {
          border-color: #cdd6ea;
          background: #ffffff;
        }

        .pir-pd-draft-muted {
          color: #b3bccb;
          font-style: italic;
        }

        .pir-pd-draft-auto {
          color: #b3bccb;
          font-style: italic;
        }

        .pir-pd-draft-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
        }

        .pir-pd-draft-cancel {
          padding: 3px 8px;
          border-radius: 4px;
          background: #ffffff;
          color: #687386;
          border: 1px solid #e6e9ee;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .pir-pd-draft-cancel:hover { color: #001a3b; background: #f4f6f9; }

        /* ── "Section Adjustments" row (is_section_adj = "Y") ─
           Same metrics as a normal line — only the tint marks it apart. */
        .pir-pd-adjustment-row .pir-pd-item-cell,
        .pir-pd-adjustment-row .pir-pd-value-cell {
          background: #dde2ec69;
          color: #1D2C4D;
        }

        /* ── Footer actions ─────────────────────────────────── */
        .pir-pd-report-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 14px 20px;
          background: #f7f8fa;
          border-top: 1px solid #e6e9ee;
        }

        .pir-pd-report-pending {
          margin-right: auto;
          font-size: 13px;
          color: #687386;
        }

        .pir-pd-report-save-error {
          margin-right: auto;
          font-size: 13px;
          font-weight: 600;
          color: red;
        }

        .pir-pd-report-reset,
        .pir-pd-report-save {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          padding: 0 20px;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-report-reset {
          border: 1px solid #d5dbe7;
          background: #ffffff;
          color: #1D2C4D;
        }

        .pir-pd-report-reset:hover:not(:disabled) {
          background: #eef1f5;
          border-color: #c4cbd8;
        }

        .pir-pd-report-save {
          border: 1px solid #d5dbe7;
          background: #ffffff;
          color: #1D2C4D;
        }

        .pir-pd-report-save:hover:not(:disabled) {
          background: #eef1f5;
          border-color: #c4cbd8;
        }

        .pir-pd-report-reset:disabled,
        .pir-pd-report-save:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* ── Toast ──────────────────────────────────────────── */
        .pir-pd-toast {
          position: fixed;
          right: 24px;
          top: 24px;
          z-index: 500;
          max-width: 420px;
          padding: 12px 18px;
          border-radius: 8px;
          background: #1d2633;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
        }

        /* Card container around the whole report. overflow:hidden here is safe —
           it's the parent of the scrolling element, so it clips the card to
           rounded corners without breaking the sticky first column inside. */
        .pir-pd-report-wrap {
          width: 100%;
          max-width: 100%;
          background: #ffffff;
          color: #001a3b;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(29, 38, 51, 0.06), 0 8px 24px -14px rgba(29, 38, 51, 0.12);
          overflow: hidden;
        }

        /* Only the table scrolls horizontally */
        .pir-pd-report-scroll {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
        }

        .pir-pd-editable-cell-input {
          width: 100%;
          min-width: 0;
          height: 26px;
          border: 1px solid transparent;
          border-radius: 3px;
          background: transparent;
          color: #001a3b;
          font: inherit;
          outline: none;
        }

        .pir-pd-editable-cell-input:focus {
          border-color: #9db7e8;
          background: #ffffff;
          box-shadow: 0 0 0 2px rgba(157, 183, 232, 0.22);
        }

        .pir-pd-scaled-input {
          position: relative;
          display: block;
        }

        .pir-pd-scaled-input .pir-pd-editable-cell-input {
          padding-right: 18px;
        }

        .pir-pd-scaled-input-unit {
          position: absolute;
          top: 50%;
          right: 5px;
          transform: translateY(-50%);
          color: #687386;
          font-size: 12px;
          font-weight: 700;
          pointer-events: none;
        }

        /* Value inputs stay locked until the row has an item description */
        .pir-pd-editable-cell-input:disabled {
          background: #f4f6f9;
          color: #c4cbd8;
          cursor: not-allowed;
        }

        .pir-pd-item-input { text-align: left; font-weight: 600; }

        .pir-pd-item-input::placeholder {
          font-weight: 400;
          color: #9aa3b2;
        }
        .pir-pd-amount-input { text-align: right; }
        .pir-pd-editable-value-cell { padding: 4px 8px; }

        .pir-pd-section-title-input {
          width: min(420px, 70%);
          height: 24px;
          border: 1px solid transparent;
          border-radius: 3px;
          background: transparent;
          color: #1D2C4D;
          font: inherit;
          font-weight: 700;
          letter-spacing: inherit;
          text-transform: uppercase;
          outline: none;
        }

        .pir-pd-section-title-input:focus {
          border-color: rgba(29, 44, 77, 0.45);
          background: rgba(255, 255, 255, 0.65);
        }

        .pir-pd-section-title-input::placeholder {
          color: rgba(29, 44, 77, 0.55);
          font-weight: 600;
          text-transform: none;
          letter-spacing: normal;
        }

        .pir-pd-report-state {
          padding: 40px 20px;
          text-align: center;
          color: #687386;
          font-size: 14px;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 10px;
        }

        .pir-pd-report-error {
          color: red;
          background: #dde2ec69;
          border-color: #d5dbe7;
        }

        .pir-pd-report-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          /* Frame/rounding is provided by the .pir-pd-report-wrap card.
             NOTE: no overflow:hidden here — it would break the sticky first
             column (item names) inside the horizontally-scrolling wrapper. */
          font-size: 12px;
        }

        .pir-pd-report-table th,
        .pir-pd-report-table td {
          border-right: 1px solid #eef1f5;
          border-bottom: 1px solid #eef1f5;
        }

        .pir-pd-report-table th:last-child,
        .pir-pd-report-table td:last-child {
          border-right: 0;
        }

        .pir-pd-item-header {
          min-width: 240px;
          width: 240px;
          height: 64px;
          padding: 0 20px;
          background: #ffffff;
          color: #1D2C4D;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-align: left;
          vertical-align: middle;
          position: sticky;
          left: 0;
          z-index: 3;
          box-shadow: 6px 0 8px -6px rgba(29, 38, 51, 0.18);
        }

        .pir-pd-year-header {
          height: 34px;
          padding: 0 16px;
          color: #1D2C4D;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-align: center;
          vertical-align: middle;
        }

        /* Metric sub-headers: subtle grey on a light row (not FY-tone coloured) */
        .pir-pd-metric-header {
          min-width: 120px;
          height: 40px;
          padding: 6px 14px;
          background: #f8f9fa;
          color: #1D2C4D;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-align: center;
          vertical-align: middle;
          white-space: nowrap;
          line-height: 1.25;
        }

        /* One heading tint for every fiscal-year column — the year label does the
           distinguishing, so the tone classes all resolve to the same band. The
           TOTAL rollup keeps a slightly deeper tint to mark it as a summary. */
        .pir-pd-fy-purple,
        .pir-pd-fy-blue,
        .pir-pd-fy-green,
        .pir-pd-fy-pink,
        .pir-pd-fy-orange { background: #dde2ec69; }
        .pir-pd-fy-total  { background: #e4e8ef; }

        /* TOTAL rollup column — emphasised against the per-year columns */
        .pir-pd-total-cell {
          background: #f4f6f9;
          font-weight: 700;
          border-left: 1px solid #d5dbe7;
        }

        .pir-pd-subtotal-row .pir-pd-total-cell { background: #e4e8ef; color: #1D2C4D; }

        .pir-pd-section-row td {
          height: 40px;
          padding: 0;
          background: #dde2ec69;
          color: #1D2C4D;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          vertical-align: middle;
        }

        /* The full-width <td> can't stick (it fills its row), so the label
           inside it is what stays pinned to the left as the data scrolls. */
        .pir-pd-section-head {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 0 20px;
          position: sticky;
          left: 0;
          z-index: 2;
        }

        .pir-pd-section-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          padding: 0;
          border: 0;
          border-radius: 3px;
          background: transparent;
          color: #1D2C4D;
          cursor: pointer;
          flex: 0 0 auto;
        }

        .pir-pd-section-toggle:hover {
          background: rgba(29, 44, 77, 0.1);
        }

        .pir-pd-section-caret {
          font-size: 11px;
          line-height: 1;
          transition: transform 0.15s ease;
        }

        /* Rotate the caret to point right when the section is collapsed */
        .pir-pd-caret-collapsed {
          transform: rotate(-90deg);
        }

        .pir-pd-section-title-text {
          display: inline-block;
        }

        .pir-pd-item-cell {
          min-width: 240px;
          width: 240px;
          height: 40px;
          padding: 0 20px;
          background: #ffffff;
          color: #001a3b;
          font-weight: 600;
          text-align: left;
          position: sticky;
          left: 0;
          z-index: 2;
          box-shadow: 6px 0 8px -6px rgba(29, 38, 51, 0.12);
        }

        .pir-pd-value-cell {
          height: 40px;
          padding: 0 14px;
          background: #ffffff;
          color: #001a3b;
          font-weight: 500;
          text-align: right;
          white-space: nowrap;
        }

        .pir-pd-linked-value {
          color: #9aa3b2;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .pir-pd-actuals-link-cell {
          cursor: pointer;
        }

        .pir-pd-actuals-link-cell:hover {
          background: #dde2ec69;
        }

        .pir-pd-actuals-link-cell:hover .pir-pd-linked-value {
          color: #1D2C4D;
        }

        /* YTD Actuals + Forecast — coloured by sign (overrides the linked grey) */
        .pir-pd-ytd-green { color: #1ea761; font-weight: 600; }
        .pir-pd-ytd-red   { color: red; font-weight: 600; }

        .pir-pd-variance { font-weight: 600; }
        .pir-pd-variance-red   { color: red; }
        .pir-pd-variance-green { color: #1ea761; }
        .pir-pd-variance-none  { color: #9aa3b2; font-weight: 500; }

        .pir-pd-subtotal-row .pir-pd-item-cell,
        .pir-pd-subtotal-row .pir-pd-value-cell {
          height: 38px;
          background: #dde2ec69;
          color: #1D2C4D;
          font-weight: 700;
        }

        .pir-pd-subtotal-row .pir-pd-item-cell { color: #1D2C4D; }

        /* Value inputs in the draft row stay locked until a line name is typed
           (must sit after the .pir-pd-draft-row tint to win on equal specificity) */
        .pir-pd-draft-row .pir-pd-editable-cell-input:disabled {
          background: #f4f6f9;
          border-color: transparent;
          color: #c4cbd8;
          cursor: not-allowed;
        }
      `})]})}const yd=e=>{const t=String(e.line_identifier??"").trim().toUpperCase();return t!==""&&t!=="FINANCIAL"},GS=e=>String(e.is_calculated??"").trim().toUpperCase()==="Y",xn=e=>{if(e==null||e==="")return null;const t=Number(e);return Number.isFinite(t)?t:null},qS=e=>e.toUpperCase();function VS(e){const t=e==null?void 0:e.data;if(t==null)return null;const n=t.items,a=[n,Array.isArray(n)?n[0]:void 0,Array.isArray(t)?t[0]:void 0,t];for(const l of a)if(l&&typeof l=="object"&&Array.isArray(l.sections))return l;return null}function XS(e){const t=[];for(const n of e)for(const a of n.lines??[])if(yd(a))for(const l of Object.keys(a.year_values??{}))l.toLowerCase()!=="total"&&(t.includes(l)||t.push(l));return t.map(n=>({key:n,label:qS(n)}))}function QS(e){const t=VS(e),n=(t==null?void 0:t.sections)??[],a=XS(n);if(a.length===0)return{years:[],tables:[],raw:t};const l=[...n].sort((i,r)=>(i.display_order??0)-(r.display_order??0)).map(i=>{const r=(i.lines??[]).filter(yd).sort((o,u)=>(o.display_order??0)-(u.display_order??0));if(r.length===0)return null;const c=r.map(o=>({lineId:xn(o.fin_eval_line_id),label:o.line_item_name||o.account||"Metric",isTotal:GS(o),cells:a.map(u=>{var p;const f=((p=o.year_values)==null?void 0:p[u.key])??{};return{spc:xn(f.spc_projected_amount),actual:xn(f.actual)??xn(f.ytd_actuals)}})}));return{sectionId:xn(i.fin_eval_section_id),title:i.section_name||i.section_type||"Non-Financial Metric",rows:c,totalIsDerived:!c.some(o=>o.isTotal)&&c.length>1}}).filter(i=>i!==null);return{years:a,tables:l,raw:t}}const ZS="/GIS/proposalAuthoring/financialEvaluation";function KS(e){if(!e.api_endpoint)throw new Error("Missing api_endpoint in window.__APP_CONFIG__");const t=`${e.api_endpoint}${ZS}`,n=new URLSearchParams,a=e.proposal_id;Number.isFinite(Number(a))&&Number(a)>0&&n.set("proposal_id",String(a)),e.spc_type_id!=null&&e.spc_type_id!==""&&n.set("spc_type_id",String(e.spc_type_id)),e.spc_type_template_id!=null&&e.spc_type_template_id!==""&&n.set("template_type_id",String(e.spc_type_template_id));const l=n.toString();return l?`${t}?${l}`:t}function C0(){var n;const e=typeof window<"u"?(n=window.__APP_CONFIG__)==null?void 0:n.dev_token:void 0,t={BASE_URL:"/",MODE:"production",DEV:!1,PROD:!0,SSR:!1}.VITE_PIR_TOKEN;return e||t}function FS(e){if(!e.api_endpoint)throw new Error("Missing api_endpoint in window.__APP_CONFIG__");const t=e.proposal_id;if(!Number.isFinite(Number(t))||Number(t)<=0)throw new Error("A valid proposal_id is required to save non-financial metrics");return`${e.api_endpoint}/GIS/proposalAuthoring/${t}/financialEvaluation`}const JS=["created_by","creation_date","last_updated_by","last_updated_date"],vd=e=>{const t={...e};for(const n of JS)delete t[n];return t};function O0(e){let t=null;for(const[n,a]of Object.entries(e)){if(n.toLowerCase()==="total")continue;const l=xn(a==null?void 0:a.actual);l!=null&&(t=(t??0)+l)}return t}const PS=e=>{let t=null;for(const[n,a]of Object.entries(e)){if(n.toLowerCase()==="total")continue;const l=xn(a==null?void 0:a.spc_projected_amount);l!=null&&(t=(t??0)+l)}return t};function WS(e,t,n,a){var c;const l=JSON.parse(JSON.stringify(e)),i=new Map;for(const o of n){const u=i.get(o.lineId)??[];u.push(o),i.set(o.lineId,u)}const r=l.sections??[];for(const o of r){const u=xn(o.fin_eval_section_id),f=o.lines??[];for(const m of f){const v=xn(m.fin_eval_line_id);if(v==null||!yd(m)||!i.has(v))continue;const S=m.year_values??(m.year_values={});for(const j of i.get(v)??[]){const y=S[c=j.yearKey]??(S[c]={});y.actual=j.value}S.total&&(S.total.actual=O0(S))}const p=a.filter(m=>m.sectionId===u);if(p.length===0)continue;const d=f.reduce((m,v)=>Math.max(m,Number(v.display_order??0)),0);p.forEach((m,v)=>{const S={};for(const j of t)S[j.key]={spc_projected_amount:null,actual:m.actuals[j.key]??null};S.total={spc_projected_amount:PS(S),actual:O0(S)},f.push({fin_eval_line_id:null,fin_eval_section_id:u,line_type:"NON_FINANCIAL",line_item_name:m.label,line_identifier:"NON_FINANCIAL",is_calculated:"N",is_custom:"Y",is_read_only:"N",account:null,display_order:d+(v+1)*10,target_go_live_date:null,status:"ACTIVE",year_values:S})}),o.lines=f}return vd({...l,sections:r.map(o=>({...vd(o),lines:(o.lines??[]).map(u=>vd(u))}))})}async function IS(e,t,n,a,l){if(a.length===0&&l.length===0)return;const i=WS(t,n,a,l),r=FS(e),u={"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${C0()||lt(await at(e))}`,language:"EN"};for(const[v,S]of Object.entries(In(e)))S!=null&&(u[v]=String(S));const f=JSON.stringify(i);console.log("[NonFinancial] PUT",r),console.log(`[NonFinancial] PUT body
`+JSON.stringify(i,null,2));const p=new AbortController,d=setTimeout(()=>p.abort(new DOMException("Save timed out after 5 minutes","TimeoutError")),Li);let m;try{m=await fetch(r,{method:"PUT",headers:u,body:f,signal:p.signal})}catch(v){if(p.signal.aborted){const S=p.signal.reason;throw new Error(S instanceof Error||S instanceof DOMException?S.message:"Save timed out after 5 minutes")}throw v instanceof Error?v:new Error(String(v))}finally{clearTimeout(d)}if(!m.ok){const v=await m.text().catch(()=>"");throw console.error("[NonFinancial] PUT failed",m.status,v),new Error(El(v)||`HTTP ${m.status}: ${m.statusText}${v?` — ${v.slice(0,300)}`:""}`)}console.log("[NonFinancial] PUT ok",m.status),Hi("PUT financialEvaluation (non-financial)")}async function e_(e){const t=C0(),n=t||lt(await at(e)),a=KS(e),[,l=""]=a.split("?"),i=Y2(e),r=Iu(e);console.groupCollapsed("[NonFinancial] GET financialEvaluation"),console.log("url        ",a),console.log("params     ",Object.fromEntries(new URLSearchParams(l))),console.log("headers    ",{role:i.role??"(absent)",user_email:i.user_email??"(absent)",Authorization:n?`Bearer ${n.slice(0,6)}…`:"(absent)"}),console.log("role grants",{count:i.role_grant_count,all:i.grants,rls:i.rls_grants}),console.log("runtime    ",{tokenSource:t?"dev_token":"auth-api"}),r.length>0&&console.error(`[NonFinancial] ${r.join(" and ")} missing from window.__APP_CONFIG__ — expect 403 "You are not authorised to view this financial evaluation".`),console.groupEnd();let c;try{c=await ea(a,n,void 0,void 0,e)}catch(u){throw console.error("[NonFinancial] GET failed",{url:a,error:u instanceof Error?u.message:String(u),role_header_present:i.role_header_present,user_email:i.user_email??null,proposal_id:e.proposal_id}),u}const o=QS(c);return console.groupCollapsed("[NonFinancial] response"),console.log("raw        ",c),console.log("years      ",o.years.map(u=>u.label)),console.log("tables     ",o.tables.map(u=>({section:u.title,id:u.sectionId,rows:u.rows.length}))),o.tables.length===0&&console.warn('[NonFinancial] no non-financial lines in the payload — every line came back with line_identifier "FINANCIAL" or blank.'),console.groupEnd(),o}const D0=(e,t)=>`${e}::${t}`,z0=e=>{let t=e.replace(/[^\d.-]/g,"");const n=t.startsWith("-");t=t.replace(/-/g,"");const a=t.indexOf(".");return a!==-1&&(t=`${t.slice(0,a+1)}${t.slice(a+1).replace(/\./g,"")}`),n?`-${t}`:t},t_=e=>e.replace(/^\s+/,""),Gs=e=>{const t=e.trim();if(!t)return null;const n=Number(t);return Number.isFinite(n)?n:null},qs=(e,t)=>{if(e==null)return"–";const n=Tl(e,t,Number.isInteger(e)?0:2);return e<0?`(${n})`:n};function n_(){const e=Aa(),t=Ys(),[n,a]=x.useState(null),[l,i]=x.useState(!0),[r,c]=x.useState(null),[o,u]=x.useState({}),[f,p]=x.useState([]),[d,m]=x.useState(!1),[v,S]=x.useState(null),[j,y]=x.useState([]),g=x.useRef(0);x.useEffect(()=>{let B=!1;return i(!0),c(null),e_(_e()).then(X=>{B||(a(X),u({}),p([]))}).catch(X=>{B||c(X instanceof Error?X.message:"Failed to load non-financial metrics")}).finally(()=>{B||i(!1)}),()=>{B=!0}},[e]);const b=(B,X,Q)=>{var k;if(B.lineId!=null){const E=o[D0(B.lineId,Q)];if(E!==void 0)return Gs(E)}return((k=B.cells[X])==null?void 0:k.actual)??null},_=(B,X,Q)=>{var M;let k=null,E=null;for(const D of B.rows){if(D.isTotal)continue;const Y=((M=D.cells[X])==null?void 0:M.spc)??null;Y!=null&&(k=(k??0)+Y);const G=b(D,X,Q);G!=null&&(E=(E??0)+G)}for(const D of f){if(D.sectionId!==B.sectionId)continue;const Y=Gs(D.values[Q]??"");Y!=null&&(E=(E??0)+Y)}return{spc:k,actual:E}},T=B=>{g.current+=1,p(X=>[...X,{key:`new-${g.current}`,sectionId:B,label:"",values:{}}])},O=(B,X)=>{p(Q=>Q.map(k=>k.key===B?{...k,...X}:k))},w=B=>{p(X=>X.filter(Q=>Q.key!==B))},z=f.filter(B=>B.label.trim()!==""),R=Object.keys(o).length,L=R+z.length,ee=async()=>{if(!(n!=null&&n.raw)||L===0)return;m(!0),S(null);const B=Object.entries(o).map(([Q,k])=>{const[E,M]=Q.split("::");return{lineId:Number(E),yearKey:M,value:Gs(k)}}),X=z.map(Q=>({sectionId:Q.sectionId,label:Q.label.trim(),actuals:Object.fromEntries(Object.entries(Q.values).map(([k,E])=>[k,Gs(E)]))}));try{await IS(_e(),n.raw,n.years,B,X),y(["Non-financial metrics saved"])}catch(Q){S(Q instanceof Error?Q.message:"Save failed")}finally{m(!1)}};return l&&!n?s.jsx("div",{className:"pir-pd-nf-state",children:"Loading non-financial metrics…"}):r&&!n?s.jsxs("div",{className:"pir-pd-nf-state pir-pd-nf-error",children:["Couldn’t load non-financial metrics: ",r]}):!n||n.tables.length===0?null:s.jsxs("section",{className:"pir-pd-nf","aria-label":"Non-Financial Metrics",children:[s.jsxs("div",{className:"pir-pd-nf-heading",children:[s.jsx("span",{className:"pir-pd-nf-heading-icon","aria-hidden":"true",children:s.jsxs("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[s.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),s.jsx("polyline",{points:"14 2 14 8 20 8"}),s.jsx("line",{x1:"16",y1:"13",x2:"8",y2:"13"}),s.jsx("line",{x1:"16",y1:"17",x2:"8",y2:"17"})]})}),s.jsxs("div",{children:[s.jsx("div",{className:"pir-pd-nf-heading-title",children:"Non-Financial Metrics"}),s.jsx("div",{className:"pir-pd-nf-heading-sub",children:"SPC projected against actuals recorded during the review"})]})]}),n.tables.map(B=>{const X=f.filter(k=>k.sectionId===B.sectionId),Q=1+n.years.length*2;return s.jsxs("div",{className:"pir-pd-nf-card",children:[s.jsx("div",{className:"pir-pd-nf-card-header",children:B.title}),s.jsx("div",{className:"pir-pd-nf-scroll",children:s.jsxs("table",{className:"pir-pd-nf-table","aria-label":B.title,children:[s.jsxs("thead",{children:[s.jsxs("tr",{children:[s.jsx("th",{className:"pir-pd-nf-item-header",rowSpan:2,children:"ITEM DESCRIPTION"}),n.years.map(k=>s.jsx("th",{className:"pir-pd-nf-year-header",colSpan:2,children:k.label},k.key))]}),s.jsx("tr",{children:n.years.map(k=>s.jsxs(x.Fragment,{children:[s.jsx("th",{className:"pir-pd-nf-metric-header",children:"SPC PROJECTED"}),s.jsx("th",{className:"pir-pd-nf-metric-header",children:"ACTUAL"})]},`${k.key}-metrics`))})]}),s.jsxs("tbody",{children:[B.rows.map((k,E)=>s.jsxs("tr",{className:k.isTotal?"pir-pd-nf-total-row":"",children:[s.jsx("td",{className:"pir-pd-nf-item-cell",children:k.label}),n.years.map((M,D)=>{const Y=k.cells[D],G=(Y==null?void 0:Y.actual)??null,Ke=!k.isTotal&&k.lineId!=null,it=k.lineId!=null?D0(k.lineId,M.key):"",xt=(it&&o[it])??(G==null?"":String(G));return s.jsxs(x.Fragment,{children:[s.jsx("td",{className:"pir-pd-nf-value-cell",children:qs((Y==null?void 0:Y.spc)??null,t)}),s.jsx("td",{className:"pir-pd-nf-value-cell pir-pd-nf-actual-cell",children:Ke?s.jsx("input",{className:"pir-pd-nf-input",value:xt,onChange:Ye=>u(C=>({...C,[it]:z0(Ye.target.value)})),placeholder:"–",inputMode:"decimal","aria-label":`${k.label} ${M.label} actual`}):qs(b(k,D,M.key),t)})]},`${k.lineId??E}-${M.key}`)})]},`${k.lineId??E}`)),X.map(k=>s.jsxs("tr",{className:"pir-pd-nf-draft-row",children:[s.jsx("td",{className:"pir-pd-nf-item-cell",children:s.jsxs("div",{className:"pir-pd-nf-draft-name",children:[s.jsx("input",{className:"pir-pd-nf-input pir-pd-nf-name-input",value:k.label,onChange:E=>O(k.key,{label:t_(E.target.value)}),placeholder:"Enter metric name…","aria-label":"New metric name",autoFocus:!0}),s.jsx("button",{type:"button",className:"pir-pd-nf-draft-cancel",onClick:()=>w(k.key),title:"Remove this line","aria-label":"Remove new line",children:"✕"})]})}),n.years.map(E=>s.jsxs(x.Fragment,{children:[s.jsx("td",{className:"pir-pd-nf-value-cell pir-pd-nf-muted",children:"–"}),s.jsx("td",{className:"pir-pd-nf-value-cell pir-pd-nf-actual-cell",children:s.jsx("input",{className:"pir-pd-nf-input",value:k.values[E.key]??"",onChange:M=>O(k.key,{values:{...k.values,[E.key]:z0(M.target.value)}}),disabled:!k.label.trim(),title:k.label.trim()?void 0:"Name the metric to enable this field",placeholder:k.label.trim()?"0":"",inputMode:"decimal","aria-label":`New metric ${E.label} actual`})})]},`${k.key}-${E.key}`))]},k.key)),B.sectionId!=null&&s.jsxs("tr",{className:"pir-pd-nf-new-row",children:[s.jsx("td",{className:"pir-pd-nf-item-cell",children:s.jsx("button",{type:"button",className:"pir-pd-nf-new-line-button",onClick:()=>T(B.sectionId),children:"+ New Line"})}),s.jsx("td",{className:"pir-pd-nf-value-cell",colSpan:Q-1})]}),B.totalIsDerived&&s.jsxs("tr",{className:"pir-pd-nf-total-row",children:[s.jsx("td",{className:"pir-pd-nf-item-cell",children:"Total"}),n.years.map((k,E)=>{const M=_(B,E,k.key);return s.jsxs(x.Fragment,{children:[s.jsx("td",{className:"pir-pd-nf-value-cell",children:qs(M.spc,t)}),s.jsx("td",{className:"pir-pd-nf-value-cell",children:qs(M.actual,t)})]},`total-${k.key}`)})]})]})]})})]},`${B.sectionId??B.title}`)}),s.jsxs("div",{className:"pir-pd-nf-actions",children:[s.jsx(Hs,{kind:"error",messages:v?[v]:[],onClose:()=>S(null)}),s.jsx(Hs,{kind:"success",messages:j,onClose:()=>y([]),autoDismissMs:5e3}),!v&&L>0&&s.jsxs("span",{className:"pir-pd-nf-pending",children:[R>0&&`${R} actual${R===1?"":"s"} edited`,R>0&&z.length>0&&" · ",z.length>0&&`${z.length} new line${z.length===1?"":"s"}`," ready to save"]}),s.jsxs("button",{type:"button",className:"pir-pd-nf-reset",onClick:()=>{u({}),p([]),S(null)},disabled:d||L===0,children:[s.jsx("span",{"aria-hidden":"true",children:"↺"})," Reset Actuals"]}),s.jsx("button",{type:"button",className:"pir-pd-nf-save",onClick:()=>{ee()},disabled:d||L===0,title:L===0?"Enter an actual or add a line to enable saving":void 0,children:d?"Saving…":"Save All"})]}),s.jsx("style",{children:`
        .pir-pd-nf { margin-top: 16px; }


        .pir-pd-nf-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .pir-pd-nf-heading-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #dde2ec69;
          color: #1D2C4D;
        }

        .pir-pd-nf-heading-title {
          color: #1D2C4D;
          font-size: 15px;
          font-weight: 700;
        }

        .pir-pd-nf-heading-sub {
          color: #687386;
          font-size: 12px;
        }

        .pir-pd-nf-state {
          padding: 24px 20px;
          margin-top: 16px;
          text-align: center;
          color: #687386;
          font-size: 13px;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 10px;
        }

        .pir-pd-nf-error { color: red; }

        .pir-pd-nf-card {
          margin-bottom: 16px;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(29, 38, 51, 0.06);
          /* Safe here: the scrolling element is the child, so this only clips
             the card to its rounded corners. */
          overflow: hidden;
        }

        .pir-pd-nf-card-header {
          padding: 12px 18px;
          background: #dde2ec69;
          color: #1D2C4D;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.03em;
          border-bottom: 1px solid #e6e9ee;
        }

        /* Only the table scrolls sideways — the card stays put */
        .pir-pd-nf-scroll {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
        }

        .pir-pd-nf-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 12px;
        }

        .pir-pd-nf-table th,
        .pir-pd-nf-table td {
          border-right: 1px solid #eef1f5;
          border-bottom: 1px solid #eef1f5;
        }

        .pir-pd-nf-table th:last-child,
        .pir-pd-nf-table td:last-child { border-right: 0; }

        .pir-pd-nf-item-header {
          min-width: 240px;
          width: 240px;
          height: 56px;
          padding: 0 20px;
          background: #ffffff;
          color: #1D2C4D;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-align: left;
          vertical-align: middle;
          position: sticky;
          left: 0;
          z-index: 3;
          box-shadow: 6px 0 8px -6px rgba(29, 38, 51, 0.18);
        }

        .pir-pd-nf-year-header {
          height: 32px;
          padding: 0 16px;
          background: #dde2ec69;
          color: #1D2C4D;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-align: center;
          vertical-align: middle;
        }

        .pir-pd-nf-metric-header {
          min-width: 120px;
          height: 34px;
          padding: 4px 14px;
          background: #f8f9fa;
          color: #1D2C4D;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-align: center;
          vertical-align: middle;
          white-space: nowrap;
        }

        .pir-pd-nf-item-cell {
          min-width: 240px;
          width: 240px;
          height: 38px;
          padding: 0 20px;
          background: #ffffff;
          color: #001a3b;
          font-weight: 600;
          text-align: left;
          position: sticky;
          left: 0;
          z-index: 2;
          box-shadow: 6px 0 8px -6px rgba(29, 38, 51, 0.12);
        }

        .pir-pd-nf-value-cell {
          height: 38px;
          padding: 0 14px;
          background: #ffffff;
          color: #001a3b;
          font-weight: 500;
          text-align: right;
          white-space: nowrap;
        }

        .pir-pd-nf-actual-cell { padding: 4px 8px; }
        .pir-pd-nf-muted { color: #b3bccb; font-style: italic; text-align: right; }

        .pir-pd-nf-input {
          width: 100%;
          min-width: 0;
          height: 26px;
          padding: 0 6px;
          border: 1px solid #d5dbe7;
          border-radius: 4px;
          background: #ffffff;
          color: #1D2C4D;
          font: inherit;
          font-weight: 600;
          text-align: right;
          outline: none;
        }

        .pir-pd-nf-input:focus {
          border-color: #9db7e8;
          box-shadow: 0 0 0 2px rgba(157, 183, 232, 0.22);
        }

        .pir-pd-nf-input:disabled {
          background: #f4f6f9;
          color: #c4cbd8;
          cursor: not-allowed;
        }

        .pir-pd-nf-input::placeholder { color: #b3bccb; font-weight: 400; }

        .pir-pd-nf-name-input { text-align: left; }

        /* ── Inline draft row ────────────────────────────────── */
        .pir-pd-nf-draft-row .pir-pd-nf-item-cell,
        .pir-pd-nf-draft-row .pir-pd-nf-value-cell {
          background: #dde2ec69;
          color: #1D2C4D;
        }

        .pir-pd-nf-draft-name {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pir-pd-nf-draft-cancel {
          flex: 0 0 auto;
          padding: 3px 8px;
          border: 1px solid #e6e9ee;
          border-radius: 4px;
          background: #ffffff;
          color: #687386;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .pir-pd-nf-draft-cancel:hover { color: #1D2C4D; background: #f4f6f9; }

        .pir-pd-nf-new-row .pir-pd-nf-item-cell,
        .pir-pd-nf-new-row .pir-pd-nf-value-cell {
          height: 34px;
          color: #9aa3b2;
        }

        .pir-pd-nf-new-line-button {
          margin: 0;
          padding: 2px 8px;
          border: 1px dashed #c4cbd8;
          border-radius: 4px;
          background: transparent;
          color: #687386;
          font: inherit;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-nf-new-line-button:hover {
          border-color: #1D2C4D;
          color: #1D2C4D;
          background: #dde2ec69;
        }

        .pir-pd-nf-total-row .pir-pd-nf-item-cell,
        .pir-pd-nf-total-row .pir-pd-nf-value-cell {
          background: #dde2ec69;
          color: #1D2C4D;
          font-weight: 700;
        }

        .pir-pd-nf-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 4px 0 8px;
        }

        .pir-pd-nf-pending {
          margin-right: auto;
          color: #687386;
          font-size: 13px;
        }

        .pir-pd-nf-save-error {
          margin-right: auto;
          color: red;
          font-size: 13px;
          font-weight: 600;
        }

        .pir-pd-nf-reset,
        .pir-pd-nf-save {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 36px;
          padding: 0 18px;
          border: 1px solid #d5dbe7;
          border-radius: 8px;
          background: #ffffff;
          color: #1D2C4D;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-nf-reset:hover:not(:disabled),
        .pir-pd-nf-save:hover:not(:disabled) {
          background: #eef1f5;
          border-color: #c4cbd8;
        }

        .pir-pd-nf-reset:disabled,
        .pir-pd-nf-save:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .pir-pd-nf-toast {
          position: fixed;
          right: 24px;
          top: 24px;
          z-index: 500;
          max-width: 420px;
          padding: 12px 18px;
          border-radius: 8px;
          background: #1d2633;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
        }
      `})]})}const a_={CAPEX:{label:"TOTAL CAPEX ($M)",valUnit:"M",varKind:"moneyPct",better:"lower",showHurdle:!0,hurdlePct:!0},OPEX:{label:"OPEX ($M)",valUnit:"M",varKind:"moneyPct",better:"lower",showHurdle:!0,hurdlePct:!0},IRR:{label:"IRR (%)",valUnit:"pct",varKind:"pts",better:"higher",showHurdle:!0},YEAR5_PTR:{label:"YEAR-5 PTR (%)",valUnit:"pct",varKind:"pts",better:"higher",showHurdle:!0},AVG3YR_PTR:{label:"AVG 3-YR PTR (%)",valUnit:"pct",varKind:"pts",better:"higher",showHurdle:!0},NPV:{label:"NPV ($M)",valUnit:"M0",varKind:"numM",better:"higher",showHurdle:!0},PAYBACK:{label:"PAYBACK (YEARS)",valUnit:"yr",varKind:"yearPct",better:"lower",showHurdle:!0}},l_={label:"",valUnit:"pct",varKind:"pts",better:"higher",showHurdle:!0},i_=.05,Sn=(e,t)=>t<0?`(${e})`:e,M0=(e,t)=>{if(e==null)return"—";const n=Math.abs(e);switch(t){case"M":return Sn((n/1e6).toFixed(2),e);case"M0":return Sn(Math.round(n/1e6).toLocaleString("en-US"),e);case"pct":return Sn(n.toFixed(1),e);case"yr":return Sn(n.toFixed(0),e)}},r_=(e,t)=>e==null?"—":t==="M"?Sn((Math.abs(e)/1e6).toFixed(2),e):M0(e,t),s_=(e,t)=>{switch(t){case"moneyPct":return Sn((Math.abs(e)/1e6).toFixed(2),e);case"yearPct":return Sn(Math.abs(e).toFixed(0),e);case"pts":return`${Sn(Math.abs(e).toFixed(1),e)} pts`;case"numM":return Sn(Math.round(Math.abs(e)/1e6).toLocaleString("en-US"),e)}},c_=e=>/less/i.test(e)?"≤":/greater/i.test(e)?"≥":"",o_=(e,t,n)=>{if(t==null)return"N/A";const a=c_(e);return n?`${a} +${t}%`.trim():`${a}${t}`};function u_(e){const t=(e==null?void 0:e.p_out_cursor)??(e==null?void 0:e.out_cursor),n=Array.isArray(t)?t:[],a=n.map(p=>{const d=a_[p.kpi_code]??{...l_,label:p.kpi_name},m=(p.pass_fail??"").trim().toUpperCase(),v=m==="FAIL",S=m==="AMBER",j=p.actual!=null&&p.spc_approved!=null?p.spc_approved-p.actual:p.variance??0,y=(()=>{if(p.threshold==null)return!1;if(d.hurdlePct){if(j>=0)return!1;const R=Math.abs(p.spc_approved??0);return(R===0?0:Math.abs(j)/R*100)>p.threshold}return p.actual==null?!1:d.better==="lower"?p.actual>=p.threshold:p.actual<=p.threshold})();let g=v?"red":S||y?"amber":"green";g==="green"&&!d.hurdlePct&&p.threshold!=null&&p.actual!=null&&Math.abs(p.actual-p.threshold)/Math.abs(p.threshold||1)<=i_&&(g="amber");const b=j===0,_=g==="red"?"× Fail":g==="amber"?"⚠ Borderline":d.varKind==="moneyPct"&&b?"✓ OK":"✓ Pass",T=j===0?"neutral":j>0?"green":"red";let O=s_(j,d.varKind),w=null;if(d.varKind==="moneyPct"){const R=p.spc_approved??0;w=R===0||j===0?0:Math.abs(j)/Math.abs(R)*100,O=`${O} (${w.toFixed(1)}%)`}const z=d.valUnit==="M"||d.valUnit==="M0";return{label:d.label,value:M0(p.actual,d.valUnit),badge:g==="red"?"RED":g==="amber"?"AMBER":"GREEN",spcApproved:`SPC Approved ${r_(p.spc_approved,d.valUnit)}`,variance:O,varianceTone:T,hurdle:o_(p.operator,p.threshold,d.hurdlePct),showHurdle:d.showHurdle,status:_,statusTone:g,tone:g,isMoney:z,valueNum:p.actual,spcNum:p.spc_approved,varianceNum:j,variancePct:w}}),l=p=>p.replace(/%/g,"").trim(),i=a.map((p,d)=>{var m;return{tone:p.tone,name:l(((m=n[d])==null?void 0:m.kpi_name)??`KPI ${d+1}`)}}),r=p=>i.filter(d=>d.tone===p).map(d=>d.name),c=r("red"),o=r("amber"),u=r("green"),f={red:{count:c.length,names:c},amber:{count:o.length,names:o},green:{count:u.length,names:u},needsReapproval:c.length>0};return{tiles:a,rag:f,proposalCode:(e==null?void 0:e.p_proposal_code)??(e==null?void 0:e.proposal_code)??""}}const d_="/GIS/PIR/KPIVariance";function p_(e){if(!e.api_endpoint)throw new Error("Missing api_endpoint in window.__APP_CONFIG__");return`${e.api_endpoint}${d_}`}function f_(e,t){const n=t??e.proposal_id;return{proposal_id:Number.isFinite(Number(n))&&Number(n)>0?n:"",spc_type_id:e.spc_type_id,spc_type_template_id:e.spc_type_template_id}}function m_(){var n;const e=typeof window<"u"?(n=window.__APP_CONFIG__)==null?void 0:n.dev_token:void 0,t={BASE_URL:"/",MODE:"production",DEV:!1,PROD:!0,SSR:!1}.VITE_PIR_TOKEN;return e||t}async function h_(e,t){const a=m_()||lt(await at(e)),l=p_(e),i=f_(e,t),r=await ea(l,a,void 0,i,e);return console.log("[KPIVariance] request",{url:l,headers:i}),console.log("[KPIVariance] response",r),u_(r)}const ta=e=>{if(e==null)return"—";const t=e/1e6,n=`$${Math.abs(t).toFixed(2)}M`;return t<0?`(${n})`:n},Vs=e=>e==null?{text:"—",tone:"muted"}:e>0?{text:`${e.toFixed(1)}%`,tone:"green"}:e<0?{text:`(${Math.abs(e).toFixed(1)}%)`,tone:"red"}:{text:"0.0%",tone:"muted"},g_=e=>e==null?"—":e<0?`(${Math.abs(e).toFixed(1)}%)`:`${e.toFixed(1)}%`,y_=e=>e.toLowerCase().replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase());function v_(e){switch(e){case"ON_TRACK":return{label:"✓ On Track",tone:"green"};case"NEEDS_REAPPROVAL":return{label:"⚠ Needs Reapproval",tone:"amber"};case"NEEDS_ATTENTION":return{label:"⚠ Needs Attention",tone:"amber"};default:return{label:`⚠ ${y_(e)}`,tone:"amber"}}}function b_(e){return(Array.isArray(e==null?void 0:e.items)?e.items:[]).map(n=>{var u,f,p;const a=n.snapshot_status==="FUTURE",l=Vs(n.capex_variance_pct),i=Vs(n.opex_variance_pct),r=Vs(n.revenue_variance_pct),c=Vs(n.total_cost_variance_pct),o=a?{label:"🔒 Future",tone:"muted"}:v_(n.review_status);return{proposalCode:n.proposal_code??"",proposalTitle:n.proposal_title??"",title:n.review_label,badge:a?n.period_label?`🔒 ${n.period_label} · Future`:"🔒 Future":n.period_label??"",badgeTone:a?"muted":n.review_status==="ON_TRACK"?"dark":"amber",headerTone:a?"muted":"dark",muted:a,lines:[{label:"CAPEX",value:ta(n.capex_spc_amount),actuals:a?"—":ta(n.capex_actual_amount),variance:a?"—":l.text,varianceTone:a?"muted":l.tone,valueNum:n.capex_spc_amount,actualsNum:a?null:n.capex_actual_amount},{label:"OPEX",value:ta(n.opex_spc_amount),actuals:a?"—":ta(n.opex_actual_amount),variance:a?"—":i.text,varianceTone:a?"muted":i.tone,valueNum:n.opex_spc_amount,actualsNum:a?null:n.opex_actual_amount}],total:ta(n.total_cost_spc_amount),totalActuals:a?"—":ta(n.total_cost_actual_amount),totalNum:n.total_cost_spc_amount,totalActualsNum:a?null:n.total_cost_actual_amount,totalVariance:a?"—":c.text,totalVarianceTone:a?"muted":c.tone,benefit:a?"—":g_(n.benefit_realisation_pct),footerLabel:o.label,footerTone:o.tone,milestoneDate:n.milestone_date??"",status:n.snapshot_status,reviewStatus:n.review_status,investmentNum:n.investment??null,pirStatus:((u=n.pir_status)==null?void 0:u.trim())||null,pirExecutiveSummary:((f=n.pir_executive_summary)==null?void 0:f.trim())||null,pirLessonsLearned:((p=n.pir_lessons_learned)==null?void 0:p.trim())||null}})}const x_="/GIS/PIR/reportingPeriodicSnapshots";function S_(e){if(!e.api_endpoint)throw new Error("Missing api_endpoint in window.__APP_CONFIG__");return`${e.api_endpoint}${x_}`}function R0(){var n;const e=typeof window<"u"?(n=window.__APP_CONFIG__)==null?void 0:n.dev_token:void 0,t={BASE_URL:"/",MODE:"production",DEV:!1,PROD:!0,SSR:!1}.VITE_PIR_TOKEN;return e||t}async function __(e,t){const n=t??e.proposal_id;if(!Number.isFinite(Number(n))||Number(n)<=0)throw new Error("A valid proposal_id is required to load snapshots");const l=R0()||lt(await at(e)),i=S_(e),r=await ea(i,l,void 0,{proposal_id:String(n)},e);return b_(r)}async function N_(e,t,n="N"){const a=t??e.proposal_id;if(!Number.isFinite(Number(a))||Number(a)<=0)throw new Error("A valid proposal_id is required to re-capture snapshots");const i=R0()||lt(await at(e)),r="/GIS/PIR/reportingPeriodicSnapshots";if(!e.api_endpoint)throw new Error("Missing api_endpoint in window.__APP_CONFIG__");const c=`${e.api_endpoint}${r}`,o={Accept:"application/json",Authorization:`Bearer ${i}`,proposal_id:String(a),force_recapture:n};for(const[v,S]of Object.entries(In(e)))S!=null&&(o[v]=String(S));console.log("[Snapshots] POST recapture",{url:c,proposal_id:a,force_recapture:n});const u=new AbortController,f=setTimeout(()=>u.abort(new DOMException("Request timed out after 5 minutes","TimeoutError")),Li);let p;try{p=await fetch(c,{method:"POST",headers:o,signal:u.signal})}catch(v){if(u.signal.aborted){const S=u.signal.reason;throw new Error(S instanceof Error||S instanceof DOMException?S.message:"Request timed out after 5 minutes")}throw v instanceof Error?v:new Error(String(v))}finally{clearTimeout(f)}const d=await p.text();if(!p.ok)throw console.error("[Snapshots] recapture failed",p.status,d),new Error(El(d)||`HTTP ${p.status}: ${p.statusText}${d?` — ${d.slice(0,300)}`:""}`);let m={};try{m=d.trim()?JSON.parse(d):{}}catch{throw new Error(`Expected JSON from the recapture call but received: ${d.slice(0,200)}`)}if(console.log("[Snapshots] recapture response",m),(m.status??"").trim().toUpperCase()!=="S")throw new Error(m.message||`Recapture returned status "${m.status??"(none)"}"`);return Hi("POST reportingPeriodicSnapshots (recapture)"),m}function j_(e){if(!e.api_endpoint)throw new Error("Missing api_endpoint in window.__APP_CONFIG__");if(!e.proposal_id)throw new Error("Missing proposal_id in window.__APP_CONFIG__");return`${e.api_endpoint}/GIS/proposalAuthoring/${e.proposal_id}/financialEvaluation`}function w_(){const e=new Date().getFullYear(),t=Array.from({length:6},(a,l)=>e+l),n={};return t.forEach(a=>{n[a]=`FY${String(a).slice(2)}`}),{headerName:"Untitled Proposal",years:t,columnLabels:n,groups:[]}}function E_(e){return{fin_eval_header_id:0,proposal_id:Number(e.proposal_id)||0,proposal_title:"Untitled Proposal",local_currency:"",display_currency:"",exchange_rate:0,hurdle_rate_percent:0,discount_rate_percent:0,share_repurchase_percent:0,amortisation_period_years:0,date_placed_in_service:"",tax_rate_percent:0,display_years:6,kpi_type:"",npv:null,irr_percent:null,payback_period_years:null,total_cash_inflow:null,total_cash_outflow:null,gross_profit:null,gross_margin_percent:null,total_contract_value_kpi:null,number_of_years:null,annual_contract_value:null,total_lease_value:null,lease_terms_years:null,investment:null,performance_metrics:null,region_id:null,entity_id:null,business_unit_id:null,status:"ACTIVE",language_code:"EN",sections:[]}}function A_(e){var c,o;const t=(c=e==null?void 0:e.data)==null?void 0:c[0];if(!t)return null;const n=t.sections||[];let a=[];for(const u of n){const f=(o=u.lines)==null?void 0:o[0];if(f!=null&&f.year_values){a=Object.keys(f.year_values).filter(p=>p!=="total").sort();break}}const l=a.map(u=>{const f=parseInt(u.replace(/\D/g,""),10);return f<100?2e3+f:f}),i={};l.forEach((u,f)=>{i[u]=a[f].toUpperCase()});const r=[...n].sort((u,f)=>(u.display_order??0)-(f.display_order??0)).map(u=>{const f=[...u.lines||[]].sort((p,d)=>(p.display_order??0)-(d.display_order??0)).map(p=>{var v,S;const d={};a.forEach((j,y)=>{var b,_;const g=(_=(b=p.year_values)==null?void 0:b[j])==null?void 0:_.spc_projected_amount;d[l[y]]=g!=null?Number(g):0});const m=(S=(v=p.year_values)==null?void 0:v.total)==null?void 0:S.spc_projected_amount;return{id:`val-${p.fin_eval_line_id}`,name:p.line_item_name??"Line Item",yearValues:d,rowTotal:m!=null?Number(m):void 0,accountId:p.account??void 0,lineType:p.line_type??"",lineId:p.fin_eval_line_id,sectionId:p.fin_eval_section_id,lineIdentifier:p.line_identifier??"Financial",isCalculated:p.is_calculated??"N",displayOrder:p.display_order,status:p.status??"ACTIVE",languageCode:p.language_code??"EN"}});return{id:`grp-${u.fin_eval_section_id}`,name:u.section_name??"Section",expanded:!0,values:f,sectionId:u.fin_eval_section_id,sectionType:u.section_type??"CUSTOM",isCustom:u.is_custom??"N",displayOrder:u.display_order,status:u.status??"ACTIVE",languageCode:u.language_code??"EN",rawSection:u}});return{table:{headerName:t.proposal_title??"Untitled Proposal",years:l,columnLabels:i,groups:r},rawHeader:t}}let Xs=null;async function T_(e){if(Xs)return Xs;const t=await at(e);return Xs=lt(t),Xs}async function C_(e){const t=await T_(e),n=await fetch(j_(e),{headers:{Accept:"application/json",Authorization:`Bearer ${t}`}});if(!n.ok)throw new Error(`HTTP ${n.status}: ${n.statusText}`);const a=await n.json(),l=A_(a);return l||{table:w_(),rawHeader:E_(e)}}const U0=e=>(e.scenario||"").trim().toLowerCase()==="actual",_n=e=>e==null?"":String(e);function O_(e){return((e==null?void 0:e.items)??[]).map(t=>({month:_n(t.month),gl:_n(t["gl account"]),desc:_n(t["gl description"])||_n(t.description),amount:typeof t.amount=="number"?t.amount:Number(t.amount)||0,scenario:_n(t.scenario)||"Actual",proposalCode:_n(t["proposal code"]),lineItem:_n(t["line item"]),source:_n(t.source),transactionType:_n(t["transaction type"])}))}const D_="/GIS/PIR/actualDrilldown";function z_(e){if(!e.api_endpoint)throw new Error("Missing api_endpoint in window.__APP_CONFIG__");return`${e.api_endpoint}${D_}`}function M_(e,t,n,a){const l=a??e.proposal_id;return{proposal_id:Number.isFinite(Number(l))&&Number(l)>0?l:void 0,fin_eval_line_id:t!=null&&t!==""?t:void 0,fy:n||void 0}}function R_(){var n;const e=typeof window<"u"?(n=window.__APP_CONFIG__)==null?void 0:n.dev_token:void 0,t={BASE_URL:"/",MODE:"production",DEV:!1,PROD:!0,SSR:!1}.VITE_PIR_TOKEN;return e||t}async function U_(e,t,n,a){const i=R_()||lt(await at(e)),r=z_(e),c=M_(e,t,n,a);console.log("[actualDrilldown] request",{url:r,headers:c});const o=[];let u=0;for(let f=0;f<1e3;f++){const p=r.includes("?")?"&":"?",d=await ea(`${r}${p}offset=${u}`,i,void 0,c,e),m=(d==null?void 0:d.items)??[];if(o.push(...m),!(d!=null&&d.hasMore)||m.length===0)break;u+=m.length}return console.log("[actualDrilldown] rows",o.length),O_({items:o})}const Cl=e=>e==null?"":String(e),Ca=(e,...t)=>{for(const n of t)if(e[n]!=null)return e[n]};function k_(e){return((e==null?void 0:e.items)??[]).map((t,n)=>{const a=Ca(t,"amount","AMOUNT");return{id:Cl(Ca(t,"id","trx_id","transaction_id","ID"))||`U${String(n+1).padStart(3,"0")}`,month:Cl(Ca(t,"month","MONTH")),gl:Cl(Ca(t,"gl account","gl_account","gl_string","GL_ACCOUNT")),desc:Cl(Ca(t,"gl description","gl_description","description","DESCRIPTION")),amount:typeof a=="number"?a:Number(a)||0,scenario:Cl(Ca(t,"scenario","scenerio","SCENARIO"))||"Actual",source:Cl(Ca(t,"source","source_document","SOURCE"))}})}const L_="/GIS/PIR/unmappedTrx";function k0(e){if(!e.api_endpoint)throw new Error("Missing api_endpoint in window.__APP_CONFIG__");return`${e.api_endpoint}${L_}`}function L0(e){const t=parseInt(String(e??"").replace(/\D/g,""),10);return Number.isFinite(t)?t<100?2e3+t:t:null}function H0(){var n;const e=typeof window<"u"?(n=window.__APP_CONFIG__)==null?void 0:n.dev_token:void 0,t={BASE_URL:"/",MODE:"production",DEV:!1,PROD:!0,SSR:!1}.VITE_PIR_TOKEN;return e||t}async function H_(e,t,n,a){const l=a??e.proposal_id,r=H0()||lt(await at(e)),c=k0(e),o={proposal_id:Number.isFinite(Number(l))&&Number(l)>0?l:void 0,section_id:t!=null&&t!==""?t:void 0,fiscal_year:L0(n)??void 0},u=await ea(c,r,void 0,o,e);return console.log("[UnmappedTrx] request",{url:c,headers:o}),console.log("[UnmappedTrx] response",u),k_(u)}async function B_(e,t){const l={"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${H0()||lt(await at(e))}`};for(const[u,f]of Object.entries(In(e)))f!=null&&(l[u]=String(f));const i=k0(e);console.log("[UnmappedTrx] POST",i),console.log(`[UnmappedTrx] POST body
`+JSON.stringify(t,null,2));const r=new AbortController,c=setTimeout(()=>r.abort(new DOMException("Request timed out after 5 minutes","TimeoutError")),Li);let o;try{o=await fetch(i,{method:"POST",headers:l,body:JSON.stringify(t),signal:r.signal})}catch(u){if(r.signal.aborted){const f=r.signal.reason;throw new Error(f instanceof Error||f instanceof DOMException?f.message:"Request timed out after 5 minutes")}throw u instanceof Error?u:new Error(String(u))}finally{clearTimeout(c)}if(!o.ok){const u=await o.text().catch(()=>"");throw console.error("[UnmappedTrx] POST failed",o.status,u),new Error(El(u)||`HTTP ${o.status}: ${o.statusText}${u?` — ${u}`:""}`)}console.log("[UnmappedTrx] POST ok",o.status),Hi("POST unmappedTrx")}function B0({title:e}){return s.jsx("span",{className:"pir-pd-fmt-info",tabIndex:0,role:"img","aria-label":e,title:e,children:s.jsxs("svg",{width:"15",height:"15",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2","aria-hidden":"true",focusable:"false",children:[s.jsx("circle",{cx:"12",cy:"12",r:"10"}),s.jsx("line",{x1:"12",y1:"11",x2:"12",y2:"16"}),s.jsx("line",{x1:"12",y1:"7.5",x2:"12",y2:"7.5",strokeLinecap:"round"})]})})}function Y_(){var a;const e=Ys(),t=TS(),n=((a=bn.find(l=>l.key===e.scale))==null?void 0:a.name)??"";return s.jsxs("div",{className:"pir-pd-fmt-bar",role:"group","aria-label":"Display format",children:[s.jsxs("div",{className:"pir-pd-fmt-group",children:[s.jsx("span",{className:"pir-pd-fmt-label",children:"CURRENCY"}),s.jsx("span",{className:"pir-pd-fmt-chip",children:`${t.symbol} ${t.code}`}),s.jsx(B0,{title:`Amounts are shown in the proposal's display currency (${t.code}). No conversion is applied.`})]}),s.jsx("span",{className:"pir-pd-fmt-divider","aria-hidden":"true"}),s.jsxs("div",{className:"pir-pd-fmt-group",children:[s.jsx("span",{className:"pir-pd-fmt-label",id:"pir-pd-fmt-scale-label",children:"SCALE"}),s.jsx("div",{className:"pir-pd-fmt-segmented",role:"group","aria-labelledby":"pir-pd-fmt-scale-label",children:bn.map(l=>s.jsx("button",{type:"button",className:`pir-pd-fmt-seg ${e.scale===l.key?"pir-pd-fmt-seg-active":""}`,onClick:()=>_S(l.key),"aria-pressed":e.scale===l.key,title:`Show every amount in ${l.name.toLowerCase()}`,children:l.key},l.key))}),s.jsx(B0,{title:`Every amount across all tabs is divided down to ${n.toLowerCase()} and suffixed ${e.scale}. Percentages and year counts are never scaled.`})]}),s.jsx("span",{className:"pir-pd-fmt-divider","aria-hidden":"true"}),s.jsxs("div",{className:"pir-pd-fmt-group",children:[s.jsx("label",{className:"pir-pd-fmt-label",htmlFor:"pir-pd-fmt-number",children:"NUMBER"}),s.jsx("select",{id:"pir-pd-fmt-number",className:"pir-pd-fmt-select",value:e.number,onChange:l=>NS(l.target.value),children:Bs.map(l=>s.jsx("option",{value:l.key,children:l.sample},l.key))})]}),s.jsx("span",{className:"pir-pd-fmt-divider","aria-hidden":"true"}),s.jsxs("div",{className:"pir-pd-fmt-group",children:[s.jsx("label",{className:"pir-pd-fmt-label",htmlFor:"pir-pd-fmt-date",children:"DATE"}),s.jsx("select",{id:"pir-pd-fmt-date",className:"pir-pd-fmt-select",value:e.date,onChange:l=>jS(l.target.value),children:_0.map(l=>s.jsx("option",{value:l.key,children:l.sample},l.key))})]}),s.jsx("style",{children:`
        .pir-pd-fmt-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px;
          /* Aligns with .pir-pd-tab-panel's 8px padding, so the bar lines up
             with the cards below it rather than sitting flush to the edge. */
          margin: 8px 8px 0;
          padding: 10px 18px;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(29, 38, 51, 0.05);
        }

        .pir-pd-fmt-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pir-pd-fmt-label {
          color: #1D2C4D;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
        }

        .pir-pd-fmt-divider {
          width: 1px;
          height: 24px;
          background: #e6e9ee;
        }

        /* Display-only currency chip — deliberately not a button */
        .pir-pd-fmt-chip {
          display: inline-flex;
          align-items: center;
          height: 30px;
          padding: 0 14px;
          border-radius: 6px;
          background: #1D2C4D;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .pir-pd-fmt-segmented {
          display: inline-flex;
          border: 1px solid #d5dbe7;
          border-radius: 6px;
          overflow: hidden;
        }

        .pir-pd-fmt-seg {
          min-width: 38px;
          height: 30px;
          padding: 0 12px;
          border: 0;
          border-right: 1px solid #d5dbe7;
          background: #ffffff;
          color: #1D2C4D;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .pir-pd-fmt-seg:last-child { border-right: 0; }

        .pir-pd-fmt-seg:hover:not(.pir-pd-fmt-seg-active) {
          background: #dde2ec69;
        }

        .pir-pd-fmt-seg-active {
          background: #1D2C4D;
          color: #ffffff;
        }

        .pir-pd-fmt-select {
          height: 30px;
          min-width: 130px;
          padding: 0 8px;
          border: 1px solid #d5dbe7;
          border-radius: 6px;
          background: #ffffff;
          color: #1D2C4D;
          font: inherit;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-fmt-select:focus {
          outline: none;
          border-color: #9db7e8;
          box-shadow: 0 0 0 2px rgba(157, 183, 232, 0.22);
        }

        .pir-pd-fmt-info {
          display: inline-flex;
          align-items: center;
          color: #9aa3b2;
          cursor: help;
        }

        .pir-pd-fmt-info:hover,
        .pir-pd-fmt-info:focus { color: #1D2C4D; }
      `})]})}const $_={report:s.jsxs(s.Fragment,{children:[s.jsx("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),s.jsx("polyline",{points:"14 2 14 8 20 8"}),s.jsx("line",{x1:"16",y1:"13",x2:"8",y2:"13"}),s.jsx("line",{x1:"16",y1:"17",x2:"8",y2:"17"})]}),chart:s.jsxs(s.Fragment,{children:[s.jsx("line",{x1:"18",y1:"20",x2:"18",y2:"10"}),s.jsx("line",{x1:"12",y1:"20",x2:"12",y2:"4"}),s.jsx("line",{x1:"6",y1:"20",x2:"6",y2:"14"})]}),search:s.jsxs(s.Fragment,{children:[s.jsx("circle",{cx:"11",cy:"11",r:"8"}),s.jsx("line",{x1:"21",y1:"21",x2:"16.65",y2:"16.65"})]}),summary:s.jsxs(s.Fragment,{children:[s.jsx("path",{d:"M12 20h9"}),s.jsx("path",{d:"M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"})]}),comments:s.jsx("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"}),refresh:s.jsxs(s.Fragment,{children:[s.jsx("polyline",{points:"23 4 23 10 17 10"}),s.jsx("polyline",{points:"1 20 1 14 7 14"}),s.jsx("path",{d:"M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"})]}),lock:s.jsxs(s.Fragment,{children:[s.jsx("rect",{x:"3",y:"11",width:"18",height:"11",rx:"2",ry:"2"}),s.jsx("path",{d:"M7 11V7a5 5 0 0 1 10 0v4"})]}),check:s.jsx("polyline",{points:"20 6 9 17 4 12"}),plus:s.jsxs(s.Fragment,{children:[s.jsx("circle",{cx:"12",cy:"12",r:"10"}),s.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"16"}),s.jsx("line",{x1:"8",y1:"12",x2:"16",y2:"12"})]}),list:s.jsxs(s.Fragment,{children:[s.jsx("line",{x1:"8",y1:"6",x2:"21",y2:"6"}),s.jsx("line",{x1:"8",y1:"12",x2:"21",y2:"12"}),s.jsx("line",{x1:"8",y1:"18",x2:"21",y2:"18"}),s.jsx("line",{x1:"3",y1:"6",x2:"3.01",y2:"6"}),s.jsx("line",{x1:"3",y1:"12",x2:"3.01",y2:"12"}),s.jsx("line",{x1:"3",y1:"18",x2:"3.01",y2:"18"})]}),database:s.jsxs(s.Fragment,{children:[s.jsx("ellipse",{cx:"12",cy:"5",rx:"9",ry:"3"}),s.jsx("path",{d:"M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"}),s.jsx("path",{d:"M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"})]}),link:s.jsxs(s.Fragment,{children:[s.jsx("path",{d:"M15 7h3a5 5 0 0 1 0 10h-3m-6 0H6a5 5 0 0 1 0-10h3"}),s.jsx("line",{x1:"8",y1:"12",x2:"16",y2:"12"})]}),camera:s.jsxs(s.Fragment,{children:[s.jsx("path",{d:"M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"}),s.jsx("circle",{cx:"12",cy:"13",r:"4"})]}),bell:s.jsxs(s.Fragment,{children:[s.jsx("path",{d:"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"}),s.jsx("path",{d:"M13.73 21a2 2 0 0 1-3.46 0"})]}),clock:s.jsxs(s.Fragment,{children:[s.jsx("circle",{cx:"12",cy:"12",r:"10"}),s.jsx("polyline",{points:"12 6 12 12 16 14"})]}),calendar:s.jsxs(s.Fragment,{children:[s.jsx("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2",ry:"2"}),s.jsx("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),s.jsx("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),s.jsx("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]}),save:s.jsxs(s.Fragment,{children:[s.jsx("path",{d:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"}),s.jsx("polyline",{points:"17 21 17 13 7 13 7 21"}),s.jsx("polyline",{points:"7 3 7 8 15 8"})]})};function Te({name:e,size:t=16}){return s.jsx("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",focusable:"false",children:$_[e]})}const Y0=[{key:"reporting",label:"PIR Reporting"},{key:"forecast",label:"Forecast vs Actuals"},{key:"drilldown",label:"Actuals Drilldown"}],$0=5e3,G_=[{key:"summary",icon:"summary",title:"Executive PIR Summary",hint:"Required for PIR sign-off",intro:"Provide a high-level executive summary of the Post-Implementation Review. Include:",bullets:["Overall assessment of the investment against original business case","Key achievements and milestones reached","Critical risks or issues identified during implementation","Recommendations for future investment cycles","Lessons learned for the organisation"]},{key:"lessons",icon:"comments",title:"Lessons Learned",hint:"Stakeholder comments and sign-offs",intro:"Capture lessons learned from the investment. Include:",bullets:["What went well during implementation","What could have been done differently","Key risks that materialised and how they were managed","Process improvements for future capital projects","Recommendations for the organisation","Action items and responsible parties"]}],q_=e=>`${e.intro}

${e.bullets.map(t=>`• ${t}`).join(`
`)}`,Qs=e=>e.toLowerCase().replace(/\b\w/g,t=>t.toUpperCase());function V_(){var Ey,Ay,Ty,Cy;const e=Aa(),t=Aa("kpi"),n=Aa("snapshots"),a=Aa("unmapped"),l=Aa("drilldown"),i=Ys(),[r,c]=x.useState(Y0[0].key),[o,u]=x.useState([]),[f,p]=x.useState(null),[d,m]=x.useState(!0),[v,S]=x.useState(null),j=()=>{let h=!1;m(!0),S(null);const N=_e();return!ki(N)&&!$2(N)?(u([]),p(null),S("No proposal selected — set a valid proposal_id (or spc_type_id + spc_type_template_id) to load this report."),m(!1),()=>{h=!0}):(h_(N).then(H=>{h||(u(H.tiles),p(H.rag),H.proposalCode&&$e(H.proposalCode))}).catch(H=>{h||S(H instanceof Error?H.message:"Failed to load KPIs")}).finally(()=>{h||m(!1)}),()=>{h=!0})};x.useEffect(j,[t]),x.useEffect(()=>{let h=!1;const N=_e();if(ki(N))return C_(N).then(({rawHeader:H})=>{h||ES(H.display_currency||H.local_currency)}).catch(H=>{console.warn("[ForecastDashboard] currency lookup failed",H)}),()=>{h=!0}},[e]);const[y,g]=x.useState([]),[b,_]=x.useState(!0),[T,O]=x.useState(null),[w,z]=x.useState(!1),[R,L]=x.useState(null),ee=async()=>{if(!w){z(!0),L(null);try{await N_(_e())}catch(h){const N=h instanceof Error?h.message:"Re-capture failed";console.error("[Snapshots] recapture failed",h),L(N)}finally{z(!1)}}};x.useEffect(()=>{let h=!1;_(!0),O(null);const N=_e();return __(N).then(H=>{var te,F;if(!h&&(g(H),!Q.current)){Q.current=!0;const Ve=((te=H.find(Ht=>Ht.pirExecutiveSummary))==null?void 0:te.pirExecutiveSummary)??"",qe=((F=H.find(Ht=>Ht.pirLessonsLearned))==null?void 0:F.pirLessonsLearned)??"";(Ve||qe)&&X({summary:Ve,lessons:qe})}}).catch(H=>{h||O(H instanceof Error?H.message:"Failed to load snapshots")}).finally(()=>{h||_(!1)}),()=>{h=!0}},[n]);const[B,X]=x.useState({summary:"",lessons:""}),Q=x.useRef(!1),[k,E]=x.useState(null),M=x.useRef(void 0),D=h=>{E(h),window.clearTimeout(M.current),M.current=window.setTimeout(()=>E(null),2800)};x.useEffect(()=>()=>window.clearTimeout(M.current),[]);const Y=(h,N)=>X(H=>({...H,[h]:N})),[G,Ke]=x.useState(null);x.useEffect(()=>{let h=!1;const N=_e();return Promise.all([v0(N),g0(N)]).then(([H,te])=>{h||Ke(y0(H,te))}).catch(()=>{}),()=>{h=!0}},[e]);const it=((G==null?void 0:G.sections)??[]).map(h=>({title:h.title,items:h.rows.filter(N=>N.type==="line"&&N.label.trim()!=="")})).filter(h=>h.items.length>0),[xt,Ye]=x.useState(""),[C,q]=x.useState(null),[U,ae]=x.useState(""),[$,ne]=x.useState([]),[ce,$e]=x.useState(""),Ge=ce||"—",[Ne,rt]=x.useState(!1),[Fe,na]=x.useState(null),[aa,st]=x.useState(null),[Oa,Q_]=x.useState(!0),[Yi,Z_]=x.useState(!0),[Zs,K_]=x.useState(!0),[Dt,F_]=x.useState([]),[$i,G0]=x.useState(!0),[Gi,q0]=x.useState(null),bd=(C==null?void 0:C.finEvalSectionId)??null,xd=U||(C==null?void 0:C.fy)||null;x.useEffect(()=>{let h=!1;return G0(!0),q0(null),H_(_e(),bd,xd).then(N=>{h||F_(N)}).catch(N=>{h||q0(N instanceof Error?N.message:"Failed to load unmapped transactions")}).finally(()=>{h||G0(!1)}),()=>{h=!0}},[bd,xd,a]),x.useEffect(()=>{Ks(new Set),Nd(""),Ft(null)},[bd,xd]);const V0=Dt.reduce((h,N)=>h+N.amount,0),[Sd,Ks]=x.useState(new Set),[_d,Nd]=x.useState(""),[X0,Ft]=x.useState(null),[Q0,jd]=x.useState(!1),wd=x.useRef(null),Ed=Dt.filter((h,N)=>Sd.has(N)),Nn=Ed.length,J_=Ed.reduce((h,N)=>h+N.amount,0),Ad=Dt.length>0&&Nn===Dt.length,Fs=C?Qs(C.label):"selected line";x.useEffect(()=>{wd.current&&(wd.current.indeterminate=Nn>0&&!Ad)},[Nn,Ad]);const P_=h=>{Ft(null),Ks(N=>{const H=new Set(N);return H.has(h)?H.delete(h):H.add(h),H})},W_=h=>{Ft(null),Ks(h?new Set(Dt.map((N,H)=>H)):new Set)},I_=async()=>{if(Nn===0)return;if(!_d.trim()){Ft("A mapping comment is required.");return}const h=_e(),N=Number(h.proposal_id);if(!C||!Number.isFinite(N)||N<=0){Ft("Open a line from the Forecast vs Actuals report before mapping.");return}const H=Ed.map(F=>({yearperiod:id(F.month)??0,gl_string:F.gl,dr_cr:F.amount<0?"CR":"DR",amount:Math.abs(F.amount),source_document:F.source})),te=H.filter(F=>!F.yearperiod);if(te.length>0){Ft(`Could not derive a year/period (YYYYMM) for ${te.length} selected transaction(s).`);return}jd(!0),Ft(null);try{await B_(h,{proposal_id:N,fin_eval_section_id:C.finEvalSectionId??null,fin_eval_line_id:C.finEvalLineId,mapping_comment:_d.trim(),transactions:H})}catch(F){Ft(F instanceof Error?F.message:"Failed to map transactions"),jd(!1);return}jd(!1),Ks(new Set),Nd(""),Ft(null),st(`${Nn} transaction${Nn===1?"":"s"} mapped to ${Fs}.`)},eN=h=>{var te;const N=(h??"").toString();return/^fy/i.test(N)?N.toUpperCase():(((te=G==null?void 0:G.years.find(F=>/^fy/i.test(F.key)))==null?void 0:te.key)??N).toUpperCase()},tN=h=>{const N=_e();if(!ki(N)){Td([]),Dd([]);return}const H=eN(h);mS(N,H,N.proposal_id).then(te=>{console.log("[Adjustments] parsed rows",te),console.log(`[Adjustments] split → ACTUALS ${te.filter(F=>F.scenario==="ACTUALS").length} · FORECAST ${te.filter(F=>F.scenario==="FORECAST").length}`),Td(te.filter(F=>F.scenario==="ACTUALS")),Dd(te.filter(F=>F.scenario==="FORECAST"))}).catch(te=>{console.error("[Adjustments] load failed",{fy:H,proposal_id:N.proposal_id},te)})},Z0=(h,N)=>{c("drilldown"),q(h),Ye(h.id),ne([]),ae(N!=null&&N.fy&&N.fy!=="NULL"?N.fy:h.fy)};x.useEffect(()=>{if(!C)return;let h=!1;const N=U||C.fy;return rt(!0),na(null),tN(N),U_(_e(),C.finEvalLineId,N).then(H=>{var F;if(h)return;ne(H);const te=(F=H.find(Ve=>Ve.proposalCode))==null?void 0:F.proposalCode;te&&$e(te)}).catch(H=>{h||na(H instanceof Error?H.message:"Failed to load actuals")}).finally(()=>{h||rt(!1)}),()=>{h=!0}},[C,U,l]);const nN=h=>{var N,H,te,F;if(Ye(h),h&&h!==""&&!ki(_e())){q(null),ne([]),na(null),st("No proposal created yet — these line items are template defaults, so there are no actual transactions to drill down. Create a proposal to see its actuals here.");return}if(st(null),G&&h&&h!=="all")for(const Ve of G.sections){const qe=Ve.rows.find(Ht=>Ht.id===h&&Ht.type==="line");if(qe&&qe.finEvalLineId!=null&&qe.finEvalLineId!==""){const Ht=G.years.find(NN=>!NN.isTotal)??G.years[0];Z0({id:qe.id,finEvalLineId:qe.finEvalLineId,finEvalSectionId:Ve.finEvalSectionId??null,account:qe.account??"",fy:Ht.key,label:qe.label,section:Ve.title,spc:((N=qe.cells[0])==null?void 0:N.spc)??"-",ytd:((H=qe.cells[0])==null?void 0:H.ytd)??"-",spcNum:((te=qe.cells[0])==null?void 0:te.spcNum)??null,ytdNum:((F=qe.cells[0])==null?void 0:F.ytdNum)??null,whole:!0});return}}q(null),ne([]),na(null)},[Ol,Td]=x.useState([]),[K0,aN]=x.useState(""),[Cd,lN]=x.useState("Dr"),[Od,F0]=x.useState(""),[J0,P0]=x.useState(""),[W0,I0]=x.useState(""),[ey,ty]=x.useState(!1),[ny,Js]=x.useState(null),[qi,Dd]=x.useState([]),[ay,iN]=x.useState(""),[ly,rN]=x.useState("Dr"),[iy,ry]=x.useState(""),[sy,cy]=x.useState(""),[oy,uy]=x.useState(""),Dl=h=>h.drCr==="Cr"?-h.amount:h.amount,sN=h=>!U0(h),zl=$.filter(U0),Vi=$.filter(sN),cN=zl.length+Ol.length,Ml=zl.reduce((h,N)=>h+N.amount,0)+Ol.reduce((h,N)=>h+Dl(N),0),oN=Vi.length+qi.length,Rl=Vi.reduce((h,N)=>h+N.amount,0)+qi.reduce((h,N)=>h+Dl(N),0),dy=zl.reduce((h,N)=>h+N.amount,0),py=Ol.reduce((h,N)=>h+Dl(N),0),fy=Vi.reduce((h,N)=>h+N.amount,0),my=qi.reduce((h,N)=>h+Dl(N),0),hy=dy+py+fy+my,Xi=4,Ps=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],Ws=zl.map(h=>id(h.month)).filter(h=>h!=null).reduce((h,N)=>Math.max(h,N),0),uN=`${Ps[Xi-1]} – ${Ps[(Xi+10)%12]}`,dN=(()=>{if(!Ws)return"—";const h=Math.floor(Ws/100),N=Ws%100;return`MMC${(N-Xi+12)%12+1} (${Ps[N-1]} ${h})`})(),zd=L0(U||(C==null?void 0:C.fy)),gy=zd==null?[]:Array.from({length:12},(h,N)=>{const H=(Xi-1+N)%12+1;return(H>=Xi?zd-1:zd)*100+H}),yy=h=>`${Ps[h%100-1]}'${String(h).slice(2,4)}`,vy=new Date,by=new Date(vy.getFullYear(),vy.getMonth()-1,1),xy=by.getFullYear()*100+by.getMonth()+1,Sy=Math.min(Ws||xy,xy),Qi=gy.filter(h=>h<=Sy).map(yy),Is=gy.filter(h=>h>Sy).map(yy),Zi=Qi.includes(K0)?K0:Qi[Qi.length-1]??"",Md=Is.includes(ay)?ay:Is[0]??"",pN=async()=>{const h=parseFloat(W0.replace(/,/g,""));if(!Number.isFinite(h)||h===0||!Zi)return;const N=_e(),H=J0.trim()||"Manual adjustment",te=id(Zi);if(te==null){Js(`Could not derive year/period (YYYYMM) from month "${Zi}"`);return}if(!C||C.finEvalLineId==null||C.finEvalLineId===""){Js("Open a line from the Forecast vs Actuals report before adding an adjustment");return}const F=Number(N.created_by);ty(!0),Js(null);try{await S0(N,{proposal_id:Number(N.proposal_id)||516,adjustment_type:"ACTUALS",adjustment_level:"LINE_ITEM",fin_eval_section_id:C.finEvalSectionId??null,fin_eval_line_id:C.finEvalLineId,yearperiod:te,dr_cr:Cd.toUpperCase(),gl_string:Od.trim(),description:H,amount:Math.abs(h),...Number.isFinite(F)&&F>0?{created_by:F}:{}}),Td(Ve=>[...Ve,{id:`adj-${Ve.length}-${Date.now()}`,month:Zi,drCr:Cd,gl:Od.trim()||"—",desc:H,amount:Math.abs(h)}]),F0(""),P0(""),I0("")}catch(Ve){Js(Ve instanceof Error?Ve.message:"Failed to save adjustment")}finally{ty(!1)}},fN=()=>{const h=parseFloat(oy.replace(/,/g,""));!Number.isFinite(h)||h===0||!Md||(Dd(N=>[...N,{id:`fadj-${N.length}-${Date.now()}`,month:Md,drCr:ly,gl:iy.trim()||"—",desc:sy.trim()||"Forecast adjustment",amount:Math.abs(h)}]),ry(""),cy(""),uy(""))},mN=h=>{if(!h)return"";const N=parseInt(h.replace(/\D/g,""),10);if(!Number.isFinite(N))return h.toUpperCase();const H=String(N).padStart(2,"0");return`FY ${String(N-1).padStart(2,"0")}/${H}`},Re=h=>pd(h,i),hN=h=>{const N=parseFloat((h||"").replace(/[^0-9.-]/g,""));return Number.isFinite(N)?N:0},Rd=(C==null?void 0:C.spcNum)??hN(C==null?void 0:C.spc),Ud=Rd-hy,gN=Rd===0?0:Math.abs(Ud/Rd*100),_y=Ud>=0,yN=h=>s.jsx("span",{className:h!=null&&h<0?"pir-pd-amount-neg":"",children:h==null?"$0":pd(h,i)}),Ki=(h,N)=>h==null?N:pd(h,i),vN=h=>/6-?month/i.test(h)?"Mid-year assessment — review benefit realisation progress, confirm PIR forecast adjustments, update risk register":/12-?month/i.test(h)?"Full-year review — complete FY actuals reconciliation, executive summary sign-off, lessons learned capture":/24-?month/i.test(h)?"Two-year investment review — cumulative actuals reconciliation, benefit realisation measurement, forecast re-baseline":"Scheduled post-implementation review milestone.",bN=h=>US(h,i),Ny=864e5,xN=y.findIndex(h=>(h.status||"").toUpperCase()==="FUTURE"&&!!h.milestoneDate),jy=y.map((h,N)=>{const F=(h.status||"").toUpperCase()==="CAPTURED"?"completed":N===xN?"upcoming":"future",Ve=(()=>{if(F!=="upcoming"||!h.milestoneDate)return null;const qe=new Date(h.milestoneDate);if(Number.isNaN(qe.getTime()))return null;const Ht=Math.floor(qe.getTime()/Ny)-Math.floor(Date.now()/Ny);return Ht>0?Ht:null})();return{key:h.title,title:/pir/i.test(h.title)?h.title:h.title.replace(/\s*Review$/i," PIR Review"),date:bN(h.milestoneDate),description:vN(h.title),state:F,daysAway:Ve}}),wy=((Ey=y.find(h=>h.proposalCode))==null?void 0:Ey.proposalCode)??ce,SN=((Ay=y.find(h=>h.proposalTitle))==null?void 0:Ay.proposalTitle)??"—",_N=((Ty=y.find(h=>h.investmentNum!=null))==null?void 0:Ty.investmentNum)??((Cy=y.find(h=>h.totalNum!=null))==null?void 0:Cy.totalNum)??null,ec=(()=>{var te;const h=(te=y.find(F=>F.pirStatus))==null?void 0:te.pirStatus;if(!h)return{label:"—",tone:"muted"};const N=h.toUpperCase(),H=Qs(h.replace(/_/g," "));return/REAPPROV/.test(N)?{label:H,tone:"red",icon:"bell"}:/ATTENTION|RISK|OVERDUE/.test(N)?{label:H,tone:"amber",icon:"bell"}:/ON.?TRACK|COMPLETE|APPROVED|CLOSED|PASS/.test(N)?{label:H,tone:"green",icon:"check"}:{label:H,tone:"muted"}})(),kd=ki(_e());return s.jsxs("div",{className:"pir-pd-dashboard-root",children:[s.jsxs("div",{className:"pir-pd-sticky-head",children:[s.jsx("nav",{className:"pir-pd-tab-bar","aria-label":"Primary",children:Y0.map(h=>s.jsx("button",{type:"button",className:`pir-pd-tab-button ${r===h.key?"pir-pd-tab-active":""}`,onClick:()=>c(h.key),"aria-current":r===h.key?"page":void 0,children:h.label},h.key))}),s.jsx(Y_,{})]}),r==="forecast"&&s.jsxs("div",{className:"pir-pd-tab-panel",children:[s.jsxs("section",{className:"pir-pd-kpi-card","aria-label":"Executive KPI Tiles",children:[s.jsx("div",{className:"pir-pd-kpi-card-header",children:s.jsxs("div",{className:"pir-pd-kpi-card-heading",children:[s.jsx("span",{className:"pir-pd-kpi-heading-icon","aria-hidden":"true",children:s.jsx(Te,{name:"chart",size:18})}),s.jsxs("div",{children:[s.jsx("div",{className:"pir-pd-kpi-heading-title",children:"Executive KPI Tiles — Financial Metrics (RAG Status)"}),s.jsx("div",{className:"pir-pd-kpi-heading-sub",children:"SPC Approved vs Actuals with hurdle thresholds"})]})]})}),f&&o.length>0&&s.jsxs("div",{className:"pir-pd-rag-summary",children:[f.red.count>0&&s.jsxs("span",{className:"pir-pd-rag-item",children:[s.jsx("span",{className:"pir-pd-rag-dot pir-pd-rag-red","aria-hidden":"true"}),s.jsxs("span",{className:"pir-pd-rag-count",children:[f.red.count," Red"]}),s.jsxs("span",{className:"pir-pd-rag-desc",children:["— ",f.red.names.join(", ")]}),f.needsReapproval&&s.jsx("span",{className:"pir-pd-reapproval-pill",children:"Needs Reapproval"})]}),f.amber.count>0&&s.jsxs("span",{className:"pir-pd-rag-item",children:[s.jsx("span",{className:"pir-pd-rag-dot pir-pd-rag-amber","aria-hidden":"true"}),s.jsxs("span",{className:"pir-pd-rag-count",children:[f.amber.count," Amber"]}),s.jsxs("span",{className:"pir-pd-rag-desc",children:["— ",f.amber.names.join(", ")]})]}),f.green.count>0&&s.jsxs("span",{className:"pir-pd-rag-item",children:[s.jsx("span",{className:"pir-pd-rag-dot pir-pd-rag-green","aria-hidden":"true"}),s.jsxs("span",{className:"pir-pd-rag-count",children:[f.green.count," Green"]}),s.jsxs("span",{className:"pir-pd-rag-desc",children:["— ",f.green.names.join(", ")]})]})]}),d&&o.length===0&&s.jsx("div",{className:"pir-pd-kpi-state",children:"Loading KPI tiles…"}),v&&o.length===0&&s.jsxs("div",{className:"pir-pd-kpi-state pir-pd-kpi-error",children:["Couldn’t load KPIs: ",v]}),!d&&!v&&o.length===0&&s.jsx("div",{className:"pir-pd-kpi-state",children:"No KPI data available for this proposal."}),o.length>0&&s.jsx("div",{
  className:"pir-pd-kpi-grid",
  children:o
    .filter(h=>{
      const N=String(h.label||"").toUpperCase();
      return N.includes("CAPEX")||N.includes("OPEX")
    }).map(h=>{const N=h.isMoney?MS(h.label,i):h.label,H=h.isMoney?fd(h.valueNum,i):h.value,te=h.isMoney?`SPC Approved ${fd(h.spcNum,i)}`:h.spcApproved,F=h.isMoney?`${fd(h.varianceNum,i)}${h.variancePct==null?"":` (${w0(h.variancePct,i)}%)`}`:h.variance;return s.jsxs("div",{className:`pir-pd-kpi-tile pir-pd-tile-${h.tone}`,children:[s.jsxs("div",{className:"pir-pd-tile-top",children:[s.jsx("span",{className:"pir-pd-tile-label",children:N}),s.jsx("span",{className:`pir-pd-tile-badge pir-pd-badge-${h.tone}`,children:h.badge})]}),s.jsx("div",{className:`pir-pd-tile-value ${/^[-(]/.test(H.trim())?"pir-pd-amount-neg":""}`,children:H}),s.jsx("div",{className:"pir-pd-tile-approved",children:te}),s.jsx("div",{className:"pir-pd-tile-divider"}),s.jsx("div",{className:"pir-pd-tile-meta-label",children:"VARIANCE"}),s.jsx("div",{className:`pir-pd-tile-variance pir-pd-variance-${h.varianceTone}`,children:F}),s.jsxs("div",{className:"pir-pd-tile-footer",children:[h.showHurdle&&s.jsxs("div",{className:"pir-pd-tile-footer-left",children:[s.jsx("div",{className:"pir-pd-tile-meta-label",children:"HURDLE"}),s.jsx("div",{className:"pir-pd-tile-hurdle",children:h.hurdle})]}),s.jsx("div",{className:`pir-pd-tile-status pir-pd-status-${h.statusTone}`,children:h.status})]})]},h.label)})})]}),s.jsx($S,{onActualClick:Z0}),s.jsx(n_,{})]}),r==="drilldown"&&s.jsxs("div",{className:"pir-pd-tab-panel",children:[s.jsxs("div",{className:"pir-pd-title-row",children:[s.jsx("div",{}),s.jsxs("div",{className:"pir-pd-title-right",children:[s.jsxs("select",{className:"pir-pd-line-item-select","aria-label":"Select a line item to drill down",value:xt,onChange:h=>nN(h.target.value),children:[s.jsx("option",{value:"",disabled:!0,children:"— Select a line item —"}),s.jsx("option",{value:"all",children:"All Lines"}),it.map(h=>s.jsx("optgroup",{className:"pir-pd-line-item-group",label:h.title.toUpperCase(),children:h.items.map(N=>s.jsx("option",{value:N.id,children:Qs(N.label)},N.id))},h.title))]}),s.jsx("button",{type:"button",className:"pir-pd-back-button",onClick:()=>c("forecast"),children:"← Back to Forecast vs Actuals"})]})]}),C?s.jsxs(s.Fragment,{children:[s.jsxs("div",{className:"pir-pd-drill-detail-card",children:[s.jsxs("div",{className:"pir-pd-drill-detail-left",children:[s.jsx("span",{className:"pir-pd-drill-detail-icon","aria-hidden":"true",children:s.jsx(Te,{name:"chart",size:22})}),s.jsxs("div",{children:[s.jsx("div",{className:"pir-pd-drill-detail-title",children:Qs(C.label)}),s.jsxs("div",{className:"pir-pd-drill-detail-sub",children:[C.section.toUpperCase(),!C.whole&&s.jsxs(s.Fragment,{children:[" · ",mN(C.fy)]})," · ","Account ",s.jsx("strong",{children:C.account||"—"})," · ","SPC ",s.jsx("strong",{children:Ge})]})]})]}),s.jsxs("div",{className:"pir-pd-drill-detail-right",children:[s.jsxs("div",{children:["FY Calendar: ",uN," · Version: ",s.jsx("strong",{children:dN})]}),s.jsx("div",{children:"Rolled up by Month + GL Account String"})]})]}),s.jsxs("div",{className:"pir-pd-drill-tiles",children:[s.jsxs("div",{className:"pir-pd-drill-tile pir-pd-drill-tile-purple",children:[s.jsx("div",{className:"pir-pd-drill-tile-label",children:"SPC PROJECTED"}),s.jsx("div",{className:"pir-pd-drill-tile-value",children:yN(C.spcNum)})]}),s.jsxs("div",{className:"pir-pd-drill-tile pir-pd-drill-tile-green",children:[s.jsx("div",{className:"pir-pd-drill-tile-label",children:"PIR REFORECAST"}),s.jsx("div",{className:"pir-pd-drill-tile-value",children:s.jsx("span",{className:Ml+Rl<0?"pir-pd-amount-neg":"",children:Re(Ml+Rl)})})]}),s.jsxs("div",{className:"pir-pd-drill-tile pir-pd-drill-tile-amber",children:[s.jsx("div",{className:"pir-pd-drill-tile-label",children:"ALL ADJUSTMENTS"}),s.jsxs("div",{className:"pir-pd-drill-tile-value",children:[Ol.length," ",s.jsx("span",{className:"pir-pd-drill-tile-unit",children:"entries"})]})]}),s.jsxs("div",{className:"pir-pd-drill-tile pir-pd-drill-tile-orange",children:[s.jsx("div",{className:"pir-pd-drill-tile-label",children:"DATALAKE"}),s.jsxs("div",{className:"pir-pd-drill-tile-value",children:[Dt.length," ",s.jsx("span",{className:"pir-pd-drill-tile-unit",children:"unmapped"})]})]})]}),s.jsxs("section",{className:"pir-pd-actuals-tx","aria-label":"Actuals — Financial Transactions",children:[s.jsxs("div",{className:"pir-pd-actuals-tx-header",children:[s.jsxs("div",{className:"pir-pd-actuals-tx-heading",children:[s.jsx("button",{type:"button",className:"pir-pd-drill-section-toggle",onClick:()=>Q_(h=>!h),"aria-expanded":Oa,"aria-label":Oa?"Collapse actuals transactions":"Expand actuals transactions",children:Oa?"▾":"▸"}),s.jsx("span",{className:"pir-pd-actuals-tx-title",children:"Actuals — Financial Transactions (rolled up by Month + GL)"})]}),s.jsxs("span",{className:"pir-pd-actuals-tx-pill",children:[cN," lines ·"," ",s.jsx("span",{className:Ml<0?"pir-pd-amount-neg":"",children:Re(Ml)})]})]}),Oa&&s.jsxs(s.Fragment,{children:[s.jsxs("div",{className:"pir-pd-actuals-tx-note",children:[s.jsx(Te,{name:"lock",size:13})," Actual lines are read-only — sourced from the financial system. Use adjustments below to make Dr/Cr corrections."]}),s.jsxs("table",{className:"pir-pd-actuals-table","aria-label":"Actuals transactions",children:[s.jsx("thead",{children:s.jsxs("tr",{children:[s.jsx("th",{className:"pir-pd-actuals-th pir-pd-actuals-th-month",children:"MONTH"}),s.jsx("th",{className:"pir-pd-actuals-th",children:"GL ACCOUNT"}),s.jsx("th",{className:"pir-pd-actuals-th",children:"GL DESCRIPTION"}),s.jsx("th",{className:"pir-pd-actuals-th pir-pd-actuals-th-amount",children:"AMOUNT"})]})}),s.jsxs("tbody",{children:[Ne&&s.jsx("tr",{children:s.jsx("td",{className:"pir-pd-actuals-state",colSpan:4,children:"Loading actual transactions…"})}),!Ne&&Fe&&s.jsx("tr",{children:s.jsxs("td",{className:"pir-pd-actuals-state pir-pd-actuals-state-error",colSpan:4,children:["Couldn’t load actuals: ",Fe]})}),!Ne&&!Fe&&zl.length===0&&Ol.length===0&&s.jsx("tr",{children:s.jsx("td",{className:"pir-pd-actuals-state",colSpan:4,children:"No actual transactions for this account and fiscal year."})}),!Ne&&!Fe&&zl.map((h,N)=>s.jsxs("tr",{className:"pir-pd-actuals-row",children:[s.jsx("td",{className:"pir-pd-actuals-month",children:h.month}),s.jsx("td",{className:"pir-pd-actuals-gl",children:h.gl}),s.jsx("td",{className:"pir-pd-actuals-desc",children:h.desc}),s.jsx("td",{className:`pir-pd-actuals-amount ${h.amount<0?"pir-pd-actuals-amount-neg":""}`,children:Re(h.amount)})]},`tx-${N}`)),Ol.map(h=>{const N=Dl(h);return s.jsxs("tr",{className:"pir-pd-actuals-row pir-pd-actuals-adj-row",children:[s.jsx("td",{className:"pir-pd-actuals-month",children:h.month}),s.jsxs("td",{className:"pir-pd-actuals-gl",children:[h.gl," ",s.jsxs("span",{className:`pir-pd-actuals-tag pir-pd-actuals-tag-${h.drCr==="Cr"?"cr":"dr"}`,children:[h.drCr," ADJ"]})]}),s.jsx("td",{className:"pir-pd-actuals-desc",children:h.desc}),s.jsx("td",{className:`pir-pd-actuals-amount ${N<0?"pir-pd-actuals-amount-neg":""}`,children:Re(N)})]},h.id)})]}),s.jsx("tfoot",{children:s.jsxs("tr",{className:"pir-pd-actuals-total-row",children:[s.jsx("td",{colSpan:3,children:"TOTAL ACTUALS"}),s.jsx("td",{className:`pir-pd-actuals-amount ${Ml<0?"pir-pd-actuals-total-neg":""}`,children:Re(Ml)})]})})]})]})]}),Oa&&s.jsxs("section",{className:"pir-pd-adj","aria-label":"Add Actuals Adjustment",children:[s.jsxs("div",{className:"pir-pd-adj-title",children:[s.jsx(Te,{name:"plus",size:15})," ADD ACTUALS ADJUSTMENT"]}),s.jsxs("div",{className:"pir-pd-adj-grid",children:[s.jsxs("div",{className:"pir-pd-adj-field",children:[s.jsx("label",{className:"pir-pd-adj-label",children:"MONTH"}),s.jsxs("select",{className:"pir-pd-adj-input",value:Zi,onChange:h=>aN(h.target.value),children:[Qi.length===0&&s.jsx("option",{value:"",children:"—"}),Qi.map(h=>s.jsx("option",{value:h,children:h},h))]})]}),s.jsxs("div",{className:"pir-pd-adj-field",children:[s.jsx("label",{className:"pir-pd-adj-label",children:"DR / CR"}),s.jsxs("select",{className:"pir-pd-adj-input",value:Cd,onChange:h=>lN(h.target.value==="Cr"?"Cr":"Dr"),children:[s.jsx("option",{value:"Dr",children:"Dr (Debit)"}),s.jsx("option",{value:"Cr",children:"Cr (Credit)"})]})]}),s.jsxs("div",{className:"pir-pd-adj-field pir-pd-adj-field-grow",children:[s.jsx("label",{className:"pir-pd-adj-label",children:"GL STRING"}),s.jsx("input",{className:"pir-pd-adj-input",value:Od,onChange:h=>F0(h.target.value),placeholder:"e.g. 1100.US.600.001.30000000.IAR0000.20161001.PROJ1"})]}),s.jsxs("div",{className:"pir-pd-adj-field pir-pd-adj-field-grow",children:[s.jsx("label",{className:"pir-pd-adj-label",children:"DESCRIPTION"}),s.jsx("input",{className:"pir-pd-adj-input",value:J0,onChange:h=>P0(h.target.value),placeholder:"Actuals adjustment description…"})]}),s.jsxs("div",{className:"pir-pd-adj-field pir-pd-adj-field-amount",children:[s.jsx("label",{className:"pir-pd-adj-label",children:"AMOUNT ($)"}),s.jsx("input",{className:"pir-pd-adj-input",type:"number",value:W0,onChange:h=>I0(h.target.value),placeholder:"0"})]}),s.jsx("div",{className:"pir-pd-adj-field pir-pd-adj-field-action",children:s.jsx("button",{type:"button",className:"pir-pd-adj-button",onClick:pN,disabled:ey,children:ey?"Saving…":"+ Add Adjustment"})})]}),ny&&s.jsxs("div",{className:"pir-pd-adj-error",role:"alert",children:["⚠ ",ny]})]}),s.jsxs("section",{className:"pir-pd-actuals-tx pir-pd-fc","aria-label":"Forecast — Remaining Months",children:[s.jsxs("div",{className:"pir-pd-actuals-tx-header",children:[s.jsxs("div",{className:"pir-pd-actuals-tx-heading",children:[s.jsx("button",{type:"button",className:"pir-pd-drill-section-toggle",onClick:()=>Z_(h=>!h),"aria-expanded":Yi,"aria-label":Yi?"Collapse forecast transactions":"Expand forecast transactions",children:Yi?"▾":"▸"}),s.jsx("span",{className:"pir-pd-actuals-tx-title",children:"Forecast — Remaining Months"})]}),s.jsxs("span",{className:"pir-pd-actuals-tx-pill",children:[oN," lines ·"," ",s.jsx("span",{className:Rl<0?"pir-pd-amount-neg":"",children:Re(Rl)})]})]}),Yi&&s.jsxs("table",{className:"pir-pd-actuals-table","aria-label":"Forecast transactions",children:[s.jsx("thead",{children:s.jsxs("tr",{children:[s.jsx("th",{className:"pir-pd-actuals-th pir-pd-actuals-th-month",children:"MONTH"}),s.jsx("th",{className:"pir-pd-actuals-th",children:"GL ACCOUNT"}),s.jsx("th",{className:"pir-pd-actuals-th",children:"DESCRIPTION"}),s.jsx("th",{className:"pir-pd-actuals-th pir-pd-actuals-th-amount",children:"AMOUNT"})]})}),s.jsxs("tbody",{children:[Ne&&s.jsx("tr",{children:s.jsx("td",{className:"pir-pd-actuals-state",colSpan:4,children:"Loading forecast…"})}),!Ne&&Fe&&s.jsx("tr",{children:s.jsxs("td",{className:"pir-pd-actuals-state pir-pd-actuals-state-error",colSpan:4,children:["Couldn’t load forecast: ",Fe]})}),!Ne&&!Fe&&Vi.length===0&&qi.length===0&&s.jsx("tr",{children:s.jsx("td",{className:"pir-pd-actuals-state",colSpan:4,children:"No forecast (budget) lines for this account and fiscal year."})}),!Ne&&!Fe&&Vi.map((h,N)=>s.jsxs("tr",{className:"pir-pd-actuals-row",children:[s.jsx("td",{className:"pir-pd-actuals-month",children:h.month}),s.jsx("td",{className:"pir-pd-actuals-gl",children:h.gl}),s.jsx("td",{className:"pir-pd-actuals-desc",children:h.desc}),s.jsx("td",{className:`pir-pd-actuals-amount ${h.amount<0?"pir-pd-actuals-amount-neg":""}`,children:Re(h.amount)})]},`fc-${N}`)),qi.map(h=>{const N=Dl(h);return s.jsxs("tr",{className:"pir-pd-actuals-row pir-pd-actuals-adj-row",children:[s.jsx("td",{className:"pir-pd-actuals-month",children:h.month}),s.jsxs("td",{className:"pir-pd-actuals-gl",children:[h.gl," ",s.jsxs("span",{className:`pir-pd-actuals-tag pir-pd-actuals-tag-${h.drCr==="Cr"?"cr":"dr"}`,children:[h.drCr," ADJ"]})]}),s.jsx("td",{className:"pir-pd-actuals-desc",children:h.desc}),s.jsx("td",{className:`pir-pd-actuals-amount ${N<0?"pir-pd-actuals-amount-neg":""}`,children:Re(N)})]},h.id)})]}),s.jsx("tfoot",{children:s.jsxs("tr",{className:"pir-pd-actuals-total-row",children:[s.jsx("td",{colSpan:3,children:"TOTAL FORECAST"}),s.jsx("td",{className:`pir-pd-actuals-amount ${Rl<0?"pir-pd-actuals-total-neg":""}`,children:Re(Rl)})]})})]})]}),Yi&&s.jsxs("section",{className:"pir-pd-adj pir-pd-fc","aria-label":"Add Forecast Adjustment",children:[s.jsxs("div",{className:"pir-pd-adj-title",children:[s.jsx(Te,{name:"plus",size:15})," ADD FORECAST ADJUSTMENT"]}),s.jsxs("div",{className:"pir-pd-adj-grid",children:[s.jsxs("div",{className:"pir-pd-adj-field",children:[s.jsx("label",{className:"pir-pd-adj-label",children:"MONTH"}),s.jsxs("select",{className:"pir-pd-adj-input",value:Md,onChange:h=>iN(h.target.value),children:[Is.length===0&&s.jsx("option",{value:"",children:"—"}),Is.map(h=>s.jsx("option",{value:h,children:h},h))]})]}),s.jsxs("div",{className:"pir-pd-adj-field",children:[s.jsx("label",{className:"pir-pd-adj-label",children:"DR / CR"}),s.jsxs("select",{className:"pir-pd-adj-input",value:ly,onChange:h=>rN(h.target.value==="Cr"?"Cr":"Dr"),children:[s.jsx("option",{value:"Dr",children:"Dr (Debit)"}),s.jsx("option",{value:"Cr",children:"Cr (Credit)"})]})]}),s.jsxs("div",{className:"pir-pd-adj-field pir-pd-adj-field-grow",children:[s.jsx("label",{className:"pir-pd-adj-label",children:"GL STRING"}),s.jsx("input",{className:"pir-pd-adj-input",value:iy,onChange:h=>ry(h.target.value),placeholder:"e.g. 1100.US.600.001.30000000.IAR0000.20161001.PROJ1"})]}),s.jsxs("div",{className:"pir-pd-adj-field pir-pd-adj-field-grow",children:[s.jsx("label",{className:"pir-pd-adj-label",children:"DESCRIPTION"}),s.jsx("input",{className:"pir-pd-adj-input",value:sy,onChange:h=>cy(h.target.value),placeholder:"Forecast adjustment description…"})]}),s.jsxs("div",{className:"pir-pd-adj-field pir-pd-adj-field-amount",children:[s.jsx("label",{className:"pir-pd-adj-label",children:"AMOUNT ($)"}),s.jsx("input",{className:"pir-pd-adj-input",type:"number",value:oy,onChange:h=>uy(h.target.value),placeholder:"0"})]}),s.jsx("div",{className:"pir-pd-adj-field pir-pd-adj-field-action",children:s.jsx("button",{type:"button",className:"pir-pd-adj-button",onClick:fN,children:"+ Add Adjustment"})})]})]}),s.jsxs("section",{className:"pir-pd-unmapped","aria-label":"Unmapped Datalake Transactions",children:[s.jsxs("div",{className:"pir-pd-unmapped-header",children:[s.jsxs("div",{className:"pir-pd-unmapped-heading",children:[s.jsx("button",{type:"button",className:"pir-pd-drill-section-toggle",onClick:()=>K_(h=>!h),"aria-expanded":Zs,"aria-label":Zs?"Collapse unmapped transactions":"Expand unmapped transactions",children:Zs?"▾":"▸"}),s.jsxs("span",{className:"pir-pd-unmapped-title",children:["Unmapped Datalake Transactions",ce?` — SPC ${ce}`:""]})]}),s.jsxs("span",{className:"pir-pd-unmapped-pill",children:[Dt.length," unmatched"]})]}),Zs&&s.jsxs(s.Fragment,{children:[s.jsxs("div",{className:"pir-pd-unmapped-note",children:["These transactions were extracted from the datalake against the SPC project codes but have not been mapped to any CAPEX / OPEX / Revenue line. Select lines below and map them to"," ",s.jsx("strong",{children:Fs})," if applicable."]}),s.jsxs("table",{className:"pir-pd-actuals-table","aria-label":"Unmapped transactions",children:[s.jsx("thead",{children:s.jsxs("tr",{children:[s.jsx("th",{className:"pir-pd-actuals-th pir-pd-unmapped-th-check",children:s.jsx("input",{ref:wd,type:"checkbox",className:"pir-pd-unmapped-check",checked:Ad,onChange:h=>W_(h.target.checked),disabled:Dt.length===0,"aria-label":"Select all unmapped transactions"})}),s.jsx("th",{className:"pir-pd-actuals-th pir-pd-actuals-th-month",children:"MONTH"}),s.jsx("th",{className:"pir-pd-actuals-th",children:"GL ACCOUNT"}),s.jsx("th",{className:"pir-pd-actuals-th",children:"GL DESCRIPTION"}),s.jsx("th",{className:"pir-pd-actuals-th pir-pd-actuals-th-amount",children:"AMOUNT"})]})}),s.jsxs("tbody",{children:[$i&&s.jsx("tr",{children:s.jsx("td",{className:"pir-pd-actuals-state",colSpan:5,children:"Loading unmapped transactions…"})}),!$i&&Gi&&s.jsx("tr",{children:s.jsxs("td",{className:"pir-pd-actuals-state pir-pd-actuals-state-error",colSpan:5,children:["Couldn’t load unmapped transactions: ",Gi]})}),!$i&&!Gi&&Dt.length===0&&s.jsx("tr",{children:s.jsx("td",{className:"pir-pd-actuals-state",colSpan:5,children:"No unmapped transactions for this proposal."})}),!$i&&!Gi&&Dt.map((h,N)=>s.jsxs("tr",{className:`pir-pd-actuals-row ${Sd.has(N)?"pir-pd-unmapped-row-selected":""}`,children:[s.jsx("td",{className:"pir-pd-unmapped-check-cell",children:s.jsx("input",{type:"checkbox",className:"pir-pd-unmapped-check",checked:Sd.has(N),onChange:()=>P_(N),"aria-label":`Select ${h.desc||h.gl}`})}),s.jsx("td",{className:"pir-pd-actuals-month",children:h.month}),s.jsx("td",{className:"pir-pd-actuals-gl",children:h.gl}),s.jsx("td",{className:"pir-pd-actuals-desc",children:h.desc}),s.jsx("td",{className:`pir-pd-actuals-amount ${h.amount<0?"pir-pd-actuals-amount-neg":""}`,children:Re(h.amount)})]},`unmapped-${N}`))]}),Dt.length>0&&s.jsx("tfoot",{children:s.jsxs("tr",{className:"pir-pd-actuals-total-row",children:[s.jsx("td",{colSpan:4,children:"TOTAL UNMAPPED"}),s.jsx("td",{className:`pir-pd-actuals-amount ${V0<0?"pir-pd-actuals-total-neg":""}`,children:Re(V0)})]})})]}),!$i&&!Gi&&Dt.length>0&&s.jsxs("div",{className:"pir-pd-unmapped-actions",children:[s.jsxs("div",{className:"pir-pd-unmapped-stat",children:[s.jsx("div",{className:"pir-pd-unmapped-stat-label",children:"Selected"}),s.jsxs("div",{className:"pir-pd-unmapped-stat-value",children:[Nn," line",Nn===1?"":"s"]})]}),s.jsxs("div",{className:"pir-pd-unmapped-stat",children:[s.jsx("div",{className:"pir-pd-unmapped-stat-label",children:"Total Amount"}),s.jsx("div",{className:"pir-pd-unmapped-stat-value",children:Re(J_)})]}),s.jsxs("div",{className:"pir-pd-unmapped-comment",children:[s.jsxs("label",{className:"pir-pd-unmapped-stat-label",htmlFor:"pir-pd-map-comment",children:["Mapping Comment ",s.jsx("span",{className:"pir-pd-unmapped-required",children:"*"})]}),s.jsx("textarea",{id:"pir-pd-map-comment",className:"pir-pd-unmapped-textarea",value:_d,onChange:h=>{Nd(h.target.value),Ft(null)},placeholder:`Explain why these transactions belong to ${Fs}…`}),X0&&s.jsx("div",{className:"pir-pd-unmapped-error",children:X0})]}),s.jsxs("button",{type:"button",className:"pir-pd-unmapped-map-button",onClick:()=>{I_()},disabled:Nn===0||Q0,children:[s.jsx(Te,{name:"link",size:15})," ",Q0?"Mapping…":`Map to ${Fs}`]})]})]})]}),s.jsxs("section",{className:"pir-pd-recon","aria-label":"Reconciliation",children:[s.jsx("div",{className:"pir-pd-recon-label",children:"RECONCILIATION"}),s.jsxs("div",{className:"pir-pd-recon-body",children:[s.jsxs("div",{className:"pir-pd-recon-formula",children:[s.jsxs("span",{children:["Actuals: ",s.jsx("strong",{className:"pir-pd-recon-actuals",children:Re(dy)})]}),s.jsx("span",{className:"pir-pd-recon-op",children:"±"}),s.jsxs("span",{children:["Act Adj: ",s.jsx("strong",{className:"pir-pd-recon-adj",children:Re(py)})]}),s.jsx("span",{className:"pir-pd-recon-op",children:"+"}),s.jsxs("span",{children:["Forecast: ",s.jsx("strong",{className:"pir-pd-recon-forecast",children:Re(fy)})]}),s.jsx("span",{className:"pir-pd-recon-op",children:"±"}),s.jsxs("span",{children:["Fc Adj: ",s.jsx("strong",{className:"pir-pd-recon-fadj",children:Re(my)})]}),s.jsx("span",{className:"pir-pd-recon-op",children:"="}),s.jsxs("span",{children:["Total: ",s.jsx("strong",{className:"pir-pd-recon-total",children:Re(hy)})]})]}),s.jsxs("div",{className:`pir-pd-recon-variance ${_y?"pir-pd-recon-under":"pir-pd-recon-over"}`,children:[s.jsx("div",{className:"pir-pd-recon-var-value",children:Re(Math.abs(Ud))}),s.jsxs("div",{className:"pir-pd-recon-var-sub",children:[_y?"Under budget":"Over budget"," (",w0(gN,i),"% of SPC)"]})]})]})]})]}):aa?s.jsxs("div",{className:"pir-pd-drilldown-empty",children:[s.jsx("div",{className:"pir-pd-empty-icon","aria-hidden":"true",children:s.jsx(Te,{name:"lock",size:40})}),s.jsx("div",{className:"pir-pd-empty-title",children:"No proposal created yet"}),s.jsx("p",{className:"pir-pd-empty-text",children:aa})]}):s.jsxs("div",{className:"pir-pd-drilldown-empty",children:[s.jsx("div",{className:"pir-pd-empty-icon","aria-hidden":"true",children:s.jsx(Te,{name:"chart",size:40})}),s.jsx("div",{className:"pir-pd-empty-title",children:"Select a Line Item to Drill Down"}),s.jsxs("p",{className:"pir-pd-empty-text",children:["Use the ",s.jsx("strong",{children:"line filter"})," above to select a line item, or click any PIR Reforecast value in the Forecast vs Actuals tab to view the full breakdown — actual financial transactions, remaining month forecasts (MMC versions), and manual adjustments."]})]})]}),r==="reporting"&&s.jsxs("div",{className:"pir-pd-tab-panel",children:[s.jsxs("div",{className:`pir-pd-pir-report-card ${kd?"":"pir-pd-pir-report-card-solo"}`,children:[s.jsxs("div",{className:"pir-pd-pir-report-left",children:[s.jsxs("div",{className:"pir-pd-pir-report-eyebrow",children:["Post-Implementation Review Report",wy?` — ${wy}`:""]}),kd&&s.jsx("div",{className:"pir-pd-pir-report-title",children:SN})]}),kd&&s.jsxs("div",{className:"pir-pd-pir-report-right",children:[s.jsxs("div",{className:"pir-pd-pir-stat",children:[s.jsx("div",{className:"pir-pd-pir-stat-label",children:"INVESTMENT"}),s.jsx("div",{className:"pir-pd-pir-stat-value",children:Ki(_N,"—")})]}),s.jsxs("div",{className:"pir-pd-pir-stat",children:[s.jsx("div",{className:"pir-pd-pir-stat-label",children:"OVERALL STATUS"}),s.jsxs("span",{className:`pir-pd-pir-status-pill pir-pd-pir-status-pill-${ec.tone}`,children:[ec.icon&&s.jsx(Te,{name:ec.icon,size:13}),ec.label]})]})]})]}),s.jsxs("div",{className:"pir-pd-pir-section-heading",children:[s.jsx("span",{className:"pir-pd-pir-section-icon","aria-hidden":"true",children:s.jsx(Te,{name:"camera",size:18})}),s.jsxs("div",{children:[s.jsx("div",{className:"pir-pd-pir-section-title",children:"Periodic Snapshots — PIR Reforecast Summary"}),s.jsx("div",{className:"pir-pd-pir-section-sub",children:"Captured at key milestones across the investment lifecycle"})]}),s.jsx("button",{type:"button",className:"pir-pd-pir-section-refresh",onClick:()=>{ee()},disabled:w||b,title:w?"Re-capturing snapshots…":R?`Re-capture failed: ${R}`:"Re-capture snapshots and refresh","aria-label":"Re-capture snapshots and refresh",children:s.jsx("span",{className:w||b?"pir-pd-pir-refresh-spin":void 0,children:s.jsx(Te,{name:"refresh",size:16})})})]}),R&&s.jsxs("div",{className:"pir-pd-pir-recapture-error",role:"alert",children:["Couldn’t re-capture snapshots: ",R]}),b&&s.jsx("div",{className:"pir-pd-snapshot-grid","aria-hidden":"true",children:[0,1,2].map(h=>s.jsxs("div",{className:"pir-pd-snapshot-card pir-pd-snap-skel-card",children:[s.jsxs("div",{className:"pir-pd-snapshot-header pir-pd-snap-header-dark",children:[s.jsx("span",{className:"pir-pd-skel pir-pd-skel-title"}),s.jsx("span",{className:"pir-pd-skel pir-pd-skel-badge"})]}),s.jsxs("div",{className:"pir-pd-snapshot-body",children:[[0,1,2].map(N=>s.jsxs("div",{className:"pir-pd-snap-block",children:[s.jsxs("div",{className:"pir-pd-snap-main-row",children:[s.jsx("span",{className:"pir-pd-skel pir-pd-skel-label"}),s.jsx("span",{className:"pir-pd-skel pir-pd-skel-value"})]}),s.jsxs("div",{className:"pir-pd-snap-sub-row",children:[s.jsx("span",{className:"pir-pd-skel pir-pd-skel-sub"}),s.jsx("span",{className:"pir-pd-skel pir-pd-skel-sub-val"})]})]},N)),s.jsx("div",{className:"pir-pd-snap-summary",children:s.jsxs("div",{className:"pir-pd-snap-summary-row",children:[s.jsx("span",{className:"pir-pd-skel pir-pd-skel-label"}),s.jsx("span",{className:"pir-pd-skel pir-pd-skel-value"})]})})]}),s.jsx("div",{className:"pir-pd-snap-skel-footer",children:s.jsx("span",{className:"pir-pd-skel pir-pd-skel-footer-bar"})})]},h))}),T&&!b&&s.jsxs("div",{className:"pir-pd-snapshot-state pir-pd-snapshot-error",children:["Couldn’t load snapshots: ",T]}),!b&&!T&&y.length===0&&s.jsx("div",{className:"pir-pd-snapshot-state",children:"No periodic snapshots available."}),!b&&!T&&y.length>0&&s.jsx("div",{className:"pir-pd-snapshot-grid",children:y.map(h=>s.jsxs("div",{className:`pir-pd-snapshot-card ${h.muted?"pir-pd-snapshot-muted":""}`,children:[s.jsxs("div",{className:`pir-pd-snapshot-header ${h.headerTone==="muted"?"pir-pd-snap-header-muted":"pir-pd-snap-header-dark"}`,children:[s.jsx("span",{className:"pir-pd-snapshot-title",children:h.title}),s.jsx("span",{className:`pir-pd-snapshot-badge pir-pd-badge-tone-${h.badgeTone}`,children:h.badge})]}),s.jsxs("div",{className:"pir-pd-snapshot-body",children:[h.lines.map(N=>s.jsxs("div",{className:"pir-pd-snap-block",children:[s.jsxs("div",{className:"pir-pd-snap-main-row",children:[s.jsx("span",{className:"pir-pd-snap-main-label",children:N.label}),s.jsx("span",{className:`pir-pd-snap-main-value ${h.muted?"pir-pd-val-muted":""}`,children:Ki(N.valueNum,N.value)})]}),s.jsxs("div",{className:"pir-pd-snap-sub-row",children:[s.jsx("span",{className:"pir-pd-snap-sub-label",children:"Reforecast"}),s.jsx("span",{className:`pir-pd-snap-sub-value ${h.muted?"pir-pd-val-muted":N.actualsNum!=null&&N.actualsNum<0?"pir-pd-amount-neg":"pir-pd-val-accent"}`,children:Ki(N.actualsNum,N.actuals)})]}),s.jsxs("div",{className:"pir-pd-snap-sub-row",children:[s.jsx("span",{className:"pir-pd-snap-sub-label",children:"Budget Variance"}),s.jsx("span",{className:`pir-pd-snap-sub-value pir-pd-variance-${N.varianceTone}`,children:N.variance})]})]},N.label)),s.jsxs("div",{className:"pir-pd-snap-summary",children:[s.jsxs("div",{className:"pir-pd-snap-summary-row",children:[s.jsx("span",{className:"pir-pd-snap-summary-label",children:"Total Cost (SPC)"}),s.jsx("span",{className:`pir-pd-snap-summary-value ${h.muted?"pir-pd-val-muted":""}`,children:Ki(h.totalNum,h.total)})]}),s.jsxs("div",{className:"pir-pd-snap-summary-row",children:[s.jsx("span",{className:"pir-pd-snap-summary-label",children:"Reforecast"}),s.jsx("span",{className:`pir-pd-snap-summary-value ${h.muted?"pir-pd-val-muted":h.totalActualsNum!=null&&h.totalActualsNum<0?"pir-pd-amount-neg":"pir-pd-val-accent"}`,children:Ki(h.totalActualsNum,h.totalActuals)})]}),s.jsxs("div",{className:"pir-pd-snap-summary-row",children:[s.jsx("span",{className:"pir-pd-snap-summary-label",children:"Budget Variance"}),s.jsx("span",{className:`pir-pd-snap-summary-value pir-pd-variance-${h.totalVarianceTone}`,children:h.totalVariance})]}),s.jsxs("div",{className:"pir-pd-snap-summary-row",children:[s.jsx("span",{className:"pir-pd-snap-summary-label",children:"Benefit Realisation"}),s.jsx("span",{className:`pir-pd-snap-summary-value ${h.muted?"pir-pd-val-muted":/^\(/.test(h.benefit)?"pir-pd-amount-neg":""}`,children:h.benefit})]})]})]}),s.jsx("div",{className:`pir-pd-snapshot-footer pir-pd-footer-${h.footerTone}`,children:h.footerLabel})]},h.title))}),s.jsx("div",{className:"pir-pd-narrative-grid",children:G_.map(h=>{const N=B[h.key];return s.jsxs("section",{className:"pir-pd-narrative-card","aria-label":h.title,children:[s.jsxs("div",{className:"pir-pd-narrative-head",children:[s.jsx("span",{className:"pir-pd-narrative-icon","aria-hidden":"true",children:s.jsx(Te,{name:h.icon,size:17})}),s.jsx("h3",{className:"pir-pd-narrative-title",children:h.title}),s.jsx("span",{className:"pir-pd-narrative-hint",children:h.hint})]}),s.jsx("textarea",{className:"pir-pd-narrative-input",value:N,maxLength:$0,onChange:H=>Y(h.key,H.target.value),placeholder:q_(h),"aria-label":h.title}),s.jsxs("div",{className:"pir-pd-narrative-foot",children:[s.jsxs("span",{className:"pir-pd-narrative-count",children:[N.length.toLocaleString("en-US")," / ",$0.toLocaleString("en-US")," characters"]}),s.jsxs("div",{className:"pir-pd-narrative-actions",children:[s.jsx("button",{type:"button",className:"pir-pd-narrative-clear",onClick:()=>{Y(h.key,""),D(`${h.title} cleared`)},disabled:N==="",children:"Clear"}),s.jsxs("button",{type:"button",className:"pir-pd-narrative-save",onClick:()=>D(`✓ ${h.title} saved`),disabled:N.trim()==="",title:N.trim()===""?"Enter commentary to enable saving":void 0,children:[s.jsx(Te,{name:"save",size:14}),"Save"]})]})]})]},h.key)})}),!b&&!T&&jy.length>0&&s.jsxs("div",{className:"pir-pd-pir-calendar",children:[s.jsxs("div",{className:"pir-pd-pir-cal-header",children:[s.jsx("span",{className:"pir-pd-pir-cal-icon","aria-hidden":"true",children:s.jsx(Te,{name:"calendar",size:20})}),s.jsxs("div",{children:[s.jsx("div",{className:"pir-pd-pir-cal-title",children:"PIR CALENDAR"}),s.jsx("div",{className:"pir-pd-pir-cal-sub",children:"Upcoming review milestones and reminders"})]})]}),jy.map(h=>s.jsxs("div",{className:`pir-pd-pir-cal-row pir-pd-pir-cal-${h.state}`,children:[s.jsxs("div",{className:"pir-pd-pir-cal-left",children:[s.jsx("div",{className:"pir-pd-pir-cal-row-title",children:h.title}),s.jsxs("div",{className:"pir-pd-pir-cal-date-row",children:[s.jsx("span",{className:"pir-pd-pir-cal-date","aria-hidden":"true",children:s.jsx(Te,{name:"calendar",size:14})}),s.jsx("span",{className:"pir-pd-pir-cal-date-text",children:h.date||"Date TBC"}),h.daysAway!=null&&s.jsxs("span",{className:"pir-pd-pir-cal-days",children:[s.jsx(Te,{name:"bell",size:13})," ",h.daysAway," days away"]})]}),s.jsx("div",{className:"pir-pd-pir-cal-desc",children:h.description})]}),s.jsxs("div",{className:"pir-pd-pir-cal-right",children:[s.jsxs("button",{type:"button",className:`pir-pd-pir-cal-outcome pir-pd-outcome-${h.state}`,disabled:h.state==="future",children:[s.jsx(Te,{name:"report",size:14})," Review Outcome"]}),h.state==="completed"&&s.jsxs("span",{className:"pir-pd-pir-cal-badge pir-pd-badge-completed",children:[s.jsx(Te,{name:"check",size:13})," Completed"]}),h.state==="upcoming"&&s.jsxs("span",{className:"pir-pd-pir-cal-badge pir-pd-badge-upcoming",children:[s.jsx(Te,{name:"clock",size:13})," Upcoming"]}),h.state==="future"&&s.jsxs("span",{className:"pir-pd-pir-cal-badge pir-pd-badge-future",children:[s.jsx(Te,{name:"lock",size:13})," Future"]})]})]},h.key))]}),k&&s.jsx("div",{className:"pir-pd-narrative-toast",role:"status",children:k})]}),s.jsx("style",{children:`
        .pir-pd-dashboard-root {
          /* Single source of truth for every heading in the dashboard: one
             navy for heading text and icons, one tint for heading strips and
             icon chips. Section themes (green actuals, purple forecast,
             orange datalake) all resolve to these. */
          --pir-heading: #1D2C4D;
          --pir-heading-bg: #dde2ec69;

          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          background: #f7f8fa;
          color: #001a3b;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        /* Line icons sit on the text baseline and take the heading colour. */
        .pir-pd-dashboard-root svg { flex: 0 0 auto; }

        /* ── Sticky head ─────────────────────────────────────────
           The tab bar and the format toolbar pin together as one block, so
           neither scrolls away and no offset has to track the other's height.
           The opaque background stops content showing through the toolbar's
           surrounding margin as it scrolls underneath. The z-index clears the
           report's own sticky header row and first column. */
        .pir-pd-sticky-head {
          position: sticky;
          top: 0;
          z-index: 20;
          background: #f7f8fa;
          padding-bottom: 8px;
        }

        /* ── Tab bar ─────────────────────────────────────────── */
        .pir-pd-tab-bar {
          display: flex;
          align-items: stretch;
          gap: 4px;
          background: #ffffff;
          border-bottom: 1px solid #e6e9ee;
          padding: 0;
        }

        .pir-pd-tab-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 44px;
          padding: 0 18px;
          border: 0;
          border-bottom: 3px solid transparent;
          background: transparent;
          color: #687386;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-tab-button:hover {
          color: var(--pir-heading);
        }

        .pir-pd-tab-active {
          color: var(--pir-heading);
          border-bottom-color: var(--pir-heading);
        }

        .pir-pd-tab-panel {
          padding: 8px;
        }

        /* ── Breadcrumb ──────────────────────────────────────── */
        .pir-pd-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          margin-bottom: 14px;
        }

        .pir-pd-crumb-link {
          color: #1D2C4D;
          font-weight: 600;
        }

        .pir-pd-crumb-sep {
          color: #b3bac6;
        }

        .pir-pd-crumb-current {
          color: #001a3b;
          font-weight: 700;
        }

        /* ── Title row ───────────────────────────────────────── */
        .pir-pd-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .pir-pd-title-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pir-pd-title-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
        }

        .pir-pd-page-title {
          margin: 0;
          font-size: 20px;
          line-height: 1.2;
          font-weight: 700;
          color: var(--pir-heading);
        }

        .pir-pd-title-right {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .pir-pd-search-box {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 36px;
          padding: 0 14px;
          border: 1px solid #d5dbe7;
          border-radius: 8px;
          background: #ffffff;
        }

        .pir-pd-search-icon {
          display: inline-flex;
          align-items: center;
          color: #9aa3b2;
        }

        .pir-pd-search-input {
          width: 220px;
          border: 0;
          outline: none;
          background: transparent;
          font-size: 13px;
          color: #001a3b;
        }

        .pir-pd-edit-hint {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #1D2C4D;
          font-size: 13px;
          font-weight: 500;
        }

        .pir-pd-edit-hint-icon {
          font-size: 13px;
        }

        /* ── KPI card ────────────────────────────────────────── */
        .pir-pd-kpi-card {
          position: relative;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          padding: 18px 20px;
          margin-bottom: 18px;
          box-shadow: 0 1px 3px rgba(0, 26, 59, 0.06);
        }

        .pir-pd-kpi-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .pir-pd-kpi-card-heading {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pir-pd-kpi-heading-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
        }

        .pir-pd-kpi-heading-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--pir-heading);
          letter-spacing: 0.01em;
        }

        .pir-pd-kpi-heading-sub {
          font-size: 12px;
          color: #687386;
          margin-top: 2px;
        }

        /* ── RAG summary ─────────────────────────────────────── */
        .pir-pd-rag-summary {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 28px;
          padding: 12px 16px;
          background: #f4f6f9;
          border-radius: 8px;
          margin-bottom: 18px;
          font-size: 13px;
        }

        .pir-pd-rag-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .pir-pd-rag-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .pir-pd-rag-red { background: #e3342f; }
        .pir-pd-rag-amber { background: #f5a623; }
        .pir-pd-rag-green { background: #1ea761; }

        .pir-pd-rag-count {
          font-weight: 600;
          color: #001a3b;
        }

        .pir-pd-rag-desc {
          color: #687386;
        }

        .pir-pd-reapproval-pill {
          padding: 4px 12px;
          border-radius: 999px;
          background: #b91c2c;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        /* ── KPI grid ────────────────────────────────────────── */
        .pir-pd-kpi-state {
          padding: 30px 16px;
          text-align: center;
          color: #687386;
          font-size: 13px;
          background: #f7f8fa;
          border: 1px solid #e6e9ee;
          border-radius: 8px;
        }

        .pir-pd-kpi-error {
          color: red;
          background: #dde2ec69;
          border-color: #d5dbe7;
        }

        .pir-pd-kpi-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    width: 100%;
        }

        .pir-pd-kpi-tile {
          border: 1px solid #e6e9ee;
          border-left: 5px solid #cbd2dc;
          border-radius: 8px;
          padding: 11px 13px 13px;
          background: #ffffff;
          box-shadow: 0 1px 4px rgba(0, 26, 59, 0.05);
        }

        .pir-pd-tile-red {
          background: linear-gradient(180deg, #fdf3f3 0%, #ffffff 55%);
          border-color: #f1d4d4;
          border-left-color: #e3342f;
        }

        .pir-pd-tile-green {
          background: linear-gradient(180deg, #f1faf4 0%, #ffffff 55%);
          border-color: #d2ecdd;
          border-left-color: #1ea761;
        }

        .pir-pd-tile-amber {
          background: linear-gradient(180deg, #fdf6e9 0%, #ffffff 55%);
          border-color: #f1ddb6;
          border-left-color: #f0941e;
        }

        .pir-pd-tile-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }

        .pir-pd-tile-label {
          font-size: 14px;
          font-weight: 700;
          color: #6C757D;
          letter-spacing: 0.04em;
        }

        .pir-pd-tile-badge {
          padding: 3px 9px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #ffffff;
        }

        .pir-pd-badge-red { background: #e3342f; }
        .pir-pd-badge-green { background: #1ea761; }
        .pir-pd-badge-amber { background: #f0941e; }

        .pir-pd-tile-value {
          font-size: 26px;
          font-weight: 800;
          color: #001a3b;
          margin: 4px 0 2px;
        }

        /* Headline value takes the tile's RAG colour */
        .pir-pd-tile-red .pir-pd-tile-value { color: red; }
        .pir-pd-tile-green .pir-pd-tile-value { color: #1ea761; }
        .pir-pd-tile-amber .pir-pd-tile-value { color: #f0941e; }

        /* A negative headline value always reads red, overriding the RAG tone */
        .pir-pd-tile-value.pir-pd-amount-neg { color: red; }

        .pir-pd-tile-approved {
          font-size: 10px;
          color: #687386;
        }

        .pir-pd-tile-divider {
          height: 1px;
          background: rgba(0, 26, 59, 0.08);
          margin: 9px 0 7px;
        }

        .pir-pd-tile-meta-label {
          font-size: 11px;
          font-weight: 700;
          color: #9aa3b2;
          letter-spacing: 0.06em;
        }

        .pir-pd-tile-variance {
          font-size: 11.5px;
          font-weight: 700;
          margin-top: 2px;
        }

        .pir-pd-variance-red { color: red; }
        .pir-pd-variance-green { color: #1ea761; }
        .pir-pd-variance-amber { color: #d97d0c; }
        .pir-pd-variance-neutral { color: #687386; }

        .pir-pd-tile-footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
          margin-top: 9px;
        }

        .pir-pd-tile-hurdle {
          font-size: 13px;
          font-weight: 700;
          color: #001a3b;
          margin-top: 2px;
        }

        .pir-pd-tile-status {
          font-size: 15px;
          font-weight: 700;
          margin-left: auto;
        }

        .pir-pd-status-red { color: red; }
        .pir-pd-status-green { color: #1ea761; }
        .pir-pd-status-amber { color: #d97d0c; }

        /* ── Drilldown controls ──────────────────────────────── */
        .pir-pd-line-item-select {
          height: 36px;
          width: 320px;
          padding: 0 14px;
          border: 1px solid #1d2633;
          border-radius: 8px;
          background: #ffffff;
          color: #001a3b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          outline: none;
        }

        .pir-pd-line-item-group {
          font-weight: 700;
          color: #001a3b;
          font-size: 12px;
        }

        .pir-pd-line-item-select,
        .pir-pd-line-item-select option {
          text-transform: none;
        }

        .pir-pd-line-item-select option {
          font-size: 13.5px;
          font-weight: 500;
        }

        .pir-pd-back-button {
          height: 36px;
          padding: 0 18px;
          border: 1px solid #d5dbe7;
          border-radius: 8px;
          background: #ffffff;
          color: #001a3b;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-back-button:hover {
          background: #f4f6f9;
        }

        /* ── Drilldown empty state ───────────────────────────── */
        .pir-pd-drilldown-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 70px 24px 80px;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
        }

        /* ── Drilldown detail ───────────────────────────────── */
        .pir-pd-drill-detail-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 20px 24px;
          margin-bottom: 18px;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          background: var(--pir-heading-bg);
        }

        .pir-pd-drill-detail-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .pir-pd-drill-detail-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border-radius: 10px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
        }

        .pir-pd-drill-detail-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--pir-heading);
        }

        .pir-pd-drill-detail-sub {
          margin-top: 3px;
          font-size: 13px;
          color: #687386;
        }

        .pir-pd-drill-detail-sub strong { color: var(--pir-heading); }

        .pir-pd-drill-detail-right {
          text-align: right;
          font-size: 12px;
          color: #8a93a3;
          line-height: 1.7;
        }

        .pir-pd-drill-detail-right strong { color: var(--pir-heading); }

        .pir-pd-drill-tiles {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .pir-pd-drill-tile {
          padding: 18px 20px;
          border-radius: 10px;
          border: 1px solid transparent;
        }

        /* All four summary tiles share the heading tint — the label says what
           each one is, so the colour no longer has to. */
        .pir-pd-drill-tile-purple,
        .pir-pd-drill-tile-green,
        .pir-pd-drill-tile-amber,
        .pir-pd-drill-tile-orange { background: var(--pir-heading-bg); border-color: #dfe4ee; }

        .pir-pd-drill-tile-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          margin-bottom: 8px;
          color: var(--pir-heading);
        }

        .pir-pd-drill-tile-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--pir-heading);
        }

        .pir-pd-drill-tile-unit {
          font-size: 14px;
          font-weight: 600;
        }

        @media (max-width: 1000px) {
          .pir-pd-drill-tiles { grid-template-columns: repeat(2, 1fr); }
          .pir-pd-drill-detail-card { flex-direction: column; align-items: flex-start; }
          .pir-pd-drill-detail-right { text-align: left; }
        }

        .pir-pd-empty-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 96px;
          height: 96px;
          border-radius: 16px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
          margin-bottom: 24px;
        }

        .pir-pd-empty-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--pir-heading);
          margin-bottom: 14px;
        }

        .pir-pd-empty-text {
          max-width: 720px;
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          color: #687386;
        }

        .pir-pd-empty-text strong {
          color: #001a3b;
          font-weight: 600;
        }

        /* ── PIR report header card ──────────────────────────── */
        .pir-pd-pir-report-card {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          background: var(--pir-heading);
          border: 0;
          border-radius: 12px;
          padding: 22px 26px;
          margin-bottom: 22px;
        }

        /* No proposal → the title is hidden, so the eyebrow becomes the card's
           heading: bigger, and vertically centred against the stats on the right. */
        .pir-pd-pir-report-card-solo { align-items: center; }
        .pir-pd-pir-report-card-solo .pir-pd-pir-report-right { align-items: center; }

        .pir-pd-pir-report-card-solo .pir-pd-pir-report-eyebrow {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #ffffff;
          margin-bottom: 0;
        }

        .pir-pd-pir-report-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 8px;
        }

        .pir-pd-pir-report-title {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .pir-pd-pir-report-meta {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.75);
        }

        .pir-pd-pir-report-right {
          display: flex;
          align-items: flex-start;
          gap: 40px;
          flex-shrink: 0;
        }

        .pir-pd-pir-stat-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 6px;
        }

        .pir-pd-pir-stat-value {
          font-size: 26px;
          font-weight: 700;
          color: #ffffff;
        }

        .pir-pd-pir-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid #f3d28a;
          border-radius: 999px;
          background: #fdf6e3;
          color: #b07908;
          font-size: 12px;
          font-weight: 600;
        }

        .pir-pd-pir-status-pill-red {
          border-color: rgba(194, 65, 12, 0.85);
          background: rgba(194, 65, 12, 0.85);
          color: rgb(255, 255, 255);
        }

        .pir-pd-pir-status-pill-green {
          border-color: #cdeede;
          background: #eafaf1;
          color: #1ea761;
        }

        .pir-pd-pir-status-pill-muted {
          border-color: #e2e6ec;
          background: #f1f3f6;
          color: #9aa3b2;
        }

        /* ── PIR narrative cards ─────────────────────────────── */
        .pir-pd-narrative-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
          margin-bottom: 22px;
        }

        .pir-pd-narrative-card {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          padding: 18px 20px 16px;
          box-shadow: 0 1px 3px rgba(0, 26, 59, 0.06);
        }

        .pir-pd-narrative-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }

        .pir-pd-narrative-icon {
          display: inline-flex;
          align-items: center;
          flex: 0 0 auto;
          color: var(--pir-heading);
        }

        /* Sits directly beside the icon — centring it stretched the title across
           the free space and left a wide gap after the icon. */
        .pir-pd-narrative-title {
          flex: 0 1 auto;
          margin: 0;
          text-align: left;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--pir-heading);
        }

        /* Pushed to the far right, so the gap lands here rather than after the icon */
        .pir-pd-narrative-hint {
          flex: 0 0 auto;
          margin-left: auto;
          padding-left: 12px;
          font-size: 12px;
          color: #9aa3b2;
        }

        /* White fill and a defined border: the tinted background with a pale
           border read as a disabled field, so nobody realised these were
           editable. */
        .pir-pd-narrative-input {
          width: 100%;
          min-height: 300px;
          box-sizing: border-box;
          padding: 14px 16px;
          border: 1px solid #1D2C4D;
          border-radius: 8px;
          background: #ffffff;
          color: #001a3b;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.9;
          resize: vertical;
          outline: none;
        }

        /* Faded well below the typed colour so the guidance reads as a prompt
           rather than as content already in the box. */
        .pir-pd-narrative-input::placeholder {
          color: #1D2C4D;
          opacity: 0.42;
        }

        .pir-pd-narrative-input:focus {
          border-color: #1D2C4D;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(29, 44, 77, 0.10);
        }

        .pir-pd-narrative-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 14px;
        }

        .pir-pd-narrative-count {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 12px;
          color: #9aa3b2;
        }

        .pir-pd-narrative-actions {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .pir-pd-narrative-clear,
        .pir-pd-narrative-save {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-narrative-clear {
          border: 1px solid #d5dbe7;
          background: #ffffff;
          color: var(--pir-heading);
        }

        .pir-pd-narrative-clear:hover:not(:disabled) {
          background: #f4f6f9;
        }

        .pir-pd-narrative-save {
          border: 1px solid #d5dbe7;
          background: #ffffff;
          color: var(--pir-heading);
        }

        .pir-pd-narrative-save:hover:not(:disabled) {
          background: #f4f6f9;
        }

        .pir-pd-narrative-clear:disabled,
        .pir-pd-narrative-save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pir-pd-narrative-toast {
          position: fixed;
          right: 24px;
          top: 24px;
          z-index: 500;
          max-width: 420px;
          padding: 12px 18px;
          border-radius: 8px;
          background: #1d2633;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
        }

        /* ── PIR section heading ─────────────────────────────── */
        .pir-pd-pir-section-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }

        .pir-pd-pir-section-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
        }

        .pir-pd-pir-section-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--pir-heading);
        }

        .pir-pd-pir-section-sub {
          font-size: 12px;
          color: #687386;
          margin-top: 2px;
        }

        /* margin-left:auto pins it to the right edge of the heading row */
        .pir-pd-pir-section-refresh {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          flex: 0 0 auto;
          width: 34px;
          height: 34px;
          padding: 0;
          border: 1px solid #e6e9ee;
          border-radius: 8px;
          background: #ffffff;
          color: var(--pir-heading);
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .pir-pd-pir-section-refresh:hover:not(:disabled) {
          background: var(--pir-heading-bg);
          border-color: var(--pir-heading);
        }

        .pir-pd-pir-section-refresh:disabled {
          cursor: default;
          opacity: 0.55;
        }

        .pir-pd-pir-recapture-error {
          margin: -8px 0 16px;
          padding: 9px 12px;
          border-radius: 8px;
          background: #dde2ec69;
          color: red;
          font-size: 12px;
          line-height: 1.5;
        }

        .pir-pd-pir-refresh-spin {
          display: inline-flex;
          animation: pir-pd-pir-refresh-rotate 0.9s linear infinite;
        }

        @keyframes pir-pd-pir-refresh-rotate {
          to { transform: rotate(360deg); }
        }

        /* Respect a reduced-motion preference — the disabled state still reads
           as "busy" without the spin. */
        @media (prefers-reduced-motion: reduce) {
          .pir-pd-pir-refresh-spin { animation: none; }
        }

        /* ── Snapshot cards ──────────────────────────────────── */
        .pir-pd-snapshot-state {
          padding: 40px 20px;
          text-align: center;
          color: #687386;
          font-size: 14px;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 10px;
        }

        .pir-pd-snapshot-error {
          color: red;
          border-color: #d5dbe7;
          background: #dde2ec69;
        }

        .pir-pd-snapshot-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
        }

        /* ── Snapshot skeleton (shown while snapshots load) ──── */
        .pir-pd-snap-skel-card .pir-pd-snapshot-header { background: #eef1f5; }
        .pir-pd-snap-skel-footer { height: 44px; background: #f4f6f9; }
        .pir-pd-skel {
          display: inline-block;
          border-radius: 5px;
          background: linear-gradient(90deg, #eef1f5 25%, #e2e6ec 37%, #eef1f5 63%);
          background-size: 400% 100%;
          animation: pir-pd-skel-shimmer 1.2s ease-in-out infinite;
        }
        @keyframes pir-pd-skel-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
        .pir-pd-skel-title     { width: 46%; height: 13px; }
        .pir-pd-skel-badge     { width: 64px; height: 18px; border-radius: 4px; }
        .pir-pd-skel-label     { width: 38%; height: 12px; }
        .pir-pd-skel-value     { width: 30%; height: 13px; }
        .pir-pd-skel-sub       { width: 30%; height: 10px; }
        .pir-pd-skel-sub-val   { width: 24%; height: 10px; }
        .pir-pd-skel-footer-bar { display: block; width: 40%; height: 14px; margin: 15px auto 0; }

        .pir-pd-snapshot-card {
          display: flex;
          flex-direction: column;
          border: 1px solid #e6e9ee;
          border-radius: 10px;
          overflow: hidden;
          background: #ffffff;
        }

        .pir-pd-snapshot-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 14px 16px;
        }

        .pir-pd-snap-header-dark {
          background: #1d2c4d;
        }

        .pir-pd-snap-header-muted {
          background: #9aa3b2;
        }

        .pir-pd-snapshot-title {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
        }

        .pir-pd-snapshot-badge {
          padding: 3px 9px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.03em;
          white-space: nowrap;
        }

        .pir-pd-badge-tone-dark {
          background: #33436b;
          color: #cdd6ea;
        }

        .pir-pd-badge-tone-amber {
          background: #f6e6a8;
          color: #8a6400;
        }

        .pir-pd-badge-tone-muted {
          background: #b6bdc9;
          color: #2f3848;
        }

        .pir-pd-snapshot-body {
          padding: 16px;
        }

        .pir-pd-snap-block {
          margin-bottom: 14px;
        }

        .pir-pd-snap-main-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          padding-bottom: 6px;
        }

        .pir-pd-snap-main-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--pir-heading);
        }

        .pir-pd-snap-main-value {
          font-size: 14px;
          font-weight: 700;
          color: #001a3b;
        }

        .pir-pd-snap-sub-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          padding: 2px 0 2px 10px;
        }

        .pir-pd-snap-sub-label {
          font-size: 12px;
          color: #8a93a3;
        }

        .pir-pd-snap-sub-value {
          font-size: 12px;
          font-weight: 600;
        }

        .pir-pd-val-accent { color: #1D2C4D; }
        .pir-pd-val-muted { color: #b3bac6; }

        .pir-pd-variance-green { color: #1ea761; }
        .pir-pd-variance-red { color: red; }
        .pir-pd-variance-muted { color: #b3bac6; }

        .pir-pd-snap-summary {
          border-top: 1px solid #eef1f5;
          margin-top: 4px;
          padding-top: 12px;
        }

        .pir-pd-snap-summary-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          padding: 4px 0;
        }

        .pir-pd-snap-summary-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--pir-heading);
        }

        .pir-pd-snap-summary-value {
          font-size: 13px;
          font-weight: 700;
          color: #001a3b;
        }

        .pir-pd-snap-summary-value.pir-pd-variance-green { color: #1ea761; }
        .pir-pd-snap-summary-value.pir-pd-variance-red { color: red; }
        .pir-pd-snap-summary-value.pir-pd-variance-muted { color: #b3bac6; }

        .pir-pd-snapshot-footer {
          margin: 0 16px 16px;
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
        }

        .pir-pd-footer-green {
          background: #eafaf1;
          border: 1px solid #cdeede;
          color: #1ea761;
        }

        .pir-pd-footer-amber {
          background: #fdf6e3;
          border: 1px solid #f3e2bf;
          color: #b07908;
        }

        .pir-pd-footer-muted {
          background: #f1f3f6;
          border: 1px solid #e2e6ec;
          color: #9aa3b2;
        }

        .pir-pd-snapshot-muted .pir-pd-snap-main-label,
        .pir-pd-snapshot-muted .pir-pd-snap-summary-label,
        .pir-pd-snapshot-muted .pir-pd-snap-summary-value {
          color: #b3bac6;
        }

        /* ── PIR Calendar ────────────────────────────────────── */
        .pir-pd-pir-calendar {
          margin-top: 22px;
          background: #ffffff;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          overflow: hidden;
        }

        .pir-pd-pir-cal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 22px;
          border-bottom: 1px solid #eef1f5;
        }

        .pir-pd-pir-cal-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
        }

        .pir-pd-pir-cal-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--pir-heading);
          letter-spacing: 0.02em;
        }

        .pir-pd-pir-cal-sub {
          font-size: 12px;
          color: #687386;
          margin-top: 2px;
        }

        .pir-pd-pir-cal-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 18px 22px;
          border-bottom: 1px solid #eef1f5;
        }

        .pir-pd-pir-cal-row:last-child { border-bottom: 0; }

        .pir-pd-pir-cal-upcoming {
          background: #fdfaed;
          border-left: 4px solid #f0a91e;
        }

        .pir-pd-pir-cal-row-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--pir-heading);
        }

        .pir-pd-pir-cal-future .pir-pd-pir-cal-row-title { color: #9aa3b2; }

        .pir-pd-pir-cal-date-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 6px 0 8px;
          font-size: 13px;
          color: #687386;
        }

        .pir-pd-pir-cal-date {
          display: inline-flex;
          align-items: center;
          color: #9aa3b2;
        }

        .pir-pd-pir-cal-future .pir-pd-pir-cal-date-row { color: #aab1bd; }

        .pir-pd-pir-cal-days {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 9px;
          border-radius: 999px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
          font-size: 11px;
          font-weight: 600;
        }

        .pir-pd-pir-cal-desc {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
        }

        .pir-pd-pir-cal-future .pir-pd-pir-cal-desc { color: #aab1bd; }

        .pir-pd-pir-cal-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .pir-pd-pir-cal-outcome {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 14px;
          border-radius: 8px;
          background: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .pir-pd-outcome-completed { border: 1px solid #bfe6cf; color: #1ea761; }
        .pir-pd-outcome-upcoming  { border: 1px solid #cdbdf0; color: #6d3bd0; }
        .pir-pd-outcome-future    { border: 1px solid #e2e6ec; color: #b3bac6; cursor: default; }

        .pir-pd-pir-cal-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 30px;
          padding: 0 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }

        .pir-pd-badge-completed { background: #cdf1dc; color: #137a44; }
        .pir-pd-badge-upcoming  { background: #fbe4ac; color: #97670a; }
        .pir-pd-badge-future    { background: #eef1f5; color: #9aa3b2; }

        @media (max-width: 1000px) {
          .pir-pd-snapshot-grid,
          .pir-pd-narrative-grid {
            grid-template-columns: 1fr;
          }
          .pir-pd-pir-report-card {
            flex-direction: column;
          }
          .pir-pd-pir-cal-row {
            flex-direction: column;
          }
        }

        /* ── Actuals — Financial Transactions ────────────────── */
        .pir-pd-actuals-tx {
          margin-top: 18px;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
        }

        .pir-pd-actuals-tx-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 18px;
          background: var(--pir-heading-bg);
          border-bottom: 1px solid #d5dbe7;
        }

        .pir-pd-actuals-tx-heading {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pir-pd-drill-section-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          padding: 0;
          border: 0;
          border-radius: 4px;
          background: transparent;
          color: var(--pir-heading);
          font: inherit;
          font-size: 16px;
          cursor: pointer;
        }

        .pir-pd-drill-section-toggle:hover {
          background: #ffffff;
        }

        .pir-pd-actuals-tx-check {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: #ffffff;
          border: 1px solid #d5dbe7;
          color: var(--pir-heading);
        }

        .pir-pd-actuals-tx-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--pir-heading);
        }

        .pir-pd-actuals-tx-pill {
          padding: 5px 14px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #d5dbe7;
          color: var(--pir-heading);
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .pir-pd-actuals-tx-note {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: #fafbfc;
          border-bottom: 1px solid #eef1f5;
          color: #6b7280;
          font-size: 12.5px;
          font-style: italic;
        }

        /* ── Unmapped Datalake Transactions ──────────────────── */
        .pir-pd-unmapped {
          margin-top: 18px;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
        }

        .pir-pd-unmapped-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 18px;
          background: var(--pir-heading-bg);
          border-bottom: 1px solid #d5dbe7;
          color: var(--pir-heading);
        }

        .pir-pd-unmapped-heading {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pir-pd-unmapped-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--pir-heading);
          letter-spacing: 0.02em;
        }

        .pir-pd-unmapped-pill {
          padding: 5px 14px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #d5dbe7;
          color: var(--pir-heading);
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .pir-pd-unmapped-note {
          padding: 10px 18px;
          background: #fafbfc;
          border-bottom: 1px solid #eef1f5;
          color: #6b7280;
          font-size: 12.5px;
          font-style: italic;
        }

        /* Row selection */
        .pir-pd-unmapped-th-check,
        .pir-pd-unmapped-check-cell {
          width: 44px;
          padding-left: 18px;
          text-align: left;
        }

        .pir-pd-unmapped-check {
          width: 16px;
          height: 16px;
          margin: 0;
          accent-color: var(--pir-heading);
          cursor: pointer;
        }

        .pir-pd-unmapped-check:disabled { cursor: default; opacity: 0.45; }

        .pir-pd-unmapped-row-selected { background: #fff6ee; }

        /* Map action bar */
        .pir-pd-unmapped-actions {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 14px 18px;
          background: var(--pir-heading-bg);
          border-top: 1.5px dashed #b9c2d4;
        }

        .pir-pd-unmapped-stat { flex: 0 0 auto; }

        .pir-pd-unmapped-stat-label {
          display: block;
          margin-bottom: 4px;
          color: var(--pir-heading);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .pir-pd-unmapped-stat-value {
          color: var(--pir-heading);
          font-size: 15px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .pir-pd-unmapped-required { color: red; }

        .pir-pd-unmapped-comment { flex: 1 1 auto; min-width: 0; }

        .pir-pd-unmapped-textarea {
          width: 100%;
          min-height: 54px;
          padding: 8px 12px;
          border: 1px solid #f0d6bb;
          border-radius: 6px;
          background: #ffffff;
          color: #001a3b;
          font: inherit;
          font-size: 13px;
          resize: vertical;
          outline: none;
        }

        .pir-pd-unmapped-textarea:focus {
          border-color: #9db7e8;
          box-shadow: 0 0 0 2px rgba(29, 44, 77, 0.15);
        }

        .pir-pd-unmapped-error {
          margin-top: 4px;
          color: red;
          font-size: 11.5px;
          font-weight: 600;
        }

        .pir-pd-unmapped-map-button {
          flex: 0 0 auto;
          align-self: center;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 18px;
          border: 0;
          border-radius: 6px;
          background: var(--pir-heading);
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
        }

        .pir-pd-unmapped-map-button:hover:not(:disabled) { background: #142038; }

        .pir-pd-unmapped-map-button:disabled {
          background: #b6bcc6;
          color: #f4f6f9;
          cursor: not-allowed;
        }

        /* ── Reconciliation strip ────────────────────────────── */
        .pir-pd-recon {
          margin-top: 18px;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          background: var(--pir-heading-bg);
          padding: 16px 22px;
        }

        .pir-pd-recon-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--pir-heading);
          margin-bottom: 10px;
        }

        .pir-pd-recon-body {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .pir-pd-recon-formula {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 13px;
          color: #1d2633;
        }

        .pir-pd-recon-op { color: #9aa3b2; font-size: 15px; }
        .pir-pd-recon-actuals  { color: #1ea761; font-variant-numeric: tabular-nums; }
        .pir-pd-recon-adj      { color: #e0761b; font-variant-numeric: tabular-nums; }
        .pir-pd-recon-forecast { color: #4c2fa8; font-variant-numeric: tabular-nums; }
        .pir-pd-recon-fadj     { color: #33179a; font-variant-numeric: tabular-nums; }
        .pir-pd-recon-total    { color: #1D2C4D; font-variant-numeric: tabular-nums; }

        .pir-pd-recon-variance { text-align: right; }
        .pir-pd-recon-var-value {
          font-size: 20px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
        .pir-pd-recon-var-sub { font-size: 11px; margin-top: 2px; }
        .pir-pd-recon-under .pir-pd-recon-var-value,
        .pir-pd-recon-under .pir-pd-recon-var-sub { color: #1ea761; }
        .pir-pd-recon-over .pir-pd-recon-var-value,
        .pir-pd-recon-over .pir-pd-recon-var-sub { color: #c62828; }

        .pir-pd-actuals-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .pir-pd-actuals-th {
          padding: 10px 18px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-align: left;
          border-bottom: 1px solid #e6e9ee;
        }

        .pir-pd-actuals-th-amount {
          text-align: right;
        }

        .pir-pd-actuals-row td {
          padding: 11px 18px;
          border-bottom: 1px solid #f1f3f6;
          vertical-align: middle;
        }

        .pir-pd-actuals-row:hover td {
          background: #fbfcfe;
        }

        .pir-pd-actuals-month {
          color: #1D2C4D;
          font-weight: 600;
          white-space: nowrap;
        }

        .pir-pd-actuals-gl {
          color: #2f6fd0;
          font-size: 12px;
        }

        .pir-pd-actuals-desc {
          color: #001a3b;
        }

        .pir-pd-actuals-amount {
          text-align: right;
          color: #1ea761;
          font-weight: 700;
          white-space: nowrap;
        }

        .pir-pd-actuals-amount-neg {
          color: red;
        }

        .pir-pd-amount-neg {
          color: red;
        }

        .pir-pd-actuals-total-row .pir-pd-actuals-total-neg {
          color: red;
        }

        .pir-pd-actuals-adj-row td {
          background: #fafbfc;
        }

        .pir-pd-actuals-tag {
          display: inline-block;
          margin-left: 6px;
          padding: 1px 7px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.03em;
        }

        .pir-pd-actuals-tag-dr {
          background: #e3f3ea;
          color: #1f7a44;
        }

        .pir-pd-actuals-tag-cr {
          background: #dde2ec69;
          color: #1D2C4D;
        }

        .pir-pd-actuals-total-row td {
          padding: 13px 18px;
          background: var(--pir-heading-bg);
          color: var(--pir-heading);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .pir-pd-actuals-state {
          padding: 26px 18px;
          text-align: center;
          color: #687386;
          font-size: 13px;
        }

        .pir-pd-actuals-state-error {
          color: red;
        }

        /* ── Add Actuals Adjustment ──────────────────────────── */
        .pir-pd-adj {
          margin-top: 16px;
          border: 1px solid #e6e9ee;
          border-radius: 12px;
          background: #ffffff;
          padding: 16px 18px 18px;
        }

        .pir-pd-adj-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--pir-heading);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 14px;
        }

        .pir-pd-adj-grid {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 14px;
        }

        .pir-pd-adj-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 120px;
        }

        .pir-pd-adj-field-grow {
          flex: 1 1 240px;
        }

        .pir-pd-adj-field-amount {
          flex: 0 0 120px;
          min-width: 100px;
        }

        .pir-pd-adj-field-action {
          flex: 0 0 auto;
          min-width: 0;
        }

        .pir-pd-adj-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: #8a93a3;
        }

        .pir-pd-adj-input {
          height: 38px;
          padding: 0 12px;
          border: 1px solid #d5dbe7;
          border-radius: 8px;
          background: #ffffff;
          color: #001a3b;
          font-size: 13px;
          outline: none;
        }

        .pir-pd-adj-input:focus {
          border-color: #9db7e8;
          box-shadow: 0 0 0 2px rgba(29, 44, 77, 0.15);
        }

        .pir-pd-adj-button {
          height: 38px;
          padding: 0 18px;
          border: 0;
          border-radius: 8px;
          background: var(--pir-heading);
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .pir-pd-adj-button:hover {
          background: #142038;
        }

        .pir-pd-adj-button:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .pir-pd-adj-error {
          margin: 10px 16px 0;
          padding: 8px 12px;
          border-radius: 8px;
          background: #fdecea;
          border: 1px solid #f5c6cb;
          color: #b02a37;
          font-size: 12px;
          font-weight: 500;
        }

        /* ── Forecast section (reuses the actuals table) ─────────
           Headings, pills and totals come from the shared tokens, so only the
           value colours below differ from the actuals section. */
        .pir-pd-fc .pir-pd-actuals-month {
          color: #687386;
        }

        .pir-pd-fc .pir-pd-actuals-amount:not(.pir-pd-actuals-amount-neg) {
          color: var(--pir-heading);
        }

        @media (max-width: 720px) {
          .pir-pd-adj-field,
          .pir-pd-adj-field-grow,
          .pir-pd-adj-field-amount,
          .pir-pd-adj-field-action {
            flex: 1 1 100%;
          }
          .pir-pd-adj-button {
            width: 100%;
          }
        }

        /* ── Placeholder panels ──────────────────────────────── */
        .pir-pd-placeholder-panel {
          padding: 60px 20px;
          text-align: center;
          color: #687386;
          font-size: 15px;
          background: #ffffff;
          border: 1px dashed #d5dbe7;
          border-radius: 12px;
        }

        @media (max-width: 1100px) {
          .pir-pd-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .pir-pd-kpi-grid {
            grid-template-columns: 1fr;
          }
          .pir-pd-title-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `})]})}function X_(){return console.log("App component rendered"),s.jsx(s0,{children:s.jsx("div",{children:s.jsx(V_,{})})})}const TN="";Ax.createRoot(document.getElementById("pir-investment-report-root")).render(s.jsx(Ky.StrictMode,{children:s.jsx(X_,{})}))})();
