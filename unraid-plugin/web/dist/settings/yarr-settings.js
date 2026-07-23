/**
* @vue/shared v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function bt(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const te = process.env.NODE_ENV !== "production" ? Object.freeze({}) : {}, Bt = process.env.NODE_ENV !== "production" ? Object.freeze([]) : [], pe = () => {
}, Er = () => !1, Sn = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), mn = (e) => e.startsWith("onUpdate:"), re = Object.assign, Gs = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, ji = Object.prototype.hasOwnProperty, G = (e, t) => ji.call(e, t), L = Array.isArray, Dt = (e) => Cn(e) === "[object Map]", Jt = (e) => Cn(e) === "[object Set]", Do = (e) => Cn(e) === "[object Date]", Y = (e) => typeof e == "function", oe = (e) => typeof e == "string", Fe = (e) => typeof e == "symbol", J = (e) => e !== null && typeof e == "object", zs = (e) => (J(e) || Y(e)) && Y(e.then) && Y(e.catch), Nr = Object.prototype.toString, Cn = (e) => Nr.call(e), Js = (e) => Cn(e).slice(8, -1), as = (e) => Cn(e) === "[object Object]", Qs = (e) => oe(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, dn = /* @__PURE__ */ bt(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), Yi = /* @__PURE__ */ bt(
  "bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text,memo"
), us = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((n) => t[n] || (t[n] = e(n)));
}, Hi = /-\w/g, _e = us(
  (e) => e.replace(Hi, (t) => t.slice(1).toUpperCase())
), Bi = /\B([A-Z])/g, Te = us(
  (e) => e.replace(Bi, "-$1").toLowerCase()
), cs = us((e) => e.charAt(0).toUpperCase() + e.slice(1)), St = us(
  (e) => e ? `on${cs(e)}` : ""
), it = (e, t) => !Object.is(e, t), Yt = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, qn = (e, t, n, s = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, fs = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
}, xo = (e) => {
  const t = oe(e) ? Number(e) : NaN;
  return isNaN(t) ? e : t;
};
let Vo;
const Dn = () => Vo || (Vo = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function Xs(e) {
  if (L(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], o = oe(s) ? Gi(s) : Xs(s);
      if (o)
        for (const r in o)
          t[r] = o[r];
    }
    return t;
  } else if (oe(e) || J(e))
    return e;
}
const Ki = /;(?![^(]*\))/g, Wi = /:([^]+)/, qi = /\/\*[^]*?\*\//g;
function Gi(e) {
  const t = {};
  return e.replace(qi, "").split(Ki).forEach((n) => {
    if (n) {
      const s = n.split(Wi);
      s.length > 1 && (t[s[0].trim()] = s[1].trim());
    }
  }), t;
}
function kt(e) {
  let t = "";
  if (oe(e))
    t = e;
  else if (L(e))
    for (let n = 0; n < e.length; n++) {
      const s = kt(e[n]);
      s && (t += s + " ");
    }
  else if (J(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const zi = "html,body,base,head,link,meta,style,title,address,article,aside,footer,header,hgroup,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,summary,template,blockquote,iframe,tfoot", Ji = "svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,feDistantLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,text,textPath,title,tspan,unknown,use,view", Qi = "annotation,annotation-xml,maction,maligngroup,malignmark,math,menclose,merror,mfenced,mfrac,mfraction,mglyph,mi,mlabeledtr,mlongdiv,mmultiscripts,mn,mo,mover,mpadded,mphantom,mprescripts,mroot,mrow,ms,mscarries,mscarry,msgroup,msline,mspace,msqrt,msrow,mstack,mstyle,msub,msubsup,msup,mtable,mtd,mtext,mtr,munder,munderover,none,semantics", Xi = /* @__PURE__ */ bt(zi), Zi = /* @__PURE__ */ bt(Ji), el = /* @__PURE__ */ bt(Qi), tl = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", nl = /* @__PURE__ */ bt(tl);
function wr(e) {
  return !!e || e === "";
}
function sl(e, t) {
  if (e.length !== t.length) return !1;
  let n = !0;
  for (let s = 0; n && s < e.length; s++)
    n = Qt(e[s], t[s]);
  return n;
}
function Qt(e, t) {
  if (e === t) return !0;
  let n = Do(e), s = Do(t);
  if (n || s)
    return n && s ? e.getTime() === t.getTime() : !1;
  if (n = Fe(e), s = Fe(t), n || s)
    return e === t;
  if (n = L(e), s = L(t), n || s)
    return n && s ? sl(e, t) : !1;
  if (n = J(e), s = J(t), n || s) {
    if (!n || !s)
      return !1;
    const o = Object.keys(e).length, r = Object.keys(t).length;
    if (o !== r)
      return !1;
    for (const i in e) {
      const a = e.hasOwnProperty(i), l = t.hasOwnProperty(i);
      if (a && !l || !a && l || !Qt(e[i], t[i]))
        return !1;
    }
  }
  return String(e) === String(t);
}
function Zs(e, t) {
  return e.findIndex((n) => Qt(n, t));
}
const Or = (e) => !!(e && e.__v_isRef === !0), M = (e) => oe(e) ? e : e == null ? "" : L(e) || J(e) && (e.toString === Nr || !Y(e.toString)) ? Or(e) ? M(e.value) : JSON.stringify(e, Sr, 2) : String(e), Sr = (e, t) => Or(t) ? Sr(e, t.value) : Dt(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, o], r) => (n[Es(s, r) + " =>"] = o, n),
    {}
  )
} : Jt(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => Es(n))
} : Fe(t) ? Es(t) : J(t) && !L(t) && !as(t) ? String(t) : t, Es = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    Fe(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
/**
* @vue/reactivity v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function We(e, ...t) {
  console.warn(`[Vue warn] ${e}`, ...t);
}
let ye;
class ol {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !t && ye && (ye.active ? (this.parent = ye, this.index = (ye.scopes || (ye.scopes = [])).push(
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
      const n = ye;
      try {
        return ye = this, t();
      } finally {
        ye = n;
      }
    } else process.env.NODE_ENV !== "production" && this._warnOnRun && We("cannot run an inactive effect scope.");
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = ye, ye = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (ye === this)
        ye = this.prevScope;
      else {
        let t = ye;
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
function rl() {
  return ye;
}
let ee;
const Ns = /* @__PURE__ */ new WeakSet();
class Cr {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, ye && (ye.active ? ye.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, Ns.has(this) && (Ns.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || xr(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, $o(this), Vr(this);
    const t = ee, n = Ke;
    ee = this, Ke = !0;
    try {
      return this.fn();
    } finally {
      process.env.NODE_ENV !== "production" && ee !== this && We(
        "Active effect was not restored correctly - this is likely a Vue internal bug."
      ), $r(this), ee = t, Ke = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        no(t);
      this.deps = this.depsTail = void 0, $o(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? Ns.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    Ts(this) && this.run();
  }
  get dirty() {
    return Ts(this);
  }
}
let Dr = 0, pn, hn;
function xr(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = hn, hn = e;
    return;
  }
  e.next = pn, pn = e;
}
function eo() {
  Dr++;
}
function to() {
  if (--Dr > 0)
    return;
  if (hn) {
    let t = hn;
    for (hn = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; pn; ) {
    let t = pn;
    for (pn = void 0; t; ) {
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
function Vr(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function $r(e) {
  let t, n = e.depsTail, s = n;
  for (; s; ) {
    const o = s.prevDep;
    s.version === -1 ? (s === n && (n = o), no(s), il(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = o;
  }
  e.deps = t, e.depsTail = n;
}
function Ts(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (Ar(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function Ar(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === yn) || (e.globalVersion = yn, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Ts(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = ee, s = Ke;
  ee = e, Ke = !0;
  try {
    Vr(e);
    const o = e.fn(e._value);
    (t.version === 0 || it(o, e._value)) && (e.flags |= 128, e._value = o, t.version++);
  } catch (o) {
    throw t.version++, o;
  } finally {
    ee = n, Ke = s, $r(e), e.flags &= -3;
  }
}
function no(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: o } = e;
  if (s && (s.nextSub = o, e.prevSub = void 0), o && (o.prevSub = s, e.nextSub = void 0), process.env.NODE_ENV !== "production" && n.subsHead === e && (n.subsHead = o), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let r = n.computed.deps; r; r = r.nextDep)
      no(r, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function il(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let Ke = !0;
const Tr = [];
function qe() {
  Tr.push(Ke), Ke = !1;
}
function Ge() {
  const e = Tr.pop();
  Ke = e === void 0 ? !0 : e;
}
function $o(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = ee;
    ee = void 0;
    try {
      t();
    } finally {
      ee = n;
    }
  }
}
let yn = 0;
class ll {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class so {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0, process.env.NODE_ENV !== "production" && (this.subsHead = void 0);
  }
  track(t) {
    if (!ee || !Ke || ee === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== ee)
      n = this.activeLink = new ll(ee, this), ee.deps ? (n.prevDep = ee.depsTail, ee.depsTail.nextDep = n, ee.depsTail = n) : ee.deps = ee.depsTail = n, Rr(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = ee.depsTail, n.nextDep = void 0, ee.depsTail.nextDep = n, ee.depsTail = n, ee.deps === n && (ee.deps = s);
    }
    return process.env.NODE_ENV !== "production" && ee.onTrack && ee.onTrack(
      re(
        {
          effect: ee
        },
        t
      )
    ), n;
  }
  trigger(t) {
    this.version++, yn++, this.notify(t);
  }
  notify(t) {
    eo();
    try {
      if (process.env.NODE_ENV !== "production")
        for (let n = this.subsHead; n; n = n.nextSub)
          n.sub.onTrigger && !(n.sub.flags & 8) && n.sub.onTrigger(
            re(
              {
                effect: n.sub
              },
              t
            )
          );
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      to();
    }
  }
}
function Rr(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let s = t.deps; s; s = s.nextDep)
        Rr(s);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), process.env.NODE_ENV !== "production" && e.dep.subsHead === void 0 && (e.dep.subsHead = e), e.dep.subs = e;
  }
}
const Rs = /* @__PURE__ */ new WeakMap(), xt = /* @__PURE__ */ Symbol(
  process.env.NODE_ENV !== "production" ? "Object iterate" : ""
), Is = /* @__PURE__ */ Symbol(
  process.env.NODE_ENV !== "production" ? "Map keys iterate" : ""
), _n = /* @__PURE__ */ Symbol(
  process.env.NODE_ENV !== "production" ? "Array iterate" : ""
);
function de(e, t, n) {
  if (Ke && ee) {
    let s = Rs.get(e);
    s || Rs.set(e, s = /* @__PURE__ */ new Map());
    let o = s.get(n);
    o || (s.set(n, o = new so()), o.map = s, o.key = n), process.env.NODE_ENV !== "production" ? o.track({
      target: e,
      type: t,
      key: n
    }) : o.track();
  }
}
function lt(e, t, n, s, o, r) {
  const i = Rs.get(e);
  if (!i) {
    yn++;
    return;
  }
  const a = (l) => {
    l && (process.env.NODE_ENV !== "production" ? l.trigger({
      target: e,
      type: t,
      key: n,
      newValue: s,
      oldValue: o,
      oldTarget: r
    }) : l.trigger());
  };
  if (eo(), t === "clear")
    i.forEach(a);
  else {
    const l = L(e), u = l && Qs(n);
    if (l && n === "length") {
      const f = Number(s);
      i.forEach((d, v) => {
        (v === "length" || v === _n || !Fe(v) && v >= f) && a(d);
      });
    } else
      switch ((n !== void 0 || i.has(void 0)) && a(i.get(n)), u && a(i.get(_n)), t) {
        case "add":
          l ? u && a(i.get("length")) : (a(i.get(xt)), Dt(e) && a(i.get(Is)));
          break;
        case "delete":
          l || (a(i.get(xt)), Dt(e) && a(i.get(Is)));
          break;
        case "set":
          Dt(e) && a(i.get(xt));
          break;
      }
  }
  to();
}
function Ut(e) {
  const t = /* @__PURE__ */ K(e);
  return t === e ? t : (de(t, "iterate", _n), /* @__PURE__ */ De(e) ? t : t.map(Je));
}
function ds(e) {
  return de(e = /* @__PURE__ */ K(e), "iterate", _n), e;
}
function rt(e, t) {
  return /* @__PURE__ */ ze(e) ? Gt(/* @__PURE__ */ Et(e) ? Je(t) : t) : Je(t);
}
const al = {
  __proto__: null,
  [Symbol.iterator]() {
    return ws(this, Symbol.iterator, (e) => rt(this, e));
  },
  concat(...e) {
    return Ut(this).concat(
      ...e.map((t) => L(t) ? Ut(t) : t)
    );
  },
  entries() {
    return ws(this, "entries", (e) => (e[1] = rt(this, e[1]), e));
  },
  every(e, t) {
    return ut(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return ut(
      this,
      "filter",
      e,
      t,
      (n) => n.map((s) => rt(this, s)),
      arguments
    );
  },
  find(e, t) {
    return ut(
      this,
      "find",
      e,
      t,
      (n) => rt(this, n),
      arguments
    );
  },
  findIndex(e, t) {
    return ut(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return ut(
      this,
      "findLast",
      e,
      t,
      (n) => rt(this, n),
      arguments
    );
  },
  findLastIndex(e, t) {
    return ut(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return ut(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return Os(this, "includes", e);
  },
  indexOf(...e) {
    return Os(this, "indexOf", e);
  },
  join(e) {
    return Ut(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return Os(this, "lastIndexOf", e);
  },
  map(e, t) {
    return ut(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return on(this, "pop");
  },
  push(...e) {
    return on(this, "push", e);
  },
  reduce(e, ...t) {
    return Ao(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return Ao(this, "reduceRight", e, t);
  },
  shift() {
    return on(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return ut(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return on(this, "splice", e);
  },
  toReversed() {
    return Ut(this).toReversed();
  },
  toSorted(e) {
    return Ut(this).toSorted(e);
  },
  toSpliced(...e) {
    return Ut(this).toSpliced(...e);
  },
  unshift(...e) {
    return on(this, "unshift", e);
  },
  values() {
    return ws(this, "values", (e) => rt(this, e));
  }
};
function ws(e, t, n) {
  const s = ds(e), o = s[t]();
  return s !== e && !/* @__PURE__ */ De(e) && (o._next = o.next, o.next = () => {
    const r = o._next();
    return r.done || (r.value = n(r.value)), r;
  }), o;
}
const ul = Array.prototype;
function ut(e, t, n, s, o, r) {
  const i = ds(e), a = i !== e && !/* @__PURE__ */ De(e), l = i[t];
  if (l !== ul[t]) {
    const d = l.apply(e, r);
    return a ? Je(d) : d;
  }
  let u = n;
  i !== e && (a ? u = function(d, v) {
    return n.call(this, rt(e, d), v, e);
  } : n.length > 2 && (u = function(d, v) {
    return n.call(this, d, v, e);
  }));
  const f = l.call(i, u, s);
  return a && o ? o(f) : f;
}
function Ao(e, t, n, s) {
  const o = ds(e), r = o !== e && !/* @__PURE__ */ De(e);
  let i = n, a = !1;
  o !== e && (r ? (a = s.length === 0, i = function(u, f, d) {
    return a && (a = !1, u = rt(e, u)), n.call(this, u, rt(e, f), d, e);
  }) : n.length > 3 && (i = function(u, f, d) {
    return n.call(this, u, f, d, e);
  }));
  const l = o[t](i, ...s);
  return a ? rt(e, l) : l;
}
function Os(e, t, n) {
  const s = /* @__PURE__ */ K(e);
  de(s, "iterate", _n);
  const o = s[t](...n);
  return (o === -1 || o === !1) && /* @__PURE__ */ Gn(n[0]) ? (n[0] = /* @__PURE__ */ K(n[0]), s[t](...n)) : o;
}
function on(e, t, n = []) {
  qe(), eo();
  const s = (/* @__PURE__ */ K(e))[t].apply(e, n);
  return to(), Ge(), s;
}
const cl = /* @__PURE__ */ bt("__proto__,__v_isRef,__isVue"), Ir = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Fe)
);
function fl(e) {
  Fe(e) || (e = String(e));
  const t = /* @__PURE__ */ K(this);
  return de(t, "has", e), t.hasOwnProperty(e);
}
class kr {
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
      return s === (o ? r ? jr : Fr : r ? Ur : Lr).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(s) ? t : void 0;
    const i = L(t);
    if (!o) {
      let l;
      if (i && (l = al[n]))
        return l;
      if (n === "hasOwnProperty")
        return fl;
    }
    const a = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ ce(t) ? t : s
    );
    if ((Fe(n) ? Ir.has(n) : cl(n)) || (o || de(t, "get", n), r))
      return a;
    if (/* @__PURE__ */ ce(a)) {
      const l = i && Qs(n) ? a : a.value;
      return o && J(l) ? /* @__PURE__ */ Ps(l) : l;
    }
    return J(a) ? o ? /* @__PURE__ */ Ps(a) : /* @__PURE__ */ oo(a) : a;
  }
}
class Pr extends kr {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, s, o) {
    let r = t[n];
    const i = L(t) && Qs(n);
    if (!this._isShallow) {
      const u = /* @__PURE__ */ ze(r);
      if (!/* @__PURE__ */ De(s) && !/* @__PURE__ */ ze(s) && (r = /* @__PURE__ */ K(r), s = /* @__PURE__ */ K(s)), !i && /* @__PURE__ */ ce(r) && !/* @__PURE__ */ ce(s))
        return u ? (process.env.NODE_ENV !== "production" && We(
          `Set operation on key "${String(n)}" failed: target is readonly.`,
          t[n]
        ), !0) : (r.value = s, !0);
    }
    const a = i ? Number(n) < t.length : G(t, n), l = Reflect.set(
      t,
      n,
      s,
      /* @__PURE__ */ ce(t) ? t : o
    );
    return t === /* @__PURE__ */ K(o) && l && (a ? it(s, r) && lt(t, "set", n, s, r) : lt(t, "add", n, s)), l;
  }
  deleteProperty(t, n) {
    const s = G(t, n), o = t[n], r = Reflect.deleteProperty(t, n);
    return r && s && lt(t, "delete", n, void 0, o), r;
  }
  has(t, n) {
    const s = Reflect.has(t, n);
    return (!Fe(n) || !Ir.has(n)) && de(t, "has", n), s;
  }
  ownKeys(t) {
    return de(
      t,
      "iterate",
      L(t) ? "length" : xt
    ), Reflect.ownKeys(t);
  }
}
class Mr extends kr {
  constructor(t = !1) {
    super(!0, t);
  }
  set(t, n) {
    return process.env.NODE_ENV !== "production" && We(
      `Set operation on key "${String(n)}" failed: target is readonly.`,
      t
    ), !0;
  }
  deleteProperty(t, n) {
    return process.env.NODE_ENV !== "production" && We(
      `Delete operation on key "${String(n)}" failed: target is readonly.`,
      t
    ), !0;
  }
}
const dl = /* @__PURE__ */ new Pr(), pl = /* @__PURE__ */ new Mr(), hl = /* @__PURE__ */ new Pr(!0), vl = /* @__PURE__ */ new Mr(!0), ks = (e) => e, Mn = (e) => Reflect.getPrototypeOf(e);
function gl(e, t, n) {
  return function(...s) {
    const o = this.__v_raw, r = /* @__PURE__ */ K(o), i = Dt(r), a = e === "entries" || e === Symbol.iterator && i, l = e === "keys" && i, u = o[e](...s), f = n ? ks : t ? Gt : Je;
    return !t && de(
      r,
      "iterate",
      l ? Is : xt
    ), re(
      // inheriting all iterator properties
      Object.create(u),
      {
        // iterator protocol
        next() {
          const { value: d, done: v } = u.next();
          return v ? { value: d, done: v } : {
            value: a ? [f(d[0]), f(d[1])] : f(d),
            done: v
          };
        }
      }
    );
  };
}
function Ln(e) {
  return function(...t) {
    if (process.env.NODE_ENV !== "production") {
      const n = t[0] ? `on key "${t[0]}" ` : "";
      We(
        `${cs(e)} operation ${n}failed: target is readonly.`,
        /* @__PURE__ */ K(this)
      );
    }
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function bl(e, t) {
  const n = {
    get(o) {
      const r = this.__v_raw, i = /* @__PURE__ */ K(r), a = /* @__PURE__ */ K(o);
      e || (it(o, a) && de(i, "get", o), de(i, "get", a));
      const { has: l } = Mn(i), u = t ? ks : e ? Gt : Je;
      if (l.call(i, o))
        return u(r.get(o));
      if (l.call(i, a))
        return u(r.get(a));
      r !== i && r.get(o);
    },
    get size() {
      const o = this.__v_raw;
      return !e && de(/* @__PURE__ */ K(o), "iterate", xt), o.size;
    },
    has(o) {
      const r = this.__v_raw, i = /* @__PURE__ */ K(r), a = /* @__PURE__ */ K(o);
      return e || (it(o, a) && de(i, "has", o), de(i, "has", a)), o === a ? r.has(o) : r.has(o) || r.has(a);
    },
    forEach(o, r) {
      const i = this, a = i.__v_raw, l = /* @__PURE__ */ K(a), u = t ? ks : e ? Gt : Je;
      return !e && de(l, "iterate", xt), a.forEach((f, d) => o.call(r, u(f), u(d), i));
    }
  };
  return re(
    n,
    e ? {
      add: Ln("add"),
      set: Ln("set"),
      delete: Ln("delete"),
      clear: Ln("clear")
    } : {
      add(o) {
        const r = /* @__PURE__ */ K(this), i = Mn(r), a = /* @__PURE__ */ K(o), l = !t && !/* @__PURE__ */ De(o) && !/* @__PURE__ */ ze(o) ? a : o;
        return i.has.call(r, l) || it(o, l) && i.has.call(r, o) || it(a, l) && i.has.call(r, a) || (r.add(l), lt(r, "add", l, l)), this;
      },
      set(o, r) {
        !t && !/* @__PURE__ */ De(r) && !/* @__PURE__ */ ze(r) && (r = /* @__PURE__ */ K(r));
        const i = /* @__PURE__ */ K(this), { has: a, get: l } = Mn(i);
        let u = a.call(i, o);
        u ? process.env.NODE_ENV !== "production" && To(i, a, o) : (o = /* @__PURE__ */ K(o), u = a.call(i, o));
        const f = l.call(i, o);
        return i.set(o, r), u ? it(r, f) && lt(i, "set", o, r, f) : lt(i, "add", o, r), this;
      },
      delete(o) {
        const r = /* @__PURE__ */ K(this), { has: i, get: a } = Mn(r);
        let l = i.call(r, o);
        l ? process.env.NODE_ENV !== "production" && To(r, i, o) : (o = /* @__PURE__ */ K(o), l = i.call(r, o));
        const u = a ? a.call(r, o) : void 0, f = r.delete(o);
        return l && lt(r, "delete", o, void 0, u), f;
      },
      clear() {
        const o = /* @__PURE__ */ K(this), r = o.size !== 0, i = process.env.NODE_ENV !== "production" ? Dt(o) ? new Map(o) : new Set(o) : void 0, a = o.clear();
        return r && lt(
          o,
          "clear",
          void 0,
          void 0,
          i
        ), a;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((o) => {
    n[o] = gl(o, e, t);
  }), n;
}
function ps(e, t) {
  const n = bl(e, t);
  return (s, o, r) => o === "__v_isReactive" ? !e : o === "__v_isReadonly" ? e : o === "__v_raw" ? s : Reflect.get(
    G(n, o) && o in s ? n : s,
    o,
    r
  );
}
const ml = {
  get: /* @__PURE__ */ ps(!1, !1)
}, yl = {
  get: /* @__PURE__ */ ps(!1, !0)
}, _l = {
  get: /* @__PURE__ */ ps(!0, !1)
}, El = {
  get: /* @__PURE__ */ ps(!0, !0)
};
function To(e, t, n) {
  const s = /* @__PURE__ */ K(n);
  if (s !== n && t.call(e, s)) {
    const o = Js(e);
    We(
      `Reactive ${o} contains both the raw and reactive versions of the same object${o === "Map" ? " as keys" : ""}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`
    );
  }
}
const Lr = /* @__PURE__ */ new WeakMap(), Ur = /* @__PURE__ */ new WeakMap(), Fr = /* @__PURE__ */ new WeakMap(), jr = /* @__PURE__ */ new WeakMap();
function Nl(e) {
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
function oo(e) {
  return /* @__PURE__ */ ze(e) ? e : hs(
    e,
    !1,
    dl,
    ml,
    Lr
  );
}
// @__NO_SIDE_EFFECTS__
function wl(e) {
  return hs(
    e,
    !1,
    hl,
    yl,
    Ur
  );
}
// @__NO_SIDE_EFFECTS__
function Ps(e) {
  return hs(
    e,
    !0,
    pl,
    _l,
    Fr
  );
}
// @__NO_SIDE_EFFECTS__
function at(e) {
  return hs(
    e,
    !0,
    vl,
    El,
    jr
  );
}
function hs(e, t, n, s, o) {
  if (!J(e))
    return process.env.NODE_ENV !== "production" && We(
      `value cannot be made ${t ? "readonly" : "reactive"}: ${String(
        e
      )}`
    ), e;
  if (e.__v_raw && !(t && e.__v_isReactive) || e.__v_skip || !Object.isExtensible(e))
    return e;
  const r = o.get(e);
  if (r)
    return r;
  const i = Nl(Js(e));
  if (i === 0)
    return e;
  const a = new Proxy(
    e,
    i === 2 ? s : n
  );
  return o.set(e, a), a;
}
// @__NO_SIDE_EFFECTS__
function Et(e) {
  return /* @__PURE__ */ ze(e) ? /* @__PURE__ */ Et(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function ze(e) {
  return !!(e && e.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function De(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function Gn(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function K(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ K(t) : e;
}
function Ol(e) {
  return !G(e, "__v_skip") && Object.isExtensible(e) && qn(e, "__v_skip", !0), e;
}
const Je = (e) => J(e) ? /* @__PURE__ */ oo(e) : e, Gt = (e) => J(e) ? /* @__PURE__ */ Ps(e) : e;
// @__NO_SIDE_EFFECTS__
function ce(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function B(e) {
  return Sl(e, !1);
}
function Sl(e, t) {
  return /* @__PURE__ */ ce(e) ? e : new Cl(e, t);
}
class Cl {
  constructor(t, n) {
    this.dep = new so(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : /* @__PURE__ */ K(t), this._value = n ? t : Je(t), this.__v_isShallow = n;
  }
  get value() {
    return process.env.NODE_ENV !== "production" ? this.dep.track({
      target: this,
      type: "get",
      key: "value"
    }) : this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, s = this.__v_isShallow || /* @__PURE__ */ De(t) || /* @__PURE__ */ ze(t);
    t = s ? t : /* @__PURE__ */ K(t), it(t, n) && (this._rawValue = t, this._value = s ? t : Je(t), process.env.NODE_ENV !== "production" ? this.dep.trigger({
      target: this,
      type: "set",
      key: "value",
      newValue: t,
      oldValue: n
    }) : this.dep.trigger());
  }
}
function Yr(e) {
  return /* @__PURE__ */ ce(e) ? e.value : e;
}
const Dl = {
  get: (e, t, n) => t === "__v_raw" ? e : Yr(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const o = e[t];
    return /* @__PURE__ */ ce(o) && !/* @__PURE__ */ ce(n) ? (o.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function Hr(e) {
  return /* @__PURE__ */ Et(e) ? e : new Proxy(e, Dl);
}
class xl {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new so(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = yn - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    ee !== this)
      return xr(this, !0), !0;
    process.env.NODE_ENV;
  }
  get value() {
    const t = process.env.NODE_ENV !== "production" ? this.dep.track({
      target: this,
      type: "get",
      key: "value"
    }) : this.dep.track();
    return Ar(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter ? this.setter(t) : process.env.NODE_ENV !== "production" && We("Write operation failed: computed value is readonly");
  }
}
// @__NO_SIDE_EFFECTS__
function Vl(e, t, n = !1) {
  let s, o;
  Y(e) ? s = e : (s = e.get, o = e.set);
  const r = new xl(s, o, n);
  return process.env.NODE_ENV, r;
}
const Un = {}, zn = /* @__PURE__ */ new WeakMap();
let Ct;
function $l(e, t = !1, n = Ct) {
  if (n) {
    let s = zn.get(n);
    s || zn.set(n, s = []), s.push(e);
  } else process.env.NODE_ENV !== "production" && !t && We(
    "onWatcherCleanup() was called when there was no active watcher to associate with."
  );
}
function Al(e, t, n = te) {
  const { immediate: s, deep: o, once: r, scheduler: i, augmentJob: a, call: l } = n, u = (A) => {
    (n.onWarn || We)(
      "Invalid watch source: ",
      A,
      "A watch source can only be a getter/effect function, a ref, a reactive object, or an array of these types."
    );
  }, f = (A) => o ? A : /* @__PURE__ */ De(A) || o === !1 || o === 0 ? pt(A, 1) : pt(A);
  let d, v, _, k, I = !1, ne = !1;
  if (/* @__PURE__ */ ce(e) ? (v = () => e.value, I = /* @__PURE__ */ De(e)) : /* @__PURE__ */ Et(e) ? (v = () => f(e), I = !0) : L(e) ? (ne = !0, I = e.some((A) => /* @__PURE__ */ Et(A) || /* @__PURE__ */ De(A)), v = () => e.map((A) => {
    if (/* @__PURE__ */ ce(A))
      return A.value;
    if (/* @__PURE__ */ Et(A))
      return f(A);
    if (Y(A))
      return l ? l(A, 2) : A();
    process.env.NODE_ENV !== "production" && u(A);
  })) : Y(e) ? t ? v = l ? () => l(e, 2) : e : v = () => {
    if (_) {
      qe();
      try {
        _();
      } finally {
        Ge();
      }
    }
    const A = Ct;
    Ct = d;
    try {
      return l ? l(e, 3, [k]) : e(k);
    } finally {
      Ct = A;
    }
  } : (v = pe, process.env.NODE_ENV !== "production" && u(e)), t && o) {
    const A = v, le = o === !0 ? 1 / 0 : o;
    v = () => pt(A(), le);
  }
  const Q = rl(), R = () => {
    d.stop(), Q && Q.active && Gs(Q.effects, d);
  };
  if (r && t) {
    const A = t;
    t = (...le) => {
      const ge = A(...le);
      return R(), ge;
    };
  }
  let V = ne ? new Array(e.length).fill(Un) : Un;
  const D = (A) => {
    if (!(!(d.flags & 1) || !d.dirty && !A))
      if (t) {
        const le = d.run();
        if (A || o || I || (ne ? le.some((ge, ae) => it(ge, V[ae])) : it(le, V))) {
          _ && _();
          const ge = Ct;
          Ct = d;
          try {
            const ae = [
              le,
              // pass undefined as the old value when it's changed for the first time
              V === Un ? void 0 : ne && V[0] === Un ? [] : V,
              k
            ];
            V = le, l ? l(t, 3, ae) : (
              // @ts-expect-error
              t(...ae)
            );
          } finally {
            Ct = ge;
          }
        }
      } else
        d.run();
  };
  return a && a(D), d = new Cr(v), d.scheduler = i ? () => i(D, !1) : D, k = (A) => $l(A, !1, d), _ = d.onStop = () => {
    const A = zn.get(d);
    if (A) {
      if (l)
        l(A, 4);
      else
        for (const le of A) le();
      zn.delete(d);
    }
  }, process.env.NODE_ENV !== "production" && (d.onTrack = n.onTrack, d.onTrigger = n.onTrigger), t ? s ? D(!0) : V = d.run() : i ? i(D.bind(null, !0), !0) : d.run(), R.pause = d.pause.bind(d), R.resume = d.resume.bind(d), R.stop = R, R;
}
function pt(e, t = 1 / 0, n) {
  if (t <= 0 || !J(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t))
    return e;
  if (n.set(e, t), t--, /* @__PURE__ */ ce(e))
    pt(e.value, t, n);
  else if (L(e))
    for (let s = 0; s < e.length; s++)
      pt(e[s], t, n);
  else if (Jt(e) || Dt(e))
    e.forEach((s) => {
      pt(s, t, n);
    });
  else if (as(e)) {
    for (const s in e)
      pt(e[s], t, n);
    for (const s of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, s) && pt(e[s], t, n);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
const Vt = [];
function Fn(e) {
  Vt.push(e);
}
function jn() {
  Vt.pop();
}
let Ss = !1;
function O(e, ...t) {
  if (Ss) return;
  Ss = !0, qe();
  const n = Vt.length ? Vt[Vt.length - 1].component : null, s = n && n.appContext.config.warnHandler, o = Tl();
  if (s)
    Xt(
      s,
      n,
      11,
      [
        // eslint-disable-next-line no-restricted-syntax
        e + t.map((r) => {
          var i, a;
          return (a = (i = r.toString) == null ? void 0 : i.call(r)) != null ? a : JSON.stringify(r);
        }).join(""),
        n && n.proxy,
        o.map(
          ({ vnode: r }) => `at <${In(n, r.type)}>`
        ).join(`
`),
        o
      ]
    );
  else {
    const r = [`[Vue warn]: ${e}`, ...t];
    o.length && r.push(`
`, ...Rl(o)), console.warn(...r);
  }
  Ge(), Ss = !1;
}
function Tl() {
  let e = Vt[Vt.length - 1];
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
function Rl(e) {
  const t = [];
  return e.forEach((n, s) => {
    t.push(...s === 0 ? [] : [`
`], ...Il(n));
  }), t;
}
function Il({ vnode: e, recurseCount: t }) {
  const n = t > 0 ? `... (${t} recursive calls)` : "", s = e.component ? e.component.parent == null : !1, o = ` at <${In(
    e.component,
    e.type,
    s
  )}`, r = ">" + n;
  return e.props ? [o, ...kl(e.props), r] : [o + r];
}
function kl(e) {
  const t = [], n = Object.keys(e);
  return n.slice(0, 3).forEach((s) => {
    t.push(...Br(s, e[s]));
  }), n.length > 3 && t.push(" ..."), t;
}
function Br(e, t, n) {
  return oe(t) ? (t = JSON.stringify(t), n ? t : [`${e}=${t}`]) : typeof t == "number" || typeof t == "boolean" || t == null ? n ? t : [`${e}=${t}`] : /* @__PURE__ */ ce(t) ? (t = Br(e, /* @__PURE__ */ K(t.value), !0), n ? t : [`${e}=Ref<`, t, ">"]) : Y(t) ? [`${e}=fn${t.name ? `<${t.name}>` : ""}`] : (t = /* @__PURE__ */ K(t), n ? t : [`${e}=`, t]);
}
const ro = {
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
function Xt(e, t, n, s) {
  try {
    return s ? e(...s) : e();
  } catch (o) {
    xn(o, t, n);
  }
}
function Qe(e, t, n, s) {
  if (Y(e)) {
    const o = Xt(e, t, n, s);
    return o && zs(o) && o.catch((r) => {
      xn(r, t, n);
    }), o;
  }
  if (L(e)) {
    const o = [];
    for (let r = 0; r < e.length; r++)
      o.push(Qe(e[r], t, n, s));
    return o;
  } else process.env.NODE_ENV !== "production" && O(
    `Invalid value type passed to callWithAsyncErrorHandling(): ${typeof e}`
  );
}
function xn(e, t, n, s = !0) {
  const o = t ? t.vnode : null, { errorHandler: r, throwUnhandledErrorInProduction: i } = t && t.appContext.config || te;
  if (t) {
    let a = t.parent;
    const l = t.proxy, u = process.env.NODE_ENV !== "production" ? ro[n] : `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; a; ) {
      const f = a.ec;
      if (f) {
        for (let d = 0; d < f.length; d++)
          if (f[d](e, l, u) === !1)
            return;
      }
      a = a.parent;
    }
    if (r) {
      qe(), Xt(r, null, 10, [
        e,
        l,
        u
      ]), Ge();
      return;
    }
  }
  Pl(e, n, o, s, i);
}
function Pl(e, t, n, s = !0, o = !1) {
  if (process.env.NODE_ENV !== "production") {
    const r = ro[t];
    if (n && Fn(n), O(`Unhandled error${r ? ` during execution of ${r}` : ""}`), n && jn(), s)
      throw e;
    console.error(e);
  } else {
    if (o)
      throw e;
    console.error(e);
  }
}
const Ce = [];
let ot = -1;
const Kt = [];
let yt = null, Ht = 0;
const Kr = /* @__PURE__ */ Promise.resolve();
let Jn = null;
const Ml = 100;
function Vn(e) {
  const t = Jn || Kr;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function Ll(e) {
  let t = ot + 1, n = Ce.length;
  for (; t < n; ) {
    const s = t + n >>> 1, o = Ce[s], r = En(o);
    r < e || r === e && o.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function vs(e) {
  if (!(e.flags & 1)) {
    const t = En(e), n = Ce[Ce.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= En(n) ? Ce.push(e) : Ce.splice(Ll(t), 0, e), e.flags |= 1, Wr();
  }
}
function Wr() {
  Jn || (Jn = Kr.then(zr));
}
function qr(e) {
  L(e) ? Kt.push(...e) : yt && e.id === -1 ? yt.splice(Ht + 1, 0, e) : e.flags & 1 || (Kt.push(e), e.flags |= 1), Wr();
}
function Ro(e, t, n = ot + 1) {
  for (process.env.NODE_ENV !== "production" && (t = t || /* @__PURE__ */ new Map()); n < Ce.length; n++) {
    const s = Ce[n];
    if (s && s.flags & 2) {
      if (e && s.id !== e.uid || process.env.NODE_ENV !== "production" && io(t, s))
        continue;
      Ce.splice(n, 1), n--, s.flags & 4 && (s.flags &= -2), s(), s.flags & 4 || (s.flags &= -2);
    }
  }
}
function Gr(e) {
  if (Kt.length) {
    const t = [...new Set(Kt)].sort(
      (n, s) => En(n) - En(s)
    );
    if (Kt.length = 0, yt) {
      yt.push(...t);
      return;
    }
    for (yt = t, process.env.NODE_ENV !== "production" && (e = e || /* @__PURE__ */ new Map()), Ht = 0; Ht < yt.length; Ht++) {
      const n = yt[Ht];
      process.env.NODE_ENV !== "production" && io(e, n) || (n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2);
    }
    yt = null, Ht = 0;
  }
}
const En = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function zr(e) {
  process.env.NODE_ENV !== "production" && (e = e || /* @__PURE__ */ new Map());
  const t = process.env.NODE_ENV !== "production" ? (n) => io(e, n) : pe;
  try {
    for (ot = 0; ot < Ce.length; ot++) {
      const n = Ce[ot];
      if (n && !(n.flags & 8)) {
        if (process.env.NODE_ENV !== "production" && t(n))
          continue;
        n.flags & 4 && (n.flags &= -2), Xt(
          n,
          n.i,
          n.i ? 15 : 14
        ), n.flags & 4 || (n.flags &= -2);
      }
    }
  } finally {
    for (; ot < Ce.length; ot++) {
      const n = Ce[ot];
      n && (n.flags &= -2);
    }
    ot = -1, Ce.length = 0, Gr(e), Jn = null, (Ce.length || Kt.length) && zr(e);
  }
}
function io(e, t) {
  const n = e.get(t) || 0;
  if (n > Ml) {
    const s = t.i, o = s && Ti(s.type);
    return xn(
      `Maximum recursive updates exceeded${o ? ` in component <${o}>` : ""}. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. Possible sources include component template, render function, updated hook or watcher source function.`,
      null,
      10
    ), !0;
  }
  return e.set(t, n + 1), !1;
}
let Re = !1;
const Io = (e) => {
  try {
    return Re;
  } finally {
    Re = e;
  }
}, Yn = /* @__PURE__ */ new Map();
process.env.NODE_ENV !== "production" && (Dn().__VUE_HMR_RUNTIME__ = {
  createRecord: Cs(Jr),
  rerender: Cs(jl),
  reload: Cs(Yl)
});
const Rt = /* @__PURE__ */ new Map();
function Ul(e) {
  const t = e.type.__hmrId;
  let n = Rt.get(t);
  n || (Jr(t, e.type), n = Rt.get(t)), n.instances.add(e);
}
function Fl(e) {
  Rt.get(e.type.__hmrId).instances.delete(e);
}
function Jr(e, t) {
  return Rt.has(e) ? !1 : (Rt.set(e, {
    initialDef: Qn(t),
    instances: /* @__PURE__ */ new Set()
  }), !0);
}
function Qn(e) {
  return Ri(e) ? e.__vccOpts : e;
}
function jl(e, t) {
  const n = Rt.get(e);
  n && (n.initialDef.render = t, [...n.instances].forEach((s) => {
    t && (s.render = t, Qn(s.type).render = t), s.renderCache = [], Re = !0, s.job.flags & 8 || s.update(), Re = !1;
  }));
}
function Yl(e, t) {
  const n = Rt.get(e);
  if (!n) return;
  t = Qn(t), ko(n.initialDef, t);
  const s = [...n.instances];
  for (let o = 0; o < s.length; o++) {
    const r = s[o], i = Qn(r.type);
    let a = Yn.get(i);
    a || (i !== n.initialDef && ko(i, t), Yn.set(i, a = /* @__PURE__ */ new Set())), a.add(r), r.appContext.propsCache.delete(r.type), r.appContext.emitsCache.delete(r.type), r.appContext.optionsCache.delete(r.type), r.ceReload ? (a.add(r), r.ceReload(t.styles), a.delete(r)) : r.parent ? vs(() => {
      r.job.flags & 8 || (Re = !0, r.parent.update(), Re = !1, a.delete(r));
    }) : r.appContext.reload ? r.appContext.reload() : typeof window < "u" ? window.location.reload() : console.warn(
      "[HMR] Root or manually mounted instance modified. Full reload required."
    ), r.root.ce && r !== r.root && r.root.ce._removeChildStyle(i);
  }
  qr(() => {
    Yn.clear();
  });
}
function ko(e, t) {
  re(e, t);
  for (const n in e)
    n !== "__file" && !(n in t) && delete e[n];
}
function Cs(e) {
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
let Be, un = [], Ms = !1;
function $n(e, ...t) {
  Be ? Be.emit(e, ...t) : Ms || un.push({ event: e, args: t });
}
function lo(e, t) {
  var n, s;
  Be = e, Be ? (Be.enabled = !0, un.forEach(({ event: o, args: r }) => Be.emit(o, ...r)), un = []) : /* handle late devtools injection - only do this if we are in an actual */ /* browser environment to avoid the timer handle stalling test runner exit */ /* (#4815) */ typeof window < "u" && // some envs mock window but not fully
  window.HTMLElement && // also exclude jsdom
  // eslint-disable-next-line no-restricted-syntax
  !((s = (n = window.navigator) == null ? void 0 : n.userAgent) != null && s.includes("jsdom")) ? ((t.__VUE_DEVTOOLS_HOOK_REPLAY__ = t.__VUE_DEVTOOLS_HOOK_REPLAY__ || []).push((r) => {
    lo(r, t);
  }), setTimeout(() => {
    Be || (t.__VUE_DEVTOOLS_HOOK_REPLAY__ = null, Ms = !0, un = []);
  }, 3e3)) : (Ms = !0, un = []);
}
function Hl(e, t) {
  $n("app:init", e, t, {
    Fragment: se,
    Text: An,
    Comment: $e,
    Static: Kn
  });
}
function Bl(e) {
  $n("app:unmount", e);
}
const Kl = /* @__PURE__ */ ao(
  "component:added"
  /* COMPONENT_ADDED */
), Qr = /* @__PURE__ */ ao(
  "component:updated"
  /* COMPONENT_UPDATED */
), Wl = /* @__PURE__ */ ao(
  "component:removed"
  /* COMPONENT_REMOVED */
), ql = (e) => {
  Be && typeof Be.cleanupBuffer == "function" && // remove the component if it wasn't buffered
  !Be.cleanupBuffer(e) && Wl(e);
};
// @__NO_SIDE_EFFECTS__
function ao(e) {
  return (t) => {
    $n(
      e,
      t.appContext.app,
      t.uid,
      t.parent ? t.parent.uid : void 0,
      t
    );
  };
}
const Gl = /* @__PURE__ */ Xr(
  "perf:start"
  /* PERFORMANCE_START */
), zl = /* @__PURE__ */ Xr(
  "perf:end"
  /* PERFORMANCE_END */
);
function Xr(e) {
  return (t, n, s) => {
    $n(e, t.appContext.app, t.uid, t, n, s);
  };
}
function Jl(e, t, n) {
  $n(
    "component:emit",
    e.appContext.app,
    e,
    t,
    n
  );
}
let he = null, Zr = null;
function Xn(e) {
  const t = he;
  return he = e, Zr = e && e.type.__scopeId || null, t;
}
function It(e, t = he, n) {
  if (!t || e._n)
    return e;
  const s = (...o) => {
    s._d && Qo(-1);
    const r = Xn(t), i = vt.length;
    let a;
    try {
      a = e(...o);
    } finally {
      for (let l = vt.length; l > i; l--) go();
      Xn(r), s._d && Qo(1);
    }
    return process.env.NODE_ENV !== "production" && Qr(t), a;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function ei(e) {
  Yi(e) && O("Do not use built-in directive ids as custom directive id: " + e);
}
function $t(e, t) {
  if (he === null)
    return process.env.NODE_ENV !== "production" && O("withDirectives can only be used inside render functions."), e;
  const n = ys(he), s = e.dirs || (e.dirs = []);
  for (let o = 0; o < t.length; o++) {
    let [r, i, a, l = te] = t[o];
    r && (Y(r) && (r = {
      mounted: r,
      updated: r
    }), r.deep && pt(i), s.push({
      dir: r,
      instance: n,
      value: i,
      oldValue: void 0,
      arg: a,
      modifiers: l
    }));
  }
  return e;
}
function wt(e, t, n, s) {
  const o = e.dirs, r = t && t.dirs;
  for (let i = 0; i < o.length; i++) {
    const a = o[i];
    r && (a.oldValue = r[i].value);
    let l = a.dir[s];
    l && (qe(), Qe(l, n, 8, [
      e.el,
      a,
      e,
      t
    ]), Ge());
  }
}
function Ql(e, t) {
  if (process.env.NODE_ENV !== "production" && (!fe || fe.isMounted) && O("provide() can only be used inside setup()."), fe) {
    let n = fe.provides;
    const s = fe.parent && fe.parent.provides;
    s === n && (n = fe.provides = Object.create(s)), n[e] = t;
  }
}
function Hn(e, t, n = !1) {
  const s = bo();
  if (s || qt) {
    let o = qt ? qt._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (o && e in o)
      return o[e];
    if (arguments.length > 1)
      return n && Y(t) ? t.call(s && s.proxy) : t;
    process.env.NODE_ENV !== "production" && O(`injection "${String(e)}" not found.`);
  } else process.env.NODE_ENV !== "production" && O("inject() can only be used inside setup() or functional components.");
}
const Xl = /* @__PURE__ */ Symbol.for("v-scx"), Zl = () => {
  {
    const e = Hn(Xl);
    return e || process.env.NODE_ENV !== "production" && O(
      "Server rendering context not provided. Make sure to only call useSSRContext() conditionally in the server build."
    ), e;
  }
};
function At(e, t, n) {
  return process.env.NODE_ENV !== "production" && !Y(t) && O(
    "`watch(fn, options?)` signature has been moved to a separate API. Use `watchEffect(fn, options?)` instead. `watch` now only supports `watch(source, cb, options?) signature."
  ), ti(e, t, n);
}
function ti(e, t, n = te) {
  const { immediate: s, deep: o, flush: r, once: i } = n;
  process.env.NODE_ENV !== "production" && !t && (s !== void 0 && O(
    'watch() "immediate" option is only respected when using the watch(source, callback, options?) signature.'
  ), o !== void 0 && O(
    'watch() "deep" option is only respected when using the watch(source, callback, options?) signature.'
  ), i !== void 0 && O(
    'watch() "once" option is only respected when using the watch(source, callback, options?) signature.'
  ));
  const a = re({}, n);
  process.env.NODE_ENV !== "production" && (a.onWarn = O);
  const l = t && s || !t && r !== "post";
  let u;
  if (wn) {
    if (r === "sync") {
      const _ = Zl();
      u = _.__watcherHandles || (_.__watcherHandles = []);
    } else if (!l) {
      const _ = () => {
      };
      return _.stop = pe, _.resume = pe, _.pause = pe, _;
    }
  }
  const f = fe;
  a.call = (_, k, I) => Qe(_, f, k, I);
  let d = !1;
  r === "post" ? a.scheduler = (_) => {
    xe(_, f && f.suspense);
  } : r !== "sync" && (d = !0, a.scheduler = (_, k) => {
    k ? _() : vs(_);
  }), a.augmentJob = (_) => {
    t && (_.flags |= 4), d && (_.flags |= 2, f && (_.id = f.uid, _.i = f));
  };
  const v = Al(e, t, a);
  return wn && (u ? u.push(v) : l && v()), v;
}
function ea(e, t, n) {
  const s = this.proxy, o = oe(e) ? e.includes(".") ? ni(s, e) : () => s[e] : e.bind(s, s);
  let r;
  Y(t) ? r = t : (r = t.handler, n = t);
  const i = Rn(this), a = ti(o, r.bind(s), n);
  return i(), a;
}
function ni(e, t) {
  const n = t.split(".");
  return () => {
    let s = e;
    for (let o = 0; o < n.length && s; o++)
      s = s[n[o]];
    return s;
  };
}
const ta = /* @__PURE__ */ Symbol("_vte"), na = (e) => e.__isTeleport, Ds = /* @__PURE__ */ Symbol("_leaveCb");
function uo(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, uo(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
// @__NO_SIDE_EFFECTS__
function Pe(e, t) {
  return Y(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    re({ name: e.name }, t, { setup: e })
  ) : e;
}
function si() {
  const e = bo();
  return e ? (e.appContext.config.idPrefix || "v") + "-" + e.ids[0] + e.ids[1]++ : (process.env.NODE_ENV !== "production" && O(
    "useId() is called when there is no active component instance to be associated with."
  ), "");
}
function oi(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
const Po = /* @__PURE__ */ new WeakSet();
function Mo(e, t) {
  let n;
  return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
const Zn = /* @__PURE__ */ new WeakMap();
function vn(e, t, n, s, o = !1) {
  if (L(e)) {
    e.forEach(
      (I, ne) => vn(
        I,
        t && (L(t) ? t[ne] : t),
        n,
        s,
        o
      )
    );
    return;
  }
  if (Wt(s) && !o) {
    s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && vn(e, t, n, s.component.subTree);
    return;
  }
  const r = s.shapeFlag & 4 ? ys(s.component) : s.el, i = o ? null : r, { i: a, r: l } = e;
  if (process.env.NODE_ENV !== "production" && !a) {
    O(
      "Missing ref owner context. ref cannot be used on hoisted vnodes. A vnode with ref must be created inside the render function."
    );
    return;
  }
  const u = t && t.r, f = a.refs === te ? a.refs = {} : a.refs, d = a.setupState, v = /* @__PURE__ */ K(d), _ = d === te ? Er : (I) => process.env.NODE_ENV !== "production" && (G(v, I) && !/* @__PURE__ */ ce(v[I]) && O(
    `Template ref "${I}" used on a non-ref value. It will not work in the production build.`
  ), Po.has(v[I])) || Mo(f, I) ? !1 : G(v, I), k = (I, ne) => !(process.env.NODE_ENV !== "production" && Po.has(I) || ne && Mo(f, ne));
  if (u != null && u !== l) {
    if (Lo(t), oe(u))
      f[u] = null, _(u) && (d[u] = null);
    else if (/* @__PURE__ */ ce(u)) {
      const I = t;
      k(u, I.k) && (u.value = null), I.k && (f[I.k] = null);
    }
  }
  if (Y(l))
    Xt(l, a, 12, [i, f]);
  else {
    const I = oe(l), ne = /* @__PURE__ */ ce(l);
    if (I || ne) {
      const Q = () => {
        if (e.f) {
          const R = I ? _(l) ? d[l] : f[l] : k(l) || !e.k ? l.value : f[e.k];
          if (o)
            L(R) && Gs(R, r);
          else if (L(R))
            R.includes(r) || R.push(r);
          else if (I)
            f[l] = [r], _(l) && (d[l] = f[l]);
          else {
            const V = [r];
            k(l, e.k) && (l.value = V), e.k && (f[e.k] = V);
          }
        } else I ? (f[l] = i, _(l) && (d[l] = i)) : ne ? (k(l, e.k) && (l.value = i), e.k && (f[e.k] = i)) : process.env.NODE_ENV !== "production" && O("Invalid template ref type:", l, `(${typeof l})`);
      };
      if (i) {
        const R = () => {
          Q(), Zn.delete(e);
        };
        R.id = -1, Zn.set(e, R), xe(R, n);
      } else
        Lo(e), Q();
    } else process.env.NODE_ENV !== "production" && O("Invalid template ref type:", l, `(${typeof l})`);
  }
}
function Lo(e) {
  const t = Zn.get(e);
  t && (t.flags |= 8, Zn.delete(e));
}
Dn().requestIdleCallback;
Dn().cancelIdleCallback;
const Wt = (e) => !!e.type.__asyncLoader, co = (e) => e.type.__isKeepAlive;
function sa(e, t) {
  ri(e, "a", t);
}
function oa(e, t) {
  ri(e, "da", t);
}
function ri(e, t, n = fe) {
  const s = e.__wdc || (e.__wdc = () => {
    let o = n;
    for (; o; ) {
      if (o.isDeactivated)
        return;
      o = o.parent;
    }
    return e();
  });
  if (gs(t, s, n), n) {
    let o = n.parent;
    for (; o && o.parent; )
      co(o.parent.vnode) && ra(s, t, n, o), o = o.parent;
  }
}
function ra(e, t, n, s) {
  const o = gs(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  ii(() => {
    Gs(s[t], o);
  }, n);
}
function gs(e, t, n = fe, s = !1) {
  if (n) {
    const o = n[e] || (n[e] = []), r = t.__weh || (t.__weh = (...i) => {
      qe();
      const a = Rn(n), l = Qe(t, n, e, i);
      return a(), Ge(), l;
    });
    return s ? o.unshift(r) : o.push(r), r;
  } else if (process.env.NODE_ENV !== "production") {
    const o = St(ro[e].replace(/ hook$/, ""));
    O(
      `${o} is called when there is no active component instance to be associated with. Lifecycle injection APIs can only be used during execution of setup(). If you are using async setup(), make sure to register lifecycle hooks before the first await statement.`
    );
  }
}
const mt = (e) => (t, n = fe) => {
  (!wn || e === "sp") && gs(e, (...s) => t(...s), n);
}, ia = mt("bm"), bs = mt("m"), la = mt(
  "bu"
), aa = mt("u"), Pt = mt(
  "bum"
), ii = mt("um"), ua = mt(
  "sp"
), ca = mt("rtg"), fa = mt("rtc");
function da(e, t = fe) {
  gs("ec", e, t);
}
const pa = /* @__PURE__ */ Symbol.for("v-ndc");
function ht(e, t, n, s) {
  let o;
  const r = n, i = L(e);
  if (i || oe(e)) {
    const a = i && /* @__PURE__ */ Et(e);
    let l = !1, u = !1;
    a && (l = !/* @__PURE__ */ De(e), u = /* @__PURE__ */ ze(e), e = ds(e)), o = new Array(e.length);
    for (let f = 0, d = e.length; f < d; f++)
      o[f] = t(
        l ? u ? Gt(Je(e[f])) : Je(e[f]) : e[f],
        f,
        void 0,
        r
      );
  } else if (typeof e == "number")
    if (process.env.NODE_ENV !== "production" && (!Number.isInteger(e) || e < 0))
      O(
        `The v-for range expects a positive integer value but got ${e}.`
      ), o = [];
    else {
      o = new Array(e);
      for (let a = 0; a < e; a++)
        o[a] = t(a + 1, a, void 0, r);
    }
  else if (J(e))
    if (e[Symbol.iterator])
      o = Array.from(
        e,
        (a, l) => t(a, l, void 0, r)
      );
    else {
      const a = Object.keys(e);
      o = new Array(a.length);
      for (let l = 0, u = a.length; l < u; l++) {
        const f = a[l];
        o[l] = t(e[f], f, l, r);
      }
    }
  else
    o = [];
  return o;
}
function Uo(e, t, n = {}, s, o, r) {
  if (he.ce || he.parent && Wt(he.parent) && he.parent.ce) {
    const u = n, f = Object.keys(u).length > 0;
    return t !== "default" && (u.name = t), C(), Ae(
      se,
      null,
      [ve("slot", u, s)],
      f ? -2 : 64
    );
  }
  let i = e[t];
  process.env.NODE_ENV !== "production" && i && i.length > 1 && (O(
    "SSR-optimized slot function detected in a non-SSR-optimized render function. You need to mark this component with $dynamic-slots in the parent template."
  ), i = () => []), i && i._c && (i._d = !1);
  const a = vt.length;
  C();
  let l;
  try {
    const u = i && li(i(n)), f = n.key || r || // slot content array of a dynamic conditional slot may have a branch
    // key attached in the `createSlots` helper, respect that
    u && u.key;
    l = Ae(
      se,
      {
        key: (f && !Fe(f) ? f : `_${t}`) + // #7256 force differentiate fallback content from actual content
        (!u && s ? "_fb" : "")
      },
      u || (s ? s() : []),
      u && e._ === 1 ? 64 : -2
    );
  } catch (u) {
    for (let f = vt.length; f > a; f--) go();
    throw u;
  } finally {
    i && i._c && (i._d = !0);
  }
  return l.scopeId && (l.slotScopeIds = [l.scopeId + "-s"]), l;
}
function li(e) {
  return e.some((t) => Tn(t) ? !(t.type === $e || t.type === se && !li(t.children)) : !0) ? e : null;
}
const Ls = (e) => e ? $i(e) ? ys(e) : Ls(e.parent) : null, Tt = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ re(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => process.env.NODE_ENV !== "production" ? /* @__PURE__ */ at(e.props) : e.props,
    $attrs: (e) => process.env.NODE_ENV !== "production" ? /* @__PURE__ */ at(e.attrs) : e.attrs,
    $slots: (e) => process.env.NODE_ENV !== "production" ? /* @__PURE__ */ at(e.slots) : e.slots,
    $refs: (e) => process.env.NODE_ENV !== "production" ? /* @__PURE__ */ at(e.refs) : e.refs,
    $parent: (e) => Ls(e.parent),
    $root: (e) => Ls(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => ci(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      vs(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = Vn.bind(e.proxy)),
    $watch: (e) => ea.bind(e)
  })
), fo = (e) => e === "_" || e === "$", xs = (e, t) => e !== te && !e.__isScriptSetup && G(e, t), ai = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: o, props: r, accessCache: i, type: a, appContext: l } = e;
    if (process.env.NODE_ENV !== "production" && t === "__isVue")
      return !0;
    if (t[0] !== "$") {
      const v = i[t];
      if (v !== void 0)
        switch (v) {
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
        if (xs(s, t))
          return i[t] = 1, s[t];
        if (o !== te && G(o, t))
          return i[t] = 2, o[t];
        if (G(r, t))
          return i[t] = 3, r[t];
        if (n !== te && G(n, t))
          return i[t] = 4, n[t];
        Us && (i[t] = 0);
      }
    }
    const u = Tt[t];
    let f, d;
    if (u)
      return t === "$attrs" ? (de(e.attrs, "get", ""), process.env.NODE_ENV !== "production" && ts()) : process.env.NODE_ENV !== "production" && t === "$slots" && de(e, "get", t), u(e);
    if (
      // css module (injected by vue-loader)
      (f = a.__cssModules) && (f = f[t])
    )
      return f;
    if (n !== te && G(n, t))
      return i[t] = 4, n[t];
    if (
      // global properties
      d = l.config.globalProperties, G(d, t)
    )
      return d[t];
    process.env.NODE_ENV !== "production" && he && (!oe(t) || // #1091 avoid internal isRef/isVNode checks on component instance leading
    // to infinite warning loop
    t.indexOf("__v") !== 0) && (o !== te && fo(t[0]) && G(o, t) ? O(
      `Property ${JSON.stringify(
        t
      )} must be accessed via $data because it starts with a reserved character ("$" or "_") and is not proxied on the render context.`
    ) : e === he && O(
      `Property ${JSON.stringify(t)} was accessed during render but is not defined on instance.`
    ));
  },
  set({ _: e }, t, n) {
    const { data: s, setupState: o, ctx: r } = e;
    return xs(o, t) ? (o[t] = n, !0) : process.env.NODE_ENV !== "production" && o.__isScriptSetup && G(o, t) ? (O(`Cannot mutate <script setup> binding "${t}" from Options API.`), !1) : s !== te && G(s, t) ? (s[t] = n, !0) : G(e.props, t) ? (process.env.NODE_ENV !== "production" && O(`Attempting to mutate prop "${t}". Props are readonly.`), !1) : t[0] === "$" && t.slice(1) in e ? (process.env.NODE_ENV !== "production" && O(
      `Attempting to mutate public property "${t}". Properties starting with $ are reserved and readonly.`
    ), !1) : (process.env.NODE_ENV !== "production" && t in e.appContext.config.globalProperties ? Object.defineProperty(r, t, {
      enumerable: !0,
      configurable: !0,
      value: n
    }) : r[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: o, props: r, type: i }
  }, a) {
    let l;
    return !!(n[a] || e !== te && a[0] !== "$" && G(e, a) || xs(t, a) || G(r, a) || G(s, a) || G(Tt, a) || G(o.config.globalProperties, a) || (l = i.__cssModules) && l[a]);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : G(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
process.env.NODE_ENV !== "production" && (ai.ownKeys = (e) => (O(
  "Avoid app logic that relies on enumerating keys on a component instance. The keys will be empty in production mode to avoid performance overhead."
), Reflect.ownKeys(e)));
function ha(e) {
  const t = {};
  return Object.defineProperty(t, "_", {
    configurable: !0,
    enumerable: !1,
    get: () => e
  }), Object.keys(Tt).forEach((n) => {
    Object.defineProperty(t, n, {
      configurable: !0,
      enumerable: !1,
      get: () => Tt[n](e),
      // intercepted by the proxy so no need for implementation,
      // but needed to prevent set errors
      set: pe
    });
  }), t;
}
function va(e) {
  const {
    ctx: t,
    propsOptions: [n]
  } = e;
  n && Object.keys(n).forEach((s) => {
    Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => e.props[s],
      set: pe
    });
  });
}
function ga(e) {
  const { ctx: t, setupState: n } = e;
  Object.keys(/* @__PURE__ */ K(n)).forEach((s) => {
    if (!n.__isScriptSetup) {
      if (fo(s[0])) {
        O(
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
        set: pe
      });
    }
  });
}
function Fo(e) {
  return L(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
function ba() {
  const e = /* @__PURE__ */ Object.create(null);
  return (t, n) => {
    e[n] ? O(`${t} property "${n}" is already defined in ${e[n]}.`) : e[n] = t;
  };
}
let Us = !0;
function ma(e) {
  const t = ci(e), n = e.proxy, s = e.ctx;
  Us = !1, t.beforeCreate && jo(t.beforeCreate, e, "bc");
  const {
    // state
    data: o,
    computed: r,
    methods: i,
    watch: a,
    provide: l,
    inject: u,
    // lifecycle
    created: f,
    beforeMount: d,
    mounted: v,
    beforeUpdate: _,
    updated: k,
    activated: I,
    deactivated: ne,
    beforeDestroy: Q,
    beforeUnmount: R,
    destroyed: V,
    unmounted: D,
    render: A,
    renderTracked: le,
    renderTriggered: ge,
    errorCaptured: ae,
    serverPrefetch: be,
    // public API
    expose: Me,
    inheritAttrs: Xe,
    // assets
    components: Ne,
    directives: Mt,
    filters: Zt
  } = t, Ze = process.env.NODE_ENV !== "production" ? ba() : null;
  if (process.env.NODE_ENV !== "production") {
    const [q] = e.propsOptions;
    if (q)
      for (const W in q)
        Ze("Props", W);
  }
  if (u && ya(u, s, Ze), i)
    for (const q in i) {
      const W = i[q];
      Y(W) ? (process.env.NODE_ENV !== "production" ? Object.defineProperty(s, q, {
        value: W.bind(n),
        configurable: !0,
        enumerable: !0,
        writable: !0
      }) : s[q] = W.bind(n), process.env.NODE_ENV !== "production" && Ze("Methods", q)) : process.env.NODE_ENV !== "production" && O(
        `Method "${q}" has type "${typeof W}" in the component definition. Did you reference the function correctly?`
      );
    }
  if (o) {
    process.env.NODE_ENV !== "production" && !Y(o) && O(
      "The data option must be a function. Plain object usage is no longer supported."
    );
    const q = o.call(n, n);
    if (process.env.NODE_ENV !== "production" && zs(q) && O(
      "data() returned a Promise - note data() cannot be async; If you intend to perform data fetching before component renders, use async setup() + <Suspense>."
    ), !J(q))
      process.env.NODE_ENV !== "production" && O("data() should return an object.");
    else if (e.data = /* @__PURE__ */ oo(q), process.env.NODE_ENV !== "production")
      for (const W in q)
        Ze("Data", W), fo(W[0]) || Object.defineProperty(s, W, {
          configurable: !0,
          enumerable: !0,
          get: () => q[W],
          set: pe
        });
  }
  if (Us = !0, r)
    for (const q in r) {
      const W = r[q], Le = Y(W) ? W.bind(n, n) : Y(W.get) ? W.get.bind(n, n) : pe;
      process.env.NODE_ENV !== "production" && Le === pe && O(`Computed property "${q}" has no getter.`);
      const en = !Y(W) && Y(W.set) ? W.set.bind(n) : process.env.NODE_ENV !== "production" ? () => {
        O(
          `Write operation failed: computed property "${q}" is readonly.`
        );
      } : pe, P = kn({
        get: Le,
        set: en
      });
      Object.defineProperty(s, q, {
        enumerable: !0,
        configurable: !0,
        get: () => P.value,
        set: ($) => P.value = $
      }), process.env.NODE_ENV !== "production" && Ze("Computed", q);
    }
  if (a)
    for (const q in a)
      ui(a[q], s, n, q);
  if (l) {
    const q = Y(l) ? l.call(n) : l;
    Reflect.ownKeys(q).forEach((W) => {
      Ql(W, q[W]);
    });
  }
  f && jo(f, e, "c");
  function we(q, W) {
    L(W) ? W.forEach((Le) => q(Le.bind(n))) : W && q(W.bind(n));
  }
  if (we(ia, d), we(bs, v), we(la, _), we(aa, k), we(sa, I), we(oa, ne), we(da, ae), we(fa, le), we(ca, ge), we(Pt, R), we(ii, D), we(ua, be), L(Me))
    if (Me.length) {
      const q = e.exposed || (e.exposed = {});
      Me.forEach((W) => {
        Object.defineProperty(q, W, {
          get: () => n[W],
          set: (Le) => n[W] = Le,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  A && e.render === pe && (e.render = A), Xe != null && (e.inheritAttrs = Xe), Ne && (e.components = Ne), Mt && (e.directives = Mt), be && oi(e);
}
function ya(e, t, n = pe) {
  L(e) && (e = Fs(e));
  for (const s in e) {
    const o = e[s];
    let r;
    J(o) ? "default" in o ? r = Hn(
      o.from || s,
      o.default,
      !0
    ) : r = Hn(o.from || s) : r = Hn(o), /* @__PURE__ */ ce(r) ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => r.value,
      set: (i) => r.value = i
    }) : t[s] = r, process.env.NODE_ENV !== "production" && n("Inject", s);
  }
}
function jo(e, t, n) {
  Qe(
    L(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function ui(e, t, n, s) {
  let o = s.includes(".") ? ni(n, s) : () => n[s];
  if (oe(e)) {
    const r = t[e];
    Y(r) ? At(o, r) : process.env.NODE_ENV !== "production" && O(`Invalid watch handler specified by key "${e}"`, r);
  } else if (Y(e))
    At(o, e.bind(n));
  else if (J(e))
    if (L(e))
      e.forEach((r) => ui(r, t, n, s));
    else {
      const r = Y(e.handler) ? e.handler.bind(n) : t[e.handler];
      Y(r) ? At(o, r, e) : process.env.NODE_ENV !== "production" && O(`Invalid watch handler specified by key "${e.handler}"`, r);
    }
  else process.env.NODE_ENV !== "production" && O(`Invalid watch option: "${s}"`, e);
}
function ci(e) {
  const t = e.type, { mixins: n, extends: s } = t, {
    mixins: o,
    optionsCache: r,
    config: { optionMergeStrategies: i }
  } = e.appContext, a = r.get(t);
  let l;
  return a ? l = a : !o.length && !n && !s ? l = t : (l = {}, o.length && o.forEach(
    (u) => es(l, u, i, !0)
  ), es(l, t, i)), J(t) && r.set(t, l), l;
}
function es(e, t, n, s = !1) {
  const { mixins: o, extends: r } = t;
  r && es(e, r, n, !0), o && o.forEach(
    (i) => es(e, i, n, !0)
  );
  for (const i in t)
    if (s && i === "expose")
      process.env.NODE_ENV !== "production" && O(
        '"expose" option is ignored when declared in mixins or extends. It should only be declared in the base component itself.'
      );
    else {
      const a = _a[i] || n && n[i];
      e[i] = a ? a(e[i], t[i]) : t[i];
    }
  return e;
}
const _a = {
  data: Yo,
  props: Ho,
  emits: Ho,
  // objects
  methods: cn,
  computed: cn,
  // lifecycle
  beforeCreate: Se,
  created: Se,
  beforeMount: Se,
  mounted: Se,
  beforeUpdate: Se,
  updated: Se,
  beforeDestroy: Se,
  beforeUnmount: Se,
  destroyed: Se,
  unmounted: Se,
  activated: Se,
  deactivated: Se,
  errorCaptured: Se,
  serverPrefetch: Se,
  // assets
  components: cn,
  directives: cn,
  // watch
  watch: Na,
  // provide / inject
  provide: Yo,
  inject: Ea
};
function Yo(e, t) {
  return t ? e ? function() {
    return re(
      Y(e) ? e.call(this, this) : e,
      Y(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function Ea(e, t) {
  return cn(Fs(e), Fs(t));
}
function Fs(e) {
  if (L(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++)
      t[e[n]] = e[n];
    return t;
  }
  return e;
}
function Se(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function cn(e, t) {
  return e ? re(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function Ho(e, t) {
  return e ? L(e) && L(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : re(
    /* @__PURE__ */ Object.create(null),
    Fo(e),
    Fo(t ?? {})
  ) : t;
}
function Na(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = re(/* @__PURE__ */ Object.create(null), e);
  for (const s in t)
    n[s] = Se(e[s], t[s]);
  return n;
}
function fi() {
  return {
    app: null,
    config: {
      isNativeTag: Er,
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
let wa = 0;
function Oa(e, t) {
  return function(s, o = null) {
    Y(s) || (s = re({}, s)), o != null && !J(o) && (process.env.NODE_ENV !== "production" && O("root props passed to app.mount() must be an object."), o = null);
    const r = fi(), i = /* @__PURE__ */ new WeakSet(), a = [];
    let l = !1;
    const u = r.app = {
      _uid: wa++,
      _component: s,
      _props: o,
      _container: null,
      _context: r,
      _instance: null,
      version: tr,
      get config() {
        return r.config;
      },
      set config(f) {
        process.env.NODE_ENV !== "production" && O(
          "app.config cannot be replaced. Modify individual options instead."
        );
      },
      use(f, ...d) {
        return i.has(f) ? process.env.NODE_ENV !== "production" && O("Plugin has already been applied to target app.") : f && Y(f.install) ? (i.add(f), f.install(u, ...d)) : Y(f) ? (i.add(f), f(u, ...d)) : process.env.NODE_ENV !== "production" && O(
          'A plugin must either be a function or an object with an "install" function.'
        ), u;
      },
      mixin(f) {
        return r.mixins.includes(f) ? process.env.NODE_ENV !== "production" && O(
          "Mixin has already been applied to target app" + (f.name ? `: ${f.name}` : "")
        ) : r.mixins.push(f), u;
      },
      component(f, d) {
        return process.env.NODE_ENV !== "production" && Ks(f, r.config), d ? (process.env.NODE_ENV !== "production" && r.components[f] && O(`Component "${f}" has already been registered in target app.`), r.components[f] = d, u) : r.components[f];
      },
      directive(f, d) {
        return process.env.NODE_ENV !== "production" && ei(f), d ? (process.env.NODE_ENV !== "production" && r.directives[f] && O(`Directive "${f}" has already been registered in target app.`), r.directives[f] = d, u) : r.directives[f];
      },
      mount(f, d, v) {
        if (l)
          process.env.NODE_ENV !== "production" && O(
            "App has already been mounted.\nIf you want to remount the same app, move your app creation logic into a factory function and create fresh app instances for each mount - e.g. `const createMyApp = () => createApp(App)`"
          );
        else {
          process.env.NODE_ENV !== "production" && f.__vue_app__ && O(
            "There is already an app instance mounted on the host container.\n If you want to mount another app on the same host container, you need to unmount the previous app by calling `app.unmount()` first."
          );
          const _ = u._ceVNode || ve(s, o);
          return _.appContext = r, v === !0 ? v = "svg" : v === !1 && (v = void 0), process.env.NODE_ENV !== "production" && (r.reload = () => {
            const k = Nt(_);
            k.el = null, e(k, f, v);
          }), e(_, f, v), l = !0, u._container = f, f.__vue_app__ = u, process.env.NODE_ENV !== "production" && (u._instance = _.component, Hl(u, tr)), ys(_.component);
        }
      },
      onUnmount(f) {
        process.env.NODE_ENV !== "production" && typeof f != "function" && O(
          `Expected function as first argument to app.onUnmount(), but got ${typeof f}`
        ), a.push(f);
      },
      unmount() {
        l ? (Qe(
          a,
          u._instance,
          16
        ), e(null, u._container), process.env.NODE_ENV !== "production" && (u._instance = null, Bl(u)), delete u._container.__vue_app__) : process.env.NODE_ENV !== "production" && O("Cannot unmount an app that is not mounted.");
      },
      provide(f, d) {
        return process.env.NODE_ENV !== "production" && f in r.provides && (G(r.provides, f) ? O(
          `App already provides property with key "${String(f)}". It will be overwritten with the new value.`
        ) : O(
          `App already provides property with key "${String(f)}" inherited from its parent element. It will be overwritten with the new value.`
        )), r.provides[f] = d, u;
      },
      runWithContext(f) {
        const d = qt;
        qt = u;
        try {
          return f();
        } finally {
          qt = d;
        }
      }
    };
    return u;
  };
}
let qt = null;
const Sa = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${_e(t)}Modifiers`] || e[`${Te(t)}Modifiers`];
function Ca(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || te;
  if (process.env.NODE_ENV !== "production") {
    const {
      emitsOptions: f,
      propsOptions: [d]
    } = e;
    if (f)
      if (!(t in f))
        (!d || !(St(_e(t)) in d)) && O(
          `Component emitted event "${t}" but it is neither declared in the emits option nor as an "${St(_e(t))}" prop.`
        );
      else {
        const v = f[t];
        Y(v) && (v(...n) || O(
          `Invalid event arguments: event validation failed for event "${t}".`
        ));
      }
  }
  let o = n;
  const r = t.startsWith("update:"), i = r && Sa(s, t.slice(7));
  if (i && (i.trim && (o = n.map((f) => oe(f) ? f.trim() : f)), i.number && (o = n.map(fs))), process.env.NODE_ENV !== "production" && Jl(e, t, o), process.env.NODE_ENV !== "production") {
    const f = t.toLowerCase();
    f !== t && s[St(f)] && O(
      `Event "${f}" is emitted in component ${In(
        e,
        e.type
      )} but the handler is registered for "${t}". Note that HTML attributes are case-insensitive and you cannot use v-on to listen to camelCase events when using in-DOM templates. You should probably use "${Te(
        t
      )}" instead of "${t}".`
    );
  }
  let a, l = s[a = St(t)] || // also try camelCase event handler (#2249)
  s[a = St(_e(t))];
  !l && r && (l = s[a = St(Te(t))]), l && Qe(
    l,
    e,
    6,
    o
  );
  const u = s[a + "Once"];
  if (u) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[a])
      return;
    e.emitted[a] = !0, Qe(
      u,
      e,
      6,
      o
    );
  }
}
const Da = /* @__PURE__ */ new WeakMap();
function di(e, t, n = !1) {
  const s = n ? Da : t.emitsCache, o = s.get(e);
  if (o !== void 0)
    return o;
  const r = e.emits;
  let i = {}, a = !1;
  if (!Y(e)) {
    const l = (u) => {
      const f = di(u, t, !0);
      f && (a = !0, re(i, f));
    };
    !n && t.mixins.length && t.mixins.forEach(l), e.extends && l(e.extends), e.mixins && e.mixins.forEach(l);
  }
  return !r && !a ? (J(e) && s.set(e, null), null) : (L(r) ? r.forEach((l) => i[l] = null) : re(i, r), J(e) && s.set(e, i), i);
}
function ms(e, t) {
  return !e || !Sn(t) ? !1 : (t = t.slice(2), t = t === "Once" ? t : t.replace(/Once$/, ""), G(e, t[0].toLowerCase() + t.slice(1)) || G(e, Te(t)) || G(e, t));
}
let js = !1;
function ts() {
  js = !0;
}
function Bo(e) {
  const {
    type: t,
    vnode: n,
    proxy: s,
    withProxy: o,
    propsOptions: [r],
    slots: i,
    attrs: a,
    emit: l,
    render: u,
    renderCache: f,
    props: d,
    data: v,
    setupState: _,
    ctx: k,
    inheritAttrs: I
  } = e, ne = Xn(e);
  let Q, R;
  process.env.NODE_ENV !== "production" && (js = !1);
  try {
    if (n.shapeFlag & 4) {
      const A = o || s, le = process.env.NODE_ENV !== "production" && _.__isScriptSetup ? new Proxy(A, {
        get(ge, ae, be) {
          return O(
            `Property '${String(
              ae
            )}' was accessed via 'this'. Avoid using 'this' in templates.`
          ), Reflect.get(ge, ae, be);
        }
      }) : A;
      Q = He(
        u.call(
          le,
          A,
          f,
          process.env.NODE_ENV !== "production" ? /* @__PURE__ */ at(d) : d,
          _,
          v,
          k
        )
      ), R = a;
    } else {
      const A = t;
      process.env.NODE_ENV !== "production" && a === d && ts(), Q = He(
        A.length > 1 ? A(
          process.env.NODE_ENV !== "production" ? /* @__PURE__ */ at(d) : d,
          process.env.NODE_ENV !== "production" ? {
            get attrs() {
              return ts(), /* @__PURE__ */ at(a);
            },
            slots: i,
            emit: l
          } : { attrs: a, slots: i, emit: l }
        ) : A(
          process.env.NODE_ENV !== "production" ? /* @__PURE__ */ at(d) : d,
          null
        )
      ), R = t.props ? a : xa(a);
    }
  } catch (A) {
    vt.length = 0, xn(A, e, 1), Q = ve($e);
  }
  let V = Q, D;
  if (process.env.NODE_ENV !== "production" && Q.patchFlag > 0 && Q.patchFlag & 2048 && ([V, D] = pi(Q)), R && I !== !1) {
    const A = Object.keys(R), { shapeFlag: le } = V;
    if (A.length) {
      if (le & 7)
        r && A.some(mn) && (R = Va(
          R,
          r
        )), V = Nt(V, R, !1, !0);
      else if (process.env.NODE_ENV !== "production" && !js && V.type !== $e) {
        const ge = Object.keys(a), ae = [], be = [];
        for (let Me = 0, Xe = ge.length; Me < Xe; Me++) {
          const Ne = ge[Me];
          Sn(Ne) ? mn(Ne) || ae.push(Ne[2].toLowerCase() + Ne.slice(3)) : be.push(Ne);
        }
        be.length && O(
          `Extraneous non-props attributes (${be.join(", ")}) were passed to component but could not be automatically inherited because component renders fragment or text or teleport root nodes.`
        ), ae.length && O(
          `Extraneous non-emits event listeners (${ae.join(", ")}) were passed to component but could not be automatically inherited because component renders fragment or text root nodes. If the listener is intended to be a component custom event listener only, declare it using the "emits" option.`
        );
      }
    }
  }
  return n.dirs && (process.env.NODE_ENV !== "production" && !Ko(V) && O(
    "Runtime directive used on component with non-element root node. The directives will not function as intended."
  ), V = Nt(V, null, !1, !0), V.dirs = V.dirs ? V.dirs.concat(n.dirs) : n.dirs), n.transition && (process.env.NODE_ENV !== "production" && !Ko(V) && O(
    "Component inside <Transition> renders non-element root node that cannot be animated."
  ), uo(V, n.transition)), process.env.NODE_ENV !== "production" && D ? D(V) : Q = V, Xn(ne), Q;
}
const pi = (e) => {
  const t = e.children, n = e.dynamicChildren, s = po(t, !1);
  if (s) {
    if (process.env.NODE_ENV !== "production" && s.patchFlag > 0 && s.patchFlag & 2048)
      return pi(s);
  } else return [e, void 0];
  const o = t.indexOf(s), r = n ? n.indexOf(s) : -1, i = (a) => {
    t[o] = a, n && (r > -1 ? n[r] = a : a.patchFlag > 0 && (e.dynamicChildren = [...n, a]));
  };
  return [He(s), i];
};
function po(e, t = !0) {
  let n;
  for (let s = 0; s < e.length; s++) {
    const o = e[s];
    if (Tn(o)) {
      if (o.type !== $e || o.children === "v-if") {
        if (n)
          return;
        if (n = o, process.env.NODE_ENV !== "production" && t && n.patchFlag > 0 && n.patchFlag & 2048)
          return po(n.children);
      }
    } else
      return;
  }
  return n;
}
const xa = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || Sn(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, Va = (e, t) => {
  const n = {};
  for (const s in e)
    (!mn(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
  return n;
}, Ko = (e) => e.shapeFlag & 7 || e.type === $e;
function $a(e, t, n) {
  const { props: s, children: o, component: r } = e, { props: i, children: a, patchFlag: l } = t, u = r.emitsOptions;
  if (process.env.NODE_ENV !== "production" && (o || a) && Re || t.dirs || t.transition)
    return !0;
  if (n && l >= 0) {
    if (l & 1024)
      return !0;
    if (l & 16)
      return s ? Wo(s, i, u) : !!i;
    if (l & 8) {
      const f = t.dynamicProps;
      for (let d = 0; d < f.length; d++) {
        const v = f[d];
        if (hi(i, s, v) && !ms(u, v))
          return !0;
      }
    }
  } else
    return (o || a) && (!a || !a.$stable) ? !0 : s === i ? !1 : s ? i ? Wo(s, i, u) : !0 : !!i;
  return !1;
}
function Wo(e, t, n) {
  const s = Object.keys(t);
  if (s.length !== Object.keys(e).length)
    return !0;
  for (let o = 0; o < s.length; o++) {
    const r = s[o];
    if (hi(t, e, r) && !ms(n, r))
      return !0;
  }
  return !1;
}
function hi(e, t, n) {
  const s = e[n], o = t[n];
  return n === "style" && J(s) && J(o) ? !Qt(s, o) : s !== o;
}
function Aa({ vnode: e, parent: t, suspense: n }, s) {
  for (; t; ) {
    const o = t.subTree;
    if (o.suspense && o.suspense.activeBranch === e && (o.suspense.vnode.el = o.el = s, e = o), o === e)
      (e = t.vnode).el = s, t = t.parent;
    else
      break;
  }
  n && n.activeBranch === e && (n.vnode.el = s);
}
const vi = {}, gi = () => Object.create(vi), bi = (e) => Object.getPrototypeOf(e) === vi;
function Ta(e, t, n, s = !1) {
  const o = {}, r = gi();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), mi(e, t, o, r);
  for (const i in e.propsOptions[0])
    i in o || (o[i] = void 0);
  process.env.NODE_ENV !== "production" && _i(t || {}, o, e), n ? e.props = s ? o : /* @__PURE__ */ wl(o) : e.type.props ? e.props = o : e.props = r, e.attrs = r;
}
function Ra(e) {
  for (; e; ) {
    if (e.type.__hmrId) return !0;
    e = e.parent;
  }
}
function Ia(e, t, n, s) {
  const {
    props: o,
    attrs: r,
    vnode: { patchFlag: i }
  } = e, a = /* @__PURE__ */ K(o), [l] = e.propsOptions;
  let u = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    !(process.env.NODE_ENV !== "production" && Ra(e)) && (s || i > 0) && !(i & 16)
  ) {
    if (i & 8) {
      const f = e.vnode.dynamicProps;
      for (let d = 0; d < f.length; d++) {
        let v = f[d];
        if (ms(e.emitsOptions, v))
          continue;
        const _ = t[v];
        if (l)
          if (G(r, v))
            _ !== r[v] && (r[v] = _, u = !0);
          else {
            const k = _e(v);
            o[k] = Ys(
              l,
              a,
              k,
              _,
              e,
              !1
            );
          }
        else
          _ !== r[v] && (r[v] = _, u = !0);
      }
    }
  } else {
    mi(e, t, o, r) && (u = !0);
    let f;
    for (const d in a)
      (!t || // for camelCase
      !G(t, d) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((f = Te(d)) === d || !G(t, f))) && (l ? n && // for camelCase
      (n[d] !== void 0 || // for kebab-case
      n[f] !== void 0) && (o[d] = Ys(
        l,
        a,
        d,
        void 0,
        e,
        !0
      )) : delete o[d]);
    if (r !== a)
      for (const d in r)
        (!t || !G(t, d)) && (delete r[d], u = !0);
  }
  u && lt(e.attrs, "set", ""), process.env.NODE_ENV !== "production" && _i(t || {}, o, e);
}
function mi(e, t, n, s) {
  const [o, r] = e.propsOptions;
  let i = !1, a;
  if (t)
    for (let l in t) {
      if (dn(l))
        continue;
      const u = t[l];
      let f;
      o && G(o, f = _e(l)) ? !r || !r.includes(f) ? n[f] = u : (a || (a = {}))[f] = u : ms(e.emitsOptions, l) || (!(l in s) || u !== s[l]) && (s[l] = u, i = !0);
    }
  if (r) {
    const l = /* @__PURE__ */ K(n), u = a || te;
    for (let f = 0; f < r.length; f++) {
      const d = r[f];
      n[d] = Ys(
        o,
        l,
        d,
        u[d],
        e,
        !G(u, d)
      );
    }
  }
  return i;
}
function Ys(e, t, n, s, o, r) {
  const i = e[n];
  if (i != null) {
    const a = G(i, "default");
    if (a && s === void 0) {
      const l = i.default;
      if (i.type !== Function && !i.skipFactory && Y(l)) {
        const { propsDefaults: u } = o;
        if (n in u)
          s = u[n];
        else {
          const f = Rn(o);
          s = u[n] = l.call(
            null,
            t
          ), f();
        }
      } else
        s = l;
      o.ce && o.ce._setProp(n, s);
    }
    i[
      0
      /* shouldCast */
    ] && (r && !a ? s = !1 : i[
      1
      /* shouldCastTrue */
    ] && (s === "" || s === Te(n)) && (s = !0));
  }
  return s;
}
const ka = /* @__PURE__ */ new WeakMap();
function yi(e, t, n = !1) {
  const s = n ? ka : t.propsCache, o = s.get(e);
  if (o)
    return o;
  const r = e.props, i = {}, a = [];
  let l = !1;
  if (!Y(e)) {
    const f = (d) => {
      l = !0;
      const [v, _] = yi(d, t, !0);
      re(i, v), _ && a.push(..._);
    };
    !n && t.mixins.length && t.mixins.forEach(f), e.extends && f(e.extends), e.mixins && e.mixins.forEach(f);
  }
  if (!r && !l)
    return J(e) && s.set(e, Bt), Bt;
  if (L(r))
    for (let f = 0; f < r.length; f++) {
      process.env.NODE_ENV !== "production" && !oe(r[f]) && O("props must be strings when using array syntax.", r[f]);
      const d = _e(r[f]);
      qo(d) && (i[d] = te);
    }
  else if (r) {
    process.env.NODE_ENV !== "production" && !J(r) && O("invalid props options", r);
    for (const f in r) {
      const d = _e(f);
      if (qo(d)) {
        const v = r[f], _ = i[d] = L(v) || Y(v) ? { type: v } : re({}, v), k = _.type;
        let I = !1, ne = !0;
        if (L(k))
          for (let Q = 0; Q < k.length; ++Q) {
            const R = k[Q], V = Y(R) && R.name;
            if (V === "Boolean") {
              I = !0;
              break;
            } else V === "String" && (ne = !1);
          }
        else
          I = Y(k) && k.name === "Boolean";
        _[
          0
          /* shouldCast */
        ] = I, _[
          1
          /* shouldCastTrue */
        ] = ne, (I || G(_, "default")) && a.push(d);
      }
    }
  }
  const u = [i, a];
  return J(e) && s.set(e, u), u;
}
function qo(e) {
  return e[0] !== "$" && !dn(e) ? !0 : (process.env.NODE_ENV !== "production" && O(`Invalid prop name: "${e}" is a reserved property.`), !1);
}
function Pa(e) {
  return e === null ? "null" : typeof e == "function" ? e.name || "" : typeof e == "object" && e.constructor && e.constructor.name || "";
}
function _i(e, t, n) {
  const s = /* @__PURE__ */ K(t), o = n.propsOptions[0], r = Object.keys(e).map((i) => _e(i));
  for (const i in o) {
    let a = o[i];
    a != null && Ma(
      i,
      s[i],
      a,
      process.env.NODE_ENV !== "production" ? /* @__PURE__ */ at(s) : s,
      !r.includes(i)
    );
  }
}
function Ma(e, t, n, s, o) {
  const { type: r, required: i, validator: a, skipCheck: l } = n;
  if (i && o) {
    O('Missing required prop: "' + e + '"');
    return;
  }
  if (!(t == null && !i)) {
    if (r != null && r !== !0 && !l) {
      let u = !1;
      const f = L(r) ? r : [r], d = [];
      for (let v = 0; v < f.length && !u; v++) {
        const { valid: _, expectedType: k } = Ua(t, f[v]);
        d.push(k || ""), u = _;
      }
      if (!u) {
        O(Fa(e, t, d));
        return;
      }
    }
    a && !a(t, s) && O('Invalid prop: custom validator check failed for prop "' + e + '".');
  }
}
const La = /* @__PURE__ */ bt(
  "String,Number,Boolean,Function,Symbol,BigInt"
);
function Ua(e, t) {
  let n;
  const s = Pa(t);
  if (s === "null")
    n = e === null;
  else if (La(s)) {
    const o = typeof e;
    n = o === s.toLowerCase(), !n && o === "object" && (n = e instanceof t);
  } else s === "Object" ? n = J(e) : s === "Array" ? n = L(e) : n = e instanceof t;
  return {
    valid: n,
    expectedType: s
  };
}
function Fa(e, t, n) {
  if (n.length === 0)
    return `Prop type [] for prop "${e}" won't match anything. Did you mean to use type Array instead?`;
  let s = `Invalid prop: type check failed for prop "${e}". Expected ${n.map(cs).join(" | ")}`;
  const o = n[0], r = Js(t), i = Go(t, o), a = Go(t, r);
  return n.length === 1 && zo(o) && ja(o, r) && (s += ` with value ${i}`), s += `, got ${r} `, zo(r) && (s += `with value ${a}.`), s;
}
function Go(e, t) {
  return Fe(e) ? e.toString() : t === "String" ? `"${e}"` : t === "Number" ? `${Number(e)}` : `${e}`;
}
function zo(e) {
  return ["string", "number", "boolean"].some((n) => e.toLowerCase() === n);
}
function ja(...e) {
  return e.every((t) => {
    const n = t.toLowerCase();
    return n !== "boolean" && n !== "symbol";
  });
}
const ho = (e) => e === "_" || e === "_ctx" || e === "$stable", vo = (e) => L(e) ? e.map(He) : [He(e)], Ya = (e, t, n) => {
  if (t._n)
    return t;
  const s = It((...o) => (process.env.NODE_ENV !== "production" && fe && !(n === null && he) && !(n && n.root !== fe.root) && O(
    `Slot "${e}" invoked outside of the render function: this will not track dependencies used in the slot. Invoke the slot function inside the render function instead.`
  ), vo(t(...o))), n);
  return s._c = !1, s;
}, Ei = (e, t, n) => {
  const s = e._ctx;
  for (const o in e) {
    if (ho(o)) continue;
    const r = e[o];
    if (Y(r))
      t[o] = Ya(o, r, s);
    else if (r != null) {
      process.env.NODE_ENV !== "production" && O(
        `Non-function value encountered for slot "${o}". Prefer function slots for better performance.`
      );
      const i = vo(r);
      t[o] = () => i;
    }
  }
}, Ni = (e, t) => {
  process.env.NODE_ENV !== "production" && !co(e.vnode) && O(
    "Non-function value encountered for default slot. Prefer function slots for better performance."
  );
  const n = vo(t);
  e.slots.default = () => n;
}, Hs = (e, t, n) => {
  for (const s in t)
    (n || !ho(s)) && (e[s] = t[s]);
}, Ha = (e, t, n) => {
  const s = e.slots = gi();
  if (e.vnode.shapeFlag & 32) {
    const o = t._;
    o ? (Hs(s, t, n), n && qn(s, "_", o, !0)) : Ei(t, s);
  } else t && Ni(e, t);
}, Ba = (e, t, n) => {
  const { vnode: s, slots: o } = e;
  let r = !0, i = te;
  if (s.shapeFlag & 32) {
    const a = t._;
    a ? process.env.NODE_ENV !== "production" && Re ? (Hs(o, t, n), lt(e, "set", "$slots")) : n && a === 1 ? r = !1 : Hs(o, t, n) : (r = !t.$stable, Ei(t, o)), i = t;
  } else t && (Ni(e, t), i = { default: 1 });
  if (r)
    for (const a in o)
      !ho(a) && i[a] == null && delete o[a];
};
let rn, ft;
function Ft(e, t) {
  e.appContext.config.performance && ns() && ft.mark(`vue-${t}-${e.uid}`), process.env.NODE_ENV !== "production" && Gl(e, t, ns() ? ft.now() : Date.now());
}
function jt(e, t) {
  if (e.appContext.config.performance && ns()) {
    const n = `vue-${t}-${e.uid}`, s = n + ":end", o = `<${In(e, e.type)}> ${t}`;
    ft.mark(s), ft.measure(o, n, s), ft.clearMeasures(o), ft.clearMarks(n), ft.clearMarks(s);
  }
  process.env.NODE_ENV !== "production" && zl(e, t, ns() ? ft.now() : Date.now());
}
function ns() {
  return rn !== void 0 || (typeof window < "u" && window.performance ? (rn = !0, ft = window.performance) : rn = !1), rn;
}
function Ka() {
  const e = [];
  if (process.env.NODE_ENV !== "production" && e.length) {
    const t = e.length > 1;
    console.warn(
      `Feature flag${t ? "s" : ""} ${e.join(", ")} ${t ? "are" : "is"} not explicitly defined. You are running the esm-bundler build of Vue, which expects these compile-time feature flags to be globally injected via the bundler config in order to get better tree-shaking in the production bundle.

For more details, see https://link.vuejs.org/feature-flags.`
    );
  }
}
const xe = Ja;
function Wa(e) {
  return qa(e);
}
function qa(e, t) {
  Ka();
  const n = Dn();
  n.__VUE__ = !0, process.env.NODE_ENV !== "production" && lo(n.__VUE_DEVTOOLS_GLOBAL_HOOK__, n);
  const {
    insert: s,
    remove: o,
    patchProp: r,
    createElement: i,
    createText: a,
    createComment: l,
    setText: u,
    setElementText: f,
    parentNode: d,
    nextSibling: v,
    setScopeId: _ = pe,
    insertStaticContent: k
  } = e, I = (c, h, g, E = null, m = null, b = null, S = void 0, w = null, N = process.env.NODE_ENV !== "production" && Re ? !1 : !!h.dynamicChildren) => {
    if (c === h)
      return;
    c && !ln(c, h) && (E = Pn(c), F(c, m, b, !0), c = null), h.patchFlag === -2 && (N = !1, h.dynamicChildren = null);
    const { type: y, ref: j, shapeFlag: x } = h;
    switch (y) {
      case An:
        ne(c, h, g, E);
        break;
      case $e:
        Q(c, h, g, E);
        break;
      case Kn:
        c == null ? R(h, g, E, S) : process.env.NODE_ENV !== "production" && V(c, h, g, S);
        break;
      case se:
        Mt(
          c,
          h,
          g,
          E,
          m,
          b,
          S,
          w,
          N
        );
        break;
      default:
        x & 1 ? le(
          c,
          h,
          g,
          E,
          m,
          b,
          S,
          w,
          N
        ) : x & 6 ? Zt(
          c,
          h,
          g,
          E,
          m,
          b,
          S,
          w,
          N
        ) : x & 64 || x & 128 ? y.process(
          c,
          h,
          g,
          E,
          m,
          b,
          S,
          w,
          N,
          nn
        ) : process.env.NODE_ENV !== "production" && O("Invalid VNode type:", y, `(${typeof y})`);
    }
    j != null && m ? vn(j, c && c.ref, b, h || c, !h) : j == null && c && c.ref != null && vn(c.ref, null, b, c, !0);
  }, ne = (c, h, g, E) => {
    if (c == null)
      s(
        h.el = a(h.children),
        g,
        E
      );
    else {
      const m = h.el = c.el;
      h.children !== c.children && u(m, h.children);
    }
  }, Q = (c, h, g, E) => {
    c == null ? s(
      h.el = l(h.children || ""),
      g,
      E
    ) : h.el = c.el;
  }, R = (c, h, g, E) => {
    [c.el, c.anchor] = k(
      c.children,
      h,
      g,
      E,
      c.el,
      c.anchor
    );
  }, V = (c, h, g, E) => {
    if (h.children !== c.children) {
      const m = v(c.anchor);
      A(c), [h.el, h.anchor] = k(
        h.children,
        g,
        m,
        E
      );
    } else
      h.el = c.el, h.anchor = c.anchor;
  }, D = ({ el: c, anchor: h }, g, E) => {
    let m;
    for (; c && c !== h; )
      m = v(c), s(c, g, E), c = m;
    s(h, g, E);
  }, A = ({ el: c, anchor: h }) => {
    let g;
    for (; c && c !== h; )
      g = v(c), o(c), c = g;
    o(h);
  }, le = (c, h, g, E, m, b, S, w, N) => {
    if (h.type === "svg" ? S = "svg" : h.type === "math" && (S = "mathml"), c == null)
      ge(
        h,
        g,
        E,
        m,
        b,
        S,
        w,
        N
      );
    else {
      const y = c.el && c.el._isVueCE ? c.el : null;
      try {
        y && y._beginPatch(), Me(
          c,
          h,
          m,
          b,
          S,
          w,
          N
        );
      } finally {
        y && y._endPatch();
      }
    }
  }, ge = (c, h, g, E, m, b, S, w) => {
    let N, y;
    const { props: j, shapeFlag: x, transition: U, dirs: H } = c;
    if (N = c.el = i(
      c.type,
      b,
      j && j.is,
      j
    ), x & 8 ? f(N, c.children) : x & 16 && be(
      c.children,
      N,
      null,
      E,
      m,
      Vs(c, b),
      S,
      w
    ), H && wt(c, null, E, "created"), ae(N, c, c.scopeId, S, E), j) {
      for (const Z in j)
        Z !== "value" && !dn(Z) && r(N, Z, null, j[Z], b, E);
      "value" in j && r(N, "value", null, j.value, b), (y = j.onVnodeBeforeMount) && st(y, E, c);
    }
    process.env.NODE_ENV !== "production" && (qn(N, "__vnode", c, !0), qn(N, "__vueParentComponent", E, !0)), H && wt(c, null, E, "beforeMount");
    const z = Ga(m, U);
    if (z && U.beforeEnter(N), s(N, h, g), (y = j && j.onVnodeMounted) || z || H) {
      const Z = process.env.NODE_ENV !== "production" && Re;
      xe(() => {
        let X;
        process.env.NODE_ENV !== "production" && (X = Io(Z));
        try {
          y && st(y, E, c), z && U.enter(N), H && wt(c, null, E, "mounted");
        } finally {
          process.env.NODE_ENV !== "production" && Io(X);
        }
      }, m);
    }
  }, ae = (c, h, g, E, m) => {
    if (g && _(c, g), E)
      for (let b = 0; b < E.length; b++)
        _(c, E[b]);
    if (m) {
      let b = m.subTree;
      if (process.env.NODE_ENV !== "production" && b.patchFlag > 0 && b.patchFlag & 2048 && (b = po(b.children) || b), h === b || Si(b.type) && (b.ssContent === h || b.ssFallback === h)) {
        const S = m.vnode;
        ae(
          c,
          S,
          S.scopeId,
          S.slotScopeIds,
          m.parent
        );
      }
    }
  }, be = (c, h, g, E, m, b, S, w, N = 0) => {
    for (let y = N; y < c.length; y++) {
      const j = c[y] = w ? dt(c[y]) : He(c[y]);
      I(
        null,
        j,
        h,
        g,
        E,
        m,
        b,
        S,
        w
      );
    }
  }, Me = (c, h, g, E, m, b, S) => {
    const w = h.el = c.el;
    process.env.NODE_ENV !== "production" && (w.__vnode = h);
    let { patchFlag: N, dynamicChildren: y, dirs: j } = h;
    N |= c.patchFlag & 16;
    const x = c.props || te, U = h.props || te;
    let H;
    if (g && Ot(g, !1), (H = U.onVnodeBeforeUpdate) && st(H, g, h, c), j && wt(h, c, g, "beforeUpdate"), g && Ot(g, !0), // HMR updated, force full diff
    (process.env.NODE_ENV !== "production" && Re || // #6385 the old vnode may be a user-wrapped non-isomorphic block
    // Force full diff when block metadata is unstable.
    y && (!c.dynamicChildren || c.dynamicChildren.length !== y.length)) && (N = 0, S = !1, y = null), (x.innerHTML && U.innerHTML == null || x.textContent && U.textContent == null) && f(w, ""), y ? (Xe(
      c.dynamicChildren,
      y,
      w,
      g,
      E,
      Vs(h, m),
      b
    ), process.env.NODE_ENV !== "production" && Bn(c, h)) : S || Le(
      c,
      h,
      w,
      null,
      g,
      E,
      Vs(h, m),
      b,
      !1
    ), N > 0) {
      if (N & 16)
        Ne(w, x, U, g, m);
      else if (N & 2 && x.class !== U.class && r(w, "class", null, U.class, m), N & 4 && r(w, "style", x.style, U.style, m), N & 8) {
        const z = h.dynamicProps;
        for (let Z = 0; Z < z.length; Z++) {
          const X = z[Z], ue = x[X], me = U[X];
          (me !== ue || X === "value") && r(w, X, ue, me, m, g);
        }
      }
      N & 1 && c.children !== h.children && f(w, h.children);
    } else !S && y == null && Ne(w, x, U, g, m);
    ((H = U.onVnodeUpdated) || j) && xe(() => {
      H && st(H, g, h, c), j && wt(h, c, g, "updated");
    }, E);
  }, Xe = (c, h, g, E, m, b, S) => {
    for (let w = 0; w < h.length; w++) {
      const N = c[w], y = h[w], j = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        N.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (N.type === se || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !ln(N, y) || // - In the case of a component, it could contain anything.
        N.shapeFlag & 198) ? d(N.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          g
        )
      );
      I(
        N,
        y,
        j,
        null,
        E,
        m,
        b,
        S,
        !0
      );
    }
  }, Ne = (c, h, g, E, m) => {
    if (h !== g) {
      if (h !== te)
        for (const b in h)
          !dn(b) && !(b in g) && r(
            c,
            b,
            h[b],
            null,
            m,
            E
          );
      for (const b in g) {
        if (dn(b)) continue;
        const S = g[b], w = h[b];
        S !== w && b !== "value" && r(c, b, w, S, m, E);
      }
      "value" in g && r(c, "value", h.value, g.value, m);
    }
  }, Mt = (c, h, g, E, m, b, S, w, N) => {
    const y = h.el = c ? c.el : a(""), j = h.anchor = c ? c.anchor : a("");
    let { patchFlag: x, dynamicChildren: U, slotScopeIds: H } = h;
    process.env.NODE_ENV !== "production" && // #5523 dev root fragment may inherit directives
    (Re || x & 2048) && (x = 0, N = !1, U = null), H && (w = w ? w.concat(H) : H), c == null ? (s(y, g, E), s(j, g, E), be(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      h.children || [],
      g,
      j,
      m,
      b,
      S,
      w,
      N
    )) : x > 0 && x & 64 && U && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    c.dynamicChildren && c.dynamicChildren.length === U.length ? (Xe(
      c.dynamicChildren,
      U,
      g,
      m,
      b,
      S,
      w
    ), process.env.NODE_ENV !== "production" ? Bn(c, h) : (
      // #2080 if the stable fragment has a key, it's a <template v-for> that may
      //  get moved around. Make sure all root level vnodes inherit el.
      // #2134 or if it's a component root, it may also get moved around
      // as the component is being moved.
      (h.key != null || m && h === m.subTree) && Bn(
        c,
        h,
        !0
        /* shallow */
      )
    )) : Le(
      c,
      h,
      g,
      j,
      m,
      b,
      S,
      w,
      N
    );
  }, Zt = (c, h, g, E, m, b, S, w, N) => {
    h.slotScopeIds = w, c == null ? h.shapeFlag & 512 ? m.ctx.activate(
      h,
      g,
      E,
      S,
      N
    ) : Ze(
      h,
      g,
      E,
      m,
      b,
      S,
      N
    ) : we(c, h, N);
  }, Ze = (c, h, g, E, m, b, S) => {
    const w = c.component = nu(
      c,
      E,
      m
    );
    if (process.env.NODE_ENV !== "production" && w.type.__hmrId && Ul(w), process.env.NODE_ENV !== "production" && (Fn(c), Ft(w, "mount")), co(c) && (w.ctx.renderer = nn), process.env.NODE_ENV !== "production" && Ft(w, "init"), ou(w, !1, S), process.env.NODE_ENV !== "production" && jt(w, "init"), process.env.NODE_ENV !== "production" && Re && (c.el = null), w.asyncDep) {
      if (m && m.registerDep(w, q, S), !c.el) {
        const N = w.subTree = ve($e);
        Q(null, N, h, g), c.placeholder = N.el;
      }
    } else
      q(
        w,
        c,
        h,
        g,
        m,
        b,
        S
      );
    process.env.NODE_ENV !== "production" && (jn(), jt(w, "mount"));
  }, we = (c, h, g) => {
    const E = h.component = c.component;
    if ($a(c, h, g))
      if (E.asyncDep && !E.asyncResolved) {
        process.env.NODE_ENV !== "production" && Fn(h), W(E, h, g), process.env.NODE_ENV !== "production" && jn();
        return;
      } else
        E.next = h, E.update();
    else
      h.el = c.el, E.vnode = h;
  }, q = (c, h, g, E, m, b, S) => {
    const w = () => {
      if (c.isMounted) {
        let { next: x, bu: U, u: H, parent: z, vnode: Z } = c;
        {
          const tt = wi(c);
          if (tt) {
            x && (x.el = Z.el, W(c, x, S)), tt.asyncDep.then(() => {
              xe(() => {
                c.isUnmounted || y();
              }, m);
            });
            return;
          }
        }
        let X = x, ue;
        process.env.NODE_ENV !== "production" && Fn(x || c.vnode), Ot(c, !1), x ? (x.el = Z.el, W(c, x, S)) : x = Z, U && Yt(U), (ue = x.props && x.props.onVnodeBeforeUpdate) && st(ue, z, x, Z), Ot(c, !0), process.env.NODE_ENV !== "production" && Ft(c, "render");
        const me = Bo(c);
        process.env.NODE_ENV !== "production" && jt(c, "render");
        const et = c.subTree;
        c.subTree = me, process.env.NODE_ENV !== "production" && Ft(c, "patch"), I(
          et,
          me,
          // parent may have changed if it's in a teleport
          d(et.el),
          // anchor may have changed if it's in a fragment
          Pn(et),
          c,
          m,
          b
        ), process.env.NODE_ENV !== "production" && jt(c, "patch"), x.el = me.el, X === null && Aa(c, me.el), H && xe(H, m), (ue = x.props && x.props.onVnodeUpdated) && xe(
          () => st(ue, z, x, Z),
          m
        ), process.env.NODE_ENV !== "production" && Qr(c), process.env.NODE_ENV !== "production" && jn();
      } else {
        let x;
        const { el: U, props: H } = h, { bm: z, m: Z, parent: X, root: ue, type: me } = c, et = Wt(h);
        Ot(c, !1), z && Yt(z), !et && (x = H && H.onVnodeBeforeMount) && st(x, X, h), Ot(c, !0);
        {
          ue.ce && ue.ce._hasShadowRoot() && ue.ce._injectChildStyle(
            me,
            c.parent ? c.parent.type : void 0
          ), process.env.NODE_ENV !== "production" && Ft(c, "render");
          const tt = c.subTree = Bo(c);
          process.env.NODE_ENV !== "production" && jt(c, "render"), process.env.NODE_ENV !== "production" && Ft(c, "patch"), I(
            null,
            tt,
            g,
            E,
            c,
            m,
            b
          ), process.env.NODE_ENV !== "production" && jt(c, "patch"), h.el = tt.el;
        }
        if (Z && xe(Z, m), !et && (x = H && H.onVnodeMounted)) {
          const tt = h;
          xe(
            () => st(x, X, tt),
            m
          );
        }
        (h.shapeFlag & 256 || X && Wt(X.vnode) && X.vnode.shapeFlag & 256) && c.a && xe(c.a, m), c.isMounted = !0, process.env.NODE_ENV !== "production" && Kl(c), h = g = E = null;
      }
    };
    c.scope.on();
    const N = c.effect = new Cr(w);
    c.scope.off();
    const y = c.update = N.run.bind(N), j = c.job = N.runIfDirty.bind(N);
    j.i = c, j.id = c.uid, N.scheduler = () => vs(j), Ot(c, !0), process.env.NODE_ENV !== "production" && (N.onTrack = c.rtc ? (x) => Yt(c.rtc, x) : void 0, N.onTrigger = c.rtg ? (x) => Yt(c.rtg, x) : void 0), y();
  }, W = (c, h, g) => {
    h.component = c;
    const E = c.vnode.props;
    c.vnode = h, c.next = null, Ia(c, h.props, E, g), Ba(c, h.children, g), qe(), Ro(c), Ge();
  }, Le = (c, h, g, E, m, b, S, w, N = !1) => {
    const y = c && c.children, j = c ? c.shapeFlag : 0, x = h.children, { patchFlag: U, shapeFlag: H } = h;
    if (U > 0) {
      if (U & 128) {
        P(
          y,
          x,
          g,
          E,
          m,
          b,
          S,
          w,
          N
        );
        return;
      } else if (U & 256) {
        en(
          y,
          x,
          g,
          E,
          m,
          b,
          S,
          w,
          N
        );
        return;
      }
    }
    H & 8 ? (j & 16 && tn(y, m, b), x !== y && f(g, x)) : j & 16 ? H & 16 ? P(
      y,
      x,
      g,
      E,
      m,
      b,
      S,
      w,
      N
    ) : tn(y, m, b, !0) : (j & 8 && f(g, ""), H & 16 && be(
      x,
      g,
      E,
      m,
      b,
      S,
      w,
      N
    ));
  }, en = (c, h, g, E, m, b, S, w, N) => {
    c = c || Bt, h = h || Bt;
    const y = c.length, j = h.length, x = Math.min(y, j);
    let U;
    for (U = 0; U < x; U++) {
      const H = h[U] = N ? dt(h[U]) : He(h[U]);
      I(
        c[U],
        H,
        g,
        null,
        m,
        b,
        S,
        w,
        N
      );
    }
    y > j ? tn(
      c,
      m,
      b,
      !0,
      !1,
      x
    ) : be(
      h,
      g,
      E,
      m,
      b,
      S,
      w,
      N,
      x
    );
  }, P = (c, h, g, E, m, b, S, w, N) => {
    let y = 0;
    const j = h.length;
    let x = c.length - 1, U = j - 1;
    for (; y <= x && y <= U; ) {
      const H = c[y], z = h[y] = N ? dt(h[y]) : He(h[y]);
      if (ln(H, z))
        I(
          H,
          z,
          g,
          null,
          m,
          b,
          S,
          w,
          N
        );
      else
        break;
      y++;
    }
    for (; y <= x && y <= U; ) {
      const H = c[x], z = h[U] = N ? dt(h[U]) : He(h[U]);
      if (ln(H, z))
        I(
          H,
          z,
          g,
          null,
          m,
          b,
          S,
          w,
          N
        );
      else
        break;
      x--, U--;
    }
    if (y > x) {
      if (y <= U) {
        const H = U + 1, z = H < j ? h[H].el : E;
        for (; y <= U; )
          I(
            null,
            h[y] = N ? dt(h[y]) : He(h[y]),
            g,
            z,
            m,
            b,
            S,
            w,
            N
          ), y++;
      }
    } else if (y > U)
      for (; y <= x; )
        F(c[y], m, b, !0), y++;
    else {
      const H = y, z = y, Z = /* @__PURE__ */ new Map();
      for (y = z; y <= U; y++) {
        const Oe = h[y] = N ? dt(h[y]) : He(h[y]);
        Oe.key != null && (process.env.NODE_ENV !== "production" && Z.has(Oe.key) && O(
          "Duplicate keys found during update:",
          JSON.stringify(Oe.key),
          "Make sure keys are unique."
        ), Z.set(Oe.key, y));
      }
      let X, ue = 0;
      const me = U - z + 1;
      let et = !1, tt = 0;
      const sn = new Array(me);
      for (y = 0; y < me; y++) sn[y] = 0;
      for (y = H; y <= x; y++) {
        const Oe = c[y];
        if (ue >= me) {
          F(Oe, m, b, !0);
          continue;
        }
        let nt;
        if (Oe.key != null)
          nt = Z.get(Oe.key);
        else
          for (X = z; X <= U; X++)
            if (sn[X - z] === 0 && ln(Oe, h[X])) {
              nt = X;
              break;
            }
        nt === void 0 ? F(Oe, m, b, !0) : (sn[nt - z] = y + 1, nt >= tt ? tt = nt : et = !0, I(
          Oe,
          h[nt],
          g,
          null,
          m,
          b,
          S,
          w,
          N
        ), ue++);
      }
      const Oo = et ? za(sn) : Bt;
      for (X = Oo.length - 1, y = me - 1; y >= 0; y--) {
        const Oe = z + y, nt = h[Oe], So = h[Oe + 1], Co = Oe + 1 < j ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          So.el || Oi(So)
        ) : E;
        sn[y] === 0 ? I(
          null,
          nt,
          g,
          Co,
          m,
          b,
          S,
          w,
          N
        ) : et && (X < 0 || y !== Oo[X] ? $(nt, g, Co, 2) : X--);
      }
    }
  }, $ = (c, h, g, E, m = null) => {
    const { el: b, type: S, transition: w, children: N, shapeFlag: y } = c;
    if (y & 6) {
      $(c.component.subTree, h, g, E);
      return;
    }
    if (y & 128) {
      c.suspense.move(h, g, E);
      return;
    }
    if (y & 64) {
      S.move(c, h, g, nn);
      return;
    }
    if (S === se) {
      s(b, h, g);
      for (let x = 0; x < N.length; x++)
        $(N[x], h, g, E);
      s(c.anchor, h, g);
      return;
    }
    if (S === Kn) {
      D(c, h, g);
      return;
    }
    if (E !== 2 && y & 1 && w)
      if (E === 0)
        w.persisted && !b[Ds] ? s(b, h, g) : (w.beforeEnter(b), s(b, h, g), xe(() => w.enter(b), m));
      else {
        const { leave: x, delayLeave: U, afterLeave: H } = w, z = () => {
          c.ctx.isUnmounted ? o(b) : s(b, h, g);
        }, Z = () => {
          const X = b._isLeaving || !!b[Ds];
          b._isLeaving && b[Ds](
            !0
            /* cancelled */
          ), w.persisted && !X ? z() : x(b, () => {
            z(), H && H();
          });
        };
        U ? U(b, z, Z) : Z();
      }
    else
      s(b, h, g);
  }, F = (c, h, g, E = !1, m = !1) => {
    const {
      type: b,
      props: S,
      ref: w,
      children: N,
      dynamicChildren: y,
      shapeFlag: j,
      patchFlag: x,
      dirs: U,
      cacheIndex: H,
      memo: z
    } = c;
    if (x === -2 && (m = !1), w != null && (qe(), vn(w, null, g, c, !0), Ge()), H != null && (h.renderCache[H] = void 0), j & 256) {
      h.ctx.deactivate(c);
      return;
    }
    const Z = j & 1 && U, X = !Wt(c);
    let ue;
    if (X && (ue = S && S.onVnodeBeforeUnmount) && st(ue, h, c), j & 6)
      Fi(c.component, g, E);
    else {
      if (j & 128) {
        c.suspense.unmount(g, E);
        return;
      }
      Z && wt(c, null, h, "beforeUnmount"), j & 64 ? c.type.remove(
        c,
        h,
        g,
        nn,
        E
      ) : y && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !y.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (b !== se || x > 0 && x & 64) ? tn(
        y,
        h,
        g,
        !1,
        !0
      ) : (b === se && x & 384 || !m && j & 16) && tn(N, h, g), E && Ue(c);
    }
    const me = z != null && H == null;
    (X && (ue = S && S.onVnodeUnmounted) || Z || me) && xe(() => {
      ue && st(ue, h, c), Z && wt(c, null, h, "unmounted"), me && (c.el = null);
    }, g);
  }, Ue = (c) => {
    const { type: h, el: g, anchor: E, transition: m } = c;
    if (h === se) {
      process.env.NODE_ENV !== "production" && c.patchFlag > 0 && c.patchFlag & 2048 && m && !m.persisted ? c.children.forEach((S) => {
        S.type === $e ? o(S.el) : Ue(S);
      }) : Lt(g, E);
      return;
    }
    if (h === Kn) {
      A(c);
      return;
    }
    const b = () => {
      o(g), m && !m.persisted && m.afterLeave && m.afterLeave();
    };
    if (c.shapeFlag & 1 && m && !m.persisted) {
      const { leave: S, delayLeave: w } = m, N = () => S(g, b);
      w ? w(c.el, b, N) : N();
    } else
      b();
  }, Lt = (c, h) => {
    let g;
    for (; c !== h; )
      g = v(c), o(c), c = g;
    o(h);
  }, Fi = (c, h, g) => {
    process.env.NODE_ENV !== "production" && c.type.__hmrId && Fl(c);
    const { bum: E, scope: m, job: b, subTree: S, um: w, m: N, a: y } = c;
    Jo(N), Jo(y), E && Yt(E), m.stop(), b && (b.flags |= 8, F(S, c, h, g)), w && xe(w, h), xe(() => {
      c.isUnmounted = !0;
    }, h), process.env.NODE_ENV !== "production" && ql(c);
  }, tn = (c, h, g, E = !1, m = !1, b = 0) => {
    for (let S = b; S < c.length; S++)
      F(c[S], h, g, E, m);
  }, Pn = (c) => {
    if (c.shapeFlag & 6)
      return Pn(c.component.subTree);
    if (c.shapeFlag & 128)
      return c.suspense.next();
    const h = v(c.anchor || c.el), g = h && h[ta];
    return g ? v(g) : h;
  };
  let _s = !1;
  const wo = (c, h, g) => {
    let E;
    c == null ? h._vnode && (F(h._vnode, null, null, !0), E = h._vnode.component) : I(
      h._vnode || null,
      c,
      h,
      null,
      null,
      null,
      g
    ), h._vnode = c, _s || (_s = !0, Ro(E), Gr(), _s = !1);
  }, nn = {
    p: I,
    um: F,
    m: $,
    r: Ue,
    mt: Ze,
    mc: be,
    pc: Le,
    pbc: Xe,
    n: Pn,
    o: e
  };
  return {
    render: wo,
    hydrate: void 0,
    createApp: Oa(wo)
  };
}
function Vs({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function Ot({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Ga(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Bn(e, t, n = !1) {
  const s = e.children, o = t.children;
  if (L(s) && L(o))
    for (let r = 0; r < s.length; r++) {
      const i = s[r];
      let a = o[r];
      a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = o[r] = dt(o[r]), a.el = i.el), !n && a.patchFlag !== -2 && Bn(i, a)), a.type === An && (a.patchFlag === -1 && (a = o[r] = dt(a)), a.el = i.el), a.type === $e && !a.el && (a.el = i.el), process.env.NODE_ENV !== "production" && a.el && (a.el.__vnode = a);
    }
}
function za(e) {
  const t = e.slice(), n = [0];
  let s, o, r, i, a;
  const l = e.length;
  for (s = 0; s < l; s++) {
    const u = e[s];
    if (u !== 0) {
      if (o = n[n.length - 1], e[o] < u) {
        t[s] = o, n.push(s);
        continue;
      }
      for (r = 0, i = n.length - 1; r < i; )
        a = r + i >> 1, e[n[a]] < u ? r = a + 1 : i = a;
      u < e[n[r]] && (r > 0 && (t[s] = n[r - 1]), n[r] = s);
    }
  }
  for (r = n.length, i = n[r - 1]; r-- > 0; )
    n[r] = i, i = t[i];
  return n;
}
function wi(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : wi(t);
}
function Jo(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
function Oi(e) {
  if (e.placeholder)
    return e.placeholder;
  const t = e.component;
  return t ? Oi(t.subTree) : null;
}
const Si = (e) => e.__isSuspense;
function Ja(e, t) {
  t && t.pendingBranch ? L(e) ? t.effects.push(...e) : t.effects.push(e) : qr(e);
}
const se = /* @__PURE__ */ Symbol.for("v-fgt"), An = /* @__PURE__ */ Symbol.for("v-txt"), $e = /* @__PURE__ */ Symbol.for("v-cmt"), Kn = /* @__PURE__ */ Symbol.for("v-stc"), vt = [];
let Ie = null;
function C(e = !1) {
  vt.push(Ie = e ? null : []);
}
function go() {
  vt.pop(), Ie = vt[vt.length - 1] || null;
}
let Nn = 1;
function Qo(e, t = !1) {
  Nn += e, e < 0 && Ie && t && (Ie.hasOnce = !0);
}
function Ci(e) {
  return e.dynamicChildren = Nn > 0 ? Ie || Bt : null, go(), Nn > 0 && Ie && Ie.push(e), e;
}
function T(e, t, n, s, o, r) {
  return Ci(
    p(
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
function Ae(e, t, n, s, o) {
  return Ci(
    ve(
      e,
      t,
      n,
      s,
      o,
      !0
    )
  );
}
function Tn(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function ln(e, t) {
  if (process.env.NODE_ENV !== "production" && t.shapeFlag & 6 && e.component) {
    const n = Yn.get(t.type);
    if (n && n.has(e.component))
      return e.shapeFlag &= -257, t.shapeFlag &= -513, !1;
  }
  return e.type === t.type && e.key === t.key;
}
const Qa = (...e) => xi(
  ...e
), Di = ({ key: e }) => e ?? null, Wn = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? oe(e) || /* @__PURE__ */ ce(e) || Y(e) ? { i: he, r: e, k: t, f: !!n } : e : null);
function p(e, t = null, n = null, s = 0, o = null, r = e === se ? 0 : 1, i = !1, a = !1) {
  const l = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && Di(t),
    ref: t && Wn(t),
    scopeId: Zr,
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
    ctx: he
  };
  return a ? (ss(l, n), r & 128 && e.normalize(l)) : n && (l.shapeFlag |= oe(n) ? 8 : 16), process.env.NODE_ENV !== "production" && l.key !== l.key && O("VNode created with invalid key (NaN). VNode type:", l.type), Nn > 0 && // avoid a block node from tracking itself
  !i && // has current parent block
  Ie && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (l.patchFlag > 0 || r & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  l.patchFlag !== 32 && Ie.push(l), l;
}
const ve = process.env.NODE_ENV !== "production" ? Qa : xi;
function xi(e, t = null, n = null, s = 0, o = null, r = !1) {
  if ((!e || e === pa) && (process.env.NODE_ENV !== "production" && !e && O(`Invalid vnode type when creating vnode: ${e}.`), e = $e), Tn(e)) {
    const a = Nt(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && ss(a, n), Nn > 0 && !r && Ie && (a.shapeFlag & 6 ? Ie[Ie.indexOf(e)] = a : Ie.push(a)), a.patchFlag = -2, a;
  }
  if (Ri(e) && (e = e.__vccOpts), t) {
    t = Xa(t);
    let { class: a, style: l } = t;
    a && !oe(a) && (t.class = kt(a)), J(l) && (/* @__PURE__ */ Gn(l) && !L(l) && (l = re({}, l)), t.style = Xs(l));
  }
  const i = oe(e) ? 1 : Si(e) ? 128 : na(e) ? 64 : J(e) ? 4 : Y(e) ? 2 : 0;
  return process.env.NODE_ENV !== "production" && i & 4 && /* @__PURE__ */ Gn(e) && (e = /* @__PURE__ */ K(e), O(
    "Vue received a Component that was made a reactive object. This can lead to unnecessary performance overhead and should be avoided by marking the component with `markRaw` or using `shallowRef` instead of `ref`.",
    `
Component that was made reactive: `,
    e
  )), p(
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
function Xa(e) {
  return e ? /* @__PURE__ */ Gn(e) || bi(e) ? re({}, e) : e : null;
}
function Nt(e, t, n = !1, s = !1) {
  const { props: o, ref: r, patchFlag: i, children: a, transition: l } = e, u = t ? Za(o || {}, t) : o, f = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: u,
    key: u && Di(u),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && r ? L(r) ? r.concat(Wn(t)) : [r, Wn(t)] : Wn(t)
    ) : r,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: process.env.NODE_ENV !== "production" && i === -1 && L(a) ? a.map(Vi) : a,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: t && e.type !== se ? i === -1 ? 16 : i | 16 : i,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: l,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && Nt(e.ssContent),
    ssFallback: e.ssFallback && Nt(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return l && s && uo(
    f,
    l.clone(f)
  ), f;
}
function Vi(e) {
  const t = Nt(e);
  return L(e.children) && (t.children = e.children.map(Vi)), t;
}
function Ee(e = " ", t = 0) {
  return ve(An, null, e, t);
}
function ie(e = "", t = !1) {
  return t ? (C(), Ae($e, null, e)) : ve($e, null, e);
}
function He(e) {
  return e == null || typeof e == "boolean" ? ve($e) : L(e) ? ve(
    se,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : Tn(e) ? dt(e) : ve(An, null, String(e));
}
function dt(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : Nt(e);
}
function ss(e, t) {
  let n = 0;
  const { shapeFlag: s } = e;
  if (t == null)
    t = null;
  else if (L(t))
    n = 16;
  else if (typeof t == "object")
    if (s & 65) {
      const o = t.default;
      o && (o._c && (o._d = !1), ss(e, o()), o._c && (o._d = !0));
      return;
    } else {
      n = 32;
      const o = t._;
      !o && !bi(t) ? t._ctx = he : o === 3 && he && (he.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else if (Y(t)) {
    if (s & 65) {
      ss(e, { default: t });
      return;
    }
    t = { default: t, _ctx: he }, n = 32;
  } else
    t = String(t), s & 64 ? (n = 16, t = [Ee(t)]) : n = 8;
  e.children = t, e.shapeFlag |= n;
}
function Za(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const s = e[n];
    for (const o in s)
      if (o === "class")
        t.class !== s.class && (t.class = kt([t.class, s.class]));
      else if (o === "style")
        t.style = Xs([t.style, s.style]);
      else if (Sn(o)) {
        const r = t[o], i = s[o];
        i && r !== i && !(L(r) && r.includes(i)) ? t[o] = r ? [].concat(r, i) : i : i == null && r == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !mn(o) && (t[o] = i);
      } else o !== "" && (t[o] = s[o]);
  }
  return t;
}
function st(e, t, n, s = null) {
  Qe(e, t, 7, [
    n,
    s
  ]);
}
const eu = fi();
let tu = 0;
function nu(e, t, n) {
  const s = e.type, o = (t ? t.appContext : e.appContext) || eu, r = {
    uid: tu++,
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
    scope: new ol(
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
    propsOptions: yi(s, o),
    emitsOptions: di(s, o),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: te,
    // inheritAttrs
    inheritAttrs: s.inheritAttrs,
    // state
    ctx: te,
    data: te,
    props: te,
    attrs: te,
    slots: te,
    refs: te,
    setupState: te,
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
  return process.env.NODE_ENV !== "production" ? r.ctx = ha(r) : r.ctx = { _: r }, r.root = t ? t.root : r, r.emit = Ca.bind(null, r), e.ce && e.ce(r), r;
}
let fe = null;
const bo = () => fe || he;
let os, Bs;
{
  const e = Dn(), t = (n, s) => {
    let o;
    return (o = e[n]) || (o = e[n] = []), o.push(s), (r) => {
      o.length > 1 ? o.forEach((i) => i(r)) : o[0](r);
    };
  };
  os = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => fe = n
  ), Bs = t(
    "__VUE_SSR_SETTERS__",
    (n) => wn = n
  );
}
const Rn = (e) => {
  const t = fe;
  return os(e), e.scope.on(), () => {
    e.scope.off(), os(t);
  };
}, Xo = () => {
  fe && fe.scope.off(), os(null);
}, su = /* @__PURE__ */ bt("slot,component");
function Ks(e, { isNativeTag: t }) {
  (su(e) || t(e)) && O(
    "Do not use built-in or reserved HTML elements as component id: " + e
  );
}
function $i(e) {
  return e.vnode.shapeFlag & 4;
}
let wn = !1;
function ou(e, t = !1, n = !1) {
  t && Bs(t);
  const { props: s, children: o } = e.vnode, r = $i(e);
  Ta(e, s, r, t), Ha(e, o, n || t);
  const i = r ? ru(e, t) : void 0;
  return t && Bs(!1), i;
}
function ru(e, t) {
  const n = e.type;
  if (process.env.NODE_ENV !== "production") {
    if (n.name && Ks(n.name, e.appContext.config), n.components) {
      const o = Object.keys(n.components);
      for (let r = 0; r < o.length; r++)
        Ks(o[r], e.appContext.config);
    }
    if (n.directives) {
      const o = Object.keys(n.directives);
      for (let r = 0; r < o.length; r++)
        ei(o[r]);
    }
    n.compilerOptions && iu() && O(
      '"compilerOptions" is only supported when using a build of Vue that includes the runtime compiler. Since you are using a runtime-only build, the options should be passed via your build tool config instead.'
    );
  }
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, ai), process.env.NODE_ENV !== "production" && va(e);
  const { setup: s } = n;
  if (s) {
    qe();
    const o = e.setupContext = s.length > 1 ? au(e) : null, r = Rn(e), i = Xt(
      s,
      e,
      0,
      [
        process.env.NODE_ENV !== "production" ? /* @__PURE__ */ at(e.props) : e.props,
        o
      ]
    ), a = zs(i);
    if (Ge(), r(), (a || e.sp) && !Wt(e) && oi(e), a) {
      if (i.then(Xo, Xo), t)
        return i.then((l) => {
          Zo(e, l, t);
        }).catch((l) => {
          xn(l, e, 0);
        });
      if (e.asyncDep = i, process.env.NODE_ENV !== "production" && !e.suspense) {
        const l = In(e, n);
        O(
          `Component <${l}>: setup function returned a promise, but no <Suspense> boundary was found in the parent component tree. A component with async setup() must be nested in a <Suspense> in order to be rendered.`
        );
      }
    } else
      Zo(e, i, t);
  } else
    Ai(e, t);
}
function Zo(e, t, n) {
  Y(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : J(t) ? (process.env.NODE_ENV !== "production" && Tn(t) && O(
    "setup() should not return VNodes directly - return a render function instead."
  ), process.env.NODE_ENV !== "production" && (e.devtoolsRawSetupState = t), e.setupState = Hr(t), process.env.NODE_ENV !== "production" && ga(e)) : process.env.NODE_ENV !== "production" && t !== void 0 && O(
    `setup() should return an object. Received: ${t === null ? "null" : typeof t}`
  ), Ai(e, n);
}
const iu = () => !0;
function Ai(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || pe);
  {
    const o = Rn(e);
    qe();
    try {
      ma(e);
    } finally {
      Ge(), o();
    }
  }
  process.env.NODE_ENV !== "production" && !s.render && e.render === pe && !t && (s.template ? O(
    'Component provided template option but runtime compilation is not supported in this build of Vue. Configure your bundler to alias "vue" to "vue/dist/vue.esm-bundler.js".'
  ) : O("Component is missing template or render function: ", s));
}
const er = process.env.NODE_ENV !== "production" ? {
  get(e, t) {
    return ts(), de(e, "get", ""), e[t];
  },
  set() {
    return O("setupContext.attrs is readonly."), !1;
  },
  deleteProperty() {
    return O("setupContext.attrs is readonly."), !1;
  }
} : {
  get(e, t) {
    return de(e, "get", ""), e[t];
  }
};
function lu(e) {
  return new Proxy(e.slots, {
    get(t, n) {
      return de(e, "get", "$slots"), t[n];
    }
  });
}
function au(e) {
  const t = (n) => {
    if (process.env.NODE_ENV !== "production" && (e.exposed && O("expose() should be called only once per setup()."), n != null)) {
      let s = typeof n;
      s === "object" && (L(n) ? s = "array" : /* @__PURE__ */ ce(n) && (s = "ref")), s !== "object" && O(
        `expose() should be passed a plain object, received ${s}.`
      );
    }
    e.exposed = n || {};
  };
  if (process.env.NODE_ENV !== "production") {
    let n, s;
    return Object.freeze({
      get attrs() {
        return n || (n = new Proxy(e.attrs, er));
      },
      get slots() {
        return s || (s = lu(e));
      },
      get emit() {
        return (o, ...r) => e.emit(o, ...r);
      },
      expose: t
    });
  } else
    return {
      attrs: new Proxy(e.attrs, er),
      slots: e.slots,
      emit: e.emit,
      expose: t
    };
}
function ys(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(Hr(Ol(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in Tt)
        return Tt[n](e);
    },
    has(t, n) {
      return n in t || n in Tt;
    }
  })) : e.proxy;
}
const uu = /(?:^|[-_])\w/g, cu = (e) => e.replace(uu, (t) => t.toUpperCase()).replace(/[-_]/g, "");
function Ti(e, t = !0) {
  return Y(e) ? e.displayName || e.name : e.name || t && e.__name;
}
function In(e, t, n = !1) {
  let s = Ti(t);
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
  return s ? cu(s) : n ? "App" : "Anonymous";
}
function Ri(e) {
  return Y(e) && "__vccOpts" in e;
}
const kn = (e, t) => {
  const n = /* @__PURE__ */ Vl(e, t, wn);
  if (process.env.NODE_ENV !== "production") {
    const s = bo();
    s && s.appContext.config.warnRecursiveComputed && (n._warnRecursive = !0);
  }
  return n;
};
function fu() {
  if (process.env.NODE_ENV === "production" || typeof window > "u")
    return;
  const e = { style: "color:#3ba776" }, t = { style: "color:#1677ff" }, n = { style: "color:#f5222d" }, s = { style: "color:#eb2f96" }, o = {
    __vue_custom_formatter: !0,
    header(d) {
      if (!J(d))
        return null;
      if (d.__isVue)
        return ["div", e, "VueInstance"];
      if (/* @__PURE__ */ ce(d)) {
        qe();
        const v = d.value;
        return Ge(), [
          "div",
          {},
          ["span", e, f(d)],
          "<",
          a(v),
          ">"
        ];
      } else {
        if (/* @__PURE__ */ Et(d))
          return [
            "div",
            {},
            ["span", e, /* @__PURE__ */ De(d) ? "ShallowReactive" : "Reactive"],
            "<",
            a(d),
            `>${/* @__PURE__ */ ze(d) ? " (readonly)" : ""}`
          ];
        if (/* @__PURE__ */ ze(d))
          return [
            "div",
            {},
            ["span", e, /* @__PURE__ */ De(d) ? "ShallowReadonly" : "Readonly"],
            "<",
            a(d),
            ">"
          ];
      }
      return null;
    },
    hasBody(d) {
      return d && d.__isVue;
    },
    body(d) {
      if (d && d.__isVue)
        return [
          "div",
          {},
          ...r(d.$)
        ];
    }
  };
  function r(d) {
    const v = [];
    d.type.props && d.props && v.push(i("props", /* @__PURE__ */ K(d.props))), d.setupState !== te && v.push(i("setup", d.setupState)), d.data !== te && v.push(i("data", /* @__PURE__ */ K(d.data)));
    const _ = l(d, "computed");
    _ && v.push(i("computed", _));
    const k = l(d, "inject");
    return k && v.push(i("injected", k)), v.push([
      "div",
      {},
      [
        "span",
        {
          style: s.style + ";opacity:0.66"
        },
        "$ (internal): "
      ],
      ["object", { object: d }]
    ]), v;
  }
  function i(d, v) {
    return v = re({}, v), Object.keys(v).length ? [
      "div",
      { style: "line-height:1.25em;margin-bottom:0.6em" },
      [
        "div",
        {
          style: "color:#476582"
        },
        d
      ],
      [
        "div",
        {
          style: "padding-left:1.25em"
        },
        ...Object.keys(v).map((_) => [
          "div",
          {},
          ["span", s, _ + ": "],
          a(v[_], !1)
        ])
      ]
    ] : ["span", {}];
  }
  function a(d, v = !0) {
    return typeof d == "number" ? ["span", t, d] : typeof d == "string" ? ["span", n, JSON.stringify(d)] : typeof d == "boolean" ? ["span", s, d] : J(d) ? ["object", { object: v ? /* @__PURE__ */ K(d) : d }] : ["span", n, String(d)];
  }
  function l(d, v) {
    const _ = d.type;
    if (Y(_))
      return;
    const k = {};
    for (const I in d.ctx)
      u(_, I, v) && (k[I] = d.ctx[I]);
    return k;
  }
  function u(d, v, _) {
    const k = d[_];
    if (L(k) && k.includes(v) || J(k) && v in k || d.extends && u(d.extends, v, _) || d.mixins && d.mixins.some((I) => u(I, v, _)))
      return !0;
  }
  function f(d) {
    return /* @__PURE__ */ De(d) ? "ShallowRef" : d.effect ? "ComputedRef" : "Ref";
  }
  window.devtoolsFormatters ? window.devtoolsFormatters.push(o) : window.devtoolsFormatters = [o];
}
const tr = "3.5.40", ke = process.env.NODE_ENV !== "production" ? O : pe;
process.env.NODE_ENV;
process.env.NODE_ENV;
/**
* @vue/runtime-dom v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let Ws;
const nr = typeof window < "u" && window.trustedTypes;
if (nr)
  try {
    Ws = /* @__PURE__ */ nr.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch (e) {
    process.env.NODE_ENV !== "production" && ke(`Error creating trusted types policy: ${e}`);
  }
const Ii = Ws ? (e) => Ws.createHTML(e) : (e) => e, du = "http://www.w3.org/2000/svg", pu = "http://www.w3.org/1998/Math/MathML", ct = typeof document < "u" ? document : null, sr = ct && /* @__PURE__ */ ct.createElement("template"), hu = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const o = t === "svg" ? ct.createElementNS(du, e) : t === "mathml" ? ct.createElementNS(pu, e) : n ? ct.createElement(e, { is: n }) : ct.createElement(e);
    return e === "select" && s && s.multiple != null && o.setAttribute("multiple", s.multiple), o;
  },
  createText: (e) => ct.createTextNode(e),
  createComment: (e) => ct.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => ct.querySelector(e),
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
      sr.innerHTML = Ii(
        s === "svg" ? `<svg>${e}</svg>` : s === "mathml" ? `<math>${e}</math>` : e
      );
      const a = sr.content;
      if (s === "svg" || s === "mathml") {
        const l = a.firstChild;
        for (; l.firstChild; )
          a.appendChild(l.firstChild);
        a.removeChild(l);
      }
      t.insertBefore(a, n);
    }
    return [
      // first
      i ? i.nextSibling : t.firstChild,
      // last
      n ? n.previousSibling : t.lastChild
    ];
  }
}, vu = /* @__PURE__ */ Symbol("_vtc");
function gu(e, t, n) {
  const s = e[vu];
  s && (t = (t ? [t, ...s] : [...s]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const rs = /* @__PURE__ */ Symbol("_vod"), ki = /* @__PURE__ */ Symbol("_vsh"), bu = {
  // used for prop mismatch check during hydration
  name: "show",
  beforeMount(e, { value: t }, { transition: n }) {
    e[rs] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : an(e, t);
  },
  mounted(e, { value: t }, { transition: n }) {
    n && t && n.enter(e);
  },
  updated(e, { value: t, oldValue: n }, { transition: s }) {
    !t != !n && (s ? t ? (s.beforeEnter(e), an(e, !0), s.enter(e)) : s.leave(e, () => {
      an(e, !1);
    }) : an(e, t));
  },
  beforeUnmount(e, { value: t }) {
    an(e, t);
  }
};
function an(e, t) {
  e.style.display = t ? e[rs] : "none", e[ki] = !t;
}
const mu = /* @__PURE__ */ Symbol(process.env.NODE_ENV !== "production" ? "CSS_VAR_TEXT" : ""), yu = /(?:^|;)\s*display\s*:/;
function _u(e, t, n) {
  const s = e.style, o = oe(n);
  let r = !1;
  if (n && !o) {
    if (t)
      if (oe(t))
        for (const i of t.split(";")) {
          const a = i.slice(0, i.indexOf(":")).trim();
          n[a] == null && fn(s, a, "");
        }
      else
        for (const i in t)
          n[i] == null && fn(s, i, "");
    for (const i in n) {
      i === "display" && (r = !0);
      const a = n[i];
      a != null ? wu(
        e,
        i,
        !oe(t) && t ? t[i] : void 0,
        a
      ) || fn(s, i, a) : fn(s, i, "");
    }
  } else if (o) {
    if (t !== n) {
      const i = s[mu];
      i && (n += ";" + i), s.cssText = n, r = yu.test(n);
    }
  } else t && e.removeAttribute("style");
  rs in e && (e[rs] = r ? s.display : "", e[ki] && (s.display = "none"));
}
const Eu = /[^\\];\s*$/, or = /\s*!important$/;
function fn(e, t, n) {
  if (L(n))
    n.forEach((s) => fn(e, t, s));
  else if (n == null && (n = ""), process.env.NODE_ENV !== "production" && Eu.test(n) && ke(
    `Unexpected semicolon at the end of '${t}' style value: '${n}'`
  ), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = Nu(e, t);
    or.test(n) ? e.setProperty(
      Te(s),
      n.replace(or, ""),
      "important"
    ) : e[s] = n;
  }
}
const rr = ["Webkit", "Moz", "ms"], $s = {};
function Nu(e, t) {
  const n = $s[t];
  if (n)
    return n;
  let s = _e(t);
  if (s !== "filter" && s in e)
    return $s[t] = s;
  s = cs(s);
  for (let o = 0; o < rr.length; o++) {
    const r = rr[o] + s;
    if (r in e)
      return $s[t] = r;
  }
  return t;
}
function wu(e, t, n, s) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && oe(s) && n === s;
}
const ir = "http://www.w3.org/1999/xlink";
function lr(e, t, n, s, o, r = nl(t)) {
  s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(ir, t.slice(6, t.length)) : e.setAttributeNS(ir, t, n) : n == null || r && !wr(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    r ? "" : Fe(n) ? String(n) : n
  );
}
function ar(e, t, n, s, o) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? Ii(n) : n);
    return;
  }
  const r = e.tagName;
  if (t === "value" && r !== "PROGRESS" && // custom elements may use _value internally
  !r.includes("-")) {
    const a = r === "OPTION" ? e.getAttribute("value") || "" : e.value, l = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(n);
    (a !== l || !("_value" in e)) && (e.value = l), n == null && e.removeAttribute(t), e._value = n;
    return;
  }
  let i = !1;
  if (n === "" || n == null) {
    const a = typeof e[t];
    a === "boolean" ? n = wr(n) : n == null && a === "string" ? (n = "", i = !0) : a === "number" && (n = 0, i = !0);
  }
  try {
    e[t] = n;
  } catch (a) {
    process.env.NODE_ENV !== "production" && !i && ke(
      `Failed setting prop "${t}" on <${r.toLowerCase()}>: value ${n} is invalid.`,
      a
    );
  }
  i && e.removeAttribute(o || t);
}
function _t(e, t, n, s) {
  e.addEventListener(t, n, s);
}
function Ou(e, t, n, s) {
  e.removeEventListener(t, n, s);
}
const ur = /* @__PURE__ */ Symbol("_vei");
function Su(e, t, n, s, o = null) {
  const r = e[ur] || (e[ur] = {}), i = r[t];
  if (s && i)
    i.value = process.env.NODE_ENV !== "production" ? cr(s, t) : s;
  else {
    const [a, l] = xu(t);
    if (s) {
      const u = r[t] = Au(
        process.env.NODE_ENV !== "production" ? cr(s, t) : s,
        o
      );
      _t(e, a, u, l);
    } else i && (Ou(e, a, i, l), r[t] = void 0);
  }
}
const Cu = /(Once|Passive|Capture)$/, Du = /^on:?(?:Once|Passive|Capture)$/;
function xu(e) {
  let t, n;
  for (; (n = e.match(Cu)) && !Du.test(e); )
    t || (t = {}), e = e.slice(0, e.length - n[1].length), t[n[1].toLowerCase()] = !0;
  return [e[2] === ":" ? e.slice(3) : Te(e.slice(2)), t];
}
let As = 0;
const Vu = /* @__PURE__ */ Promise.resolve(), $u = () => As || (Vu.then(() => As = 0), As = Date.now());
function Au(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    const o = n.value;
    if (L(o)) {
      const r = s.stopImmediatePropagation;
      s.stopImmediatePropagation = () => {
        r.call(s), s._stopped = !0;
      };
      const i = o.slice(), a = [s];
      for (let l = 0; l < i.length && !s._stopped; l++) {
        const u = i[l];
        u && Qe(
          u,
          t,
          5,
          a
        );
      }
    } else
      Qe(
        o,
        t,
        5,
        [s]
      );
  };
  return n.value = e, n.attached = $u(), n;
}
function cr(e, t) {
  return Y(e) || L(e) ? e : (ke(
    `Wrong type passed as event handler to ${t} - did you forget @ or : in front of your prop?
Expected function or array of functions, received type ${typeof e}.`
  ), pe);
}
const fr = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Tu = (e, t, n, s, o, r) => {
  const i = o === "svg";
  t === "class" ? gu(e, s, i) : t === "style" ? _u(e, n, s) : Sn(t) ? mn(t) || Su(e, t, n, s, r) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Ru(e, t, s, i)) ? (ar(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && lr(e, t, s, i, r, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (Iu(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !oe(s))) ? ar(e, _e(t), s, r, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), lr(e, t, s, i));
};
function Ru(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && fr(t) && Y(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const o = e.tagName;
    if (o === "IMG" || o === "VIDEO" || o === "CANVAS" || o === "SOURCE")
      return !1;
  }
  return fr(t) && oe(n) ? !1 : t in e;
}
function Iu(e, t) {
  const n = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!n)
    return !1;
  const s = _e(t);
  return Array.isArray(n) ? n.some((o) => _e(o) === s) : Object.keys(n).some((o) => _e(o) === s);
}
const dr = {};
// @__NO_SIDE_EFFECTS__
function ku(e, t, n) {
  let s = /* @__PURE__ */ Pe(e, t);
  as(s) && (s = re({}, s, t));
  class o extends mo {
    constructor(i) {
      super(s, i, n);
    }
  }
  return o.def = s, o;
}
const Pu = typeof HTMLElement < "u" ? HTMLElement : class {
};
class mo extends Pu {
  constructor(t, n = {}, s = mr) {
    super(), this._def = t, this._props = n, this._createApp = s, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && s !== mr ? this._root = this.shadowRoot : (process.env.NODE_ENV !== "production" && this.shadowRoot && ke(
      "Custom element has pre-rendered declarative shadow root but is not defined as hydratable. Use `defineSSRCustomElement`."
    ), t.shadowRoot !== !1 ? (this.attachShadow(
      re({}, t.shadowRootOptions, {
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
      if (t instanceof mo) {
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
    this._connected = !1, Vn(() => {
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
      let a;
      if (r && !L(r))
        for (const l in r) {
          const u = r[l];
          (u === Number || u && u.type === Number) && (l in this._props && (this._props[l] = xo(this._props[l])), (a || (a = /* @__PURE__ */ Object.create(null)))[_e(l)] = !0);
        }
      this._numberProps = a, this._resolveProps(s), this.shadowRoot ? this._applyStyles(i) : process.env.NODE_ENV !== "production" && i && ke(
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
        G(this, s) ? process.env.NODE_ENV !== "production" && ke(`Exposed property "${s}" already exists on custom element.`) : Object.defineProperty(this, s, {
          // unwrap ref to be consistent with public instance behavior
          get: () => Yr(n[s])
        });
  }
  _resolveProps(t) {
    const { props: n } = t, s = L(n) ? n : Object.keys(n || {});
    for (const o of Object.keys(this))
      o[0] !== "_" && s.includes(o) && this._setProp(o, this[o]);
    for (const o of s.map(_e))
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
    let s = n ? this.getAttribute(t) : dr;
    const o = _e(t);
    n && this._numberProps && this._numberProps[o] && (s = xo(s)), this._setProp(o, s, !1, !0);
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
    if (n !== this._props[t] && (this._dirty = !0, n === dr ? delete this._props[t] : (this._props[t] = n, t === "key" && this._app && (this._app._ceVNode.key = n)), o && this._instance && this._update(), s)) {
      const r = this._ob;
      r && (this._processMutations(r.takeRecords()), r.disconnect()), n === !0 ? this.setAttribute(Te(t), "") : typeof n == "string" || typeof n == "number" ? this.setAttribute(Te(t), n + "") : n || this.removeAttribute(Te(t)), r && r.observe(this, { attributes: !0 });
    }
  }
  _update() {
    const t = this._createVNode();
    this._app && (t.appContext = this._app._context), ju(t, this._root);
  }
  _createVNode() {
    const t = {};
    this.shadowRoot || (t.onVnodeMounted = t.onVnodeUpdated = this._renderSlots.bind(this));
    const n = ve(this._def, re(t, this._props));
    return this._instance || (n.ce = (s) => {
      this._instance = s, s.ce = this, s.isCE = !0, process.env.NODE_ENV !== "production" && (s.ceReload = (r) => {
        this._styles && (this._styles.forEach((i) => this._root.removeChild(i)), this._styles.length = 0), this._styleAnchors.delete(this._def), this._applyStyles(r), this._instance = null, this._update();
      });
      const o = (r, i) => {
        this.dispatchEvent(
          new CustomEvent(
            r,
            as(i[0]) ? re({ detail: i }, i[0]) : { detail: i }
          )
        );
      };
      s.emit = (r, ...i) => {
        o(r, i), Te(r) !== r && o(Te(r), i);
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
    let a = null;
    for (let l = t.length - 1; l >= 0; l--) {
      const u = document.createElement("style");
      if (o && u.setAttribute("nonce", o), u.textContent = t[l], r.insertBefore(u, a || i), a = u, l === 0 && (s || this._styleAnchors.set(this._def, u), n && this._styleAnchors.set(n, u)), process.env.NODE_ENV !== "production")
        if (n) {
          if (n.__hmrId) {
            this._childStyles || (this._childStyles = /* @__PURE__ */ new Map());
            let f = this._childStyles.get(n.__hmrId);
            f || this._childStyles.set(n.__hmrId, f = []), f.push(u);
          }
        } else
          (this._styles || (this._styles = [])).push(u);
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
      const o = t[s], r = o.getAttribute("name") || "default", i = this._slots[r], a = o.parentNode;
      if (i)
        for (const l of i) {
          if (n && l.nodeType === 1) {
            const u = n + "-s", f = document.createTreeWalker(l, 1);
            l.setAttribute(u, "");
            let d;
            for (; d = f.nextNode(); )
              d.setAttribute(u, "");
          }
          a.insertBefore(l, o);
        }
      else
        for (; o.firstChild; ) a.insertBefore(o.firstChild, o);
      a.removeChild(o);
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
const zt = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return L(t) ? (n) => Yt(t, n) : t;
};
function Mu(e) {
  e.target.composing = !0;
}
function pr(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const gt = /* @__PURE__ */ Symbol("_assign");
function hr(e, t, n) {
  return t && (e = e.trim()), n && (e = fs(e)), e;
}
const Lu = {
  created(e, { modifiers: { lazy: t, trim: n, number: s } }, o) {
    e[gt] = zt(o);
    const r = s || o.props && o.props.type === "number";
    _t(e, t ? "change" : "input", (i) => {
      i.target.composing || e[gt](hr(e.value, n, r));
    }), (n || r) && _t(e, "change", () => {
      e.value = hr(e.value, n, r);
    }), t || (_t(e, "compositionstart", Mu), _t(e, "compositionend", pr), _t(e, "change", pr));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: s, trim: o, number: r } }, i) {
    if (e[gt] = zt(i), e.composing) return;
    const a = (r || e.type === "number") && !/^0\d/.test(e.value) ? fs(e.value) : e.value, l = t ?? "";
    if (a === l)
      return;
    const u = e.getRootNode();
    (u instanceof Document || u instanceof ShadowRoot) && u.activeElement === e && e.type !== "range" && (s && t === n || o && e.value.trim() === l) || (e.value = l);
  }
}, is = {
  // #4096 array checkboxes need to be deep traversed
  deep: !0,
  created(e, t, n) {
    e[gt] = zt(n), _t(e, "change", () => {
      const s = e._modelValue, o = On(e), r = e.checked, i = e[gt];
      if (L(s)) {
        const a = Zs(s, o), l = a !== -1;
        if (r && !l)
          i(s.concat(o));
        else if (!r && l) {
          const u = [...s];
          u.splice(a, 1), i(u);
        }
      } else if (Jt(s)) {
        const a = new Set(s);
        r ? a.add(o) : a.delete(o), i(a);
      } else
        i(Pi(e, r));
    });
  },
  // set initial checked on mount to wait for true-value/false-value
  mounted: vr,
  beforeUpdate(e, t, n) {
    e[gt] = zt(n), vr(e, t, n);
  }
};
function vr(e, { value: t, oldValue: n }, s) {
  e._modelValue = t;
  let o;
  if (L(t))
    o = Zs(t, s.props.value) > -1;
  else if (Jt(t))
    o = t.has(s.props.value);
  else {
    if (t === n) return;
    o = Qt(t, Pi(e, !0));
  }
  e.checked !== o && (e.checked = o);
}
const Uu = {
  // <select multiple> value need to be deep traversed
  deep: !0,
  created(e, { value: t, modifiers: { number: n } }, s) {
    e._modelValue = t, _t(e, "change", () => {
      const o = Array.prototype.filter.call(e.options, (r) => r.selected).map(
        (r) => n ? fs(On(r)) : On(r)
      );
      e[gt](
        e.multiple ? Jt(e._modelValue) ? new Set(o) : o : o[0]
      ), e._assigning = !0, Vn(() => {
        e._assigning = !1;
      });
    }), e[gt] = zt(s);
  },
  // set value in mounted & updated because <select> relies on its children
  // <option>s.
  mounted(e, { value: t }) {
    gr(e, t);
  },
  beforeUpdate(e, { value: t }, n) {
    e._modelValue = t, e[gt] = zt(n);
  },
  updated(e, { value: t }) {
    e._assigning || gr(e, t);
  }
};
function gr(e, t) {
  const n = e.multiple, s = L(t);
  if (n && !s && !Jt(t)) {
    process.env.NODE_ENV !== "production" && ke(
      `<select multiple v-model> expects an Array or Set value for its binding, but got ${Object.prototype.toString.call(t).slice(8, -1)}.`
    );
    return;
  }
  for (let o = 0, r = e.options.length; o < r; o++) {
    const i = e.options[o], a = On(i);
    if (n)
      if (s) {
        const l = typeof a;
        l === "string" || l === "number" ? i.selected = t.some((u) => String(u) === String(a)) : i.selected = Zs(t, a) > -1;
      } else
        i.selected = t.has(a);
    else if (Qt(On(i), t)) {
      e.selectedIndex !== o && (e.selectedIndex = o);
      return;
    }
  }
  !n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
}
function On(e) {
  return "_value" in e ? e._value : e.value;
}
function Pi(e, t) {
  const n = t ? "_trueValue" : "_falseValue";
  return n in e ? e[n] : t;
}
const Fu = /* @__PURE__ */ re({ patchProp: Tu }, hu);
let br;
function Mi() {
  return br || (br = Wa(Fu));
}
const ju = ((...e) => {
  Mi().render(...e);
}), mr = ((...e) => {
  const t = Mi().createApp(...e);
  process.env.NODE_ENV !== "production" && (Hu(t), Bu(t));
  const { mount: n } = t;
  return t.mount = (s) => {
    const o = Ku(s);
    if (!o) return;
    const r = t._component;
    !Y(r) && !r.render && !r.template && (r.template = o.innerHTML), o.nodeType === 1 && (o.textContent = "");
    const i = n(o, !1, Yu(o));
    return o instanceof Element && (o.removeAttribute("v-cloak"), o.setAttribute("data-v-app", "")), i;
  }, t;
});
function Yu(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function Hu(e) {
  Object.defineProperty(e.config, "isNativeTag", {
    value: (t) => Xi(t) || Zi(t) || el(t),
    writable: !1
  });
}
function Bu(e) {
  {
    const t = e.config.isCustomElement;
    Object.defineProperty(e.config, "isCustomElement", {
      get() {
        return t;
      },
      set() {
        ke(
          "The `isCustomElement` config option is deprecated. Use `compilerOptions.isCustomElement` instead."
        );
      }
    });
    const n = e.config.compilerOptions, s = 'The `compilerOptions` config option is only respected when using a build of Vue.js that includes the runtime compiler (aka "full build"). Since you are using the runtime-only build, `compilerOptions` must be passed to `@vue/compiler-dom` in the build setup instead.\n- For vue-loader: pass it via vue-loader\'s `compilerOptions` loader option.\n- For vue-cli: see https://cli.vuejs.org/guide/webpack.html#modifying-options-of-a-loader\n- For vite: pass it via @vitejs/plugin-vue options. See https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue#example-for-passing-options-to-vuecompiler-sfc';
    Object.defineProperty(e.config, "compilerOptions", {
      get() {
        return ke(s), n;
      },
      set() {
        ke(s);
      }
    });
  }
}
function Ku(e) {
  if (oe(e)) {
    const t = document.querySelector(e);
    return process.env.NODE_ENV !== "production" && !t && ke(
      `Failed to mount app: mount target selector "${e}" returned null.`
    ), t;
  }
  return process.env.NODE_ENV !== "production" && window.ShadowRoot && e instanceof window.ShadowRoot && e.mode === "closed" && ke(
    'mounting on a ShadowRoot with `{mode: "closed"}` may lead to unpredictable bugs'
  ), e;
}
/**
* vue v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function Wu() {
  fu();
}
process.env.NODE_ENV !== "production" && Wu();
const qu = 8e3, Gu = 2e3, yr = 1e6, Ve = "Unable to complete this request.", _r = "Request timed out.", gn = "Request cancelled.", Li = `
  state pid version bindAddress port ready healthMessage uptimeSeconds
`, Ui = `
  plugin { enabled bindMode customHost port authMode tailscaleServe tailscaleHostname logLevel updateChannel }
  services { service enabled baseUrl username hasPassword hasApiKey extra { key value } }
`, yo = `
  config { ${Ui} }
  changed restarted rolledBack error
`, zu = `query YarrRuntime { yarrRuntime { ${Li} } }`, Ju = `query YarrConfig { yarrConfig { ${Ui} } }`, Qu = `mutation SaveYarrConfig($input: SaveYarrConfigInput!) {
  saveYarrConfig(input: $input) { ${yo} }
}`, Xu = `mutation ControlYarr($action: YarrControlAction!) {
  controlYarr(action: $action) { ${Li} }
}`, Zu = `query YarrDiscoveredServices {
  yarrDiscoveredServices {
    discoveryId
    candidates { candidateId source serviceId confidence reasons baseUrl hasCredential }
    errors { code message }
  }
}`, ec = `query YarrLogs($lines: Int) {
  yarrLogs(lines: $lines) { lines truncated }
}`, _o = `
  installedVersion packagedVersion availableVersion updateAvailable usingOverlay rolledBack message
`, tc = `query YarrUpdateStatus { yarrUpdateStatus { ${_o} } }`, nc = `mutation PreviewYarrImport($input: PreviewYarrImportInput!) {
  previewYarrImport(input: $input) {
    previewId mappings { serviceId baseUrl hasUsername hasPassword hasApiKey } warnings
  }
}`, sc = `mutation ApplyYarrImport($input: ApplyYarrImportInput!) {
  applyYarrImport(input: $input) { ${yo} }
}`, oc = `mutation ApplyYarrDiscovery($input: ApplyYarrDiscoveryInput!) {
  applyYarrDiscovery(input: $input) { ${yo} }
}`, rc = `mutation UpdateYarrBinary($version: String!) {
  updateYarrBinary(version: $version) { ${_o} }
}`, ic = `mutation ResetYarrBinary {
  resetYarrBinary { ${_o} }
}`;
function Eo(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
function bn(e) {
  return new DOMException(e, "AbortError");
}
async function lc(e) {
  if (window.csrf_token || e.aborted) {
    if (e.aborted) throw bn(gn);
    return;
  }
  await new Promise((t, n) => {
    const s = window.setInterval(() => {
      window.csrf_token && i(t);
    }, 20), o = window.setTimeout(() => i(t), Gu), r = () => i(() => n(bn(gn))), i = (a) => {
      window.clearInterval(s), window.clearTimeout(o), e.removeEventListener("abort", r), a();
    };
    e.addEventListener("abort", r, { once: !0 });
  });
}
async function ac(e) {
  const t = e.body;
  if (!t) throw new Error(Ve);
  const n = e.headers.get("content-length");
  if (n && /^(?:0|[1-9]\d*)$/.test(n)) {
    const l = Number(n);
    if (Number.isSafeInteger(l) && l > yr) {
      try {
        await t.cancel();
      } catch {
      }
      throw new Error(Ve);
    }
  }
  const s = t.getReader(), o = [];
  let r = 0;
  try {
    for (; ; ) {
      const { done: l, value: u } = await s.read();
      if (l) break;
      if (r += u.byteLength, r > yr) {
        try {
          await s.cancel();
        } catch {
        }
        throw new Error(Ve);
      }
      o.push(u);
    }
  } catch (l) {
    throw l instanceof Error && l.message === Ve ? l : new Error(Ve);
  } finally {
    s.releaseLock();
  }
  const i = new Uint8Array(r);
  let a = 0;
  for (const l of o)
    i.set(l, a), a += l.byteLength;
  try {
    const l = JSON.parse(new TextDecoder("utf-8", { fatal: !0 }).decode(i));
    if (!Eo(l)) throw new Error(Ve);
    return l;
  } catch {
    throw new Error(Ve);
  }
}
async function uc(e) {
  if (e)
    try {
      await e.cancel();
    } catch {
    }
}
async function je(e, t, n) {
  const s = new AbortController();
  let o = !1, r = !1;
  const i = window.setTimeout(() => {
    o = !0, s.abort(bn(_r));
  }, qu), a = () => s.abort(bn(gn));
  n != null && n.aborted ? a() : n == null || n.addEventListener("abort", a, { once: !0 });
  try {
    if (await lc(s.signal), s.signal.aborted) throw bn(gn);
    const l = await fetch("/graphql", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": window.csrf_token ?? ""
      },
      body: JSON.stringify({ query: e, variables: t }),
      signal: s.signal
    });
    if (!l.ok)
      throw r = !0, await uc(l.body), s.abort(), new Error(Ve);
    const u = await ac(l);
    if (Array.isArray(u.errors) && u.errors.length > 0) throw new Error(Ve);
    if (!Eo(u.data)) throw new Error(Ve);
    return u.data;
  } catch (l) {
    throw o ? new Error(_r) : r ? new Error(Ve) : s.signal.aborted ? new Error(gn) : l instanceof Error && l.message === Ve ? l : new Error(Ve);
  } finally {
    window.clearTimeout(i), n == null || n.removeEventListener("abort", a);
  }
}
function Ye(e, t) {
  const n = e[t];
  if (!Eo(n)) throw new Error(Ve);
  return n;
}
async function cc(e) {
  return Ye(await je(zu, void 0, e), "yarrRuntime");
}
async function fc(e) {
  return Ye(await je(Ju, void 0, e), "yarrConfig");
}
async function dc(e, t) {
  return Ye(
    await je(Qu, { input: e }, t),
    "saveYarrConfig"
  );
}
async function pc(e, t) {
  return Ye(
    await je(Xu, { action: e }, t),
    "controlYarr"
  );
}
async function hc(e) {
  return Ye(
    await je(Zu, void 0, e),
    "yarrDiscoveredServices"
  );
}
async function vc(e, t) {
  const n = Math.max(1, Math.min(500, Math.trunc(e)));
  return Ye(
    await je(ec, { lines: n }, t),
    "yarrLogs"
  );
}
async function gc(e) {
  return Ye(
    await je(tc, void 0, e),
    "yarrUpdateStatus"
  );
}
async function bc(e, t) {
  return Ye(
    await je(nc, { input: { text: e } }, t),
    "previewYarrImport"
  );
}
async function mc(e, t) {
  return Ye(
    await je(sc, { input: e }, t),
    "applyYarrImport"
  );
}
async function yc(e, t) {
  return Ye(
    await je(oc, { input: e }, t),
    "applyYarrDiscovery"
  );
}
async function _c(e, t) {
  return Ye(
    await je(rc, { version: e }, t),
    "updateYarrBinary"
  );
}
async function Ec(e) {
  return Ye(
    await je(ic, void 0, e),
    "resetYarrBinary"
  );
}
const Nc = {
  key: 0,
  class: "yarr-dialog-backdrop"
}, wc = ["aria-busy"], Oc = { class: "yarr-dialog__header" }, Sc = ["disabled"], Cc = { class: "yarr-dialog__body" }, Dc = {
  key: 0,
  class: "yarr-dialog__footer"
}, No = /* @__PURE__ */ Pe({
  __name: "AccessibleDialog",
  props: {
    open: { type: Boolean },
    title: {},
    busy: { type: Boolean, default: !1 }
  },
  emits: ["close"],
  setup(e, { emit: t }) {
    const n = e, s = t, o = /* @__PURE__ */ B(), r = `yarr-dialog-${si()}`;
    let i = null;
    function a(u) {
      u.key === "Escape" && !n.busy && (u.preventDefault(), s("close"));
    }
    function l() {
      document.removeEventListener("keydown", a);
    }
    return At(() => n.open, async (u) => {
      var d;
      if (l(), !u) {
        i == null || i.focus(), i = null;
        return;
      }
      i = document.activeElement instanceof HTMLElement ? document.activeElement : null, document.addEventListener("keydown", a), await Vn();
      const f = (d = o.value) == null ? void 0 : d.querySelector("[data-autofocus], button, input, select, textarea, a[href]");
      f == null || f.focus();
    }), Pt(() => {
      l(), i == null || i.focus();
    }), (u, f) => e.open ? (C(), T("div", Nc, [
      p("section", {
        ref_key: "panel",
        ref: o,
        class: "yarr-dialog",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": r,
        "aria-busy": e.busy
      }, [
        p("header", Oc, [
          p("h2", { id: r }, M(e.title), 1),
          p("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            "aria-label": "Close dialog",
            onClick: f[0] || (f[0] = (d) => s("close"))
          }, "Close", 8, Sc)
        ]),
        p("div", Cc, [
          Uo(u.$slots, "default")
        ]),
        u.$slots.footer ? (C(), T("footer", Dc, [
          Uo(u.$slots, "footer")
        ])) : ie("", !0)
      ], 8, wc)
    ])) : ie("", !0);
  }
}), xc = {
  key: 0,
  role: "status"
}, Vc = {
  key: 1,
  class: "yarr-error",
  role: "alert"
}, $c = ["disabled"], Ac = {
  key: 0,
  class: "yarr-warning-list"
}, Tc = {
  key: 1,
  class: "yarr-empty"
}, Rc = ["name", "value", "disabled"], Ic = ["onUpdate:modelValue", "disabled"], kc = ["disabled"], Pc = ["disabled"], Mc = /* @__PURE__ */ Pe({
  __name: "DiscoveryDialog",
  props: {
    open: { type: Boolean }
  },
  emits: ["close", "applied"],
  setup(e, { emit: t }) {
    const n = e, s = t, o = /* @__PURE__ */ B(), r = /* @__PURE__ */ B([]), i = /* @__PURE__ */ B({}), a = /* @__PURE__ */ B(!1), l = /* @__PURE__ */ B("");
    let u, f = 0;
    const d = kn(() => r.value.length > 0 && !a.value);
    function v(R) {
      return R === "sabnzbd" ? "SABnzbd" : R === "qbittorrent" ? "qBittorrent" : R.charAt(0).toUpperCase() + R.slice(1);
    }
    function _() {
      f += 1, u == null || u.abort(), o.value = void 0, r.value = [], i.value = {}, a.value = !1, l.value = "";
    }
    function k() {
      _(), s("close");
    }
    async function I() {
      u == null || u.abort(), u = new AbortController();
      const R = ++f;
      a.value = !0, l.value = "";
      try {
        const V = await hc(u.signal);
        R === f && (o.value = V);
      } catch {
        R === f && !u.signal.aborted && (l.value = "Docker discovery failed. Confirm the read-only Docker socket is available, then retry.");
      } finally {
        R === f && (a.value = !1);
      }
    }
    async function ne() {
      if (!o.value || r.value.length === 0) return;
      u == null || u.abort(), u = new AbortController(), a.value = !0, l.value = "";
      const R = o.value.candidates.filter((D) => r.value.includes(D.candidateId)), V = [...new Set(R.map((D) => D.serviceId))];
      try {
        const D = await yc({
          discoveryId: o.value.discoveryId,
          selectedCandidateIds: [...r.value],
          credentialConsent: V.map((A) => ({ serviceId: A, consent: i.value[A] === !0 }))
        }, u.signal);
        _(), s("applied", D), s("close");
      } catch {
        u.signal.aborted || (l.value = "Selected Docker services could not be applied. Review the candidates and retry."), a.value = !1;
      }
    }
    function Q(R) {
      var V;
      return ((V = o.value) == null ? void 0 : V.candidates.some((D) => D.serviceId === R && r.value.includes(D.candidateId))) === !0;
    }
    return At(() => n.open, (R) => {
      R ? (_(), I()) : _();
    }), Pt(_), (R, V) => (C(), Ae(No, {
      open: e.open,
      title: "Discover Docker services",
      busy: a.value,
      onClose: k
    }, {
      footer: It(() => [
        p("button", {
          type: "button",
          class: "yarr-button is-quiet",
          "data-autofocus": "",
          disabled: a.value,
          onClick: k
        }, "Cancel", 8, kc),
        p("button", {
          type: "button",
          class: "yarr-button",
          disabled: !d.value,
          onClick: ne
        }, M(a.value ? "Applying..." : "Apply selected"), 9, Pc)
      ]),
      default: It(() => [
        V[2] || (V[2] = p("p", null, "Yarr reads bounded container identity and endpoint metadata. Select each candidate explicitly.", -1)),
        a.value && !o.value ? (C(), T("p", xc, "Inspecting Docker services...")) : ie("", !0),
        l.value ? (C(), T("div", Vc, [
          p("p", null, M(l.value), 1),
          p("button", {
            type: "button",
            class: "yarr-button",
            disabled: a.value,
            onClick: I
          }, "Retry discovery", 8, $c)
        ])) : ie("", !0),
        o.value ? (C(), T(se, { key: 2 }, [
          o.value.errors.length ? (C(), T("ul", Ac, [
            (C(!0), T(se, null, ht(o.value.errors, (D) => (C(), T("li", {
              key: D.code
            }, [
              p("strong", null, M(D.code), 1),
              Ee(": " + M(D.message), 1)
            ]))), 128))
          ])) : ie("", !0),
          o.value.candidates.length === 0 ? (C(), T("p", Tc, "No supported Docker services were found.")) : ie("", !0),
          (C(!0), T(se, null, ht(o.value.candidates, (D) => (C(), T("fieldset", {
            key: D.candidateId,
            class: "yarr-choice-row"
          }, [
            p("label", null, [
              $t(p("input", {
                "onUpdate:modelValue": V[0] || (V[0] = (A) => r.value = A),
                type: "checkbox",
                name: `discovery-candidate-${D.candidateId}`,
                value: D.candidateId,
                disabled: a.value
              }, null, 8, Rc), [
                [is, r.value]
              ]),
              V[1] || (V[1] = Ee()),
              p("strong", null, M(v(D.serviceId)), 1)
            ]),
            p("span", null, M(D.baseUrl) + " · " + M(D.confidence) + "% confidence", 1),
            p("small", null, M(D.reasons.join("; ")), 1)
          ]))), 128)),
          (C(!0), T(se, null, ht([...new Set(o.value.candidates.filter((D) => D.hasCredential).map((D) => D.serviceId))], (D) => $t((C(), T("label", {
            key: D,
            class: "yarr-consent-row"
          }, [
            $t(p("input", {
              "onUpdate:modelValue": (A) => i.value[D] = A,
              type: "checkbox",
              disabled: a.value
            }, null, 8, Ic), [
              [is, i.value[D]]
            ]),
            Ee(" Import credentials for " + M(v(D)), 1)
          ])), [
            [bu, Q(D)]
          ])), 128))
        ], 64)) : ie("", !0)
      ]),
      _: 1
    }, 8, ["open", "busy"]));
  }
}), Lc = {
  key: 0,
  class: "yarr-dialog-flow"
}, Uc = ["disabled"], Fc = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, jc = {
  key: 1,
  class: "yarr-dialog-flow"
}, Yc = {
  key: 0,
  class: "yarr-warning-list"
}, Hc = ["name", "value", "disabled"], Bc = { key: 0 }, Kc = ["onUpdate:modelValue", "disabled"], Wc = {
  key: 1,
  class: "yarr-error",
  role: "alert"
}, qc = ["disabled"], Gc = ["disabled"], zc = ["disabled"], Jc = /* @__PURE__ */ Pe({
  __name: "ImportDialog",
  props: {
    open: { type: Boolean }
  },
  emits: ["close", "applied"],
  setup(e, { emit: t }) {
    const n = e, s = t, o = /* @__PURE__ */ B(""), r = /* @__PURE__ */ B(), i = /* @__PURE__ */ B([]), a = /* @__PURE__ */ B({}), l = /* @__PURE__ */ B(!1), u = /* @__PURE__ */ B("");
    let f;
    const d = kn(() => i.value.length > 0 && !l.value);
    function v() {
      f == null || f.abort(), o.value = "", r.value = void 0, i.value = [], a.value = {}, l.value = !1, u.value = "";
    }
    function _() {
      v(), s("close");
    }
    function k(R) {
      return R === "sabnzbd" ? "SABnzbd" : R === "qbittorrent" ? "qBittorrent" : R.charAt(0).toUpperCase() + R.slice(1);
    }
    function I(R) {
      return R.hasPassword || R.hasApiKey;
    }
    async function ne() {
      if (o.value.trim() === "") {
        u.value = "Paste environment settings before requesting a preview.";
        return;
      }
      f == null || f.abort(), f = new AbortController(), l.value = !0, u.value = "";
      const R = o.value;
      try {
        r.value = await bc(R, f.signal), o.value = "", i.value = [], a.value = {};
      } catch {
        f.signal.aborted || (u.value = "Import preview failed. Check the format and retry; no settings were applied.");
      } finally {
        l.value = !1;
      }
    }
    async function Q() {
      if (!(!r.value || i.value.length === 0)) {
        f == null || f.abort(), f = new AbortController(), l.value = !0, u.value = "";
        try {
          const R = await mc({
            previewId: r.value.previewId,
            selectedServiceIds: [...i.value],
            credentialConsent: i.value.map((V) => ({ serviceId: V, consent: a.value[V] === !0 }))
          }, f.signal);
          v(), s("applied", R), s("close");
        } catch {
          f.signal.aborted || (u.value = "Selected services could not be imported. Review the preview and retry."), l.value = !1;
        }
      }
    }
    return At(() => n.open, (R) => {
      R ? v() : o.value = "";
    }), Pt(v), (R, V) => (C(), Ae(No, {
      open: e.open,
      title: "Import configuration",
      busy: l.value,
      onClose: _
    }, {
      footer: It(() => [
        p("button", {
          type: "button",
          class: "yarr-button is-quiet",
          "data-autofocus": "",
          disabled: l.value,
          onClick: _
        }, "Cancel", 8, qc),
        r.value ? (C(), T("button", {
          key: 1,
          type: "button",
          class: "yarr-button",
          disabled: !d.value,
          onClick: Q
        }, M(l.value ? "Applying..." : "Apply selected"), 9, zc)) : (C(), T("button", {
          key: 0,
          type: "button",
          class: "yarr-button",
          disabled: l.value || o.value.trim() === "",
          onClick: ne
        }, M(l.value ? "Previewing..." : "Preview import"), 9, Gc))
      ]),
      default: It(() => [
        r.value ? (C(), T("div", jc, [
          V[5] || (V[5] = p("p", null, "Select at least one service. Credential permission is separate for each selected service.", -1)),
          r.value.warnings.length ? (C(), T("ul", Yc, [
            (C(!0), T(se, null, ht(r.value.warnings, (D) => (C(), T("li", { key: D }, M(D), 1))), 128))
          ])) : ie("", !0),
          (C(!0), T(se, null, ht(r.value.mappings, (D) => (C(), T("fieldset", {
            key: D.serviceId,
            class: "yarr-choice-row"
          }, [
            p("label", null, [
              $t(p("input", {
                "onUpdate:modelValue": V[1] || (V[1] = (A) => i.value = A),
                type: "checkbox",
                name: `import-service-${D.serviceId}`,
                value: D.serviceId,
                disabled: l.value
              }, null, 8, Hc), [
                [is, i.value]
              ]),
              V[4] || (V[4] = Ee()),
              p("strong", null, M(k(D.serviceId)), 1)
            ]),
            p("span", null, M(D.baseUrl ?? "No URL mapped"), 1),
            i.value.includes(D.serviceId) && I(D) ? (C(), T("label", Bc, [
              $t(p("input", {
                "onUpdate:modelValue": (A) => a.value[D.serviceId] = A,
                type: "checkbox",
                disabled: l.value
              }, null, 8, Kc), [
                [is, a.value[D.serviceId]]
              ]),
              Ee(" Import credentials for " + M(k(D.serviceId)), 1)
            ])) : ie("", !0)
          ]))), 128)),
          u.value ? (C(), T("p", Wc, M(u.value), 1)) : ie("", !0)
        ])) : (C(), T("div", Lc, [
          V[3] || (V[3] = p("p", null, "Paste environment assignments. Yarr returns only mapped service metadata and warnings, never values.", -1)),
          p("label", null, [
            V[2] || (V[2] = Ee("Paste environment settings", -1)),
            $t(p("textarea", {
              "onUpdate:modelValue": V[0] || (V[0] = (D) => o.value = D),
              rows: "9",
              disabled: l.value,
              autocomplete: "off",
              spellcheck: "false"
            }, null, 8, Uc), [
              [Lu, o.value]
            ])
          ]),
          u.value ? (C(), T("p", Fc, M(u.value), 1)) : ie("", !0)
        ]))
      ]),
      _: 1
    }, 8, ["open", "busy"]));
  }
}), Qc = ["aria-busy"], Xc = { class: "yarr-section-heading" }, Zc = { class: "yarr-actions" }, ef = ["disabled"], tf = ["disabled"], nf = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, sf = ["disabled"], of = {
  key: 1,
  role: "status"
}, rf = {
  key: 0,
  class: "yarr-note"
}, lf = {
  class: "yarr-log",
  "aria-label": "Yarr log output"
}, af = /* @__PURE__ */ Pe({
  __name: "LogsPanel",
  setup(e) {
    const t = /* @__PURE__ */ B(200), n = /* @__PURE__ */ B(), s = /* @__PURE__ */ B(!1), o = /* @__PURE__ */ B("");
    let r, i = 0;
    async function a() {
      r == null || r.abort(), r = new AbortController();
      const l = ++i;
      s.value = !0, o.value = "";
      try {
        const u = await vc(Math.max(1, Math.min(500, t.value)), r.signal);
        l === i && (n.value = u);
      } catch {
        l === i && !r.signal.aborted && (o.value = "Logs could not be loaded. Confirm Yarr is installed and retry.");
      } finally {
        l === i && (s.value = !1);
      }
    }
    return bs(a), Pt(() => {
      i += 1, r == null || r.abort();
    }), (l, u) => (C(), T("section", {
      class: "yarr-panel",
      "aria-labelledby": "logs-heading",
      "aria-busy": s.value
    }, [
      p("div", Xc, [
        u[3] || (u[3] = p("div", null, [
          p("h2", { id: "logs-heading" }, "Logs"),
          p("p", null, "Read a bounded tail of the redacted Yarr log.")
        ], -1)),
        p("div", Zc, [
          p("label", null, [
            u[2] || (u[2] = Ee("Lines", -1)),
            $t(p("select", {
              "onUpdate:modelValue": u[0] || (u[0] = (f) => t.value = f),
              disabled: s.value
            }, [...u[1] || (u[1] = [
              p("option", { value: 100 }, "100", -1),
              p("option", { value: 200 }, "200", -1),
              p("option", { value: 500 }, "500", -1)
            ])], 8, ef), [
              [
                Uu,
                t.value,
                void 0,
                { number: !0 }
              ]
            ])
          ]),
          p("button", {
            type: "button",
            class: "yarr-button",
            disabled: s.value,
            onClick: a
          }, "Refresh logs", 8, tf)
        ])
      ]),
      o.value ? (C(), T("div", nf, [
        p("p", null, M(o.value), 1),
        p("button", {
          type: "button",
          class: "yarr-button",
          disabled: s.value,
          onClick: a
        }, "Retry log request", 8, sf)
      ])) : n.value ? (C(), T(se, { key: 2 }, [
        n.value.truncated ? (C(), T("p", rf, "Older lines were omitted. Increase the bounded line count if needed.")) : ie("", !0),
        p("pre", lf, [
          (C(!0), T(se, null, ht(n.value.lines, (f, d) => (C(), T("span", { key: d }, M(f) + M(`
`), 1))), 128))
        ])
      ], 64)) : (C(), T("p", of, "Loading logs..."))
    ], 8, Qc));
  }
}), uf = {
  class: "yarr-panel",
  "aria-labelledby": "overview-heading"
}, cf = { class: "yarr-section-heading" }, ff = { class: "yarr-actions" }, df = ["disabled"], pf = ["disabled"], hf = ["disabled"], vf = { class: "yarr-detail-list" }, gf = { class: "yarr-operation-row" }, bf = { class: "yarr-actions" }, mf = ["disabled"], yf = ["disabled"], _f = /* @__PURE__ */ Pe({
  __name: "OverviewPanel",
  props: {
    runtime: {},
    config: {},
    busy: { type: Boolean }
  },
  emits: ["control", "import", "discover"],
  setup(e, { emit: t }) {
    const n = t;
    return (s, o) => (C(), T("section", uf, [
      p("div", cf, [
        p("div", null, [
          o[5] || (o[5] = p("h2", { id: "overview-heading" }, "Current operation", -1)),
          p("p", null, M(e.runtime.healthMessage), 1)
        ]),
        p("div", ff, [
          e.runtime.state !== "running" ? (C(), T("button", {
            key: 0,
            type: "button",
            class: "yarr-button",
            disabled: e.busy,
            onClick: o[0] || (o[0] = (r) => n("control", "START"))
          }, "Start Yarr", 8, df)) : (C(), T("button", {
            key: 1,
            type: "button",
            class: "yarr-button",
            disabled: e.busy,
            onClick: o[1] || (o[1] = (r) => n("control", "RESTART"))
          }, "Restart Yarr", 8, pf)),
          e.runtime.state === "running" ? (C(), T("button", {
            key: 2,
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            onClick: o[2] || (o[2] = (r) => n("control", "STOP"))
          }, "Stop Yarr", 8, hf)) : ie("", !0)
        ])
      ]),
      p("dl", vf, [
        p("div", null, [
          o[6] || (o[6] = p("dt", null, "Process ID", -1)),
          p("dd", null, M(e.runtime.pid ?? "Not running"), 1)
        ]),
        p("div", null, [
          o[7] || (o[7] = p("dt", null, "Uptime", -1)),
          p("dd", null, M(e.runtime.uptimeSeconds === null ? "Unavailable" : `${e.runtime.uptimeSeconds} seconds`), 1)
        ]),
        p("div", null, [
          o[8] || (o[8] = p("dt", null, "Enabled services", -1)),
          p("dd", null, M(e.config.services.filter((r) => r.service !== "yarr" && r.enabled).length), 1)
        ]),
        p("div", null, [
          o[9] || (o[9] = p("dt", null, "Tailscale Serve", -1)),
          p("dd", null, M(e.config.plugin.tailscaleServe ? e.config.plugin.tailscaleHostname : "Off"), 1)
        ])
      ]),
      p("div", gf, [
        o[10] || (o[10] = p("div", null, [
          p("h3", null, "Bring in existing services"),
          p("p", null, "Preview environment settings or inspect Docker metadata before choosing what Yarr may apply.")
        ], -1)),
        p("div", bf, [
          p("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            onClick: o[3] || (o[3] = (r) => n("import"))
          }, "Import configuration", 8, mf),
          p("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            onClick: o[4] || (o[4] = (r) => n("discover"))
          }, "Discover Docker services", 8, yf)
        ])
      ])
    ]));
  }
}), Ef = ["disabled"], Nf = ["disabled"], qs = /* @__PURE__ */ Pe({
  __name: "ConfirmDialog",
  props: {
    open: { type: Boolean },
    title: {},
    description: {},
    confirmLabel: {},
    cancelLabel: { default: "Cancel" },
    busy: { type: Boolean, default: !1 },
    danger: { type: Boolean, default: !1 }
  },
  emits: ["close", "confirm"],
  setup(e, { emit: t }) {
    const n = t;
    return (s, o) => (C(), Ae(No, {
      open: e.open,
      title: e.title,
      busy: e.busy,
      onClose: o[2] || (o[2] = (r) => n("close"))
    }, {
      footer: It(() => [
        p("button", {
          type: "button",
          class: "yarr-button is-quiet",
          "data-autofocus": "",
          disabled: e.busy,
          onClick: o[0] || (o[0] = (r) => n("close"))
        }, M(e.cancelLabel), 9, Ef),
        p("button", {
          type: "button",
          class: kt(["yarr-button", { "is-danger": e.danger }]),
          disabled: e.busy,
          onClick: o[1] || (o[1] = (r) => n("confirm"))
        }, M(e.busy ? "Working..." : e.confirmLabel), 11, Nf)
      ]),
      default: It(() => [
        p("p", null, M(e.description), 1)
      ]),
      _: 1
    }, 8, ["open", "title", "busy"]));
  }
}), wf = { class: "yarr-secret-field" }, Of = { class: "yarr-secret-field__status" }, Sf = ["name", "checked"], Cf = ["name", "checked"], Df = ["name", "aria-label", "value"], xf = {
  key: 2,
  class: "yarr-secret-field__pending",
  role: "status"
}, ls = /* @__PURE__ */ Pe({
  __name: "SecretField",
  props: {
    name: {},
    label: {},
    configured: { type: Boolean },
    intent: { default: "PRESERVE" }
  },
  emits: ["update"],
  setup(e, { emit: t }) {
    const n = e, s = t, o = /* @__PURE__ */ B(n.intent), r = /* @__PURE__ */ B(""), i = /* @__PURE__ */ B(!1), a = `yarr-secret-${n.name}-${si()}`;
    At(() => n.intent, (d) => {
      o.value = d, d !== "SET" && (r.value = "");
    });
    function l(d) {
      if (o.value = d, d === "SET") {
        s("update", { kind: "SET", value: r.value });
        return;
      }
      r.value = "", s("update", { kind: d });
    }
    function u(d) {
      r.value = d, s("update", { kind: "SET", value: d });
    }
    function f() {
      i.value = !1, l("CLEAR");
    }
    return (d, v) => (C(), T(se, null, [
      p("fieldset", wf, [
        p("legend", null, M(e.label), 1),
        p("p", Of, M(e.configured ? "Configured" : "Not configured"), 1),
        p("label", null, [
          p("input", {
            name: `${e.name}-intent`,
            type: "radio",
            checked: o.value === "PRESERVE",
            onChange: v[0] || (v[0] = (_) => l("PRESERVE"))
          }, null, 40, Sf),
          v[5] || (v[5] = Ee(" Keep current value", -1))
        ]),
        p("label", null, [
          p("input", {
            name: `${e.name}-intent`,
            type: "radio",
            checked: o.value === "SET",
            onChange: v[1] || (v[1] = (_) => l("SET"))
          }, null, 40, Cf),
          v[6] || (v[6] = Ee(" Set a new value", -1))
        ]),
        o.value === "SET" ? (C(), T("label", {
          key: 0,
          for: a
        }, "New " + M(e.label), 1)) : ie("", !0),
        o.value === "SET" ? (C(), T("input", {
          key: 1,
          id: a,
          name: `${e.name}-new-value`,
          type: "password",
          "aria-label": `New ${e.label}`,
          autocomplete: "new-password",
          placeholder: "Enter a new value",
          value: r.value,
          onInput: v[2] || (v[2] = (_) => u(_.target.value))
        }, null, 40, Df)) : ie("", !0),
        o.value === "CLEAR" ? (C(), T("p", xf, "This value will be cleared when changes are saved.")) : ie("", !0),
        e.configured ? (C(), T("button", {
          key: 3,
          type: "button",
          class: "yarr-button is-danger is-quiet",
          onClick: v[3] || (v[3] = (_) => i.value = !0)
        }, "Clear " + M(e.label), 1)) : ie("", !0)
      ]),
      ve(qs, {
        open: i.value,
        title: `Clear ${e.label}?`,
        description: "Yarr may lose access until a replacement credential is saved.",
        "confirm-label": "Clear credential",
        "cancel-label": "Keep credential",
        danger: "",
        onClose: v[4] || (v[4] = (_) => i.value = !1),
        onConfirm: f
      }, null, 8, ["open", "title"])
    ], 64));
  }
}), Vf = {
  class: "yarr-panel",
  "aria-labelledby": "server-heading"
}, $f = { class: "yarr-form-rows" }, Af = { class: "yarr-setting-row" }, Tf = ["checked", "disabled"], Rf = { class: "yarr-setting-row" }, If = ["value", "disabled"], kf = {
  key: 0,
  class: "yarr-setting-row"
}, Pf = ["value", "disabled"], Mf = { class: "yarr-setting-row" }, Lf = ["value", "disabled"], Uf = { class: "yarr-setting-row" }, Ff = ["value", "disabled"], jf = { class: "yarr-auth-section" }, Yf = ["value", "disabled"], Hf = {
  key: 2,
  class: "yarr-form-grid"
}, Bf = ["value", "disabled"], Kf = ["value", "disabled"], Wf = { class: "yarr-form-rows" }, qf = { class: "yarr-setting-row" }, Gf = ["checked", "disabled"], zf = {
  key: 0,
  class: "yarr-setting-row"
}, Jf = ["value", "disabled"], Qf = { class: "yarr-setting-row" }, Xf = ["value", "disabled"], Zf = ["value"], ed = /* @__PURE__ */ Pe({
  __name: "ServerAuthPanel",
  props: {
    plugin: {},
    auth: {},
    bearerConfigured: { type: Boolean },
    googleSecretConfigured: { type: Boolean },
    disabled: { type: Boolean }
  },
  emits: ["plugin", "auth"],
  setup(e, { emit: t }) {
    const n = e, s = t;
    function o(a) {
      s("plugin", { ...n.plugin, ...a });
    }
    function r(a) {
      s("auth", { ...n.auth, ...a });
    }
    function i(a, l) {
      r({ [a]: l });
    }
    return (a, l) => (C(), T("section", Vf, [
      l[26] || (l[26] = p("div", { class: "yarr-section-heading" }, [
        p("div", null, [
          p("h2", { id: "server-heading" }, "Server & Auth"),
          p("p", null, "Keep Yarr on loopback unless authentication is fully configured.")
        ])
      ], -1)),
      p("div", $f, [
        p("label", Af, [
          l[13] || (l[13] = p("span", null, [
            p("strong", null, "Run Yarr"),
            p("small", null, "Start Yarr with the array lifecycle.")
          ], -1)),
          p("input", {
            type: "checkbox",
            checked: e.plugin.enabled,
            disabled: e.disabled,
            onChange: l[0] || (l[0] = (u) => o({ enabled: u.target.checked }))
          }, null, 40, Tf)
        ]),
        p("label", Rf, [
          l[15] || (l[15] = p("span", null, [
            p("strong", null, "Bind mode"),
            p("small", null, "Choose which interfaces accept connections.")
          ], -1)),
          p("select", {
            value: e.plugin.bindMode,
            disabled: e.disabled,
            onChange: l[1] || (l[1] = (u) => o({ bindMode: u.target.value }))
          }, [...l[14] || (l[14] = [
            p("option", { value: "LOOPBACK" }, "Loopback only", -1),
            p("option", { value: "LAN" }, "LAN interfaces", -1),
            p("option", { value: "CUSTOM" }, "Custom address", -1)
          ])], 40, If)
        ]),
        e.plugin.bindMode === "CUSTOM" ? (C(), T("label", kf, [
          l[16] || (l[16] = p("span", null, [
            p("strong", null, "Custom bind address"),
            p("small", null, "Use an IP address owned by this server.")
          ], -1)),
          p("input", {
            type: "text",
            value: e.plugin.customHost,
            disabled: e.disabled,
            onInput: l[2] || (l[2] = (u) => o({ customHost: u.target.value }))
          }, null, 40, Pf)
        ])) : ie("", !0),
        p("label", Mf, [
          l[17] || (l[17] = p("span", null, [
            p("strong", null, "Port"),
            p("small", null, "Yarr API and MCP listener port.")
          ], -1)),
          p("input", {
            type: "number",
            min: "1",
            max: "65535",
            value: e.plugin.port,
            disabled: e.disabled,
            onInput: l[3] || (l[3] = (u) => o({ port: Number(u.target.value) }))
          }, null, 40, Lf)
        ]),
        p("label", Uf, [
          l[19] || (l[19] = p("span", null, [
            p("strong", null, "Authentication mode"),
            p("small", null, "Required before exposing Yarr beyond loopback.")
          ], -1)),
          p("select", {
            value: e.plugin.authMode,
            disabled: e.disabled,
            onChange: l[4] || (l[4] = (u) => o({ authMode: u.target.value }))
          }, [...l[18] || (l[18] = [
            p("option", { value: "BEARER" }, "Bearer token", -1),
            p("option", { value: "GOOGLE_OAUTH" }, "Google OAuth", -1),
            p("option", { value: "TRUSTED_GATEWAY" }, "Trusted gateway", -1)
          ])], 40, Ff)
        ])
      ]),
      p("div", jf, [
        e.plugin.authMode === "BEARER" ? (C(), Ae(ls, {
          key: 0,
          name: "bearer-token",
          label: "Bearer token",
          configured: e.bearerConfigured,
          intent: e.auth.bearerToken.kind,
          onUpdate: l[5] || (l[5] = (u) => i("bearerToken", u))
        }, null, 8, ["configured", "intent"])) : e.plugin.authMode === "GOOGLE_OAUTH" ? (C(), T(se, { key: 1 }, [
          p("label", null, [
            l[20] || (l[20] = Ee("Google client ID", -1)),
            p("input", {
              type: "text",
              value: e.auth.googleClientId,
              disabled: e.disabled,
              autocomplete: "off",
              onInput: l[6] || (l[6] = (u) => r({ googleClientId: u.target.value }))
            }, null, 40, Yf)
          ]),
          ve(ls, {
            name: "google-client-secret",
            label: "Google client secret",
            configured: e.googleSecretConfigured,
            intent: e.auth.googleClientSecret.kind,
            onUpdate: l[7] || (l[7] = (u) => i("googleClientSecret", u))
          }, null, 8, ["configured", "intent"])
        ], 64)) : (C(), T("div", Hf, [
          p("label", null, [
            l[21] || (l[21] = Ee("Trusted gateway hosts", -1)),
            p("textarea", {
              value: e.auth.trustedGatewayHosts,
              disabled: e.disabled,
              rows: "3",
              onInput: l[8] || (l[8] = (u) => r({ trustedGatewayHosts: u.target.value }))
            }, null, 40, Bf)
          ]),
          p("label", null, [
            l[22] || (l[22] = Ee("Trusted gateway origins", -1)),
            p("textarea", {
              value: e.auth.trustedGatewayOrigins,
              disabled: e.disabled,
              rows: "3",
              onInput: l[9] || (l[9] = (u) => r({ trustedGatewayOrigins: u.target.value }))
            }, null, 40, Kf)
          ])
        ]))
      ]),
      p("div", Wf, [
        p("label", qf, [
          l[23] || (l[23] = p("span", null, [
            p("strong", null, "Tailscale Serve"),
            p("small", null, "Publish the loopback endpoint through Tailscale.")
          ], -1)),
          p("input", {
            type: "checkbox",
            checked: e.plugin.tailscaleServe,
            disabled: e.disabled,
            onChange: l[10] || (l[10] = (u) => o({ tailscaleServe: u.target.checked }))
          }, null, 40, Gf)
        ]),
        e.plugin.tailscaleServe ? (C(), T("label", zf, [
          l[24] || (l[24] = p("span", null, [
            p("strong", null, "Tailscale hostname"),
            p("small", null, "DNS-label service name.")
          ], -1)),
          p("input", {
            type: "text",
            value: e.plugin.tailscaleHostname,
            disabled: e.disabled,
            onInput: l[11] || (l[11] = (u) => o({ tailscaleHostname: u.target.value }))
          }, null, 40, Jf)
        ])) : ie("", !0),
        p("label", Qf, [
          l[25] || (l[25] = p("span", null, [
            p("strong", null, "Log level"),
            p("small", null, "Increase verbosity only while diagnosing an issue.")
          ], -1)),
          p("select", {
            value: e.plugin.logLevel,
            disabled: e.disabled,
            onChange: l[12] || (l[12] = (u) => o({ logLevel: u.target.value }))
          }, [
            (C(), T(se, null, ht(["TRACE", "DEBUG", "INFO", "WARN", "ERROR"], (u) => p("option", {
              key: u,
              value: u
            }, M(u), 9, Zf)), 64))
          ], 40, Xf)
        ])
      ])
    ]));
  }
}), td = {
  class: "yarr-panel",
  "aria-labelledby": "services-heading"
}, nd = {
  key: 0,
  class: "yarr-empty"
}, sd = ["aria-labelledby"], od = { class: "yarr-service-row__identity" }, rd = ["id"], id = { class: "yarr-switch" }, ld = ["checked", "disabled", "onChange"], ad = { class: "yarr-form-grid" }, ud = ["value", "disabled", "onInput"], cd = ["value", "disabled", "onInput"], fd = { class: "yarr-secret-grid" }, dd = /* @__PURE__ */ Pe({
  __name: "ServicesPanel",
  props: {
    services: {},
    disabled: { type: Boolean }
  },
  emits: ["update"],
  setup(e, { emit: t }) {
    const n = e, s = t, o = {
      sonarr: "Sonarr",
      radarr: "Radarr",
      prowlarr: "Prowlarr",
      tautulli: "Tautulli",
      overseerr: "Overseerr",
      bazarr: "Bazarr",
      tracearr: "Tracearr",
      sabnzbd: "SABnzbd",
      qbittorrent: "qBittorrent",
      plex: "Plex",
      jellyfin: "Jellyfin"
    };
    function r(l) {
      return o[l] ?? l;
    }
    function i(l, u) {
      const f = n.services.map((d, v) => v === l ? { ...d, ...u } : d);
      s("update", f);
    }
    function a(l, u, f) {
      i(l, { [u]: f });
    }
    return (l, u) => (C(), T("section", td, [
      u[1] || (u[1] = p("div", { class: "yarr-section-heading" }, [
        p("div", null, [
          p("h2", { id: "services-heading" }, "Services"),
          p("p", null, "Enable only the integrations Yarr should contact.")
        ])
      ], -1)),
      e.services.length === 0 ? (C(), T("p", nd, "No service definitions are available.")) : ie("", !0),
      (C(!0), T(se, null, ht(e.services, (f, d) => (C(), T("section", {
        key: f.service,
        class: "yarr-service-row",
        "aria-labelledby": `service-${f.service}`
      }, [
        p("div", od, [
          p("h3", {
            id: `service-${f.service}`
          }, M(r(f.service)), 9, rd),
          p("label", id, [
            p("input", {
              type: "checkbox",
              checked: f.enabled,
              disabled: e.disabled,
              onChange: (v) => i(d, { enabled: v.target.checked })
            }, null, 40, ld),
            u[0] || (u[0] = Ee(" Enabled", -1))
          ])
        ]),
        p("div", ad, [
          p("label", null, [
            Ee(M(r(f.service)) + " base URL", 1),
            p("input", {
              type: "url",
              value: f.baseUrl,
              disabled: e.disabled,
              onInput: (v) => i(d, { baseUrl: v.target.value })
            }, null, 40, ud)
          ]),
          p("label", null, [
            Ee(M(r(f.service)) + " username", 1),
            p("input", {
              type: "text",
              value: f.username ?? "",
              disabled: e.disabled,
              autocomplete: "off",
              onInput: (v) => i(d, { username: v.target.value })
            }, null, 40, cd)
          ])
        ]),
        p("div", fd, [
          ve(ls, {
            name: `${f.service}-password`,
            label: `${r(f.service)} password`,
            configured: f.hasPassword,
            intent: f.password.kind,
            onUpdate: (v) => a(d, "password", v)
          }, null, 8, ["name", "label", "configured", "intent", "onUpdate"]),
          ve(ls, {
            name: `${f.service}-api-key`,
            label: `${r(f.service)} API key`,
            configured: f.hasApiKey,
            intent: f.apiKey.kind,
            onUpdate: (v) => a(d, "apiKey", v)
          }, null, 8, ["name", "label", "configured", "intent", "onUpdate"])
        ])
      ], 8, sd))), 128))
    ]));
  }
}), pd = ["aria-label"], hd = {
  class: "yarr-status-badge__symbol",
  "aria-hidden": "true"
}, vd = /* @__PURE__ */ Pe({
  __name: "StatusBadge",
  props: {
    state: {},
    label: { default: void 0 }
  },
  setup(e) {
    const t = e, n = kn(() => t.label ?? {
      success: "Available",
      warning: "Needs attention",
      danger: "Unavailable",
      neutral: "Unknown"
    }[t.state]);
    return (s, o) => (C(), T("span", {
      class: kt(["yarr-status-badge", `is-${e.state}`]),
      "aria-label": `Status: ${n.value}`
    }, [
      p("span", hd, M(e.state === "success" ? "OK" : e.state === "danger" ? "!" : "-"), 1),
      p("span", null, M(n.value), 1)
    ], 10, pd));
  }
}), gd = ["aria-busy"], bd = { class: "yarr-section-heading" }, md = ["disabled"], yd = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, _d = ["disabled"], Ed = {
  key: 1,
  role: "status"
}, Nd = { class: "yarr-detail-list" }, wd = { key: 0 }, Od = { class: "yarr-actions" }, Sd = ["disabled"], Cd = ["disabled"], Dd = /* @__PURE__ */ Pe({
  __name: "UpdatesPanel",
  setup(e) {
    const t = /* @__PURE__ */ B(), n = /* @__PURE__ */ B(""), s = /* @__PURE__ */ B(!1), o = /* @__PURE__ */ B(!1), r = /* @__PURE__ */ B(!1);
    let i, a = 0;
    async function l() {
      i == null || i.abort(), i = new AbortController();
      const d = ++a;
      s.value = !0, n.value = "";
      try {
        const v = await gc(i.signal);
        d === a && (t.value = v);
      } catch {
        d === a && !i.signal.aborted && (n.value = "Update status could not be loaded. Check Yarr connectivity, then retry.");
      } finally {
        d === a && (s.value = !1);
      }
    }
    async function u() {
      if (t.value) {
        i == null || i.abort(), i = new AbortController(), s.value = !0, n.value = "";
        try {
          t.value = await _c(t.value.availableVersion, i.signal), o.value = !1;
        } catch {
          i.signal.aborted || (n.value = "The update did not complete. Review the result and Yarr logs before retrying.");
        } finally {
          s.value = !1;
        }
      }
    }
    async function f() {
      i == null || i.abort(), i = new AbortController(), s.value = !0, n.value = "";
      try {
        t.value = await Ec(i.signal), r.value = !1;
      } catch {
        i.signal.aborted || (n.value = "Reset did not complete. Review Yarr logs before retrying.");
      } finally {
        s.value = !1;
      }
    }
    return bs(l), Pt(() => {
      a += 1, i == null || i.abort();
    }), (d, v) => {
      var _;
      return C(), T("section", {
        class: "yarr-panel",
        "aria-labelledby": "updates-heading",
        "aria-busy": s.value
      }, [
        p("div", bd, [
          v[4] || (v[4] = p("div", null, [
            p("h2", { id: "updates-heading" }, "Updates"),
            p("p", null, "Install a verified release or return to the package version.")
          ], -1)),
          p("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: s.value,
            onClick: l
          }, "Check again", 8, md)
        ]),
        n.value ? (C(), T("div", yd, [
          p("p", null, M(n.value), 1),
          p("button", {
            type: "button",
            class: "yarr-button",
            disabled: s.value,
            onClick: l
          }, "Retry update check", 8, _d)
        ])) : t.value ? (C(), T(se, { key: 2 }, [
          p("dl", Nd, [
            p("div", null, [
              v[5] || (v[5] = p("dt", null, "Installed", -1)),
              p("dd", null, M(t.value.installedVersion), 1)
            ]),
            p("div", null, [
              v[6] || (v[6] = p("dt", null, "Packaged", -1)),
              p("dd", null, M(t.value.packagedVersion), 1)
            ]),
            p("div", null, [
              v[7] || (v[7] = p("dt", null, "Available", -1)),
              p("dd", null, M(t.value.availableVersion), 1)
            ]),
            p("div", null, [
              v[8] || (v[8] = p("dt", null, "Source", -1)),
              p("dd", null, M(t.value.usingOverlay ? "Update overlay" : "Plugin package"), 1)
            ])
          ]),
          p("p", {
            class: kt(["yarr-result", { "is-warning": t.value.rolledBack }]),
            role: "status"
          }, [
            Ee(M(t.value.message), 1),
            t.value.rolledBack ? (C(), T("strong", wd, " The previous version was restored.")) : ie("", !0)
          ], 2),
          p("div", Od, [
            t.value.updateAvailable ? (C(), T("button", {
              key: 0,
              type: "button",
              class: "yarr-button",
              disabled: s.value,
              onClick: v[0] || (v[0] = (k) => o.value = !0)
            }, "Install " + M(t.value.availableVersion), 9, Sd)) : ie("", !0),
            p("button", {
              type: "button",
              class: "yarr-button is-danger is-quiet",
              disabled: s.value,
              onClick: v[1] || (v[1] = (k) => r.value = !0)
            }, "Reset to packaged version", 8, Cd)
          ])
        ], 64)) : (C(), T("p", Ed, "Checking update status...")),
        ve(qs, {
          open: o.value,
          title: `Install Yarr ${(_ = t.value) == null ? void 0 : _.availableVersion}?`,
          description: "Yarr will restart. If readiness fails, the updater will attempt to restore the previous binary.",
          "confirm-label": "Install update",
          busy: s.value,
          onClose: v[2] || (v[2] = (k) => o.value = !1),
          onConfirm: u
        }, null, 8, ["open", "title", "busy"]),
        ve(qs, {
          open: r.value,
          title: "Reset to packaged Yarr?",
          description: "This removes the update overlay and restarts the binary shipped by the plugin package.",
          "confirm-label": "Reset Yarr",
          busy: s.value,
          danger: "",
          onClose: v[3] || (v[3] = (k) => r.value = !1),
          onConfirm: f
        }, null, 8, ["open", "busy"])
      ], 8, gd);
    };
  }
}), xd = ["aria-busy"], Vd = { class: "yarr-identity" }, $d = { class: "yarr-workspace" }, Ad = {
  key: 0,
  class: "yarr-error yarr-load-error",
  role: "alert"
}, Td = ["disabled"], Rd = {
  key: 1,
  class: "yarr-shell__message",
  role: "status"
}, Id = { class: "yarr-tabs-wrap" }, kd = {
  class: "yarr-tabs",
  role: "tablist",
  "aria-label": "Yarr settings sections"
}, Pd = ["id", "aria-selected", "aria-controls", "tabindex", "onClick", "onKeydown"], Md = ["id", "aria-labelledby"], Ld = { class: "yarr-save-bar" }, Ud = { "aria-live": "polite" }, Fd = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, jd = {
  key: 1,
  class: "yarr-result",
  role: "status"
}, Yd = { key: 2 }, Hd = ["disabled"], Bd = /* @__PURE__ */ Pe({
  __name: "YarrSettings.ce",
  setup(e) {
    const t = ["Overview", "Services", "Server & Auth", "Updates", "Logs"], n = /* @__PURE__ */ B(), s = /* @__PURE__ */ B(), o = /* @__PURE__ */ B(), r = /* @__PURE__ */ B(), i = /* @__PURE__ */ B([]), a = /* @__PURE__ */ B(!1), l = /* @__PURE__ */ B(!1), u = /* @__PURE__ */ B("Overview"), f = /* @__PURE__ */ B(!0), d = /* @__PURE__ */ B(!1), v = /* @__PURE__ */ B(""), _ = /* @__PURE__ */ B(""), k = /* @__PURE__ */ B(""), I = /* @__PURE__ */ B(!1), ne = /* @__PURE__ */ B(!1), Q = /* @__PURE__ */ B(!1), R = /* @__PURE__ */ B([]);
    let V, D, A = 0;
    const le = kn(() => n.value && s.value && o.value && r.value);
    function ge(P, $) {
      var F;
      return ((F = P == null ? void 0 : P.extra.find((Ue) => Ue.key === $)) == null ? void 0 : F.value) ?? "";
    }
    function ae(P) {
      n.value = P, o.value = { ...P.plugin };
      const $ = P.services.find((F) => F.service === "yarr");
      a.value = ($ == null ? void 0 : $.hasApiKey) ?? !1, l.value = ($ == null ? void 0 : $.hasPassword) ?? !1, r.value = {
        bearerToken: { kind: "PRESERVE" },
        googleClientId: ($ == null ? void 0 : $.username) ?? "",
        googleClientSecret: { kind: "PRESERVE" },
        trustedGatewayHosts: ge($, "YARR_MCP_ALLOWED_HOSTS"),
        trustedGatewayOrigins: ge($, "YARR_MCP_ALLOWED_ORIGINS")
      }, i.value = P.services.filter((F) => F.service !== "yarr").map((F) => ({
        ...F,
        extra: F.extra.map((Ue) => ({ ...Ue })),
        password: { kind: "PRESERVE" },
        apiKey: { kind: "PRESERVE" }
      }));
    }
    async function be() {
      V == null || V.abort(), V = new AbortController();
      const P = ++A;
      f.value = !0, Q.value = !0, v.value = "", _.value = "";
      try {
        const [$, F] = await Promise.all([
          fc(V.signal),
          cc(V.signal)
        ]);
        if (P !== A) return;
        ae($), s.value = F;
      } catch {
        P === A && !V.signal.aborted && (v.value = "Yarr settings could not be loaded. Confirm the Unraid API is running, then retry.");
      } finally {
        P === A && (f.value = !1, Q.value = !1);
      }
    }
    function Me(P, $) {
      return $.kind === "CLEAR" ? !1 : $.kind === "SET" ? $.value.trim().length > 0 : P;
    }
    function Xe() {
      return !o.value || !r.value || o.value.bindMode === "LOOPBACK" ? "" : o.value.authMode === "BEARER" && !Me(a.value, r.value.bearerToken) ? "Bearer authentication requires a configured token before Yarr can bind beyond loopback." : o.value.authMode === "GOOGLE_OAUTH" && (r.value.googleClientId.trim() === "" || !Me(l.value, r.value.googleClientSecret)) ? "Google OAuth requires a client ID and configured client secret before Yarr can bind beyond loopback." : o.value.authMode === "TRUSTED_GATEWAY" && r.value.trustedGatewayHosts.trim() === "" && r.value.trustedGatewayOrigins.trim() === "" ? "Trusted gateway authentication requires at least one allowed host or origin before Yarr can bind beyond loopback." : "";
    }
    function Ne(P) {
      return P.kind === "SET" && P.value.trim() === "" ? { kind: "PRESERVE" } : P;
    }
    function Mt() {
      const P = o.value, $ = r.value;
      return {
        ...P,
        bearerToken: Ne($.bearerToken),
        googleClientId: $.googleClientId,
        googleClientSecret: Ne($.googleClientSecret),
        trustedGatewayHosts: $.trustedGatewayHosts,
        trustedGatewayOrigins: $.trustedGatewayOrigins,
        services: i.value.map((F) => ({
          service: F.service,
          enabled: F.enabled,
          baseUrl: F.baseUrl,
          username: F.username ?? "",
          password: Ne(F.password),
          apiKey: Ne(F.apiKey)
        }))
      };
    }
    function Zt(P) {
      return P.rolledBack ? `Changes were not kept. Previous configuration restored.${P.error ? ` ${P.error}` : ""}` : P.error ? `Save outcome is indeterminate. ${P.error} Check runtime status and logs before retrying.` : P.changed ? P.restarted ? "Changes saved and Yarr restarted." : "Changes saved. Yarr did not require a restart." : "No configuration changes were needed.";
    }
    async function Ze() {
      const P = Xe();
      if (P) {
        _.value = P;
        return;
      }
      D == null || D.abort(), D = new AbortController(), d.value = !0, _.value = "", k.value = "";
      try {
        const $ = await dc(Mt(), D.signal);
        ae($.config), k.value = Zt($);
      } catch {
        D.signal.aborted || (_.value = "Changes could not be saved. Review the fields and retry; existing configuration was not replaced.");
      } finally {
        d.value = !1;
      }
    }
    async function we(P) {
      D == null || D.abort(), D = new AbortController(), d.value = !0, _.value = "";
      try {
        s.value = await pc(P, D.signal), k.value = P === "STOP" ? "Yarr stopped." : P === "START" ? "Yarr started." : "Yarr restarted.";
      } catch {
        D.signal.aborted || (_.value = "Yarr could not complete that action. Check runtime status and logs before retrying.");
      } finally {
        d.value = !1;
      }
    }
    function q(P) {
      ae(P.config), k.value = Zt(P);
    }
    function W(P, $ = !1) {
      u.value = P, $ && Vn(() => {
        var F;
        return (F = R.value[t.indexOf(P)]) == null ? void 0 : F.focus();
      });
    }
    function Le(P, $) {
      let F = $;
      if (P.key === "ArrowRight") F = ($ + 1) % t.length;
      else if (P.key === "ArrowLeft") F = ($ - 1 + t.length) % t.length;
      else if (P.key === "Home") F = 0;
      else if (P.key === "End") F = t.length - 1;
      else return;
      P.preventDefault(), W(t[F], !0);
    }
    function en(P, $) {
      P && (R.value[$] = P);
    }
    return bs(be), Pt(() => {
      A += 1, V == null || V.abort(), D == null || D.abort();
    }), (P, $) => (C(), T("section", {
      class: "yarr-shell yarr-settings",
      "aria-labelledby": "yarr-settings-title",
      "aria-busy": f.value || d.value
    }, [
      p("aside", Vd, [
        $[7] || ($[7] = p("p", { class: "yarr-shell__eyebrow" }, "Unraid service", -1)),
        $[8] || ($[8] = p("h1", { id: "yarr-settings-title" }, "Yarr", -1)),
        s.value ? (C(), Ae(vd, {
          key: 0,
          state: s.value.ready ? "success" : s.value.state === "running" ? "warning" : "neutral",
          label: s.value.ready ? "Ready" : s.value.state
        }, null, 8, ["state", "label"])) : ie("", !0),
        $[9] || ($[9] = p("p", null, "Media service operations", -1))
      ]),
      p("main", $d, [
        v.value ? (C(), T("div", Ad, [
          p("p", null, M(v.value), 1),
          p("button", {
            type: "button",
            class: "yarr-button",
            disabled: f.value,
            onClick: be
          }, "Retry", 8, Td)
        ])) : le.value ? (C(), T(se, { key: 2 }, [
          p("ol", {
            class: kt(["yarr-signal-rail", { "is-refreshing": Q.value }]),
            "aria-label": "Yarr lifecycle signals"
          }, [
            p("li", null, [
              $[10] || ($[10] = p("span", null, "Process", -1)),
              p("strong", null, M(s.value.state), 1)
            ]),
            p("li", null, [
              $[11] || ($[11] = p("span", null, "Ready", -1)),
              p("strong", null, M(s.value.ready ? "Yes" : "No"), 1)
            ]),
            p("li", null, [
              $[12] || ($[12] = p("span", null, "Endpoint", -1)),
              p("strong", null, M(s.value.bindAddress) + ":" + M(s.value.port), 1)
            ]),
            p("li", null, [
              $[13] || ($[13] = p("span", null, "Version", -1)),
              p("strong", null, M(s.value.version ?? "Unavailable"), 1)
            ])
          ], 2),
          p("div", Id, [
            p("div", kd, [
              (C(), T(se, null, ht(t, (F, Ue) => p("button", {
                id: `yarr-tab-${Ue}`,
                key: F,
                ref_for: !0,
                ref: (Lt) => en(Lt, Ue),
                type: "button",
                role: "tab",
                "aria-selected": u.value === F,
                "aria-controls": `yarr-panel-${Ue}`,
                tabindex: u.value === F ? 0 : -1,
                onClick: (Lt) => W(F),
                onKeydown: (Lt) => Le(Lt, Ue)
              }, M(F), 41, Pd)), 64))
            ])
          ]),
          p("div", {
            id: `yarr-panel-${t.indexOf(u.value)}`,
            role: "tabpanel",
            "aria-labelledby": `yarr-tab-${t.indexOf(u.value)}`,
            tabindex: "0"
          }, [
            u.value === "Overview" ? (C(), Ae(_f, {
              key: 0,
              runtime: s.value,
              config: n.value,
              busy: d.value,
              onControl: we,
              onImport: $[0] || ($[0] = (F) => I.value = !0),
              onDiscover: $[1] || ($[1] = (F) => ne.value = !0)
            }, null, 8, ["runtime", "config", "busy"])) : u.value === "Services" ? (C(), Ae(dd, {
              key: 1,
              services: i.value,
              disabled: d.value,
              onUpdate: $[2] || ($[2] = (F) => i.value = F)
            }, null, 8, ["services", "disabled"])) : u.value === "Server & Auth" ? (C(), Ae(ed, {
              key: 2,
              plugin: o.value,
              auth: r.value,
              "bearer-configured": a.value,
              "google-secret-configured": l.value,
              disabled: d.value,
              onPlugin: $[3] || ($[3] = (F) => o.value = F),
              onAuth: $[4] || ($[4] = (F) => r.value = F)
            }, null, 8, ["plugin", "auth", "bearer-configured", "google-secret-configured", "disabled"])) : u.value === "Updates" ? (C(), Ae(Dd, { key: 3 })) : (C(), Ae(af, { key: 4 }))
          ], 8, Md),
          p("div", Ld, [
            p("div", Ud, [
              _.value ? (C(), T("p", Fd, M(_.value), 1)) : k.value ? (C(), T("p", jd, M(k.value), 1)) : (C(), T("p", Yd, "Changes are validated again by the Yarr service before they are applied."))
            ]),
            p("button", {
              type: "button",
              class: "yarr-button",
              disabled: d.value,
              onClick: Ze
            }, M(d.value ? "Saving..." : "Save changes"), 9, Hd)
          ])
        ], 64)) : (C(), T("p", Rd, "Loading Yarr operations..."))
      ]),
      ve(Jc, {
        open: I.value,
        onClose: $[5] || ($[5] = (F) => I.value = !1),
        onApplied: q
      }, null, 8, ["open"]),
      ve(Mc, {
        open: ne.value,
        onClose: $[6] || ($[6] = (F) => ne.value = !1),
        onApplied: q
      }, null, 8, ["open"])
    ], 8, xd));
  }
}), Kd = /* @__PURE__ */ ku(Bd, { shadowRoot: !1 });
customElements.get("yarr-settings-app") || customElements.define("yarr-settings-app", Kd);
