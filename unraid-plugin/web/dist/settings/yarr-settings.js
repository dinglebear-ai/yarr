/**
* @vue/shared v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function hs(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const ee = {}, It = [], Ge = () => {
}, Ar = () => !1, In = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), On = (e) => e.startsWith("onUpdate:"), ie = Object.assign, ps = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, Ui = Object.prototype.hasOwnProperty, G = (e, t) => Ui.call(e, t), V = Array.isArray, Ot = (e) => an(e) === "[object Map]", Yt = (e) => an(e) === "[object Set]", Vs = (e) => an(e) === "[object Date]", j = (e) => typeof e == "function", re = (e) => typeof e == "string", Le = (e) => typeof e == "symbol", X = (e) => e !== null && typeof e == "object", xr = (e) => (X(e) || j(e)) && j(e.then) && j(e.catch), Er = Object.prototype.toString, an = (e) => Er.call(e), Li = (e) => an(e).slice(8, -1), kn = (e) => an(e) === "[object Object]", gs = (e) => re(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Gt = /* @__PURE__ */ hs(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), Pn = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((n) => t[n] || (t[n] = e(n)));
}, Di = /-\w/g, Ce = Pn(
  (e) => e.replace(Di, (t) => t.slice(1).toUpperCase())
), Ni = /\B([A-Z])/g, ke = Pn(
  (e) => e.replace(Ni, "-$1").toLowerCase()
), Rr = Pn((e) => e.charAt(0).toUpperCase() + e.slice(1)), Kn = Pn(
  (e) => e ? `on${Rr(e)}` : ""
), We = (e, t) => !Object.is(e, t), bn = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, Tr = (e, t, n, s = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, Mn = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
}, Bs = (e) => {
  const t = re(e) ? Number(e) : NaN;
  return isNaN(t) ? e : t;
};
let Fs;
const Un = () => Fs || (Fs = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof globalThis < "u" ? globalThis : {});
function bs(e) {
  if (V(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], r = re(s) ? Fi(s) : bs(s);
      if (r)
        for (const i in r)
          t[i] = r[i];
    }
    return t;
  } else if (re(e) || X(e))
    return e;
}
const Yi = /;(?![^(]*\))/g, Vi = /:([^]+)/, Bi = /\/\*[^]*?\*\//g;
function Fi(e) {
  const t = {};
  return e.replace(Bi, "").split(Yi).forEach((n) => {
    if (n) {
      const s = n.split(Vi);
      s.length > 1 && (t[s[0].trim()] = s[1].trim());
    }
  }), t;
}
function xt(e) {
  let t = "";
  if (re(e))
    t = e;
  else if (V(e))
    for (let n = 0; n < e.length; n++) {
      const s = xt(e[n]);
      s && (t += s + " ");
    }
  else if (X(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const Hi = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", ji = /* @__PURE__ */ hs(Hi);
function $r(e) {
  return !!e || e === "";
}
function Ki(e, t) {
  if (e.length !== t.length) return !1;
  let n = !0;
  for (let s = 0; n && s < e.length; s++)
    n = Vt(e[s], t[s]);
  return n;
}
function Vt(e, t) {
  if (e === t) return !0;
  let n = Vs(e), s = Vs(t);
  if (n || s)
    return n && s ? e.getTime() === t.getTime() : !1;
  if (n = Le(e), s = Le(t), n || s)
    return e === t;
  if (n = V(e), s = V(t), n || s)
    return n && s ? Ki(e, t) : !1;
  if (n = X(e), s = X(t), n || s) {
    if (!n || !s)
      return !1;
    const r = Object.keys(e).length, i = Object.keys(t).length;
    if (r !== i)
      return !1;
    for (const l in e) {
      const a = e.hasOwnProperty(l), o = t.hasOwnProperty(l);
      if (a && !o || !a && o || !Vt(e[l], t[l]))
        return !1;
    }
  }
  return String(e) === String(t);
}
function vs(e, t) {
  return e.findIndex((n) => Vt(n, t));
}
const Ir = (e) => !!(e && e.__v_isRef === !0), U = (e) => re(e) ? e : e == null ? "" : V(e) || X(e) && (e.toString === Er || !j(e.toString)) ? Ir(e) ? U(e.value) : JSON.stringify(e, Or, 2) : String(e), Or = (e, t) => Ir(t) ? Or(e, t.value) : Ot(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, r], i) => (n[qn(s, i) + " =>"] = r, n),
    {}
  )
} : Yt(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => qn(n))
} : Le(t) ? qn(t) : X(t) && !V(t) && !kn(t) ? String(t) : t, qn = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    Le(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
/**
* @vue/reactivity v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let de;
class qi {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !t && de && (de.active ? (this.parent = de, this.index = (de.scopes || (de.scopes = [])).push(
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
        const r = this.scopes.slice();
        for (t = 0, n = r.length; t < n; t++)
          r[t].resume();
      }
      const s = this.effects.slice();
      for (t = 0, n = s.length; t < n; t++)
        s[t].resume();
    }
  }
  run(t) {
    if (this._active) {
      const n = de;
      try {
        return de = this, t();
      } finally {
        de = n;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = de, de = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (de === this)
        de = this.prevScope;
      else {
        let t = de;
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
        const r = this.scopes.slice();
        for (n = 0, s = r.length; n < s; n++)
          r[n].stop(!0);
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !t) {
        const r = this.parent.scopes.pop();
        r && r !== this && (this.parent.scopes[this.index] = r, r.index = this.index);
      }
      this.parent = void 0;
    }
  }
}
function Wi() {
  return de;
}
let ne;
const Wn = /* @__PURE__ */ new WeakSet();
class kr {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, de && (de.active ? de.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, Wn.has(this) && (Wn.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || Mr(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, Hs(this), Ur(this);
    const t = ne, n = Ue;
    ne = this, Ue = !0;
    try {
      return this.fn();
    } finally {
      Lr(this), ne = t, Ue = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        _s(t);
      this.deps = this.depsTail = void 0, Hs(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? Wn.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    ns(this) && this.run();
  }
  get dirty() {
    return ns(this);
  }
}
let Pr = 0, Jt, zt;
function Mr(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = zt, zt = e;
    return;
  }
  e.next = Jt, Jt = e;
}
function ys() {
  Pr++;
}
function ms() {
  if (--Pr > 0)
    return;
  if (zt) {
    let t = zt;
    for (zt = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; Jt; ) {
    let t = Jt;
    for (Jt = void 0; t; ) {
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
function Ur(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function Lr(e) {
  let t, n = e.depsTail, s = n;
  for (; s; ) {
    const r = s.prevDep;
    s.version === -1 ? (s === n && (n = r), _s(s), Gi(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = r;
  }
  e.deps = t, e.depsTail = n;
}
function ns(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (Dr(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function Dr(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === tn) || (e.globalVersion = tn, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !ns(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = ne, s = Ue;
  ne = e, Ue = !0;
  try {
    Ur(e);
    const r = e.fn(e._value);
    (t.version === 0 || We(r, e._value)) && (e.flags |= 128, e._value = r, t.version++);
  } catch (r) {
    throw t.version++, r;
  } finally {
    ne = n, Ue = s, Lr(e), e.flags &= -3;
  }
}
function _s(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: r } = e;
  if (s && (s.nextSub = r, e.prevSub = void 0), r && (r.prevSub = s, e.nextSub = void 0), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let i = n.computed.deps; i; i = i.nextDep)
      _s(i, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function Gi(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let Ue = !0;
const Nr = [];
function ot() {
  Nr.push(Ue), Ue = !1;
}
function lt() {
  const e = Nr.pop();
  Ue = e === void 0 ? !0 : e;
}
function Hs(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = ne;
    ne = void 0;
    try {
      t();
    } finally {
      ne = n;
    }
  }
}
let tn = 0;
class Ji {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class ws {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!ne || !Ue || ne === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== ne)
      n = this.activeLink = new Ji(ne, this), ne.deps ? (n.prevDep = ne.depsTail, ne.depsTail.nextDep = n, ne.depsTail = n) : ne.deps = ne.depsTail = n, Yr(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = ne.depsTail, n.nextDep = void 0, ne.depsTail.nextDep = n, ne.depsTail = n, ne.deps === n && (ne.deps = s);
    }
    return n;
  }
  trigger(t) {
    this.version++, tn++, this.notify(t);
  }
  notify(t) {
    ys();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      ms();
    }
  }
}
function Yr(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let s = t.deps; s; s = s.nextDep)
        Yr(s);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
  }
}
const ss = /* @__PURE__ */ new WeakMap(), wt = /* @__PURE__ */ Symbol(
  ""
), rs = /* @__PURE__ */ Symbol(
  ""
), nn = /* @__PURE__ */ Symbol(
  ""
);
function pe(e, t, n) {
  if (Ue && ne) {
    let s = ss.get(e);
    s || ss.set(e, s = /* @__PURE__ */ new Map());
    let r = s.get(n);
    r || (s.set(n, r = new ws()), r.map = s, r.key = n), r.track();
  }
}
function tt(e, t, n, s, r, i) {
  const l = ss.get(e);
  if (!l) {
    tn++;
    return;
  }
  const a = (o) => {
    o && o.trigger();
  };
  if (ys(), t === "clear")
    l.forEach(a);
  else {
    const o = V(e), u = o && gs(n);
    if (o && n === "length") {
      const c = Number(s);
      l.forEach((p, v) => {
        (v === "length" || v === nn || !Le(v) && v >= c) && a(p);
      });
    } else
      switch ((n !== void 0 || l.has(void 0)) && a(l.get(n)), u && a(l.get(nn)), t) {
        case "add":
          o ? u && a(l.get("length")) : (a(l.get(wt)), Ot(e) && a(l.get(rs)));
          break;
        case "delete":
          o || (a(l.get(wt)), Ot(e) && a(l.get(rs)));
          break;
        case "set":
          Ot(e) && a(l.get(wt));
          break;
      }
  }
  ms();
}
function Tt(e) {
  const t = /* @__PURE__ */ J(e);
  return t === e ? t : (pe(t, "iterate", nn), /* @__PURE__ */ Pe(e) ? t : t.map(De));
}
function Ln(e) {
  return pe(e = /* @__PURE__ */ J(e), "iterate", nn), e;
}
function Ke(e, t) {
  return /* @__PURE__ */ at(e) ? Ut(/* @__PURE__ */ St(e) ? De(t) : t) : De(t);
}
const zi = {
  __proto__: null,
  [Symbol.iterator]() {
    return Gn(this, Symbol.iterator, (e) => Ke(this, e));
  },
  concat(...e) {
    return Tt(this).concat(
      ...e.map((t) => V(t) ? Tt(t) : t)
    );
  },
  entries() {
    return Gn(this, "entries", (e) => (e[1] = Ke(this, e[1]), e));
  },
  every(e, t) {
    return Xe(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return Xe(
      this,
      "filter",
      e,
      t,
      (n) => n.map((s) => Ke(this, s)),
      arguments
    );
  },
  find(e, t) {
    return Xe(
      this,
      "find",
      e,
      t,
      (n) => Ke(this, n),
      arguments
    );
  },
  findIndex(e, t) {
    return Xe(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return Xe(
      this,
      "findLast",
      e,
      t,
      (n) => Ke(this, n),
      arguments
    );
  },
  findLastIndex(e, t) {
    return Xe(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return Xe(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return Jn(this, "includes", e);
  },
  indexOf(...e) {
    return Jn(this, "indexOf", e);
  },
  join(e) {
    return Tt(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return Jn(this, "lastIndexOf", e);
  },
  map(e, t) {
    return Xe(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return Ht(this, "pop");
  },
  push(...e) {
    return Ht(this, "push", e);
  },
  reduce(e, ...t) {
    return js(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return js(this, "reduceRight", e, t);
  },
  shift() {
    return Ht(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return Xe(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return Ht(this, "splice", e);
  },
  toReversed() {
    return Tt(this).toReversed();
  },
  toSorted(e) {
    return Tt(this).toSorted(e);
  },
  toSpliced(...e) {
    return Tt(this).toSpliced(...e);
  },
  unshift(...e) {
    return Ht(this, "unshift", e);
  },
  values() {
    return Gn(this, "values", (e) => Ke(this, e));
  }
};
function Gn(e, t, n) {
  const s = Ln(e), r = s[t]();
  return s !== e && !/* @__PURE__ */ Pe(e) && (r._next = r.next, r.next = () => {
    const i = r._next();
    return i.done || (i.value = n(i.value)), i;
  }), r;
}
const Qi = Array.prototype;
function Xe(e, t, n, s, r, i) {
  const l = Ln(e), a = l !== e && !/* @__PURE__ */ Pe(e), o = l[t];
  if (o !== Qi[t]) {
    const p = o.apply(e, i);
    return a ? De(p) : p;
  }
  let u = n;
  l !== e && (a ? u = function(p, v) {
    return n.call(this, Ke(e, p), v, e);
  } : n.length > 2 && (u = function(p, v) {
    return n.call(this, p, v, e);
  }));
  const c = o.call(l, u, s);
  return a && r ? r(c) : c;
}
function js(e, t, n, s) {
  const r = Ln(e), i = r !== e && !/* @__PURE__ */ Pe(e);
  let l = n, a = !1;
  r !== e && (i ? (a = s.length === 0, l = function(u, c, p) {
    return a && (a = !1, u = Ke(e, u)), n.call(this, u, Ke(e, c), p, e);
  }) : n.length > 3 && (l = function(u, c, p) {
    return n.call(this, u, c, p, e);
  }));
  const o = r[t](l, ...s);
  return a ? Ke(e, o) : o;
}
function Jn(e, t, n) {
  const s = /* @__PURE__ */ J(e);
  pe(s, "iterate", nn);
  const r = s[t](...n);
  return (r === -1 || r === !1) && /* @__PURE__ */ xs(n[0]) ? (n[0] = /* @__PURE__ */ J(n[0]), s[t](...n)) : r;
}
function Ht(e, t, n = []) {
  ot(), ys();
  const s = (/* @__PURE__ */ J(e))[t].apply(e, n);
  return ms(), lt(), s;
}
const Xi = /* @__PURE__ */ hs("__proto__,__v_isRef,__isVue"), Vr = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Le)
);
function Zi(e) {
  Le(e) || (e = String(e));
  const t = /* @__PURE__ */ J(this);
  return pe(t, "has", e), t.hasOwnProperty(e);
}
class Br {
  constructor(t = !1, n = !1) {
    this._isReadonly = t, this._isShallow = n;
  }
  get(t, n, s) {
    if (n === "__v_skip") return t.__v_skip;
    const r = this._isReadonly, i = this._isShallow;
    if (n === "__v_isReactive")
      return !r;
    if (n === "__v_isReadonly")
      return r;
    if (n === "__v_isShallow")
      return i;
    if (n === "__v_raw")
      return s === (r ? i ? uo : Kr : i ? jr : Hr).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(s) ? t : void 0;
    const l = V(t);
    if (!r) {
      let o;
      if (l && (o = zi[n]))
        return o;
      if (n === "hasOwnProperty")
        return Zi;
    }
    const a = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ be(t) ? t : s
    );
    if ((Le(n) ? Vr.has(n) : Xi(n)) || (r || pe(t, "get", n), i))
      return a;
    if (/* @__PURE__ */ be(a)) {
      const o = l && gs(n) ? a : a.value;
      return r && X(o) ? /* @__PURE__ */ os(o) : o;
    }
    return X(a) ? r ? /* @__PURE__ */ os(a) : /* @__PURE__ */ Cs(a) : a;
  }
}
class Fr extends Br {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, s, r) {
    let i = t[n];
    const l = V(t) && gs(n);
    if (!this._isShallow) {
      const u = /* @__PURE__ */ at(i);
      if (!/* @__PURE__ */ Pe(s) && !/* @__PURE__ */ at(s) && (i = /* @__PURE__ */ J(i), s = /* @__PURE__ */ J(s)), !l && /* @__PURE__ */ be(i) && !/* @__PURE__ */ be(s))
        return u || (i.value = s), !0;
    }
    const a = l ? Number(n) < t.length : G(t, n), o = Reflect.set(
      t,
      n,
      s,
      /* @__PURE__ */ be(t) ? t : r
    );
    return t === /* @__PURE__ */ J(r) && o && (a ? We(s, i) && tt(t, "set", n, s) : tt(t, "add", n, s)), o;
  }
  deleteProperty(t, n) {
    const s = G(t, n);
    t[n];
    const r = Reflect.deleteProperty(t, n);
    return r && s && tt(t, "delete", n, void 0), r;
  }
  has(t, n) {
    const s = Reflect.has(t, n);
    return (!Le(n) || !Vr.has(n)) && pe(t, "has", n), s;
  }
  ownKeys(t) {
    return pe(
      t,
      "iterate",
      V(t) ? "length" : wt
    ), Reflect.ownKeys(t);
  }
}
class eo extends Br {
  constructor(t = !1) {
    super(!0, t);
  }
  set(t, n) {
    return !0;
  }
  deleteProperty(t, n) {
    return !0;
  }
}
const to = /* @__PURE__ */ new Fr(), no = /* @__PURE__ */ new eo(), so = /* @__PURE__ */ new Fr(!0);
const is = (e) => e, hn = (e) => Reflect.getPrototypeOf(e);
function ro(e, t, n) {
  return function(...s) {
    const r = this.__v_raw, i = /* @__PURE__ */ J(r), l = Ot(i), a = e === "entries" || e === Symbol.iterator && l, o = e === "keys" && l, u = r[e](...s), c = n ? is : t ? Ut : De;
    return !t && pe(
      i,
      "iterate",
      o ? rs : wt
    ), ie(
      // inheriting all iterator properties
      Object.create(u),
      {
        // iterator protocol
        next() {
          const { value: p, done: v } = u.next();
          return v ? { value: p, done: v } : {
            value: a ? [c(p[0]), c(p[1])] : c(p),
            done: v
          };
        }
      }
    );
  };
}
function pn(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function io(e, t) {
  const n = {
    get(r) {
      const i = this.__v_raw, l = /* @__PURE__ */ J(i), a = /* @__PURE__ */ J(r);
      e || (We(r, a) && pe(l, "get", r), pe(l, "get", a));
      const { has: o } = hn(l), u = t ? is : e ? Ut : De;
      if (o.call(l, r))
        return u(i.get(r));
      if (o.call(l, a))
        return u(i.get(a));
      i !== l && i.get(r);
    },
    get size() {
      const r = this.__v_raw;
      return !e && pe(/* @__PURE__ */ J(r), "iterate", wt), r.size;
    },
    has(r) {
      const i = this.__v_raw, l = /* @__PURE__ */ J(i), a = /* @__PURE__ */ J(r);
      return e || (We(r, a) && pe(l, "has", r), pe(l, "has", a)), r === a ? i.has(r) : i.has(r) || i.has(a);
    },
    forEach(r, i) {
      const l = this, a = l.__v_raw, o = /* @__PURE__ */ J(a), u = t ? is : e ? Ut : De;
      return !e && pe(o, "iterate", wt), a.forEach((c, p) => r.call(i, u(c), u(p), l));
    }
  };
  return ie(
    n,
    e ? {
      add: pn("add"),
      set: pn("set"),
      delete: pn("delete"),
      clear: pn("clear")
    } : {
      add(r) {
        const i = /* @__PURE__ */ J(this), l = hn(i), a = /* @__PURE__ */ J(r), o = !t && !/* @__PURE__ */ Pe(r) && !/* @__PURE__ */ at(r) ? a : r;
        return l.has.call(i, o) || We(r, o) && l.has.call(i, r) || We(a, o) && l.has.call(i, a) || (i.add(o), tt(i, "add", o, o)), this;
      },
      set(r, i) {
        !t && !/* @__PURE__ */ Pe(i) && !/* @__PURE__ */ at(i) && (i = /* @__PURE__ */ J(i));
        const l = /* @__PURE__ */ J(this), { has: a, get: o } = hn(l);
        let u = a.call(l, r);
        u || (r = /* @__PURE__ */ J(r), u = a.call(l, r));
        const c = o.call(l, r);
        return l.set(r, i), u ? We(i, c) && tt(l, "set", r, i) : tt(l, "add", r, i), this;
      },
      delete(r) {
        const i = /* @__PURE__ */ J(this), { has: l, get: a } = hn(i);
        let o = l.call(i, r);
        o || (r = /* @__PURE__ */ J(r), o = l.call(i, r)), a && a.call(i, r);
        const u = i.delete(r);
        return o && tt(i, "delete", r, void 0), u;
      },
      clear() {
        const r = /* @__PURE__ */ J(this), i = r.size !== 0, l = r.clear();
        return i && tt(
          r,
          "clear",
          void 0,
          void 0
        ), l;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((r) => {
    n[r] = ro(r, e, t);
  }), n;
}
function Ss(e, t) {
  const n = io(e, t);
  return (s, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? s : Reflect.get(
    G(n, r) && r in s ? n : s,
    r,
    i
  );
}
const oo = {
  get: /* @__PURE__ */ Ss(!1, !1)
}, lo = {
  get: /* @__PURE__ */ Ss(!1, !0)
}, ao = {
  get: /* @__PURE__ */ Ss(!0, !1)
};
const Hr = /* @__PURE__ */ new WeakMap(), jr = /* @__PURE__ */ new WeakMap(), Kr = /* @__PURE__ */ new WeakMap(), uo = /* @__PURE__ */ new WeakMap();
function co(e) {
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
function Cs(e) {
  return /* @__PURE__ */ at(e) ? e : As(
    e,
    !1,
    to,
    oo,
    Hr
  );
}
// @__NO_SIDE_EFFECTS__
function fo(e) {
  return As(
    e,
    !1,
    so,
    lo,
    jr
  );
}
// @__NO_SIDE_EFFECTS__
function os(e) {
  return As(
    e,
    !0,
    no,
    ao,
    Kr
  );
}
function As(e, t, n, s, r) {
  if (!X(e) || e.__v_raw && !(t && e.__v_isReactive) || e.__v_skip || !Object.isExtensible(e))
    return e;
  const i = r.get(e);
  if (i)
    return i;
  const l = co(Li(e));
  if (l === 0)
    return e;
  const a = new Proxy(
    e,
    l === 2 ? s : n
  );
  return r.set(e, a), a;
}
// @__NO_SIDE_EFFECTS__
function St(e) {
  return /* @__PURE__ */ at(e) ? /* @__PURE__ */ St(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function at(e) {
  return !!(e && e.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function Pe(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function xs(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function J(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ J(t) : e;
}
function ho(e) {
  return !G(e, "__v_skip") && Object.isExtensible(e) && Tr(e, "__v_skip", !0), e;
}
const De = (e) => X(e) ? /* @__PURE__ */ Cs(e) : e, Ut = (e) => X(e) ? /* @__PURE__ */ os(e) : e;
// @__NO_SIDE_EFFECTS__
function be(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function H(e) {
  return po(e, !1);
}
function po(e, t) {
  return /* @__PURE__ */ be(e) ? e : new go(e, t);
}
class go {
  constructor(t, n) {
    this.dep = new ws(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : /* @__PURE__ */ J(t), this._value = n ? t : De(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, s = this.__v_isShallow || /* @__PURE__ */ Pe(t) || /* @__PURE__ */ at(t);
    t = s ? t : /* @__PURE__ */ J(t), We(t, n) && (this._rawValue = t, this._value = s ? t : De(t), this.dep.trigger());
  }
}
function qr(e) {
  return /* @__PURE__ */ be(e) ? e.value : e;
}
const bo = {
  get: (e, t, n) => t === "__v_raw" ? e : qr(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const r = e[t];
    return /* @__PURE__ */ be(r) && !/* @__PURE__ */ be(n) ? (r.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function Wr(e) {
  return /* @__PURE__ */ St(e) ? e : new Proxy(e, bo);
}
class vo {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new ws(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = tn - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    ne !== this)
      return Mr(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return Dr(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
// @__NO_SIDE_EFFECTS__
function yo(e, t, n = !1) {
  let s, r;
  return j(e) ? s = e : (s = e.get, r = e.set), new vo(s, r, n);
}
const gn = {}, _n = /* @__PURE__ */ new WeakMap();
let _t;
function mo(e, t = !1, n = _t) {
  if (n) {
    let s = _n.get(n);
    s || _n.set(n, s = []), s.push(e);
  }
}
function _o(e, t, n = ee) {
  const { immediate: s, deep: r, once: i, scheduler: l, augmentJob: a, call: o } = n, u = (b) => r ? b : /* @__PURE__ */ Pe(b) || r === !1 || r === 0 ? nt(b, 1) : nt(b);
  let c, p, v, y, k = !1, O = !1;
  if (/* @__PURE__ */ be(e) ? (p = () => e.value, k = /* @__PURE__ */ Pe(e)) : /* @__PURE__ */ St(e) ? (p = () => u(e), k = !0) : V(e) ? (O = !0, k = e.some((b) => /* @__PURE__ */ St(b) || /* @__PURE__ */ Pe(b)), p = () => e.map((b) => {
    if (/* @__PURE__ */ be(b))
      return b.value;
    if (/* @__PURE__ */ St(b))
      return u(b);
    if (j(b))
      return o ? o(b, 2) : b();
  })) : j(e) ? t ? p = o ? () => o(e, 2) : e : p = () => {
    if (v) {
      ot();
      try {
        v();
      } finally {
        lt();
      }
    }
    const b = _t;
    _t = c;
    try {
      return o ? o(e, 3, [y]) : e(y);
    } finally {
      _t = b;
    }
  } : p = Ge, t && r) {
    const b = p, B = r === !0 ? 1 / 0 : r;
    p = () => nt(b(), B);
  }
  const M = Wi(), K = () => {
    c.stop(), M && M.active && ps(M.effects, c);
  };
  if (i && t) {
    const b = t;
    t = (...B) => {
      const he = b(...B);
      return K(), he;
    };
  }
  let x = O ? new Array(e.length).fill(gn) : gn;
  const P = (b) => {
    if (!(!(c.flags & 1) || !c.dirty && !b))
      if (t) {
        const B = c.run();
        if (b || r || k || (O ? B.some((he, Ie) => We(he, x[Ie])) : We(B, x))) {
          v && v();
          const he = _t;
          _t = c;
          try {
            const Ie = [
              B,
              // pass undefined as the old value when it's changed for the first time
              x === gn ? void 0 : O && x[0] === gn ? [] : x,
              y
            ];
            x = B, o ? o(t, 3, Ie) : (
              // @ts-expect-error
              t(...Ie)
            );
          } finally {
            _t = he;
          }
        }
      } else
        c.run();
  };
  return a && a(P), c = new kr(p), c.scheduler = l ? () => l(P, !1) : P, y = (b) => mo(b, !1, c), v = c.onStop = () => {
    const b = _n.get(c);
    if (b) {
      if (o)
        o(b, 4);
      else
        for (const B of b) B();
      _n.delete(c);
    }
  }, t ? s ? P(!0) : x = c.run() : l ? l(P.bind(null, !0), !0) : c.run(), K.pause = c.pause.bind(c), K.resume = c.resume.bind(c), K.stop = K, K;
}
function nt(e, t = 1 / 0, n) {
  if (t <= 0 || !X(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t))
    return e;
  if (n.set(e, t), t--, /* @__PURE__ */ be(e))
    nt(e.value, t, n);
  else if (V(e))
    for (let s = 0; s < e.length; s++)
      nt(e[s], t, n);
  else if (Yt(e) || Ot(e))
    e.forEach((s) => {
      nt(s, t, n);
    });
  else if (kn(e)) {
    for (const s in e)
      nt(e[s], t, n);
    for (const s of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, s) && nt(e[s], t, n);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function un(e, t, n, s) {
  try {
    return s ? e(...s) : e();
  } catch (r) {
    Dn(r, t, n);
  }
}
function Ne(e, t, n, s) {
  if (j(e)) {
    const r = un(e, t, n, s);
    return r && xr(r) && r.catch((i) => {
      Dn(i, t, n);
    }), r;
  }
  if (V(e)) {
    const r = [];
    for (let i = 0; i < e.length; i++)
      r.push(Ne(e[i], t, n, s));
    return r;
  }
}
function Dn(e, t, n, s = !0) {
  const r = t ? t.vnode : null, { errorHandler: i, throwUnhandledErrorInProduction: l } = t && t.appContext.config || ee;
  if (t) {
    let a = t.parent;
    const o = t.proxy, u = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; a; ) {
      const c = a.ec;
      if (c) {
        for (let p = 0; p < c.length; p++)
          if (c[p](e, o, u) === !1)
            return;
      }
      a = a.parent;
    }
    if (i) {
      ot(), un(i, null, 10, [
        e,
        o,
        u
      ]), lt();
      return;
    }
  }
  wo(e, n, r, s, l);
}
function wo(e, t, n, s = !0, r = !1) {
  if (r)
    throw e;
  console.error(e);
}
const ye = [];
let je = -1;
const kt = [];
let ht = null, $t = 0;
const Gr = /* @__PURE__ */ Promise.resolve();
let wn = null;
function cn(e) {
  const t = wn || Gr;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function So(e) {
  let t = je + 1, n = ye.length;
  for (; t < n; ) {
    const s = t + n >>> 1, r = ye[s], i = sn(r);
    i < e || i === e && r.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function Es(e) {
  if (!(e.flags & 1)) {
    const t = sn(e), n = ye[ye.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= sn(n) ? ye.push(e) : ye.splice(So(t), 0, e), e.flags |= 1, Jr();
  }
}
function Jr() {
  wn || (wn = Gr.then(Qr));
}
function Co(e) {
  V(e) ? kt.push(...e) : ht && e.id === -1 ? ht.splice($t + 1, 0, e) : e.flags & 1 || (kt.push(e), e.flags |= 1), Jr();
}
function Ks(e, t, n = je + 1) {
  for (; n < ye.length; n++) {
    const s = ye[n];
    if (s && s.flags & 2) {
      if (e && s.id !== e.uid)
        continue;
      ye.splice(n, 1), n--, s.flags & 4 && (s.flags &= -2), s(), s.flags & 4 || (s.flags &= -2);
    }
  }
}
function zr(e) {
  if (kt.length) {
    const t = [...new Set(kt)].sort(
      (n, s) => sn(n) - sn(s)
    );
    if (kt.length = 0, ht) {
      ht.push(...t);
      return;
    }
    for (ht = t, $t = 0; $t < ht.length; $t++) {
      const n = ht[$t];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    ht = null, $t = 0;
  }
}
const sn = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function Qr(e) {
  try {
    for (je = 0; je < ye.length; je++) {
      const t = ye[je];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), un(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; je < ye.length; je++) {
      const t = ye[je];
      t && (t.flags &= -2);
    }
    je = -1, ye.length = 0, zr(), wn = null, (ye.length || kt.length) && Qr();
  }
}
let ge = null, Xr = null;
function Sn(e) {
  const t = ge;
  return ge = e, Xr = e && e.type.__scopeId || null, t;
}
function At(e, t = ge, n) {
  if (!t || e._n)
    return e;
  const s = (...r) => {
    s._d && sr(-1);
    const i = Sn(t), l = rt.length;
    let a;
    try {
      a = e(...r);
    } finally {
      for (let o = rt.length; o > l; o--) Is();
      Sn(i), s._d && sr(1);
    }
    return a;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function Ct(e, t) {
  if (ge === null)
    return e;
  const n = Fn(ge), s = e.dirs || (e.dirs = []);
  for (let r = 0; r < t.length; r++) {
    let [i, l, a, o = ee] = t[r];
    i && (j(i) && (i = {
      mounted: i,
      updated: i
    }), i.deep && nt(l), s.push({
      dir: i,
      instance: n,
      value: l,
      oldValue: void 0,
      arg: a,
      modifiers: o
    }));
  }
  return e;
}
function yt(e, t, n, s) {
  const r = e.dirs, i = t && t.dirs;
  for (let l = 0; l < r.length; l++) {
    const a = r[l];
    i && (a.oldValue = i[l].value);
    let o = a.dir[s];
    o && (ot(), Ne(o, n, 8, [
      e.el,
      a,
      e,
      t
    ]), lt());
  }
}
function Ao(e, t) {
  if (me) {
    let n = me.provides;
    const s = me.parent && me.parent.provides;
    s === n && (n = me.provides = Object.create(s)), n[e] = t;
  }
}
function vn(e, t, n = !1) {
  const s = Ei();
  if (s || Mt) {
    let r = Mt ? Mt._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (r && e in r)
      return r[e];
    if (arguments.length > 1)
      return n && j(t) ? t.call(s && s.proxy) : t;
  }
}
const xo = /* @__PURE__ */ Symbol.for("v-scx"), Eo = () => vn(xo);
function Je(e, t, n) {
  return Zr(e, t, n);
}
function Zr(e, t, n = ee) {
  const { immediate: s, deep: r, flush: i, once: l } = n, a = ie({}, n), o = t && s || !t && i !== "post";
  let u;
  if (on) {
    if (i === "sync") {
      const y = Eo();
      u = y.__watcherHandles || (y.__watcherHandles = []);
    } else if (!o) {
      const y = () => {
      };
      return y.stop = Ge, y.resume = Ge, y.pause = Ge, y;
    }
  }
  const c = me;
  a.call = (y, k, O) => Ne(y, c, k, O);
  let p = !1;
  i === "post" ? a.scheduler = (y) => {
    we(y, c && c.suspense);
  } : i !== "sync" && (p = !0, a.scheduler = (y, k) => {
    k ? y() : Es(y);
  }), a.augmentJob = (y) => {
    t && (y.flags |= 4), p && (y.flags |= 2, c && (y.id = c.uid, y.i = c));
  };
  const v = _o(e, t, a);
  return on && (u ? u.push(v) : o && v()), v;
}
function Ro(e, t, n) {
  const s = this.proxy, r = re(e) ? e.includes(".") ? ei(s, e) : () => s[e] : e.bind(s, s);
  let i;
  j(t) ? i = t : (i = t.handler, n = t);
  const l = fn(this), a = Zr(r, i.bind(s), n);
  return l(), a;
}
function ei(e, t) {
  const n = t.split(".");
  return () => {
    let s = e;
    for (let r = 0; r < n.length && s; r++)
      s = s[n[r]];
    return s;
  };
}
const To = /* @__PURE__ */ Symbol("_vte"), $o = (e) => e.__isTeleport, zn = /* @__PURE__ */ Symbol("_leaveCb");
function Rs(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, Rs(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
// @__NO_SIDE_EFFECTS__
function Re(e, t) {
  return j(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    ie({ name: e.name }, t, { setup: e })
  ) : e;
}
function ti() {
  const e = Ei();
  return e ? (e.appContext.config.idPrefix || "v") + "-" + e.ids[0] + e.ids[1]++ : "";
}
function ni(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function qs(e, t) {
  let n;
  return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
const Cn = /* @__PURE__ */ new WeakMap();
function Qt(e, t, n, s, r = !1) {
  if (V(e)) {
    e.forEach(
      (O, M) => Qt(
        O,
        t && (V(t) ? t[M] : t),
        n,
        s,
        r
      )
    );
    return;
  }
  if (Pt(s) && !r) {
    s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && Qt(e, t, n, s.component.subTree);
    return;
  }
  const i = s.shapeFlag & 4 ? Fn(s.component) : s.el, l = r ? null : i, { i: a, r: o } = e, u = t && t.r, c = a.refs === ee ? a.refs = {} : a.refs, p = a.setupState, v = /* @__PURE__ */ J(p), y = p === ee ? Ar : (O) => qs(c, O) ? !1 : G(v, O), k = (O, M) => !(M && qs(c, M));
  if (u != null && u !== o) {
    if (Ws(t), re(u))
      c[u] = null, y(u) && (p[u] = null);
    else if (/* @__PURE__ */ be(u)) {
      const O = t;
      k(u, O.k) && (u.value = null), O.k && (c[O.k] = null);
    }
  }
  if (j(o))
    un(o, a, 12, [l, c]);
  else {
    const O = re(o), M = /* @__PURE__ */ be(o);
    if (O || M) {
      const K = () => {
        if (e.f) {
          const x = O ? y(o) ? p[o] : c[o] : k() || !e.k ? o.value : c[e.k];
          if (r)
            V(x) && ps(x, i);
          else if (V(x))
            x.includes(i) || x.push(i);
          else if (O)
            c[o] = [i], y(o) && (p[o] = c[o]);
          else {
            const P = [i];
            k(o, e.k) && (o.value = P), e.k && (c[e.k] = P);
          }
        } else O ? (c[o] = l, y(o) && (p[o] = l)) : M && (k(o, e.k) && (o.value = l), e.k && (c[e.k] = l));
      };
      if (l) {
        const x = () => {
          K(), Cn.delete(e);
        };
        x.id = -1, Cn.set(e, x), we(x, n);
      } else
        Ws(e), K();
    }
  }
}
function Ws(e) {
  const t = Cn.get(e);
  t && (t.flags |= 8, Cn.delete(e));
}
Un().requestIdleCallback;
Un().cancelIdleCallback;
const Pt = (e) => !!e.type.__asyncLoader, si = (e) => e.type.__isKeepAlive;
function Io(e, t) {
  ri(e, "a", t);
}
function Oo(e, t) {
  ri(e, "da", t);
}
function ri(e, t, n = me) {
  const s = e.__wdc || (e.__wdc = () => {
    let r = n;
    for (; r; ) {
      if (r.isDeactivated)
        return;
      r = r.parent;
    }
    return e();
  });
  if (Nn(t, s, n), n) {
    let r = n.parent;
    for (; r && r.parent; )
      si(r.parent.vnode) && ko(s, t, n, r), r = r.parent;
  }
}
function ko(e, t, n, s) {
  const r = Nn(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  ii(() => {
    ps(s[t], r);
  }, n);
}
function Nn(e, t, n = me, s = !1) {
  if (n) {
    const r = n[e] || (n[e] = []), i = t.__weh || (t.__weh = (...l) => {
      ot();
      const a = fn(n), o = Ne(t, n, e, l);
      return a(), lt(), o;
    });
    return s ? r.unshift(i) : r.push(i), i;
  }
}
const ct = (e) => (t, n = me) => {
  (!on || e === "sp") && Nn(e, (...s) => t(...s), n);
}, Po = ct("bm"), Yn = ct("m"), Mo = ct(
  "bu"
), Uo = ct("u"), Et = ct(
  "bum"
), ii = ct("um"), Lo = ct(
  "sp"
), Do = ct("rtg"), No = ct("rtc");
function Yo(e, t = me) {
  Nn("ec", e, t);
}
const Vo = /* @__PURE__ */ Symbol.for("v-ndc");
function st(e, t, n, s) {
  let r;
  const i = n, l = V(e);
  if (l || re(e)) {
    const a = l && /* @__PURE__ */ St(e);
    let o = !1, u = !1;
    a && (o = !/* @__PURE__ */ Pe(e), u = /* @__PURE__ */ at(e), e = Ln(e)), r = new Array(e.length);
    for (let c = 0, p = e.length; c < p; c++)
      r[c] = t(
        o ? u ? Ut(De(e[c])) : De(e[c]) : e[c],
        c,
        void 0,
        i
      );
  } else if (typeof e == "number") {
    r = new Array(e);
    for (let a = 0; a < e; a++)
      r[a] = t(a + 1, a, void 0, i);
  } else if (X(e))
    if (e[Symbol.iterator])
      r = Array.from(
        e,
        (a, o) => t(a, o, void 0, i)
      );
    else {
      const a = Object.keys(e);
      r = new Array(a.length);
      for (let o = 0, u = a.length; o < u; o++) {
        const c = a[o];
        r[o] = t(e[c], c, o, i);
      }
    }
  else
    r = [];
  return r;
}
function Gs(e, t, n = {}, s, r, i) {
  if (ge.ce || ge.parent && Pt(ge.parent) && ge.parent.ce) {
    const u = n, c = Object.keys(u).length > 0;
    return t !== "default" && (u.name = t), C(), xe(
      te,
      null,
      [le("slot", u, s)],
      c ? -2 : 64
    );
  }
  let l = e[t];
  l && l._c && (l._d = !1);
  const a = rt.length;
  C();
  let o;
  try {
    const u = l && oi(l(n)), c = n.key || i || // slot content array of a dynamic conditional slot may have a branch
    // key attached in the `createSlots` helper, respect that
    u && u.key;
    o = xe(
      te,
      {
        key: (c && !Le(c) ? c : `_${t}`) + // #7256 force differentiate fallback content from actual content
        (!u && s ? "_fb" : "")
      },
      u || (s ? s() : []),
      u && e._ === 1 ? 64 : -2
    );
  } catch (u) {
    for (let c = rt.length; c > a; c--) Is();
    throw u;
  } finally {
    l && l._c && (l._d = !0);
  }
  return o.scopeId && (o.slotScopeIds = [o.scopeId + "-s"]), o;
}
function oi(e) {
  return e.some((t) => Os(t) ? !(t.type === ut || t.type === te && !oi(t.children)) : !0) ? e : null;
}
const ls = (e) => e ? Ri(e) ? Fn(e) : ls(e.parent) : null, Xt = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ ie(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => ls(e.parent),
    $root: (e) => ls(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => ai(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      Es(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = cn.bind(e.proxy)),
    $watch: (e) => Ro.bind(e)
  })
), Qn = (e, t) => e !== ee && !e.__isScriptSetup && G(e, t), Bo = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: r, props: i, accessCache: l, type: a, appContext: o } = e;
    if (t[0] !== "$") {
      const v = l[t];
      if (v !== void 0)
        switch (v) {
          case 1:
            return s[t];
          case 2:
            return r[t];
          case 4:
            return n[t];
          case 3:
            return i[t];
        }
      else {
        if (Qn(s, t))
          return l[t] = 1, s[t];
        if (r !== ee && G(r, t))
          return l[t] = 2, r[t];
        if (G(i, t))
          return l[t] = 3, i[t];
        if (n !== ee && G(n, t))
          return l[t] = 4, n[t];
        as && (l[t] = 0);
      }
    }
    const u = Xt[t];
    let c, p;
    if (u)
      return t === "$attrs" && pe(e.attrs, "get", ""), u(e);
    if (
      // css module (injected by vue-loader)
      (c = a.__cssModules) && (c = c[t])
    )
      return c;
    if (n !== ee && G(n, t))
      return l[t] = 4, n[t];
    if (
      // global properties
      p = o.config.globalProperties, G(p, t)
    )
      return p[t];
  },
  set({ _: e }, t, n) {
    const { data: s, setupState: r, ctx: i } = e;
    return Qn(r, t) ? (r[t] = n, !0) : s !== ee && G(s, t) ? (s[t] = n, !0) : G(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (i[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: r, props: i, type: l }
  }, a) {
    let o;
    return !!(n[a] || e !== ee && a[0] !== "$" && G(e, a) || Qn(t, a) || G(i, a) || G(s, a) || G(Xt, a) || G(r.config.globalProperties, a) || (o = l.__cssModules) && o[a]);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : G(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function Js(e) {
  return V(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
let as = !0;
function Fo(e) {
  const t = ai(e), n = e.proxy, s = e.ctx;
  as = !1, t.beforeCreate && zs(t.beforeCreate, e, "bc");
  const {
    // state
    data: r,
    computed: i,
    methods: l,
    watch: a,
    provide: o,
    inject: u,
    // lifecycle
    created: c,
    beforeMount: p,
    mounted: v,
    beforeUpdate: y,
    updated: k,
    activated: O,
    deactivated: M,
    beforeDestroy: K,
    beforeUnmount: x,
    destroyed: P,
    unmounted: b,
    render: B,
    renderTracked: he,
    renderTriggered: Ie,
    errorCaptured: _e,
    serverPrefetch: gt,
    // public API
    expose: Me,
    inheritAttrs: ft,
    // assets
    components: bt,
    directives: Rt,
    filters: dt
  } = t;
  if (u && Ho(u, s, null), l)
    for (const se in l) {
      const z = l[se];
      j(z) && (s[se] = z.bind(n));
    }
  if (r) {
    const se = r.call(n, n);
    X(se) && (e.data = /* @__PURE__ */ Cs(se));
  }
  if (as = !0, i)
    for (const se in i) {
      const z = i[se], Ye = j(z) ? z.bind(n, n) : j(z.get) ? z.get.bind(n, n) : Ge, vt = !j(z) && j(z.set) ? z.set.bind(n) : Ge, ze = Dt({
        get: Ye,
        set: vt
      });
      Object.defineProperty(s, se, {
        enumerable: !0,
        configurable: !0,
        get: () => ze.value,
        set: (Oe) => ze.value = Oe
      });
    }
  if (a)
    for (const se in a)
      li(a[se], s, n, se);
  if (o) {
    const se = j(o) ? o.call(n) : o;
    Reflect.ownKeys(se).forEach((z) => {
      Ao(z, se[z]);
    });
  }
  c && zs(c, e, "c");
  function ue(se, z) {
    V(z) ? z.forEach((Ye) => se(Ye.bind(n))) : z && se(z.bind(n));
  }
  if (ue(Po, p), ue(Yn, v), ue(Mo, y), ue(Uo, k), ue(Io, O), ue(Oo, M), ue(Yo, _e), ue(No, he), ue(Do, Ie), ue(Et, x), ue(ii, b), ue(Lo, gt), V(Me))
    if (Me.length) {
      const se = e.exposed || (e.exposed = {});
      Me.forEach((z) => {
        Object.defineProperty(se, z, {
          get: () => n[z],
          set: (Ye) => n[z] = Ye,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  B && e.render === Ge && (e.render = B), ft != null && (e.inheritAttrs = ft), bt && (e.components = bt), Rt && (e.directives = Rt), gt && ni(e);
}
function Ho(e, t, n = Ge) {
  V(e) && (e = us(e));
  for (const s in e) {
    const r = e[s];
    let i;
    X(r) ? "default" in r ? i = vn(
      r.from || s,
      r.default,
      !0
    ) : i = vn(r.from || s) : i = vn(r), /* @__PURE__ */ be(i) ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => i.value,
      set: (l) => i.value = l
    }) : t[s] = i;
  }
}
function zs(e, t, n) {
  Ne(
    V(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function li(e, t, n, s) {
  let r = s.includes(".") ? ei(n, s) : () => n[s];
  if (re(e)) {
    const i = t[e];
    j(i) && Je(r, i);
  } else if (j(e))
    Je(r, e.bind(n));
  else if (X(e))
    if (V(e))
      e.forEach((i) => li(i, t, n, s));
    else {
      const i = j(e.handler) ? e.handler.bind(n) : t[e.handler];
      j(i) && Je(r, i, e);
    }
}
function ai(e) {
  const t = e.type, { mixins: n, extends: s } = t, {
    mixins: r,
    optionsCache: i,
    config: { optionMergeStrategies: l }
  } = e.appContext, a = i.get(t);
  let o;
  return a ? o = a : !r.length && !n && !s ? o = t : (o = {}, r.length && r.forEach(
    (u) => An(o, u, l, !0)
  ), An(o, t, l)), X(t) && i.set(t, o), o;
}
function An(e, t, n, s = !1) {
  const { mixins: r, extends: i } = t;
  i && An(e, i, n, !0), r && r.forEach(
    (l) => An(e, l, n, !0)
  );
  for (const l in t)
    if (!(s && l === "expose")) {
      const a = jo[l] || n && n[l];
      e[l] = a ? a(e[l], t[l]) : t[l];
    }
  return e;
}
const jo = {
  data: Qs,
  props: Xs,
  emits: Xs,
  // objects
  methods: qt,
  computed: qt,
  // lifecycle
  beforeCreate: ve,
  created: ve,
  beforeMount: ve,
  mounted: ve,
  beforeUpdate: ve,
  updated: ve,
  beforeDestroy: ve,
  beforeUnmount: ve,
  destroyed: ve,
  unmounted: ve,
  activated: ve,
  deactivated: ve,
  errorCaptured: ve,
  serverPrefetch: ve,
  // assets
  components: qt,
  directives: qt,
  // watch
  watch: qo,
  // provide / inject
  provide: Qs,
  inject: Ko
};
function Qs(e, t) {
  return t ? e ? function() {
    return ie(
      j(e) ? e.call(this, this) : e,
      j(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function Ko(e, t) {
  return qt(us(e), us(t));
}
function us(e) {
  if (V(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++)
      t[e[n]] = e[n];
    return t;
  }
  return e;
}
function ve(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function qt(e, t) {
  return e ? ie(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function Xs(e, t) {
  return e ? V(e) && V(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : ie(
    /* @__PURE__ */ Object.create(null),
    Js(e),
    Js(t ?? {})
  ) : t;
}
function qo(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = ie(/* @__PURE__ */ Object.create(null), e);
  for (const s in t)
    n[s] = ve(e[s], t[s]);
  return n;
}
function ui() {
  return {
    app: null,
    config: {
      isNativeTag: Ar,
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
let Wo = 0;
function Go(e, t) {
  return function(s, r = null) {
    j(s) || (s = ie({}, s)), r != null && !X(r) && (r = null);
    const i = ui(), l = /* @__PURE__ */ new WeakSet(), a = [];
    let o = !1;
    const u = i.app = {
      _uid: Wo++,
      _component: s,
      _props: r,
      _container: null,
      _context: i,
      _instance: null,
      version: Al,
      get config() {
        return i.config;
      },
      set config(c) {
      },
      use(c, ...p) {
        return l.has(c) || (c && j(c.install) ? (l.add(c), c.install(u, ...p)) : j(c) && (l.add(c), c(u, ...p))), u;
      },
      mixin(c) {
        return i.mixins.includes(c) || i.mixins.push(c), u;
      },
      component(c, p) {
        return p ? (i.components[c] = p, u) : i.components[c];
      },
      directive(c, p) {
        return p ? (i.directives[c] = p, u) : i.directives[c];
      },
      mount(c, p, v) {
        if (!o) {
          const y = u._ceVNode || le(s, r);
          return y.appContext = i, v === !0 ? v = "svg" : v === !1 && (v = void 0), e(y, c, v), o = !0, u._container = c, c.__vue_app__ = u, Fn(y.component);
        }
      },
      onUnmount(c) {
        a.push(c);
      },
      unmount() {
        o && (Ne(
          a,
          u._instance,
          16
        ), e(null, u._container), delete u._container.__vue_app__);
      },
      provide(c, p) {
        return i.provides[c] = p, u;
      },
      runWithContext(c) {
        const p = Mt;
        Mt = u;
        try {
          return c();
        } finally {
          Mt = p;
        }
      }
    };
    return u;
  };
}
let Mt = null;
const Jo = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${Ce(t)}Modifiers`] || e[`${ke(t)}Modifiers`];
function zo(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || ee;
  let r = n;
  const i = t.startsWith("update:"), l = i && Jo(s, t.slice(7));
  l && (l.trim && (r = n.map((c) => re(c) ? c.trim() : c)), l.number && (r = n.map(Mn)));
  let a, o = s[a = Kn(t)] || // also try camelCase event handler (#2249)
  s[a = Kn(Ce(t))];
  !o && i && (o = s[a = Kn(ke(t))]), o && Ne(
    o,
    e,
    6,
    r
  );
  const u = s[a + "Once"];
  if (u) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[a])
      return;
    e.emitted[a] = !0, Ne(
      u,
      e,
      6,
      r
    );
  }
}
const Qo = /* @__PURE__ */ new WeakMap();
function ci(e, t, n = !1) {
  const s = n ? Qo : t.emitsCache, r = s.get(e);
  if (r !== void 0)
    return r;
  const i = e.emits;
  let l = {}, a = !1;
  if (!j(e)) {
    const o = (u) => {
      const c = ci(u, t, !0);
      c && (a = !0, ie(l, c));
    };
    !n && t.mixins.length && t.mixins.forEach(o), e.extends && o(e.extends), e.mixins && e.mixins.forEach(o);
  }
  return !i && !a ? (X(e) && s.set(e, null), null) : (V(i) ? i.forEach((o) => l[o] = null) : ie(l, i), X(e) && s.set(e, l), l);
}
function Vn(e, t) {
  return !e || !In(t) ? !1 : (t = t.slice(2), t = t === "Once" ? t : t.replace(/Once$/, ""), G(e, t[0].toLowerCase() + t.slice(1)) || G(e, ke(t)) || G(e, t));
}
function Zs(e) {
  const {
    type: t,
    vnode: n,
    proxy: s,
    withProxy: r,
    propsOptions: [i],
    slots: l,
    attrs: a,
    emit: o,
    render: u,
    renderCache: c,
    props: p,
    data: v,
    setupState: y,
    ctx: k,
    inheritAttrs: O
  } = e, M = Sn(e);
  let K, x;
  try {
    if (n.shapeFlag & 4) {
      const b = r || s, B = b;
      K = qe(
        u.call(
          B,
          b,
          c,
          p,
          y,
          v,
          k
        )
      ), x = a;
    } else {
      const b = t;
      K = qe(
        b.length > 1 ? b(
          p,
          { attrs: a, slots: l, emit: o }
        ) : b(
          p,
          null
        )
      ), x = t.props ? a : Xo(a);
    }
  } catch (b) {
    rt.length = 0, Dn(b, e, 1), K = le(ut);
  }
  let P = K;
  if (x && O !== !1) {
    const b = Object.keys(x), { shapeFlag: B } = P;
    b.length && B & 7 && (i && b.some(On) && (x = Zo(
      x,
      i
    )), P = Lt(P, x, !1, !0));
  }
  return n.dirs && (P = Lt(P, null, !1, !0), P.dirs = P.dirs ? P.dirs.concat(n.dirs) : n.dirs), n.transition && Rs(P, n.transition), K = P, Sn(M), K;
}
const Xo = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || In(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, Zo = (e, t) => {
  const n = {};
  for (const s in e)
    (!On(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
  return n;
};
function el(e, t, n) {
  const { props: s, children: r, component: i } = e, { props: l, children: a, patchFlag: o } = t, u = i.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (n && o >= 0) {
    if (o & 1024)
      return !0;
    if (o & 16)
      return s ? er(s, l, u) : !!l;
    if (o & 8) {
      const c = t.dynamicProps;
      for (let p = 0; p < c.length; p++) {
        const v = c[p];
        if (fi(l, s, v) && !Vn(u, v))
          return !0;
      }
    }
  } else
    return (r || a) && (!a || !a.$stable) ? !0 : s === l ? !1 : s ? l ? er(s, l, u) : !0 : !!l;
  return !1;
}
function er(e, t, n) {
  const s = Object.keys(t);
  if (s.length !== Object.keys(e).length)
    return !0;
  for (let r = 0; r < s.length; r++) {
    const i = s[r];
    if (fi(t, e, i) && !Vn(n, i))
      return !0;
  }
  return !1;
}
function fi(e, t, n) {
  const s = e[n], r = t[n];
  return n === "style" && X(s) && X(r) ? !Vt(s, r) : s !== r;
}
function tl({ vnode: e, parent: t, suspense: n }, s) {
  for (; t; ) {
    const r = t.subTree;
    if (r.suspense && r.suspense.activeBranch === e && (r.suspense.vnode.el = r.el = s, e = r), r === e)
      (e = t.vnode).el = s, t = t.parent;
    else
      break;
  }
  n && n.activeBranch === e && (n.vnode.el = s);
}
const di = {}, hi = () => Object.create(di), pi = (e) => Object.getPrototypeOf(e) === di;
function nl(e, t, n, s = !1) {
  const r = {}, i = hi();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), gi(e, t, r, i);
  for (const l in e.propsOptions[0])
    l in r || (r[l] = void 0);
  n ? e.props = s ? r : /* @__PURE__ */ fo(r) : e.type.props ? e.props = r : e.props = i, e.attrs = i;
}
function sl(e, t, n, s) {
  const {
    props: r,
    attrs: i,
    vnode: { patchFlag: l }
  } = e, a = /* @__PURE__ */ J(r), [o] = e.propsOptions;
  let u = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (s || l > 0) && !(l & 16)
  ) {
    if (l & 8) {
      const c = e.vnode.dynamicProps;
      for (let p = 0; p < c.length; p++) {
        let v = c[p];
        if (Vn(e.emitsOptions, v))
          continue;
        const y = t[v];
        if (o)
          if (G(i, v))
            y !== i[v] && (i[v] = y, u = !0);
          else {
            const k = Ce(v);
            r[k] = cs(
              o,
              a,
              k,
              y,
              e,
              !1
            );
          }
        else
          y !== i[v] && (i[v] = y, u = !0);
      }
    }
  } else {
    gi(e, t, r, i) && (u = !0);
    let c;
    for (const p in a)
      (!t || // for camelCase
      !G(t, p) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((c = ke(p)) === p || !G(t, c))) && (o ? n && // for camelCase
      (n[p] !== void 0 || // for kebab-case
      n[c] !== void 0) && (r[p] = cs(
        o,
        a,
        p,
        void 0,
        e,
        !0
      )) : delete r[p]);
    if (i !== a)
      for (const p in i)
        (!t || !G(t, p)) && (delete i[p], u = !0);
  }
  u && tt(e.attrs, "set", "");
}
function gi(e, t, n, s) {
  const [r, i] = e.propsOptions;
  let l = !1, a;
  if (t)
    for (let o in t) {
      if (Gt(o))
        continue;
      const u = t[o];
      let c;
      r && G(r, c = Ce(o)) ? !i || !i.includes(c) ? n[c] = u : (a || (a = {}))[c] = u : Vn(e.emitsOptions, o) || (!(o in s) || u !== s[o]) && (s[o] = u, l = !0);
    }
  if (i) {
    const o = /* @__PURE__ */ J(n), u = a || ee;
    for (let c = 0; c < i.length; c++) {
      const p = i[c];
      n[p] = cs(
        r,
        o,
        p,
        u[p],
        e,
        !G(u, p)
      );
    }
  }
  return l;
}
function cs(e, t, n, s, r, i) {
  const l = e[n];
  if (l != null) {
    const a = G(l, "default");
    if (a && s === void 0) {
      const o = l.default;
      if (l.type !== Function && !l.skipFactory && j(o)) {
        const { propsDefaults: u } = r;
        if (n in u)
          s = u[n];
        else {
          const c = fn(r);
          s = u[n] = o.call(
            null,
            t
          ), c();
        }
      } else
        s = o;
      r.ce && r.ce._setProp(n, s);
    }
    l[
      0
      /* shouldCast */
    ] && (i && !a ? s = !1 : l[
      1
      /* shouldCastTrue */
    ] && (s === "" || s === ke(n)) && (s = !0));
  }
  return s;
}
const rl = /* @__PURE__ */ new WeakMap();
function bi(e, t, n = !1) {
  const s = n ? rl : t.propsCache, r = s.get(e);
  if (r)
    return r;
  const i = e.props, l = {}, a = [];
  let o = !1;
  if (!j(e)) {
    const c = (p) => {
      o = !0;
      const [v, y] = bi(p, t, !0);
      ie(l, v), y && a.push(...y);
    };
    !n && t.mixins.length && t.mixins.forEach(c), e.extends && c(e.extends), e.mixins && e.mixins.forEach(c);
  }
  if (!i && !o)
    return X(e) && s.set(e, It), It;
  if (V(i))
    for (let c = 0; c < i.length; c++) {
      const p = Ce(i[c]);
      tr(p) && (l[p] = ee);
    }
  else if (i)
    for (const c in i) {
      const p = Ce(c);
      if (tr(p)) {
        const v = i[c], y = l[p] = V(v) || j(v) ? { type: v } : ie({}, v), k = y.type;
        let O = !1, M = !0;
        if (V(k))
          for (let K = 0; K < k.length; ++K) {
            const x = k[K], P = j(x) && x.name;
            if (P === "Boolean") {
              O = !0;
              break;
            } else P === "String" && (M = !1);
          }
        else
          O = j(k) && k.name === "Boolean";
        y[
          0
          /* shouldCast */
        ] = O, y[
          1
          /* shouldCastTrue */
        ] = M, (O || G(y, "default")) && a.push(p);
      }
    }
  const u = [l, a];
  return X(e) && s.set(e, u), u;
}
function tr(e) {
  return e[0] !== "$" && !Gt(e);
}
const Ts = (e) => e === "_" || e === "_ctx" || e === "$stable", $s = (e) => V(e) ? e.map(qe) : [qe(e)], il = (e, t, n) => {
  if (t._n)
    return t;
  const s = At((...r) => $s(t(...r)), n);
  return s._c = !1, s;
}, vi = (e, t, n) => {
  const s = e._ctx;
  for (const r in e) {
    if (Ts(r)) continue;
    const i = e[r];
    if (j(i))
      t[r] = il(r, i, s);
    else if (i != null) {
      const l = $s(i);
      t[r] = () => l;
    }
  }
}, yi = (e, t) => {
  const n = $s(t);
  e.slots.default = () => n;
}, mi = (e, t, n) => {
  for (const s in t)
    (n || !Ts(s)) && (e[s] = t[s]);
}, ol = (e, t, n) => {
  const s = e.slots = hi();
  if (e.vnode.shapeFlag & 32) {
    const r = t._;
    r ? (mi(s, t, n), n && Tr(s, "_", r, !0)) : vi(t, s);
  } else t && yi(e, t);
}, ll = (e, t, n) => {
  const { vnode: s, slots: r } = e;
  let i = !0, l = ee;
  if (s.shapeFlag & 32) {
    const a = t._;
    a ? n && a === 1 ? i = !1 : mi(r, t, n) : (i = !t.$stable, vi(t, r)), l = t;
  } else t && (yi(e, t), l = { default: 1 });
  if (i)
    for (const a in r)
      !Ts(a) && l[a] == null && delete r[a];
}, we = dl;
function al(e) {
  return ul(e);
}
function ul(e, t) {
  const n = Un();
  n.__VUE__ = !0;
  const {
    insert: s,
    remove: r,
    patchProp: i,
    createElement: l,
    createText: a,
    createComment: o,
    setText: u,
    setElementText: c,
    parentNode: p,
    nextSibling: v,
    setScopeId: y = Ge,
    insertStaticContent: k
  } = e, O = (f, h, g, S = null, w = null, m = null, T = void 0, E = null, A = !!h.dynamicChildren) => {
    if (f === h)
      return;
    f && !jt(f, h) && (S = Qe(f), Oe(f, w, m, !0), f = null), h.patchFlag === -2 && (A = !1, h.dynamicChildren = null);
    const { type: _, ref: Y, shapeFlag: I } = h;
    switch (_) {
      case Bn:
        M(f, h, g, S);
        break;
      case ut:
        K(f, h, g, S);
        break;
      case Zn:
        f == null && x(h, g, S, T);
        break;
      case te:
        bt(
          f,
          h,
          g,
          S,
          w,
          m,
          T,
          E,
          A
        );
        break;
      default:
        I & 1 ? B(
          f,
          h,
          g,
          S,
          w,
          m,
          T,
          E,
          A
        ) : I & 6 ? Rt(
          f,
          h,
          g,
          S,
          w,
          m,
          T,
          E,
          A
        ) : (I & 64 || I & 128) && _.process(
          f,
          h,
          g,
          S,
          w,
          m,
          T,
          E,
          A,
          Bt
        );
    }
    Y != null && w ? Qt(Y, f && f.ref, m, h || f, !h) : Y == null && f && f.ref != null && Qt(f.ref, null, m, f, !0);
  }, M = (f, h, g, S) => {
    if (f == null)
      s(
        h.el = a(h.children),
        g,
        S
      );
    else {
      const w = h.el = f.el;
      h.children !== f.children && u(w, h.children);
    }
  }, K = (f, h, g, S) => {
    f == null ? s(
      h.el = o(h.children || ""),
      g,
      S
    ) : h.el = f.el;
  }, x = (f, h, g, S) => {
    [f.el, f.anchor] = k(
      f.children,
      h,
      g,
      S,
      f.el,
      f.anchor
    );
  }, P = ({ el: f, anchor: h }, g, S) => {
    let w;
    for (; f && f !== h; )
      w = v(f), s(f, g, S), f = w;
    s(h, g, S);
  }, b = ({ el: f, anchor: h }) => {
    let g;
    for (; f && f !== h; )
      g = v(f), r(f), f = g;
    r(h);
  }, B = (f, h, g, S, w, m, T, E, A) => {
    if (h.type === "svg" ? T = "svg" : h.type === "math" && (T = "mathml"), f == null)
      he(
        h,
        g,
        S,
        w,
        m,
        T,
        E,
        A
      );
    else {
      const _ = f.el && f.el._isVueCE ? f.el : null;
      try {
        _ && _._beginPatch(), gt(
          f,
          h,
          w,
          m,
          T,
          E,
          A
        );
      } finally {
        _ && _._endPatch();
      }
    }
  }, he = (f, h, g, S, w, m, T, E) => {
    let A, _;
    const { props: Y, shapeFlag: I, transition: N, dirs: F } = f;
    if (A = f.el = l(
      f.type,
      m,
      Y && Y.is,
      Y
    ), I & 8 ? c(A, f.children) : I & 16 && _e(
      f.children,
      A,
      null,
      S,
      w,
      Xn(f, m),
      T,
      E
    ), F && yt(f, null, S, "created"), Ie(A, f, f.scopeId, T, S), Y) {
      for (const Z in Y)
        Z !== "value" && !Gt(Z) && i(A, Z, null, Y[Z], m, S);
      "value" in Y && i(A, "value", null, Y.value, m), (_ = Y.onVnodeBeforeMount) && He(_, S, f);
    }
    F && yt(f, null, S, "beforeMount");
    const q = cl(w, N);
    q && N.beforeEnter(A), s(A, h, g), ((_ = Y && Y.onVnodeMounted) || q || F) && we(() => {
      try {
        _ && He(_, S, f), q && N.enter(A), F && yt(f, null, S, "mounted");
      } finally {
      }
    }, w);
  }, Ie = (f, h, g, S, w) => {
    if (g && y(f, g), S)
      for (let m = 0; m < S.length; m++)
        y(f, S[m]);
    if (w) {
      let m = w.subTree;
      if (h === m || Ci(m.type) && (m.ssContent === h || m.ssFallback === h)) {
        const T = w.vnode;
        Ie(
          f,
          T,
          T.scopeId,
          T.slotScopeIds,
          w.parent
        );
      }
    }
  }, _e = (f, h, g, S, w, m, T, E, A = 0) => {
    for (let _ = A; _ < f.length; _++) {
      const Y = f[_] = E ? et(f[_]) : qe(f[_]);
      O(
        null,
        Y,
        h,
        g,
        S,
        w,
        m,
        T,
        E
      );
    }
  }, gt = (f, h, g, S, w, m, T) => {
    const E = h.el = f.el;
    let { patchFlag: A, dynamicChildren: _, dirs: Y } = h;
    A |= f.patchFlag & 16;
    const I = f.props || ee, N = h.props || ee;
    let F;
    if (g && mt(g, !1), (F = N.onVnodeBeforeUpdate) && He(F, g, h, f), Y && yt(h, f, g, "beforeUpdate"), g && mt(g, !0), // #6385 the old vnode may be a user-wrapped non-isomorphic block
    // Force full diff when block metadata is unstable.
    _ && (!f.dynamicChildren || f.dynamicChildren.length !== _.length) && (A = 0, T = !1, _ = null), (I.innerHTML && N.innerHTML == null || I.textContent && N.textContent == null) && c(E, ""), _ ? Me(
      f.dynamicChildren,
      _,
      E,
      g,
      S,
      Xn(h, w),
      m
    ) : T || z(
      f,
      h,
      E,
      null,
      g,
      S,
      Xn(h, w),
      m,
      !1
    ), A > 0) {
      if (A & 16)
        ft(E, I, N, g, w);
      else if (A & 2 && I.class !== N.class && i(E, "class", null, N.class, w), A & 4 && i(E, "style", I.style, N.style, w), A & 8) {
        const q = h.dynamicProps;
        for (let Z = 0; Z < q.length; Z++) {
          const Q = q[Z], oe = I[Q], fe = N[Q];
          (fe !== oe || Q === "value") && i(E, Q, oe, fe, w, g);
        }
      }
      A & 1 && f.children !== h.children && c(E, h.children);
    } else !T && _ == null && ft(E, I, N, g, w);
    ((F = N.onVnodeUpdated) || Y) && we(() => {
      F && He(F, g, h, f), Y && yt(h, f, g, "updated");
    }, S);
  }, Me = (f, h, g, S, w, m, T) => {
    for (let E = 0; E < h.length; E++) {
      const A = f[E], _ = h[E], Y = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        A.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (A.type === te || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !jt(A, _) || // - In the case of a component, it could contain anything.
        A.shapeFlag & 198) ? p(A.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          g
        )
      );
      O(
        A,
        _,
        Y,
        null,
        S,
        w,
        m,
        T,
        !0
      );
    }
  }, ft = (f, h, g, S, w) => {
    if (h !== g) {
      if (h !== ee)
        for (const m in h)
          !Gt(m) && !(m in g) && i(
            f,
            m,
            h[m],
            null,
            w,
            S
          );
      for (const m in g) {
        if (Gt(m)) continue;
        const T = g[m], E = h[m];
        T !== E && m !== "value" && i(f, m, E, T, w, S);
      }
      "value" in g && i(f, "value", h.value, g.value, w);
    }
  }, bt = (f, h, g, S, w, m, T, E, A) => {
    const _ = h.el = f ? f.el : a(""), Y = h.anchor = f ? f.anchor : a("");
    let { patchFlag: I, dynamicChildren: N, slotScopeIds: F } = h;
    F && (E = E ? E.concat(F) : F), f == null ? (s(_, g, S), s(Y, g, S), _e(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      h.children || [],
      g,
      Y,
      w,
      m,
      T,
      E,
      A
    )) : I > 0 && I & 64 && N && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    f.dynamicChildren && f.dynamicChildren.length === N.length ? (Me(
      f.dynamicChildren,
      N,
      g,
      w,
      m,
      T,
      E
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (h.key != null || w && h === w.subTree) && _i(
      f,
      h,
      !0
      /* shallow */
    )) : z(
      f,
      h,
      g,
      Y,
      w,
      m,
      T,
      E,
      A
    );
  }, Rt = (f, h, g, S, w, m, T, E, A) => {
    h.slotScopeIds = E, f == null ? h.shapeFlag & 512 ? w.ctx.activate(
      h,
      g,
      S,
      T,
      A
    ) : dt(
      h,
      g,
      S,
      w,
      m,
      T,
      A
    ) : dn(f, h, A);
  }, dt = (f, h, g, S, w, m, T) => {
    const E = f.component = yl(
      f,
      S,
      w
    );
    if (si(f) && (E.ctx.renderer = Bt), ml(E, !1, T), E.asyncDep) {
      if (w && w.registerDep(E, ue, T), !f.el) {
        const A = E.subTree = le(ut);
        K(null, A, h, g), f.placeholder = A.el;
      }
    } else
      ue(
        E,
        f,
        h,
        g,
        w,
        m,
        T
      );
  }, dn = (f, h, g) => {
    const S = h.component = f.component;
    if (el(f, h, g))
      if (S.asyncDep && !S.asyncResolved) {
        se(S, h, g);
        return;
      } else
        S.next = h, S.update();
    else
      h.el = f.el, S.vnode = h;
  }, ue = (f, h, g, S, w, m, T) => {
    const E = () => {
      if (f.isMounted) {
        let { next: I, bu: N, u: F, parent: q, vnode: Z } = f;
        {
          const Be = wi(f);
          if (Be) {
            I && (I.el = Z.el, se(f, I, T)), Be.asyncDep.then(() => {
              we(() => {
                f.isUnmounted || _();
              }, w);
            });
            return;
          }
        }
        let Q = I, oe;
        mt(f, !1), I ? (I.el = Z.el, se(f, I, T)) : I = Z, N && bn(N), (oe = I.props && I.props.onVnodeBeforeUpdate) && He(oe, q, I, Z), mt(f, !0);
        const fe = Zs(f), Ve = f.subTree;
        f.subTree = fe, O(
          Ve,
          fe,
          // parent may have changed if it's in a teleport
          p(Ve.el),
          // anchor may have changed if it's in a fragment
          Qe(Ve),
          f,
          w,
          m
        ), I.el = fe.el, Q === null && tl(f, fe.el), F && we(F, w), (oe = I.props && I.props.onVnodeUpdated) && we(
          () => He(oe, q, I, Z),
          w
        );
      } else {
        let I;
        const { el: N, props: F } = h, { bm: q, m: Z, parent: Q, root: oe, type: fe } = f, Ve = Pt(h);
        mt(f, !1), q && bn(q), !Ve && (I = F && F.onVnodeBeforeMount) && He(I, Q, h), mt(f, !0);
        {
          oe.ce && oe.ce._hasShadowRoot() && oe.ce._injectChildStyle(
            fe,
            f.parent ? f.parent.type : void 0
          );
          const Be = f.subTree = Zs(f);
          O(
            null,
            Be,
            g,
            S,
            f,
            w,
            m
          ), h.el = Be.el;
        }
        if (Z && we(Z, w), !Ve && (I = F && F.onVnodeMounted)) {
          const Be = h;
          we(
            () => He(I, Q, Be),
            w
          );
        }
        (h.shapeFlag & 256 || Q && Pt(Q.vnode) && Q.vnode.shapeFlag & 256) && f.a && we(f.a, w), f.isMounted = !0, h = g = S = null;
      }
    };
    f.scope.on();
    const A = f.effect = new kr(E);
    f.scope.off();
    const _ = f.update = A.run.bind(A), Y = f.job = A.runIfDirty.bind(A);
    Y.i = f, Y.id = f.uid, A.scheduler = () => Es(Y), mt(f, !0), _();
  }, se = (f, h, g) => {
    h.component = f;
    const S = f.vnode.props;
    f.vnode = h, f.next = null, sl(f, h.props, S, g), ll(f, h.children, g), ot(), Ks(f), lt();
  }, z = (f, h, g, S, w, m, T, E, A = !1) => {
    const _ = f && f.children, Y = f ? f.shapeFlag : 0, I = h.children, { patchFlag: N, shapeFlag: F } = h;
    if (N > 0) {
      if (N & 128) {
        vt(
          _,
          I,
          g,
          S,
          w,
          m,
          T,
          E,
          A
        );
        return;
      } else if (N & 256) {
        Ye(
          _,
          I,
          g,
          S,
          w,
          m,
          T,
          E,
          A
        );
        return;
      }
    }
    F & 8 ? (Y & 16 && ce(_, w, m), I !== _ && c(g, I)) : Y & 16 ? F & 16 ? vt(
      _,
      I,
      g,
      S,
      w,
      m,
      T,
      E,
      A
    ) : ce(_, w, m, !0) : (Y & 8 && c(g, ""), F & 16 && _e(
      I,
      g,
      S,
      w,
      m,
      T,
      E,
      A
    ));
  }, Ye = (f, h, g, S, w, m, T, E, A) => {
    f = f || It, h = h || It;
    const _ = f.length, Y = h.length, I = Math.min(_, Y);
    let N;
    for (N = 0; N < I; N++) {
      const F = h[N] = A ? et(h[N]) : qe(h[N]);
      O(
        f[N],
        F,
        g,
        null,
        w,
        m,
        T,
        E,
        A
      );
    }
    _ > Y ? ce(
      f,
      w,
      m,
      !0,
      !1,
      I
    ) : _e(
      h,
      g,
      S,
      w,
      m,
      T,
      E,
      A,
      I
    );
  }, vt = (f, h, g, S, w, m, T, E, A) => {
    let _ = 0;
    const Y = h.length;
    let I = f.length - 1, N = Y - 1;
    for (; _ <= I && _ <= N; ) {
      const F = f[_], q = h[_] = A ? et(h[_]) : qe(h[_]);
      if (jt(F, q))
        O(
          F,
          q,
          g,
          null,
          w,
          m,
          T,
          E,
          A
        );
      else
        break;
      _++;
    }
    for (; _ <= I && _ <= N; ) {
      const F = f[I], q = h[N] = A ? et(h[N]) : qe(h[N]);
      if (jt(F, q))
        O(
          F,
          q,
          g,
          null,
          w,
          m,
          T,
          E,
          A
        );
      else
        break;
      I--, N--;
    }
    if (_ > I) {
      if (_ <= N) {
        const F = N + 1, q = F < Y ? h[F].el : S;
        for (; _ <= N; )
          O(
            null,
            h[_] = A ? et(h[_]) : qe(h[_]),
            g,
            q,
            w,
            m,
            T,
            E,
            A
          ), _++;
      }
    } else if (_ > N)
      for (; _ <= I; )
        Oe(f[_], w, m, !0), _++;
    else {
      const F = _, q = _, Z = /* @__PURE__ */ new Map();
      for (_ = q; _ <= N; _++) {
        const Ae = h[_] = A ? et(h[_]) : qe(h[_]);
        Ae.key != null && Z.set(Ae.key, _);
      }
      let Q, oe = 0;
      const fe = N - q + 1;
      let Ve = !1, Be = 0;
      const Ft = new Array(fe);
      for (_ = 0; _ < fe; _++) Ft[_] = 0;
      for (_ = F; _ <= I; _++) {
        const Ae = f[_];
        if (oe >= fe) {
          Oe(Ae, w, m, !0);
          continue;
        }
        let Fe;
        if (Ae.key != null)
          Fe = Z.get(Ae.key);
        else
          for (Q = q; Q <= N; Q++)
            if (Ft[Q - q] === 0 && jt(Ae, h[Q])) {
              Fe = Q;
              break;
            }
        Fe === void 0 ? Oe(Ae, w, m, !0) : (Ft[Fe - q] = _ + 1, Fe >= Be ? Be = Fe : Ve = !0, O(
          Ae,
          h[Fe],
          g,
          null,
          w,
          m,
          T,
          E,
          A
        ), oe++);
      }
      const Ds = Ve ? fl(Ft) : It;
      for (Q = Ds.length - 1, _ = fe - 1; _ >= 0; _--) {
        const Ae = q + _, Fe = h[Ae], Ns = h[Ae + 1], Ys = Ae + 1 < Y ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          Ns.el || Si(Ns)
        ) : S;
        Ft[_] === 0 ? O(
          null,
          Fe,
          g,
          Ys,
          w,
          m,
          T,
          E,
          A
        ) : Ve && (Q < 0 || _ !== Ds[Q] ? ze(Fe, g, Ys, 2) : Q--);
      }
    }
  }, ze = (f, h, g, S, w = null) => {
    const { el: m, type: T, transition: E, children: A, shapeFlag: _ } = f;
    if (_ & 6) {
      ze(f.component.subTree, h, g, S);
      return;
    }
    if (_ & 128) {
      f.suspense.move(h, g, S);
      return;
    }
    if (_ & 64) {
      T.move(f, h, g, Bt);
      return;
    }
    if (T === te) {
      s(m, h, g);
      for (let I = 0; I < A.length; I++)
        ze(A[I], h, g, S);
      s(f.anchor, h, g);
      return;
    }
    if (T === Zn) {
      P(f, h, g);
      return;
    }
    if (S !== 2 && _ & 1 && E)
      if (S === 0)
        E.persisted && !m[zn] ? s(m, h, g) : (E.beforeEnter(m), s(m, h, g), we(() => E.enter(m), w));
      else {
        const { leave: I, delayLeave: N, afterLeave: F } = E, q = () => {
          f.ctx.isUnmounted ? r(m) : s(m, h, g);
        }, Z = () => {
          const Q = m._isLeaving || !!m[zn];
          m._isLeaving && m[zn](
            !0
            /* cancelled */
          ), E.persisted && !Q ? q() : I(m, () => {
            q(), F && F();
          });
        };
        N ? N(m, q, Z) : Z();
      }
    else
      s(m, h, g);
  }, Oe = (f, h, g, S = !1, w = !1) => {
    const {
      type: m,
      props: T,
      ref: E,
      children: A,
      dynamicChildren: _,
      shapeFlag: Y,
      patchFlag: I,
      dirs: N,
      cacheIndex: F,
      memo: q
    } = f;
    if (I === -2 && (w = !1), E != null && (ot(), Qt(E, null, g, f, !0), lt()), F != null && (h.renderCache[F] = void 0), Y & 256) {
      h.ctx.deactivate(f);
      return;
    }
    const Z = Y & 1 && N, Q = !Pt(f);
    let oe;
    if (Q && (oe = T && T.onVnodeBeforeUnmount) && He(oe, h, f), Y & 6)
      D(f.component, g, S);
    else {
      if (Y & 128) {
        f.suspense.unmount(g, S);
        return;
      }
      Z && yt(f, null, h, "beforeUnmount"), Y & 64 ? f.type.remove(
        f,
        h,
        g,
        Bt,
        S
      ) : _ && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !_.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (m !== te || I > 0 && I & 64) ? ce(
        _,
        h,
        g,
        !1,
        !0
      ) : (m === te && I & 384 || !w && Y & 16) && ce(A, h, g), S && L(f);
    }
    const fe = q != null && F == null;
    (Q && (oe = T && T.onVnodeUnmounted) || Z || fe) && we(() => {
      oe && He(oe, h, f), Z && yt(f, null, h, "unmounted"), fe && (f.el = null);
    }, g);
  }, L = (f) => {
    const { type: h, el: g, anchor: S, transition: w } = f;
    if (h === te) {
      $(g, S);
      return;
    }
    if (h === Zn) {
      b(f);
      return;
    }
    const m = () => {
      r(g), w && !w.persisted && w.afterLeave && w.afterLeave();
    };
    if (f.shapeFlag & 1 && w && !w.persisted) {
      const { leave: T, delayLeave: E } = w, A = () => T(g, m);
      E ? E(f.el, m, A) : A();
    } else
      m();
  }, $ = (f, h) => {
    let g;
    for (; f !== h; )
      g = v(f), r(f), f = g;
    r(h);
  }, D = (f, h, g) => {
    const { bum: S, scope: w, job: m, subTree: T, um: E, m: A, a: _ } = f;
    nr(A), nr(_), S && bn(S), w.stop(), m && (m.flags |= 8, Oe(T, f, h, g)), E && we(E, h), we(() => {
      f.isUnmounted = !0;
    }, h);
  }, ce = (f, h, g, S = !1, w = !1, m = 0) => {
    for (let T = m; T < f.length; T++)
      Oe(f[T], h, g, S, w);
  }, Qe = (f) => {
    if (f.shapeFlag & 6)
      return Qe(f.component.subTree);
    if (f.shapeFlag & 128)
      return f.suspense.next();
    const h = v(f.anchor || f.el), g = h && h[To];
    return g ? v(g) : h;
  };
  let jn = !1;
  const Ls = (f, h, g) => {
    let S;
    f == null ? h._vnode && (Oe(h._vnode, null, null, !0), S = h._vnode.component) : O(
      h._vnode || null,
      f,
      h,
      null,
      null,
      null,
      g
    ), h._vnode = f, jn || (jn = !0, Ks(S), zr(), jn = !1);
  }, Bt = {
    p: O,
    um: Oe,
    m: ze,
    r: L,
    mt: dt,
    mc: _e,
    pc: z,
    pbc: Me,
    n: Qe,
    o: e
  };
  return {
    render: Ls,
    hydrate: void 0,
    createApp: Go(Ls)
  };
}
function Xn({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function mt({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function cl(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function _i(e, t, n = !1) {
  const s = e.children, r = t.children;
  if (V(s) && V(r))
    for (let i = 0; i < s.length; i++) {
      const l = s[i];
      let a = r[i];
      a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = r[i] = et(r[i]), a.el = l.el), !n && a.patchFlag !== -2 && _i(l, a)), a.type === Bn && (a.patchFlag === -1 && (a = r[i] = et(a)), a.el = l.el), a.type === ut && !a.el && (a.el = l.el);
    }
}
function fl(e) {
  const t = e.slice(), n = [0];
  let s, r, i, l, a;
  const o = e.length;
  for (s = 0; s < o; s++) {
    const u = e[s];
    if (u !== 0) {
      if (r = n[n.length - 1], e[r] < u) {
        t[s] = r, n.push(s);
        continue;
      }
      for (i = 0, l = n.length - 1; i < l; )
        a = i + l >> 1, e[n[a]] < u ? i = a + 1 : l = a;
      u < e[n[i]] && (i > 0 && (t[s] = n[i - 1]), n[i] = s);
    }
  }
  for (i = n.length, l = n[i - 1]; i-- > 0; )
    n[i] = l, l = t[l];
  return n;
}
function wi(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : wi(t);
}
function nr(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
function Si(e) {
  if (e.placeholder)
    return e.placeholder;
  const t = e.component;
  return t ? Si(t.subTree) : null;
}
const Ci = (e) => e.__isSuspense;
function dl(e, t) {
  t && t.pendingBranch ? V(e) ? t.effects.push(...e) : t.effects.push(e) : Co(e);
}
const te = /* @__PURE__ */ Symbol.for("v-fgt"), Bn = /* @__PURE__ */ Symbol.for("v-txt"), ut = /* @__PURE__ */ Symbol.for("v-cmt"), Zn = /* @__PURE__ */ Symbol.for("v-stc"), rt = [];
let Ee = null;
function C(e = !1) {
  rt.push(Ee = e ? null : []);
}
function Is() {
  rt.pop(), Ee = rt[rt.length - 1] || null;
}
let rn = 1;
function sr(e, t = !1) {
  rn += e, e < 0 && Ee && t && (Ee.hasOnce = !0);
}
function Ai(e) {
  return e.dynamicChildren = rn > 0 ? Ee || It : null, Is(), rn > 0 && Ee && Ee.push(e), e;
}
function R(e, t, n, s, r, i) {
  return Ai(
    d(
      e,
      t,
      n,
      s,
      r,
      i,
      !0
    )
  );
}
function xe(e, t, n, s, r) {
  return Ai(
    le(
      e,
      t,
      n,
      s,
      r,
      !0
    )
  );
}
function Os(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function jt(e, t) {
  return e.type === t.type && e.key === t.key;
}
const xi = ({ key: e }) => e ?? null, yn = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? re(e) || /* @__PURE__ */ be(e) || j(e) ? { i: ge, r: e, k: t, f: !!n } : e : null);
function d(e, t = null, n = null, s = 0, r = null, i = e === te ? 0 : 1, l = !1, a = !1) {
  const o = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && xi(t),
    ref: t && yn(t),
    scopeId: Xr,
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
    shapeFlag: i,
    patchFlag: s,
    dynamicProps: r,
    dynamicChildren: null,
    appContext: null,
    ctx: ge
  };
  return a ? (xn(o, n), i & 128 && e.normalize(o)) : n && (o.shapeFlag |= re(n) ? 8 : 16), rn > 0 && // avoid a block node from tracking itself
  !l && // has current parent block
  Ee && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (o.patchFlag > 0 || i & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  o.patchFlag !== 32 && Ee.push(o), o;
}
const le = hl;
function hl(e, t = null, n = null, s = 0, r = null, i = !1) {
  if ((!e || e === Vo) && (e = ut), Os(e)) {
    const a = Lt(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && xn(a, n), rn > 0 && !i && Ee && (a.shapeFlag & 6 ? Ee[Ee.indexOf(e)] = a : Ee.push(a)), a.patchFlag = -2, a;
  }
  if (Cl(e) && (e = e.__vccOpts), t) {
    t = pl(t);
    let { class: a, style: o } = t;
    a && !re(a) && (t.class = xt(a)), X(o) && (/* @__PURE__ */ xs(o) && !V(o) && (o = ie({}, o)), t.style = bs(o));
  }
  const l = re(e) ? 1 : Ci(e) ? 128 : $o(e) ? 64 : X(e) ? 4 : j(e) ? 2 : 0;
  return d(
    e,
    t,
    n,
    s,
    r,
    l,
    i,
    !0
  );
}
function pl(e) {
  return e ? /* @__PURE__ */ xs(e) || pi(e) ? ie({}, e) : e : null;
}
function Lt(e, t, n = !1, s = !1) {
  const { props: r, ref: i, patchFlag: l, children: a, transition: o } = e, u = t ? gl(r || {}, t) : r, c = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: u,
    key: u && xi(u),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && i ? V(i) ? i.concat(yn(t)) : [i, yn(t)] : yn(t)
    ) : i,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: a,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: t && e.type !== te ? l === -1 ? 16 : l | 16 : l,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: o,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && Lt(e.ssContent),
    ssFallback: e.ssFallback && Lt(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return o && s && Rs(
    c,
    o.clone(c)
  ), c;
}
function ae(e = " ", t = 0) {
  return le(Bn, null, e, t);
}
function W(e = "", t = !1) {
  return t ? (C(), xe(ut, null, e)) : le(ut, null, e);
}
function qe(e) {
  return e == null || typeof e == "boolean" ? le(ut) : V(e) ? le(
    te,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : Os(e) ? et(e) : le(Bn, null, String(e));
}
function et(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : Lt(e);
}
function xn(e, t) {
  let n = 0;
  const { shapeFlag: s } = e;
  if (t == null)
    t = null;
  else if (V(t))
    n = 16;
  else if (typeof t == "object")
    if (s & 65) {
      const r = t.default;
      r && (r._c && (r._d = !1), xn(e, r()), r._c && (r._d = !0));
      return;
    } else {
      n = 32;
      const r = t._;
      !r && !pi(t) ? t._ctx = ge : r === 3 && ge && (ge.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else if (j(t)) {
    if (s & 65) {
      xn(e, { default: t });
      return;
    }
    t = { default: t, _ctx: ge }, n = 32;
  } else
    t = String(t), s & 64 ? (n = 16, t = [ae(t)]) : n = 8;
  e.children = t, e.shapeFlag |= n;
}
function gl(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const s = e[n];
    for (const r in s)
      if (r === "class")
        t.class !== s.class && (t.class = xt([t.class, s.class]));
      else if (r === "style")
        t.style = bs([t.style, s.style]);
      else if (In(r)) {
        const i = t[r], l = s[r];
        l && i !== l && !(V(i) && i.includes(l)) ? t[r] = i ? [].concat(i, l) : l : l == null && i == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !On(r) && (t[r] = l);
      } else r !== "" && (t[r] = s[r]);
  }
  return t;
}
function He(e, t, n, s = null) {
  Ne(e, t, 7, [
    n,
    s
  ]);
}
const bl = ui();
let vl = 0;
function yl(e, t, n) {
  const s = e.type, r = (t ? t.appContext : e.appContext) || bl, i = {
    uid: vl++,
    vnode: e,
    type: s,
    parent: t,
    appContext: r,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new qi(
      !0
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: t ? t.provides : Object.create(r.provides),
    ids: t ? t.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: bi(s, r),
    emitsOptions: ci(s, r),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: ee,
    // inheritAttrs
    inheritAttrs: s.inheritAttrs,
    // state
    ctx: ee,
    data: ee,
    props: ee,
    attrs: ee,
    slots: ee,
    refs: ee,
    setupState: ee,
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
  return i.ctx = { _: i }, i.root = t ? t.root : i, i.emit = zo.bind(null, i), e.ce && e.ce(i), i;
}
let me = null;
const Ei = () => me || ge;
let En, fs;
{
  const e = Un(), t = (n, s) => {
    let r;
    return (r = e[n]) || (r = e[n] = []), r.push(s), (i) => {
      r.length > 1 ? r.forEach((l) => l(i)) : r[0](i);
    };
  };
  En = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => me = n
  ), fs = t(
    "__VUE_SSR_SETTERS__",
    (n) => on = n
  );
}
const fn = (e) => {
  const t = me;
  return En(e), e.scope.on(), () => {
    e.scope.off(), En(t);
  };
}, rr = () => {
  me && me.scope.off(), En(null);
};
function Ri(e) {
  return e.vnode.shapeFlag & 4;
}
let on = !1;
function ml(e, t = !1, n = !1) {
  t && fs(t);
  const { props: s, children: r } = e.vnode, i = Ri(e);
  nl(e, s, i, t), ol(e, r, n || t);
  const l = i ? _l(e, t) : void 0;
  return t && fs(!1), l;
}
function _l(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, Bo);
  const { setup: s } = n;
  if (s) {
    ot();
    const r = e.setupContext = s.length > 1 ? Sl(e) : null, i = fn(e), l = un(
      s,
      e,
      0,
      [
        e.props,
        r
      ]
    ), a = xr(l);
    if (lt(), i(), (a || e.sp) && !Pt(e) && ni(e), a) {
      if (l.then(rr, rr), t)
        return l.then((o) => {
          ir(e, o);
        }).catch((o) => {
          Dn(o, e, 0);
        });
      e.asyncDep = l;
    } else
      ir(e, l);
  } else
    Ti(e);
}
function ir(e, t, n) {
  j(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : X(t) && (e.setupState = Wr(t)), Ti(e);
}
function Ti(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || Ge);
  {
    const r = fn(e);
    ot();
    try {
      Fo(e);
    } finally {
      lt(), r();
    }
  }
}
const wl = {
  get(e, t) {
    return pe(e, "get", ""), e[t];
  }
};
function Sl(e) {
  const t = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, wl),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function Fn(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(Wr(ho(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in Xt)
        return Xt[n](e);
    },
    has(t, n) {
      return n in t || n in Xt;
    }
  })) : e.proxy;
}
function Cl(e) {
  return j(e) && "__vccOpts" in e;
}
const Dt = (e, t) => /* @__PURE__ */ yo(e, t, on), Al = "3.5.40";
/**
* @vue/runtime-dom v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let ds;
const or = typeof window < "u" && window.trustedTypes;
if (or)
  try {
    ds = /* @__PURE__ */ or.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const $i = ds ? (e) => ds.createHTML(e) : (e) => e, xl = "http://www.w3.org/2000/svg", El = "http://www.w3.org/1998/Math/MathML", Ze = typeof document < "u" ? document : null, lr = Ze && /* @__PURE__ */ Ze.createElement("template"), Rl = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const r = t === "svg" ? Ze.createElementNS(xl, e) : t === "mathml" ? Ze.createElementNS(El, e) : n ? Ze.createElement(e, { is: n }) : Ze.createElement(e);
    return e === "select" && s && s.multiple != null && r.setAttribute("multiple", s.multiple), r;
  },
  createText: (e) => Ze.createTextNode(e),
  createComment: (e) => Ze.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => Ze.querySelector(e),
  setScopeId(e, t) {
    e.setAttribute(t, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(e, t, n, s, r, i) {
    const l = n ? n.previousSibling : t.lastChild;
    if (r && (r === i || r.nextSibling))
      for (; t.insertBefore(r.cloneNode(!0), n), !(r === i || !(r = r.nextSibling)); )
        ;
    else {
      lr.innerHTML = $i(
        s === "svg" ? `<svg>${e}</svg>` : s === "mathml" ? `<math>${e}</math>` : e
      );
      const a = lr.content;
      if (s === "svg" || s === "mathml") {
        const o = a.firstChild;
        for (; o.firstChild; )
          a.appendChild(o.firstChild);
        a.removeChild(o);
      }
      t.insertBefore(a, n);
    }
    return [
      // first
      l ? l.nextSibling : t.firstChild,
      // last
      n ? n.previousSibling : t.lastChild
    ];
  }
}, Tl = /* @__PURE__ */ Symbol("_vtc");
function $l(e, t, n) {
  const s = e[Tl];
  s && (t = (t ? [t, ...s] : [...s]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const Rn = /* @__PURE__ */ Symbol("_vod"), Ii = /* @__PURE__ */ Symbol("_vsh"), Il = {
  // used for prop mismatch check during hydration
  name: "show",
  beforeMount(e, { value: t }, { transition: n }) {
    e[Rn] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : Kt(e, t);
  },
  mounted(e, { value: t }, { transition: n }) {
    n && t && n.enter(e);
  },
  updated(e, { value: t, oldValue: n }, { transition: s }) {
    !t != !n && (s ? t ? (s.beforeEnter(e), Kt(e, !0), s.enter(e)) : s.leave(e, () => {
      Kt(e, !1);
    }) : Kt(e, t));
  },
  beforeUnmount(e, { value: t }) {
    Kt(e, t);
  }
};
function Kt(e, t) {
  e.style.display = t ? e[Rn] : "none", e[Ii] = !t;
}
const Ol = /* @__PURE__ */ Symbol(""), kl = /(?:^|;)\s*display\s*:/;
function Pl(e, t, n) {
  const s = e.style, r = re(n);
  let i = !1;
  if (n && !r) {
    if (t)
      if (re(t))
        for (const l of t.split(";")) {
          const a = l.slice(0, l.indexOf(":")).trim();
          n[a] == null && Wt(s, a, "");
        }
      else
        for (const l in t)
          n[l] == null && Wt(s, l, "");
    for (const l in n) {
      l === "display" && (i = !0);
      const a = n[l];
      a != null ? Ul(
        e,
        l,
        !re(t) && t ? t[l] : void 0,
        a
      ) || Wt(s, l, a) : Wt(s, l, "");
    }
  } else if (r) {
    if (t !== n) {
      const l = s[Ol];
      l && (n += ";" + l), s.cssText = n, i = kl.test(n);
    }
  } else t && e.removeAttribute("style");
  Rn in e && (e[Rn] = i ? s.display : "", e[Ii] && (s.display = "none"));
}
const ar = /\s*!important$/;
function Wt(e, t, n) {
  if (V(n))
    n.forEach((s) => Wt(e, t, s));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = Ml(e, t);
    ar.test(n) ? e.setProperty(
      ke(s),
      n.replace(ar, ""),
      "important"
    ) : e[s] = n;
  }
}
const ur = ["Webkit", "Moz", "ms"], es = {};
function Ml(e, t) {
  const n = es[t];
  if (n)
    return n;
  let s = Ce(t);
  if (s !== "filter" && s in e)
    return es[t] = s;
  s = Rr(s);
  for (let r = 0; r < ur.length; r++) {
    const i = ur[r] + s;
    if (i in e)
      return es[t] = i;
  }
  return t;
}
function Ul(e, t, n, s) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && re(s) && n === s;
}
const cr = "http://www.w3.org/1999/xlink";
function fr(e, t, n, s, r, i = ji(t)) {
  s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(cr, t.slice(6, t.length)) : e.setAttributeNS(cr, t, n) : n == null || i && !$r(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    i ? "" : Le(n) ? String(n) : n
  );
}
function dr(e, t, n, s, r) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? $i(n) : n);
    return;
  }
  const i = e.tagName;
  if (t === "value" && i !== "PROGRESS" && // custom elements may use _value internally
  !i.includes("-")) {
    const a = i === "OPTION" ? e.getAttribute("value") || "" : e.value, o = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(n);
    (a !== o || !("_value" in e)) && (e.value = o), n == null && e.removeAttribute(t), e._value = n;
    return;
  }
  let l = !1;
  if (n === "" || n == null) {
    const a = typeof e[t];
    a === "boolean" ? n = $r(n) : n == null && a === "string" ? (n = "", l = !0) : a === "number" && (n = 0, l = !0);
  }
  try {
    e[t] = n;
  } catch {
  }
  l && e.removeAttribute(r || t);
}
function pt(e, t, n, s) {
  e.addEventListener(t, n, s);
}
function Ll(e, t, n, s) {
  e.removeEventListener(t, n, s);
}
const hr = /* @__PURE__ */ Symbol("_vei");
function Dl(e, t, n, s, r = null) {
  const i = e[hr] || (e[hr] = {}), l = i[t];
  if (s && l)
    l.value = s;
  else {
    const [a, o] = Vl(t);
    if (s) {
      const u = i[t] = Hl(
        s,
        r
      );
      pt(e, a, u, o);
    } else l && (Ll(e, a, l, o), i[t] = void 0);
  }
}
const Nl = /(Once|Passive|Capture)$/, Yl = /^on:?(?:Once|Passive|Capture)$/;
function Vl(e) {
  let t, n;
  for (; (n = e.match(Nl)) && !Yl.test(e); )
    t || (t = {}), e = e.slice(0, e.length - n[1].length), t[n[1].toLowerCase()] = !0;
  return [e[2] === ":" ? e.slice(3) : ke(e.slice(2)), t];
}
let ts = 0;
const Bl = /* @__PURE__ */ Promise.resolve(), Fl = () => ts || (Bl.then(() => ts = 0), ts = Date.now());
function Hl(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    const r = n.value;
    if (V(r)) {
      const i = s.stopImmediatePropagation;
      s.stopImmediatePropagation = () => {
        i.call(s), s._stopped = !0;
      };
      const l = r.slice(), a = [s];
      for (let o = 0; o < l.length && !s._stopped; o++) {
        const u = l[o];
        u && Ne(
          u,
          t,
          5,
          a
        );
      }
    } else
      Ne(
        r,
        t,
        5,
        [s]
      );
  };
  return n.value = e, n.attached = Fl(), n;
}
const pr = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, jl = (e, t, n, s, r, i) => {
  const l = r === "svg";
  t === "class" ? $l(e, s, l) : t === "style" ? Pl(e, n, s) : In(t) ? On(t) || Dl(e, t, n, s, i) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Kl(e, t, s, l)) ? (dr(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && fr(e, t, s, l, i, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (ql(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !re(s))) ? dr(e, Ce(t), s, i, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), fr(e, t, s, l));
};
function Kl(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && pr(t) && j(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const r = e.tagName;
    if (r === "IMG" || r === "VIDEO" || r === "CANVAS" || r === "SOURCE")
      return !1;
  }
  return pr(t) && re(n) ? !1 : t in e;
}
function ql(e, t) {
  const n = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!n)
    return !1;
  const s = Ce(t);
  return Array.isArray(n) ? n.some((r) => Ce(r) === s) : Object.keys(n).some((r) => Ce(r) === s);
}
const gr = {};
// @__NO_SIDE_EFFECTS__
function Wl(e, t, n) {
  let s = /* @__PURE__ */ Re(e, t);
  kn(s) && (s = ie({}, s, t));
  class r extends ks {
    constructor(l) {
      super(s, l, n);
    }
  }
  return r.def = s, r;
}
const Gl = typeof HTMLElement < "u" ? HTMLElement : class {
};
class ks extends Gl {
  constructor(t, n = {}, s = wr) {
    super(), this._def = t, this._props = n, this._createApp = s, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && s !== wr ? this._root = this.shadowRoot : t.shadowRoot !== !1 ? (this.attachShadow(
      ie({}, t.shadowRootOptions, {
        mode: "open"
      })
    ), this._root = this.shadowRoot) : this._root = this;
  }
  connectedCallback() {
    if (!this.isConnected) return;
    !this.shadowRoot && !this._resolved && this._parseSlots(), this._connected = !0;
    let t = this;
    for (; t = t && // #12479 should check assignedSlot first to get correct parent
    (t.assignedSlot || t.parentNode || t.host); )
      if (t instanceof ks) {
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
    this._connected = !1, cn(() => {
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
    const t = (s, r = !1) => {
      this._resolved = !0, this._pendingResolve = void 0;
      const { props: i, styles: l } = s;
      let a;
      if (i && !V(i))
        for (const o in i) {
          const u = i[o];
          (u === Number || u && u.type === Number) && (o in this._props && (this._props[o] = Bs(this._props[o])), (a || (a = /* @__PURE__ */ Object.create(null)))[Ce(o)] = !0);
        }
      this._numberProps = a, this._resolveProps(s), this.shadowRoot && this._applyStyles(l), this._mount(s);
    }, n = this._def.__asyncLoader;
    n ? this._pendingResolve = n().then((s) => {
      s.configureApp = this._def.configureApp, t(this._def = s, !0);
    }) : t(this._def);
  }
  _mount(t) {
    this._app = this._createApp(t), this._inheritParentContext(), t.configureApp && t.configureApp(this._app), this._app._ceVNode = this._createVNode(), this._app.mount(this._root);
    const n = this._instance && this._instance.exposed;
    if (n)
      for (const s in n)
        G(this, s) || Object.defineProperty(this, s, {
          // unwrap ref to be consistent with public instance behavior
          get: () => qr(n[s])
        });
  }
  _resolveProps(t) {
    const { props: n } = t, s = V(n) ? n : Object.keys(n || {});
    for (const r of Object.keys(this))
      r[0] !== "_" && s.includes(r) && this._setProp(r, this[r]);
    for (const r of s.map(Ce))
      Object.defineProperty(this, r, {
        get() {
          return this._getProp(r);
        },
        set(i) {
          this._setProp(r, i, !0, !this._patching);
        }
      });
  }
  _setAttr(t) {
    if (t.startsWith("data-v-")) return;
    const n = this.hasAttribute(t);
    let s = n ? this.getAttribute(t) : gr;
    const r = Ce(t);
    n && this._numberProps && this._numberProps[r] && (s = Bs(s)), this._setProp(r, s, !1, !0);
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
  _setProp(t, n, s = !0, r = !1) {
    if (n !== this._props[t] && (this._dirty = !0, n === gr ? delete this._props[t] : (this._props[t] = n, t === "key" && this._app && (this._app._ceVNode.key = n)), r && this._instance && this._update(), s)) {
      const i = this._ob;
      i && (this._processMutations(i.takeRecords()), i.disconnect()), n === !0 ? this.setAttribute(ke(t), "") : typeof n == "string" || typeof n == "number" ? this.setAttribute(ke(t), n + "") : n || this.removeAttribute(ke(t)), i && i.observe(this, { attributes: !0 });
    }
  }
  _update() {
    const t = this._createVNode();
    this._app && (t.appContext = this._app._context), Zl(t, this._root);
  }
  _createVNode() {
    const t = {};
    this.shadowRoot || (t.onVnodeMounted = t.onVnodeUpdated = this._renderSlots.bind(this));
    const n = le(this._def, ie(t, this._props));
    return this._instance || (n.ce = (s) => {
      this._instance = s, s.ce = this, s.isCE = !0;
      const r = (i, l) => {
        this.dispatchEvent(
          new CustomEvent(
            i,
            kn(l[0]) ? ie({ detail: l }, l[0]) : { detail: l }
          )
        );
      };
      s.emit = (i, ...l) => {
        r(i, l), ke(i) !== i && r(ke(i), l);
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
    const r = this._nonce, i = this.shadowRoot, l = s ? this._getStyleAnchor(s) || this._getStyleAnchor(this._def) : this._getRootStyleInsertionAnchor(i);
    let a = null;
    for (let o = t.length - 1; o >= 0; o--) {
      const u = document.createElement("style");
      r && u.setAttribute("nonce", r), u.textContent = t[o], i.insertBefore(u, a || l), a = u, o === 0 && (s || this._styleAnchors.set(this._def, u), n && this._styleAnchors.set(n, u));
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
      const r = t[s], i = r.getAttribute("name") || "default", l = this._slots[i], a = r.parentNode;
      if (l)
        for (const o of l) {
          if (n && o.nodeType === 1) {
            const u = n + "-s", c = document.createTreeWalker(o, 1);
            o.setAttribute(u, "");
            let p;
            for (; p = c.nextNode(); )
              p.setAttribute(u, "");
          }
          a.insertBefore(o, r);
        }
      else
        for (; r.firstChild; ) a.insertBefore(r.firstChild, r);
      a.removeChild(r);
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
      const r = s.querySelectorAll("slot");
      for (let i = 0; i < r.length; i++)
        n.add(r[i]);
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
  }
}
const Nt = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return V(t) ? (n) => bn(t, n) : t;
};
function Jl(e) {
  e.target.composing = !0;
}
function br(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const it = /* @__PURE__ */ Symbol("_assign");
function vr(e, t, n) {
  return t && (e = e.trim()), n && (e = Mn(e)), e;
}
const zl = {
  created(e, { modifiers: { lazy: t, trim: n, number: s } }, r) {
    e[it] = Nt(r);
    const i = s || r.props && r.props.type === "number";
    pt(e, t ? "change" : "input", (l) => {
      l.target.composing || e[it](vr(e.value, n, i));
    }), (n || i) && pt(e, "change", () => {
      e.value = vr(e.value, n, i);
    }), t || (pt(e, "compositionstart", Jl), pt(e, "compositionend", br), pt(e, "change", br));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: s, trim: r, number: i } }, l) {
    if (e[it] = Nt(l), e.composing) return;
    const a = (i || e.type === "number") && !/^0\d/.test(e.value) ? Mn(e.value) : e.value, o = t ?? "";
    if (a === o)
      return;
    const u = e.getRootNode();
    (u instanceof Document || u instanceof ShadowRoot) && u.activeElement === e && e.type !== "range" && (s && t === n || r && e.value.trim() === o) || (e.value = o);
  }
}, Tn = {
  // #4096 array checkboxes need to be deep traversed
  deep: !0,
  created(e, t, n) {
    e[it] = Nt(n), pt(e, "change", () => {
      const s = e._modelValue, r = ln(e), i = e.checked, l = e[it];
      if (V(s)) {
        const a = vs(s, r), o = a !== -1;
        if (i && !o)
          l(s.concat(r));
        else if (!i && o) {
          const u = [...s];
          u.splice(a, 1), l(u);
        }
      } else if (Yt(s)) {
        const a = new Set(s);
        i ? a.add(r) : a.delete(r), l(a);
      } else
        l(Oi(e, i));
    });
  },
  // set initial checked on mount to wait for true-value/false-value
  mounted: yr,
  beforeUpdate(e, t, n) {
    e[it] = Nt(n), yr(e, t, n);
  }
};
function yr(e, { value: t, oldValue: n }, s) {
  e._modelValue = t;
  let r;
  if (V(t))
    r = vs(t, s.props.value) > -1;
  else if (Yt(t))
    r = t.has(s.props.value);
  else {
    if (t === n) return;
    r = Vt(t, Oi(e, !0));
  }
  e.checked !== r && (e.checked = r);
}
const Ql = {
  // <select multiple> value need to be deep traversed
  deep: !0,
  created(e, { value: t, modifiers: { number: n } }, s) {
    e._modelValue = t, pt(e, "change", () => {
      const r = Array.prototype.filter.call(e.options, (i) => i.selected).map(
        (i) => n ? Mn(ln(i)) : ln(i)
      );
      e[it](
        e.multiple ? Yt(e._modelValue) ? new Set(r) : r : r[0]
      ), e._assigning = !0, cn(() => {
        e._assigning = !1;
      });
    }), e[it] = Nt(s);
  },
  // set value in mounted & updated because <select> relies on its children
  // <option>s.
  mounted(e, { value: t }) {
    mr(e, t);
  },
  beforeUpdate(e, { value: t }, n) {
    e._modelValue = t, e[it] = Nt(n);
  },
  updated(e, { value: t }) {
    e._assigning || mr(e, t);
  }
};
function mr(e, t) {
  const n = e.multiple, s = V(t);
  if (!(n && !s && !Yt(t))) {
    for (let r = 0, i = e.options.length; r < i; r++) {
      const l = e.options[r], a = ln(l);
      if (n)
        if (s) {
          const o = typeof a;
          o === "string" || o === "number" ? l.selected = t.some((u) => String(u) === String(a)) : l.selected = vs(t, a) > -1;
        } else
          l.selected = t.has(a);
      else if (Vt(ln(l), t)) {
        e.selectedIndex !== r && (e.selectedIndex = r);
        return;
      }
    }
    !n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
  }
}
function ln(e) {
  return "_value" in e ? e._value : e.value;
}
function Oi(e, t) {
  const n = t ? "_trueValue" : "_falseValue";
  return n in e ? e[n] : t;
}
const Xl = /* @__PURE__ */ ie({ patchProp: jl }, Rl);
let _r;
function ki() {
  return _r || (_r = al(Xl));
}
const Zl = ((...e) => {
  ki().render(...e);
}), wr = ((...e) => {
  const t = ki().createApp(...e), { mount: n } = t;
  return t.mount = (s) => {
    const r = ta(s);
    if (!r) return;
    const i = t._component;
    !j(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
    const l = n(r, !1, ea(r));
    return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), l;
  }, t;
});
function ea(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function ta(e) {
  return re(e) ? document.querySelector(e) : e;
}
const na = 8e3, sa = 2e3, Sr = 1e6, Se = "Unable to complete this request.", Cr = "Request timed out.", Zt = "Request cancelled.", Pi = `
  state pid version bindAddress port ready healthMessage uptimeSeconds
`, Mi = `
  plugin { enabled dashboardWidgetEnable bindMode customHost port authMode tailscaleServe tailscaleHostname logLevel updateChannel }
  services { service enabled baseUrl username hasPassword hasApiKey extra { key value } }
`, Ps = `
  config { ${Mi} }
  changed restarted rolledBack error
`, ra = `query YarrRuntime { yarrRuntime { ${Pi} } }`, ia = `query YarrConfig { yarrConfig { ${Mi} } }`, oa = `mutation SaveYarrConfig($input: SaveYarrConfigInput!) {
  saveYarrConfig(input: $input) { ${Ps} }
}`, la = `mutation ControlYarr($action: YarrControlAction!) {
  controlYarr(action: $action) { ${Pi} }
}`, aa = `query YarrDiscoveredServices {
  yarrDiscoveredServices {
    discoveryId
    candidates { candidateId source serviceId confidence reasons baseUrl hasCredential }
    errors { code message }
  }
}`, ua = `query YarrLogs($lines: Int) {
  yarrLogs(lines: $lines) { lines truncated }
}`, Hn = `
  installedVersion packagedVersion availableVersion updateAvailable usingOverlay rollbackAvailable rolledBack cleanupPending recoveryIdentifier message
`, ca = `query YarrUpdateStatus { yarrUpdateStatus { ${Hn} } }`, fa = `mutation PreviewYarrImport($input: PreviewYarrImportInput!) {
  previewYarrImport(input: $input) {
    previewId mappings { serviceId baseUrl hasUsername hasPassword hasApiKey urlRequired } warnings
  }
}`, da = `mutation ApplyYarrImport($input: ApplyYarrImportInput!) {
  applyYarrImport(input: $input) { ${Ps} }
}`, ha = `mutation ApplyYarrDiscovery($input: ApplyYarrDiscoveryInput!) {
  applyYarrDiscovery(input: $input) { ${Ps} }
}`, pa = `mutation UpdateYarrBinary($version: String!) {
  updateYarrBinary(version: $version) { ${Hn} }
}`, ga = `mutation ResetYarrBinary {
  resetYarrBinary { ${Hn} }
}`, ba = `mutation RollbackYarrBinary {
  rollbackYarrBinary { ${Hn} }
}`;
function Ms(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
function en(e) {
  return new DOMException(e, "AbortError");
}
async function va(e) {
  if (window.csrf_token || e.aborted) {
    if (e.aborted) throw en(Zt);
    return;
  }
  await new Promise((t, n) => {
    const s = window.setInterval(() => {
      window.csrf_token && l(t);
    }, 20), r = window.setTimeout(() => l(t), sa), i = () => l(() => n(en(Zt))), l = (a) => {
      window.clearInterval(s), window.clearTimeout(r), e.removeEventListener("abort", i), a();
    };
    e.addEventListener("abort", i, { once: !0 });
  });
}
async function ya(e) {
  const t = e.body;
  if (!t) throw new Error(Se);
  const n = e.headers.get("content-length");
  if (n && /^(?:0|[1-9]\d*)$/.test(n)) {
    const o = Number(n);
    if (Number.isSafeInteger(o) && o > Sr) {
      try {
        await t.cancel();
      } catch {
      }
      throw new Error(Se);
    }
  }
  const s = t.getReader(), r = [];
  let i = 0;
  try {
    for (; ; ) {
      const { done: o, value: u } = await s.read();
      if (o) break;
      if (i += u.byteLength, i > Sr) {
        try {
          await s.cancel();
        } catch {
        }
        throw new Error(Se);
      }
      r.push(u);
    }
  } catch (o) {
    throw o instanceof Error && o.message === Se ? o : new Error(Se);
  } finally {
    s.releaseLock();
  }
  const l = new Uint8Array(i);
  let a = 0;
  for (const o of r)
    l.set(o, a), a += o.byteLength;
  try {
    const o = JSON.parse(new TextDecoder("utf-8", { fatal: !0 }).decode(l));
    if (!Ms(o)) throw new Error(Se);
    return o;
  } catch {
    throw new Error(Se);
  }
}
async function ma(e) {
  if (e)
    try {
      await e.cancel();
    } catch {
    }
}
async function Te(e, t, n) {
  const s = new AbortController();
  let r = !1, i = !1;
  const l = window.setTimeout(() => {
    r = !0, s.abort(en(Cr));
  }, na), a = () => s.abort(en(Zt));
  n != null && n.aborted ? a() : n == null || n.addEventListener("abort", a, { once: !0 });
  try {
    if (await va(s.signal), s.signal.aborted) throw en(Zt);
    const o = await fetch("/graphql", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": window.csrf_token ?? ""
      },
      body: JSON.stringify({ query: e, variables: t }),
      signal: s.signal
    });
    if (!o.ok)
      throw i = !0, await ma(o.body), s.abort(), new Error(Se);
    const u = await ya(o);
    if (Array.isArray(u.errors) && u.errors.length > 0) throw new Error(Se);
    if (!Ms(u.data)) throw new Error(Se);
    return u.data;
  } catch (o) {
    throw r ? new Error(Cr) : i ? new Error(Se) : s.signal.aborted ? new Error(Zt) : o instanceof Error && o.message === Se ? o : new Error(Se);
  } finally {
    window.clearTimeout(l), n == null || n.removeEventListener("abort", a);
  }
}
function $e(e, t) {
  const n = e[t];
  if (!Ms(n)) throw new Error(Se);
  return n;
}
async function _a(e) {
  return $e(await Te(ra, void 0, e), "yarrRuntime");
}
async function wa(e) {
  return $e(await Te(ia, void 0, e), "yarrConfig");
}
async function Sa(e, t) {
  return $e(
    await Te(oa, { input: e }, t),
    "saveYarrConfig"
  );
}
async function Ca(e, t) {
  return $e(
    await Te(la, { action: e }, t),
    "controlYarr"
  );
}
async function Aa(e) {
  return $e(
    await Te(aa, void 0, e),
    "yarrDiscoveredServices"
  );
}
async function xa(e, t) {
  const n = Math.max(1, Math.min(500, Math.trunc(e)));
  return $e(
    await Te(ua, { lines: n }, t),
    "yarrLogs"
  );
}
async function Ea(e) {
  return $e(
    await Te(ca, void 0, e),
    "yarrUpdateStatus"
  );
}
async function Ra(e, t) {
  return $e(
    await Te(fa, { input: { text: e } }, t),
    "previewYarrImport"
  );
}
async function Ta(e, t) {
  return $e(
    await Te(da, { input: e }, t),
    "applyYarrImport"
  );
}
async function $a(e, t) {
  return $e(
    await Te(ha, { input: e }, t),
    "applyYarrDiscovery"
  );
}
async function Ia(e, t) {
  return $e(
    await Te(pa, { version: e }, t),
    "updateYarrBinary"
  );
}
async function Oa(e) {
  return $e(
    await Te(ga, void 0, e),
    "resetYarrBinary"
  );
}
async function ka(e) {
  return $e(
    await Te(ba, void 0, e),
    "rollbackYarrBinary"
  );
}
const Pa = {
  key: 0,
  class: "yarr-dialog-backdrop"
}, Ma = ["aria-busy"], Ua = { class: "yarr-dialog__header" }, La = ["disabled"], Da = { class: "yarr-dialog__body" }, Na = {
  key: 0,
  class: "yarr-dialog__footer"
}, Ya = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", Us = /* @__PURE__ */ Re({
  __name: "AccessibleDialog",
  props: {
    open: { type: Boolean },
    title: {},
    busy: { type: Boolean, default: !1 }
  },
  emits: ["close"],
  setup(e, { emit: t }) {
    const n = e, s = t, r = /* @__PURE__ */ H(), i = `yarr-dialog-${ti()}`;
    let l = null;
    function a(y) {
      if (y.hasAttribute("disabled") || y.getAttribute("aria-disabled") === "true" || y.hidden || y.closest("[hidden]")) return !1;
      const k = window.getComputedStyle(y);
      return k.display !== "none" && k.visibility !== "hidden";
    }
    function o() {
      var y;
      return [...((y = r.value) == null ? void 0 : y.querySelectorAll(Ya)) ?? []].filter(a);
    }
    function u() {
      var k;
      const y = (k = r.value) == null ? void 0 : k.querySelector("[data-autofocus]");
      return y && a(y) ? y : o()[0] ?? r.value;
    }
    function c(y) {
      var M, K;
      if (y.key === "Escape" && !n.busy) {
        y.preventDefault(), s("close");
        return;
      }
      if (y.key !== "Tab" || !n.open) return;
      const k = o();
      if (k.length === 0) {
        y.preventDefault(), (M = r.value) == null || M.focus();
        return;
      }
      const O = document.activeElement instanceof HTMLElement ? k.indexOf(document.activeElement) : -1;
      y.shiftKey && O <= 0 ? (y.preventDefault(), (K = k.at(-1)) == null || K.focus()) : !y.shiftKey && (O === -1 || O === k.length - 1) && (y.preventDefault(), k[0].focus());
    }
    function p(y) {
      var k;
      !n.open || !r.value || r.value.contains(y.target) || (k = u()) == null || k.focus();
    }
    function v() {
      document.removeEventListener("keydown", c), document.removeEventListener("focusin", p);
    }
    return Je(() => n.open, async (y) => {
      var k;
      if (v(), !y) {
        l == null || l.focus(), l = null;
        return;
      }
      l = document.activeElement instanceof HTMLElement ? document.activeElement : null, document.addEventListener("keydown", c), document.addEventListener("focusin", p), await cn(), (k = u()) == null || k.focus();
    }, { immediate: !0 }), Et(() => {
      v(), l == null || l.focus();
    }), (y, k) => e.open ? (C(), R("div", Pa, [
      d("section", {
        ref_key: "panel",
        ref: r,
        class: "yarr-dialog",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": i,
        "aria-busy": e.busy,
        tabindex: "-1"
      }, [
        d("header", Ua, [
          d("h2", { id: i }, U(e.title), 1),
          d("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            "aria-label": "Close dialog",
            onClick: k[0] || (k[0] = (O) => s("close"))
          }, "Close", 8, La)
        ]),
        d("div", Da, [
          Gs(y.$slots, "default")
        ]),
        y.$slots.footer ? (C(), R("footer", Na, [
          Gs(y.$slots, "footer")
        ])) : W("", !0)
      ], 8, Ma)
    ])) : W("", !0);
  }
}), Va = {
  key: 0,
  role: "status"
}, Ba = {
  key: 1,
  class: "yarr-error",
  role: "alert"
}, Fa = ["disabled"], Ha = {
  key: 0,
  class: "yarr-warning-list"
}, ja = {
  key: 1,
  class: "yarr-empty"
}, Ka = ["name", "value", "disabled"], qa = ["onUpdate:modelValue", "disabled"], Wa = ["disabled"], Ga = ["disabled"], Ja = /* @__PURE__ */ Re({
  __name: "DiscoveryDialog",
  props: {
    open: { type: Boolean }
  },
  emits: ["close", "applied", "busy"],
  setup(e, { emit: t }) {
    const n = e, s = t, r = /* @__PURE__ */ H(), i = /* @__PURE__ */ H([]), l = /* @__PURE__ */ H({}), a = /* @__PURE__ */ H(!1), o = /* @__PURE__ */ H("");
    let u, c = 0;
    const p = Dt(() => i.value.length > 0 && !a.value);
    function v(x) {
      return x === "sabnzbd" ? "SABnzbd" : x === "qbittorrent" ? "qBittorrent" : x.charAt(0).toUpperCase() + x.slice(1);
    }
    function y() {
      c += 1, u == null || u.abort(), r.value = void 0, i.value = [], l.value = {}, a.value = !1, o.value = "";
    }
    function k() {
      y(), s("close");
    }
    async function O() {
      u == null || u.abort(), u = new AbortController();
      const x = ++c;
      a.value = !0, o.value = "";
      try {
        const P = await Aa(u.signal);
        x === c && (r.value = P);
      } catch {
        x === c && !u.signal.aborted && (o.value = "Docker discovery failed. Confirm the read-only Docker socket is available, then retry.");
      } finally {
        x === c && (a.value = !1);
      }
    }
    async function M() {
      if (!r.value || i.value.length === 0) return;
      u == null || u.abort(), u = new AbortController(), a.value = !0, o.value = "";
      const x = r.value.candidates.filter((b) => i.value.includes(b.candidateId)), P = [...new Set(x.map((b) => b.serviceId))];
      try {
        const b = await $a({
          discoveryId: r.value.discoveryId,
          selectedCandidateIds: [...i.value],
          credentialConsent: P.map((B) => ({ serviceId: B, consent: l.value[B] === !0 }))
        }, u.signal);
        y(), s("applied", b), s("close");
      } catch {
        u.signal.aborted || (o.value = "Discovery apply result was not confirmed. Refresh current configuration before retrying."), a.value = !1;
      }
    }
    function K(x) {
      var P;
      return ((P = r.value) == null ? void 0 : P.candidates.some((b) => b.serviceId === x && i.value.includes(b.candidateId))) === !0;
    }
    return Je(() => n.open, (x) => {
      x ? (y(), O()) : y();
    }), Je(a, (x) => s("busy", x)), Et(y), (x, P) => (C(), xe(Us, {
      open: e.open,
      title: "Discover Docker services",
      busy: a.value,
      onClose: k
    }, {
      footer: At(() => [
        d("button", {
          type: "button",
          class: "yarr-button is-quiet",
          "data-autofocus": "",
          disabled: a.value,
          onClick: k
        }, "Cancel", 8, Wa),
        d("button", {
          type: "button",
          class: "yarr-button",
          disabled: !p.value,
          onClick: M
        }, U(a.value ? "Applying..." : "Apply selected"), 9, Ga)
      ]),
      default: At(() => [
        P[2] || (P[2] = d("p", null, "Yarr reads bounded container identity and endpoint metadata. Select each candidate explicitly.", -1)),
        a.value && !r.value ? (C(), R("p", Va, "Inspecting Docker services...")) : W("", !0),
        o.value ? (C(), R("div", Ba, [
          d("p", null, U(o.value), 1),
          d("button", {
            type: "button",
            class: "yarr-button",
            disabled: a.value,
            onClick: O
          }, "Retry discovery", 8, Fa)
        ])) : W("", !0),
        r.value ? (C(), R(te, { key: 2 }, [
          r.value.errors.length ? (C(), R("ul", Ha, [
            (C(!0), R(te, null, st(r.value.errors, (b) => (C(), R("li", {
              key: b.code
            }, [
              d("strong", null, U(b.code), 1),
              ae(": " + U(b.message), 1)
            ]))), 128))
          ])) : W("", !0),
          r.value.candidates.length === 0 ? (C(), R("p", ja, "No supported Docker services were found.")) : W("", !0),
          (C(!0), R(te, null, st(r.value.candidates, (b) => (C(), R("fieldset", {
            key: b.candidateId,
            class: "yarr-choice-row"
          }, [
            d("label", null, [
              Ct(d("input", {
                "onUpdate:modelValue": P[0] || (P[0] = (B) => i.value = B),
                type: "checkbox",
                name: `discovery-candidate-${b.candidateId}`,
                value: b.candidateId,
                disabled: a.value
              }, null, 8, Ka), [
                [Tn, i.value]
              ]),
              P[1] || (P[1] = ae()),
              d("strong", null, U(v(b.serviceId)), 1)
            ]),
            d("span", null, U(b.baseUrl) + " · " + U(b.confidence) + "% confidence", 1),
            d("small", null, U(b.reasons.join("; ")), 1)
          ]))), 128)),
          (C(!0), R(te, null, st([...new Set(r.value.candidates.filter((b) => b.hasCredential).map((b) => b.serviceId))], (b) => Ct((C(), R("label", {
            key: b,
            class: "yarr-consent-row"
          }, [
            Ct(d("input", {
              "onUpdate:modelValue": (B) => l.value[b] = B,
              type: "checkbox",
              disabled: a.value
            }, null, 8, qa), [
              [Tn, l.value[b]]
            ]),
            ae(" Import credentials for " + U(v(b)), 1)
          ])), [
            [Il, K(b)]
          ])), 128))
        ], 64)) : W("", !0)
      ]),
      _: 1
    }, 8, ["open", "busy"]));
  }
}), za = {
  key: 0,
  class: "yarr-dialog-flow"
}, Qa = ["disabled"], Xa = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, Za = {
  key: 1,
  class: "yarr-dialog-flow"
}, eu = {
  key: 0,
  class: "yarr-warning-list"
}, tu = ["name", "value", "disabled"], nu = { key: 0 }, su = {
  key: 1,
  class: "yarr-error"
}, ru = { key: 2 }, iu = { key: 3 }, ou = ["onUpdate:modelValue", "disabled"], lu = {
  key: 1,
  class: "yarr-error",
  role: "alert"
}, au = ["disabled"], uu = ["disabled"], cu = ["disabled"], fu = /* @__PURE__ */ Re({
  __name: "ImportDialog",
  props: {
    open: { type: Boolean }
  },
  emits: ["close", "applied", "busy"],
  setup(e, { emit: t }) {
    const n = e, s = t, r = /* @__PURE__ */ H(""), i = /* @__PURE__ */ H(), l = /* @__PURE__ */ H([]), a = /* @__PURE__ */ H({}), o = /* @__PURE__ */ H(!1), u = /* @__PURE__ */ H("");
    let c;
    const p = Dt(
      () => l.value.length > 0 && !o.value && l.value.every(
        (x) => {
          var P;
          return ((P = i.value) == null ? void 0 : P.mappings.some((b) => b.serviceId === x && !b.urlRequired)) === !0;
        }
      )
    );
    function v() {
      c == null || c.abort(), r.value = "", i.value = void 0, l.value = [], a.value = {}, o.value = !1, u.value = "";
    }
    function y() {
      v(), s("close");
    }
    function k(x) {
      return x === "sabnzbd" ? "SABnzbd" : x === "qbittorrent" ? "qBittorrent" : x.charAt(0).toUpperCase() + x.slice(1);
    }
    function O(x) {
      return x.hasUsername || x.hasPassword || x.hasApiKey;
    }
    async function M() {
      if (r.value.trim() === "") {
        u.value = "Paste .env assignments or Yarr TOML before requesting a preview.";
        return;
      }
      c == null || c.abort(), c = new AbortController(), o.value = !0, u.value = "";
      const x = r.value;
      try {
        i.value = await Ra(x, c.signal), r.value = "", l.value = [], a.value = {};
      } catch {
        c.signal.aborted || (u.value = "Import preview failed. Check the format and retry; no settings were applied.");
      } finally {
        o.value = !1;
      }
    }
    async function K() {
      if (!(!i.value || !p.value)) {
        c == null || c.abort(), c = new AbortController(), o.value = !0, u.value = "";
        try {
          const x = await Ta({
            previewId: i.value.previewId,
            selectedServiceIds: [...l.value],
            credentialConsent: l.value.map((P) => ({ serviceId: P, consent: a.value[P] === !0 }))
          }, c.signal);
          v(), s("applied", x), s("close");
        } catch {
          c.signal.aborted || (u.value = "Import result was not confirmed. Refresh current configuration before retrying."), o.value = !1;
        }
      }
    }
    return Je(() => n.open, (x) => {
      x ? v() : r.value = "";
    }), Je(o, (x) => s("busy", x)), Et(v), (x, P) => (C(), xe(Us, {
      open: e.open,
      title: "Import configuration",
      busy: o.value,
      onClose: y
    }, {
      footer: At(() => [
        d("button", {
          type: "button",
          class: "yarr-button is-quiet",
          "data-autofocus": "",
          disabled: o.value,
          onClick: y
        }, "Cancel", 8, au),
        i.value ? (C(), R("button", {
          key: 1,
          type: "button",
          class: "yarr-button",
          disabled: !p.value,
          onClick: K
        }, U(o.value ? "Applying..." : "Apply selected"), 9, cu)) : (C(), R("button", {
          key: 0,
          type: "button",
          class: "yarr-button",
          disabled: o.value || r.value.trim() === "",
          onClick: M
        }, U(o.value ? "Previewing..." : "Preview import"), 9, uu))
      ]),
      default: At(() => [
        i.value ? (C(), R("div", Za, [
          P[5] || (P[5] = d("p", null, "Select at least one service. Credential permission is separate for each selected service.", -1)),
          i.value.warnings.length ? (C(), R("ul", eu, [
            (C(!0), R(te, null, st(i.value.warnings, (b) => (C(), R("li", { key: b }, U(b), 1))), 128))
          ])) : W("", !0),
          (C(!0), R(te, null, st(i.value.mappings, (b) => (C(), R("fieldset", {
            key: b.serviceId,
            class: "yarr-choice-row"
          }, [
            d("label", null, [
              Ct(d("input", {
                "onUpdate:modelValue": P[1] || (P[1] = (B) => l.value = B),
                type: "checkbox",
                name: `import-service-${b.serviceId}`,
                value: b.serviceId,
                disabled: o.value || b.urlRequired
              }, null, 8, tu), [
                [Tn, l.value]
              ]),
              P[4] || (P[4] = ae()),
              d("strong", null, U(k(b.serviceId)), 1)
            ]),
            b.baseUrl ? (C(), R("span", nu, U(b.baseUrl), 1)) : b.urlRequired ? (C(), R("span", su, "URL required before this service can be imported.")) : (C(), R("span", ru, "Uses the existing configured URL.")),
            l.value.includes(b.serviceId) && O(b) ? (C(), R("label", iu, [
              Ct(d("input", {
                "onUpdate:modelValue": (B) => a.value[b.serviceId] = B,
                type: "checkbox",
                disabled: o.value
              }, null, 8, ou), [
                [Tn, a.value[b.serviceId]]
              ]),
              ae(" Import credentials for " + U(k(b.serviceId)), 1)
            ])) : W("", !0)
          ]))), 128)),
          u.value ? (C(), R("p", lu, U(u.value), 1)) : W("", !0)
        ])) : (C(), R("div", za, [
          P[3] || (P[3] = d("p", null, "Paste .env assignments or Yarr TOML. Yarr returns only mapped service metadata and warnings, never values.", -1)),
          d("label", null, [
            P[2] || (P[2] = ae("Paste .env or Yarr TOML", -1)),
            Ct(d("textarea", {
              "onUpdate:modelValue": P[0] || (P[0] = (b) => r.value = b),
              rows: "9",
              disabled: o.value,
              autocomplete: "off",
              spellcheck: "false"
            }, null, 8, Qa), [
              [zl, r.value]
            ])
          ]),
          u.value ? (C(), R("p", Xa, U(u.value), 1)) : W("", !0)
        ]))
      ]),
      _: 1
    }, 8, ["open", "busy"]));
  }
}), du = ["aria-busy"], hu = { class: "yarr-section-heading" }, pu = { class: "yarr-actions" }, gu = ["disabled"], bu = ["disabled"], vu = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, yu = ["disabled"], mu = {
  key: 1,
  role: "status"
}, _u = {
  key: 0,
  class: "yarr-note"
}, wu = {
  class: "yarr-log",
  "aria-label": "Yarr log output"
}, Su = /* @__PURE__ */ Re({
  __name: "LogsPanel",
  setup(e) {
    const t = /* @__PURE__ */ H(200), n = /* @__PURE__ */ H(), s = /* @__PURE__ */ H(!1), r = /* @__PURE__ */ H("");
    let i, l = 0;
    async function a() {
      i == null || i.abort(), i = new AbortController();
      const o = ++l;
      s.value = !0, r.value = "";
      try {
        const u = await xa(Math.max(1, Math.min(500, t.value)), i.signal);
        o === l && (n.value = u);
      } catch {
        o === l && !i.signal.aborted && (r.value = "Logs could not be loaded. Confirm Yarr is installed and retry.");
      } finally {
        o === l && (s.value = !1);
      }
    }
    return Yn(a), Et(() => {
      l += 1, i == null || i.abort();
    }), (o, u) => (C(), R("section", {
      class: "yarr-panel",
      "aria-labelledby": "logs-heading",
      "aria-busy": s.value
    }, [
      d("div", hu, [
        u[3] || (u[3] = d("div", null, [
          d("h2", { id: "logs-heading" }, "Logs"),
          d("p", null, "Read a bounded tail of the redacted Yarr log.")
        ], -1)),
        d("div", pu, [
          d("label", null, [
            u[2] || (u[2] = ae("Lines", -1)),
            Ct(d("select", {
              "onUpdate:modelValue": u[0] || (u[0] = (c) => t.value = c),
              disabled: s.value
            }, [...u[1] || (u[1] = [
              d("option", { value: 100 }, "100", -1),
              d("option", { value: 200 }, "200", -1),
              d("option", { value: 500 }, "500", -1)
            ])], 8, gu), [
              [
                Ql,
                t.value,
                void 0,
                { number: !0 }
              ]
            ])
          ]),
          d("button", {
            type: "button",
            class: "yarr-button",
            disabled: s.value,
            onClick: a
          }, "Refresh logs", 8, bu)
        ])
      ]),
      r.value ? (C(), R("div", vu, [
        d("p", null, U(r.value), 1),
        d("button", {
          type: "button",
          class: "yarr-button",
          disabled: s.value,
          onClick: a
        }, "Retry log request", 8, yu)
      ])) : n.value ? (C(), R(te, { key: 2 }, [
        n.value.truncated ? (C(), R("p", _u, "Older lines were omitted. Increase the bounded line count if needed.")) : W("", !0),
        d("pre", wu, [
          (C(!0), R(te, null, st(n.value.lines, (c, p) => (C(), R("span", { key: p }, U(c) + U(`
`), 1))), 128))
        ])
      ], 64)) : (C(), R("p", mu, "Loading logs..."))
    ], 8, du));
  }
}), Cu = {
  class: "yarr-panel",
  "aria-labelledby": "overview-heading"
}, Au = { class: "yarr-section-heading" }, xu = { class: "yarr-actions" }, Eu = ["disabled"], Ru = ["disabled"], Tu = ["disabled"], $u = { class: "yarr-detail-list" }, Iu = { class: "yarr-operation-row" }, Ou = { class: "yarr-actions" }, ku = ["disabled"], Pu = ["disabled"], Mu = /* @__PURE__ */ Re({
  __name: "OverviewPanel",
  props: {
    runtime: {},
    config: {},
    busy: { type: Boolean }
  },
  emits: ["control", "import", "discover"],
  setup(e, { emit: t }) {
    const n = t;
    return (s, r) => (C(), R("section", Cu, [
      d("div", Au, [
        d("div", null, [
          r[5] || (r[5] = d("h2", { id: "overview-heading" }, "Current operation", -1)),
          d("p", null, U(e.runtime.healthMessage), 1)
        ]),
        d("div", xu, [
          e.runtime.state !== "running" ? (C(), R("button", {
            key: 0,
            type: "button",
            class: "yarr-button",
            disabled: e.busy,
            onClick: r[0] || (r[0] = (i) => n("control", "START"))
          }, "Start Yarr", 8, Eu)) : (C(), R("button", {
            key: 1,
            type: "button",
            class: "yarr-button",
            disabled: e.busy,
            onClick: r[1] || (r[1] = (i) => n("control", "RESTART"))
          }, "Restart Yarr", 8, Ru)),
          e.runtime.state === "running" ? (C(), R("button", {
            key: 2,
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            onClick: r[2] || (r[2] = (i) => n("control", "STOP"))
          }, "Stop Yarr", 8, Tu)) : W("", !0)
        ])
      ]),
      d("dl", $u, [
        d("div", null, [
          r[6] || (r[6] = d("dt", null, "Process ID", -1)),
          d("dd", null, U(e.runtime.pid ?? "Not running"), 1)
        ]),
        d("div", null, [
          r[7] || (r[7] = d("dt", null, "Uptime", -1)),
          d("dd", null, U(e.runtime.uptimeSeconds === null ? "Unavailable" : `${e.runtime.uptimeSeconds} seconds`), 1)
        ]),
        d("div", null, [
          r[8] || (r[8] = d("dt", null, "Enabled services", -1)),
          d("dd", null, U(e.config.services.filter((i) => i.service !== "yarr" && i.enabled).length), 1)
        ]),
        d("div", null, [
          r[9] || (r[9] = d("dt", null, "Tailscale Serve", -1)),
          d("dd", null, U(e.config.plugin.tailscaleServe ? e.config.plugin.tailscaleHostname : "Off"), 1)
        ])
      ]),
      d("div", Iu, [
        r[10] || (r[10] = d("div", null, [
          d("h3", null, "Bring in existing services"),
          d("p", null, "Preview environment settings or inspect Docker metadata before choosing what Yarr may apply.")
        ], -1)),
        d("div", Ou, [
          d("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            onClick: r[3] || (r[3] = (i) => n("import"))
          }, "Import configuration", 8, ku),
          d("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            onClick: r[4] || (r[4] = (i) => n("discover"))
          }, "Discover Docker services", 8, Pu)
        ])
      ])
    ]));
  }
}), Uu = ["disabled"], Lu = ["disabled"], mn = /* @__PURE__ */ Re({
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
    return (s, r) => (C(), xe(Us, {
      open: e.open,
      title: e.title,
      busy: e.busy,
      onClose: r[2] || (r[2] = (i) => n("close"))
    }, {
      footer: At(() => [
        d("button", {
          type: "button",
          class: "yarr-button is-quiet",
          "data-autofocus": "",
          disabled: e.busy,
          onClick: r[0] || (r[0] = (i) => n("close"))
        }, U(e.cancelLabel), 9, Uu),
        d("button", {
          type: "button",
          class: xt(["yarr-button", { "is-danger": e.danger }]),
          disabled: e.busy,
          onClick: r[1] || (r[1] = (i) => n("confirm"))
        }, U(e.busy ? "Working..." : e.confirmLabel), 11, Lu)
      ]),
      default: At(() => [
        d("p", null, U(e.description), 1)
      ]),
      _: 1
    }, 8, ["open", "title", "busy"]));
  }
}), Du = { class: "yarr-secret-field" }, Nu = { class: "yarr-secret-field__status" }, Yu = ["name", "checked", "disabled"], Vu = ["name", "checked", "disabled"], Bu = ["name", "aria-label", "disabled", "value"], Fu = {
  key: 2,
  class: "yarr-secret-field__pending",
  role: "status"
}, Hu = ["disabled"], $n = /* @__PURE__ */ Re({
  __name: "SecretField",
  props: {
    name: {},
    label: {},
    configured: { type: Boolean },
    intent: { default: "PRESERVE" },
    disabled: { type: Boolean, default: !1 }
  },
  emits: ["update"],
  setup(e, { emit: t }) {
    const n = e, s = t, r = /* @__PURE__ */ H(n.intent), i = /* @__PURE__ */ H(""), l = /* @__PURE__ */ H(!1), a = `yarr-secret-${n.name}-${ti()}`;
    Je(() => n.intent, (p) => {
      r.value = p, p !== "SET" && (i.value = "");
    });
    function o(p) {
      if (r.value = p, p === "SET") {
        s("update", { kind: "SET", value: i.value });
        return;
      }
      i.value = "", s("update", { kind: p });
    }
    function u(p) {
      i.value = p, s("update", { kind: "SET", value: p });
    }
    function c() {
      l.value = !1, o("CLEAR");
    }
    return (p, v) => (C(), R(te, null, [
      d("fieldset", Du, [
        d("legend", null, U(e.label), 1),
        d("p", Nu, U(e.configured ? "Configured" : "Not configured"), 1),
        d("label", null, [
          d("input", {
            name: `${e.name}-intent`,
            type: "radio",
            checked: r.value === "PRESERVE",
            disabled: e.disabled,
            onChange: v[0] || (v[0] = (y) => o("PRESERVE"))
          }, null, 40, Yu),
          v[5] || (v[5] = ae(" Keep current value", -1))
        ]),
        d("label", null, [
          d("input", {
            name: `${e.name}-intent`,
            type: "radio",
            checked: r.value === "SET",
            disabled: e.disabled,
            onChange: v[1] || (v[1] = (y) => o("SET"))
          }, null, 40, Vu),
          v[6] || (v[6] = ae(" Set a new value", -1))
        ]),
        r.value === "SET" ? (C(), R("label", {
          key: 0,
          for: a
        }, "New " + U(e.label), 1)) : W("", !0),
        r.value === "SET" ? (C(), R("input", {
          key: 1,
          id: a,
          name: `${e.name}-new-value`,
          type: "password",
          "aria-label": `New ${e.label}`,
          autocomplete: "new-password",
          disabled: e.disabled,
          placeholder: "Enter a new value",
          value: i.value,
          onInput: v[2] || (v[2] = (y) => u(y.target.value))
        }, null, 40, Bu)) : W("", !0),
        r.value === "CLEAR" ? (C(), R("p", Fu, "This value will be cleared when changes are saved.")) : W("", !0),
        e.configured ? (C(), R("button", {
          key: 3,
          type: "button",
          class: "yarr-button is-danger is-quiet",
          disabled: e.disabled,
          onClick: v[3] || (v[3] = (y) => l.value = !0)
        }, "Clear " + U(e.label), 9, Hu)) : W("", !0)
      ]),
      le(mn, {
        open: l.value,
        title: `Clear ${e.label}?`,
        description: "Yarr may lose access until a replacement credential is saved.",
        "confirm-label": "Clear credential",
        "cancel-label": "Keep credential",
        busy: e.disabled,
        danger: "",
        onClose: v[4] || (v[4] = (y) => l.value = !1),
        onConfirm: c
      }, null, 8, ["open", "title", "busy"])
    ], 64));
  }
}), ju = {
  class: "yarr-panel",
  "aria-labelledby": "server-heading"
}, Ku = { class: "yarr-form-rows" }, qu = { class: "yarr-setting-row" }, Wu = ["checked", "disabled"], Gu = { class: "yarr-setting-row" }, Ju = ["checked", "disabled"], zu = { class: "yarr-setting-row" }, Qu = ["value", "disabled"], Xu = {
  key: 0,
  class: "yarr-setting-row"
}, Zu = ["value", "disabled"], ec = { class: "yarr-setting-row" }, tc = ["value", "disabled"], nc = { class: "yarr-setting-row" }, sc = ["value", "disabled"], rc = ["disabled"], ic = { class: "yarr-auth-section" }, oc = ["value", "disabled"], lc = {
  key: 2,
  class: "yarr-form-grid"
}, ac = ["value", "disabled"], uc = ["value", "disabled"], cc = { class: "yarr-form-rows" }, fc = { class: "yarr-setting-row" }, dc = ["checked", "disabled"], hc = {
  key: 0,
  class: "yarr-setting-row"
}, pc = ["value", "disabled"], gc = { class: "yarr-setting-row" }, bc = ["value", "disabled"], vc = ["value"], yc = /* @__PURE__ */ Re({
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
    function r(a) {
      s("plugin", { ...n.plugin, ...a });
    }
    function i(a) {
      s("auth", { ...n.auth, ...a });
    }
    function l(a, o) {
      i({ [a]: o });
    }
    return (a, o) => (C(), R("section", ju, [
      o[30] || (o[30] = d("div", { class: "yarr-section-heading" }, [
        d("div", null, [
          d("h2", { id: "server-heading" }, "Server & Auth"),
          d("p", null, "Keep Yarr on loopback unless authentication is fully configured.")
        ])
      ], -1)),
      d("div", Ku, [
        d("label", qu, [
          o[14] || (o[14] = d("span", null, [
            d("strong", null, "Run Yarr"),
            d("small", null, "Start Yarr with the array lifecycle.")
          ], -1)),
          d("input", {
            type: "checkbox",
            checked: e.plugin.enabled,
            disabled: e.disabled,
            onChange: o[0] || (o[0] = (u) => r({ enabled: u.target.checked }))
          }, null, 40, Wu)
        ]),
        d("label", Gu, [
          o[15] || (o[15] = d("span", null, [
            d("strong", null, "Dashboard widget"),
            d("small", null, "Show compact Yarr runtime status on the Unraid dashboard.")
          ], -1)),
          d("input", {
            type: "checkbox",
            checked: e.plugin.dashboardWidgetEnable,
            disabled: e.disabled,
            onChange: o[1] || (o[1] = (u) => r({ dashboardWidgetEnable: u.target.checked }))
          }, null, 40, Ju)
        ]),
        d("label", zu, [
          o[17] || (o[17] = d("span", null, [
            d("strong", null, "Bind mode"),
            d("small", null, "Choose which interfaces accept connections.")
          ], -1)),
          d("select", {
            value: e.plugin.bindMode,
            disabled: e.disabled,
            onChange: o[2] || (o[2] = (u) => r({ bindMode: u.target.value }))
          }, [...o[16] || (o[16] = [
            d("option", { value: "LOOPBACK" }, "Loopback only", -1),
            d("option", { value: "LAN" }, "LAN interfaces", -1),
            d("option", { value: "CUSTOM" }, "Custom address", -1)
          ])], 40, Qu)
        ]),
        e.plugin.bindMode === "CUSTOM" ? (C(), R("label", Xu, [
          o[18] || (o[18] = d("span", null, [
            d("strong", null, "Custom bind address"),
            d("small", null, "Use an IP address owned by this server.")
          ], -1)),
          d("input", {
            type: "text",
            value: e.plugin.customHost,
            disabled: e.disabled,
            onInput: o[3] || (o[3] = (u) => r({ customHost: u.target.value }))
          }, null, 40, Zu)
        ])) : W("", !0),
        d("label", ec, [
          o[19] || (o[19] = d("span", null, [
            d("strong", null, "Port"),
            d("small", null, "Yarr API and MCP listener port.")
          ], -1)),
          d("input", {
            type: "number",
            min: "1",
            max: "65535",
            value: e.plugin.port,
            disabled: e.disabled,
            onInput: o[4] || (o[4] = (u) => r({ port: Number(u.target.value) }))
          }, null, 40, tc)
        ]),
        d("label", nc, [
          o[22] || (o[22] = d("span", null, [
            d("strong", null, "Authentication mode"),
            d("small", null, "LAN, custom, and Tailscale exposure require bearer or Google OAuth.")
          ], -1)),
          d("select", {
            value: e.plugin.authMode,
            disabled: e.disabled,
            onChange: o[5] || (o[5] = (u) => r({ authMode: u.target.value }))
          }, [
            o[20] || (o[20] = d("option", { value: "BEARER" }, "Bearer token", -1)),
            o[21] || (o[21] = d("option", { value: "GOOGLE_OAUTH" }, "Google OAuth", -1)),
            d("option", {
              value: "TRUSTED_GATEWAY",
              disabled: e.plugin.bindMode !== "LOOPBACK" || e.plugin.tailscaleServe
            }, "Trusted gateway (same-host loopback only)", 8, rc)
          ], 40, sc)
        ])
      ]),
      d("div", ic, [
        e.plugin.authMode === "BEARER" ? (C(), xe($n, {
          key: 0,
          name: "bearer-token",
          label: "Bearer token",
          configured: e.bearerConfigured,
          intent: e.auth.bearerToken.kind,
          disabled: e.disabled,
          onUpdate: o[6] || (o[6] = (u) => l("bearerToken", u))
        }, null, 8, ["configured", "intent", "disabled"])) : e.plugin.authMode === "GOOGLE_OAUTH" ? (C(), R(te, { key: 1 }, [
          d("label", null, [
            o[23] || (o[23] = ae("Google client ID", -1)),
            d("input", {
              type: "text",
              value: e.auth.googleClientId,
              disabled: e.disabled,
              autocomplete: "off",
              onInput: o[7] || (o[7] = (u) => i({ googleClientId: u.target.value }))
            }, null, 40, oc)
          ]),
          le($n, {
            name: "google-client-secret",
            label: "Google client secret",
            configured: e.googleSecretConfigured,
            intent: e.auth.googleClientSecret.kind,
            disabled: e.disabled,
            onUpdate: o[8] || (o[8] = (u) => l("googleClientSecret", u))
          }, null, 8, ["configured", "intent", "disabled"])
        ], 64)) : (C(), R("div", lc, [
          o[26] || (o[26] = d("p", null, "Trusted gateway accepts provenance only from a same-host proxy while Yarr is bound to loopback. Direct-client Host and Origin headers are not authentication.", -1)),
          d("label", null, [
            o[24] || (o[24] = ae("Trusted gateway hosts", -1)),
            d("textarea", {
              value: e.auth.trustedGatewayHosts,
              disabled: e.disabled,
              rows: "3",
              onInput: o[9] || (o[9] = (u) => i({ trustedGatewayHosts: u.target.value }))
            }, null, 40, ac)
          ]),
          d("label", null, [
            o[25] || (o[25] = ae("Trusted gateway origins", -1)),
            d("textarea", {
              value: e.auth.trustedGatewayOrigins,
              disabled: e.disabled,
              rows: "3",
              onInput: o[10] || (o[10] = (u) => i({ trustedGatewayOrigins: u.target.value }))
            }, null, 40, uc)
          ])
        ]))
      ]),
      d("div", cc, [
        d("label", fc, [
          o[27] || (o[27] = d("span", null, [
            d("strong", null, "Tailscale Serve"),
            d("small", null, "Publishes the endpoint and therefore requires bearer or Google OAuth.")
          ], -1)),
          d("input", {
            type: "checkbox",
            checked: e.plugin.tailscaleServe,
            disabled: e.disabled,
            onChange: o[11] || (o[11] = (u) => r({ tailscaleServe: u.target.checked }))
          }, null, 40, dc)
        ]),
        e.plugin.tailscaleServe ? (C(), R("label", hc, [
          o[28] || (o[28] = d("span", null, [
            d("strong", null, "Tailscale hostname"),
            d("small", null, "DNS-label service name.")
          ], -1)),
          d("input", {
            type: "text",
            value: e.plugin.tailscaleHostname,
            disabled: e.disabled,
            onInput: o[12] || (o[12] = (u) => r({ tailscaleHostname: u.target.value }))
          }, null, 40, pc)
        ])) : W("", !0),
        d("label", gc, [
          o[29] || (o[29] = d("span", null, [
            d("strong", null, "Log level"),
            d("small", null, "Increase verbosity only while diagnosing an issue.")
          ], -1)),
          d("select", {
            value: e.plugin.logLevel,
            disabled: e.disabled,
            onChange: o[13] || (o[13] = (u) => r({ logLevel: u.target.value }))
          }, [
            (C(), R(te, null, st(["TRACE", "DEBUG", "INFO", "WARN", "ERROR"], (u) => d("option", {
              key: u,
              value: u
            }, U(u), 9, vc)), 64))
          ], 40, bc)
        ])
      ])
    ]));
  }
}), mc = {
  class: "yarr-panel",
  "aria-labelledby": "services-heading"
}, _c = {
  key: 0,
  class: "yarr-empty"
}, wc = ["aria-labelledby"], Sc = { class: "yarr-service-row__identity" }, Cc = ["id"], Ac = { class: "yarr-switch" }, xc = ["checked", "disabled", "onChange"], Ec = { class: "yarr-form-grid" }, Rc = ["value", "disabled", "onInput"], Tc = { key: 0 }, $c = ["value", "disabled", "onInput"], Ic = { class: "yarr-secret-grid" }, Oc = /* @__PURE__ */ Re({
  __name: "ServicesPanel",
  props: {
    services: {},
    disabled: { type: Boolean }
  },
  emits: ["update"],
  setup(e, { emit: t }) {
    const n = e, s = t, r = {
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
    function i(o) {
      return r[o] ?? o;
    }
    function l(o, u) {
      const c = n.services.map((p, v) => v === o ? { ...p, ...u } : p);
      s("update", c);
    }
    function a(o, u, c) {
      l(o, { [u]: c });
    }
    return (o, u) => (C(), R("section", mc, [
      u[1] || (u[1] = d("div", { class: "yarr-section-heading" }, [
        d("div", null, [
          d("h2", { id: "services-heading" }, "Services"),
          d("p", null, "Enable only the integrations Yarr should contact.")
        ])
      ], -1)),
      e.services.length === 0 ? (C(), R("p", _c, "No service definitions are available.")) : W("", !0),
      (C(!0), R(te, null, st(e.services, (c, p) => (C(), R("section", {
        key: c.service,
        class: "yarr-service-row",
        "aria-labelledby": `service-${c.service}`
      }, [
        d("div", Sc, [
          d("h3", {
            id: `service-${c.service}`
          }, U(i(c.service)), 9, Cc),
          d("label", Ac, [
            d("input", {
              type: "checkbox",
              checked: c.enabled,
              disabled: e.disabled,
              onChange: (v) => l(p, { enabled: v.target.checked })
            }, null, 40, xc),
            u[0] || (u[0] = ae(" Enabled", -1))
          ])
        ]),
        d("div", Ec, [
          d("label", null, [
            ae(U(i(c.service)) + " base URL", 1),
            d("input", {
              type: "url",
              value: c.baseUrl,
              disabled: e.disabled,
              onInput: (v) => l(p, { baseUrl: v.target.value })
            }, null, 40, Rc)
          ]),
          c.username !== null ? (C(), R("label", Tc, [
            ae(U(i(c.service)) + " username", 1),
            d("input", {
              type: "text",
              value: c.username,
              disabled: e.disabled,
              autocomplete: "off",
              onInput: (v) => l(p, { username: v.target.value })
            }, null, 40, $c)
          ])) : W("", !0)
        ]),
        d("div", Ic, [
          le($n, {
            name: `${c.service}-password`,
            label: `${i(c.service)} password`,
            configured: c.hasPassword,
            intent: c.password.kind,
            disabled: e.disabled,
            onUpdate: (v) => a(p, "password", v)
          }, null, 8, ["name", "label", "configured", "intent", "disabled", "onUpdate"]),
          le($n, {
            name: `${c.service}-api-key`,
            label: `${i(c.service)} API key`,
            configured: c.hasApiKey,
            intent: c.apiKey.kind,
            disabled: e.disabled,
            onUpdate: (v) => a(p, "apiKey", v)
          }, null, 8, ["name", "label", "configured", "intent", "disabled", "onUpdate"])
        ])
      ], 8, wc))), 128))
    ]));
  }
}), kc = ["aria-label"], Pc = {
  class: "yarr-status-badge__symbol",
  "aria-hidden": "true"
}, Mc = /* @__PURE__ */ Re({
  __name: "StatusBadge",
  props: {
    state: {},
    label: { default: void 0 }
  },
  setup(e) {
    const t = e, n = Dt(() => t.label ?? {
      success: "Available",
      warning: "Needs attention",
      danger: "Unavailable",
      neutral: "Unknown"
    }[t.state]);
    return (s, r) => (C(), R("span", {
      class: xt(["yarr-status-badge", `is-${e.state}`]),
      "aria-label": `Status: ${n.value}`
    }, [
      d("span", Pc, U(e.state === "success" ? "OK" : e.state === "danger" ? "!" : "-"), 1),
      d("span", null, U(n.value), 1)
    ], 10, kc));
  }
}), Uc = ["aria-busy"], Lc = { class: "yarr-section-heading" }, Dc = ["disabled"], Nc = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, Yc = ["disabled"], Vc = {
  key: 1,
  role: "status"
}, Bc = { class: "yarr-detail-list" }, Fc = { key: 0 }, Hc = { key: 1 }, jc = { key: 2 }, Kc = { key: 3 }, qc = { class: "yarr-actions" }, Wc = ["disabled"], Gc = ["disabled"], Jc = ["disabled"], zc = /* @__PURE__ */ Re({
  __name: "UpdatesPanel",
  emits: ["busy"],
  setup(e, { emit: t }) {
    const n = t, s = /* @__PURE__ */ H(), r = /* @__PURE__ */ H(""), i = /* @__PURE__ */ H(!1), l = /* @__PURE__ */ H(!1), a = /* @__PURE__ */ H(!1), o = /* @__PURE__ */ H(!1);
    let u, c = 0;
    async function p() {
      u == null || u.abort(), u = new AbortController();
      const O = ++c;
      i.value = !0, r.value = "";
      try {
        const M = await Ea(u.signal);
        O === c && (s.value = M);
      } catch {
        O === c && !u.signal.aborted && (r.value = "Update status could not be loaded. Check Yarr connectivity, then retry.");
      } finally {
        O === c && (i.value = !1);
      }
    }
    async function v() {
      if (s.value) {
        u == null || u.abort(), u = new AbortController(), i.value = !0, r.value = "";
        try {
          s.value = await Ia(s.value.availableVersion, u.signal), l.value = !1;
        } catch {
          u.signal.aborted || (r.value = "Update result was not confirmed. Refresh update status before retrying.");
        } finally {
          i.value = !1;
        }
      }
    }
    async function y() {
      u == null || u.abort(), u = new AbortController(), i.value = !0, r.value = "";
      try {
        s.value = await Oa(u.signal), a.value = !1;
      } catch {
        u.signal.aborted || (r.value = "Reset result was not confirmed. Refresh update status before retrying.");
      } finally {
        i.value = !1;
      }
    }
    async function k() {
      u == null || u.abort(), u = new AbortController(), i.value = !0, r.value = "";
      try {
        s.value = await ka(u.signal), o.value = !1;
      } catch {
        u.signal.aborted || (r.value = "Rollback result was not confirmed. Refresh update status before retrying.");
      } finally {
        i.value = !1;
      }
    }
    return Yn(p), Je(i, (O) => n("busy", O)), Et(() => {
      c += 1, u == null || u.abort(), n("busy", !1);
    }), (O, M) => {
      var K;
      return C(), R("section", {
        class: "yarr-panel",
        "aria-labelledby": "updates-heading",
        "aria-busy": i.value
      }, [
        d("div", Lc, [
          M[6] || (M[6] = d("div", null, [
            d("h2", { id: "updates-heading" }, "Updates"),
            d("p", null, "Install a verified release or return to the package version.")
          ], -1)),
          d("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: i.value,
            onClick: p
          }, "Check again", 8, Dc)
        ]),
        r.value ? (C(), R("div", Nc, [
          d("p", null, U(r.value), 1),
          s.value ? W("", !0) : (C(), R("button", {
            key: 0,
            type: "button",
            class: "yarr-button",
            disabled: i.value,
            onClick: p
          }, "Retry update check", 8, Yc))
        ])) : W("", !0),
        !s.value && !r.value ? (C(), R("p", Vc, "Checking update status...")) : W("", !0),
        s.value ? (C(), R(te, { key: 2 }, [
          d("dl", Bc, [
            d("div", null, [
              M[7] || (M[7] = d("dt", null, "Installed", -1)),
              d("dd", null, U(s.value.installedVersion), 1)
            ]),
            d("div", null, [
              M[8] || (M[8] = d("dt", null, "Packaged", -1)),
              d("dd", null, U(s.value.packagedVersion), 1)
            ]),
            d("div", null, [
              M[9] || (M[9] = d("dt", null, "Available", -1)),
              d("dd", null, U(s.value.availableVersion), 1)
            ]),
            d("div", null, [
              M[10] || (M[10] = d("dt", null, "Source", -1)),
              d("dd", null, U(s.value.usingOverlay ? "Update overlay" : "Plugin package"), 1)
            ])
          ]),
          d("p", {
            class: xt(["yarr-result", { "is-warning": s.value.rolledBack || s.value.cleanupPending || s.value.message.includes("restoration incomplete") || s.value.message.startsWith("Rollback failed") }]),
            role: "status"
          }, [
            ae(U(s.value.message) + " ", 1),
            s.value.rolledBack ? (C(), R("strong", Fc, U(s.value.message.startsWith("Rollback failed") ? " The current version was restored." : " The previous version was restored."), 1)) : W("", !0),
            s.value.message.includes("restoration incomplete") ? (C(), R("strong", Hc, " The prior binary and runtime state were not confirmed restored. Inspect the retained recovery snapshots before retrying.")) : W("", !0),
            s.value.cleanupPending && s.value.message.includes("before") ? (C(), R("strong", jc, " No live binary mutation was committed.")) : W("", !0),
            s.value.cleanupPending ? (C(), R("strong", Kc, [
              M[11] || (M[11] = ae(" Retained recovery snapshots ", -1)),
              d("code", null, U(s.value.recoveryIdentifier), 1),
              M[12] || (M[12] = ae(" under /mnt/user/appdata/yarr/bin require operator cleanup.", -1))
            ])) : W("", !0)
          ], 2),
          d("div", qc, [
            s.value.updateAvailable ? (C(), R("button", {
              key: 0,
              type: "button",
              class: "yarr-button",
              disabled: i.value,
              onClick: M[0] || (M[0] = (x) => l.value = !0)
            }, "Install " + U(s.value.availableVersion), 9, Wc)) : W("", !0),
            s.value.rollbackAvailable ? (C(), R("button", {
              key: 1,
              type: "button",
              class: "yarr-button is-quiet",
              disabled: i.value,
              onClick: M[1] || (M[1] = (x) => o.value = !0)
            }, "Roll back to previous version", 8, Gc)) : W("", !0),
            d("button", {
              type: "button",
              class: "yarr-button is-danger is-quiet",
              disabled: i.value,
              onClick: M[2] || (M[2] = (x) => a.value = !0)
            }, "Reset to packaged version", 8, Jc)
          ])
        ], 64)) : W("", !0),
        le(mn, {
          open: l.value,
          title: `Install Yarr ${(K = s.value) == null ? void 0 : K.availableVersion}?`,
          description: "Yarr will restart. If readiness fails, the updater will attempt to restore the previous binary.",
          "confirm-label": "Install update",
          busy: i.value,
          onClose: M[3] || (M[3] = (x) => l.value = !1),
          onConfirm: v
        }, null, 8, ["open", "title", "busy"]),
        le(mn, {
          open: o.value,
          title: "Roll back to the previous Yarr binary?",
          description: "Yarr will preserve both binaries in durable snapshots, atomically activate yarr.previous, restart if it is running, and restore from the snapshots if readiness fails.",
          "confirm-label": "Roll back Yarr",
          busy: i.value,
          onClose: M[4] || (M[4] = (x) => o.value = !1),
          onConfirm: k
        }, null, 8, ["open", "busy"]),
        le(mn, {
          open: a.value,
          title: "Reset to packaged Yarr?",
          description: "This removes the update overlay and restarts the binary shipped by the plugin package.",
          "confirm-label": "Reset Yarr",
          busy: i.value,
          danger: "",
          onClose: M[5] || (M[5] = (x) => a.value = !1),
          onConfirm: y
        }, null, 8, ["open", "busy"])
      ], 8, Uc);
    };
  }
}), Qc = ["aria-busy"], Xc = { class: "yarr-identity" }, Zc = { class: "yarr-workspace" }, ef = {
  key: 0,
  class: "yarr-error yarr-load-error",
  role: "alert"
}, tf = ["disabled"], nf = {
  key: 1,
  class: "yarr-shell__message",
  role: "status"
}, sf = { class: "yarr-tabs-wrap" }, rf = {
  class: "yarr-tabs",
  role: "tablist",
  "aria-label": "Yarr settings sections"
}, of = ["id", "aria-selected", "aria-controls", "tabindex", "disabled", "onClick", "onKeydown"], lf = ["id", "aria-labelledby"], af = { class: "yarr-save-bar" }, uf = { "aria-live": "polite" }, cf = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, ff = {
  key: 1,
  class: "yarr-result",
  role: "status"
}, df = { key: 2 }, hf = ["disabled"], pf = /* @__PURE__ */ Re({
  __name: "YarrSettings.ce",
  setup(e) {
    const t = ["Overview", "Services", "Server & Auth", "Updates", "Logs"], n = /* @__PURE__ */ H(), s = /* @__PURE__ */ H(), r = /* @__PURE__ */ H(), i = /* @__PURE__ */ H(), l = /* @__PURE__ */ H([]), a = /* @__PURE__ */ H(!1), o = /* @__PURE__ */ H(!1), u = /* @__PURE__ */ H("Overview"), c = /* @__PURE__ */ H(!0), p = /* @__PURE__ */ H(!1), v = /* @__PURE__ */ H(!1), y = /* @__PURE__ */ H(""), k = /* @__PURE__ */ H(""), O = /* @__PURE__ */ H(""), M = /* @__PURE__ */ H(!1), K = /* @__PURE__ */ H(!1), x = /* @__PURE__ */ H(!1), P = /* @__PURE__ */ H([]);
    let b, B, he = 0;
    const Ie = Dt(() => n.value && s.value && r.value && i.value), _e = Dt(() => p.value || v.value);
    function gt(L, $) {
      var D;
      return ((D = L == null ? void 0 : L.extra.find((ce) => ce.key === $)) == null ? void 0 : D.value) ?? "";
    }
    function Me(L) {
      n.value = L, r.value = { ...L.plugin };
      const $ = L.services.find((D) => D.service === "yarr");
      a.value = ($ == null ? void 0 : $.hasApiKey) ?? !1, o.value = ($ == null ? void 0 : $.hasPassword) ?? !1, i.value = {
        bearerToken: { kind: "PRESERVE" },
        googleClientId: ($ == null ? void 0 : $.username) ?? "",
        googleClientSecret: { kind: "PRESERVE" },
        trustedGatewayHosts: gt($, "YARR_MCP_ALLOWED_HOSTS"),
        trustedGatewayOrigins: gt($, "YARR_MCP_ALLOWED_ORIGINS")
      }, l.value = L.services.filter((D) => D.service !== "yarr").map((D) => ({
        ...D,
        extra: D.extra.map((ce) => ({ ...ce })),
        password: { kind: "PRESERVE" },
        apiKey: { kind: "PRESERVE" }
      }));
    }
    async function ft() {
      b == null || b.abort(), b = new AbortController();
      const L = ++he;
      c.value = !0, x.value = !0, y.value = "", k.value = "";
      try {
        const [$, D] = await Promise.all([
          wa(b.signal),
          _a(b.signal)
        ]);
        if (L !== he) return;
        Me($), s.value = D;
      } catch {
        L === he && !b.signal.aborted && (y.value = "Yarr settings could not be loaded. Confirm the Unraid API is running, then retry.");
      } finally {
        L === he && (c.value = !1, x.value = !1);
      }
    }
    function bt(L, $) {
      return $.kind === "CLEAR" ? !1 : $.kind === "SET" ? $.value.trim().length > 0 : L;
    }
    function Rt() {
      return !r.value || !i.value ? "" : r.value.authMode === "TRUSTED_GATEWAY" ? r.value.bindMode !== "LOOPBACK" || r.value.tailscaleServe ? "Trusted gateway is limited to a same-host proxy with loopback binding and Tailscale Serve disabled. Use bearer or Google OAuth for network exposure." : i.value.trustedGatewayHosts.trim() === "" && i.value.trustedGatewayOrigins.trim() === "" ? "Trusted gateway authentication requires at least one allowed host or origin." : "" : r.value.bindMode === "LOOPBACK" && !r.value.tailscaleServe ? "" : r.value.authMode === "BEARER" && !bt(a.value, i.value.bearerToken) ? "Bearer authentication requires a configured token before Yarr can bind beyond loopback." : r.value.authMode === "GOOGLE_OAUTH" && (i.value.googleClientId.trim() === "" || !bt(o.value, i.value.googleClientSecret)) ? "Google OAuth requires a client ID and configured client secret before Yarr can bind beyond loopback." : "";
    }
    function dt(L) {
      return L.kind === "SET" && L.value.trim() === "" ? { kind: "PRESERVE" } : L;
    }
    function dn() {
      const L = r.value, $ = i.value;
      return {
        ...L,
        bearerToken: dt($.bearerToken),
        googleClientId: $.googleClientId,
        googleClientSecret: dt($.googleClientSecret),
        trustedGatewayHosts: $.trustedGatewayHosts,
        trustedGatewayOrigins: $.trustedGatewayOrigins,
        services: l.value.map((D) => {
          const ce = {
            service: D.service,
            enabled: D.enabled,
            password: dt(D.password),
            apiKey: dt(D.apiKey)
          };
          return D.baseUrl.trim() !== "" && (ce.baseUrl = D.baseUrl), D.username !== null && (ce.username = D.username), ce;
        })
      };
    }
    function ue(L) {
      return L.rolledBack ? `Changes were not kept. Previous configuration restored.${L.error ? ` ${L.error}` : ""}` : L.error ? `Save outcome is indeterminate. ${L.error} Check runtime status and logs before retrying.` : L.changed ? L.restarted ? "Changes saved and Yarr restarted." : "Changes saved. Yarr did not require a restart." : "No configuration changes were needed.";
    }
    async function se() {
      const L = Rt();
      if (L) {
        k.value = L;
        return;
      }
      B == null || B.abort(), B = new AbortController(), p.value = !0, k.value = "", O.value = "";
      try {
        const $ = await Sa(dn(), B.signal);
        Me($.config), O.value = ue($);
      } catch {
        B.signal.aborted || (k.value = "Save result was not confirmed. Refresh current state before retrying.");
      } finally {
        p.value = !1;
      }
    }
    async function z(L) {
      B == null || B.abort(), B = new AbortController(), p.value = !0, k.value = "";
      try {
        s.value = await Ca(L, B.signal), O.value = L === "STOP" ? "Yarr stopped." : L === "START" ? "Yarr started." : "Yarr restarted.";
      } catch {
        B.signal.aborted || (k.value = "Control result was not confirmed. Refresh current state before retrying.");
      } finally {
        p.value = !1;
      }
    }
    function Ye(L) {
      Me(L.config), O.value = ue(L);
    }
    function vt(L, $ = !1) {
      u.value = L, $ && cn(() => {
        var D;
        return (D = P.value[t.indexOf(L)]) == null ? void 0 : D.focus();
      });
    }
    function ze(L, $) {
      let D = $;
      if (L.key === "ArrowRight") D = ($ + 1) % t.length;
      else if (L.key === "ArrowLeft") D = ($ - 1 + t.length) % t.length;
      else if (L.key === "Home") D = 0;
      else if (L.key === "End") D = t.length - 1;
      else return;
      L.preventDefault(), vt(t[D], !0);
    }
    function Oe(L, $) {
      L && (P.value[$] = L);
    }
    return Yn(ft), Et(() => {
      he += 1, b == null || b.abort(), B == null || B.abort();
    }), (L, $) => (C(), R("section", {
      class: "yarr-shell yarr-settings",
      "aria-labelledby": "yarr-settings-title",
      "aria-busy": c.value || p.value
    }, [
      d("aside", Xc, [
        $[10] || ($[10] = d("p", { class: "yarr-shell__eyebrow" }, "Unraid service", -1)),
        $[11] || ($[11] = d("h1", { id: "yarr-settings-title" }, "Yarr", -1)),
        s.value ? (C(), xe(Mc, {
          key: 0,
          state: s.value.ready ? "success" : s.value.state === "running" ? "warning" : "neutral",
          label: s.value.ready ? "Ready" : s.value.state
        }, null, 8, ["state", "label"])) : W("", !0),
        $[12] || ($[12] = d("p", null, "Media service operations", -1))
      ]),
      d("main", Zc, [
        y.value ? (C(), R("div", ef, [
          d("p", null, U(y.value), 1),
          d("button", {
            type: "button",
            class: "yarr-button",
            disabled: c.value,
            onClick: ft
          }, "Retry", 8, tf)
        ])) : Ie.value ? (C(), R(te, { key: 2 }, [
          d("ol", {
            class: xt(["yarr-signal-rail", { "is-refreshing": x.value }]),
            "aria-label": "Yarr lifecycle signals"
          }, [
            d("li", null, [
              $[13] || ($[13] = d("span", null, "Process", -1)),
              d("strong", null, U(s.value.state), 1)
            ]),
            d("li", null, [
              $[14] || ($[14] = d("span", null, "Ready", -1)),
              d("strong", null, U(s.value.ready ? "Yes" : "No"), 1)
            ]),
            d("li", null, [
              $[15] || ($[15] = d("span", null, "Endpoint", -1)),
              d("strong", null, U(s.value.bindAddress) + ":" + U(s.value.port), 1)
            ]),
            d("li", null, [
              $[16] || ($[16] = d("span", null, "Version", -1)),
              d("strong", null, U(s.value.version ?? "Unavailable"), 1)
            ])
          ], 2),
          d("div", sf, [
            d("div", rf, [
              (C(), R(te, null, st(t, (D, ce) => d("button", {
                id: `yarr-tab-${ce}`,
                key: D,
                ref_for: !0,
                ref: (Qe) => Oe(Qe, ce),
                type: "button",
                role: "tab",
                "aria-selected": u.value === D,
                "aria-controls": `yarr-panel-${ce}`,
                tabindex: u.value === D ? 0 : -1,
                disabled: _e.value,
                onClick: (Qe) => vt(D),
                onKeydown: (Qe) => ze(Qe, ce)
              }, U(D), 41, of)), 64))
            ])
          ]),
          d("div", {
            id: `yarr-panel-${t.indexOf(u.value)}`,
            role: "tabpanel",
            "aria-labelledby": `yarr-tab-${t.indexOf(u.value)}`,
            tabindex: "0"
          }, [
            u.value === "Overview" ? (C(), xe(Mu, {
              key: 0,
              runtime: s.value,
              config: n.value,
              busy: _e.value,
              onControl: z,
              onImport: $[0] || ($[0] = (D) => M.value = !0),
              onDiscover: $[1] || ($[1] = (D) => K.value = !0)
            }, null, 8, ["runtime", "config", "busy"])) : u.value === "Services" ? (C(), xe(Oc, {
              key: 1,
              services: l.value,
              disabled: _e.value,
              onUpdate: $[2] || ($[2] = (D) => l.value = D)
            }, null, 8, ["services", "disabled"])) : u.value === "Server & Auth" ? (C(), xe(yc, {
              key: 2,
              plugin: r.value,
              auth: i.value,
              "bearer-configured": a.value,
              "google-secret-configured": o.value,
              disabled: _e.value,
              onPlugin: $[3] || ($[3] = (D) => r.value = D),
              onAuth: $[4] || ($[4] = (D) => i.value = D)
            }, null, 8, ["plugin", "auth", "bearer-configured", "google-secret-configured", "disabled"])) : u.value === "Updates" ? (C(), xe(zc, {
              key: 3,
              onBusy: $[5] || ($[5] = (D) => v.value = D)
            })) : (C(), xe(Su, { key: 4 }))
          ], 8, lf),
          d("div", af, [
            d("div", uf, [
              k.value ? (C(), R("p", cf, U(k.value), 1)) : O.value ? (C(), R("p", ff, U(O.value), 1)) : (C(), R("p", df, "Changes are validated again by the Yarr service before they are applied."))
            ]),
            d("button", {
              type: "button",
              class: "yarr-button",
              disabled: _e.value,
              onClick: se
            }, U(p.value ? "Saving..." : "Save changes"), 9, hf)
          ])
        ], 64)) : (C(), R("p", nf, "Loading Yarr operations..."))
      ]),
      le(fu, {
        open: M.value,
        onClose: $[6] || ($[6] = (D) => M.value = !1),
        onApplied: Ye,
        onBusy: $[7] || ($[7] = (D) => v.value = D)
      }, null, 8, ["open"]),
      le(Ja, {
        open: K.value,
        onClose: $[8] || ($[8] = (D) => K.value = !1),
        onApplied: Ye,
        onBusy: $[9] || ($[9] = (D) => v.value = D)
      }, null, 8, ["open"])
    ], 8, Qc));
  }
}), gf = /* @__PURE__ */ Wl(pf, { shadowRoot: !1 });
customElements.get("yarr-settings-app") || customElements.define("yarr-settings-app", gf);
