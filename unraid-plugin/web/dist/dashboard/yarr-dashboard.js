/**
* @vue/shared v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function Xe(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const Y = process.env.NODE_ENV !== "production" ? Object.freeze({}) : {}, Nt = process.env.NODE_ENV !== "production" ? Object.freeze([]) : [], ne = () => {
}, Uo = () => !1, Xt = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), Bt = (e) => e.startsWith("onUpdate:"), J = Object.assign, Es = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, ai = Object.prototype.hasOwnProperty, j = (e, t) => ai.call(e, t), C = Array.isArray, ut = (e) => Qt(e) === "[object Map]", ko = (e) => Qt(e) === "[object Set]", zs = (e) => Qt(e) === "[object Date]", R = (e) => typeof e == "function", z = (e) => typeof e == "string", Se = (e) => typeof e == "symbol", U = (e) => e !== null && typeof e == "object", bs = (e) => (U(e) || R(e)) && R(e.then) && R(e.catch), Wo = Object.prototype.toString, Qt = (e) => Wo.call(e), ys = (e) => Qt(e).slice(8, -1), Pn = (e) => Qt(e) === "[object Object]", Ns = (e) => z(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, jt = /* @__PURE__ */ Xe(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), di = /* @__PURE__ */ Xe(
  "bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text,memo"
), Mn = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((n) => t[n] || (t[n] = e(n)));
}, pi = /-\w/g, ie = Mn(
  (e) => e.replace(pi, (t) => t.slice(1).toUpperCase())
), hi = /\B([A-Z])/g, me = Mn(
  (e) => e.replace(hi, "-$1").toLowerCase()
), $n = Mn((e) => e.charAt(0).toUpperCase() + e.slice(1)), ct = Mn(
  (e) => e ? `on${$n(e)}` : ""
), He = (e, t) => !Object.is(e, t), Tt = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, yn = (e, t, n, s = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, _i = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
}, Xs = (e) => {
  const t = z(e) ? Number(e) : NaN;
  return isNaN(t) ? e : t;
};
let Qs;
const Zt = () => Qs || (Qs = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function Os(e) {
  if (C(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], o = z(s) ? Ei(s) : Os(s);
      if (o)
        for (const r in o)
          t[r] = o[r];
    }
    return t;
  } else if (z(e) || U(e))
    return e;
}
const gi = /;(?![^(]*\))/g, mi = /:([^]+)/, vi = /\/\*[^]*?\*\//g;
function Ei(e) {
  const t = {};
  return e.replace(vi, "").split(gi).forEach((n) => {
    if (n) {
      const s = n.split(mi);
      s.length > 1 && (t[s[0].trim()] = s[1].trim());
    }
  }), t;
}
function ws(e) {
  let t = "";
  if (z(e))
    t = e;
  else if (C(e))
    for (let n = 0; n < e.length; n++) {
      const s = ws(e[n]);
      s && (t += s + " ");
    }
  else if (U(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const bi = "html,body,base,head,link,meta,style,title,address,article,aside,footer,header,hgroup,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,summary,template,blockquote,iframe,tfoot", yi = "svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,feDistantLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,text,textPath,title,tspan,unknown,use,view", Ni = "annotation,annotation-xml,maction,maligngroup,malignmark,math,menclose,merror,mfenced,mfrac,mfraction,mglyph,mi,mlabeledtr,mlongdiv,mmultiscripts,mn,mo,mover,mpadded,mphantom,mprescripts,mroot,mrow,ms,mscarries,mscarry,msgroup,msline,mspace,msqrt,msrow,mstack,mstyle,msub,msubsup,msup,mtable,mtd,mtext,mtr,munder,munderover,none,semantics", Oi = /* @__PURE__ */ Xe(bi), wi = /* @__PURE__ */ Xe(yi), Di = /* @__PURE__ */ Xe(Ni), xi = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", Vi = /* @__PURE__ */ Xe(xi);
function Bo(e) {
  return !!e || e === "";
}
function Si(e, t) {
  if (e.length !== t.length) return !1;
  let n = !0;
  for (let s = 0; n && s < e.length; s++)
    n = Ds(e[s], t[s]);
  return n;
}
function Ds(e, t) {
  if (e === t) return !0;
  let n = zs(e), s = zs(t);
  if (n || s)
    return n && s ? e.getTime() === t.getTime() : !1;
  if (n = Se(e), s = Se(t), n || s)
    return e === t;
  if (n = C(e), s = C(t), n || s)
    return n && s ? Si(e, t) : !1;
  if (n = U(e), s = U(t), n || s) {
    if (!n || !s)
      return !1;
    const o = Object.keys(e).length, r = Object.keys(t).length;
    if (o !== r)
      return !1;
    for (const i in e) {
      const l = e.hasOwnProperty(i), f = t.hasOwnProperty(i);
      if (l && !f || !l && f || !Ds(e[i], t[i]))
        return !1;
    }
  }
  return String(e) === String(t);
}
const Ko = (e) => !!(e && e.__v_isRef === !0), Ye = (e) => z(e) ? e : e == null ? "" : C(e) || U(e) && (e.toString === Wo || !R(e.toString)) ? Ko(e) ? Ye(e.value) : JSON.stringify(e, Yo, 2) : String(e), Yo = (e, t) => Ko(t) ? Yo(e, t.value) : ut(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, o], r) => (n[Kn(s, r) + " =>"] = o, n),
    {}
  )
} : ko(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => Kn(n))
} : Se(t) ? Kn(t) : U(t) && !C(t) && !Pn(t) ? String(t) : t, Kn = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    Se(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
/**
* @vue/reactivity v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function Ce(e, ...t) {
  console.warn(`[Vue warn] ${e}`, ...t);
}
let re;
class Ci {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !t && re && (re.active ? (this.parent = re, this.index = (re.scopes || (re.scopes = [])).push(
      this
    ) - 1) : (this._active = !1, this._warnOnRun = !1));
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = !0;
      let t, n;
      if (this.scopes) {
        const s = this.scopes.slice();
        for (t = 0, n = s.length; t < n; t++)
          s[t].pause();
      }
      for (t = 0, n = this.effects.length; t < n; t++)
        this.effects[t].pause();
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active && this._isPaused) {
      this._isPaused = !1;
      let t, n;
      if (this.scopes) {
        const o = this.scopes.slice();
        for (t = 0, n = o.length; t < n; t++)
          o[t].resume();
      }
      const s = this.effects.slice();
      for (t = 0, n = s.length; t < n; t++)
        s[t].resume();
    }
  }
  run(t) {
    if (this._active) {
      const n = re;
      try {
        return re = this, t();
      } finally {
        re = n;
      }
    } else process.env.NODE_ENV !== "production" && this._warnOnRun && Ce("cannot run an inactive effect scope.");
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = re, re = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (re === this)
        re = this.prevScope;
      else {
        let t = re;
        for (; t; ) {
          if (t.prevScope === this) {
            t.prevScope = this.prevScope;
            break;
          }
          t = t.prevScope;
        }
      }
      this.prevScope = void 0;
    }
  }
  stop(t) {
    if (this._active) {
      this._active = !1;
      let n, s;
      for (n = 0, s = this.effects.length; n < s; n++)
        this.effects[n].stop();
      for (this.effects.length = 0, n = 0, s = this.cleanups.length; n < s; n++)
        this.cleanups[n]();
      if (this.cleanups.length = 0, this.scopes) {
        const o = this.scopes.slice();
        for (n = 0, s = o.length; n < s; n++)
          o[n].stop(!0);
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !t) {
        const o = this.parent.scopes.pop();
        o && o !== this && (this.parent.scopes[this.index] = o, o.index = this.index);
      }
      this.parent = void 0;
    }
  }
}
function Ti() {
  return re;
}
let K;
const Yn = /* @__PURE__ */ new WeakSet();
class qo {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, re && (re.active ? re.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, Yn.has(this) && (Yn.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || Jo(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, Zs(this), zo(this);
    const t = K, n = xe;
    K = this, xe = !0;
    try {
      return this.fn();
    } finally {
      process.env.NODE_ENV !== "production" && K !== this && Ce(
        "Active effect was not restored correctly - this is likely a Vue internal bug."
      ), Xo(this), K = t, xe = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        Ss(t);
      this.deps = this.depsTail = void 0, Zs(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? Yn.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    ss(this) && this.run();
  }
  get dirty() {
    return ss(this);
  }
}
let Go = 0, Ft, Lt;
function Jo(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = Lt, Lt = e;
    return;
  }
  e.next = Ft, Ft = e;
}
function xs() {
  Go++;
}
function Vs() {
  if (--Go > 0)
    return;
  if (Lt) {
    let t = Lt;
    for (Lt = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; Ft; ) {
    let t = Ft;
    for (Ft = void 0; t; ) {
      const n = t.next;
      if (t.next = void 0, t.flags &= -9, t.flags & 1)
        try {
          t.trigger();
        } catch (s) {
          e || (e = s);
        }
      t = n;
    }
  }
  if (e) throw e;
}
function zo(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function Xo(e) {
  let t, n = e.depsTail, s = n;
  for (; s; ) {
    const o = s.prevDep;
    s.version === -1 ? (s === n && (n = o), Ss(s), Ai(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = o;
  }
  e.deps = t, e.depsTail = n;
}
function ss(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (Qo(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function Qo(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === Kt) || (e.globalVersion = Kt, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !ss(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = K, s = xe;
  K = e, xe = !0;
  try {
    zo(e);
    const o = e.fn(e._value);
    (t.version === 0 || He(o, e._value)) && (e.flags |= 128, e._value = o, t.version++);
  } catch (o) {
    throw t.version++, o;
  } finally {
    K = n, xe = s, Xo(e), e.flags &= -3;
  }
}
function Ss(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: o } = e;
  if (s && (s.nextSub = o, e.prevSub = void 0), o && (o.prevSub = s, e.nextSub = void 0), process.env.NODE_ENV !== "production" && n.subsHead === e && (n.subsHead = o), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let r = n.computed.deps; r; r = r.nextDep)
      Ss(r, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function Ai(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let xe = !0;
const Zo = [];
function Te() {
  Zo.push(xe), xe = !1;
}
function Ae() {
  const e = Zo.pop();
  xe = e === void 0 ? !0 : e;
}
function Zs(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = K;
    K = void 0;
    try {
      t();
    } finally {
      K = n;
    }
  }
}
let Kt = 0;
class Ri {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class Cs {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0, process.env.NODE_ENV !== "production" && (this.subsHead = void 0);
  }
  track(t) {
    if (!K || !xe || K === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== K)
      n = this.activeLink = new Ri(K, this), K.deps ? (n.prevDep = K.depsTail, K.depsTail.nextDep = n, K.depsTail = n) : K.deps = K.depsTail = n, er(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = K.depsTail, n.nextDep = void 0, K.depsTail.nextDep = n, K.depsTail = n, K.deps === n && (K.deps = s);
    }
    return process.env.NODE_ENV !== "production" && K.onTrack && K.onTrack(
      J(
        {
          effect: K
        },
        t
      )
    ), n;
  }
  trigger(t) {
    this.version++, Kt++, this.notify(t);
  }
  notify(t) {
    xs();
    try {
      if (process.env.NODE_ENV !== "production")
        for (let n = this.subsHead; n; n = n.nextSub)
          n.sub.onTrigger && !(n.sub.flags & 8) && n.sub.onTrigger(
            J(
              {
                effect: n.sub
              },
              t
            )
          );
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      Vs();
    }
  }
}
function er(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let s = t.deps; s; s = s.nextDep)
        er(s);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), process.env.NODE_ENV !== "production" && e.dep.subsHead === void 0 && (e.dep.subsHead = e), e.dep.subs = e;
  }
}
const os = /* @__PURE__ */ new WeakMap(), at = /* @__PURE__ */ Symbol(
  process.env.NODE_ENV !== "production" ? "Object iterate" : ""
), rs = /* @__PURE__ */ Symbol(
  process.env.NODE_ENV !== "production" ? "Map keys iterate" : ""
), Yt = /* @__PURE__ */ Symbol(
  process.env.NODE_ENV !== "production" ? "Array iterate" : ""
);
function te(e, t, n) {
  if (xe && K) {
    let s = os.get(e);
    s || os.set(e, s = /* @__PURE__ */ new Map());
    let o = s.get(n);
    o || (s.set(n, o = new Cs()), o.map = s, o.key = n), process.env.NODE_ENV !== "production" ? o.track({
      target: e,
      type: t,
      key: n
    }) : o.track();
  }
}
function Ue(e, t, n, s, o, r) {
  const i = os.get(e);
  if (!i) {
    Kt++;
    return;
  }
  const l = (f) => {
    f && (process.env.NODE_ENV !== "production" ? f.trigger({
      target: e,
      type: t,
      key: n,
      newValue: s,
      oldValue: o,
      oldTarget: r
    }) : f.trigger());
  };
  if (xs(), t === "clear")
    i.forEach(l);
  else {
    const f = C(e), p = f && Ns(n);
    if (f && n === "length") {
      const d = Number(s);
      i.forEach((a, g) => {
        (g === "length" || g === Yt || !Se(g) && g >= d) && l(a);
      });
    } else
      switch ((n !== void 0 || i.has(void 0)) && l(i.get(n)), p && l(i.get(Yt)), t) {
        case "add":
          f ? p && l(i.get("length")) : (l(i.get(at)), ut(e) && l(i.get(rs)));
          break;
        case "delete":
          f || (l(i.get(at)), ut(e) && l(i.get(rs)));
          break;
        case "set":
          ut(e) && l(i.get(at));
          break;
      }
  }
  Vs();
}
function vt(e) {
  const t = /* @__PURE__ */ $(e);
  return t === e ? t : (te(t, "iterate", Yt), /* @__PURE__ */ ge(e) ? t : t.map(ze));
}
function Ts(e) {
  return te(e = /* @__PURE__ */ $(e), "iterate", Yt), e;
}
function Le(e, t) {
  return /* @__PURE__ */ We(e) ? qt(/* @__PURE__ */ dt(e) ? ze(t) : t) : ze(t);
}
const Pi = {
  __proto__: null,
  [Symbol.iterator]() {
    return qn(this, Symbol.iterator, (e) => Le(this, e));
  },
  concat(...e) {
    return vt(this).concat(
      ...e.map((t) => C(t) ? vt(t) : t)
    );
  },
  entries() {
    return qn(this, "entries", (e) => (e[1] = Le(this, e[1]), e));
  },
  every(e, t) {
    return Ke(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return Ke(
      this,
      "filter",
      e,
      t,
      (n) => n.map((s) => Le(this, s)),
      arguments
    );
  },
  find(e, t) {
    return Ke(
      this,
      "find",
      e,
      t,
      (n) => Le(this, n),
      arguments
    );
  },
  findIndex(e, t) {
    return Ke(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return Ke(
      this,
      "findLast",
      e,
      t,
      (n) => Le(this, n),
      arguments
    );
  },
  findLastIndex(e, t) {
    return Ke(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return Ke(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return Gn(this, "includes", e);
  },
  indexOf(...e) {
    return Gn(this, "indexOf", e);
  },
  join(e) {
    return vt(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return Gn(this, "lastIndexOf", e);
  },
  map(e, t) {
    return Ke(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return At(this, "pop");
  },
  push(...e) {
    return At(this, "push", e);
  },
  reduce(e, ...t) {
    return eo(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return eo(this, "reduceRight", e, t);
  },
  shift() {
    return At(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return Ke(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return At(this, "splice", e);
  },
  toReversed() {
    return vt(this).toReversed();
  },
  toSorted(e) {
    return vt(this).toSorted(e);
  },
  toSpliced(...e) {
    return vt(this).toSpliced(...e);
  },
  unshift(...e) {
    return At(this, "unshift", e);
  },
  values() {
    return qn(this, "values", (e) => Le(this, e));
  }
};
function qn(e, t, n) {
  const s = Ts(e), o = s[t]();
  return s !== e && !/* @__PURE__ */ ge(e) && (o._next = o.next, o.next = () => {
    const r = o._next();
    return r.done || (r.value = n(r.value)), r;
  }), o;
}
const Mi = Array.prototype;
function Ke(e, t, n, s, o, r) {
  const i = Ts(e), l = i !== e && !/* @__PURE__ */ ge(e), f = i[t];
  if (f !== Mi[t]) {
    const a = f.apply(e, r);
    return l ? ze(a) : a;
  }
  let p = n;
  i !== e && (l ? p = function(a, g) {
    return n.call(this, Le(e, a), g, e);
  } : n.length > 2 && (p = function(a, g) {
    return n.call(this, a, g, e);
  }));
  const d = f.call(i, p, s);
  return l && o ? o(d) : d;
}
function eo(e, t, n, s) {
  const o = Ts(e), r = o !== e && !/* @__PURE__ */ ge(e);
  let i = n, l = !1;
  o !== e && (r ? (l = s.length === 0, i = function(p, d, a) {
    return l && (l = !1, p = Le(e, p)), n.call(this, p, Le(e, d), a, e);
  }) : n.length > 3 && (i = function(p, d, a) {
    return n.call(this, p, d, a, e);
  }));
  const f = o[t](i, ...s);
  return l ? Le(e, f) : f;
}
function Gn(e, t, n) {
  const s = /* @__PURE__ */ $(e);
  te(s, "iterate", Yt);
  const o = s[t](...n);
  return (o === -1 || o === !1) && /* @__PURE__ */ Nn(n[0]) ? (n[0] = /* @__PURE__ */ $(n[0]), s[t](...n)) : o;
}
function At(e, t, n = []) {
  Te(), xs();
  const s = (/* @__PURE__ */ $(e))[t].apply(e, n);
  return Vs(), Ae(), s;
}
const $i = /* @__PURE__ */ Xe("__proto__,__v_isRef,__isVue"), tr = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Se)
);
function Ii(e) {
  Se(e) || (e = String(e));
  const t = /* @__PURE__ */ $(this);
  return te(t, "has", e), t.hasOwnProperty(e);
}
class nr {
  constructor(t = !1, n = !1) {
    this._isReadonly = t, this._isShallow = n;
  }
  get(t, n, s) {
    if (n === "__v_skip") return t.__v_skip;
    const o = this._isReadonly, r = this._isShallow;
    if (n === "__v_isReactive")
      return !o;
    if (n === "__v_isReadonly")
      return o;
    if (n === "__v_isShallow")
      return r;
    if (n === "__v_raw")
      return s === (o ? r ? cr : lr : r ? ir : rr).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(s) ? t : void 0;
    const i = C(t);
    if (!o) {
      let f;
      if (i && (f = Pi[n]))
        return f;
      if (n === "hasOwnProperty")
        return Ii;
    }
    const l = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ Z(t) ? t : s
    );
    if ((Se(n) ? tr.has(n) : $i(n)) || (o || te(t, "get", n), r))
      return l;
    if (/* @__PURE__ */ Z(l)) {
      const f = i && Ns(n) ? l : l.value;
      return o && U(f) ? /* @__PURE__ */ ls(f) : f;
    }
    return U(l) ? o ? /* @__PURE__ */ ls(l) : /* @__PURE__ */ As(l) : l;
  }
}
class sr extends nr {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, s, o) {
    let r = t[n];
    const i = C(t) && Ns(n);
    if (!this._isShallow) {
      const p = /* @__PURE__ */ We(r);
      if (!/* @__PURE__ */ ge(s) && !/* @__PURE__ */ We(s) && (r = /* @__PURE__ */ $(r), s = /* @__PURE__ */ $(s)), !i && /* @__PURE__ */ Z(r) && !/* @__PURE__ */ Z(s))
        return p ? (process.env.NODE_ENV !== "production" && Ce(
          `Set operation on key "${String(n)}" failed: target is readonly.`,
          t[n]
        ), !0) : (r.value = s, !0);
    }
    const l = i ? Number(n) < t.length : j(t, n), f = Reflect.set(
      t,
      n,
      s,
      /* @__PURE__ */ Z(t) ? t : o
    );
    return t === /* @__PURE__ */ $(o) && f && (l ? He(s, r) && Ue(t, "set", n, s, r) : Ue(t, "add", n, s)), f;
  }
  deleteProperty(t, n) {
    const s = j(t, n), o = t[n], r = Reflect.deleteProperty(t, n);
    return r && s && Ue(t, "delete", n, void 0, o), r;
  }
  has(t, n) {
    const s = Reflect.has(t, n);
    return (!Se(n) || !tr.has(n)) && te(t, "has", n), s;
  }
  ownKeys(t) {
    return te(
      t,
      "iterate",
      C(t) ? "length" : at
    ), Reflect.ownKeys(t);
  }
}
class or extends nr {
  constructor(t = !1) {
    super(!0, t);
  }
  set(t, n) {
    return process.env.NODE_ENV !== "production" && Ce(
      `Set operation on key "${String(n)}" failed: target is readonly.`,
      t
    ), !0;
  }
  deleteProperty(t, n) {
    return process.env.NODE_ENV !== "production" && Ce(
      `Delete operation on key "${String(n)}" failed: target is readonly.`,
      t
    ), !0;
  }
}
const ji = /* @__PURE__ */ new sr(), Fi = /* @__PURE__ */ new or(), Li = /* @__PURE__ */ new sr(!0), Hi = /* @__PURE__ */ new or(!0), is = (e) => e, cn = (e) => Reflect.getPrototypeOf(e);
function Ui(e, t, n) {
  return function(...s) {
    const o = this.__v_raw, r = /* @__PURE__ */ $(o), i = ut(r), l = e === "entries" || e === Symbol.iterator && i, f = e === "keys" && i, p = o[e](...s), d = n ? is : t ? qt : ze;
    return !t && te(
      r,
      "iterate",
      f ? rs : at
    ), J(
      // inheriting all iterator properties
      Object.create(p),
      {
        // iterator protocol
        next() {
          const { value: a, done: g } = p.next();
          return g ? { value: a, done: g } : {
            value: l ? [d(a[0]), d(a[1])] : d(a),
            done: g
          };
        }
      }
    );
  };
}
function fn(e) {
  return function(...t) {
    if (process.env.NODE_ENV !== "production") {
      const n = t[0] ? `on key "${t[0]}" ` : "";
      Ce(
        `${$n(e)} operation ${n}failed: target is readonly.`,
        /* @__PURE__ */ $(this)
      );
    }
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function ki(e, t) {
  const n = {
    get(o) {
      const r = this.__v_raw, i = /* @__PURE__ */ $(r), l = /* @__PURE__ */ $(o);
      e || (He(o, l) && te(i, "get", o), te(i, "get", l));
      const { has: f } = cn(i), p = t ? is : e ? qt : ze;
      if (f.call(i, o))
        return p(r.get(o));
      if (f.call(i, l))
        return p(r.get(l));
      r !== i && r.get(o);
    },
    get size() {
      const o = this.__v_raw;
      return !e && te(/* @__PURE__ */ $(o), "iterate", at), o.size;
    },
    has(o) {
      const r = this.__v_raw, i = /* @__PURE__ */ $(r), l = /* @__PURE__ */ $(o);
      return e || (He(o, l) && te(i, "has", o), te(i, "has", l)), o === l ? r.has(o) : r.has(o) || r.has(l);
    },
    forEach(o, r) {
      const i = this, l = i.__v_raw, f = /* @__PURE__ */ $(l), p = t ? is : e ? qt : ze;
      return !e && te(f, "iterate", at), l.forEach((d, a) => o.call(r, p(d), p(a), i));
    }
  };
  return J(
    n,
    e ? {
      add: fn("add"),
      set: fn("set"),
      delete: fn("delete"),
      clear: fn("clear")
    } : {
      add(o) {
        const r = /* @__PURE__ */ $(this), i = cn(r), l = /* @__PURE__ */ $(o), f = !t && !/* @__PURE__ */ ge(o) && !/* @__PURE__ */ We(o) ? l : o;
        return i.has.call(r, f) || He(o, f) && i.has.call(r, o) || He(l, f) && i.has.call(r, l) || (r.add(f), Ue(r, "add", f, f)), this;
      },
      set(o, r) {
        !t && !/* @__PURE__ */ ge(r) && !/* @__PURE__ */ We(r) && (r = /* @__PURE__ */ $(r));
        const i = /* @__PURE__ */ $(this), { has: l, get: f } = cn(i);
        let p = l.call(i, o);
        p ? process.env.NODE_ENV !== "production" && to(i, l, o) : (o = /* @__PURE__ */ $(o), p = l.call(i, o));
        const d = f.call(i, o);
        return i.set(o, r), p ? He(r, d) && Ue(i, "set", o, r, d) : Ue(i, "add", o, r), this;
      },
      delete(o) {
        const r = /* @__PURE__ */ $(this), { has: i, get: l } = cn(r);
        let f = i.call(r, o);
        f ? process.env.NODE_ENV !== "production" && to(r, i, o) : (o = /* @__PURE__ */ $(o), f = i.call(r, o));
        const p = l ? l.call(r, o) : void 0, d = r.delete(o);
        return f && Ue(r, "delete", o, void 0, p), d;
      },
      clear() {
        const o = /* @__PURE__ */ $(this), r = o.size !== 0, i = process.env.NODE_ENV !== "production" ? ut(o) ? new Map(o) : new Set(o) : void 0, l = o.clear();
        return r && Ue(
          o,
          "clear",
          void 0,
          void 0,
          i
        ), l;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((o) => {
    n[o] = Ui(o, e, t);
  }), n;
}
function In(e, t) {
  const n = ki(e, t);
  return (s, o, r) => o === "__v_isReactive" ? !e : o === "__v_isReadonly" ? e : o === "__v_raw" ? s : Reflect.get(
    j(n, o) && o in s ? n : s,
    o,
    r
  );
}
const Wi = {
  get: /* @__PURE__ */ In(!1, !1)
}, Bi = {
  get: /* @__PURE__ */ In(!1, !0)
}, Ki = {
  get: /* @__PURE__ */ In(!0, !1)
}, Yi = {
  get: /* @__PURE__ */ In(!0, !0)
};
function to(e, t, n) {
  const s = /* @__PURE__ */ $(n);
  if (s !== n && t.call(e, s)) {
    const o = ys(e);
    Ce(
      `Reactive ${o} contains both the raw and reactive versions of the same object${o === "Map" ? " as keys" : ""}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`
    );
  }
}
const rr = /* @__PURE__ */ new WeakMap(), ir = /* @__PURE__ */ new WeakMap(), lr = /* @__PURE__ */ new WeakMap(), cr = /* @__PURE__ */ new WeakMap();
function qi(e) {
  switch (e) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
// @__NO_SIDE_EFFECTS__
function As(e) {
  return /* @__PURE__ */ We(e) ? e : jn(
    e,
    !1,
    ji,
    Wi,
    rr
  );
}
// @__NO_SIDE_EFFECTS__
function Gi(e) {
  return jn(
    e,
    !1,
    Li,
    Bi,
    ir
  );
}
// @__NO_SIDE_EFFECTS__
function ls(e) {
  return jn(
    e,
    !0,
    Fi,
    Ki,
    lr
  );
}
// @__NO_SIDE_EFFECTS__
function ke(e) {
  return jn(
    e,
    !0,
    Hi,
    Yi,
    cr
  );
}
function jn(e, t, n, s, o) {
  if (!U(e))
    return process.env.NODE_ENV !== "production" && Ce(
      `value cannot be made ${t ? "readonly" : "reactive"}: ${String(
        e
      )}`
    ), e;
  if (e.__v_raw && !(t && e.__v_isReactive) || e.__v_skip || !Object.isExtensible(e))
    return e;
  const r = o.get(e);
  if (r)
    return r;
  const i = qi(ys(e));
  if (i === 0)
    return e;
  const l = new Proxy(
    e,
    i === 2 ? s : n
  );
  return o.set(e, l), l;
}
// @__NO_SIDE_EFFECTS__
function dt(e) {
  return /* @__PURE__ */ We(e) ? /* @__PURE__ */ dt(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function We(e) {
  return !!(e && e.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function ge(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function Nn(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function $(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ $(t) : e;
}
function Ji(e) {
  return !j(e, "__v_skip") && Object.isExtensible(e) && yn(e, "__v_skip", !0), e;
}
const ze = (e) => U(e) ? /* @__PURE__ */ As(e) : e, qt = (e) => U(e) ? /* @__PURE__ */ ls(e) : e;
// @__NO_SIDE_EFFECTS__
function Z(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function un(e) {
  return zi(e, !1);
}
function zi(e, t) {
  return /* @__PURE__ */ Z(e) ? e : new Xi(e, t);
}
class Xi {
  constructor(t, n) {
    this.dep = new Cs(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : /* @__PURE__ */ $(t), this._value = n ? t : ze(t), this.__v_isShallow = n;
  }
  get value() {
    return process.env.NODE_ENV !== "production" ? this.dep.track({
      target: this,
      type: "get",
      key: "value"
    }) : this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, s = this.__v_isShallow || /* @__PURE__ */ ge(t) || /* @__PURE__ */ We(t);
    t = s ? t : /* @__PURE__ */ $(t), He(t, n) && (this._rawValue = t, this._value = s ? t : ze(t), process.env.NODE_ENV !== "production" ? this.dep.trigger({
      target: this,
      type: "set",
      key: "value",
      newValue: t,
      oldValue: n
    }) : this.dep.trigger());
  }
}
function fr(e) {
  return /* @__PURE__ */ Z(e) ? e.value : e;
}
const Qi = {
  get: (e, t, n) => t === "__v_raw" ? e : fr(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const o = e[t];
    return /* @__PURE__ */ Z(o) && !/* @__PURE__ */ Z(n) ? (o.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function ur(e) {
  return /* @__PURE__ */ dt(e) ? e : new Proxy(e, Qi);
}
class Zi {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new Cs(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = Kt - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    K !== this)
      return Jo(this, !0), !0;
    process.env.NODE_ENV;
  }
  get value() {
    const t = process.env.NODE_ENV !== "production" ? this.dep.track({
      target: this,
      type: "get",
      key: "value"
    }) : this.dep.track();
    return Qo(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter ? this.setter(t) : process.env.NODE_ENV !== "production" && Ce("Write operation failed: computed value is readonly");
  }
}
// @__NO_SIDE_EFFECTS__
function el(e, t, n = !1) {
  let s, o;
  R(e) ? s = e : (s = e.get, o = e.set);
  const r = new Zi(s, o, n);
  return process.env.NODE_ENV, r;
}
const an = {}, On = /* @__PURE__ */ new WeakMap();
let ft;
function tl(e, t = !1, n = ft) {
  if (n) {
    let s = On.get(n);
    s || On.set(n, s = []), s.push(e);
  } else process.env.NODE_ENV !== "production" && !t && Ce(
    "onWatcherCleanup() was called when there was no active watcher to associate with."
  );
}
function nl(e, t, n = Y) {
  const { immediate: s, deep: o, once: r, scheduler: i, augmentJob: l, call: f } = n, p = (V) => {
    (n.onWarn || Ce)(
      "Invalid watch source: ",
      V,
      "A watch source can only be a getter/effect function, a ref, a reactive object, or an array of these types."
    );
  }, d = (V) => o ? V : /* @__PURE__ */ ge(V) || o === !1 || o === 0 ? st(V, 1) : st(V);
  let a, g, w, A, x = !1, q = !1;
  if (/* @__PURE__ */ Z(e) ? (g = () => e.value, x = /* @__PURE__ */ ge(e)) : /* @__PURE__ */ dt(e) ? (g = () => d(e), x = !0) : C(e) ? (q = !0, x = e.some((V) => /* @__PURE__ */ dt(V) || /* @__PURE__ */ ge(V)), g = () => e.map((V) => {
    if (/* @__PURE__ */ Z(V))
      return V.value;
    if (/* @__PURE__ */ dt(V))
      return d(V);
    if (R(V))
      return f ? f(V, 2) : V();
    process.env.NODE_ENV !== "production" && p(V);
  })) : R(e) ? t ? g = f ? () => f(e, 2) : e : g = () => {
    if (w) {
      Te();
      try {
        w();
      } finally {
        Ae();
      }
    }
    const V = ft;
    ft = a;
    try {
      return f ? f(e, 3, [A]) : e(A);
    } finally {
      ft = V;
    }
  } : (g = ne, process.env.NODE_ENV !== "production" && p(e)), t && o) {
    const V = g, se = o === !0 ? 1 / 0 : o;
    g = () => st(V(), se);
  }
  const G = Ti(), F = () => {
    a.stop(), G && G.active && Es(G.effects, a);
  };
  if (r && t) {
    const V = t;
    t = (...se) => {
      const ae = V(...se);
      return F(), ae;
    };
  }
  let P = q ? new Array(e.length).fill(an) : an;
  const k = (V) => {
    if (!(!(a.flags & 1) || !a.dirty && !V))
      if (t) {
        const se = a.run();
        if (V || o || x || (q ? se.some((ae, le) => He(ae, P[le])) : He(se, P))) {
          w && w();
          const ae = ft;
          ft = a;
          try {
            const le = [
              se,
              // pass undefined as the old value when it's changed for the first time
              P === an ? void 0 : q && P[0] === an ? [] : P,
              A
            ];
            P = se, f ? f(t, 3, le) : (
              // @ts-expect-error
              t(...le)
            );
          } finally {
            ft = ae;
          }
        }
      } else
        a.run();
  };
  return l && l(k), a = new qo(g), a.scheduler = i ? () => i(k, !1) : k, A = (V) => tl(V, !1, a), w = a.onStop = () => {
    const V = On.get(a);
    if (V) {
      if (f)
        f(V, 4);
      else
        for (const se of V) se();
      On.delete(a);
    }
  }, process.env.NODE_ENV !== "production" && (a.onTrack = n.onTrack, a.onTrigger = n.onTrigger), t ? s ? k(!0) : P = a.run() : i ? i(k.bind(null, !0), !0) : a.run(), F.pause = a.pause.bind(a), F.resume = a.resume.bind(a), F.stop = F, F;
}
function st(e, t = 1 / 0, n) {
  if (t <= 0 || !U(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t))
    return e;
  if (n.set(e, t), t--, /* @__PURE__ */ Z(e))
    st(e.value, t, n);
  else if (C(e))
    for (let s = 0; s < e.length; s++)
      st(e[s], t, n);
  else if (ko(e) || ut(e))
    e.forEach((s) => {
      st(s, t, n);
    });
  else if (Pn(e)) {
    for (const s in e)
      st(e[s], t, n);
    for (const s of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, s) && st(e[s], t, n);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
const pt = [];
function hn(e) {
  pt.push(e);
}
function _n() {
  pt.pop();
}
let Jn = !1;
function N(e, ...t) {
  if (Jn) return;
  Jn = !0, Te();
  const n = pt.length ? pt[pt.length - 1].component : null, s = n && n.appContext.config.warnHandler, o = sl();
  if (s)
    Dt(
      s,
      n,
      11,
      [
        // eslint-disable-next-line no-restricted-syntax
        e + t.map((r) => {
          var i, l;
          return (l = (i = r.toString) == null ? void 0 : i.call(r)) != null ? l : JSON.stringify(r);
        }).join(""),
        n && n.proxy,
        o.map(
          ({ vnode: r }) => `at <${on(n, r.type)}>`
        ).join(`
`),
        o
      ]
    );
  else {
    const r = [`[Vue warn]: ${e}`, ...t];
    o.length && r.push(`
`, ...ol(o)), console.warn(...r);
  }
  Ae(), Jn = !1;
}
function sl() {
  let e = pt[pt.length - 1];
  if (!e)
    return [];
  const t = [];
  for (; e; ) {
    const n = t[0];
    n && n.vnode === e ? n.recurseCount++ : t.push({
      vnode: e,
      recurseCount: 0
    });
    const s = e.component && e.component.parent;
    e = s && s.vnode;
  }
  return t;
}
function ol(e) {
  const t = [];
  return e.forEach((n, s) => {
    t.push(...s === 0 ? [] : [`
`], ...rl(n));
  }), t;
}
function rl({ vnode: e, recurseCount: t }) {
  const n = t > 0 ? `... (${t} recursive calls)` : "", s = e.component ? e.component.parent == null : !1, o = ` at <${on(
    e.component,
    e.type,
    s
  )}`, r = ">" + n;
  return e.props ? [o, ...il(e.props), r] : [o + r];
}
function il(e) {
  const t = [], n = Object.keys(e);
  return n.slice(0, 3).forEach((s) => {
    t.push(...ar(s, e[s]));
  }), n.length > 3 && t.push(" ..."), t;
}
function ar(e, t, n) {
  return z(t) ? (t = JSON.stringify(t), n ? t : [`${e}=${t}`]) : typeof t == "number" || typeof t == "boolean" || t == null ? n ? t : [`${e}=${t}`] : /* @__PURE__ */ Z(t) ? (t = ar(e, /* @__PURE__ */ $(t.value), !0), n ? t : [`${e}=Ref<`, t, ">"]) : R(t) ? [`${e}=fn${t.name ? `<${t.name}>` : ""}`] : (t = /* @__PURE__ */ $(t), n ? t : [`${e}=`, t]);
}
const Rs = {
  sp: "serverPrefetch hook",
  bc: "beforeCreate hook",
  c: "created hook",
  bm: "beforeMount hook",
  m: "mounted hook",
  bu: "beforeUpdate hook",
  u: "updated",
  bum: "beforeUnmount hook",
  um: "unmounted hook",
  a: "activated hook",
  da: "deactivated hook",
  ec: "errorCaptured hook",
  rtc: "renderTracked hook",
  rtg: "renderTriggered hook",
  0: "setup function",
  1: "render function",
  2: "watcher getter",
  3: "watcher callback",
  4: "watcher cleanup function",
  5: "native event handler",
  6: "component event handler",
  7: "vnode hook",
  8: "directive hook",
  9: "transition hook",
  10: "app errorHandler",
  11: "app warnHandler",
  12: "ref function",
  13: "async component loader",
  14: "scheduler flush",
  15: "component update",
  16: "app unmount cleanup function"
};
function Dt(e, t, n, s) {
  try {
    return s ? e(...s) : e();
  } catch (o) {
    en(o, t, n);
  }
}
function Re(e, t, n, s) {
  if (R(e)) {
    const o = Dt(e, t, n, s);
    return o && bs(o) && o.catch((r) => {
      en(r, t, n);
    }), o;
  }
  if (C(e)) {
    const o = [];
    for (let r = 0; r < e.length; r++)
      o.push(Re(e[r], t, n, s));
    return o;
  } else process.env.NODE_ENV !== "production" && N(
    `Invalid value type passed to callWithAsyncErrorHandling(): ${typeof e}`
  );
}
function en(e, t, n, s = !0) {
  const o = t ? t.vnode : null, { errorHandler: r, throwUnhandledErrorInProduction: i } = t && t.appContext.config || Y;
  if (t) {
    let l = t.parent;
    const f = t.proxy, p = process.env.NODE_ENV !== "production" ? Rs[n] : `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; l; ) {
      const d = l.ec;
      if (d) {
        for (let a = 0; a < d.length; a++)
          if (d[a](e, f, p) === !1)
            return;
      }
      l = l.parent;
    }
    if (r) {
      Te(), Dt(r, null, 10, [
        e,
        f,
        p
      ]), Ae();
      return;
    }
  }
  ll(e, n, o, s, i);
}
function ll(e, t, n, s = !0, o = !1) {
  if (process.env.NODE_ENV !== "production") {
    const r = Rs[t];
    if (n && hn(n), N(`Unhandled error${r ? ` during execution of ${r}` : ""}`), n && _n(), s)
      throw e;
    console.error(e);
  } else {
    if (o)
      throw e;
    console.error(e);
  }
}
const ue = [];
let Fe = -1;
const Ot = [];
let nt = null, yt = 0;
const dr = /* @__PURE__ */ Promise.resolve();
let wn = null;
const cl = 100;
function pr(e) {
  const t = wn || dr;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function fl(e) {
  let t = Fe + 1, n = ue.length;
  for (; t < n; ) {
    const s = t + n >>> 1, o = ue[s], r = Gt(o);
    r < e || r === e && o.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function Fn(e) {
  if (!(e.flags & 1)) {
    const t = Gt(e), n = ue[ue.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= Gt(n) ? ue.push(e) : ue.splice(fl(t), 0, e), e.flags |= 1, hr();
  }
}
function hr() {
  wn || (wn = dr.then(mr));
}
function _r(e) {
  C(e) ? Ot.push(...e) : nt && e.id === -1 ? nt.splice(yt + 1, 0, e) : e.flags & 1 || (Ot.push(e), e.flags |= 1), hr();
}
function no(e, t, n = Fe + 1) {
  for (process.env.NODE_ENV !== "production" && (t = t || /* @__PURE__ */ new Map()); n < ue.length; n++) {
    const s = ue[n];
    if (s && s.flags & 2) {
      if (e && s.id !== e.uid || process.env.NODE_ENV !== "production" && Ps(t, s))
        continue;
      ue.splice(n, 1), n--, s.flags & 4 && (s.flags &= -2), s(), s.flags & 4 || (s.flags &= -2);
    }
  }
}
function gr(e) {
  if (Ot.length) {
    const t = [...new Set(Ot)].sort(
      (n, s) => Gt(n) - Gt(s)
    );
    if (Ot.length = 0, nt) {
      nt.push(...t);
      return;
    }
    for (nt = t, process.env.NODE_ENV !== "production" && (e = e || /* @__PURE__ */ new Map()), yt = 0; yt < nt.length; yt++) {
      const n = nt[yt];
      process.env.NODE_ENV !== "production" && Ps(e, n) || (n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2);
    }
    nt = null, yt = 0;
  }
}
const Gt = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function mr(e) {
  process.env.NODE_ENV !== "production" && (e = e || /* @__PURE__ */ new Map());
  const t = process.env.NODE_ENV !== "production" ? (n) => Ps(e, n) : ne;
  try {
    for (Fe = 0; Fe < ue.length; Fe++) {
      const n = ue[Fe];
      if (n && !(n.flags & 8)) {
        if (process.env.NODE_ENV !== "production" && t(n))
          continue;
        n.flags & 4 && (n.flags &= -2), Dt(
          n,
          n.i,
          n.i ? 15 : 14
        ), n.flags & 4 || (n.flags &= -2);
      }
    }
  } finally {
    for (; Fe < ue.length; Fe++) {
      const n = ue[Fe];
      n && (n.flags &= -2);
    }
    Fe = -1, ue.length = 0, gr(e), wn = null, (ue.length || Ot.length) && mr(e);
  }
}
function Ps(e, t) {
  const n = e.get(t) || 0;
  if (n > cl) {
    const s = t.i, o = s && ni(s.type);
    return en(
      `Maximum recursive updates exceeded${o ? ` in component <${o}>` : ""}. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. Possible sources include component template, render function, updated hook or watcher source function.`,
      null,
      10
    ), !0;
  }
  return e.set(t, n + 1), !1;
}
let ve = !1;
const so = (e) => {
  try {
    return ve;
  } finally {
    ve = e;
  }
}, gn = /* @__PURE__ */ new Map();
process.env.NODE_ENV !== "production" && (Zt().__VUE_HMR_RUNTIME__ = {
  createRecord: zn(vr),
  rerender: zn(dl),
  reload: zn(pl)
});
const gt = /* @__PURE__ */ new Map();
function ul(e) {
  const t = e.type.__hmrId;
  let n = gt.get(t);
  n || (vr(t, e.type), n = gt.get(t)), n.instances.add(e);
}
function al(e) {
  gt.get(e.type.__hmrId).instances.delete(e);
}
function vr(e, t) {
  return gt.has(e) ? !1 : (gt.set(e, {
    initialDef: Dn(t),
    instances: /* @__PURE__ */ new Set()
  }), !0);
}
function Dn(e) {
  return si(e) ? e.__vccOpts : e;
}
function dl(e, t) {
  const n = gt.get(e);
  n && (n.initialDef.render = t, [...n.instances].forEach((s) => {
    t && (s.render = t, Dn(s.type).render = t), s.renderCache = [], ve = !0, s.job.flags & 8 || s.update(), ve = !1;
  }));
}
function pl(e, t) {
  const n = gt.get(e);
  if (!n) return;
  t = Dn(t), oo(n.initialDef, t);
  const s = [...n.instances];
  for (let o = 0; o < s.length; o++) {
    const r = s[o], i = Dn(r.type);
    let l = gn.get(i);
    l || (i !== n.initialDef && oo(i, t), gn.set(i, l = /* @__PURE__ */ new Set())), l.add(r), r.appContext.propsCache.delete(r.type), r.appContext.emitsCache.delete(r.type), r.appContext.optionsCache.delete(r.type), r.ceReload ? (l.add(r), r.ceReload(t.styles), l.delete(r)) : r.parent ? Fn(() => {
      r.job.flags & 8 || (ve = !0, r.parent.update(), ve = !1, l.delete(r));
    }) : r.appContext.reload ? r.appContext.reload() : typeof window < "u" ? window.location.reload() : console.warn(
      "[HMR] Root or manually mounted instance modified. Full reload required."
    ), r.root.ce && r !== r.root && r.root.ce._removeChildStyle(i);
  }
  _r(() => {
    gn.clear();
  });
}
function oo(e, t) {
  J(e, t);
  for (const n in e)
    n !== "__file" && !(n in t) && delete e[n];
}
function zn(e) {
  return (t, n) => {
    try {
      return e(t, n);
    } catch (s) {
      console.error(s), console.warn(
        "[HMR] Something went wrong during Vue component hot-reload. Full reload required."
      );
    }
  };
}
let De, Mt = [], cs = !1;
function tn(e, ...t) {
  De ? De.emit(e, ...t) : cs || Mt.push({ event: e, args: t });
}
function Ms(e, t) {
  var n, s;
  De = e, De ? (De.enabled = !0, Mt.forEach(({ event: o, args: r }) => De.emit(o, ...r)), Mt = []) : /* handle late devtools injection - only do this if we are in an actual */ /* browser environment to avoid the timer handle stalling test runner exit */ /* (#4815) */ typeof window < "u" && // some envs mock window but not fully
  window.HTMLElement && // also exclude jsdom
  // eslint-disable-next-line no-restricted-syntax
  !((s = (n = window.navigator) == null ? void 0 : n.userAgent) != null && s.includes("jsdom")) ? ((t.__VUE_DEVTOOLS_HOOK_REPLAY__ = t.__VUE_DEVTOOLS_HOOK_REPLAY__ || []).push((r) => {
    Ms(r, t);
  }), setTimeout(() => {
    De || (t.__VUE_DEVTOOLS_HOOK_REPLAY__ = null, cs = !0, Mt = []);
  }, 3e3)) : (cs = !0, Mt = []);
}
function hl(e, t) {
  tn("app:init", e, t, {
    Fragment: Oe,
    Text: nn,
    Comment: Ve,
    Static: En
  });
}
function _l(e) {
  tn("app:unmount", e);
}
const gl = /* @__PURE__ */ $s(
  "component:added"
  /* COMPONENT_ADDED */
), Er = /* @__PURE__ */ $s(
  "component:updated"
  /* COMPONENT_UPDATED */
), ml = /* @__PURE__ */ $s(
  "component:removed"
  /* COMPONENT_REMOVED */
), vl = (e) => {
  De && typeof De.cleanupBuffer == "function" && // remove the component if it wasn't buffered
  !De.cleanupBuffer(e) && ml(e);
};
// @__NO_SIDE_EFFECTS__
function $s(e) {
  return (t) => {
    tn(
      e,
      t.appContext.app,
      t.uid,
      t.parent ? t.parent.uid : void 0,
      t
    );
  };
}
const El = /* @__PURE__ */ br(
  "perf:start"
  /* PERFORMANCE_START */
), bl = /* @__PURE__ */ br(
  "perf:end"
  /* PERFORMANCE_END */
);
function br(e) {
  return (t, n, s) => {
    tn(e, t.appContext.app, t.uid, t, n, s);
  };
}
function yl(e, t, n) {
  tn(
    "component:emit",
    e.appContext.app,
    e,
    t,
    n
  );
}
let Ee = null, yr = null;
function xn(e) {
  const t = Ee;
  return Ee = e, yr = e && e.type.__scopeId || null, t;
}
function Nl(e, t = Ee, n) {
  if (!t || e._n)
    return e;
  const s = (...o) => {
    s._d && bo(-1);
    const r = xn(t), i = _t.length;
    let l;
    try {
      l = e(...o);
    } finally {
      for (let f = _t.length; f > i; f--) Jr();
      xn(r), s._d && bo(1);
    }
    return process.env.NODE_ENV !== "production" && Er(t), l;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function Nr(e) {
  di(e) && N("Do not use built-in directive ids as custom directive id: " + e);
}
function it(e, t, n, s) {
  const o = e.dirs, r = t && t.dirs;
  for (let i = 0; i < o.length; i++) {
    const l = o[i];
    r && (l.oldValue = r[i].value);
    let f = l.dir[s];
    f && (Te(), Re(f, n, 8, [
      e.el,
      l,
      e,
      t
    ]), Ae());
  }
}
function Ol(e, t) {
  if (process.env.NODE_ENV !== "production" && (!ee || ee.isMounted) && N("provide() can only be used inside setup()."), ee) {
    let n = ee.provides;
    const s = ee.parent && ee.parent.provides;
    s === n && (n = ee.provides = Object.create(s)), n[e] = t;
  }
}
function mn(e, t, n = !1) {
  const s = Zr();
  if (s || wt) {
    let o = wt ? wt._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (o && e in o)
      return o[e];
    if (arguments.length > 1)
      return n && R(t) ? t.call(s && s.proxy) : t;
    process.env.NODE_ENV !== "production" && N(`injection "${String(e)}" not found.`);
  } else process.env.NODE_ENV !== "production" && N("inject() can only be used inside setup() or functional components.");
}
const wl = /* @__PURE__ */ Symbol.for("v-scx"), Dl = () => {
  {
    const e = mn(wl);
    return e || process.env.NODE_ENV !== "production" && N(
      "Server rendering context not provided. Make sure to only call useSSRContext() conditionally in the server build."
    ), e;
  }
};
function Xn(e, t, n) {
  return process.env.NODE_ENV !== "production" && !R(t) && N(
    "`watch(fn, options?)` signature has been moved to a separate API. Use `watchEffect(fn, options?)` instead. `watch` now only supports `watch(source, cb, options?) signature."
  ), Or(e, t, n);
}
function Or(e, t, n = Y) {
  const { immediate: s, deep: o, flush: r, once: i } = n;
  process.env.NODE_ENV !== "production" && !t && (s !== void 0 && N(
    'watch() "immediate" option is only respected when using the watch(source, callback, options?) signature.'
  ), o !== void 0 && N(
    'watch() "deep" option is only respected when using the watch(source, callback, options?) signature.'
  ), i !== void 0 && N(
    'watch() "once" option is only respected when using the watch(source, callback, options?) signature.'
  ));
  const l = J({}, n);
  process.env.NODE_ENV !== "production" && (l.onWarn = N);
  const f = t && s || !t && r !== "post";
  let p;
  if (zt) {
    if (r === "sync") {
      const w = Dl();
      p = w.__watcherHandles || (w.__watcherHandles = []);
    } else if (!f) {
      const w = () => {
      };
      return w.stop = ne, w.resume = ne, w.pause = ne, w;
    }
  }
  const d = ee;
  l.call = (w, A, x) => Re(w, d, A, x);
  let a = !1;
  r === "post" ? l.scheduler = (w) => {
    he(w, d && d.suspense);
  } : r !== "sync" && (a = !0, l.scheduler = (w, A) => {
    A ? w() : Fn(w);
  }), l.augmentJob = (w) => {
    t && (w.flags |= 4), a && (w.flags |= 2, d && (w.id = d.uid, w.i = d));
  };
  const g = nl(e, t, l);
  return zt && (p ? p.push(g) : f && g()), g;
}
function xl(e, t, n) {
  const s = this.proxy, o = z(e) ? e.includes(".") ? wr(s, e) : () => s[e] : e.bind(s, s);
  let r;
  R(t) ? r = t : (r = t.handler, n = t);
  const i = sn(this), l = Or(o, r.bind(s), n);
  return i(), l;
}
function wr(e, t) {
  const n = t.split(".");
  return () => {
    let s = e;
    for (let o = 0; o < n.length && s; o++)
      s = s[n[o]];
    return s;
  };
}
const Vl = /* @__PURE__ */ Symbol("_vte"), Sl = (e) => e.__isTeleport, Qn = /* @__PURE__ */ Symbol("_leaveCb");
function Is(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, Is(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
// @__NO_SIDE_EFFECTS__
function Dr(e, t) {
  return R(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    J({ name: e.name }, t, { setup: e })
  ) : e;
}
function xr(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
const ro = /* @__PURE__ */ new WeakSet();
function io(e, t) {
  let n;
  return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
const Vn = /* @__PURE__ */ new WeakMap();
function Ht(e, t, n, s, o = !1) {
  if (C(e)) {
    e.forEach(
      (x, q) => Ht(
        x,
        t && (C(t) ? t[q] : t),
        n,
        s,
        o
      )
    );
    return;
  }
  if (Ut(s) && !o) {
    s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && Ht(e, t, n, s.component.subTree);
    return;
  }
  const r = s.shapeFlag & 4 ? ks(s.component) : s.el, i = o ? null : r, { i: l, r: f } = e;
  if (process.env.NODE_ENV !== "production" && !l) {
    N(
      "Missing ref owner context. ref cannot be used on hoisted vnodes. A vnode with ref must be created inside the render function."
    );
    return;
  }
  const p = t && t.r, d = l.refs === Y ? l.refs = {} : l.refs, a = l.setupState, g = /* @__PURE__ */ $(a), w = a === Y ? Uo : (x) => process.env.NODE_ENV !== "production" && (j(g, x) && !/* @__PURE__ */ Z(g[x]) && N(
    `Template ref "${x}" used on a non-ref value. It will not work in the production build.`
  ), ro.has(g[x])) || io(d, x) ? !1 : j(g, x), A = (x, q) => !(process.env.NODE_ENV !== "production" && ro.has(x) || q && io(d, q));
  if (p != null && p !== f) {
    if (lo(t), z(p))
      d[p] = null, w(p) && (a[p] = null);
    else if (/* @__PURE__ */ Z(p)) {
      const x = t;
      A(p, x.k) && (p.value = null), x.k && (d[x.k] = null);
    }
  }
  if (R(f))
    Dt(f, l, 12, [i, d]);
  else {
    const x = z(f), q = /* @__PURE__ */ Z(f);
    if (x || q) {
      const G = () => {
        if (e.f) {
          const F = x ? w(f) ? a[f] : d[f] : A(f) || !e.k ? f.value : d[e.k];
          if (o)
            C(F) && Es(F, r);
          else if (C(F))
            F.includes(r) || F.push(r);
          else if (x)
            d[f] = [r], w(f) && (a[f] = d[f]);
          else {
            const P = [r];
            A(f, e.k) && (f.value = P), e.k && (d[e.k] = P);
          }
        } else x ? (d[f] = i, w(f) && (a[f] = i)) : q ? (A(f, e.k) && (f.value = i), e.k && (d[e.k] = i)) : process.env.NODE_ENV !== "production" && N("Invalid template ref type:", f, `(${typeof f})`);
      };
      if (i) {
        const F = () => {
          G(), Vn.delete(e);
        };
        F.id = -1, Vn.set(e, F), he(F, n);
      } else
        lo(e), G();
    } else process.env.NODE_ENV !== "production" && N("Invalid template ref type:", f, `(${typeof f})`);
  }
}
function lo(e) {
  const t = Vn.get(e);
  t && (t.flags |= 8, Vn.delete(e));
}
Zt().requestIdleCallback;
Zt().cancelIdleCallback;
const Ut = (e) => !!e.type.__asyncLoader, js = (e) => e.type.__isKeepAlive;
function Cl(e, t) {
  Vr(e, "a", t);
}
function Tl(e, t) {
  Vr(e, "da", t);
}
function Vr(e, t, n = ee) {
  const s = e.__wdc || (e.__wdc = () => {
    let o = n;
    for (; o; ) {
      if (o.isDeactivated)
        return;
      o = o.parent;
    }
    return e();
  });
  if (Ln(t, s, n), n) {
    let o = n.parent;
    for (; o && o.parent; )
      js(o.parent.vnode) && Al(s, t, n, o), o = o.parent;
  }
}
function Al(e, t, n, s) {
  const o = Ln(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  Tr(() => {
    Es(s[t], o);
  }, n);
}
function Ln(e, t, n = ee, s = !1) {
  if (n) {
    const o = n[e] || (n[e] = []), r = t.__weh || (t.__weh = (...i) => {
      Te();
      const l = sn(n), f = Re(t, n, e, i);
      return l(), Ae(), f;
    });
    return s ? o.unshift(r) : o.push(r), r;
  } else if (process.env.NODE_ENV !== "production") {
    const o = ct(Rs[e].replace(/ hook$/, ""));
    N(
      `${o} is called when there is no active component instance to be associated with. Lifecycle injection APIs can only be used during execution of setup(). If you are using async setup(), make sure to register lifecycle hooks before the first await statement.`
    );
  }
}
const Qe = (e) => (t, n = ee) => {
  (!zt || e === "sp") && Ln(e, (...s) => t(...s), n);
}, Rl = Qe("bm"), Sr = Qe("m"), Pl = Qe(
  "bu"
), Ml = Qe("u"), Cr = Qe(
  "bum"
), Tr = Qe("um"), $l = Qe(
  "sp"
), Il = Qe("rtg"), jl = Qe("rtc");
function Fl(e, t = ee) {
  Ln("ec", e, t);
}
const Ll = /* @__PURE__ */ Symbol.for("v-ndc"), fs = (e) => e ? ei(e) ? ks(e) : fs(e.parent) : null, ht = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ J(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => process.env.NODE_ENV !== "production" ? /* @__PURE__ */ ke(e.props) : e.props,
    $attrs: (e) => process.env.NODE_ENV !== "production" ? /* @__PURE__ */ ke(e.attrs) : e.attrs,
    $slots: (e) => process.env.NODE_ENV !== "production" ? /* @__PURE__ */ ke(e.slots) : e.slots,
    $refs: (e) => process.env.NODE_ENV !== "production" ? /* @__PURE__ */ ke(e.refs) : e.refs,
    $parent: (e) => fs(e.parent),
    $root: (e) => fs(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => Pr(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      Fn(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = pr.bind(e.proxy)),
    $watch: (e) => xl.bind(e)
  })
), Fs = (e) => e === "_" || e === "$", Zn = (e, t) => e !== Y && !e.__isScriptSetup && j(e, t), Ar = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: o, props: r, accessCache: i, type: l, appContext: f } = e;
    if (process.env.NODE_ENV !== "production" && t === "__isVue")
      return !0;
    if (t[0] !== "$") {
      const g = i[t];
      if (g !== void 0)
        switch (g) {
          case 1:
            return s[t];
          case 2:
            return o[t];
          case 4:
            return n[t];
          case 3:
            return r[t];
        }
      else {
        if (Zn(s, t))
          return i[t] = 1, s[t];
        if (o !== Y && j(o, t))
          return i[t] = 2, o[t];
        if (j(r, t))
          return i[t] = 3, r[t];
        if (n !== Y && j(n, t))
          return i[t] = 4, n[t];
        us && (i[t] = 0);
      }
    }
    const p = ht[t];
    let d, a;
    if (p)
      return t === "$attrs" ? (te(e.attrs, "get", ""), process.env.NODE_ENV !== "production" && Cn()) : process.env.NODE_ENV !== "production" && t === "$slots" && te(e, "get", t), p(e);
    if (
      // css module (injected by vue-loader)
      (d = l.__cssModules) && (d = d[t])
    )
      return d;
    if (n !== Y && j(n, t))
      return i[t] = 4, n[t];
    if (
      // global properties
      a = f.config.globalProperties, j(a, t)
    )
      return a[t];
    process.env.NODE_ENV !== "production" && Ee && (!z(t) || // #1091 avoid internal isRef/isVNode checks on component instance leading
    // to infinite warning loop
    t.indexOf("__v") !== 0) && (o !== Y && Fs(t[0]) && j(o, t) ? N(
      `Property ${JSON.stringify(
        t
      )} must be accessed via $data because it starts with a reserved character ("$" or "_") and is not proxied on the render context.`
    ) : e === Ee && N(
      `Property ${JSON.stringify(t)} was accessed during render but is not defined on instance.`
    ));
  },
  set({ _: e }, t, n) {
    const { data: s, setupState: o, ctx: r } = e;
    return Zn(o, t) ? (o[t] = n, !0) : process.env.NODE_ENV !== "production" && o.__isScriptSetup && j(o, t) ? (N(`Cannot mutate <script setup> binding "${t}" from Options API.`), !1) : s !== Y && j(s, t) ? (s[t] = n, !0) : j(e.props, t) ? (process.env.NODE_ENV !== "production" && N(`Attempting to mutate prop "${t}". Props are readonly.`), !1) : t[0] === "$" && t.slice(1) in e ? (process.env.NODE_ENV !== "production" && N(
      `Attempting to mutate public property "${t}". Properties starting with $ are reserved and readonly.`
    ), !1) : (process.env.NODE_ENV !== "production" && t in e.appContext.config.globalProperties ? Object.defineProperty(r, t, {
      enumerable: !0,
      configurable: !0,
      value: n
    }) : r[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: o, props: r, type: i }
  }, l) {
    let f;
    return !!(n[l] || e !== Y && l[0] !== "$" && j(e, l) || Zn(t, l) || j(r, l) || j(s, l) || j(ht, l) || j(o.config.globalProperties, l) || (f = i.__cssModules) && f[l]);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : j(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
process.env.NODE_ENV !== "production" && (Ar.ownKeys = (e) => (N(
  "Avoid app logic that relies on enumerating keys on a component instance. The keys will be empty in production mode to avoid performance overhead."
), Reflect.ownKeys(e)));
function Hl(e) {
  const t = {};
  return Object.defineProperty(t, "_", {
    configurable: !0,
    enumerable: !1,
    get: () => e
  }), Object.keys(ht).forEach((n) => {
    Object.defineProperty(t, n, {
      configurable: !0,
      enumerable: !1,
      get: () => ht[n](e),
      // intercepted by the proxy so no need for implementation,
      // but needed to prevent set errors
      set: ne
    });
  }), t;
}
function Ul(e) {
  const {
    ctx: t,
    propsOptions: [n]
  } = e;
  n && Object.keys(n).forEach((s) => {
    Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => e.props[s],
      set: ne
    });
  });
}
function kl(e) {
  const { ctx: t, setupState: n } = e;
  Object.keys(/* @__PURE__ */ $(n)).forEach((s) => {
    if (!n.__isScriptSetup) {
      if (Fs(s[0])) {
        N(
          `setup() return property ${JSON.stringify(
            s
          )} should not start with "$" or "_" which are reserved prefixes for Vue internals.`
        );
        return;
      }
      Object.defineProperty(t, s, {
        enumerable: !0,
        configurable: !0,
        get: () => n[s],
        set: ne
      });
    }
  });
}
function co(e) {
  return C(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
function Wl() {
  const e = /* @__PURE__ */ Object.create(null);
  return (t, n) => {
    e[n] ? N(`${t} property "${n}" is already defined in ${e[n]}.`) : e[n] = t;
  };
}
let us = !0;
function Bl(e) {
  const t = Pr(e), n = e.proxy, s = e.ctx;
  us = !1, t.beforeCreate && fo(t.beforeCreate, e, "bc");
  const {
    // state
    data: o,
    computed: r,
    methods: i,
    watch: l,
    provide: f,
    inject: p,
    // lifecycle
    created: d,
    beforeMount: a,
    mounted: g,
    beforeUpdate: w,
    updated: A,
    activated: x,
    deactivated: q,
    beforeDestroy: G,
    beforeUnmount: F,
    destroyed: P,
    unmounted: k,
    render: V,
    renderTracked: se,
    renderTriggered: ae,
    errorCaptured: le,
    serverPrefetch: de,
    // public API
    expose: Be,
    inheritAttrs: Ze,
    // assets
    components: Ne,
    directives: rn,
    filters: Ks
  } = t, et = process.env.NODE_ENV !== "production" ? Wl() : null;
  if (process.env.NODE_ENV !== "production") {
    const [L] = e.propsOptions;
    if (L)
      for (const I in L)
        et("Props", I);
  }
  if (p && Kl(p, s, et), i)
    for (const L in i) {
      const I = i[L];
      R(I) ? (process.env.NODE_ENV !== "production" ? Object.defineProperty(s, L, {
        value: I.bind(n),
        configurable: !0,
        enumerable: !0,
        writable: !0
      }) : s[L] = I.bind(n), process.env.NODE_ENV !== "production" && et("Methods", L)) : process.env.NODE_ENV !== "production" && N(
        `Method "${L}" has type "${typeof I}" in the component definition. Did you reference the function correctly?`
      );
    }
  if (o) {
    process.env.NODE_ENV !== "production" && !R(o) && N(
      "The data option must be a function. Plain object usage is no longer supported."
    );
    const L = o.call(n, n);
    if (process.env.NODE_ENV !== "production" && bs(L) && N(
      "data() returned a Promise - note data() cannot be async; If you intend to perform data fetching before component renders, use async setup() + <Suspense>."
    ), !U(L))
      process.env.NODE_ENV !== "production" && N("data() should return an object.");
    else if (e.data = /* @__PURE__ */ As(L), process.env.NODE_ENV !== "production")
      for (const I in L)
        et("Data", I), Fs(I[0]) || Object.defineProperty(s, I, {
          configurable: !0,
          enumerable: !0,
          get: () => L[I],
          set: ne
        });
  }
  if (us = !0, r)
    for (const L in r) {
      const I = r[L], Pe = R(I) ? I.bind(n, n) : R(I.get) ? I.get.bind(n, n) : ne;
      process.env.NODE_ENV !== "production" && Pe === ne && N(`Computed property "${L}" has no getter.`);
      const kn = !R(I) && R(I.set) ? I.set.bind(n) : process.env.NODE_ENV !== "production" ? () => {
        N(
          `Write operation failed: computed property "${L}" is readonly.`
        );
      } : ne, xt = ms({
        get: Pe,
        set: kn
      });
      Object.defineProperty(s, L, {
        enumerable: !0,
        configurable: !0,
        get: () => xt.value,
        set: (mt) => xt.value = mt
      }), process.env.NODE_ENV !== "production" && et("Computed", L);
    }
  if (l)
    for (const L in l)
      Rr(l[L], s, n, L);
  if (f) {
    const L = R(f) ? f.call(n) : f;
    Reflect.ownKeys(L).forEach((I) => {
      Ol(I, L[I]);
    });
  }
  d && fo(d, e, "c");
  function pe(L, I) {
    C(I) ? I.forEach((Pe) => L(Pe.bind(n))) : I && L(I.bind(n));
  }
  if (pe(Rl, a), pe(Sr, g), pe(Pl, w), pe(Ml, A), pe(Cl, x), pe(Tl, q), pe(Fl, le), pe(jl, se), pe(Il, ae), pe(Cr, F), pe(Tr, k), pe($l, de), C(Be))
    if (Be.length) {
      const L = e.exposed || (e.exposed = {});
      Be.forEach((I) => {
        Object.defineProperty(L, I, {
          get: () => n[I],
          set: (Pe) => n[I] = Pe,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  V && e.render === ne && (e.render = V), Ze != null && (e.inheritAttrs = Ze), Ne && (e.components = Ne), rn && (e.directives = rn), de && xr(e);
}
function Kl(e, t, n = ne) {
  C(e) && (e = as(e));
  for (const s in e) {
    const o = e[s];
    let r;
    U(o) ? "default" in o ? r = mn(
      o.from || s,
      o.default,
      !0
    ) : r = mn(o.from || s) : r = mn(o), /* @__PURE__ */ Z(r) ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => r.value,
      set: (i) => r.value = i
    }) : t[s] = r, process.env.NODE_ENV !== "production" && n("Inject", s);
  }
}
function fo(e, t, n) {
  Re(
    C(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function Rr(e, t, n, s) {
  let o = s.includes(".") ? wr(n, s) : () => n[s];
  if (z(e)) {
    const r = t[e];
    R(r) ? Xn(o, r) : process.env.NODE_ENV !== "production" && N(`Invalid watch handler specified by key "${e}"`, r);
  } else if (R(e))
    Xn(o, e.bind(n));
  else if (U(e))
    if (C(e))
      e.forEach((r) => Rr(r, t, n, s));
    else {
      const r = R(e.handler) ? e.handler.bind(n) : t[e.handler];
      R(r) ? Xn(o, r, e) : process.env.NODE_ENV !== "production" && N(`Invalid watch handler specified by key "${e.handler}"`, r);
    }
  else process.env.NODE_ENV !== "production" && N(`Invalid watch option: "${s}"`, e);
}
function Pr(e) {
  const t = e.type, { mixins: n, extends: s } = t, {
    mixins: o,
    optionsCache: r,
    config: { optionMergeStrategies: i }
  } = e.appContext, l = r.get(t);
  let f;
  return l ? f = l : !o.length && !n && !s ? f = t : (f = {}, o.length && o.forEach(
    (p) => Sn(f, p, i, !0)
  ), Sn(f, t, i)), U(t) && r.set(t, f), f;
}
function Sn(e, t, n, s = !1) {
  const { mixins: o, extends: r } = t;
  r && Sn(e, r, n, !0), o && o.forEach(
    (i) => Sn(e, i, n, !0)
  );
  for (const i in t)
    if (s && i === "expose")
      process.env.NODE_ENV !== "production" && N(
        '"expose" option is ignored when declared in mixins or extends. It should only be declared in the base component itself.'
      );
    else {
      const l = Yl[i] || n && n[i];
      e[i] = l ? l(e[i], t[i]) : t[i];
    }
  return e;
}
const Yl = {
  data: uo,
  props: ao,
  emits: ao,
  // objects
  methods: $t,
  computed: $t,
  // lifecycle
  beforeCreate: fe,
  created: fe,
  beforeMount: fe,
  mounted: fe,
  beforeUpdate: fe,
  updated: fe,
  beforeDestroy: fe,
  beforeUnmount: fe,
  destroyed: fe,
  unmounted: fe,
  activated: fe,
  deactivated: fe,
  errorCaptured: fe,
  serverPrefetch: fe,
  // assets
  components: $t,
  directives: $t,
  // watch
  watch: Gl,
  // provide / inject
  provide: uo,
  inject: ql
};
function uo(e, t) {
  return t ? e ? function() {
    return J(
      R(e) ? e.call(this, this) : e,
      R(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function ql(e, t) {
  return $t(as(e), as(t));
}
function as(e) {
  if (C(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++)
      t[e[n]] = e[n];
    return t;
  }
  return e;
}
function fe(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function $t(e, t) {
  return e ? J(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function ao(e, t) {
  return e ? C(e) && C(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : J(
    /* @__PURE__ */ Object.create(null),
    co(e),
    co(t ?? {})
  ) : t;
}
function Gl(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = J(/* @__PURE__ */ Object.create(null), e);
  for (const s in t)
    n[s] = fe(e[s], t[s]);
  return n;
}
function Mr() {
  return {
    app: null,
    config: {
      isNativeTag: Uo,
      performance: !1,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let Jl = 0;
function zl(e, t) {
  return function(s, o = null) {
    R(s) || (s = J({}, s)), o != null && !U(o) && (process.env.NODE_ENV !== "production" && N("root props passed to app.mount() must be an object."), o = null);
    const r = Mr(), i = /* @__PURE__ */ new WeakSet(), l = [];
    let f = !1;
    const p = r.app = {
      _uid: Jl++,
      _component: s,
      _props: o,
      _container: null,
      _context: r,
      _instance: null,
      version: wo,
      get config() {
        return r.config;
      },
      set config(d) {
        process.env.NODE_ENV !== "production" && N(
          "app.config cannot be replaced. Modify individual options instead."
        );
      },
      use(d, ...a) {
        return i.has(d) ? process.env.NODE_ENV !== "production" && N("Plugin has already been applied to target app.") : d && R(d.install) ? (i.add(d), d.install(p, ...a)) : R(d) ? (i.add(d), d(p, ...a)) : process.env.NODE_ENV !== "production" && N(
          'A plugin must either be a function or an object with an "install" function.'
        ), p;
      },
      mixin(d) {
        return r.mixins.includes(d) ? process.env.NODE_ENV !== "production" && N(
          "Mixin has already been applied to target app" + (d.name ? `: ${d.name}` : "")
        ) : r.mixins.push(d), p;
      },
      component(d, a) {
        return process.env.NODE_ENV !== "production" && gs(d, r.config), a ? (process.env.NODE_ENV !== "production" && r.components[d] && N(`Component "${d}" has already been registered in target app.`), r.components[d] = a, p) : r.components[d];
      },
      directive(d, a) {
        return process.env.NODE_ENV !== "production" && Nr(d), a ? (process.env.NODE_ENV !== "production" && r.directives[d] && N(`Directive "${d}" has already been registered in target app.`), r.directives[d] = a, p) : r.directives[d];
      },
      mount(d, a, g) {
        if (f)
          process.env.NODE_ENV !== "production" && N(
            "App has already been mounted.\nIf you want to remount the same app, move your app creation logic into a factory function and create fresh app instances for each mount - e.g. `const createMyApp = () => createApp(App)`"
          );
        else {
          process.env.NODE_ENV !== "production" && d.__vue_app__ && N(
            "There is already an app instance mounted on the host container.\n If you want to mount another app on the same host container, you need to unmount the previous app by calling `app.unmount()` first."
          );
          const w = p._ceVNode || ot(s, o);
          return w.appContext = r, g === !0 ? g = "svg" : g === !1 && (g = void 0), process.env.NODE_ENV !== "production" && (r.reload = () => {
            const A = rt(w);
            A.el = null, e(A, d, g);
          }), e(w, d, g), f = !0, p._container = d, d.__vue_app__ = p, process.env.NODE_ENV !== "production" && (p._instance = w.component, hl(p, wo)), ks(w.component);
        }
      },
      onUnmount(d) {
        process.env.NODE_ENV !== "production" && typeof d != "function" && N(
          `Expected function as first argument to app.onUnmount(), but got ${typeof d}`
        ), l.push(d);
      },
      unmount() {
        f ? (Re(
          l,
          p._instance,
          16
        ), e(null, p._container), process.env.NODE_ENV !== "production" && (p._instance = null, _l(p)), delete p._container.__vue_app__) : process.env.NODE_ENV !== "production" && N("Cannot unmount an app that is not mounted.");
      },
      provide(d, a) {
        return process.env.NODE_ENV !== "production" && d in r.provides && (j(r.provides, d) ? N(
          `App already provides property with key "${String(d)}". It will be overwritten with the new value.`
        ) : N(
          `App already provides property with key "${String(d)}" inherited from its parent element. It will be overwritten with the new value.`
        )), r.provides[d] = a, p;
      },
      runWithContext(d) {
        const a = wt;
        wt = p;
        try {
          return d();
        } finally {
          wt = a;
        }
      }
    };
    return p;
  };
}
let wt = null;
const Xl = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${ie(t)}Modifiers`] || e[`${me(t)}Modifiers`];
function Ql(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || Y;
  if (process.env.NODE_ENV !== "production") {
    const {
      emitsOptions: d,
      propsOptions: [a]
    } = e;
    if (d)
      if (!(t in d))
        (!a || !(ct(ie(t)) in a)) && N(
          `Component emitted event "${t}" but it is neither declared in the emits option nor as an "${ct(ie(t))}" prop.`
        );
      else {
        const g = d[t];
        R(g) && (g(...n) || N(
          `Invalid event arguments: event validation failed for event "${t}".`
        ));
      }
  }
  let o = n;
  const r = t.startsWith("update:"), i = r && Xl(s, t.slice(7));
  if (i && (i.trim && (o = n.map((d) => z(d) ? d.trim() : d)), i.number && (o = n.map(_i))), process.env.NODE_ENV !== "production" && yl(e, t, o), process.env.NODE_ENV !== "production") {
    const d = t.toLowerCase();
    d !== t && s[ct(d)] && N(
      `Event "${d}" is emitted in component ${on(
        e,
        e.type
      )} but the handler is registered for "${t}". Note that HTML attributes are case-insensitive and you cannot use v-on to listen to camelCase events when using in-DOM templates. You should probably use "${me(
        t
      )}" instead of "${t}".`
    );
  }
  let l, f = s[l = ct(t)] || // also try camelCase event handler (#2249)
  s[l = ct(ie(t))];
  !f && r && (f = s[l = ct(me(t))]), f && Re(
    f,
    e,
    6,
    o
  );
  const p = s[l + "Once"];
  if (p) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[l])
      return;
    e.emitted[l] = !0, Re(
      p,
      e,
      6,
      o
    );
  }
}
const Zl = /* @__PURE__ */ new WeakMap();
function $r(e, t, n = !1) {
  const s = n ? Zl : t.emitsCache, o = s.get(e);
  if (o !== void 0)
    return o;
  const r = e.emits;
  let i = {}, l = !1;
  if (!R(e)) {
    const f = (p) => {
      const d = $r(p, t, !0);
      d && (l = !0, J(i, d));
    };
    !n && t.mixins.length && t.mixins.forEach(f), e.extends && f(e.extends), e.mixins && e.mixins.forEach(f);
  }
  return !r && !l ? (U(e) && s.set(e, null), null) : (C(r) ? r.forEach((f) => i[f] = null) : J(i, r), U(e) && s.set(e, i), i);
}
function Hn(e, t) {
  return !e || !Xt(t) ? !1 : (t = t.slice(2), t = t === "Once" ? t : t.replace(/Once$/, ""), j(e, t[0].toLowerCase() + t.slice(1)) || j(e, me(t)) || j(e, t));
}
let ds = !1;
function Cn() {
  ds = !0;
}
function po(e) {
  const {
    type: t,
    vnode: n,
    proxy: s,
    withProxy: o,
    propsOptions: [r],
    slots: i,
    attrs: l,
    emit: f,
    render: p,
    renderCache: d,
    props: a,
    data: g,
    setupState: w,
    ctx: A,
    inheritAttrs: x
  } = e, q = xn(e);
  let G, F;
  process.env.NODE_ENV !== "production" && (ds = !1);
  try {
    if (n.shapeFlag & 4) {
      const V = o || s, se = process.env.NODE_ENV !== "production" && w.__isScriptSetup ? new Proxy(V, {
        get(ae, le, de) {
          return N(
            `Property '${String(
              le
            )}' was accessed via 'this'. Avoid using 'this' in templates.`
          ), Reflect.get(ae, le, de);
        }
      }) : V;
      G = we(
        p.call(
          se,
          V,
          d,
          process.env.NODE_ENV !== "production" ? /* @__PURE__ */ ke(a) : a,
          w,
          g,
          A
        )
      ), F = l;
    } else {
      const V = t;
      process.env.NODE_ENV !== "production" && l === a && Cn(), G = we(
        V.length > 1 ? V(
          process.env.NODE_ENV !== "production" ? /* @__PURE__ */ ke(a) : a,
          process.env.NODE_ENV !== "production" ? {
            get attrs() {
              return Cn(), /* @__PURE__ */ ke(l);
            },
            slots: i,
            emit: f
          } : { attrs: l, slots: i, emit: f }
        ) : V(
          process.env.NODE_ENV !== "production" ? /* @__PURE__ */ ke(a) : a,
          null
        )
      ), F = t.props ? l : ec(l);
    }
  } catch (V) {
    _t.length = 0, en(V, e, 1), G = ot(Ve);
  }
  let P = G, k;
  if (process.env.NODE_ENV !== "production" && G.patchFlag > 0 && G.patchFlag & 2048 && ([P, k] = Ir(G)), F && x !== !1) {
    const V = Object.keys(F), { shapeFlag: se } = P;
    if (V.length) {
      if (se & 7)
        r && V.some(Bt) && (F = tc(
          F,
          r
        )), P = rt(P, F, !1, !0);
      else if (process.env.NODE_ENV !== "production" && !ds && P.type !== Ve) {
        const ae = Object.keys(l), le = [], de = [];
        for (let Be = 0, Ze = ae.length; Be < Ze; Be++) {
          const Ne = ae[Be];
          Xt(Ne) ? Bt(Ne) || le.push(Ne[2].toLowerCase() + Ne.slice(3)) : de.push(Ne);
        }
        de.length && N(
          `Extraneous non-props attributes (${de.join(", ")}) were passed to component but could not be automatically inherited because component renders fragment or text or teleport root nodes.`
        ), le.length && N(
          `Extraneous non-emits event listeners (${le.join(", ")}) were passed to component but could not be automatically inherited because component renders fragment or text root nodes. If the listener is intended to be a component custom event listener only, declare it using the "emits" option.`
        );
      }
    }
  }
  return n.dirs && (process.env.NODE_ENV !== "production" && !ho(P) && N(
    "Runtime directive used on component with non-element root node. The directives will not function as intended."
  ), P = rt(P, null, !1, !0), P.dirs = P.dirs ? P.dirs.concat(n.dirs) : n.dirs), n.transition && (process.env.NODE_ENV !== "production" && !ho(P) && N(
    "Component inside <Transition> renders non-element root node that cannot be animated."
  ), Is(P, n.transition)), process.env.NODE_ENV !== "production" && k ? k(P) : G = P, xn(q), G;
}
const Ir = (e) => {
  const t = e.children, n = e.dynamicChildren, s = Ls(t, !1);
  if (s) {
    if (process.env.NODE_ENV !== "production" && s.patchFlag > 0 && s.patchFlag & 2048)
      return Ir(s);
  } else return [e, void 0];
  const o = t.indexOf(s), r = n ? n.indexOf(s) : -1, i = (l) => {
    t[o] = l, n && (r > -1 ? n[r] = l : l.patchFlag > 0 && (e.dynamicChildren = [...n, l]));
  };
  return [we(s), i];
};
function Ls(e, t = !0) {
  let n;
  for (let s = 0; s < e.length; s++) {
    const o = e[s];
    if (Un(o)) {
      if (o.type !== Ve || o.children === "v-if") {
        if (n)
          return;
        if (n = o, process.env.NODE_ENV !== "production" && t && n.patchFlag > 0 && n.patchFlag & 2048)
          return Ls(n.children);
      }
    } else
      return;
  }
  return n;
}
const ec = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || Xt(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, tc = (e, t) => {
  const n = {};
  for (const s in e)
    (!Bt(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
  return n;
}, ho = (e) => e.shapeFlag & 7 || e.type === Ve;
function nc(e, t, n) {
  const { props: s, children: o, component: r } = e, { props: i, children: l, patchFlag: f } = t, p = r.emitsOptions;
  if (process.env.NODE_ENV !== "production" && (o || l) && ve || t.dirs || t.transition)
    return !0;
  if (n && f >= 0) {
    if (f & 1024)
      return !0;
    if (f & 16)
      return s ? _o(s, i, p) : !!i;
    if (f & 8) {
      const d = t.dynamicProps;
      for (let a = 0; a < d.length; a++) {
        const g = d[a];
        if (jr(i, s, g) && !Hn(p, g))
          return !0;
      }
    }
  } else
    return (o || l) && (!l || !l.$stable) ? !0 : s === i ? !1 : s ? i ? _o(s, i, p) : !0 : !!i;
  return !1;
}
function _o(e, t, n) {
  const s = Object.keys(t);
  if (s.length !== Object.keys(e).length)
    return !0;
  for (let o = 0; o < s.length; o++) {
    const r = s[o];
    if (jr(t, e, r) && !Hn(n, r))
      return !0;
  }
  return !1;
}
function jr(e, t, n) {
  const s = e[n], o = t[n];
  return n === "style" && U(s) && U(o) ? !Ds(s, o) : s !== o;
}
function sc({ vnode: e, parent: t, suspense: n }, s) {
  for (; t; ) {
    const o = t.subTree;
    if (o.suspense && o.suspense.activeBranch === e && (o.suspense.vnode.el = o.el = s, e = o), o === e)
      (e = t.vnode).el = s, t = t.parent;
    else
      break;
  }
  n && n.activeBranch === e && (n.vnode.el = s);
}
const Fr = {}, Lr = () => Object.create(Fr), Hr = (e) => Object.getPrototypeOf(e) === Fr;
function oc(e, t, n, s = !1) {
  const o = {}, r = Lr();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), Ur(e, t, o, r);
  for (const i in e.propsOptions[0])
    i in o || (o[i] = void 0);
  process.env.NODE_ENV !== "production" && Wr(t || {}, o, e), n ? e.props = s ? o : /* @__PURE__ */ Gi(o) : e.type.props ? e.props = o : e.props = r, e.attrs = r;
}
function rc(e) {
  for (; e; ) {
    if (e.type.__hmrId) return !0;
    e = e.parent;
  }
}
function ic(e, t, n, s) {
  const {
    props: o,
    attrs: r,
    vnode: { patchFlag: i }
  } = e, l = /* @__PURE__ */ $(o), [f] = e.propsOptions;
  let p = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    !(process.env.NODE_ENV !== "production" && rc(e)) && (s || i > 0) && !(i & 16)
  ) {
    if (i & 8) {
      const d = e.vnode.dynamicProps;
      for (let a = 0; a < d.length; a++) {
        let g = d[a];
        if (Hn(e.emitsOptions, g))
          continue;
        const w = t[g];
        if (f)
          if (j(r, g))
            w !== r[g] && (r[g] = w, p = !0);
          else {
            const A = ie(g);
            o[A] = ps(
              f,
              l,
              A,
              w,
              e,
              !1
            );
          }
        else
          w !== r[g] && (r[g] = w, p = !0);
      }
    }
  } else {
    Ur(e, t, o, r) && (p = !0);
    let d;
    for (const a in l)
      (!t || // for camelCase
      !j(t, a) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((d = me(a)) === a || !j(t, d))) && (f ? n && // for camelCase
      (n[a] !== void 0 || // for kebab-case
      n[d] !== void 0) && (o[a] = ps(
        f,
        l,
        a,
        void 0,
        e,
        !0
      )) : delete o[a]);
    if (r !== l)
      for (const a in r)
        (!t || !j(t, a)) && (delete r[a], p = !0);
  }
  p && Ue(e.attrs, "set", ""), process.env.NODE_ENV !== "production" && Wr(t || {}, o, e);
}
function Ur(e, t, n, s) {
  const [o, r] = e.propsOptions;
  let i = !1, l;
  if (t)
    for (let f in t) {
      if (jt(f))
        continue;
      const p = t[f];
      let d;
      o && j(o, d = ie(f)) ? !r || !r.includes(d) ? n[d] = p : (l || (l = {}))[d] = p : Hn(e.emitsOptions, f) || (!(f in s) || p !== s[f]) && (s[f] = p, i = !0);
    }
  if (r) {
    const f = /* @__PURE__ */ $(n), p = l || Y;
    for (let d = 0; d < r.length; d++) {
      const a = r[d];
      n[a] = ps(
        o,
        f,
        a,
        p[a],
        e,
        !j(p, a)
      );
    }
  }
  return i;
}
function ps(e, t, n, s, o, r) {
  const i = e[n];
  if (i != null) {
    const l = j(i, "default");
    if (l && s === void 0) {
      const f = i.default;
      if (i.type !== Function && !i.skipFactory && R(f)) {
        const { propsDefaults: p } = o;
        if (n in p)
          s = p[n];
        else {
          const d = sn(o);
          s = p[n] = f.call(
            null,
            t
          ), d();
        }
      } else
        s = f;
      o.ce && o.ce._setProp(n, s);
    }
    i[
      0
      /* shouldCast */
    ] && (r && !l ? s = !1 : i[
      1
      /* shouldCastTrue */
    ] && (s === "" || s === me(n)) && (s = !0));
  }
  return s;
}
const lc = /* @__PURE__ */ new WeakMap();
function kr(e, t, n = !1) {
  const s = n ? lc : t.propsCache, o = s.get(e);
  if (o)
    return o;
  const r = e.props, i = {}, l = [];
  let f = !1;
  if (!R(e)) {
    const d = (a) => {
      f = !0;
      const [g, w] = kr(a, t, !0);
      J(i, g), w && l.push(...w);
    };
    !n && t.mixins.length && t.mixins.forEach(d), e.extends && d(e.extends), e.mixins && e.mixins.forEach(d);
  }
  if (!r && !f)
    return U(e) && s.set(e, Nt), Nt;
  if (C(r))
    for (let d = 0; d < r.length; d++) {
      process.env.NODE_ENV !== "production" && !z(r[d]) && N("props must be strings when using array syntax.", r[d]);
      const a = ie(r[d]);
      go(a) && (i[a] = Y);
    }
  else if (r) {
    process.env.NODE_ENV !== "production" && !U(r) && N("invalid props options", r);
    for (const d in r) {
      const a = ie(d);
      if (go(a)) {
        const g = r[d], w = i[a] = C(g) || R(g) ? { type: g } : J({}, g), A = w.type;
        let x = !1, q = !0;
        if (C(A))
          for (let G = 0; G < A.length; ++G) {
            const F = A[G], P = R(F) && F.name;
            if (P === "Boolean") {
              x = !0;
              break;
            } else P === "String" && (q = !1);
          }
        else
          x = R(A) && A.name === "Boolean";
        w[
          0
          /* shouldCast */
        ] = x, w[
          1
          /* shouldCastTrue */
        ] = q, (x || j(w, "default")) && l.push(a);
      }
    }
  }
  const p = [i, l];
  return U(e) && s.set(e, p), p;
}
function go(e) {
  return e[0] !== "$" && !jt(e) ? !0 : (process.env.NODE_ENV !== "production" && N(`Invalid prop name: "${e}" is a reserved property.`), !1);
}
function cc(e) {
  return e === null ? "null" : typeof e == "function" ? e.name || "" : typeof e == "object" && e.constructor && e.constructor.name || "";
}
function Wr(e, t, n) {
  const s = /* @__PURE__ */ $(t), o = n.propsOptions[0], r = Object.keys(e).map((i) => ie(i));
  for (const i in o) {
    let l = o[i];
    l != null && fc(
      i,
      s[i],
      l,
      process.env.NODE_ENV !== "production" ? /* @__PURE__ */ ke(s) : s,
      !r.includes(i)
    );
  }
}
function fc(e, t, n, s, o) {
  const { type: r, required: i, validator: l, skipCheck: f } = n;
  if (i && o) {
    N('Missing required prop: "' + e + '"');
    return;
  }
  if (!(t == null && !i)) {
    if (r != null && r !== !0 && !f) {
      let p = !1;
      const d = C(r) ? r : [r], a = [];
      for (let g = 0; g < d.length && !p; g++) {
        const { valid: w, expectedType: A } = ac(t, d[g]);
        a.push(A || ""), p = w;
      }
      if (!p) {
        N(dc(e, t, a));
        return;
      }
    }
    l && !l(t, s) && N('Invalid prop: custom validator check failed for prop "' + e + '".');
  }
}
const uc = /* @__PURE__ */ Xe(
  "String,Number,Boolean,Function,Symbol,BigInt"
);
function ac(e, t) {
  let n;
  const s = cc(t);
  if (s === "null")
    n = e === null;
  else if (uc(s)) {
    const o = typeof e;
    n = o === s.toLowerCase(), !n && o === "object" && (n = e instanceof t);
  } else s === "Object" ? n = U(e) : s === "Array" ? n = C(e) : n = e instanceof t;
  return {
    valid: n,
    expectedType: s
  };
}
function dc(e, t, n) {
  if (n.length === 0)
    return `Prop type [] for prop "${e}" won't match anything. Did you mean to use type Array instead?`;
  let s = `Invalid prop: type check failed for prop "${e}". Expected ${n.map($n).join(" | ")}`;
  const o = n[0], r = ys(t), i = mo(t, o), l = mo(t, r);
  return n.length === 1 && vo(o) && pc(o, r) && (s += ` with value ${i}`), s += `, got ${r} `, vo(r) && (s += `with value ${l}.`), s;
}
function mo(e, t) {
  return Se(e) ? e.toString() : t === "String" ? `"${e}"` : t === "Number" ? `${Number(e)}` : `${e}`;
}
function vo(e) {
  return ["string", "number", "boolean"].some((n) => e.toLowerCase() === n);
}
function pc(...e) {
  return e.every((t) => {
    const n = t.toLowerCase();
    return n !== "boolean" && n !== "symbol";
  });
}
const Hs = (e) => e === "_" || e === "_ctx" || e === "$stable", Us = (e) => C(e) ? e.map(we) : [we(e)], hc = (e, t, n) => {
  if (t._n)
    return t;
  const s = Nl((...o) => (process.env.NODE_ENV !== "production" && ee && !(n === null && Ee) && !(n && n.root !== ee.root) && N(
    `Slot "${e}" invoked outside of the render function: this will not track dependencies used in the slot. Invoke the slot function inside the render function instead.`
  ), Us(t(...o))), n);
  return s._c = !1, s;
}, Br = (e, t, n) => {
  const s = e._ctx;
  for (const o in e) {
    if (Hs(o)) continue;
    const r = e[o];
    if (R(r))
      t[o] = hc(o, r, s);
    else if (r != null) {
      process.env.NODE_ENV !== "production" && N(
        `Non-function value encountered for slot "${o}". Prefer function slots for better performance.`
      );
      const i = Us(r);
      t[o] = () => i;
    }
  }
}, Kr = (e, t) => {
  process.env.NODE_ENV !== "production" && !js(e.vnode) && N(
    "Non-function value encountered for default slot. Prefer function slots for better performance."
  );
  const n = Us(t);
  e.slots.default = () => n;
}, hs = (e, t, n) => {
  for (const s in t)
    (n || !Hs(s)) && (e[s] = t[s]);
}, _c = (e, t, n) => {
  const s = e.slots = Lr();
  if (e.vnode.shapeFlag & 32) {
    const o = t._;
    o ? (hs(s, t, n), n && yn(s, "_", o, !0)) : Br(t, s);
  } else t && Kr(e, t);
}, gc = (e, t, n) => {
  const { vnode: s, slots: o } = e;
  let r = !0, i = Y;
  if (s.shapeFlag & 32) {
    const l = t._;
    l ? process.env.NODE_ENV !== "production" && ve ? (hs(o, t, n), Ue(e, "set", "$slots")) : n && l === 1 ? r = !1 : hs(o, t, n) : (r = !t.$stable, Br(t, o)), i = t;
  } else t && (Kr(e, t), i = { default: 1 });
  if (r)
    for (const l in o)
      !Hs(l) && i[l] == null && delete o[l];
};
let Rt, Ge;
function Et(e, t) {
  e.appContext.config.performance && Tn() && Ge.mark(`vue-${t}-${e.uid}`), process.env.NODE_ENV !== "production" && El(e, t, Tn() ? Ge.now() : Date.now());
}
function bt(e, t) {
  if (e.appContext.config.performance && Tn()) {
    const n = `vue-${t}-${e.uid}`, s = n + ":end", o = `<${on(e, e.type)}> ${t}`;
    Ge.mark(s), Ge.measure(o, n, s), Ge.clearMeasures(o), Ge.clearMarks(n), Ge.clearMarks(s);
  }
  process.env.NODE_ENV !== "production" && bl(e, t, Tn() ? Ge.now() : Date.now());
}
function Tn() {
  return Rt !== void 0 || (typeof window < "u" && window.performance ? (Rt = !0, Ge = window.performance) : Rt = !1), Rt;
}
function mc() {
  const e = [];
  if (process.env.NODE_ENV !== "production" && e.length) {
    const t = e.length > 1;
    console.warn(
      `Feature flag${t ? "s" : ""} ${e.join(", ")} ${t ? "are" : "is"} not explicitly defined. You are running the esm-bundler build of Vue, which expects these compile-time feature flags to be globally injected via the bundler config in order to get better tree-shaking in the production bundle.

For more details, see https://link.vuejs.org/feature-flags.`
    );
  }
}
const he = Nc;
function vc(e) {
  return Ec(e);
}
function Ec(e, t) {
  mc();
  const n = Zt();
  n.__VUE__ = !0, process.env.NODE_ENV !== "production" && Ms(n.__VUE_DEVTOOLS_GLOBAL_HOOK__, n);
  const {
    insert: s,
    remove: o,
    patchProp: r,
    createElement: i,
    createText: l,
    createComment: f,
    setText: p,
    setElementText: d,
    parentNode: a,
    nextSibling: g,
    setScopeId: w = ne,
    insertStaticContent: A
  } = e, x = (c, u, h, E = null, m = null, _ = null, O = void 0, y = null, b = process.env.NODE_ENV !== "production" && ve ? !1 : !!u.dynamicChildren) => {
    if (c === u)
      return;
    c && !Pt(c, u) && (E = ln(c), tt(c, m, _, !0), c = null), u.patchFlag === -2 && (b = !1, u.dynamicChildren = null);
    const { type: v, ref: T, shapeFlag: D } = u;
    switch (v) {
      case nn:
        q(c, u, h, E);
        break;
      case Ve:
        G(c, u, h, E);
        break;
      case En:
        c == null ? F(u, h, E, O) : process.env.NODE_ENV !== "production" && P(c, u, h, O);
        break;
      case Oe:
        rn(
          c,
          u,
          h,
          E,
          m,
          _,
          O,
          y,
          b
        );
        break;
      default:
        D & 1 ? se(
          c,
          u,
          h,
          E,
          m,
          _,
          O,
          y,
          b
        ) : D & 6 ? Ks(
          c,
          u,
          h,
          E,
          m,
          _,
          O,
          y,
          b
        ) : D & 64 || D & 128 ? v.process(
          c,
          u,
          h,
          E,
          m,
          _,
          O,
          y,
          b,
          St
        ) : process.env.NODE_ENV !== "production" && N("Invalid VNode type:", v, `(${typeof v})`);
    }
    T != null && m ? Ht(T, c && c.ref, _, u || c, !u) : T == null && c && c.ref != null && Ht(c.ref, null, _, c, !0);
  }, q = (c, u, h, E) => {
    if (c == null)
      s(
        u.el = l(u.children),
        h,
        E
      );
    else {
      const m = u.el = c.el;
      u.children !== c.children && p(m, u.children);
    }
  }, G = (c, u, h, E) => {
    c == null ? s(
      u.el = f(u.children || ""),
      h,
      E
    ) : u.el = c.el;
  }, F = (c, u, h, E) => {
    [c.el, c.anchor] = A(
      c.children,
      u,
      h,
      E,
      c.el,
      c.anchor
    );
  }, P = (c, u, h, E) => {
    if (u.children !== c.children) {
      const m = g(c.anchor);
      V(c), [u.el, u.anchor] = A(
        u.children,
        h,
        m,
        E
      );
    } else
      u.el = c.el, u.anchor = c.anchor;
  }, k = ({ el: c, anchor: u }, h, E) => {
    let m;
    for (; c && c !== u; )
      m = g(c), s(c, h, E), c = m;
    s(u, h, E);
  }, V = ({ el: c, anchor: u }) => {
    let h;
    for (; c && c !== u; )
      h = g(c), o(c), c = h;
    o(u);
  }, se = (c, u, h, E, m, _, O, y, b) => {
    if (u.type === "svg" ? O = "svg" : u.type === "math" && (O = "mathml"), c == null)
      ae(
        u,
        h,
        E,
        m,
        _,
        O,
        y,
        b
      );
    else {
      const v = c.el && c.el._isVueCE ? c.el : null;
      try {
        v && v._beginPatch(), Be(
          c,
          u,
          m,
          _,
          O,
          y,
          b
        );
      } finally {
        v && v._endPatch();
      }
    }
  }, ae = (c, u, h, E, m, _, O, y) => {
    let b, v;
    const { props: T, shapeFlag: D, transition: S, dirs: M } = c;
    if (b = c.el = i(
      c.type,
      _,
      T && T.is,
      T
    ), D & 8 ? d(b, c.children) : D & 16 && de(
      c.children,
      b,
      null,
      E,
      m,
      es(c, _),
      O,
      y
    ), M && it(c, null, E, "created"), le(b, c, c.scopeId, O, E), T) {
      for (const B in T)
        B !== "value" && !jt(B) && r(b, B, null, T[B], _, E);
      "value" in T && r(b, "value", null, T.value, _), (v = T.onVnodeBeforeMount) && je(v, E, c);
    }
    process.env.NODE_ENV !== "production" && (yn(b, "__vnode", c, !0), yn(b, "__vueParentComponent", E, !0)), M && it(c, null, E, "beforeMount");
    const H = bc(m, S);
    if (H && S.beforeEnter(b), s(b, u, h), (v = T && T.onVnodeMounted) || H || M) {
      const B = process.env.NODE_ENV !== "production" && ve;
      he(() => {
        let W;
        process.env.NODE_ENV !== "production" && (W = so(B));
        try {
          v && je(v, E, c), H && S.enter(b), M && it(c, null, E, "mounted");
        } finally {
          process.env.NODE_ENV !== "production" && so(W);
        }
      }, m);
    }
  }, le = (c, u, h, E, m) => {
    if (h && w(c, h), E)
      for (let _ = 0; _ < E.length; _++)
        w(c, E[_]);
    if (m) {
      let _ = m.subTree;
      if (process.env.NODE_ENV !== "production" && _.patchFlag > 0 && _.patchFlag & 2048 && (_ = Ls(_.children) || _), u === _ || Gr(_.type) && (_.ssContent === u || _.ssFallback === u)) {
        const O = m.vnode;
        le(
          c,
          O,
          O.scopeId,
          O.slotScopeIds,
          m.parent
        );
      }
    }
  }, de = (c, u, h, E, m, _, O, y, b = 0) => {
    for (let v = b; v < c.length; v++) {
      const T = c[v] = y ? Je(c[v]) : we(c[v]);
      x(
        null,
        T,
        u,
        h,
        E,
        m,
        _,
        O,
        y
      );
    }
  }, Be = (c, u, h, E, m, _, O) => {
    const y = u.el = c.el;
    process.env.NODE_ENV !== "production" && (y.__vnode = u);
    let { patchFlag: b, dynamicChildren: v, dirs: T } = u;
    b |= c.patchFlag & 16;
    const D = c.props || Y, S = u.props || Y;
    let M;
    if (h && lt(h, !1), (M = S.onVnodeBeforeUpdate) && je(M, h, u, c), T && it(u, c, h, "beforeUpdate"), h && lt(h, !0), // HMR updated, force full diff
    (process.env.NODE_ENV !== "production" && ve || // #6385 the old vnode may be a user-wrapped non-isomorphic block
    // Force full diff when block metadata is unstable.
    v && (!c.dynamicChildren || c.dynamicChildren.length !== v.length)) && (b = 0, O = !1, v = null), (D.innerHTML && S.innerHTML == null || D.textContent && S.textContent == null) && d(y, ""), v ? (Ze(
      c.dynamicChildren,
      v,
      y,
      h,
      E,
      es(u, m),
      _
    ), process.env.NODE_ENV !== "production" && vn(c, u)) : O || Pe(
      c,
      u,
      y,
      null,
      h,
      E,
      es(u, m),
      _,
      !1
    ), b > 0) {
      if (b & 16)
        Ne(y, D, S, h, m);
      else if (b & 2 && D.class !== S.class && r(y, "class", null, S.class, m), b & 4 && r(y, "style", D.style, S.style, m), b & 8) {
        const H = u.dynamicProps;
        for (let B = 0; B < H.length; B++) {
          const W = H[B], Q = D[W], oe = S[W];
          (oe !== Q || W === "value") && r(y, W, Q, oe, m, h);
        }
      }
      b & 1 && c.children !== u.children && d(y, u.children);
    } else !O && v == null && Ne(y, D, S, h, m);
    ((M = S.onVnodeUpdated) || T) && he(() => {
      M && je(M, h, u, c), T && it(u, c, h, "updated");
    }, E);
  }, Ze = (c, u, h, E, m, _, O) => {
    for (let y = 0; y < u.length; y++) {
      const b = c[y], v = u[y], T = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        b.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (b.type === Oe || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !Pt(b, v) || // - In the case of a component, it could contain anything.
        b.shapeFlag & 198) ? a(b.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          h
        )
      );
      x(
        b,
        v,
        T,
        null,
        E,
        m,
        _,
        O,
        !0
      );
    }
  }, Ne = (c, u, h, E, m) => {
    if (u !== h) {
      if (u !== Y)
        for (const _ in u)
          !jt(_) && !(_ in h) && r(
            c,
            _,
            u[_],
            null,
            m,
            E
          );
      for (const _ in h) {
        if (jt(_)) continue;
        const O = h[_], y = u[_];
        O !== y && _ !== "value" && r(c, _, y, O, m, E);
      }
      "value" in h && r(c, "value", u.value, h.value, m);
    }
  }, rn = (c, u, h, E, m, _, O, y, b) => {
    const v = u.el = c ? c.el : l(""), T = u.anchor = c ? c.anchor : l("");
    let { patchFlag: D, dynamicChildren: S, slotScopeIds: M } = u;
    process.env.NODE_ENV !== "production" && // #5523 dev root fragment may inherit directives
    (ve || D & 2048) && (D = 0, b = !1, S = null), M && (y = y ? y.concat(M) : M), c == null ? (s(v, h, E), s(T, h, E), de(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      u.children || [],
      h,
      T,
      m,
      _,
      O,
      y,
      b
    )) : D > 0 && D & 64 && S && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    c.dynamicChildren && c.dynamicChildren.length === S.length ? (Ze(
      c.dynamicChildren,
      S,
      h,
      m,
      _,
      O,
      y
    ), process.env.NODE_ENV !== "production" ? vn(c, u) : (
      // #2080 if the stable fragment has a key, it's a <template v-for> that may
      //  get moved around. Make sure all root level vnodes inherit el.
      // #2134 or if it's a component root, it may also get moved around
      // as the component is being moved.
      (u.key != null || m && u === m.subTree) && vn(
        c,
        u,
        !0
        /* shallow */
      )
    )) : Pe(
      c,
      u,
      h,
      T,
      m,
      _,
      O,
      y,
      b
    );
  }, Ks = (c, u, h, E, m, _, O, y, b) => {
    u.slotScopeIds = y, c == null ? u.shapeFlag & 512 ? m.ctx.activate(
      u,
      h,
      E,
      O,
      b
    ) : et(
      u,
      h,
      E,
      m,
      _,
      O,
      b
    ) : pe(c, u, b);
  }, et = (c, u, h, E, m, _, O) => {
    const y = c.component = Tc(
      c,
      E,
      m
    );
    if (process.env.NODE_ENV !== "production" && y.type.__hmrId && ul(y), process.env.NODE_ENV !== "production" && (hn(c), Et(y, "mount")), js(c) && (y.ctx.renderer = St), process.env.NODE_ENV !== "production" && Et(y, "init"), Rc(y, !1, O), process.env.NODE_ENV !== "production" && bt(y, "init"), process.env.NODE_ENV !== "production" && ve && (c.el = null), y.asyncDep) {
      if (m && m.registerDep(y, L, O), !c.el) {
        const b = y.subTree = ot(Ve);
        G(null, b, u, h), c.placeholder = b.el;
      }
    } else
      L(
        y,
        c,
        u,
        h,
        m,
        _,
        O
      );
    process.env.NODE_ENV !== "production" && (_n(), bt(y, "mount"));
  }, pe = (c, u, h) => {
    const E = u.component = c.component;
    if (nc(c, u, h))
      if (E.asyncDep && !E.asyncResolved) {
        process.env.NODE_ENV !== "production" && hn(u), I(E, u, h), process.env.NODE_ENV !== "production" && _n();
        return;
      } else
        E.next = u, E.update();
    else
      u.el = c.el, E.vnode = u;
  }, L = (c, u, h, E, m, _, O) => {
    const y = () => {
      if (c.isMounted) {
        let { next: D, bu: S, u: M, parent: H, vnode: B } = c;
        {
          const $e = Yr(c);
          if ($e) {
            D && (D.el = B.el, I(c, D, O)), $e.asyncDep.then(() => {
              he(() => {
                c.isUnmounted || v();
              }, m);
            });
            return;
          }
        }
        let W = D, Q;
        process.env.NODE_ENV !== "production" && hn(D || c.vnode), lt(c, !1), D ? (D.el = B.el, I(c, D, O)) : D = B, S && Tt(S), (Q = D.props && D.props.onVnodeBeforeUpdate) && je(Q, H, D, B), lt(c, !0), process.env.NODE_ENV !== "production" && Et(c, "render");
        const oe = po(c);
        process.env.NODE_ENV !== "production" && bt(c, "render");
        const Me = c.subTree;
        c.subTree = oe, process.env.NODE_ENV !== "production" && Et(c, "patch"), x(
          Me,
          oe,
          // parent may have changed if it's in a teleport
          a(Me.el),
          // anchor may have changed if it's in a fragment
          ln(Me),
          c,
          m,
          _
        ), process.env.NODE_ENV !== "production" && bt(c, "patch"), D.el = oe.el, W === null && sc(c, oe.el), M && he(M, m), (Q = D.props && D.props.onVnodeUpdated) && he(
          () => je(Q, H, D, B),
          m
        ), process.env.NODE_ENV !== "production" && Er(c), process.env.NODE_ENV !== "production" && _n();
      } else {
        let D;
        const { el: S, props: M } = u, { bm: H, m: B, parent: W, root: Q, type: oe } = c, Me = Ut(u);
        lt(c, !1), H && Tt(H), !Me && (D = M && M.onVnodeBeforeMount) && je(D, W, u), lt(c, !0);
        {
          Q.ce && Q.ce._hasShadowRoot() && Q.ce._injectChildStyle(
            oe,
            c.parent ? c.parent.type : void 0
          ), process.env.NODE_ENV !== "production" && Et(c, "render");
          const $e = c.subTree = po(c);
          process.env.NODE_ENV !== "production" && bt(c, "render"), process.env.NODE_ENV !== "production" && Et(c, "patch"), x(
            null,
            $e,
            h,
            E,
            c,
            m,
            _
          ), process.env.NODE_ENV !== "production" && bt(c, "patch"), u.el = $e.el;
        }
        if (B && he(B, m), !Me && (D = M && M.onVnodeMounted)) {
          const $e = u;
          he(
            () => je(D, W, $e),
            m
          );
        }
        (u.shapeFlag & 256 || W && Ut(W.vnode) && W.vnode.shapeFlag & 256) && c.a && he(c.a, m), c.isMounted = !0, process.env.NODE_ENV !== "production" && gl(c), u = h = E = null;
      }
    };
    c.scope.on();
    const b = c.effect = new qo(y);
    c.scope.off();
    const v = c.update = b.run.bind(b), T = c.job = b.runIfDirty.bind(b);
    T.i = c, T.id = c.uid, b.scheduler = () => Fn(T), lt(c, !0), process.env.NODE_ENV !== "production" && (b.onTrack = c.rtc ? (D) => Tt(c.rtc, D) : void 0, b.onTrigger = c.rtg ? (D) => Tt(c.rtg, D) : void 0), v();
  }, I = (c, u, h) => {
    u.component = c;
    const E = c.vnode.props;
    c.vnode = u, c.next = null, ic(c, u.props, E, h), gc(c, u.children, h), Te(), no(c), Ae();
  }, Pe = (c, u, h, E, m, _, O, y, b = !1) => {
    const v = c && c.children, T = c ? c.shapeFlag : 0, D = u.children, { patchFlag: S, shapeFlag: M } = u;
    if (S > 0) {
      if (S & 128) {
        xt(
          v,
          D,
          h,
          E,
          m,
          _,
          O,
          y,
          b
        );
        return;
      } else if (S & 256) {
        kn(
          v,
          D,
          h,
          E,
          m,
          _,
          O,
          y,
          b
        );
        return;
      }
    }
    M & 8 ? (T & 16 && Vt(v, m, _), D !== v && d(h, D)) : T & 16 ? M & 16 ? xt(
      v,
      D,
      h,
      E,
      m,
      _,
      O,
      y,
      b
    ) : Vt(v, m, _, !0) : (T & 8 && d(h, ""), M & 16 && de(
      D,
      h,
      E,
      m,
      _,
      O,
      y,
      b
    ));
  }, kn = (c, u, h, E, m, _, O, y, b) => {
    c = c || Nt, u = u || Nt;
    const v = c.length, T = u.length, D = Math.min(v, T);
    let S;
    for (S = 0; S < D; S++) {
      const M = u[S] = b ? Je(u[S]) : we(u[S]);
      x(
        c[S],
        M,
        h,
        null,
        m,
        _,
        O,
        y,
        b
      );
    }
    v > T ? Vt(
      c,
      m,
      _,
      !0,
      !1,
      D
    ) : de(
      u,
      h,
      E,
      m,
      _,
      O,
      y,
      b,
      D
    );
  }, xt = (c, u, h, E, m, _, O, y, b) => {
    let v = 0;
    const T = u.length;
    let D = c.length - 1, S = T - 1;
    for (; v <= D && v <= S; ) {
      const M = c[v], H = u[v] = b ? Je(u[v]) : we(u[v]);
      if (Pt(M, H))
        x(
          M,
          H,
          h,
          null,
          m,
          _,
          O,
          y,
          b
        );
      else
        break;
      v++;
    }
    for (; v <= D && v <= S; ) {
      const M = c[D], H = u[S] = b ? Je(u[S]) : we(u[S]);
      if (Pt(M, H))
        x(
          M,
          H,
          h,
          null,
          m,
          _,
          O,
          y,
          b
        );
      else
        break;
      D--, S--;
    }
    if (v > D) {
      if (v <= S) {
        const M = S + 1, H = M < T ? u[M].el : E;
        for (; v <= S; )
          x(
            null,
            u[v] = b ? Je(u[v]) : we(u[v]),
            h,
            H,
            m,
            _,
            O,
            y,
            b
          ), v++;
      }
    } else if (v > S)
      for (; v <= D; )
        tt(c[v], m, _, !0), v++;
    else {
      const M = v, H = v, B = /* @__PURE__ */ new Map();
      for (v = H; v <= S; v++) {
        const ce = u[v] = b ? Je(u[v]) : we(u[v]);
        ce.key != null && (process.env.NODE_ENV !== "production" && B.has(ce.key) && N(
          "Duplicate keys found during update:",
          JSON.stringify(ce.key),
          "Make sure keys are unique."
        ), B.set(ce.key, v));
      }
      let W, Q = 0;
      const oe = S - H + 1;
      let Me = !1, $e = 0;
      const Ct = new Array(oe);
      for (v = 0; v < oe; v++) Ct[v] = 0;
      for (v = M; v <= D; v++) {
        const ce = c[v];
        if (Q >= oe) {
          tt(ce, m, _, !0);
          continue;
        }
        let Ie;
        if (ce.key != null)
          Ie = B.get(ce.key);
        else
          for (W = H; W <= S; W++)
            if (Ct[W - H] === 0 && Pt(ce, u[W])) {
              Ie = W;
              break;
            }
        Ie === void 0 ? tt(ce, m, _, !0) : (Ct[Ie - H] = v + 1, Ie >= $e ? $e = Ie : Me = !0, x(
          ce,
          u[Ie],
          h,
          null,
          m,
          _,
          O,
          y,
          b
        ), Q++);
      }
      const qs = Me ? yc(Ct) : Nt;
      for (W = qs.length - 1, v = oe - 1; v >= 0; v--) {
        const ce = H + v, Ie = u[ce], Gs = u[ce + 1], Js = ce + 1 < T ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          Gs.el || qr(Gs)
        ) : E;
        Ct[v] === 0 ? x(
          null,
          Ie,
          h,
          Js,
          m,
          _,
          O,
          y,
          b
        ) : Me && (W < 0 || v !== qs[W] ? mt(Ie, h, Js, 2) : W--);
      }
    }
  }, mt = (c, u, h, E, m = null) => {
    const { el: _, type: O, transition: y, children: b, shapeFlag: v } = c;
    if (v & 6) {
      mt(c.component.subTree, u, h, E);
      return;
    }
    if (v & 128) {
      c.suspense.move(u, h, E);
      return;
    }
    if (v & 64) {
      O.move(c, u, h, St);
      return;
    }
    if (O === Oe) {
      s(_, u, h);
      for (let D = 0; D < b.length; D++)
        mt(b[D], u, h, E);
      s(c.anchor, u, h);
      return;
    }
    if (O === En) {
      k(c, u, h);
      return;
    }
    if (E !== 2 && v & 1 && y)
      if (E === 0)
        y.persisted && !_[Qn] ? s(_, u, h) : (y.beforeEnter(_), s(_, u, h), he(() => y.enter(_), m));
      else {
        const { leave: D, delayLeave: S, afterLeave: M } = y, H = () => {
          c.ctx.isUnmounted ? o(_) : s(_, u, h);
        }, B = () => {
          const W = _._isLeaving || !!_[Qn];
          _._isLeaving && _[Qn](
            !0
            /* cancelled */
          ), y.persisted && !W ? H() : D(_, () => {
            H(), M && M();
          });
        };
        S ? S(_, H, B) : B();
      }
    else
      s(_, u, h);
  }, tt = (c, u, h, E = !1, m = !1) => {
    const {
      type: _,
      props: O,
      ref: y,
      children: b,
      dynamicChildren: v,
      shapeFlag: T,
      patchFlag: D,
      dirs: S,
      cacheIndex: M,
      memo: H
    } = c;
    if (D === -2 && (m = !1), y != null && (Te(), Ht(y, null, h, c, !0), Ae()), M != null && (u.renderCache[M] = void 0), T & 256) {
      u.ctx.deactivate(c);
      return;
    }
    const B = T & 1 && S, W = !Ut(c);
    let Q;
    if (W && (Q = O && O.onVnodeBeforeUnmount) && je(Q, u, c), T & 6)
      ui(c.component, h, E);
    else {
      if (T & 128) {
        c.suspense.unmount(h, E);
        return;
      }
      B && it(c, null, u, "beforeUnmount"), T & 64 ? c.type.remove(
        c,
        u,
        h,
        St,
        E
      ) : v && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !v.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (_ !== Oe || D > 0 && D & 64) ? Vt(
        v,
        u,
        h,
        !1,
        !0
      ) : (_ === Oe && D & 384 || !m && T & 16) && Vt(b, u, h), E && Wn(c);
    }
    const oe = H != null && M == null;
    (W && (Q = O && O.onVnodeUnmounted) || B || oe) && he(() => {
      Q && je(Q, u, c), B && it(c, null, u, "unmounted"), oe && (c.el = null);
    }, h);
  }, Wn = (c) => {
    const { type: u, el: h, anchor: E, transition: m } = c;
    if (u === Oe) {
      process.env.NODE_ENV !== "production" && c.patchFlag > 0 && c.patchFlag & 2048 && m && !m.persisted ? c.children.forEach((O) => {
        O.type === Ve ? o(O.el) : Wn(O);
      }) : fi(h, E);
      return;
    }
    if (u === En) {
      V(c);
      return;
    }
    const _ = () => {
      o(h), m && !m.persisted && m.afterLeave && m.afterLeave();
    };
    if (c.shapeFlag & 1 && m && !m.persisted) {
      const { leave: O, delayLeave: y } = m, b = () => O(h, _);
      y ? y(c.el, _, b) : b();
    } else
      _();
  }, fi = (c, u) => {
    let h;
    for (; c !== u; )
      h = g(c), o(c), c = h;
    o(u);
  }, ui = (c, u, h) => {
    process.env.NODE_ENV !== "production" && c.type.__hmrId && al(c);
    const { bum: E, scope: m, job: _, subTree: O, um: y, m: b, a: v } = c;
    Eo(b), Eo(v), E && Tt(E), m.stop(), _ && (_.flags |= 8, tt(O, c, u, h)), y && he(y, u), he(() => {
      c.isUnmounted = !0;
    }, u), process.env.NODE_ENV !== "production" && vl(c);
  }, Vt = (c, u, h, E = !1, m = !1, _ = 0) => {
    for (let O = _; O < c.length; O++)
      tt(c[O], u, h, E, m);
  }, ln = (c) => {
    if (c.shapeFlag & 6)
      return ln(c.component.subTree);
    if (c.shapeFlag & 128)
      return c.suspense.next();
    const u = g(c.anchor || c.el), h = u && u[Vl];
    return h ? g(h) : u;
  };
  let Bn = !1;
  const Ys = (c, u, h) => {
    let E;
    c == null ? u._vnode && (tt(u._vnode, null, null, !0), E = u._vnode.component) : x(
      u._vnode || null,
      c,
      u,
      null,
      null,
      null,
      h
    ), u._vnode = c, Bn || (Bn = !0, no(E), gr(), Bn = !1);
  }, St = {
    p: x,
    um: tt,
    m: mt,
    r: Wn,
    mt: et,
    mc: de,
    pc: Pe,
    pbc: Ze,
    n: ln,
    o: e
  };
  return {
    render: Ys,
    hydrate: void 0,
    createApp: zl(Ys)
  };
}
function es({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function lt({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function bc(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function vn(e, t, n = !1) {
  const s = e.children, o = t.children;
  if (C(s) && C(o))
    for (let r = 0; r < s.length; r++) {
      const i = s[r];
      let l = o[r];
      l.shapeFlag & 1 && !l.dynamicChildren && ((l.patchFlag <= 0 || l.patchFlag === 32) && (l = o[r] = Je(o[r]), l.el = i.el), !n && l.patchFlag !== -2 && vn(i, l)), l.type === nn && (l.patchFlag === -1 && (l = o[r] = Je(l)), l.el = i.el), l.type === Ve && !l.el && (l.el = i.el), process.env.NODE_ENV !== "production" && l.el && (l.el.__vnode = l);
    }
}
function yc(e) {
  const t = e.slice(), n = [0];
  let s, o, r, i, l;
  const f = e.length;
  for (s = 0; s < f; s++) {
    const p = e[s];
    if (p !== 0) {
      if (o = n[n.length - 1], e[o] < p) {
        t[s] = o, n.push(s);
        continue;
      }
      for (r = 0, i = n.length - 1; r < i; )
        l = r + i >> 1, e[n[l]] < p ? r = l + 1 : i = l;
      p < e[n[r]] && (r > 0 && (t[s] = n[r - 1]), n[r] = s);
    }
  }
  for (r = n.length, i = n[r - 1]; r-- > 0; )
    n[r] = i, i = t[i];
  return n;
}
function Yr(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : Yr(t);
}
function Eo(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
function qr(e) {
  if (e.placeholder)
    return e.placeholder;
  const t = e.component;
  return t ? qr(t.subTree) : null;
}
const Gr = (e) => e.__isSuspense;
function Nc(e, t) {
  t && t.pendingBranch ? C(e) ? t.effects.push(...e) : t.effects.push(e) : _r(e);
}
const Oe = /* @__PURE__ */ Symbol.for("v-fgt"), nn = /* @__PURE__ */ Symbol.for("v-txt"), Ve = /* @__PURE__ */ Symbol.for("v-cmt"), En = /* @__PURE__ */ Symbol.for("v-stc"), _t = [];
let be = null;
function dn(e = !1) {
  _t.push(be = e ? null : []);
}
function Jr() {
  _t.pop(), be = _t[_t.length - 1] || null;
}
let Jt = 1;
function bo(e, t = !1) {
  Jt += e, e < 0 && be && t && (be.hasOnce = !0);
}
function Oc(e) {
  return e.dynamicChildren = Jt > 0 ? be || Nt : null, Jr(), Jt > 0 && be && be.push(e), e;
}
function pn(e, t, n, s, o, r) {
  return Oc(
    X(
      e,
      t,
      n,
      s,
      o,
      r,
      !0
    )
  );
}
function Un(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function Pt(e, t) {
  if (process.env.NODE_ENV !== "production" && t.shapeFlag & 6 && e.component) {
    const n = gn.get(t.type);
    if (n && n.has(e.component))
      return e.shapeFlag &= -257, t.shapeFlag &= -513, !1;
  }
  return e.type === t.type && e.key === t.key;
}
const wc = (...e) => Xr(
  ...e
), zr = ({ key: e }) => e ?? null, bn = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? z(e) || /* @__PURE__ */ Z(e) || R(e) ? { i: Ee, r: e, k: t, f: !!n } : e : null);
function X(e, t = null, n = null, s = 0, o = null, r = e === Oe ? 0 : 1, i = !1, l = !1) {
  const f = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && zr(t),
    ref: t && bn(t),
    scopeId: yr,
    slotScopeIds: null,
    children: n,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: r,
    patchFlag: s,
    dynamicProps: o,
    dynamicChildren: null,
    appContext: null,
    ctx: Ee
  };
  return l ? (An(f, n), r & 128 && e.normalize(f)) : n && (f.shapeFlag |= z(n) ? 8 : 16), process.env.NODE_ENV !== "production" && f.key !== f.key && N("VNode created with invalid key (NaN). VNode type:", f.type), Jt > 0 && // avoid a block node from tracking itself
  !i && // has current parent block
  be && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (f.patchFlag > 0 || r & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  f.patchFlag !== 32 && be.push(f), f;
}
const ot = process.env.NODE_ENV !== "production" ? wc : Xr;
function Xr(e, t = null, n = null, s = 0, o = null, r = !1) {
  if ((!e || e === Ll) && (process.env.NODE_ENV !== "production" && !e && N(`Invalid vnode type when creating vnode: ${e}.`), e = Ve), Un(e)) {
    const l = rt(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && An(l, n), Jt > 0 && !r && be && (l.shapeFlag & 6 ? be[be.indexOf(e)] = l : be.push(l)), l.patchFlag = -2, l;
  }
  if (si(e) && (e = e.__vccOpts), t) {
    t = Dc(t);
    let { class: l, style: f } = t;
    l && !z(l) && (t.class = ws(l)), U(f) && (/* @__PURE__ */ Nn(f) && !C(f) && (f = J({}, f)), t.style = Os(f));
  }
  const i = z(e) ? 1 : Gr(e) ? 128 : Sl(e) ? 64 : U(e) ? 4 : R(e) ? 2 : 0;
  return process.env.NODE_ENV !== "production" && i & 4 && /* @__PURE__ */ Nn(e) && (e = /* @__PURE__ */ $(e), N(
    "Vue received a Component that was made a reactive object. This can lead to unnecessary performance overhead and should be avoided by marking the component with `markRaw` or using `shallowRef` instead of `ref`.",
    `
Component that was made reactive: `,
    e
  )), X(
    e,
    t,
    n,
    s,
    o,
    i,
    r,
    !0
  );
}
function Dc(e) {
  return e ? /* @__PURE__ */ Nn(e) || Hr(e) ? J({}, e) : e : null;
}
function rt(e, t, n = !1, s = !1) {
  const { props: o, ref: r, patchFlag: i, children: l, transition: f } = e, p = t ? Vc(o || {}, t) : o, d = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: p,
    key: p && zr(p),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && r ? C(r) ? r.concat(bn(t)) : [r, bn(t)] : bn(t)
    ) : r,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: process.env.NODE_ENV !== "production" && i === -1 && C(l) ? l.map(Qr) : l,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: t && e.type !== Oe ? i === -1 ? 16 : i | 16 : i,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: f,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && rt(e.ssContent),
    ssFallback: e.ssFallback && rt(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return f && s && Is(
    d,
    f.clone(d)
  ), d;
}
function Qr(e) {
  const t = rt(e);
  return C(e.children) && (t.children = e.children.map(Qr)), t;
}
function xc(e = " ", t = 0) {
  return ot(nn, null, e, t);
}
function we(e) {
  return e == null || typeof e == "boolean" ? ot(Ve) : C(e) ? ot(
    Oe,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : Un(e) ? Je(e) : ot(nn, null, String(e));
}
function Je(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : rt(e);
}
function An(e, t) {
  let n = 0;
  const { shapeFlag: s } = e;
  if (t == null)
    t = null;
  else if (C(t))
    n = 16;
  else if (typeof t == "object")
    if (s & 65) {
      const o = t.default;
      o && (o._c && (o._d = !1), An(e, o()), o._c && (o._d = !0));
      return;
    } else {
      n = 32;
      const o = t._;
      !o && !Hr(t) ? t._ctx = Ee : o === 3 && Ee && (Ee.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else if (R(t)) {
    if (s & 65) {
      An(e, { default: t });
      return;
    }
    t = { default: t, _ctx: Ee }, n = 32;
  } else
    t = String(t), s & 64 ? (n = 16, t = [xc(t)]) : n = 8;
  e.children = t, e.shapeFlag |= n;
}
function Vc(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const s = e[n];
    for (const o in s)
      if (o === "class")
        t.class !== s.class && (t.class = ws([t.class, s.class]));
      else if (o === "style")
        t.style = Os([t.style, s.style]);
      else if (Xt(o)) {
        const r = t[o], i = s[o];
        i && r !== i && !(C(r) && r.includes(i)) ? t[o] = r ? [].concat(r, i) : i : i == null && r == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !Bt(o) && (t[o] = i);
      } else o !== "" && (t[o] = s[o]);
  }
  return t;
}
function je(e, t, n, s = null) {
  Re(e, t, 7, [
    n,
    s
  ]);
}
const Sc = Mr();
let Cc = 0;
function Tc(e, t, n) {
  const s = e.type, o = (t ? t.appContext : e.appContext) || Sc, r = {
    uid: Cc++,
    vnode: e,
    type: s,
    parent: t,
    appContext: o,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new Ci(
      !0
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: t ? t.provides : Object.create(o.provides),
    ids: t ? t.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: kr(s, o),
    emitsOptions: $r(s, o),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: Y,
    // inheritAttrs
    inheritAttrs: s.inheritAttrs,
    // state
    ctx: Y,
    data: Y,
    props: Y,
    attrs: Y,
    slots: Y,
    refs: Y,
    setupState: Y,
    setupContext: null,
    // suspense related
    suspense: n,
    suspenseId: n ? n.pendingId : 0,
    asyncDep: null,
    asyncResolved: !1,
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: !1,
    isUnmounted: !1,
    isDeactivated: !1,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  return process.env.NODE_ENV !== "production" ? r.ctx = Hl(r) : r.ctx = { _: r }, r.root = t ? t.root : r, r.emit = Ql.bind(null, r), e.ce && e.ce(r), r;
}
let ee = null;
const Zr = () => ee || Ee;
let Rn, _s;
{
  const e = Zt(), t = (n, s) => {
    let o;
    return (o = e[n]) || (o = e[n] = []), o.push(s), (r) => {
      o.length > 1 ? o.forEach((i) => i(r)) : o[0](r);
    };
  };
  Rn = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => ee = n
  ), _s = t(
    "__VUE_SSR_SETTERS__",
    (n) => zt = n
  );
}
const sn = (e) => {
  const t = ee;
  return Rn(e), e.scope.on(), () => {
    e.scope.off(), Rn(t);
  };
}, yo = () => {
  ee && ee.scope.off(), Rn(null);
}, Ac = /* @__PURE__ */ Xe("slot,component");
function gs(e, { isNativeTag: t }) {
  (Ac(e) || t(e)) && N(
    "Do not use built-in or reserved HTML elements as component id: " + e
  );
}
function ei(e) {
  return e.vnode.shapeFlag & 4;
}
let zt = !1;
function Rc(e, t = !1, n = !1) {
  t && _s(t);
  const { props: s, children: o } = e.vnode, r = ei(e);
  oc(e, s, r, t), _c(e, o, n || t);
  const i = r ? Pc(e, t) : void 0;
  return t && _s(!1), i;
}
function Pc(e, t) {
  const n = e.type;
  if (process.env.NODE_ENV !== "production") {
    if (n.name && gs(n.name, e.appContext.config), n.components) {
      const o = Object.keys(n.components);
      for (let r = 0; r < o.length; r++)
        gs(o[r], e.appContext.config);
    }
    if (n.directives) {
      const o = Object.keys(n.directives);
      for (let r = 0; r < o.length; r++)
        Nr(o[r]);
    }
    n.compilerOptions && Mc() && N(
      '"compilerOptions" is only supported when using a build of Vue that includes the runtime compiler. Since you are using a runtime-only build, the options should be passed via your build tool config instead.'
    );
  }
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, Ar), process.env.NODE_ENV !== "production" && Ul(e);
  const { setup: s } = n;
  if (s) {
    Te();
    const o = e.setupContext = s.length > 1 ? Ic(e) : null, r = sn(e), i = Dt(
      s,
      e,
      0,
      [
        process.env.NODE_ENV !== "production" ? /* @__PURE__ */ ke(e.props) : e.props,
        o
      ]
    ), l = bs(i);
    if (Ae(), r(), (l || e.sp) && !Ut(e) && xr(e), l) {
      if (i.then(yo, yo), t)
        return i.then((f) => {
          No(e, f, t);
        }).catch((f) => {
          en(f, e, 0);
        });
      if (e.asyncDep = i, process.env.NODE_ENV !== "production" && !e.suspense) {
        const f = on(e, n);
        N(
          `Component <${f}>: setup function returned a promise, but no <Suspense> boundary was found in the parent component tree. A component with async setup() must be nested in a <Suspense> in order to be rendered.`
        );
      }
    } else
      No(e, i, t);
  } else
    ti(e, t);
}
function No(e, t, n) {
  R(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : U(t) ? (process.env.NODE_ENV !== "production" && Un(t) && N(
    "setup() should not return VNodes directly - return a render function instead."
  ), process.env.NODE_ENV !== "production" && (e.devtoolsRawSetupState = t), e.setupState = ur(t), process.env.NODE_ENV !== "production" && kl(e)) : process.env.NODE_ENV !== "production" && t !== void 0 && N(
    `setup() should return an object. Received: ${t === null ? "null" : typeof t}`
  ), ti(e, n);
}
const Mc = () => !0;
function ti(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || ne);
  {
    const o = sn(e);
    Te();
    try {
      Bl(e);
    } finally {
      Ae(), o();
    }
  }
  process.env.NODE_ENV !== "production" && !s.render && e.render === ne && !t && (s.template ? N(
    'Component provided template option but runtime compilation is not supported in this build of Vue. Configure your bundler to alias "vue" to "vue/dist/vue.esm-bundler.js".'
  ) : N("Component is missing template or render function: ", s));
}
const Oo = process.env.NODE_ENV !== "production" ? {
  get(e, t) {
    return Cn(), te(e, "get", ""), e[t];
  },
  set() {
    return N("setupContext.attrs is readonly."), !1;
  },
  deleteProperty() {
    return N("setupContext.attrs is readonly."), !1;
  }
} : {
  get(e, t) {
    return te(e, "get", ""), e[t];
  }
};
function $c(e) {
  return new Proxy(e.slots, {
    get(t, n) {
      return te(e, "get", "$slots"), t[n];
    }
  });
}
function Ic(e) {
  const t = (n) => {
    if (process.env.NODE_ENV !== "production" && (e.exposed && N("expose() should be called only once per setup()."), n != null)) {
      let s = typeof n;
      s === "object" && (C(n) ? s = "array" : /* @__PURE__ */ Z(n) && (s = "ref")), s !== "object" && N(
        `expose() should be passed a plain object, received ${s}.`
      );
    }
    e.exposed = n || {};
  };
  if (process.env.NODE_ENV !== "production") {
    let n, s;
    return Object.freeze({
      get attrs() {
        return n || (n = new Proxy(e.attrs, Oo));
      },
      get slots() {
        return s || (s = $c(e));
      },
      get emit() {
        return (o, ...r) => e.emit(o, ...r);
      },
      expose: t
    });
  } else
    return {
      attrs: new Proxy(e.attrs, Oo),
      slots: e.slots,
      emit: e.emit,
      expose: t
    };
}
function ks(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(ur(Ji(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in ht)
        return ht[n](e);
    },
    has(t, n) {
      return n in t || n in ht;
    }
  })) : e.proxy;
}
const jc = /(?:^|[-_])\w/g, Fc = (e) => e.replace(jc, (t) => t.toUpperCase()).replace(/[-_]/g, "");
function ni(e, t = !0) {
  return R(e) ? e.displayName || e.name : e.name || t && e.__name;
}
function on(e, t, n = !1) {
  let s = ni(t);
  if (!s && t.__file) {
    const o = t.__file.match(/([^/\\]+)\.\w+$/);
    o && (s = o[1]);
  }
  if (!s && e) {
    const o = (r) => {
      for (const i in r)
        if (r[i] === t)
          return i;
    };
    s = o(e.components) || e.parent && o(
      e.parent.type.components
    ) || o(e.appContext.components);
  }
  return s ? Fc(s) : n ? "App" : "Anonymous";
}
function si(e) {
  return R(e) && "__vccOpts" in e;
}
const ms = (e, t) => {
  const n = /* @__PURE__ */ el(e, t, zt);
  if (process.env.NODE_ENV !== "production") {
    const s = Zr();
    s && s.appContext.config.warnRecursiveComputed && (n._warnRecursive = !0);
  }
  return n;
};
function Lc() {
  if (process.env.NODE_ENV === "production" || typeof window > "u")
    return;
  const e = { style: "color:#3ba776" }, t = { style: "color:#1677ff" }, n = { style: "color:#f5222d" }, s = { style: "color:#eb2f96" }, o = {
    __vue_custom_formatter: !0,
    header(a) {
      if (!U(a))
        return null;
      if (a.__isVue)
        return ["div", e, "VueInstance"];
      if (/* @__PURE__ */ Z(a)) {
        Te();
        const g = a.value;
        return Ae(), [
          "div",
          {},
          ["span", e, d(a)],
          "<",
          l(g),
          ">"
        ];
      } else {
        if (/* @__PURE__ */ dt(a))
          return [
            "div",
            {},
            ["span", e, /* @__PURE__ */ ge(a) ? "ShallowReactive" : "Reactive"],
            "<",
            l(a),
            `>${/* @__PURE__ */ We(a) ? " (readonly)" : ""}`
          ];
        if (/* @__PURE__ */ We(a))
          return [
            "div",
            {},
            ["span", e, /* @__PURE__ */ ge(a) ? "ShallowReadonly" : "Readonly"],
            "<",
            l(a),
            ">"
          ];
      }
      return null;
    },
    hasBody(a) {
      return a && a.__isVue;
    },
    body(a) {
      if (a && a.__isVue)
        return [
          "div",
          {},
          ...r(a.$)
        ];
    }
  };
  function r(a) {
    const g = [];
    a.type.props && a.props && g.push(i("props", /* @__PURE__ */ $(a.props))), a.setupState !== Y && g.push(i("setup", a.setupState)), a.data !== Y && g.push(i("data", /* @__PURE__ */ $(a.data)));
    const w = f(a, "computed");
    w && g.push(i("computed", w));
    const A = f(a, "inject");
    return A && g.push(i("injected", A)), g.push([
      "div",
      {},
      [
        "span",
        {
          style: s.style + ";opacity:0.66"
        },
        "$ (internal): "
      ],
      ["object", { object: a }]
    ]), g;
  }
  function i(a, g) {
    return g = J({}, g), Object.keys(g).length ? [
      "div",
      { style: "line-height:1.25em;margin-bottom:0.6em" },
      [
        "div",
        {
          style: "color:#476582"
        },
        a
      ],
      [
        "div",
        {
          style: "padding-left:1.25em"
        },
        ...Object.keys(g).map((w) => [
          "div",
          {},
          ["span", s, w + ": "],
          l(g[w], !1)
        ])
      ]
    ] : ["span", {}];
  }
  function l(a, g = !0) {
    return typeof a == "number" ? ["span", t, a] : typeof a == "string" ? ["span", n, JSON.stringify(a)] : typeof a == "boolean" ? ["span", s, a] : U(a) ? ["object", { object: g ? /* @__PURE__ */ $(a) : a }] : ["span", n, String(a)];
  }
  function f(a, g) {
    const w = a.type;
    if (R(w))
      return;
    const A = {};
    for (const x in a.ctx)
      p(w, x, g) && (A[x] = a.ctx[x]);
    return A;
  }
  function p(a, g, w) {
    const A = a[w];
    if (C(A) && A.includes(g) || U(A) && g in A || a.extends && p(a.extends, g, w) || a.mixins && a.mixins.some((x) => p(x, g, w)))
      return !0;
  }
  function d(a) {
    return /* @__PURE__ */ ge(a) ? "ShallowRef" : a.effect ? "ComputedRef" : "Ref";
  }
  window.devtoolsFormatters ? window.devtoolsFormatters.push(o) : window.devtoolsFormatters = [o];
}
const wo = "3.5.40", ye = process.env.NODE_ENV !== "production" ? N : ne;
process.env.NODE_ENV;
process.env.NODE_ENV;
/**
* @vue/runtime-dom v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let vs;
const Do = typeof window < "u" && window.trustedTypes;
if (Do)
  try {
    vs = /* @__PURE__ */ Do.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch (e) {
    process.env.NODE_ENV !== "production" && ye(`Error creating trusted types policy: ${e}`);
  }
const oi = vs ? (e) => vs.createHTML(e) : (e) => e, Hc = "http://www.w3.org/2000/svg", Uc = "http://www.w3.org/1998/Math/MathML", qe = typeof document < "u" ? document : null, xo = qe && /* @__PURE__ */ qe.createElement("template"), kc = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const o = t === "svg" ? qe.createElementNS(Hc, e) : t === "mathml" ? qe.createElementNS(Uc, e) : n ? qe.createElement(e, { is: n }) : qe.createElement(e);
    return e === "select" && s && s.multiple != null && o.setAttribute("multiple", s.multiple), o;
  },
  createText: (e) => qe.createTextNode(e),
  createComment: (e) => qe.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => qe.querySelector(e),
  setScopeId(e, t) {
    e.setAttribute(t, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(e, t, n, s, o, r) {
    const i = n ? n.previousSibling : t.lastChild;
    if (o && (o === r || o.nextSibling))
      for (; t.insertBefore(o.cloneNode(!0), n), !(o === r || !(o = o.nextSibling)); )
        ;
    else {
      xo.innerHTML = oi(
        s === "svg" ? `<svg>${e}</svg>` : s === "mathml" ? `<math>${e}</math>` : e
      );
      const l = xo.content;
      if (s === "svg" || s === "mathml") {
        const f = l.firstChild;
        for (; f.firstChild; )
          l.appendChild(f.firstChild);
        l.removeChild(f);
      }
      t.insertBefore(l, n);
    }
    return [
      // first
      i ? i.nextSibling : t.firstChild,
      // last
      n ? n.previousSibling : t.lastChild
    ];
  }
}, Wc = /* @__PURE__ */ Symbol("_vtc");
function Bc(e, t, n) {
  const s = e[Wc];
  s && (t = (t ? [t, ...s] : [...s]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const Vo = /* @__PURE__ */ Symbol("_vod"), Kc = /* @__PURE__ */ Symbol("_vsh"), Yc = /* @__PURE__ */ Symbol(process.env.NODE_ENV !== "production" ? "CSS_VAR_TEXT" : ""), qc = /(?:^|;)\s*display\s*:/;
function Gc(e, t, n) {
  const s = e.style, o = z(n);
  let r = !1;
  if (n && !o) {
    if (t)
      if (z(t))
        for (const i of t.split(";")) {
          const l = i.slice(0, i.indexOf(":")).trim();
          n[l] == null && It(s, l, "");
        }
      else
        for (const i in t)
          n[i] == null && It(s, i, "");
    for (const i in n) {
      i === "display" && (r = !0);
      const l = n[i];
      l != null ? Xc(
        e,
        i,
        !z(t) && t ? t[i] : void 0,
        l
      ) || It(s, i, l) : It(s, i, "");
    }
  } else if (o) {
    if (t !== n) {
      const i = s[Yc];
      i && (n += ";" + i), s.cssText = n, r = qc.test(n);
    }
  } else t && e.removeAttribute("style");
  Vo in e && (e[Vo] = r ? s.display : "", e[Kc] && (s.display = "none"));
}
const Jc = /[^\\];\s*$/, So = /\s*!important$/;
function It(e, t, n) {
  if (C(n))
    n.forEach((s) => It(e, t, s));
  else if (n == null && (n = ""), process.env.NODE_ENV !== "production" && Jc.test(n) && ye(
    `Unexpected semicolon at the end of '${t}' style value: '${n}'`
  ), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = zc(e, t);
    So.test(n) ? e.setProperty(
      me(s),
      n.replace(So, ""),
      "important"
    ) : e[s] = n;
  }
}
const Co = ["Webkit", "Moz", "ms"], ts = {};
function zc(e, t) {
  const n = ts[t];
  if (n)
    return n;
  let s = ie(t);
  if (s !== "filter" && s in e)
    return ts[t] = s;
  s = $n(s);
  for (let o = 0; o < Co.length; o++) {
    const r = Co[o] + s;
    if (r in e)
      return ts[t] = r;
  }
  return t;
}
function Xc(e, t, n, s) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && z(s) && n === s;
}
const To = "http://www.w3.org/1999/xlink";
function Ao(e, t, n, s, o, r = Vi(t)) {
  s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(To, t.slice(6, t.length)) : e.setAttributeNS(To, t, n) : n == null || r && !Bo(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    r ? "" : Se(n) ? String(n) : n
  );
}
function Ro(e, t, n, s, o) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? oi(n) : n);
    return;
  }
  const r = e.tagName;
  if (t === "value" && r !== "PROGRESS" && // custom elements may use _value internally
  !r.includes("-")) {
    const l = r === "OPTION" ? e.getAttribute("value") || "" : e.value, f = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(n);
    (l !== f || !("_value" in e)) && (e.value = f), n == null && e.removeAttribute(t), e._value = n;
    return;
  }
  let i = !1;
  if (n === "" || n == null) {
    const l = typeof e[t];
    l === "boolean" ? n = Bo(n) : n == null && l === "string" ? (n = "", i = !0) : l === "number" && (n = 0, i = !0);
  }
  try {
    e[t] = n;
  } catch (l) {
    process.env.NODE_ENV !== "production" && !i && ye(
      `Failed setting prop "${t}" on <${r.toLowerCase()}>: value ${n} is invalid.`,
      l
    );
  }
  i && e.removeAttribute(o || t);
}
function Qc(e, t, n, s) {
  e.addEventListener(t, n, s);
}
function Zc(e, t, n, s) {
  e.removeEventListener(t, n, s);
}
const Po = /* @__PURE__ */ Symbol("_vei");
function ef(e, t, n, s, o = null) {
  const r = e[Po] || (e[Po] = {}), i = r[t];
  if (s && i)
    i.value = process.env.NODE_ENV !== "production" ? Mo(s, t) : s;
  else {
    const [l, f] = sf(t);
    if (s) {
      const p = r[t] = lf(
        process.env.NODE_ENV !== "production" ? Mo(s, t) : s,
        o
      );
      Qc(e, l, p, f);
    } else i && (Zc(e, l, i, f), r[t] = void 0);
  }
}
const tf = /(Once|Passive|Capture)$/, nf = /^on:?(?:Once|Passive|Capture)$/;
function sf(e) {
  let t, n;
  for (; (n = e.match(tf)) && !nf.test(e); )
    t || (t = {}), e = e.slice(0, e.length - n[1].length), t[n[1].toLowerCase()] = !0;
  return [e[2] === ":" ? e.slice(3) : me(e.slice(2)), t];
}
let ns = 0;
const of = /* @__PURE__ */ Promise.resolve(), rf = () => ns || (of.then(() => ns = 0), ns = Date.now());
function lf(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    const o = n.value;
    if (C(o)) {
      const r = s.stopImmediatePropagation;
      s.stopImmediatePropagation = () => {
        r.call(s), s._stopped = !0;
      };
      const i = o.slice(), l = [s];
      for (let f = 0; f < i.length && !s._stopped; f++) {
        const p = i[f];
        p && Re(
          p,
          t,
          5,
          l
        );
      }
    } else
      Re(
        o,
        t,
        5,
        [s]
      );
  };
  return n.value = e, n.attached = rf(), n;
}
function Mo(e, t) {
  return R(e) || C(e) ? e : (ye(
    `Wrong type passed as event handler to ${t} - did you forget @ or : in front of your prop?
Expected function or array of functions, received type ${typeof e}.`
  ), ne);
}
const $o = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, cf = (e, t, n, s, o, r) => {
  const i = o === "svg";
  t === "class" ? Bc(e, s, i) : t === "style" ? Gc(e, n, s) : Xt(t) ? Bt(t) || ef(e, t, n, s, r) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : ff(e, t, s, i)) ? (Ro(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Ao(e, t, s, i, r, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (uf(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !z(s))) ? Ro(e, ie(t), s, r, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), Ao(e, t, s, i));
};
function ff(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && $o(t) && R(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const o = e.tagName;
    if (o === "IMG" || o === "VIDEO" || o === "CANVAS" || o === "SOURCE")
      return !1;
  }
  return $o(t) && z(n) ? !1 : t in e;
}
function uf(e, t) {
  const n = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!n)
    return !1;
  const s = ie(t);
  return Array.isArray(n) ? n.some((o) => ie(o) === s) : Object.keys(n).some((o) => ie(o) === s);
}
const Io = {};
// @__NO_SIDE_EFFECTS__
function af(e, t, n) {
  let s = /* @__PURE__ */ Dr(e, t);
  Pn(s) && (s = J({}, s, t));
  class o extends Ws {
    constructor(i) {
      super(s, i, n);
    }
  }
  return o.def = s, o;
}
const df = typeof HTMLElement < "u" ? HTMLElement : class {
};
class Ws extends df {
  constructor(t, n = {}, s = Fo) {
    super(), this._def = t, this._props = n, this._createApp = s, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && s !== Fo ? this._root = this.shadowRoot : (process.env.NODE_ENV !== "production" && this.shadowRoot && ye(
      "Custom element has pre-rendered declarative shadow root but is not defined as hydratable. Use `defineSSRCustomElement`."
    ), t.shadowRoot !== !1 ? (this.attachShadow(
      J({}, t.shadowRootOptions, {
        mode: "open"
      })
    ), this._root = this.shadowRoot) : this._root = this);
  }
  connectedCallback() {
    if (!this.isConnected) return;
    !this.shadowRoot && !this._resolved && this._parseSlots(), this._connected = !0;
    let t = this;
    for (; t = t && // #12479 should check assignedSlot first to get correct parent
    (t.assignedSlot || t.parentNode || t.host); )
      if (t instanceof Ws) {
        this._parent = t;
        break;
      }
    this._instance || (this._resolved ? this._mount(this._def) : t && t._pendingResolve ? this._pendingResolve = t._pendingResolve.then(() => {
      this._pendingResolve = void 0, this._resolveDef();
    }) : this._resolveDef());
  }
  _setParent(t = this._parent) {
    t && (this._instance.parent = t._instance, this._inheritParentContext(t));
  }
  _inheritParentContext(t = this._parent) {
    t && this._app && Object.setPrototypeOf(
      this._app._context.provides,
      t._instance.provides
    );
  }
  disconnectedCallback() {
    this._connected = !1, pr(() => {
      this._connected || (this._ob && (this._ob.disconnect(), this._ob = null), this._app && this._app.unmount(), this._instance && (this._instance.ce = void 0), this._app = this._instance = null, this._teleportTargets && (this._teleportTargets.clear(), this._teleportTargets = void 0));
    });
  }
  _processMutations(t) {
    for (const n of t)
      this._setAttr(n.attributeName);
  }
  /**
   * resolve inner component definition (handle possible async component)
   */
  _resolveDef() {
    if (this._pendingResolve)
      return;
    for (let s = 0; s < this.attributes.length; s++)
      this._setAttr(this.attributes[s].name);
    this._ob = new MutationObserver(this._processMutations.bind(this)), this._ob.observe(this, { attributes: !0 });
    const t = (s, o = !1) => {
      this._resolved = !0, this._pendingResolve = void 0;
      const { props: r, styles: i } = s;
      let l;
      if (r && !C(r))
        for (const f in r) {
          const p = r[f];
          (p === Number || p && p.type === Number) && (f in this._props && (this._props[f] = Xs(this._props[f])), (l || (l = /* @__PURE__ */ Object.create(null)))[ie(f)] = !0);
        }
      this._numberProps = l, this._resolveProps(s), this.shadowRoot ? this._applyStyles(i) : process.env.NODE_ENV !== "production" && i && ye(
        "Custom element style injection is not supported when using shadowRoot: false"
      ), this._mount(s);
    }, n = this._def.__asyncLoader;
    n ? this._pendingResolve = n().then((s) => {
      s.configureApp = this._def.configureApp, t(this._def = s, !0);
    }) : t(this._def);
  }
  _mount(t) {
    process.env.NODE_ENV !== "production" && !t.name && (t.name = "VueElement"), this._app = this._createApp(t), this._inheritParentContext(), t.configureApp && t.configureApp(this._app), this._app._ceVNode = this._createVNode(), this._app.mount(this._root);
    const n = this._instance && this._instance.exposed;
    if (n)
      for (const s in n)
        j(this, s) ? process.env.NODE_ENV !== "production" && ye(`Exposed property "${s}" already exists on custom element.`) : Object.defineProperty(this, s, {
          // unwrap ref to be consistent with public instance behavior
          get: () => fr(n[s])
        });
  }
  _resolveProps(t) {
    const { props: n } = t, s = C(n) ? n : Object.keys(n || {});
    for (const o of Object.keys(this))
      o[0] !== "_" && s.includes(o) && this._setProp(o, this[o]);
    for (const o of s.map(ie))
      Object.defineProperty(this, o, {
        get() {
          return this._getProp(o);
        },
        set(r) {
          this._setProp(o, r, !0, !this._patching);
        }
      });
  }
  _setAttr(t) {
    if (t.startsWith("data-v-")) return;
    const n = this.hasAttribute(t);
    let s = n ? this.getAttribute(t) : Io;
    const o = ie(t);
    n && this._numberProps && this._numberProps[o] && (s = Xs(s)), this._setProp(o, s, !1, !0);
  }
  /**
   * @internal
   */
  _getProp(t) {
    return this._props[t];
  }
  /**
   * @internal
   */
  _setProp(t, n, s = !0, o = !1) {
    if (n !== this._props[t] && (this._dirty = !0, n === Io ? delete this._props[t] : (this._props[t] = n, t === "key" && this._app && (this._app._ceVNode.key = n)), o && this._instance && this._update(), s)) {
      const r = this._ob;
      r && (this._processMutations(r.takeRecords()), r.disconnect()), n === !0 ? this.setAttribute(me(t), "") : typeof n == "string" || typeof n == "number" ? this.setAttribute(me(t), n + "") : n || this.removeAttribute(me(t)), r && r.observe(this, { attributes: !0 });
    }
  }
  _update() {
    const t = this._createVNode();
    this._app && (t.appContext = this._app._context), hf(t, this._root);
  }
  _createVNode() {
    const t = {};
    this.shadowRoot || (t.onVnodeMounted = t.onVnodeUpdated = this._renderSlots.bind(this));
    const n = ot(this._def, J(t, this._props));
    return this._instance || (n.ce = (s) => {
      this._instance = s, s.ce = this, s.isCE = !0, process.env.NODE_ENV !== "production" && (s.ceReload = (r) => {
        this._styles && (this._styles.forEach((i) => this._root.removeChild(i)), this._styles.length = 0), this._styleAnchors.delete(this._def), this._applyStyles(r), this._instance = null, this._update();
      });
      const o = (r, i) => {
        this.dispatchEvent(
          new CustomEvent(
            r,
            Pn(i[0]) ? J({ detail: i }, i[0]) : { detail: i }
          )
        );
      };
      s.emit = (r, ...i) => {
        o(r, i), me(r) !== r && o(me(r), i);
      }, this._setParent();
    }), n;
  }
  _applyStyles(t, n, s) {
    if (!t) return;
    if (n) {
      if (n === this._def || this._styleChildren.has(n))
        return;
      this._styleChildren.add(n);
    }
    const o = this._nonce, r = this.shadowRoot, i = s ? this._getStyleAnchor(s) || this._getStyleAnchor(this._def) : this._getRootStyleInsertionAnchor(r);
    let l = null;
    for (let f = t.length - 1; f >= 0; f--) {
      const p = document.createElement("style");
      if (o && p.setAttribute("nonce", o), p.textContent = t[f], r.insertBefore(p, l || i), l = p, f === 0 && (s || this._styleAnchors.set(this._def, p), n && this._styleAnchors.set(n, p)), process.env.NODE_ENV !== "production")
        if (n) {
          if (n.__hmrId) {
            this._childStyles || (this._childStyles = /* @__PURE__ */ new Map());
            let d = this._childStyles.get(n.__hmrId);
            d || this._childStyles.set(n.__hmrId, d = []), d.push(p);
          }
        } else
          (this._styles || (this._styles = [])).push(p);
    }
  }
  _getStyleAnchor(t) {
    if (!t)
      return null;
    const n = this._styleAnchors.get(t);
    return n && n.parentNode === this.shadowRoot ? n : (n && this._styleAnchors.delete(t), null);
  }
  _getRootStyleInsertionAnchor(t) {
    for (let n = 0; n < t.childNodes.length; n++) {
      const s = t.childNodes[n];
      if (!(s instanceof HTMLStyleElement))
        return s;
    }
    return null;
  }
  /**
   * Only called when shadowRoot is false
   */
  _parseSlots() {
    const t = this._slots = {};
    let n;
    for (; n = this.firstChild; ) {
      const s = n.nodeType === 1 && n.getAttribute("slot") || "default";
      (t[s] || (t[s] = [])).push(n), this.removeChild(n);
    }
  }
  /**
   * Only called when shadowRoot is false
   */
  _renderSlots() {
    const t = this._getSlots(), n = this._instance.type.__scopeId;
    for (let s = 0; s < t.length; s++) {
      const o = t[s], r = o.getAttribute("name") || "default", i = this._slots[r], l = o.parentNode;
      if (i)
        for (const f of i) {
          if (n && f.nodeType === 1) {
            const p = n + "-s", d = document.createTreeWalker(f, 1);
            f.setAttribute(p, "");
            let a;
            for (; a = d.nextNode(); )
              a.setAttribute(p, "");
          }
          l.insertBefore(f, o);
        }
      else
        for (; o.firstChild; ) l.insertBefore(o.firstChild, o);
      l.removeChild(o);
    }
  }
  /**
   * @internal
   */
  _getSlots() {
    const t = [this];
    this._teleportTargets && t.push(...this._teleportTargets);
    const n = /* @__PURE__ */ new Set();
    for (const s of t) {
      const o = s.querySelectorAll("slot");
      for (let r = 0; r < o.length; r++)
        n.add(o[r]);
    }
    return Array.from(n);
  }
  /**
   * @internal
   */
  _injectChildStyle(t, n) {
    this._applyStyles(t.styles, t, n);
  }
  /**
   * @internal
   */
  _beginPatch() {
    this._patching = !0, this._dirty = !1;
  }
  /**
   * @internal
   */
  _endPatch() {
    this._patching = !1, this._dirty && this._instance && this._update();
  }
  /**
   * @internal
   */
  _hasShadowRoot() {
    return this._def.shadowRoot !== !1;
  }
  /**
   * @internal
   */
  _removeChildStyle(t) {
    if (process.env.NODE_ENV !== "production" && (this._styleChildren.delete(t), this._styleAnchors.delete(t), this._childStyles && t.__hmrId)) {
      const n = this._childStyles.get(t.__hmrId);
      n && (n.forEach((s) => this._root.removeChild(s)), n.length = 0);
    }
  }
}
const pf = /* @__PURE__ */ J({ patchProp: cf }, kc);
let jo;
function ri() {
  return jo || (jo = vc(pf));
}
const hf = ((...e) => {
  ri().render(...e);
}), Fo = ((...e) => {
  const t = ri().createApp(...e);
  process.env.NODE_ENV !== "production" && (gf(t), mf(t));
  const { mount: n } = t;
  return t.mount = (s) => {
    const o = vf(s);
    if (!o) return;
    const r = t._component;
    !R(r) && !r.render && !r.template && (r.template = o.innerHTML), o.nodeType === 1 && (o.textContent = "");
    const i = n(o, !1, _f(o));
    return o instanceof Element && (o.removeAttribute("v-cloak"), o.setAttribute("data-v-app", "")), i;
  }, t;
});
function _f(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function gf(e) {
  Object.defineProperty(e.config, "isNativeTag", {
    value: (t) => Oi(t) || wi(t) || Di(t),
    writable: !1
  });
}
function mf(e) {
  {
    const t = e.config.isCustomElement;
    Object.defineProperty(e.config, "isCustomElement", {
      get() {
        return t;
      },
      set() {
        ye(
          "The `isCustomElement` config option is deprecated. Use `compilerOptions.isCustomElement` instead."
        );
      }
    });
    const n = e.config.compilerOptions, s = 'The `compilerOptions` config option is only respected when using a build of Vue.js that includes the runtime compiler (aka "full build"). Since you are using the runtime-only build, `compilerOptions` must be passed to `@vue/compiler-dom` in the build setup instead.\n- For vue-loader: pass it via vue-loader\'s `compilerOptions` loader option.\n- For vue-cli: see https://cli.vuejs.org/guide/webpack.html#modifying-options-of-a-loader\n- For vite: pass it via @vitejs/plugin-vue options. See https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue#example-for-passing-options-to-vuecompiler-sfc';
    Object.defineProperty(e.config, "compilerOptions", {
      get() {
        return ye(s), n;
      },
      set() {
        ye(s);
      }
    });
  }
}
function vf(e) {
  if (z(e)) {
    const t = document.querySelector(e);
    return process.env.NODE_ENV !== "production" && !t && ye(
      `Failed to mount app: mount target selector "${e}" returned null.`
    ), t;
  }
  return process.env.NODE_ENV !== "production" && window.ShadowRoot && e instanceof window.ShadowRoot && e.mode === "closed" && ye(
    'mounting on a ShadowRoot with `{mode: "closed"}` may lead to unpredictable bugs'
  ), e;
}
/**
* vue v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function Ef() {
  Lc();
}
process.env.NODE_ENV !== "production" && Ef();
const bf = 8e3, yf = 2e3, Lo = 1e6, _e = "Unable to complete this request.", Ho = "Request timed out.", kt = "Request cancelled.", ii = `
  state pid version bindAddress port ready healthMessage uptimeSeconds
`, Nf = `query YarrRuntime { yarrRuntime { ${ii} } }`, Of = `mutation ControlYarr($action: YarrControlAction!) {
  controlYarr(action: $action) { ${ii} }
}`;
function Bs(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
function Wt(e) {
  return new DOMException(e, "AbortError");
}
async function wf(e) {
  if (window.csrf_token || e.aborted) {
    if (e.aborted) throw Wt(kt);
    return;
  }
  await new Promise((t, n) => {
    const s = window.setInterval(() => {
      window.csrf_token && i(t);
    }, 20), o = window.setTimeout(() => i(t), yf), r = () => i(() => n(Wt(kt))), i = (l) => {
      window.clearInterval(s), window.clearTimeout(o), e.removeEventListener("abort", r), l();
    };
    e.addEventListener("abort", r, { once: !0 });
  });
}
async function Df(e) {
  const t = e.body;
  if (!t) throw new Error(_e);
  const n = e.headers.get("content-length");
  if (n && /^(?:0|[1-9]\d*)$/.test(n)) {
    const f = Number(n);
    if (Number.isSafeInteger(f) && f > Lo) {
      try {
        await t.cancel();
      } catch {
      }
      throw new Error(_e);
    }
  }
  const s = t.getReader(), o = [];
  let r = 0;
  try {
    for (; ; ) {
      const { done: f, value: p } = await s.read();
      if (f) break;
      if (r += p.byteLength, r > Lo) {
        try {
          await s.cancel();
        } catch {
        }
        throw new Error(_e);
      }
      o.push(p);
    }
  } catch (f) {
    throw f instanceof Error && f.message === _e ? f : new Error(_e);
  } finally {
    s.releaseLock();
  }
  const i = new Uint8Array(r);
  let l = 0;
  for (const f of o)
    i.set(f, l), l += f.byteLength;
  try {
    const f = JSON.parse(new TextDecoder("utf-8", { fatal: !0 }).decode(i));
    if (!Bs(f)) throw new Error(_e);
    return f;
  } catch {
    throw new Error(_e);
  }
}
async function xf(e) {
  if (e)
    try {
      await e.cancel();
    } catch {
    }
}
async function li(e, t, n) {
  const s = new AbortController();
  let o = !1, r = !1;
  const i = window.setTimeout(() => {
    o = !0, s.abort(Wt(Ho));
  }, bf), l = () => s.abort(Wt(kt));
  n != null && n.aborted ? l() : n == null || n.addEventListener("abort", l, { once: !0 });
  try {
    if (await wf(s.signal), s.signal.aborted) throw Wt(kt);
    const f = await fetch("/graphql", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": window.csrf_token ?? ""
      },
      body: JSON.stringify({ query: e, variables: t }),
      signal: s.signal
    });
    if (!f.ok)
      throw r = !0, await xf(f.body), s.abort(), new Error(_e);
    const p = await Df(f);
    if (Array.isArray(p.errors) && p.errors.length > 0) throw new Error(_e);
    if (!Bs(p.data)) throw new Error(_e);
    return p.data;
  } catch (f) {
    throw o ? new Error(Ho) : r ? new Error(_e) : s.signal.aborted ? new Error(kt) : f instanceof Error && f.message === _e ? f : new Error(_e);
  } finally {
    window.clearTimeout(i), n == null || n.removeEventListener("abort", l);
  }
}
function ci(e, t) {
  const n = e[t];
  if (!Bs(n)) throw new Error(_e);
  return n;
}
async function Vf(e) {
  return ci(await li(Nf, void 0, e), "yarrRuntime");
}
async function Sf(e, t) {
  return ci(
    await li(Of, { action: e }, t),
    "controlYarr"
  );
}
const Cf = ["aria-busy"], Tf = {
  key: 0,
  class: "yarr-dashboard__error",
  role: "alert"
}, Af = {
  key: 1,
  role: "status"
}, Rf = {
  class: "yarr-dashboard__signals",
  "aria-label": "Yarr lifecycle signals"
}, Pf = { class: "yarr-dashboard__footer" }, Mf = ["disabled"], $f = /* @__PURE__ */ Dr({
  __name: "YarrDashboard.ce",
  setup(e) {
    const t = /* @__PURE__ */ un(), n = /* @__PURE__ */ un(), s = /* @__PURE__ */ un(""), o = /* @__PURE__ */ un(!1);
    let r = !1, i, l, f, p = 0;
    const d = () => r && document.visibilityState !== "hidden", a = ms(() => {
      var P;
      return ((P = n.value) == null ? void 0 : P.state) === "running" ? "RESTART" : "START";
    }), g = ms(() => a.value === "RESTART" ? "Restart Yarr" : "Start Yarr");
    function w() {
      i !== void 0 && window.clearTimeout(i), i = void 0;
    }
    function A() {
      w(), p += 1, l == null || l.abort();
    }
    function x() {
      w(), d() && (i = window.setTimeout(() => {
        q();
      }, 3e4));
    }
    async function q() {
      if (!d()) return;
      l == null || l.abort(), l = new AbortController();
      const P = ++p;
      o.value = !0, s.value = "";
      try {
        const k = await Vf(l.signal);
        P === p && (n.value = k);
      } catch {
        P === p && !l.signal.aborted && (s.value = "Status unavailable. Open settings for recovery details.");
      } finally {
        P === p && (o.value = !1, x());
      }
    }
    async function G() {
      l == null || l.abort(), l = new AbortController();
      const P = ++p;
      o.value = !0, s.value = "";
      try {
        const k = await Sf(a.value, l.signal);
        P === p && (n.value = k);
      } catch {
        P === p && !l.signal.aborted && (s.value = "Yarr did not complete the action. Open settings and review logs.");
      } finally {
        P === p && (o.value = !1, x());
      }
    }
    function F() {
      d() ? q() : A();
    }
    return Sr(() => {
      document.addEventListener("visibilitychange", F), "IntersectionObserver" in window ? (f = new IntersectionObserver((P) => {
        const k = P.some((V) => V.isIntersecting);
        k !== r && (r = k, d() ? q() : A());
      }), t.value && f.observe(t.value)) : (r = !0, q());
    }), Cr(() => {
      r = !1, A(), f == null || f.disconnect(), document.removeEventListener("visibilitychange", F);
    }), (P, k) => (dn(), pn("section", {
      ref_key: "root",
      ref: t,
      class: "yarr-dashboard",
      "aria-labelledby": "yarr-dashboard-title",
      "aria-busy": o.value
    }, [
      k[4] || (k[4] = X("header", { class: "yarr-dashboard__header" }, [
        X("div", null, [
          X("p", { class: "yarr-dashboard__eyebrow" }, "Yarr"),
          X("h2", { id: "yarr-dashboard-title" }, "Service operations")
        ]),
        X("a", { href: "/Settings/Yarr" }, "Open settings")
      ], -1)),
      s.value ? (dn(), pn("p", Tf, Ye(s.value), 1)) : n.value ? (dn(), pn(Oe, { key: 2 }, [
        X("ol", Rf, [
          X("li", null, [
            k[0] || (k[0] = X("span", null, "Process", -1)),
            X("strong", null, Ye(n.value.state), 1)
          ]),
          X("li", null, [
            k[1] || (k[1] = X("span", null, "Ready", -1)),
            X("strong", null, Ye(n.value.ready ? "Ready" : "Not ready"), 1)
          ]),
          X("li", null, [
            k[2] || (k[2] = X("span", null, "Endpoint", -1)),
            X("strong", null, Ye(n.value.bindAddress) + ":" + Ye(n.value.port), 1)
          ]),
          X("li", null, [
            k[3] || (k[3] = X("span", null, "Version", -1)),
            X("strong", null, Ye(n.value.version ?? "Unavailable"), 1)
          ])
        ]),
        X("div", Pf, [
          X("p", null, Ye(n.value.healthMessage), 1),
          X("button", {
            type: "button",
            disabled: o.value,
            onClick: G
          }, Ye(o.value ? "Working..." : g.value), 9, Mf)
        ])
      ], 64)) : (dn(), pn("p", Af, "Checking Yarr..."))
    ], 8, Cf));
  }
}), If = /* @__PURE__ */ af($f, { shadowRoot: !1 });
customElements.get("yarr-dashboard") || customElements.define("yarr-dashboard", If);
